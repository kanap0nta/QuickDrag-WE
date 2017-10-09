// background.js
// quickdrag.jsからメッセージを受信
browser.runtime.onMessage.addListener(
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
	browser.tabs.create({url:value, active: true});
	callback("searchURL:" + value);
}
