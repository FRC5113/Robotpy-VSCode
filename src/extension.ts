// Import necessary VS Code modules
import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from 'path';

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
  context.subscriptions.push(
    vscode.commands.registerCommand('robotpy.setTesttype', (dir: string, value: string) => {
      updateTestType(dir, value);
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

function updateTestType(dir: string, testType: string): void {
  // Define the path to the test file
  const filePath = path.join(dir, 'tests', 'pyfrc_test.py');
  
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    console.log('File does not exist');
    return;
  }

  // Read the file contents
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    // Update the content based on the testType value
    let updatedData: string = '';
    if (testType === 'all') {
      updatedData = 'from pyfrc.tests import *';
    } else if (testType === 'autonomous') {
      updatedData = 'from pyfrc.tests.basic import test_autonomous';
    } else if (testType === 'teleop') {
      updatedData = 'from pyfrc.tests.basic import test_operator_control';
    } else if (testType === 'disabled') {
      updatedData = 'from pyfrc.tests.basic import test_disabled';
    } else if (testType === 'practice') {
      updatedData = 'from pyfrc.tests.basic import test_practice';
    } else {
      updatedData = 'from pyfrc.tests import *';
    }

    // Write the updated content back to the file
    fs.writeFile(filePath, updatedData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing to file:', err);
      } else {
        console.log('File content updated successfully');
      }
    });
  });
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
    webviewView.webview.onDidReceiveMessage((message: { command: string; value: string }) => {
      if (message.command === 'runCommand') {
        runRobotPyCommand(message.value);
      } else if (message.command === 'runBlackFormatter') {
        runBlackFormatter();
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