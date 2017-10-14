// background.js
// quickdrag.jsからメッセージを受信
chrome.runtime.onMessage.addListener(
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

// タブを開く
function searchURL(request, callback) {
	chrome.tabs.create({url:request.value, active: request.isforground});
	callback("searchURL:" + request.value);
}
