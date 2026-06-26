"use strict";

(() => {

const RULES_STORAGE_KEY = "siteRules";

let siteRules = [];
let currentUrlObj = null;

function migrateOldPatterns(patterns) {
  return patterns
    .map(p => p.trim())
    .filter(p => p)
    .map(p => {
      const escaped = p.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      if (!p.includes("*") && !p.includes("/")) {
        return { regexp: `^https?://${escaped}(/.*)?$`, status: "disable" };
      }
      return { regexp: `^https?://${escaped}$`, status: "disable" };
    });
}

async function loadSiteRules() {
  try {
    const data = await chrome.storage.local.get([RULES_STORAGE_KEY, "disabledPatterns"]);
    if (data[RULES_STORAGE_KEY] !== undefined) {
      return data[RULES_STORAGE_KEY];
    }
    if (data.disabledPatterns && data.disabledPatterns.length > 0) {
      const rules = migrateOldPatterns(data.disabledPatterns);
      await chrome.storage.local.set({ [RULES_STORAGE_KEY]: rules });
      await chrome.storage.local.remove("disabledPatterns");
      return rules;
    }
    return [];
  } catch {
    return [];
  }
}

async function saveSiteRules(rules) {
  try {
    const toSave = rules.filter(r => (r.regexp ?? "").trim() || (r.host ?? "").trim());
    await chrome.storage.local.set({ [RULES_STORAGE_KEY]: toSave });
  } catch (error) {
    console.error("Failed to save site rules:", error);
  }
}

function matchesUrl(rule, urlObj) {
  if (rule.host && rule.host === urlObj.host) return true;
  if (rule.regexp) {
    try { return new RegExp(rule.regexp).test(urlObj.href); }
    catch { return false; }
  }
  return false;
}

function highlightMatchingRules() {
  if (!currentUrlObj) return;
  for (const tr of document.querySelectorAll("#site-rules-tbody tr[data-index]")) {
    const idx = parseInt(tr.dataset.index, 10);
    if (!isNaN(idx) && siteRules[idx] && matchesUrl(siteRules[idx], currentUrlObj)) {
      tr.classList.add("rule-match");
    }
  }
}

function renderRules() {
  const tbody = document.querySelector("#site-rules-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (let i = 0; i < siteRules.length; i++) {
    const rule = siteRules[i];
    const tr = document.createElement("tr");
    tr.dataset.index = String(i);

    const patternTd = document.createElement("td");
    const patternInput = document.createElement("input");
    patternInput.type = "text";
    patternInput.className = "rule-pattern";
    patternInput.value = rule.regexp ?? rule.host ?? "";
    patternInput.spellcheck = false;
    patternInput.placeholder = "^https?://example\\.com";
    patternTd.appendChild(patternInput);
    tr.appendChild(patternTd);

    const insertTd = document.createElement("td");
    const insertBtn = document.createElement("button");
    insertBtn.className = "insert-rule";
    insertBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    insertTd.appendChild(insertBtn);
    tr.appendChild(insertTd);

    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-rule";
    deleteBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    deleteTd.appendChild(deleteBtn);
    tr.appendChild(deleteTd);

    tbody.appendChild(tr);
  }

  highlightMatchingRules();
}

function handleTableInput(event) {
  const target = event.target;
  if (!target.classList.contains("rule-pattern")) return;
  const tr = target.closest("tr[data-index]");
  if (!tr) return;
  const idx = parseInt(tr.dataset.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= siteRules.length) return;
  siteRules[idx] = { regexp: target.value, status: "disable" };

  target.classList.remove("error");
  const errorEl = document.querySelector("#site-rules-error");
  if (errorEl && !document.querySelector(".rule-pattern.error")) {
    errorEl.textContent = "";
  }
}

function handleTableChange(event) {
  const target = event.target;
  if (!target.classList.contains("rule-pattern")) return;
  if (!currentUrlObj) return;
  const tr = target.closest("tr[data-index]");
  if (!tr) return;
  const idx = parseInt(tr.dataset.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= siteRules.length) return;
  if (matchesUrl(siteRules[idx], currentUrlObj)) {
    tr.classList.add("rule-match");
  } else {
    tr.classList.remove("rule-match");
  }
}

function handleInsertRule(event) {
  const target = event.target.closest(".insert-rule");
  if (!target) return;
  const tr = target.closest("tr[data-index]");
  if (!tr) return;
  const idx = parseInt(tr.dataset.index, 10);
  if (isNaN(idx)) return;
  siteRules.splice(idx + 1, 0, { regexp: "", status: "disable" });
  renderRules();
  document.querySelector(`tr[data-index="${idx + 1}"]`)?.querySelector(".rule-pattern")?.focus();
}

function handleDeleteRule(event) {
  const target = event.target.closest(".delete-rule");
  if (!target) return;
  const tr = target.closest("tr[data-index]");
  if (!tr) return;
  const idx = parseInt(tr.dataset.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= siteRules.length) return;
  siteRules.splice(idx, 1);
  if (siteRules.length === 0) {
    siteRules = [{ regexp: "", status: "disable" }];
  }
  renderRules();
}

async function handleSave() {
  const seen = new Map();
  const duplicateIndices = new Set();

  for (let i = 0; i < siteRules.length; i++) {
    const pattern = (siteRules[i].regexp ?? siteRules[i].host ?? "").trim();
    if (!pattern) continue;
    if (seen.has(pattern)) {
      duplicateIndices.add(seen.get(pattern));
      duplicateIndices.add(i);
    } else {
      seen.set(pattern, i);
    }
  }

  for (const input of document.querySelectorAll(".rule-pattern.error")) {
    input.classList.remove("error");
  }
  const errorEl = document.querySelector("#site-rules-error");

  if (duplicateIndices.size > 0) {
    for (const idx of duplicateIndices) {
      const tr = document.querySelector(`tr[data-index="${idx}"]`);
      tr?.querySelector(".rule-pattern")?.classList.add("error");
    }
    if (errorEl) {
      errorEl.textContent = (window._qdT && window._qdT.rule_dup_error) || "Duplicate patterns found";
    }
    return;
  }

  if (errorEl) errorEl.textContent = "";
  await saveSiteRules(siteRules);
  siteRules = siteRules.filter(r => (r.regexp ?? r.host ?? "").trim());
  if (siteRules.length === 0) {
    siteRules = [{ regexp: "", status: "disable" }];
  }
  renderRules();
  const btn = document.querySelector("#save-btn");
  const original = btn.textContent;
  btn.textContent = (window._qdT && window._qdT.save_btn_done) || "Saved";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, 1500);
}

async function initialize() {
  siteRules = await loadSiteRules();
  if (siteRules.length === 0) {
    siteRules = [{ regexp: "", status: "disable" }];
  }

  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    if (tab?.url) {
      const url = new URL(tab.url);
      if (url.protocol === "http:" || url.protocol === "https:" || url.protocol === "file:") {
        currentUrlObj = url;
      }
    }
  } catch {}

  renderRules();

  document.querySelector("#site-rules-tbody").addEventListener("input", handleTableInput);
  document.querySelector("#site-rules-tbody").addEventListener("change", handleTableChange);
  document.querySelector("#site-rules-tbody").addEventListener("click", handleInsertRule);
  document.querySelector("#site-rules-tbody").addEventListener("click", handleDeleteRule);
  document.querySelector("#save-btn").addEventListener("click", handleSave);
}

document.addEventListener("DOMContentLoaded", initialize);

})();
