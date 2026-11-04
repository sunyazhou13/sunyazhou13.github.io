/* SQLite Manager — Worker（SQLCipher 版）
 *
 * 引擎：7mind/sqlcipher-wasm v1.4.0（SQLCipher 4 / OpenSSL，AES-256）
 *   - lib/sqlcipher.js   内联了 wasm 的 ESM 引擎（export default initSqlcipher）
 *   - lib/sqlite-api.js  高层封装（本仓库打过补丁，见文件内 [SQLite Manager] 标记）
 * 用 classic worker + 动态 import() 加载 ESM：这样 PapaParse 的 importScripts 仍可用，
 * 主线程 new Worker(url) 也无需改成 {type:'module'}。
 *
 * 与旧版（官方 sql.js）差异：
 *   - open 传 key 时按 SQLCipher 解密；不传则按明文打开（向后兼容）。
 *   - 库文件常驻 Emscripten MEMFS，导出/保存时自动保留加密态。
 *   - queryTyped 保留数字 / BLOB 类型；空结果集也能拿到列名（补丁）。
 *   - exec 拆成逐语句执行，支持多语句 SQL（如「示例」按钮）。
 */

importScripts('./lib/papaparse.min.js');

var sqlite = null;   // SQLiteAPI 实例
var Module = null;   // emscripten Module（含 FS）
var db = null;       // SQLiteDatabase 实例
var dbPath = null;   // 当前库在 MEMFS 中的路径
var dbKey = null;    // 当前库密码（null = 明文）

self.onmessage = async function (e) {
  var msg = e.data;
  var id = msg.id, type = msg.type;
  try {
    if (type === 'init') {
      var engine = await import('./lib/sqlcipher.js');
      Module = await engine.default();
      var api = await import('./lib/sqlite-api.js');
      sqlite = new api.SQLiteAPI(Module);
      self.postMessage({ type: 'ready' });
      return;
    }
    if (!sqlite) throw new Error('SQLite 引擎未就绪');
    if (!db && type !== 'new' && type !== 'open' && type !== 'close') {
      throw new Error('尚未打开数据库');
    }

    if (type === 'new') {
      closeDb();
      dbPath = '/mem_' + Date.now() + '.db';
      db = sqlite.open(dbPath);              // 无密码 → 明文空库
      dbKey = null;
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }

    if (type === 'open') {
      closeDb();
      dbPath = '/user_' + Date.now() + '.db';
      Module.FS.writeFile(dbPath, new Uint8Array(msg.bytes));
      var key = (msg.key && msg.key.length) ? msg.key : null;
      db = sqlite.open(dbPath, key);         // 内部即 PRAGMA key='...'
      dbKey = key;
      // 密码错时 PRAGMA key 不会立刻报错，必须真正读一次才能判定；
      // 放在 open 里验证，避免主线程误以为打开成功。
      db.queryTyped('SELECT count(*) FROM sqlite_master');
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }

    if (type === 'exec') {
      self.postMessage({ id: id, type: 'result', data: execAll(msg.sql, msg.params || []) });
      return;
    }

    if (type === 'run') {
      execAll(msg.sql, msg.params || []);
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }

    if (type === 'export') {
      var out = Module.FS.readFile(dbPath);
      self.postMessage({ id: id, type: 'result', data: Array.from(out) }, [out.buffer]);
      return;
    }

    if (type === 'importCsv') {
      var res = await parseAndImport(msg.file, msg.opts);
      self.postMessage({ id: id, type: 'result', data: res });
      return;
    }

    if (type === 'close') {
      closeDb();
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }

    throw new Error('未知消息类型: ' + type);
  } catch (err) {
    self.postMessage({ id: id, type: 'error', error: err.message });
  }
};

function closeDb() {
  if (db) { try { db.close(); } catch (_) {} db = null; }
  if (dbPath && Module && Module.FS) {
    try { Module.FS.unlink(dbPath); } catch (_) {}
  }
  dbPath = null;
  dbKey = null;
}

// queryTyped 的每个值是 {type, value} 包装；还原成 sql.js 风格的原始值
function unwrap(v) {
  if (v == null) return null;
  if (v instanceof Uint8Array) return v;          // 已是原始 BLOB
  if (typeof v === 'object' && 'type' in v) {
    if (v.type === 'bigint') return Number(v.value); // 避免 BigInt 破坏主线程 JSON/渲染
    return v.value;
  }
  return v;
}

function toResultSet(rows) {
  var columns = rows.columns || (rows.length ? Object.keys(rows[0]) : []);
  var values = rows.map(function (r) {
    return columns.map(function (c) { return unwrap(r[c]); });
  });
  return { columns: columns, values: values };
}

/* 执行 SQL 并返回 [{columns, values}, ...]（与 sql.js 的 db.exec 一致）。
 * params 非空 → 单条预编译语句；否则按分号拆分，逐条 queryTyped。
 * 只收集「有列」的语句结果（SELECT / PRAGMA），DDL/DML 静默执行。 */
function execAll(sql, params) {
  if (params && params.length) {
    var rows = db.queryTyped(sql, params);
    return rows.columns && rows.columns.length ? [toResultSet(rows)] : [];
  }
  var out = [];
  var stmts = splitStatements(sql);
  for (var i = 0; i < stmts.length; i++) {
    var r = db.queryTyped(stmts[i]);
    if (r.columns && r.columns.length) out.push(toResultSet(r));
  }
  return out;
}

