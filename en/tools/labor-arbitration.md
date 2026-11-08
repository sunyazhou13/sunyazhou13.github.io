---
layout: page
title: Labor Arbitration Assistant
icon: fas fa-gavel
lang: en
permalink: /tools/labor-arbitration/
tool_css: /assets/tools/labor-arbitration/app.css?v=202609221
---

<div id="la-app">

<!-- Tab Navigation -->
<div class="la-tabs">
  <button class="la-tab active" data-tab="calculator">Compensation Calculator</button>
  <button class="la-tab" data-tab="guide">Arbitration Process</button>
  <button class="la-tab" data-tab="template">Application Template</button>
</div>

<!-- Compensation Calculator Panel -->
<div class="la-panel active" id="panel-calculator">
  <!-- Configuration Area -->
  <div class="la-config-card">
    <div class="la-card-header">Tool Configuration</div>
    <div class="la-card-body la-config-grid">
      <div class="la-config-map">
        <div class="la-map-section">
          <div class="la-map-header">Or select city on the map <span class="la-map-hint">(click a city to select)</span></div>
          <div id="city-map-container"></div>
        </div>
      </div>
      <div class="la-config-sidebar">
        <div class="la-form-row">
          <label>Your City <span class="la-required">*</span></label>
          <select id="city-select">
            <option value="">Select City</option>
            <option value="beijing" data-min="2540" data-max="35000">Beijing (Min Wage ¥2,540)</option>
            <option value="shanghai" data-min="2740" data-max="40000">Shanghai (Min Wage ¥2,740)</option>
            <option value="shenzhen" data-min="2700" data-max="38000">Shenzhen (Min Wage ¥2,700)</option>
            <option value="guangzhou" data-min="2680" data-max="35000">Guangzhou (Min Wage ¥2,680)</option>
            <option value="hangzhou" data-min="2660" data-max="33000">Hangzhou (Min Wage ¥2,660)</option>
            <option value="nanjing" data-min="2660" data-max="30000">Nanjing (Min Wage ¥2,660)</option>
            <option value="suzhou" data-min="2660" data-max="32000">Suzhou (Min Wage ¥2,660)</option>
            <option value="tianjin" data-min="2510" data-max="28000">Tianjin (Min Wage ¥2,510)</option>
            <option value="chengdu" data-min="2100" data-max="25000">Chengdu (Min Wage ¥2,100)</option>
            <option value="chongqing" data-min="2330" data-max="24000">Chongqing (Min Wage ¥2,330)</option>
            <option value="wuhan" data-min="2400" data-max="22000">Wuhan (Min Wage ¥2,400)</option>
            <option value="xian" data-min="2376" data-max="20000">Xi'an (Min Wage ¥2,376)</option>
            <option value="qingdao" data-min="2400" data-max="22000">Qingdao (Min Wage ¥2,400)</option>
            <option value="jinan" data-min="2400" data-max="20000">Jinan (Min Wage ¥2,400)</option>
            <option value="zhengzhou" data-min="2350" data-max="18000">Zhengzhou (Min Wage ¥2,350)</option>
            <option value="hefei" data-min="2320" data-max="18000">Hefei (Min Wage ¥2,320)</option>
            <option value="foshan" data-min="2300" data-max="18000">Foshan (Min Wage ¥2,300)</option>
            <option value="dongguan" data-min="2300" data-max="18000">Dongguan (Min Wage ¥2,300)</option>
            <option value="dalian" data-min="2230" data-max="17000">Dalian (Min Wage ¥2,230)</option>
            <option value="shenyang" data-min="2230" data-max="16000">Shenyang (Min Wage ¥2,230)</option>
            <option value="changchun" data-min="2230" data-max="15000">Changchun (Min Wage ¥2,230)</option>
            <option value="nanchang" data-min="2240" data-max="15000">Nanchang (Min Wage ¥2,240)</option>
            <option value="haikou" data-min="2250" data-max="16000">Haikou (Min Wage ¥2,250)</option>
            <option value="xiamen" data-min="2265" data-max="20000">Xiamen (Min Wage ¥2,265)</option>
            <option value="fuzhou" data-min="2265" data-max="18000">Fuzhou (Min Wage ¥2,265)</option>
            <option value="harbin" data-min="2270" data-max="14000">Harbin (Min Wage ¥2,270)</option>
            <option value="wulumuqi" data-min="2270" data-max="16000">Urumqi (Min Wage ¥2,270)</option>
            <option value="huhehaote" data-min="2380" data-max="17000">Hohhot (Min Wage ¥2,380)</option>
            <option value="shijiazhuang" data-min="2380" data-max="16000">Shijiazhuang (Min Wage ¥2,380)</option>
            <option value="changsha" data-min="2200" data-max="18000">Changsha (Min Wage ¥2,200)</option>
            <option value="lanzhou" data-min="2200" data-max="14000">Lanzhou (Min Wage ¥2,200)</option>
            <option value="nanning" data-min="2200" data-max="15000">Nanning (Min Wage ¥2,200)</option>
            <option value="guiyang" data-min="2130" data-max="14000">Guiyang (Min Wage ¥2,130)</option>
            <option value="kunming" data-min="2170" data-max="15000">Kunming (Min Wage ¥2,170)</option>
            <option value="yinchuan" data-min="2235" data-max="14000">Yinchuan (Min Wage ¥2,235)</option>
            <option value="xining" data-min="2080" data-max="13000">Xining (Min Wage ¥2,080)</option>
            <option value="lasa" data-min="2360" data-max="18000">Lhasa (Min Wage ¥2,360)</option>
          </select>
          <span class="la-note">Sample data will be generated based on your city's wage standards</span>
        </div>
        <div class="la-actions">
          <button class="la-btn la-btn-ghost" id="btn-save-config">Save Config</button>
          <button class="la-btn la-btn-ghost" id="btn-load-config">Load Config</button>
          <input type="file" id="config-file-input" accept=".json" style="display:none;">
        </div>
      </div>
    </div>
  </div>

  <div class="la-section">
    <h3>Salary Details (Past 12 Months)</h3>
    <p class="la-hint">Please enter your pre-tax gross salary (including base salary, bonuses, commissions, allowances, overtime pay, etc.) for the last 12 months to calculate your average monthly wage.</p>

    <!-- Mode Toggle -->
    <div class="la-mode-bar">
      <button class="la-mode-btn active" data-mode="quick">Quick Mode</button>
      <button class="la-mode-btn" data-mode="detail">Detailed Mode</button>
    </div>

    <!-- Quick Mode -->
    <div class="la-mode-panel active" id="mode-quick">
      <div class="la-salary-grid" id="salary-grid">
        <!-- JS generates 12 month inputs -->
      </div>
    </div>

    <!-- Detailed Mode -->
    <div class="la-mode-panel" id="mode-detail">
      <table class="la-detail-table">
        <thead>
          <tr>
            <th>Month</th>
            <th>Base Salary</th>
            <th>Allowance</th>
            <th>Bonus</th>
            <th>Overtime</th>
            <th>Social Ins.</th>
            <th>Housing Fund</th>
            <th>Income Tax</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody id="detail-tbody">
          <!-- JS generates rows -->
        </tbody>
      </table>
    </div>

    <div class="la-form-row la-bonus-row">
      <label>Year-End Bonus (included in average salary) <span style="font-weight:normal;color:#6c757d;font-size:0.85rem;">Multiple bonuses supported</span></label>
      <div class="la-bonus-list" id="bonus-list">
        <!-- JS dynamically generates -->
      </div>
      <div class="la-inline-group">
        <input type="number" id="bonus-amount" min="0" step="0.01" placeholder="Amount, e.g., 30000">
        <select id="bonus-method-single">
          <option value="spread">Spread over 12 months</option>
          <option value="month">Add to payment month</option>
        </select>
        <input type="number" id="bonus-month-single" min="1" max="12" step="1" placeholder="Month 1-12" style="display:none;">
        <button class="la-btn la-btn-sm la-btn-ghost" id="btn-add-bonus" type="button">Add</button>
      </div>
      <span class="la-note">Year-end bonus from last year or current year; part of labor compensation and should be included in the average salary base</span>
    </div>

    <div class="la-form-row">
      <label>Items NOT included in average salary (e.g., holiday red packets, welfare benefits)</label>
      <div class="la-exclude-list" id="exclude-list">
        <!-- JS dynamically generates -->
      </div>
      <div class="la-inline-group">
        <input type="text" id="exclude-name" placeholder="Item name, e.g., Holiday Red Packet">
        <input type="number" id="exclude-amount" min="0" step="0.01" placeholder="Amount">
        <button class="la-btn la-btn-sm" id="btn-add-exclude">Add</button>
      </div>
      <span class="la-note">Welfare and one-time random payments are generally NOT included in the economic compensation base</span>
    </div>

    <div class="la-form-row">
      <label>Base Salary (CNY) <span class="la-required">*</span></label>
      <input type="number" id="base-salary" min="0" step="0.01" placeholder="e.g., 8000">
      <span class="la-note"><strong style="color:#d9534f;">Daily Wage = Base Salary ÷ 21.75</strong>. Enter your contract base salary (or base pay). Annual leave pay will be calculated strictly based on this.</span>
    </div>

    <div class="la-actions">
      <button class="la-btn la-btn-primary" id="btn-calc-avg">Calculate Average</button>
      <button class="la-btn la-btn-ghost" id="btn-fill-sample">Fill Sample Data</button>
    </div>

    <div class="la-result-box" id="avg-result">
      <div class="la-result-item">
        <span class="la-result-label">Included Items Total</span>
        <span class="la-result-value" id="avg-total-in">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">Excluded Items Total</span>
        <span class="la-result-value" id="avg-total-ex">--</span>
      </div>
      <div class="la-divider"></div>
      <div class="la-result-item">
        <span class="la-result-label">Monthly Average Salary</span>
        <span class="la-result-value" id="avg-monthly">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">Daily Average Salary</span>
        <span class="la-result-value" id="avg-daily">--</span>
      </div>
      <div class="la-formula-panel" id="avg-formula" style="display:none;">
        <div class="la-panel-title">Calculation Steps</div>
        <div id="avg-formula-content"></div>
      </div>
    </div>
  </div>

  <div class="la-section">
    <h3>Compensation Estimate</h3>
    <div class="la-form-row">
      <label>Years of Employment <span class="la-required">*</span></label>
      <input type="number" id="work-years" min="0" step="0.1" placeholder="e.g., 3.5">
      <span class="la-note">Less than 6 months counts as 0.5 year; 6 months to 1 year counts as 1 year</span>
    </div>
    <div class="la-form-row">
      <label>Type of Termination</label>
      <select id="dismiss-type">
        <option value="illegal">Illegal Dismissal (2N)</option>
        <option value="legal-n">Legal Dismissal Without 30-Day Notice (N + 1)</option>
        <option value="legal">Legal Dismissal / Mutual Agreement (N)</option>
        <option value="resign">Voluntary Resignation (No Compensation)</option>
      </select>
    </div>
    <div class="la-form-row">
      <label>Unused Annual Leave Days</label>
      <input type="number" id="unpaid-leave-days" min="0" step="0.5" placeholder="e.g., 5">
    </div>
    <div class="la-form-row">
      <label>Overtime Pay Owed (CNY, total amount)</label>
      <input type="number" id="overtime-pay" min="0" placeholder="e.g., 5000">
    </div>
    <div class="la-form-row">
      <label>Unpaid Year-End Bonus (CNY)</label>
      <input type="number" id="year-end-pay" min="0" placeholder="e.g., 30000">
      <span class="la-note">If year-end bonus is a fixed component of labor compensation with contract/company policy basis, it should be prorated upon departure</span>
    </div>
    <div class="la-actions">
      <button class="la-btn la-btn-primary" id="btn-calc-compensation">Calculate Total</button>
    </div>
    <div class="la-result-box la-highlight" id="compensation-result">
      <div class="la-result-item">
        <span class="la-result-label">Severance / Compensation</span>
        <span class="la-result-value" id="compensation-main">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">Daily Wage</span>
        <span class="la-result-value" id="compensation-daily">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">Unused Annual Leave Pay</span>
        <span class="la-result-value" id="compensation-leave">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">Overtime Pay</span>
        <span class="la-result-value" id="compensation-overtime">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">Year-End Bonus</span>
        <span class="la-result-value" id="compensation-bonus">--</span>
      </div>
      <div class="la-divider"></div>
      <div class="la-result-item la-total">
        <span class="la-result-label">Total Compensation</span>
        <span class="la-result-value" id="compensation-total">--</span>
      </div>
      <div class="la-formula-panel" id="comp-formula" style="display:none;">
        <div class="la-panel-title">Compensation Breakdown</div>
        <div id="comp-formula-content"></div>
      </div>
    </div>
  </div>

  <div class="la-notice">
    <strong>Disclaimer:</strong> This tool provides estimates based on China's Labor Contract Law and related regulations. Actual amounts are subject to the arbitration committee or court decision. If the average monthly salary exceeds 3 times the local average wage of the previous year, the cap applies and years of service are limited to 12.
  </div>
