/**
 * English-Chinese Smart Dictionary v4
 *
 * 改进点：
 *   1. 发音四级策略：真人音频 → 有道词典 TTS → 百度翻译 TTS → Web Speech 兜底
 *      （StreamElements 已停止免费服务，改用国内可直连的高质量 TTS）
 *   2. 全量词库一键下载 + 进度 + IndexedDB 缓存 + 一键清除缓存
 *   3. 有道风格分类标注：词性 / 考试等级 / 专业领域 / Collins 星级 / 牛津核心词
 *
 * 词库条目格式：[translation, phonetic, pos, tags[], fields[], collins, oxford]
 * 例如：["n. 腹部\n[医] 腹[部]", "'æbdәmen", "n:100", [], ["医"], 1, 0]
 * pos 字段格式："n:100"（单一词性）或 "v:2/n:98"（多词性+权重）
 */

(() => {
  'use strict';

  /* ════════════════════════════════════════════════════════════
   * i18n — 根据页面语言切换 UI 文案
   * ════════════════════════════════════════════════════════════ */

  const _lang = (document.documentElement.lang === 'en') ? 'en' : 'zh';

  const I18N = {
    zh: {
      searchBtn: '查词',
      speak: '发音',
      placeholder: '输入单词或中文，按回车或点击「查词」',
      loading: '正在查询',
      routeLoading: '查询中…',
      routeFail: '查询失败或服务不可用',
      routeLocalEmpty: '本地词库暂无释义',
      emptyInput: '请输入要查询的单词或中文',
      translateFail: '翻译服务暂时不可用，请稍后重试',
      notFound: '未找到"',
      notFoundSuffix: '"的结果，请检查拼写或换一个词试试',
      localTitle: '简明释义',
      translateTitle: '翻译结果',
      engDefsTitle: 'English Definitions',
      collinsTitle: 'Collins ',
      collinsSuffix: ' 星核心词',
      oxfordBadge: '牛津核心',
      oxfordTitle: '牛津 3000 核心词',
      sources: '来源：',
      srcLocal: '本地词库',
      srcAPI: 'Dictionary API',
      srcTranslate: 'MyMemory',
      srcEdge: 'Bing / Edge 翻译',
      zhLookupNote: '由中文「{zh}」翻译，按平行英文词 {en} 查词典',
      downloadBtn: '下载完整词库',
      downloadHint: '约 235MB，下载后离线可用',
      downloading: '下载中…',
      reDownload: '重新下载',
      downloaded: '词库已下载，重新下载',
      downloadPrepare: '准备中…',
      downloadFetching: '下载 ',
      downloadComplete: '全部完成',
      downloadError: '下载中断，请点击重试',
      downloadInterrupted: '下载中断：成功 {ok}/{total}，失败分片: {list}',
      retryFailedBtn: '重试失败分片',
      clearCache: '清除缓存',
      clearCacheConfirm: '确定清除已缓存的词库吗？清除后需重新下载才能离线查词。',
      clearing: '清除中…',
      cleared: '词库缓存已清除',
      cacheFull: '全量词库已缓存（26/26），339 万词条离线可用',
      cachePartial: '已缓存 ',
      cachePartialSuffix: '/26 个字母分区，',
      cacheDownloadLink: '下载完整词库',
      cacheNone: '未缓存词库，',
      cacheNoneLink: '点击下载全量词库',
      cacheNoneSuffix: '（约 235MB，离线可用）',
      progressUnit: ' 个字母分区，离线可用',
    },
    en: {
      searchBtn: 'Look up',
      speak: 'Pronounce',
      placeholder: 'Enter a word or Chinese text, then press Enter or click "Look up"',
      loading: 'Looking up',
      routeLoading: 'Loading…',
      routeFail: 'Unavailable',
      routeLocalEmpty: 'No local entry found',
      emptyInput: 'Please enter a word or Chinese text',
      translateFail: 'Translation service is temporarily unavailable. Please try again later.',
      notFound: 'No results for "',
      notFoundSuffix: '". Check the spelling or try another word.',
      localTitle: 'Brief Definition',
      translateTitle: 'Translation',
      engDefsTitle: 'English Definitions',
      collinsTitle: 'Collins ',
      collinsSuffix: '-star core word',
      oxfordBadge: 'Oxford 3000',
      oxfordTitle: 'Oxford 3000 core word',
      sources: 'Source: ',
      srcLocal: 'Local',
      srcAPI: 'Dictionary API',
      srcTranslate: 'MyMemory',
      srcEdge: 'Microsoft Edge Translate',
      zhLookupNote: 'Translated from Chinese "{zh}", looked up as English "{en}"',
      downloadBtn: 'Download Full Dictionary',
      downloadHint: '~235MB, enables offline lookup',
      downloading: 'Downloading…',
      reDownload: 'Re-download',
      downloaded: 'Downloaded, re-download',
      downloadPrepare: 'Preparing…',
      downloadFetching: 'Downloading ',
      downloadComplete: 'Complete',
      downloadError: 'Download interrupted, click to retry',
      downloadInterrupted: 'Download interrupted: {ok}/{total} done, failed shards: {list}',
      retryFailedBtn: 'Retry Failed Shards',
      clearCache: 'Clear Cache',
      clearCacheConfirm: 'Clear the cached dictionary? You will need to re-download it for offline lookup.',
      clearing: 'Clearing…',
      cleared: 'Dictionary cache cleared',
      cacheFull: 'Full dictionary cached (26/26), 3.4M entries available offline',
      cachePartial: 'Cached ',
      cachePartialSuffix: '/26 letter shards, ',
      cacheDownloadLink: 'Download full dictionary',
      cacheNone: 'No cache yet, ',
      cacheNoneLink: 'click to download all',
      cacheNoneSuffix: ' (~235MB, offline ready)',
      progressUnit: ' shards available offline',
    },
  };

  const T = I18N[_lang];

  /* ════════════════════════════════════════════════════════════
   * IndexedDB 词库缓存
   * ════════════════════════════════════════════════════════════ */

  const DB_NAME = 'ecdict-cache';
  const DB_VERSION = 4; // 升级到 340 万词条词库 + 修复 CORS 多源下载
  const STORE_NAME = 'shards';
  const META_STORE = 'meta';
  // 词库分片已归档到本站 assets/tools/english-dictionary/data/
  //（26 字母 + c/s 拆分子片 = 30 文件，283MB），只随 Pages 部署仓分发，
  // 不入源码仓 git 历史（见 .gitignore）。主源与工具页同源零 CORS，
  // jsDelivr 独立数据仓仅作兜底。
  //
  // ⚠️ CORS 说明：GitHub Releases 下载会 302 重定向到 objects.githubusercontent.com，
  //    该域名不发送 CORS 头，浏览器 fetch 直接报 "Failed to fetch"。
  //    因此必须使用支持 CORS 的源，按优先级排列：
  const SHARD_SOURCES = [
    // 1. 站点同源资源目录（词库已归档到本站 assets/tools/english-dictionary/data/）—
    //    www.sunyazhou.com 实测 3.8MB/s，且与工具页完全同源，无 CORS 无劫持
    'https://www.sunyazhou.com/assets/tools/english-dictionary/data/',
    // 2. GitHub Pages 裸域兜底 — 实测 2MB/s，CORS Access-Control-Allow-Origin: *
    'https://sunyazhou13.github.io/assets/tools/english-dictionary/data/',
    // 3. jsDelivr 主域名（独立数据仓 @main）— 兜底，实测 6MB/s
    'https://cdn.jsdelivr.net/gh/sunyazhou13/english-dictionary-data@main/',
    // 4. jsDelivr Gcore 节点 — 兜底，与主域缓存独立互备
    'https://gcore.jsdelivr.net/gh/sunyazhou13/english-dictionary-data@main/',
  ];
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

  let _db = null;
  let _dbBroken = false; // openDB 超时/失败后本会话不再尝试，查询降级为纯 fetch

  function openDB() {
    if (_db) return Promise.resolve(_db);
    if (_dbBroken) return Promise.reject(new Error('IndexedDB unavailable'));
    return new Promise((resolve, reject) => {
      let req;
      try {
        req = indexedDB.open(DB_NAME, DB_VERSION);
      } catch (e) {
        _dbBroken = true;
        reject(e);
        return;
      }
      let settled = false;
      // 超时保护：若有未完成的 deleteDatabase（如其他标签页占着连接），
      // 新的 open 请求会永远排队不返回，必须有兜底，否则整个下载流程挂死
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        _dbBroken = true;
        reject(new Error('IndexedDB open timeout'));
      }, 4000);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        // 清除旧版本缓存（词库从 77 万升级到 339 万词条）
        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
        }
        if (db.objectStoreNames.contains(META_STORE)) {
          db.deleteObjectStore(META_STORE);
        }
        db.createObjectStore(STORE_NAME);
        db.createObjectStore(META_STORE);
      };
      req.onsuccess = (e) => {
        if (settled) { // 超时后才到达的成功，连接已无意义，直接关掉
          try { e.target.result.close(); } catch (err) {}
          return;
        }
        settled = true;
        clearTimeout(timer);
        _db = e.target.result;
        // 其他标签页删除/升级数据库时主动关闭本连接，避免阻塞别人
        _db.onversionchange = () => {
          try { _db.close(); } catch (err) {}
          _db = null;
        };
        resolve(_db);
      };
      req.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(req.error);
      };
      // onblocked 不做处理，交给超时兜底
    });
  }

  function dbGet(store, key) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }

  function dbPut(store, key, value) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }

  function dbCount(store) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).count();
      req.onsuccess = () => resolve(req.result || 0);
      req.onerror = () => reject(req.error);
    }));
  }

  function dbGetKeys(store) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    }));
  }

  /* ════════════════════════════════════════════════════════════
   * 查询会话（取消上一轮 + 逐路独立渲染）
   * ════════════════════════════════════════════════════════════ */

  // 自增会话 token：每次新查询 +1，旧会话的异步回调发现 token 过期后不再写 DOM
  let _sessionId = 0;
  // 当前查询仍在运行的 AbortController 集合（仅"单词查询触发"的按需分片/释义/翻译）
  const _sessionAborts = new Set();

  function abortAllQueries() {
    for (const c of _sessionAborts) {
      try { c.abort(); } catch (e) { /* ignore */ }
    }
    _sessionAborts.clear();
  }

  // 外部会话 signal 被 abort 时联动中止目标 controller（避免依赖 AbortSignal.any 的兼容性问题）
  function linkAbort(signal, ctrl) {
    if (!signal) return;
    if (signal.aborted) {
      try { ctrl.abort(); } catch (e) { /* ignore */ }
      return;
    }
    const h = () => {
      try { ctrl.abort(); } catch (e) { /* ignore */ }
      signal.removeEventListener('abort', h);
    };
    signal.addEventListener('abort', h);
  }

  /* ════════════════════════════════════════════════════════════
   * 分片获取（按需下载 + 缓存）
   * ════════════════════════════════════════════════════════════ */

  /**
   * 带超时的 fetch —— 超时覆盖「响应头 + 响应体」全程（旧版仅在 header 到达后
   * 就 clearTimeout，慢源 / 断流源的 body 读取会无限挂起，单 worker 被锁死后
   * 整个下载队列停摆）。返回 { resp, text }，asBuffer 时返回 { resp, buf }；
   * init 为透传的 fetch 选项（如 Range 请求头）；超时即 abort，body 读取随之
   * 中断，调用方 catch 后按该源失败处理。
   */
  async function fetchWithTimeout(url, timeoutMs, sessionSignal, init, asBuffer) {
    const ctrl = new AbortController();
    linkAbort(sessionSignal, ctrl);
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      let resp, body;
      try {
        resp = await fetch(url, Object.assign({ signal: ctrl.signal }, init || {}));
        body = asBuffer ? await resp.arrayBuffer() : await resp.text();
      } catch (e) {
        // fetch 可能被浏览器扩展（如 XHR/请求检查类）劫持或跨域拦截而失败；
        // 复杂 init（如 Range）或已被中止时不兜底，原样抛错；普通 GET 用原生 XHR 重试
        if (init || ctrl.signal.aborted) throw e;
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = timeoutMs;
        const xhrAbort = () => xhr.abort();
        ctrl.signal.addEventListener('abort', xhrAbort, { once: true });
        const xhrData = await new Promise((res, rej) => {
          xhr.onload = () => res(asBuffer ? { s: xhr.status, b: xhr.response } : { s: xhr.status, t: xhr.responseText });
          xhr.onerror = () => rej(new Error('XHR network error: ' + url));
          xhr.ontimeout = () => rej(new Error('XHR timeout: ' + url));
          xhr.onabort = () => rej(new Error('XHR aborted: ' + url));
          if (asBuffer) xhr.responseType = 'arraybuffer';
          xhr.send();
        });
        const ok = xhrData.s >= 200 && xhrData.s < 300;
        return asBuffer
          ? { resp: { ok, status: xhrData.s }, buf: xhrData.b }
          : { resp: { ok, status: xhrData.s }, text: xhrData.t };
      }
      return asBuffer ? { resp, buf: body } : { resp, text: body };
    } finally {
      clearTimeout(timer);
    }
  }

  // 单请求超时：jsDelivr 各分片压缩后仅 1.5~1.8MB，但境内慢速时段实测仅 30~50KB/s
  //（1.6MB 需 40s+，旧 8s 只够下 320KB 必然超时失败）。放宽到 60s：四源并发竞速，
  // 任一源先完成即返回（raw 秒断不占时），总等待 ≈ 最快源完成时间
  const SHARD_SOURCE_TIMEOUT_MS = 60000;
  // 大分片子文件同理：压缩后 1.6~1.9MB，慢速时段 60s 内足够完成（与普通分片同标准）
  const BIG_SUB_TIMEOUT_MS = 60000;
  // 成功源记忆键：值为上次成功下载分片的 SHARD_SOURCES 索引
  const SHARD_FAST_SOURCE_KEY = 'ed_shard_fast_source';

  // 大分片专属通道（根治方案）：jsDelivr 对 >20MB 单文件固定返回 403（body 含 "20 MB"），
  // 仅 raw.githubusercontent.com 无此限制，但 raw 在境内对大文件动辄断流（实测 2MB Range
  // 一段 25s 内 0 字节），再大超时也只是干等。故数据仓库将超限分片拆成 <20MB 子文件
  // （c → c_1/c_2，s → s_1/s_2），交由 jsDelivr 快源分发，前端按清单拼合（见
  // fetchBigShardSingle）。BIG_SHARD_SOURCE_INDEX 随 Range 方案一并废弃。
  const BIG_SHARD_MARKER_20MB = '20 MB';    // jsDelivr 超限 403 响应体的特征子串
  const BIG_SHARDS_KEY = 'ed_big_shards';   // 大分片持久化记忆键：JSON 数组（如 ["c","s"]）

  function readFastSource() {
    try {
      const v = Number(localStorage.getItem(SHARD_FAST_SOURCE_KEY));
      return Number.isInteger(v) && v >= 0 && v < SHARD_SOURCES.length ? v : -1;
    } catch (e) { return -1; }
  }

  function saveFastSource(idx) {
    try { localStorage.setItem(SHARD_FAST_SOURCE_KEY, String(idx)); } catch (e) { /* ignore */ }
  }

  // 大分片记忆读取：仅保留合法单字母
  function readBigShards() {
    try {
      const v = JSON.parse(localStorage.getItem(BIG_SHARDS_KEY) || '[]');
      return Array.isArray(v) ? v.filter(x => typeof x === 'string' && /^[a-z]$/i.test(x)) : [];
    } catch (e) { return []; }
  }

  // 大分片记忆写入（幂等，排序后落盘）
  function rememberBigShard(letter) {
    try {
      const set = new Set(readBigShards());
      set.add(String(letter).toLowerCase());
      localStorage.setItem(BIG_SHARDS_KEY, JSON.stringify(Array.from(set).sort()));
    } catch (e) { /* ignore */ }
  }

  // 大通道分段下载（根治方案）：raw 单源经实测在境内对大文件动辄断流（2MB Range
  // 一段 25s 内 0 字节、512KB 一段也仅 47KB/s），再长的超时也只是让用户干等；而
  // jsDelivr 对 <20MB 文件快且稳（普通分片即证）。故在数据仓库将超限分片拆成
  // <20MB 子文件（c → c_1/c_2，s → s_1/s_2），此处按拆分清单逐份走普通三源竞速
  // 下载（单份 ≤13MB，1~3s 可成），再 Object.assign 拼合为一完整分片；某份失败
  // 原样抛错入失败分片重试。进度经 onStage 上报「部分 x/y」。
  // @param {Function} [onStage] 可选：下载阶段回调 (stageText)
  const BIG_SPLIT_PARTS = { c: 2, s: 2 }; // 大分片 → 子文件份数（与数据仓拆分约定一致）
  async function fetchBigShardSingle(letter, sessionSignal, onStage) {
    letter = String(letter).toLowerCase();
    const parts = BIG_SPLIT_PARTS[letter] || 0;
    if (!parts) {
      throw new Error('No big-shard split plan for: ' + letter);
    }
    let merged = {};
    // 子文件并发拉取：c_1/c_2 同 worker 内并发（2 条连接），总耗时减半
    if (onStage) onStage('部分 1-' + parts);
    const subs = await Promise.all(
      Array.from({ length: parts }, (_, i) =>
        fetchShardJson(letter + '_' + (i + 1), BIG_SUB_TIMEOUT_MS, sessionSignal))
    );
    for (const part of subs) merged = Object.assign(merged, part);
    if (!merged || typeof merged !== 'object' || !Object.keys(merged).length) {
      throw new Error('Invalid merged big shard: ' + letter);
    }
    return merged;
  }

  /**
   * 分片下载 —— 按字母路由到普通 / 大分片专属通道：
   *  - 普通分片：对全部 SHARD_SOURCES 并发竞速（每源独立 8s 超时），
   *    取第一个成功解析出有效 JSON 的源立即返回（记忆中的源优先排列），
   *    全部失败才抛错；某源返回 403 且响应体含 "20 MB"（jsDelivr 单文件上限）
   *    即动态识别为大分片，持久化记忆后本轮立即转入大通道重试。
   *  - 大分片（已记忆）：避开 jsDelivr 对 >20MB 的必然 403，按拆分清单逐份拉取
   *    <20MB 子文件（走同一三源竞速通道），Object.assign 拼合为一完整分片，
   *    经 onStage 上报「部分 x/y」。成功写 IndexedDB 与 _shardCache 由调用方
   *    负责，失败仍抛错进入失败分片重试。
   * timeoutMs 可覆盖普通分片默认单请求超时（大分片子文件同样受其约束）。
   * onStage：可选阶段进度回调（大分片拼合时回调「部分 x/y」）。
   * @returns {Promise<object>} 解析后的词库分片 JSON
   */
