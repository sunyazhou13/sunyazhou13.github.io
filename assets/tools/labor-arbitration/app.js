/* ========== 劳动仲裁助手 ========== */

(function() {
  'use strict';

  var excludeItems = [];
  var bonusItems = [];
  var salaryMode = 'quick';
  var monthData = [];

  // 城市最低工资数据（2026年8月最新）
  var cityData = {
    beijing:     { name: '北京',     min: 2540, max: 35000, note: '不含个人社保/公积金', geo: [116.4, 39.9] },
    shanghai:    { name: '上海',     min: 2740, max: 40000, note: '不含个人社保/公积金', geo: [121.5, 31.2] },
    shenzhen:    { name: '深圳',     min: 2700, max: 38000, note: '', geo: [114.1, 22.5] },
    guangzhou:   { name: '广州',     min: 2680, max: 35000, note: '', geo: [113.3, 23.1] },
    hangzhou:    { name: '杭州',     min: 2660, max: 33000, note: '', geo: [120.2, 30.3] },
    nanjing:     { name: '南京',     min: 2660, max: 30000, note: '', geo: [118.8, 32.1] },
    suzhou:      { name: '苏州',     min: 2660, max: 32000, note: '', geo: [120.6, 31.3] },
    tianjin:     { name: '天津',     min: 2510, max: 28000, note: '', geo: [117.2, 39.1] },
    chengdu:     { name: '成都',     min: 2100, max: 25000, note: '', geo: [104.1, 30.7] },
    chongqing:   { name: '重庆',     min: 2330, max: 24000, note: '', geo: [106.5, 29.6] },
    wuhan:       { name: '武汉',     min: 2400, max: 22000, note: '', geo: [114.3, 30.6] },
    xian:        { name: '西安',     min: 2376, max: 20000, note: '', geo: [108.9, 34.3] },
    qingdao:     { name: '青岛',     min: 2400, max: 22000, note: '', geo: [120.4, 36.1] },
    jinan:       { name: '济南',     min: 2400, max: 20000, note: '', geo: [117.0, 36.7] },
    zhengzhou:   { name: '郑州',     min: 2350, max: 18000, note: '', geo: [113.6, 34.8] },
    hefei:       { name: '合肥',     min: 2320, max: 18000, note: '', geo: [117.3, 31.9] },
    foshan:      { name: '佛山',     min: 2300, max: 18000, note: '', geo: [113.1, 23.0] },
    dongguan:    { name: '东莞',     min: 2300, max: 18000, note: '', geo: [113.8, 23.0] },
    dalian:      { name: '大连',     min: 2230, max: 17000, note: '', geo: [121.6, 38.9] },
    shenyang:    { name: '沈阳',     min: 2230, max: 16000, note: '', geo: [123.4, 41.8] },
    changchun:   { name: '长春',     min: 2230, max: 15000, note: '', geo: [125.3, 43.9] },
    nanchang:    { name: '南昌',     min: 2240, max: 15000, note: '', geo: [115.9, 28.7] },
    haikou:      { name: '海口',     min: 2250, max: 16000, note: '', geo: [110.3, 20.0] },
    xiamen:      { name: '厦门',     min: 2265, max: 20000, note: '', geo: [118.1, 24.5] },
    fuzhou:      { name: '福州',     min: 2265, max: 18000, note: '', geo: [119.3, 26.1] },
    harbin:      { name: '哈尔滨',   min: 2270, max: 14000, note: '', geo: [126.6, 45.8] },
    wulumuqi:    { name: '乌鲁木齐', min: 2270, max: 16000, note: '', geo: [87.6, 43.8] },
    huhehaote:   { name: '呼和浩特', min: 2380, max: 17000, note: '', geo: [111.7, 40.8] },
    shijiazhuang:{ name: '石家庄',   min: 2380, max: 16000, note: '', geo: [114.5, 38.0] },
    changsha:    { name: '长沙',     min: 2200, max: 18000, note: '', geo: [113.0, 28.2] },
    lanzhou:     { name: '兰州',     min: 2200, max: 14000, note: '', geo: [103.8, 36.1] },
    nanning:     { name: '南宁',     min: 2200, max: 15000, note: '', geo: [108.3, 22.8] },
    kunming:     { name: '昆明',     min: 2070, max: 15000, note: '', geo: [102.7, 25.0] },
    gui:         { name: '贵阳',     min: 2130, max: 14000, note: '', geo: [106.7, 26.6] },
    yinchuan:    { name: '银川',     min: 2050, max: 13000, note: '', geo: [106.3, 38.5] },
    xining:      { name: '西宁',     min: 2050, max: 12000, note: '', geo: [101.8, 36.6] },
    lhasa:       { name: '拉萨',     min: 2100, max: 15000, note: '', geo: [91.1, 29.7] },
    taiyuan:     { name: '太原',     min: 2180, max: 16000, note: '', geo: [112.5, 37.9] },
    yantai:      { name: '烟台',     min: 2200, max: 16000, note: '', geo: [121.4, 37.5] },
    weifang:     { name: '潍坊',     min: 2200, max: 14000, note: '', geo: [119.2, 36.7] },
    xuzhou:      { name: '徐州',     min: 2280, max: 15000, note: '', geo: [117.2, 34.3] },
    wuxi:        { name: '无锡',     min: 2490, max: 25000, note: '', geo: [120.3, 31.6] },
    ningbo:      { name: '宁波',     min: 2490, max: 26000, note: '', geo: [121.6, 29.8] },
    huzhou:      { name: '湖州',     min: 2490, max: 18000, note: '', geo: [120.1, 30.9] },
    shaoxing:    { name: '绍兴',     min: 2490, max: 20000, note: '', geo: [120.6, 30.0] },
    wenzhou:     { name: '温州',     min: 2490, max: 20000, note: '', geo: [120.7, 28.0] },
    jinhua:      { name: '金华',     min: 2490, max: 18000, note: '', geo: [119.7, 29.1] },
    taizhou_zj:  { name: '台州',     min: 2490, max: 18000, note: '', geo: [121.4, 28.7] },
    quzhou:      { name: '衢州',     min: 2490, max: 15000, note: '', geo: [118.9, 28.9] },
    jiaxing:     { name: '嘉兴',     min: 2490, max: 20000, note: '', geo: [120.8, 30.7] }
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initTabs();
    initSalaryModeToggle();
    initQuickGrid();
    initDetailTable();
    initBonusList();
    initExcludeList();
    bindCalcAvg();
    bindCalcCompensation();
    bindTemplateGenerator();
    bindFillSample();
    bindConfigControls();
    initCityMap();
  }

  // ===== 标签页切换 =====
  function initTabs() {
    var tabs = document.querySelectorAll('.la-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = this.dataset.tab;
        tabs.forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.la-panel').forEach(function(p) {
          p.classList.remove('active');
        });
        var panel = document.getElementById('panel-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ===== 工资模式切换 =====
  function initSalaryModeToggle() {
    var btns = document.querySelectorAll('.la-mode-btn');
    btns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        salaryMode = this.dataset.mode;
        btns.forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        document.querySelectorAll('.la-mode-panel').forEach(function(p) {
          p.classList.remove('active');
        });
        var panel = document.getElementById('mode-' + salaryMode);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ===== 快速模式：12个月输入 =====
  function initQuickGrid() {
    var grid = document.getElementById('salary-grid');
    if (!grid) return;
    var months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var html = '';
    months.forEach(function(m, i) {
      html += '<div class="la-salary-item">' +
        '<label>' + m + '</label>' +
        '<input type="number" class="salary-input" data-month="' + i + '" placeholder="0.00" min="0" step="0.01">' +
      '</div>';
    });
    grid.innerHTML = html;
  }

  // ===== 明细模式：表格 =====
  function initDetailTable() {
    var tbody = document.getElementById('detail-tbody');
    if (!tbody) return;
    var months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var html = '';
    months.forEach(function(m, i) {
      html += '<tr data-month="' + i + '">' +
        '<td class="la-month-cell">' + m + '</td>' +
        '<td><input type="number" class="detail-base" data-field="base" placeholder="0" min="0" step="0.01"></td>' +
        '<td><input type="number" class="detail-allowance" data-field="allowance" placeholder="0" min="0" step="0.01"></td>' +
        '<td><input type="number" class="detail-bonus" data-field="bonus" placeholder="0" min="0" step="0.01"></td>' +
        '<td><input type="number" class="detail-overtime" data-field="overtime" placeholder="0" min="0" step="0.01"></td>' +
        '<td><input type="number" class="detail-social" data-field="social" placeholder="0" min="0" step="0.01"></td>' +
        '<td><input type="number" class="detail-fund" data-field="fund" placeholder="0" min="0" step="0.01"></td>' +
        '<td><input type="number" class="detail-tax" data-field="tax" placeholder="0" min="0" step="0.01"></td>' +
        '<td class="la-month-total" id="detail-total-' + i + '">--</td>' +
      '</tr>';
    });
    tbody.innerHTML = html;

    // 绑定明细输入变化，自动计算每月合计
    tbody.querySelectorAll('input[type="number"]').forEach(function(inp) {
      inp.addEventListener('input', updateDetailTotals);
    });
  }

  function updateDetailTotals() {
    var tbody = document.getElementById('detail-tbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(function(row) {
      var base = parseFloat(row.querySelector('.detail-base').value) || 0;
      var allowance = parseFloat(row.querySelector('.detail-allowance').value) || 0;
      var bonus = parseFloat(row.querySelector('.detail-bonus').value) || 0;
      var overtime = parseFloat(row.querySelector('.detail-overtime').value) || 0;
      var total = base + allowance + bonus + overtime;
      var totalCell = row.querySelector('.la-month-total');
      if (totalCell) {
        totalCell.textContent = total > 0 ? '¥ ' + formatMoney(total) : '--';
      }
    });
  }

  // ===== 年终奖控制 =====
  // ===== 年终奖列表 =====
  function initBonusList() {
    var btn = document.getElementById('btn-add-bonus');
    if (!btn) return;
    btn.addEventListener('click', addBonusItem);

    // 回车添加
    var amountInput = document.getElementById('bonus-amount');
    if (amountInput) {
      amountInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); addBonusItem(); }
      });
    }

    // 方法切换联动月份输入框
    var methodSelect = document.getElementById('bonus-method-single');
    var monthInput = document.getElementById('bonus-month-single');
    if (methodSelect && monthInput) {
      methodSelect.addEventListener('change', function() {
        monthInput.style.display = this.value === 'month' ? 'inline-block' : 'none';
      });
    }

    renderBonusList();
  }

  function addBonusItem() {
    var amountInput = document.getElementById('bonus-amount');
    var methodSelect = document.getElementById('bonus-method-single');
    var monthInput = document.getElementById('bonus-month-single');
    var amount = amountInput ? parseFloat(amountInput.value) : 0;
    var method = methodSelect ? methodSelect.value : 'spread';
    var month = monthInput ? parseInt(monthInput.value) || 1 : 1;

    if (isNaN(amount) || amount <= 0) {
      alert('请输入有效的年终奖金额');
      return;
    }

    bonusItems.push({ amount: amount, method: method, month: month });
    renderBonusList();

    if (amountInput) amountInput.value = '';
    if (methodSelect) methodSelect.value = 'spread';
    if (monthInput) { monthInput.value = ''; monthInput.style.display = 'none'; }
    if (amountInput) amountInput.focus();
  }

  function removeBonusItem(index) {
    bonusItems.splice(index, 1);
    renderBonusList();
  }

  function renderBonusList() {
    var container = document.getElementById('bonus-list');
    if (!container) return;

    if (bonusItems.length === 0) {
      container.innerHTML = '<div class="la-bonus-empty">暂未添加年终奖项目</div>';
      return;
    }

    var total = 0;
    var html = '<div class="la-bonus-items">';
    bonusItems.forEach(function(item, i) {
      total += item.amount;
      var methodText = item.method === 'spread' ? '平摊12月' : '计入第' + item.month + '月';
      html += '<div class="la-bonus-item">' +
        '<span class="la-bonus-method">' + methodText + '</span>' +
        '<span class="la-bonus-amount">¥ ' + formatMoney(item.amount) + '</span>' +
        '<button class="la-bonus-remove" onclick="(function(){ var idx=' + i + '; var fn=window._removeBonusItem; if(fn) fn(idx); })();" title="删除">&times;</button>' +
        '</div>';
    });
    html += '</div>';
    html += '<div class="la-bonus-total">年终奖合计：¥ ' + formatMoney(total) + '</div>';
    container.innerHTML = html;
  }

  // 暴露给 HTML onclick 使用
  window._removeBonusItem = removeBonusItem;

  // ===== 不计入项目 =====
  function initExcludeList() {
    var btn = document.getElementById('btn-add-exclude');
    if (!btn) return;
    btn.addEventListener('click', addExcludeItem);

    // 回车添加
    var nameInput = document.getElementById('exclude-name');
    var amountInput = document.getElementById('exclude-amount');
    if (nameInput) {
      nameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); addExcludeItem(); }
      });
    }
    if (amountInput) {
      amountInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); addExcludeItem(); }
      });
    }
  }

  function addExcludeItem() {
    var nameInput = document.getElementById('exclude-name');
    var amountInput = document.getElementById('exclude-amount');
    var name = nameInput ? nameInput.value.trim() : '';
    var amount = amountInput ? parseFloat(amountInput.value) : 0;

    if (!name || isNaN(amount) || amount < 0) {
      alert('请输入项目名称和金额');
      return;
    }

    excludeItems.push({ name: name, amount: amount });
    renderExcludeList();

    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '';
    if (nameInput) nameInput.focus();
  }

  function removeExcludeItem(index) {
    excludeItems.splice(index, 1);
    renderExcludeList();
  }

  function renderExcludeList() {
    var list = document.getElementById('exclude-list');
    if (!list) return;
    if (excludeItems.length === 0) {
      list.innerHTML = '<p class="la-exclude-empty">暂无项目</p>';
      return;
    }
    var total = 0;
    var html = '<div class="la-exclude-items">';
    excludeItems.forEach(function(item, i) {
      total += item.amount;
      html += '<div class="la-exclude-item">' +
        '<span class="la-exclude-name">' + escapeHtml(item.name) + '</span>' +
        '<span class="la-exclude-amount">¥ ' + formatMoney(item.amount) + '</span>' +
        '<button class="la-exclude-remove" data-index="' + i + '" title="删除">×</button>' +
      '</div>';
    });
    html += '<div class="la-exclude-total">合计：¥ ' + formatMoney(total) + '</div>';
    html += '</div>';
    list.innerHTML = html;

    list.querySelectorAll('.la-exclude-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        removeExcludeItem(parseInt(this.dataset.index));
      });
    });
  }

  // ===== 填入示例数据 =====
  function bindFillSample() {
    var btn = document.getElementById('btn-fill-sample');
    if (!btn) return;
    btn.addEventListener('click', function() {
      var city = getSelectedCity();
      var minSalary = city ? city.min : 2200;
      var maxSalary = city ? city.max : 20000;

      // 快速模式：根据城市工资标准在[最低工资, 平均工资上限]间随机生成
      var inputs = document.querySelectorAll('.salary-input');
      inputs.forEach(function(inp) {
        inp.value = randomSalary(minSalary, maxSalary);
      });

      // 年终奖：随机生成一笔，平摊到12个月
      var bonusAmount = Math.floor(minSalary * 2 + Math.random() * minSalary * 4);
      bonusItems = [{ amount: bonusAmount, method: 'spread', month: 1 }];
      renderBonusList();

      // 不计入项目：随机生成一项
      var excludeAmount = Math.floor(200 + Math.random() * 800);
      excludeItems = [{ name: '节日福利', amount: excludeAmount }];
      renderExcludeList();

      // 基本工资示例（取最低工资的约1.5~2倍，用户需按实际合同修改）
      var baseInput = document.getElementById('base-salary');
      if (baseInput) baseInput.value = Math.floor(minSalary * (1.5 + Math.random()));

      // 明细模式示例（按城市标准随机）
      var detailRows = document.querySelectorAll('#detail-tbody tr');
      detailRows.forEach(function(row) {
        var base = row.querySelector('.detail-base');
        var bonus = row.querySelector('.detail-bonus');
        var social = row.querySelector('.detail-social');
        var fund = row.querySelector('.detail-fund');
        var tax = row.querySelector('.detail-tax');
        var rowBase = randomSalary(minSalary, maxSalary);
        if (base) base.value = rowBase;
        if (bonus) bonus.value = Math.floor(rowBase * 0.1 * Math.random());
        if (social) social.value = Math.floor(rowBase * 0.1);
        if (fund) fund.value = Math.floor(rowBase * 0.12);
        if (tax) tax.value = Math.floor(rowBase * 0.05);
      });
      updateDetailTotals();
    });
  }

  function getSelectedCity() {
    var select = document.getElementById('city-select');
    if (!select) return null;
    var key = select.value;
    return key && cityData[key] ? cityData[key] : null;
  }

  function randomSalary(min, max) {
    // 在[min, max]间生成一个合理的工资，带有少量随机波动
    var base = min + (max - min) * (0.3 + Math.random() * 0.5); // 集中在30%~80%区间
    return Math.floor(base / 10) * 10; // 取整到10元
  }

  // ===== 配置保存与导入 =====
  function bindConfigControls() {
    var saveBtn = document.getElementById('btn-save-config');
    var loadBtn = document.getElementById('btn-load-config');
    var fileInput = document.getElementById('config-file-input');

    if (saveBtn) saveBtn.addEventListener('click', saveConfig);
    if (loadBtn && fileInput) {
      loadBtn.addEventListener('click', function() { fileInput.click(); });
      fileInput.addEventListener('change', loadConfig);
    }
  }

  function saveConfig() {
    var citySelect = document.getElementById('city-select');
    var config = {
      version: '1.1',
      city: citySelect ? citySelect.value : '',
      salaryMode: salaryMode,
      salaries: [],
      detailMode: {},
      bonusItems: bonusItems,
      excludeItems: excludeItems,
      baseSalary: val('base-salary'),
      workYears: val('work-years'),
      dismissType: document.getElementById('dismiss-type') ? document.getElementById('dismiss-type').value : 'illegal',
      unpaidLeaveDays: val('unpaid-leave-days'),
      overtimePay: val('overtime-pay'),
      yearEndPay: val('year-end-pay'),
      // 申请书模板数据
      tpl: {
        applicantName: val('tpl-applicant-name'),
        applicantGender: document.getElementById('tpl-applicant-gender') ? document.getElementById('tpl-applicant-gender').value : '',
        applicantEthnic: val('tpl-applicant-ethnic'),
        applicantBirth: val('tpl-applicant-birth'),
        applicantId: val('tpl-applicant-id'),
        applicantHuji: val('tpl-applicant-huji'),
        applicantAddress: val('tpl-applicant-address'),
        applicantPhone: val('tpl-applicant-phone'),
        applicantDelivery: val('tpl-applicant-delivery'),
        companyName: val('tpl-company-name'),
        companyAddress: val('tpl-company-address'),
        companyCode: val('tpl-company-code'),
        companyLegal: val('tpl-company-legal'),
        companyTitle: val('tpl-company-title'),
        companyPhone: val('tpl-company-phone'),
        startDate: val('tpl-start-date'),
        endDate: val('tpl-end-date'),
        position: val('tpl-position'),
        salary: val('tpl-salary'),
        contractTerm: val('tpl-contract-term'),
        dismissReason: val('tpl-dismiss-reason'),
        requests: val('tpl-requests'),
        facts: val('tpl-facts'),
        committee: val('tpl-committee')
      }
    };

    // 读取12个月工资
    var inputs = document.querySelectorAll('.salary-input');
    inputs.forEach(function(inp) {
      config.salaries.push(inp.value);
    });

    // 读取明细模式数据
    var rows = document.querySelectorAll('#detail-tbody tr');
    rows.forEach(function(row, i) {
      config.detailMode[i] = {
        base: row.querySelector('.detail-base') ? row.querySelector('.detail-base').value : '',
        allowance: row.querySelector('.detail-allowance') ? row.querySelector('.detail-allowance').value : '',
        bonus: row.querySelector('.detail-bonus') ? row.querySelector('.detail-bonus').value : '',
        overtime: row.querySelector('.detail-overtime') ? row.querySelector('.detail-overtime').value : '',
        social: row.querySelector('.detail-social') ? row.querySelector('.detail-social').value : '',
        fund: row.querySelector('.detail-fund') ? row.querySelector('.detail-fund').value : '',
        tax: row.querySelector('.detail-tax') ? row.querySelector('.detail-tax').value : ''
      };
    });

    var blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = '劳动仲裁配置_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function loadConfig(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(event) {
      try {
        var config = JSON.parse(event.target.result);

        // 恢复工资模式
        if (config.salaryMode) {
          salaryMode = config.salaryMode;
          var modeBtn = document.querySelector('.la-mode-btn[data-mode="' + salaryMode + '"]');
          if (modeBtn) modeBtn.click();
        }

        // 恢复12个月工资
        if (config.salaries && Array.isArray(config.salaries)) {
          var inputs = document.querySelectorAll('.salary-input');
          inputs.forEach(function(inp, i) {
            if (config.salaries[i] !== undefined) inp.value = config.salaries[i];
          });
        }

        // 恢复明细模式
        if (config.detailMode) {
          var rows = document.querySelectorAll('#detail-tbody tr');
          rows.forEach(function(row, i) {
            if (!config.detailMode[i]) return;
            var d = config.detailMode[i];
            var baseEl = row.querySelector('.detail-base');
            var allowanceEl = row.querySelector('.detail-allowance');
            var bonusEl = row.querySelector('.detail-bonus');
            var overtimeEl = row.querySelector('.detail-overtime');
            var socialEl = row.querySelector('.detail-social');
            var fundEl = row.querySelector('.detail-fund');
            var taxEl = row.querySelector('.detail-tax');
            if (baseEl) baseEl.value = d.base || '';
            if (allowanceEl) allowanceEl.value = d.allowance || '';
            if (bonusEl) bonusEl.value = d.bonus || '';
            if (overtimeEl) overtimeEl.value = d.overtime || '';
            if (socialEl) socialEl.value = d.social || '';
            if (fundEl) fundEl.value = d.fund || '';
            if (taxEl) taxEl.value = d.tax || '';
          });
          updateDetailTotals();
        }

        // 恢复年终奖
        if (config.bonusItems && Array.isArray(config.bonusItems)) {
          bonusItems = config.bonusItems;
          renderBonusList();
        } else if (config.yearEndBonus) {
          // 兼容旧版配置：单条年终奖
          bonusItems = [{
            amount: parseFloat(config.yearEndBonus) || 0,
            method: config.bonusMethod || 'spread',
            month: parseInt(config.bonusMonth) || 1
          }];
          renderBonusList();
        }

        // 恢复不计入项目
        if (config.excludeItems && Array.isArray(config.excludeItems)) {
          excludeItems = config.excludeItems;
          renderExcludeList();
        }

        // 恢复基本工资
        if (config.baseSalary) setVal('base-salary', config.baseSalary);

        // 恢复城市选择
        if (config.city) {
          var citySelect = document.getElementById('city-select');
          if (citySelect) citySelect.value = config.city;
        }

        // 恢复赔偿参数
        if (config.workYears) setVal('work-years', config.workYears);
        if (config.dismissType) {
          var typeSelect = document.getElementById('dismiss-type');
          if (typeSelect) typeSelect.value = config.dismissType;
        }
        if (config.unpaidLeaveDays) setVal('unpaid-leave-days', config.unpaidLeaveDays);
        if (config.overtimePay) setVal('overtime-pay', config.overtimePay);
        if (config.yearEndPay) setVal('year-end-pay', config.yearEndPay);

        // 恢复申请书模板
        if (config.tpl) {
          var t = config.tpl;
          setVal('tpl-applicant-name', t.applicantName);
          if (t.applicantGender) {
            var genderSelect = document.getElementById('tpl-applicant-gender');
            if (genderSelect) genderSelect.value = t.applicantGender;
          }
          setVal('tpl-applicant-ethnic', t.applicantEthnic);
          setVal('tpl-applicant-birth', t.applicantBirth);
          setVal('tpl-applicant-id', t.applicantId);
          setVal('tpl-applicant-huji', t.applicantHuji);
          setVal('tpl-applicant-address', t.applicantAddress);
          setVal('tpl-applicant-phone', t.applicantPhone);
          setVal('tpl-applicant-delivery', t.applicantDelivery);
          setVal('tpl-company-name', t.companyName);
          setVal('tpl-company-address', t.companyAddress);
          setVal('tpl-company-code', t.companyCode);
          setVal('tpl-company-legal', t.companyLegal);
          setVal('tpl-company-title', t.companyTitle);
          setVal('tpl-company-phone', t.companyPhone);
          setVal('tpl-start-date', t.startDate);
          setVal('tpl-end-date', t.endDate);
          setVal('tpl-position', t.position);
          setVal('tpl-salary', t.salary);
          setVal('tpl-contract-term', t.contractTerm);
          setVal('tpl-dismiss-reason', t.dismissReason);
          setVal('tpl-requests', t.requests);
          setVal('tpl-facts', t.facts);
          setVal('tpl-committee', t.committee);
        }

        // 自动触发计算
        calcAverage();
        calcCompensation();

        alert('配置导入成功！已自动完成计算。');
      } catch (err) {
        alert('配置文件格式错误，请检查JSON文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  }

  // ===== 计算平均工资 =====
  function bindCalcAvg() {
    var btn = document.getElementById('btn-calc-avg');
    if (!btn) return;
    btn.addEventListener('click', calcAverage);
  }

  function calcAverage() {
    // 自动添加未提交的排除项（防止用户填了内容但忘记点"添加"）
    var nameInput = document.getElementById('exclude-name');
    var amountInput = document.getElementById('exclude-amount');
    if (nameInput && amountInput) {
      var name = nameInput.value.trim();
      var amount = parseFloat(amountInput.value);
      if (name && !isNaN(amount) && amount > 0) {
        excludeItems.push({ name: name, amount: amount });
        renderExcludeList();
        nameInput.value = '';
        amountInput.value = '';
      }
    }

    // 自动添加未提交的年终奖项（防止用户填了内容但忘记点"添加"）
    var bonusAmountInput = document.getElementById('bonus-amount');
    var bonusMethodSelect = document.getElementById('bonus-method-single');
    var bonusMonthInput = document.getElementById('bonus-month-single');
    if (bonusAmountInput && bonusMethodSelect) {
      var bAmount = parseFloat(bonusAmountInput.value);
      if (!isNaN(bAmount) && bAmount > 0) {
        var bMethod = bonusMethodSelect.value || 'spread';
        var bMonth = bonusMonthInput ? (parseInt(bonusMonthInput.value) || 1) : 1;
        bonusItems.push({ amount: bAmount, method: bMethod, month: bMonth });
        renderBonusList();
        bonusAmountInput.value = '';
        bonusMethodSelect.value = 'spread';
        if (bonusMonthInput) { bonusMonthInput.value = ''; bonusMonthInput.style.display = 'none'; }
      }
    }

    var monthlySalaries = [];
    var totalIn = 0;
    var totalEx = 0;
    var count = 0;

    if (salaryMode === 'quick') {
      // 快速模式：直接读取12个月输入
      var inputs = document.querySelectorAll('.salary-input');
      inputs.forEach(function(inp) {
        var v = parseFloat(inp.value);
        if (!isNaN(v) && v > 0) {
          monthlySalaries.push(v);
          totalIn += v;
          count++;
        }
      });
    } else {
      // 明细模式：逐月读取计入项目
      var rows = document.querySelectorAll('#detail-tbody tr');
      rows.forEach(function(row) {
        var base = parseFloat(row.querySelector('.detail-base').value) || 0;
        var allowance = parseFloat(row.querySelector('.detail-allowance').value) || 0;
        var bonus = parseFloat(row.querySelector('.detail-bonus').value) || 0;
        var overtime = parseFloat(row.querySelector('.detail-overtime').value) || 0;
        var total = base + allowance + bonus + overtime;
        if (total > 0) {
          monthlySalaries.push(total);
          totalIn += total;
          count++;
        }
      });
    }

    // 年终奖处理（支持多项）
    if (bonusItems.length > 0) {
      bonusItems.forEach(function(item) {
        if (item.method === 'spread') {
          var spread = item.amount / 12;
          if (monthlySalaries.length > 0) {
            monthlySalaries = monthlySalaries.map(function(s) { return s + spread; });
            totalIn += item.amount;
          } else {
            for (var i = 0; i < 12; i++) monthlySalaries.push(spread);
            totalIn = item.amount;
            count = 12;
          }
        } else {
          var bonusMonthIdx = item.month - 1;
          if (bonusMonthIdx >= 0 && bonusMonthIdx < 12 && monthlySalaries[bonusMonthIdx] !== undefined) {
            monthlySalaries[bonusMonthIdx] += item.amount;
            totalIn += item.amount;
          } else {
            // 如果对应月份没有数据，创建一个
            if (bonusMonthIdx >= 0 && bonusMonthIdx < 12) {
              monthlySalaries[bonusMonthIdx] = (monthlySalaries[bonusMonthIdx] || 0) + item.amount;
              totalIn += item.amount;
              count = Math.max(count, bonusMonthIdx + 1);
            }
          }
        }
      });
    }

    // 不计入项目合计
    var excludeTotal = 0;
    excludeItems.forEach(function(item) { excludeTotal += item.amount; });
    totalEx = excludeTotal;

    if (count === 0 && monthlySalaries.length === 0) {
      alert('请至少填写一个月的工资');
      return;
    }

    // 计入项目合计显示原始总额；月平均工资 = (计入合计 - 不计入合计) / 12

    var netTotalIn = totalIn - totalEx;
    if (netTotalIn < 0) netTotalIn = 0;

    var avgMonthly = netTotalIn / 12;

    // 日平均工资 = 用户输入的基本工资 ÷ 21.75（与月平均工资完全独立）
    var baseSalaryVal = parseFloat(document.getElementById('base-salary').value) || 0;
    var avgDaily = baseSalaryVal > 0 ? baseSalaryVal / 21.75 : 0;

    document.getElementById('avg-total-in').textContent = '¥ ' + formatMoney(totalIn);
    document.getElementById('avg-total-ex').textContent = '¥ ' + formatMoney(totalEx);
    document.getElementById('avg-monthly').textContent = '¥ ' + formatMoney(avgMonthly);
    document.getElementById('avg-daily').textContent = '¥ ' + formatMoney(avgDaily);

    // 计算过程透明化
    var formulaDiv = document.getElementById('avg-formula');
    var formulaContent = document.getElementById('avg-formula-content');
    if (formulaDiv && formulaContent) {
      var parts = [];
      parts.push('<div class="la-formula-step">① 计入项目合计 = 各月应计收入相加 <code>¥ ' + formatMoney(totalIn) + '</code></div>');
      if (totalEx > 0) {
        parts.push('<div class="la-formula-step">② 不计入项目合计（已扣除）= <code>¥ ' + formatMoney(totalEx) + '</code></div>');
        parts.push('<div class="la-formula-step">③ 可计入总额 = ' + formatMoney(totalIn) + ' − ' + formatMoney(totalEx) + ' = <code>¥ ' + formatMoney(netTotalIn) + '</code></div>');
      } else {
        parts.push('<div class="la-formula-step">② 不计入项目合计：无</div>');
      }
      parts.push('<div class="la-formula-step">④ 月平均工资 = ' + formatMoney(netTotalIn) + ' ÷ 12 = <span class="la-result-highlight">¥ ' + formatMoney(avgMonthly) + '</span></div>');
      if (bonusItems.length > 0) {
        bonusItems.forEach(function(item, idx) {
          if (item.method === 'spread') {
            parts.push('<div class="la-formula-step">（年终奖' + (idx + 1) + ' ¥' + formatMoney(item.amount) + ' 已平摊到12个月，每月 +¥' + formatMoney(item.amount / 12) + '）</div>');
          } else {
            parts.push('<div class="la-formula-step">（年终奖' + (idx + 1) + ' ¥' + formatMoney(item.amount) + ' 已计入第' + item.month + '月）</div>');
          }
        });
      }
      if (baseSalaryVal > 0) {
        parts.push('<div class="la-formula-step">⑤ 日平均工资 = 基本工资 ¥' + formatMoney(baseSalaryVal) + ' ÷ 21.75 = <span class="la-result-highlight">¥ ' + formatMoney(avgDaily) + '</span></div>');
        parts.push('<div class="la-formula-step" style="color:#6c757d;font-size:0.8rem;">注：日工资完全基于你输入的基本工资，与月平均工资无关（年假赔偿按日工资计算）</div>');
      }
      formulaContent.innerHTML = parts.join('');
      formulaDiv.style.display = 'block';
    }
  }

  // ===== 计算赔偿 =====
  function bindCalcCompensation() {
    var btn = document.getElementById('btn-calc-compensation');
    if (!btn) return;
    btn.addEventListener('click', calcCompensation);
  }

  function calcCompensation() {
    var avgText = document.getElementById('avg-monthly').textContent;
    var avgMonthly = 0;
    if (avgText && avgText !== '--') {
      avgMonthly = parseFloat(avgText.replace(/[¥,\s]/g, ''));
    }
    if (avgMonthly <= 0) {
      alert('请先计算月平均工资');
      return;
    }

    var years = parseFloat(document.getElementById('work-years').value) || 0;
    var type = document.getElementById('dismiss-type').value;
    var leaveDays = parseFloat(document.getElementById('unpaid-leave-days').value) || 0;
    var overtime = parseFloat(document.getElementById('overtime-pay').value) || 0;
    var yearEndPay = parseFloat(document.getElementById('year-end-pay').value) || 0;

    // 日均工资从结果区读取（已由基本工资 ÷ 21.75 计算得出）
    var dailyWageText = document.getElementById('avg-daily').textContent;
    var dailyWage = 0;
    if (dailyWageText && dailyWageText !== '--') {
      dailyWage = parseFloat(dailyWageText.replace(/[¥,\s]/g, ''));
    }

    // 计算补偿年限（N）—— 严格按用户输入值，不做任何取整
    var n = years;

    var mainComp = 0;
    if (type === 'illegal') {
      mainComp = avgMonthly * n * 2;
    } else if (type === 'legal-n') {
      mainComp = avgMonthly * (n + 1);
    } else if (type === 'legal') {
      mainComp = avgMonthly * n;
    } else {
      mainComp = 0;
    }

    // 未休年假工资：日工资 * 天数 * 300%
    var leaveComp = leaveDays > 0 ? dailyWage * leaveDays * 3 : 0;

    var total = mainComp + leaveComp + overtime + yearEndPay;

    var mainEl = document.getElementById('compensation-main');
    var dailyEl = document.getElementById('compensation-daily');
    var leaveEl = document.getElementById('compensation-leave');
    var overtimeEl = document.getElementById('compensation-overtime');
    var bonusEl = document.getElementById('compensation-bonus');
    var totalEl = document.getElementById('compensation-total');

    if (mainEl) mainEl.textContent = '¥ ' + formatMoney(mainComp);
    if (dailyEl) dailyEl.textContent = '¥ ' + formatMoney(dailyWage);
    if (leaveEl) leaveEl.textContent = '¥ ' + formatMoney(leaveComp);
    if (overtimeEl) overtimeEl.textContent = '¥ ' + formatMoney(overtime);
    if (bonusEl) bonusEl.textContent = '¥ ' + formatMoney(yearEndPay);
    if (totalEl) totalEl.textContent = '¥ ' + formatMoney(total);

    // 赔偿计算过程透明化
    var compFormulaDiv = document.getElementById('comp-formula');
    var compFormulaContent = document.getElementById('comp-formula-content');
    if (compFormulaDiv && compFormulaContent) {
      var cParts = [];
      // N 值说明
      var typeMap = { 'illegal': '违法解除（2N）', 'legal-n': '合法解除未提前30日通知（N+1）', 'legal': '合法解除/协商一致（N）', 'resign': '主动辞职（无补偿）' };
      cParts.push('<div class="la-formula-step">① 补偿年限 N = ' + years + '年（严格按输入值，不取整）</div>');
      cParts.push('<div class="la-formula-step">② 离职类型：' + (typeMap[type] || type) + '</div>');
      if (type === 'illegal') {
        cParts.push('<div class="la-formula-step">③ 赔偿金 = 月平均工资 ¥' + formatMoney(avgMonthly) + ' × N(' + n + ') × 2 = <span class="la-result-highlight">¥ ' + formatMoney(mainComp) + '</span></div>');
      } else if (type === 'legal-n') {
        cParts.push('<div class="la-formula-step">③ 补偿金 = 月平均工资 ¥' + formatMoney(avgMonthly) + ' × (N(' + n + ') + 1) = <span class="la-result-highlight">¥ ' + formatMoney(mainComp) + '</span></div>');
      } else if (type === 'legal') {
        cParts.push('<div class="la-formula-step">③ 补偿金 = 月平均工资 ¥' + formatMoney(avgMonthly) + ' × N(' + n + ') = <span class="la-result-highlight">¥ ' + formatMoney(mainComp) + '</span></div>');
      } else {
        cParts.push('<div class="la-formula-step">③ 主动辞职无经济补偿</div>');
      }
      if (leaveDays > 0) {
        cParts.push('<div class="la-formula-step">④ 未休年假工资 = 日工资 ¥' + formatMoney(dailyWage) + ' × ' + leaveDays + '天 × 300% = <span class="la-result-highlight">¥ ' + formatMoney(leaveComp) + '</span></div>');
      }
      if (overtime > 0) {
        cParts.push('<div class="la-formula-step">⑤ 加班费 = <span class="la-result-highlight">¥ ' + formatMoney(overtime) + '</span>（用户输入）</div>');
      }
      if (yearEndPay > 0) {
        cParts.push('<div class="la-formula-step">⑥ 应发未发年终奖 = <span class="la-result-highlight">¥ ' + formatMoney(yearEndPay) + '</span>（用户输入）</div>');
      }
      cParts.push('<div class="la-formula-step" style="margin-top:0.5rem;font-weight:600;">赔偿总额 = ' + formatMoney(mainComp) + (leaveComp > 0 ? ' + ' + formatMoney(leaveComp) : '') + (overtime > 0 ? ' + ' + formatMoney(overtime) : '') + (yearEndPay > 0 ? ' + ' + formatMoney(yearEndPay) : '') + ' = <span class="la-result-highlight">¥ ' + formatMoney(total) + '</span></div>');
      compFormulaContent.innerHTML = cParts.join('');
      compFormulaDiv.style.display = 'block';
    }
  }

  // ===== 申请书模板生成 =====
  function bindTemplateGenerator() {
    var genBtn = document.getElementById('btn-generate');
    var printBtn = document.getElementById('btn-print');
    if (genBtn) genBtn.addEventListener('click', generateDocument);
    if (printBtn) printBtn.addEventListener('click', function() { window.print(); });
  }

  function generateDocument() {
    var fields = {
      applicantName: val('tpl-applicant-name'),
      applicantGender: val('tpl-applicant-gender'),
      applicantEthnic: val('tpl-applicant-ethnic'),
      applicantBirth: val('tpl-applicant-birth'),
      applicantId: val('tpl-applicant-id'),
      applicantHuji: val('tpl-applicant-huji'),
      applicantAddress: val('tpl-applicant-address'),
      applicantPhone: val('tpl-applicant-phone'),
      applicantDelivery: val('tpl-applicant-delivery'),
      companyName: val('tpl-company-name'),
      companyCode: val('tpl-company-code'),
      companyLegal: val('tpl-company-legal'),
      companyTitle: val('tpl-company-title'),
      companyAddress: val('tpl-company-address'),
      companyPhone: val('tpl-company-phone'),
      startDate: val('tpl-start-date'),
      endDate: val('tpl-end-date'),
      position: val('tpl-position'),
      salary: val('tpl-salary'),
      contractTerm: val('tpl-contract-term'),
      dismissReason: val('tpl-dismiss-reason'),
      committee: val('tpl-committee'),
      requests: val('tpl-requests'),
      facts: val('tpl-facts')
    };

    var today = new Date();
    var dateStr = today.getFullYear() + '年' + (today.getMonth() + 1) + '月' + today.getDate() + '日';

    // 构建事实和理由：用户填写优先，未填则用 Employment Information 表单字段自动生成
    var factsContent = fields.facts;
    if (!factsContent) {
      var parts = [];
      if (fields.startDate) parts.push('申请人于' + formatDateCN(fields.startDate) + '入职被申请人处');
      if (fields.position) parts.push('担任' + fields.position + '岗位');
      if (fields.contractTerm) parts.push('双方签订了书面劳动合同（合同期限为' + fields.contractTerm + '）');
      if (fields.salary) parts.push('约定月工资为' + fields.salary + '元（税前）');
      if (fields.endDate && fields.dismissReason) {
        parts.push(formatDateCN(fields.endDate) + '，被申请人以"' + fields.dismissReason + '"为由单方解除劳动合同');
      } else if (fields.endDate) {
        parts.push(formatDateCN(fields.endDate) + '离职');
      }
      if (parts.length > 0) {
        factsContent = parts.join('，') + '。\n\n' +
          '为依法维护申请人的合法权益，特向贵委申请仲裁，恳请依法裁决。';
      }
      if (!factsContent) {
        factsContent = '（请填写事实和理由：写明入职时间、工作岗位、工资标准、劳动合同签订情况、争议发生的时间/原因/过程、离职时间及原因等）';
      }
    }

    var doc = '仲裁申请书\n\n' +
      '申请人：\n' +
      '姓名：' + (fields.applicantName || '________') + '，性别：' + (fields.applicantGender || '____') + '，民族：' + (fields.applicantEthnic || '____') + '，出生日期：' + (fields.applicantBirth ? formatDateCN(fields.applicantBirth) : '____年__月__日') + '\n' +
      '身份证号码：' + (fields.applicantId || '____________________') + '\n' +
      '户籍所在地：' + (fields.applicantHuji || '________________________') + '\n' +
      '现住址：' + (fields.applicantAddress || '________________________') + '\n' +
      '联系电话：' + (fields.applicantPhone || '________________') + '\n' +
      '确认有效的通讯地址：' + (fields.applicantDelivery || fields.applicantAddress || '________________________') + '（用于接收法律文书）\n\n' +
      '被申请人：\n' +
      '单位名称：' + (fields.companyName || '________________________') + '（须与营业执照一致）\n' +
      '住所地：' + (fields.companyAddress || '________________________') + '\n' +
      '统一社会信用代码：' + (fields.companyCode || '________________________') + '\n' +
      '法定代表人（主要负责人）：' + (fields.companyLegal || '________') + '，职务：' + (fields.companyTitle || '________') + '\n' +
      '联系电话：' + (fields.companyPhone || '________________') + '\n\n' +
      '仲裁请求：\n' + (fields.requests || '（请填写仲裁请求，涉及金额需写明计算方式）') + '\n\n' +
      '事实和理由：\n' + factsContent + '\n\n' +
      '此致\n' +
      (fields.committee || '________') + '劳动人事争议仲裁委员会\n\n\n' +
      '申请人（签名）：' + (fields.applicantName || '________') + '\n' +
      dateStr + '\n\n' +
      '附：1.《仲裁申请书》副本1份；2.证据清单及有关证据材料1份';

    var preview = document.getElementById('template-preview');
    var section = document.getElementById('template-preview-section');
    if (preview) preview.textContent = doc;
    if (section) section.style.display = 'block';
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ===== 城市地图选择器（ECharts）=====
  var cityMapInstance = null;

  function initCityMap() {
    var container = document.getElementById('city-map-container');
    if (!container) return;

    loadECharts(function() {
      if (typeof echarts === 'undefined') {
        container.innerHTML = '<div style="padding:2rem;text-align:center;color:#6c757d;font-size:0.9rem;">地图加载失败，请使用上方下拉框选择城市</div>';
        return;
      }
      fetchChinaMap(function(geoJson) {
        if (!geoJson) {
          container.innerHTML = '<div style="padding:2rem;text-align:center;color:#6c757d;font-size:0.9rem;">地图数据加载失败，请使用上方下拉框选择城市</div>';
          return;
        }
        renderCityMap(container, geoJson);
      });
    });
  }

  function loadECharts(cb) {
    if (typeof echarts !== 'undefined') { cb(); return; }
    var script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
    script.onload = cb;
    script.onerror = function() { cb(); };
    document.head.appendChild(script);
  }

  function fetchChinaMap(cb) {
    // 优先从本地加载（避免跨域和网络波动问题）
    var localPath = '/assets/tools/labor-arbitration/china-map.geo.json';

    function loadRemote() {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json', true);
      xhr.onload = function() {
        if (xhr.status === 200) {
          try { cb(JSON.parse(xhr.responseText)); } catch(e) { cb(null); }
        } else { cb(null); }
      };
      xhr.onerror = function() { cb(null); };
      xhr.send();
    }

    var xhrLocal = new XMLHttpRequest();
    xhrLocal.open('GET', localPath, true);
    xhrLocal.onload = function() {
      if (xhrLocal.status === 200) {
        try { cb(JSON.parse(xhrLocal.responseText)); }
        catch(e) { loadRemote(); }
      } else {
        loadRemote();
      }
    };
    xhrLocal.onerror = loadRemote;
    xhrLocal.send();
  }

  function renderCityMap(container, geoJson) {
    echarts.registerMap('china', geoJson);

    var scatterData = [];
    Object.keys(cityData).forEach(function(key) {
      var c = cityData[key];
      if (c.geo) {
        scatterData.push({
          name: c.name,
          value: c.geo.concat(c.min),
          key: key
        });
      }
    });

    var option = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (params.seriesType === 'scatter') {
            return '<b>' + params.name + '</b><br/>最低工资：¥' + params.value[2].toLocaleString();
          }
          return params.name;
        }
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        label: { show: false },
        itemStyle: {
          areaColor: '#e3f2fd',
          borderColor: '#90caf9',
          borderWidth: 1
        },
        emphasis: {
          itemStyle: { areaColor: '#bbdefb' }
        }
      },
      series: [{
        type: 'scatter',
        coordinateSystem: 'geo',
        data: scatterData,
        symbolSize: function(val) {
          return 10 + Math.min(val[2] / 500, 14);
        },
        label: {
          show: true,
          formatter: '{b}',
          fontSize: 11,
          color: '#1565c0',
          position: 'right',
          distance: 4
        },
        itemStyle: {
          color: '#1976d2',
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 4,
          shadowColor: 'rgba(25,118,210,0.3)'
        },
        emphasis: {
          scale: 1.5,
          itemStyle: { color: '#dc3545', borderColor: '#fff', borderWidth: 3 }
        }
      }]
    };

    cityMapInstance = echarts.init(container);
    cityMapInstance.setOption(option);

    cityMapInstance.on('click', function(params) {
      if (params.componentType === 'series' && params.data && params.data.key) {
        var select = document.getElementById('city-select');
        if (select) {
          select.value = params.data.key;
          select.dispatchEvent(new Event('change'));
        }
      }
    });

    window.addEventListener('resize', function() {
      if (cityMapInstance) cityMapInstance.resize();
    });
  }

  // ===== 工具函数 =====
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function formatMoney(n) {
    return n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDateCN(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }
})();
