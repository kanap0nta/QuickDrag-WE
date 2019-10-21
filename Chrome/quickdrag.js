g_SelectStr = ""; // 検索文字列
g_IsImage = false; // 画像かどうかのフラグ
g_IsBase64 = false; // Base64でエンコードされているか
g_IsAddressSearch = false; // Webアドレス検索かどうか(true:Webアドレス検索、false:通常検索)
g_settingEngineURL = "https://www.google.com/search?q="; // 検索エンジン文字列
g_settingNewTabPosition = "right"; // 新規にタブを開く位置
g_settingIsAddressForground = true; // Webアドレスをフォアグラウンドタブで開くかどうか
g_settingIsSearchForground = true; // 検索結果をフォアグラウンドタブで開くかどうか
g_settingIsSaveImage = true; // ドラッグ＆ドロップで画像を保存するかどうか
g_settingIsPreferSaveImage = true; // ドリンク付き画像の場合、画像保存を優先するかどうか

// URL判別
function isURL(str) {
	var isURI = false;
	var hasScheme = /^(?:(?:( +)?h?tt|hxx)ps?|ftp|chrome|file):\/\//i;
	var hasIP = /(?:^|[\/@])(?:\d{1,3}\.){3}\d{1,3}(?:[:\/\?]|$)/;
	var hasDomain = new RegExp(
		"(?:^|[:\\/\\.@])" + // starting boundary
		"[a-z0-9](?:[a-z0-9-]*[a-z0-9])" + // valid second-level name
		"\\.(?:[a-z]{2}|com|net|org|info|biz|name|pro|aero|coop|museum|jobs|travel|mail|cat|post|asia|mobi|tel|xxx|int|gov|mil|edu|arpa|example|invalid|localhost|test|onion)" + // valid top-level
		"(?:[:\\/\\?]|$)", // end boundary
		"i" // ignore case
	);
	isURI = isURI || hasScheme.test(str);
	isURI = isURI || (!/\s/.test(str) && (hasIP.test(str) || hasDomain.test(str)));
	return isURI;
}

// 設定パラメータ更新 (検索エンジン)
function updateParamEngine(storage_data) {
	g_settingEngineURL = getEngineURL(storage_data);
}

// 設定パラメータ更新 (新規タブ位置)
function updateNewTabPosition(storage_data) {
	g_settingNewTabPosition = storage_data;
}

// 設定パラメータ更新 (チェックボックス)
function updateParamcheckboxArray(storage_data) {
	g_settingIsAddressForground = storage_data.indexOf("is_address_forground") >= 0 ? true : false;
	g_settingIsSearchForground = storage_data.indexOf("is_search_forground") >= 0 ? true : false;
	g_settingIsSaveImage = storage_data.indexOf("is_save_image") >= 0 ? true : false;
	g_settingIsPreferSaveImage = storage_data.indexOf("is_prefer_save_image") >= 0 ? true : false;
}

// 検索エンジン文字列取得
function getEngineURL(selectedEngine) {
	const url = {
		google: ()	=>	{ return "https://www.google.com/search?q=" },
		bing: ()	=>	{ return "https://www.bing.com/search?q=" },
		baidu: ()	=>	{ return "https://www.baidu.com/s?ie=utf-8&wd=" },
		yandex: ()	=>	{ return "https://www.yandex.com/search/?text=" },
		yandex_ru: ()	=>	{ return "https://yandex.ru/search/?text=" },
		yahoo_com: ()	=>	{ return "https://search.yahoo.com/search?p=" },
		yahoo_japan: ()	=>	{ return "https://search.yahoo.co.jp/search?p=" },
		naver: ()	=>	{ return "https://search.naver.com/search.naver?&ie=utf8&query=" },
		duckduckgo: ()	=>	{ return "https://duckduckgo.com/?q=" },
		so: ()		=>	{ return "https://www.so.com/s?q=" },
		ask: ()		=>	{ return "https://www.ask.com/web?q=" },
	}
	return url[selectedEngine].call();
}

// デフォルトイベントを無効化
function eventInvalid(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}
}

// メッセージ受信
function receiveMessage(e) {
	if (null != e.data.message_addon) {
		if ("quickdrag_we_set_str" === e.data.message_addon) {
			g_SelectStr = e.data.SelectStr;
			g_IsImage = e.data.IsImage;
			g_IsBase64 = e.data.IsBase64;
			g_IsAddressSearch = e.data.IsAddressSearch;
		}
	}
}

// メッセージ送信
function sendMessage(send_data, is_image, is_base64, is_address_search) {
	if (window !== window.top) {
		// ドラッグ先のウインドウがトップウインドウでない場合
		window.top.postMessage({
			message_addon: "quickdrag_we_set_str",
			SelectStr: send_data,
			IsImage: is_image,
			IsBase64: is_base64,
			IsAddressSearch: is_address_search
		}, '*');
	} else {
		// トップウインドウの場合
		var frames = document.getElementsByTagName('frame');
		for (var i = 0; i < frames.length; i++) {
			frames[i].contentWindow.postMessage({
				message_addon: "quickdrag_we_set_str",
				SelectStr: send_data,
				IsImage: is_image,
				IsBase64: is_base64,
				IsAddressSearch: is_address_search
			}, '*');
		}

		var iframes = document.getElementsByTagName('iframe');
		for (var i = 0; i < iframes.length; i++) {
			iframes[i].contentWindow.postMessage({
				message_addon: "quickdrag_we_set_str",
				SelectStr: send_data,
				IsImage: is_image,
				IsBase64: is_base64,
				IsAddressSearch: is_address_search
			}, '*');
		}
	}
}

