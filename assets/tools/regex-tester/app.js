/**
 * 正则表达式测试器 — 纯前端实时高亮匹配 / 捕获组分组 / 回溯复杂度提示
 *
 *   - 支持 /pattern/flags 完整形式或纯 pattern + 下方勾选 flags
 *   - 实时高亮所有匹配项（mark 元素），显示匹配数量、位置与耗时
 *   - 捕获组按「匹配 × 组号」表格展示文本与位置
 *   - 疑似灾难性回溯（嵌套量词等）给出警示
 *
 * 类名前缀 rt-，与既有工具同构。页面结构见 /tools/regex-tester.md
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('rt-app');
  if (!ROOT) return;
  /* 语言感知文案（zh / en），跟随 document.documentElement.lang */
  var LANG = (document.documentElement.lang || '').toLowerCase() === 'en' ? 'en' : 'zh';
  var I18N = {
    zh: {
      'regex-invalid-pre': '正则无效：',
      'danger-nested': '检测到嵌套量词（如 (\w+)+、(\d*)*）：在极端输入下可能引发灾难性回溯，建议改写为原子的、非贪婪或更精确的匹配',
      'danger-chain': '检测到连续的 .*、.+ 通配链（如 .*.*）：可能引发过度回溯，建议合并或限制范围',
      'danger-overlap': '检测到重叠的可选分支重复，存在回溯放大风险',
      'match-pre': '匹配 ',
      'pos-sep': ' · 位置 ',
      'groups-title': '捕获分组',
      'whole-group': '整体',
      'group-pre': '组 ',
      'only-first-pre': '仅显示前 ',
      'only-first-post': ' 个匹配',
      'unit-chars-sep': ' 个字符 · ',
      'match-count-pre': ' 处匹配 · 耗时 ',
      'ms-suf': ' ms',
      'lt1ms': '<1 ms',
      'warn-title': '⚠ 回溯风险提示',
      'slow-pre': '本次匹配耗时 ',
      'slow-post': ' ms，显著偏慢，输入规模或正则设计可能触发回溯放大',
      'th-pos': '位置',
      'no-match': '无匹配',
      'need-text': '请输入测试文本',
      'sample-text': '联系 user1@example.com 与 admin@test.cn，更多：foo@bar.io\n或 alt+key 组合，再看 123-456-7890 是否命中',
    },
    en: {
      'regex-invalid-pre': 'Invalid regex: ',
      'danger-nested': 'Nested quantifiers detected (e.g. (\w+)+, (\d*)*): under extreme input this may cause catastrophic backtracking; rewrite with atomic, non-greedy or more precise patterns',
      'danger-chain': 'Consecutive .* / .+ wildcard chains detected (e.g. .*.*): may cause excessive backtracking; merge them or limit their scope',
      'danger-overlap': 'Overlapping optional-branch repetition detected; there is a risk of backtracking amplification',
      'match-pre': 'Match ',
      'pos-sep': ' · position ',
      'groups-title': 'Capture groups',
      'whole-group': 'whole',
      'group-pre': 'group ',
      'only-first-pre': 'Only the first ',
      'only-first-post': ' matches shown',
      'unit-chars-sep': ' chars · ',
      'match-count-pre': ' matches · time ',
      'ms-suf': ' ms',
      'lt1ms': '<1 ms',
      'warn-title': '⚠ Backtracking risk warning',
      'slow-pre': 'This match took ',
      'slow-post': ' ms, unusually slow; the input size or regex design may trigger backtracking amplification',
      'th-pos': 'Position',
      'no-match': 'No match',
      'need-text': 'Enter some test text',
      'sample-text': 'Contact user1@example.com and admin@test.cn, more: foo@bar.io\nor alt+key combos, see if 123-456-7890 hits',
    }
  };
  function t(key) { return I18N[LANG][key] != null ? I18N[LANG][key] : key; }


  function $id(k) { return document.getElementById('rt-' + k); }
  var els = {
    pattern: $id('pattern'), text: $id('text'),
    status: $id('status'), warn: $id('warn'), meta: $id('meta'),
    output: $id('output'), groups: $id('groups')
  };
  var flagBoxes = Array.prototype.slice.call(ROOT.querySelectorAll('.rt-flags input[type="checkbox"]'));

  var SLOW_MS = 50;
  var state = { matches: [], lastMs: 0 };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function note(msg, cls) {
    els.status.textContent = msg || '';
    els.status.className = 'rt-status' + (cls ? ' rt-status-' + cls : '');
  }
  function blankStatus() { els.status.textContent = ''; els.status.className = 'rt-status'; }

  function setWarn(items) {
    if (!items.length) { els.warn.hidden = true; els.warn.innerHTML = ''; return; }
    els.warn.hidden = false;
    els.warn.innerHTML = '<span class="rt-warn-title">' + t('warn-title') + '</span><ul>' +
      items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';
  }

  /* ---------- 编译 ---------- */
  function currentFlags() {
    var s = '';
    flagBoxes.forEach(function (b) { if (b.checked) s += b.value; });
    return s;
  }

  function compile() {
    var raw = els.pattern.value;
    if (!raw.trim()) return { ok: false, empty: true, error: '' };
    var m = raw.match(/^\/([\s\S]*)\/([gimsuy]*)$/);
    var source = m ? m[1] : raw;
    var flags = (m ? m[2] : currentFlags());
    try {
      return { ok: true, re: new RegExp(source, flags) };
    } catch (e) {
      return { ok: false, error: t('regex-invalid-pre') + (e && e.message || e) };
    }
  }

  /* ---------- 匹配收集 ---------- */
  function collectMatches(re, text) {
    var out = [];
    var m, guard = 0;
    while ((m = re.exec(text)) !== null) {
      out.push(m);
      if (++guard > 100000) break;
      if (m[0].length === 0) re.lastIndex += 1; // 零宽匹配推进，避免死循环
    }
    return out;
  }

  /* ---------- 灾难性回溯启发式检测 ---------- */
  function detectDanger(src) {
    var out = [];
    // 嵌套量词，如 (\w+)+ / (\d*)* / (a+)+b
    if (/\([^()]*[+*][^()]*\)[+*?]/.test(src)) {
      out.push(t('danger-nested'));
    }
    // 连续通配量词，如 .*. * 链
    if (/(?:\.[*+]){2,}/.test(src)) {
      out.push(t('danger-chain'));
    }
    // 重叠的可选重复字符组
    if (/(\([^()]*\|[^()]*\)[+*])\1/.test(src)) {
      out.push(t('danger-overlap'));
    }
    return out;
  }

  /* ---------- 渲染 ---------- */
  function buildHighlighted() {
    var wrap = els.output;
    wrap.innerHTML = '';
    var text = els.text.value;
    var cursor = 0;
    state.matches.forEach(function (m, idx) {
      var pre = text.slice(cursor, m.index);
      if (pre) wrap.appendChild(document.createTextNode(pre));
      var mark = document.createElement('mark');
      mark.className = 'rt-mark';
      mark.textContent = m[0] || '∅';
      mark.title = t('match-pre') + (idx + 1) + t('pos-sep') + m.index + '–' + (m.index + m[0].length);
      wrap.appendChild(mark);
      cursor = m.index + m[0].length;
    });
    var tail = text.slice(cursor);
    if (tail) wrap.appendChild(document.createTextNode(tail));
  }

  function renderGroups() {
    var list = state.matches;
    var maxGroups = 0;
    list.forEach(function (m) { maxGroups = Math.max(maxGroups, m.length); });

    var html = '<div class="rt-groups-title">' + t('groups-title') + '</div><table class="rt-gtable"><thead><tr><th>#</th>';
    for (var j = 0; j < maxGroups; j++) {
      html += '<th>' + (j === 0 ? t('whole-group') : t('group-pre') + j) + '</th>';
    }
    html += '<th>' + t('th-pos') + '</th></tr></thead><tbody>';

    var shown = Math.min(list.length, 200);
    for (var i = 0; i < shown; i++) {
      var m = list[i];
      html += '<tr><td class="rt-gi">' + (i + 1) + '</td>';
      for (j = 0; j < maxGroups; j++) {
        var g = m[j];
        html += '<td class="rt-g">' + (g === undefined ? '—' : esc(g)) + '</td>';
      }
      html += '<td class="rt-gpos">' + m.index + '–' + (m.index + m[0].length) + '</td></tr>';
    }
    html += '</tbody></table>';
    if (list.length > shown) html += '<p class="rt-groups-more">' + t('only-first-pre') + shown + t('only-first-post') + '</p>';
    els.groups.innerHTML = html;
  }

  function updateMeta(count, ms, charCount) {
    els.meta.textContent = charCount + t('unit-chars-sep') + count + t('match-count-pre') +
      (ms >= 1 ? Math.round(ms) + t('ms-suf') : t('lt1ms'));
  }

  /* ---------- 主流程 ---------- */
  function render() {
    var c = compile();
    if (c.empty) {
      blankStatus(); els.meta.textContent = ''; els.output.innerHTML = '';
      els.groups.innerHTML = ''; setWarn([]);
      return;
    }
    if (!c.ok) {
      note(c.error, 'error'); els.meta.textContent = ''; els.output.innerHTML = '';
      els.groups.innerHTML = ''; setWarn([]);
      return;
    }

    var re = c.re;
    var t0 = performance.now();
    var matches = collectMatches(re, els.text.value);
    var dt = (performance.now() - t0);
    state.matches = matches;
    state.lastMs = dt;

    var charCount = els.text.value.length;
    var danger = detectDanger(c.re.source);

    // 回溯/复杂度监控：超时即可疑
    if (dt > SLOW_MS) {
      danger.push(t('slow-pre') + Math.round(dt) + t('slow-post'));
    }
    setWarn(danger);

    if (!matches.length) {
      note(charCount ? t('no-match') : t('need-text'), 'warn');
      els.meta.textContent = charCount + t('unit-chars-sep') + '0' + t('match-count-pre') +
        (dt >= 1 ? Math.round(dt) + t('ms-suf') : t('lt1ms'));
      els.output.innerHTML = '';
      els.groups.innerHTML = '';
      return;
    }

    blankStatus();
    buildHighlighted();
    renderGroups();
    updateMeta(matches.length, dt, charCount);
  }

  /* ---------- 事件（防抖 250ms） ---------- */
  var timer = null;
  function schedule() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(render, 250);
  }
  els.pattern.addEventListener('input', schedule);
  els.text.addEventListener('input', schedule);
  flagBoxes.forEach(function (b) { b.addEventListener('change', render); });

  /* ---------- 初始示例 ---------- */
  els.pattern.value = '(\\w+)@(\\w+)\\.(\\w+)';
  els.text.value = t('sample-text');
  render();
})();
