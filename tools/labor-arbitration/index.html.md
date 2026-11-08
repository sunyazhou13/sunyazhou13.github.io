---
layout: page
title: 劳动仲裁助手
icon: fas fa-gavel
tool_css: /assets/tools/labor-arbitration/app.css?v=202609221
---

<div id="la-app">

<!-- 顶部导航标签 -->
<div class="la-tabs">
  <button class="la-tab active" data-tab="calculator">赔偿计算器</button>
  <button class="la-tab" data-tab="guide">仲裁流程</button>
  <button class="la-tab" data-tab="template">申请书模板</button>
</div>

<!-- 赔偿计算器面板 -->
<div class="la-panel active" id="panel-calculator">
  <!-- 配置区域 -->
  <div class="la-config-card">
    <div class="la-card-header">工具配置</div>
    <div class="la-card-body la-config-grid">
      <div class="la-config-map">
        <div class="la-map-section">
          <div class="la-map-header">或在地图上选择城市 <span class="la-map-hint">（点击城市即可选中）</span></div>
          <div id="city-map-container"></div>
        </div>
      </div>
      <div class="la-config-sidebar">
        <div class="la-form-row">
          <label>所在城市 <span class="la-required">*</span></label>
          <select id="city-select">
            <option value="">请选择城市</option>
            <option value="beijing" data-min="2540" data-max="35000">北京（最低工资 ¥2,540）</option>
            <option value="shanghai" data-min="2740" data-max="40000">上海（最低工资 ¥2,740）</option>
            <option value="shenzhen" data-min="2700" data-max="38000">深圳（最低工资 ¥2,700）</option>
            <option value="guangzhou" data-min="2680" data-max="35000">广州（最低工资 ¥2,680）</option>
            <option value="hangzhou" data-min="2660" data-max="33000">杭州（最低工资 ¥2,660）</option>
            <option value="nanjing" data-min="2660" data-max="30000">南京（最低工资 ¥2,660）</option>
            <option value="suzhou" data-min="2660" data-max="32000">苏州（最低工资 ¥2,660）</option>
            <option value="tianjin" data-min="2510" data-max="28000">天津（最低工资 ¥2,510）</option>
            <option value="chengdu" data-min="2100" data-max="25000">成都（最低工资 ¥2,100）</option>
            <option value="chongqing" data-min="2330" data-max="24000">重庆（最低工资 ¥2,330）</option>
            <option value="wuhan" data-min="2400" data-max="22000">武汉（最低工资 ¥2,400）</option>
            <option value="xian" data-min="2376" data-max="20000">西安（最低工资 ¥2,376）</option>
            <option value="qingdao" data-min="2400" data-max="22000">青岛（最低工资 ¥2,400）</option>
            <option value="jinan" data-min="2400" data-max="20000">济南（最低工资 ¥2,400）</option>
            <option value="zhengzhou" data-min="2350" data-max="18000">郑州（最低工资 ¥2,350）</option>
            <option value="hefei" data-min="2320" data-max="18000">合肥（最低工资 ¥2,320）</option>
            <option value="foshan" data-min="2300" data-max="18000">佛山（最低工资 ¥2,300）</option>
            <option value="dongguan" data-min="2300" data-max="18000">东莞（最低工资 ¥2,300）</option>
            <option value="dalian" data-min="2230" data-max="17000">大连（最低工资 ¥2,230）</option>
            <option value="shenyang" data-min="2230" data-max="16000">沈阳（最低工资 ¥2,230）</option>
            <option value="changchun" data-min="2230" data-max="15000">长春（最低工资 ¥2,230）</option>
            <option value="nanchang" data-min="2240" data-max="15000">南昌（最低工资 ¥2,240）</option>
            <option value="haikou" data-min="2250" data-max="16000">海口（最低工资 ¥2,250）</option>
            <option value="xiamen" data-min="2265" data-max="20000">厦门（最低工资 ¥2,265）</option>
            <option value="fuzhou" data-min="2265" data-max="18000">福州（最低工资 ¥2,265）</option>
            <option value="harbin" data-min="2270" data-max="14000">哈尔滨（最低工资 ¥2,270）</option>
            <option value="wulumuqi" data-min="2270" data-max="16000">乌鲁木齐（最低工资 ¥2,270）</option>
            <option value="huhehaote" data-min="2380" data-max="17000">呼和浩特（最低工资 ¥2,380）</option>
            <option value="shijiazhuang" data-min="2380" data-max="16000">石家庄（最低工资 ¥2,380）</option>
            <option value="changsha" data-min="2200" data-max="18000">长沙（最低工资 ¥2,200）</option>
            <option value="lanzhou" data-min="2200" data-max="14000">兰州（最低工资 ¥2,200）</option>
            <option value="nanning" data-min="2200" data-max="15000">南宁（最低工资 ¥2,200）</option>
            <option value="guiyang" data-min="2130" data-max="14000">贵阳（最低工资 ¥2,130）</option>
            <option value="kunming" data-min="2170" data-max="15000">昆明（最低工资 ¥2,170）</option>
            <option value="yinchuan" data-min="2235" data-max="14000">银川（最低工资 ¥2,235）</option>
            <option value="xining" data-min="2080" data-max="13000">西宁（最低工资 ¥2,080）</option>
            <option value="lasa" data-min="2360" data-max="18000">拉萨（最低工资 ¥2,360）</option>
          </select>
          <span class="la-note">选择城市后，示例数据将根据该城市工资标准生成</span>
        </div>
        <div class="la-actions">
          <button class="la-btn la-btn-ghost" id="btn-save-config">保存配置</button>
          <button class="la-btn la-btn-ghost" id="btn-load-config">导入配置</button>
          <input type="file" id="config-file-input" accept=".json" style="display:none;">
        </div>
      </div>
    </div>
  </div>

  <div class="la-section">
    <h3>过去12个月工资明细</h3>
    <p class="la-hint">请填写税前应发工资（含基本工资、绩效、奖金、补贴、加班费等），用于计算月平均工资。</p>
    <div class="la-salary-grid" id="salary-grid">
      <!-- JS 生成12个月输入框 -->
    </div>

    <div class="la-form-row la-bonus-row">
      <label>年终奖（计入平均工资）<span style="font-weight:normal;color:#6c757d;font-size:0.85rem;">可添加多项，系统会自动合计</span></label>
      <div class="la-bonus-list" id="bonus-list">
        <!-- JS 动态生成 -->
      </div>
      <div class="la-inline-group">
        <input type="number" id="bonus-amount" min="0" step="0.01" placeholder="金额，如：30000">
        <select id="bonus-method-single">
          <option value="spread">平摊到12个月</option>
          <option value="month">计入发放当月</option>
        </select>
        <input type="number" id="bonus-month-single" min="1" max="12" step="1" placeholder="月份 1-12" style="display:none;">
        <button class="la-btn la-btn-sm la-btn-ghost" id="btn-add-bonus" type="button">添加</button>
      </div>
      <span class="la-note">上年度或当年度年终奖，属于劳动报酬的应计入平均工资基数</span>
    </div>

    <div class="la-form-row">
      <label>不计入平均工资的项目（如开工红包、节日福利等）</label>
      <div class="la-exclude-list" id="exclude-list">
        <!-- JS 动态生成 -->
      </div>
      <div class="la-inline-group">
        <input type="text" id="exclude-name" placeholder="项目名称，如：开工红包">
        <input type="number" id="exclude-amount" min="0" step="0.01" placeholder="金额">
        <button class="la-btn la-btn-sm" id="btn-add-exclude">添加</button>
      </div>
      <span class="la-note">具有福利性质、随机发放的一次性收入通常不计入经济补偿基数</span>
    </div>

    <div class="la-form-row">
      <label>基本工资（元）<span class="la-required">*</span></label>
      <input type="number" id="base-salary" min="0" step="0.01" placeholder="如：8000">
      <span class="la-note"><strong style="color:#d9534f;">日均工资 = 基本工资 ÷ 21.75</strong>。填写劳动合同约定的基本工资（或底薪），年假赔偿将严格按此计算</span>
    </div>

    <div class="la-actions">
      <button class="la-btn la-btn-primary" id="btn-calc-avg">计算平均工资</button>
      <button class="la-btn la-btn-ghost" id="btn-fill-sample">填入示例数据</button>
    </div>
    <div class="la-result-box" id="avg-result">
      <div class="la-result-item">
        <span class="la-result-label">计入项目合计</span>
        <span class="la-result-value" id="avg-total-in">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">不计入项目合计</span>
        <span class="la-result-value" id="avg-total-ex">--</span>
      </div>
      <div class="la-divider"></div>
      <div class="la-result-item">
        <span class="la-result-label">月平均工资</span>
        <span class="la-result-value" id="avg-monthly">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">日平均工资</span>
        <span class="la-result-value" id="avg-daily">--</span>
      </div>
      <div class="la-formula-panel" id="avg-formula" style="display:none;">
        <div class="la-panel-title">计算过程</div>
        <div id="avg-formula-content"></div>
      </div>
    </div>
  </div>

  <div class="la-section">
    <h3>赔偿项目估算</h3>
    <div class="la-form-row">
      <label>工作年限（年）<span class="la-required">*</span></label>
      <input type="number" id="work-years" min="0" step="0.1" placeholder="如：3.5">
      <span class="la-note">严格按输入值计算，不做取整</span>
    </div>
    <div class="la-form-row">
      <label>离职类型</label>
      <select id="dismiss-type">
        <option value="illegal">违法解除劳动合同（2N）</option>
        <option value="legal-n">合法解除但未提前30日通知（N + 1）</option>
        <option value="legal">合法解除/协商一致（N）</option>
        <option value="resign">主动辞职（无补偿）</option>
      </select>
    </div>
    <div class="la-form-row">
      <label>未休年假天数</label>
      <input type="number" id="unpaid-leave-days" min="0" step="0.5" placeholder="如：5">
    </div>
    <div class="la-form-row">
      <label>应补加班费（元，已折算为总额）</label>
      <input type="number" id="overtime-pay" min="0" placeholder="如：5000">
    </div>
    <div class="la-form-row">
      <label>应发未发年终奖（元）</label>
      <input type="number" id="year-end-pay" min="0" placeholder="如：30000">
      <span class="la-note">如果年终奖是劳动报酬的固定组成部分且有约定/制度依据，离职时应按比例折算发放</span>
    </div>
    <div class="la-actions">
      <button class="la-btn la-btn-primary" id="btn-calc-compensation">计算赔偿总额</button>
    </div>
    <div class="la-result-box la-highlight" id="compensation-result">
      <div class="la-result-item">
        <span class="la-result-label">经济补偿金 / 赔偿金</span>
        <span class="la-result-value" id="compensation-main">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">日均工资</span>
        <span class="la-result-value" id="compensation-daily">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">未休年假工资</span>
        <span class="la-result-value" id="compensation-leave">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">加班费</span>
        <span class="la-result-value" id="compensation-overtime">--</span>
      </div>
      <div class="la-result-item">
        <span class="la-result-label">年终奖</span>
        <span class="la-result-value" id="compensation-bonus">--</span>
      </div>
      <div class="la-divider"></div>
      <div class="la-result-item la-total">
        <span class="la-result-label">赔偿总额</span>
        <span class="la-result-value" id="compensation-total">--</span>
      </div>
      <div class="la-formula-panel" id="comp-formula" style="display:none;">
        <div class="la-panel-title">赔偿计算明细</div>
        <div id="comp-formula-content"></div>
      </div>
    </div>
  </div>

  <div class="la-notice">
    <strong>声明：</strong>本工具仅依据《劳动合同法》等法规提供参考计算，实际金额以劳动仲裁委或法院裁决为准。月平均工资超过当地上年度职工月平均工资3倍的，按3倍封顶且年限不超过12年。
  </div>