// ドラッグ開始
function handleDragStart(e) {
	g_IsImage = false;
	g_IsBase64 = false;
	g_IsAddressSearch = false;
	g_SelectStr = "";

	if ("[object HTMLImageElement]" === e.srcElement.toString()) {
		g_IsImage = true;
		g_SelectStr = e.srcElement.currentSrc.toString();
		for (var i = 0; i < e.path.length; i++) {
			if ('A' === e.path[i].nodeName && false === g_settingIsPreferSaveImage) {
				g_IsImage = false;
				g_IsAddressSearch = true;
				g_SelectStr = e.path[i].href;
				break;
			}
		}
		if (true === g_IsImage) {
			var hasScheme = /^(?:(?:( +)?h?tt|hxx)ps?|ftp|chrome|file):\/\//i;
			if (false === hasScheme.test(g_SelectStr)) {
				g_IsBase64 = true;
			}
		}
	} else {
		if (true === isURL(e.dataTransfer.getData("text/plain"))) {
			g_IsAddressSearch = true;
			g_SelectStr = e.dataTransfer.getData("text/plain");
			g_SelectStr = g_SelectStr.replace(/^ +/i, "");
			g_SelectStr = g_SelectStr.replace(/^(?:t?t|h[tx]{2,})p(s?:\/\/)/i, "http$1");

			if (/^[\w\.\+\-]+@[\w\.\-]+\.[\w\-]{2,}$/.test(g_SelectStr))
				g_SelectStr = "mailto:" + g_SelectStr;

			if (!/^[a-z][\da-z+\-]*:/i.test(g_SelectStr))
				g_SelectStr = g_SelectStr.replace(/^:*[\/\\\s]*/, "http://").replace(/^ht(tp:\/\/ftp\.)/i, "f$1");

			if (!/^(?:https?|ftp):/i.test(g_SelectStr))
				return;
		} else {
			g_SelectStr = encodeURIComponent(e.dataTransfer.getData("text/plain"));
			g_SelectStr = g_settingEngineURL + g_SelectStr;
		}
	}

	sendMessage(g_SelectStr, g_IsImage, g_IsBase64, g_IsAddressSearch);
}


// ドラッグオーバー
function handleDragOver(e) {
	if ("INPUT" === e.target.nodeName.toString() || "TEXTAREA" === e.target.nodeName.toString()) {
		return;
	}

	eventInvalid(e);
}

// ドロップ
function handleDrop(e) {
	if ("INPUT" === e.target.nodeName.toString() || "TEXTAREA" === e.target.nodeName.toString()) {
		return;
	}

	eventInvalid(e);

	if ("" === g_SelectStr) {
		return;
	}

	if (true === g_IsImage) {
		// 画像の場合
		if (false === g_settingIsSaveImage) {
			return;
		}
		if (true === g_IsBase64) {
			var anchor = document.createElement('a');
			anchor.href = g_SelectStr;
			anchor.download = '';
			anchor.click();
		} else {
			// background.jsにメッセージを送信
			chrome.runtime.sendMessage({
					type: 'downloadImage',
					value: g_SelectStr,
					isforground: isforground,
					tab: g_settingNewTabPosition,
				},
				// コールバック関数
				function (response) {
					if (response) {
						// response
					}
				});
		}
	} else {
		// タブを開く場合
		var isforground = true;
		if (g_IsAddressSearch) {
			isforground = g_settingIsAddressForground;
		} else {
			isforground = g_settingIsSearchForground;
		}
		// background.jsにメッセージを送信
		chrome.runtime.sendMessage({
				type: 'searchURL',
				value: g_SelectStr,
				isforground: isforground,
				tab: g_settingNewTabPosition,
			},
			// コールバック関数
			function (response) {
				if (response) {
					// response
				}
			});
	}
}


chrome.storage.local.get(["searchEngine", "tabPosition", "checkboxArray"], function (storage_data) {
	if ('searchEngine' in storage_data) {
		updateParamEngine(storage_data.searchEngine);
	}

	if ('tabPosition' in storage_data) {
		updateNewTabPosition(storage_data.tabPosition);
	}

	if ('checkboxArray' in storage_data) {
		updateParamcheckboxArray(storage_data.checkboxArray);
	}
});
chrome.storage.onChanged.addListener(function (storage_data_obj, area) {
	if (area == "local") {
		if ('searchEngine' in storage_data_obj) {
			updateParamEngine(storage_data_obj.searchEngine.newValue);
		}

		if ('tabPosition' in storage_data_obj) {
			updateNewTabPosition(storage_data_obj.tabPosition.newValue);
		}

		if ('checkboxArray' in storage_data_obj) {
			updateParamcheckboxArray(storage_data_obj.checkboxArray.newValue);
		}
	}
});
document.addEventListener("dragstart", handleDragStart, false);
document.addEventListener("dragover", handleDragOver, false);
document.addEventListener("dragend", eventInvalid, false);
document.addEventListener("drop", handleDrop, false);
window.addEventListener('message', receiveMessage, false);
var iframes = document.getElementsByTagName('iframe');
for (var i = 0; i < iframes.length; i++) {
	iframes[i].onload = function () {
		iframes[i].addEventListener('message', receiveMessage, false);
	};
}

var frames = document.getElementsByTagName('frame');
for (var i = 0; i < frames.length; i++) {
	frames[i].onload = function () {
		frames[i].addEventListener('message', receiveMessage, false);
	};
}