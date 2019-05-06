// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { WorkspaceFolder, Uri, Range } from 'vscode';
import { inc, ReleaseType } from 'semver';
import { shell } from 'execa';

async function bump(release: ReleaseType) {
  if (!vscode.workspace.workspaceFolders) {
    return vscode.window.showErrorMessage(`It's not a package`);
  }
  let workspaceFolder: WorkspaceFolder | undefined;
  if (vscode.workspace.workspaceFolders.length > 1) {
    workspaceFolder = await vscode.window.showWorkspaceFolderPick();
    if (!workspaceFolder) {
      return vscode.window.showErrorMessage('Canceled');
    }
  } else {
    workspaceFolder = vscode.workspace.workspaceFolders[0];
  }
  const versionFilePath = `${workspaceFolder.uri.path}/VERSION`;
  const versionUri = Uri.file(versionFilePath);
  const versionTextDocument = await vscode.workspace.openTextDocument(
    versionUri
  );
  const versionTextEdit = await vscode.window.showTextDocument(
    versionTextDocument
  );
  const version = versionTextDocument.getText();
  const newVersion = inc(version, release);
  await versionTextEdit.edit((editBuilder) => {
    editBuilder.replace(new Range(0, 0, 1, 0), `${newVersion}\n`);
  });
  await versionTextDocument.save();
  const { stdout } = await shell(
    `cd ${
      workspaceFolder.uri.path
    } && git add VERSION && git commit -m "Bump Version to ${newVersion}"`
  );
  console.log(stdout);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "bump" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const commands = [
    {
      command: 'bump.default',
      method: () => {
        bump('patch')
      }
    },
    {
      command: 'bump.patch',
      method: () => bump('patch')
    },
    {
      command: 'bump.minor',
      method: () => bump('minor')
    },
    {
      command: 'bump.major',
      method: () => bump('major')
    }
  ];

  const disposables = commands.map(({ command, method }) =>
    vscode.commands.registerCommand(command, method)
  );
  context.subscriptions.push(...disposables);
}

// this method is called when your extension is deactivated
export function deactivate() {}
