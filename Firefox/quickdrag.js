"use strict";

(() => {

// ===== SettingsManager =====
// browser.storage.local の値を内部キー名に変換して保持する。
// ストレージの変更通知（{newValue} 形式）と初期ロード（値そのまま）の両方を update() で受け入れる。
class SettingsManager {
  #settings = {
    engineURL:      DEFAULTS.SEARCH_ENGINE_URL,
    newTabPosition: DEFAULTS.TAB_POSITION,
    ...TOGGLE_DEFAULTS,
  };

  get(key) { return this.#settings[key]; }

  // スプレッドコピーを返すことで呼び元が内部オブジェクトを直接書き換えるのを防ぐ
  getAll() { return { ...this.#settings }; }

  // ストレージキー（searchEngineURL, tabPosition）を内部キー（engineURL, newTabPosition）に読み替える
  update(data) {
    if (data.searchEngineURL !== undefined) this.#settings.engineURL      = data.searchEngineURL;
    if (data.tabPosition      !== undefined) this.#settings.newTabPosition = data.tabPosition;
    for (const key of TOGGLE_KEYS) {
      if (data[key] !== undefined) this.#settings[key] = data[key];
    }
  }

  // 非アクティブ期間中にストレージが変更されていた場合に備え、activate() から毎回呼ばれる
  async load() {
    try {
      this.update(await browser.storage.local.get(["searchEngineURL", "tabPosition", ...TOGGLE_KEYS]));
    } catch (e) {
      console.error("Failed to load settings:", e);
    }
  }
}

// ===== DragClassifier =====
// ドラッグイベントを解析して { kind, url/src } の判別共用体を返す。
// DOM へのアクセスはあるが副作用はなく、状態も持たない。
class DragClassifier {
  // %s プレースホルダーがあれば置換、なければ URL末尾にエンコード済みクエリを追記する
  #buildSearchURL(query, engineURL) {
    const encoded  = encodeURIComponent(query);
    const replaced = engineURL.replace("%s", encoded);
    // replace() はマッチなしでも元の文字列をそのまま返すため、等値比較で %s の有無を検出できる
    return replaced === engineURL ? engineURL + encoded : replaced;
  }

  #normalizeURL(url) {
    if (PATTERNS.EMAIL.test(url)) return `mailto:${url}`;
    if (!/^[a-z][\da-z+\-]*:/i.test(url))
      // ftp.xxx の場合は http:// を付与してから FTP_PATH で ftp:// に変換し直す（スキームなし URL を統一的に処理するため）
      return `http://${url.replace(PATTERNS.LEADING_JUNK, "")}`.replace(PATTERNS.FTP_PATH, "f$1");
    return url;
  }

  #findFirstImage(node) {
    for (let c = node.firstElementChild; c; c = c.nextElementSibling) {
      if (c instanceof HTMLImageElement) return c;
      const found = this.#findFirstImage(c);
      if (found) return found;
    }
    return null;
  }

  // RFC3986 URI → ドメイン風文字列 → テキスト検索 の順で判定する
  classifyText(rawText, engineURL) {
    // 末尾のスペースは URL クエリの一部になりうるため trim せず先頭のみ除去する
    const text = rawText.replace(/^ +/, "");
    if (PATTERNS.RFC3986.test(text))
      // RFC3986 パターンは ttp:// や hxxp:// も有効なスキームとしてマッチするため、ここで正規化する
      return { kind: DRAG.ADDRESS, url: text.replace(PATTERNS.MALFORMED_HTTP, "http$1") };
    if (!/\s/.test(text) && DOMAIN_PATTERN.test(text))
      return { kind: DRAG.ADDRESS, url: this.#normalizeURL(text) };
    return { kind: DRAG.SEARCH, url: this.#buildSearchURL(rawText, engineURL) };
  }

  // data URI・相対パス・スキームなし URL はすべて isBase64: true として扱う
  // （background の Downloads API で処理できないため呼び元がローカル保存に切り替える）
  classifyImageSrc(src) {
    return {
      kind:     DRAG.IMAGE,
      src,
      isBase64: !PATTERNS.SCHEME.test(src) || PATTERNS.DATA_URI.test(src),
    };
  }

  // Firefox は Chrome と異なりリンク付き <img> のドラッグで target が HTMLImageElement にならないため
  // 祖先 <a> の探索は不要。代わりに event.originalTarget で実際にドラッグされた DOM ノードを取得する
  // 優先順: <img> 直接 → isPreferSaveImage 時の子孫 <img>（originalTarget 優先）→ href → テキスト
  classifyElement(event, settings) {
    const { target } = event;

    if (target instanceof HTMLImageElement) {
      return this.classifyImageSrc(target.src);
    }

    if (settings.isPreferSaveImage) {
      // originalTarget は Firefox 独自プロパティで、より深い DOM 位置（シャドウ DOM 内等）の要素を指す
      const foundInOriginal = event.originalTarget ? this.#findFirstImage(event.originalTarget) : null;
      const img = foundInOriginal ?? this.#findFirstImage(target);
      if (img) return this.classifyImageSrc(img.src);
    }

    if (target.href !== undefined) {
      // SVGAElement.href は SVGAnimatedString オブジェクトなので baseVal で文字列を取り出す
      const url = typeof target.href === "string" ? target.href : (target.href.baseVal ?? "");
      if (url) return { kind: DRAG.ADDRESS, url };
    }
    return this.classifyText(event.dataTransfer.getData("text/plain"), settings.engineURL);
  }
}

// ===== DomActions =====
// ドロップ時に発生する DOM 副作用をまとめた静的ユーティリティ。
// インスタンス化不要なため全メソッドを static にする。
class DomActions {
  // Clipboard API が CSP やサンドボックスで使えない場合に非表示 textarea でフォールバックする
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  // Firefox では <a> を DOM に追加してからクリックしないとダウンロードがトリガーされない
  static downloadViaAnchor(url) {
    const a = document.createElement("a");
    a.href = url;
    const m = url.match(/^data:image\/([^;]+);base64,/i);
    a.download = m
      ? `image.${m[1].toLowerCase().replace("svg+xml", "svg").replace("jpeg", "jpg")}`
      : "";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Firefox は data URI を window.open で直接開けないため Blob URL に変換してから新規タブを開く
  static openDataUri(dataUri) {
    const m = dataUri.match(/^data:([^;]+);base64,(.+)$/i);
    if (!m) return;
    const bytes = atob(m[2]);
    const arr   = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const objectUrl = URL.createObjectURL(new Blob([arr], { type: m[1] }));
    window.open(objectUrl, "_blank");
    // 新タブのロードが完了するまでの猶予を設けてから解放する
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}

// ===== DropExecutor =====
// drag の種別と修飾キーの組み合わせに応じてバックグラウンドへ送信または DOM 操作を行う。
class DropExecutor {
  async #send(type, value, isForeground, tab) {
    try {
      await browser.runtime.sendMessage({ type, value, isForeground, tab });
    } catch (e) {
      console.error("Failed to send message to background:", e);
    }
  }

  // isSaveImage=false → 画像URLを新規タブで開く
  // ctrlKey / base64 → Downloads API が使えないためアンカークリックでローカル保存
  // altKey → ダウンロードせず画像URLを新規タブで開く
  // デフォルト → background の Downloads API でダウンロードダイアログを表示
  async #executeImage(drag, event, settings) {
    const { src, isBase64 } = drag;
    if (!settings.isSaveImage) {
      await this.#send(MESSAGE_TYPE.SEARCH, src, settings.isSearchForeground, settings.newTabPosition);
      return;
    }
    if (isBase64 || event.ctrlKey) { DomActions.downloadViaAnchor(src); return; }
    await this.#send(
      event.altKey ? MESSAGE_TYPE.SEARCH : MESSAGE_TYPE.DOWNLOAD,
      src,
      true,
      settings.newTabPosition
    );
  }

  // ctrlKey → クリップボードにコピーしつつ新規タブも開く
  // altKey（ctrlKey なし）→ ダウンロード / デフォルト → 新規タブで開く
  async #executeAddress(drag, event, settings) {
    const { url } = drag;
    if (PATTERNS.DATA_URI.test(url)) { DomActions.openDataUri(url); return; }
    if (event.ctrlKey) DomActions.copyToClipboard(url);
    await this.#send(
      event.altKey && !event.ctrlKey ? MESSAGE_TYPE.DOWNLOAD : MESSAGE_TYPE.SEARCH,
      url,
      settings.isAddressForeground,
      settings.newTabPosition
    );
  }

  // ctrlKey → URL エンコード前の元テキストをクリップボードにコピーする
  async #executeSearch(drag, event, settings) {
    const { url } = drag;
    if (event.ctrlKey) DomActions.copyToClipboard(event.dataTransfer.getData("text/plain"));
    await this.#send(MESSAGE_TYPE.SEARCH, url, settings.isSearchForeground, settings.newTabPosition);
  }

  async execute(drag, event, settings) {
    switch (drag.kind) {
      case DRAG.IMAGE:   await this.#executeImage(drag, event, settings);   break;
      case DRAG.ADDRESS: await this.#executeAddress(drag, event, settings); break;
      case DRAG.SEARCH:  await this.#executeSearch(drag, event, settings);  break;
    }
  }
}

