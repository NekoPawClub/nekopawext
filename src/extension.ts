// 模块"vscode"包含VSCode可扩展性API导入模块，并在下面的代码中使用别名vscode对其进行引用
import * as vscode from 'vscode';
import { client as WebSocketClient, connection, w3cwebsocket } from 'websocket';


function sleep (ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// 当您的扩展程序被激活时，将调用此方法。
export function activate (context: vscode.ExtensionContext) {
	console.log('"NekoPawExt" 插件已激活');
	var consoleLoger = vscode.window.createOutputChannel("NekoPow 调试信息");
	var webSocketIP: string = vscode.workspace.getConfiguration().get('NekoPawExt.WebSocket.IP') ?? "";
	var webSocketPORT: string = vscode.workspace.getConfiguration().get('NekoPawExt.WebSocket.PORT') ?? "8889";

	var wsClient = new WebSocketClient();
	var wsConnector: connection | undefined = undefined;
	wsClient.addListener('connectFailed', (err) => {
		vscode.window.showErrorMessage("链接失败，请确保'IP是正确'且'NekoPaw服务已开启'");
		consoleLoger?.appendLine(`连接失败: ${err}`);
		wsConnector = undefined;
	});
	wsClient.addListener('connect', (connection) => {
		vscode.workspace.getConfiguration().update('NekoPawExt.WebSocket.IP', webSocketIP, true);
		vscode.workspace.getConfiguration().update('NekoPawExt.WebSocket.PORT', webSocketPORT, true);
		vscode.window.setStatusBarMessage(`NekoPawExt已连接到${webSocketIP}:${webSocketPORT}`);
		consoleLoger.appendLine(`设备 ${webSocketIP}:${webSocketPORT} 连接成功`);
		if (wsConnector == undefined) {
			wsConnector = connection;
			wsConnector.addListener('error', (err) => { consoleLoger.appendLine(`连接出错: ${err}`); });
			wsConnector.addListener('close', () => {
				wsConnector = undefined;
				consoleLoger.appendLine('连接已关闭');
			});
			wsConnector.addListener('message', (message) => {
				if (message.type === 'utf8') consoleLoger.appendLine(message.utf8Data ?? "");
			});
		}
	});

	context.subscriptions.push(...[
		vscode.commands.registerCommand('nekopawext.connectDevice', () => {
			vscode.window.showInputBox({	// 这个对象中所有参数都是可选参数
				ignoreFocusOut: true,		// 默认false，设置为true时鼠标点击别的地方输入框不会消失
				placeHolder: '192.168.1.5',	// 在输入框内的提示信息
				prompt: '输入手机IP进行连接',// 在输入框下方的提示信息
				validateInput: (inputText) => {
					if (/^[0-9\.]+$/.test(inputText)) {
						return null;
					}
					return "IP格式不对 请输入形如'192.168.1.5'";
				} // 对输入内容进行验证并返回
			}).then((ip) => {
				consoleLoger.show();
				webSocketIP = ip!!;
				wsClient.connect(`ws://${webSocketIP}:${webSocketPORT}/runJS`, 'echo-protocol');
			});
		}),
		vscode.commands.registerCommand('nekopawext.runJS', () => {
			consoleLoger.show();
			if (!/^[0-9\.]+$/.test(webSocketIP ?? "")) {
				consoleLoger.appendLine(`请先连接设备, 使用"Ctrl+Shift+P"打开菜单, 再点击"NekoPaw: 连接手机IP"`);
				return;
			}

			let editText = vscode.window.activeTextEditor?.document.getText();
			(async () => {
				for (let i = 0; i < 3; ++i) {
					if (wsConnector?.connected && editText) {
						consoleLoger.appendLine('--开始运行--');
						wsConnector.sendUTF(';env_web_socket = true;' + editText + ';env_web_socket = undefined;');
						break;
					} else {
						wsClient.connect(`ws://${webSocketIP}:${webSocketPORT}/runJS`, 'echo-protocol');
						await sleep(1000);
					}
				}
			})();
		}),
	]);
}

// 停用扩展程序时，将调用此方法
export function deactivate () {

}
