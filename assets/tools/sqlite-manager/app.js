/**
 * SQLite Manager — 纯前端 SQLite 数据库管理工具
 * 基于 sql.js（SQLite 编译为 WebAssembly），所有数据在浏览器本地处理，不上传。
 *
 * 架构：SQLite 引擎与 CSV 解析运行在 Web Worker 中（assets/tools/sqlite-manager/worker.js），
 *       主线程通过 rpc() 与 Worker 通信，避免大查询 / 大文件阻塞 UI。
 *       当前数据库自动以草稿形式存入 IndexedDB，刷新后可恢复未保存内容。
 *
 * 功能：
 *   - 新建 / 打开 .sqlite|.db 文件 / 导出 .sqlite / 关闭
 *   - SQL 执行器（多语句、运行选中、结果表格、耗时、报错）
 *   - 表 / 视图树，点击浏览数据 + 表结构 + CREATE SQL
 *   - 数据 CRUD（单元格编辑、新增行、删除选中行）
 *   - 导入 CSV → 新建表；导出表为 CSV / JSON / SQL；整库导出 SQL / .sqlite
 *   - 图形化建表
 * 多语言：document.documentElement.lang === 'en' 切换 I18N 字典。
 */

(() => {
  'use strict';

  // ──────────────────────────────────────────────────
  // i18n
  // ──────────────────────────────────────────────────
  const _lang = (document.documentElement.lang === 'en') ? 'en' : 'zh';

  const I18N = {
    zh: {
      engineLoading: 'SQLite 引擎加载中…',
      engineReady: 'SQLite 引擎已就绪（本地 WASM · Worker）',
      engineError: '引擎加载失败，请刷新页面重试',
      dbNew: '新建数据库',
      dbOpen: '打开文件',
      dbSave: '保存为 .sqlite',
      dbClose: '关闭',
      importCsv: '导入 CSV',
      exportSqlite: '导出 .sqlite',
      exportDbSql: '导出整库 SQL',
      createTable: '新建表',
      sqlRun: '运行',
      sqlRunSel: '运行选中',
      sqlClear: '清空',
      sqlSample: '示例',
      sqlPlaceholder: '在此输入 SQL，例如：SELECT * FROM sqlite_master;',
      sqlStatusEmpty: '未连接数据库',
      sqlStatusOk: (n, ms) => `执行成功 · ${n} 个结果集 · ${ms} ms`,
      sqlStatusRows: (n) => `${n} 行`,
      sqlStatusErr: (m) => `错误：${m}`,
      sqlNoResult: '执行成功，无返回结果集（DDL / DML）',
      treeTables: '表',
      treeViews: '视图',
      treeEmpty: '暂无对象。新建或打开一个数据库开始。',
      dbMeta: (t, v) => `表 ${t} · 视图 ${v}`,
      tabData: '数据',
      tabStructure: '结构',
      tabSql: 'SQL',
      tabResult: '结果',
      colRowid: '#',
      browseEmpty: '该对象没有数据',
      noDb: '尚未连接数据库',
      selectTableHint: '从左侧选择一张表或视图开始浏览，或在上方的 SQL 编辑器中执行查询。',
      addRow: '新增行',
      deleteSelected: '删除选中',
      selectedCount: (n) => `已选 ${n} 行`,
      loadMore: '加载更多',
      totalRows: (n) => `共 ${n} 行`,
      exportCurrent: '导出当前表',
      exportCsv: 'CSV',
      exportJson: 'JSON',
      exportSql: 'SQL',
      createTitle: '新建表',
      colName: '列名',
      colType: '类型',
      colPk: '主键',
      colNotNull: '非空',
      colDefault: '默认值',
      colAdd: '添加列',
      colDelete: '删除',
      tableName: '表名',
      tableNamePh: 'my_table',
      hasHeader: '首行作为列名',
      delimiter: '分隔符',
      importTitle: '导入 CSV',
      importName: '新表名',
      importNamePh: 'imported_table',
      importConfirm: '导入',
      createConfirm: '创建',
      importDone: (n) => `已导入 ${n} 行到新表`,
      createDone: '表已创建',
      confirmDeleteTitle: '确认删除',
      confirmDelete: (n) => `确定删除选中的 ${n} 行？此操作不可撤销。`,
      cancel: '取消',
      ok: '确定',
      modalClose: '关闭',
      cellNull: 'NULL',
      setNull: '设为 NULL',
      clearNull: '清除 NULL',
      errNoDb: '请先连接数据库',
      errLoadFile: '读取文件失败：',
      errRunSql: 'SQL 执行失败：',
      errImportEmpty: 'CSV 内容为空',
      errNoTableName: '请填写表名',
      errSave: '保存失败：',
      errExport: '导出失败：',
      fileFilter: '.sqlite, .db, .sqlite3',
      dropHint: '将 .sqlite / .db 文件拖到此处，或点击「打开文件」',
      viewReadOnly: '视图为只读',
      editing: '编辑中…',
      save: '保存',
      cancelEdit: '取消',
      colAutoInc: '自增',
      sampleTitle: '示例',
      loadSample: '加载示例',
      draftRestored: '已恢复上次未保存的数据库',
    },
    en: {
      engineLoading: 'Loading SQLite engine…',
      engineReady: 'SQLite engine ready (local WASM · Worker)',
      engineError: 'Failed to load engine, please refresh',
      dbNew: 'New Database',
      dbOpen: 'Open File',
      dbSave: 'Save as .sqlite',
      dbClose: 'Close',
      importCsv: 'Import CSV',
      exportSqlite: 'Export .sqlite',
      exportDbSql: 'Export DB SQL',
      createTable: 'New Table',
      sqlRun: 'Run',
      sqlRunSel: 'Run Selection',
      sqlClear: 'Clear',
      sqlSample: 'Sample',
      sqlPlaceholder: 'Enter SQL here, e.g. SELECT * FROM sqlite_master;',
      sqlStatusEmpty: 'No database connected',
      sqlStatusOk: (n, ms) => `OK · ${n} result set(s) · ${ms} ms`,
      sqlStatusRows: (n) => `${n} rows`,
      sqlStatusErr: (m) => `Error: ${m}`,
      sqlNoResult: 'Executed successfully, no result set returned (DDL / DML)',
      treeTables: 'Tables',
      treeViews: 'Views',
      treeEmpty: 'No objects. Create or open a database to start.',
      dbMeta: (t, v) => `Tables ${t} · Views ${v}`,
      tabData: 'Data',
      tabStructure: 'Structure',
      tabSql: 'SQL',
      tabResult: 'Result',
      colRowid: '#',
      browseEmpty: 'This object has no data',
      noDb: 'No database connected',
      selectTableHint: 'Pick a table or view on the left, or run a query in the SQL editor above.',
      addRow: 'Add Row',
      deleteSelected: 'Delete Selected',
      selectedCount: (n) => `${n} selected`,
      loadMore: 'Load More',
      totalRows: (n) => `${n} rows total`,
      exportCurrent: 'Export table',
      exportCsv: 'CSV',
      exportJson: 'JSON',
      exportSql: 'SQL',
      createTitle: 'Create Table',
      colName: 'Column',
      colType: 'Type',
      colPk: 'PK',
      colNotNull: 'NN',
      colDefault: 'Default',
      colAdd: 'Add Column',
      colDelete: 'Del',
      tableName: 'Table name',
      tableNamePh: 'my_table',
      hasHeader: 'First row as header',
      delimiter: 'Delimiter',
      importTitle: 'Import CSV',
      importName: 'New table name',
      importNamePh: 'imported_table',
      importConfirm: 'Import',
      createConfirm: 'Create',
      importDone: (n) => `Imported ${n} rows into a new table`,
      createDone: 'Table created',
      confirmDeleteTitle: 'Confirm delete',
      confirmDelete: (n) => `Delete the selected ${n} row(s)? This cannot be undone.`,
      cancel: 'Cancel',
      ok: 'OK',
      modalClose: 'Close',
      cellNull: 'NULL',
      setNull: 'Set NULL',
      clearNull: 'Clear NULL',
      errNoDb: 'Please connect a database first',
      errLoadFile: 'Failed to read file: ',
      errRunSql: 'SQL error: ',
      errImportEmpty: 'CSV content is empty',
      errNoTableName: 'Please enter a table name',
      errSave: 'Save failed: ',
      errExport: 'Export failed: ',
      fileFilter: '.sqlite, .db, .sqlite3',
      dropHint: 'Drop a .sqlite / .db file here, or click "Open File"',
      viewReadOnly: 'Views are read-only',
      editing: 'Editing…',
      save: 'Save',
      cancelEdit: 'Cancel',
      colAutoInc: 'AI',
      sampleTitle: 'Sample',
      loadSample: 'Load Sample',
      draftRestored: 'Restored your unsaved database',
    },
  };

  const t = (k, ...args) => {
    const v = I18N[_lang][k];
    if (typeof v === 'function') return v(...args);
    return v == null ? k : v;
  };

  // ──────────────────────────────────────────────────
  // Worker 封装（sql.js + PapaParse 在 Worker 线程运行）
  // ──────────────────────────────────────────────────
  const WORKER_URL = '/assets/tools/sqlite-manager/worker.js?v=5';
  let worker = null;
  let workerReady = false;
  let reqId = 0;
  const pending = {};

  function initWorker() {
    return new Promise((resolve, reject) => {
      try {
        worker = new Worker(WORKER_URL);
      } catch (e) {
        reject(e);
        return;
      }
      worker.onmessage = (e) => {
        const m = e.data;
        if (m.type === 'ready') { workerReady = true; resolve(); return; }
        if (m.id != null && pending[m.id]) {
          const p = pending[m.id];
          delete pending[m.id];
          if (m.type === 'error') p.reject(new Error(m.error));
          else p.resolve(m.data);
        }
      };
      worker.onerror = (err) => {
        // Worker 错误（如加载失败）→ 拒绝所有挂起请求
        reject(new Error(err.message || 'worker error'));
      };
      worker.postMessage({ type: 'init' });
    });
  }

  function rpc(type, payload, transfer) {
    return new Promise((resolve, reject) => {
      const id = ++reqId;
      pending[id] = { resolve, reject };
      const msg = Object.assign({ id, type }, payload || {});
      if (transfer) worker.postMessage(msg, transfer);
      else worker.postMessage(msg);
    });
  }

  // ──────────────────────────────────────────────────
  // IndexedDB 草稿（自动恢复未保存数据库）
  // ──────────────────────────────────────────────────
  const IDB_NAME = 'sqlite-manager', IDB_STORE = 'drafts', IDB_KEY = 'current';
  let idb = null;
  let saveTimer = null;

  function openIdb() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  async function saveDraft(bytes) {
    try {
      if (!idb) idb = await openIdb();
      await new Promise((res, rej) => {
        const tx = idb.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(bytes, IDB_KEY);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
    } catch (e) { /* 草稿保存失败不阻塞主流程 */ }
  }

  async function loadDraft() {
    try {
      if (!idb) idb = await openIdb();
      return await new Promise((res, rej) => {
        const tx = idb.transaction(IDB_STORE, 'readonly');
        const r = tx.objectStore(IDB_STORE).get(IDB_KEY);
        r.onsuccess = () => res(r.result || null);
        r.onerror = () => rej(r.error);
      });
    } catch (e) { return null; }
  }

  async function clearDraft() {
    try {
      if (!idb) idb = await openIdb();
      await new Promise((res) => {
        const tx = idb.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(IDB_KEY);
        tx.oncomplete = res;
        tx.onerror = res;
      });
    } catch (e) {}
  }

  // 写操作后标记脏，防抖 1s 后把当前库快照存入 IndexedDB
  function markDirty() {
    if (!state.hasDb) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        const arr = await rpc('export');
        await saveDraft(new Uint8Array(arr));
      } catch (e) {}
    }, 1000);
  }

  // ──────────────────────────────────────────────────
  // 工具函数
  // ──────────────────────────────────────────────────
  const $ = (sel, root = document) => root.querySelector(sel);

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function quoteIdent(name) {
    return '"' + String(name).replace(/"/g, '""') + '"';
  }

  function isBlob(v) { return typeof Uint8Array !== 'undefined' && v instanceof Uint8Array; }

  function displayValue(v) {
    if (v === null || v === undefined) return null;
    if (isBlob(v)) return `[BLOB ${v.length} bytes]`;
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  function formatCell(v) {
    if (v === null || v === undefined) {
      return `<span class="sm-cell-null">${t('cellNull')}</span>`;
    }
    if (isBlob(v)) return escapeHtml(`[BLOB ${v.length} bytes]`);
    if (typeof v === 'object') return escapeHtml(JSON.stringify(v));
    return escapeHtml(String(v));
  }

  function csvEscape(v) {
    if (v === null || v === undefined) return '';
    const s = isBlob(v) ? `[BLOB ${v.length}]` : (typeof v === 'object' ? JSON.stringify(v) : String(v));
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function download(filename, content, mime) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  let toastTimer = null;
  function toast(msg, type) {
    let wrap = $('.sm-toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.className = 'sm-toast-wrap';
      document.body.appendChild(wrap);
    }
    const el = document.createElement('div');
    el.className = 'sm-toast' + (type ? ' ' + type : '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2600);
  }

  // ──────────────────────────────────────────────────
  // 状态
  // ──────────────────────────────────────────────────
  const state = {
    hasDb: false,
    dbName: '',
    tables: [],   // {name, type:'table'}
    views: [],    // {name, type:'view'}
    currentTable: null,
    isView: false,
    mode: 'empty',     // 'empty' | 'browse' | 'query'
    rows: [],          // 当前展示行（不含 _rowid_）
    rowids: [],        // 对应行 rowid
    displayCols: [],   // 列名（不含 _rowid_）
    schema: [],        // [{cid,name,type,notnull,dflt_value,pk}]
    createSql: '',
    queryResults: [],  // [{columns, values}]
    queryError: null,
    offset: 0,
    perPage: 1000,
    totalRows: 0,
    browseTab: 'data', // 'data' | 'structure' | 'sql'
    selectedRows: new Set(),
    draftRow: false,
    activeQueryTab: 0,
  };

  let el = {};

  // ──────────────────────────────────────────────────
  // 渲染：骨架 + 各区域
  // ──────────────────────────────────────────────────
  function buildSkeleton() {
    el.app.innerHTML = `
      <div class="sm-toolbar">
        <button class="sm-btn sm-btn-primary" data-action="new-db"><i class="fas fa-plus"></i>${t('dbNew')}</button>
        <button class="sm-btn" data-action="open-file"><i class="fas fa-folder-open"></i>${t('dbOpen')}</button>
        <button class="sm-btn" data-action="load-sample"><i class="fas fa-vial"></i>${t('loadSample')}</button>
        <button class="sm-btn" data-action="save-db" data-need-db><i class="fas fa-download"></i>${t('dbSave')}</button>
        <button class="sm-btn" data-action="import-csv" data-need-db><i class="fas fa-file-csv"></i>${t('importCsv')}</button>
        <button class="sm-btn" data-action="export-sqlite" data-need-db><i class="fas fa-database"></i>${t('exportSqlite')}</button>
        <button class="sm-btn" data-action="export-db-sql" data-need-db><i class="fas fa-file-export"></i>${t('exportDbSql')}</button>
        <button class="sm-btn" data-action="create-table" data-need-db><i class="fas fa-table"></i>${t('createTable')}</button>
        <span class="sm-engine" id="sm-engine"><span class="sm-dot"></span><span id="sm-engine-text">${t('engineLoading')}</span></span>
        <input type="file" id="sm-file-input" accept=".sqlite,.db,.sqlite3" hidden>
      </div>
      <div class="sm-body">
        <div class="sm-sidebar">
          <div class="sm-sidebar-head">
            <span id="sm-db-name">—</span>
            <span class="sm-db-meta" id="sm-db-meta"></span>
          </div>
          <div class="sm-tree" id="sm-tree"></div>
        </div>
        <div class="sm-main">
          <div class="sm-sql-pane">
            <div class="sm-sql-bar">
              <button class="sm-btn sm-btn-primary sm-btn-sm" data-action="run-sql" data-need-db><i class="fas fa-play"></i>${t('sqlRun')}</button>
              <button class="sm-btn sm-btn-sm" data-action="run-sel" data-need-db><i class="fas fa-forward"></i>${t('sqlRunSel')}</button>
              <button class="sm-btn sm-btn-sm" data-action="sample-sql"><i class="fas fa-lightbulb"></i>${t('sqlSample')}</button>
              <button class="sm-btn sm-btn-sm sm-btn-ghost" data-action="clear-sql"><i class="fas fa-eraser"></i>${t('sqlClear')}</button>
              <span class="sm-spacer"></span>
              <span class="sm-sql-status" id="sm-sql-status">${t('sqlStatusEmpty')}</span>
            </div>
            <textarea class="sm-sql-editor" id="sm-sql" spellcheck="false" placeholder="${t('sqlPlaceholder')}"></textarea>
          </div>
          <div class="sm-result" id="sm-result">
            <div class="sm-tabs" id="sm-tabs"></div>
            <div class="sm-tab-body" id="sm-tab-body"></div>
          </div>
        </div>
      </div>`;
    el.tree = $('#sm-tree');
    el.tabs = $('#sm-tabs');
    el.tabBody = $('#sm-tab-body');
    el.sqlEditor = $('#sm-sql');
    el.sqlStatus = $('#sm-sql-status');
    el.dbName = $('#sm-db-name');
    el.dbMeta = $('#sm-db-meta');
    el.engine = $('#sm-engine');
    el.engineText = $('#sm-engine-text');
    el.fileInput = $('#sm-file-input');
  }

  function setEngine(status, msg) {
    if (!el.engine) return;
    el.engine.className = 'sm-engine' + (status === 'ready' ? ' ready' : status === 'error' ? ' error' : '');
    el.engineText.textContent = msg;
  }

  function updateNeedDbButtons() {
    const has = state.hasDb;
    document.querySelectorAll('[data-need-db]').forEach((b) => { b.disabled = !has; });
  }

  function renderTree() {
    if (!state.hasDb) {
      el.tree.innerHTML = `<div class="sm-tree-empty">${t('treeEmpty')}</div>`;
      el.dbName.textContent = '—';
      el.dbMeta.textContent = '';
      return;
    }
    el.dbName.textContent = state.dbName;
    el.dbMeta.textContent = t('dbMeta', state.tables.length, state.views.length);
    let html = '';
    if (state.tables.length) {
      html += `<div class="sm-tree-group"><div class="sm-tree-group-title"><i class="fas fa-table"></i>${t('treeTables')} (${state.tables.length})</div>`;
      for (const tb of state.tables) {
        const active = (!state.isView && state.currentTable === tb.name) ? ' active' : '';
        html += `<button class="sm-tree-item${active}" data-action="browse" data-name="${escapeHtml(tb.name)}" data-type="table"><span class="sm-tree-icon"><i class="fas fa-table"></i></span>${escapeHtml(tb.name)}</button>`;
      }
      html += `</div>`;
    }
    if (state.views.length) {
      html += `<div class="sm-tree-group"><div class="sm-tree-group-title"><i class="fas fa-eye"></i>${t('treeViews')} (${state.views.length})</div>`;
      for (const vw of state.views) {
        const active = (state.isView && state.currentTable === vw.name) ? ' active' : '';
        html += `<button class="sm-tree-item${active}" data-action="browse" data-name="${escapeHtml(vw.name)}" data-type="view"><span class="sm-tree-icon"><i class="fas fa-eye"></i></span>${escapeHtml(vw.name)}</button>`;
      }
      html += `</div>`;
    }
    if (!state.tables.length && !state.views.length) {
      html = `<div class="sm-tree-empty">${t('treeEmpty')}</div>`;
    }
    el.tree.innerHTML = html;
  }

  function renderTabs() {
    let html = '';
    if (state.mode === 'browse') {
      html += tabBtn('data', t('tabData'), state.browseTab === 'data');
      html += tabBtn('structure', t('tabStructure'), state.browseTab === 'structure');
      html += tabBtn('sql', t('tabSql'), state.browseTab === 'sql');
    } else if (state.mode === 'query') {
      if (state.queryResults.length === 0) {
        html += `<span class="sm-tab active">${t('tabResult')}</span>`;
      } else {
        state.queryResults.forEach((r, i) => {
          html += tabBtn('q' + i, `${t('tabResult')} ${i + 1}`, state.activeQueryTab === i);
        });
      }
    }
    el.tabs.innerHTML = html;
  }

  function tabBtn(id, label, active) {
    return `<button class="sm-tab${active ? ' active' : ''}" data-action="tab" data-tab="${id}">${label}</button>`;
  }

  function renderTabBody() {
    if (state.mode === 'browse') {
      if (state.browseTab === 'data') return renderDataPane();
      if (state.browseTab === 'structure') return renderStructurePane();
      if (state.browseTab === 'sql') return renderSqlPane();
    } else if (state.mode === 'query') {
      if (state.queryError) {
        return `<div class="sm-pane-pad"><div class="sm-sql-status err" style="font-size:.9rem">${escapeHtml(state.queryError)}</div></div>`;
      }
      if (state.queryResults.length === 0) {
        return `<div class="sm-empty"><i class="fas fa-check-circle"></i><div>${t('sqlNoResult')}</div></div>`;
      }
      const r = state.queryResults[state.activeQueryTab] || state.queryResults[0];
      return renderResultSet(r, false);
    }
    return renderWelcome();
  }

  function renderWelcome() {
    return `<div class="sm-empty">
      <i class="fas fa-database"></i>
      <div class="sm-empty-title">${t('noDb')}</div>
      <div>${t('selectTableHint')}</div>
      <div style="font-size:.8rem;margin-top:.4rem">${t('dropHint')}</div>
    </div>`;
  }

  function renderResultSet(result, editable) {
    if (!result || !result.columns || result.columns.length === 0) {
      return `<div class="sm-empty"><div>${t('browseEmpty')}</div></div>`;
    }
    const cols = result.columns;
    let head = '<tr><th class="sm-col-idx">#</th>' + cols.map((c) => `<th>${escapeHtml(c)}</th>`).join('') + '</tr>';
    let body = '';
    const rows = result.values || [];
    if (rows.length === 0) {
      body = `<tr><td colspan="${cols.length + 1}" class="sm-empty" style="position:static">${t('browseEmpty')}</td></tr>`;
    } else {
      rows.forEach((row, ri) => {
        body += `<tr><td class="sm-col-idx">${ri + 1}</td>` +
          row.map((v) => `<td class="sm-cell" data-ri="${ri}">${formatCell(v)}</td>`).join('') + '</tr>';
      });
    }
    return `<div class="sm-table-wrap"><table class="sm-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  }

  function renderDataPane() {
    if (!state.currentTable) return renderWelcome();
    // 工具条
    let bar = `<div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;padding:.5rem .7rem;border-bottom:1px solid var(--sm-border);background:var(--sm-bg)">`;
    if (!state.isView) {
      bar += `<button class="sm-btn sm-btn-sm sm-btn-primary" data-action="add-row"><i class="fas fa-plus"></i>${t('addRow')}</button>`;
      bar += `<button class="sm-btn sm-btn-sm sm-btn-danger" data-action="delete-selected" id="sm-del-btn" disabled><i class="fas fa-trash"></i>${t('deleteSelected')}</button>`;
    } else {
      bar += `<span style="font-size:.8rem;color:var(--sm-text-muted)"><i class="fas fa-lock"></i> ${t('viewReadOnly')}</span>`;
    }
    bar += `<span class="sm-spacer"></span>`;
    bar += `<span class="sm-sql-status" style="font-size:.76rem">${t('totalRows', state.totalRows)}</span>`;
    bar += `<button class="sm-btn sm-btn-sm sm-btn-ghost" data-action="export-current"><i class="fas fa-download"></i>${t('exportCurrent')}</button>`;
    bar += `</div>`;

    if (state.rows.length === 0 && !state.draftRow) {
      return bar + `<div class="sm-empty"><div>${t('browseEmpty')}</div></div>`;
    }

    const cols = state.displayCols;
    let head = '<tr><th class="sm-col-idx">#</th>';
    if (!state.isView) head += '<th></th>';
    head += cols.map((c, ci) => {
      const sc = state.schema.find((s) => s.name === c);
      const pk = sc && sc.pk ? ' <span class="sm-tag sm-tag-pk">PK</span>' : '';
      return `<th>${escapeHtml(c)}${pk}</th>`;
    }).join('') + '</tr>';

    let body = '';
    state.rows.forEach((row, ri) => {
      let tr = `<tr data-ri="${ri}"><td class="sm-col-idx">${ri + 1 + state.offset}</td>`;
      if (!state.isView) {
        tr += `<td class="sm-row-actions"><input type="checkbox" class="sm-row-check" data-action="row-check" data-ri="${ri}"></td>`;
      }
      tr += row.map((v, ci) => `<td class="sm-cell" data-ri="${ri}" data-ci="${ci}">${formatCell(v)}</td>`).join('') + '</tr>';
      body += tr;
    });

    // 新增行草稿
    if (state.draftRow && !state.isView) {
      body += renderDraftRow(cols);
    }

    const table = `<div class="sm-table-wrap"><table class="sm-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
    const more = (state.rows.length >= state.perPage && state.totalRows > state.rows.length)
      ? `<div style="padding:.6rem;text-align:center"><button class="sm-btn sm-btn-sm" data-action="load-more">${t('loadMore')}</button></div>` : '';
    return bar + table + more;
  }

  function renderDraftRow(cols) {
    // 草稿行：与正常行同结构（# + actions + 每列 input），让每个 input 落到自己的列 td 里。
    // 之前的实现把 <td> 塞进 colspan 的 flex div，脱离表格列布局，input 溢出到表格外。
    let tr = `<tr class="sm-add-row">`;
    tr += `<td class="sm-col-idx">+</td>`;
    tr += `<td class="sm-row-actions"></td>`;
    cols.forEach((c, i) => {
      const sc = state.schema.find((s) => s.name === c);
      const type = (sc && /INT|REAL|NUM/i.test(sc.type || '')) ? 'number' : 'text';
      const placeholder = sc ? (sc.dflt_value != null ? String(sc.dflt_value) : '') : '';
      const isLast = i === cols.length - 1;
      if (isLast) {
        tr += `<td><div class="sm-draft-actions"><input class="sm-cell-input" data-draft-col="${escapeHtml(c)}" type="${type}" placeholder="${escapeHtml(placeholder)}"><button class="sm-btn sm-btn-sm sm-btn-primary" data-action="draft-save" title="${t('save')}"><i class="fas fa-check"></i></button><button class="sm-btn sm-btn-sm" data-action="draft-cancel" title="${t('cancel')}"><i class="fas fa-times"></i></button></div></td>`;
      } else {
        tr += `<td><input class="sm-cell-input" data-draft-col="${escapeHtml(c)}" type="${type}" placeholder="${escapeHtml(placeholder)}"></td>`;
      }
    });
    tr += `</tr>`;
    return tr;
  }

  function renderStructurePane() {
    if (!state.currentTable) return renderWelcome();
    let html = `<div class="sm-pane-pad">`;
    if (state.schema.length) {
      html += `<table class="sm-schema-table"><thead><tr><th>${t('colName')}</th><th>${t('colType')}</th><th>PK</th><th>NN</th><th>${t('colDefault')}</th></tr></thead><tbody>`;
      html += state.schema.map((s) => `<tr>
        <td>${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.type || '')}</td>
        <td>${s.pk ? '<span class="sm-tag sm-tag-pk">PK</span>' : ''}</td>
        <td>${s.notnull ? '<span class="sm-tag sm-tag-nn">NN</span>' : ''}</td>
        <td>${s.dflt_value == null ? '' : escapeHtml(String(s.dflt_value))}</td>
      </tr>`).join('');
      html += `</tbody></table>`;
    } else {
      html += `<div class="sm-tree-empty">${t('viewReadOnly')}</div>`;
    }
    if (state.createSql) {
      html += `<div class="sm-create-sql">${escapeHtml(state.createSql)}</div>`;
    }
    html += `</div>`;
    return html;
  }

  function renderSqlPane() {
    if (!state.createSql) return `<div class="sm-pane-pad sm-tree-empty">—</div>`;
    return `<div class="sm-pane-pad"><pre class="sm-create-sql" style="white-space:pre-wrap">${escapeHtml(state.createSql)}</pre></div>`;
  }

  function render() {
    renderTree();
    renderTabs();
    el.tabBody.innerHTML = renderTabBody();
    updateNeedDbButtons();
    const del = $('#sm-del-btn');
    if (del) { del.disabled = state.selectedRows.size === 0; del.textContent = state.selectedRows.size ? t('selectedCount', state.selectedRows.size) : t('deleteSelected'); }
  }

  // ──────────────────────────────────────────────────
  // 数据库操作（全部经 Worker 执行）
  // ──────────────────────────────────────────────────
  async function refreshSchema() {
    const res = await rpc('exec', {
      sql: "SELECT name, type FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type, name",
    });
    state.tables = [];
    state.views = [];
    if (res.length) {
      for (const row of res[0].values) {
        const name = row[0], type = row[1];
        if (type === 'view') state.views.push({ name, type });
        else state.tables.push({ name, type });
      }
    }
  }

  async function newDb() {
    await rpc('new');
    state.hasDb = true;
    state.dbName = 'untitled.sqlite';
    state.currentTable = null;
    state.isView = false;
    state.mode = 'empty';
    state.selectedRows.clear();
    state.draftRow = false;
    await refreshSchema();
    render();
    toast(t('dbNew'));
    markDirty();
  }

  async function openFile(file) {
    if (!workerReady) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const u8 = new Uint8Array(reader.result);
        await rpc('open', { bytes: u8 }, [u8.buffer]);
        state.hasDb = true;
        state.dbName = file.name;
        state.currentTable = null;
        state.isView = false;
        state.mode = 'empty';
        state.selectedRows.clear();
        state.draftRow = false;
        await refreshSchema();
        render();
        toast(t('dbMeta', state.tables.length, state.views.length));
        markDirty();
      } catch (e) {
        toast(t('errLoadFile') + e.message, 'err');
      }
    };
    reader.onerror = () => toast(t('errLoadFile') + 'IO', 'err');
    reader.readAsArrayBuffer(file);
  }

  async function saveDb() {
    if (!state.hasDb) { toast(t('errNoDb'), 'err'); return; }
    try {
      const arr = await rpc('export');
      const data = new Uint8Array(arr);
      download(state.dbName || 'database.sqlite', new Blob([data]), 'application/x-sqlite3');
      toast(t('dbSave'), 'ok');
    } catch (e) {
      toast(t('errSave') + e.message, 'err');
    }
  }

  async function closeDb() {
    await rpc('close').catch(() => {});
    state.hasDb = false;
    state.dbName = '';
    state.tables = [];
    state.views = [];
    state.currentTable = null;
    state.mode = 'empty';
    state.selectedRows.clear();
    state.draftRow = false;
    clearDraft();
    render();
  }

  // ──────────────────────────────────────────────────
  // 浏览 / CRUD
  // ──────────────────────────────────────────────────
  async function getTableInfo(name, type) {
    if (type === 'view') {
      const r = await rpc('exec', { sql: `SELECT * FROM ${quoteIdent(name)} LIMIT 0` });
      const cols = r.length ? r[0].columns : [];
      return cols.map((c) => ({ cid: 0, name: c, type: '', notnull: 0, dflt_value: null, pk: 0 }));
    }
    const r = await rpc('exec', { sql: `PRAGMA table_info(${quoteIdent(name)})` });
    if (!r.length) return [];
    return r[0].values.map((row) => ({
      cid: row[0], name: row[1], type: row[2], notnull: row[3], dflt_value: row[4], pk: row[5],
    }));
  }

  async function getCreateSql(name) {
    const r = await rpc('exec', { sql: `SELECT sql FROM sqlite_master WHERE name = ?`, params: [name] });
    if (r.length && r[0].values.length) return r[0].values[0][0] || '';
    return '';
  }

  async function countRows(name) {
    try {
      const r = await rpc('exec', { sql: `SELECT COUNT(*) FROM ${quoteIdent(name)}` });
      return r.length ? Number(r[0].values[0][0]) : 0;
    } catch (e) { return 0; }
  }

  async function browseTable(name, type) {
    if (!state.hasDb) return;
    state.currentTable = name;
    state.isView = type === 'view';
    state.mode = 'browse';
    state.browseTab = 'data';
    state.offset = 0;
    state.selectedRows.clear();
    state.draftRow = false;
    state.schema = await getTableInfo(name, type);
    state.createSql = await getCreateSql(name);
    await loadData(0);
    render();
  }

  async function loadData(offset) {
    const cols = state.isView
      ? `SELECT * FROM ${quoteIdent(state.currentTable)}`
      : `SELECT rowid AS _rowid_, * FROM ${quoteIdent(state.currentTable)}`;
    const sql = `${cols} LIMIT ? OFFSET ?`;
    const r = await rpc('exec', { sql, params: [state.perPage, offset] });
    const result = r.length ? r[0] : { columns: ['_rowid_'], values: [] };
    const all = result.values;
    if (offset === 0) {
      state.rowids = [];
      state.rows = [];
      state.displayCols = result.columns.slice(1);
    }
    for (const row of all) {
      state.rowids.push(state.isView ? null : row[0]);
      state.rows.push(row.slice(1));
    }
    state.offset = offset + all.length;
    state.totalRows = await countRows(state.currentTable);
  }

  async function loadMore() {
    await loadData(state.offset);
    render();
  }

  async function updateCell(ri, ci, value) {
    const col = state.displayCols[ci];
    const rowid = state.rowids[ri];
    if (rowid == null) { toast(t('viewReadOnly'), 'err'); return; }
    try {
      await rpc('run', { sql: `UPDATE ${quoteIdent(state.currentTable)} SET ${quoteIdent(col)} = ? WHERE rowid = ?`, params: [value, rowid] });
      state.rows[ri][ci] = value;
      render();
      markDirty();
    } catch (e) {
      toast(t('errRunSql') + e.message, 'err');
      render();
    }
  }

  async function deleteSelected() {
    const idxs = [...state.selectedRows];
    if (!idxs.length) return;
    if (!confirm(t('confirmDelete', idxs.length))) return;
    const ids = idxs.map((i) => state.rowids[i]).filter((x) => x != null);
    if (!ids.length) return;
    try {
      const ph = ids.map(() => '?').join(',');
      await rpc('run', { sql: `DELETE FROM ${quoteIdent(state.currentTable)} WHERE rowid IN (${ph})`, params: ids });
      state.selectedRows.clear();
      state.offset = 0;
      await loadData(0);
      render();
      toast(t('ok'), 'ok');
      markDirty();
    } catch (e) {
      toast(t('errRunSql') + e.message, 'err');
    }
  }

  async function insertDraft() {
    const inputs = el.tabBody.querySelectorAll('[data-draft-col]');
    const cols = [], vals = [];
    inputs.forEach((inp) => {
      cols.push(inp.getAttribute('data-draft-col'));
      const raw = inp.value;
      if (raw === '' && inp.type !== 'number') vals.push(null);
      else if (inp.type === 'number' && raw === '') vals.push(null);
      else if (inp.type === 'number') vals.push(Number(raw));
      else vals.push(raw);
    });
    if (!cols.length) return;
    try {
      const ph = cols.map(() => '?').join(',');
      const colList = cols.map((c) => quoteIdent(c)).join(',');
      await rpc('run', { sql: `INSERT INTO ${quoteIdent(state.currentTable)} (${colList}) VALUES (${ph})`, params: vals });
      state.draftRow = false;
      state.offset = 0;
      await loadData(0);
      render();
      toast(t('ok'), 'ok');
      markDirty();
    } catch (e) {
      toast(t('errRunSql') + e.message, 'err');
    }
  }

  // ──────────────────────────────────────────────────
  // SQL 执行
  // ──────────────────────────────────────────────────
  async function runSql(text) {
    if (!state.hasDb) { toast(t('errNoDb'), 'err'); return; }
    const sql = (text != null ? text : el.sqlEditor.value).trim();
    if (!sql) return;
    const t0 = performance.now();
    try {
      const results = await rpc('exec', { sql });
      const ms = Math.round(performance.now() - t0);
      state.mode = 'query';
      state.queryResults = results;
      state.queryError = null;
      state.activeQueryTab = 0;
      el.sqlStatus.className = 'sm-sql-status ok';
      el.sqlStatus.textContent = results.length
        ? t('sqlStatusOk', results.length, ms)
        : t('sqlStatusRows', 0) + ' · ' + ms + ' ms';
      render();
      markDirty();
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      state.mode = 'query';
      state.queryResults = [];
      state.queryError = t('errRunSql') + e.message;
      el.sqlStatus.className = 'sm-sql-status err';
      el.sqlStatus.textContent = t('sqlStatusErr', e.message);
      render();
    }
  }

  function sampleSql() {
    el.sqlEditor.value = `CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER,
  email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, age, email) VALUES
  ('Ada Lovelace', 36, 'ada@example.com'),
  ('Alan Turing', 41, 'alan@example.com'),
  ('Grace Hopper', 85, 'grace@example.com');

SELECT * FROM users ORDER BY age DESC;`;
  }

  // ──────────────────────────────────────────────────
  // 导入 / 导出
  // ──────────────────────────────────────────────────
  async function loadSample() {
    if (!workerReady) { toast(t('engineLoading'), 'err'); return; }
    try {
      const url = '/assets/tools/sqlite-manager/sample.sqlite';
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const file = new File([blob], 'sample.sqlite', { type: 'application/x-sqlite3' });
      await openFile(file);
    } catch (e) {
      toast(t('errLoadFile') + e.message, 'err');
    }
  }

  function importCsvFromFile(file) {
    if (!state.hasDb) { toast(t('errNoDb'), 'err'); return; }
    openImportModal(file);
  }

  async function doImportCsv(file, opts) {
    try {
      const res = await rpc('importCsv', { file, opts });
      await refreshSchema();
      state.currentTable = res.tableName;
      state.isView = false;
      state.mode = 'browse';
      state.browseTab = 'data';
      state.offset = 0;
      state.selectedRows.clear();
      state.draftRow = false;
      state.schema = [];
      state.createSql = await getCreateSql(res.tableName);
      await loadData(0);
      render();
      toast(t('importDone', res.rowCount), 'ok');
      markDirty();
    } catch (e) {
      toast(t('errRunSql') + e.message, 'err');
    }
  }

  async function exportTableCsv() {
    if (!state.currentTable) return;
    try {
      const r = await rpc('exec', { sql: `SELECT * FROM ${quoteIdent(state.currentTable)}` });
      if (!r.length) { toast(t('browseEmpty'), 'err'); return; }
      const lines = [r[0].columns.map((c) => csvEscape(c)).join(',')];
      for (const row of r[0].values) lines.push(row.map((v) => csvEscape(v)).join(','));
      download(state.currentTable + '.csv', lines.join('\n'), 'text/csv');
      toast(t('exportCsv'), 'ok');
    } catch (e) { toast(t('errExport') + e.message, 'err'); }
  }

  async function exportTableJson() {
    if (!state.currentTable) return;
    try {
      const r = await rpc('exec', { sql: `SELECT * FROM ${quoteIdent(state.currentTable)}` });
      if (!r.length) { toast(t('browseEmpty'), 'err'); return; }
      const objs = r[0].values.map((row) => {
        const o = {};
        r[0].columns.forEach((c, i) => { o[c] = row[i]; });
        return o;
      });
      download(state.currentTable + '.json', JSON.stringify(objs, null, 2), 'application/json');
      toast(t('exportJson'), 'ok');
    } catch (e) { toast(t('errExport') + e.message, 'err'); }
  }

  async function exportTableSql() {
    if (!state.currentTable) return;
    try {
      const r = await rpc('exec', { sql: `SELECT * FROM ${quoteIdent(state.currentTable)}` });
      if (!r.length) { toast(t('browseEmpty'), 'err'); return; }
      const cols = r[0].columns;
      const colList = cols.map((c) => quoteIdent(c)).join(', ');
      const lines = [`-- ${state.currentTable}`, `INSERT INTO ${quoteIdent(state.currentTable)} (${colList}) VALUES`];
      const vals = r[0].values.map((row) => {
        const vs = row.map((v) => {
          if (v === null) return 'NULL';
          if (isBlob(v)) return `X'${bufToHex(v)}'`;
          if (typeof v === 'number') return String(v);
          return `'${String(v).replace(/'/g, "''")}'`;
        });
        return '  (' + vs.join(', ') + ')';
      });
      lines.push(vals.join(',\n') + ';');
      download(state.currentTable + '.sql', lines.join('\n'), 'application/sql');
      toast(t('exportSql'), 'ok');
    } catch (e) { toast(t('errExport') + e.message, 'err'); }
  }

  function bufToHex(u8) {
    let s = '';
    for (let i = 0; i < u8.length; i++) s += u8[i].toString(16).padStart(2, '0');
    return s;
  }

  async function exportDbSql() {
    if (!state.hasDb) { toast(t('errNoDb'), 'err'); return; }
    try {
      const master = await rpc('exec', {
        sql: "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND sql IS NOT NULL ORDER BY type, name",
      });
      const out = ['PRAGMA foreign_keys=OFF;', 'BEGIN TRANSACTION;', ''];
      if (master.length) {
        for (const row of master[0].values) {
          const type = row[0], name = row[1], sql = row[2];
          if (type === 'table' && !/^CREATE TABLE sqlite_/.test(sql || '')) {
            out.push(sql + ';');
            out.push('');
            const data = await rpc('exec', { sql: `SELECT * FROM ${quoteIdent(name)}` });
            if (data.length && data[0].values.length) {
              const cols = data[0].columns;
              const colList = cols.map((c) => quoteIdent(c)).join(', ');
              out.push(`INSERT INTO ${quoteIdent(name)} (${colList}) VALUES`);
              const vals = data[0].values.map((r) => '  (' + r.map((v) => {
                if (v === null) return 'NULL';
                if (isBlob(v)) return `X'${bufToHex(v)}'`;
                if (typeof v === 'number') return String(v);
                return `'${String(v).replace(/'/g, "''")}'`;
              }).join(', ') + ')');
              out.push(vals.join(',\n') + ';');
              out.push('');
            }
          } else if (type === 'view' || type === 'index') {
            out.push(sql + ';');
            out.push('');
          }
        }
      }
      out.push('COMMIT;');
      download((state.dbName || 'database').replace(/\.[^.]+$/, '') + '.sql', out.join('\n'), 'application/sql');
      toast(t('exportDbSql'), 'ok');
    } catch (e) {
      toast(t('errExport') + e.message, 'err');
    }
  }

  // ──────────────────────────────────────────────────
  // 建表
  // ──────────────────────────────────────────────────
  const COL_TYPES = ['INTEGER', 'TEXT', 'REAL', 'BLOB', 'NUMERIC', 'VARCHAR(255)'];

  function openCreateModal() {
    let rows = '';
    for (let i = 0; i < 3; i++) rows += colRowHtml(i);
    const html = `
      <div class="sm-modal-head"><span>${t('createTitle')}</span><button class="sm-modal-close" data-action="modal-close">&times;</button></div>
      <div class="sm-modal-body">
        <div class="sm-field">
          <label>${t('tableName')}</label>
          <input class="sm-input" id="sm-create-name" placeholder="${t('tableNamePh')}">
        </div>
        <div>
          <div class="sm-col-head sm-col-row" style="display:grid;grid-template-columns:1.4fr 1.1fr 0.7fr 0.7fr 1.4fr auto;gap:.4rem">
            <span>${t('colName')}</span><span>${t('colType')}</span><span>${t('colPk')}</span><span>${t('colNotNull')}</span><span>${t('colDefault')}</span><span></span>
          </div>
          <div class="sm-cols-editor" id="sm-cols">${rows}</div>
          <button class="sm-btn sm-btn-sm sm-btn-ghost" data-action="col-add" style="margin-top:.4rem"><i class="fas fa-plus"></i>${t('colAdd')}</button>
        </div>
      </div>
      <div class="sm-modal-foot">
        <button class="sm-btn sm-btn-ghost" data-action="modal-close">${t('cancel')}</button>
        <button class="sm-btn sm-btn-primary" data-action="create-confirm">${t('createConfirm')}</button>
      </div>`;
    openModal(html);
  }

  function colRowHtml(i) {
    const typeOpts = COL_TYPES.map((ty) => `<option value="${ty}">${ty}</option>`).join('');
    return `<div class="sm-col-row" data-i="${i}">
      <input class="sm-input" data-c="name" placeholder="${t('colName')}">
      <select class="sm-select" data-c="type">${typeOpts}</select>
      <input type="checkbox" data-c="pk" title="${t('colPk')}">
      <input type="checkbox" data-c="nn" title="${t('colNotNull')}">
      <input class="sm-input" data-c="def" placeholder="${t('colDefault')}">
      <button class="sm-col-del" data-action="col-del" data-i="${i}">&times;</button>
    </div>`;
  }

  async function createTable() {
    const name = $('#sm-create-name').value.trim();
    if (!name) { toast(t('errNoTableName'), 'err'); return; }
    const safe = name.replace(/[^A-Za-z0-9_]/g, '_');
    const rows = [...document.querySelectorAll('#sm-cols .sm-col-row')];
    const defs = [];
    rows.forEach((row) => {
      const cname = row.querySelector('[data-c="name"]').value.trim();
      if (!cname) return;
      const type = row.querySelector('[data-c="type"]').value;
      const pk = row.querySelector('[data-c="pk"]').checked;
      const nn = row.querySelector('[data-c="nn"]').checked;
      const def = row.querySelector('[data-c="def"]').value.trim();
      let d = `${quoteIdent(cname)} ${type}`;
      if (pk) d += ' PRIMARY KEY';
      if (nn) d += ' NOT NULL';
      if (def) d += ` DEFAULT ${def}`;
      defs.push(d);
    });
    if (!defs.length) { toast(t('errNoTableName'), 'err'); return; }
    try {
      await rpc('run', { sql: `CREATE TABLE ${quoteIdent(safe)} (${defs.join(', ')})` });
      closeModal();
      await refreshSchema();
      await browseTable(safe, 'table');
      toast(t('createDone'), 'ok');
      markDirty();
    } catch (e) {
      toast(t('errRunSql') + e.message, 'err');
    }
  }

  // ──────────────────────────────────────────────────
  // 模态框
  // ──────────────────────────────────────────────────
  function openModal(innerHtml) {
    closeModal();
    const mask = document.createElement('div');
    mask.className = 'sm-modal-mask';
    mask.id = 'sm-modal-mask';
    mask.innerHTML = `<div class="sm-modal">${innerHtml}</div>`;
    document.body.appendChild(mask);
    mask.addEventListener('click', (e) => { if (e.target === mask) closeModal(); });
  }

  function closeModal() {
    const m = $('#sm-modal-mask');
    if (m) m.remove();
  }

  function openImportModal(file) {
    const base = (file && file.name ? file.name : 'imported').replace(/\.[^.]+$/, '');
    const html = `
      <div class="sm-modal-head"><span>${t('importTitle')}</span><button class="sm-modal-close" data-action="modal-close">&times;</button></div>
      <div class="sm-modal-body">
        <div class="sm-field"><label>${t('importName')}</label><input class="sm-input" id="sm-import-name" value="${escapeHtml(base)}"></div>
        <label style="display:flex;gap:.4rem;align-items:center;font-size:.85rem"><input type="checkbox" id="sm-import-header" checked> ${t('hasHeader')}</label>
        <div class="sm-field" style="max-width:160px"><label>${t('delimiter')}</label><input class="sm-input" id="sm-import-delim" value="," maxlength="1"></div>
      </div>
      <div class="sm-modal-foot">
        <button class="sm-btn sm-btn-ghost" data-action="modal-close">${t('cancel')}</button>
        <button class="sm-btn sm-btn-primary" data-action="import-confirm">${t('importConfirm')}</button>
      </div>`;
    openModal(html);
    el._importFile = file;
  }

  // ──────────────────────────────────────────────────
  // 事件委托
  // ──────────────────────────────────────────────────
  function onClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');

    switch (action) {
      case 'new-db': newDb(); break;
      case 'open-file': el.fileInput.click(); break;
      case 'load-sample': loadSample(); break;
      case 'save-db': saveDb(); break;
      case 'close-db': closeDb(); break;
      case 'import-csv': pickCsv(); break;
      case 'export-sqlite': saveDb(); break;
      case 'export-db-sql': exportDbSql(); break;
      case 'create-table': openCreateModal(); break;
      case 'run-sql': runSql(); break;
      case 'run-sel': runSql(getSelectionText()); break;
      case 'sample-sql': sampleSql(); break;
      case 'clear-sql': el.sqlEditor.value = ''; el.sqlEditor.focus(); break;
      case 'browse': browseTable(target.getAttribute('data-name'), target.getAttribute('data-type')); break;
      case 'tab': switchTab(target.getAttribute('data-tab')); break;
      case 'load-more': loadMore(); break;
      case 'add-row': state.draftRow = true; render(); break;
      case 'draft-cancel': state.draftRow = false; render(); break;
      case 'draft-save': insertDraft(); break;
      case 'delete-selected': deleteSelected(); break;
      case 'row-check': {
        const ri = Number(target.getAttribute('data-ri'));
        if (target.checked) state.selectedRows.add(ri); else state.selectedRows.delete(ri);
        const del = $('#sm-del-btn');
        if (del) { del.disabled = state.selectedRows.size === 0; del.textContent = state.selectedRows.size ? t('selectedCount', state.selectedRows.size) : t('deleteSelected'); }
        break;
      }
      case 'export-current': exportCurrentMenu(target); break;
      case 'col-add': {
        const ed = $('#sm-cols');
        const i = ed.children.length;
        ed.insertAdjacentHTML('beforeend', colRowHtml(i));
        break;
      }
      case 'col-del': target.closest('.sm-col-row').remove(); break;
      case 'create-confirm': createTable(); break;
      case 'modal-close': closeModal(); break;
      case 'import-confirm': {
        const file = el._importFile;
        const opts = {
          name: $('#sm-import-name').value.trim(),
          hasHeader: $('#sm-import-header').checked,
          delim: $('#sm-import-delim').value || ',',
        };
        closeModal();
        if (file) doImportCsv(file, opts);
        break;
      }
      case 'edit-cancel': render(); break;
    }
  }

  function getSelectionText() {
    const ta = el.sqlEditor;
    if (ta.selectionStart === ta.selectionEnd) return null;
    return ta.value.substring(ta.selectionStart, ta.selectionEnd);
  }

  function switchTab(tab) {
    if (tab === 'data') state.browseTab = 'data';
    else if (tab === 'structure') state.browseTab = 'structure';
    else if (tab === 'sql') state.browseTab = 'sql';
    else if (tab.startsWith('q')) state.activeQueryTab = Number(tab.slice(1));
    render();
  }

  function exportCurrentMenu(btn) {
    const menu = document.createElement('div');
    menu.style.cssText = 'position:fixed;z-index:10001;background:var(--sm-bg-elev);border:1px solid var(--sm-border-strong);border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.2);padding:.3rem';
    menu.innerHTML = `
      <button class="sm-btn sm-btn-sm sm-btn-ghost" data-act="csv" style="display:block;width:100%;text-align:left;margin-bottom:.25rem">${t('exportCsv')}</button>
      <button class="sm-btn sm-btn-sm sm-btn-ghost" data-act="json" style="display:block;width:100%;text-align:left;margin-bottom:.25rem">${t('exportJson')}</button>
      <button class="sm-btn sm-btn-sm sm-btn-ghost" data-act="sql" style="display:block;width:100%;text-align:left">${t('exportSql')}</button>`;
    document.body.appendChild(menu);
    const rect = btn.getBoundingClientRect();
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.style.left = rect.left + 'px';
    menu.addEventListener('click', (e) => {
      const a = e.target.getAttribute('data-act');
      if (a === 'csv') exportTableCsv();
      else if (a === 'json') exportTableJson();
      else if (a === 'sql') exportTableSql();
      menu.remove();
    });
    setTimeout(() => {
      const close = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('click', close); } };
      document.addEventListener('click', close);
    }, 0);
  }

  function onDblClick(e) {
    const td = e.target.closest('td.sm-cell');
    if (!td) return;
    if (state.isView) { toast(t('viewReadOnly'), 'err'); return; }
    const ri = Number(td.getAttribute('data-ri'));
    const ci = Number(td.getAttribute('data-ci'));
    if (isNaN(ri) || isNaN(ci)) return;
    const col = state.displayCols[ci];
    const sc = state.schema.find((s) => s.name === col);
    const cur = state.rows[ri][ci];
    const isNum = sc && /INT|REAL|NUM/i.test(sc.type || '');
    td.innerHTML = `<input class="sm-cell-input" type="${isNum ? 'number' : 'text'}" value="${cur == null ? '' : escapeHtml(String(cur))}">`;
    const inp = td.querySelector('input');
    inp.focus();
    if (cur == null) inp.select();
    const commit = () => {
      let v = inp.value;
      const newVal = (v === '' && !isNum) ? null : (isNum ? (v === '' ? null : Number(v)) : v);
      updateCell(ri, ci, newVal);
    };
    inp.addEventListener('blur', commit, { once: true });
    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') { ev.preventDefault(); inp.blur(); }
      else if (ev.key === 'Escape') { ev.preventDefault(); render(); }
    });
  }

  function pickCsv() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.csv,.txt';
    inp.onchange = () => { if (inp.files[0]) importCsvFromFile(inp.files[0]); };
    inp.click();
  }

  function onFileChange(e) {
    const f = e.target.files[0];
    if (f) openFile(f);
    e.target.value = '';
  }

  function onDragOver(e) { e.preventDefault(); }
  function onDrop(e) {
    e.preventDefault();
    if (!workerReady) return;
    const f = e.dataTransfer.files[0];
    if (f) openFile(f);
  }

  // ──────────────────────────────────────────────────
  // 初始化
  // ──────────────────────────────────────────────────
  function bindEvents() {
    document.addEventListener('click', onClick);
    el.app.addEventListener('dblclick', onDblClick);
    el.fileInput.addEventListener('change', onFileChange);
    el.app.addEventListener('dragover', onDragOver);
    el.app.addEventListener('drop', onDrop);
    // Ctrl/Cmd+Enter 运行
    el.sqlEditor.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runSql(); }
    });
  }

  async function init() {
    el.app = document.getElementById('sqlite-app');
    if (!el.app) return;
    buildSkeleton();
    bindEvents();
    setEngine('loading', t('engineLoading'));
    try {
      await initWorker();
      setEngine('ready', t('engineReady'));
      const draft = await loadDraft();
      if (draft && draft.byteLength) {
        try {
          await rpc('open', { bytes: draft }, [draft.buffer]);
          state.hasDb = true;
          state.dbName = 'recovered.sqlite';
          await refreshSchema();
          render();
          toast(t('draftRestored'), 'ok');
        } catch (e) {
          render();
        }
      } else {
        render();
      }
    } catch (e) {
      setEngine('error', t('engineError'));
      el.tabBody.innerHTML = `<div class="sm-empty"><i class="fas fa-exclamation-triangle"></i><div>${escapeHtml(e.message)}</div></div>`;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
