// opeionts.js
// 保存Wrapper
function saveStrage(searchEngine , checkboxArray) {
	browser.storage.local.set({
		'searchEngine' : searchEngine,
		'checkboxArray' : checkboxArray
	});
}

// データ保存
function storeSettings() {

	function getEngine() {
		var engine = document.querySelector("#engine");
		return engine.value;
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
	const checkboxArray = getTypes();

	saveStrage(searchEngine , checkboxArray);	// データ保存
}

// UI更新
function updateUI(restoredSettings) {
	if("undefined" === typeof document) {
		// インストール時、データがないためデフォルト値を使用
		const searchEngine =  "google";
		const checkboxArray = ["is_address_forground", "is_search_forground", "is_save_image"];
		saveStrage(searchEngine , checkboxArray);	// データ保存
		return;
	}

	var selectList = document.querySelector("#engine");
	if ("undefined" === typeof restoredSettings.searchEngine) {
		selectList.value = "google";
	} else {
		selectList.value = restoredSettings.searchEngine;
	}

	var checkboxes = document.querySelectorAll(".data-types [type=checkbox]");
	if (undefined === restoredSettings.checkboxArray) {
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

browser.storage.local.get(["searchEngine", "checkboxArray"], updateUI);

const saveButton = document.querySelector("#save-button");
saveButton.addEventListener("click", storeSettings);