// ===== FrameSync =====
// iframe / frame をまたいで drag ペイロードを postMessage で同期する。
// クロスオリジンフレームへの送信は例外を握り潰して継続する。
class FrameSync {
  #handler = null;

  // サブフレームからは top とその全兄弟フレームへ送信し、top フレームからは全子フレームへ送信する
  broadcast(drag) {
    const msg = { message_addon: MESSAGE_TYPE.SET_STR, drag };
    if (window !== window.top) {
      try {
        window.top.postMessage(msg, "*");
        // window.top[i] はフレームインデックスによるサブフレームへの参照（Window オブジェクトの配列的アクセス）
        for (let i = 0; i < window.top.length; i++) {
          if (window.top[i] !== window) window.top[i].postMessage(msg, "*");
        }
      } catch { /* cross-origin */ }
    } else {
      for (const tag of ["frame", "iframe"]) {
        for (const el of document.getElementsByTagName(tag)) {
          try { el.contentWindow?.postMessage(msg, "*"); } catch { /* cross-origin */ }
        }
      }
    }
  }

  // message の送信元が同一ページ内の正当なフレームかを検証する
  // サブフレームでは top と top の直接子フレーム、トップでは直接子フレームのみを許可する
  // cross-origin top の場合は window.top[i] アクセスで例外になるため、その場合のみ検証をスキップする
  #isValidSource(source) {
    if (!source) return false;
    if (window !== window.top) {
      if (source === window.top) return true;
      try {
        for (let i = 0; i < window.top.length; i++) {
          if (window.top[i] === source) return true;
        }
      } catch { /* cross-origin top: 検証不可のため許可する */ return true; }
      return false;
    }
    for (const tag of ["frame", "iframe"]) {
      for (const el of document.getElementsByTagName(tag)) {
        try { if (el.contentWindow === source) return true; } catch {}
      }
    }
    return false;
  }

  // onDrag コールバックで QuickDragController の #drag を更新することでフレーム間の状態を統一する
  listen(onDrag) {
    this.#handler = (event) => {
      const { data, source } = event;
      if (data?.message_addon === MESSAGE_TYPE.SET_STR && data.drag && this.#isValidSource(source)) onDrag(data.drag);
    };
    window.addEventListener("message", this.#handler);
  }

  // 参照を保存しているため確実に同じリスナーを削除できる
  unlisten() {
    if (this.#handler) {
      window.removeEventListener("message", this.#handler);
      this.#handler = null;
    }
  }
}

// ===== HistoryPatcher =====
// SPA のクライアントサイドルーティングを検知するため history.pushState / replaceState にフックを挿入する。
class HistoryPatcher {
  #origPushState    = null;
  #origReplaceState = null;

  // トップフレームのみパッチし、二重パッチを防ぐ（activate() が複数回呼ばれても安全）
  patch(onNavigate) {
    if (window !== window.top || this.#origPushState !== null) return;
    this.#origPushState    = history.pushState.bind(history);
    this.#origReplaceState = history.replaceState.bind(history);
    history.pushState    = (...a) => { this.#origPushState(...a);    onNavigate(); };
    history.replaceState = (...a) => { this.#origReplaceState(...a); onNavigate(); };
  }

  // 元の関数を復元し、次の activate() で再パッチできるよう null に戻す
  unpatch() {
    if (this.#origPushState    !== null) { history.pushState    = this.#origPushState;    this.#origPushState    = null; }
    if (this.#origReplaceState !== null) { history.replaceState = this.#origReplaceState; this.#origReplaceState = null; }
  }
}

// ===== QuickDragController =====
// コンテンツスクリプトの最上位クラス。各クラスのインスタンスを保持し、ライフサイクルを管理する。
class QuickDragController {
  #settings       = new SettingsManager();
  #classifier     = new DragClassifier();
  #executor       = new DropExecutor();
  #frameSync      = new FrameSync();
  #historyPatcher = new HistoryPatcher();

  #drag     = { kind: DRAG.NONE };
  #isActive = false;

  // removeEventListener で同一関数参照が必要なためアロー関数でインスタンスに束縛する
  #handleDragStart = (e) => this.#onDragStart(e);
  #handleDragOver  = (e) => this.#onDragOver(e);
  #handleDragEnd   = (e) => this.#onDragEnd(e);
  #handleDrop      = (e) => this.#onDrop(e);

  static #isInputTarget({ target }) {
    const tag = target.nodeName.toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA";
  }

  // shiftKey はネイティブのドラッグ動作を通すための脱出口。drag を NONE にリセットして伝播を止める
  #onDragStart(event) {
    this.#drag = { kind: DRAG.NONE };
    if (event.shiftKey) { this.#frameSync.broadcast(this.#drag); return; }

    // textarea / input の選択テキストドラッグはテキスト分類として扱う
    const isDraggableElement =
      event.target instanceof HTMLElement &&
      !(event.target instanceof HTMLTextAreaElement) &&
      !(event.target instanceof HTMLInputElement);

    this.#drag = isDraggableElement
      ? this.#classifier.classifyElement(event, this.#settings.getAll())
      : this.#classifier.classifyText(event.dataTransfer.getData("text/plain"), this.#settings.get("engineURL"));

    this.#frameSync.broadcast(this.#drag);
  }

  // Firefox は input / textarea へのドロップをブラウザ側でブロックするため isInputTarget チェックは不要
  #onDragOver(event) {
    if (!event.shiftKey) event.preventDefault();
  }

  // ドロップが成立しなかった場合にブラウザが表示するスナップバックアニメーションを抑制する
  #onDragEnd(event) {
    if (!event.shiftKey) event.preventDefault();
  }

  // ドロップ処理後は必ず drag を NONE にリセットして全フレームに通知する
  async #onDrop(event) {
    if (QuickDragController.#isInputTarget(event) || event.shiftKey) {
      this.#drag = { kind: DRAG.NONE };
      this.#frameSync.broadcast(this.#drag);
      return;
    }

    event.preventDefault();

    if (this.#drag.kind !== DRAG.NONE) {
      await this.#executor.execute(this.#drag, event, this.#settings.getAll());
    }

    this.#drag = { kind: DRAG.NONE };
    this.#frameSync.broadcast(this.#drag);
  }

  async #checkDisabled() {
    try {
      const res = await browser.runtime.sendMessage({ type: "checkDisabled" });
      return res?.disabled ?? false;
    } catch {
      // background スクリプトが応答できない状態（拡張機能の再読み込み直後等）に備えて false を返す
      return false;
    }
  }

  async #handleNavigation() {
    if (await this.#checkDisabled()) this.deactivate();
    else await this.activate();
  }

  // 冪等: 既にアクティブな場合は設定の再ロードをスキップして早期リターンする
  async activate() {
    if (this.#isActive) return;
    this.#isActive = true;
    await this.#settings.load();
    document.addEventListener("dragstart", this.#handleDragStart);
    document.addEventListener("dragover",  this.#handleDragOver);
    document.addEventListener("dragend",   this.#handleDragEnd);
    document.addEventListener("drop",      this.#handleDrop);
    this.#frameSync.listen(drag => { this.#drag = drag; });
    this.#historyPatcher.patch(() => this.#handleNavigation());
  }

  // 冪等: 既に非アクティブなら何もしない
  deactivate() {
    if (!this.#isActive) return;
    this.#isActive = false;
    document.removeEventListener("dragstart", this.#handleDragStart);
    document.removeEventListener("dragover",  this.#handleDragOver);
    document.removeEventListener("dragend",   this.#handleDragEnd);
    document.removeEventListener("drop",      this.#handleDrop);
    this.#frameSync.unlisten();
    this.#historyPatcher.unpatch();
  }

  async initialize() {
    // サイトルール変更は非アクティブ時でも即座に有効 / 無効を再評価する
    // その他の設定変更はアクティブ時のみ反映する（非アクティブ時は activate() 時に再ロードされる）
    browser.storage.onChanged.addListener(async (changes, area) => {
      if (area !== "local") return;
      if (RULES_STORAGE_KEY in changes) { await this.#handleNavigation(); return; }
      if (!this.#isActive) return;
      // storage.onChanged の {key: {oldValue, newValue}} 形式を update() 向けの {key: value} 形式に変換する
      this.#settings.update(Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.newValue])));
    });

    // popstate / hashchange は SPA のクライアントサイドルーティングで pushState が呼ばれない場合に対応する
    if (window === window.top) {
      const nav = () => this.#handleNavigation();
      window.addEventListener("popstate",   nav);
      window.addEventListener("hashchange", nav);
    }

    if (!await this.#checkDisabled()) await this.activate();
  }
}

new QuickDragController().initialize().catch(e => console.error("Failed to initialize QuickDrag:", e));

})();
