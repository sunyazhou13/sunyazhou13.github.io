/* ========== 劳动仲裁助手 ========== */

(function() {
  'use strict';

  var excludeItems = [];
  var bonusAmount = 0;
  var bonusMethod = 'spread';
  var salaryMode = 'quick';
  var monthData = [];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initTabs();
    initSalaryModeToggle();
    initQuickGrid();
    initDetailTable();
    initBonusControls();
    initExcludeList();
    bindCalcAvg();
    bindCalcCompensation();
    bindTemplateGenerator();
    bindFillSample();
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
  function initBonusControls() {
    var methodSelect = document.getElementById('bonus-method');
    var monthInput = document.getElementById('bonus-month');
    if (methodSelect && monthInput) {
      methodSelect.addEventListener('change', function() {
        monthInput.style.display = this.value === 'month' ? 'inline-block' : 'none';
      });
    }
  }

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
      // 快速模式示例
      var samples = [
        18000, 18500, 17500, 19000, 20000, 19500,
        21000, 20500, 22000, 21500, 23000, 24000
      ];
      var inputs = document.querySelectorAll('.salary-input');
      inputs.forEach(function(inp, i) {
        if (samples[i] !== undefined) inp.value = samples[i];
      });

      // 明细模式示例（用户工资单风格）
      var detailRows = document.querySelectorAll('#detail-tbody tr');
      detailRows.forEach(function(row, i) {
        var base = row.querySelector('.detail-base');
        var bonus = row.querySelector('.detail-bonus');
        var social = row.querySelector('.detail-social');
        var fund = row.querySelector('.detail-fund');
        var tax = row.querySelector('.detail-tax');
        if (base) base.value = 18000 + i * 500;
        if (bonus) bonus.value = Math.floor(Math.random() * 3000);
        if (social) social.value = 2000 + Math.floor(Math.random() * 500);
        if (fund) fund.value = 3000 + Math.floor(Math.random() * 500);
        if (tax) tax.value = 1500 + Math.floor(Math.random() * 1000);
      });
      updateDetailTotals();

      // 年终奖示例
      var bonusInput = document.getElementById('year-end-bonus');
      if (bonusInput) bonusInput.value = 30000;
    });
  }

  // ===== 计算平均工资 =====
  function bindCalcAvg() {
    var btn = document.getElementById('btn-calc-avg');
    if (!btn) return;
    btn.addEventListener('click', calcAverage);
  }

  function calcAverage() {
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

    // 年终奖处理
    var bonusInput = document.getElementById('year-end-bonus');
    var bonusVal = bonusInput ? parseFloat(bonusInput.value) : 0;
    var methodSelect = document.getElementById('bonus-method');
    var method = methodSelect ? methodSelect.value : 'spread';

    if (!isNaN(bonusVal) && bonusVal > 0) {
      if (method === 'spread') {
        // 平摊到12个月
        var spread = bonusVal / 12;
        // 如果已有月份数据，平摊到每个月
        if (monthlySalaries.length > 0) {
          monthlySalaries = monthlySalaries.map(function(s) { return s + spread; });
          totalIn += bonusVal;
        } else {
          // 没有月份数据时，假设12个月都有一份
          for (var i = 0; i < 12; i++) monthlySalaries.push(spread);
          totalIn = bonusVal;
          count = 12;
        }
      } else {
        // 计入发放当月（暂不支持，因为不知道哪个月，需要用户指定）
        var monthInput = document.getElementById('bonus-month');
        var bonusMonth = monthInput ? parseInt(monthInput.value) - 1 : -1;
        if (bonusMonth >= 0 && bonusMonth < 12 && monthlySalaries[bonusMonth] !== undefined) {
          monthlySalaries[bonusMonth] += bonusVal;
          totalIn += bonusVal;
        } else {
          alert('请选择年终奖发放月份（1-12）');
          return;
        }
      }
    }

    // 不计入项目合计
    var excludeTotal = 0;
    excludeItems.forEach(function(item) { excludeTotal += item.amount; });
    totalEx = excludeTotal;

    if (count === 0 && monthlySalaries.length === 0) {
      alert('请至少填写一个月的工资');
      return;
    }

    // 如果有不计入项目，需要从总工资中扣除（如果用户把不计入项目误填入了月工资）
    // 注意：不计入项目列表中的项目应该是不包含在月工资输入中的
    // 但如果用户误填了，我们给个提示而不是自动扣除

    var avgMonthly = totalIn / (monthlySalaries.length || count || 1);
    var avgDaily = avgMonthly / 21.75;

    document.getElementById('avg-total-in').textContent = '¥ ' + formatMoney(totalIn);
    document.getElementById('avg-total-ex').textContent = '¥ ' + formatMoney(totalEx);
    document.getElementById('avg-monthly').textContent = '¥ ' + formatMoney(avgMonthly);
    document.getElementById('avg-daily').textContent = '¥ ' + formatMoney(avgDaily);
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

    // 计算补偿年限（N）
    var n = Math.floor(years);
    var decimal = years - n;
    if (decimal >= 0.5) n += 1;
    else if (decimal > 0) n += 0.5;

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

    // 未休年假工资：日工资 * 天数 * 200%
    var dailyWage = avgMonthly / 21.75;
    var leaveComp = leaveDays > 0 ? dailyWage * leaveDays * 2 : 0;

    var total = mainComp + leaveComp + overtime + yearEndPay;

    document.getElementById('compensation-main').textContent = '¥ ' + formatMoney(mainComp);
    document.getElementById('compensation-leave').textContent = '¥ ' + formatMoney(leaveComp);
    document.getElementById('compensation-overtime').textContent = '¥ ' + formatMoney(overtime);
    document.getElementById('compensation-bonus').textContent = '¥ ' + formatMoney(yearEndPay);
    document.getElementById('compensation-total').textContent = '¥ ' + formatMoney(total);
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
