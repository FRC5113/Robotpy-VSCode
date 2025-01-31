import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from 'path';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext): void {
  const sidebarProvider = new RobotPySidebarProvider(context.extensionUri);
  context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
          'robotpy-sidebar',
          sidebarProvider
      )
  );
  


  registerCommands(context);
  
}

function registerCommands(context: vscode.ExtensionContext) {
  const sidebarProvider = new RobotPySidebarProvider(context.extensionUri);
  context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
          'robotpy-sidebar',
          sidebarProvider
      )
  );

  context.subscriptions.push(
      vscode.commands.registerCommand('robotpy.runCommand', (command: string) => {
          RobotPyTerminal(command);
      })
  );

  context.subscriptions.push(
      vscode.commands.registerCommand('robotpy.runBlackFormatter', () => {
          RobotPyTerminal("black .");
      })
  );

  context.subscriptions.push(
      vscode.commands.registerCommand('robotpy.setTesttype', (contents: string, dir: string) => {
          const fullFilePath = path.join(dir, 'tests', 'pyfrc_test.py');
          updateTestType(fullFilePath, contents);
          vscode.window.showInformationMessage(`Test type set to: ${contents}`);
      })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('robotpy.dirSetup', (contents: string) => {
        dirSetup(contents);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('robotpy.readFile', (filePath: string) => {
        const fileContents = readFile(filePath);
        if (fileContents) {
          sidebarProvider.postMessage({ command: 'updateDirInput', value: fileContents });
        }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('robotpy.getDirInput', () => {
        addDir();
    })
  );
  
}


function RobotPyTerminal(command: string): void {
  let robotPyTerminal: vscode.Terminal | undefined;

  if (!robotPyTerminal) {
    robotPyTerminal = vscode.window.createTerminal('RobotPy Terminal');
  }
  robotPyTerminal.show();
  robotPyTerminal.sendText(command);
}

function replaceFile(filePath: string, contents: string) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceFolder) {
    console.error("No workspace folder is open in VS Code.");
    vscode.window.showErrorMessage("No workspace folder is open in VS Code.");
    return;
  }
  const absoluteFilePath = path.resolve(workspaceFolder, filePath);
  const dirPath = path.dirname(absoluteFilePath);

  console.log(`Updating file: ${absoluteFilePath}`);
  console.log(`Contents: ${contents}`);

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    fs.writeFileSync(absoluteFilePath, contents, 'utf8');

    console.log(`File updated successfully: ${absoluteFilePath}`);
  } catch (error) {
    console.error(`Error updating file: ${error}`);
  }
}

function readFile(filePath: string): string | undefined {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!workspaceFolder) {
    console.error("No workspace folder is open in VS Code.");
    vscode.window.showErrorMessage("No workspace folder is open in VS Code.");
    return '';
  }
  const absoluteFilePath = path.resolve(workspaceFolder, filePath);
  const dirPath = path.dirname(absoluteFilePath);

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const fileContents = fs.readFileSync(absoluteFilePath, 'utf8');

    console.log(`File read successfully: ${absoluteFilePath}`);
    return fileContents;
  } catch (error) {
    console.error(`Error reading file: ${error}`);
  }
}

function updateTestType(filePath: string, contents: string) {
  replaceFile(filePath, contents);
}

function dirSetup(contents: string) {
  const filePath = path.join('.vscode', 'savedDir.txt');
  replaceFile(filePath, contents);
}

function addDir() {
  const filePath = path.join('.vscode', 'savedDir.txt');
  const sidebarProvider = new RobotPySidebarProvider(vscode.Uri.file(''));
  sidebarProvider.postMessage({ command: 'addDir', elementId: 'dir-input', newValue: readFile(filePath) });
}

class RobotPySidebarProvider implements vscode.WebviewViewProvider {
  private readonly extensionUri: vscode.Uri;
  private webviewView?: vscode.WebviewView;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.webviewView = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: { command: string; value: string; contents?: string; dir?: string }) => {
      if (message.command === 'runCommand') {
        RobotPyTerminal(message.value);
      } else if (message.command === 'runBlackFormatter') {
        RobotPyTerminal("black .");
      } else if (message.command === 'setTesttype' && message.contents && message.dir) {
        updateTestType(message.dir, message.contents);
      } else if (message.command === 'dirSetup' && message.contents) {
        dirSetup(message.contents);
      } else if (message.command === 'readFile' && message.value) {
        const fileContents = readFile(message.value);
        if (fileContents && this.webviewView) {
          this.webviewView.webview.postMessage({ command: 'updateDirInput', value: fileContents });
        }
      } else if (message.command === 'addDir') {
        addDir();
      } else {
        console.error('Invalid message format:', message);
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const htmlFilePath = path.join(this.extensionUri.fsPath, 'src', 'webview.html');
    let html = fs.readFileSync(htmlFilePath, 'utf8');
    html = html.replace(/\${cspSource}/g, webview.cspSource);
    return html;
  }

  public postMessage(message: any): void {
    if (this.webviewView) {
      this.webviewView.webview.postMessage(message);
    } else {
      console.error("Webview is not available.");
    }
  }
}
