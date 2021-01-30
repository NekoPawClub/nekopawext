// 模块"vscode"包含VSCode可扩展性API导入模块，并在下面的代码中使用别名vscode对其进行引用
import * as vscode from 'vscode';
import { client as WebSocketClient } from 'websocket';

// 当您的扩展程序被激活时，将调用此方法。
export function activate(context: vscode.ExtensionContext) {
	console.log('"NekoPawExt" 插件已激活');
	var _c: vscode.OutputChannel;
	var _ip: string | undefined;
	context.subscriptions.push(...[
		vscode.commands.registerCommand('nekopawext.connectDevice', () => {
			vscode.window.showInputBox(
				{ // 这个对象中所有参数都是可选参数
					password: false, // 输入内容是否是密码
					ignoreFocusOut: true, // 默认false，设置为true时鼠标点击别的地方输入框不会消失
					placeHolder: '192.168.1.5', // 在输入框内的提示信息
					prompt: '输入手机ip以链接', // 在输入框下方的提示信息
					validateInput: function (ip) {
						if (/^[0-9\.]+$/.test(ip)) {
							return null;
						}
						return "IP格式不对 请输入形如`192.168.1.5`";
					} // 对输入内容进行验证并返回
				}).then(function (ip) {
					if (_c == null) {
						_c = vscode.window.createOutputChannel("neko paw 调试信息");
					}
					_c.show();

					var client = new WebSocketClient();
					client.on('connectFailed', function (error) {
						_c.appendLine('Connect Error: ' + error.toString());
						vscode.window.showErrorMessage("链接失败，请检查IP或手机是否开启服务");
					});
					client.on('connect', function (connection) {
						_ip = ip;
						_c.appendLine(`设备 ${ip} 链接成功`);
						vscode.window.showInformationMessage(`设备 ${ip} 链接成功`);

						vscode.window.setStatusBarMessage(`已链接 ${ip}`);

						connection.on('error', function (error) {
							_c.appendLine("连接错误: " + error.toString());
						});
						connection.on('close', function () {
							_c.appendLine('连接已关闭');
						});
						connection.on('message', function (message) {
							if (message.type === 'utf8') {
								_c.appendLine(message.utf8Data ?? "");
							}
						});
					});
					client.connect(`ws://${ip}:52345/runJS`, 'echo-protocol');
				});
		}),
		vscode.commands.registerCommand('nekopawext.runJS', () => {
			if (_c == null) {
				_c = vscode.window.createOutputChannel("neko paw 调试信息");
			}
			_c.show();

			if (!/^[0-9\.]+$/.test(_ip ?? "")) {
				_c.appendLine("请先链接设备, 使用ctrl+shift+p再点击`NekoPaw: 链接手机ip`");
				vscode.window.showInformationMessage("请先链接设备, 使用ctrl+shift+p再点击`NekoPaw: 链接手机ip`");
				return;
			}

			let editor = vscode.window.activeTextEditor;
			let text = editor?.document.getText();

			var client = new WebSocketClient();
			client.on('connectFailed', function (error) {
				_c.appendLine('Connect Error: ' + error.toString());
			});

			client.on('connect', function (connection) {
				connection.on('error', function (error) {
					_c.appendLine("连接出错: " + error.toString());
				});
				connection.on('close', function () {
					_c.appendLine('连接已关闭');
				});
				connection.on('message', function (message) {
					if (message.type === 'utf8') {
						_c.appendLine(message.utf8Data ?? "");
					}
				});
				function sendJS() {
					if (connection.connected && text) {
						_c.appendLine('--开始运行--');
						connection.sendUTF(';env_web_socket = true;' + text + ';env_web_socket = undefined;');
					}
				}
				sendJS();
			});
			client.connect(`ws://${_ip}:52345/runJS`, 'echo-protocol');
		}),
	]);
}

// this method is called when your extension is deactivated
export function deactivate() { }
