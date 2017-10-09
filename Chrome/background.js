// background.js
// quickdrag.jsからメッセージを受信
chrome.runtime.onMessage.addListener(
function (request, sender, sendResponse) {
	switch (request.type) {
		case 'searchURL':
			searchURL(request.value, sendResponse);
			break;
		default:
			// console.log("unknown type");
			// console.log(request);
			break;
		}
	}
);

// タブを開く
function searchURL(value, callback) {
	chrome.tabs.create({url:value, active: true});
	callback("searchURL:" + value);
}
