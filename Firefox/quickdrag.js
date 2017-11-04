// content_script.js

g_SelectStr = "";	// 検索文字列
g_IsImage = false;	// 画像かどうかのフラグ
g_IsAddressSearch = false;	// Webアドレス検索かどうか(true:Webアドレス検索、false:通常検索)
g_settingEngineURL = "http:google.com/search?q=";	// 検索エンジン文字列
g_settingNewTabPosition = "right";	// 新規にタブを開く位置
g_settingIsAddressForground = true;	// Webアドレスをフォアグラウンドタブで開くかどうか
g_settingIsSearchForground = true;	// 検索結果をフォアグラウンドタブで開くかどうか
g_settingIsSaveImage = true;	// ドラッグ＆ドロップで画像を保存するかどうか

// URL判別
function isURL(str) {
	var isURI = false;
	var hasScheme = /^(?:(?:h?tt|hxx)ps?|ftp|chrome|file):\/\//i;
	var hasIP = /(?:^|[\/@])(?:\d{1,3}\.){3}\d{1,3}(?:[:\/\?]|$)/;
	var hasDomain = new RegExp(
		"(?:^|[:\\/\\.@])" +			// starting boundary
		"[a-z0-9](?:[a-z0-9-]*[a-z0-9])" +	// valid second-level name
		"\\.(?:[a-z]{2,13})" +			// valid top-level
		"(?:[:\\/\\?]|$)",			// end boundary
		"i"					// ignore case
	);
	isURI = isURI || hasScheme.test(str);
	isURI = isURI || (!/\s/.test(str) && (hasIP.test(str) || hasDomain.test(str)));
	return isURI;
}

// 設定パラメータ更新 
function updateParam(storage_data) {
	if(!('searchEngine' in storage_data))
	{
		return;
	}
	g_settingEngineURL = getEngineURL(storage_data.searchEngine);
	g_settingNewTabPosition = storage_data.tabPosition;
	g_settingIsAddressForground = storage_data.checkboxArray.indexOf("is_address_forground") >= 0 ? true : false;
	g_settingIsSearchForground = storage_data.checkboxArray.indexOf("is_search_forground") >= 0 ? true : false;
	g_settingIsSaveImage = storage_data.checkboxArray.indexOf("is_save_image") >= 0 ? true : false;
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

// デフォルトイベントを無効化
function eventInvalid(e) {
	if (e.preventDefault) {
		e.preventDefault();
	}
	return false;
}

// ドラッグ開始
function handleDragStart(e) {
	g_IsImage = false;
	g_IsAddressSearch = false;
	g_SelectStr = "";

	if("[object HTMLImageElement]" === e.explicitOriginalTarget.toString()){
		if ("undefined" === typeof e.target.href) {
			g_IsImage = true;
			g_SelectStr = e.explicitOriginalTarget.src.toString();
		} else {
			g_IsAddressSearch = true;
			g_SelectStr = e.target.href;
		}
	} else {
		if (true === isURL(e.dataTransfer.getData("text/plain"))) {
			g_IsAddressSearch = true;
			g_SelectStr = e.dataTransfer.getData("text/plain");
			g_SelectStr = g_SelectStr.replace(/^(?:t?t|h[tx]{2,})p(s?:\/\/)/i, "http$1");

			if (/^[\w\.\+\-]+@[\w\.\-]+\.[\w\-]{2,}$/.test(g_SelectStr))
				g_SelectStr = "mailto:" + g_SelectStr;

			if (!/^[a-z][\da-z+\-]*:/i.test(g_SelectStr))
				g_SelectStr = g_SelectStr.replace(/^:*[\/\\\s]*/, "http://").replace(/^ht(tp:\/\/ftp\.)/i, "f$1");

			if (!/^(?:https?|ftp):/i.test(g_SelectStr))
				return;
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

// ドロップ
function handleDrop(e) {
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
		anchor.style.display = 'none';
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
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
				tab: g_settingNewTabPosition,
		    	},
			// コールバック関数
		    	function (response) {
			        if (response) {
					// response
			        }
		    	}
		);
	}

	eventInvalid(e);
}


browser.storage.local.get(["searchEngine", "tabPosition", "checkboxArray"], function(storage_data){
	updateParam(storage_data);
});
browser.storage.onChanged.addListener(function(storage_data_obj, area) {
	if (area == "local") {
		var storage_data = {
			searchEngine : storage_data_obj.searchEngine.newValue,
			tabPosition : storage_data_obj.tabPosition.newValue,
			checkboxArray : storage_data_obj.checkboxArray.newValue
		}
		updateParam(storage_data);
	}
});
document.addEventListener("dragstart", handleDragStart, false);
document.addEventListener("dragover", handleDragOver, false);
document.addEventListener("dragend", eventInvalid, false);
document.addEventListener("drop", handleDrop, false);