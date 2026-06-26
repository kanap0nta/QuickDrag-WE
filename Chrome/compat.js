"use strict";

(() => {

const RULES_STORAGE_KEY = "compatibilityRules";

let compatibilityRules = [];
let currentUrlObj = null;

async function loadCompatibilityRules() {
  try {
    const data = await chrome.storage.local.get(RULES_STORAGE_KEY);
    return data[RULES_STORAGE_KEY] ?? [];
  } catch {
    return [];
  }
}

async function saveCompatibilityRules(rules) {
  try {
    const toSave = rules
      .filter(r => (r.regexp ?? "").trim() || (r.host ?? "").trim())
      .map(r => ({ regexp: r.regexp ?? r.host ?? "", status: "disable" }));
    await chrome.storage.local.set({ [RULES_STORAGE_KEY]: toSave });
  } catch (error) {
    console.error("Failed to save compatibility rules:", error);
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
  for (const tr of document.querySelectorAll("#compat-tbody tr[data-index]")) {
    const idx = parseInt(tr.dataset.index, 10);
    if (!isNaN(idx) && compatibilityRules[idx] && matchesUrl(compatibilityRules[idx], currentUrlObj)) {
      tr.classList.add("rule-match");
    }
  }
}

function renderRules() {
  const tbody = document.querySelector("#compat-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  for (let i = 0; i < compatibilityRules.length; i++) {
    const rule = compatibilityRules[i];
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
    insertBtn.textContent = "+";
    insertTd.appendChild(insertBtn);
    tr.appendChild(insertTd);

    const deleteTd = document.createElement("td");
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-rule";
    deleteBtn.textContent = "×";
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
  if (isNaN(idx) || idx < 0 || idx >= compatibilityRules.length) return;
  compatibilityRules[idx] = { regexp: target.value, status: "disable" };

  target.classList.remove("error");
  const errorEl = document.querySelector("#compat-error");
  if (errorEl && !document.querySelector(".rule-pattern.error")) {
    errorEl.textContent = "";
  }
}

function handleInsertRule(event) {
  const target = event.target;
  if (!target.classList.contains("insert-rule")) return;
  const tr = target.closest("tr[data-index]");
  if (!tr) return;
  const idx = parseInt(tr.dataset.index, 10);
  if (isNaN(idx)) return;
  compatibilityRules.splice(idx + 1, 0, { regexp: "", status: "disable" });
  renderRules();
  document.querySelector(`tr[data-index="${idx + 1}"]`)?.querySelector(".rule-pattern")?.focus();
}

function handleDeleteRule(event) {
  const target = event.target;
  if (!target.classList.contains("delete-rule")) return;
  const tr = target.closest("tr[data-index]");
  if (!tr) return;
  const idx = parseInt(tr.dataset.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= compatibilityRules.length) return;
  compatibilityRules.splice(idx, 1);
  if (compatibilityRules.length === 0) {
    compatibilityRules = [{ regexp: "", status: "disable" }];
  }
  renderRules();
}

async function handleSave() {
  const seen = new Map();
  const duplicateIndices = new Set();

  for (let i = 0; i < compatibilityRules.length; i++) {
    const pattern = (compatibilityRules[i].regexp ?? compatibilityRules[i].host ?? "").trim();
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
  const errorEl = document.querySelector("#compat-error");

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
  await saveCompatibilityRules(compatibilityRules);
  compatibilityRules = compatibilityRules.filter(r => (r.regexp ?? r.host ?? "").trim());
  if (compatibilityRules.length === 0) {
    compatibilityRules = [{ regexp: "", status: "disable" }];
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
  compatibilityRules = await loadCompatibilityRules();
  if (compatibilityRules.length === 0) {
    compatibilityRules = [{ regexp: "", status: "disable" }];
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

  document.querySelector("#compat-tbody").addEventListener("input", handleTableInput);
  document.querySelector("#compat-tbody").addEventListener("click", handleInsertRule);
  document.querySelector("#compat-tbody").addEventListener("click", handleDeleteRule);
  document.querySelector("#save-btn").addEventListener("click", handleSave);
  document.querySelector("#back-btn").addEventListener("click", () => {
    window.location.href = "options.html";
  });
}

document.addEventListener("DOMContentLoaded", initialize);

})();
