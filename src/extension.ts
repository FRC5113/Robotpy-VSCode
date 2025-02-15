import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function activate(context: vscode.ExtensionContext): void {
  const sidebarProvider = new RobotPySidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "robotpy-sidebar",
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("robotpy.runCommand", (command: string) => {
      RobotPyTerminal(command);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("robotpy.runBlackFormatter", () => {
      RobotPyTerminal("black .");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "robotpy.setTesttype",
      (contents: string, dir: string) => {
        const fullFilePath = path.join(dir, "tests", "pyfrc_test.py");
        updateTestType(fullFilePath, contents);
        vscode.window.showInformationMessage(`Test type set to: ${contents}`);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("robotpy.dirSetup", (contents: string) => {
      dirSetup(contents);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("robotpy.readFile", (filePath: string) => {
      const fileContents = readFile(filePath);
      if (fileContents) {
        sidebarProvider.postMessage({
          command: "updateDirInput",
          value: fileContents,
        });
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "robotpy.getDirInput",
      (value: string, webviewView: vscode.WebviewView) => {
        const fileContents = readFile(value);
        if (fileContents && webviewView) {
          webviewView.webview.postMessage({
            command: "updateDirInput",
            value: fileContents,
          });
        }
      }
    )
  );
}

function RobotPyTerminal(command: string): void {
  let robotPyTerminal: vscode.Terminal | undefined;

  if (!robotPyTerminal) {
    robotPyTerminal = vscode.window.createTerminal("RobotPy Terminal");
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

    fs.writeFileSync(absoluteFilePath, contents, "utf8");

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
    return "";
  }
  const absoluteFilePath = path.resolve(workspaceFolder, filePath);
  const dirPath = path.dirname(absoluteFilePath);

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const fileContents = fs.readFileSync(absoluteFilePath, "utf8");

    console.log(`File read successfully: ${absoluteFilePath}`);
    return fileContents;
  } catch (error) {
    console.error(`Error reading file: ${error}`);
  }
}

function updateTestType(filePath: string, contents: string) {
  let fullDir = "";

  if (filePath === "") {
    fullDir = path.join("tests", "pyfrc_test.py");
  } else {
    fullDir = path.join(filePath, "tests", "pyfrc_test.py");
  }
  replaceFile(fullDir, contents);
}

function dirSetup(contents: string) {
  const filePath = path.join(".vscode", "savedDir.txt");
  replaceFile(filePath, contents);
}

function addDir() {
  const filePath = path.join(".vscode", "savedDir.txt");
  const sidebarProvider = new RobotPySidebarProvider(vscode.Uri.file(""));
  sidebarProvider.postMessage({
    command: "addDir",
    elementId: "dir-input",
    newValue: readFile(filePath),
  });
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
      localResourceRoots: [
        vscode.Uri.file(path.join(this.extensionUri.fsPath, "dist")),
        vscode.Uri.file(path.join(this.extensionUri.fsPath, "src")),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      (message: {
        command: string;
        value: string;
        contents: string;
        dir: string;
      }) => {
        if (message.command === "runCommand") {
          RobotPyTerminal(message.value);
        } 
        
        else if (message.command === "runBlackFormatter") {
          RobotPyTerminal("black .");
        } 
        
        else if (
          message.command === "setTesttype"
        ) {
          updateTestType(message.dir, message.contents);
        } 
        
        else if (message.command === "dirSetup" && message.contents) {
          dirSetup(message.contents);
        } 
        
        else if (message.command === "getDirInput") {
          const dir = path.join(".vscode", "savedDir.txt");
          const fileContents = readFile(dir);
          if (fileContents && this.webviewView) {
            this.webviewView.webview.postMessage({
              command: "updateDirInput",
              value: fileContents,
            });
          }
        } 
        
        else {
          console.error("Invalid message format:", message);
        }
      }
    );
  }

  private getHtmlForWebview(webview: vscode.Webview, input?: string): string {
    // Adjust the path to where the HTML is actually located at runtime.
    const htmlFilePath = path.join(
      this.extensionUri.fsPath,
      "dist",
      "webview.html"
    );
    let html = "";
    try {
      html = fs.readFileSync(htmlFilePath, "utf8");
    } catch (err) {
      console.error(`Error reading ${htmlFilePath}:`, err);
      html = `<html><body>Error loading view</body></html>`;
    }
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
