// 本地音乐播放器 —— 纯前端、零依赖、文件不出本机
//
// 复用 audiometa 的两件资产（不重复造轮子）：
//   · audioparse.js 的 parseAudio() —— 解析 17 种格式的标签与内嵌封面（浏览器放不了的也能读）
//   · fftrans.js 的 transcode()     —— 浏览器放不了的格式转成 WAV
//   · spectrum.js 的 bindVisualizer() —— 接在「正在播放的 <audio>」上，实时画 L/R 频带
//
// 生命周期：与 audiometa 一致，跟随单页。想听就别关这个页面。

const AV = (new URL(import.meta.url).searchParams.get('v') || '');
const VS = (p) => p + (AV ? '?v=' + AV : '');

const MU_EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0
  || /\/en\//.test(location.pathname) || /-en\/?$/.test(location.pathname);
const L = (zh, en) => (MU_EN ? en : zh);

const T = {
  hint: L('选择一个音乐文件夹，浏览器会在本机深度遍历出所有支持的歌曲并形成播放列表。支持 FLAC / ALAC / APE / WAV / AIFF / DXD / MP3 / AAC / M4A / WMA / OGG / OPUS / MP2 / DSF / DFF / AC-3 / DTS；浏览器放不了的（APE / DSF / DFF / WMA / AC-3 / DTS / ALAC / DXD）会自动用内置 ffmpeg 转码后播放。全程本地处理，文件不上传。',
    'Pick a music folder; the browser traverses it locally and builds a playlist of all supported tracks. Supports FLAC / ALAC / APE / WAV / AIFF / DXD / MP3 / AAC / M4A / WMA / OGG / OPUS / MP2 / DSF / DFF / AC-3 / DTS; formats the browser cannot play are auto-transcoded with the built-in ffmpeg. 100% local, nothing uploaded.'),
  pickBtn: L('选择音乐文件夹', 'Choose music folder'),
  scanning: L('正在遍历…', 'Scanning…'),
  parsing: L('正在解析信息…', 'Reading info…'),
  found: (n) => L('找到 ' + n + ' 首', 'Found ' + n + ' tracks'),
  empty: L('该文件夹下没有支持的音频文件。', 'No supported audio files in this folder.'),
  noFolder: L('当前浏览器不支持文件夹选择，请用 Chrome / Edge，或使用「选择文件」方式。', 'This browser cannot pick a folder. Use Chrome / Edge, or the file-picker fallback.'),
  transLoading: L('正在载入解码核心…', 'Loading decoder core…'),
  transWorking: L('正在转码', 'Transcoding'),
  transDone: L('转码完成', 'Transcode done'),
  transFail: L('转码失败：', 'Transcode failed: '),
  ended: L('播放列表结束', 'Playlist ended'),
  preparing: L('准备播放…', 'Preparing…'),
  noCover: L('无封面', 'No cover'),
  modeSeq: L('顺序播放', 'Sequential'),
  modeAll: L('列表循环', 'Repeat all'),
  modeOne: L('单曲循环', 'Repeat one'),
  modeShuffle: L('随机播放', 'Shuffle'),
  shuffleOn: L('随机：开', 'Shuffle: on'),
  shuffleOff: L('随机：关', 'Shuffle: off'),
  lyricEmpty: L('暂无歌词', 'No lyrics'),
  lyricPlain: L('歌词无时间戳，无法跟唱', 'Lyrics have no timestamps — cannot follow along'),
};

// 17 种支持格式
const SUPPORTED = new Set(['flac','alac','ape','wav','wave','aiff','aif','dxd','mp3','aac','m4a','mp4','wma','ogg','oga','opus','mp2','dsf','dff','ac3','dts','caf']);
// 浏览器原生能直接播放的（不转码）；其余 SUPPORTED 走 ffmpeg
const NATIVE = new Set(['flac','wav','wave','aiff','aif','mp3','aac','m4a','mp4','ogg','oga','opus','caf']);
const extOf = (name) => { const i = name.lastIndexOf('.'); return i < 0 ? '' : name.slice(i + 1).toLowerCase(); };

