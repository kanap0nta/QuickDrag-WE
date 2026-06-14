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

let isActive = false;

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
};

// TLDリスト（ https://data.iana.org/TLD/tlds-alpha-by-domain.txt （Version 2025101800）+ example|invalid|localhost|internal|test|onion）
const TLD_LIST = "AAA|AARP|ABB|ABBOTT|ABBVIE|ABC|ABLE|ABOGADO|ABUDHABI|AC|ACADEMY|ACCENTURE|ACCOUNTANT|ACCOUNTANTS|ACO|ACTOR|AD|ADS|ADULT|AE|AEG|AERO|AETNA|AF|AFL|AFRICA|AG|AGAKHAN|AGENCY|AI|AIG|AIRBUS|AIRFORCE|AIRTEL|AKDN|AL|ALIBABA|ALIPAY|ALLFINANZ|ALLSTATE|ALLY|ALSACE|ALSTOM|AM|AMAZON|AMERICANEXPRESS|AMERICANFAMILY|AMEX|AMFAM|AMICA|AMSTERDAM|ANALYTICS|ANDROID|ANQUAN|ANZ|AO|AOL|APARTMENTS|APP|APPLE|AQ|AQUARELLE|AR|ARAB|ARAMCO|ARCHI|ARMY|ARPA|ART|ARTE|AS|ASDA|ASIA|ASSOCIATES|AT|ATHLETA|ATTORNEY|AU|AUCTION|AUDI|AUDIBLE|AUDIO|AUSPOST|AUTHOR|AUTO|AUTOS|AW|AWS|AX|AXA|AZ|AZURE|BA|BABY|BAIDU|BANAMEX|BAND|BANK|BAR|BARCELONA|BARCLAYCARD|BARCLAYS|BAREFOOT|BARGAINS|BASEBALL|BASKETBALL|BAUHAUS|BAYERN|BB|BBC|BBT|BBVA|BCG|BCN|BD|BE|BEATS|BEAUTY|BEER|BERLIN|BEST|BESTBUY|BET|BF|BG|BH|BHARTI|BI|BIBLE|BID|BIKE|BING|BINGO|BIO|BIZ|BJ|BLACK|BLACKFRIDAY|BLOCKBUSTER|BLOG|BLOOMBERG|BLUE|BM|BMS|BMW|BN|BNPPARIBAS|BO|BOATS|BOEHRINGER|BOFA|BOM|BOND|BOO|BOOK|BOOKING|BOSCH|BOSTIK|BOSTON|BOT|BOUTIQUE|BOX|BR|BRADESCO|BRIDGESTONE|BROADWAY|BROKER|BROTHER|BRUSSELS|BS|BT|BUILD|BUILDERS|BUSINESS|BUY|BUZZ|BV|BW|BY|BZ|BZH|CA|CAB|CAFE|CAL|CALL|CALVINKLEIN|CAM|CAMERA|CAMP|CANON|CAPETOWN|CAPITAL|CAPITALONE|CAR|CARAVAN|CARDS|CARE|CAREER|CAREERS|CARS|CASA|CASE|CASH|CASINO|CAT|CATERING|CATHOLIC|CBA|CBN|CBRE|CC|CD|CENTER|CEO|CERN|CF|CFA|CFD|CG|CH|CHANEL|CHANNEL|CHARITY|CHASE|CHAT|CHEAP|CHINTAI|CHRISTMAS|CHROME|CHURCH|CI|CIPRIANI|CIRCLE|CISCO|CITADEL|CITI|CITIC|CITY|CK|CL|CLAIMS|CLEANING|CLICK|CLINIC|CLINIQUE|CLOTHING|CLOUD|CLUB|CLUBMED|CM|CN|CO|COACH|CODES|COFFEE|COLLEGE|COLOGNE|COM|COMMBANK|COMMUNITY|COMPANY|COMPARE|COMPUTER|COMSEC|CONDOS|CONSTRUCTION|CONSULTING|CONTACT|CONTRACTORS|COOKING|COOL|COOP|CORSICA|COUNTRY|COUPON|COUPONS|COURSES|CPA|CR|CREDIT|CREDITCARD|CREDITUNION|CRICKET|CROWN|CRS|CRUISE|CRUISES|CU|CUISINELLA|CV|CW|CX|CY|CYMRU|CYOU|CZ|DAD|DANCE|DATA|DATE|DATING|DATSUN|DAY|DCLK|DDS|DE|DEAL|DEALER|DEALS|DEGREE|DELIVERY|DELL|DELOITTE|DELTA|DEMOCRAT|DENTAL|DENTIST|DESI|DESIGN|DEV|DHL|DIAMONDS|DIET|DIGITAL|DIRECT|DIRECTORY|DISCOUNT|DISCOVER|DISH|DIY|DJ|DK|DM|DNP|DO|DOCS|DOCTOR|DOG|DOMAINS|DOT|DOWNLOAD|DRIVE|DTV|DUBAI|DUNLOP|DUPONT|DURBAN|DVAG|DVR|DZ|EARTH|EAT|EC|ECO|EDEKA|EDU|EDUCATION|EE|EG|EMAIL|EMERCK|ENERGY|ENGINEER|ENGINEERING|ENTERPRISES|EPSON|EQUIPMENT|ER|ERICSSON|ERNI|ES|ESQ|ESTATE|ET|EU|EUROVISION|EUS|EVENTS|EXCHANGE|EXPERT|EXPOSED|EXPRESS|EXTRASPACE|FAGE|FAIL|FAIRWINDS|FAITH|FAMILY|FAN|FANS|FARM|FARMERS|FASHION|FAST|FEDEX|FEEDBACK|FERRARI|FERRERO|FI|FIDELITY|FIDO|FILM|FINAL|FINANCE|FINANCIAL|FIRE|FIRESTONE|FIRMDALE|FISH|FISHING|FIT|FITNESS|FJ|FK|FLICKR|FLIGHTS|FLIR|FLORIST|FLOWERS|FLY|FM|FO|FOO|FOOD|FOOTBALL|FORD|FOREX|FORSALE|FORUM|FOUNDATION|FOX|FR|FREE|FRESENIUS|FRL|FROGANS|FRONTIER|FTR|FUJITSU|FUN|FUND|FURNITURE|FUTBOL|FYI|GA|GAL|GALLERY|GALLO|GALLUP|GAME|GAMES|GAP|GARDEN|GAY|GB|GBIZ|GD|GDN|GE|GEA|GENT|GENTING|GEORGE|GF|GG|GGEE|GH|GI|GIFT|GIFTS|GIVES|GIVING|GL|GLASS|GLE|GLOBAL|GLOBO|GM|GMAIL|GMBH|GMO|GMX|GN|GODADDY|GOLD|GOLDPOINT|GOLF|GOO|GOODYEAR|GOOG|GOOGLE|GOP|GOT|GOV|GP|GQ|GR|GRAINGER|GRAPHICS|GRATIS|GREEN|GRIPE|GROCERY|GROUP|GS|GT|GU|GUCCI|GUGE|GUIDE|GUITARS|GURU|GW|GY|HAIR|HAMBURG|HANGOUT|HAUS|HBO|HDFC|HDFCBANK|HEALTH|HEALTHCARE|HELP|HELSINKI|HERE|HERMES|HIPHOP|HISAMITSU|HITACHI|HIV|HK|HKT|HM|HN|HOCKEY|HOLDINGS|HOLIDAY|HOMEDEPOT|HOMEGOODS|HOMES|HOMESENSE|HONDA|HORSE|HOSPITAL|HOST|HOSTING|HOT|HOTELS|HOTMAIL|HOUSE|HOW|HR|HSBC|HT|HU|HUGHES|HYATT|HYUNDAI|IBM|ICBC|ICE|ICU|ID|IE|IEEE|IFM|IKANO|IL|IM|IMAMAT|IMDB|IMMO|IMMOBILIEN|IN|INC|INDUSTRIES|INFINITI|INFO|ING|INK|INSTITUTE|INSURANCE|INSURE|INT|INTERNATIONAL|INTUIT|INVESTMENTS|IO|IPIRANGA|IQ|IR|IRISH|IS|ISMAILI|IST|ISTANBUL|IT|ITAU|ITV|JAGUAR|JAVA|JCB|JE|JEEP|JETZT|JEWELRY|JIO|JLL|JM|JMP|JNJ|JO|JOBS|JOBURG|JOT|JOY|JP|JPMORGAN|JPRS|JUEGOS|JUNIPER|KAUFEN|KDDI|KE|KERRYHOTELS|KERRYPROPERTIES|KFH|KG|KH|KI|KIA|KIDS|KIM|KINDLE|KITCHEN|KIWI|KM|KN|KOELN|KOMATSU|KOSHER|KP|KPMG|KPN|KR|KRD|KRED|KUOKGROUP|KW|KY|KYOTO|KZ|LA|LACAIXA|LAMBORGHINI|LAMER|LAND|LANDROVER|LANXESS|LASALLE|LAT|LATINO|LATROBE|LAW|LAWYER|LB|LC|LDS|LEASE|LECLERC|LEFRAK|LEGAL|LEGO|LEXUS|LGBT|LI|LIDL|LIFE|LIFEINSURANCE|LIFESTYLE|LIGHTING|LIKE|LILLY|LIMITED|LIMO|LINCOLN|LINK|LIVE|LIVING|LK|LLC|LLP|LOAN|LOANS|LOCKER|LOCUS|LOL|LONDON|LOTTE|LOTTO|LOVE|LPL|LPLFINANCIAL|LR|LS|LT|LTD|LTDA|LU|LUNDBECK|LUXE|LUXURY|LV|LY|MA|MADRID|MAIF|MAISON|MAKEUP|MAN|MANAGEMENT|MANGO|MAP|MARKET|MARKETING|MARKETS|MARRIOTT|MARSHALLS|MATTEL|MBA|MC|MCKINSEY|MD|ME|MED|MEDIA|MEET|MELBOURNE|MEME|MEMORIAL|MEN|MENU|MERCKMSD|MG|MH|MIAMI|MICROSOFT|MIL|MINI|MINT|MIT|MITSUBISHI|MK|ML|MLB|MLS|MM|MMA|MN|MO|MOBI|MOBILE|MODA|MOE|MOI|MOM|MONASH|MONEY|MONSTER|MORMON|MORTGAGE|MOSCOW|MOTO|MOTORCYCLES|MOV|MOVIE|MP|MQ|MR|MS|MSD|MT|MTN|MTR|MU|MUSEUM|MUSIC|MV|MW|MX|MY|MZ|NA|NAB|NAGOYA|NAME|NAVY|NBA|NC|NE|NEC|NET|NETBANK|NETFLIX|NETWORK|NEUSTAR|NEW|NEWS|NEXT|NEXTDIRECT|NEXUS|NF|NFL|NG|NGO|NHK|NI|NICO|NIKE|NIKON|NINJA|NISSAN|NISSAY|NL|NO|NOKIA|NORTON|NOW|NOWRUZ|NOWTV|NP|NR|NRA|NRW|NTT|NU|NYC|NZ|OBI|OBSERVER|OFFICE|OKINAWA|OLAYAN|OLAYANGROUP|OLLO|OM|OMEGA|ONE|ONG|ONL|ONLINE|OOO|OPEN|ORACLE|ORANGE|ORG|ORGANIC|ORIGINS|OSAKA|OTSUKA|OTT|OVH|PA|PAGE|PANASONIC|PARIS|PARS|PARTNERS|PARTS|PARTY|PAY|PCCW|PE|PET|PF|PFIZER|PG|PH|PHARMACY|PHD|PHILIPS|PHONE|PHOTO|PHOTOGRAPHY|PHOTOS|PHYSIO|PICS|PICTET|PICTURES|PID|PIN|PING|PINK|PIONEER|PIZZA|PK|PL|PLACE|PLAY|PLAYSTATION|PLUMBING|PLUS|PM|PN|PNC|POHL|POKER|POLITIE|PORN|POST|PR|PRAXI|PRESS|PRIME|PRO|PROD|PRODUCTIONS|PROF|PROGRESSIVE|PROMO|PROPERTIES|PROPERTY|PROTECTION|PRU|PRUDENTIAL|PS|PT|PUB|PW|PWC|PY|QA|QPON|QUEBEC|QUEST|RACING|RADIO|RE|READ|REALESTATE|REALTOR|REALTY|RECIPES|RED|REDUMBRELLA|REHAB|REISE|REISEN|REIT|RELIANCE|REN|RENT|RENTALS|REPAIR|REPORT|REPUBLICAN|REST|RESTAURANT|REVIEW|REVIEWS|REXROTH|RICH|RICHARDLI|RICOH|RIL|RIO|RIP|RO|ROCKS|RODEO|ROGERS|ROOM|RS|RSVP|RU|RUGBY|RUHR|RUN|RW|RWE|RYUKYU|SA|SAARLAND|SAFE|SAFETY|SAKURA|SALE|SALON|SAMSCLUB|SAMSUNG|SANDVIK|SANDVIKCOROMANT|SANOFI|SAP|SARL|SAS|SAVE|SAXO|SB|SBI|SBS|SC|SCB|SCHAEFFLER|SCHMIDT|SCHOLARSHIPS|SCHOOL|SCHULE|SCHWARZ|SCIENCE|SCOT|SD|SE|SEARCH|SEAT|SECURE|SECURITY|SEEK|SELECT|SENER|SERVICES|SEVEN|SEW|SEX|SEXY|SFR|SG|SH|SHANGRILA|SHARP|SHELL|SHIA|SHIKSHA|SHOES|SHOP|SHOPPING|SHOUJI|SHOW|SI|SILK|SINA|SINGLES|SITE|SJ|SK|SKI|SKIN|SKY|SKYPE|SL|SLING|SM|SMART|SMILE|SN|SNCF|SO|SOCCER|SOCIAL|SOFTBANK|SOFTWARE|SOHU|SOLAR|SOLUTIONS|SONG|SONY|SOY|SPA|SPACE|SPORT|SPOT|SR|SRL|SS|ST|STADA|STAPLES|STAR|STATEBANK|STATEFARM|STC|STCGROUP|STOCKHOLM|STORAGE|STORE|STREAM|STUDIO|STUDY|STYLE|SU|SUCKS|SUPPLIES|SUPPLY|SUPPORT|SURF|SURGERY|SUZUKI|SV|SWATCH|SWISS|SX|SY|SYDNEY|SYSTEMS|SZ|TAB|TAIPEI|TALK|TAOBAO|TARGET|TATAMOTORS|TATAR|TATTOO|TAX|TAXI|TC|TCI|TD|TDK|TEAM|TECH|TECHNOLOGY|TEL|TEMASEK|TENNIS|TEVA|TF|TG|TH|THD|THEATER|THEATRE|TIAA|TICKETS|TIENDA|TIPS|TIRES|TIROL|TJ|TJMAXX|TJX|TK|TKMAXX|TL|TM|TMALL|TN|TO|TODAY|TOKYO|TOOLS|TOP|TORAY|TOSHIBA|TOTAL|TOURS|TOWN|TOYOTA|TOYS|TR|TRADE|TRADING|TRAINING|TRAVEL|TRAVELERS|TRAVELERSINSURANCE|TRUST|TRV|TT|TUBE|TUI|TUNES|TUSHU|TV|TVS|TW|TZ|UA|UBANK|UBS|UG|UK|UNICOM|UNIVERSITY|UNO|UOL|UPS|US|UY|UZ|VA|VACATIONS|VANA|VANGUARD|VC|VE|VEGAS|VENTURES|VERISIGN|VERSICHERUNG|VET|VG|VI|VIAJES|VIDEO|VIG|VIKING|VILLAS|VIN|VIP|VIRGIN|VISA|VISION|VIVA|VIVO|VLAANDEREN|VN|VODKA|VOLVO|VOTE|VOTING|VOTO|VOYAGE|VU|WALES|WALMART|WALTER|WANG|WANGGOU|WATCH|WATCHES|WEATHER|WEATHERCHANNEL|WEBCAM|WEBER|WEBSITE|WED|WEDDING|WEIBO|WEIR|WF|WHOSWHO|WIEN|WIKI|WILLIAMHILL|WIN|WINDOWS|WINE|WINNERS|WME|WOLTERSKLUWER|WOODSIDE|WORK|WORKS|WORLD|WOW|WS|WTC|WTF|XBOX|XEROX|XIHUAN|XIN|XN--11B4C3D|XN--1CK2E1B|XN--1QQW23A|XN--2SCRJ9C|XN--30RR7Y|XN--3BST00M|XN--3DS443G|XN--3E0B707E|XN--3HCRJ9C|XN--3PXU8K|XN--42C2D9A|XN--45BR5CYL|XN--45BRJ9C|XN--45Q11C|XN--4DBRK0CE|XN--4GBRIM|XN--54B7FTA0CC|XN--55QW42G|XN--55QX5D|XN--5SU34J936BGSG|XN--5TZM5G|XN--6FRZ82G|XN--6QQ986B3XL|XN--80ADXHKS|XN--80AO21A|XN--80AQECDR1A|XN--80ASEHDB|XN--80ASWG|XN--8Y0A063A|XN--90A3AC|XN--90AE|XN--90AIS|XN--9DBQ2A|XN--9ET52U|XN--9KRT00A|XN--B4W605FERD|XN--BCK1B9A5DRE4C|XN--C1AVG|XN--C2BR7G|XN--CCK2B3B|XN--CCKWCXETD|XN--CG4BKI|XN--CLCHC0EA0B2G2A9GCD|XN--CZR694B|XN--CZRS0T|XN--CZRU2D|XN--D1ACJ3B|XN--D1ALF|XN--E1A4C|XN--ECKVDTC9D|XN--EFVY88H|XN--FCT429K|XN--FHBEI|XN--FIQ228C5HS|XN--FIQ64B|XN--FIQS8S|XN--FIQZ9S|XN--FJQ720A|XN--FLW351E|XN--FPCRJ9C3D|XN--FZC2C9E2C|XN--FZYS8D69UVGM|XN--G2XX48C|XN--GCKR3F0F|XN--GECRJ9C|XN--GK3AT1E|XN--H2BREG3EVE|XN--H2BRJ9C|XN--H2BRJ9C8C|XN--HXT814E|XN--I1B6B1A6A2E|XN--IMR513N|XN--IO0A7I|XN--J1AEF|XN--J1AMH|XN--J6W193G|XN--JLQ480N2RG|XN--JVR189M|XN--KCRX77D1X4A|XN--KPRW13D|XN--KPRY57D|XN--KPUT3I|XN--L1ACC|XN--LGBBAT1AD8J|XN--MGB9AWBF|XN--MGBA3A3EJT|XN--MGBA3A4F16A|XN--MGBA7C0BBN0A|XN--MGBAAM7A8H|XN--MGBAB2BD|XN--MGBAH1A3HJKRD|XN--MGBAI9AZGQP6J|XN--MGBAYH7GPA|XN--MGBBH1A|XN--MGBBH1A71E|XN--MGBC0A9AZCG|XN--MGBCA7DZDO|XN--MGBCPQ6GPA1A|XN--MGBERP4A5D4AR|XN--MGBGU82A|XN--MGBI4ECEXP|XN--MGBPL2FH|XN--MGBT3DHD|XN--MGBTX2B|XN--MGBX4CD0AB|XN--MIX891F|XN--MK1BU44C|XN--MXTQ1M|XN--NGBC5AZD|XN--NGBE9E0A|XN--NGBRX|XN--NODE|XN--NQV7F|XN--NQV7FS00EMA|XN--NYQY26A|XN--O3CW4H|XN--OGBPF8FL|XN--OTU796D|XN--P1ACF|XN--P1AI|XN--PGBS0DH|XN--PSSY2U|XN--Q7CE6A|XN--Q9JYB4C|XN--QCKA1PMC|XN--QXA6A|XN--QXAM|XN--RHQV96G|XN--ROVU88B|XN--RVC1E0AM3E|XN--S9BRJ9C|XN--SES554G|XN--T60B56A|XN--TCKWE|XN--TIQ49XQYJ|XN--UNUP4Y|XN--VERMGENSBERATER-CTB|XN--VERMGENSBERATUNG-PWB|XN--VHQUV|XN--VUQ861B|XN--W4R85EL8FHU5DNRA|XN--W4RS40L|XN--WGBH1C|XN--WGBL6A|XN--XHQ521B|XN--XKC2AL3HYE2A|XN--XKC2DL3A5EE0H|XN--Y9A3AQ|XN--YFRO4I67O|XN--YGBI2AMMX|XN--ZFR164B|XXX|XYZ|YACHTS|YAHOO|YAMAXUN|YANDEX|YE|YODOBASHI|YOGA|YOKOHAMA|YOU|YOUTUBE|YT|YUN|ZA|ZAPPOS|ZARA|ZERO|ZIP|ZM|ZONE|ZUERICH|ZW|example|invalid|localhost|internal|test|onion";

