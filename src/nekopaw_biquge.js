
var run_in_websoket = typeof env_web_socket !== 'undefined'

var reT = new Date().valueOf();
search('读书')

function prefixInteger(num) {
    let s = ('000000' + num).slice(-5);
    return s.substring(0, 2) + '.' + s.slice(-3);
}

function print(...args) {
    if (run_in_websoket)
        WebSocketPrint(`[${prefixInteger(new Date().valueOf() - reT)}] ${args.join()} `)
    else
        console.info(args.join())
}


var host = 'http://www.xbiquge.la/';
function search(searchKey) {
    let response = fetch(`http://www.xbiquge.la/modules/article/waps.php`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `searchkey=%E7%BB%8F`
    });
    let html = response.text();
    print(html)

    let document = new Document(html);
    print('成功获取结果');

    let searchList = document.querySelectorAll('#sitembox dl');
    let titleList = searchList.queryAllText('h3>a');
    print(`解析到 ${titleList.length} 个结果`);
}