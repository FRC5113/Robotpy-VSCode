// Import necessary VS Code modules
import * as vscode from 'vscode';

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
}

/**
 * Execute a RobotPy command in the integrated terminal
 * @param command - The command to execute
 */
function runRobotPyCommand(command: string): void {
  const terminal = vscode.window.createTerminal('RobotPy Terminal');
  terminal.show();
  terminal.sendText(command);
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
      enableScripts: true,
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: { command: string; value: string }) => {
      if (message.command === 'runCommand') {
        runRobotPyCommand(message.value);
      } else {
        console.error('Invalid message format:', message);
      }
    });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RobotPy Commands</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            margin: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        h2 {
            text-align: center;
            margin: 20px 0;
        }

        label {
            font-size: 16px;
            margin-bottom: 8px;
        }

        select, button {
            width: 250px;
            margin: 10px auto;
            padding: 12px;
            font-size: 14px;
            cursor: pointer;
            border: 1px solid #ccc;
            border-radius: 4px;
            background-color: #0078d4;
            color: #ffffff;
            transition: background-color 0.3s ease;
        }

        select:focus, button:focus {
            outline: none;
            border-color: #005a9e;
        }

        button:hover, select:hover {
            background-color: #005a9e;
        }
    </style>
</head>
<body>
    <!-- RobotPy Deploy Command with Single Select for Flags -->
    <label for="deploy-options">Deploy Options (Select Flag)</label>
    <select id="deploy-options">
		<option value="">None</option>
        <option value="--skip-tests">Skip Tests</option>
        <option value="--debug">Debug Mode</option>
        <option value="--nc">Netconsole</option>
        <option value="--force-install">Force Install</option>
        <option value="--large">Allow Large Files</option>
        <option value="--no-verify">No Verify</option>
        <option value="--no-install">No Install</option>
        <option value="--robot">Set Robot</option>
        <option value="--team">Set Team Number</option>
    </select>
    <button onclick="runCommandFromDropdown('deploy')">Run Deploy</button>

    <!-- RobotPy Sync Command with Single Select for Flags -->
    <label for="sync-options">Sync Options (Select Flag)</label>
    <select id="sync-options">
		<option value="">None</option>
        <option value="--user">User Install</option>
        <option value="--use-certifi">Use Certifi</option>
        <option value="--no-install">No Install</option>
        <option value="--no-upgrade-project">No Upgrade</option>
    </select>
    <button onclick="runCommandFromDropdown('sync')">Run Sync</button>

    <!-- RobotPy Test Command with Single Select for Flags -->
    <label for="test-options">Test Options (Select Flag)</label>
    <select id="test-options">
		<option value="">None</option>
        <option value="--builtin">Use Built-in Tests</option>
        <option value="--coverage-mode">Coverage Mode</option>
    </select>
    <button onclick="runCommandFromDropdown('test')">Run Test</button>

    <!-- RobotPy Simulation Command with Single Select for Flags -->
    <label for="sim-options">Simulation Options (Select Flag)</label>
    <select id="sim-options">
		<option value="">None</option>
        <option value="--nogui">Don't Use The GUI</option>
        <option value="--ds-socket">DS Socket Extension</option>
        <option value="--ws-client">Websim Client Extensions</option>
        <option value="--ws-server">Websim Server Extensions</option>
    </select>
    <button onclick="runCommandFromDropdown('sim')">Run Simulation</button>

    <!-- RobotPy Undeploy Command -->
    <label for="undeploy-options">Undeploy Options</label>
    <select id="undeploy-options">
		<option value="">None</option>
        <option value="--yes">No Prompt</option>
    </select>
    <button onclick="runCommandFromDropdown('undeploy')">Run Undeploy</button>

    <script>
        // Simulate VS Code API for messaging
        const vscode = acquireVsCodeApi();

        // Function to send a command to the backend from selections
        function runCommandFromDropdown(commandType) {
            let selectedCommand = "";
            if (commandType === 'deploy') {
                selectedCommand = 'robotpy deploy ' + Array.from(document.getElementById('deploy-options').selectedOptions)
                .map(option => option.value)
                .join(' ');
            } else if (commandType === 'sync') {
                selectedCommand = 'robotpy sync ' + Array.from(document.getElementById('sync-options').selectedOptions)
                .map(option => option.value)
                .join(' ');
            } else if (commandType === 'test') {
                selectedCommand = 'robotpy test ' + Array.from(document.getElementById('test-options').selectedOptions)
                .map(option => option.value)
                .join(' ');
            } else if (commandType === 'sim') {
                selectedCommand = 'robotpy sim ' + Array.from(document.getElementById('sim-options').selectedOptions)
                .map(option => option.value)
                .join(' ');
            } else if (commandType === 'undeploy') {
                selectedCommand = 'robotpy undeploy '
            }

            // Post message with selected command
            vscode.postMessage({ command: 'runCommand', value: selectedCommand });
        }
    </script>
</body>
</html>


    `;
  }
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {}