</div>

<!-- Arbitration Process Panel -->
<div class="la-panel" id="panel-guide">
  <div class="la-timeline">
    <div class="la-timeline-item">
      <div class="la-timeline-dot">1</div>
      <div class="la-timeline-content">
        <h4>Collect Evidence</h4>
        <ul>
          <li>Labor contract (original or copy)</li>
          <li>Salary records / payslips (bank statements, tax app records)</li>
          <li>Social insurance and housing fund records</li>
          <li>Attendance records, clock-in screenshots</li>
          <li>Dismissal notice (written, email, WeChat, DingTalk, etc.)</li>
          <li>Work group chat records (proving employment and dismissal facts)</li>
          <li>Overtime approval records or notifications</li>
        </ul>
        <p class="la-tip">Keep original chat records on your phone; do not delete conversations after taking screenshots.</p>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">2</div>
      <div class="la-timeline-content">
        <h4>Calculate Compensation</h4>
        <p>Use the "Compensation Calculator" above to estimate severance pay, unused leave pay, and overtime compensation. Clearly define your arbitration claim amounts.</p>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">3</div>
      <div class="la-timeline-content">
        <h4>File Arbitration Application</h4>
        <ul>
          <li>Submit to the Labor and Personnel Dispute Arbitration Committee at either <strong>the place where the labor contract is performed</strong> or <strong>the employer's registered location</strong></li>
          <li>Required materials: Arbitration application (2 copies), ID card copy, evidence copies (number of respondents + 1)</li>
          <li>The arbitration committee generally decides whether to accept within 5 working days</li>
        </ul>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">4</div>
      <div class="la-timeline-content">
        <h4>Hearing</h4>
        <ul>
          <li>After acceptance, arbitration generally concludes within 45 days; complex cases may be extended by 15 days</li>
          <li>Bring all original evidence to the hearing</li>
          <li>Note: Arbitration proceedings are free of charge</li>
        </ul>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">5</div>
      <div class="la-timeline-content">
        <h4>Receive the Award</h4>
        <ul>
          <li>If dissatisfied with the award, you may file a lawsuit in court within <strong>15 days</strong> of receiving the award</li>
          <li>For "final arbitration" cases (small-amount disputes), the employer cannot sue, but the employee still can</li>
          <li>After the award takes effect, you may apply to the court for enforcement</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="la-section la-warning-box">
    <h4>Important Time Limits</h4>
    <ul>
      <li>The limitation period for labor dispute arbitration is <strong>1 year</strong>, starting from the date when the party knows or should have known that their rights were infringed</li>
      <li>Disputes over unpaid wages are not subject to the 1-year limit during the employment relationship, but must be filed within <strong>1 year</strong> after termination</li>
    </ul>
  </div>

  <div class="la-section">
    <h4>Legal References</h4>
    <div class="la-law-grid">
      <div class="la-law-card">
        <strong>Labor Contract Law Art. 47</strong>
        <p>Economic compensation is paid at the rate of one month's salary for each full year of service.</p>
      </div>
      <div class="la-law-card">
        <strong>Labor Contract Law Art. 48</strong>
        <p>Where an employer unlawfully terminates a labor contract, the employee may demand reinstatement or compensation at twice the statutory rate.</p>
      </div>
      <div class="la-law-card">
        <strong>Labor Contract Law Art. 87</strong>
        <p>An employer that unlawfully terminates a labor contract shall pay compensation at twice the rate of economic compensation.</p>
      </div>
      <div class="la-law-card">
        <strong>Regulations on Paid Annual Leave Art. 5</strong>
        <p>For unused annual leave days, the employer shall pay 300% of the daily wage, including the normal wage already paid.</p>
      </div>
    </div>
  </div>
