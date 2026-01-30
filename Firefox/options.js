"use strict";

(() => {

// ========================================
// 定数
// ========================================
const DEFAULTS = Object.freeze({
  SEARCH_ENGINE: "google",
  SEARCH_ENGINE_URL: "https://www.google.com/search?q=",
  TAB_POSITION: "right",
  CHECKBOX_ARRAY: [
    "is_address_forground",
    "is_search_forground",
    "is_save_image",
    "is_prefer_save_image",
  ],
});

const STORAGE_KEYS = [
  "searchEngine",
  "searchEngineURL",
  "tabPosition",
  "checkboxArray",
];

// ========================================
// DOM要素の取得
// ========================================
const elements = {
  get engine() {
    return document.querySelector("#engine");
  },
  get url() {
    return document.querySelector('[name="url"]');
  },
  get tab() {
    return document.querySelector("#tab");
  },
  get checkboxes() {
    return document.querySelectorAll(".data-types [type=checkbox]");
  },
  get saveButton() {
    return document.querySelector("#save-button");
  },
};

// ========================================
// ストレージ操作
// ========================================

/**
 * 設定をストレージに保存
 * @param {Object} settings
 * @returns {Promise<void>}
 */
async function saveSettings(settings) {
  try {
    await browser.storage.local.set(settings);
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

/**
 * ストレージから設定を読み込む
 * @returns {Promise<Object>}
 */
async function loadSettings() {
  try {
    return await browser.storage.local.get(STORAGE_KEYS);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {};
  }
}

// ========================================
// 設定値の取得
// ========================================

/**
 * 現在のフォーム値から設定オブジェクトを生成
 * @returns {Object}
 */
function getCurrentSettings() {
  return {
    searchEngine: elements.engine.value,
    searchEngineURL: elements.url.value,
    tabPosition: elements.tab.value,
    checkboxArray: getCheckedTypes(),
  };
}

/**
 * チェックされたチェックボックスのdata-type値を取得
 * @returns {string[]}
 */
function getCheckedTypes() {
  const dataTypes = [];
  for (const checkbox of elements.checkboxes) {
    if (checkbox.checked) {
      dataTypes.push(checkbox.getAttribute("data-type"));
    }
  }
  return dataTypes;
}

// ========================================
// UI更新
// ========================================

/**
 * UIを設定値で更新
 * @param {Object} settings
 */
function updateUI(settings) {
  // ドキュメントが存在しない場合（インストール時など）はデフォルト値を保存
  if (typeof document === "undefined") {
    saveSettings({
      searchEngine: DEFAULTS.SEARCH_ENGINE,
      searchEngineURL: DEFAULTS.SEARCH_ENGINE_URL,
      tabPosition: DEFAULTS.TAB_POSITION,
      checkboxArray: DEFAULTS.CHECKBOX_ARRAY,
    });
    return;
  }

  // 検索エンジン
  elements.engine.value = settings.searchEngine ?? DEFAULTS.SEARCH_ENGINE;

  // 検索エンジンURL
  elements.url.value = settings.searchEngineURL ?? DEFAULTS.SEARCH_ENGINE_URL;
  updateUrlReadOnly();

  // タブ位置
  elements.tab.value = settings.tabPosition ?? DEFAULTS.TAB_POSITION;

  // チェックボックス
  const checkboxArray = settings.checkboxArray ?? DEFAULTS.CHECKBOX_ARRAY;
  for (const checkbox of elements.checkboxes) {
    const dataType = checkbox.getAttribute("data-type");
    checkbox.checked = checkboxArray.includes(dataType);
  }
}

/**
 * URL入力欄のreadOnly状態を更新
 */
function updateUrlReadOnly() {
  const selectedOption = elements.engine.selectedOptions[0];
  elements.url.readOnly = Boolean(Number(selectedOption?.dataset.isreadonly));
}

// ========================================
// イベントハンドラ
// ========================================

/**
 * 設定変更時の自動保存ハンドラ
 */
function handleSettingChange() {
  const settings = getCurrentSettings();
  saveSettings(settings);
}

/**
 * 検索エンジン変更時のハンドラ
 */
function handleEngineChange() {
  const selectedOption = elements.engine.selectedOptions[0];
  elements.url.value = selectedOption.dataset.url;
  updateUrlReadOnly();
  handleSettingChange();
}

/**
 * URL入力時のハンドラ（debounce付き）
 */
const handleUrlInput = debounce(() => {
  handleSettingChange();
}, 500);

/**
 * debounce関数
 * @param {Function} func
 * @param {number} wait
 * @returns {Function}
 */
function debounce(func, wait) {
  let timeoutId = null;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

// ========================================
// イベントリスナーの設定
// ========================================

/**
 * 全てのイベントリスナーを設定
 */
function setupEventListeners() {
  // 検索エンジン選択
  elements.engine.addEventListener("change", handleEngineChange);

  // URL入力（入力中は遅延保存）
  elements.url.addEventListener("input", handleUrlInput);
  elements.url.addEventListener("change", handleSettingChange);

  // タブ位置選択
  elements.tab.addEventListener("change", handleSettingChange);

  // チェックボックス
  for (const checkbox of elements.checkboxes) {
    checkbox.addEventListener("change", handleSettingChange);
  }
}

// ========================================
// 初期化
// ========================================

/**
 * 初期化処理
 */
async function initialize() {
  const settings = await loadSettings();
  updateUI(settings);
  setupEventListeners();
}

// DOMContentLoaded時に初期化
document.addEventListener("DOMContentLoaded", initialize);

})();
