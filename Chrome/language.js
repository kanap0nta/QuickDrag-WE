"use strict";

(() => {

// ========================================
// 翻訳テーブル
// ========================================
const TRANSLATIONS = Object.freeze({
  en: {
    setting_title: "QuickDrag Settings",
    engine_title: "Search engine ",
    is_address_foreground: " Open tabs for web addresses in the foreground",
    is_search_foreground: " Open tabs for text searches in the foreground",
    is_save_image: " Use drag-and-drop to download images",
    is_prefer_save_image: " In the case of an image with a link, priority is given to download images",
    tab_title: "New tab position",
    tab_open_right: "Right",
    tab_open_left: "Left",
    tab_open_last: "Last",
    tab_open_first: "First",
    auto_save_notice: "Settings are saved automatically",
    site_enabled_label: " Enable on this site",
    patterns_title: "Disabled site patterns",
    patterns_help: "One pattern per line. Use * as wildcard. Without / → hostname match (example.com). With / → path match (example.com/path/*)",
  },
  "zh-CN": {
    setting_title: "QuickDrag 选项",
    engine_title: "搜索引擎 ",
    is_address_foreground: " 在前台标签页中打开链接",
    is_search_foreground: " 在前台标签页中搜索",
    is_save_image: " 启用鼠标拖拽下载图片",
    is_prefer_save_image: " 对于带链接的图片，优先下载图片",
    tab_title: "新标签位置",
    tab_open_right: "右",
    tab_open_left: "左",
    tab_open_last: "最后",
    tab_open_first: "最前",
    auto_save_notice: "设置自动保存",
    site_enabled_label: " 在此网站上启用",
    patterns_title: "禁用的网站模式",
    patterns_help: "每行一个模式。使用 * 作为通配符。没有 / → 主机名匹配 (example.com)。有 / → 路径匹配 (example.com/path/*)",
  },
  "zh-tw": {
    setting_title: "QuickDrag 設定",
    engine_title: "搜尋引擎 ",
    is_address_foreground: " 用新分頁開啟連結後自動切換至該分頁",
    is_search_foreground: " 用新分頁開啟搜尋後自動切換至該分頁",
    is_save_image: " 使用滑鼠拖放下載圖片",
    is_prefer_save_image: " 針對帶有連結的圖片，優先下載圖片",
    tab_title: "新分頁位置",
    tab_open_right: "右",
    tab_open_left: "左",
    tab_open_last: "最後",
    tab_open_first: "最前",
    auto_save_notice: "設定自動儲存",
    site_enabled_label: " 在此網站上啟用",
    patterns_title: "停用的網站模式",
    patterns_help: "每行一個模式。使用 * 作為萬用字元。沒有 / → 主機名稱比對 (example.com)。有 / → 路徑比對 (example.com/path/*)",
  },
  de: {
    setting_title: "QuickDrag Einstellungen",
    engine_title: "Suchmaschine ",
    is_address_foreground: " Tabs für Webadressen im Vordergrund öffnen",
    is_search_foreground: " Tabs für Textsuchen im Vordergrund öffnen",
    is_save_image: " Drag-and-Drop verwenden, um Bilder herunterzuladen",
    is_prefer_save_image: " Bei einem Bild mit Link hat das Speichern des Bildes Priorität",
    tab_title: "Position neuer Tabs",
    tab_open_right: "Rechts",
    tab_open_left: "Links",
    tab_open_last: "Am Ende",
    tab_open_first: "Am Anfang",
    auto_save_notice: "Einstellungen werden automatisch gespeichert",
    site_enabled_label: " Auf dieser Seite aktivieren",
    patterns_title: "Deaktivierte Website-Muster",
    patterns_help: "Ein Muster pro Zeile. * als Platzhalter verwenden. Ohne / → Hostname-Treffer (example.com). Mit / → Pfad-Treffer (example.com/path/*)",
  },
  "ko-kr": {
    setting_title: "퀵드래그 설정",
    engine_title: "검색 엔진 ",
    is_address_foreground: " 웹 주소를 활성화된 탭(포그라운드)으로 열기",
    is_search_foreground: " 텍스트 검색을 활성화된 탭(포그라운드)으로 열기",
    is_save_image: " 드래그앤드롭으로 이미지 다운로드",
    is_prefer_save_image: " 링크가 있는 이미지의 경우 이미지 저장을 우선합니다",
    tab_title: "새 탭 위치",
    tab_open_right: "오른쪽",
    tab_open_left: "왼쪽",
    tab_open_last: "마지막",
    tab_open_first: "처음",
    auto_save_notice: "설정이 자동으로 저장됩니다",
    site_enabled_label: " 이 사이트에서 활성화",
    patterns_title: "비활성화된 사이트 패턴",
    patterns_help: "한 줄에 하나의 패턴. *를 와일드카드로 사용. / 없음 → 호스트명 매칭 (example.com). / 있음 → 경로 매칭 (example.com/path/*)",
  },
  "ru-RU": {
    setting_title: "Настройки QuickDrag",
    engine_title: "Поисковая система ",
    is_address_foreground: " Открывать обычную и текстовую ссылку в активной новой вкладке",
    is_search_foreground: " Загружать поисковый запрос в активной новой вкладке",
    is_save_image: " Использовать drag-and-drop для сохранения изображения",
    is_prefer_save_image: " В случае изображения со ссылкой приоритет отдавать сохранению изображения",
    tab_title: "Открывать новую вкладку ",
    tab_open_right: "справа",
    tab_open_left: "слева",
    tab_open_last: "в конце",
    tab_open_first: "в начале",
    auto_save_notice: "Настройки сохраняются автоматически",
    site_enabled_label: " Включить на этом сайте",
    patterns_title: "Шаблоны отключённых сайтов",
    patterns_help: "Один шаблон на строку. * — подстановочный знак. Без / → совпадение по имени хоста (example.com). С / → совпадение по пути (example.com/path/*)",
  },
  fr: {
    setting_title: "Paramètres de QuickDrag",
    engine_title: "Moteur de recherche ",
    is_address_foreground: " Ouvrir les onglets des adresses Web au premier plan",
    is_search_foreground: " Ouvrir les onglets des recherches de texte au premier plan",
    is_save_image: " Utiliser le glisser-déposer pour télécharger des images",
    is_prefer_save_image: " Dans le cas d'une image avec un lien, la priorité est donnée au téléchargement des images",
    tab_title: "Position du nouvel onglet",
    tab_open_right: "Droite",
    tab_open_left: "Gauche",
    tab_open_last: "Dernier",
    tab_open_first: "Premier",
    auto_save_notice: "Les paramètres sont enregistrés automatiquement",
    site_enabled_label: " Activer sur ce site",
    patterns_title: "Modèles de sites désactivés",
    patterns_help: "Un modèle par ligne. Utilisez * comme caractère générique. Sans / → correspondance de nom d'hôte (example.com). Avec / → correspondance de chemin (example.com/path/*)",
  },
  "it-IT": {
    setting_title: "Opzioni di QuickDrag",
    engine_title: "Motore di ricerca ",
    is_address_foreground: " Apri le schede per gli indirizzi web in primo piano",
    is_search_foreground: " Apri le schede per le ricerche di testo in primo piano",
    is_save_image: " Trascina le immagini per avviarne il download",
    is_prefer_save_image: " Nel caso di un'immagine con collegamento, viene data priorità al salvataggio delle immagini",
    tab_title: "Posizione della nuova scheda",
    tab_open_right: "Destra",
    tab_open_left: "Sinistra",
    tab_open_last: "Ultimo",
    tab_open_first: "Primo",
    auto_save_notice: "Le impostazioni vengono salvate automaticamente",
    site_enabled_label: " Attiva su questo sito",
    patterns_title: "Modelli di siti disabilitati",
    patterns_help: "Un modello per riga. Usa * come carattere jolly. Senza / → corrispondenza nome host (example.com). Con / → corrispondenza percorso (example.com/path/*)",
  },
  cs: {
    setting_title: "QuickDrag Nastavení",
    engine_title: "Vyhledávač ",
    is_address_foreground: " Otevírat panely s webovými adresami na popředí",
    is_search_foreground: " Otevírat panely pro textové vyhledávání na popředí",
    is_save_image: " Použít drag-and-drop ke stažení obrázků",
    is_prefer_save_image: " V případě obrázku s odkazem má prioritu ukládání obrázků",
    tab_title: "Pozice nové karty",
    tab_open_right: "Vpravo",
    tab_open_left: "Vlevo",
    tab_open_last: "Poslední",
    tab_open_first: "První",
    auto_save_notice: "Nastavení se ukládá automaticky",
    site_enabled_label: " Povolit na tomto webu",
    patterns_title: "Vzory zakázaných webů",
    patterns_help: "Jeden vzor na řádek. Použijte * jako zástupný znak. Bez / → shoda s názvem hostitele (example.com). S / → shoda s cestou (example.com/path/*)",
  },
  da: {
    setting_title: "QuickDrag Indstillinger",
    engine_title: "Søgemaskine ",
    is_address_foreground: " Åbn faner for webadresser i forgrunden",
    is_search_foreground: " Åbn faner for tekstsøgninger i forgrunden",
    is_save_image: " Brug træk-og-slip til at downloade billeder",
    is_prefer_save_image: " I tilfælde af et billede med et link prioriteres download af billeder",
    tab_title: "Ny faneposition",
    tab_open_right: "Højre",
    tab_open_left: "Venstre",
    tab_open_last: "Sidst",
    tab_open_first: "Først",
    auto_save_notice: "Indstillinger gemmes automatisk",
    site_enabled_label: " Aktivér på dette websted",
    patterns_title: "Deaktiverede webstedsmønstre",
    patterns_help: "Ét mønster pr. linje. Brug * som jokertegn. Uden / → værtsnavn-match (example.com). Med / → stie-match (example.com/path/*)",
  },
  nl: {
    setting_title: "QuickDrag-instellingen",
    engine_title: "Zoekmachine ",
    is_address_foreground: " Tabbladen voor internetadressen op de voorgrond openen",
    is_search_foreground: " Tabbladen voor tekstzoekopdrachten op de voorgrond openen",
    is_save_image: " Drag-and-drop gebruiken voor het downloaden van afbeeldingen",
    is_prefer_save_image: " In het geval van een afbeelding met een koppeling krijgt het downloaden van afbeeldingen prioriteit",
    tab_title: "Nieuwe tabbladpositie",
    tab_open_right: "Rechts",
    tab_open_left: "Links",
    tab_open_last: "Laatste",
    tab_open_first: "Eerste",
    auto_save_notice: "Instellingen worden automatisch opgeslagen",
    site_enabled_label: " Inschakelen op deze site",
    patterns_title: "Uitgeschakelde sitepatronen",
    patterns_help: "Één patroon per regel. Gebruik * als jokerteken. Zonder / → hostnaam-overeenkomst (example.com). Met / → padovereenkomst (example.com/path/*)",
  },
  pl: {
    setting_title: "QuickDrag - ustawienia",
    engine_title: "Wyszukiwarka ",
    is_address_foreground: " Otwieraj adresy URL w nowej karcie na pierwszym planie",
    is_search_foreground: " Otwieraj wyniki wyszukiwania w nowej karcie na pierwszym planie",
    is_save_image: " Użyj funkcji „przeciągnij i upuść” do pobierania obrazków",
    is_prefer_save_image: " W przypadku obrazu z łączem pierwszeństwo ma zapisywanie obrazu",
    tab_title: "Nowa pozycja karty",
    tab_open_right: "Po prawej",
    tab_open_left: "Po lewej",
    tab_open_last: "Na końcu",
    tab_open_first: "Na początku",
    auto_save_notice: "Ustawienia są zapisywane automatycznie",
    site_enabled_label: " Włącz na tej stronie",
    patterns_title: "Wzorce wyłączonych witryn",
    patterns_help: "Jeden wzorzec na linię. Użyj * jako symbolu zastępczego. Bez / → dopasowanie nazwy hosta (example.com). Z / → dopasowanie ścieżki (example.com/path/*)",
  },
  "pt-BR": {
    setting_title: "Configurações QuickDrag",
    engine_title: "Mecanismo de busca ",
    is_address_foreground: " Abrir abas para endereços web em primeiro plano",
    is_search_foreground: " Abrir abas para pesquisas de texto em primeiro plano",
    is_save_image: " Usar arrastar-e-soltar para baixar imagens",
    is_prefer_save_image: " No caso de uma imagem com link, dar prioridade ao download da imagem",
    tab_title: "Nova posição da aba",
    tab_open_right: "Direita",
    tab_open_left: "Esquerda",
    tab_open_last: "Último",
    tab_open_first: "Primeiro",
    auto_save_notice: "As configurações são salvas automaticamente",
    site_enabled_label: " Ativar neste site",
    patterns_title: "Padrões de sites desativados",
    patterns_help: "Um padrão por linha. Use * como curinga. Sem / → correspondência de nome de host (example.com). Com / → correspondência de caminho (example.com/path/*)",
  },
  sr: {
    setting_title: "Подешавања БрзогПревлачења",
    engine_title: "Претраживач ",
    is_address_foreground: " Отвори језичке за веб-адресе у првом плану",
    is_search_foreground: " Отвори језичке за претраге текста у првом плану",
    is_save_image: " Користи „превлачење-и-спуштање” за чување слика",
    is_prefer_save_image: " У случају слике са везом, дај предност чувању слике",
    tab_title: "Позиција нове картице",
    tab_open_right: "Десно",
    tab_open_left: "Лево",
    tab_open_last: "На крају",
    tab_open_first: "На почетку",
    auto_save_notice: "Подешавања се аутоматски чувају",
    site_enabled_label: " Омогући на овом сајту",
    patterns_title: "Обрасци онемогућених сајтова",
    patterns_help: "Један образац по линији. Користи * као џокер знак. Без / → поклапање назива домаћина (example.com). Са / → поклапање путање (example.com/path/*)",
  },
  "sv-SE": {
    setting_title: "Inställningar för QuickDrag",
    engine_title: "Sökmotor ",
    is_address_foreground: " Öppna flikar för webbadresser i förgrunden",
    is_search_foreground: " Öppna flikar för textsökningar i förgrunden",
    is_save_image: " Använd dra-och-släpp för att ladda ner bilder",
    is_prefer_save_image: " När det gäller en bild med en länk prioriteras nedladdning av bilder",
    tab_title: "Ny flikposition",
    tab_open_right: "Höger",
    tab_open_left: "Vänster",
    tab_open_last: "Sista",
    tab_open_first: "Först",
    auto_save_notice: "Inställningar sparas automatiskt",
    site_enabled_label: " Aktivera på den här webbplatsen",
    patterns_title: "Inaktiverade webbplatsmönster",
    patterns_help: "Ett mönster per rad. Använd * som jokertecken. Utan / → värdnamns-matchning (example.com). Med / → sökvägsmatchning (example.com/path/*)",
  },
  "tr-TR": {
    setting_title: "QuickDrag Ayarları",
    engine_title: "Arama motoru ",
    is_address_foreground: " Web adresleri için sekmeleri ön planda aç",
    is_search_foreground: " Metin aramaları için sekmeleri ön planda aç",
    is_save_image: " Resimleri indirmek için sürükle-bırak kullan",
    is_prefer_save_image: " Bağlantılı bir görsel olduğunda, görseli indirmeye öncelik ver",
    tab_title: "Yeni sekme konumu",
    tab_open_right: "Sağ",
    tab_open_left: "Sol",
    tab_open_last: "Son",
    tab_open_first: "İlk",
    auto_save_notice: "Ayarlar otomatik olarak kaydedilir",
    site_enabled_label: " Bu sitede etkinleştir",
    patterns_title: "Devre dışı bırakılan site desenleri",
    patterns_help: "Satır başına bir desen. * joker karakter olarak kullanın. / olmadan → ana bilgisayar adı eşleşmesi (example.com). / ile → yol eşleşmesi (example.com/path/*)",
  },
  uk: {
    setting_title: "Налаштування QuickDrag",
    engine_title: "Пошукова система ",
    is_address_foreground: " Відкривати звичайне або текстове посилання у активній новій вкладці",
    is_search_foreground: " Відкривати пошуковий запит у активній новій вкладці",
    is_save_image: " Використовувати drag-and-drop зображення для завантаження",
    is_prefer_save_image: " У випадку з зображенням із посиланням пріоритет надавати зберіганню зображення",
    tab_title: "Відкривати нову вкладку ",
    tab_open_right: "справа",
    tab_open_left: "зліва",
    tab_open_last: "у кінці",
    tab_open_first: "на початку",
    auto_save_notice: "Налаштування зберігаються автоматично",
    site_enabled_label: " Увімкнути на цьому сайті",
    patterns_title: "Шаблони вимкнених сайтів",
    patterns_help: "Один шаблон на рядок. Використовуйте * як підстановочний знак. Без / → збіг за іменем хосту (example.com). З / → збіг за шляхом (example.com/path/*)",
  },
  "vi-vn": {
    setting_title: "Thiết Lập QuickDrag",
    engine_title: "Công cụ tìm kiếm ",
    is_address_foreground: " Mở địa chỉ web trong tab nền trước",
    is_search_foreground: " Mở tìm kiếm văn bản trong tab nền trước",
    is_save_image: " Sử dụng kéo và thả để tải xuống hình ảnh",
    is_prefer_save_image: " Với hình ảnh có liên kết, ưu tiên tải hình ảnh",
    tab_title: "Vị trí tab mới",
    tab_open_right: "Phải",
    tab_open_left: "Trái",
    tab_open_last: "Cuối cùng",
    tab_open_first: "Đầu tiên",
    auto_save_notice: "Cài đặt được lưu tự động",
    site_enabled_label: " Bật trên trang web này",
    patterns_title: "Mẫu trang web bị tắt",
    patterns_help: "Một mẫu mỗi dòng. Dùng * làm ký tự đại diện. Không có / → khớp tên máy chủ (example.com). Có / → khớp đường dẫn (example.com/path/*)",
  },
  ja: {
    setting_title: "QuickDrag 設定",
    engine_title: "検索エンジン ",
    is_address_foreground: " Webアドレスをフォアグラウンドタブで開く",
    is_search_foreground: " 検索結果をフォアグラウンドタブで開く",
    is_save_image: " ドラッグ＆ドロップで画像を保存する",
    is_prefer_save_image: " リンク付き画像の場合は、画像保存を優先する",
    tab_title: "新規タブ位置",
    tab_open_right: "右",
    tab_open_left: "左",
    tab_open_last: "最後",
    tab_open_first: "先頭",
    auto_save_notice: "設定は自動的に保存されます",
    site_enabled_label: " このサイトで有効にする",
    patterns_title: "無効サイトのパターン",
    patterns_help: "1行につき1パターン。*はワイルドカード。/ なし→ホスト名マッチ (example.com)、/ あり→パスマッチ (example.com/path/*)",
  },
});

// デフォルト言語
const DEFAULT_LANGUAGE = "en";

// ========================================
// 要素IDと翻訳キーのマッピング
// ========================================
const ELEMENT_MAPPINGS = Object.freeze({
  textContent: {
    "setting-title": "setting_title",
    "engine-title": "engine_title",
    "is-address-foreground": "is_address_foreground",
    "is-search-foreground": "is_search_foreground",
    "is-save-image": "is_save_image",
    "is-prefer-save-image": "is_prefer_save_image",
    "tab-title": "tab_title",
    "tab-open-right": "tab_open_right",
    "tab-open-left": "tab_open_left",
    "tab-open-last": "tab_open_last",
    "tab-open-first": "tab_open_first",
    "auto-save-notice": "auto_save_notice",
    "site-enabled-label": "site_enabled_label",
    "patterns-title": "patterns_title",
    "patterns-help": "patterns_help",
  },
});

// ========================================
// 言語処理関数
// ========================================

/**
 * 言語コードから翻訳データを取得
 * @param {string} langCode
 * @returns {Object}
 */
function getTranslation(langCode) {
  // 完全一致を試行
  if (TRANSLATIONS[langCode]) {
    return TRANSLATIONS[langCode];
  }

  // 小文字で試行
  const lowerCode = langCode.toLowerCase();
  if (TRANSLATIONS[lowerCode]) {
    return TRANSLATIONS[lowerCode];
  }

  // 言語部分のみで試行（例: "ja-JP" -> "ja"）
  const baseLang = langCode.split("-")[0].toLowerCase();
  if (TRANSLATIONS[baseLang]) {
    return TRANSLATIONS[baseLang];
  }

  return null;
}

/**
 * 優先言語リストから最適な翻訳を取得
 * @param {string[]} languages
 * @returns {Object}
 */
function findBestTranslation(languages) {
  for (const lang of languages) {
    const translation = getTranslation(lang);
    if (translation) {
      return translation;
    }
  }
  return TRANSLATIONS[DEFAULT_LANGUAGE];
}

/**
 * UIに翻訳を適用
 * @param {Object} translation
 */
function applyTranslation(translation) {
  const fallback = TRANSLATIONS[DEFAULT_LANGUAGE];
  // textContent を設定する要素
  for (const [elementId, translationKey] of Object.entries(ELEMENT_MAPPINGS.textContent)) {
    const element = document.getElementById(elementId);
    if (element) {
      const text = translation[translationKey] ?? fallback[translationKey] ?? "";
      if (text) element.textContent = text;
    }
  }
}

/**
 * 言語を設定
 * @param {string[]} languages - 優先言語のリスト
 */
function setLanguage(languages) {
  const translation = findBestTranslation(languages);
  applyTranslation(translation);
}

// ========================================
// 初期化
// ========================================

/**
 * 初期化処理
 */
function initialize() {
  chrome.i18n.getAcceptLanguages((languages) => {
    if (chrome.runtime.lastError) {
      console.error("Failed to get accept languages:", chrome.runtime.lastError);
      applyTranslation(TRANSLATIONS[DEFAULT_LANGUAGE]);
      return;
    }
    setLanguage(languages);
  });
}

// 初期化実行
initialize();

})();
