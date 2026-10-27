# Statac for VS Code

[Statac](https://statac.dev)'s language server in VS Code. In a Statac
site, VS Code shows each problem `statac check` finds as you type, and
offers completion, hover, go to definition, find references and fixes.
When you rename a page's file in the Explorer, the links to it are
updated.

It needs Statac 0.7.0 or later. With an earlier Statac, the language
server doesn't start.

## Installing

1. Install [Statac](https://statac.dev/install/).
2. In VS Code's Extensions view, search for Statac, and install it.
3. Open a folder that holds a Statac site: a `statac.yaml` file, or a
   `content` folder. The extension runs only in a folder you trust.

## Link suggestions

VS Code's own Markdown support suggests files when you write a link. In
a Statac site a link names a URL, which Statac suggests. The first time
you open each folder holding a site, the extension asks whether to turn
VS Code's link suggestions off there. If you agree, VS Code saves the
setting in that folder's `.vscode/settings.json`.

## Settings

VS Code looks for `statac` on the path, then where Homebrew, the install
script, Cargo, Scoop and winget put it. To use another, give its whole
path in Statac: Path. After upgrading Statac, run Statac: Restart the
Language Server.

## More

- [Editors](https://statac.dev/editors/), in Statac's documentation.
- [Issues](https://git.statac.dev/statac/vscode-statac/issues).

## Licence

MIT or Apache-2.0, at your choice:
[LICENSE-MIT](https://git.statac.dev/statac/vscode-statac/src/branch/main/LICENSE-MIT),
[LICENSE-APACHE](https://git.statac.dev/statac/vscode-statac/src/branch/main/LICENSE-APACHE).