// ── DOM ──
const $ = (id) => document.getElementById(id);
const appEl = $('mu-app');
const pickBtn = $('mu-pick');
const fileInput = $('mu-file');
const prevBtn = $('mu-prev');
const playBtn = $('mu-play');
const nextBtn = $('mu-next');
const modeBtn = $('mu-mode-btn');
const nowEl = $('mu-now');
const statusEl = $('mu-status');
const listEl = $('mu-list');
const audio = $('mu-audio');
const seekEl = $('mu-seek');
const curEl = $('mu-cur');
const totEl = $('mu-tot');
const volEl = $('mu-vol');
const volBtn = $('mu-vol-btn');
const vizCanvas = $('mu-viz');
// 播放信息面板
const coverEl = $('mu-cover');
const coverWrapEl = $('mu-cover-wrap');
const discEl = $('mu-disc');
const titleEl = $('mu-title');
const subEl = $('mu-sub');
const albumEl = $('mu-album');
const genreEl = $('mu-genre');
const formatEl = $('mu-format');
const sizeEl = $('mu-size');
const durEl = $('mu-dur');
const pathEl = $('mu-path');
const lyricsEl = $('mu-lyrics');

let playlist = [];
let currentIndex = -1;
let shuffle = false;
let repeatMode = 'off'; // off | all | one
let playMode = 'order'; // order | all | one | shuffle —— 单按钮循环的播放模式
let currentUrl = null;
let metaGen = 0;        // 取消后台扫描的代次

// ── 辅助 ──
function setStatus(msg, ok) { statusEl.textContent = msg || ''; statusEl.classList.toggle('ok', !!ok); }
function setNowPlaying(name) { nowEl.textContent = name ? ('♪ ' + name) : ''; }
function formatBytes(n) {
  if (!n || n < 0) return '—';
  const u = ['B', 'KB', 'MB', 'GB', 'TB']; let i = 0, x = n;
  while (x >= 1024 && i < u.length - 1) { x /= 1024; i++; }
  return (i === 0 ? x : x.toFixed(1)) + ' ' + u[i];
}
function fmtDur(s) {
  if (!isFinite(s) || s <= 0) return '—';
  s = Math.floor(s); const m = Math.floor(s / 60), ss = s % 60;
  return m + ':' + String(ss).padStart(2, '0');
}

function renderPlaylist() {
  listEl.innerHTML = '';
  if (!playlist.length) {
    const li = document.createElement('li');
    li.className = 'mu-empty';
    li.textContent = L('暂无歌曲，请选择文件夹', 'No tracks yet — choose a folder first');
    listEl.appendChild(li);
    return;
  }
  playlist.forEach((t, i) => {
    const li = document.createElement('li');
    li.dataset.i = i;
    if (i === currentIndex) li.className = 'active';
    const idx = document.createElement('span'); idx.className = 'mu-idx'; idx.textContent = (i + 1);
    const nm = document.createElement('span'); nm.className = 'mu-name';
    const a = document.createElement('div'); a.className = 'mu-name-title'; a.textContent = t.name;
    nm.appendChild(a);
    li.appendChild(idx); li.appendChild(nm);
    li.addEventListener('click', () => loadAndPlay(i));
    listEl.appendChild(li);
  });
}
function refreshRow(i) {
  const li = listEl.children[i]; if (!li) return;
  const t = playlist[i]; if (!t) return;
  const nm = li.querySelector('.mu-name'); if (!nm) return;
  nm.innerHTML = '';
  const a = document.createElement('div'); a.className = 'mu-name-title';
  a.textContent = (t.meta && t.meta.tags.title) || t.name;
  nm.appendChild(a);
  const artist = t.meta && t.meta.tags.artist;
  if (artist) { const b = document.createElement('div'); b.className = 'mu-name-artist'; b.textContent = artist; nm.appendChild(b); }
}
function highlightCurrent() {
  [...listEl.children].forEach((li) => li.classList.toggle('active', Number(li.dataset.i) === currentIndex));
}
function updateControls() {
  const has = playlist.length > 0;
  [prevBtn, nextBtn, playBtn, modeBtn].forEach((b) => { if (b) b.disabled = !has; });
  if (seekEl) seekEl.disabled = !has;
}
// ── 播放模式：单个按钮循环 顺序 → 列表循环 → 单曲循环 → 随机 ──
const MODES = ['order', 'all', 'one', 'shuffle'];
const MODE_ICON = { order: '🔁', all: '🔁', one: '🔂', shuffle: '🔀' };
function modeName(pm) {
  return pm === 'one' ? T.modeOne : pm === 'all' ? T.modeAll : pm === 'shuffle' ? T.modeShuffle : T.modeSeq;
}
function applyMode() {   // 把合并模式映射回 shuffle / repeatMode，供 nextTrack 等复用
  shuffle = playMode === 'shuffle';
  repeatMode = playMode === 'all' ? 'all' : playMode === 'one' ? 'one' : 'off';
}
function updateMode() {
  if (!modeBtn) return;
  modeBtn.textContent = MODE_ICON[playMode];
  modeBtn.classList.toggle('active', playMode !== 'order');
  modeBtn.title = modeName(playMode);
}
applyMode();

