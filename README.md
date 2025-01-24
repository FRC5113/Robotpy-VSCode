# RobotPy VS Code Extension
This Visual Studio Code extension for RobotPy allows users to easily execute RobotPy commands directly from a sidebar interface within VS Code. With the addition of a dropdown menu for each major RobotPy command (deploy, sync, and test), users can now select multiple flags and options, making it easier to configure and run commands with custom parameters.

## Features:
### Multi-Flag Selection:

Users can select multiple flags or options for commands like deploy, sync, and test by using dropdown menus that support multi-selection.
Each dropdown contains a list of available flags for the respective command (e.g., --skip-tests, --force-install, --no-upgrade-project, etc.).
Intuitive User Interface:

The sidebar is designed with a clean, easy-to-use layout, where each command has its own dropdown list for selecting options.
Each command (deploy, sync, test) includes a button that, when clicked, sends the selected flags to be executed in the integrated terminal.
Command Execution:

When a user selects one or more flags and clicks the "Run" button, the extension combines the main command with the selected flags and executes it in the terminal.
Supports flags like --debug, --skip-tests, --force-install, and many more, allowing users to tailor their RobotPy commands.
Backend Integration:

The selected flags are sent to the backend of the extension, which then runs the complete command in the VS Code terminal, making it easy to interact with the robot from within the IDE.
This extension is ideal for users who frequently work with RobotPy in their robotics development projects and need a simple way to configure and run commands without leaving the VS Code environment.

## Commands Available:
- RobotPy Deploy: Deploys code to the robot with various options such as skipping tests, forcing installation, or allowing large files.  
- RobotPy Sync: Syncs project requirements with the robot, with options to control installation behavior and upgrades.  
- RobotPy Test: Runs unit tests on the robot code with flags for built-in tests and coverage mode.  
- Robotpy Sim: Runs the robot simulation with options to configure the GUI, DS socket, and websim extensions for different simulation environments.  
- By enabling the selection of multiple flags in one go, the extension streamlines the process of configuring and executing RobotPy commands, improving workflow efficiency.


## Building Extension

### 1. Install npm (Node Package Manager)

To start working with the package, you'll need to have Node.js and npm (Node Package Manager) installed on your system. If you don't have them installed, follow these steps:


- Visit the official Node.js website: [https://nodejs.org/](https://nodejs.org/).
- Download the latest LTS version for your operating system.
- Follow the installation instructions for your platform.

To confirm that Node.js and npm are successfully installed, run the following commands in your terminal or command prompt:

```
node -v
npm -v
```
You should see the version numbers for both Node.js and npm.

### 2. Install VSCE
To create and manage your VSCE package, you need to install the VSCE CLI tool. In your terminal or command prompt, run the following command:

```
npm install -g vsce
```
This will install the VSCE CLI globally on your machine.

### 3. Package the Extension
Navigate to the root of your extension's project folder in the terminal, then run the following command to build the VSCE package:
```
vsce package
```
This will generate a .vsix file, which is the packaged extension ready for installation.
