/**
 * 菜谱搜索 —— 零依赖，纯前端过滤。
 *
 * 设计取舍：
 *   · 索引直接取渲染好的 DOM 文本（菜名 + 配料 + 摘要），
 *     所以加菜只改 _data/recipes.yml，这里一个字都不用动。
 *   · 折叠状态下也能命中配料 —— 想清冰箱时搜「茄子」「五花肉」比搜菜名有用。
 *   · 无 JS 时搜索框不显示（CSS 里 display:none，靠 html.rc-js 打开），
 *     原生 <details> 照常可用，属于渐进增强而不是把页面变成 JS 依赖。
 *   · 中文输入法用 compositionstart/end 挡住，不会在拼音阶段就开始过滤。
 */
(function () {
  'use strict';

  var app = document.getElementById('rc-app');
  if (!app) return;

  var input = app.querySelector('.rc-q');
  if (!input) return;

  document.documentElement.classList.add('rc-js');

  var searchBox = app.querySelector('.rc-search');
  var clearBtn = app.querySelector('.rc-q-clear');
  var counter = app.querySelector('.rc-q-count');
  var noResult = app.querySelector('.rc-noresult');

  var sections = Array.prototype.slice.call(app.querySelectorAll('section.rc-section'));

  // 分类计数徽章：记下原始总数，过滤时改成命中数
  sections.forEach(function (sec) {
    var badge = sec.querySelector('.rc-cat-n');
    if (badge) badge.__total = badge.textContent;
  });

  // 建索引：菜名 + 配料整块 + 摘要 + 别名（data-kw）
  var cards = Array.prototype.slice.call(app.querySelectorAll('details.rc-card')).map(function (card) {
    var parts = [];
    var title = card.querySelector('.rc-title');
    if (title) parts.push(title.textContent);
    var ing = card.querySelector('.rc-ing');
    if (ing) parts.push(ing.textContent);
    var summary = card.querySelector('.rc-summary');
    if (summary) parts.push(summary.textContent);
    // 别名：中文同义词（饺子↔水饺、包菜↔圆白菜）靠数据里的 keywords 补，别在代码里写死词表
    parts.push(card.getAttribute('data-kw') || '');
    card.__hay = parts.join(' ').toLowerCase().replace(/\s+/g, ' ');
    return card;
  });

  var tplHit = (searchBox && searchBox.getAttribute('data-tpl-hit')) || '{n}';
  var tplAll = (searchBox && searchBox.getAttribute('data-tpl-all')) || '{n}';

  function apply(raw) {
    var q = (raw || '').trim().toLowerCase();
    var terms = q ? q.split(/\s+/) : [];
    var hits = 0;

    cards.forEach(function (card) {
      var ok = true;
      for (var i = 0; i < terms.length; i++) {
        if (card.__hay.indexOf(terms[i]) === -1) { ok = false; break; }
      }
      card.hidden = !ok;
      if (ok) hits++;
      if (!ok) card.open = false; // 关掉被过滤掉的卡片，回来时不会突然展开
    });

    sections.forEach(function (sec) {
      var visible = sec.querySelectorAll('details.rc-card:not([hidden])').length;
      sec.hidden = visible === 0;
      var badge = sec.querySelector('.rc-cat-n');
      if (badge) badge.textContent = terms.length ? visible : badge.__total;
    });

    // 过滤时收起说明段落，只留结果
    app.classList.toggle('rc-searching', terms.length > 0);

    if (counter) counter.textContent = terms.length ? tplHit.replace('{n}', hits) : tplAll;
    if (noResult) noResult.hidden = !(terms.length && hits === 0);
    if (clearBtn) clearBtn.hidden = !q;
  }

  var composing = false;
  var timer = 0;

  input.addEventListener('compositionstart', function () { composing = true; });
  input.addEventListener('compositionend', function () {
    composing = false;
    apply(input.value);
  });
  input.addEventListener('input', function () {
    if (composing) return;
    clearTimeout(timer);
    timer = setTimeout(function () { apply(input.value); }, 90);
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      input.value = '';
      apply('');
      input.blur();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      input.value = '';
      apply('');
      input.focus();
    });
  }

  // 「/」快速聚焦（阅读类页面的通行习惯），输入框内不拦截
  document.addEventListener('keydown', function (e) {
    if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
    var el = document.activeElement;
    if (!el) return;
    if (el === input) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return;
    e.preventDefault();
    input.focus();
    input.select();
  });

  apply('');
})();
