"use strict";

// ===== QDStorage =====
// chrome.storage.local のラッパー。オプションページ・コンテンツスクリプト・バックグラウンドで共有する。
//
// Firefox は storage.local を IndexedDB に保存しており、DB が壊れると（異常終了後など）
// get / set / remove がすべて "An unexpected error occurred" で失敗し続ける。
// 壊れた DB は storage.local.clear() でしか作り直されず、それも Firefox 153 以前では失敗するため、
// 再インストールするまで設定が保存できず、常に初期値が表示される状態になる。
// その状態でも設定を保存・復元できるよう、storage.local が失敗したときだけ別バックエンドの storage.sync を使う。
// storage.local が復旧したら restoreFromFallback() で storage.sync の設定を storage.local に戻す。
// Chrome の storage.local が同様に壊れることはまれだが、Firefox 版とコードをそろえるため同じ処理にしている。
//
// Firefox 版とそろえて globalThis に公開する（サービスワーカーからは importScripts() で読み込む）。
globalThis.QDStorage = (() => {
  // フォールバック中に storage.sync へ書き込んだインストールを示すキー。
  // 値は拡張機能 URL（chrome-extension://<拡張機能ID>/）。Firefox 版ではプロファイルごとにランダムな値になり
  // 他端末から同期されたデータを区別できるが、Chrome では拡張機能 ID が全端末で共通のため区別できない
  const FALLBACK_OWNER_KEY = "qdFallbackOwner";
  const ownerId = chrome.runtime.getURL("");

  // このコンテキストで storage.local が一度でも失敗したら true にする
  let usingFallback = false;

  async function call(method, arg) {
    try {
      return await chrome.storage.local[method](arg);
    } catch (e) {
      if (!usingFallback) console.warn(`storage.local.${method}() failed, falling back to storage.sync:`, e);
      usingFallback = true;
      if (method === "set") arg = { ...arg, [FALLBACK_OWNER_KEY]: ownerId };
      return await chrome.storage.sync[method](arg);
    }
  }

  // storage.local が復旧していれば、このインストールがフォールバック中に storage.sync へ保存した設定を
  // storage.local に戻し、storage.sync からは削除する（以降は再び storage.local だけを使う）。
  // 復旧直後（Firefox 154 以降の自動リセット後など）の storage.local は空なので、戻さないと初期値に戻ってしまう。
  // フォールバック中の値のほうが新しいため、storage.local に同じキーがあっても上書きする。
  // 失敗しても呼び出し元の処理は続けられるよう、例外は投げずにログだけ出す
  async function restoreFromFallback() {
    try {
      await chrome.storage.local.get(null);
    } catch {
      return; // まだ壊れている
    }
    try {
      const synced = await chrome.storage.sync.get(null);
      if (synced[FALLBACK_OWNER_KEY] !== ownerId) return;
      const { [FALLBACK_OWNER_KEY]: _owner, ...data } = synced;
      // storage.local への保存が成功してから storage.sync を消す（途中で失敗しても設定を失わない）
      if (Object.keys(data).length > 0) await chrome.storage.local.set(data);
      await chrome.storage.sync.remove(Object.keys(synced));
    } catch (e) {
      console.error("Failed to restore settings from storage.sync:", e);
    }
  }

  // 旧バージョン（v6 以前）の checkboxArray 形式を現在の個別キー形式に移行する。
  // 旧バージョンからの更新直後にコンテンツスクリプトが初期値で動かないよう、バックグラウンドの onInstalled からも呼ぶ
  async function migrateLegacySettings() {
    const TOGGLE_KEYS = ["isAddressForeground", "isSearchForeground", "isSaveImage", "isPreferSaveImage"];
    const data = await call("get", ["checkboxArray", ...TOGGLE_KEYS]);
    const arr  = data.checkboxArray;
    if (!Array.isArray(arr)) return;
    // 新形式のキーが既にあればそちらを優先し、旧形式は削除だけする
    // （restoreFromFallback() で戻した値を、storage.local に残っていた古い checkboxArray で上書きしないため）
    if (TOGGLE_KEYS.every(k => data[k] === undefined)) {
      // typo（forground）を修正済みキーに対応させる
      const RENAMED = { is_address_forground: "is_address_foreground", is_search_forground: "is_search_foreground" };
      const normalized = arr.map(k => RENAMED[k] ?? k);
      await call("set", {
        isAddressForeground: normalized.includes("is_address_foreground"),
        isSearchForeground:  normalized.includes("is_search_foreground"),
        isSaveImage:         normalized.includes("is_save_image"),
        isPreferSaveImage:   normalized.includes("is_prefer_save_image"),
      });
    }
    await call("remove", "checkboxArray");
  }

  return Object.freeze({
    get:    keys  => call("get", keys),
    set:    items => call("set", items),
    remove: keys  => call("remove", keys),
    restoreFromFallback,
    migrateLegacySettings,
    // storage.onChanged の area が現在の保存先かどうか。
    // storage.local が正常なときに他端末から同期された sync の変更を拾わないよう、フォールバック中だけ sync を対象にする
    isActiveArea: area => area === "local" || (area === "sync" && usingFallback),
  });
})();
