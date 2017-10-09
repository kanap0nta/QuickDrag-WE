// content_script.js

g_SelectStr = "";
g_IsImage = false;

// URL判別
function isURL(str) {
	var isURI = false;
	var hasScheme = /^(?:(?:h?tt|hxx)ps?|ftp|chrome|file):\/\//i;
	var hasIP = /(?:^|[\/@])(?:\d{1,3}\.){3}\d{1,3}(?:[:\/\?]|$)/;
	var hasDomain = new RegExp(
		// starting boundary
		"(?:^|[:\\/\\.@])" +
		// valid second-level name
		"[a-z0-9](?:[a-z0-9-]*[a-z0-9])" +
		// valid top-level name: ccTLDs + hard-coded [gs]TLDs
		"\\.(?:[a-z]{2}|aero|asia|biz|cat|com|coop|edu|gov|info|int|jobs|mil|mobi|museum|name|net|onion|org|pro|tel|travel|xxx)" +
		// end boundary
		"(?:[:\\/\\?]|$)",
		// ignore case
		"i"
	);
	isURI = isURI || hasScheme.test(str);
	isURI = isURI || (!/\s/.test(str) && (hasIP.test(str) || hasDomain.test(str)));
	return isURI;
}

// ドラッグ開始
function handleDragStart(e) {
	g_IsImage = false;
	g_SelectStr = "";

	if("[object HTMLImageElement]" === e.explicitOriginalTarget.toString()){
		g_IsImage = true;
		g_SelectStr = e.explicitOriginalTarget.src.toString();
	} else {
		if (true === isURL(e.dataTransfer.getData("text/plain"))) {
			g_SelectStr = e.dataTransfer.getData("text/plain");
			g_SelectStr = g_SelectStr.replace(/^(?:t?t|h[tx]{2,})p(s?:\/\/)/i, "http$1");

			if (/^[\w\.\+\-]+@[\w\.\-]+\.[\w\-]{2,}$/.test(g_SelectStr))
				g_SelectStr = "mailto:" + g_SelectStr;

		} else {
			g_SelectStr = "http:google.com/search?q=" + e.dataTransfer.getData("text/plain");
		}
	}
}

// ドラッグ終了
function handleDragEnd(e) {
	if("" === g_SelectStr) {
		return;
	}

	if(true === g_IsImage) {
		// 画像の場合
		var anchor = document.createElement('a');
		anchor.href = g_SelectStr;
		anchor.download = '';
		anchor.style.display = 'none';
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	} else {
		// タブを開く場合
		// background.jsにメッセージを送信
		chrome.runtime.sendMessage (
			{
				type: 'searchURL',
				value: g_SelectStr,
		    	},
			// コールバック関数
		    	function (response) {
			        if (response) {
					// response
			        }
		    	}
		);
	}
}

document.addEventListener("dragstart", handleDragStart, false);
document.addEventListener("dragend", handleDragEnd, false);
