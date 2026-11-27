# QuickDrag WE — CLAUDE.md

ブラウザ拡張機能（Chrome / Firefox 向け Manifest V3）。テキスト・URL・画像をドラッグするだけで検索・タブ開き・画像保存を実行する。

## ディレクトリ構成

```
Chrome/          Chrome (および Edge) 向けビルド
Firefox/         Firefox 向けビルド
```

両ディレクトリのファイルはほぼ同一。差分は下記の Chrome/Firefox 差異表を参照。

ファイル一覧（Chrome/ と Firefox/ 共通）:

| ファイル | 役割 |
| --- | --- |
| `manifest.json` | 拡張機能メタデータ・パーミッション定義 |
| `constants.js` | 定数（DRAG 種別・MESSAGE_TYPE・PATTERNS・TLD リスト）。コンテンツスクリプトより先に読み込まれる |
| `storage.js` | `QDStorage`（`storage.local` ラッパー）。全コンテキスト（ページ・コンテンツスクリプト・バックグラウンド）で共有 |
| `quickdrag.js` | コンテンツスクリプト本体 |
| `background.js` | Service Worker |
| `options.html/js/css` | ポップアップ兼オプションページ |
| `options-dark.css` | ダークモード用スタイル |
| `site-rules.html/js` | サイトルール管理ページ |
| `language.js` | i18n ヘルパー |

## アーキテクチャ

### quickdrag.js（コンテンツスクリプト）

すべてのクラスは即時実行関数（IIFE）内に閉じている。

| クラス | 役割 |
| --- | --- |
| `SettingsManager` | `chrome.storage.local` の値を内部キー名に変換して保持。`update()` は `{key: {newValue}}` 形式と `{key: value}` 形式の両方を受け入れる |
| `DragClassifier` | ドラッグイベントを `{kind, url/src}` の判別共用体に分類。副作用なし |
| `DomActions` | クリップボードコピー・アンカーダウンロード・data URI 開封の静的ユーティリティ |
| `DropExecutor` | drag 種別 × 修飾キーに応じてバックグラウンドへメッセージ送信または DOM 操作 |
| `FrameSync` | `postMessage` で iframe 間の drag 状態を同期。送信元検証付き |
| `HistoryPatcher` | `history.pushState/replaceState` にフックして SPA ナビゲーションを検知 |
| `QuickDragController` | 最上位コントローラー。ライフサイクル（activate/deactivate）を管理 |

ドラッグ種別 (`DRAG` 定数):
- `NONE` — ドラッグなし / shiftKey で無効化
- `SEARCH` — テキスト検索
- `ADDRESS` — URL / メールアドレス
- `IMAGE` — 画像

修飾キーの動作:
- `shiftKey` — 全種別: QuickDrag を無効化してブラウザ標準動作にフォールバック
- `ctrlKey` — テキスト: クリップボードコピー + 検索 / URL: コピー + 新規タブ / 画像: アンカーでローカル保存
- `altKey` — URL: ダウンロード（タブを開かない）/ 画像: URL を新規タブで開く

### background.js（Service Worker）

| クラス | 役割 |
| --- | --- |
| `SiteRuleService` | サイトルールのインメモリキャッシュ。`invalidate()` まで再読み込みしない。コンパイル済み RegExp もキャッシュ |
| `TabNavigator` | `right/left/first/last` をタブインデックスに変換して新規タブを開く |
| `DownloadManager` | `chrome.downloads.download()` を Promise 化 |
| `IconManager` | 無効化タブのアイコンをグレースケール半透明に変換（OffscreenCanvas 使用） |
| `MessageHandler` | `searchURL` / `downloadImage` / `checkDisabled` メッセージを振り分け |
| `BackgroundController` | エントリポイント。全サービスをインスタンス化してイベントリスナーを登録 |

メッセージ型 (`MESSAGE_TYPE` 定数):
- `quickdrag_we_set_str` — フレーム間 drag 状態同期（postMessage）
- `searchURL` — 新規タブを開く
- `downloadImage` — ファイルダウンロード

### storage.js（QDStorage）

`storage.local` の読み書きは必ず `QDStorage.get/set/remove` を経由する（直接 `storage.local` を呼ばない）。

