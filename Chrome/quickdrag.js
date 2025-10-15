g_SelectStr = ""; // 検索文字列
g_IsImage = false; // 画像かどうかのフラグ
g_IsBase64 = false; // Base64でエンコードされているか
g_IsAddressSearch = false; // Webアドレス検索かどうか(true:Webアドレス検索、false:通常検索)
g_settingEngineURL = "https://www.google.com/search?q="; // 検索エンジン文字列
g_settingNewTabPosition = "right"; // 新規にタブを開く位置
g_settingIsAddressForground = true; // Webアドレスをフォアグラウンドタブで開くかどうか
g_settingIsSearchForground = true; // 検索結果をフォアグラウンドタブで開くかどうか
g_settingIsSaveImage = true; // ドラッグ＆ドロップで画像を保存するかどうか
g_settingIsPreferSaveImage = true; // リンク付き画像の場合、画像保存を優先するかどうか

// Manifest V3 非同期ストレージプリロード
let _qdSettingsReady = false;
let _qdSettingsWaiters = [];

function _qdOnSettingsReady(cb){ _qdSettingsReady ? cb() : _qdSettingsWaiters.push(cb); }

function _qdResolveSettingsReady(){
    _qdSettingsReady = true;
    _qdSettingsWaiters.splice(0).forEach(f=>{ try{ f(); }catch(_e){} });
}
function applySettings(storage_data){
    if(storage_data.searchEngineURL !== undefined) updateParamEngine(storage_data.searchEngineURL);
    if(storage_data.tabPosition !== undefined) updateNewTabPosition(storage_data.tabPosition);
    if(storage_data.checkboxArray !== undefined) updateParamcheckboxArray(storage_data.checkboxArray);
}
function preloadSettings(){
    // chrome.storage は MV3 でも callback なので Promise 化
    new Promise(res => chrome.storage.local.get(
        ["searchEngineURL","tabPosition","checkboxArray"],
        res
    )).then(data => {
        applySettings(data);
    }).finally(_qdResolveSettingsReady);
}
preloadSettings();
chrome.storage.onChanged.addListener((changes, area)=>{
    if(area !== "local") return;
    const diff = {
        searchEngineURL: changes.searchEngineURL && changes.searchEngineURL.newValue,
        tabPosition: changes.tabPosition && changes.tabPosition.newValue,
        checkboxArray: changes.checkboxArray && changes.checkboxArray.newValue
    };
    applySettings(diff);
});

// 設定未読込時に来たドラッグイベントを待たせるためのラッパ
function withSettings(fn){
    return function(e){
        if(_qdSettingsReady){
            return fn(e);
        } else {
            _qdOnSettingsReady(()=>fn(e));
        }
    };
}

