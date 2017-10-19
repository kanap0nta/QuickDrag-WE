// language.js
// 言語設定
function setLanguage(language) {
	var lang_set_flag = false;
	for (var language_tbl in obj) {
		if(language_tbl === language[0]) {
			document.getElementById("setting-title").textContent = obj[language_tbl]["setting_title"];
			document.getElementById("engine-title").textContent = obj[language_tbl]["engine_title"];
			document.getElementById("is-address-forground").textContent = obj[language_tbl]["is_address_forground"];
			document.getElementById("is-search-forground").textContent = obj[language_tbl]["is_search_forground"];
			document.getElementById("is-save-image").textContent = obj[language_tbl]["is_save_image"];
			document.getElementById("save-button").value = obj[language_tbl]["save_button"];
			lang_set_flag = true;
			break;
		}
	}

	if(false === lang_set_flag) {
		document.getElementById("setting-title").textContent = obj["en"]["setting_title"];
		document.getElementById("engine-title").textContent = obj["en"]["engine_title"];
		document.getElementById("is-address-forground").textContent = obj["en"]["is_address_forground"];
		document.getElementById("is-search-forground").textContent = obj["en"]["is_search_forground"];
		document.getElementById("is-save-image").textContent = obj["en"]["is_save_image"];
		document.getElementById("save-button").value = obj["en"]["save_button"];
	}
}

var gettingAcceptLanguages = browser.i18n.getAcceptLanguages();
gettingAcceptLanguages.then(setLanguage);

// 翻訳テーブル
var obj = {
/* テーブルフォーマット
	"":{
		setting_title		:"",
		engine_title		:" ",
		is_address_forground	:" ",
		is_search_forground	:" ",
		is_save_image		:" ",
		save_button		:""
	},
*/
	"en":{
		setting_title		:"QuickDrag Settings",
		engine_title		:"Search engine ",
		is_address_forground	:" Open tabs for web addresses in the foreground",
		is_search_forground	:" Open tabs for text searches in the foreground",
		is_save_image		:" Use drag-and-drop to download images",
		save_button		:"Save"
	},
	"zh-CN":{
		setting_title		:"QuickDrag 选项",
		engine_title		:"搜索引擎 ",
		is_address_forground	:" 在前台标签页中打开链接",
		is_search_forground	:" 在前台标签页中搜索",
		is_save_image		:" 启用鼠标拖拽下载图片",
		save_button		:"保存"
	},
	"zh-tw":{
		setting_title		:"QuickDrag 設定",
		engine_title		:"搜索引擎 ",
		is_address_forground	:" 用新分頁開啟鏈結後自動切換至該分頁",
		is_search_forground	:" 用新分頁開啟搜尋後自動切換至該分頁",
		is_save_image		:" 使用滑鼠拖放下載圖片",
		save_button		:"保存"
	},
	"de":{
		setting_title		:"QuickDrag Einstellungen",
		engine_title		:"Suchmaschine ",
		is_address_forground	:" Tabs für Webadressen im Vordergrund öffnen",
		is_search_forground	:" Tabs zur Textsuche im Vordergrund öffnen",
		is_save_image		:" Drag-and-Drop verwenden, um Bilder herunter zu laden",
		save_button		:"Sparen"
	},
	"ko-kr":{
		setting_title		:"퀵드래그 설정",
		engine_title		:"검색 엔진 ",
		is_address_forground	:" 선택한 웹 주소를 활성화된 탭으로 열기",
		is_search_forground	:" 선택한 텍스트를 활성화된 탭으로 검색하기",
		is_save_image		:" 끌어다 놓기로 그림을 다른 이름으로 저장하기",
		save_button		:"구하다"
	},
	"ru-RU":{
		setting_title		:"Настройки QuickDrag",
		engine_title		:"Поисковый движок ",
		is_address_forground	:" Загружать обычные и текстовые ссылки в новой активной вкладке",
		is_search_forground	:" Загружать поисковые запросы в новой активной вкладке",
		is_save_image		:" Использовать drag&apos;n&apos;drop для сохранения изображений",
		save_button		:"Спасти"
	},
	"fr":{
		setting_title		:"Paramètres de QuickDrag",
		engine_title		:"Moteur de recherche ",
		is_address_forground	:" Ouvrir les onglets des adresses Web au premier-plan",
		is_search_forground	:" Ouvrir les onglets des recherches de texte au premier-plan",
		is_save_image		:" Utiliser le glisser-déposer pour télécharger des images",
		save_button		:"Sauvegarder"
	},
	"it-IT":{
		setting_title		:"Opzioni di QuickDrag",
		engine_title		:"Motore di ricerca ",
		is_address_forground	:" Carica i link testuali in schede in primo piano",
		is_search_forground	:" Carica i risultati di ricerca in schede in primo piano",
		is_save_image		:" Trascina le immagini per avviarne il download",
		save_button		:"Salvare"
	},
	"ja":{
		setting_title		:"QuickDrag 設定",
		engine_title		:"検索エンジン ",
		is_address_forground	:" Webアドレスをフォアグラウンドタブで開く",
		is_search_forground	:" 検索結果をフォアグラウンドタブで開く",
		is_save_image		:" ドラッグ＆ドロップで画像を保存する",
		save_button		:"保存"
	}
};