const DOMAIN_PATTERN = new RegExp(
  `(?:^|[:\\/\\.@])[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.(?:${TLD_LIST})(?:[:\\/\\?]|$)`,
  "i"
);

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
  return DOMAIN_PATTERN.test(str);
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
    try {
      window.top.postMessage(message, "*");
      for (let i = 0; i < window.top.length; i++) {
        window.top[i].postMessage(message, "*");
      }
    } catch (e) {
      // クロスオリジンエラーを無視
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
    console.log(`[QD] handleMessage: state received selectStr="${data.SelectStr}"`);
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
  console.log(`[QD] sendToBackground: type=${type} value="${value}" isForeground=${isForeground} tab=${settings.newTabPosition}`);
  try {
    await chrome.runtime.sendMessage({
      type,
      value,
      isForeground: isForeground,
      tab: settings.newTabPosition,
    });
    console.log(`[QD] sendToBackground: done type=${type}`);
  } catch (error) {
    console.error("[QD] sendToBackground failed:", error);
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
 * ドラッグ中、iframe 上に透明オーバーレイを生成する（トップフレームのみ）
 * オーバーレイが drop を受け取ることで、クロスオリジン iframe の制限を回避する
 */
function createIframeOverlays() {
  if (window !== window.top) return;
  const iframes = document.querySelectorAll("iframe, frame");
  console.log(`[QD] createIframeOverlays: found ${iframes.length} iframe(s)`);
  for (const el of iframes) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.log(`[QD] createIframeOverlays: skipping zero-size iframe`, el.src || el.name);
      continue;
    }
    const overlay = document.createElement("div");
    overlay.dataset.quickdragOverlay = "1";
    // rgba(0,0,0,0.001) は完全透明だと一部ブラウザでイベントを受け取れない場合があるため使用
    overlay.style.cssText =
      `position:fixed;top:${rect.top}px;left:${rect.left}px;` +
      `width:${rect.width}px;height:${rect.height}px;` +
      `z-index:2147483647;background:rgba(0,0,0,0.001);pointer-events:all;`;

    // document バブリングに依存せず要素に直接リスナーを追加
    overlay.addEventListener("dragenter", (e) => {
      _isOverOverlay = true;
      _lastOverlayKeyState = { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey };
      console.log("[QD] overlay dragenter effectAllowed=", e.dataTransfer?.effectAllowed);
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    }, false);
    overlay.addEventListener("dragover", (e) => {
      _isOverOverlay = true;
      _lastOverlayKeyState = { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey };
      console.log("[QD] overlay dragover effectAllowed=", e.dataTransfer?.effectAllowed, "dropEffect=", e.dataTransfer?.dropEffect);
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    }, false);
    overlay.addEventListener("dragleave", (e) => {
      _isOverOverlay = false;
      console.log("[QD] overlay dragleave");
    }, false);
    overlay.addEventListener("drop", (e) => {
      console.log("[QD] overlay drop! selectStr=", state.selectStr);
      _isOverOverlay = false;
      e.stopPropagation();
      handleDrop(e);
    }, false);

    document.body.appendChild(overlay);
    console.log(`[QD] createIframeOverlays: overlay created top=${rect.top} left=${rect.left} w=${rect.width} h=${rect.height}`);
  }
}

