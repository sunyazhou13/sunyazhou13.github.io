// 北京医院推荐 —— 症状索引交互
// 搜索症状 → 给出建议科室 + 推荐医院 → 点医院名滚动到下方卡片并高亮。
// 依赖：#hs-app 内 .hs-symptom-data 节点（模板已渲染数据）与下方 .hr-card 卡片。
// 设计约束：不做自由文本解析/AI 猜病，只做「症状名 + aliases」的确定性关键词匹配，
//          结果可复现、不会误诊。urgency 仅用于提示紧急程度，不构成诊断。
(function () {
  'use strict';

  const L = (document.documentElement.lang || 'zh').toLowerCase().indexOf('en') === 0 ? 'en' : 'zh';
  const I18N = {
    zh: {
      dept: '建议挂', hosp: '推荐医院',
      emergency: '立即前往急诊', soon: '建议尽快就诊', normal: '常规门诊即可',
      noMatch: '没有匹配的症状。换个更简单的词试试，或直接去医院。',
      more: '全部症状', less: '收起',
      notFound: '未找到该医院卡片',
      useEn: '症状',
      groups: {
        骨科: '骨科', 综合医院: '综合医院', 心脑血管: '心脑血管', 整形美容: '整形美容',
        口腔: '口腔', 眼科耳鼻喉: '眼科耳鼻喉', 妇产: '妇产', 神经内外科: '神经内外科',
        肿瘤: '肿瘤', 儿科: '儿科', 精神心理: '精神心理', 结核与胸外: '结核与胸外',
        传染病与肝病: '传染病与肝病', 中医: '中医', 消化与胃肠: '消化与胃肠',
        老年医学: '老年医学'
      }
    },
    en: {
      dept: 'See', hosp: 'Recommended hospitals',
      emergency: 'Emergency — go now', soon: 'See a doctor soon', normal: 'Routine visit',
      noMatch: 'No matching symptom. Try a simpler word, or go straight to a hospital.',
      more: 'All symptoms', less: 'Show less',
      notFound: 'Hospital card not found',
      useEn: 'Symptom',
      groups: {
        骨科: 'Orthopedics', 综合医院: 'General', 心脑血管: 'Cardiovascular', 整形美容: 'Plastic Surgery',
        口腔: 'Stomatology', 眼科耳鼻喉: 'Eye & ENT', 妇产: 'OB-GYN', 神经内外科: 'Neurology',
        肿瘤: 'Oncology', 儿科: 'Pediatrics', 精神心理: 'Mental Health', 结核与胸外: 'TB & Chest',
        传染病与肝病: 'Infectious & Liver', 中医: 'TCM', 消化与胃肠: 'Digestive',
        老年医学: 'Geriatrics'
      }
    }
  };
  const T = I18N[L];

  let SYMPTOMS = [];

  // 动画减配：系统开启 prefers-reduced-motion 时，平滑滚动降级为瞬时跳转
  const reduceMotion = (function () {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  })();
  const scrollBehavior = reduceMotion ? 'auto' : 'smooth';

  function parseData() {
    const nodes = document.querySelectorAll('.hs-symptom-data');
    SYMPTOMS = Array.prototype.map.call(nodes, function (el) {
      const split = function (v) { return (v || '').split('|').filter(Boolean); };
      return {
        id: el.dataset.id,
        zh: el.dataset.zh,
        en: el.dataset.en,
        aliases: split(el.dataset.aliases),
        dept: split(el.dataset.dept),
        hint: el.dataset.hint || '',
        urgency: el.dataset.urgency || 'normal',
        hospitals: split(el.dataset.hospitals)
      };
    });
  }

  // 匹配：症状名 + aliases 全部参与。
  // 急症条目的防劫持（同时不能误伤，否则搜「胸痛」搜不到 = 危险）：
  //   问题：「头痛」命中「突发雷击样头痛」，把普通头疼导向急诊 —— 要防。
  //   判据：急症词条比输入词长出 ≥2 字时视为「带了修饰词前缀」，跳过该词条。
  //     「头痛」 vs 「突发雷击样头痛」 差 5 → 跳过 ✔ 防劫持
  //     「胸痛」 vs 「胸痛」         差 0 → 命中 ✔ 不误伤
  //     「看不清」 vs 「视力突然下降」 不含 → 由 aliases「看不清」精确命中 ✔
  //     「口角歪斜」 vs 「口角歪斜、单侧无力」差 3 → 跳过，但 aliases 有「口角歪斜」可精确命中 ✔
  // 非急症条目不做此限制。urgency 不直接参与排序：紧急度只在选中后展示。
  function match(keyword) {
    const kw = (keyword || '').trim().toLowerCase();
    if (!kw) return [];
    const HIJACK_GAP = 2;
    const hits = [];
    SYMPTOMS.forEach(function (s) {
      const pool = [s.zh, s.en].concat(s.aliases).filter(Boolean);
      let best = 0;
      pool.forEach(function (term) {
        const t = term.toLowerCase();
        if (t.indexOf(kw) === -1) return;
        // 急症：词条比输入长 ≥2 字 → 疑似修饰词前缀，视为劫持跳过；
        // 但词条完全等于输入（精确匹配）时永远放行。
        if (s.urgency === 'emergency' && (t.length - kw.length) >= HIJACK_GAP && t !== kw) return;
        if (kw.length > best) best = kw.length;
      });
      if (best > 0) hits.push({ s: s, score: best, idx: hits.length });
    });
    // 稳定排序：分数优先；同分按 yml 原始顺序（JS sort 不保证稳定，显式用 idx 兜底）
    hits.sort(function (a, b) { return b.score - a.score || a.idx - b.idx; });
    return hits.map(function (h) { return h.s; });
  }

  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function deptLabel(zh) {
    if (L === 'en') return T.groups[zh] || zh;
    return zh;
  }

  function render(sym) {
    const nameEl = document.getElementById('hs-rname');
    const urgEl = document.getElementById('hs-rurgency');
    const hintEl = document.getElementById('hs-rhint');
    const deptEl = document.getElementById('hs-rdept');
    const hospEl = document.getElementById('hs-rhosp');
    const result = document.getElementById('hs-result');
    if (!result || !sym) return;

    nameEl.textContent = (L === 'en' ? sym.en : sym.zh) || sym.zh;

    urgEl.className = 'hs-urgency is-' + sym.urgency;
    urgEl.textContent = T[sym.urgency] || T.normal;

    hintEl.textContent = sym.hint;

    deptEl.innerHTML = sym.dept.map(function (d) {
      const label = deptLabel(d);
      const target = findSection(d);
      if (target) {
        return '<a class="hs-dept-link" href="#' + target + '" data-dept="' + esc(d) + '">' + esc(label) + '</a>';
      }
      return '<span class="hs-dept-tag">' + esc(label) + '</span>';
    }).join(' <span class="hs-sep">/</span> ');

    hospEl.innerHTML = sym.hospitals.map(function (name) {
      return '<button type="button" class="hs-hosp" data-nopopup data-hosp="' + esc(name) + '">' + esc(name) + '</button>';
    }).join('');

    result.hidden = false;

    // 同步 chips 选中态（aria-pressed），键盘/读屏用户可感知当前选中哪一条
    document.querySelectorAll('.hs-chip[data-sym]').forEach(function (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('data-sym') === sym.id ? 'true' : 'false');
    });
  }

  function clearResult() {
    const result = document.getElementById('hs-result');
    if (result) result.hidden = true;
  }

  // 点科室 → 滚动到下方对应分组标题
  function findSection(catZh) {
    const sections = document.querySelectorAll('#hr-app .hr-section, .hr-section');
    for (let i = 0; i < sections.length; i++) {
      const titleEl = sections[i].querySelector('.hr-cat-title');
      if (titleEl && titleEl.textContent.trim() === catZh) {
        if (!sections[i].id) sections[i].id = 'sec-' + i;
        return sections[i].id;
      }
    }
    return null;
  }

  // 点医院名 → 滚动到下方卡片并高亮
  function gotoCard(name) {
    const cards = document.querySelectorAll('.hr-card');
    for (let i = 0; i < cards.length; i++) {
      if ((cards[i].dataset.name || '').trim() === name) {
        cards[i].scrollIntoView({ behavior: scrollBehavior, block: 'center' });
        if (reduceMotion) {
          // 减配模式下不做高亮闪烁（避免不适），仅短暂描边提示
          cards[i].classList.add('is-flash');
          setTimeout(function () { cards[i].classList.remove('is-flash'); }, 600);
        } else {
          cards[i].classList.add('is-flash');
          setTimeout(function () { cards[i].classList.remove('is-flash'); }, 1800);
        }
        return;
      }
    }
    // 找不到卡片时静默忽略（数据已校验，这里只是兜底）
  }

  // 展开「全部症状」时补齐未预渲染的 chips（首屏只渲染 30 个）
  function fillAllChips(allEl) {
    const existing = allEl.querySelectorAll('.hs-chip[data-sym]').length;
    if (existing >= SYMPTOMS.length) return;
    const frag = document.createDocumentFragment();
    SYMPTOMS.forEach(function (s) {
      if (allEl.querySelector('.hs-chip[data-sym="' + s.id + '"]')) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'hs-chip hs-chip-sm';
      b.setAttribute('data-nopopup', '');
      b.setAttribute('data-sym', s.id);
      b.setAttribute('aria-pressed', 'false');
      b.textContent = L === 'en' ? (s.en || s.zh) : s.zh;
      frag.appendChild(b);
    });
    allEl.appendChild(frag);
  }

  function bind() {
    const input = document.getElementById('hs-input');
    const clear = document.getElementById('hs-clear');
    const more = document.getElementById('hs-more');
    const all = document.getElementById('hs-all');

    // chip 点击：用事件委托（不用一次性绑定），因为展开「全部症状」时 JS 会动态新增 chips
    document.addEventListener('click', function (e) {
      const chip = e.target.closest('.hs-chip[data-sym]');
      if (!chip) return;
      const id = chip.getAttribute('data-sym');
      const sym = SYMPTOMS.find(function (s) { return s.id === id; });
      if (sym) {
        const inputEl = document.getElementById('hs-input');
        const clearEl = document.getElementById('hs-clear');
        if (inputEl) inputEl.value = (L === 'en' ? sym.en : sym.zh);
        render(sym);
        if (clearEl) clearEl.hidden = false;
      }
    });

    // 展开/收起全部症状。首屏只渲染了前 30 个，展开时从数据节点补全其余。
    if (more && all) {
      more.addEventListener('click', function () {
        if (all.hidden) fillAllChips(all);
        all.hidden = !all.hidden;
        more.setAttribute('aria-expanded', all.hidden ? 'false' : 'true');
        more.textContent = all.hidden
          ? T.more + '（' + SYMPTOMS.length + '）'
          : (L === 'en' ? 'Show less' : '收起');
      });
    }

    // 输入搜索
    if (input) {
      input.addEventListener('input', function () {
        const kw = input.value.trim();
        if (clear) clear.hidden = !kw;
        if (!kw) { clearResult(); return; }
        const hits = match(kw);
        if (hits.length) {
          render(hits[0]);
        } else {
          clearResult();
          showNoMatch(kw);
        }
      });
      // 回车：直接选中第一个匹配
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          const hits = match(input.value.trim());
          if (hits.length) { render(hits[0]); e.preventDefault(); }
        }
      });
    }

    // 清除
    if (clear && input) {
      clear.addEventListener('click', function () {
        input.value = '';
        clear.hidden = true;
        clearResult();
        input.focus();
      });
    }

    // 事件委托：结果区里的科室链接 / 医院按钮
    const result = document.getElementById('hs-result');
    if (result) {
      result.addEventListener('click', function (e) {
        const deptLink = e.target.closest('.hs-dept-link');
        if (deptLink) {
          e.preventDefault();
          const id = deptLink.getAttribute('href').slice(1);
          const sec = document.getElementById(id);
          if (sec) sec.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
          return;
        }
        const hospBtn = e.target.closest('.hs-hosp');
        if (hospBtn) {
          gotoCard(hospBtn.getAttribute('data-hosp'));
        }
      });
    }
  }

  function showNoMatch() {
    const hintEl = document.getElementById('hs-rhint');
    const result = document.getElementById('hs-result');
    if (!result || !hintEl) return;
    // 无匹配时复用结果区显示提示（保持布局稳定）
    const nameEl = document.getElementById('hs-rname');
    const urgEl = document.getElementById('hs-rurgency');
    nameEl.textContent = T.noMatch;
    urgEl.className = 'hs-urgency';
    urgEl.textContent = '';
    hintEl.textContent = '';
    document.getElementById('hs-rdept').innerHTML = '';
    document.getElementById('hs-rhosp').innerHTML = '';
    result.hidden = false;
  }

  function init() {
    const app = document.getElementById('hs-app');
    if (!app) return;
    parseData();
    if (!SYMPTOMS.length) return;
    bind();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
