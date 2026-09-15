// 多语在线翻译工具 —— 零依赖 ES module
// 数据源（4 路）：Edge / MyMemory（keyless、CORS 友好）+ 百度 / 有道（JSONP + 站长密钥）
// 自动检测：纯前端 Unicode 字符区间启发式（不依赖任何在线检测接口）

const EDGE_TRANSLATE_API = 'https://edge.microsoft.com/translate/translatetext';
const MYMEMORY_API = 'https://api.mymemory.translated.net/get?q=';

// 页面是否英文版（用于用量/提示文案本地化）
const TR_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0 || /-en\/?$/.test(location.pathname);

// 语言表（code 为 Edge 接受的 BCP-47 / 语言码）
const LANGS = [
  { code: 'zh-Hans', name: '简体中文', native: '中文' },
  { code: 'zh-Hant', name: '繁體中文', native: '中文' },
  { code: 'en', name: '英语', native: 'English' },
  { code: 'es', name: '西班牙语', native: 'Español' },
  { code: 'pt', name: '葡萄牙语', native: 'Português' },
  { code: 'ja', name: '日语', native: '日本語' },
  { code: 'ko', name: '韩语', native: '한국어' },
  { code: 'fr', name: '法语', native: 'Français' },
  { code: 'de', name: '德语', native: 'Deutsch' },
  { code: 'it', name: '意大利语', native: 'Italiano' },
  { code: 'ru', name: '俄语', native: 'Русский' },
  { code: 'ar', name: '阿拉伯语', native: 'العربية' },
  { code: 'hi', name: '印地语', native: 'हिन्दी' },
  { code: 'th', name: '泰语', native: 'ไทย' },
  { code: 'vi', name: '越南语', native: 'Tiếng Việt' },
  { code: 'tr', name: '土耳其语', native: 'Türkçe' },
  { code: 'nl', name: '荷兰语', native: 'Nederlands' },
  { code: 'pl', name: '波兰语', native: 'Polski' },
  { code: 'uk', name: '乌克兰语', native: 'Українська' },
  { code: 'id', name: '印尼语', native: 'Bahasa Indonesia' },
  { code: 'ms', name: '马来语', native: 'Bahasa Melayu' },
  { code: 'fa', name: '波斯语', native: 'فارسی' },
  { code: 'el', name: '希腊语', native: 'Ελληνικά' },
  { code: 'cs', name: '捷克语', native: 'Čeština' },
  { code: 'sv', name: '瑞典语', native: 'Svenska' },
  { code: 'da', name: '丹麦语', native: 'Dansk' },
  { code: 'fi', name: '芬兰语', native: 'Suomi' },
  { code: 'no', name: '挪威语', native: 'Norsk' },
  { code: 'ro', name: '罗马尼亚语', native: 'Română' },
  { code: 'hu', name: '匈牙利语', native: 'Magyar' },
  { code: 'he', name: '希伯来语', native: 'עברית' },
  { code: 'bg', name: '保加利亚语', native: 'Български' },
  { code: 'hr', name: '克罗地亚语', native: 'Hrvatski' },
  { code: 'sk', name: '斯洛伐克语', native: 'Slovenčina' },
  { code: 'sl', name: '斯洛文尼亚语', native: 'Slovenščina' },
  { code: 'sr', name: '塞尔维亚语', native: 'Српски' },
  { code: 'lt', name: '立陶宛语', native: 'Lietuvių' },
  { code: 'lv', name: '拉脱维亚语', native: 'Latviešu' },
  { code: 'et', name: '爱沙尼亚语', native: 'Eesti' },
  { code: 'ca', name: '加泰罗尼亚语', native: 'Català' },
  { code: 'eu', name: '巴斯克语', native: 'Euskara' },
  { code: 'gl', name: '加利西亚语', native: 'Galego' },
  { code: 'cy', name: '威尔士语', native: 'Cymraeg' },
  { code: 'ga', name: '爱尔兰语', native: 'Gaeilge' },
  { code: 'sw', name: '斯瓦希里语', native: 'Kiswahili' },
  { code: 'af', name: '南非荷兰语', native: 'Afrikaans' },
  { code: 'sq', name: '阿尔巴尼亚语', native: 'Shqip' },
  { code: 'hy', name: '亚美尼亚语', native: 'Հայերեն' },
  { code: 'az', name: '阿塞拜疆语', native: 'Azərbaycanca' },
  { code: 'ka', name: '格鲁吉亚语', native: 'ქართული' },
  { code: 'kk', name: '哈萨克语', native: 'Қазақша' },
  { code: 'mk', name: '马其顿语', native: 'Македонски' },
  { code: 'mn', name: '蒙古语', native: 'Монгол' },
  { code: 'ne', name: '尼泊尔语', native: 'नेपाली' },
  { code: 'pa', name: '旁遮普语', native: 'ਪੰਜਾਬੀ' },
  { code: 'ta', name: '泰米尔语', native: 'தமிழ்' },
  { code: 'te', name: '泰卢固语', native: 'తెలుగు' },
  { code: 'ur', name: '乌尔都语', native: 'اردو' },
];
const LANG_NAME = Object.fromEntries(LANGS.map(l => [l.code, l.name]));

const $ = (id) => document.getElementById(id);

// ── 自动检测：Unicode 字符区间启发式 ──
function detectLang(text) {
  if (!text || !text.trim()) return null;
  const has = (re) => re.test(text);
  if (has(/[぀-ヿ]/)) return 'ja';                 // 平假名 / 片假名
  if (has(/[가-힯]/)) return 'ko';                 // 谚文
  if (has(/[Ѐ-ӿ]/)) return 'ru';                  // 西里尔
  if (has(/[Ͱ-Ͽ]/)) return 'el';                  // 希腊
  if (has(/[ؠ-ۿ]/)) return 'ar';                  // 阿拉伯
  if (has(/[֐-׿]/)) return 'he';                  // 希伯来
  if (has(/[฀-๿]/)) return 'th';                  // 泰文
  if (has(/[က-ၿ]/)) return 'my';                  // 缅甸
  if (has(/[ក-៟]/)) return 'km';                  // 高棉
  if (has(/[ऀ-ॿ]/)) return 'hi'; // 天城文（印地语等）
  if (has(/[一-鿿]/)) return 'zh-Hans';           // CJK 汉字（无假名/谚文时默认中文）
  if (has(/[À-ɏA-Za-z]/)) return 'en';           // 拉丁字母默认英语
  return 'en';
}

function mmLang(code) {
  if (code === 'zh-Hans') return 'zh-CN';
  if (code === 'zh-Hant') return 'zh-TW';
  return code;
}

// ── Edge 翻译（8s 超时，fetch + XHR 双通道绕开扩展劫持）──
async function edgeTranslate(text, from, to) {
  const url = EDGE_TRANSLATE_API + '?from=' + encodeURIComponent(from) + '&to=' + encodeURIComponent(to);
  const ctrl = new AbortController();
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
    try {
      const result = await new Promise((resolve) => {
        let settled = false;
        const done = (v) => { if (!settled) { settled = true; resolve(v); } };
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.timeout = 8000;
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { const d = JSON.parse(xhr.responseText); done(d?.[0]?.translations?.[0]?.text || null); }
            catch (err) { done(null); }
          } else done(null);
        };
        xhr.onerror = () => done(null);
        xhr.ontimeout = () => done(null);
        try { xhr.send(JSON.stringify([text])); } catch (s) { done(null); }
        setTimeout(() => done(null), 11000);
      });
      return result;
    } catch (x) { return null; }
  } finally {
    clearTimeout(timer);
  }
}

// ── MyMemory 翻译（5s 超时，失败返回 null）──
async function myMemoryTranslate(text, from, to) {
  const url = MYMEMORY_API + encodeURIComponent(text) + '&langpair=' + mmLang(from) + '|' + mmLang(to);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const resp = await fetch(url, { signal: ctrl.signal });
    if (!resp.ok) return null;
    const data = await resp.json();
    const t = data?.responseData?.translatedText;
    if (!t || /MYMEMORY WARNING/i.test(t)) return null;
    return t;
  } catch (e) { return null; }
  finally { clearTimeout(timer); }
}

// ── 第三方平台接入（百度 / 有道，纯前端 JSONP，key 明文由站长填写）──
// 百度/有道翻译 API 不返回 CORS 头，浏览器 fetch 被同源策略拦截；但两者均支持
// JSONP（callback 参数），<script> 注入可绕过 CORS，故纯前端直连可行、无需后端代理。
// key 明文置于前端（站长确认可接受），签名在浏览器端计算。
const BAIDU_APP_ID = '20260915002684843'; // ← 百度翻译 APP ID
const BAIDU_KEY = 'i9CHCGF50e4KXP0V_Zav';    // ← 百度翻译密钥（MD5 签名用）
const YOUDAO_APP_KEY = '0ab74a234fee8bd2'; // ← 有道智云 APP KEY
const YOUDAO_KEY = 'zStrk6Ua52uN6P3onGdWeIOlyNpwhKDY';      // ← 有道智云密钥（SHA256 签名用）

// ── 免费额度护栏：本地统计百度(字符/月)与有道(请求/天)用量，触顶自动跳过付费通道，只走 Edge/MyMemory 免费通道，杜绝超额扣费 ──
// 百度按字符计费、超额可能按量扣费，故以字符数守护；有道入门版按请求数限流(超额返回 412 不扣费)，以请求数守护。
// 阈值默认可按你实际开通档位调整：标准版 5 万字符/月、个人认证高级版 100 万字符/月；有道入门版 100 次/天。
const BAIDU_MONTHLY_FREE = 50000; // ← 百度每月免费字符额度（标准版 50000；若确认是个人认证高级版可改 1000000）
const YOUDAO_DAILY_FREE  = 100;   // ← 有道每日免费请求次数（入门版 100；超额返回 412 不扣费）
function _lsGet(k) { try { const v = localStorage.getItem(k); return v == null ? 0 : (parseInt(v, 10) || 0); } catch (e) { return 0; } }
function _lsSet(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
function _baiduMonthKey() { const d = new Date(); return 'tr_baidu_' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function _youdaoDayKey()   { const d = new Date(); return 'tr_youdao_' + d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
// 发送前检查是否触顶（仅判断，不预占）；仅成功翻译才累加用量，避免把失败请求也算进额度
function baiduQuotaRemaining(text) { if (!(BAIDU_APP_ID && BAIDU_KEY)) return false; return _lsGet(_baiduMonthKey()) + text.length <= BAIDU_MONTHLY_FREE; }
function baiduQuotaAdd(text) { _lsSet(_baiduMonthKey(), _lsGet(_baiduMonthKey()) + text.length); }
function youdaoQuotaRemaining() { if (!(YOUDAO_APP_KEY && YOUDAO_KEY)) return false; return _lsGet(_youdaoDayKey()) + 1 <= YOUDAO_DAILY_FREE; }
function youdaoQuotaAdd() { _lsSet(_youdaoDayKey(), _lsGet(_youdaoDayKey()) + 1); }

// 百度语言码映射（百度用自有码：ja→jp, ko→kor, fr→fra, es→spa, zh-Hans→zh, zh-Hant→cht…）
function baiduLang(code) {
  const m = {
    'zh-Hans': 'zh', 'zh-Hant': 'cht', 'en': 'en', 'ja': 'jp', 'ko': 'kor', 'fr': 'fra',
    'de': 'de', 'es': 'spa', 'pt': 'pt', 'ru': 'ru', 'ar': 'ara', 'it': 'it', 'th': 'th',
    'vi': 'vie', 'tr': 'tur', 'nl': 'nl', 'pl': 'pl', 'el': 'el', 'cs': 'cs', 'sv': 'swe',
    'da': 'dan', 'fi': 'fin', 'no': 'nor', 'ro': 'rom', 'hu': 'hu', 'he': 'he', 'bg': 'bul',
    'hr': 'hrv', 'sk': 'sk', 'sl': 'slo', 'sr': 'sr', 'uk': 'ukr', 'id': 'id', 'ms': 'ms',
    'fa': 'fa', 'hi': 'hi',
  };
  return m[code] || null; // 不支持的语言返回 null → 该引擎跳过
}
// 有道语言码映射（zh-Hans→zh-CHS, zh-Hant→zh-CHT，其余基本同 BCP-47）
function youdaoLang(code) {
  const m = { 'zh-Hans': 'zh-CHS', 'zh-Hant': 'zh-CHT' };
  return m[code] || code;
}

// 紧凑 MD5（百度签名用，UTF-8 字节输入，标准 RFC1321 参考实现）
function md5(input) {
  const bytes = new TextEncoder().encode(input);
  const s = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
             5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
             4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
             6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
  const K = [];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) >>> 0;
  const total = ((bytes.length + 8 + 63) & ~63);
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[bytes.length] = 0x80;
  const dv = new DataView(msg.buffer);
  const ml = bytes.length * 8;
  dv.setUint32(total - 8, ml >>> 0, true);
  dv.setUint32(total - 4, Math.floor(ml / 4294967296) >>> 0, true);
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const rotl = (x, n) => ((x << n) | (x >>> (32 - n))) >>> 0;
  const add = (x, y) => (x + y) >>> 0;
  const F = (b,c,d) => (b & c) | (~b & d);
  const G = (b,c,d) => (b & d) | (c & ~d);
  const H = (b,c,d) => b ^ c ^ d;
  const I = (b,c,d) => c ^ (b | ~d);
  const step = (fn, a, b, c, d, x, k, si) => [add(rotl(add(add(a, fn(b,c,d)), add(x, k)), si), b), b, c, d];
  for (let off = 0; off < total; off += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(off + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 16; i++) { let r = step(F, A,B,C,D, M[i], K[i], s[i]); A=r[0];B=r[1];C=r[2];D=r[3]; [A,B,C,D]=[D,A,B,C]; }
    for (let i = 16; i < 32; i++) { let r = step(G, A,B,C,D, M[(i*5+1)%16], K[i], s[i]); A=r[0];B=r[1];C=r[2];D=r[3]; [A,B,C,D]=[D,A,B,C]; }
    for (let i = 32; i < 48; i++) { let r = step(H, A,B,C,D, M[(i*3+5)%16], K[i], s[i]); A=r[0];B=r[1];C=r[2];D=r[3]; [A,B,C,D]=[D,A,B,C]; }
    for (let i = 48; i < 64; i++) { let r = step(I, A,B,C,D, M[(i*7)%16], K[i], s[i]); A=r[0];B=r[1];C=r[2];D=r[3]; [A,B,C,D]=[D,A,B,C]; }
    a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
  }
  const out = new DataView(new ArrayBuffer(16));
  out.setUint32(0, a0, true); out.setUint32(4, b0, true); out.setUint32(8, c0, true); out.setUint32(12, d0, true);
  return [...new Uint8Array(out.buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// JSONP 助手（<script> 注入绕过 CORS；超时/错误返回 null 不影响其它引擎）
function jsonp(url, timeoutMs) {
  return new Promise((resolve) => {
    const cb = '_jp_' + Math.random().toString(36).slice(2, 10);
    let script, timer;
    let done = false;
    const cleanup = () => {
      try { delete window[cb]; } catch (e) {}
      try { if (script) script.remove(); } catch (e) {}
      if (timer) clearTimeout(timer);
    };
    timer = setTimeout(() => { if (!done) { done = true; cleanup(); resolve(null); } }, timeoutMs);
    window[cb] = (data) => { if (done) return; done = true; cleanup(); resolve(data); };
    script = document.createElement('script');
    script.onerror = () => { if (!done) { done = true; cleanup(); resolve(null); } };
    script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + encodeURIComponent(cb);
    (document.head || document.body).appendChild(script);
  });
}

// 百度翻译（JSONP + MD5 签名）
async function baiduTranslate(text, from, to) {
  const f = baiduLang(from), t = baiduLang(to);
  if (!f || !t || !BAIDU_APP_ID || !BAIDU_KEY) return null;
  if (!baiduQuotaRemaining(text)) return null; // 触顶：跳过百度，避免超额扣费
  const salt = String(Math.floor(Math.random() * 1e9));
  const sign = md5(BAIDU_APP_ID + text + salt + BAIDU_KEY);
  const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
    + '?q=' + encodeURIComponent(text) + '&from=' + f + '&to=' + t
    + '&appid=' + BAIDU_APP_ID + '&salt=' + salt + '&sign=' + sign;
  const data = await jsonp(url, 8000);
  // 百度成功时 error_code === "0"（字符串），其它值才表示错误；"0" 为 truthy 须显式排除
  if (!data || (data.error_code && data.error_code !== '0')) return null;
  const out = data.trans_result?.[0]?.dst || null;
  if (out) baiduQuotaAdd(text); // 仅成功才计字符
  return out;
}

// 有道智云翻译（JSONP + SHA256 签名 v3）
async function youdaoTranslate(text, from, to) {
  const f = youdaoLang(from), t = youdaoLang(to);
  if (!YOUDAO_APP_KEY || !YOUDAO_KEY) return null;
  if (!youdaoQuotaRemaining()) return null; // 触顶：跳过有道，避免无效请求（超额返回 412 不扣费）
  const salt = Math.random().toString(36).slice(2);
  const curtime = String(Math.floor(Date.now() / 1000));
  const input = text.length > 20 ? text.slice(0, 10) + text.slice(-10) : text;
  const sign = await sha256hex(YOUDAO_APP_KEY + input + salt + curtime + YOUDAO_KEY);
  const url = 'https://openapi.youdao.com/api'
    + '?q=' + encodeURIComponent(text) + '&from=' + f + '&to=' + t
    + '&appKey=' + YOUDAO_APP_KEY + '&salt=' + salt + '&curtime=' + curtime
    + '&sign=' + sign + '&signType=v3';
  const data = await jsonp(url, 8000);
  // 有道成功时 errorCode === "0"（字符串），其它值才表示错误；"0" 为 truthy 须显式排除
  if (!data || (data.errorCode && data.errorCode !== '0')) return null;
  const out = data.translation?.[0] || null;
  if (out) youdaoQuotaAdd(); // 仅成功才计次数
  return out;
}

// ── 多引擎对照（默认交互）：四引擎同时发起，各自独立出结果，互不干扰 ──
// 每个引擎包装为 runEngine → { text, reason }：text 为译文；reason 为失败原因分类
//（null=成功 / 'key'=未配置密钥 / 'quota'=免费额度用尽 / 'fail'=请求失败或不支持该语种）
const ENGINES = [
  { key: 'baidu',    fn: (t, f, o) => baiduTranslate(t, f, o) },
  { key: 'youdao',   fn: (t, f, o) => youdaoTranslate(t, f, o) },
  { key: 'edge',     fn: (t, f, o) => edgeTranslate(t, f, o) },
  { key: 'mymemory', fn: (t, f, o) => myMemoryTranslate(t, f, o) },
];
async function runEngine(eng, text, from, to) {
  if (eng.key === 'baidu' && !(BAIDU_APP_ID && BAIDU_KEY)) return { text: null, reason: 'key' };
  if (eng.key === 'baidu' && !baiduQuotaRemaining(text)) return { text: null, reason: 'quota' };
  if (eng.key === 'youdao' && !(YOUDAO_APP_KEY && YOUDAO_KEY)) return { text: null, reason: 'key' };
  if (eng.key === 'youdao' && !youdaoQuotaRemaining()) return { text: null, reason: 'quota' };
  try {
    const out = await eng.fn(text, from, to);
    return { text: out, reason: out ? null : 'fail' };
  } catch (e) {
    return { text: null, reason: 'fail' };
  }
}

// 各引擎卡片的多语言文案
const CARD_LABELS = {
  baidu:    { name: TR_EN ? 'Baidu' : '百度翻译',  idle: TR_EN ? 'Waiting…' : '等待翻译…' },
  youdao:   { name: TR_EN ? 'Youdao' : '有道智云', idle: TR_EN ? 'Waiting…' : '等待翻译…' },
  edge:     { name: 'Edge',                        idle: TR_EN ? 'Waiting…' : '等待翻译…' },
  mymemory: { name: 'MyMemory',                    idle: TR_EN ? 'Waiting…' : '等待翻译…' },
};

function reasonText(reason) {
  if (reason === 'key')   return TR_EN ? 'Not configured' : '未配置密钥';
  if (reason === 'quota') return TR_EN ? 'Free quota used up' : '免费额度已用尽';
  return TR_EN ? 'Request failed / language not supported' : '请求失败或该语种暂不支持';
}

// 更新单个引擎卡片：state = 'loading' | 'done' | 'error' | 'idle'
function setCard(eng, state, msg) {
  const card = elResults.querySelector('[data-card="' + eng + '"]');
  if (!card) return;
  const out = card.querySelector('[data-out]');
  const status = card.querySelector('[data-status]');
  if (state === 'loading') {
    out.textContent = '';
    out.classList.add('tr-placeholder');
    status.textContent = TR_EN ? 'Translating…' : '翻译中…';
    status.className = 'tr-source tr-status-loading';
  } else if (state === 'done') {
    out.textContent = msg;
    out.classList.remove('tr-placeholder');
    status.textContent = '';
    status.className = 'tr-source';
  } else if (state === 'error') {
    out.textContent = '';
    out.classList.add('tr-placeholder');
    status.textContent = msg;
    status.className = 'tr-source tr-status-error';
  } else { // idle
    out.textContent = CARD_LABELS[eng] ? CARD_LABELS[eng].idle : '等待翻译…';
    out.classList.add('tr-placeholder');
    status.textContent = '';
    status.className = 'tr-source';
  }
}

// ── TTS：系统语音为主 + 英文短词走有道真人发音 ──
// 背景（均已实测）：有道 dictvoice 对英文整句会 500、对中文返回约 0.1s 的坏片段；StreamElements 公共端点已 401 失效；
// 百度 gettts 有 Referer 校验，跨域（本站）返回空音频。故网络音源只保留「英文词/短词」这一确有价值且可用的场景，
// 其余一律走系统语音，并显式挑选优质音色——否则浏览器会落到系统默认的搞怪/沙哑音（如 macOS 的 Fred / Albert / Zarvox）。
function playAudio(url) {
  return new Promise((resolve, reject) => {
    const a = new Audio(url);
    a.onerror = () => reject(new Error('audio load error'));
    a.onended = () => resolve();
    a.play().then(resolve).catch(reject);
  });
}

// 浏览器音色挑选：排除搞怪/低质音色，优先高质真人音色
let _voices = [];
function loadVoices() { try { _voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : []; } catch (e) { _voices = []; } }
const BAD_VOICES = /(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|flo|grandma|grandpa|reed|rocko|sandy|shelley|eddy|fred)/i;
const GOOD_VOICES = /(samantha|ava|allison|serena|alex|daniel|karen|moira|tessa|nicki|google|enhanced|premium|natural|neural|siri|ting-?ting|mei-?jia|sin-?ji|kyoko|yuna|sora|amelie|thomas|anna|monica|milena|alice|daria|diego|jorge|juan|luca|paulina|matilda|kanya|zuzana|lekha|tarja|mariska|yelda|zosia|damayanti|satu|ioana|laila|hala|katja|melina|vitoria|iwan|maged|yoram|carmit|ellen)/i;

function pickVoice(lang) {
  if (!_voices.length) loadVoices();
  const base = String(lang || 'en').toLowerCase().split('-')[0];
  let pool = _voices.filter((v) => !BAD_VOICES.test(v.name || ''));
  const exact = pool.filter((v) => String(v.lang || '').toLowerCase().replace('_', '-').split('-')[0] === base);
  if (exact.length) pool = exact;
  if (!pool.length) return null;
  const good = pool.filter((v) => GOOD_VOICES.test(v.name || ''));
  return good[0] || pool[0];
}

function speakWeb(text, lang) {
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(lang);
    if (v) { u.voice = v; u.lang = v.lang || lang; } else { u.lang = lang; }
    u.rate = 1;
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

function speak(text, lang) {
  if (!text) return;
  const t = text.trim();
  if (!t) return;
  // 英文「词/短词」（≤2 个词）：有道真人发音（词典音质，跨域可用，实测 hello / hello world 均正常）
  if (lang === 'en' && t.split(/\s+/).length <= 2) {
    const url = 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(t) + '&type=2';
    playAudio(url).catch(() => speakWeb(text, lang));
    return;
  }
  // 其余（英文整句 / 中文 / 其它语种）：系统语音，已显式挑选优质音色，避免沙哑默认音
  speakWeb(text, lang);
}

// 预热音色列表（Chrome 的 getVoices 首次可能为空，靠 voiceschanged 异步填充）
if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

// ── UI 绑定 ──
let elFrom, elTo, elSwap, elInput, elClear, elTranslate,
    elDetect, elCount, elErr, elSpeakIn, elUsage, elResults;

function fillSelect(sel, withAuto) {
  sel.innerHTML = '';
  if (withAuto) {
    const o = document.createElement('option');
    o.value = 'auto'; o.textContent = TR_EN ? 'Auto-detect' : '自动检测'; sel.appendChild(o);
  }
  for (const l of LANGS) {
    const o = document.createElement('option');
    o.value = l.code;
    o.textContent = TR_EN ? (l.name + ' (' + l.native + ')') : (l.name + '（' + l.native + '）');
    sel.appendChild(o);
  }
}

let debounceTimer = null;
let trSession = 0; // 翻译会话令牌：仅最新一次翻译可写入结果，避免快速输入/连点导致的竞态覆盖
function scheduleAuto() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { if (elInput.value.trim()) doTranslate(); }, 600);
}

async function doTranslate() {
  clearTimeout(debounceTimer); // 取消待执行的自动翻译，避免「输入停顿自动触发」与「手动点击/切换语言」叠加，导致同一文本重复请求（百度字符双计）
  const text = elInput.value.trim();
  if (!text) { elDetect.textContent = ''; return; }
  const fromWasAuto = elFrom.value === 'auto';
  let from = elFrom.value;
  let detectedName = '';
  if (from === 'auto') {
    const d = detectLang(text);
    from = d || 'en';
    detectedName = LANG_NAME[from] ? (TR_EN ? 'Detected: ' : '检测到：') + LANG_NAME[from] : '';
    elDetect.innerHTML = detectedName ? ('<b>' + detectedName + '</b>') : '';
  } else {
    elDetect.textContent = '';
  }
  const to = elTo.value;
  let sameLangHint = '';
  if (from === to) {
    if (!fromWasAuto) { // 手动选择相同语言 → 明确提示并停止，避免无效翻译
      elErr.textContent = TR_EN ? 'Source and target languages are the same - no translation needed.' : '源语言与目标语言相同，无需翻译。';
      elErr.classList.add('show');
      return;
    }
    // 自动检测结果恰与目标语言相同（如输入英文、目标语言默认英语）：不拦截，交由引擎处理并给出引导
    sameLangHint = TR_EN
      ? '（Source auto-detected as ' + (LANG_NAME[from] || from) + ', same as target - returned as-is; switch the target language to translate.）'
      : '（源语言自动检测为' + (LANG_NAME[from] || from) + '，与目标语言相同，已原样返回；如需翻译请切换目标语言）';
    elDetect.innerHTML = (detectedName ? ('<b>' + detectedName + '</b>；') : '') + sameLangHint;
  }
  elErr.classList.remove('show');

  const mySession = ++trSession;
  for (const eng of ENGINES) setCard(eng.key, 'loading');
  // 四引擎并发，各自完成后更新各自的卡片（谁快谁先显示，互不阻塞、互不影响）
  await Promise.all(ENGINES.map(async (eng) => {
    const r = await runEngine(eng, text, from, to);
    if (mySession !== trSession) return; // 已被更新的翻译取代，丢弃本次结果
    if (r.text) setCard(eng.key, 'done', r.text);
    else setCard(eng.key, 'error', reasonText(r.reason));
  }));
  if (mySession === trSession) updateUsage(); // 刷新用量（百度/有道可能已累加）
}

function updateCount() {
  elCount.textContent = elInput.value.length + (TR_EN ? ' chars' : ' 字');
}

// ── 用量显示：实时读取 localStorage 展示百度(字符/月)与有道(请求/天)免费额度 ──
function updateUsage() {
  if (!elUsage) return;
  const segs = [];
  if (BAIDU_APP_ID && BAIDU_KEY) {
    const used = _lsGet(_baiduMonthKey());
    const remain = BAIDU_MONTHLY_FREE - used;
    const cls = remain <= 0 ? 'tr-quota-warn' : 'tr-quota-ok';
    const label = TR_EN
      ? 'Baidu: ' + used + ' / ' + BAIDU_MONTHLY_FREE + ' chars (this month)'
      : '百度：' + used + ' / ' + BAIDU_MONTHLY_FREE + ' 字符（本月）';
    segs.push('<span class="' + cls + '">' + label + '</span>');
  } else {
    const label = TR_EN ? 'Baidu: not configured' : '百度：未配置';
    segs.push('<span class="tr-quota-none">' + label + '</span>');
  }
  if (YOUDAO_APP_KEY && YOUDAO_KEY) {
    const used = _lsGet(_youdaoDayKey());
    const remain = YOUDAO_DAILY_FREE - used;
    const cls = remain <= 0 ? 'tr-quota-warn' : 'tr-quota-ok';
    const label = TR_EN
      ? 'Youdao: ' + used + ' / ' + YOUDAO_DAILY_FREE + ' requests (today)'
      : '有道：' + used + ' / ' + YOUDAO_DAILY_FREE + ' 次（今日）';
    segs.push('<span class="' + cls + '">' + label + '</span>');
  } else {
    const label = TR_EN ? 'Youdao: not configured' : '有道：未配置';
    segs.push('<span class="tr-quota-none">' + label + '</span>');
  }
  const head = TR_EN ? 'Usage — ' : '用量 — ';
  elUsage.innerHTML = head + segs.join('&nbsp;&nbsp;');
}

function doSwap() {
  let a = elFrom.value;
  if (a === 'auto') a = detectLang(elInput.value) || 'en'; // 互换时把「自动检测」解析为实际语言
  const b = elTo.value;
  elFrom.value = b; elTo.value = a;
  updateCount();
  if (elInput.value.trim()) doTranslate(); // 互换后四引擎重新对照翻译
}

function doCopy(eng) {
  const out = elResults.querySelector('[data-card="' + eng + '"] [data-out]');
  const t = out && !out.classList.contains('tr-placeholder') ? out.textContent : '';
  if (!t) return;
  navigator.clipboard?.writeText(t).then(() => {
    const btn = elResults.querySelector('[data-card="' + eng + '"] [data-copy]');
    if (btn) { btn.textContent = TR_EN ? 'Copied' : '已复制'; setTimeout(() => { btn.textContent = ''; }, 1200); }
  }).catch(() => {});
}

function bind() {
  elFrom = $('tr-from'); elTo = $('tr-to'); elSwap = $('tr-swap');
  elInput = $('tr-input'); elClear = $('tr-clear');
  elTranslate = $('tr-translate');
  elDetect = $('tr-detect');
  elCount = $('tr-count'); elErr = $('tr-error');
  elSpeakIn = $('tr-speak-in'); elUsage = $('tr-usage');
  elResults = $('tr-results');

  fillSelect(elFrom, true);
  fillSelect(elTo, false);
  elFrom.value = 'auto';
  elTo.value = 'en';

  elInput.addEventListener('input', () => { updateCount(); scheduleAuto(); });
  elFrom.addEventListener('change', () => { if (elInput.value.trim()) doTranslate(); });
  elTo.addEventListener('change', () => { if (elInput.value.trim()) doTranslate(); });
  elTranslate.addEventListener('click', doTranslate);
  elSwap.addEventListener('click', doSwap);
  elClear.addEventListener('click', () => {
    elInput.value = ''; updateCount(); elDetect.textContent = ''; elErr.classList.remove('show');
    for (const eng of ENGINES) setCard(eng.key, 'idle');
  });
  elSpeakIn.addEventListener('click', () => speak(elInput.value, elFrom.value === 'auto' ? (detectLang(elInput.value) || 'en') : elFrom.value));

  // 各引擎卡片内的朗读 / 复制按钮，按卡片独立绑定
  elResults.querySelectorAll('[data-card]').forEach((card) => {
    const eng = card.getAttribute('data-card');
    const cb = card.querySelector('[data-copy]');
    const sb = card.querySelector('[data-speak]');
    if (cb) cb.addEventListener('click', () => doCopy(eng));
    if (sb) sb.addEventListener('click', () => {
      const out = card.querySelector('[data-out]');
      const t = out && !out.classList.contains('tr-placeholder') ? out.textContent : '';
      if (t) speak(t, elTo.value);
    });
  });

  for (const eng of ENGINES) setCard(eng.key, 'idle');
  updateCount();
  updateUsage(); // 初始化用量显示
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
else bind();