/* 轻量 SQL 语句拆分：跳过引号 / 注释里的分号，并处理 TRIGGER 的 BEGIN…END 块 */
function splitStatements(sql) {
  var out = [], buf = '', i = 0, n = sql.length;
  var state = 'normal', depth = 0;
  while (i < n) {
    var c = sql[i], c2 = sql[i + 1];
    if (state === 'normal') {
      if (c === '-' && c2 === '-') { state = 'line'; buf += '--'; i += 2; continue; }
      if (c === '/' && c2 === '*') { state = 'block'; buf += '/*'; i += 2; continue; }
      if (c === "'") { state = 'single'; buf += c; i++; continue; }
      if (c === '"') { state = 'double'; buf += c; i++; continue; }
      if (c === '`') { state = 'backtick'; buf += c; i++; continue; }
      if (c === '[') { state = 'bracket'; buf += c; i++; continue; }
      if (c === ';') {
        if (depth === 0) { var s = buf.trim(); if (s) out.push(s); buf = ''; }
        else buf += c;
        i++; continue;
      }
      // 粗略识别块级关键字（只在独立单词起始时计数）
      if (isWordChar(c) && !isWordChar(sql[i - 1] || '')) {
        var rest = sql.slice(i).toUpperCase();
        if (/^BEGIN\b/.test(rest) && !/^BEGIN\s+TRANSACTION\b/.test(rest)) depth++;
        else if (/^END\b/.test(rest) && depth > 0) depth--;
      }
      buf += c; i++; continue;
    }
    if (state === 'line') {
      if (c === '\n' || c === '\r') { state = 'normal'; buf += c; i++; continue; }
      buf += c; i++; continue;
    }
    if (state === 'block') {
      if (c === '*' && c2 === '/') { state = 'normal'; buf += '*/'; i += 2; continue; }
      buf += c; i++; continue;
    }
    // 引号态：处理 SQL 的双写转义（'' / "" / `` / ]]）
    if ((state === 'single' && c === "'") || (state === 'double' && c === '"') ||
        (state === 'backtick' && c === '`') || (state === 'bracket' && c === ']')) {
      if (c2 === c || (state === 'bracket' && c2 === ']')) { buf += c + c2; i += 2; continue; }
      state = 'normal'; buf += c; i++; continue;
    }
    buf += c; i++;
  }
  var tail = buf.trim(); if (tail) out.push(tail);
  return out;
}

function isWordChar(ch) { return /[A-Za-z_]/.test(ch); }

function quoteIdent(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function inferType(values) {
  var hasInt = true, hasReal = true;
  for (var i = 0; i < values.length; i++) {
    var v = values[i];
    if (v === '' || v == null) continue;
    if (!/^-?\d+$/.test(v)) hasInt = false;
    if (!/^-?\d+(\.\d+)?$/.test(v)) hasReal = false;
  }
  if (hasInt) return 'INTEGER';
  if (hasReal) return 'REAL';
  return 'TEXT';
}

function parseAndImport(file, opts) {
  return new Promise(function (resolve, reject) {
    Papa.parse(file, {
      delimiter: opts.delim || ',',
      skipEmptyLines: true,
      complete: function (results) {
        try { resolve(buildTable(results.data, opts)); }
        catch (e) { reject(e); }
      },
      error: function (err) { reject(new Error(String(err))); },
    });
  });
}

function buildTable(rows, opts) {
  if (!rows || !rows.length) throw new Error('CSV 内容为空');
  var header, dataRows;
  if (opts.hasHeader) { header = rows[0]; dataRows = rows.slice(1); }
  else { header = rows[0].map(function (_, i) { return 'col' + (i + 1); }); dataRows = rows; }
  var name = (opts.name || 'imported_table').replace(/[^A-Za-z0-9_]/g, '_');
  var colTypes = header.map(function (_, ci) { return inferType(dataRows.map(function (r) { return r[ci]; })); });
  db.queryTyped('DROP TABLE IF EXISTS ' + quoteIdent(name));
  var defs = header.map(function (h, i) { return quoteIdent(h) + ' ' + colTypes[i]; }).join(', ');
  db.queryTyped('CREATE TABLE ' + quoteIdent(name) + ' (' + defs + ')');
  var ph = header.map(function () { return '?'; }).join(',');
  var colList = header.map(function (h) { return quoteIdent(h); }).join(',');
  var insertSql = 'INSERT INTO ' + quoteIdent(name) + ' (' + colList + ') VALUES (' + ph + ')';
  db.exec('BEGIN');
  try {
    for (var i = 0; i < dataRows.length; i++) {
      var r = dataRows[i];
      var vals = r.map(function (v, idx) {
        if (v === '') return null;
        if (colTypes[idx] === 'INTEGER') return parseInt(v, 10);
        if (colTypes[idx] === 'REAL') return parseFloat(v);
        return v;
      });
      db.queryTyped(insertSql, vals);
    }
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch (_) {}
    throw e;
  }
  return { rowCount: dataRows.length, tableName: name };
}
