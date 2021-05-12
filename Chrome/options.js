// opeionts.js
// 保存Wrapper
function saveStrage(searchEngine, searchEngineURL, tabPosition, checkboxArray) {
	chrome.storage.local.set({
		'searchEngine': searchEngine,
		'searchEngineURL': searchEngineURL,
		'tabPosition': tabPosition,
		'checkboxArray': checkboxArray
	});
}

// データ保存
function storeSettings() {

	function getEngine() {
		var engine = document.querySelector("#engine");
		return engine.value;
	}

	function getEngineURL() {
		var url = document.querySelector('[name="url"]');
		return url.value;
	}

	function getTabPosition() {
		var tab = document.querySelector("#tab");
		return tab.value;
	}

	function getTypes() {
		let dataTypes = [];
		var checkboxes = document.querySelectorAll(".data-types [type=checkbox]");
		for (let item of checkboxes) {
			if (item.checked) {
				dataTypes.push(item.getAttribute("data-type"));
			}
		}
		return dataTypes;
	}

	const searchEngine = getEngine();
	const searchEngineURL = getEngineURL();
	const tabPosition = getTabPosition();
	const checkboxArray = getTypes();

	saveStrage(searchEngine, searchEngineURL, tabPosition, checkboxArray); // データ保存
}

// UI更新
function updateUI(restoredSettings) {
	if (void 0 === document) {
		// インストール時、データがないためデフォルト値を使用
		const searchEngine = "google";
		const searchEngineURL = "https://www.google.com/search?q=";
		const tabPosition = "right";
		const checkboxArray = ["is_address_forground", "is_search_forground", "is_save_image", "is_prefer_save_image"];
		saveStrage(searchEngine, searchEngineURL, tabPosition, checkboxArray); // データ保存
		return;
	}

	var selectList = document.querySelector("#engine");
	if (void 0 === restoredSettings.searchEngine) {
		selectList.value = "google";
	} else {
		selectList.value = restoredSettings.searchEngine;
	}

	var urlData = document.querySelector('[name="url"]');
	if (void 0 === restoredSettings.searchEngineURL) {
		urlData.value = "https://www.google.com/search?q=";
	} else {
		urlData.value = restoredSettings.searchEngineURL;
	}
	urlData.readOnly = Boolean(Number(selectList.selectedOptions[0].dataset.isreadonly));

	var selectTabPos = document.querySelector("#tab");
	if (void 0 === restoredSettings.tabPosition) {
		selectTabPos.value = "right";
	} else {
		selectTabPos.value = restoredSettings.tabPosition;
	}

	var checkboxes = document.querySelectorAll(".data-types [type=checkbox]");
	if (void 0 === restoredSettings.checkboxArray) {
		for (let item of checkboxes) {
			item.checked = true;
		}
	} else {
		for (let item of checkboxes) {
			if (restoredSettings.checkboxArray.indexOf(item.getAttribute("data-type")) != -1) {
				item.checked = true;
			} else {
				item.checked = false;
			}
		}
	}
}

document.addEventListener("DOMContentLoaded", _ => {
	const saveButton = document.querySelector("#save-button");
	saveButton.addEventListener("click", storeSettings);
	chrome.storage.local.get(["searchEngine", "searchEngineURL",  "tabPosition", "checkboxArray"], updateUI);
	const selectList = document.querySelector('[id="engine"]');
	const urlData = document.querySelector('[name="url"]');
	selectList.addEventListener("change", ev => {
		urlData.value = selectList.selectedOptions[0].dataset.url;
		urlData.readOnly = Boolean(Number(selectList.selectedOptions[0].dataset.isreadonly));
	});
});