async function fetchShardJson(letter, timeoutMs, sessionSignal, onStage) {
    const t = timeoutMs || SHARD_SOURCE_TIMEOUT_MS;
    letter = String(letter).toLowerCase();

    // 静态拆分清单（BIG_SPLIT_PARTS）或历史记忆命中的大分片：无条件直达大通道。
    // 不依赖 localStorage —— 首次下载（无痕/新浏览器）也能直接按子文件分块下载，
    // 避免先抢 >20MB 原文件、等 jsdelivr 403、raw 超时再转圈的多重浪费。
    if (BIG_SPLIT_PARTS[letter] || readBigShards().indexOf(letter) >= 0) {
      return fetchBigShardSingle(letter, sessionSignal, onStage);
    }

    // 固定快源优先顺序（cdn → gcore → raw 兜底），不做成功源记忆：
    // 双快源实测 ~6MB/s，竞速毫秒级分胜负，旧记忆只会把慢源排前拖慢
    const order = SHARD_SOURCES.map((_, i) => i);

    const attempts = order.map(idx => (async () => {
      const url = SHARD_SOURCES[idx] + letter + '.json';
      try {
        const { resp, text } = await fetchWithTimeout(url, t, sessionSignal);
        if (resp.ok) {
          try {
            const data = JSON.parse(text);
            if (data && typeof data === 'object') return { ok: true, idx, data };
          } catch (e) { /* 解析失败按无效 JSON 处理 */ }
          return { ok: false, idx, err: new Error('Invalid JSON @ ' + SHARD_SOURCES[idx]) };
        }
        // 403 + "20 MB" 特征 = jsDelivr 单文件 20MB 上限，动态识别为大分片并记忆
        if (resp.status === 403 && text && text.indexOf(BIG_SHARD_MARKER_20MB) >= 0) {
          rememberBigShard(letter);
          return { ok: false, idx, big: true };
        }
        return { ok: false, idx, err: new Error('HTTP ' + resp.status + ' @ ' + SHARD_SOURCES[idx]) };
      } catch (e) {
        return { ok: false, idx, err: e };
      }
    })());

    // 逐个取最先 settle 的结果：首个成功立即返回并更新记忆；全失败才抛错
    let lastErr = null;
    let bigHit = false;
    let pending = attempts;
    while (pending.length > 0) {
      const settled = await Promise.race(
        pending.map(p => p.then(v => ({ v, p }), e => ({ v: { ok: false, err: e }, p })))
      );
      pending = pending.filter(p => p !== settled.p);
      if (settled.v.ok) {
        return settled.v.data;
      }
      if (settled.v.big) bigHit = true;
      if (settled.v.err) lastErr = settled.v.err;
    }

    // 动态识别出的大分片：记忆已写入，本轮立即转入大通道重试
    if (bigHit) {
      return fetchBigShardSingle(letter, sessionSignal, onStage);
    }
    throw lastErr || new Error('All shard sources failed for: ' + letter);
  }

  const _shardCache = {};

  async function getShard(letter, sessionSignal) {
    letter = letter.toLowerCase();
    if (letter in _shardCache) return _shardCache[letter];

    // 先查 IndexedDB
    try {
      const cached = await dbGet(STORE_NAME, letter);
      if (cached) {
        _shardCache[letter] = cached;
        return cached;
      }
    } catch (e) { /* IndexedDB 不可用时降级为每次 fetch */ }

    // 下载分片（普通分片：单请求 8s，多源并发竞速，成功源记忆优先；
    // 大分片自动走专属大通道：跳 jsdelivr、直连 raw、60s 超时；sessionSignal 供新查询取消）
    const data = await fetchShardJson(letter, SHARD_SOURCE_TIMEOUT_MS, sessionSignal);
    _shardCache[letter] = data;

    try { await dbPut(STORE_NAME, letter, data); } catch (e) { /* ignore */ }

    return data;
  }

  /* ════════════════════════════════════════════════════════════
   * 全量词库下载
   * ════════════════════════════════════════════════════════════ */

  let _downloading = false;

  // 上次下载失败的分片（持久化到 meta，供「重试失败分片」按钮使用与刷新后恢复）
  const FAILED_SHARDS_KEY = 'failedShards';

  async function readFailedShards() {
    try {
      const v = await dbGet(META_STORE, FAILED_SHARDS_KEY);
      return Array.isArray(v) ? v.filter(x => typeof x === 'string' && /^[a-z]$/i.test(x)) : [];
    } catch (e) { return []; }
  }

  async function downloadAllShards(onProgress) {
    if (_downloading) return;
    _downloading = true;

    try {
      // 先检查已缓存的分片
      let cachedKeys = [];
      try { cachedKeys = await dbGetKeys(STORE_NAME); } catch (e) {}
      const cachedSet = new Set(cachedKeys.map(k => String(k).toLowerCase()));

      const toDownload = LETTERS.filter(l => !cachedSet.has(l));
      const TOTAL_COUNT = LETTERS.length;
      // done 只统计成功分片：起点是已缓存数（成功计入），每成功一个 +1
      let done = TOTAL_COUNT - toDownload.length;

      onProgress(done, TOTAL_COUNT, T.downloadPrepare);

      // 6 路并行下载（浏览器对同域名允许 6 个并发连接，充分利用）
      const CONCURRENCY = 6;
      let failed = [];
      // 大分片（c/s，需拆多份子文件）与普通分片分流：先独占连接快速啃完普通分片，
      // 再单独下大分片（子文件已并发），避免 2 份 ~11MB 子文件与普通分片抢连接导致超时
      const isBigShard = l => !!(BIG_SPLIT_PARTS[String(l).toLowerCase()] || readBigShards().indexOf(l) >= 0);
      const bigList = toDownload.filter(isBigShard);
      let queue = [...toDownload.filter(l => !isBigShard(l))];

      async function downloadWorker() {
        while (queue.length > 0) {
          const letter = queue.shift();
          if (!letter) break;
          onProgress(done, TOTAL_COUNT, T.downloadFetching + letter.toUpperCase() + '.json …');
          try {
            const data = await fetchShardJson(letter, undefined, undefined, (stage) => {
              // 大分片分段下载：段进度实时回流（如“下载 S.JSON … 段 1-2”）
              onProgress(done, TOTAL_COUNT, T.downloadFetching + letter.toUpperCase() + '.json … ' + stage);
            });
            _shardCache[letter] = data;
            try { await dbPut(STORE_NAME, letter, data); } catch (e) {}
            done++; // 只有真正写库成功才计入进度，失败分片不虚增
          } catch (e) {
            failed.push(letter);
          }
          const nextLetter = queue[0];
          onProgress(done, TOTAL_COUNT, nextLetter
            ? T.downloadFetching + nextLetter.toUpperCase() + '.json …'
            : T.downloadComplete);
        }
      }

      // 阶段一：普通分片全量并发
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, downloadWorker));
      // 阶段二：大分片独占连接（2 个大分片 × 内部分别并发 2 子文件 = 4 条连接，不超上限）
      queue = [...bigList];
      await Promise.all(Array.from({ length: Math.min(2, queue.length) }, downloadWorker));

      // 持久化失败分片（重试按钮、刷新后恢复都依赖它）；全成功则清空该键
      try { await dbPut(META_STORE, FAILED_SHARDS_KEY, failed); } catch (e) {}

      // 只有全部分片成功才标记全量下载完成
      if (failed.length === 0) {
        try { await dbPut(META_STORE, 'fullDownloaded', Date.now()); } catch (e) {}
      }

      // 最终进度：如实汇报成功 X/26，不再用 total 冒充 100%
      onProgress(done, TOTAL_COUNT, failed.length > 0
        ? T.downloadInterrupted
            .replace('{ok}', String(done))
            .replace('{total}', String(TOTAL_COUNT))
            .replace('{list}', failed.map(l => l.toUpperCase()).join(','))
        : T.downloadComplete);
    } finally {
      _downloading = false;
    }
  }

  /* ════════════════════════════════════════════════════════════
   * 本地词库查询
   * ════════════════════════════════════════════════════════════ */

  /**
   * @returns {object|null} {translation, phonetic, pos, tags, fields, collins, oxford}
   */
  async function localLookup(word, sessionSignal) {
    word = word.trim().toLowerCase();
    if (!word) return null;

    const letter = word[0];
    if (!/[a-z]/.test(letter)) return null;

    try {
      const shard = await getShard(letter, sessionSignal);
      const entry = shard[word];
      if (!entry) return null;

      // entry = [translation, phonetic, pos, tags[], fields[], collins, oxford]
      const result = {
        translation: entry[0] || '',
        phonetic: entry[1] || '',
        pos: entry[2] || '',
        tags: Array.isArray(entry[3]) ? entry[3] : [],
        fields: Array.isArray(entry[4]) ? entry[4] : [],
        collins: entry[5] || 0,
        oxford: entry[6] || 0,
      };
      return result;
    } catch (e) {
      return null;
    }
  }

  /* ════════════════════════════════════════════════════════════
   * Free Dictionary API
   * ════════════════════════════════════════════════════════════ */

  const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  // 释义请求 8s 超时兜底：dictionaryapi.dev 挂起时中止，避免拖慢结果渲染
  const DICT_TIMEOUT_MS = 15000;

  async function fetchDictAPI(word, sessionSignal) {
    word = word.trim().toLowerCase();
    if (!word) return null;

    const url = DICT_API + encodeURIComponent(word);
    const ctrl = new AbortController();
    linkAbort(sessionSignal, ctrl);
    const timer = setTimeout(() => ctrl.abort(), DICT_TIMEOUT_MS);

    async function parse(data) {
      if (!Array.isArray(data) || data.length === 0) return null;
      const meanings = [];
      for (const entry of data) {
        if (!entry.meanings) continue;
        for (const m of entry.meanings) {
          const defs = (m.definitions || []).map(d => ({
            definition: d.definition || '',
            example: d.example || '',
          }));
          if (defs.length === 0) continue;
          meanings.push({
            partOfSpeech: m.partOfSpeech || '',
            definitions: defs,
            synonyms: m.synonyms || [],
            antonyms: m.antonyms || [],
          });
        }
      }
      let phonetic = '';
      let audioUrl = '';
      for (const entry of data) {
        if (!entry.phonetics) continue;
        for (const p of entry.phonetics) {
          if (!phonetic && p.text) phonetic = p.text;
          if (!audioUrl && p.audio) audioUrl = p.audio;
        }
      }
      return { meanings, phonetic, audioUrl };
    }

    try {
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) return null;
      return parse(await resp.json());
    } catch (e) {
      // XHR fallback: 某些浏览器扩展会劫持 window.fetch，
      // XMLHttpRequest 走独立通道，可绕开拦截。
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = DICT_TIMEOUT_MS;
        const result = await new Promise((resolve) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try { resolve(parse(JSON.parse(xhr.responseText))); }
              catch (err) { resolve(null); }
            } else { resolve(null); }
          };
          xhr.onerror = () => resolve(null);
          xhr.ontimeout = () => resolve(null);
          xhr.send();
        });
        return result;
      } catch (xhrErr) { return null; }
    } finally {
      clearTimeout(timer);
    }
  }

  /* ════════════════════════════════════════════════════════════
   * Edge (Microsoft Bing) 翻译 API — 纯前端免 key 直连
   * ════════════════════════════════════════════════════════════ */

  const EDGE_TRANSLATE_API = 'https://edge.microsoft.com/translate/translatetext';
  // Edge 端点要求 BCP-47 语言码：zh → zh-Hans，en 不变
  function edgeLang(lang) {
    return lang === 'zh' ? 'zh-Hans' : lang;
  }

  // 最近一次成功的翻译来源：'edge' | 'mymemory' | null（供结果来源标注动态显示）
  let _lastTranslateSource = null;

  /**
   * Edge 翻译端点直连：POST + JSON 字符串数组请求体。
   * 该端点响应 Content-Type 为 text/plain，但接受 application/json 请求体。
   * 8 秒超时兜底（覆盖扩展劫持/慢响应），失败返回 null，不影响另一路并行请求。
   */
  async function edgeTranslate(text, from, to, sessionSignal) {
    const url = EDGE_TRANSLATE_API + '?from=' + encodeURIComponent(edgeLang(from)) + '&to=' + encodeURIComponent(edgeLang(to));
    const ctrl = new AbortController();
    linkAbort(sessionSignal, ctrl);
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([text]),
        signal: ctrl.signal,
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data?.[0]?.translations?.[0]?.text || null;
    } catch (e) {
      // XHR fallback: 某些扩展会拦截 window.fetch，XMLHttpRequest 走独立通道可绕开
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.timeout = 8000;
        xhr.setRequestHeader('Content-Type', 'application/json');
        const result = await new Promise((resolve) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data?.[0]?.translations?.[0]?.text || null);
              } catch (err) { resolve(null); }
            } else { resolve(null); }
          };
          xhr.onerror = () => resolve(null);
          xhr.ontimeout = () => resolve(null);
          xhr.send(JSON.stringify([text]));
        });
        return result;
      } catch (xhrErr) { return null; }
    } finally {
      clearTimeout(timer);
    }
  }

  /* ════════════════════════════════════════════════════════════
   * MyMemory 翻译 API（与 Edge 并行竞速的第二路）
   * ════════════════════════════════════════════════════════════ */

  const TRANSLATE_API = 'https://api.mymemory.translated.net/get?q=';

  /**
   * MyMemory 翻译：5 秒超时，任何失败返回 null，不影响另一路并行请求。
   */
  async function myMemoryTranslate(text, from, to, sessionSignal) {
    const url = TRANSLATE_API + encodeURIComponent(text) + '&langpair=' + from + '|' + to;
    const ctrl = new AbortController();
    linkAbort(sessionSignal, ctrl);
    const timer = setTimeout(() => ctrl.abort(), 5000);
    try {
      const resp = await fetch(url, { signal: ctrl.signal });
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.responseData?.translatedText || null;
    } catch (e) {
      // XHR fallback: 某些扩展会拦截 window.fetch
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 5000;
        const result = await new Promise((resolve) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data.responseData?.translatedText || null);
              } catch (err) { resolve(null); }
            } else { resolve(null); }
          };
          xhr.onerror = () => resolve(null);
          xhr.ontimeout = () => resolve(null);
          xhr.send();
        });
        return result;
      } catch (xhrErr) { return null; }
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 在线翻译总入口：Edge 与 MyMemory 两路并行请求，Edge 8s / MyMemory 5s 超时。
   * 用 Promise.allSettled 收集两路结果，两路都返回有效译文时全部保留（供双路展示），
   * 任一路失败则对应项 ok=false；两路都失败才返回 null（保留本地词库兜底路径）。
   * 失败时通过 XHR fallback 重试以绕开可能劫持 fetch 的浏览器扩展。
   * @returns {{edge:{ok:boolean,text:string|null}, mymemory:{ok:boolean,text:string|null}}|null}
   */
  async function translate(text, from, to) {
    const [edgeR, mmR] = await Promise.allSettled([
      edgeTranslate(text, from, to),
      myMemoryTranslate(text, from, to),
    ]);

    const edgeText = (edgeR.status === 'fulfilled' && edgeR.value) ? edgeR.value : null;
    const mmText = (mmR.status === 'fulfilled' && mmR.value) ? mmR.value : null;

    if (!edgeText && !mmText) return null;

    // 记录最终来源（Edge 优先用于来源标注，渲染层则按实际非空路单独展示）
    _lastTranslateSource = edgeText ? 'edge' : 'mymemory';

    return {
      edge: { ok: !!edgeText, text: edgeText },
      mymemory: { ok: !!mmText, text: mmText },
    };
  }

  /* ════════════════════════════════════════════════════════════
   * 语言识别
   * ════════════════════════════════════════════════════════════ */

  function isChinese(text) {
    return /[\u4e00-\u9fff\u3400-\u4dbf]/.test(text);
  }

  function isEnglishWord(text) {
    return /^[a-zA-Z][a-zA-Z\-'\s]*$/.test(text.trim());
  }

   /* ════════════════════════════════════════════════════════════
    * 发音（v4 — 四级策略）
    * 1. Dictionary API 真人音频（最佳）
    * 2. 有道词典 TTS（高质量，国内可直连，无需 key）
    * 3. 百度翻译 TTS（备用，同样国内直连）
    * 4. Web Speech API 兜底
    * 注：StreamElements 已改为需要鉴权（401），不再使用
    * ════════════════════════════════════════════════════════════ */

  let _voicesReady = false;
  let _voices = [];

  // 有道词典发音（美式女声，WAV 高质量；用 <audio> 播放无需 CORS）
  const YOUDAO_TTS = 'https://dict.youdao.com/dictvoice?audio=';
  // 百度翻译 TTS（备用）
  const BAIDU_TTS = 'https://fanyi.baidu.com/gettts?lan=en&spd=3&source=web&text=';

  function initVoices() {
    if (!('speechSynthesis' in window)) return;

    _voices = speechSynthesis.getVoices();
    if (_voices.length > 0) {
      _voicesReady = true;
      return;
    }

    // 监听 voices 加载
    speechSynthesis.onvoiceschanged = () => {
      _voices = speechSynthesis.getVoices();
      _voicesReady = _voices.length > 0;
    };

    // 某些浏览器需要主动触发才加载 voices
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      speechSynthesis.speak(u);
    } catch (e) {}
  }

  /**
   * 播放远程音频，'error' 事件 + 超时双保险降级
   * 注：必须监听 'error' 事件——HTTP 4xx/5xx 不会 reject play() 的 Promise
   * referrerPolicy=no-referrer：百度 TTS 会校验 Referer，带外域 Referer 返回空
   */
  function playRemoteAudio(url, word, onFail) {
    const audio = new Audio(url);
    try { audio.referrerPolicy = 'no-referrer'; } catch (e) {}
    let settled = false;
    const fail = () => {
      if (settled) return;
      settled = true;
      onFail();
    };
    audio.addEventListener('error', fail);
    setTimeout(fail, 8000);
    audio.play().then(() => {
      settled = true; // 开始正常播放，取消超时降级
    }).catch(fail);
  }

  /**
   * 有道词典 TTS — 美式女声，质量接近真人
   */
  function speakWithYoudao(text) {
    if (!text) return false;
    playRemoteAudio(
      YOUDAO_TTS + encodeURIComponent(text) + '&type=1',
      text,
      () => speakWithBaiduTTS(text)
    );
    return true;
  }

  /**
   * 百度翻译 TTS — 有道不可用时的备用
   */
  function speakWithBaiduTTS(text) {
    if (!text) return false;
    playRemoteAudio(
      BAIDU_TTS + encodeURIComponent(text),
      text,
      () => speakWithTTS(text)
    );
    return true;
  }

  /**
   * Web Speech API 朗读（最后兜底）
   */
  function speakWithTTS(text) {
    if (!('speechSynthesis' in window)) return false;

    // 取消正在播放的语音
    speechSynthesis.cancel();

    // 确保 voices 已加载
    if (!_voicesReady) {
      _voices = speechSynthesis.getVoices();
      _voicesReady = _voices.length > 0;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1;

    if (_voicesReady) {
      // 按优先级选择最佳英语语音：
      // 1. 名称含 Natural/Neural/Premium/Enhanced 的高质量语音
      // 2. Google 系（Chrome 内置）
      // 3. en-US 本地语音（macOS Samantha/Alex 等）
      // 4. 任意 en-* 语音
      // 注意：绝不选中文语音读英文，否则发音会非常怪
      const enVoices = _voices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
      const naturalVoice = enVoices.find(v =>
        v.name && /natural|neural|premium|enhanced|online/i.test(v.name));
      const googleVoice = enVoices.find(v => v.name && v.name.includes('Google'));
      const enUSVoice = enVoices.find(v => v.lang.toLowerCase() === 'en-us');
      const chosen = naturalVoice || googleVoice || enUSVoice || enVoices[0];
      if (chosen) utter.voice = chosen;
    }

    speechSynthesis.speak(utter);
    return true;
  }

  /**
   * 发音总入口：真人音频 → 有道 TTS → 百度 TTS → 浏览器 TTS
   */
  function pronounce(text, audioUrl) {
    if (audioUrl) {
      playRemoteAudio(audioUrl, text, () => speakWithYoudao(text));
    } else {
      speakWithYoudao(text);
    }
  }

  /* ════════════════════════════════════════════════════════════
   * 词性 / 标签映射表
   * ════════════════════════════════════════════════════════════ */

  const POS_MAP_ZH = {
    'n.': 'n. 名词',
    'v.': 'v. 动词',
    'vt.': 'vt. 及物动词',
    'vi.': 'vi. 不及物动词',
    'a.': 'adj. 形容词',
    'adj.': 'adj. 形容词',
    'ad.': 'adv. 副词',
    'adv.': 'adv. 副词',
    'art.': 'art. 冠词',
    'prep.': 'prep. 介词',
    'conj.': 'conj. 连词',
    'pron.': 'pron. 代词',
    'interj.': 'interj. 感叹词',
    'num.': 'num. 数词',
    'aux.': 'aux. 助动词',
    'abbr.': 'abbr. 缩写',
    'pref.': 'pref. 前缀',
    'suf.': 'suf. 后缀',
    // SQLite 词库单字母词性代码（格式如 "n:100" 或 "v:2/n:98"）
    'n': 'n. 名词', 'v': 'v. 动词', 'j': 'adj. 形容词', 'r': 'adv. 副词',
    'a': 'art. 冠词', 'p': 'prep. 介词', 'c': 'conj. 连词', 'm': 'num. 数词',
    'u': 'int. 感叹词', 'i': 'prep. 介词', 'd': 'det. 限定词', 't': 'abbr. 缩写',
  };

  const POS_MAP_EN = {
    'n.': 'n. noun',
    'v.': 'v. verb',
    'vt.': 'vt. transitive v.',
    'vi.': 'vi. intransitive v.',
    'a.': 'adj. adjective',
    'adj.': 'adj. adjective',
    'ad.': 'adv. adverb',
    'adv.': 'adv. adverb',
    'art.': 'art. article',
    'prep.': 'prep. preposition',
    'conj.': 'conj. conjunction',
    'pron.': 'pron. pronoun',
    'interj.': 'interj. interjection',
    'num.': 'num. numeral',
    'aux.': 'aux. auxiliary',
    'abbr.': 'abbr. abbreviation',
    'pref.': 'pref. prefix',
    'suf.': 'suf. suffix',
    // SQLite dictionary single-letter pos codes (format: "n:100" or "v:2/n:98")
    'n': 'n. noun', 'v': 'v. verb', 'j': 'adj. adjective', 'r': 'adv. adverb',
    'a': 'art. article', 'p': 'prep. preposition', 'c': 'conj. conjunction', 'm': 'num. numeral',
    'u': 'int. interjection', 'i': 'prep. preposition', 'd': 'det. determiner', 't': 'abbr. abbreviation',
  };

  const POS_MAP = (_lang === 'en') ? POS_MAP_EN : POS_MAP_ZH;

  // 专业领域 → 颜色 class
  const FIELD_COLORS = {
    '医': 'ed-field-medical',
    '计': 'ed-field-computing',
    '化': 'ed-field-chemistry',
    '经': 'ed-field-economics',
    '法': 'ed-field-law',
    '电': 'ed-field-electronics',
    '机': 'ed-field-mechanical',
    '建': 'ed-field-architecture',
    '物': 'ed-field-physics',
    '生': 'ed-field-biology',
    '药': 'ed-field-pharma',
    '矿': 'ed-field-mining',
    '植': 'ed-field-botany',
    '动': 'ed-field-zoology',
    '体': 'ed-field-sports',
    '人名': 'ed-field-name',
    '地名': 'ed-field-place',
  };

  function getFieldClass(field) {
    // 精确匹配
    if (FIELD_COLORS[field]) return FIELD_COLORS[field];
    // 前缀匹配（如"英格兰人姓氏"匹配"人名"）
    for (const key in FIELD_COLORS) {
      if (field.includes(key)) return FIELD_COLORS[key];
    }
    return 'ed-field-other';
  }

  /**
   * 解析词性字段，支持新旧两种格式：
   * - 新格式（SQLite 词库）："n:100" 或 "v:2/n:98"
   * - 旧格式（CSV 词库）："n. v. adj."
   * @returns {string[]} 词性代码数组（POS_MAP 的 key）
   */
  function parsePosCodes(pos) {
    if (!pos) return [];

    // 新格式：包含 ':'，如 "n:100" 或 "v:2/n:98"
    if (pos.includes(':')) {
      return pos.split('/')
        .map(part => part.split(':')[0].trim())
        .filter(code => POS_MAP[code]);
    }

    // 旧格式：空格分隔，如 "n. v. adj."
    return pos.split(/\s+/)
      .filter(Boolean)
      .map(p => p.toLowerCase())
      .filter(p => POS_MAP[p]);
  }

  /* ════════════════════════════════════════════════════════════
   * DOM 元素
   * ════════════════════════════════════════════════════════════ */

  const $ = (id) => document.getElementById(id);
  let elInput, elBtn, elResults, elPlaceholder, elLoading, elContent;
  let elBanner, elDownloadBtn, elDownloadWrap, elDownloadProgress, elClearBtn;

  function initElements() {
    elInput = $('ed-input');
    elBtn = $('ed-search');
    elResults = $('ed-results');
    elPlaceholder = $('ed-placeholder');
    elLoading = $('ed-loading');
    elContent = $('ed-content');
    elBanner = $('ed-banner');
    elDownloadBtn = $('ed-download-btn');
    elDownloadWrap = $('ed-download-wrap');
    elDownloadProgress = $('ed-download-progress');
    elClearBtn = $('ed-clear-btn');
  }

  /* ════════════════════════════════════════════════════════════
   * UI 渲染
   * ════════════════════════════════════════════════════════════ */

  function showLoading() {
    elPlaceholder.hidden = true;
    elContent.hidden = true;
    elLoading.hidden = false;
  }

  function showContent(html) {
    elLoading.hidden = true;
    elPlaceholder.hidden = true;
    elContent.hidden = false;
    elContent.innerHTML = html;
  }

  function showPlaceholder(msg) {
    elLoading.hidden = true;
    elContent.hidden = true;
    elPlaceholder.hidden = false;
    if (msg) elPlaceholder.textContent = msg;
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s || '';
    return div.innerHTML;
  }

  /**
   * 渲染 Collins 星级
   */
  function renderCollinsStars(level) {
    if (!level || level < 1) return '';
    const max = 5;
    let html = '<span class="ed-collins" title="' + T.collinsTitle + level + T.collinsSuffix + '">';
    for (let i = 0; i < max; i++) {
      html += i < level ? '★' : '☆';
    }
    html += '</span>';
    return html;
  }

  /**
   * 渲染考试标签徽章
   */
  function renderTagBadges(tags) {
    if (!tags || tags.length === 0) return '';
    return tags.map(t => '<span class="ed-tag-badge">' + escapeHtml(t) + '</span>').join('');
  }

  /**
   * 渲染专业领域徽章
   */
  function renderFieldBadges(fields) {
    if (!fields || fields.length === 0) return '';
    return fields.map(f => {
      const cls = getFieldClass(f);
      return '<span class="ed-field-badge ' + cls + '">' + escapeHtml(f) + '</span>';
    }).join('');
  }

  /* ════════════════════════════════════════════════════════════
   * 逐路渲染（查询会话：骨架 + 各路独立占位与填充）
   * ════════════════════════════════════════════════════════════ */

  /**
   * 词头 HTML（word + 发音按钮 + 音标 + 标签行）
   */
  function buildWordHeaderHtml(word, phonetic, badgesHtml, audioUrl) {
    const parts = [];
    parts.push('<div class="ed-word-header">');
    parts.push('<div class="ed-word-main">');
    parts.push('<span class="ed-word">' + escapeHtml(word) + '</span>');

    if (word && /^[a-zA-Z]/.test(word)) {
      parts.push(
        '<button type="button" class="ed-btn-speak" ' +
        'data-word="' + escapeHtml(word) + '"' +
        (audioUrl ? ' data-audio="' + escapeHtml(audioUrl) + '"' : '') +
        ' aria-label="' + T.speak + '"><i class="fas fa-volume-up"></i></button>'
      );
    }

    parts.push('</div>'); // ed-word-main

    if (phonetic) {
      parts.push('<span class="ed-phonetic">/' + escapeHtml(phonetic) + '/</span>');
    }
    if (badgesHtml) {
      parts.push('<div class="ed-badges-row">' + badgesHtml + '</div>');
    }
    parts.push('</div>'); // ed-word-header
    return parts.join('');
  }

  /**
   * 查询开始：一次铺开固定骨架，各路均带"查询中…"占位（谁完成谁单独填充）
   */
  function renderQuerySkeleton(word) {
    // 词头（word 已知；音标/标签由后续各路异步补齐）
    const header = '<div id="ed-slot-header"></div>';

    // 本地词库槽：占位
    const local = '<div class="ed-section ed-section-local" id="ed-slot-local">' +
      '<div class="ed-section-title">' + T.localTitle + '</div>' +
      '<div class="ed-route-note">' + T.routeLoading + '</div></div>';

    // 翻译槽：Edge / MyMemory 两行独立占位
    const trans = '<div class="ed-section ed-section-translate" id="ed-slot-translate">' +
      '<div class="ed-section-title">' + T.translateTitle + '</div>' +
      '<div class="ed-translation-text" style="margin:6px 0" id="ed-t-edge">' +
      '<span class="ed-tag-badge">' + escapeHtml(T.srcEdge) + '</span> ' +
      '<span class="ed-route-note">' + T.routeLoading + '</span></div>' +
      '<div class="ed-translation-text" style="margin:6px 0" id="ed-t-mm">' +
      '<span class="ed-tag-badge">' + escapeHtml(T.srcTranslate) + '</span> ' +
      '<span class="ed-route-note">' + T.routeLoading + '</span></div>' +
      '</div>';

    // 在线词典槽：占位
    const api = '<div class="ed-section ed-section-api" id="ed-slot-api">' +
      '<div class="ed-section-title">' + T.engDefsTitle + '</div>' +
      '<div class="ed-route-note">' + T.routeLoading + '</div></div>';

    // 来源行（各路完成后逐步累积）
    const sources = '<div class="ed-sources" id="ed-slot-sources"></div>';

    showContent(header + local + trans + api + sources);
  }

  /**
   * 词头独立更新（本地/API/翻译任一路先回来都可刷新音标、标签、发音按钮）
   */
  function updateWordHeader(live) {
    const el = document.getElementById('ed-slot-header');
    if (!el) return;

    const badges = [];
    for (const code of parsePosCodes(live.pos)) {
      badges.push('<span class="ed-pos-badge">' + escapeHtml(POS_MAP[code]) + '</span>');
    }
    if (live.oxford) {
      badges.push('<span class="ed-oxford-badge" title="' + T.oxfordTitle + '">' + T.oxfordBadge + '</span>');
    }
    if (live.collins) {
      badges.push(renderCollinsStars(live.collins));
    }
    if (live.tags && live.tags.length > 0) {
      badges.push(renderTagBadges(live.tags));
    }

    let html = buildWordHeaderHtml(live.word, live.phonetic, badges.join(''), live.audioUrl);

    // 专业领域标注
    if (live.fields && live.fields.length > 0) {
      html += '<div class="ed-fields-row">' + renderFieldBadges(live.fields) + '</div>';
    }

    el.innerHTML = html;
  }

  /**
   * 本地词库槽：命中填翻译，未命中填空占位，不影响其它路
   */
  function renderLocalSlot(result) {
    const el = document.getElementById('ed-slot-local');
    if (!el) return;
    if (result && result.translation) {
      const lines = result.translation.split('\n');
      let inner = '<div class="ed-section-title">' + T.localTitle + '</div><div class="ed-translation">';
      for (const line of lines) {
        if (line.trim()) inner += '<p>' + escapeHtml(line) + '</p>';
      }
      inner += '</div>';
      el.innerHTML = inner;
    } else {
      el.innerHTML = '<div class="ed-section-title">' + T.localTitle + '</div>' +
        '<div class="ed-route-note">' + T.routeLocalEmpty + '</div>';
    }
  }

  /**
   * 翻译槽某一路独立填充/失败（edge 或 mymemory 各自一行）
   */
  function renderTranslateRow(elId, badge, ok, text) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = '<span class="ed-tag-badge">' + escapeHtml(badge) + '</span> ' +
      (ok && text
        ? '<span>' + escapeHtml(text) + '</span>'
        : '<span class="ed-route-note">' + T.routeFail + '</span>');
  }

  /**
   * API 释义 HTML（复用原 renderResult 的释义结构）
   */
  function buildApiMeaningsHtml(meanings) {
    const parts = ['<div class="ed-section-title">' + T.engDefsTitle + '</div>'];
    for (const m of meanings) {
      parts.push('<div class="ed-pos-group">');
      if (m.partOfSpeech) {
        parts.push('<span class="ed-api-pos">' + escapeHtml(m.partOfSpeech) + '</span>');
      }
      parts.push('<ol class="ed-defs">');
      const maxDefs = Math.min(m.definitions.length, 5);
      for (let i = 0; i < maxDefs; i++) {
        const d = m.definitions[i];
        parts.push('<li>');
        parts.push('<span class="ed-def">' + escapeHtml(d.definition) + '</span>');
        if (d.example) {
          parts.push('<span class="ed-example">' + escapeHtml(d.example) + '</span>');
        }
        parts.push('</li>');
      }
      parts.push('</ol>');

      if (m.synonyms && m.synonyms.length > 0) {
        parts.push('<div class="ed-syn-ant"><span class="ed-syn-label">syn: </span>');
        parts.push('<span class="ed-syn-list">' + escapeHtml(m.synonyms.slice(0, 8).join(', ')) + '</span></div>');
      }
      if (m.antonyms && m.antonyms.length > 0) {
        parts.push('<div class="ed-syn-ant"><span class="ed-syn-label">ant: </span>');
        parts.push('<span class="ed-syn-list">' + escapeHtml(m.antonyms.slice(0, 8).join(', ')) + '</span></div>');
      }

      parts.push('</div>');
    }
    return parts.join('');
  }

  /**
   * 在线词典槽：命中填释义，失败填失败占位，不影响其它路
   */
  function renderApiSlot(meanings, ok) {
    const el = document.getElementById('ed-slot-api');
    if (!el) return;
    if (ok && meanings && meanings.length > 0) {
      el.innerHTML = '<div class="ed-section ed-section-api">' + buildApiMeaningsHtml(meanings) + '</div>';
    } else {
      el.innerHTML = '<div class="ed-section-title">' + T.engDefsTitle + '</div>' +
        '<div class="ed-route-note">' + T.routeFail + '</div>';
    }
  }

  /**
   * 来源行：各路完成后逐步累积
   */
  function updateSourcesHtml(live) {
    const el = document.getElementById('ed-slot-sources');
    if (!el) return;
    const sources = [];
    if (live.fromLocal) sources.push(T.srcLocal);
    if (live.fromAPI) sources.push(T.srcAPI);
    if (live.edgeText) sources.push(T.srcEdge);
    if (live.mymemoryText) sources.push(T.srcTranslate);
    el.innerHTML = sources.length > 0 ? T.sources + escapeHtml(sources.join(' · ')) : '';
  }

  /* ════════════════════════════════════════════════════════════
   * 查询结果缓存（独立 IndexedDB 库）
   * 背景：词库分片缓存只覆盖本地释义一路，Dictionary API 释义与
   *       Edge/MyMemory 翻译每次查词仍发网络请求（0.3~0.7s）。
   * 选型：IndexedDB 无法在既有库上无损新增 store —— bump ecdict-cache
   *       的 DB_VERSION 会触发 onupgradeneeded 里的删除逻辑，清掉已下载
   *       的分片；因此使用独立库 ed-query-cache，与词库分片缓存完全隔离。
   * 规则：缓存键 = 规范化输入（trim + 小写）；值 = {word, local, api,
   *       edge, mymemory, ts}，同一词四路成功结果 merge 进同一条记录，
   *       失败路不写（不为失败路伪造成功值）；ts 超过 TTL 视为过期回源。
   * ════════════════════════════════════════════════════════════ */

  const QUERY_DB_NAME = 'ed-query-cache';
  const QUERY_DB_VERSION = 1;
  const QUERY_STORE = 'queries';
  // TTL = 30 天：词典释义/翻译均属低频变化数据，7 天会拉低重复查询命中率；
  // 失败路不写 + 过期自动回源 + 「清除缓存」手动兜底，风险可控。
  const QUERY_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  let _qdb = null;
  let _qdbBroken = false;

  function openQueryDB() {
    if (_qdb) return Promise.resolve(_qdb);
    if (_qdbBroken) return Promise.reject(new Error('Query cache unavailable'));
    return new Promise((resolve, reject) => {
      let req;
      try {
        req = indexedDB.open(QUERY_DB_NAME, QUERY_DB_VERSION);
      } catch (e) {
        _qdbBroken = true;
        reject(e);
        return;
      }
      let settled = false;
      // 与 openDB 相同的超时兜底：避免打开请求被永远排队挂死
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        _qdbBroken = true;
        reject(new Error('Query cache open timeout'));
      }, 4000);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(QUERY_STORE)) {
          db.createObjectStore(QUERY_STORE);
        }
      };
      req.onsuccess = (e) => {
        if (settled) { // 超时后才到达的成功，连接已无意义，直接关掉
          try { e.target.result.close(); } catch (err) { /* ignore */ }
          return;
        }
        settled = true;
        clearTimeout(timer);
        _qdb = e.target.result;
        _qdb.onversionchange = () => {
          try { _qdb.close(); } catch (err) { /* ignore */ }
          _qdb = null;
        };
        resolve(_qdb);
      };
      req.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(req.error);
      };
      // onblocked 不做处理，交给超时兜底
    });
  }

  function qdbGet(key) {
    return openQueryDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(QUERY_STORE, 'readonly');
      const req = tx.objectStore(QUERY_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    }));
  }

  function qdbClear() {
    return openQueryDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(QUERY_STORE, 'readwrite');
      tx.objectStore(QUERY_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    })).catch(() => { /* 库不可用时静默忽略 */ });
  }

  // 缓存键 = 规范化输入（trim + 小写），中英文统一
  function normalizeQueryKey(text) {
    return text.trim().toLowerCase();
  }

  // 读缓存：未命中 / 过期（含 ts 缺失）一律视为未命中
  async function readQueryCache(key) {
    try {
      const c = await qdbGet(key);
      if (!c || !c.ts) return null;
      if (Date.now() - c.ts > QUERY_TTL_MS) return null;
      return c;
    } catch (e) {
      return null;
    }
  }

  // 写缓存：merge 到同键（保留其它路已写入字段），patch 只含成功结果键；
  // 任一路失败则不传该键，避免伪造成功值。写入失败/配额超限静默忽略。
  function saveQueryCache(key, patch) {
    openQueryDB()
      .then(db => new Promise((resolve, reject) => {
        const tx = db.transaction(QUERY_STORE, 'readwrite');
        const store = tx.objectStore(QUERY_STORE);
        const getReq = store.get(key);
        getReq.onsuccess = () => {
          const merged = Object.assign({}, getReq.result || {}, patch, { ts: Date.now() });
          store.put(merged, key);
        };
        getReq.onerror = () => reject(getReq.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }))
      .catch(() => { /* 静默忽略 */ });
  }

  // 命中缓存：依次回填词头/本地/API/翻译/来源各槽（仍走 valid() 守卫）。
  // 返回 true 表示四路已填充，调用方应跳过在线请求直接收尾。
  function applyQueryCache(c, valid) {
    if (!valid()) return false;

    const local = c.local && c.local.translation ? c.local : null;
    const api = c.api && c.api.meanings && c.api.meanings.length ? c.api : null;

    const live = {
      word: c.word || '',
      phonetic: (local && local.phonetic) || (api && api.phonetic) || '',
      pos: (local && local.pos) || '',
      tags: (local && local.tags) || [],
      fields: (local && local.fields) || [],
      collins: (local && local.collins) || 0,
      oxford: (local && local.oxford) || 0,
      audioUrl: (api && api.audioUrl) || '',
    };
    updateWordHeader(live);

    renderLocalSlot(local);
    renderApiSlot(api ? api.meanings : null, !!api);
    renderTranslateRow('ed-t-edge', T.srcEdge, !!c.edge, c.edge || '');
    renderTranslateRow('ed-t-mm', T.srcTranslate, !!c.mymemory, c.mymemory || '');

    const sources = [];
    if (local) sources.push(T.srcLocal);
    if (api) sources.push(T.srcAPI);
    if (c.edge) sources.push(T.srcEdge);
    if (c.mymemory) sources.push(T.srcTranslate);
    const el = document.getElementById('ed-slot-sources');
    if (el) el.innerHTML = sources.length > 0 ? T.sources + escapeHtml(sources.join(' · ')) : '';

    return true;
  }

  /* ════════════════════════════════════════════════════════════
   * 核心查词逻辑
   * ════════════════════════════════════════════════════════════ */

  async function search(text) {
    text = text.trim();
    if (!text) {
      showPlaceholder(T.emptyInput);
      return;
    }

    // ── 查询会话：先取消上一轮仍在跑的并行任务，再开启新会话 ──
    abortAllQueries();
    const mySession = ++_sessionId;
    const sessionCtrl = new AbortController();
    _sessionAborts.add(sessionCtrl);
    const valid = () => _sessionId === mySession && !sessionCtrl.signal.aborted;

    const result = {
      word: text,
      phonetic: '',
      pos: '',
      tags: [],
      fields: [],
      collins: 0,
      oxford: 0,
      localTranslation: '',
      meanings: null,
      translatedText: '',
      edgeText: '',
      mymemoryText: '',
      audioUrl: '',
      fromLocal: false,
      fromAPI: false,
      fromTranslate: false,
      translateSource: null,
    };

    if (isChinese(text)) {
      result.word = text;
    } else {
      result.word = text.split(/[\s,;.]+/)[0];
    }

    // 铺开骨架：词头 + 本地/翻译(Edge/MyMemory)/API 四路"查询中…"占位
    showLoading();
    renderQuerySkeleton(result.word);
    updateWordHeader(result);

    if (isChinese(text)) {
      // 中文输入：Edge 与 MyMemory 各自并行翻译成英文，
      // 任一先返回的有效译文首词驱动一次后续本地/API 查词
      let lookupLaunched = false;
      let transSettled = 0;

      const qkey = normalizeQueryKey(text);

      const launchLookup = () => {
        if (lookupLaunched || !valid()) return;
        const ew = (result.edgeText || result.mymemoryText || '').trim().split(/[\s,;.]+/)[0];
        if (!isEnglishWord(ew)) return;
        lookupLaunched = true;
        result.word = ew;
        result.translateSource = result.edgeText ? 'edge' : 'mymemory';
        // 中文查词观感：词头被替换为翻译出的英文词，紧随词头下方插一行说明，
        // 让用户明白「由中文翻译成平行英文词再查词典」而非查询错乱
        const elHeader = document.getElementById('ed-slot-header');
        if (elHeader && !document.getElementById('ed-zh-lookup-note')) {
          const note = document.createElement('div');
          note.id = 'ed-zh-lookup-note';
          note.className = 'ed-zh-lookup-note';
          note.style.cssText = 'margin:2px 0 10px;font-size:12px;color:#8a8a8a;';
          note.textContent = T.zhLookupNote.replace('{zh}', text).replace('{en}', ew);
          elHeader.insertAdjacentElement('afterend', note);
        }
        updateWordHeader(result);

        localLookup(ew, sessionCtrl.signal).then(ld => {
          if (!valid()) return;
          if (ld) {
            result.localTranslation = ld.translation;
            result.phonetic = ld.phonetic || result.phonetic;
            result.pos = ld.pos;
            result.tags = ld.tags;
            result.fields = ld.fields;
            result.collins = ld.collins;
            result.oxford = ld.oxford;
            result.fromLocal = true;
            renderLocalSlot(ld);
          } else {
            renderLocalSlot(null);
          }
          updateWordHeader(result);
          updateSourcesHtml(result);
        });

        fetchDictAPI(ew, sessionCtrl.signal).then(ad => {
          if (!valid()) return;
          if (ad) {
            if (!result.phonetic && ad.phonetic) result.phonetic = ad.phonetic;
            result.audioUrl = ad.audioUrl;
            result.meanings = ad.meanings;
            result.fromAPI = true;
          }
          renderApiSlot(ad ? ad.meanings : null, !!ad);
          updateWordHeader(result);
          updateSourcesHtml(result);
        });
      };

      // 两路翻译都落定但仍未得到可查英文词时，把本地/API 槽置为占位，不长期"查询中"
      const maybeFailLookupSlots = () => {
        transSettled++;
        if (transSettled >= 2 && !lookupLaunched && valid()) {
          renderLocalSlot(null);
          renderApiSlot(null, false);
        }
      };

      // 翻译结果统一落点：在线返回或缓存命中都走这里（词头变换局部逻辑保持不变）
      const applyEdge = (t) => {
        result.edgeText = t || '';
        result.fromTranslate = !!(result.edgeText || result.mymemoryText);
        if (result.edgeText) result.translateSource = 'edge';
        renderTranslateRow('ed-t-edge', T.srcEdge, !!t, t || '');
        updateSourcesHtml(result);
        launchLookup();
        maybeFailLookupSlots();
      };
      const applyMm = (t) => {
        result.mymemoryText = t || '';
        result.fromTranslate = !!(result.edgeText || result.mymemoryText);
        if (!result.edgeText && result.mymemoryText) result.translateSource = 'mymemory';
        renderTranslateRow('ed-t-mm', T.srcTranslate, !!t, t || '');
        updateSourcesHtml(result);
        launchLookup();
        maybeFailLookupSlots();
      };

      // 查询结果缓存优先：命中则用缓存译文秒回翻译槽，并跳过对应的在线翻译请求；
      // 中文输入的英文联想结果块（local/api）不缓存，仍走在线，不破坏词头变换逻辑。
      const zhCached = await readQueryCache(qkey);
      let edgeFromCache = false;
      let mmFromCache = false;
      if (zhCached) {
        if (zhCached.edge) {
          edgeFromCache = true;
          applyEdge(zhCached.edge);
        }
        if (zhCached.mymemory) {
          mmFromCache = true;
          applyMm(zhCached.mymemory);
        }
      }
      if (!edgeFromCache) {
        edgeTranslate(text, 'zh', 'en', sessionCtrl.signal).then(t => {
          if (!valid()) return;
          applyEdge(t);
          if (t) saveQueryCache(qkey, { edge: t });
        });
      }
      if (!mmFromCache) {
        myMemoryTranslate(text, 'zh', 'en', sessionCtrl.signal).then(t => {
          if (!valid()) return;
          applyMm(t);
          if (t) saveQueryCache(qkey, { mymemory: t });
        });
      }
    } else {
      // 英文输入：本地释义 + API 释义 + Edge/MyMemory 翻译 四路并行，
      // 每一路完成即独立填充对应容器，互不等待
      // 查询结果缓存优先：命中且未过期则四路秒回，不再发起任何在线请求
      const qkey = normalizeQueryKey(text);
      const cached = await readQueryCache(qkey);
      if (cached && applyQueryCache(cached, valid)) {
        return;
      }

      localLookup(result.word, sessionCtrl.signal).then(ld => {
        if (!valid()) return;
        if (ld) {
          result.localTranslation = ld.translation;
          result.phonetic = ld.phonetic || result.phonetic;
          result.pos = ld.pos;
          result.tags = ld.tags;
          result.fields = ld.fields;
          result.collins = ld.collins;
          result.oxford = ld.oxford;
          result.fromLocal = true;
          renderLocalSlot(ld);
          saveQueryCache(qkey, { word: result.word, local: ld });
        } else {
          renderLocalSlot(null);
        }
        updateWordHeader(result);
        updateSourcesHtml(result);
      });

      fetchDictAPI(result.word, sessionCtrl.signal).then(ad => {
        if (!valid()) return;
        if (ad) {
          if (!result.phonetic && ad.phonetic) result.phonetic = ad.phonetic;
          result.audioUrl = ad.audioUrl;
          result.meanings = ad.meanings;
          result.fromAPI = true;
          saveQueryCache(qkey, { word: result.word, api: ad });
        }
        renderApiSlot(ad ? ad.meanings : null, !!ad);
        updateWordHeader(result);
        updateSourcesHtml(result);
      });

      edgeTranslate(text, 'en', 'zh', sessionCtrl.signal).then(t => {
        if (!valid()) return;
        result.edgeText = t || '';
        if (t) result.translateSource = 'edge';
        renderTranslateRow('ed-t-edge', T.srcEdge, !!t, t || '');
        updateSourcesHtml(result);
        if (t) saveQueryCache(qkey, { edge: t });
      });

      myMemoryTranslate(text, 'en', 'zh', sessionCtrl.signal).then(t => {
        if (!valid()) return;
        result.mymemoryText = t || '';
        if (t && !result.edgeText) result.translateSource = 'mymemory';
        renderTranslateRow('ed-t-mm', T.srcTranslate, !!t, t || '');
        updateSourcesHtml(result);
        if (t) saveQueryCache(qkey, { mymemory: t });
      });
    }
  }

  /* ════════════════════════════════════════════════════════════
   * 全量下载 UI
   * ════════════════════════════════════════════════════════════ */

  async function handleDownloadAll() {
    if (!elDownloadWrap || !elDownloadProgress) return;
    if (_downloading) return;

    // 显示进度区域
    elDownloadWrap.hidden = false;
    elDownloadBtn.disabled = true;
    elDownloadBtn.textContent = T.downloading;

    try {
      await downloadAllShards((done, total, msg) => {
        const pct = Math.round((done / total) * 100);
        elDownloadProgress.innerHTML =
          '<div class="ed-progress-bar" style="width:' + pct + '%"></div>' +
          '<span class="ed-progress-text">' + done + '/' + total + ' (' + pct + '%) ' + escapeHtml(msg) + '</span>';
      });
      // 下载结束后按剩余失败分片定按钮文案：
      // 还有失败 -> 「重试失败分片(N)」，仅下次点击会补下失败分片；全部补齐 -> 真正 100% 完成态
      const failedAfter = await readFailedShards();
      if (failedAfter.length > 0) {
        elDownloadBtn.textContent = T.retryFailedBtn + '(' + failedAfter.length + ')';
        elDownloadBtn.classList.remove('ed-btn-secondary');
      } else {
        elDownloadBtn.textContent = T.reDownload;
        elDownloadBtn.classList.add('ed-btn-secondary');
      }
    } catch (e) {
      // 任何异常都要恢复按钮，让用户可以重试，绝不卡死
      elDownloadBtn.textContent = T.downloadBtn;
      elDownloadBtn.classList.remove('ed-btn-secondary');
      elDownloadProgress.innerHTML =
        '<span class="ed-progress-text">' + escapeHtml(T.downloadError) + '</span>';
    } finally {
      elDownloadBtn.disabled = false;
      // 更新缓存状态
      updateCacheStatus();
    }
  }

  /* ════════════════════════════════════════════════════════════
    * 清除缓存
    * ════════════════════════════════════════════════════════════ */

  async function handleClearCache() {
    if (_downloading) return;
    if (!confirm(T.clearCacheConfirm)) return;

    // 1. 清空内存缓存
    for (const k in _shardCache) delete _shardCache[k];

    // 2. 清空 IndexedDB：在现有连接上直接 clear() 两个仓库。
    //    注意：不能用 close() + deleteDatabase() 的老方案——
    //    只要有任何未关闭的连接（其他标签页、残留连接）占着，
    //    deleteDatabase 就会被阻塞，且此后所有 open() 请求都会排在
    //    这次未完成的删除后面永远不返回，导致再次下载卡死在"准备中"。
    if (elDownloadBtn) elDownloadBtn.textContent = T.clearing;
    try {
      const db = await openDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
        tx.objectStore(STORE_NAME).clear();
        tx.objectStore(META_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch (e) { /* IndexedDB 不可用时只清内存缓存也算成功 */ }

    // 2.5 清空查询结果缓存（独立库 ed-query-cache），让下次查询恢复走在线
    try { await qdbClear(); } catch (e) { /* 查询缓存不可用时忽略 */ }

    // 3. 重置下载按钮与进度区
    if (elDownloadBtn) {
      elDownloadBtn.disabled = false;
      elDownloadBtn.textContent = T.downloadBtn;
      elDownloadBtn.classList.remove('ed-btn-secondary');
    }
    if (elDownloadWrap) {
      elDownloadWrap.hidden = true;
      if (elDownloadProgress) elDownloadProgress.innerHTML = '';
    }

    // 4. 更新缓存状态横幅（count 归零，清除按钮自动隐藏）
    await updateCacheStatus();

    // 5. 短暂提示已清除
    if (elBanner) {
      elBanner.innerHTML = '<i class="fas fa-broom"></i> <span>' + T.cleared + '</span>';
      setTimeout(() => updateCacheStatus(), 2000);
    }
  }

  /* ════════════════════════════════════════════════════════════
   * 缓存状态更新
   * ════════════════════════════════════════════════════════════ */

  async function updateCacheStatus() {
    if (!elBanner) return;
    try {
      const count = await dbCount(STORE_NAME);

      // 有缓存才显示「清除缓存」按钮
      if (elClearBtn) elClearBtn.hidden = (count === 0);

      if (count === 26) {
        elBanner.innerHTML = '<i class="fas fa-check-circle"></i> <span>' + T.cacheFull + '</span>';
        if (elDownloadWrap) elDownloadWrap.hidden = true;
        if (elDownloadBtn) {
          elDownloadBtn.textContent = T.downloaded;
          elDownloadBtn.classList.add('ed-btn-secondary');
        }
      } else if (count > 0) {
        elBanner.innerHTML = '<i class="fas fa-database"></i> <span>' + T.cachePartial + count + T.cachePartialSuffix +
          '<a href="#" id="ed-download-link">' + T.cacheDownloadLink + '</a>' + T.progressUnit + '</span>';
        const link = $('ed-download-link');
        if (link) link.addEventListener('click', (e) => { e.preventDefault(); handleDownloadAll(); });
      } else {
        elBanner.innerHTML = '<i class="fas fa-cloud-download-alt"></i> <span>' + T.cacheNone +
          '<a href="#" id="ed-download-link">' + T.cacheNoneLink + '</a>' + T.cacheNoneSuffix + '</span>';
        const link = $('ed-download-link');
        if (link) link.addEventListener('click', (e) => { e.preventDefault(); handleDownloadAll(); });
      }
    } catch (e) { /* ignore */ }
  }

  /* ════════════════════════════════════════════════════════════
   * 事件绑定
   * ════════════════════════════════════════════════════════════ */

  function bindEvents() {
    elBtn.addEventListener('click', () => search(elInput.value));

    elInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        search(elInput.value);
      }
    });

    // 发音按钮事件委托
    elContent.addEventListener('click', (e) => {
      const btn = e.target.closest('.ed-btn-speak');
      if (!btn) return;
      const word = btn.dataset.word;
      const audioUrl = btn.dataset.audio;
      pronounce(word, audioUrl);
    });

    // 全量下载按钮
    if (elDownloadBtn) {
      elDownloadBtn.addEventListener('click', handleDownloadAll);
    }

    // 清除缓存按钮
    if (elClearBtn) {
      elClearBtn.addEventListener('click', handleClearCache);
    }

    if (elPlaceholder) {
      elPlaceholder.dataset.defaultText = elPlaceholder.textContent;
    }
  }

  /* ════════════════════════════════════════════════════════════
   * 初始化
   * ════════════════════════════════════════════════════════════ */

  function init() {
    initElements();
    if (!elInput) return;
    bindEvents();

    // 应用 i18n 文案
    elInput.placeholder = T.placeholder;
    if (elBtn) elBtn.textContent = T.searchBtn;
    if (elPlaceholder) elPlaceholder.textContent = T.placeholder;

    // 预加载语音引擎
    initVoices();

    // 显示缓存状态
    updateCacheStatus();

    // 刷新页面后恢复「上次有失败分片」的按钮态：显示「重试失败分片(N)」，避免误以为词库已完整
    if (elDownloadBtn) {
      readFailedShards().then(fs => {
        if (fs.length > 0) {
          elDownloadBtn.textContent = T.retryFailedBtn + '(' + fs.length + ')';
          elDownloadBtn.classList.remove('ed-btn-secondary');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
