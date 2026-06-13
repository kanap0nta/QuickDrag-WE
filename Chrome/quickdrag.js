"use strict";

(() => {
// ========================================
// 定数
// ========================================
const DEFAULTS = Object.freeze({
  ENGINE_URL: "https://www.google.com/search?q=",
  NEW_TAB_POSITION: "right",
  IS_ADDRESS_FOREGROUND: true,
  IS_SEARCH_FOREGROUND: true,
  IS_SAVE_IMAGE: true,
  IS_PREFER_SAVE_IMAGE: true,
});

const MESSAGE_TYPE = Object.freeze({
  SET_STR: "quickdrag_we_set_str",
  DOWNLOAD: "downloadImage",
  SEARCH: "searchURL",
});

// ========================================
// 状態管理
// ========================================
const state = {
  selectStr: "",
  isImage: false,
  isBase64: false,
  isAddressSearch: false,
};

const settings = {
  engineURL: DEFAULTS.ENGINE_URL,
  newTabPosition: DEFAULTS.NEW_TAB_POSITION,
  isAddressForeground: DEFAULTS.IS_ADDRESS_FOREGROUND,
  isSearchForeground: DEFAULTS.IS_SEARCH_FOREGROUND,
  isSaveImage: DEFAULTS.IS_SAVE_IMAGE,
  isPreferSaveImage: DEFAULTS.IS_PREFER_SAVE_IMAGE,
};

// ========================================
// 正規表現パターン
// ========================================
const PATTERNS = {
  // RFC3986準拠URIパターン
  RFC3986: /^[a-z]([a-z]|[0-9]|[+\-.])*:(\/\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|:)*@)?(\[((([0-9a-f]{1,4}:){6}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|::([0-9a-f]{1,4}:){5}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|([0-9a-f]{1,4})?::([0-9a-f]{1,4}:){4}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:){3}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:){2}([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::([0-9a-f]{1,4}:[0-9a-f]{1,4}|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3})|(([0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(([0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|v[0-9a-f]+\.(([a-z]|[0-9]|[-._~])|[!$&'()*+,;=]|:)+)]|([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\.([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])){3}|(([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=])*)(:\d*)?(\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))*)*|\/(((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))+(\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))*)*)?|((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))+(\/((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@]))*)*|)(\?((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@])|[\/?])*)?(#((([a-z]|[0-9]|[-._~])|%[0-9a-f][0-9a-f]|[!$&'()*+,;=]|[:@])|[\/?])*)?$/i,

  // スキーム判定
  SCHEME: /^(?:(?:( +)?h?tt|hxx)ps?|ftp|chrome|file):\/\//i,

  // メールアドレス判定
  EMAIL: /^[\w.+-]+@[\w.-]+\.[\w-]{2,}$/,

  // 不正なスキーム修正用
  MALFORMED_HTTP: /^(?:t?t|h[tx]{2,})p(s?:\/\/)/i,

  // 先頭の不要文字除去
  LEADING_JUNK: /^:*[/\\\s]*/,

  // FTPパス判定
  FTP_PATH: /^ht(tp:\/\/ftp\.)/i,

  // Base64データURI判定
  DATA_URI: /^data:image\/[^;]+;base64,/i,
};

// TLDリスト（ https://data.iana.org/TLD/tlds-alpha-by-domain.txt （Version 2025101800）+ example|invalid|localhost|internal|test|onion）
const TLD_LIST = "AAA|AARP|ABB|ABBOTT|ABBVIE|ABC|ABLE|ABOGADO|ABUDHABI|AC|ACADEMY|ACCENTURE|ACCOUNTANT|ACCOUNTANTS|ACO|ACTOR|AD|ADS|ADULT|AE|AEG|AERO|AETNA|AF|AFL|AFRICA|AG|AGAKHAN|AGENCY|AI|AIG|AIRBUS|AIRFORCE|AIRTEL|AKDN|AL|ALIBABA|ALIPAY|ALLFINANZ|ALLSTATE|ALLY|ALSACE|ALSTOM|AM|AMAZON|AMERICANEXPRESS|AMERICANFAMILY|AMEX|AMFAM|AMICA|AMSTERDAM|ANALYTICS|ANDROID|ANQUAN|ANZ|AO|AOL|APARTMENTS|APP|APPLE|AQ|AQUARELLE|AR|ARAB|ARAMCO|ARCHI|ARMY|ARPA|ART|ARTE|AS|ASDA|ASIA|ASSOCIATES|AT|ATHLETA|ATTORNEY|AU|AUCTION|AUDI|AUDIBLE|AUDIO|AUSPOST|AUTHOR|AUTO|AUTOS|AW|AWS|AX|AXA|AZ|AZURE|BA|BABY|BAIDU|BANAMEX|BAND|BANK|BAR|BARCELONA|BARCLAYCARD|BARCLAYS|BAREFOOT|BARGAINS|BASEBALL|BASKETBALL|BAUHAUS|BAYERN|BB|BBC|BBT|BBVA|BCG|BCN|BD|BE|BEATS|BEAUTY|BEER|BERLIN|BEST|BESTBUY|BET|BF|BG|BH|BHARTI|BI|BIBLE|BID|BIKE|BING|BINGO|BIO|BIZ|BJ|BLACK|BLACKFRIDAY|BLOCKBUSTER|BLOG|BLOOMBERG|BLUE|BM|BMS|BMW|BN|BNPPARIBAS|BO|BOATS|BOEHRINGER|BOFA|BOM|BOND|BOO|BOOK|BOOKING|BOSCH|BOSTIK|BOSTON|BOT|BOUTIQUE|BOX|BR|BRADESCO|BRIDGESTONE|BROADWAY|BROKER|BROTHER|BRUSSELS|BS|BT|BUILD|BUILDERS|BUSINESS|BUY|BUZZ|BV|BW|BY|BZ|BZH|CA|CAB|CAFE|CAL|CALL|CALVINKLEIN|CAM|CAMERA|CAMP|CANON|CAPETOWN|CAPITAL|CAPITALONE|CAR|CARAVAN|CARDS|CARE|CAREER|CAREERS|CARS|CASA|CASE|CASH|CASINO|CAT|CATERING|CATHOLIC|CBA|CBN|CBRE|CC|CD|CENTER|CEO|CERN|CF|CFA|CFD|CG|CH|CHANEL|CHANNEL|CHARITY|CHASE|CHAT|CHEAP|CHINTAI|CHRISTMAS|CHROME|CHURCH|CI|CIPRIANI|CIRCLE|CISCO|CITADEL|CITI|CITIC|CITY|CK|CL|CLAIMS|CLEANING|CLICK|CLINIC|CLINIQUE|CLOTHING|CLOUD|CLUB|CLUBMED|CM|CN|CO|COACH|CODES|COFFEE|COLLEGE|COLOGNE|COM|COMMBANK|COMMUNITY|COMPANY|COMPARE|COMPUTER|COMSEC|CONDOS|CONSTRUCTION|CONSULTING|CONTACT|CONTRACTORS|COOKING|COOL|COOP|CORSICA|COUNTRY|COUPON|COUPONS|COURSES|CPA|CR|CREDIT|CREDITCARD|CREDITUNION|CRICKET|CROWN|CRS|CRUISE|CRUISES|CU|CUISINELLA|CV|CW|CX|CY|CYMRU|CYOU|CZ|DAD|DANCE|DATA|DATE|DATING|DATSUN|DAY|DCLK|DDS|DE|DEAL|DEALER|DEALS|DEGREE|DELIVERY|DELL|DELOITTE|DELTA|DEMOCRAT|DENTAL|DENTIST|DESI|DESIGN|DEV|DHL|DIAMONDS|DIET|DIGITAL|DIRECT|DIRECTORY|DISCOUNT|DISCOVER|DISH|DIY|DJ|DK|DM|DNP|DO|DOCS|DOCTOR|DOG|DOMAINS|DOT|DOWNLOAD|DRIVE|DTV|DUBAI|DUNLOP|DUPONT|DURBAN|DVAG|DVR|DZ|EARTH|EAT|EC|ECO|EDEKA|EDU|EDUCATION|EE|EG|EMAIL|EMERCK|ENERGY|ENGINEER|ENGINEERING|ENTERPRISES|EPSON|EQUIPMENT|ER|ERICSSON|ERNI|ES|ESQ|ESTATE|ET|EU|EUROVISION|EUS|EVENTS|EXCHANGE|EXPERT|EXPOSED|EXPRESS|EXTRASPACE|FAGE|FAIL|FAIRWINDS|FAITH|FAMILY|FAN|FANS|FARM|FARMERS|FASHION|FAST|FEDEX|FEEDBACK|FERRARI|FERRERO|FI|FIDELITY|FIDO|FILM|FINAL|FINANCE|FINANCIAL|FIRE|FIRESTONE|FIRMDALE|FISH|FISHING|FIT|FITNESS|FJ|FK|FLICKR|FLIGHTS|FLIR|FLORIST|FLOWERS|FLY|FM|FO|FOO|FOOD|FOOTBALL|FORD|FOREX|FORSALE|FORUM|FOUNDATION|FOX|FR|FREE|FRESENIUS|FRL|FROGANS|FRONTIER|FTR|FUJITSU|FUN|FUND|FURNITURE|FUTBOL|FYI|GA|GAL|GALLERY|GALLO|GALLUP|GAME|GAMES|GAP|GARDEN|GAY|GB|GBIZ|GD|GDN|GE|GEA|GENT|GENTING|GEORGE|GF|GG|GGEE|GH|GI|GIFT|GIFTS|GIVES|GIVING|GL|GLASS|GLE|GLOBAL|GLOBO|GM|GMAIL|GMBH|GMO|GMX|GN|GODADDY|GOLD|GOLDPOINT|GOLF|GOO|GOODYEAR|GOOG|GOOGLE|GOP|GOT|GOV|GP|GQ|GR|GRAINGER|GRAPHICS|GRATIS|GREEN|GRIPE|GROCERY|GROUP|GS|GT|GU|GUCCI|GUGE|GUIDE|GUITARS|GURU|GW|GY|HAIR|HAMBURG|HANGOUT|HAUS|HBO|HDFC|HDFCBANK|HEALTH|HEALTHCARE|HELP|HELSINKI|HERE|HERMES|HIPHOP|HISAMITSU|HITACHI|HIV|HK|HKT|HM|HN|HOCKEY|HOLDINGS|HOLIDAY|HOMEDEPOT|HOMEGOODS|HOMES|HOMESENSE|HONDA|HORSE|HOSPITAL|HOST|HOSTING|HOT|HOTELS|HOTMAIL|HOUSE|HOW|HR|HSBC|HT|HU|HUGHES|HYATT|HYUNDAI|IBM|ICBC|ICE|ICU|ID|IE|IEEE|IFM|IKANO|IL|IM|IMAMAT|IMDB|IMMO|IMMOBILIEN|IN|INC|INDUSTRIES|INFINITI|INFO|ING|INK|INSTITUTE|INSURANCE|INSURE|INT|INTERNATIONAL|INTUIT|INVESTMENTS|IO|IPIRANGA|IQ|IR|IRISH|IS|ISMAILI|IST|ISTANBUL|IT|ITAU|ITV|JAGUAR|JAVA|JCB|JE|JEEP|JETZT|JEWELRY|JIO|JLL|JM|JMP|JNJ|JO|JOBS|JOBURG|JOT|JOY|JP|JPMORGAN|JPRS|JUEGOS|JUNIPER|KAUFEN|KDDI|KE|KERRYHOTELS|KERRYPROPERTIES|KFH|KG|KH|KI|KIA|KIDS|KIM|KINDLE|KITCHEN|KIWI|KM|KN|KOELN|KOMATSU|KOSHER|KP|KPMG|KPN|KR|KRD|KRED|KUOKGROUP|KW|KY|KYOTO|KZ|LA|LACAIXA|LAMBORGHINI|LAMER|LAND|LANDROVER|LANXESS|LASALLE|LAT|LATINO|LATROBE|LAW|LAWYER|LB|LC|LDS|LEASE|LECLERC|LEFRAK|LEGAL|LEGO|LEXUS|LGBT|LI|LIDL|LIFE|LIFEINSURANCE|LIFESTYLE|LIGHTING|LIKE|LILLY|LIMITED|LIMO|LINCOLN|LINK|LIVE|LIVING|LK|LLC|LLP|LOAN|LOANS|LOCKER|LOCUS|LOL|LONDON|LOTTE|LOTTO|LOVE|LPL|LPLFINANCIAL|LR|LS|LT|LTD|LTDA|LU|LUNDBECK|LUXE|LUXURY|LV|LY|MA|MADRID|MAIF|MAISON|MAKEUP|MAN|MANAGEMENT|MANGO|MAP|MARKET|MARKETING|MARKETS|MARRIOTT|MARSHALLS|MATTEL|MBA|MC|MCKINSEY|MD|ME|MED|MEDIA|MEET|MELBOURNE|MEME|MEMORIAL|MEN|MENU|MERCKMSD|MG|MH|MIAMI|MICROSOFT|MIL|MINI|MINT|MIT|MITSUBISHI|MK|ML|MLB|MLS|MM|MMA|MN|MO|MOBI|MOBILE|MODA|MOE|MOI|MOM|MONASH|MONEY|MONSTER|MORMON|MORTGAGE|MOSCOW|MOTO|MOTORCYCLES|MOV|MOVIE|MP|MQ|MR|MS|MSD|MT|MTN|MTR|MU|MUSEUM|MUSIC|MV|MW|MX|MY|MZ|NA|NAB|NAGOYA|NAME|NAVY|NBA|NC|NE|NEC|NET|NETBANK|NETFLIX|NETWORK|NEUSTAR|NEW|NEWS|NEXT|NEXTDIRECT|NEXUS|NF|NFL|NG|NGO|NHK|NI|NICO|NIKE|NIKON|NINJA|NISSAN|NISSAY|NL|NO|NOKIA|NORTON|NOW|NOWRUZ|NOWTV|NP|NR|NRA|NRW|NTT|NU|NYC|NZ|OBI|OBSERVER|OFFICE|OKINAWA|OLAYAN|OLAYANGROUP|OLLO|OM|OMEGA|ONE|ONG|ONL|ONLINE|OOO|OPEN|ORACLE|ORANGE|ORG|ORGANIC|ORIGINS|OSAKA|OTSUKA|OTT|OVH|PA|PAGE|PANASONIC|PARIS|PARS|PARTNERS|PARTS|PARTY|PAY|PCCW|PE|PET|PF|PFIZER|PG|PH|PHARMACY|PHD|PHILIPS|PHONE|PHOTO|PHOTOGRAPHY|PHOTOS|PHYSIO|PICS|PICTET|PICTURES|PID|PIN|PING|PINK|PIONEER|PIZZA|PK|PL|PLACE|PLAY|PLAYSTATION|PLUMBING|PLUS|PM|PN|PNC|POHL|POKER|POLITIE|PORN|POST|PR|PRAXI|PRESS|PRIME|PRO|PROD|PRODUCTIONS|PROF|PROGRESSIVE|PROMO|PROPERTIES|PROPERTY|PROTECTION|PRU|PRUDENTIAL|PS|PT|PUB|PW|PWC|PY|QA|QPON|QUEBEC|QUEST|RACING|RADIO|RE|READ|REALESTATE|REALTOR|REALTY|RECIPES|RED|REDUMBRELLA|REHAB|REISE|REISEN|REIT|RELIANCE|REN|RENT|RENTALS|REPAIR|REPORT|REPUBLICAN|REST|RESTAURANT|REVIEW|REVIEWS|REXROTH|RICH|RICHARDLI|RICOH|RIL|RIO|RIP|RO|ROCKS|RODEO|ROGERS|ROOM|RS|RSVP|RU|RUGBY|RUHR|RUN|RW|RWE|RYUKYU|SA|SAARLAND|SAFE|SAFETY|SAKURA|SALE|SALON|SAMSCLUB|SAMSUNG|SANDVIK|SANDVIKCOROMANT|SANOFI|SAP|SARL|SAS|SAVE|SAXO|SB|SBI|SBS|SC|SCB|SCHAEFFLER|SCHMIDT|SCHOLARSHIPS|SCHOOL|SCHULE|SCHWARZ|SCIENCE|SCOT|SD|SE|SEARCH|SEAT|SECURE|SECURITY|SEEK|SELECT|SENER|SERVICES|SEVEN|SEW|SEX|SEXY|SFR|SG|SH|SHANGRILA|SHARP|SHELL|SHIA|SHIKSHA|SHOES|SHOP|SHOPPING|SHOUJI|SHOW|SI|SILK|SINA|SINGLES|SITE|SJ|SK|SKI|SKIN|SKY|SKYPE|SL|SLING|SM|SMART|SMILE|SN|SNCF|SO|SOCCER|SOCIAL|SOFTBANK|SOFTWARE|SOHU|SOLAR|SOLUTIONS|SONG|SONY|SOY|SPA|SPACE|SPORT|SPOT|SR|SRL|SS|ST|STADA|STAPLES|STAR|STATEBANK|STATEFARM|STC|STCGROUP|STOCKHOLM|STORAGE|STORE|STREAM|STUDIO|STUDY|STYLE|SU|SUCKS|SUPPLIES|SUPPLY|SUPPORT|SURF|SURGERY|SUZUKI|SV|SWATCH|SWISS|SX|SY|SYDNEY|SYSTEMS|SZ|TAB|TAIPEI|TALK|TAOBAO|TARGET|TATAMOTORS|TATAR|TATTOO|TAX|TAXI|TC|TCI|TD|TDK|TEAM|TECH|TECHNOLOGY|TEL|TEMASEK|TENNIS|TEVA|TF|TG|TH|THD|THEATER|THEATRE|TIAA|TICKETS|TIENDA|TIPS|TIRES|TIROL|TJ|TJMAXX|TJX|TK|TKMAXX|TL|TM|TMALL|TN|TO|TODAY|TOKYO|TOOLS|TOP|TORAY|TOSHIBA|TOTAL|TOURS|TOWN|TOYOTA|TOYS|TR|TRADE|TRADING|TRAINING|TRAVEL|TRAVELERS|TRAVELERSINSURANCE|TRUST|TRV|TT|TUBE|TUI|TUNES|TUSHU|TV|TVS|TW|TZ|UA|UBANK|UBS|UG|UK|UNICOM|UNIVERSITY|UNO|UOL|UPS|US|UY|UZ|VA|VACATIONS|VANA|VANGUARD|VC|VE|VEGAS|VENTURES|VERISIGN|VERSICHERUNG|VET|VG|VI|VIAJES|VIDEO|VIG|VIKING|VILLAS|VIN|VIP|VIRGIN|VISA|VISION|VIVA|VIVO|VLAANDEREN|VN|VODKA|VOLVO|VOTE|VOTING|VOTO|VOYAGE|VU|WALES|WALMART|WALTER|WANG|WANGGOU|WATCH|WATCHES|WEATHER|WEATHERCHANNEL|WEBCAM|WEBER|WEBSITE|WED|WEDDING|WEIBO|WEIR|WF|WHOSWHO|WIEN|WIKI|WILLIAMHILL|WIN|WINDOWS|WINE|WINNERS|WME|WOLTERSKLUWER|WOODSIDE|WORK|WORKS|WORLD|WOW|WS|WTC|WTF|XBOX|XEROX|XIHUAN|XIN|XN--11B4C3D|XN--1CK2E1B|XN--1QQW23A|XN--2SCRJ9C|XN--30RR7Y|XN--3BST00M|XN--3DS443G|XN--3E0B707E|XN--3HCRJ9C|XN--3PXU8K|XN--42C2D9A|XN--45BR5CYL|XN--45BRJ9C|XN--45Q11C|XN--4DBRK0CE|XN--4GBRIM|XN--54B7FTA0CC|XN--55QW42G|XN--55QX5D|XN--5SU34J936BGSG|XN--5TZM5G|XN--6FRZ82G|XN--6QQ986B3XL|XN--80ADXHKS|XN--80AO21A|XN--80AQECDR1A|XN--80ASEHDB|XN--80ASWG|XN--8Y0A063A|XN--90A3AC|XN--90AE|XN--90AIS|XN--9DBQ2A|XN--9ET52U|XN--9KRT00A|XN--B4W605FERD|XN--BCK1B9A5DRE4C|XN--C1AVG|XN--C2BR7G|XN--CCK2B3B|XN--CCKWCXETD|XN--CG4BKI|XN--CLCHC0EA0B2G2A9GCD|XN--CZR694B|XN--CZRS0T|XN--CZRU2D|XN--D1ACJ3B|XN--D1ALF|XN--E1A4C|XN--ECKVDTC9D|XN--EFVY88H|XN--FCT429K|XN--FHBEI|XN--FIQ228C5HS|XN--FIQ64B|XN--FIQS8S|XN--FIQZ9S|XN--FJQ720A|XN--FLW351E|XN--FPCRJ9C3D|XN--FZC2C9E2C|XN--FZYS8D69UVGM|XN--G2XX48C|XN--GCKR3F0F|XN--GECRJ9C|XN--GK3AT1E|XN--H2BREG3EVE|XN--H2BRJ9C|XN--H2BRJ9C8C|XN--HXT814E|XN--I1B6B1A6A2E|XN--IMR513N|XN--IO0A7I|XN--J1AEF|XN--J1AMH|XN--J6W193G|XN--JLQ480N2RG|XN--JVR189M|XN--KCRX77D1X4A|XN--KPRW13D|XN--KPRY57D|XN--KPUT3I|XN--L1ACC|XN--LGBBAT1AD8J|XN--MGB9AWBF|XN--MGBA3A3EJT|XN--MGBA3A4F16A|XN--MGBA7C0BBN0A|XN--MGBAAM7A8H|XN--MGBAB2BD|XN--MGBAH1A3HJKRD|XN--MGBAI9AZGQP6J|XN--MGBAYH7GPA|XN--MGBBH1A|XN--MGBBH1A71E|XN--MGBC0A9AZCG|XN--MGBCA7DZDO|XN--MGBCPQ6GPA1A|XN--MGBERP4A5D4AR|XN--MGBGU82A|XN--MGBI4ECEXP|XN--MGBPL2FH|XN--MGBT3DHD|XN--MGBTX2B|XN--MGBX4CD0AB|XN--MIX891F|XN--MK1BU44C|XN--MXTQ1M|XN--NGBC5AZD|XN--NGBE9E0A|XN--NGBRX|XN--NODE|XN--NQV7F|XN--NQV7FS00EMA|XN--NYQY26A|XN--O3CW4H|XN--OGBPF8FL|XN--OTU796D|XN--P1ACF|XN--P1AI|XN--PGBS0DH|XN--PSSY2U|XN--Q7CE6A|XN--Q9JYB4C|XN--QCKA1PMC|XN--QXA6A|XN--QXAM|XN--RHQV96G|XN--ROVU88B|XN--RVC1E0AM3E|XN--S9BRJ9C|XN--SES554G|XN--T60B56A|XN--TCKWE|XN--TIQ49XQYJ|XN--UNUP4Y|XN--VERMGENSBERATER-CTB|XN--VERMGENSBERATUNG-PWB|XN--VHQUV|XN--VUQ861B|XN--W4R85EL8FHU5DNRA|XN--W4RS40L|XN--WGBH1C|XN--WGBL6A|XN--XHQ521B|XN--XKC2AL3HYE2A|XN--XKC2DL3A5EE0H|XN--Y9A3AQ|XN--YFRO4I67O|XN--YGBI2AMMX|XN--ZFR164B|XXX|XYZ|YACHTS|YAHOO|YAMAXUN|YANDEX|YE|YODOBASHI|YOGA|YOKOHAMA|YOU|YOUTUBE|YT|YUN|ZA|ZAPPOS|ZARA|ZERO|ZIP|ZM|ZONE|ZUERICH|ZW|example|invalid|localhost|internal|test|onion";

// ========================================
// URL判定関数
// ========================================

/**
 * RFC3986準拠のURIかどうかを判定
 * @param {string} str - 判定対象の文字列
 * @returns {boolean}
 */
function isRFC3986(str) {
  return PATTERNS.RFC3986.test(str);
}

/**
 * 特殊URLかどうかを判定（ドメイン名を含むか）
 * @param {string} str - 判定対象の文字列
 * @returns {boolean}
 */
function isSpecialURL(str) {
  if (/\s/.test(str)) return false;

  const domainPattern = new RegExp(
    `(?:^|[:\\/\\.@])[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.(?:${TLD_LIST})(?:[:\\/\\?]|$)`,
    "i"
  );

  return domainPattern.test(str);
}

// ========================================
// 文字列処理関数
// ========================================

/**
 * 文字列の先頭の空白を除去
 * @param {string} str
 * @returns {string}
 */
function trimLeadingSpaces(str) {
  return str.replace(/^ +/, "");
}

/**
 * 不正なHTTPスキームを修正
 * @param {string} url
 * @returns {string}
 */
function fixMalformedScheme(url) {
  return url.replace(PATTERNS.MALFORMED_HTTP, "http$1");
}

/**
 * URLを正規化
 * @param {string} url
 * @returns {string}
 */
function normalizeURL(url) {
  // メールアドレスの場合
  if (PATTERNS.EMAIL.test(url)) {
    return `mailto:${url}`;
  }

  // スキームがない場合は追加
  if (!/^[a-z][\da-z+\-]*:/i.test(url)) {
    const cleanUrl = url.replace(PATTERNS.LEADING_JUNK, "");
    return `http://${cleanUrl}`.replace(PATTERNS.FTP_PATH, "f$1");
  }

  return url;
}

/**
 * 検索URLを生成
 * @param {string} query - 検索クエリ
 * @returns {string}
 */
function buildSearchURL(query) {
  const encodedQuery = encodeURIComponent(query);
  const replaced = settings.engineURL.replace("%s", encodedQuery);

  return replaced === settings.engineURL
    ? settings.engineURL + encodedQuery
    : replaced;
}

// ========================================
// 状態管理関数
// ========================================

/**
 * 状態を初期化
 */
function resetState() {
  Object.assign(state, {
    selectStr: "",
    isImage: false,
    isBase64: false,
    isAddressSearch: false,
  });
  broadcastState();
}

/**
 * 状態を設定
 * @param {Object} newState
 */
function setState(newState) {
  Object.assign(state, newState);
  broadcastState();
}

// ========================================
// メッセージング
// ========================================

/**
 * 現在の状態を全フレームにブロードキャスト
 */
function broadcastState() {
  const message = {
    message_addon: MESSAGE_TYPE.SET_STR,
    SelectStr: state.selectStr,
    IsImage: state.isImage,
    IsBase64: state.isBase64,
    IsAddressSearch: state.isAddressSearch,
  };

  if (window !== window.top) {
    // 子フレームからの送信
    window.top.postMessage(message, "*");
    for (let i = 0; i < window.top.length; i++) {
      window.top[i].postMessage(message, "*");
    }
  } else {
    // トップウィンドウからの送信
    broadcastToFrames("frame", message);
    broadcastToFrames("iframe", message);
  }
}

/**
 * 指定タグのフレームにメッセージを送信
 * @param {string} tagName
 * @param {Object} message
 */
function broadcastToFrames(tagName, message) {
  const frames = document.getElementsByTagName(tagName);
  for (const frame of frames) {
    try {
      frame.contentWindow?.postMessage(message, "*");
    } catch (e) {
      // クロスオリジンエラーを無視
    }
  }
}

/**
 * メッセージ受信ハンドラ
 * @param {MessageEvent} event
 */
function handleMessage(event) {
  const { data } = event;
  if (data?.message_addon === MESSAGE_TYPE.SET_STR) {
    Object.assign(state, {
      selectStr: data.SelectStr,
      isImage: data.IsImage,
      isBase64: data.IsBase64,
      isAddressSearch: data.IsAddressSearch,
    });
  }
}

/**
 * バックグラウンドスクリプトにメッセージを送信
 * @param {string} type
 * @param {string} value
 * @param {boolean} isForeground
 * @returns {Promise<void>}
 */
async function sendToBackground(type, value, isForeground) {
  try {
    await chrome.runtime.sendMessage({
      type,
      value,
      isforground: isForeground,
      tab: settings.newTabPosition,
    });
  } catch (error) {
    console.error("Failed to send message to background:", error);
  }
}

// ========================================
// DOM操作
// ========================================

/**
 * 子要素から最初の画像要素を再帰的に探索
 * @param {Element} node
 * @returns {HTMLImageElement|null}
 */
function findFirstImageChild(node) {
  for (let child = node.firstElementChild; child; child = child.nextElementSibling) {
    if (child instanceof HTMLImageElement) {
      return child;
    }
    const found = findFirstImageChild(child);
    if (found) return found;
  }
  return null;
}

/**
 * 親要素を再帰的に探索し、リンク要素がある場合その要素を返す
 * Chrome特有: リンク付き画像でもHTMLImageElementが取れてしまうため必要
 * @param {Element} node
 * @returns {HTMLAnchorElement|null}
 */
function findFirstLinkParent(node) {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    if (parent.href) {
      return parent;
    }
  }
  return null;
}

/**
 * ダウンロードリンクを作成して実行
 * @param {string} url
 */
function downloadViaAnchor(url) {
  const anchor = document.createElement("a");
  anchor.href = url;
  const dataMatch = url.match(/^data:image\/([^;]+);base64,/i);
  if (dataMatch) {
    const ext = dataMatch[1].toLowerCase().replace("svg+xml", "svg").replace("jpeg", "jpg");
    anchor.download = `image.${ext}`;
  } else {
    anchor.download = "";
  }
  anchor.click();
}

/**
 * テキストをクリップボードにコピー
 * @param {string} text
 */
function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.parentElement.removeChild(textarea);
}

// ========================================
// イベントハンドラ
// ========================================

/**
 * デフォルトイベントを無効化
 * @param {DragEvent} event
 */
function preventDefault(event) {
  if (event.preventDefault && !event.shiftKey) {
    event.preventDefault();
  }
}

/**
 * ドラッグ開始時の処理
 * @param {DragEvent} event
 */
function handleDragStart(event) {
  resetState();

  if (event.shiftKey) return;

  const isHTMLElement =
    /HTML.*Element/.test(event.target.constructor.name) &&
    event.target.constructor.name !== "HTMLTextAreaElement" &&
    event.target.constructor.name !== "HTMLInputElement";

  if (isHTMLElement) {
    processDragFromElement(event);
  } else {
    processDragFromText(event);
  }

  // 画像保存が無効なら画像フラグをリセット
  if (!settings.isSaveImage) {
    state.isImage = false;
  }

  broadcastState();
}

/**
 * HTML要素からのドラッグを処理
 * @param {DragEvent} event
 */
function processDragFromElement(event) {
  let target = event.target;
  let isFoundImage = false;

  // 画像要素を探索
  if (!(target instanceof HTMLImageElement)) {
    if (settings.isPreferSaveImage) {
      const foundImg = findFirstImageChild(target);
      if (foundImg) {
        target = foundImg;
        isFoundImage = true;
      }
    }
  } else {
    // 画像要素の場合
    if (settings.isPreferSaveImage) {
      isFoundImage = true;
    } else {
      // Chrome特有: リンク付き画像でもHTMLImageElementが取れてしまうため、
      // 親要素を確認してリンクが存在しているか確認する
      const foundLink = findFirstLinkParent(target);
      if (foundLink) {
        target = foundLink;
      } else {
        isFoundImage = true;
      }
    }
  }

  if (isFoundImage && target.href === undefined) {
    // 画像の場合
    setState({
      isImage: true,
      selectStr: target.src,
      isBase64: !PATTERNS.SCHEME.test(target.src) || PATTERNS.DATA_URI.test(target.src),
    });
  } else if (target.href !== undefined) {
    // リンクの場合
    setState({
      isAddressSearch: true,
      selectStr: target.href,
    });
  } else {
    // href なし要素はテキストドラッグにフォールバック
    processDragFromText(event);
  }
}

/**
 * テキストからのドラッグを処理
 * @param {DragEvent} event
 */
function processDragFromText(event) {
  const rawText = event.dataTransfer.getData("text/plain");
  const text = trimLeadingSpaces(rawText);

  if (isRFC3986(text)) {
    // RFC3986準拠URI
    setState({
      isAddressSearch: true,
      selectStr: fixMalformedScheme(text),
    });
  } else if (isSpecialURL(text)) {
    // ドメインを含むURL
    setState({
      isAddressSearch: true,
      selectStr: normalizeURL(text),
    });
  } else {
    // 通常のテキスト（検索）
    setState({
      selectStr: buildSearchURL(rawText),
    });
  }
}

/**
 * ドラッグオーバー時の処理
 * @param {DragEvent} event
 */
function handleDragOver(event) {
  const targetNodeName = event.target.nodeName.toUpperCase();

  if (targetNodeName === "INPUT" || targetNodeName === "TEXTAREA" || event.shiftKey) {
    return;
  }

  preventDefault(event);
}

/**
 * ドロップ時の処理
 * @param {DragEvent} event
 */
function handleDrop(event) {
  const targetNodeName = event.target.nodeName.toUpperCase();

  // 入力フィールドへのドロップまたはShiftキー押下時は何もしない
  if (targetNodeName === "INPUT" || targetNodeName === "TEXTAREA" || event.shiftKey) {
    resetState();
    return;
  }

  preventDefault(event);

  // ファイルドロップの検出
  if (event.dataTransfer.items) {
    const hasFile = [...event.dataTransfer.items].some(
      (item) => item.kind === "file" && state.selectStr === ""
    );
    if (hasFile) {
      resetState();
      return;
    }
  }

  if (state.selectStr === "") {
    resetState();
    return;
  }

  if (state.isImage) {
    handleImageDrop(event);
  } else {
    handleLinkDrop(event);
  }

  resetState();
}

/**
 * 画像ドロップの処理
 * @param {DragEvent} event
 */
function handleImageDrop(event) {
  // Base64またはCtrl押下時は直接ダウンロード
  if (state.isBase64 || event.ctrlKey) {
    downloadViaAnchor(state.selectStr);
    return;
  }

  // Alt押下時は新規タブで表示、それ以外はダウンロード
  const messageType =
    event.altKey && !event.ctrlKey ? MESSAGE_TYPE.SEARCH : MESSAGE_TYPE.DOWNLOAD;

  sendToBackground(messageType, state.selectStr, true);
}

/**
 * リンクドロップの処理
 * @param {DragEvent} event
 */
function handleLinkDrop(event) {
  // data:image URIはBlob URLに変換して新規タブで表示
  if (PATTERNS.DATA_URI.test(state.selectStr)) {
    const match = state.selectStr.match(/^data:([^;]+);base64,(.+)$/i);
    if (match) {
      const bytes = atob(match[2]);
      const arr = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([arr], { type: match[1] }));
      window.open(blobUrl, "_blank");
    }
    return;
  }

  // Ctrl押下時はクリップボードにコピー
  if (event.ctrlKey) {
    copyToClipboard(event.dataTransfer.getData("text/plain"));
  }

  // Alt押下時かつアドレス検索の場合はダウンロード
  const messageType =
    state.isAddressSearch && event.altKey && !event.ctrlKey
      ? MESSAGE_TYPE.DOWNLOAD
      : MESSAGE_TYPE.SEARCH;

  const isForeground = state.isAddressSearch
    ? settings.isAddressForeground
    : settings.isSearchForeground;

  sendToBackground(messageType, state.selectStr, isForeground);
}

// ========================================
// 設定管理
// ========================================

/**
 * 設定を更新
 * @param {Object} storageData
 */
function updateSettings(storageData) {
  if (storageData.searchEngineURL !== undefined) {
    settings.engineURL = storageData.searchEngineURL;
  }

  if (storageData.tabPosition !== undefined) {
    settings.newTabPosition = storageData.tabPosition;
  }

  if (storageData.checkboxArray !== undefined) {
    const checkboxArray = storageData.checkboxArray;
    settings.isAddressForeground = checkboxArray.includes("is_address_forground");
    settings.isSearchForeground = checkboxArray.includes("is_search_forground");
    settings.isSaveImage = checkboxArray.includes("is_save_image");
    settings.isPreferSaveImage = checkboxArray.includes("is_prefer_save_image");
  }
}

/**
 * ストレージから設定を読み込む
 * @returns {Promise<void>}
 */
async function loadSettings() {
  try {
    const storageData = await chrome.storage.local.get([
      "searchEngineURL",
      "tabPosition",
      "checkboxArray",
    ]);
    updateSettings(storageData);
  } catch (error) {
    console.error("Failed to load settings:", error);
  }
}

/**
 * 無効化パターンをストレージから読み込む
 * @returns {Promise<string[]>}
 */
async function loadDisabledPatterns() {
  try {
    const data = await chrome.storage.local.get("disabledPatterns");
    return data.disabledPatterns ?? [];
  } catch {
    return [];
  }
}

/**
 * ホスト名(+パス)がパターンに一致するか判定
 * パターンに "/" が含まれる場合は hostname+pathname でマッチ、
 * 含まれない場合は hostname のみでマッチ
 * @param {string} hostname
 * @param {string} pathname
 * @param {string} pattern
 * @returns {boolean}
 */
function matchesPattern(hostname, pathname, pattern) {
  const trimmed = pattern.trim();
  if (!trimmed) return false;
  const target = trimmed.includes("/") ? hostname + pathname : hostname;
  const escaped = trimmed.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  try {
    return new RegExp(`^${escaped}$`, "i").test(target);
  } catch {
    return false;
  }
}

/**
 * 現在のサイトが無効化されているか判定
 * @param {string[]} patterns
 * @returns {boolean}
 */
function isSiteDisabled(patterns) {
  const hostname = location.hostname;
  if (!hostname) return false;
  const pathname = location.pathname;
  return patterns.some(p => matchesPattern(hostname, pathname, p));
}

/**
 * ストレージ変更時の設定更新
 * @param {Object} changes
 * @param {string} area
 */
function handleStorageChange(changes, area) {
  if (area !== "local") return;

  const newSettings = {};

  if (changes.searchEngineURL !== undefined) {
    newSettings.searchEngineURL = changes.searchEngineURL.newValue;
  }
  if (changes.tabPosition !== undefined) {
    newSettings.tabPosition = changes.tabPosition.newValue;
  }
  if (changes.checkboxArray !== undefined) {
    newSettings.checkboxArray = changes.checkboxArray.newValue;
  }

  if (Object.keys(newSettings).length > 0) {
    updateSettings(newSettings);
  }
}

// ========================================
// フレームリスナー設定
// ========================================

/**
 * フレームにメッセージリスナーを設定
 * @param {string} tagName
 */
function setupFrameListeners(tagName) {
  const frames = document.getElementsByTagName(tagName);
  for (const frame of frames) {
    frame.addEventListener("load", () => {
      frame.addEventListener("message", handleMessage, false);
    });
  }
}

// ========================================
// 初期化
// ========================================

/**
 * 初期化処理
 * @returns {Promise<void>}
 */
async function initialize() {
  // サイトが無効化されているか確認
  const disabledPatterns = await loadDisabledPatterns();
  if (isSiteDisabled(disabledPatterns)) return;

  // 設定の読み込み
  await loadSettings();

  // ストレージ変更の監視
  chrome.storage.onChanged.addListener(handleStorageChange);

  // イベントリスナーの設定
  document.addEventListener("dragstart", handleDragStart, false);
  document.addEventListener("dragover", handleDragOver, false);
  document.addEventListener("dragend", preventDefault, false);
  document.addEventListener("drop", handleDrop, false);
  window.addEventListener("message", handleMessage, false);

  // フレームへのリスナー設定
  setupFrameListeners("iframe");
  setupFrameListeners("frame");
}

// 初期化実行
initialize().catch((error) => {
  console.error("Failed to initialize QuickDrag:", error);
});

})();
