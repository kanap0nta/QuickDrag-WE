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
    "is_address_foreground",
    "is_search_foreground",
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

const RULES_STORAGE_KEY = "compatibilityRules";

// ========================================
// DOM要素の取得
// ========================================
const elements = {
  get engine() { return document.querySelector("#engine"); },
  get url() { return document.querySelector('[name="url"]'); },
  get tab() { return document.querySelector("#tab"); },
  get checkboxes() { return document.querySelectorAll(".data-types [type=checkbox]"); },
  get siteSection() { return document.querySelector("#site-section"); },
  get siteEnabled() { return document.querySelector("#site-enabled"); },
  get mainOptions() { return document.querySelector("#main-options"); },
};

// ========================================
// 翻訳ヘルパー
// ========================================
function t(key) {
  return (window._qdT && window._qdT[key]) || key;
}

// ========================================
// ストレージ操作
// ========================================

async function saveSettings(settings) {
  try {
    await browser.storage.local.set(settings);
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

async function loadSettings() {
  try {
    return await browser.storage.local.get(STORAGE_KEYS);
  } catch (error) {
    console.error("Failed to load settings:", error);
    return {};
  }
}

// ========================================
// 互換性ルール管理 (GlitterDrag方式)
// ========================================

let currentUrlObj = null;
let compatibilityRules = [];

function migrateOldPatterns(patterns) {
  return patterns
    .map(p => p.trim())
    .filter(p => p)
    .map(p => {
      const escaped = p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      if (!p.includes("*") && !p.includes("/")) {
        return { regexp: `^https?://${escaped}(/.*)?$`, status: "disable" };
      }
      return { regexp: `https?://${escaped}`, status: "disable" };
    });
}

async function loadCompatibilityRules() {
  try {
    const data = await browser.storage.local.get([RULES_STORAGE_KEY, "disabledPatterns"]);
    if (data[RULES_STORAGE_KEY] !== undefined) {
      return data[RULES_STORAGE_KEY];
    }
    if (data.disabledPatterns && data.disabledPatterns.length > 0) {
      const rules = migrateOldPatterns(data.disabledPatterns);
      await browser.storage.local.set({ [RULES_STORAGE_KEY]: rules });
      await browser.storage.local.remove("disabledPatterns");
      return rules;
    }
    return [];
  } catch {
    return [];
  }
}

async function saveCompatibilityRules(rules) {
  try {
    const toSave = rules.filter(r => (r.regexp ?? "").trim() || (r.host ?? "").trim());
    await browser.storage.local.set({ [RULES_STORAGE_KEY]: toSave });
  } catch (error) {
    console.error("Failed to save compatibility rules:", error);
  }
}

function isSiteDisabled(urlObj, rules) {
  for (const rule of rules) {
    if (rule.host && rule.host === urlObj.host) {
      return (rule.status ?? "disable") === "disable";
    }
    if (rule.regexp) {
      try {
        if (new RegExp(rule.regexp).test(urlObj.href)) {
          return (rule.status ?? "disable") === "disable";
        }
      } catch { /* invalid regexp */ }
    }
  }
  return false;
}

// ========================================
// 設定値の取得
// ========================================

function getCurrentSettings() {
  return {
    searchEngine: elements.engine.value,
    searchEngineURL: elements.url.value,
    tabPosition: elements.tab.value,
    checkboxArray: getCheckedTypes(),
  };
}

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

function updateUI(settings) {
  elements.engine.value = settings.searchEngine ?? DEFAULTS.SEARCH_ENGINE;
  elements.url.value = settings.searchEngineURL ?? DEFAULTS.SEARCH_ENGINE_URL;
  updateUrlReadOnly();
  elements.tab.value = settings.tabPosition ?? DEFAULTS.TAB_POSITION;
  const checkboxArray = settings.checkboxArray ?? DEFAULTS.CHECKBOX_ARRAY;
  for (const checkbox of elements.checkboxes) {
    const dataType = checkbox.getAttribute("data-type");
    checkbox.checked = checkboxArray.includes(dataType);
  }
}

function updateUrlReadOnly() {
  const selectedOption = elements.engine.selectedOptions[0];
  elements.url.readOnly = Boolean(Number(selectedOption?.dataset.isreadonly));
}

// ========================================
// イベントハンドラ
// ========================================

function handleSettingChange() {
  saveSettings(getCurrentSettings());
}

function handleEngineChange() {
  const selectedOption = elements.engine.selectedOptions[0];
  elements.url.value = selectedOption.dataset.url;
  updateUrlReadOnly();
  handleSettingChange();
}

const handleUrlInput = debounce(() => {
  handleSettingChange();
}, 500);

function debounce(func, wait) {
  let timeoutId = null;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), wait);
  };
}

async function handleSiteToggle() {
  if (!currentUrlObj) return;
  const enabled = elements.siteEnabled.checked;

  if (!enabled) {
    if (!isSiteDisabled(currentUrlObj, compatibilityRules)) {
      const escaped = currentUrlObj.hostname.replace(/[.+^${}()|[\]\\]/g, "\\$&");
      compatibilityRules.push({ regexp: `^https?://${escaped}(/.*)?$`, status: "disable" });
    }
  } else {
    compatibilityRules = compatibilityRules.filter(rule => {
      if (rule.host && rule.host === currentUrlObj.host) return false;
      if (rule.regexp) {
        try {
          if (new RegExp(rule.regexp).test(currentUrlObj.href)) return false;
        } catch { /* keep invalid regexps */ }
      }
      return true;
    });
  }

  await saveCompatibilityRules(compatibilityRules);
  elements.mainOptions.hidden = !enabled;
}

// ========================================
// イベントリスナーの設定
// ========================================

function setupEventListeners() {
  elements.engine.addEventListener("change", handleEngineChange);
  elements.url.addEventListener("input", handleUrlInput);
  elements.url.addEventListener("change", handleSettingChange);
  elements.tab.addEventListener("change", handleSettingChange);

  for (const checkbox of elements.checkboxes) {
    checkbox.addEventListener("change", handleSettingChange);
  }

  elements.siteEnabled.addEventListener("change", handleSiteToggle);
}

// ========================================
// 初期化
// ========================================

async function initialize() {
  compatibilityRules = await loadCompatibilityRules();

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:") {
        currentUrlObj = url;
        const siteDisabled = isSiteDisabled(currentUrlObj, compatibilityRules);
        elements.siteEnabled.checked = !siteDisabled;
        elements.mainOptions.hidden = siteDisabled;
      } else {
        elements.siteSection.hidden = true;
      }
    } else {
      elements.siteSection.hidden = true;
    }
  } catch {
    elements.siteSection.hidden = true;
  }

  await migrateCheckboxArray();
  const settings = await loadSettings();
  updateUI(settings);
  setupEventListeners();
}

async function migrateCheckboxArray() {
  const data = await browser.storage.local.get("checkboxArray");
  const arr = data.checkboxArray;
  if (!Array.isArray(arr)) return;
  const renamed = { is_address_forground: "is_address_foreground", is_search_forground: "is_search_foreground" };
  const migrated = arr.map(k => renamed[k] ?? k);
  if (migrated.some((k, i) => k !== arr[i])) {
    await browser.storage.local.set({ checkboxArray: migrated });
  }
}

document.addEventListener("DOMContentLoaded", initialize);

})();
