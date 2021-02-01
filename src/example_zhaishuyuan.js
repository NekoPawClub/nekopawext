// 需要传递到外部的数据(必要)
var baseObject = {
	info: {
		origin: 'https://www.zhaishuyuan.com',
		type: 'book',
		site: '💮斋书苑',
		group: '更新快;无错字'
	},
	search: [{ title: '书名', author: '作者', intro: '简介', tag: '分类', count: '字数', img: '封面', date: '更新日期', last: '最新章节', url: '详情页' }],
	detail: { title: '书名', author: '作者', intro: '简介', tag: '分类', count: '字数', img: '封面', date: '更新日期', last: '最新章节', url: '目录页' },
	chapter: [{ title: '标题', time: '更新日期', url: '正文页' }],
	context: ''
};

var debugTime = new Date();
var printLog = (msg, start) => {
	let thisTime = new Date();
	if (start) debugTime = thisTime;
	console.info(new Date(thisTime - debugTime).format('[mm:ss.fff]') + msg);
};

// 判断详情页(暂存搜索页结果)
var isDetailHtml = '';

// 搜索页
function search(searchKey) {
	printLog(`开始搜索关键字 ${searchKey}`, true);
	let response = fetch(`${baseObject.info.origin}/search/`, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: `key=${encodeURI(searchKey, 'gbk')}`
	});
	let html = response.text();
	printLog(`成功获取搜索结果`);

	let document = new Document(html);
	baseObject.search = [];
	let searchList = document.querySelectorAll('#sitembox dl');
	let titleList = searchList.queryAllText('h3>a');
	printLog(`解析到 ${titleList.length} 个结果`);
	if (titleList.length == 0) {
		isDetailHtml = html;
		baseObject.search.push({ url: response.finalUrl });
		printLog(`尝试作为详情页解析`);
		return;
	}
	let authorList = searchList.queryAllText('span:nth-child(1)');
	let introList = searchList.queryAllText('.book_des');
	let tagList = searchList.queryAllText('span:nth-child(3)');
	let countList = searchList.queryAllText('span:nth-child(4)');
	let imgList = searchList.queryAllAttr('img', '_src');
	let dateList = searchList.queryAllText('dd:last-child>span');
	let lastList = searchList.queryAllText('dd:last-child>a');
	let urlList = searchList.queryAllAttr('dt>a', 'href');
	for (let i = 0, n = titleList.length; i < n; ++i) {
		baseObject.search.push({
			title: titleList[i],
			author: authorList[i],
			intro: introList[i],
			tag: tagList[i],
			count: countList[i],
			img: imgList[i],
			date: dateList[i],
			last: lastList[i],
			url: urlList[i]
		});
	}
	printLog(`搜索页解析完成\n${JSON.stringify(baseObject.search[0])}\n`);
}

// 详情页
function detail(url) {
	let html = isDetailHtml;
	isDetailHtml = ''; // 跳转标志使用后清空
	if (!html) {
		printLog(`开始获取详情页 ${url}`);
		let response = fetch(url);
		html = response.text();
	}
	printLog(`成功获取详情页`);

	let document = new Document(html);
	baseObject.detail = {
		title: document.queryAttr('[property="og:novel:book_name"]', 'content'),
		author: document.queryAttr('[property="og:novel:author"]', 'content'),
		intro: document.queryText('#bookintro'),
		tag: document.queryAttr('[property="og:novel:category"]', 'content'),
		count: document.queryText('.count li:last-child>span'),
		img: document.queryAttr('[property="og:image"]', 'content'),
		date: document.queryAttr('[property="og:novel:update_time"]', 'content'),
		last: document.queryAttr('[property="og:novel:latest_chapter_name"]', 'content'),
		url: document.queryAttr('[property="og:novel:read_url"]', 'content')
	};
	isDetail = '';
	printLog(`详情页解析完成\n${JSON.stringify(baseObject.detail)}\n`);
}

// 目录页
function chapter(url) {
	printLog(`开始获取目录页 ${url}`);
	let response = fetch(url);
	let html = response.text();
	//let document = new Document(html);
	printLog(`成功获取目录页`);

	let bid = parseInt(html.match(/data-bid="(\d+)/)[1]);
	let reg = 'href="/chapter/[^/]+/([^"]+)[^>]+>([^<]+)[^>]+>([^<]+)';
	baseObject.chapters = html.match(new RegExp(reg, 'g')).map((item) => {
		let ret = item.match(reg);
		return { cN: ret[2], uT: ret[3].trim(), id: parseInt(ret[1]) + bid };
	});
	let hider = html.match(/查看隐藏章节[^<]+/);
	if (hider) {
		let p = Math.ceil(hider[0].match(/\d+/)[0] / 900);
		printLog(`开始获取隐藏章节,共 ${p} 页`);
		// 并发请求
		let fetchList = [];
		for (let i = 1; i <= p; ++i) {
			fetchList.push([
				`https://www.zhaishuyuan.com/api/`,
				{
					method: 'POST',
					headers: { 'content-type': 'application/x-www-form-urlencoded' },
					body: `action=list&bid=${bid}&page=${i}`
				}
			]);
		}
		let bArr = fetchAll(fetchList, 5); // fetchAll返回请求结果组成的数组,允许重试5次
		bArr.forEach((b, i) => {
			if (b) Array.prototype.push.apply(baseObject.chapters, JSON.parse(b).data);
			else printLog(`第 ${i} 页请求失败!`);
		});
		printLog(`成功获取隐藏章节`);
	}
	baseObject.chapters = baseObject.chapters
		.sort((a, b) => (a.id < b.id ? -1 : 1))
		.map((item) => {
			item.id = '/chapter/' + bid + '/' + (item.id - bid);
			return { title: item.cN, time: item.uT, url: item.id };
		});
	printLog(`目录页解析完成,共 ${baseObject.chapters.length} 章\n第一章: ${JSON.stringify(baseObject.chapters[0])}\n`);
}

// 正文页
function context(url) {
	printLog(`开始获取正文页 ${url}`);
	let response = fetch(url);
	let html = response.text();
	printLog(`成功获取正文页`);

	let document = new Document(html);
	$ = (s) => document.select(s);
	let f = html.match(/function getDecode[^<]+/);
	if (f) {
		eval(f[0]);
		getDecode();
		printLog(`成功解密内容`);
	}
	baseObject.context =
		`　　` +
		document
			.queryAllText('#content p')
			.map((w) => w.trim())
			.join(`\n　　`);
	printLog(`正文解析完成\n${baseObject.context}`);
}

// 需要交给App调用的任务链(必要)
step = [(sKey) => search(sKey), () => detail(baseObject.info.origin + baseObject.search[0].url), () => chapter(baseObject.detail.url), () => context(baseObject.info.origin + baseObject.chapters[0].url)];

// Debug
step[0]('邪王追妻');
for (let i = 1; i < step.length; ++i)step[i]();