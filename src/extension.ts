// Import necessary VS Code modules
import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from "fs";

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
    vscode.commands.registerCommand('robotpy.setTestType', (value: string) => {
      setTestType(value);
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

  let terminal = vscode.window.terminals.find(t => t.name === 'Black Formatter');
  if (!terminal) {
    terminal = vscode.window.createTerminal('Black Formatter');
  }
  terminal.show();
  terminal.sendText('black .');
function runBlackFormatter(): void {
  const terminal = vscode.window.createTerminal('Black Formatter');
  terminal.show();
  terminal.sendText('black .');
}
function setTestType(value: string): void {
  const terminal = vscode.window.createTerminal('Test Setter');
  
  
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
        console.error(`Invalid message format: ${JSON.stringify(message)}`);
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

      .checkbox-item {
      display: flex;
      align-items: center;
      margin: 5px 0;
      }

      .checkbox-item label {
      margin-left: 8px;
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
  <option value="init">Init</option>
  <option value="add-tests">Add Tests</option>
  <option value="create-physics">Create Physics</option>
  <option value="deploy-info">Deploy Info</option>
  <option value="coverage">Coverage</option>
  <option value="installer">Installer</option>
  <option value="profiler">Profiler</option>
  <option value="project">Project</option>
  <option value="run">Run</option>
</select>

<div class="checkbox-container" id="flags-container"></div>

<button onclick="runCommand()">Run Command</button>
<button onclick="clearFlags()">Clear Flags</button>
<button onclick="runBlackFormatter()">Run Black Formatter</button>

<script>
  const vscode = acquireVsCodeApi();

  const flags = {
    deploy: [
      { flag: "--skip-tests", label: "Skip Tests" },
      { flag: "--debug", label: "Debug Mode" },
      { flag: "--nc", label: "NetConsole" },
      { flag: "--nc-ds", label: "NetConsole DS" },
      { flag: "--force-install", label: "Force Install" },
      { flag: "--large", label: "Allow Large Files" },
      { flag: "--no-verify", label: "No Verify" },
      { flag: "--no-install", label: "No Install" },
      { flag: "--ignore-image-version", label: "Ignore Image" },
      { flag: "--no-uninstall", label: "No Uninstall" },
      { flag: "--no-resolve", label: "No DNS Lookup" },
    ],
    sync: [
      { flag: "--user", label: "User Mode" },
      { flag: "--use-certifi", label: "Certifi SSL" },
      { flag: "--no-install", label: "No Install" },
      { flag: "--no-upgrade-project", label: "No Upgrade" },
    ],
    test: [
      { flag: "--builtin", label: "Builtin Tests" },
      { flag: "--coverage-mode", label: "Coverage Mode" },
    ],
    sim: [
      { flag: "--nogui", label: "No GUI" },
      { flag: "--ds-socket", label: "DS Socket" },
      { flag: "--ws-client", label: "WS Client" },
      { flag: "--ws-server", label: "WS Server" },
      { flag: "--xrp", label: "XRP Mode" },
    ],
    undeploy: [
      { flag: "--yes", label: "No Prompt" },
    ],
    "add-tests": [],
    coverage: [
      { flag: "--parallel-mode", label: "Parallel Mode" },
    ],
    "create-physics": [],
    "deploy-info": [
      { flag: "--robot", label: "Robot IP" },
      { flag: "--team", label: "Team Number" },
      { flag: "--no-resolve", label: "No DNS Lookup" },
    ],
    init: [],
    installer: [
      { flag: "cache", label: "Cache" },
      { flag: "download", label: "Download" },
      { flag: "download-python", label: "Download Python" },
      { flag: "install", label: "Install Packages" },
      { flag: "install-python", label: "Install Python" },
      { flag: "list", label: "List Packages" },
      { flag: "niweb", label: "NI Web" },
      { flag: "uninstall", label: "Uninstall Packages" },
      { flag: "uninstall-python", label: "Uninstall Python" },
      { flag: "uninstall-robotpy", label: "Uninstall RobotPy" },
    ],
    profiler: [
      { flag: "-o", label: "Output File" },
    ],
    project: [
      { flag: "update-robotpy", label: "Update RobotPy" },
    ],
    run: [],
  };

      function updateTestType() {
        const dir = document.getElementById('dir-input').value;
        const isWindows = navigator.platform.startsWith('Win');
        const cdCommand = dir ? (isWindows ? \`cd \${dir}; \` : \`cd \${dir} && \`) : '';
        const command = \`\${cdCommand}robotpy \${subcommand} \${selectedFlags}\`.trim();

        if (subcommand === 'test') {
          const testTypelabel = document.getElementById('test-type').value;
          if (testTypelabel === 'autonomous') {
            const testtype = 'test_autonomous';
          }else if (testTypelabel === 'teleop') {
            const testtype = 'test_autonomous';
          } else if (testTypelabel === 'disabled') {
            const testtype = 'test_autonomous';
          } else if (testTypelabel === 'all') {
            vscode.postMessage({ value: all });
          }
          if (testtype !== 'all') {
            vscode.postMessage({ value: testtype });
      }

      function updateFlags() {
        const subcommand = document.getElementById('subcommands').value;
        const flagsContainer = document.getElementById('flags-container');
        flagsContainer.innerHTML = '';

        flags[subcommand].forEach(({ flag, label }) => {
        const checkboxItem = document.createElement('div');
        checkboxItem.className = 'checkbox-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = flag;
        checkbox.value = flag;

        const labelElement = document.createElement('label');
        labelElement.htmlFor = flag;
        labelElement.textContent = label;

        checkboxItem.appendChild(checkbox);
        checkboxItem.appendChild(labelElement);
        flagsContainer.appendChild(checkboxItem);
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