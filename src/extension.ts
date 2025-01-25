import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext): void {
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

function runRobotPyCommand(command: string): void {
  const terminal = vscode.window.createTerminal('RobotPy Terminal');
  terminal.show();
  terminal.sendText(command);
}

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
    
    return `<!DOCTYPE html>
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
            border: 1px solid #ffffff;
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
    <h2>RobotPy Commands</h2>
    <form id="dir">
        <input id="dirinput">
        <input type="submit" value="Submit">
    </form>
    <br><br>
    <label for="command">Choose a command:</label>
    <select id="command">
        <option value="">Select a command</option>
        <option value="deploy">Deploy</option>
        <option value="sync">Sync</option>
        <option value="test">Test</option>
        <option value="sim">Simulation</option>
        <option value="undeploy">Undeploy</option>
    </select>

    <div id="options-container"></div>
    <button onclick="runCommand()">Run Command</button>
    <button onclick="clearFlags()">Clear Flags</button>

    <script>
        const options = {
            deploy: [
                { value: "--skip-tests", label: "Skip Tests" },
                { value: "--debug", label: "Debug Mode" },
                { value: "--nc", label: "Netconsole" },
                { value: "--force-install", label: "Force Install" },
                { value: "--large", label: "Allow Large Files" },
                { value: "--no-verify", label: "No Verify" },
                { value: "--no-install", label: "No Install" },
                { value: "--robot", label: "Set Robot" },
                { value: "--team", label: "Set Team Number" }
            ],
            sync: [
                { value: "--user", label: "User Install" },
                { value: "--use-certifi", label: "Use Certifi" },
                { value: "--no-install", label: "No Install" },
                { value: "--no-upgrade-project", label: "No Upgrade" }
            ],
            test: [
                { value: "--builtin", label: "Use Built-in Tests" },
                { value: "--coverage-mode", label: "Coverage Mode" }
            ],
            sim: [
                { value: "--nogui", label: "Don't Use The GUI" },
                { value: "--ds-socket", label: "DS Socket Extension" },
                { value: "--ws-client", label: "Websim Client Extensions" },
                { value: "--ws-server", label: "Websim Server Extensions" }
            ],
            undeploy: [
                { value: "--yes", label: "No Prompt" }
            ]
        };

        const updateOptions = (command) => {
            const optionsContainer = document.getElementById("options-container");
            optionsContainer.innerHTML = "";
            if (options[command]) {
                options[command].forEach(option => {
                    const div = document.createElement("div");
                    const label = document.createElement("label");
                    const checkbox = document.createElement("input");
                    checkbox.type = "checkbox";
                    checkbox.name = "options";
                    checkbox.value = option.value;
                    label.appendChild(checkbox);
                    label.appendChild(document.createTextNode(option.label));
                    div.appendChild(label);
                    optionsContainer.appendChild(div);
                });
            }
        };

        document.getElementById("command").addEventListener("change", function() {
            updateOptions(this.value);
        });

        function runCommand() {
            const command = document.getElementById("command").value;
            const selectedOptions = Array.from(document.querySelectorAll("#options-container input:checked"))
                .map(option => option.value)
                .join(' ');

            let fullCommand = `robotpy ${command} ${selectedOptions}`;
            const dirinput = document.getElementById("dirinput")
            let dircommand = `cd ${dirinput}`;
            

            const vscode = acquireVsCodeApi();
            vscode.postMessage({ dircommand: `setdir`, value: dircommand });
            vscode.postMessage({ command: 'runCommand', value: fullCommand });
        }

        function clearFlags() {
            const checkboxes = document.querySelectorAll("#options-container input[type='checkbox']");
            checkboxes.forEach(checkbox => checkbox.checked = false);
        }
    </script>
</body>
</html>`;
  }
}

export function deactivate(): void {}