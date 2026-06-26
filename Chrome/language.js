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
    rule_title: "Disable Rules",
    rule_help: "Rules are checked in order, and the first matching rule is applied. Regular expressions can be used.",
    rule_th: "Pattern",
    rule_dup_error: "Duplicate patterns found",
    save_btn: "Save",
    save_btn_done: "Saved",
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
    rule_title: "禁用的网站模式",
    rule_help: "规则按顺序检查，第一个匹配的规则将被应用。支持正则表达式。",
    rule_th: "模式",
    rule_dup_error: "发现重复模式",
    save_btn: "保存",
    save_btn_done: "已保存",
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
    rule_title: "停用的網站模式",
    rule_help: "規則按順序檢查，第一個符合的規則將被套用。支援正規表示式。",
    rule_th: "模式",
    rule_dup_error: "發現重複的模式",
    save_btn: "儲存",
    save_btn_done: "已儲存",
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
    rule_title: "Deaktivierte Website-Muster",
    rule_help: "Regeln werden der Reihe nach geprüft; die erste passende Regel wird angewendet. Reguläre Ausdrücke werden unterstützt.",
    rule_th: "Muster",
    rule_dup_error: "Doppelte Muster gefunden",
    save_btn: "Speichern",
    save_btn_done: "Gespeichert",
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
    rule_title: "비활성화된 사이트 패턴",
    rule_help: "규칙은 순서대로 확인되며, 첫 번째로 일치하는 규칙이 적용됩니다. 정규 표현식을 사용할 수 있습니다.",
    rule_th: "패턴",
    rule_dup_error: "중복된 패턴이 있습니다",
    save_btn: "저장",
    save_btn_done: "저장되었습니다",
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
    rule_title: "Шаблоны отключённых сайтов",
    rule_help: "Правила проверяются по порядку; применяется первое совпадающее правило. Поддерживаются регулярные выражения.",
    rule_th: "Шаблон",
    rule_dup_error: "Обнаружены повторяющиеся шаблоны",
    save_btn: "Сохранить",
    save_btn_done: "Сохранено",
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
    rule_title: "Modèles de sites désactivés",
    rule_help: "Les règles sont vérifiées dans l'ordre ; la première règle correspondante est appliquée. Les expressions régulières sont prises en charge.",
    rule_th: "Modèle",
    rule_dup_error: "Des modèles en double ont été trouvés",
    save_btn: "Enregistrer",
    save_btn_done: "Enregistré",
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
    rule_title: "Modelli di siti disabilitati",
    rule_help: "Le regole vengono controllate nell'ordine; viene applicata la prima regola corrispondente. Le espressioni regolari sono supportate.",
    rule_th: "Modello",
    rule_dup_error: "Sono stati trovati modelli duplicati",
    save_btn: "Salva",
    save_btn_done: "Salvato",
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
    rule_title: "Vzory zakázaných webů",
    rule_help: "Pravidla jsou kontrolována postupně; použije se první odpovídající pravidlo. Jsou podporovány regulární výrazy.",
    rule_th: "Vzor",
    rule_dup_error: "Nalezeny duplicitní vzory",
    save_btn: "Uložit",
    save_btn_done: "Uloženo",
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
    rule_title: "Deaktiverede webstedsmønstre",
    rule_help: "Regler kontrolleres i rækkefølge; den første matchende regel anvendes. Regulære udtryk er understøttet.",
    rule_th: "Mønster",
    rule_dup_error: "Der er fundet dublerede mønstre",
    save_btn: "Gem",
    save_btn_done: "Gemt",
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
    rule_title: "Uitgeschakelde sitepatronen",
    rule_help: "Regels worden op volgorde gecontroleerd; de eerste overeenkomende regel wordt toegepast. Reguliere expressies worden ondersteund.",
    rule_th: "Patroon",
    rule_dup_error: "Dubbele patronen gevonden",
    save_btn: "Opslaan",
    save_btn_done: "Opgeslagen",
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
    rule_title: "Wzorce wyłączonych witryn",
    rule_help: "Reguły są sprawdzane po kolei; pierwsza pasująca reguła zostaje zastosowana. Obsługiwane są wyrażenia regularne.",
    rule_th: "Wzorzec",
    rule_dup_error: "Znaleziono zduplikowane wzorce",
    save_btn: "Zapisz",
    save_btn_done: "Zapisano",
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
    rule_title: "Padrões de sites desativados",
    rule_help: "As regras são verificadas em ordem; a primeira regra correspondente é aplicada. Expressões regulares são suportadas.",
    rule_th: "Padrão",
    rule_dup_error: "Padrões duplicados encontrados",
    save_btn: "Salvar",
    save_btn_done: "Salvo",
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
    rule_title: "Обрасци онемогућених сајтова",
    rule_help: "Правила се проверавају по редоследу; примењује се прво правило које одговара. Подржани су регуларни изрази.",
    rule_th: "Образац",
    rule_dup_error: "Пронађени су дупликати образаца",
    save_btn: "Сачувај",
    save_btn_done: "Сачувано",
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
    rule_title: "Inaktiverade webbplatsmönster",
    rule_help: "Regler kontrolleras i ordning; den första matchande regeln tillämpas. Reguljära uttryck stöds.",
    rule_th: "Mönster",
    rule_dup_error: "Duplicerade mönster hittades",
    save_btn: "Spara",
    save_btn_done: "Sparat",
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
    rule_title: "Devre dışı bırakılan site desenleri",
    rule_help: "Kurallar sırasıyla kontrol edilir; ilk eşleşen kural uygulanır. Düzenli ifadeler desteklenmektedir.",
    rule_th: "Desen",
    rule_dup_error: "Yinelenen desenler bulundu",
    save_btn: "Kaydet",
    save_btn_done: "Kaydedildi",
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
    rule_title: "Шаблони вимкнених сайтів",
    rule_help: "Правила перевіряються по порядку; застосовується перше відповідне правило. Регулярні вирази підтримуються.",
    rule_th: "Шаблон",
    rule_dup_error: "Знайдено повторювані шаблони",
    save_btn: "Зберегти",
    save_btn_done: "Збережено",
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
    rule_title: "Mẫu trang web bị tắt",
    rule_help: "Các quy tắc được kiểm tra theo thứ tự; quy tắc đầu tiên khớp sẽ được áp dụng. Hỗ trợ biểu thức chính quy.",
    rule_th: "Mẫu",
    rule_dup_error: "Tìm thấy các mẫu trùng lặp",
    save_btn: "Lưu",
    save_btn_done: "Đã lưu",
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
    rule_title: "無効化ルール",
    rule_help: "ルールは順番にチェックされ、最初にマッチしたルールが適用されます。正規表現が利用できます。",
    rule_th: "パターン",
    rule_dup_error: "重複するパターンがあります",
    save_btn: "保存",
    save_btn_done: "保存しました",
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
    "rule-title": "rule_title",
    "rule-help": "rule_help",
    "rule-th": "rule_th",
    "save-btn": "save_btn",
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
  window._qdT = Object.assign({}, fallback, translation);
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
  // 英語を同期的に適用して window._qdT を即時利用可能にする
  applyTranslation(TRANSLATIONS[DEFAULT_LANGUAGE]);
  chrome.i18n.getAcceptLanguages((languages) => {
    if (chrome.runtime.lastError) {
      return;
    }
    setLanguage(languages);
  });
}

// 初期化実行
initialize();

})();
