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

// タブを開く
function searchURL(request, callback) {
	browser.tabs.create({url:request.value, active: request.isforground});
	callback("searchURL:" + request.value);
}
