"use strict";

(() => {

// ===== DOM Elements =====
// getter として定義することで、DOMContentLoaded 前に参照しても null にならない

const elements = {
  get engine()      { return document.querySelector("#engine"); },
  get url()         { return document.querySelector('[name="url"]'); },
  get tab()         { return document.querySelector("#tab"); },
  get toggles()     { return document.querySelectorAll(".data-types [type=checkbox]"); },
  get siteSection() { return document.querySelector("#site-section"); },
  get siteEnabled() { return document.querySelector("#site-enabled"); },
  get mainOptions() { return document.querySelector("#main-options"); },
};

// ===== Storage =====

async function saveSettings(settings) {
  try {
    await chrome.storage.local.set(settings);
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

async function loadSettings() {
  try {
    return await chrome.storage.local.get(STORAGE_KEYS);
  } catch (e) {
    console.error("Failed to load settings:", e);
    return {};
  }
}

// ===== UI helpers =====

function getCurrentSettings() {
  const result = {
    searchEngine:    elements.engine.value,
    searchEngineURL: elements.url.value,
    tabPosition:     elements.tab.value,
  };
  for (const toggle of elements.toggles) {
    result[toggle.dataset.type] = toggle.checked;
  }
  return result;
}

function updateUI(settings) {
  elements.engine.value = settings.searchEngine ?? DEFAULTS.SEARCH_ENGINE;
  elements.url.value    = settings.searchEngineURL ?? DEFAULTS.SEARCH_ENGINE_URL;
  updateUrlReadOnly();
  elements.tab.value = settings.tabPosition ?? DEFAULTS.TAB_POSITION;
  for (const toggle of elements.toggles) {
    toggle.checked = settings[toggle.dataset.type] ?? TOGGLE_DEFAULTS[toggle.dataset.type];
  }
}

// data-isreadonly="1" の option が選択されているときは URL 入力を読み取り専用にする
function updateUrlReadOnly() {
  const opt = elements.engine.selectedOptions[0];
  elements.url.readOnly = Boolean(Number(opt?.dataset.isreadonly));
}

function debounce(func, wait) {
  let id = null;
  return function(...args) {
    clearTimeout(id);
    id = setTimeout(() => func.apply(this, args), wait);
  };
}

// ===== SiteRuleManager =====
// オプションページで使うサイトルールの状態と永続化を管理する。
// enable / disable は「現在タブの URL に一致するルールのみ」を対象にする。
class SiteRuleManager {
  #rules = [];

  get rules() { return this.#rules; }

  // 旧形式（disabledPatterns）が残っていれば新形式に移行してから読み込む
  async load() {
    try {
      const data = await chrome.storage.local.get([RULES_STORAGE_KEY, "disabledPatterns"]);
      if (data[RULES_STORAGE_KEY] !== undefined) {
        this.#rules = data[RULES_STORAGE_KEY];
        return;
      }
      if (data.disabledPatterns?.length > 0) {
        this.#rules = window.qdMigrateOldPatterns(data.disabledPatterns);
        await chrome.storage.local.set({ [RULES_STORAGE_KEY]: this.#rules });
        await chrome.storage.local.remove("disabledPatterns");
        return;
      }
      this.#rules = [];
    } catch {
      this.#rules = [];
    }
  }

  // 空パターンのルールは保存しない（UI 上の空行が永続化されるのを防ぐ）
  async save() {
    try {
      const toSave = this.#rules.filter(r => (r.regexp ?? "").trim() || (r.host ?? "").trim());
      await chrome.storage.local.set({ [RULES_STORAGE_KEY]: toSave });
    } catch (e) {
      console.error("Failed to save site rules:", e);
    }
  }

  // ルールは先頭から順に評価し、最初にマッチしたルールの status を返す
  isDisabled(urlObj) {
    for (const rule of this.#rules) {
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

  // 既に無効化ルールがある場合は重複追加しない
  // パス第一セグメントまでを含む regexp を生成することで、サブページも一括で無効化する
  disable(urlObj) {
    if (this.isDisabled(urlObj)) return;
    const pathParts  = urlObj.pathname.split("/").filter(Boolean);
    const stablePath = pathParts.length > 0 ? "/" + pathParts[0] : "";
    const base       = urlObj.origin + stablePath;
    const escaped    = base.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    this.#rules.push({ regexp: `^${escaped}(/.*)?(\\?.*)?$`, status: "disable" });
  }

  // 現在の URL にマッチするルールをすべて削除する（host / regexp どちらの形式も対象）
  enable(urlObj) {
    this.#rules = this.#rules.filter(rule => {
      if (rule.host) return rule.host !== urlObj.host;
      if (rule.regexp) {
        try { return !new RegExp(rule.regexp).test(urlObj.href); }
        catch { return true; }
      }
      return true;
    });
  }

  sync(newRules) {
    this.#rules = newRules ?? [];
  }
}

// ===== Migration =====
// 旧バージョンの checkboxArray 形式を現在の個別キー形式に移行する
async function migrateToggleArray() {
  const data = await chrome.storage.local.get("checkboxArray");
  const arr  = data.checkboxArray;
  if (!Array.isArray(arr)) return;
  // typo（forground）を修正済みキーに対応させる
  const RENAMED = { is_address_forground: "is_address_foreground", is_search_forground: "is_search_foreground" };
  const normalized = arr.map(k => RENAMED[k] ?? k);
  await chrome.storage.local.set({
    isAddressForeground: normalized.includes("is_address_foreground"),
    isSearchForeground:  normalized.includes("is_search_foreground"),
    isSaveImage:         normalized.includes("is_save_image"),
    isPreferSaveImage:   normalized.includes("is_prefer_save_image"),
  });
  await chrome.storage.local.remove("checkboxArray");
}

// ===== OptionsController =====
// オプションページ全体を調停するコントローラ。
// SiteRuleManager を所有し、現在タブの URL と照合してサイトセクションの表示を制御する。
class OptionsController {
  #ruleManager   = new SiteRuleManager();
  #currentUrlObj = null;

  async initialize() {
    await this.#ruleManager.load();
    await this.#resolveCurrentTab();
    await migrateToggleArray();
    updateUI(await loadSettings());
    this.#setupEventListeners();
  }

  // http / https / file 以外（拡張機能ページ・about: 等）はサイトセクションを非表示にする
  async #resolveCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab  = tabs[0];
      if (!tab?.url) { elements.siteSection.hidden = true; return; }
      const url = new URL(tab.url);
      if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "file:") {
        elements.siteSection.hidden = true;
        return;
      }
      this.#currentUrlObj = url;
      const disabled = this.#ruleManager.isDisabled(url);
      elements.siteEnabled.checked = !disabled;
      elements.mainOptions.hidden  = disabled;
    } catch {
      elements.siteSection.hidden = true;
    }
  }

  #setupEventListeners() {
    elements.engine.addEventListener("change", () => this.#handleEngineChange());
    // input は文字入力のたびに発火するため debounce で保存頻度を抑える
    elements.url.addEventListener("input",  debounce(() => saveSettings(getCurrentSettings()), 500));
    // change はフォーカスを外したときに発火するため即時保存する
    elements.url.addEventListener("change", () => saveSettings(getCurrentSettings()));
    elements.tab.addEventListener("change", () => saveSettings(getCurrentSettings()));

    for (const toggle of elements.toggles) {
      toggle.addEventListener("change", () => saveSettings(getCurrentSettings()));
    }

    elements.siteEnabled.addEventListener("change", () => this.#handleSiteToggle());

    // 別タブや site-rules ページからルールが変更されたとき、現在タブの表示を同期する
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" || !changes[RULES_STORAGE_KEY]) return;
      this.#ruleManager.sync(changes[RULES_STORAGE_KEY].newValue);
      if (this.#currentUrlObj) {
        const disabled = this.#ruleManager.isDisabled(this.#currentUrlObj);
        elements.siteEnabled.checked = !disabled;
        elements.mainOptions.hidden  = disabled;
      }
    });
  }

  #handleEngineChange() {
    const opt = elements.engine.selectedOptions[0];
    elements.url.value = opt.dataset.url;
    updateUrlReadOnly();
    saveSettings(getCurrentSettings());
  }

  async #handleSiteToggle() {
    if (!this.#currentUrlObj) return;
    if (elements.siteEnabled.checked) {
      this.#ruleManager.enable(this.#currentUrlObj);
    } else {
      this.#ruleManager.disable(this.#currentUrlObj);
    }
    await this.#ruleManager.save();
    elements.mainOptions.hidden = !elements.siteEnabled.checked;
  }
}

document.addEventListener("DOMContentLoaded", () => new OptionsController().initialize());

})();