// RFC3986判定
function isRFC3986(str) {
	var hasRFC3986 = /^[a-z]([a-z]|[0-9]|[+\-.])*:(\/\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|:)*@)?(\[((([0-9a-f]{1,4}:){6}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|::([0-9a-f]{1,4}:){5}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|([0-9a-f]{1,4})?::([0-9a-f]{1,4}:){4}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:){3}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:){2}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(([0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+\.(([a-z]|[0-9]|[-._~])|[!$&'()*+,;=]|:)+)]|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3}|(([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=])*)(:\d*)?(\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))*)*|\/(((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))+(\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))*)*)?|((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))+(\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))*)*|)(\?((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@])|[\/?])*)?(#((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@])|[\/?])*)?$/i;
	return hasRFC3986.test(str);
}

// QuickDragでの特殊URL判定
function isSpecialURL(str) {
	var isURI = false;
	var hasDomain = new RegExp(
		"(?:^|[:\\/\\.@])" +
		"[a-z0-9](?:[a-z0-9-]*[a-z0-9])" +
		"\\.(?:(?!js)[a-z]{2}|com|net|org|info|biz|name|pro|aero|coop|museum|jobs|travel|mail|cat|post|asia|mobi|tel|xxx|int|gov|mil|edu|arpa|example|invalid|localhost|test|onion)" +
		"(?:[:\\/\\?]|$)",
		"i"
	);
	isURI = isURI || (!/\s/.test(str) && hasDomain.test(str));
	return isURI;
}

// 設定パラメータ更新 (検索エンジン)
function updateParamEngine(storage_data) {
	g_settingEngineURL = storage_data;
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

// デフォルトイベントを無効化
function eventInvalid(e) {
	if (e.preventDefault && false === e.shiftKey) {
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
		for (var i = 0; i < window.top.length; i++) {
			window.top[i].postMessage({
				message_addon: "quickdrag_we_set_str",
				SelectStr: send_data,
				IsImage: is_image,
				IsBase64: is_base64,
				IsAddressSearch: is_address_search
			}, '*');
		}
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

// 検索文字情報初期化
function initStrInfo() {
	g_IsImage = false;
	g_IsBase64 = false;
	g_IsAddressSearch = false;
	g_SelectStr = "";
	sendMessage("", false, false, false);
}

// 親要素のにリンクがある場合その要素を返す
function findFirstLinkParent(node) {
	for (var parent = node.parentElement; parent; parent = parent.parentElement) {
		if (parent.href) {
			return parent;
		}
	}
	return null;
}

// 子要素を再帰的に探索し、画像がある場合その要素を返す
function findFirstImageChild(node) {
    for (var child = node.firstElementChild; child; child = child.nextElementSibling) {
        if (child.constructor && child.constructor.name === "HTMLImageElement") {
            return child;
        }
        var found = findFirstImageChild(child);
        if (found) return found;
    }
    return null;
}

// ドラッグ開始
function handleDragStart(e) {
	initStrInfo();

	if (true === e.shiftKey) {
		return;
	}

	if (/HTML.*Element/.test(e.target.constructor.name)) {
		var target = e.target;
		var isFoundImage = false;

		if ("HTMLImageElement" != e.target.constructor.name) {
			if (true === g_settingIsSaveImage && true === g_settingIsPreferSaveImage) {
				var foundImg = findFirstImageChild(e.target);
				if (foundImg) {
					target = foundImg;
					isFoundImage = true;
				}
			}
		} else {
			if (true === g_settingIsSaveImage && true === g_settingIsPreferSaveImage) {
				isFoundImage = true;
			} else {
				// chrome はリンク付き画像でも HTMLImageElement が取れてしまうため、親要素を確認してリンクが存在しているか確認する
				var foundLink = findFirstLinkParent(e.target);
				if (foundLink) {
					target = foundLink;
				} else {
					isFoundImage = true;
				}
			}
		}

		if (isFoundImage && void 0 === target.href) {
			g_IsImage = true;
			g_SelectStr = target.src;
			var hasScheme = /^(?:(?:( +)?h?tt|hxx)ps?|ftp|chrome|file):\/\//i;
			if (false === hasScheme.test(g_SelectStr)) {
				g_IsBase64 = true;
			}
		} else {
			g_IsAddressSearch = true;
			g_SelectStr = target.href;
		}
	} else {
		if (true === isRFC3986(e.dataTransfer.getData("text/plain").replace(/^ +/i, ""))) {
			g_IsAddressSearch = true;
			g_SelectStr = e.dataTransfer.getData("text/plain").replace(/^ +/i, "");
			g_SelectStr = g_SelectStr.replace(/^(?:t?t|h[tx]{2,})p(s?:\/\/)/i, "http$1");
		} else if (true === isSpecialURL(e.dataTransfer.getData("text/plain").replace(/^ +/i, ""))) {
			g_IsAddressSearch = true;
			g_SelectStr = e.dataTransfer.getData("text/plain").replace(/^ +/i, "");
			if (/^[\w\.\+\-]+@[\w\.\-]+\.[\w\-]{2,}$/.test(g_SelectStr))
				g_SelectStr = "mailto:" + g_SelectStr;

			if (!/^[a-z][\da-z+\-]*:/i.test(g_SelectStr))
				g_SelectStr = g_SelectStr.replace(/^:*[\/\\\s]*/, "http://").replace(/^ht(tp:\/\/ftp\.)/i, "f$1");
		} else {
			g_SelectStr = encodeURIComponent(e.dataTransfer.getData("text/plain"));
			var replace_select_str = g_settingEngineURL.replace("%s", g_SelectStr);
			if (replace_select_str === g_settingEngineURL) {
				g_SelectStr = g_settingEngineURL + g_SelectStr;
			} else {
				g_SelectStr = replace_select_str;
			}
		}
	}

	sendMessage(g_SelectStr, g_IsImage, g_IsBase64, g_IsAddressSearch);
}


// ドラッグオーバー
function handleDragOver(e) {
	if ("INPUT" === e.target.nodeName.toString() || "TEXTAREA" === e.target.nodeName.toString() || true === e.shiftKey) {
		initStrInfo();
		return;
	}

	eventInvalid(e);
}

// ドロップ
function handleDrop(e) {
	if ("INPUT" === e.target.nodeName.toString() || "TEXTAREA" === e.target.nodeName.toString() || true === e.shiftKey) {
		initStrInfo();
		return;
	}

	eventInvalid(e);

	// ウインドウにファイルがドロップされたら無視
	if (e.dataTransfer.items) {
		[...e.dataTransfer.items].forEach((item, i) => {
			if ('file' === item.kind && "" === g_SelectStr) {
				initStrInfo();
				return;
			}
		});
	}

	if ("" === g_SelectStr) {
		initStrInfo();
		return;
	}

	if (true === g_IsImage) {
		// 画像の場合
		if (false === g_settingIsSaveImage) {
			initStrInfo();
			return;
		}
		// Ctrlキーが押されている場合は画像をAPI使わずに保存
		if (true === g_IsBase64 || true === e.ctrlKey) {
			var anchor = document.createElement('a');
			anchor.href = g_SelectStr;
			anchor.download = '';
			anchor.click();
		} else {
			// Altキーが押されている場合は別タブに画像表示
			var message_type = 'downloadImage';
			if (true === e.altKey && false === e.ctrlKey) {
				message_type = 'searchURL';
			}
			// background.jsにメッセージを送信
			chrome.runtime.sendMessage({
				type: message_type,
				value: g_SelectStr,
				isforground: true,
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
		// Ctrlキーが押されている場合はクリップボードにコピー
		if (true === e.ctrlKey) {
			var clip = document.createElement("textarea");
			clip.value = e.dataTransfer.getData("text/plain");
			document.body.appendChild(clip);
			clip.select();
			document.execCommand("copy");
			clip.parentElement.removeChild(clip);
		}
		var message_type = 'searchURL';
		var isforground = true;
		if (g_IsAddressSearch) {
			// リンクでAltキーが押されている場合はダウンロード
			if (true === e.altKey && false === e.ctrlKey) {
				message_type = 'downloadImage';
			}
			isforground = g_settingIsAddressForground;
		} else {
			isforground = g_settingIsSearchForground;
		}
		// background.jsにメッセージを送信
		chrome.runtime.sendMessage({
			type: message_type,
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
	initStrInfo();
}

document.addEventListener("dragstart", withSettings(handleDragStart), false);
document.addEventListener("dragover", withSettings(handleDragOver), false);
document.addEventListener("dragend", eventInvalid, false);
document.addEventListener("drop", withSettings(handleDrop), false);