</div>

<!-- 仲裁流程面板 -->
<div class="la-panel" id="panel-guide">
  <div class="la-timeline">
    <div class="la-timeline-item">
      <div class="la-timeline-dot">1</div>
      <div class="la-timeline-content">
        <h4>收集证据材料</h4>
        <ul>
          <li>劳动合同原件或复印件</li>
          <li>工资流水/工资条（银行流水、个税APP记录）</li>
          <li>社保/公积金缴纳记录</li>
          <li>考勤记录、打卡截图</li>
          <li>解除通知（书面、邮件、微信、钉钉等）</li>
          <li>工作群聊天记录（证明劳动关系及解除事实）</li>
          <li>加班审批记录或加班通知</li>
        </ul>
        <p class="la-tip">微信/钉钉记录需保留原始载体，截图后不要清理聊天记录。</p>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">2</div>
      <div class="la-timeline-content">
        <h4>计算赔偿金额</h4>
        <p>使用上方「赔偿计算器」计算经济补偿金/赔偿金、年假工资、加班费等，明确仲裁请求金额。</p>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">3</div>
      <div class="la-timeline-content">
        <h4>提交仲裁申请</h4>
        <ul>
          <li>向<strong>劳动合同履行地</strong>或<strong>用人单位所在地</strong>的劳动人事争议仲裁委员会提交</li>
          <li>准备材料：仲裁申请书（2份）、身份证复印件、证据材料复印件（按被申请人人数+1份）</li>
          <li>仲裁委一般5个工作日内决定是否受理</li>
        </ul>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">4</div>
      <div class="la-timeline-content">
        <h4>开庭审理</h4>
        <ul>
          <li>仲裁委受理后，一般45日内结案，案情复杂可延长15日</li>
          <li>开庭时带齐证据原件</li>
          <li>注意：仲裁阶段不收费</li>
        </ul>
      </div>
    </div>
    <div class="la-timeline-item">
      <div class="la-timeline-dot">5</div>
      <div class="la-timeline-content">
        <h4>领取裁决书</h4>
        <ul>
          <li>对裁决不服，可在收到裁决书<strong>15日内</strong>向法院起诉</li>
          <li>如果是「一裁终局」案件（小额争议），用人单位不可起诉，劳动者仍可起诉</li>
          <li>生效后可申请法院强制执行</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="la-section la-warning-box">
    <h4>重要时效提醒</h4>
    <ul>
      <li>劳动争议申请仲裁的时效期间为<strong>1年</strong>，从知道或应当知道权利被侵害之日起算</li>
      <li>拖欠劳动报酬争议在劳动关系存续期间不受1年限制，但终止后需在<strong>1年内</strong>提出</li>
    </ul>
  </div>

  <div class="la-section">
    <h4>法律依据速查</h4>
    <div class="la-law-grid">
      <div class="la-law-card">
        <strong>《劳动合同法》第47条</strong>
        <p>经济补偿按劳动者在本单位工作的年限，每满一年支付一个月工资的标准向劳动者支付。</p>
      </div>
      <div class="la-law-card">
        <strong>《劳动合同法》第48条</strong>
        <p>用人单位违反本法规定解除或者终止劳动合同，劳动者要求继续履行劳动合同的，用人单位应当继续履行；劳动者不要求继续履行劳动合同或者劳动合同已经不能继续履行的，用人单位应当依照本法第八十七条规定支付赔偿金。</p>
      </div>
      <div class="la-law-card">
        <strong>《劳动合同法》第87条</strong>
        <p>用人单位违反本法规定解除或者终止劳动合同的，应当依照本法第四十七条规定的经济补偿标准的二倍向劳动者支付赔偿金。</p>
      </div>
      <div class="la-law-card">
        <strong>《职工带薪年休假条例》第5条</strong>
        <p>单位确因工作需要不能安排职工休年休假的，经职工本人同意，可以不安排职工休年休假。对职工应休未休的年休假天数，单位应当按照该职工日工资收入的300%支付年休假工资报酬。</p>
      </div>
    </div>
  </div>
