"use strict";

(() => {

const RULES_STORAGE_KEY = "compatibilityRules";

let compatibilityRules = [];
let currentUrlObj = null;

async function loadCompatibilityRules() {
  try {
    const data = await browser.storage.local.get(RULES_STORAGE_KEY);
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
    await browser.storage.local.set({ [RULES_STORAGE_KEY]: toSave });
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

function handleDeleteRule(event) {
  const target = event.target;
  if (!target.classList.contains("delete-rule")) return;
  const tr = target.closest("tr[data-index]");
  if (!tr) return;
  const idx = parseInt(tr.dataset.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= compatibilityRules.length) return;
  compatibilityRules.splice(idx, 1);
  renderRules();
}

function handleAddRule() {
  compatibilityRules.push({ regexp: "", status: "disable" });
  renderRules();
}

async function handleSave() {
  const errorIndices = new Set();

  const emptyIndices = new Set();
  for (let i = 0; i < compatibilityRules.length; i++) {
    if (!(compatibilityRules[i].regexp ?? compatibilityRules[i].host ?? "").trim()) {
      emptyIndices.add(i);
      errorIndices.add(i);
    }
  }

  const seen = new Map();
  const duplicateIndices = new Set();
  for (let i = 0; i < compatibilityRules.length; i++) {
    const pattern = (compatibilityRules[i].regexp ?? compatibilityRules[i].host ?? "").trim();
    if (!pattern) continue;
    if (seen.has(pattern)) {
      duplicateIndices.add(seen.get(pattern));
      duplicateIndices.add(i);
      errorIndices.add(seen.get(pattern));
      errorIndices.add(i);
    } else {
      seen.set(pattern, i);
    }
  }

  for (const input of document.querySelectorAll(".rule-pattern.error")) {
    input.classList.remove("error");
  }
  const errorEl = document.querySelector("#compat-error");

  if (errorIndices.size > 0) {
    for (const idx of errorIndices) {
      const tr = document.querySelector(`tr[data-index="${idx}"]`);
      tr?.querySelector(".rule-pattern")?.classList.add("error");
    }
    if (errorEl) {
      const msgs = [];
      if (emptyIndices.size > 0) msgs.push((window._qdT && window._qdT.empty_pattern_error) || "Empty patterns found");
      if (duplicateIndices.size > 0) msgs.push((window._qdT && window._qdT.dup_pattern_error) || "Duplicate patterns found");
      errorEl.textContent = msgs.join(" / ");
    }
    return;
  }

  if (errorEl) errorEl.textContent = "";
  await saveCompatibilityRules(compatibilityRules);
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

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
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
  document.querySelector("#compat-tbody").addEventListener("click", handleDeleteRule);
  document.querySelector("#add-rule").addEventListener("click", handleAddRule);
  document.querySelector("#save-btn").addEventListener("click", handleSave);
  document.querySelector("#back-btn").addEventListener("click", () => {
    window.location.href = "options.html";
  });
}

document.addEventListener("DOMContentLoaded", initialize);

})();
