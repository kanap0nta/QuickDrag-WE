// background.js
// quickdrag.jsからメッセージを受信
chrome.runtime.onMessage.addListener(
	function (request, sender, sendResponse) {
		switch (request.type) {
		case 'searchURL':
			searchURL(request, sender, sendResponse);
			break;
		case 'downloadImage':
			downloadImage(request, sender, sendResponse);
			break;
		default:
			// console.log("unknown type");
			// console.log(request);
			break;
		}
	}
);

// アクティブなタブの情報を取得
function getActiveTabInfo(tabs) {
console.log(tabs);
	for (var tab of tabs) {
		if (tab.active) {
			return { openIndex: tab.index,
				 openId: tab.id
			};
		}
	}
}

// タブを開く
function searchURL(request, sender, callback) {
	chrome.tabs.query({
		currentWindow: true
	}, function (tabs) {
		switch (request.tab) {
		case 'right':
			var { openIndex, openId } = getActiveTabInfo(tabs);
			openIndex += + 1;
			chrome.tabs.create({
				url: request.value,
				active: request.isforground,
				index: openIndex,
				openerTabId: openId
			});
			break;
		case 'left':
			var { openIndex, openId } = getActiveTabInfo(tabs);
			chrome.tabs.create({
				url: request.value,
				active: request.isforground,
				index: openIndex,
				openerTabId: openId
			});
			break;
		case 'last':
			chrome.tabs.create({
				url: request.value,
				active: request.isforground
			});
			break;
		case 'first':
			var openIndex = 0;
			chrome.tabs.create({
				url: request.value,
				active: request.isforground,
				index: openIndex
			});
			break;
		default:
			chrome.tabs.create({
				url: request.value,
				active: request.isforground
			});
			break;
		}
		callback("searchURL:" + request.value);
	});
}

// 画像を保存
function downloadImage(request, sender, callback) {
	var downloading = chrome.downloads.download({
		url: request.value,
		saveAs: true,
		conflictAction: "overwrite"
	});
	callback("downloadImage:" + downloading);
}