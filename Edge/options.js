// opeionts.js
// 保存Wrapper
function saveStrage(searchEngine , tabPosition, checkboxArray) {
	browser.storage.local.set({
		'searchEngine' : searchEngine,
		'tabPosition' 	: tabPosition,
		'checkboxArray' : checkboxArray
	});
}

// データ保存
function storeSettings() {

	function getEngine() {
		var engine = document.querySelector("#engine");
		return engine.value;
	}

	function getTabPosition() {
		var tab = document.querySelector("#tab");
		return tab.value;
	}

	function getTypes() {
		let dataTypes = [];
		var checkboxes = document.querySelectorAll(".data-types [type=checkbox]");
		for (let item = 0; item < checkboxes.length; item++) {
			if (checkboxes[item].checked) {
				dataTypes.push(checkboxes[item].getAttribute("data-type"));
			}
		}
		return dataTypes;
	}

	const searchEngine = getEngine();
	const tabPosition = getTabPosition();
	const checkboxArray = getTypes();

	saveStrage(searchEngine , tabPosition, checkboxArray);	// データ保存
}

// UI更新
function updateUI(restoredSettings) {
	if("undefined" === typeof document) {
		// インストール時、データがないためデフォルト値を使用
		const searchEngine = "google";
		const tabPosition = "right";
		const checkboxArray = ["is_address_forground", "is_search_forground", "is_save_image", "is_prefer_save_image"];
		saveStrage(searchEngine, tabPosition, checkboxArray);	// データ保存
		return;
	}

	var selectList = document.querySelector("#engine");
	if ("undefined" === typeof restoredSettings.searchEngine) {
		selectList.value = "google";
	} else {
		selectList.value = restoredSettings.searchEngine;
	}

	var selectTabPos = document.querySelector("#tab");
	if ("undefined" === typeof restoredSettings.tabPosition) {
		selectTabPos.value = "right";
	} else {
		selectTabPos.value = restoredSettings.tabPosition;
	}

	var checkboxes = document.querySelectorAll(".data-types [type=checkbox]");
	if (undefined === restoredSettings.checkboxArray) {
		for (let item = 0; item < checkboxes.length; item++) {
			checkboxes[item].checked = true;
		}
	} else {
		for (let item = 0; item < checkboxes.length; item++) {
			if (restoredSettings.checkboxArray.indexOf(checkboxes[item].getAttribute("data-type")) != -1) {
				checkboxes[item].checked = true;
			} else {
				checkboxes[item].checked = false;
			}
		}
	}
}

browser.storage.local.get(["searchEngine", "tabPosition", "checkboxArray"], updateUI);

const saveButton = document.querySelector("#save-button");
saveButton.addEventListener("click", storeSettings);
