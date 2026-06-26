"use strict";

(() => {

// ========================================
// メッセージハンドラ
// ========================================

/**
 * コンテンツスクリプトからのメッセージを処理
 */
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true;
});

/**
 * メッセージタイプに応じて処理を振り分け
 * @param {Object} request
 * @param {Object} sender
 * @param {Function} sendResponse
 */
async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.type) {
      case "searchURL":
        await searchURL(request, sender);
        sendResponse({ success: true, message: `searchURL: ${request.value}` });
        break;

      case "downloadImage":
        await downloadImage(request);
        sendResponse({ success: true, message: `downloadImage: ${request.value}` });
        break;

      case "checkDisabled": {
        const tabId = sender.tab?.id;
        if (tabId === undefined) {
          sendResponse({ disabled: false });
          break;
        }
        try {
          const tab = await browser.tabs.get(tabId);
          const tabUrl = tab.url;
          if (!tabUrl) { sendResponse({ disabled: false }); break; }
          const urlObj = new URL(tabUrl);
          if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:" && urlObj.protocol !== "file:") {
            sendResponse({ disabled: false }); break;
          }
          const rules = await getSiteRules();
          sendResponse({ disabled: isSiteDisabled(urlObj, rules) });
        } catch {
          sendResponse({ disabled: false });
        }
        break;
      }

      default:
        sendResponse({ success: false, message: "Unknown message type" });
        break;
    }
  } catch (error) {
    sendResponse({ success: false, message: error.message });
  }
}

// ========================================
// タブ操作
// ========================================

/**
 * アクティブなタブの情報を取得
 * @param {Array} tabs
 * @returns {{openIndex: number, openId: number}|null}
 */
function getActiveTabInfo(tabs) {
  const activeTab = tabs.find((tab) => tab.active);
  if (!activeTab) return null;

  return {
    openIndex: activeTab.index,
    openId: activeTab.id,
  };
}

/**
 * タブ位置に応じたインデックスを計算
 * @param {string} position
 * @param {Array} tabs
 * @returns {{index: number|undefined, openerTabId: number|undefined}}
 */
function calculateTabPosition(position, tabs) {
  const activeInfo = getActiveTabInfo(tabs);

  switch (position) {
    case "right":
      return {
        index: activeInfo ? activeInfo.openIndex + 1 : undefined,
        openerTabId: activeInfo?.openId,
      };

    case "left":
      return {
        index: activeInfo?.openIndex,
        openerTabId: activeInfo?.openId,
      };

    case "first":
      return {
        index: 0,
        openerTabId: undefined,
      };

    case "last":
    default:
      return {
        index: undefined,
        openerTabId: undefined,
      };
  }
}

/**
 * 新しいタブでURLを開く
 * @param {Object} request
 * @param {Object} sender
 * @returns {Promise<void>}
 */
async function searchURL(request, sender) {
  const tabs = await browser.tabs.query({ currentWindow: true });
  const { index, openerTabId } = calculateTabPosition(request.tab, tabs);

  const createOptions = {
    url: request.value,
    cookieStoreId: sender.tab?.cookieStoreId,
    active: request.isForeground,
  };

  // undefinedでない場合のみ追加
  if (index !== undefined) {
    createOptions.index = index;
  }
  if (openerTabId !== undefined) {
    createOptions.openerTabId = openerTabId;
  }

  await browser.tabs.create(createOptions);
}

// ========================================
// ダウンロード
// ========================================

/**
 * 画像をダウンロード
 * @param {Object} request
 * @returns {Promise<void>}
 */
async function downloadImage(request) {
  try {
    const downloadId = await browser.downloads.download({
      url: request.value,
      saveAs: true,
      conflictAction: "overwrite",
    });

    // ダウンロード完了を監視
    return new Promise((resolve, reject) => {
      const onChanged = (delta) => {
        if (delta.id !== downloadId) return;

        // ダウンロード完了
        if (delta.state?.current === "complete") {
          browser.downloads.onChanged.removeListener(onChanged);
          resolve(downloadId);
        }

        // ダウンロード中断（キャンセル含む）
        if (delta.state?.current === "interrupted") {
          browser.downloads.onChanged.removeListener(onChanged);
          const errorMessage = delta.error?.current || "Download interrupted";
          
          if (errorMessage === "USER_CANCELED") {
            resolve(null);
          } else {
            reject(new Error(errorMessage));
          }
        }
      };

      browser.downloads.onChanged.addListener(onChanged);
    });
  } catch (error) {
    // ダウンロード開始時のエラー（無効なURLなど）
    if (error.message?.includes("canceled")) {
      return null;
    }
    throw error;
  }
}

let cachedSiteRules = null;

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

async function getSiteRules() {
  if (cachedSiteRules !== null) return cachedSiteRules;
  const data = await browser.storage.local.get(["siteRules", "disabledPatterns"]);
  if (data["siteRules"] !== undefined) {
    cachedSiteRules = data["siteRules"];
    return cachedSiteRules;
  }
  if (data.disabledPatterns && data.disabledPatterns.length > 0) {
    cachedSiteRules = migrateOldPatterns(data.disabledPatterns);
    await browser.storage.local.set({ "siteRules": cachedSiteRules });
    await browser.storage.local.remove("disabledPatterns");
  } else {
    cachedSiteRules = [];
  }
  return cachedSiteRules;
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
// アイコン管理
// ========================================

let disabledIconCache = null;

async function buildDisabledImageData(size) {
  const response = await fetch(browser.runtime.getURL(`icons/icon_${size}.png`));
  const blob = await response.blob();
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, size, size);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    d[i] = d[i + 1] = d[i + 2] = gray;
    d[i + 3] = Math.round(d[i + 3] * 0.5);
  }
  return imageData;
}

async function getDisabledIconData() {
  if (!disabledIconCache) {
    disabledIconCache = {
      48: await buildDisabledImageData(48),
      96: await buildDisabledImageData(96),
    };
  }
  return disabledIconCache;
}

async function updateTabIcon(tabId, url) {
  if (!url) return;
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:" && urlObj.protocol !== "file:") return;
    const rules = await getSiteRules();
    const disabled = isSiteDisabled(urlObj, rules);
    if (disabled) {
      await browser.action.setIcon({ imageData: await getDisabledIconData(), tabId });
    } else {
      await browser.action.setIcon({ path: { 48: "icons/icon_48.png", 96: "icons/icon_96.png" }, tabId });
    }
  } catch { /* ignore */ }
}

// ========================================
// タブ・ストレージ監視
// ========================================

browser.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await browser.tabs.get(tabId);
    await updateTabIcon(tabId, tab.url);
  } catch { /* ignore */ }
});

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    await updateTabIcon(tabId, tab.url);
  }
});

browser.storage.onChanged.addListener(async (changes, area) => {
  if (area !== "local" || !changes["siteRules"]) return;
  const newValue = changes["siteRules"].newValue;
  cachedSiteRules = newValue !== undefined ? newValue : null;
  const tabs = await browser.tabs.query({});
  for (const tab of tabs) {
    await updateTabIcon(tab.id, tab.url);
  }
});

})();