</div>

<!-- 申请书模板面板 -->
<div class="la-panel" id="panel-template">
  <div class="la-section">
    <h3>仲裁申请书生成器</h3>
    <p class="la-hint">填写下方信息，自动生成规范的劳动仲裁申请书，支持复制和打印。</p>

    <div class="la-form-group">
      <h4>申请人信息</h4>
      <div class="la-form-row">
        <label>姓名</label>
        <input type="text" id="tpl-applicant-name" placeholder="张三">
      </div>
      <div class="la-form-row">
        <label>性别</label>
        <select id="tpl-applicant-gender">
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
      </div>
      <div class="la-form-row">
        <label>民族</label>
        <input type="text" id="tpl-applicant-ethnic" placeholder="汉族">
      </div>
      <div class="la-form-row">
        <label>出生日期</label>
        <input type="date" id="tpl-applicant-birth">
      </div>
      <div class="la-form-row">
        <label>身份证号码</label>
        <input type="text" id="tpl-applicant-id" placeholder="110101199001011234">
      </div>
      <div class="la-form-row">
        <label>户籍所在地</label>
        <input type="text" id="tpl-applicant-huji" placeholder="北京市朝阳区建国路88号">
      </div>
      <div class="la-form-row">
        <label>现住址</label>
        <input type="text" id="tpl-applicant-address" placeholder="北京市海淀区中关村大街66号院3号楼202室">
      </div>
      <div class="la-form-row">
        <label>联系电话</label>
        <input type="text" id="tpl-applicant-phone" placeholder="13800138000">
      </div>
      <div class="la-form-row">
        <label>确认有效的通讯地址（用于接收法律文书）</label>
        <input type="text" id="tpl-applicant-delivery" placeholder="与现住址相同或另填">
      </div>
    </div>

    <div class="la-form-group">
      <h4>被申请人信息</h4>
      <div class="la-form-row">
        <label>单位全称（须与营业执照一致）</label>
        <input type="text" id="tpl-company-name" placeholder="北京XX科技有限公司">
      </div>
      <div class="la-form-row">
        <label>住所地</label>
        <input type="text" id="tpl-company-address" placeholder="北京市朝阳区望京SOHO中心T2座18层">
      </div>
      <div class="la-form-row">
        <label>统一社会信用代码</label>
        <input type="text" id="tpl-company-code" placeholder="91110000MA01XXXXX">
      </div>
      <div class="la-form-row">
        <label>法定代表人（主要负责人）</label>
        <input type="text" id="tpl-company-legal" placeholder="李强">
      </div>
      <div class="la-form-row">
        <label>职务</label>
        <input type="text" id="tpl-company-title" placeholder="总经理">
      </div>
      <div class="la-form-row">
        <label>联系电话</label>
        <input type="text" id="tpl-company-phone" placeholder="010-88886666">
      </div>
    </div>

    <div class="la-form-group">
      <h4>劳动用工信息</h4>
      <div class="la-form-row">
        <label>入职日期</label>
        <input type="date" id="tpl-start-date">
      </div>
      <div class="la-form-row">
        <label>离职日期</label>
        <input type="date" id="tpl-end-date">
      </div>
      <div class="la-form-row">
        <label>工作岗位</label>
        <input type="text" id="tpl-position" placeholder="高级软件工程师">
      </div>
      <div class="la-form-row">
        <label>月工资标准（元，税前）</label>
        <input type="number" id="tpl-salary" min="0" step="0.01" placeholder="12000">
      </div>
      <div class="la-form-row">
        <label>劳动合同期限</label>
        <input type="text" id="tpl-contract-term" placeholder="2022年8月1日至2025年7月31日">
      </div>
      <div class="la-form-row">
        <label>离职原因/解除理由（公司给出）</label>
        <input type="text" id="tpl-dismiss-reason" placeholder="公司组织架构调整">
      </div>
    </div>

    <div class="la-form-group">
      <h4>仲裁请求与事实理由</h4>
      <div class="la-form-row">
        <label>仲裁请求（逐条填写，每条一行，涉及金额需写明计算方式）</label>
        <textarea id="tpl-requests" rows="8" placeholder="1. 请求裁决确认被申请人解除劳动合同的行为违法；
