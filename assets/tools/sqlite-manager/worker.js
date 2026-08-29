/* SQLite Manager — Worker
 * 在 Worker 线程中运行 sql.js (WASM) 与 PapaParse，
 * 避免大查询 / 大 CSV 导入阻塞主线程 UI。
 * 与主线程通过 postMessage 通信：
 *   主线程 → 本 worker: { id, type, ...payload }
 *   本 worker → 主线程: { type:'ready' } | { id, type:'result', data } | { id, type:'error', error }
 */
importScripts('./lib/sql-wasm.js', './lib/papaparse.min.js');

var SQL = null;
var db = null;
var LIB = './lib/';

self.onmessage = async function (e) {
  var msg = e.data;
  var id = msg.id, type = msg.type;
  try {
    if (type === 'init') {
      SQL = await self.initSqlJs({ locateFile: function (f) { return LIB + f; } });
      self.postMessage({ type: 'ready' });
      return;
    }
    if (!SQL) throw new Error('SQLite engine not ready');
    if (!db && type !== 'new' && type !== 'open' && type !== 'close') {
      throw new Error('No database open');
    }

    if (type === 'new') {
      if (db) { try { db.close(); } catch (_) {} }
      db = new SQL.Database();
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }
    if (type === 'open') {
      if (db) { try { db.close(); } catch (_) {} }
      db = new SQL.Database(new Uint8Array(msg.bytes));
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }
    if (type === 'exec') {
      var res = db.exec(msg.sql, msg.params || []);
      self.postMessage({ id: id, type: 'result', data: res });
      return;
    }
    if (type === 'run') {
      db.run(msg.sql, msg.params || []);
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }
    if (type === 'export') {
      var bytes = db.export();
      self.postMessage({ id: id, type: 'result', data: Array.from(bytes) }, [bytes.buffer]);
      return;
    }
    if (type === 'importCsv') {
      var out = await parseAndImport(msg.file, msg.opts);
      self.postMessage({ id: id, type: 'result', data: out });
      return;
    }
    if (type === 'close') {
      if (db) { try { db.close(); } catch (_) {} db = null; }
      self.postMessage({ id: id, type: 'result', data: { ok: true } });
      return;
    }
    throw new Error('Unknown message type: ' + type);
  } catch (err) {
    self.postMessage({ id: id, type: 'error', error: err.message });
  }
};

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
  if (!rows || !rows.length) throw new Error('CSV is empty');
  var header, dataRows;
  if (opts.hasHeader) { header = rows[0]; dataRows = rows.slice(1); }
  else { header = rows[0].map(function (_, i) { return 'col' + (i + 1); }); dataRows = rows; }
  var name = (opts.name || 'imported_table').replace(/[^A-Za-z0-9_]/g, '_');
  var colTypes = header.map(function (_, ci) { return inferType(dataRows.map(function (r) { return r[ci]; })); });
  db.run('DROP TABLE IF EXISTS ' + quoteIdent(name));
  var defs = header.map(function (h, i) { return quoteIdent(h) + ' ' + colTypes[i]; }).join(', ');
  db.run('CREATE TABLE ' + quoteIdent(name) + ' (' + defs + ')');
  var ph = header.map(function () { return '?'; }).join(',');
  var colList = header.map(function (h) { return quoteIdent(h); }).join(',');
  var stmt = db.prepare('INSERT INTO ' + quoteIdent(name) + ' (' + colList + ') VALUES (' + ph + ')');
  db.run('BEGIN');
  for (var i = 0; i < dataRows.length; i++) {
    var r = dataRows[i];
    var vals = r.map(function (v, idx) {
      if (v === '') return null;
      if (colTypes[idx] === 'INTEGER') return parseInt(v, 10);
      if (colTypes[idx] === 'REAL') return parseFloat(v);
      return v;
    });
    stmt.run(vals);
  }
  stmt.free();
  db.run('COMMIT');
  return { rowCount: dataRows.length, tableName: name };
}
