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
      downloadBtn: '下载完整词库',
      downloadHint: '约 235MB，下载后离线可用',
      downloading: '下载中…',
      reDownload: '重新下载',
      downloaded: '词库已下载，重新下载',
      downloadPrepare: '准备中…',
      downloadFetching: '下载 ',
      downloadComplete: '全部完成',
      downloadError: '下载中断，请点击重试',
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
      downloadBtn: 'Download Full Dictionary',
      downloadHint: '~235MB, enables offline lookup',
      downloading: 'Downloading…',
      reDownload: 'Re-download',
      downloaded: 'Downloaded, re-download',
      downloadPrepare: 'Preparing…',
      downloadFetching: 'Downloading ',
      downloadComplete: 'Complete',
      downloadError: 'Download interrupted, click to retry',
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
  // 词库分片不再随博客仓库分发（26 个分片共 236MB，会撑爆 git 历史），
  // 改从独立数据仓库按需下载。
  //
  // ⚠️ CORS 说明：GitHub Releases 下载会 302 重定向到 objects.githubusercontent.com，
  //    该域名不发送 CORS 头，浏览器 fetch 直接报 "Failed to fetch"。
  //    因此必须使用支持 CORS 的源，按优先级排列：
  const SHARD_SOURCES = [
    // 1. jsDelivr Fastly 节点 — 国内通常比主域名快
    'https://fastly.jsdelivr.net/gh/sunyazhou13/english-dictionary-data@main/',
    // 2. jsDelivr 主域名 — 备用
    'https://cdn.jsdelivr.net/gh/sunyazhou13/english-dictionary-data@main/',
    // 3. GitHub Raw — CORS 支持，但国内访问较慢，作为最后兜底
    'https://raw.githubusercontent.com/sunyazhou13/english-dictionary-data/main/',
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
   * 分片获取（按需下载 + 缓存）
   * ════════════════════════════════════════════════════════════ */

  /**
   * 带超时的 fetch —— 单个请求挂住时中止，避免流程永远卡住
   */
  async function fetchWithTimeout(url, timeoutMs) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(url, { signal: ctrl.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 多源分片下载 —— 依次尝试 SHARD_SOURCES 中的每个源，
   * 第一个返回有效 JSON 的源即采用，避免单一源 CORS 不可用或临时故障导致下载失败。
   * @returns {Promise<object>} 解析后的词库分片 JSON
   */
  async function fetchShardJson(letter, timeoutMs) {
    let lastErr = null;
    for (const base of SHARD_SOURCES) {
      const url = base + letter + '.json';
      try {
        const resp = await fetchWithTimeout(url, timeoutMs);
        if (resp.ok) {
          const data = await resp.json();
          if (data && typeof data === 'object') return data;
        }
        lastErr = new Error('HTTP ' + resp.status + ' @ ' + base);
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr || new Error('All shard sources failed for: ' + letter);
  }

  const _shardCache = {};

  async function getShard(letter) {
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

    // 下载分片（30 秒超时，多源 fallback）
    const data = await fetchShardJson(letter, 30000);
    _shardCache[letter] = data;

    try { await dbPut(STORE_NAME, letter, data); } catch (e) { /* ignore */ }

    return data;
  }

  /* ════════════════════════════════════════════════════════════
   * 全量词库下载
   * ════════════════════════════════════════════════════════════ */

  let _downloading = false;

  async function downloadAllShards(onProgress) {
    if (_downloading) return;
    _downloading = true;

    try {
      // 先检查已缓存的分片
      let cachedKeys = [];
      try { cachedKeys = await dbGetKeys(STORE_NAME); } catch (e) {}
      const cachedSet = new Set(cachedKeys.map(k => String(k).toLowerCase()));

      const toDownload = LETTERS.filter(l => !cachedSet.has(l));
      const total = LETTERS.length;
      let done = total - toDownload.length;

      onProgress(done, total, T.downloadPrepare);

      // 4 路并行下载（浏览器对同一域名允许 6 个并发连接，4 路平衡速度与稳定性）
      // 单个分片 120 秒超时兜底
      const CONCURRENCY = 4;
      let failed = [];
      let queue = [...toDownload];

      async function downloadWorker() {
        while (queue.length > 0) {
          const letter = queue.shift();
          if (!letter) break;
          onProgress(done, total, T.downloadFetching + letter.toUpperCase() + '.json …');
          try {
            const data = await fetchShardJson(letter, 120000);
            _shardCache[letter] = data;
            try { await dbPut(STORE_NAME, letter, data); } catch (e) {}
          } catch (e) {
            failed.push(letter);
          }
          done++;
          const nextLetter = queue[0];
          onProgress(done, total, nextLetter
            ? T.downloadFetching + nextLetter.toUpperCase() + '.json …'
            : T.downloadComplete);
        }
      }

      // 启动 CONCURRENCY 个 worker
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toDownload.length) }, downloadWorker));

      // 标记全量下载完成（有失败则不标记，提示用户）
      if (failed.length === 0) {
        try { await dbPut(META_STORE, 'fullDownloaded', Date.now()); } catch (e) {}
      }

      onProgress(total, total, failed.length > 0
        ? T.downloadError + ' (' + failed.length + ' 分片失败: ' + failed.join(',').toUpperCase() + ')'
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
  async function localLookup(word) {
    word = word.trim().toLowerCase();
    if (!word) return null;

    const letter = word[0];
    if (!/[a-z]/.test(letter)) return null;

    try {
      const shard = await getShard(letter);
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

  async function fetchDictAPI(word) {
    word = word.trim().toLowerCase();
    if (!word) return null;

    try {
      const resp = await fetch(DICT_API + encodeURIComponent(word));
      if (!resp.ok) return null;
      const data = await resp.json();
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
    } catch (e) {
      return null;
    }
  }

  /* ════════════════════════════════════════════════════════════
   * MyMemory 翻译 API
   * ════════════════════════════════════════════════════════════ */

  const TRANSLATE_API = 'https://api.mymemory.translated.net/get?q=';

  async function translate(text, from, to) {
    const url = TRANSLATE_API + encodeURIComponent(text) + '&langpair=' + from + '|' + to;
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const data = await resp.json();
      return data.responseData?.translatedText || null;
    } catch (e) {
      return null;
    }
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

  /**
   * 渲染查词结果（有道风格）
   */
  function renderResult(data) {
    const parts = [];

    // ── 单词标题行 ──
    parts.push('<div class="ed-word-header">');
    parts.push('<div class="ed-word-main">');
    parts.push('<span class="ed-word">' + escapeHtml(data.word) + '</span>');

    // 发音按钮
    if (data.word && /^[a-zA-Z]/.test(data.word)) {
      parts.push(
        '<button type="button" class="ed-btn-speak" ' +
        'data-word="' + escapeHtml(data.word) + '"' +
        (data.audioUrl ? ' data-audio="' + escapeHtml(data.audioUrl) + '"' : '') +
        ' aria-label="' + T.speak + '"><i class="fas fa-volume-up"></i></button>'
      );
    }

    parts.push('</div>'); // ed-word-main

    // 音标
    if (data.phonetic) {
      parts.push('<span class="ed-phonetic">/' + escapeHtml(data.phonetic) + '/</span>');
    }

    // 标签行：词性 + 考试等级 + Collins 星级 + 牛津核心词
    const badges = [];
    const posCodes = parsePosCodes(data.pos);
    for (const code of posCodes) {
      badges.push('<span class="ed-pos-badge">' + escapeHtml(POS_MAP[code]) + '</span>');
    }
    if (data.oxford) {
      badges.push('<span class="ed-oxford-badge" title="' + T.oxfordTitle + '">' + T.oxfordBadge + '</span>');
    }
    if (data.collins) {
      badges.push(renderCollinsStars(data.collins));
    }
    if (data.tags && data.tags.length > 0) {
      badges.push(renderTagBadges(data.tags));
    }

    if (badges.length > 0) {
      parts.push('<div class="ed-badges-row">' + badges.join('') + '</div>');
    }

    parts.push('</div>'); // ed-word-header

    // ── 专业领域标注 ──
    if (data.fields && data.fields.length > 0) {
      parts.push('<div class="ed-fields-row">' + renderFieldBadges(data.fields) + '</div>');
    }

    // ── 中文释义（本地词库）──
    if (data.localTranslation) {
      const lines = data.localTranslation.split('\n');
      parts.push('<div class="ed-section ed-section-local">');
      parts.push('<div class="ed-section-title">' + T.localTitle + '</div>');
      parts.push('<div class="ed-translation">');
      for (const line of lines) {
        if (line.trim()) {
          parts.push('<p>' + escapeHtml(line) + '</p>');
        }
      }
      parts.push('</div>');
      parts.push('</div>');
    }

    // ── 翻译结果（中英互译）──
    if (data.translatedText) {
      parts.push('<div class="ed-section ed-section-translate">');
      parts.push('<div class="ed-section-title">' + T.translateTitle + '</div>');
      parts.push('<div class="ed-translation-text">' + escapeHtml(data.translatedText) + '</div>');
      parts.push('</div>');
    }

    // ── 英文详细释义（API）──
    if (data.meanings && data.meanings.length > 0) {
      parts.push('<div class="ed-section ed-section-api">');
      parts.push('<div class="ed-section-title">' + T.engDefsTitle + '</div>');

      for (const m of data.meanings) {
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
      parts.push('</div>');
    }

    // ── 数据来源 ──
    const sources = [];
    if (data.fromLocal) sources.push(T.srcLocal);
    if (data.fromAPI) sources.push(T.srcAPI);
    if (data.fromTranslate) sources.push(T.srcTranslate);
    if (sources.length > 0) {
      parts.push('<div class="ed-sources">' + T.sources + escapeHtml(sources.join(' · ')) + '</div>');
    }

    showContent(parts.join(''));
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

    showLoading();

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
      audioUrl: '',
      fromLocal: false,
      fromAPI: false,
      fromTranslate: false,
    };

    if (isChinese(text)) {
      // 中文输入：先翻译成英文
      const translated = await translate(text, 'zh', 'en');
      if (translated) {
        result.translatedText = translated;
        result.fromTranslate = true;
        const translatedWord = translated.split(/[\s,;.]+/)[0];
        if (isEnglishWord(translatedWord)) {
          result.word = translatedWord;
          await enrichEnglishWord(result);
        }
      } else {
        showPlaceholder(T.translateFail);
        return;
      }
    } else {
      // 英文输入：查词 + 翻译成中文（并发执行）
      result.word = text.split(/[\s,;.]+/)[0];
      const [, translated] = await Promise.all([
        enrichEnglishWord(result),
        translate(text, 'en', 'zh'),
      ]);
      if (translated) {
        result.translatedText = translated;
        result.fromTranslate = true;
      }
    }

    if (!result.fromLocal && !result.fromAPI && !result.fromTranslate) {
      showPlaceholder(T.notFound + text + T.notFoundSuffix);
      return;
    }

    renderResult(result);
  }

  /**
   * 用本地词库 + Dictionary API 并发补充信息
   */
  async function enrichEnglishWord(result) {
    const [localData, apiData] = await Promise.all([
      localLookup(result.word),
      fetchDictAPI(result.word),
    ]);

    if (localData) {
      result.localTranslation = localData.translation;
      result.phonetic = localData.phonetic || result.phonetic;
      result.pos = localData.pos;
      result.tags = localData.tags;
      result.fields = localData.fields;
      result.collins = localData.collins;
      result.oxford = localData.oxford;
      result.fromLocal = true;
    }

    if (apiData) {
      if (!result.phonetic && apiData.phonetic) {
        result.phonetic = apiData.phonetic;
      }
      result.audioUrl = apiData.audioUrl;
      result.meanings = apiData.meanings;
      result.fromAPI = true;
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
      elDownloadBtn.textContent = T.reDownload;
      elDownloadBtn.classList.add('ed-btn-secondary');
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
