"use strict";

(() => {

const RULES_STORAGE_KEY = "siteRules";

// ===== SiteRuleEditor =====
// サイトルール編集ページ全体を管理するクラス。
// #rules はページ上の入力内容と同期した作業コピーで、保存ボタンを押すまでストレージには反映されない。
class SiteRuleEditor {
  #rules         = [];
  #currentUrlObj = null;

  async initialize() {
    await this.#loadRules();
    await this.#resolveCurrentTab();
    this.#renderRules();
    this.#setupEventListeners();
  }

  // 旧形式（disabledPatterns）が残っていれば新形式に移行して読み込む
  // ルールが空の場合は空白行を 1 行追加して UI が空欄にならないようにする
  async #loadRules() {
    try {
      const data = await chrome.storage.local.get([RULES_STORAGE_KEY, "disabledPatterns"]);
      if (data[RULES_STORAGE_KEY] !== undefined) {
        this.#rules = data[RULES_STORAGE_KEY];
      } else if (data.disabledPatterns?.length > 0) {
        this.#rules = window.qdMigrateOldPatterns(data.disabledPatterns);
        await chrome.storage.local.set({ [RULES_STORAGE_KEY]: this.#rules });
        await chrome.storage.local.remove("disabledPatterns");
      } else {
        this.#rules = [];
      }
    } catch {
      this.#rules = [];
    }
    if (this.#rules.length === 0) {
      this.#rules = [{ regexp: "", status: "disable" }];
    }
  }

  // 空パターンのルールは保存しない（UI 上の空行が永続化されるのを防ぐ）
  async #saveRules() {
    try {
      const toSave = this.#rules.filter(r => (r.regexp ?? r.host ?? "").trim());
      await chrome.storage.local.set({ [RULES_STORAGE_KEY]: toSave });
    } catch (e) {
      console.error("Failed to save site rules:", e);
    }
  }

  // 現在タブの URL を取得し、マッチするルールのハイライトに使う
  // http / https / file 以外は対象外なので #currentUrlObj は null のままにする
  async #resolveCurrentTab() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab  = tabs[0];
      if (tab?.url) {
        const url = new URL(tab.url);
        if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:") {
          this.#currentUrlObj = url;
        }
      }
    } catch {}
  }

  // host 形式（完全一致）と regexp 形式（正規表現）の両方に対応する
  // 無効な正規表現は false を返して静かに無視する
  #matchesUrl(rule, urlObj) {
    if (rule.host && rule.host === urlObj.host) return true;
    if (rule.regexp) {
      try { return new RegExp(rule.regexp).test(urlObj.href); }
      catch { return false; }
    }
    return false;
  }

  // #rules の変更後は差分更新ではなく tbody を全再描画する
  // インデックス値を data-index に保持し、イベント委譲でどの行かを特定する
  #renderRules() {
    const tbody = document.querySelector("#site-rules-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    for (let i = 0; i < this.#rules.length; i++) {
      const rule = this.#rules[i];
      const tr   = document.createElement("tr");
      tr.dataset.index = String(i);

      const patternInput = document.createElement("input");
      patternInput.type        = "text";
      patternInput.className   = "rule-pattern";
      patternInput.value       = rule.regexp ?? rule.host ?? "";
      patternInput.spellcheck  = false;
      patternInput.placeholder = "^https?://example\\.com";

      const insertBtn = document.createElement("button");
      insertBtn.className = "insert-rule";
      insertBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-rule";
      deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

      const patternTd = document.createElement("td");
      patternTd.appendChild(patternInput);
      const insertTd = document.createElement("td");
      insertTd.appendChild(insertBtn);
      const deleteTd = document.createElement("td");
      deleteTd.appendChild(deleteBtn);

      tr.append(patternTd, insertTd, deleteTd);
      tbody.appendChild(tr);
    }

    this.#highlightMatchingRules();
  }

  #highlightMatchingRules() {
    if (!this.#currentUrlObj) return;
    for (const tr of document.querySelectorAll("#site-rules-tbody tr[data-index]")) {
      const idx = parseInt(tr.dataset.index, 10);
      if (!isNaN(idx) && this.#rules[idx] && this.#matchesUrl(this.#rules[idx], this.#currentUrlObj)) {
        tr.classList.add("rule-match");
      }
    }
  }

  // tbody と save-btn にそれぞれ委譲リスナーを登録し、個々の行に直接リスナーを付けない
  #setupEventListeners() {
    const tbody   = document.querySelector("#site-rules-tbody");
    const saveBtn = document.querySelector("#save-btn");
    tbody.addEventListener("input",  (e) => this.#handleInput(e));
    tbody.addEventListener("change", (e) => this.#handleChange(e));
    tbody.addEventListener("click",  (e) => this.#handleInsert(e));
    tbody.addEventListener("click",  (e) => this.#handleDelete(e));
    saveBtn.addEventListener("click", () => this.#handleSave());
  }

  // クリック / フォーカス対象の要素から最も近い tr[data-index] の index 値を取り出す
  // 行が特定できない場合は -1 を返す
  #rowIndex(el) {
    const tr  = el.closest("tr[data-index]");
    if (!tr) return -1;
    const idx = parseInt(tr.dataset.index, 10);
    return isNaN(idx) ? -1 : idx;
  }

  // 入力のたびに #rules を更新してエラー表示をリセットする（保存はしない）
  #handleInput(event) {
    const { target } = event;
    if (!target.classList.contains("rule-pattern")) return;
    const idx = this.#rowIndex(target);
    if (idx < 0 || idx >= this.#rules.length) return;
    this.#rules[idx] = { regexp: target.value, status: "disable" };
    target.classList.remove("error");
    const errorEl = document.querySelector("#site-rules-error");
    if (errorEl && !document.querySelector(".rule-pattern.error")) errorEl.textContent = "";
  }

  #handleChange(event) {
    const { target } = event;
    if (!target.classList.contains("rule-pattern") || !this.#currentUrlObj) return;
    const idx = this.#rowIndex(target);
    if (idx < 0 || idx >= this.#rules.length) return;
    const tr = target.closest("tr[data-index]");
    tr.classList.toggle("rule-match", this.#matchesUrl(this.#rules[idx], this.#currentUrlObj));
  }

  #handleInsert(event) {
    const btn = event.target.closest(".insert-rule");
    if (!btn) return;
    const idx = this.#rowIndex(btn);
    if (idx < 0) return;
    this.#rules.splice(idx + 1, 0, { regexp: "", status: "disable" });
    this.#renderRules();
    document.querySelector(`tr[data-index="${idx + 1}"]`)?.querySelector(".rule-pattern")?.focus();
  }

  // 指定行を削除する。最後の 1 行を削除した場合は空白行を 1 行追加して UI を空にしない
  #handleDelete(event) {
    const btn = event.target.closest(".delete-rule");
    if (!btn) return;
    const idx = this.#rowIndex(btn);
    if (idx < 0 || idx >= this.#rules.length) return;
    this.#rules.splice(idx, 1);
    if (this.#rules.length === 0) this.#rules = [{ regexp: "", status: "disable" }];
    this.#renderRules();
  }

  // 保存前に正規表現の構文エラーと重複パターンを検出してエラー表示する。
  // 問題がなければストレージに永続化し、ボタンを 1.5 秒間無効化して二重送信を防ぐ
  async #handleSave() {
    const seen     = new Map();
    const dupes    = new Set();
    const invalids = new Set();
    for (let i = 0; i < this.#rules.length; i++) {
      const pattern = (this.#rules[i].regexp ?? this.#rules[i].host ?? "").trim();
      if (!pattern) continue;
      try { new RegExp(pattern); } catch { invalids.add(i); }
      // 最初の出現行も dupes に追加して、重複の双方をエラーハイライトの対象にする
      if (seen.has(pattern)) { dupes.add(seen.get(pattern)); dupes.add(i); }
      else seen.set(pattern, i);
    }

    for (const input of document.querySelectorAll(".rule-pattern.error")) input.classList.remove("error");
    const errorEl = document.querySelector("#site-rules-error");

    if (invalids.size > 0) {
      for (const idx of invalids) {
        document.querySelector(`tr[data-index="${idx}"]`)?.querySelector(".rule-pattern")?.classList.add("error");
      }
      if (errorEl) errorEl.textContent = (window._qdT?.rule_invalid_error) || "Invalid regular expression";
      return;
    }

    if (dupes.size > 0) {
      for (const idx of dupes) {
        document.querySelector(`tr[data-index="${idx}"]`)?.querySelector(".rule-pattern")?.classList.add("error");
      }
      if (errorEl) errorEl.textContent = (window._qdT?.rule_dup_error) || "Duplicate patterns found";
      return;
    }

    if (errorEl) errorEl.textContent = "";
    await this.#saveRules();
    this.#rules = this.#rules.filter(r => (r.regexp ?? r.host ?? "").trim());
    if (this.#rules.length === 0) this.#rules = [{ regexp: "", status: "disable" }];
    this.#renderRules();

    const btn      = document.querySelector("#save-btn");
    const original = btn.textContent;
    btn.textContent = (window._qdT?.save_btn_done) || "Saved";
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = original;
      btn.disabled    = false;
    }, 1500);
  }
}

document.addEventListener("DOMContentLoaded", () => new SiteRuleEditor().initialize());

})();
