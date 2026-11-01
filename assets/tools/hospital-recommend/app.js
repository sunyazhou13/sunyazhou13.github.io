// 北京医院推荐 —— 复制全名 + 导航（高德 / 百度公开 URI，无 AK）
// 依赖：每张卡片内的 <script type="application/json" class="hr-navdata"> 提供 name / full / campuses。
(function () {
  'use strict';

  const L = (document.documentElement.lang || 'zh').toLowerCase().indexOf('en') === 0 ? 'en' : 'zh';
  const I18N = {
    zh: {
      copied: '已复制 ✓', navigate: '导航', selectCampus: '请选择院区',
      amap: '高德地图', baidu: '百度地图', close: '关闭'
    },
    en: {
      copied: 'Copied ✓', navigate: 'Navigate', selectCampus: 'Select campus',
      amap: 'Amap', baidu: 'Baidu', close: 'Close'
    }
  };
  const T = I18N[L];

  // ---------- 复制 ----------
  function fallbackCopy(text) {
    return new Promise(function (resolve) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        resolve(ok);
      } catch (e) { resolve(false); }
    });
  }
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return fallbackCopy(text);
  }

  // ---------- 地图公开 URI（无 AK） ----------
  function mapUrl(map, query) {
    const q = encodeURIComponent(query);
    if (map === 'amap') {
      // 高德 URI API：按关键词搜索，唤起 App / Web，进地图后点导航即可
      return 'https://uri.amap.com/search?keyword=' + q + '&src=hospital-recommend&coordinate=gaode&callnative=1';
    }
    // 百度地图 Web 搜索：querytype=s&wd=关键词&c=131（北京城市编码）
    // 实测：老写法 api.map.baidu.com/place/search?...&output=html 会 302 到 map.baidu.com 首页、搜索不执行（不好使）；
    //      map.baidu.com/search?querytype=s&wd=..&c=131 能真正执行搜索并回填搜索框。
    return 'https://map.baidu.com/search?querytype=s&wd=' + q + '&c=131';
  }

  // ---------- 导航模态框（单例） ----------
  let modal = null;
  function ensureModal() {
    if (modal) return modal;
    const root = document.getElementById('hr-app') || document.body;
    modal = document.createElement('div');
    modal.className = 'hr-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="hr-modal-mask" data-close="1"></div>' +
      '<div class="hr-modal-panel" role="dialog" aria-modal="true">' +
        '<button type="button" class="hr-modal-close" data-close="1" aria-label="' + T.close + '">&times;</button>' +
        '<h3 class="hr-modal-title"></h3>' +
        '<div class="hr-modal-campus" hidden></div>' +
        '<div class="hr-modal-maps">' +
          '<button type="button" class="hr-btn hr-map" data-map="amap">' + T.amap + '</button>' +
          '<button type="button" class="hr-btn hr-map" data-map="baidu">' + T.baidu + '</button>' +
        '</div>' +
      '</div>';
    root.appendChild(modal);

    modal.addEventListener('click', function (e) {
      if (e.target.getAttribute('data-close') === '1') closeModal();
    });
    modal.querySelectorAll('.hr-map').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const query = modal._query;
        if (query) window.open(mapUrl(btn.getAttribute('data-map'), query), '_blank', 'noopener');
        closeModal();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) closeModal();
    });
    return modal;
  }
  function closeModal() { if (modal) modal.hidden = true; }

  function openNav(data) {
    const m = ensureModal();
    m.querySelector('.hr-modal-title').textContent = data.full || data.name || '';

    const campusBox = m.querySelector('.hr-modal-campus');
    const campuses = Array.isArray(data.campuses) ? data.campuses : [];
    let selectedQuery = data.full || data.name || '';

    if (campuses.length > 1) {
      campusBox.hidden = false;
      campusBox.innerHTML = '';
      const label = document.createElement('div');
      label.className = 'hr-modal-campus-label';
      label.textContent = T.selectCampus;
      campusBox.appendChild(label);
      const row = document.createElement('div');
      row.className = 'hr-modal-campus-row';
      campuses.forEach(function (c, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'hr-btn hr-campus' + (i === 0 ? ' is-active' : '');
        b.textContent = c.label;
        b.addEventListener('click', function () {
          row.querySelectorAll('.hr-campus').forEach(function (x) { x.classList.remove('is-active'); });
          b.classList.add('is-active');
          m._query = c.query;
        });
        row.appendChild(b);
        if (i === 0) selectedQuery = c.query;
      });
      campusBox.appendChild(row);
    } else {
      if (campuses.length === 1) selectedQuery = campuses[0].query;
      campusBox.hidden = true;
      campusBox.innerHTML = '';
    }

    m._query = selectedQuery;
    m.hidden = false;
  }

  // ---------- 绑定 ----------
  function init() {
    document.querySelectorAll('.hr-card').forEach(function (card) {
      const name = card.dataset.name || '';
      const full = card.dataset.full || name;
      const campusEls = card.querySelectorAll('.hr-campus-data');
      const campuses = [];
      campusEls.forEach(function (el) {
        campuses.push({ label: el.dataset.label || '', query: el.dataset.query || '' });
      });
      const data = { name: name, full: full, campuses: campuses };
      if (!data.name && !data.full) return;

      const copyBtn = card.querySelector('.hr-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', function (e) {
          e.preventDefault();
          const text = data.full || data.name || '';
          copyText(text).then(function () {
            const old = copyBtn.textContent;
            copyBtn.textContent = T.copied;
            copyBtn.classList.add('is-done');
            setTimeout(function () {
              copyBtn.textContent = old;
              copyBtn.classList.remove('is-done');
            }, 1500);
          });
        });
      }

      const navBtn = card.querySelector('.hr-nav');
      if (navBtn) {
        navBtn.addEventListener('click', function (e) {
          e.preventDefault();
          openNav(data);
        });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