- Firefox は `storage.local` を IndexedDB に保存しており、DB が壊れると get / set / remove がすべて失敗し続ける（Firefox 153 以前は `clear()` でも復旧しない）。その場合だけ `storage.sync` にフォールバックする。正常時は `storage.sync` に書き込まない（復旧確認のための読み込みのみ）
- フォールバックで `storage.sync` に書くときは `qdFallbackOwner`（インストール固有の拡張機能 URL）も保存する
- `restoreFromFallback()` は `storage.local` が復旧していれば、`qdFallbackOwner` が自分のインストールと一致する `storage.sync` の値を `storage.local` に戻して sync から削除する。オプションページ・サイトルールページの初期化時とバックグラウンド起動時に呼ぶ（コンテンツスクリプトでは呼ばない）
- `storage.onChanged` の area 判定は `QDStorage.isActiveArea(area)` を使う（フォールバック中のみ `"sync"` も対象）
- `migrateLegacySettings()` は旧 `checkboxArray` 形式を個別キーに移行する（新形式のキーが既にあれば旧形式を削除するだけ）。オプションページ初期化時とバックグラウンドの `runtime.onInstalled`（reason: update）で呼ぶ
- `globalThis.QDStorage` に公開している（Firefox のバックグラウンドは module のためトップレベル宣言が共有されない）

### ストレージキー（`chrome.storage.local`）

| キー | 型 | 内容 |
| --- | --- | --- |
| `searchEngine` | string | エンジン識別子（`"google"` など） |
| `searchEngineURL` | string | 検索 URL（`%s` がクエリ位置） |
| `tabPosition` | string | `right` / `left` / `first` / `last` |
| `isAddressForeground` | boolean | URL ドラッグ時にフォアグラウンドで開くか |
| `isSearchForeground` | boolean | 検索時にフォアグラウンドで開くか |
| `isSaveImage` | boolean | 画像をダウンロードするか |
| `isPreferSaveImage` | boolean | リンク付き画像でも保存を優先するか |
| `siteRules` | Rule[] | `{host?, regexp?, status: "disable"\|"enable"}[]` |

## Chrome / Firefox 差異

### manifest.json

| 項目 | Chrome | Firefox |
| --- | --- | --- |
| バックグラウンド定義 | `"service_worker": "background.js"`（`storage.js` は `background.js` 先頭の `importScripts()` で読み込む） | `"scripts": ["storage.js", "background.js"], "type": "module"` |
| アイコンサイズ | 48 / 96 / 128 px | 48 / 96 px のみ |
| 追加パーミッション | なし | `"cookies"`（コンテナタブ取得に必要） |
| 固有フィールド | なし | `browser_specific_settings`（gecko ID・`strict_min_version`・`data_collection_permissions`） |

### API 名前空間

全ファイルで `chrome.*` → `browser.*` に置き換え（`storage` / `tabs` / `runtime` / `downloads` / `action`）。`constants.js` は API 呼び出しなしのため同一。

### quickdrag.js

| 箇所 | Chrome | Firefox |
| --- | --- | --- |
| `DragClassifier#findAncestorAnchor()` | あり。リンク付き `<img>` ドラッグ時に `target` が `HTMLImageElement` になるため祖先 `<a>` を探索 | なし。Firefox はドラッグ時に `target` が `HTMLImageElement` にならないため不要 |
| `DragClassifier#classifyElement()` | 祖先 `<a>` 探索あり | `event.originalTarget`（Firefox 独自）で実際の DOM ノードを取得 |
| `DomActions.downloadViaAnchor()` | `a.click()` のみ | `a` を DOM に追加してからクリックし、後で削除（Firefox 要件） |
| `#onDragOver()` での `input`/`textarea` チェック | あり（`isInputTarget` ガード） | なし（Firefox がブラウザ側でブロックするため不要） |

### background.js

| 箇所 | Chrome | Firefox |
| --- | --- | --- |
| 非同期メッセージ応答 | `onMessage` リスナーで `return true` + `sendResponse` コールバック | `onMessage` リスナーで Promise を return（Firefox の仕様） |
| `TabNavigator.open()` シグネチャ | `(url, position, isForeground)` | `(url, position, isForeground, cookieStoreId)` を追加。コンテナタブ内ドラッグ時に同じコンテナで開く |
| `IconManager` アイコンサイズ | 48 / 96 / 128 px を生成 | 48 / 96 px のみ生成 |
| `checkDisabled` のプロトコル除外コメント | `chrome://` や `about:` | `moz-extension://` や `about:` |

## 開発上の注意

- Chrome/Firefox で**コードを変更したら両ディレクトリに同じ変更を適用**する（共通化機構は存在しない）
- Manifest V3 のため Service Worker は非アクティブになりうる。`sendMessage` 失敗は正常ケースとして扱う
- `constants.js` は `quickdrag.js` より先にロードされるため、コンテンツスクリプトからは定数をグローバルとして参照できる
- `storage.js` はコンテンツスクリプト（`constants.js` の次）・`options.html`・`site-rules.html`・バックグラウンドで `QDStorage` を使うスクリプトより先に読み込む
- `DOMAIN_PATTERN` は IANA TLD リスト全体を正規表現に含むため非常に長い。直接編集しないこと
- サイトルール旧形式（`disabledPatterns` 配列）は `background.js` の `SiteRuleService#migrate()` で自動変換される
