// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { client as WebSocketClient } from 'websocket';

// client.connect('ws://localhost:8080/', 'echo-protocol');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "nekopawext" is now active!');
	context.subscriptions.push(...[
		vscode.commands.registerCommand('nekopawext.connectDevice', (ip: String) => {
			vscode.window.showQuickPick(
				[
					"ws://192.168.1.146:52345/runJS",
				],
				{
					ignoreFocusOut: true,
					matchOnDescription: true,
					matchOnDetail: true,
					placeHolder: '输入手机ip以链接'
				})
				.then(function (ip) {
					console.log(ip)
					vscode.window.showInformationMessage(`链接设备${ip}成功!`);
				})
		}),
		vscode.commands.registerCommand('nekopawext.runJS', () => {
			let editor = vscode.window.activeTextEditor;
			let text = editor?.document.getText();

			const c = vscode.window.createOutputChannel("neko paw 调试信息");
			c.show();

			var client = new WebSocketClient();

			client.on('connectFailed', function (error) {
				c.appendLine('Connect Error: ' + error.toString());
			});

			client.on('connect', function (connection) {
				c.appendLine('WebSocket Client Connected');
				connection.on('error', function (error) {
					c.appendLine("Connection Error: " + error.toString());
				});
				connection.on('close', function () {
					c.appendLine('echo-protocol Connection Closed');
				});
				connection.on('message', function (message) {
					if (message.type === 'utf8') {
						c.appendLine("Received: '" + message.utf8Data + "'");
					}
				});

				function sendJS() {
					if (connection.connected && text) {
						connection.sendUTF(';env_websoket = true;' + text + ';env_websoket = undefined;');
					}
				}
				sendJS();
			});
			client.connect('ws://192.168.1.146:52345/runJS', 'echo-protocol');
		}),
	]);
}

// this method is called when your extension is deactivated
export function deactivate() { }