// ── 元数据 + 封面（复用 audioparse.js）──
async function parseTrackMeta(i) {
  const t = playlist[i];
  if (!t || t.parsed) return t ? t.meta : null;
  t.parsed = true;
  try {
    const file = await t.getFile();
    t.size = file.size;
    const { parseAudio } = await import(VS('../audiometa/audioparse.js'));
    const r = parseAudio(new Uint8Array(await file.arrayBuffer()), t.name);
    t.meta = r;
    if (t.coverUrl) { try { URL.revokeObjectURL(t.coverUrl); } catch (e) {} t.coverUrl = null; }
    const pic = (r.pictures || []).find((p) => p.kind === 'cover') || (r.pictures || [])[0];
    if (pic && pic.bytes) t.coverUrl = URL.createObjectURL(new Blob([pic.bytes], { type: pic.mime || 'image/jpeg' }));
    return r;
  } catch (e) { t.meta = null; return null; }
}

// ── 从封面吸取强调色（当前歌词高亮用）──
// 取封面缩略图 → 跳过近黑/近白/灰像素 → 5bit 量化直方图 → 按「数量 × 鲜明度」选主色
// → 再按明暗主题各调一版对比度合适的颜色。纯 canvas，无外部依赖。
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (d) {
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}
function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h * 12) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return '#' + [f(0), f(8), f(4)].map((v) => v.toString(16).padStart(2, '0')).join('');
}
// 把 RGBA 像素量化成色桶（跳过近黑/近白/灰），按「数量 × 鲜明度」降序返回
function colorBins(d) {
  const bins = new Map();
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    const mx = Math.max(r, gg, b), mn = Math.min(r, gg, b);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    if (mx < 40 || mn > 235 || sat < 0.18) continue;            // 跳过近黑 / 近白 / 灰
    const k = ((r >> 4) << 8) | ((gg >> 4) << 4) | (b >> 4);
    let e = bins.get(k); if (!e) { e = { n: 0, r: 0, g: 0, b: 0, s: 0 }; bins.set(k, e); }
    e.n++; e.r += r; e.g += gg; e.b += b; e.s += sat;
  }
  return [...bins.values()]
    .map((e) => ({ r: e.r / e.n, g: e.g / e.n, b: e.b / e.n, score: e.n * (e.s / e.n + 0.15) }))
    .sort((a, b) => b.score - a.score);
}
// 主色（当前歌词高亮用）
function pickAccent(d) {
  const t = colorBins(d)[0];
  return t ? [t.r, t.g, t.b] : null;
}
// 调色板：取 n 个「色相拉开」的色，用于渐变
function pickPalette(d, n) {
  const out = [];
  for (const c of colorBins(d)) {
    if (out.length >= n) break;
    const [h, s, l] = rgbToHsl(c.r, c.g, c.b);
    if (out.some((o) => { const dh = Math.abs(o.h - h); return Math.min(dh, 1 - dh) < 0.09; })) continue;
    out.push({ h, s, l });
  }
  return out;
}
const accentCache = new Map();   // coverUrl -> { light, dark, palette } | null
function extractAccent(url) {
  if (accentCache.has(url)) return Promise.resolve(accentCache.get(url));
  return new Promise((resolve) => {
    const done = (v) => { accentCache.set(url, v); resolve(v); };
    const img = new Image();
    img.onload = () => {
      try {
        const N = 48, c = document.createElement('canvas');
        c.width = N; c.height = N;
        const g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, N, N);
        const data = g.getImageData(0, 0, N, N).data;
        const rgb = pickAccent(data);
        if (!rgb) return done(null);
        const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        const palette = pickPalette(data, 4)
          .map((o) => hslToHex(o.h, Math.min(0.85, Math.max(0.55, o.s)), Math.min(0.72, Math.max(0.46, o.l))));
        if (!palette.length) palette.push(hslToHex(h, Math.max(0.6, s), Math.min(0.7, Math.max(0.5, l))));
        while (palette.length < 4) palette.push(palette[palette.length - 1]);   // 补足 4 色，渐变更顺
        done({
          light: hslToHex(h, Math.max(0.6, s), Math.min(0.54, Math.max(0.40, l))),          // 浅色主题：偏深
          dark: hslToHex(h, Math.max(0.55, s), Math.min(0.80, Math.max(0.62, l + 0.18))),   // 深色主题：提亮
          palette,                                                                          // 渐变用多色
        });
      } catch (e) { done(null); }
    };
    img.onerror = () => done(null);
    img.src = url;
  });
}
const G_VARS = ['--mu-g1', '--mu-g2', '--mu-g3', '--mu-g4'];
function applyAccent(t) {
  if (!t || !t.coverUrl) {
    appEl.style.removeProperty('--mu-accent');
    appEl.style.removeProperty('--mu-accent-dark');
    G_VARS.forEach((v) => appEl.style.removeProperty(v));
    return;
  }
  const url = t.coverUrl;
  extractAccent(url).then((pair) => {
    const cur = playlist[currentIndex];
    if (!pair || !cur || cur.coverUrl !== url) return;          // 换歌了就别套旧颜色
    appEl.style.setProperty('--mu-accent', pair.light);
    appEl.style.setProperty('--mu-accent-dark', pair.dark);
    (pair.palette || []).forEach((c, i) => { if (G_VARS[i]) appEl.style.setProperty(G_VARS[i], c); });
  });
}

function updateNowPlaying() {
  const t = playlist[currentIndex];
  if (!t) return;
  if (t.coverUrl) { coverEl.hidden = false; coverEl.src = t.coverUrl; }
  else { coverEl.hidden = true; coverEl.removeAttribute('src'); }
  if (discEl) discEl.classList.toggle('has-cover', !!t.coverUrl);
  applyAccent(t);
  const tags = (t.meta && t.meta.tags) || {};
  titleEl.textContent = tags.title || t.name;
  subEl.textContent = [tags.artist, tags.album].filter(Boolean).join(' — ');
  albumEl.textContent = tags.album || '—';
  genreEl.textContent = tags.genre || '—';
  formatEl.textContent = ((t.meta && t.meta.formatKey) || extOf(t.name)).toUpperCase();
  sizeEl.textContent = formatBytes(t.size || (t.meta && t.meta.fileSize) || 0);
  durEl.textContent = fmtDur(audio.duration || (t.meta && t.meta.tech && t.meta.tech.duration) || 0);
  pathEl.textContent = t.name;
  pathEl.title = t.name;
  renderLyrics(t);
}

// ── 歌词（LRC 跟唱 / 纯文本 / 暂无）──
let curLyrics = null;   // { isLrc, lines:[{time,text}] }
let curLyricIdx = -1;
function parseLRC(text) {
  if (!text) return { isLrc: false, lines: [] };
  const lines = [];
  let hasTag = false;
  const re = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of text.split(/\r?\n/)) {
    re.lastIndex = 0;
    let m, tags = [];
    while ((m = re.exec(raw)) !== null) {
      hasTag = true;
      const min = parseInt(m[1], 10), sec = parseInt(m[2], 10);
      const frac = m[3] ? parseInt(m[3], 10) / Math.pow(10, m[3].length) : 0;
      tags.push(min * 60 + sec + frac);
    }
    if (tags.length) {
      const txt = raw.replace(/\[[^\]]*\]/g, '').trim();
      for (const t of tags) lines.push({ time: t, text: txt });
    }
  }
  lines.sort((a, b) => a.time - b.time);
  return { isLrc: hasTag, lines };
}
function renderLyrics(track) {
  const tags = (track && track.meta && track.meta.tags) || {};
  const raw = tags.lyrics;
  curLyricIdx = -1;
  lyricsEl.scrollTop = 0;
  if (!raw) {
    curLyrics = null;
    lyricsEl.innerHTML = '<div class="mu-lyric-empty">' + T.lyricEmpty + '</div>';
    return;
  }
  const parsed = parseLRC(raw);
  curLyrics = parsed;
  if (!parsed.isLrc) {                       // 无时间戳：原文展示
    lyricsEl.innerHTML = '';
    const p = document.createElement('div'); p.className = 'mu-lyric-plain'; p.textContent = raw.trim();
    const note = document.createElement('div'); note.className = 'mu-lyric-note'; note.textContent = T.lyricPlain;
    lyricsEl.appendChild(p); lyricsEl.appendChild(note);
    return;
  }
  lyricsEl.innerHTML = '';
  parsed.lines.forEach((ln, i) => {
    const d = document.createElement('div');
    d.className = 'mu-lyric-line'; d.dataset.i = i; d.textContent = ln.text || '·';
    lyricsEl.appendChild(d);
  });
  highlightLyric(-1);
}
function highlightLyric(idx) {
  if (idx === curLyricIdx) return;
  curLyricIdx = idx;
  const nodes = lyricsEl.querySelectorAll('.mu-lyric-line');
  nodes.forEach((n) => n.classList.toggle('active', Number(n.dataset.i) === idx));
  const active = nodes[idx];
  if (!active) return;
  // 注意：不能用 active.offsetTop —— .mu-lyrics 只有 overflow:auto、不是 offsetParent，
  // offsetTop 会相对更外层容器计算 → 滚错位置。改用 rect 相对滚动容器本身算。
  const lineTop = active.getBoundingClientRect().top - lyricsEl.getBoundingClientRect().top + lyricsEl.scrollTop;
  const target = lineTop - (lyricsEl.clientHeight - active.offsetHeight) / 2;
  lyricsEl.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
}

// 后台渐进解析整个列表，填充标题/歌手（不阻塞 UI）
async function scanAllMeta() {
  const gen = ++metaGen;
  for (let i = 0; i < playlist.length; i++) {
    if (gen !== metaGen) return;
    const t = playlist[i];
    if (t && !t.parsed) {
      await parseTrackMeta(i);
      if (gen !== metaGen) return;
      refreshRow(i);
      if (i === currentIndex) updateNowPlaying();
    }
    await new Promise((r) => setTimeout(r, 60));
  }
}

// ── 选文件夹 → 生成播放列表 ──
pickBtn.addEventListener('click', chooseFolder);

async function chooseFolder() {
  setStatus('');
  if (window.showDirectoryPicker) {
    try {
      const dir = await window.showDirectoryPicker();
      playlist = []; metaGen++;
      setStatus(T.scanning);
      await walkDir(dir, '', playlist);
      finalize();
      return;
    } catch (e) {
      if (e && (e.name === 'AbortError' || e.name === 'SecurityError')) return;
    }
  }
  if (!('webkitdirectory' in document.createElement('input'))) { setStatus(T.noFolder); return; }
  fileInput.click();
}

function shouldSkipFile(name) {
  // 跳过 macOS 资源叉 / 隐藏文件（._xxx、.DS_Store、.hidden 等）
  return name.startsWith('.') || name === '.DS_Store';
}

async function walkDir(dir, base, out) {
  for await (const entry of dir.values()) {
    if (entry.kind === 'directory') {
      if (entry.name.startsWith('.')) continue;
      await walkDir(entry, base + entry.name + '/', out);
    } else {
      if (shouldSkipFile(entry.name)) continue;
      const ext = extOf(entry.name);
      if (SUPPORTED.has(ext)) out.push({ name: base + entry.name, getFile: () => entry.getFile(), parsed: false });
    }
  }
}

fileInput.addEventListener('change', () => {
  playlist = []; metaGen++;
  for (const f of fileInput.files) {
    if (shouldSkipFile(f.name)) continue;
    const ext = extOf(f.name);
    if (SUPPORTED.has(ext)) playlist.push({ name: f.webkitRelativePath || f.name, getFile: () => Promise.resolve(f), parsed: false });
  }
  finalize();
});

function finalize() {
  setStatus('');
  if (!playlist.length) { renderPlaylist(); updateControls(); setStatus(T.empty); return; }
  playlist.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  renderPlaylist();
  setStatus(T.found(playlist.length), true);
  updateControls();
  loadAndPlay(0);
  scanAllMeta();
}

// ── 播放 ──
async function loadAndPlay(i, forceTranscode) {
  if (!playlist.length) return;
  const n = playlist.length;
  if (i < 0) i = n - 1;
  if (i >= n) i = 0;
  currentIndex = i;
  highlightCurrent();
  const track = playlist[i];
  setNowPlaying(track.name);
  updateNowPlaying();                       // 先用文件名占位，解析完会刷新
  if (seekEl) { seekEl.value = '0'; curEl.textContent = '0:00'; }   // 换歌重置进度
  let file;
  try { file = await track.getFile(); }
  catch (e) { setStatus(L('读取文件出错：', 'Read error: ') + ((e && e.message) || e)); return; }
  const ext = extOf(track.name);
  if (currentUrl) { try { URL.revokeObjectURL(currentUrl); } catch (e) {} currentUrl = null; }
  setStatus(T.preparing);
  try {
    if (!forceTranscode && NATIVE.has(ext)) {
      currentUrl = URL.createObjectURL(file);
      audio.src = currentUrl;
    } else {
      currentUrl = await transcodeToUrl(file, ext);
      audio.src = currentUrl;
    }
    bindViz();
    try { await audio.play(); } catch (e) { /* 自动播放可能被策略拦截，用户可手动点 */ }
  } catch (e) {
    if (!forceTranscode) { try { return await loadAndPlay(i, true); } catch (_) {} }
    setStatus(T.transFail + ((e && e.message) || e));
  }
  // 解析当前曲元数据（封面 + 标签），完成后刷新面板
  parseTrackMeta(i).then(() => { refreshRow(i); updateNowPlaying(); });
}

async function transcodeToUrl(file, ext) {
  setStatus(T.transLoading);
  let input = new Uint8Array(await file.arrayBuffer());
  if (ext === 'dff') {
    const m = await import(VS('../audiometa/dff2dsf.js'));
    input = m.dffToDsf(input);                              // DFF → DSF（去交错 + 位反转 + 重新分块）
  }
  const { transcode } = await import(VS('../audiometa/fftrans.js'));
  const out = await transcode(input, 'in.' + ext, 'out.wav',
    ['-ar', '44100', '-ac', '2', '-c:a', 'pcm_s16le'], null,
    (p) => setStatus(T.transWorking + ' ' + Math.round(Math.min(1, Math.max(0, p)) * 100) + '%'),
    (l, tot) => setStatus(T.transLoading + ' ' + (l / 1048576).toFixed(1) + ' / ' + (tot / 1048576).toFixed(1) + ' MB (' + Math.round(l / tot * 100) + '%)'));
  setStatus(T.transDone, true);
  return URL.createObjectURL(new Blob([out], { type: 'audio/wav' }));
}

function bindViz() {
  const w = Math.max(300, Math.floor(vizCanvas.getBoundingClientRect().width || 600));
  vizCanvas.width = w; vizCanvas.height = 180;
  import(VS('../audiometa/spectrum.js')).then((m) => {
    // weight:false 不做 A 计权；db 收紧 AnalyserNode 的 dB 窗口。
    // 默认 -100…-30（70dB 跨度）太宽松 → 低电平也顶到高位（"小声柱子也很高"）。
    // 实测 AnalyserNode 读数比真实 dBFS 低约 14dB（Blackman 窗 + FFT 归一化），
    // 取 [-66, -12]（54dB 跨度）：-1dBFS 峰值≈94%、-40dBFS 弱音≈22%、更弱≈0。
    m.bindVisualizer(audio, vizCanvas, 2, { weight: false, db: [-66, -12] });
  }).catch((e) => { console.warn('[mu-viz]', e && e.message); });
}

// ── 控件 ──
playBtn.addEventListener('click', () => { if (!audio.src) return; if (audio.paused) audio.play().catch(() => {}); else audio.pause(); });
audio.addEventListener('play', () => { playBtn.textContent = '⏸'; appEl.classList.add('mu-playing'); });
audio.addEventListener('pause', () => { playBtn.textContent = '▶'; appEl.classList.remove('mu-playing'); });
audio.addEventListener('loadedmetadata', () => { updateNowPlaying(); syncProgress(); });
audio.addEventListener('durationchange', () => { totEl.textContent = fmtDur(audio.duration); });
audio.addEventListener('timeupdate', () => {
  if (!seeking) syncProgress();
  if (!curLyrics || !curLyrics.isLrc) return;
  const t = audio.currentTime, lines = curLyrics.lines;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) { if (lines[i].time <= t) idx = i; else break; }
  highlightLyric(idx);
});

// ── 播放进度条 ──
let seeking = false;
function syncProgress() {
  const d = audio.duration;
  if (isFinite(d) && d > 0) {
    seekEl.value = String(Math.round((audio.currentTime / d) * 1000));
    totEl.textContent = fmtDur(d);
  } else { seekEl.value = '0'; }
  curEl.textContent = fmtDur(audio.currentTime);
}
seekEl.addEventListener('input', () => {
  seeking = true;
  const d = audio.duration;
  if (isFinite(d) && d > 0) { audio.currentTime = (Number(seekEl.value) / 1000) * d; curEl.textContent = fmtDur(audio.currentTime); }
});
seekEl.addEventListener('change', () => { seeking = false; });

// ── 音量 ──
function updateVolIcon() {
  if (!volBtn) return;
  const v = audio.muted ? 0 : audio.volume;
  volBtn.textContent = v === 0 ? '🔇' : v < 0.34 ? '🔈' : v < 0.67 ? '🔉' : '🔊';
  if (volEl) volEl.value = String(v);
}
if (volEl) volEl.addEventListener('input', () => {
  const v = Number(volEl.value);
  audio.volume = v;
  audio.muted = v === 0;
  updateVolIcon();
});
if (volBtn) volBtn.addEventListener('click', () => { audio.muted = !audio.muted; updateVolIcon(); });
audio.addEventListener('volumechange', updateVolIcon);

prevBtn.addEventListener('click', prevTrack);
nextBtn.addEventListener('click', nextTrack);

function randExcept(cur) {
  if (playlist.length <= 1) return 0;
  let i; do { i = Math.floor(Math.random() * playlist.length); } while (i === cur);
  return i;
}
function nextTrack() {
  if (!playlist.length) return;
  if (repeatMode === 'one' && audio.currentTime > 0) { audio.currentTime = 0; audio.play().catch(() => {}); return; }
  let i;
  if (shuffle) i = randExcept(currentIndex);
  else i = currentIndex + 1;
  if (i >= playlist.length) {
    if (repeatMode === 'all') i = 0;
    else { setStatus(T.ended, true); return; }
  }
  loadAndPlay(i);
}
function prevTrack() {
  if (!playlist.length) return;
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  const i = shuffle ? randExcept(currentIndex) : currentIndex - 1;
  loadAndPlay(i);
}
audio.addEventListener('ended', nextTrack);

modeBtn.addEventListener('click', () => {
  playMode = MODES[(MODES.indexOf(playMode) + 1) % MODES.length];
  applyMode();
  updateMode();
});

// ── 拖入文件夹（Chromium：拖拽时按住文件夹即为目录句柄）──
['dragover', 'dragenter'].forEach((ev) => appEl.addEventListener(ev, (e) => { e.preventDefault(); appEl.classList.add('mu-drag'); }));
['dragleave', 'drop'].forEach((ev) => appEl.addEventListener(ev, (e) => { e.preventDefault(); appEl.classList.remove('mu-drag'); }));
appEl.addEventListener('drop', async (e) => {
  const item = e.dataTransfer && e.dataTransfer.items && e.dataTransfer.items[0];
  if (!item || !item.getAsFileSystemHandle) return;
  try {
    const handle = await item.getAsFileSystemHandle();
    if (handle && handle.kind === 'directory') {
      playlist = []; metaGen++; setStatus(T.scanning);
      await walkDir(handle, '', playlist); finalize();
    }
  } catch (err) { /* 忽略非目录拖拽 */ }
});

// ── 初始化 ──
pickBtn.textContent = T.pickBtn;
playBtn.textContent = '▶';
// 封面 blob 解码失败时退回黑胶占位
coverEl.addEventListener('error', () => { coverEl.hidden = true; if (discEl) discEl.classList.remove('has-cover'); });
updateVolIcon();
updateMode();
updateControls();
