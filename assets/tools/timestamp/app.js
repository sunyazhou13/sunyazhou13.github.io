/**
 * 时间戳转换工具 — 纯前端实现，无外部依赖
 *
 * 功能：
 *   - 实时显示当前日期时间（精确到毫秒，每 50ms 刷新）
 *   - 时间戳 → 日期（自动识别秒/毫秒/Apple Double 带小数）
 *   - 日期 → 时间戳（输出秒/毫秒/Apple Double 三种格式）
 *   - Swift / Objective-C 获取时间戳的 API 示例
 *
 * Apple 时间戳说明：
 *   NSDate.timeIntervalSince1970 返回 Double，整数部分为秒，
 *   小数部分为毫秒（如 1692800123.456）。
 *
 * 资源全部位于 /assets/tools/timestamp/，与博客其它功能零耦合。
 * 页面结构见 /tools/timestamp.md
 */

(function () {
  'use strict';

  var root = document.getElementById('ts-app');
  if (!root) return;

  var LANG = (document.documentElement.lang || 'zh').toLowerCase();
  if (LANG.indexOf('en') === 0) LANG = 'en';
  var I18N = {
    'zh': {
    'err-ts-empty': '请输入时间戳',
    'err-ts-parse': '无法解析时间戳，请检查输入',
    'lbl-local': '本地时间',
    'lbl-utc': 'UTC 时间',
    'lbl-unix-sec': 'Unix 秒',
    'lbl-unix-ms': 'Unix 毫秒',
    'lbl-apple': 'Apple Double',
    'lbl-local-confirm': '本地确认',
    'copy': '复制',
    'copied': '已复制',
    'err-date-empty': '请选择日期',
    'err-date-format': '日期格式错误',
    'err-ms-range': '毫秒应在 0-999 范围内',
    'err-date-invalid': '日期无效，请检查输入',
    'dow-pre': ' 星期',
    'c-mark-cur-ts': '// MARK: - 获取当前时间戳',
    'c-sec-double': '// 秒级时间戳（Double，Apple 标准格式，带小数毫秒）',
    'c-eg-double': '// 如: 1692800123.456',
    'c-sec-int': '// 秒级整数时间戳',
    'c-ms-int': '// 毫秒级整数时间戳',
    'c-cfa': '// 纯整数方式（CFAbsoluteTime）',
    'c-cfa-note': '// CFAbsoluteTime 从 2001-01-01 起，需加 978307200 转为 1970 起',
    'c-mark-tsd': '// MARK: - 时间戳 → Date',
    'c-apple-d': '// Apple Double（秒.毫秒）→ Date',
    'c-ms-d': '// 毫秒整数 → Date',
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
    'err-ts-empty': 'Please enter a timestamp',
    'err-ts-parse': 'Could not parse the timestamp, please check the input',
    'lbl-local': 'Local time',
    'lbl-utc': 'UTC time',
    'lbl-unix-sec': 'Unix seconds',
    'lbl-unix-ms': 'Unix milliseconds',
    'lbl-apple': 'Apple Double',
    'lbl-local-confirm': 'Local check',
    'copy': 'Copy',
    'copied': 'Copied',
    'err-date-empty': 'Please pick a date',
    'err-date-format': 'Invalid date format',
    'err-ms-range': 'Milliseconds must be in 0-999',
    'err-date-invalid': 'Invalid date, please check the input',
    'dow-pre': ' ',
    'c-mark-cur-ts': '// MARK: - Get the current timestamp',
    'c-sec-double': '// Second-level timestamp (Double, Apple standard format, with fractional milliseconds)',
    'c-eg-double': '// e.g. 1692800123.456',
    'c-sec-int': '// Second-level integer timestamp',
    'c-ms-int': '// Millisecond-level integer timestamp',
    'c-cfa': '// Pure integer approach (CFAbsoluteTime)',
    'c-cfa-note': '// CFAbsoluteTime starts at 2001-01-01; add 978307200 to convert to the 1970 epoch',
    'c-mark-tsd': '// MARK: - Timestamp → Date',
    'c-apple-d': '// Apple Double (sec.msec) → Date',
    'c-ms-d': '// Millisecond integer → Date',
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
  function t(key) { var v = (I18N[LANG] || {})[key]; return v != null ? v : key; }
  var WEEKDAYS = (LANG === 'en')
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['日', '一', '二', '三', '四', '五', '六'];

  var els = {
    nowDate: document.getElementById('ts-now-date'),
    nowTime: document.getElementById('ts-now-time'),
    nowMs: document.getElementById('ts-now-ms'),
    nowTs: document.getElementById('ts-now-ts'),
    nowTsMs: document.getElementById('ts-now-ts-ms'),
    nowTsApple: document.getElementById('ts-now-ts-apple'),
    nowIso: document.getElementById('ts-now-iso'),
    copyNow: document.getElementById('ts-copy-now'),

    tsInput: document.getElementById('ts-input'),
    tsConvert: document.getElementById('ts-convert'),
    tsResult: document.getElementById('ts-result'),

    dateInput: document.getElementById('ts-date-input'),
    timeInput: document.getElementById('ts-time-input'),
    msInput: document.getElementById('ts-ms-input'),
    dateConvert: document.getElementById('ts-date-convert'),
    dateResult: document.getElementById('ts-date-result'),

    codeTabs: document.getElementById('ts-code-tabs'),
    codeOutput: document.getElementById('ts-code-output'),
    copyCode: document.getElementById('ts-copy-code'),

    error: document.getElementById('ts-error')
  };

  var state = {
    activeLang: 'swift',
    clockTimer: null
  };

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
  }

  /* ---------- 实时时钟 ---------- */

  function updateClock() {
    var now = new Date();
    var Y = now.getFullYear();
    var Mo = pad(now.getMonth() + 1);
    var D = pad(now.getDate());
    var H = pad(now.getHours());
    var Mi = pad(now.getMinutes());
    var S = pad(now.getSeconds());
    var Ms = pad(now.getMilliseconds(), 3);
    var weekday = now.getDay();

    if (els.nowDate) els.nowDate.textContent = Y + '-' + Mo + '-' + D + t('dow-pre') + WEEKDAYS[weekday];
    if (els.nowTime) els.nowTime.textContent = H + ':' + Mi + ':' + S;
    if (els.nowMs) els.nowMs.textContent = '.' + Ms;

    var tsSec = Math.floor(now.getTime() / 1000);
    var tsMs = now.getTime();
    var tsApple = (now.getTime() / 1000).toFixed(3);
    var iso = now.toISOString();

    if (els.nowTs) els.nowTs.textContent = txt(tsSec);
    if (els.nowTsMs) els.nowTsMs.textContent = txt(tsMs);
    if (els.nowTsApple) els.nowTsApple.textContent = tsApple;
    if (els.nowIso) els.nowIso.textContent = iso;
  }

  function startClock() {
    updateClock();
    if (state.clockTimer) clearInterval(state.clockTimer);
    state.clockTimer = setInterval(updateClock, 50);
  }

  /* ---------- 时间戳 → 日期 ---------- */

  /* 自动识别时间戳格式：
     - 10 位整数 → 秒
     - 13 位整数 → 毫秒
     - 带小数点 → Apple Double（秒.毫秒） */
  function parseTimestamp(input) {
    var s = input.trim();
    if (!s) return null;

    var hasDot = s.indexOf('.') !== -1;
    var num = parseFloat(s);
    if (isNaN(num)) return null;

    /* Apple Double: 秒.毫秒（如 1692800123.456） */
    if (hasDot) {
      return new Date(num * 1000);
    }

    /* 整数：13 位 → 毫秒，10 位 → 秒，其他按长度猜 */
    if (s.length >= 13) {
      return new Date(num); /* 毫秒 */
    } else {
      return new Date(num * 1000); /* 秒 */
    }
  }

  function formatDate(d) {
    var Y = d.getFullYear();
    var Mo = pad(d.getMonth() + 1);
    var D = pad(d.getDate());
    var H = pad(d.getHours());
    var Mi = pad(d.getMinutes());
    var S = pad(d.getSeconds());
    var Ms = pad(d.getMilliseconds(), 3);
    var weekday = d.getDay();

    var local = Y + '-' + Mo + '-' + D + ' ' + H + ':' + Mi + ':' + S + '.' + Ms + t('dow-pre') + WEEKDAYS[weekday];
    var utc = d.toISOString();
    var tsSec = Math.floor(d.getTime() / 1000);
    var tsMs = d.getTime();
    var tsApple = (d.getTime() / 1000).toFixed(3);

    return {
      local: local,
      utc: utc,
      iso: d.toISOString(),
      tsSec: tsSec,
      tsMs: tsMs,
      tsApple: tsApple,
      tsInput: txt(tsSec)
    };
  }

  function doConvertTs() {
    clearError();
    var input = els.tsInput.value;
    if (!input.trim()) {
      showError(t('err-ts-empty'));
      els.tsResult.innerHTML = '';
      return;
    }

    var d = parseTimestamp(input);
    if (!d || isNaN(d.getTime())) {
      showError(t('err-ts-parse'));
      els.tsResult.innerHTML = '';
      return;
    }

    var fmt = formatDate(d);
    var html = '';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-local') + '</span><code class="ts-res-val">' + fmt.local + '</code></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-utc') + '</span><code class="ts-res-val">' + fmt.utc + '</code></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">ISO 8601</span><code class="ts-res-val">' + fmt.iso + '</code></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-sec') + '</span><code class="ts-res-val">' + fmt.tsSec + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsSec + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-ms') + '</span><code class="ts-res-val">' + fmt.tsMs + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsMs + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-apple') + '</span><code class="ts-res-val">' + fmt.tsApple + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + fmt.tsApple + '">' + t('copy') + '</button></div>';

    els.tsResult.innerHTML = html;
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

    var tsSec = Math.floor(d.getTime() / 1000);
    var tsMs = d.getTime();
    var tsApple = (d.getTime() / 1000).toFixed(3);
    var iso = d.toISOString();

    var html = '';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-sec') + '</span><code class="ts-res-val">' + tsSec + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + tsSec + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-unix-ms') + '</span><code class="ts-res-val">' + tsMs + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + tsMs + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-apple') + '</span><code class="ts-res-val">' + tsApple + '</code><button type="button" class="ts-btn ts-btn-copy" data-copy-value="' + tsApple + '">' + t('copy') + '</button></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">ISO 8601</span><code class="ts-res-val">' + iso + '</code></div>';
    html += '<div class="ts-res-item"><span class="ts-res-label">' + t('lbl-local-confirm') + '</span><code class="ts-res-val">' + formatDate(d).local + '</code></div>';

    els.dateResult.innerHTML = html;
  }

  /* ---------- 代码片段 ---------- */

  function generateCode() {
    var lang = state.activeLang;
    var code = '';
    if (lang === 'swift') code = genSwiftCode();
    else code = genObjCCode();
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
    L.push(t('c-sec-d'));
    L.push('let date3 = Date(timeIntervalSince1970: TimeInterval(1692800123))');
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
    L.push(t('c-pragma-tsd'));
    L.push('');
    L.push(t('c-apple-ns'));
    L.push('NSDate *date = [NSDate dateWithTimeIntervalSince1970:1692800123.456];');
    L.push('');
    L.push(t('c-ms-ns'));
    L.push('NSDate *date2 = [NSDate dateWithTimeIntervalSince1970:(NSTimeInterval)1692800123456 / 1000];');
    L.push('');
    L.push(t('c-sec-ns'));
    L.push('NSDate *date3 = [NSDate dateWithTimeIntervalSince1970:(NSTimeInterval)1692800123];');
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

  /* ---------- 轻量语法高亮 ---------- */

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

  /* ---------- 事件 ---------- */

  els.tsConvert.addEventListener('click', doConvertTs);
  els.tsInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') doConvertTs();
  });

  els.dateConvert.addEventListener('click', doConvertDate);

  /* Tab 切换 */
  els.codeTabs.addEventListener('click', function (e) {
    var btn = e.target;
    while (btn && btn !== els.codeTabs && !(btn.getAttribute && btn.getAttribute('data-lang'))) {
      btn = btn.parentNode;
    }
    if (!btn || btn === els.codeTabs) return;
    var lang = btn.getAttribute('data-lang');
    state.activeLang = lang;
    var tabs = els.codeTabs.querySelectorAll('.ts-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('ts-tab-active', tabs[i] === btn);
    }
    generateCode();
  });

  /* 复制：事件委托 */
  root.addEventListener('click', function (e) {
    /* 单值复制 */
    var btn = e.target;
    while (btn && btn !== root && !(btn.getAttribute && btn.getAttribute('data-copy-value'))) {
      btn = btn.parentNode;
    }
    if (btn !== root && btn.getAttribute && btn.getAttribute('data-copy-value')) {
      copyText(btn.getAttribute('data-copy-value'), btn);
      return;
    }
    /* 当前时间戳复制 */
    if (e.target === els.copyNow || (e.target.parentNode === els.copyNow)) {
      copyText(els.nowTsApple.textContent, els.copyNow);
    }
    /* 代码复制 */
    if (e.target === els.copyCode || (e.target.parentNode === els.copyCode)) {
      copyText(els.codeOutput.textContent, els.copyCode);
    }
  });

  /* ---------- 启动 ---------- */

  clearError();
  startClock();
  generateCode();

  /* 页面卸载时清理定时器 */
  window.addEventListener('beforeunload', function () {
    if (state.clockTimer) clearInterval(state.clockTimer);
  });
})();
