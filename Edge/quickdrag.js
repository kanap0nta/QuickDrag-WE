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

	if("[object HTMLImageElement]" === e.srcElement.toString()){
		g_IsImage = true;
		g_SelectStr = e.srcElement.currentSrc.toString();
	} else {
		if (true === isURL(e.dataTransfer.getData("text/plain"))) {
			g_SelectStr = e.dataTransfer.getData("text/plain");
			g_SelectStr = g_SelectStr.replace(/^(?:t?t|h[tx]{2,})p(s?:\/\/)/i, "http$1");

			if (/^[\w\.\+\-]+@[\w\.\-]+\.[\w\-]{2,}$/.test(g_SelectStr))
				g_SelectStr = "mailto:" + g_SelectStr;

		} else {
			g_SelectStr = "https://www.google.co.jp/search?source=hp&q=" + e.dataTransfer.getData("text/plain");
		}
	}
}

// ドラッグ中
function handleDragOver(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}
	// ドラッグ中のアイコンを変える
	e.dataTransfer.dropEffect = 'move';

	return false;
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
		anchor.click();
	} else {
		// タブを開く場合
		// background.jsにメッセージを送信
		browser.runtime.sendMessage (
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

// ドロップ
function handleDrop(e) {
	// デフォルトイベントを無効化
	if (e.preventDefault) {
		e.preventDefault();
	}
	return false;
}

document.addEventListener("dragstart", handleDragStart, false);
document.addEventListener("dragover", handleDragOver, false);
document.addEventListener("dragend", handleDragEnd, false);
document.addEventListener("drop", handleDrop, false);