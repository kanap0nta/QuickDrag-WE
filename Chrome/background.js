"use strict";

(() => {

// ========================================
// メッセージハンドラ
// ========================================

/**
 * コンテンツスクリプトからのメッセージを処理
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const { index, openerTabId } = calculateTabPosition(request.tab, tabs);

  const createOptions = {
    url: request.value,
    active: request.isforground,
  };

  // undefinedでない場合のみ追加
  if (index !== undefined) {
    createOptions.index = index;
  }
  if (openerTabId !== undefined) {
    createOptions.openerTabId = openerTabId;
  }

  await chrome.tabs.create(createOptions);
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
    const downloadId = await chrome.downloads.download({
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
          chrome.downloads.onChanged.removeListener(onChanged);
          resolve(downloadId);
        }

        // ダウンロード中断（キャンセル含む）
        if (delta.state?.current === "interrupted") {
          chrome.downloads.onChanged.removeListener(onChanged);
          const errorMessage = delta.error?.current || "Download interrupted";
          
          if (errorMessage === "USER_CANCELED") {
            resolve(null);
          } else {
            reject(new Error(errorMessage));
          }
        }
      };

      chrome.downloads.onChanged.addListener(onChanged);
    });
  } catch (error) {
    // ダウンロード開始時のエラー（無効なURLなど）
    if (error.message?.includes("canceled")) {
      return null;
    }
    throw error;
  }
}

})();
