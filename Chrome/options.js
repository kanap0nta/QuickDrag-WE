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

const SITE_STORAGE_KEY = "disabledPatterns";

// ========================================
// DOM要素の取得
// ========================================
const elements = {
  get engine() { return document.querySelector("#engine"); },
  get url() { return document.querySelector('[name="url"]'); },
  get tab() { return document.querySelector("#tab"); },
  get checkboxes() { return document.querySelectorAll(".data-types [type=checkbox]"); },
  get saveButton() { return document.querySelector("#save-button"); },
  get siteSection() { return document.querySelector("#site-section"); },
  get siteEnabled() { return document.querySelector("#site-enabled"); },
  get currentHostnameEl() { return document.querySelector("#current-hostname"); },
  get reloadNotice() { return document.querySelector("#reload-notice"); },
  get reloadButton() { return document.querySelector("#reload-button"); },
  get patternsHeader() { return document.querySelector("#patterns-header"); },
  get patternsArrow() { return document.querySelector("#patterns-arrow"); },
  get patternsContent() { return document.querySelector("#patterns-content"); },
  get patternsTextarea() { return document.querySelector("#patterns-textarea"); },
  get mainOptions() { return document.querySelector("#main-options"); },
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
    await chrome.storage.local.set(settings);
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
    return await chrome.storage.local.get(STORAGE_KEYS);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {};
  }
}

// ========================================
// サイト無効化設定
// ========================================

let currentTabId = null;
let currentHostname = null;
let currentPathname = null;
let disabledPatterns = [];
let initialSiteEnabled = true;
let pageLoadedEnabled = null;

async function loadDisabledPatterns() {
  try {
    const data = await chrome.storage.local.get(SITE_STORAGE_KEY);
    return data[SITE_STORAGE_KEY] ?? [];
  } catch {
    return [];
  }
}

async function saveDisabledPatterns(patterns) {
  try {
    await chrome.storage.local.set({ [SITE_STORAGE_KEY]: patterns });
  } catch (error) {
    console.error("Failed to save disabled patterns:", error);
  }
}

function matchesPattern(hostname, pathname, pattern) {
  const trimmed = pattern.trim();
  if (!trimmed) return false;
  const target = trimmed.includes("/") ? hostname + pathname : hostname;
  const escaped = trimmed.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  try {
    return new RegExp(`^${escaped}$`, "i").test(target);
  } catch {
    return false;
  }
}

function isSiteDisabled(hostname, pathname, patterns) {
  return patterns.some(p => matchesPattern(hostname, pathname, p));
}

function updateSiteUI(patterns) {
  if (!currentHostname) return;
  const nowDisabled = isSiteDisabled(currentHostname, currentPathname, patterns);
  elements.siteEnabled.checked = !nowDisabled;
  elements.mainOptions.hidden = nowDisabled;
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

/**
 * サイト有効/無効トグルのハンドラ
 */
async function handleSiteToggle() {
  if (!currentHostname) return;
  const enabled = elements.siteEnabled.checked;
  if (!enabled) {
    if (!isSiteDisabled(currentHostname, currentPathname, disabledPatterns)) {
      const pattern = currentPathname !== "/" ? currentHostname + currentPathname : currentHostname;
      disabledPatterns.push(pattern);
    }
    // パターンセクションを展開
    elements.patternsContent.hidden = false;
    elements.patternsArrow.textContent = "▼";
  } else {
    disabledPatterns = disabledPatterns.filter(p => !matchesPattern(currentHostname, currentPathname, p));
    // パターンセクションを折りたたむ
    elements.patternsContent.hidden = true;
    elements.patternsArrow.textContent = "▶";
  }
  await saveDisabledPatterns(disabledPatterns);
  elements.patternsTextarea.value = disabledPatterns.join("\n");
  elements.mainOptions.hidden = !enabled;
  const reloadNeeded = pageLoadedEnabled !== null
    ? enabled !== pageLoadedEnabled
    : enabled !== initialSiteEnabled;
  elements.reloadNotice.hidden = !reloadNeeded;
}

/**
 * パターンテキストエリア変更のハンドラ
 */
async function handlePatternsChange() {
  const text = elements.patternsTextarea.value;
  disabledPatterns = text.split("\n").map(l => l.trim()).filter(l => l);
  await saveDisabledPatterns(disabledPatterns);
  updateSiteUI(disabledPatterns);
}

/**
 * リロードボタンのハンドラ
 */
async function handleReloadButton() {
  if (currentTabId !== null) {
    try {
      await chrome.tabs.reload(currentTabId);
    } catch { /* ignore */ }
  }
  window.close();
}

/**
 * パターンセクションの展開/折りたたみ
 */
function handlePatternsToggle() {
  const content = elements.patternsContent;
  content.hidden = !content.hidden;
  elements.patternsArrow.textContent = content.hidden ? "▶" : "▼";
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

  // サイトトグル
  elements.siteEnabled.addEventListener("change", handleSiteToggle);

  // パターンセクション展開
  elements.patternsHeader.addEventListener("click", handlePatternsToggle);
  elements.patternsHeader.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePatternsToggle();
    }
  });

  // パターンテキストエリア（入力中は遅延保存）
  const debouncedPatternsChange = debounce(handlePatternsChange, 500);
  elements.patternsTextarea.addEventListener("input", debouncedPatternsChange);
  elements.patternsTextarea.addEventListener("change", handlePatternsChange);

  // リロードボタン
  elements.reloadButton.addEventListener("click", handleReloadButton);
}

// ========================================
// 初期化
// ========================================

/**
 * 初期化処理
 */
async function initialize() {
  // 無効化パターンを読み込む
  disabledPatterns = await loadDisabledPatterns();
  elements.patternsTextarea.value = disabledPatterns.join("\n");

  // 現在のタブ情報を取得してサイトトグルを設定
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:") {
        currentHostname = url.hostname;
        currentPathname = url.pathname;
        currentTabId = tab.id;
        const displayPath = currentPathname !== "/" ? currentHostname + currentPathname : currentHostname;
        elements.currentHostnameEl.textContent = displayPath;
        const siteDisabled = isSiteDisabled(currentHostname, currentPathname, disabledPatterns);
        initialSiteEnabled = !siteDisabled;
        elements.siteEnabled.checked = initialSiteEnabled;
        elements.mainOptions.hidden = siteDisabled;
        if (siteDisabled) {
          elements.patternsContent.hidden = false;
          elements.patternsArrow.textContent = "▼";
        }
        try {
          const result = await chrome.runtime.sendMessage({ type: "getPageLoadedState", tabId: currentTabId });
          pageLoadedEnabled = result?.enabled ?? null;
        } catch {}
        if (pageLoadedEnabled !== null && pageLoadedEnabled !== initialSiteEnabled) {
          elements.reloadNotice.hidden = false;
        }
      } else {
        elements.siteSection.hidden = true;
      }
    } else {
      elements.siteSection.hidden = true;
    }
  } catch {
    elements.siteSection.hidden = true;
  }

  const settings = await loadSettings();
  updateUI(settings);
  setupEventListeners();
}

// DOMContentLoaded時に初期化
document.addEventListener("DOMContentLoaded", initialize);

})();
