/* ========== 劳动仲裁助手 ========== */

(function() {
  'use strict';

  var excludeItems = [];
  var bonusItems = [];
  var salaryMode = 'quick';
  var monthData = [];

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
      // 快速模式：真实工资示例
      var samples = [
        38350, 38350, 38750, 38350, 43839.66, 38350,
        38350, 38350, 38350, 38350, 38350, 38550
      ];
      var inputs = document.querySelectorAll('.salary-input');
      inputs.forEach(function(inp, i) {
        if (samples[i] !== undefined) inp.value = samples[i];
      });

      // 年终奖：62720 计入第2个月
      bonusItems = [{ amount: 62720, method: 'month', month: 2 }];
      renderBonusList();

      // 不计入项目：红包 600
      excludeItems = [{ name: '红包', amount: 600 }];
      renderExcludeList();

      // 基本工资示例（用户需按实际合同填写）
      var baseInput = document.getElementById('base-salary');
      if (baseInput) baseInput.value = 8000;

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
    });
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
    var config = {
      version: '1.1',
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

        alert('配置导入成功！');
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
    var leaveComp = leaveDays > 0 ? dailyWage * leaveDays * 2 : 0;

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
      cParts.push('<div class="la-formula-step">① 补偿年限 N = ' + years + '年 → 取整后 N = ' + n + '（不满半年按0.5，满半年不满1年按1）</div>');
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
        cParts.push('<div class="la-formula-step">④ 未休年假工资 = 日工资 ¥' + formatMoney(dailyWage) + ' × ' + leaveDays + '天 × 200% = <span class="la-result-highlight">¥ ' + formatMoney(leaveComp) + '</span></div>');
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