/**
 * iframe オーバーレイを除去する
 */
function removeIframeOverlays() {
  for (const el of document.querySelectorAll("[data-quickdrag-overlay]")) {
    el.remove();
  }
}

/**
 * ダウンロードリンクを作成して実行
 * @param {string} url
 */
function downloadViaAnchor(url) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "";
  anchor.click();
}

/**
 * テキストをクリップボードにコピー
 * @param {string} text
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.cssText = "position:fixed;opacity:0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
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
 * ドラッグ終了時の処理（ドロップされずキャンセルされた場合もオーバーレイを除去）
 * @param {DragEvent} event
 */
async function handleDragEnd(event) {
  const dropEffect = event.dataTransfer?.dropEffect ?? "unknown";
  console.log(`[QD] dragend fired dropEffect=${dropEffect} isOverOverlay=${_isOverOverlay} selectStr="${state.selectStr}"`);

  // Chrome は iframe 上のオーバーレイに drop を発火しないことがある。
  // dragend 時に isOverOverlay が true かつ selectStr が存在すれば意図的なドロップとみなして実行する。
  if (_isOverOverlay && state.selectStr && _lastOverlayKeyState) {
    console.log("[QD] dragend: overlay workaround → performing action");
    const keyState = _lastOverlayKeyState;
    const fakeEvent = {
      target: { nodeName: "DIV", dataset: { quickdragOverlay: "1" } },
      shiftKey: keyState.shiftKey,
      ctrlKey: keyState.ctrlKey,
      altKey: keyState.altKey,
      dataTransfer: { items: [], getData: () => "" },
      preventDefault: () => {},
    };
    _isOverOverlay = false;
    _lastOverlayKeyState = null;
    handleDrop(fakeEvent);
    return;
  }

  _isOverOverlay = false;
  _lastOverlayKeyState = null;
  removeIframeOverlays();
  preventDefault(event);

  // top→iframe workaround（dragleave が dragend より先に発火し _isOverOverlay がリセットされた場合の補完）。
  // handleDrop が正常に実行されると resetState() で selectStr が空になる。
  // dragend 時点で selectStr が残っている = drop が JS に届かず Chrome が iframe に横取りした = 処理が必要。
  // dropEffect=copy はドロップが受け入れられたことを示す（Escape/範囲外は "none" になる）。
  if (window === window.top && dropEffect === "copy" && state.selectStr && !event.shiftKey) {
    console.log("[QD] dragend: top→iframe Chrome-intercepted drop workaround → performing action");
    const { ctrlKey, altKey, shiftKey } = event;
    const fakeEvent = {
      target: { nodeName: "DIV", dataset: { quickdragOverlay: "1" } },
      shiftKey,
      ctrlKey,
      altKey,
      dataTransfer: { items: [], getData: () => "" },
      preventDefault: () => {},
    };
    handleDrop(fakeEvent);
    return;
  }

  // iframe でドラッグし、フレーム間デッドゾーン（iframe 境界付近）で release した場合の workaround。
  // dropEffect=none になるが Escape キャンセルでなければ意図的なドロップとみなして実行する。
  if (window !== window.top && dropEffect === "none" && state.selectStr && !_escapePressed && !event.shiftKey) {
    console.log("[QD] dragend: iframe dead-zone drop workaround → performing action");
    const { ctrlKey, altKey, shiftKey } = event;
    const fakeEvent = {
      target: { nodeName: "BODY", dataset: {} },
      shiftKey,
      ctrlKey,
      altKey,
      dataTransfer: { items: [], getData: () => "" },
      preventDefault: () => {},
    };
    handleDrop(fakeEvent);
    return;
  }

  // iframe 内での drop が content script に届かない場合の workaround。
  // Chrome がブラウザレベルで処理して dropEffect=copy になるが drop イベントが来ない。
  // 50ms 待ってトップフレームが state をリセット済みかを確認し、残っていれば自身で処理する。
  // _dragSeq で「待機中に新ドラッグが始まっていないか」を確認し race condition を防ぐ。
  if (window !== window.top && dropEffect === "copy" && state.selectStr) {
    const capturedSeq = _dragSeq;
    const { ctrlKey, altKey, shiftKey } = event;
    await new Promise(resolve => setTimeout(resolve, 50));
    if (_dragSeq !== capturedSeq) {
      console.log(`[QD] dragend: new drag started during wait (seq ${capturedSeq}→${_dragSeq}), skipping workaround`);
    } else if (state.selectStr) {
      console.log("[QD] dragend: intra-iframe drop workaround → performing action");
      const fakeEvent = {
        target: { nodeName: "BODY", dataset: {} },
        shiftKey,
        ctrlKey,
        altKey,
        dataTransfer: { items: [], getData: () => "" },
        preventDefault: () => {},
      };
      handleDrop(fakeEvent);
    }
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
    event.target instanceof HTMLElement &&
    !(event.target instanceof HTMLTextAreaElement) &&
    !(event.target instanceof HTMLInputElement);

  _iframeDragoverNotified = false;
  _escapePressed = false;
  _dragSeq++;
  console.log(`[QD] dragstart: frame=${window === window.top ? "top" : "iframe"} target=${event.target?.nodeName} isHTMLElement=${isHTMLElement} seq=${_dragSeq}`);

  if (isHTMLElement) {
    processDragFromElement(event);
  } else {
    processDragFromText(event);
  }

  console.log(`[QD] dragstart: selectStr="${state.selectStr}" isImage=${state.isImage}`);
  createIframeOverlays();

  // iframe 内で drop が発火したとき用にバックグラウンドへ状態を保存
  if (state.selectStr) {
    chrome.runtime.sendMessage({
      type: "setDragState",
      state: {
        selectStr: state.selectStr,
        isImage: state.isImage,
        isBase64: state.isBase64,
        isAddressSearch: state.isAddressSearch,
      },
    }).catch(() => {});
  }

  // iframe 内で dragstart したことをトップフレームに通知（デバッグ用）
  if (window !== window.top) {
    try { window.top.postMessage({ __qdDebug: "dragstart", selectStr: state.selectStr }, "*"); } catch (e) {}
  }
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
    // 画像要素でない場合、子要素から画像を探す
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
    // 画像の場合（isSaveImage が無効なら画像として扱わず URL として開く）
    const shouldSave = settings.isSaveImage;
    setState({
      isImage: shouldSave,
      selectStr: target.src,
      isBase64: shouldSave && !PATTERNS.SCHEME.test(target.src),
    });
  } else if (target.href) {
    // リンクの場合
    setState({
      isAddressSearch: true,
      selectStr: target.href,
    });
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
let _lastDragOverTarget = null;
let _iframeDragoverNotified = false;
let _isOverOverlay = false;
let _lastOverlayKeyState = null;
let _dragSeq = 0;      // ドラッグごとに増加。50ms 待機中に新ドラッグが始まったことを検出するため
let _escapePressed = false; // Escape でキャンセルされた場合は true（ dead-zone workaround をスキップするため）
function handleDragOver(event) {
  const targetNodeName = event.target.nodeName.toUpperCase();
  const isOverlay = !!event.target.dataset?.quickdragOverlay;
  const isIframe = window !== window.top;

  // ターゲットが変わったときだけログ出力（連続発火を抑制）
  if (event.target !== _lastDragOverTarget) {
    _lastDragOverTarget = event.target;
    console.log(`[QD] dragover: frame=${isIframe ? "iframe" : "top"} target=${targetNodeName} isOverlay=${isOverlay} defaultPrevented=${event.defaultPrevented}`);
  }

  // iframe 内の dragover 発火をトップフレームに通知（最初の1回のみ）
  if (isIframe && !_iframeDragoverNotified) {
    _iframeDragoverNotified = true;
    try { window.top.postMessage({ __qdDebug: "dragover", target: targetNodeName }, "*"); } catch (e) {}
  }

  if (targetNodeName === "INPUT" || targetNodeName === "TEXTAREA" || event.shiftKey) {
    return;
  }

  preventDefault(event);
}

/**
 * ドロップ時の処理
 * @param {DragEvent} event
 */
async function handleDrop(event) {
  _isOverOverlay = false;
  _lastOverlayKeyState = null;
  removeIframeOverlays();

  const targetNodeName = event.target.nodeName.toUpperCase();
  const isOverlay = !!event.target.dataset?.quickdragOverlay;
  const frame = window === window.top ? "top" : "iframe";
  console.log(`[QD] drop: frame=${frame} target=${targetNodeName} isOverlay=${isOverlay} selectStr="${state.selectStr}"`);

  // iframe 内での発火をトップフレームに通知（デバッグ用）
  if (window !== window.top) {
    try { window.top.postMessage({ __qdDebug: "drop", selectStr: state.selectStr, target: targetNodeName }, "*"); } catch (e) {}
  }

  // 入力フィールドへのドロップまたはShiftキー押下時は何もしない
  if (targetNodeName === "INPUT" || targetNodeName === "TEXTAREA" || event.shiftKey) {
    console.log("[QD] drop: skipped (input/textarea/shift)");
    resetState();
    return;
  }

  // await より前に同期的に呼ぶ必要がある
  preventDefault(event);

  // ファイルドロップの検出
  if (event.dataTransfer.items) {
    const hasFile = [...event.dataTransfer.items].some(
      (item) => item.kind === "file" && state.selectStr === ""
    );
    if (hasFile) {
      console.log("[QD] drop: skipped (file drop)");
      resetState();
      return;
    }
  }

  // iframe 内で drop が発火した場合、state が空なのでバックグラウンドから取得
  if (state.selectStr === "") {
    try {
      const bgState = await chrome.runtime.sendMessage({ type: "getDragState" });
      console.log("[QD] drop: background state =", bgState);
      if (bgState?.selectStr) Object.assign(state, bgState);
    } catch (e) {
      console.log("[QD] drop: background fallback error", e);
    }
  }

  if (state.selectStr === "") {
    console.log("[QD] drop: skipped (selectStr empty after all fallbacks)");
    resetState();
    return;
  }

  if (state.isImage) {
    handleImageDrop(event);
  } else {
    console.log(`[QD] handleLinkDrop: url="${state.selectStr}" ctrlKey=${event.ctrlKey} altKey=${event.altKey}`);
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
  // Ctrl押下時はクリップボードにコピー
  if (event.ctrlKey) {
    const clipboardText = state.isAddressSearch
      ? state.selectStr
      : event.dataTransfer.getData("text/plain");
    copyToClipboard(clipboardText);
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
    settings.isAddressForeground = checkboxArray.includes("is_address_foreground") || checkboxArray.includes("is_address_forground");
    settings.isSearchForeground = checkboxArray.includes("is_search_foreground") || checkboxArray.includes("is_search_forground");
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
 * バックグラウンドに現在のタブが無効化されているか問い合わせる
 * iframe内でも常にタブのトップレベルURLで判定される
 * @returns {Promise<boolean>}
 */
async function checkDisabled() {
  try {
    const response = await chrome.runtime.sendMessage({ type: "checkDisabled" });
    return response?.disabled ?? false;
  } catch {
    return false;
  }
}

/**
 * SPA ナビゲーション後に有効化/無効化を再判定
 */
async function handleNavigation() {
  if (await checkDisabled()) {
    deactivate();
  } else {
    await activate();
  }
}

/**
 * ストレージ変更時の設定更新
 * @param {Object} changes
 * @param {string} area
 */
async function handleStorageChange(changes, area) {
  if (area !== "local") return;

  if (changes.disabledPatterns !== undefined) {
    if (await checkDisabled()) {
      deactivate();
    } else {
      await activate();
    }
    return;
  }

  if (!isActive) return;

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
// 初期化
// ========================================

/**
 * ドラッグ機能を有効化
 * @returns {Promise<void>}
 */
function handleKeyDown(e) {
  if (e.key === "Escape") _escapePressed = true;
}

async function activate() {
  if (isActive) return;
  isActive = true;
  await loadSettings();
  document.addEventListener("dragstart", handleDragStart, false);
  // dragover/drop はキャプチャフェーズ：ページの stopPropagation より先に発火し、
  // preventDefault を確実に呼べるため dropEffect=none になるのを防ぐ
  document.addEventListener("dragover", handleDragOver, true);
  document.addEventListener("dragend", handleDragEnd, false);
  document.addEventListener("drop", handleDrop, true);
  document.addEventListener("keydown", handleKeyDown, true);
  window.addEventListener("message", handleMessage, false);
}

/**
 * ドラッグ機能を無効化
 */
function deactivate() {
  if (!isActive) return;
  isActive = false;
  document.removeEventListener("dragstart", handleDragStart, false);
  document.removeEventListener("dragover", handleDragOver, true);
  document.removeEventListener("dragend", handleDragEnd, false);
  document.removeEventListener("drop", handleDrop, true);
  document.removeEventListener("keydown", handleKeyDown, true);
  removeIframeOverlays();
  window.removeEventListener("message", handleMessage, false);
}

/**
 * 初期化処理
 * @returns {Promise<void>}
 */
async function initialize() {
  chrome.storage.onChanged.addListener(handleStorageChange);

  // トップフレームのみ SPA ナビゲーションを監視（popstate/hashchange/pushState）
  if (window === window.top) {
    // iframe からのデバッグ通知を受け取る
    window.addEventListener("message", (e) => {
      if (e.data?.__qdDebug === "init")         console.log(`[QD] ★ iframe content script 起動: ${e.data.href}`);
      if (e.data?.__qdDebug === "dragstart")   console.log(`[QD] ★ iframe dragstart! selectStr="${e.data.selectStr}"`);
      if (e.data?.__qdDebug === "dragover")    console.log(`[QD] ★ iframe dragover 発火! target=${e.data.target}`);
      if (e.data?.__qdDebug === "drop")        console.log(`[QD] ★ iframe handleDrop 発火! selectStr="${e.data.selectStr}" target=${e.data.target}`);
      if (e.data?.__qdDebug === "capture-drop") console.log(`[QD] ★ iframe CAPTURE drop 発火! target=${e.data.target}`);
    }, false);

    window.addEventListener("popstate", handleNavigation, false);
    window.addEventListener("hashchange", handleNavigation, false);
    const origPushState = history.pushState.bind(history);
    const origReplaceState = history.replaceState.bind(history);
    history.pushState = function (...args) {
      origPushState(...args);
      handleNavigation();
    };
    history.replaceState = function (...args) {
      origReplaceState(...args);
      handleNavigation();
    };
  }

  if (!await checkDisabled()) {
    await activate();
  }

  // iframe 内で起動したことをトップフレームに通知（デバッグ用）
  if (window !== window.top) {
    try { window.top.postMessage({ __qdDebug: "init", href: location.href }, "*"); } catch (e) {}
  }
}

// 初期化実行
initialize().catch((error) => {
  console.error("Failed to initialize QuickDrag:", error);
});

})();
