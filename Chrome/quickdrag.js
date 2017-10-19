// content_script.js

g_SelectStr = "";	// 検索文字列
g_IsImage = false;	// 画像かどうかのフラグ
g_IsAddressSearch = false;	// Webアドレス検索かどうか(true:Webアドレス検索、false:通常検索)
g_settingEngineURL = "http:google.com/search?q=";	// 検索エンジン文字列
g_settingIsAddressForground = true;	// Webアドレスをフォアグラウンドタブで開くかどうか
g_settingIsSearchForground = true;	// 検索結果をフォアグラウンドタブで開くかどうか
g_settingIsSaveImage = true;	// ドラッグ＆ドロップで画像を保存するかどうか

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

// 設定パラメータ更新 (検索エンジン)
function updateParamEngine(storage_data) {
	g_settingEngineURL = getEngineURL(storage_data);
}

// 設定パラメータ更新 (チェックボックス)
function updateParamcheckboxArray(storage_data) {
	g_settingIsAddressForground = storage_data.indexOf("is_address_forground") >= 0 ? true : false;
	g_settingIsSearchForground = storage_data.indexOf("is_search_forground") >= 0 ? true : false;
	g_settingIsSaveImage = storage_data.indexOf("is_save_image") >= 0 ? true : false;
}

// 検索エンジン文字列取得
function getEngineURL(selectedEngine) {
	const url = {
		google: ()	=>	{ return "http:google.com/search?q=" },
		bing: ()	=>	{ return "https://www.bing.com/search?q=" },
		baidu: ()	=>	{ return "http://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&rsv_idx=1&tn=baidu&wd=" },
		yandex: ()	=>	{ return "https://www.yandex.com/search/?text=" },
		yandex_ru: ()	=>	{ return "https://yandex.ru/search/?text=" },
		yahoo_com: ()	=>	{ return "https://search.yahoo.com/search?p=" },
		yahoo_japan: ()	=>	{ return "https://search.yahoo.co.jp/search?p=" },
		naver: ()	=>	{ return "https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=1&ie=utf8&query=" },
		duckduckgo: ()	=>	{ return "https://duckduckgo.com/?q=" },
		so: ()		=>	{ return "https://www.so.com/s?q=" },
		ask: ()		=>	{ return "https://www.ask.com/web?q=" },
	}
	return url[selectedEngine].call();
}

// ドラッグ開始
function handleDragStart(e) {
	g_IsImage = false;
	g_IsAddressSearch = false;
	g_SelectStr = "";

	if("[object HTMLImageElement]" === e.srcElement.toString()){
		g_IsImage = true;
		g_SelectStr = e.srcElement.currentSrc.toString();
		for (var i = 0; i < e.path.length; i++) {
			if('A' === e.path[i].nodeName) {
				g_IsImage = false;
				g_IsAddressSearch = true;
				g_SelectStr = e.path[i].href;
				break;
			}
		}
	} else {
		if (true === isURL(e.dataTransfer.getData("text/plain"))) {
			g_IsAddressSearch = true;
			g_SelectStr = e.dataTransfer.getData("text/plain");
			g_SelectStr = g_SelectStr.replace(/^(?:t?t|h[tx]{2,})p(s?:\/\/)/i, "http$1");

			if (/^[\w\.\+\-]+@[\w\.\-]+\.[\w\-]{2,}$/.test(g_SelectStr))
				g_SelectStr = "mailto:" + g_SelectStr;

		} else {
			g_SelectStr = g_settingEngineURL + e.dataTransfer.getData("text/plain");
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
		if(false === g_settingIsSaveImage) {
			return;
		}
		var anchor = document.createElement('a');
		anchor.href = g_SelectStr;
		anchor.download = '';
		anchor.click();
	} else {
		// タブを開く場合
		var isforground = true;
		if(g_IsAddressSearch) {
			isforground = g_settingIsAddressForground;
		} else {
			isforground = g_settingIsSearchForground;
		}
		// background.jsにメッセージを送信
		chrome.runtime.sendMessage (
			{
				type: 'searchURL',
				value: g_SelectStr,
				isforground: isforground,
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


chrome.storage.local.get(["searchEngine", "checkboxArray"], function(storage_data){
		if('searchEngine' in storage_data) {
			updateParamEngine(storage_data.searchEngine);
		}

		if('checkboxArray' in storage_data) {
			updateParamcheckboxArray(storage_data.checkboxArray);
		}
});
chrome.storage.onChanged.addListener(function(storage_data_obj, area) {
	if (area == "local") {
		if('searchEngine' in storage_data_obj) {
			updateParamEngine(storage_data_obj.searchEngine.newValue);
		}

		if('checkboxArray' in storage_data_obj) {
			updateParamcheckboxArray(storage_data_obj.checkboxArray.newValue);
		}
	}
});
document.addEventListener("dragstart", handleDragStart, false);
document.addEventListener("dragover", handleDragOver, false);
document.addEventListener("dragend", handleDragEnd, false);
document.addEventListener("drop", handleDrop, false);