</div>

<!-- Application Template Panel -->
<div class="la-panel" id="panel-template">
  <div class="la-section">
    <h3>Arbitration Application Generator</h3>
    <p class="la-hint">Fill in the information below to generate a standard labor arbitration application. You can copy or print the output.</p>

    <div class="la-form-group">
      <h4>Applicant Information</h4>
      <div class="la-form-row">
        <label>Full Name</label>
        <input type="text" id="tpl-applicant-name" placeholder="Zhang San">
      </div>
      <div class="la-form-row">
        <label>Gender</label>
        <select id="tpl-applicant-gender">
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>
      <div class="la-form-row">
        <label>Ethnicity</label>
        <input type="text" id="tpl-applicant-ethnic" placeholder="Han">
      </div>
      <div class="la-form-row">
        <label>Date of Birth</label>
        <input type="date" id="tpl-applicant-birth">
      </div>
      <div class="la-form-row">
        <label>ID Number</label>
        <input type="text" id="tpl-applicant-id" placeholder="110101199001011234">
      </div>
      <div class="la-form-row">
        <label>Household Registration Address</label>
        <input type="text" id="tpl-applicant-huji" placeholder="No. 88 Jianguo Road, Chaoyang District, Beijing">
      </div>
      <div class="la-form-row">
        <label>Current Address</label>
        <input type="text" id="tpl-applicant-address" placeholder="Room 202, Building 3, No. 66 Zhongguancun Street, Haidian District, Beijing">
      </div>
      <div class="la-form-row">
        <label>Phone Number</label>
        <input type="text" id="tpl-applicant-phone" placeholder="13800138000">
      </div>
      <div class="la-form-row">
        <label>Effective Correspondence Address (for receiving legal documents)</label>
        <input type="text" id="tpl-applicant-delivery" placeholder="Same as current address or fill in another">
      </div>
    </div>

    <div class="la-form-group">
      <h4>Respondent (Employer) Information</h4>
      <div class="la-form-row">
        <label>Company Full Name (must match business license)</label>
        <input type="text" id="tpl-company-name" placeholder="Beijing XX Technology Co., Ltd.">
      </div>
      <div class="la-form-row">
        <label>Registered Address</label>
        <input type="text" id="tpl-company-address" placeholder="18F, Tower T2, Wangjing SOHO, Chaoyang District, Beijing">
      </div>
      <div class="la-form-row">
        <label>Unified Social Credit Code</label>
        <input type="text" id="tpl-company-code" placeholder="91110000MA01XXXXX">
      </div>
      <div class="la-form-row">
        <label>Legal Representative (Principal)</label>
        <input type="text" id="tpl-company-legal" placeholder="Li Qiang">
      </div>
      <div class="la-form-row">
        <label>Position/Title</label>
        <input type="text" id="tpl-company-title" placeholder="General Manager">
      </div>
      <div class="la-form-row">
        <label>Company Phone</label>
        <input type="text" id="tpl-company-phone" placeholder="010-88886666">
      </div>
    </div>

    <div class="la-form-group">
      <h4>Employment Information</h4>
      <div class="la-form-row">
        <label>Employment Start Date</label>
        <input type="date" id="tpl-start-date">
      </div>
      <div class="la-form-row">
        <label>Employment End Date</label>
        <input type="date" id="tpl-end-date">
      </div>
      <div class="la-form-row">
        <label>Position</label>
        <input type="text" id="tpl-position" placeholder="Senior Software Engineer">
      </div>
      <div class="la-form-row">
        <label>Monthly Salary (CNY, pre-tax)</label>
        <input type="number" id="tpl-salary" min="0" step="0.01" placeholder="12000">
      </div>
      <div class="la-form-row">
        <label>Labor Contract Term</label>
        <input type="text" id="tpl-contract-term" placeholder="August 1, 2022 to July 31, 2025">
      </div>
      <div class="la-form-row">
        <label>Dismissal Reason (as stated by employer)</label>
        <input type="text" id="tpl-dismiss-reason" placeholder="Organizational restructuring">
      </div>
    </div>

    <div class="la-form-group">
      <h4>Arbitration Claims & Facts</h4>
      <div class="la-form-row">
        <label>Arbitration Claims (one per line; include calculation for monetary claims)</label>
        <textarea id="tpl-requests" rows="8" placeholder="1. Request confirmation that the respondent's termination of the labor contract is illegal;&#10;2. Request the respondent to pay illegal dismissal compensation (2N) totaling CNY 96,000; (Calculation: 4 years of service x 2 x monthly average salary CNY 12,000 = CNY 96,000)&#10;3. Request payment of unused annual leave wages totaling CNY 8,276; (Calculation: CNY 12,000 / 21.75 days x 5 days x 300% = CNY 8,276)&#10;4. Request payment of outstanding wages from July 1, 2026 to July 31, 2026 totaling CNY 12,000."></textarea>
      </div>
      <div class="la-form-row">
        <label>Facts and Reasons</label>
        <textarea id="tpl-facts" rows="10" placeholder="Describe: start date, position, salary standard, contract signing, timeline and cause of dispute, dismissal date and reason, etc.&#10;&#10;Sample structure:&#10;The applicant joined the respondent on [date] as a [position]. Both parties signed a written labor contract for a term of [X] years (from [date] to [date]), with an agreed monthly salary of CNY [amount] (pre-tax), paid on the [X]th of each month via bank transfer.&#10;&#10;On [date], the respondent served the applicant a 'Notice of Termination of Labor Contract', unilaterally terminating the contract on the grounds of '[reason]' and requiring the applicant to complete exit procedures on the same day. The applicant believes that '[reason]' does not constitute a statutory ground for termination, and the respondent neither consulted with the applicant nor provided 30 days' written notice or payment in lieu of notice, nor any economic compensation. The respondent's actions constitute illegal dismissal.&#10;&#10;According to Articles 48 and 87 of the Labor Contract Law of the People's Republic of China...&#10;&#10;In summary, to protect the legitimate rights and interests of the applicant, we hereby apply for arbitration and respectfully request a ruling in favor of the applicant."></textarea>
      </div>
    </div>

    <div class="la-form-group">
      <h4>Arbitration Committee & Date</h4>
      <div class="la-form-row">
        <label>Labor Dispute Arbitration Committee</label>
        <input type="text" id="tpl-committee" placeholder="Beijing Chaoyang District Labor and Personnel Dispute Arbitration Committee">
      </div>
    </div>

    <div class="la-actions">
      <button class="la-btn la-btn-primary" id="btn-generate">Generate Application</button>
      <button class="la-btn la-btn-ghost" id="btn-print">Print / Save as PDF</button>
    </div>
  </div>

  <div class="la-section la-preview-box" id="template-preview-section" style="display:none;">
    <h3>Preview</h3>
    <div class="la-document" id="template-preview">
      <!-- JS fills -->
    </div>
  </div>
</div>

</div>

<script src="/assets/tools/labor-arbitration/app.js?v=202609221" defer></script>
