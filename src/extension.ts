// Import necessary VS Code modules
import * as vscode from 'vscode';
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
 * Execute the Black formatter in the integrated terminal
 */
function runBlackFormatter(): void {
  const terminal = vscode.window.createTerminal('Black Formatter');
  terminal.show();
  terminal.sendText('black .');
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
      } else if (message.command === 'runBlackFormatter') {
        runBlackFormatter();
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

        select, input[type="text"], button {
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

        input[type="text"] {
            background-color: #f0f0f0;
            color: #333333;
        }

        select:focus, input[type="text"]:focus, button:focus {
            outline: none;
            border-color: #005a9e;
        }

        button:hover, select:hover, input[type="text"]:hover {
            background-color: #005a9e;
        }

        .checkbox-container {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .checkbox-container label {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <label for="dir-input">Directory</label>
    <input type="text" id="dir-input" placeholder="Enter directory path">

    <label for="subcommands">Subcommand</label>
    <select id="subcommands" onchange="updateFlags()">
        <option value="deploy">Deploy</option>
        <option value="sync">Sync</option>
        <option value="test">Test</option>
        <option value="sim">Simulation</option>
        <option value="undeploy">Undeploy</option>
    </select>

    <div class="checkbox-container" id="flags-container"></div>

    <button onclick="runCommand()">Run Command</button>
    <button onclick="clearFlags()">Clear Flags</button>
    <button onclick="runBlackFormatter()">Run Black Formatter</button>

    <script>
        const vscode = acquireVsCodeApi();

        const flags = {
            deploy: [
                "--skip-tests", "--debug", "--nc", "--force-install",
                "--large", "--no-verify", "--no-install", "--robot", "--team"
            ],
            sync: [
                "--user", "--use-certifi", "--no-install", "--no-upgrade-project"
            ],
            test: [
                "--builtin", "--coverage-mode"
            ],
            sim: [
                "--nogui", "--ds-socket", "--ws-client", "--ws-server"
            ],
            undeploy: [
                "--yes"
            ]
        };

        function updateFlags() {
            const subcommand = document.getElementById('subcommands').value;
            const flagsContainer = document.getElementById('flags-container');
            flagsContainer.innerHTML = '';

            flags[subcommand].forEach(flag => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = flag;
                checkbox.value = flag;

                const label = document.createElement('label');
                label.htmlFor = flag;
                label.textContent = flag;

                flagsContainer.appendChild(checkbox);
                flagsContainer.appendChild(label);
            });
        }

        function runCommand() {
            const subcommand = document.getElementById('subcommands').value;
            const selectedFlags = Array.from(document.querySelectorAll('#flags-container input:checked'))
                .map(checkbox => checkbox.value)
                .join(' ');

            const dir = document.getElementById('dir-input').value;
            const isWindows = navigator.platform.startsWith('Win');
            const cdCommand = dir ? (isWindows ? \`cd \${dir}; \` : \`cd \${dir} && \`) : '';
            const command = \`\${cdCommand}robotpy \${subcommand} \${selectedFlags}\`.trim();

            vscode.postMessage({ command: 'runCommand', value: command });
        }

        function runBlackFormatter() {
            vscode.postMessage({ command: 'runBlackFormatter' });
        }

        function clearFlags() {
            const checkboxes = document.querySelectorAll('#flags-container input:checked');
            checkboxes.forEach(checkbox => checkbox.checked = false);
        }

        // Initialize flags for the default subcommand
        updateFlags();
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