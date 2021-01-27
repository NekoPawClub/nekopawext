// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "nekopawext" is now active!');
	context.subscriptions.push(...[
		vscode.commands.registerCommand('nekopawext.connectDevice', (ip: String) => {
			vscode.window.showQuickPick(
				[
					"192.168.1.1",
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
			let text = editor?.document.getText()
			vscode.window.showInformationMessage(`运行js代码:${text}`);
		}),
	]);
}

// this method is called when your extension is deactivated
export function deactivate() { }
