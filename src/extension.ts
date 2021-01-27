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
			const c = vscode.window.createOutputChannel("neko paw 调试信息");
			c.appendLine(`执行 ${text}`)
			c.show()
			// Create and show a new webview
			const panel = vscode.window.createWebviewPanel(
				'debugMessage', // Identifies the type of the webview. Used internally
				'调试信息', // Title of the panel displayed to the user
				vscode.ViewColumn.Beside, // Editor column to show the new webview panel in.
				{} // Webview options. More on these later.
			);
			// And set its HTML content
			panel.webview.html = getWebviewContent(text);
		}),
	]);
}

function getWebviewContent(text: string | undefined) {
	return `<!DOCTYPE html>
  <html lang="en">
  <head>
	  <meta charset="UTF-8">
	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
	  <title>Cat Coding</title>
  </head>
  <body>
		  <p>执行 ${text}</p>
		  <p>图片测试</p>
	  <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
  </body>
  </html>`;
}

// this method is called when your extension is deactivated
export function deactivate() { }