2. 请求裁决被申请人支付违法解除劳动合同赔偿金（2N）共计人民币96,000元；（计算方式：工作年限4年×2×月平均工资12,000元=96,000元）
3. 请求裁决被申请人支付未休年休假工资共计人民币8,276元；（计算方式：月工资12,000元÷21.75天×5天×300%=8,276元）
4. 请求裁决被申请人支付2026年7月1日至2026年7月31日的工资12,000元。"></textarea>
      </div>
      <div class="la-form-row">
        <label>事实与理由</label>
        <textarea id="tpl-facts" rows="10" placeholder="写明入职时间、工作岗位、工资标准、劳动合同签订情况、争议发生的时间/原因/过程、离职时间及原因等。

示例结构：
申请人于XXXX年XX月XX日入职被申请人处，担任XX岗位，双方签订了为期X年的书面劳动合同（合同期限为XXXX年XX月XX日至XXXX年XX月XX日），约定月工资为XX,XXX元（税前），每月XX日通过银行转账方式发放上月工资。

XXXX年XX月XX日，被申请人向申请人送达《解除劳动合同通知书》，以“XX”为由单方解除劳动合同，要求申请人当日办理离职手续。申请人认为，被申请人所称的“XX”并不属于法定可以解除劳动合同的情形，且被申请人既未与申请人协商一致，也未提前三十日书面通知或支付代通知金，更未给予任何经济补偿。被申请人的行为已构成违法解除劳动合同。

根据《中华人民共和国劳动合同法》第四十八条、第八十七条的规定……

此外，申请人XXXX年度尚有X天带薪年休假未休……

综上所述，为依法维护申请人的合法权益，特向贵委申请仲裁，恳请依法裁决。"></textarea>
      </div>
    </div>

    <div class="la-form-group">
      <h4>仲裁委与日期</h4>
      <div class="la-form-row">
        <label>劳动人事争议仲裁委员会名称</label>
        <input type="text" id="tpl-committee" placeholder="北京市朝阳区劳动人事争议仲裁委员会">
      </div>
    </div>

    <div class="la-actions">
      <button class="la-btn la-btn-primary" id="btn-generate">生成申请书</button>
      <button class="la-btn la-btn-ghost" id="btn-print">打印 / 保存 PDF</button>
    </div>
  </div>

  <div class="la-section la-preview-box" id="template-preview-section" style="display:none;">
    <h3>申请书预览</h3>
    <div class="la-document" id="template-preview">
      <!-- JS 填充 -->
    </div>
  </div>
</div>

</div>

<script src="/assets/tools/labor-arbitration/app.js?v=202609221" defer></script>
