/**
 * 时间戳转换工具 v2 — 纯前端实现，无外部依赖
 *
 * 功能：
 *   - 实时时钟（毫秒精度，多语言，多时区）
 *   - 时间戳 → 日期（自动识别秒/毫秒/微秒/Apple Double）
 *   - 日期 → 时间戳（输出多种格式）
 *   - 快捷预设按钮（当前时间/一天前/月初/Unix纪元/2038年问题）
 *   - 历史记录（localStorage 持久化）
 *   - 相对时间 + RFC 2822 + 多时区
 *   - Swift / Objective-C API 示例
 */

(function () {
  'use strict';

  var root = document.getElementById('ts-app');
  if (!root) return;

  /* ---------- i18n ---------- */
  var LANG = (document.documentElement.lang || 'zh').toLowerCase();
  if (LANG.indexOf('en') === 0) LANG = 'en';

  var I18N = {
    'zh': {
      'now': '当前时间',
      'utc': 'UTC',
      'relative': '相对时间',
      'sec': '秒',
      'ms': '毫秒',
      'us': '微秒',
      'apple': 'Apple Double',
      'copy': '复制',
      'copied': '已复制',
      'add-tz': '添加时区',
      'remove-tz': '移除',
      'presets': '快速预设',
      'preset-now': '当前时间',
      'preset-1d': '一天前',
      'preset-bom': '本月月初',
      'preset-epoch': 'Unix 纪元 (0)',
      'preset-2038': '2038 年问题',
      'history': '历史记录',
      'history-clear': '清空',
      'history-empty': '暂无转换记录',
      'err-ts-empty': '请输入时间戳',
      'err-ts-parse': '无法解析时间戳，请检查输入',
      'lbl-local': '本地时间',
      'lbl-utc': 'UTC',
      'lbl-iso': 'ISO 8601',
      'lbl-rfc': 'RFC 2822',
      'lbl-unix-sec': 'Unix 秒',
      'lbl-unix-ms': 'Unix 毫秒',
      'lbl-unix-us': 'Unix 微秒',
      'lbl-apple': 'Apple Double',
      'lbl-local-confirm': '本地确认',
      'lbl-ms-detected': '检测到微秒级（16位），已自动转换',
      'detect': '定位我的时区',
      'detecting': '正在定位…',
      'tz-search-ph': '搜索城市或时区…',
      'tz-add-btn': '添加',
      'tz-not-found': '未找到匹配的时区',
      'tz-dup': '该时区已添加',
      'loc-success': '已添加 {city} ({tz})',
      'loc-intl': '已使用设备时区：{tz}',
      'loc-fail': '无法检测时区，请手动添加',
      'grp-asia': '亚洲',
      'grp-europe': '欧洲',
      'grp-america': '美洲',
      'grp-africa': '非洲',
      'grp-pacific': '澳洲与太平洋',
      'grp-other': '其他',
      'err-date-empty': '请选择日期',
      'err-date-format': '日期格式错误',
      'err-ms-range': '毫秒应在 0-999 范围内',
      'err-date-invalid': '日期无效，请检查输入',
      'dow-pre': ' 星期',
      'ago': '前',
      'later': '后',
      'just-now': '刚刚',
      'minutes': '分钟',
      'hours': '小时',
      'days': '天',
      'months': '个月',
      'years': '年',
      'c-mark-cur-ts': '// MARK: - 获取当前时间戳',
      'c-sec-double': '// 秒级时间戳（Double，Apple 标准格式，带小数毫秒）',
      'c-eg-double': '// 如: 1692800123.456',
      'c-sec-int': '// 秒级整数时间戳',
      'c-ms-int': '// 毫秒级整数时间戳',
      'c-us-int': '// 微秒级整数时间戳',
      'c-cfa': '// 纯整数方式（CFAbsoluteTime）',
      'c-cfa-note': '// CFAbsoluteTime 从 2001-01-01 起，需加 978307200 转为 1970 起',
      'c-mark-tsd': '// MARK: - 时间戳 → Date',
      'c-apple-d': '// Apple Double（秒.毫秒）→ Date',
      'c-ms-d': '// 毫秒整数 → Date',
      'c-us-d': '// 微秒整数 → Date',
      'c-sec-d': '// 秒整数 → Date',
      'c-mark-fmt': '// MARK: - Date → 格式化字符串',
      'c-eg-fmt': '// 如: "2023-08-23 18:28:43.456"',
      'c-mark-comp': '// MARK: - 获取当前时间各分量',
      'c-ns2ms-line': 'let ms = comp.nanosecond! / 1_000_000  // 纳秒 → 毫秒',
      'c-mark-iso': '// MARK: - ISO8601 格式',
      'c-eg-iso-s': '// 如: "2023-08-23T10:28:43Z"',
      'c-iso-ms': '// 带毫秒的 ISO8601',
      'c-eg-iso-ms': '// 如: "2023-08-23T10:28:43.456Z"',
      'c-pragma-cur': '#pragma mark - 获取当前时间戳',
      'c-pragma-tsd': '#pragma mark - 时间戳 → NSDate',
      'c-apple-ns': '// Apple Double（秒.毫秒）→ NSDate',
      'c-ms-ns': '// 毫秒整数 → NSDate',
      'c-us-ns': '// 微秒整数 → NSDate',
      'c-sec-ns': '// 秒整数 → NSDate',
      'c-pragma-fmt': '#pragma mark - NSDate → 格式化字符串',
      'c-eg-objc-fmt': '// 如: @"2023-08-23 18:28:43.456"',
      'c-pragma-comp': '#pragma mark - 获取当前时间各分量',
      'c-objc-ns2ms': 'NSInteger ms = comp.nanosecond / 1000000;  // 纳秒 → 毫秒',
      'c-pragma-iso': '#pragma mark - ISO8601 格式',
      'c-eg-objc-iso': '// 如: @"2023-08-23T10:28:43.456Z"',
      'c-pragma-perf': '#pragma mark - 性能计时（高精度）',
      'c-mach': '// mach_absolute_time 适合微观级计时（纳秒精度）',
      'c-dots': '// ... 执行耗时操作 ...',
    },
    'en': {
      'now': 'Current',
      'utc': 'UTC',
      'relative': 'Relative',
      'sec': 'sec',
      'ms': 'ms',
      'us': 'μs',
      'apple': 'Apple',
      'copy': 'Copy',
      'copied': 'Copied',
      'add-tz': 'Add timezone',
      'remove-tz': 'Remove',
      'presets': 'Quick Presets',
      'preset-now': 'Now',
      'preset-1d': '1 day ago',
      'preset-bom': 'Start of month',
      'preset-epoch': 'Unix Epoch (0)',
      'preset-2038': 'Year 2038 Bug',
      'history': 'History',
      'history-clear': 'Clear',
      'history-empty': 'No conversion history yet',
      'err-ts-empty': 'Please enter a timestamp',
      'err-ts-parse': 'Could not parse the timestamp, please check the input',
      'lbl-local': 'Local',
      'lbl-utc': 'UTC',
      'lbl-iso': 'ISO 8601',
      'lbl-rfc': 'RFC 2822',
      'lbl-unix-sec': 'Unix sec',
      'lbl-unix-ms': 'Unix ms',
      'lbl-unix-us': 'Unix μs',
      'lbl-apple': 'Apple Double',
      'lbl-local-confirm': 'Local confirm',
      'lbl-ms-detected': 'Microsecond (16-digit) detected, auto-converted',
      'detect': 'Locate my timezone',
      'detecting': 'Locating…',
      'tz-search-ph': 'Search city or timezone…',
      'tz-add-btn': 'Add',
      'tz-not-found': 'No matching timezone found',
      'tz-dup': 'Timezone already added',
      'loc-success': 'Added {city} ({tz})',
      'loc-intl': 'Using device timezone: {tz}',
      'loc-fail': 'Could not detect timezone, please add manually',
      'grp-asia': 'Asia',
      'grp-europe': 'Europe',
      'grp-america': 'Americas',
      'grp-africa': 'Africa',
      'grp-pacific': 'Australia & Pacific',
      'grp-other': 'Other',
      'err-date-empty': 'Please pick a date',
      'err-date-format': 'Invalid date format',
      'err-ms-range': 'Milliseconds must be in 0-999',
      'err-date-invalid': 'Invalid date, please check the input',
      'dow-pre': ' ',
      'ago': ' ago',
      'later': ' later',
      'just-now': 'just now',
      'minutes': 'min',
      'hours': 'hr',
      'days': 'days',
      'months': 'mo',
      'years': 'yr',
      'c-mark-cur-ts': '// MARK: - Get the current timestamp',
      'c-sec-double': '// Second-level timestamp (Double, Apple standard format, with fractional milliseconds)',
      'c-eg-double': '// e.g. 1692800123.456',
      'c-sec-int': '// Second-level integer timestamp',
      'c-ms-int': '// Millisecond-level integer timestamp',
      'c-us-int': '// Microsecond-level integer timestamp',
      'c-cfa': '// Pure integer approach (CFAbsoluteTime)',
      'c-cfa-note': '// CFAbsoluteTime starts at 2001-01-01; add 978307200 to convert to the 1970 epoch',
      'c-mark-tsd': '// MARK: - Timestamp → Date',
      'c-apple-d': '// Apple Double (sec.msec) → Date',
      'c-ms-d': '// Millisecond integer → Date',
      'c-us-d': '// Microsecond integer → Date',
      'c-sec-d': '// Second integer → Date',
      'c-mark-fmt': '// MARK: - Date → formatted string',
      'c-eg-fmt': '// e.g. "2023-08-23 18:28:43.456"',
      'c-mark-comp': '// MARK: - Get current date components',
      'c-ns2ms-line': 'let ms = comp.nanosecond! / 1_000_000  // nanoseconds → milliseconds',
      'c-mark-iso': '// MARK: - ISO8601 formatting',
      'c-eg-iso-s': '// e.g. "2023-08-23T10:28:43Z"',
      'c-iso-ms': '// ISO8601 with milliseconds',
      'c-eg-iso-ms': '// e.g. "2023-08-23T10:28:43.456Z"',
      'c-pragma-cur': '#pragma mark - Get the current timestamp',
      'c-pragma-tsd': '#pragma mark - Timestamp → NSDate',
      'c-apple-ns': '// Apple Double (sec.msec) → NSDate',
      'c-ms-ns': '// Millisecond integer → NSDate',
      'c-us-ns': '// Microsecond integer → NSDate',
      'c-sec-ns': '// Second integer → NSDate',
      'c-pragma-fmt': '#pragma mark - NSDate → formatted string',
      'c-eg-objc-fmt': '// e.g. @"2023-08-23 18:28:43.456"',
      'c-pragma-comp': '#pragma mark - Get current date components',
      'c-objc-ns2ms': 'NSInteger ms = comp.nanosecond / 1000000;  // nanoseconds → milliseconds',
      'c-pragma-iso': '#pragma mark - ISO8601 formatting',
      'c-eg-objc-iso': '// e.g. @"2023-08-23T10:28:43.456Z"',
      'c-pragma-perf': '#pragma mark - High-precision timing',
      'c-mach': '// mach_absolute_time suits micro-scale timing (nanosecond precision)',
      'c-dots': '// ... perform the timed operation ...',
    }
  };

  function t(key) {
    var v = (I18N[LANG] || {})[key];
    return v != null ? v : key;
  }

  var WEEKDAYS = (LANG === 'en')
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['日', '一', '二', '三', '四', '五', '六'];

  /* ---------- 世界主要城市时区数据 ----------
   * 结构: [IANA 时区, 英文名, 中文名, 纬度, 经度]
   * 纬度/经度用于地理定位反查最近城市; 名称用于搜索与展示（i18n 联动）。
   */
  var TZ_CITIES = [
    /* Asia */
    /* 东八区主条目标识为 Asia/Beijing（非 IANA 官方标识，换算经 resolveTz() 映射到 Asia/Shanghai）。 */
    ['Asia/Beijing', 'Beijing', '北京', 39.90, 116.40],
    /* 华东地理锚点（别名样式）：无它时华东定位会错配到台北；换算时 Intl 原生支持。 */
    ['Asia/Shanghai', 'Asia/Shanghai', 'Asia/Shanghai', 31.23, 121.47],
    /* 别名条目：China Taibei 非 IANA 官方标识（Asia/China Taipei 同样），换算经 resolveTz() 映射。 */
    ['Asia/China Taipei', 'Taiwan, China', '中国台湾省', 25.03, 121.57],
    ['China Taibei', 'China Taibei', 'China Taibei', 25.03, 121.57],
    ['Asia/Hong_Kong', 'Hong Kong', '香港', 22.32, 114.17],
    ['Asia/Macau', 'Macau', '澳门', 22.20, 113.55],
    ['Asia/Tokyo', 'Tokyo', '东京', 35.68, 139.69],
    ['Asia/Seoul', 'Seoul', '首尔', 37.57, 126.98],
    ['Asia/Singapore', 'Singapore', '新加坡', 1.35, 103.82],
    ['Asia/Kuala_Lumpur', 'Kuala Lumpur', '吉隆坡', 3.14, 101.69],
    ['Asia/Bangkok', 'Bangkok', '曼谷', 13.76, 100.50],
    ['Asia/Jakarta', 'Jakarta', '雅加达', -6.21, 106.85],
    ['Asia/Makassar', 'Bali (Denpasar)', '巴厘岛（登巴萨）', -8.65, 115.22],
    ['Asia/Manila', 'Manila', '马尼拉', 14.60, 120.98],
    ['Asia/Ho_Chi_Minh', 'Ho Chi Minh City', '胡志明市', 10.82, 106.63],
    ['Asia/Phnom_Penh', 'Phnom Penh', '金边', 11.56, 104.92],
    ['Asia/Vientiane', 'Vientiane', '万象', 17.97, 102.63],
    ['Asia/Yangon', 'Yangon', '仰光', 16.87, 96.20],
    ['Asia/Dhaka', 'Dhaka', '达卡', 23.81, 90.41],
    ['Asia/Kathmandu', 'Kathmandu', '加德满都', 27.72, 85.32],
    ['Asia/Kolkata', 'New Delhi', '新德里', 28.61, 77.21],
    ['Asia/Karachi', 'Karachi', '卡拉奇', 24.86, 67.01],
    ['Asia/Colombo', 'Colombo', '科伦坡', 6.93, 79.85],
    ['Asia/Dubai', 'Dubai', '迪拜', 25.20, 55.27],
    ['Asia/Riyadh', 'Riyadh', '利雅得', 24.71, 46.68],
    ['Asia/Tehran', 'Tehran', '德黑兰', 35.69, 51.39],
    ['Asia/Baghdad', 'Baghdad', '巴格达', 33.31, 44.36],
    ['Asia/Jerusalem', 'Jerusalem', '耶路撒冷', 31.77, 35.21],
    ['Asia/Beirut', 'Beirut', '贝鲁特', 33.89, 35.50],
    ['Asia/Amman', 'Amman', '安曼', 31.95, 35.93],
    ['Asia/Istanbul', 'Istanbul', '伊斯坦布尔', 41.01, 28.98],
    ['Asia/Tbilisi', 'Tbilisi', '第比利斯', 41.72, 44.83],
    ['Asia/Yerevan', 'Yerevan', '埃里温', 40.18, 44.51],
    ['Asia/Baku', 'Baku', '巴库', 40.41, 49.87],
    ['Asia/Almaty', 'Almaty', '阿拉木图', 43.26, 76.93],
    ['Asia/Tashkent', 'Tashkent', '塔什干', 41.30, 69.24],
    ['Asia/Ulaanbaatar', 'Ulaanbaatar', '乌兰巴托', 47.89, 106.91],
    ['Asia/Vladivostok', 'Vladivostok', '海参崴', 43.12, 131.87],
    /* Europe */
    ['Europe/London', 'London', '伦敦', 51.51, -0.13],
    ['Europe/Dublin', 'Dublin', '都柏林', 53.35, -6.26],
    ['Europe/Lisbon', 'Lisbon', '里斯本', 38.72, -9.14],
    ['Europe/Madrid', 'Madrid', '马德里', 40.42, -3.70],
    ['Europe/Paris', 'Paris', '巴黎', 48.86, 2.35],
    ['Europe/Brussels', 'Brussels', '布鲁塞尔', 50.85, 4.35],
    ['Europe/Amsterdam', 'Amsterdam', '阿姆斯特丹', 52.37, 4.90],
    ['Europe/Berlin', 'Berlin', '柏林', 52.52, 13.40],
    ['Europe/Vienna', 'Vienna', '维也纳', 48.21, 16.37],
    ['Europe/Prague', 'Prague', '布拉格', 50.08, 14.44],
    ['Europe/Warsaw', 'Warsaw', '华沙', 52.23, 21.01],
    ['Europe/Zurich', 'Zurich', '苏黎世', 47.38, 8.54],
    ['Europe/Rome', 'Rome', '罗马', 41.90, 12.50],
    ['Europe/Stockholm', 'Stockholm', '斯德哥尔摩', 59.33, 18.07],
    ['Europe/Oslo', 'Oslo', '奥斯陆', 59.91, 10.75],
    ['Europe/Copenhagen', 'Copenhagen', '哥本哈根', 55.68, 12.57],
    ['Europe/Helsinki', 'Helsinki', '赫尔辛基', 60.17, 24.94],
    ['Europe/Athens', 'Athens', '雅典', 37.98, 23.73],
    ['Europe/Sofia', 'Sofia', '索菲亚', 42.70, 23.32],
    ['Europe/Bucharest', 'Bucharest', '布加勒斯特', 44.43, 26.10],
    ['Europe/Budapest', 'Budapest', '布达佩斯', 47.50, 19.04],
    ['Europe/Kyiv', 'Kyiv', '基辅', 50.45, 30.52],
    ['Europe/Minsk', 'Minsk', '明斯克', 53.90, 27.57],
    ['Europe/Moscow', 'Moscow', '莫斯科', 55.76, 37.62],
    ['Europe/Reykjavik', 'Reykjavik', '雷克雅未克', 64.15, -21.94],
    /* Americas */
    ['America/New_York', 'New York', '纽约', 40.71, -74.01],
    ['America/Chicago', 'Chicago', '芝加哥', 41.88, -87.63],
    ['America/Denver', 'Denver', '丹佛', 39.74, -104.99],
    ['America/Los_Angeles', 'Los Angeles', '洛杉矶', 34.05, -118.24],
    ['America/Phoenix', 'Phoenix', '凤凰城', 33.45, -112.07],
    ['America/Anchorage', 'Anchorage', '安克雷奇', 61.22, -149.90],
    ['America/Toronto', 'Toronto', '多伦多', 43.65, -79.38],
    ['America/Vancouver', 'Vancouver', '温哥华', 49.28, -123.12],
    ['America/Winnipeg', 'Winnipeg', '温尼伯', 49.90, -97.14],
    ['America/Halifax', 'Halifax', '哈利法克斯', 44.65, -63.58],
    ['America/St_Johns', "St. John's", '圣约翰斯', 47.56, -52.71],
    ['America/Mexico_City', 'Mexico City', '墨西哥城', 19.43, -99.13],
    ['America/Havana', 'Havana', '哈瓦那', 23.11, -82.37],
    ['America/Guatemala', 'Guatemala City', '危地马拉城', 14.63, -90.51],
    ['America/Panama', 'Panama City', '巴拿马城', 8.98, -79.52],
    ['America/Costa_Rica', 'San José', '圣何塞', 9.93, -84.08],
    ['America/San_Juan', 'San Juan', '圣胡安', 18.47, -66.11],
    ['America/Bogota', 'Bogotá', '波哥大', 4.71, -74.07],
    ['America/Lima', 'Lima', '利马', -12.05, -77.04],
    ['America/Quito', 'Quito', '基多', -0.18, -78.47],
    ['America/Caracas', 'Caracas', '加拉加斯', 10.49, -66.88],
    ['America/La_Paz', 'La Paz', '拉巴斯', -16.50, -68.12],
    ['America/Santiago', 'Santiago', '圣地亚哥', -33.45, -70.67],
    ['America/Argentina/Buenos_Aires', 'Buenos Aires', '布宜诺斯艾利斯', -34.60, -58.38],
    ['America/Sao_Paulo', 'São Paulo', '圣保罗', -23.55, -46.63],
    ['America/Manaus', 'Manaus', '马瑙斯', -3.12, -60.02],
    ['America/Asuncion', 'Asunción', '亚松森', -25.26, -57.58],
    ['America/Montevideo', 'Montevideo', '蒙得维的亚', -34.90, -56.16],
    /* Africa */
    ['Africa/Casablanca', 'Casablanca', '卡萨布兰卡', 33.57, -7.59],
    ['Africa/Algiers', 'Algiers', '阿尔及尔', 36.75, 3.06],
    ['Africa/Tunis', 'Tunis', '突尼斯', 36.81, 10.18],
    ['Africa/Cairo', 'Cairo', '开罗', 30.04, 31.24],
    ['Africa/Lagos', 'Lagos', '拉各斯', 6.52, 3.38],
    ['Africa/Accra', 'Accra', '阿克拉', 5.60, -0.19],
    ['Africa/Nairobi', 'Nairobi', '内罗毕', -1.29, 36.82],
    ['Africa/Addis_Ababa', 'Addis Ababa', '亚的斯亚贝巴', 9.03, 38.74],
    ['Africa/Kampala', 'Kampala', '坎帕拉', 0.35, 32.58],
    ['Africa/Kinshasa', 'Kinshasa', '金沙萨', -4.44, 15.27],
    ['Africa/Luanda', 'Luanda', '罗安达', -8.84, 13.23],
    ['Africa/Harare', 'Harare', '哈拉雷', -17.83, 31.05],
    ['Africa/Johannesburg', 'Johannesburg', '约翰内斯堡', -26.20, 28.05],
    ['Africa/Windhoek', 'Windhoek', '温得和克', -22.56, 17.08],
    ['Africa/Maputo', 'Maputo', '马普托', -25.97, 32.58],
    ['Africa/Dakar', 'Dakar', '达喀尔', 14.72, -17.47],
    ['Africa/Abidjan', 'Abidjan', '阿比让', 5.36, -4.01],
    /* Australia & Pacific */
    ['Australia/Perth', 'Perth', '珀斯', -31.95, 115.86],
    ['Australia/Adelaide', 'Adelaide', '阿德莱德', -34.93, 138.60],
    ['Australia/Darwin', 'Darwin', '达尔文', -12.46, 130.84],
    ['Australia/Brisbane', 'Brisbane', '布里斯班', -27.47, 153.03],
    ['Australia/Sydney', 'Sydney', '悉尼', -33.87, 151.21],
    ['Australia/Melbourne', 'Melbourne', '墨尔本', -37.81, 144.96],
    ['Australia/Hobart', 'Hobart', '霍巴特', -42.88, 147.33],
    ['Pacific/Guam', 'Guam', '关岛', 13.44, 144.79],
    ['Pacific/Port_Moresby', 'Port Moresby', '莫尔兹比港', -9.44, 147.18],
    ['Pacific/Noumea', 'Nouméa', '努美阿', -22.28, 166.46],
    ['Pacific/Fiji', 'Suva', '苏瓦', -18.14, 178.44],
    ['Pacific/Auckland', 'Auckland', '奥克兰', -36.85, 174.76],
    ['Pacific/Honolulu', 'Honolulu', '檀香山', 21.31, -157.86],
    ['Pacific/Majuro', 'Majuro', '马朱罗', 7.09, 171.38],
    /* Other */
    ['Atlantic/Azores', 'Ponta Delgada', '蓬塔德尔加达', 37.74, -25.67],
    ['Atlantic/Cape_Verde', 'Praia', '普拉亚', 14.93, -23.51],
    ['Indian/Maldives', 'Malé', '马累', 4.18, 73.51],
    ['Indian/Mauritius', 'Port Louis', '路易港', -20.16, 57.50]
  ];

  /* ---------- DOM refs ---------- */
  var els = {
    nowDate: document.getElementById('ts-now-date'),
    nowTime: document.getElementById('ts-now-time'),
    nowMs: document.getElementById('ts-now-ms'),
    nowTs: document.getElementById('ts-now-ts'),
    nowTsMs: document.getElementById('ts-now-ts-ms'),
    nowTsUs: document.getElementById('ts-now-ts-us'),
    nowTsApple: document.getElementById('ts-now-ts-apple'),
    nowIso: document.getElementById('ts-now-iso'),
    nowRfc: document.getElementById('ts-now-rfc'),
    tzUtc: document.getElementById('ts-tz-utc'),
    tzList: document.getElementById('ts-tz-list'),
    addTz: document.getElementById('ts-add-tz'),
    tzLocate: document.getElementById('ts-locate'),
    tzSearch: document.getElementById('ts-tz-search'),
    tzAddBtn: document.getElementById('ts-tz-add-btn'),
    copyNow: document.getElementById('ts-copy-now'),

    presets: document.getElementById('ts-presets'),
    tsInput: document.getElementById('ts-input'),
    tsConvert: document.getElementById('ts-convert'),
    tsResult: document.getElementById('ts-result'),

    dateInput: document.getElementById('ts-date-input'),
    timeInput: document.getElementById('ts-time-input'),
    msInput: document.getElementById('ts-ms-input'),
    dateConvert: document.getElementById('ts-date-convert'),
    dateResult: document.getElementById('ts-date-result'),

    history: document.getElementById('ts-history'),
    historyList: document.getElementById('ts-history-list'),
    historyClear: document.getElementById('ts-history-clear'),

    codeTabs: document.getElementById('ts-code-tabs'),
    codeOutput: document.getElementById('ts-code-output'),
    copyCode: document.getElementById('ts-copy-code'),

    error: document.getElementById('ts-error')
  };

  var state = {
    activeLang: 'swift',
    clockTimer: null,
    customTz: loadCustomTz(),
    flashTz: null
  };

  /* ---------- utilities ---------- */
  function txt(n) { return n == null ? '' : String(n); }

  function pad(n, len) {
    len = len || 2;
    var s = '000' + n;
    return s.slice(s.length - len);
  }

  function showError(msg) {
    if (!els.error) return;
    els.error.textContent = msg;
    els.error.hidden = false;
  }

  function clearError() {
    if (!els.error) return;
    els.error.textContent = '';
    els.error.hidden = true;
    els.error.classList.remove('ts-success');
  }

  function showTip(msg, ok) {
    if (!els.error) return;
    els.error.textContent = msg;
    els.error.hidden = false;
    els.error.classList.toggle('ts-success', !!ok);
  }

  /* 时区别名映射：浏览器 Intl 不识别 Asia/Beijing 与 Asia/China Taipei，
   * 换算前必须映射到标准 IANA 标识（均为 UTC+8，映射后结果一致且不抛错）。 */
  var TZ_ALIAS = {
    'Asia/Beijing': 'Asia/Shanghai',
    'Asia/China Taipei': 'Asia/Taipei',
    'China Taibei': 'Asia/Taipei'
  };
  function resolveTz(tz) {
    return TZ_ALIAS[tz] || tz;
  }

  /* ---------- 时区数据工具 ---------- */
  var TZ_GROUP_ORDER = ['grp-asia', 'grp-europe', 'grp-america', 'grp-africa', 'grp-pacific', 'grp-other'];

  function cityName(c) {
    return LANG === 'en' ? c[1] : c[2];
  }

  function findCityByTz(tz) {
    for (var i = 0; i < TZ_CITIES.length; i++) {
      if (TZ_CITIES[i][0] === tz) return TZ_CITIES[i];
    }
    return null;
  }

  function tzGroupOf(tz) {
    if (tz.indexOf('Asia/') === 0) return 'grp-asia';
    if (tz.indexOf('Europe/') === 0) return 'grp-europe';
    if (tz.indexOf('America/') === 0) return 'grp-america';
    if (tz.indexOf('Africa/') === 0) return 'grp-africa';
    if (tz.indexOf('Australia/') === 0 || tz.indexOf('Pacific/') === 0) return 'grp-pacific';
    return 'grp-other';
  }

  /* 按洲分组渲染时区下拉选项（中英文联动） */
  function renderTzOptions() {
    if (!els.addTz) return;
    var groups = {};
    TZ_CITIES.forEach(function (c) {
      var g = tzGroupOf(c[0]);
      (groups[g] = groups[g] || []).push(c);
    });
    var html = '<option value="" disabled selected>' + t('add-tz') + '</option>';
    TZ_GROUP_ORDER.forEach(function (g) {
      if (!groups[g]) return;
      var arr = groups[g].slice().sort(function (a, b) {
        return cityName(a).localeCompare(cityName(b), LANG === 'en' ? 'en' : 'zh-Hans-CN');
      });
      html += '<optgroup label="' + t(g) + '">';
      arr.forEach(function (c) {
        /* 别名条目 c[1] === c[0]（英中文名即 IANA 名本身），只显示一次，避免重复 */
        var label = (c[1] === c[0]) ? c[0] : cityName(c) + ' (' + c[0] + ')';
        html += '<option value="' + c[0] + '">' + escapeHtml(label) + '</option>';
      });
      html += '</optgroup>';
    });
    els.addTz.innerHTML = html;
  }

  /* 解析用户输入: 支持城市中文/英文名、IANA 时区名（忽略大小写、模糊包含） */
  function resolveTzKeyword(kw) {
    var s = String(kw || '').trim();
    if (!s) return null;
    var ls = s.toLowerCase();

    /* 1) IANA 时区名直接校验 */
    if (ls.indexOf('/') !== -1) {
      var exact = findCityByTz(s);
      if (exact) return exact[0];
      try {
        new Intl.DateTimeFormat('en-US', { timeZone: s }).format();
        return s;
      } catch (e) { /* 继续模糊匹配 */ }
    }

    /* 2) 城市名模糊匹配（唯一命中才返回） */
    var hits = TZ_CITIES.filter(function (c) {
      return c[0].toLowerCase().indexOf(ls) !== -1 ||
        c[1].toLowerCase().indexOf(ls) !== -1 ||
        c[2].toLowerCase().indexOf(ls) !== -1;
    });
    if (hits.length === 1) return hits[0][0];
    /* 多个命中但映射到同一标准时区（如 taipei / china 多个别名）时也视为有效 */
    var std = {};
    hits.forEach(function (c) {
      std[resolveTz(c[0])] = c[0];
    });
    if (Object.keys(std).length === 1) return hits[0][0];
    return null;
  }

  /* ---------- 地理定位 ---------- */
  var EARTH_R = 6371;

  function haversine(lat1, lng1, lat2, lng2) {
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return EARTH_R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function nearestCity(lat, lng) {
    var best = null;
    var bestDist = Infinity;
    TZ_CITIES.forEach(function (c) {
      var d = haversine(lat, lng, c[3], c[4]);
      /* 同坐标别名行与标准行平局时优先标准行，保证定位显示常规城市名 */
      var preferStd = (d === bestDist) && best && TZ_ALIAS[best[0]] && !TZ_ALIAS[c[0]];
      if (d < bestDist || preferStd) {
        bestDist = d;
        best = c;
      }
    });
    return best;
  }

  function detectTzIntl() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz && tz.length ? tz : null;
    } catch (e) {
      return null;
    }
  }

  function locateTz() {
    var btn = els.tzLocate;
    function busy(on) {
      if (!btn) return;
      btn.disabled = on;
      btn.textContent = on ? t('detecting') : t('detect');
    }
    /* 回退: 设备时区（Intl，零权限） */
    function viaIntl() {
      busy(false);
      var tz = detectTzIntl();
      if (!tz) {
        showTip(t('loc-fail'), false);
        return;
      }
      if (addCustomTz(tz)) {
        showTip(t('loc-intl').replace('{tz}', tz), true);
      }
    }
    if (!navigator.geolocation) {
      viaIntl();
      return;
    }
    busy(true);
    navigator.geolocation.getCurrentPosition(function (pos) {
      busy(false);
      var city = nearestCity(pos.coords.latitude, pos.coords.longitude);
      if (!city) {
        viaIntl();
        return;
      }
      if (addCustomTz(city[0])) {
        showTip(t('loc-success').replace('{city}', cityName(city)).replace('{tz}', city[0]), true);
      }
    }, function () {
      viaIntl();
    }, { timeout: 8000, maximumAge: 600000 });
  }

  function formatDateTime(d) {
    var Y = d.getFullYear();
    var Mo = pad(d.getMonth() + 1);
    var D = pad(d.getDate());
    var H = pad(d.getHours());
    var Mi = pad(d.getMinutes());
    var S = pad(d.getSeconds());
    var Ms = pad(d.getMilliseconds(), 3);
    var weekday = d.getDay();
    return {
      dateStr: Y + '-' + Mo + '-' + D + t('dow-pre') + WEEKDAYS[weekday],
      timeStr: H + ':' + Mi + ':' + S,
      msStr: '.' + Ms,
      iso: d.toISOString(),
      rfc: d.toUTCString(),
      tsSec: Math.floor(d.getTime() / 1000),
      tsMs: d.getTime(),
      tsUs: d.getTime() * 1000,
      tsApple: (d.getTime() / 1000).toFixed(3),
      local: Y + '-' + Mo + '-' + D + ' ' + H + ':' + Mi + ':' + S + '.' + Ms + t('dow-pre') + WEEKDAYS[weekday]
    };
  }

  function timeInZone(d, tz) {
    try {
      return d.toLocaleString(LANG === 'en' ? 'en-US' : 'zh-CN', {
        timeZone: resolveTz(tz),
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      });
    } catch (e) {
      return '—';
    }
  }

  /* ---------- 相对时间 ---------- */
  function relativeTime(d) {
    var now = Date.now();
    var diff = now - d.getTime();
    var abs = Math.abs(diff);
    var suffix = diff >= 0 ? t('ago') : t('later');

    if (abs < 60000) return t('just-now');
    if (abs < 3600000) return Math.floor(abs / 60000) + ' ' + t('minutes') + suffix;
    if (abs < 86400000) return Math.floor(abs / 3600000) + ' ' + t('hours') + suffix;
    if (abs < 2592000000) return Math.floor(abs / 86400000) + ' ' + t('days') + suffix;
    if (abs < 31536000000) return Math.floor(abs / 2592000000) + ' ' + t('months') + suffix;
    return Math.floor(abs / 31536000000) + ' ' + t('years') + suffix;
  }

  /* ---------- 实时时钟 ---------- */
  function updateClock() {
    var now = new Date();
    var fmt = formatDateTime(now);

    if (els.nowDate) els.nowDate.textContent = fmt.dateStr;
    if (els.nowTime) els.nowTime.textContent = fmt.timeStr;
    if (els.nowMs) els.nowMs.textContent = fmt.msStr;
    if (els.nowTs) els.nowTs.textContent = txt(fmt.tsSec);
    if (els.nowTsMs) els.nowTsMs.textContent = txt(fmt.tsMs);
    if (els.nowTsUs) els.nowTsUs.textContent = txt(fmt.tsUs);
    if (els.nowTsApple) els.nowTsApple.textContent = fmt.tsApple;
    if (els.nowIso) els.nowIso.textContent = fmt.iso;
    if (els.nowRfc) els.nowRfc.textContent = fmt.rfc;

    /* 固定时区：本地 + UTC */
    var tzLocal = document.getElementById('ts-tz-local');
    var tzUtc = document.getElementById('ts-tz-utc');
    if (tzLocal) tzLocal.textContent = fmt.local;
    if (tzUtc) tzUtc.textContent = timeInZone(now, 'UTC');

    /* 自定义时区 */
    renderTzCustom(now);
  }

  function renderTzCustom(now) {
    var container = document.getElementById('ts-tz-custom');
    if (!container) return;
    var html = '';
    state.customTz.forEach(function (tz) {
      html += '<div class="ts-tz-item' + (tz === state.flashTz ? ' ts-tz-flash' : '') + '" data-tz="' + escapeHtml(tz) + '"><span class="ts-tz-name">' + escapeHtml(tz) + '</span><code class="ts-tz-val">' + escapeHtml(timeInZone(now, tz)) + '</code><button type="button" class="ts-btn ts-btn-sm ts-btn-icon" data-remove-tz="' + escapeHtml(tz) + '" title="' + t('remove-tz') + '">×</button></div>';
    });
    container.innerHTML = html;
  }

  function startClock() {
    updateClock();
    if (state.clockTimer) clearInterval(state.clockTimer);
    state.clockTimer = setInterval(updateClock, 50);
  }

  /* ---------- 时间戳解析（自动识别） ---------- */
  function parseTimestamp(input) {
    var s = input.trim();
    if (!s) return null;

    var hasDot = s.indexOf('.') !== -1;
    var num = parseFloat(s);
    if (isNaN(num)) return null;

    /* Apple Double: 秒.毫秒 */
    if (hasDot) {
      return { date: new Date(num * 1000), unit: 'apple', raw: num };
    }

    var intStr = s.replace(/^-/, '');
    /* 16+ 位 → 微秒 */
    if (intStr.length >= 16) {
      return { date: new Date(num / 1000), unit: 'us', raw: num };
    }
    /* 13-15 位 → 毫秒 */
    if (intStr.length >= 13) {
      return { date: new Date(num), unit: 'ms', raw: num };
    }
    /* 10-12 位 → 秒 */
    if (intStr.length >= 10) {
      return { date: new Date(num * 1000), unit: 'sec', raw: num };
    }
    /* < 10 位：按数值大小猜 */
    if (num > 1e12) {
      return { date: new Date(num), unit: 'ms', raw: num };
    }
    return { date: new Date(num * 1000), unit: 'sec', raw: num };
  }

  /* ---------- 时间戳 → 日期 ---------- */
  function doConvertTs() {
    clearError();
    var input = els.tsInput.value;
    if (!input.trim()) {
      showError(t('err-ts-empty'));
      els.tsResult.innerHTML = '';
      return;
    }

    var parsed = parseTimestamp(input);
    if (!parsed || !parsed.date || isNaN(parsed.date.getTime())) {
      showError(t('err-ts-parse'));
      els.tsResult.innerHTML = '';
      return;
    }

    var d = parsed.date;
    var fmt = formatDateTime(d);
    var rel = relativeTime(d);
    var html = '';

    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-local') + '</span><code class="ts-res-val">' + fmt.local + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + escapeHtml(fmt.local) + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-utc') + '</span><code class="ts-res-val">' + fmt.iso + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + escapeHtml(fmt.iso) + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-rfc') + '</span><code class="ts-res-val">' + fmt.rfc + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + escapeHtml(fmt.rfc) + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('relative') + '</span><code class="ts-res-val">' + rel + '</code></div>';

    if (parsed.unit === 'us') {
      html += '<div class="ts-res-item ts-res-note"><span class="ts-res-label"></span><span class="ts-res-val">' + t('lbl-ms-detected') + '</span></div>';
    }

    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-sec') + '</span><code class="ts-res-val">' + fmt.tsSec + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsSec + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-ms') + '</span><code class="ts-res-val">' + fmt.tsMs + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsMs + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-us') + '</span><code class="ts-res-val">' + fmt.tsUs + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsUs + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-apple') + '</span><code class="ts-res-val">' + fmt.tsApple + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsApple + '">' + t('copy') + '</button></div>';

    els.tsResult.innerHTML = html;

    /* 记录历史 */
    addHistory('ts2date', input, fmt.local + ' · ' + rel);
  }

  /* ---------- 日期 → 时间戳 ---------- */
  function doConvertDate() {
    clearError();
    var dateStr = els.dateInput.value;
    var timeStr = els.timeInput.value || '00:00:00';
    var msStr = els.msInput.value || '0';

    if (!dateStr) {
      showError(t('err-date-empty'));
      els.dateResult.innerHTML = '';
      return;
    }

    var parts = dateStr.split('-');
    if (parts.length !== 3) {
      showError(t('err-date-format'));
      els.dateResult.innerHTML = '';
      return;
    }

    var Y = parseInt(parts[0], 10);
    var Mo = parseInt(parts[1], 10) - 1;
    var D = parseInt(parts[2], 10);

    var timeParts = timeStr.split(':');
    var H = parseInt(timeParts[0], 10) || 0;
    var Mi = parseInt(timeParts[1], 10) || 0;
    var S = parseInt(timeParts[2], 10) || 0;
    var Ms = parseInt(msStr, 10) || 0;

    if (Ms < 0 || Ms > 999) {
      showError(t('err-ms-range'));
      els.dateResult.innerHTML = '';
      return;
    }

    var d = new Date(Y, Mo, D, H, Mi, S, Ms);
    if (isNaN(d.getTime())) {
      showError(t('err-date-invalid'));
      els.dateResult.innerHTML = '';
      return;
    }

    var fmt = formatDateTime(d);
    var rel = relativeTime(d);

    var html = '';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-sec') + '</span><code class="ts-res-val">' + fmt.tsSec + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsSec + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-ms') + '</span><code class="ts-res-val">' + fmt.tsMs + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsMs + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-us') + '</span><code class="ts-res-val">' + fmt.tsUs + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsUs + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-apple') + '</span><code class="ts-res-val">' + fmt.tsApple + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsApple + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">ISO 8601</span><code class="ts-res-val">' + fmt.iso + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + escapeHtml(fmt.iso) + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-rfc') + '</span><code class="ts-res-val">' + fmt.rfc + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + escapeHtml(fmt.rfc) + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('relative') + '</span><code class="ts-res-val">' + rel + '</code></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-local-confirm') + '</span><code class="ts-res-val">' + fmt.local + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + escapeHtml(fmt.local) + '">' + t('copy') + '</button></div>';

    els.dateResult.innerHTML = html;

    addHistory('date2ts', dateStr + ' ' + timeStr, fmt.tsSec + ' / ' + fmt.tsMs + ' / ' + fmt.tsApple);
  }

  /* ---------- 快捷预设 ---------- */
  function applyPreset(key) {
    var now = new Date();
    var d;
    switch (key) {
      case 'now': d = now; break;
      case '1d': d = new Date(now.getTime() - 86400000); break;
      case 'bom': d = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'epoch': d = new Date(0); break;
      case '2038': d = new Date(2147483647000); break;
      default: return;
    }
    els.tsInput.value = String(Math.floor(d.getTime() / 1000));
    doConvertTs();
  }

  /* ---------- 历史记录 ---------- */
  var LS_KEY = 'ts-history-v2';
  var MAX_HISTORY = 20;

  function loadHistory() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveHistory(list) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(list.slice(0, MAX_HISTORY))); } catch (e) {}
  }

  function addHistory(type, input, output) {
    var list = loadHistory();
    list.unshift({ type: type, input: input, output: output, time: Date.now() });
    saveHistory(list);
    renderHistory();
  }

  function renderHistory() {
    if (!els.historyList) return;
    var list = loadHistory();
    if (list.length === 0) {
      els.historyList.innerHTML = '<div class="ts-history-empty">' + t('history-empty') + '</div>';
      return;
    }
    var html = '';
    list.forEach(function (item, idx) {
      var d = new Date(item.time);
      var timeStr = pad(d.getHours()) + ':' + pad(d.getMinutes());
      html += '<div class="ts-history-item" data-history-idx="' + idx + '">' +
        '<div class="ts-history-meta"><span class="ts-history-time">' + timeStr + '</span><span class="ts-history-type">' + (item.type === 'ts2date' ? 'TS→Date' : 'Date→TS') + '</span></div>' +
        '<div class="ts-history-input">' + escapeHtml(String(item.input).substring(0, 40)) + '</div>' +
        '<div class="ts-history-output">' + escapeHtml(String(item.output).substring(0, 60)) + '</div>' +
        '</div>';
    });
    els.historyList.innerHTML = html;
  }

  function clearHistory() {
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    renderHistory();
  }

  /* ---------- 自定义时区 ---------- */
  function loadCustomTz() {
    try {
      var raw = localStorage.getItem('ts-custom-tz');
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function saveCustomTz() {
    try { localStorage.setItem('ts-custom-tz', JSON.stringify(state.customTz)); } catch (e) {}
  }

  function removeCustomTz(tz) {
    var idx = state.customTz.indexOf(tz);
    if (idx !== -1) {
      state.customTz.splice(idx, 1);
      saveCustomTz();
      updateClock();
    }
  }

  function addCustomTz(tz) {
    if (!tz) return false;
    if (state.customTz.indexOf(tz) !== -1) {
      showTip(t('tz-dup'), false);
      return false;
    }
    state.customTz.push(tz);
    saveCustomTz();
    state.flashTz = tz;
    updateClock();
    setTimeout(function () {
      if (state.flashTz === tz) {
        state.flashTz = null;
        updateClock();
      }
    }, 1800);
    return true;
  }

  /* ---------- 代码片段 ---------- */
  function generateCode() {
    var lang = state.activeLang;
    var code = (lang === 'swift') ? genSwiftCode() : genObjCCode();
    els.codeOutput.innerHTML = highlightCode(code);
  }

  function genSwiftCode() {
    var L = [];
    L.push(t('c-mark-cur-ts'));
    L.push('');
    L.push(t('c-sec-double'));
    L.push('let tsApple = Date().timeIntervalSince1970');
    L.push(t('c-eg-double'));
    L.push('');
    L.push(t('c-sec-int'));
    L.push('let tsSec = Int(Date().timeIntervalSince1970)');
    L.push('');
    L.push(t('c-ms-int'));
    L.push('let tsMs = Int(Date().timeIntervalSince1970 * 1000)');
    L.push('');
    L.push(t('c-us-int'));
    L.push('let tsUs = Int(Date().timeIntervalSince1970 * 1_000_000)');
    L.push('');
    L.push(t('c-cfa'));
    L.push('let absTime = CFAbsoluteTimeGetCurrent() + 978307200');
    L.push(t('c-cfa-note'));
    L.push('');
    L.push(t('c-mark-tsd'));
    L.push('');
    L.push(t('c-apple-d'));
    L.push('let date = Date(timeIntervalSince1970: 1692800123.456)');
    L.push('');
    L.push(t('c-ms-d'));
    L.push('let date2 = Date(timeIntervalSince1970: TimeInterval(1692800123456) / 1000)');
    L.push('');
    L.push(t('c-us-d'));
    L.push('let date3 = Date(timeIntervalSince1970: TimeInterval(1692800123456000) / 1_000_000)');
    L.push('');
    L.push(t('c-sec-d'));
    L.push('let date4 = Date(timeIntervalSince1970: TimeInterval(1692800123))');
    L.push('');
    L.push(t('c-mark-fmt'));
    L.push('');
    L.push('let formatter = DateFormatter()');
    L.push('formatter.dateFormat = "yyyy-MM-dd HH:mm:ss.SSS"');
    L.push('formatter.timeZone = TimeZone.current');
    L.push('let str = formatter.string(from: date)');
    L.push(t('c-eg-fmt'));
    L.push('');
    L.push(t('c-mark-comp'));
    L.push('');
    L.push('let cal = Calendar.current');
    L.push('let comp = cal.dateComponents([.year, .month, .day, .hour, .minute, .second, .nanosecond], from: Date())');
    L.push(t('c-ns2ms-line'));
    L.push('');
    L.push(t('c-mark-iso'));
    L.push('');
    L.push('let isoStr = ISO8601DateFormatter().string(from: date)');
    L.push(t('c-eg-iso-s'));
    L.push('');
    L.push(t('c-iso-ms'));
    L.push('let isoFmt = ISO8601DateFormatter()');
    L.push('isoFmt.formatOptions = [.withInternetDateTime, .withFractionalSeconds]');
    L.push('let isoMs = isoFmt.string(from: date)');
    L.push(t('c-eg-iso-ms'));
    return L.join('\n');
  }

  function genObjCCode() {
    var L = [];
    L.push(t('c-pragma-cur'));
    L.push('');
    L.push(t('c-sec-double'));
    L.push('NSTimeInterval tsApple = [[NSDate date] timeIntervalSince1970];');
    L.push(t('c-eg-double'));
    L.push('');
    L.push(t('c-sec-int'));
    L.push('NSInteger tsSec = (NSInteger)[[NSDate date] timeIntervalSince1970];');
    L.push('');
    L.push(t('c-ms-int'));
    L.push('NSInteger tsMs = (NSInteger)([[NSDate date] timeIntervalSince1970] * 1000);');
    L.push('');
    L.push(t('c-us-int'));
    L.push('NSInteger tsUs = (NSInteger)([[NSDate date] timeIntervalSince1970] * 1000000);');
    L.push('');
    L.push(t('c-pragma-tsd'));
    L.push('');
    L.push(t('c-apple-ns'));
    L.push('NSDate *date = [NSDate dateWithTimeIntervalSince1970:1692800123.456];');
    L.push('');
    L.push(t('c-ms-ns'));
    L.push('NSDate *date2 = [NSDate dateWithTimeIntervalSince1970:(NSTimeInterval)1692800123456 / 1000];');
    L.push('');
    L.push(t('c-us-ns'));
    L.push('NSDate *date3 = [NSDate dateWithTimeIntervalSince1970:(NSTimeInterval)1692800123456000 / 1000000];');
    L.push('');
    L.push(t('c-sec-ns'));
    L.push('NSDate *date4 = [NSDate dateWithTimeIntervalSince1970:(NSTimeInterval)1692800123];');
    L.push('');
    L.push(t('c-pragma-fmt'));
    L.push('');
    L.push('NSDateFormatter *fmt = [NSDateFormatter new];');
    L.push('fmt.dateFormat = @"yyyy-MM-dd HH:mm:ss.SSS";');
    L.push('fmt.timeZone = [NSTimeZone localTimeZone];');
    L.push('NSString *str = [fmt stringFromDate:date];');
    L.push(t('c-eg-objc-fmt'));
    L.push('');
    L.push(t('c-pragma-comp'));
    L.push('');
    L.push('NSCalendar *cal = [NSCalendar currentCalendar];');
    L.push('NSDateComponents *comp = [cal components:(NSCalendarUnitYear | NSCalendarUnitMonth |');
    L.push('    NSCalendarUnitDay | NSCalendarUnitHour | NSCalendarUnitMinute |');
    L.push('    NSCalendarUnitSecond | NSCalendarUnitNanosecond) fromDate:[NSDate date]];');
    L.push(t('c-objc-ns2ms'));
    L.push('');
    L.push(t('c-pragma-iso'));
    L.push('');
    L.push('NSISO8601DateFormatter *isoFmt = [NSISO8601DateFormatter new];');
    L.push('isoFmt.formatOptions = NSISO8601DateFormatWithInternetDateTime |');
    L.push('                       NSISO8601DateFormatWithFractionalSeconds;');
    L.push('NSString *isoStr = [isoFmt stringFromDate:date];');
    L.push(t('c-eg-objc-iso'));
    L.push('');
    L.push(t('c-pragma-perf'));
    L.push('');
    L.push(t('c-mach'));
    L.push('uint64_t start = mach_absolute_time();');
    L.push(t('c-dots'));
    L.push('uint64_t elapsed = mach_absolute_time() - start;');
    L.push('mach_timebase_info_data_t info;');
    L.push('mach_timebase_info(&info);');
    L.push('double seconds = (double)elapsed * info.numer / info.denom / 1e9;');
    return L.join('\n');
  }

  /* ---------- 语法高亮 ---------- */
  function highlightCode(code) {
    var s = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var re = /(\/\/[^\n]*)|(#pragma[^\n]*)|('[^']*'|"[^"]*")|(#[0-9A-Fa-f]{3,8}\b)|(0x[0-9A-Fa-f]+)|(\b\d+\.?\d*[fF]?\b)|\b(let|var|Int|Double|TimeInterval|Date|DateFormatter|ISO8601DateFormatter|Calendar|NSCalendar|NSDate|NSDateFormatter|NSISO8601DateFormatter|NSDateComponents|NSString|NSInteger|NSTimeInterval|NSUInteger|uint64_t|BOOL|CFAbsoluteTime|CGFloat|NSCalendarUnit)\b|(@[a-zA-Z]+)|(\.[a-zA-Z_][a-zA-Z0-9_]*)/g;
    return s.replace(re, function(m, c1, c2, s1, h, n1, n2, k, a, p) {
      if (c1 || c2) return '<span class="ts-tok-c">' + m + '</span>';
      if (s1) return '<span class="ts-tok-s">' + m + '</span>';
      if (h || n1 || n2) return '<span class="ts-tok-n">' + m + '</span>';
      if (k) return '<span class="ts-tok-k">' + m + '</span>';
      if (a) return '<span class="ts-tok-a">' + m + '</span>';
      if (p) return '<span class="ts-tok-p">' + m + '</span>';
      return m;
    });
  }

  /* ---------- 复制 ---------- */
  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove();
  }

  function flashCopied(btn) {
    var old = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('ts-copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = old;
      btn.classList.remove('ts-copied');
    }, 1200);
  }

  function copyText(text, btn) {
    function done() { flashCopied(btn); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        copyFallback(text);
        done();
      });
    } else {
      copyFallback(text);
      done();
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 事件绑定 ---------- */

  /* 预设按钮 */
  if (els.presets) {
    els.presets.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-preset]');
      if (btn) applyPreset(btn.getAttribute('data-preset'));
    });
  }

  /* 添加时区 — 下拉选择（选项由 renderTzOptions 生成） */
  if (els.addTz) {
    els.addTz.addEventListener('change', function () {
      var tz = els.addTz.value;
      els.addTz.value = '';
      if (tz) addCustomTz(tz);
    });
  }

  /* 定位我的时区（地理定位，回退设备时区） */
  if (els.tzLocate) {
    els.tzLocate.addEventListener('click', locateTz);
  }

  /* 搜索/输入时区 → 添加 */
  function handleTzSearch() {
    if (!els.tzSearch) return;
    var tz = resolveTzKeyword(els.tzSearch.value);
    if (!tz) {
      showTip(t('tz-not-found'), false);
      return;
    }
    els.tzSearch.value = '';
    addCustomTz(tz);
  }

  if (els.tzAddBtn) {
    els.tzAddBtn.addEventListener('click', handleTzSearch);
  }

  if (els.tzSearch) {
    els.tzSearch.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleTzSearch();
      }
    });
  }

  /* 转换 */
  els.tsConvert.addEventListener('click', doConvertTs);
  els.tsInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doConvertTs();
  });

  els.dateConvert.addEventListener('click', doConvertDate);

  /* Tab 切换 */
  els.codeTabs.addEventListener('click', function (e) {
    var btn = e.target.closest('.ts-tab');
    if (!btn) return;
    var lang = btn.getAttribute('data-lang');
    state.activeLang = lang;
    els.codeTabs.querySelectorAll('.ts-tab').forEach(function (t) {
      t.classList.toggle('ts-tab-active', t === btn);
    });
    generateCode();
  });

  /* 全局点击委托 */
  root.addEventListener('click', function (e) {
    var btn;

    /* 复制按钮 */
    btn = e.target.closest('[data-copy-value]');
    if (btn) {
      copyText(btn.getAttribute('data-copy-value'), btn);
      return;
    }

    /* 复制当前时间戳 */
    if (e.target === els.copyNow || e.target.closest('#ts-copy-now') === els.copyNow) {
      copyText(els.nowTsApple.textContent, els.copyNow);
      return;
    }

    /* 复制代码 */
    if (e.target === els.copyCode || e.target.closest('#ts-copy-code') === els.copyCode) {
      copyText(els.codeOutput.textContent, els.copyCode);
      return;
    }

    /* 移除时区 */
    btn = e.target.closest('[data-remove-tz]');
    if (btn) {
      removeCustomTz(btn.getAttribute('data-remove-tz'));
      return;
    }

    /* 历史记录点击回填 */
    btn = e.target.closest('.ts-history-item');
    if (btn && btn.hasAttribute('data-history-idx')) {
      var idx = parseInt(btn.getAttribute('data-history-idx'), 10);
      var list = loadHistory();
      if (list[idx]) {
        var item = list[idx];
        if (item.type === 'ts2date') {
          els.tsInput.value = item.input;
          doConvertTs();
          els.tsInput.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  });

  /* 清空历史 */
  if (els.historyClear) {
    els.historyClear.addEventListener('click', clearHistory);
  }

  /* ---------- 启动 ---------- */
  clearError();
  renderTzOptions();
  startClock();
  generateCode();
  renderHistory();

  window.addEventListener('beforeunload', function () {
    if (state.clockTimer) clearInterval(state.clockTimer);
  });
})();
