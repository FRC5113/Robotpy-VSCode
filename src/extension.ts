// Import necessary VS Code modules
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from 'path';
import * as os from 'os';

/**
 * Activate the extension
 * @param context - The extension context
 */
export function activate(context: vscode.ExtensionContext): void {
  // Register a command to open the RobotPy Sidebar
  const sidebarProvider = new RobotPySidebarProvider(context.extensionUri);
  

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'robotpy-sidebar',
      sidebarProvider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('robotpy.runCommand', (command: string) => {
      runRobotPyCommand(command);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('robotpy.runBlackFormatter', () => {
      runBlackFormatter();
    })
  );

  // Register the 'robotpy.setTesttype' command
  context.subscriptions.push(
    vscode.commands.registerCommand('robotpy.setTesttype', (command: string, contents: string, dir: string) => {
      // Ensure that the directory is valid
    

      // Use path.join to create a valid file path, works cross-platform
      const fullFilePath = path.join(dir, 'tests', 'pyfrc_test.py');

      // Call the function to update the test type, passing the correct file path
      updateTestType('C:\\Users\\rradt\\Desktop\\2025-Reefscape-1\\src\\tests\\pyfrc_test.py', contents);
    })
  );
}

/**
 * Execute a RobotPy command in the integrated terminal
 * @param command - The command to execute
 */
let robotPyTerminal: vscode.Terminal | undefined;


function runRobotPyCommand(command: string): void {
  if (!robotPyTerminal) {
    robotPyTerminal = vscode.window.createTerminal('RobotPy Terminal');
  }
  robotPyTerminal.show();
  robotPyTerminal.sendText(command);
}
function runBlackFormatter(): void {
  const terminal = vscode.window.createTerminal('Black Formatter');
  terminal.show();
  terminal.sendText('black .');
}

function updateTestType(filePath: string, contents: string) {
  const terminal = vscode.window.createTerminal('Test Type Setter');
  terminal.show();
  // Determine the appropriate command based on the OS
  let clearCommand: string;
  let setCommand: string;
  console.log(os.platform());
  console.log(filePath);
  console.log(contents);

  if (os.platform() === 'win32') {
      // For Windows
      clearCommand = `Set-Content -Path "${filePath}" -Value ""`;  // Clears the file in Command Prompt
      setCommand = `Set-Content -Path "${filePath}" -Value "${contents}"`; // Writes the contents to the file
  } else {
      // For Linux/macOS
      clearCommand = `> ${filePath}`; // Clears the file in Unix-like systems
      setCommand = `echo "${contents}" > ${filePath}`; // Writes the contents to the file
  }

  // Run the commands in sequence in the terminal
  terminal.sendText(clearCommand);
  terminal.sendText(setCommand);

  // Show the terminal
  
}

/**
 * Sidebar Provider for RobotPy commands
 */
class RobotPySidebarProvider implements vscode.WebviewViewProvider {
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = {
      enableScripts: true, // Enable scripts in the webview
    };
  
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  
    // Handle messages sent from the webview
    webviewView.webview.onDidReceiveMessage((message: { command: string; value: string; contents?: string; dir?: string }) => {
      if (message.command === 'runCommand') {
        runRobotPyCommand(message.value);
      } else if (message.command === 'runBlackFormatter') {
        runBlackFormatter();
      } else if (message.command === 'setTesttype' && message.contents && message.dir) {
        updateTestType(message.dir, message.contents);
      } else {
        console.error('Invalid message format:', message);
      }
    });
  }

  // Read the HTML file and inject it into the webview
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Build the file path correctly across platforms
    const htmlFilePath = path.join(this.extensionUri.fsPath, 'src', 'webview.html');
    
    // Read the HTML content from the file
    let html = fs.readFileSync(htmlFilePath, 'utf8');
    
    // Replace the content security policy source
    html = html.replace(/\${cspSource}/g, webview.cspSource);
  
    return html;
  }
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {}