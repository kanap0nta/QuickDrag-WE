"use strict";

(() => {

// ===== SiteRuleService =====
// サイトルールのインメモリキャッシュを管理する。
// キャッシュは storage.onChanged で invalidate() が呼ばれるまで保持され、毎回ストレージを読まない。
class SiteRuleService {
  #cache = null;

  async getRules() {
    if (this.#cache !== null) return this.#cache;
    const data = await chrome.storage.local.get(["siteRules", "disabledPatterns"]);
    if (data["siteRules"] !== undefined) {
      this.#cache = data["siteRules"];
      return this.#cache;
    }
    // 旧形式が残っている場合は移行して新形式で保存する
    if (data.disabledPatterns?.length > 0) {
      this.#cache = this.#migrate(data.disabledPatterns);
      await chrome.storage.local.set({ "siteRules": this.#cache });
      await chrome.storage.local.remove("disabledPatterns");
    } else {
      this.#cache = [];
    }
    return this.#cache;
  }

  // storage.onChanged から新しい値を受け取りキャッシュを更新する。
  // undefined（キーが削除された）の場合は null にして次回 getRules() で再ロードさせる
  invalidate(newValue) {
    this.#cache = newValue !== undefined ? newValue : null;
  }

  // ルールを先頭から順に評価し、最初にマッチしたルールの status を返す。マッチなしは false
  async isDisabled(urlObj) {
    const rules = await this.getRules();
    for (const rule of rules) {
      if (rule.host && rule.host === urlObj.host) {
        // status が省略された旧バージョンのルールは disable 扱いとする
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

  // グロブ形式（* を含むパターン）と単純ホスト形式を regexp に変換する
  #migrate(patterns) {
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
}

// ===== TabNavigator =====
// タブ位置文字列（right / left / first / last）を Chrome API のインデックスに変換して新規タブを開く。
class TabNavigator {
  async open(url, position, isForeground) {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const { index, openerTabId } = this.#calcPosition(position, tabs);
    const opts = { url, active: isForeground };
    // undefined のフィールドを渡すと Chrome API がエラーになるため条件付きで追加する
    if (index !== undefined)      opts.index       = index;
    if (openerTabId !== undefined) opts.openerTabId = openerTabId;
    await chrome.tabs.create(opts);
  }

  // right / left はアクティブタブの index を基準に計算する
  // openerTabId を設定すると「元タブに戻る」ボタンが機能する
  #calcPosition(position, tabs) {
    const active = tabs.find(t => t.active);
    switch (position) {
      case "right": return { index: active ? active.index + 1 : undefined, openerTabId: active?.id };
      case "left":  return { index: active?.index, openerTabId: active?.id };
      case "first": return { index: 0, openerTabId: undefined };
      case "last":
      default:      return { index: undefined, openerTabId: undefined };
    }
  }
}

// ===== DownloadManager =====
// chrome.downloads.download() を呼び出し、完了 / キャンセル / エラーを Promise で返す。
class DownloadManager {
  async download(url) {
    try {
      // saveAs が無効化された環境でもファイルが自動リネームされないよう overwrite を指定する
      const downloadId = await chrome.downloads.download({ url, saveAs: true, conflictAction: "overwrite" });
      return new Promise((resolve, reject) => {
        const onChanged = (delta) => {
          if (delta.id !== downloadId) return;
          if (delta.state?.current === "complete") {
            chrome.downloads.onChanged.removeListener(onChanged);
            resolve(downloadId);
          }
          if (delta.state?.current === "interrupted") {
            chrome.downloads.onChanged.removeListener(onChanged);
            const err = delta.error?.current || "Download interrupted";
            // ユーザーがダイアログをキャンセルした場合は reject ではなく resolve(null) にする
            if (err === "USER_CANCELED") resolve(null);
            else reject(new Error(err));
          }
        };
        chrome.downloads.onChanged.addListener(onChanged);
      });
    } catch (error) {
      // download() 呼び出し自体が拒否された場合（URL ブロック等）に Chrome が "canceled" を含むエラーを投げる
      if (error.message?.includes("canceled")) return null;
      throw error;
    }
  }
}

// ===== IconManager =====
// サイトが無効化されているタブのアイコンをグレースケール半透明に変更する。
// 無効化アイコンは一度生成したら #disabledCache に保持して再利用する。
class IconManager {
  #disabledCache = null;
  #ruleService;

  constructor(ruleService) {
    this.#ruleService = ruleService;
  }

  // http / https / file 以外のタブ（拡張機能ページ等）はアイコン変更をスキップする
  async update(tabId, url) {
    if (!url) return;
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:" && urlObj.protocol !== "file:") return;
      if (await this.#ruleService.isDisabled(urlObj)) {
        await chrome.action.setIcon({ imageData: await this.#getDisabledData(), tabId });
      } else {
        await chrome.action.setIcon({
          path: { 48: "icons/icon_48.png", 96: "icons/icon_96.png", 128: "icons/icon_128.png" },
          tabId,
        });
      }
    } catch { /* ignore */ }
  }

  async updateAll() {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) await this.update(tab.id, tab.url);
  }

  async #getDisabledData() {
    if (!this.#disabledCache) {
      this.#disabledCache = {
        48:  await this.#buildImageData(48),
        96:  await this.#buildImageData(96),
        128: await this.#buildImageData(128),
      };
    }
    return this.#disabledCache;
  }

  // DOM を持たない MV3 service worker 上でも動作するよう OffscreenCanvas を使う
  // 輝度係数 (0.299 / 0.587 / 0.114) は ITU-R BT.601 に準拠する
  async #buildImageData(size) {
    const response = await fetch(chrome.runtime.getURL(`icons/icon_${size}.png`));
    const blob     = await response.blob();
    const bitmap   = await createImageBitmap(blob);
    const canvas   = new OffscreenCanvas(size, size);
    const ctx      = canvas.getContext("2d");
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
}

// ===== MessageHandler =====
// コンテンツスクリプトからのメッセージをタイプで振り分け、対応するサービスに委譲する。
class MessageHandler {
  #ruleService;
  #navigator;
  #downloader;

  constructor(ruleService, navigator, downloader) {
    this.#ruleService = ruleService;
    this.#navigator   = navigator;
    this.#downloader  = downloader;
  }

  async handle(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case "searchURL":
          await this.#navigator.open(request.value, request.tab, request.isForeground);
          sendResponse({ success: true });
          break;

        case "downloadImage":
          await this.#downloader.download(request.value);
          sendResponse({ success: true });
          break;

        case "checkDisabled": {
          // sender.tab がない（ポップアップやオプションページからの呼び出し）は無効化しない
          const tabId = sender.tab?.id;
          if (tabId === undefined) { sendResponse({ disabled: false }); break; }
          try {
            const tab = await chrome.tabs.get(tabId);
            if (!tab.url) { sendResponse({ disabled: false }); break; }
            const urlObj = new URL(tab.url);
            // chrome:// や about: などはサイトルールの対象外
            if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:" && urlObj.protocol !== "file:") {
              sendResponse({ disabled: false }); break;
            }
            sendResponse({ disabled: await this.#ruleService.isDisabled(urlObj) });
          } catch {
            sendResponse({ disabled: false });
          }
          break;
        }

        default:
          sendResponse({ success: false, message: "Unknown message type" });
      }
    } catch (error) {
      sendResponse({ success: false, message: error.message });
    }
  }
}

// ===== BackgroundController =====
// サービスワーカーのエントリポイント。全サービスをインスタンス化し、イベントリスナーを登録する。
// SiteRuleService は IconManager と MessageHandler で共有される（同一キャッシュを参照する）。
class BackgroundController {
  #ruleService = new SiteRuleService();
  #navigator   = new TabNavigator();
  #downloader  = new DownloadManager();
  #iconManager;
  #msgHandler;

  constructor() {
    this.#iconManager = new IconManager(this.#ruleService);
    this.#msgHandler  = new MessageHandler(this.#ruleService, this.#navigator, this.#downloader);
  }

  initialize() {
    // return true でリスナーが非同期応答を待機するよう Chrome に伝える
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.#msgHandler.handle(request, sender, sendResponse);
      return true;
    });

    chrome.tabs.onActivated.addListener(async ({ tabId }) => {
      try {
        const tab = await chrome.tabs.get(tabId);
        await this.#iconManager.update(tabId, tab.url);
      } catch { /* ignore */ }
    });

    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.url || changeInfo.status === "complete") {
        await this.#iconManager.update(tabId, tab.url);
      }
    });

    chrome.storage.onChanged.addListener(async (changes, area) => {
      if (area !== "local" || !changes["siteRules"]) return;
      this.#ruleService.invalidate(changes["siteRules"].newValue);
      await this.#iconManager.updateAll();
    });
  }
}

new BackgroundController().initialize();

})();
