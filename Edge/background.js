// background.js
// quickdrag.jsからメッセージを受信
browser.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
	switch (request.type) {
		case 'searchURL':
			searchURL(request, sendResponse);
			break;
		default:
			// console.log("unknown type");
			// console.log(request);
			break;
		}
	}
);

// アクティブなタブを取得
function getActiveTabIndex(tabs) {
	for (var tab of tabs) {
		if (tab.active) {
			return tab.index;
		}
	}
}

// タブを開く
function searchURL(request, callback) {
	browser.tabs.query( {currentWindow: true}, function (tabs) {
		var openIndex = getActiveTabIndex(tabs) + 1;
		browser.tabs.create({url:request.value, active: request.isforground, index: openIndex});
		callback("searchURL:" + request.value);
	});
}
