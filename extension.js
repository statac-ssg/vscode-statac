"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const vscode = require("vscode");
const { LanguageClient } = require("vscode-languageclient/node");

// Where each way of installing Statac puts it, for an editor started
// without the shell's path: Homebrew, the install script, Cargo, Scoop and
// winget.
const INSTALLED = [
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "/home/linuxbrew/.linuxbrew/bin",
  "~/.local/bin",
  "~/.cargo/bin",
  "~/scoop/shims",
  path.join(process.env.LOCALAPPDATA || "", "Microsoft", "WinGet", "Links"),
];

// A site's settings, front matter, writing and data, its templates, and
// `published.txt`. The server leaves alone any file outside a site.
const LANGUAGES = ["markdown", "yaml", "json", "html", "xml", "plaintext"];

const NOT_FOUND =
  "Statac isn't installed, or VS Code can't find it. Install it as " +
  "statac.dev/install says, or give its path as Statac: Path in the settings.";

const QUIETEN =
  "In this site, VS Code's own link suggestions repeat Statac's, and offer " +
  "files, which aren't how links are written here. Turn VS Code's off for " +
  "this site? This is kept in its .vscode/settings.json.";
const TURN_OFF = "Turn Off";
const LEAVE_ON = "Leave On";

let client;

function expanded(file) {
  return file === "~" || file.startsWith("~/") ? path.join(os.homedir(), file.slice(1)) : file;
}

function runnable(file) {
  try {
    if (!fs.statSync(file).isFile()) {
      return false;
    }
    fs.accessSync(file, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** Where `program` is: whole as given, on the path, or where an installer
 * puts it. */
function found(program) {
  program = expanded(program);
  if (path.isAbsolute(program)) {
    return runnable(program) ? program : undefined;
  }
  const names =
    process.platform === "win32"
      ? (process.env.PATHEXT || ".EXE").split(";").map((ext) => program + ext.toLowerCase())
      : [program];
  const folders = (process.env.PATH || "").split(path.delimiter).concat(INSTALLED);
  for (const folder of folders.map(expanded)) {
    // A folder not given whole would be read from wherever VS Code was
    // started.
    if (!path.isAbsolute(folder)) {
      continue;
    }
    for (const name of names) {
      const at = path.join(folder, name);
      if (runnable(at)) {
        return at;
      }
    }
  }
  return undefined;
}

async function start() {
  await stop();
  const given = vscode.workspace.getConfiguration("statac").get("path");
  const command = found(given || "statac");
  if (!command) {
    vscode.window.showErrorMessage(NOT_FOUND);
    return;
  }
  client = new LanguageClient(
    "statac",
    "Statac",
    { command, args: ["lsp"] },
    {
      documentSelector: LANGUAGES.map((language) => ({ scheme: "file", language })),
      middleware: {
        // VS Code outlines Markdown itself, and would list each heading
        // twice.
        provideDocumentSymbols: (document, token, next) =>
          document.languageId === "markdown" ? undefined : next(document, token),
      },
    },
  );
  await client.start();
}

async function stop() {
  const running = client;
  client = undefined;
  if (running) {
    await running.stop();
  }
}

/** Asks, once for each folder holding a site, whether to turn off VS
 * Code's own link suggestions in Markdown there. */
async function offerToQuieten(context) {
  const asked = new Set(context.globalState.get("asked", []));
  const folders = new Map();
  for (const folder of vscode.workspace.workspaceFolders || []) {
    // The same sites the extension starts for: statac.yaml, or a content
    // folder.
    const site = new vscode.RelativePattern(folder, "{**/statac.yaml,**/content/**}");
    if ((await vscode.workspace.findFiles(site, "**/node_modules/**", 1)).length) {
      folders.set(folder.uri.toString(), folder);
    }
  }
  for (const [key, folder] of folders) {
    const markdown = vscode.workspace.getConfiguration("markdown", folder.uri);
    if (asked.has(key) || !markdown.get("suggest.paths.enabled", true)) {
      continue;
    }
    const answer = await vscode.window.showInformationMessage(QUIETEN, TURN_OFF, LEAVE_ON);
    // Closed unanswered, it is asked again next time.
    if (!answer) {
      continue;
    }
    asked.add(key);
    await context.globalState.update("asked", [...asked]);
    if (answer === TURN_OFF) {
      await markdown.update("suggest.paths.enabled", false, vscode.ConfigurationTarget.WorkspaceFolder);
    }
  }
}

async function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand("statac.restart", start),
    vscode.workspace.onDidChangeConfiguration((change) => {
      if (change.affectsConfiguration("statac.path")) {
        start();
      }
    }),
  );
  await start();
  if (client) {
    offerToQuieten(context);
  }
}

function deactivate() {
  return stop();
}

module.exports = { activate, deactivate };
