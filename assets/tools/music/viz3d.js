// 3D 时频立体视图 —— 零依赖：Canvas 2D + 手写轨道相机，不引 WebGL、不引库。
//
// 轴语义（与音乐播放器页面 <h2 id="viz3d"> 一节一致）：
//   X = 频率，对数 FMIN → FMAX；FMIN = binHz（FFT 可分辨的最低频率），FMAX = Nyquist（采样率极限）
//   Z = 时间，0 = 现在（越远越旧）
//   Y = 傅里叶幅值，dB（由 spectrum.js 广播的真实 dB 窗口换算）
//
// 声道：L / R 各画一层色带（L 暖色 / R 冷色，与 2D 频谱条同一套语汇），沿时间轴错开半个层距。
//
// 精度要点：
//   1) 频率轴上下限都由采样率/fftSize 现算，不写死；
//   2) 每层记录**真实播放时刻**，时间轴据此换算，掉帧也不移位；
//   3) 悬停读数给出每声道「平滑后 dB / 原始瞬时 dB」+ 该带覆盖的 FFT bin 区间。

const TAU = 6.28318;

// 配色方案（面板上可自由切换）。l/r = [顶部亮色, 底部深色]；bg 非空则用深色舞台。
// cover = 跟随专辑封面：由 app.js 把封面提取的候选色喂进来（setCoverColors），
// 这里挑**色相距离最大**的一对给 L/R；封面接近单色（< 40°）则自动退回 contrast。
// theme = 跟随卡片：用卡片渐变那四色（--mu-g1..g4）沿**频率轴**做四段渐变铺满色带，
// 且 L 正序 / R 倒序 —— 这样同一频率处左右声道的颜色天然不同。
export const VIZ_PALETTES = [
  { id: 'contrast', name: '暖冷对撞', l: ['#f7c85c', '#d8442f'], r: ['#63dcc6', '#2b6fc4'], bg: '' },
  { id: 'theme', name: '跟随卡片', ramp: true, bg: '' },
  { id: 'cover', name: '封面吸色', l: null, r: null, bg: '' },
  { id: 'flat', name: '双色扁平', l: ['#ef9f27', '#ef9f27'], r: ['#378add', '#378add'], bg: '' },
  { id: 'morandi', name: '莫兰迪柔彩', l: ['#e8b4a0', '#a9675a'], r: ['#a8c3c8', '#547e88'], bg: '' },
  { id: 'neon', name: '暗场霓虹', l: ['#ffb03a', '#ff3d8b'], r: ['#4c7dff', '#35e0c8'], bg: '#0e1017' },
];
// 没有封面时的默认四段渐变（蓝→绿→琥珀→红）
const RAMP_FALLBACK = ['#2b6fc4', '#1d9e75', '#ef9f27', '#e24b4a'];

export function createViz3D(canvas, readoutEl, opts) {
  const o = opts || {};
  const BANDS = o.bands || 64;          // 频率方向的分辨率
  const LAYERS = o.layers || 96;        // 时间方向的层数（每层 = 左右两声道各一条色带）
  const CAP_HZ = o.captureHz || 20;     // 采集节流：rAF ≈60fps，按 20Hz 落帧
  const UP = o.up === undefined ? 0.72 : o.up;
  const DOWN = o.down === undefined ? 0.12 : o.down;
  const D = 3.4;                        // 透视焦距

  // ── 配色状态（面板可切）──
  const toRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = (c) => '#' + c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  const mixHex = (h, t, k) => toHex(toRgb(h).map((v, i) => v + (t[i] - v) * k).map((v) => v));
  const lerpTo = (h, k) => mixHex(h, [255, 255, 255], k);          // 变亮
  function hueOf(h) {
    const c = toRgb(h).map((v) => v / 255);
    const mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), d = mx - mn;
    if (d < 0.06) return -1;                                        // 接近灰 → 无色相
    let hu;
    if (mx === c[0]) hu = ((c[1] - c[2]) / d + 6) % 6;
    else if (mx === c[1]) hu = (c[2] - c[0]) / d + 2;
    else hu = (c[0] - c[1]) / d + 4;
    return hu * 60;
  }
  let palId = o.palette || 'contrast';
  let palL = ['#f7c85c', '#d8442f'], palR = ['#63dcc6', '#2b6fc4'], palBg = '';
  let palRampMode = false, palRamp = RAMP_FALLBACK.slice();
  let coverColors = [];
  function applyPalette(id) {
    const p = VIZ_PALETTES.filter((x) => x.id === id)[0];
    palId = p ? p.id : 'contrast';
    palRampMode = false;
    if (p && p.id !== 'cover') {
      palBg = p.bg || '';
      if (p.ramp) {                       // 跟随卡片：走频率轴多段渐变
        palRampMode = true;
        palRamp = coverColors.length >= 2 ? coverColors.slice() : RAMP_FALLBACK.slice();
        return;
      }
      palL = p.l.slice(); palR = p.r.slice();
      return;
    }
    deriveCover();
  }
  function deriveCover() {
    const base = VIZ_PALETTES[0];
    let best = null, bestD = -1;
    for (let i = 0; i < coverColors.length; i++) {
      for (let j = i + 1; j < coverColors.length; j++) {
        const a = hueOf(coverColors[i]), b = hueOf(coverColors[j]);
        if (a < 0 || b < 0) continue;
        const d = Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
        if (d > bestD) { bestD = d; best = [coverColors[i], coverColors[j]]; }
      }
    }
    if (!best || bestD < 40) {                                      // 单色封面 → 退回暖冷对撞，保证左右分得开
      palL = base.l.slice(); palR = base.r.slice(); palBg = '';
      return;
    }
    palL = [lerpTo(best[0], 0.34), best[0]];
    palR = [lerpTo(best[1], 0.34), best[1]];
    palBg = '';
  }
  applyPalette(palId);

  const XTICK_ALL = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 40000];
  const YTICK_ALL = [0, -10, -20, -30, -40, -50, -60, -70, -80];   // 以 dBFS 标注（0 = 满量程）
  const ZTICKS = [0, 1, 2, 3, 4];       // 秒（超出实际跨度就不画）

  const entries = [];                    // 最旧 → 最新：[{ lvL, lvR, rawL, rawR, binLo, binHi, t, wall }]
  const smL = new Float32Array(BANDS), smR = new Float32Array(BANDS);
  let dbLo = -66, dbHi = -12, dbOffset = 14.1;
  let FMIN = 20, FMAX = 16000, LOGSPAN = Math.log(FMAX / FMIN);
  let binHz = 11.72, binsN = 2048, mono = false;
  const bandLo = new Float32Array(BANDS), bandHi = new Float32Array(BANDS), bandMid = new Float32Array(BANDS);
  let lastPush = -1e9;

  function retune(sampleRate, fftSize) {
    const bHz = sampleRate / fftSize, fmax = sampleRate / 2;
    if (Math.abs(bHz - FMIN) < 1e-3 && Math.abs(fmax - FMAX) < 1) return;
    FMIN = bHz; FMAX = fmax;
    LOGSPAN = Math.log(FMAX / FMIN);
    for (let i = 0; i < BANDS; i++) {
      bandLo[i] = FMIN * Math.pow(FMAX / FMIN, i / BANDS);
      bandHi[i] = FMIN * Math.pow(FMAX / FMIN, (i + 1) / BANDS);
      bandMid[i] = Math.sqrt(bandLo[i] * bandHi[i]);
    }
  }
  retune(48000, 4096);
  const fxOf = (hz) => Math.max(0, Math.min(1, Math.log(hz / FMIN) / LOGSPAN));

  const css = (c, al) => 'rgba(' + c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(',') + (al === undefined ? ')' : ',' + al + ')');
  const isDark = () => document.documentElement.getAttribute('mode') === 'dark' || !!palBg;
  const ink = (a) => (isDark() ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + a + ')';
  const padBg = () => (isDark() ? 'rgba(24,24,28,.80)' : 'rgba(255,255,255,.82)');

  // ── 视图状态 ──
  let W = 0, H = 0, dpr = 1;
  let yaw = o.yaw === undefined ? -0.68 : o.yaw;
  let pitch = o.pitch === undefined ? 0.42 : o.pitch;
  let zoom = 1;
  let visible = false, running = false, raf = 0;
  let mouse = null, drag = null, hit = null, frameMs = 0;
  let yawVel = 0, pitchVel = 0;          // 松手后的惯性（才有"转球"的手感）
  let vx = 0, vy = 0, lastMoveT = 0;     // 平滑后的拖拽速度，单位 px/ms
  const SENS = 0.009, SENS_Y = 0.0065;   // 每像素转多少弧度
  const FRAME = 16.7;                    // 一帧的毫秒数（把 px/ms 换成 px/帧）
  const COAST = 0.55;                    // 惯性强度：0 = 松手即停，1 = 很"滑"
  const clampPitch = (v) => Math.max(-0.25, Math.min(1.15, v));
  const g = canvas.getContext('2d');

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = canvas.clientWidth || 640; H = canvas.clientHeight || 380;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  // ── 缩放：按内容包围盒自适应（包围球估会严重偏小）；基础缩放只随 W/H 变，
  //    在 8 偏航 × 3 俯仰里取最大包围盒 → 任何角度都不裁切；旋转时只平移不改缩放（不"呼吸"）。
  let Sbase = 0, fitKey = '', fitCx = 0, fitCy = 0;
  function rawP(fx, fz, lv) {
    const X = (fx - 0.5) * 1.8, Z = (fz - 0.5) * 1.4, Y = lv * 0.9 - 0.45;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const X1 = X * cy + Z * sy, Z1 = -X * sy + Z * cy;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const Y2 = Y * cp - Z1 * sp, Z2 = Y * sp + Z1 * cp;
    const k = D / (D - Z2);
    return { x: X1 * k, y: Y2 * k, z: Z2, k: k };
  }
  function boundsNow() {
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    for (let a = 0; a < 8; a++) {
      const q = rawP(a & 1, (a >> 1) & 1, (a >> 2) & 1);
      if (q.x < mnx) mnx = q.x;
      if (q.x > mxx) mxx = q.x;
      if (q.y < mny) mny = q.y;
      if (q.y > mxy) mxy = q.y;
    }
    return { mnx: mnx, mxx: mxx, mny: mny, mxy: mxy, w: mxx - mnx, h: mxy - mny };
  }
  function ensureScale() {
    const key = W + 'x' + H;
    if (key !== fitKey && W > 0 && H > 0) {
      const cy0 = yaw, cp0 = pitch;
      let eW = 1e-6, eH = 1e-6;
      for (let yi = 0; yi < 8; yi++) {
        yaw = (yi / 8) * TAU;
        for (let pi = 0; pi < 3; pi++) {
          pitch = [-0.25, 0.45, 1.15][pi];
          const bb = boundsNow();
          if (bb.w > eW) eW = bb.w;
          if (bb.h > eH) eH = bb.h;
        }
      }
      yaw = cy0; pitch = cp0;
      const pad = 22;
      Sbase = Math.min((W - 2 * pad) / eW, (H - 2 * pad) / eH);
      fitKey = key;
    }
    const bb = boundsNow();
    fitCx = (bb.mnx + bb.mxx) / 2;
    fitCy = (bb.mny + bb.mxy) / 2;
    return Sbase * zoom;
  }
  function project(fx, fz, lv, S) {
    const p = rawP(fx, fz, lv);
    return { x: W / 2 + (p.x - fitCx) * S, y: H * 0.52 - (p.y - fitCy) * S, z: p.z, k: p.k };
  }

  // ── 数据入口：消费 spectrum.js 广播的一帧（L/R 各自独立平滑）──
  function push(f) {
    if (f.wall - lastPush < (1 / CAP_HZ) - 1e-4) return;
    lastPush = f.wall;
    const db = f.db || [-66, -12];
    dbLo = db[0]; dbHi = db[1];
    if (typeof f.dbOffset === 'number') dbOffset = f.dbOffset;
    binHz = f.sampleRate / f.fftSize;
    binsN = f.lb.length;
    retune(f.sampleRate, f.fftSize);
    mono = !f.rb;
    const n = BANDS;
    const lvL = new Float32Array(n), rawL = new Float32Array(n);
    const lvR = new Float32Array(n), rawR = new Float32Array(n);
    const lo = new Int32Array(n), hi = new Int32Array(n);
    let prev = 1;                        // 单调推进：保证每带至少覆盖一个 bin（与 2D 条同一套规则）
    for (let i = 0; i < n; i++) {
      let k0 = Math.max(prev, Math.round(bandLo[i] / binHz));
      let k1 = Math.min(binsN - 1, Math.max(k0, Math.round(bandHi[i] / binHz) - 1));
      if (k1 < k0) k1 = k0;
      prev = Math.min(binsN - 1, k1 + 1);
      let mL = 0, mR = 0;
      for (let k = k0; k <= k1; k++) {
        const a = f.lb[k];
        if (a > mL) mL = a;
        if (f.rb) { const b = f.rb[k]; if (b > mR) mR = b; }
      }
      lo[i] = k0; hi[i] = k1;
      rawL[i] = mL / 255;
      rawR[i] = f.rb ? mR / 255 : rawL[i];
      const kkL = rawL[i] > smL[i] ? UP : DOWN;
      smL[i] += (rawL[i] - smL[i]) * kkL;
      const kkR = rawR[i] > smR[i] ? UP : DOWN;
      smR[i] += (rawR[i] - smR[i]) * kkR;
      lvL[i] = smL[i];
      lvR[i] = smR[i];
    }
    entries.push({ lvL: lvL, lvR: lvR, rawL: rawL, rawR: rawR, binLo: lo, binHi: hi, t: f.time, wall: f.wall });
    if (entries.length > LAYERS) entries.shift();
  }

  // dbOffset：analyser 读数 → 真实 dBFS 的标定偏移（由 spectrum.js 的帧广播给出，实测 14.1 dB）
  const dbOf = (v) => dbLo + v * (dbHi - dbLo) + dbOffset;

  // 带底色的文字（轴穿中心后标签会压在色带上，加一层半透明底保证可读）
  // 自带**避让**：与已放置的标签重叠就不画 —— 侧视时三条轴的外缘会叠在一起，
  // 不避让就是一坨（实测）。（列优先，先调用的先占位）
  let placed = [];
  function tag(txt, x, y, align, color, size) {
    g.font = (size || 12) + 'px system-ui, -apple-system, sans-serif';
    const w = g.measureText(txt).width;
    const bx = align === 'right' ? x - w - 3 : (align === 'center' ? x - w / 2 - 3 : x - 3);
    const r = { x: bx, y: y - 7, w: w + 6, h: 14 };
    for (let i = 0; i < placed.length; i++) {
      const q = placed[i];
      if (r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y) return false;
    }
    placed.push(r);
    g.globalAlpha = 0.74; g.fillStyle = padBg();
    g.fillRect(r.x, r.y, r.w, r.h);
    g.globalAlpha = 1; g.fillStyle = color;
    g.textAlign = align; g.textBaseline = 'middle';
    g.fillText(txt, x, y);
    return true;
  }

  function ribbon(base, top, topColor, botColor, alpha) {
    let mnY = 1e9, mxY = -1e9;
    for (let b = 0; b < BANDS; b++) {
      if (top[b].y < mnY) mnY = top[b].y;
      if (base[b].y > mxY) mxY = base[b].y;
    }
    const gd = g.createLinearGradient(0, mnY - 2, 0, mxY + 2);
    gd.addColorStop(0, topColor);
    gd.addColorStop(1, botColor);
    g.globalAlpha = alpha;
    g.fillStyle = gd;
    g.beginPath();
    for (let b = 0; b < BANDS; b++) { b ? g.lineTo(base[b].x, base[b].y) : g.moveTo(base[b].x, base[b].y); }
    for (let b = BANDS - 1; b >= 0; b--) g.lineTo(top[b].x, top[b].y);
    g.closePath(); g.fill();
    g.strokeStyle = topColor; g.lineWidth = 1;
    g.beginPath();
    for (let b = 0; b < BANDS; b++) { b ? g.lineTo(top[b].x, top[b].y) : g.moveTo(top[b].x, top[b].y); }
    g.stroke();
    g.globalAlpha = 1;
  }

  // 多段渐变版（「跟随卡片」用）：颜色沿**频率轴**铺开，填充与脊线共用同一个渐变
  function ribbonGrad(base, top, gd, alpha) {
    g.globalAlpha = alpha; g.fillStyle = gd;
    g.beginPath();
    for (let b = 0; b < BANDS; b++) { b ? g.lineTo(base[b].x, base[b].y) : g.moveTo(base[b].x, base[b].y); }
    for (let b = BANDS - 1; b >= 0; b--) g.lineTo(top[b].x, top[b].y);
    g.closePath(); g.fill();
    g.globalAlpha = Math.min(1, alpha + 0.25); g.strokeStyle = gd; g.lineWidth = 1;
    g.beginPath();
    for (let b = 0; b < BANDS; b++) { b ? g.lineTo(top[b].x, top[b].y) : g.moveTo(top[b].x, top[b].y); }
    g.stroke();
    g.globalAlpha = 1;
  }

  function render() {
    const t0 = performance.now();
    const L = entries.length;
    const now = L ? entries[L - 1].t : 0;
    const S = ensureScale();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (palBg) { g.fillStyle = palBg; g.fillRect(0, 0, W, H); }   // 深色舞台
    else g.clearRect(0, 0, W, H);
    placed = [];                       // 每帧重置标签占位表（避让用）
    g.font = '12px system-ui, -apple-system, sans-serif';

    // 地面网格（X 刻度 × 若干时间线）
    // X 刻度（只保留落在当前频率范围内的）
    const xticks = XTICK_ALL.filter((hz) => hz >= FMIN * 0.99 && hz <= FMAX * 1.01);
    g.lineWidth = 0.5; g.strokeStyle = ink(0.10);
    xticks.forEach((hz) => {
      const fx = fxOf(hz);
      g.beginPath();
      for (let j = 0; j <= 6; j++) { const p = project(fx, j / 6, 0, S); j ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }
      g.stroke();
    });
    g.beginPath();
    for (let j = 0; j <= 16; j++) { const p = project(j / 16, 1, 0, S); j ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y); }
    g.stroke();

    // 电平网格：在「左墙 (fx=0)」与「后墙 (fz=0)」上各画一条等电平线。
    // 目的：透视下同一 dB 在不同深度落在不同屏幕高度，光看左侧数字读不准；
    // 有了这两面墙的网格，任何深度的点都能把高度对照到等电平线上读数。
    YTICK_ALL.forEach((dbfs) => {
      const lv = (dbfs - dbOffset - dbLo) / ((dbHi - dbLo) || 1);
      if (lv < 0 || lv > 1) return;
      const a = project(0, 0, lv, S);          // 墙角（两面墙共用）
      const bLeft = project(0, 1, lv, S);      // 左墙延伸到前面
      const bBack = project(1, 0, lv, S);      // 后墙延伸到右边
      g.strokeStyle = ink(0.10); g.lineWidth = 0.5;
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(bLeft.x, bLeft.y); g.stroke();
      g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(bBack.x, bBack.y); g.stroke();
    });

    // 色带：远 → 近（画家算法），每层 L/R 两条，沿时间轴错开半个层距
    const order = [];
    for (let i = 0; i < L; i++) {
      const fz = L > 1 ? i / (L - 1) : 1;
      order.push({ i: i, fz: fz, fresh: i === L - 1, z: project(0.5, fz, 0.5, S).z });
    }
    order.sort((a, b) => a.z - b.z);
    const OFF = 0.005;
    let hiIdx = -1, hiD = 34 * 34, hiCh = 0;
    for (const it of order) {
      const e = entries[it.i];
      const t = L > 1 ? it.i / (L - 1) : 1;
      const fog = (0.16 + 0.54 * t) * (it.fresh ? 1.5 : 1);
      const chans = palRampMode
        ? [[e.lvL, 1, null, null], [e.lvR, -1, null, null]]
        : [[e.lvL, 1, palL[0], palL[1]], [e.lvR, -1, palR[0], palR[1]]];
      for (let ci = 0; ci < chans.length; ci++) {
        if (mono && ci === 1) continue;               // 单声道只画一路
        const v = chans[ci][0], sgn = chans[ci][1], cTop = chans[ci][2], cBot = chans[ci][3];
        let mxv = 0;
        for (let b = 0; b < BANDS; b++) if (v[b] > mxv) mxv = v[b];
        if (mxv < 0.02) continue;      // 该声道这一层基本静音 → 不画（否则零电平的平坦线会叠成一张"板"）
        const fz = Math.max(0, Math.min(1, it.fz + sgn * OFF));
        const base = [], top = [];
        for (let b = 0; b < BANDS; b++) {
          const fx = (b + 0.5) / BANDS;
          const pb = project(fx, fz, 0, S), pt = project(fx, fz, v[b], S);
          base.push(pb); top.push(pt);
          if (mouse) {
            const vx = pt.x - pb.x, vy = pt.y - pb.y;
            const wx = mouse.x - pb.x, wy = mouse.y - pb.y;
            const l2 = vx * vx + vy * vy || 1;
            let tt = (wx * vx + wy * vy) / l2;
            tt = tt < 0 ? 0 : (tt > 1 ? 1 : tt);
            const ex = pb.x + vx * tt - mouse.x, ey = pb.y + vy * tt - mouse.y;
            const d2 = ex * ex + ey * ey;
            if (d2 < hiD) { hiD = d2; hiIdx = it.i * BANDS + b; hiCh = ci; }
          }
        }
        if (palRampMode) {
          // 沿频率轴的多段渐变；L 正序 / R 倒序 → 同一频率处左右声道颜色不同
          const stops = ci === 0 ? palRamp : palRamp.slice().reverse();
          const gd = g.createLinearGradient(base[0].x, base[0].y, base[BANDS - 1].x, base[BANDS - 1].y);
          stops.forEach((c, i) => gd.addColorStop(stops.length > 1 ? i / (stops.length - 1) : 0, c));
          ribbonGrad(base, top, gd, Math.min(1, fog));
        } else {
          ribbon(base, top, css(hexToRgb(cTop), Math.min(1, fog + 0.35)), css(hexToRgb(cBot), 0.10), Math.min(1, fog));
        }
      }
    }

    // ── 中轴参考线已按要求移除（原来三条轴线穿过体积中心，视觉上像"插在数据里的三条棍"）──
    //    现在只保留：外缘细参考框（刻度标注的对齐基准）+ 墙面等电平网格（读电平的依据）。

    // 外缘细参考框（给标注提供对齐基准）
    const O = project(0, 1, 0, S), XA = project(1, 1, 0, S), ZA = project(0, 0, 0, S), YA = project(0, 1, 1, S);
    const XZ = project(1, 0, 0, S);
    g.strokeStyle = ink(0.13); g.lineWidth = 0.5;
    [[O, XA], [O, ZA], [XA, XZ], [XZ, ZA]].forEach((sg) => {
      g.beginPath(); g.moveTo(sg[0].x, sg[0].y); g.lineTo(sg[1].x, sg[1].y); g.stroke();
    });

    // Y 刻度标注（左前竖轴，右对齐）—— 放在最前面调，让电平刻度在避让中优先占位
    YTICK_ALL.forEach((db) => {
      const lv = (db - dbOffset - dbLo) / ((dbHi - dbLo) || 1);
      if (lv < 0 || lv > 1) return;
      const p = project(0, 1, lv, S);
      tag(db + ' dB', p.x - 6, p.y, 'right', ink(0.68));
    });
    tag('电平 dBFS（0 = 满量程）', YA.x - 6, YA.y - 16, 'right', ink(0.58), 13);

    // X 刻度标注（前下沿）
    xticks.forEach((hz) => {
      const p = project(fxOf(hz), 1, 0, S);
      tag(hz >= 1000 ? (hz / 1000) + 'k' : String(hz), p.x, p.y + 16, 'center', ink(0.7));
    });
    // 频率轴说明放画布左下固定位置 —— 前缘是斜的，居中放会和 2k/5k 这些刻度打架
    tag('频率 Hz →　可分辨下限 ' + Math.round(FMIN) + ' Hz · 上限 ' + Math.round(FMAX / 1000) + 'k（采样率一半）',
        10, H - 22, 'left', ink(0.55), 11);

    // Z 刻度标注（右后地面沿，左对齐）
    const zSpan = L > 1 ? (entries[L - 1].t - entries[0].t) : 0;
    ZTICKS.forEach((age) => {
      if (age > zSpan + 0.12) return;
      let best = 0, bd = 1e9;
      for (let i = 0; i < L; i++) {
        const a = now - entries[i].t;
        if (Math.abs(a - age) < bd) { bd = Math.abs(a - age); best = i; }
      }
      if (L && bd > 0.28) return;
      const fz = L > 1 ? best / (L - 1) : 1;
      const p = project(1, fz, 0, S);
      const real = L ? (now - entries[best].t) : 0;
      tag(age === 0 ? '现在' : '−' + real.toFixed(1) + 's', p.x + 8, p.y + 2, 'left', ink(0.55));
    });
    const zBack = project(1, 0, 0, S);
    tag('时间（过去 → 现在）', zBack.x + 10, zBack.y - 16, 'left', ink(0.55));

    // 当前帧峰值（分声道）—— 频率用**实际 bin 中心**，不是对数轴上的标称位置
    if (L) {
      const e = entries[L - 1];
      const act = (b) => ((e.binLo[b] + e.binHi[b] + 1) / 2) * binHz;
      const pk = (v) => { let b = 0, m = -1; for (let i = 0; i < BANDS; i++) if (v[i] > m) { m = v[i]; b = i; } return act(b); };
      const pkv = (v) => { let m = -1; for (let i = 0; i < BANDS; i++) if (v[i] > m) m = v[i]; return m; };
      const fmt = (hz) => (hz >= 1000 ? (hz / 1000).toFixed(2) + ' kHz' : Math.round(hz) + ' Hz');
      let txt = 'L 峰值 ' + fmt(pk(e.lvL)) + ' · ' + dbOf(pkv(e.lvL)).toFixed(1) + ' dBFS';
      txt += mono ? '　（单声道）' : '　R 峰值 ' + fmt(pk(e.lvR)) + ' · ' + dbOf(pkv(e.lvR)).toFixed(1) + ' dBFS';
      tag(txt, 8, 16, 'left', ink(0.72));
    }

    // 悬停：标出竖切片 + 详细读数（两声道分别给）
    if (hiIdx >= 0 && mouse && L) {
      hit = hiIdx;
      const li = Math.floor(hiIdx / BANDS), bi = hiIdx % BANDS, e = entries[li];
      const fz = L > 1 ? li / (L - 1) : 1;
      const pvu = (bi + 0.5) / BANDS;
      const which = mono ? [[e.lvL, 1]] : [[e.lvL, 1], [e.lvR, -1]];
      which.forEach((w) => {
        const zz = Math.max(0, Math.min(1, fz + w[1] * OFF));
        const pB = project(pvu, zz, 0, S), pT = project(pvu, zz, w[0][bi], S);
        g.strokeStyle = ink(0.30); g.lineWidth = 0.8;
        g.beginPath(); g.moveTo(pB.x, pB.y); g.lineTo(pT.x, pT.y); g.stroke();
        g.strokeStyle = ink(0.8); g.lineWidth = 1.4;
        g.beginPath(); g.arc(pT.x, pT.y, 4, 0, TAU); g.stroke();
      });
      if (readoutEl) {
        // 频率用**实际覆盖 bin 的中心**，而不是对数轴上的标称位置：
        // 低频段频带比 bin 还窄，两者会差很多（实测 84 Hz 轴位实际读到的是 bin 17 = 205 Hz）
        const hzAct = ((e.binLo[bi] + e.binHi[bi] + 1) / 2) * binHz;
        const hzNom = bandMid[bi];
        const fmtHz = (x) => (x >= 1000 ? (x / 1000).toFixed(2) + ' kHz' : Math.round(x) + ' Hz');
        const off = Math.abs(hzAct - hzNom) / hzAct > 0.12 ? '（轴位 ' + fmtHz(hzNom) + '）' : '';
        const d = (v, r) => dbOf(v[bi]).toFixed(1) + ' dBFS（原始 ' + dbOf(r[bi]).toFixed(1) + '）';
        readoutEl.textContent =
          fmtHz(hzAct) + off + '　·　带 #' + (bi + 1) + '/' + BANDS +
          '　·　L ' + d(e.lvL, e.rawL) +
          (mono ? '　·　单声道' : '　·　R ' + d(e.lvR, e.rawR)) +
          '　·　' + (now - e.t).toFixed(2) + ' s 前' +
          '　·　bin ' + e.binLo[bi] + '–' + e.binHi[bi] + ' @ ' + binHz.toFixed(2) + ' Hz/bin';
      }
    } else {
      hit = null;
      if (readoutEl && mouse) readoutEl.textContent = '把鼠标移到色带上，这里显示该点的详细数值（两声道分别给出）';
    }
    frameMs = frameMs ? frameMs * 0.9 + (performance.now() - t0) * 0.1 : (performance.now() - t0);
  }

  function hexToRgb(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }

  function loop() {
    if (!visible) { running = false; return; }
    if ((canvas.clientWidth || 0) !== W || (canvas.clientHeight || 0) !== H) resize();
    // 惯性：松手后继续转一点再停（"转球"手感）
    if (!drag && (Math.abs(yawVel) > 2e-4 || Math.abs(pitchVel) > 2e-4)) {
      yaw += yawVel;
      pitch = clampPitch(pitch + pitchVel);
      yawVel *= 0.90; pitchVel *= 0.90;
    }
    render();
    raf = requestAnimationFrame(loop);
    running = true;
  }

  // ── 交互：拖拽旋转 / 滚轮缩放 / 双击复位 ──
  // 用 pointer events；在元素上做 setPointerCapture，拖出画布也不会断。
  // 额外注册 mouse 事件作为**兜底**（仅在浏览器没有 PointerEvent 时启用，避免双份旋转）。
  function startDrag(x, y) {
    drag = { x: x, y: y };
    yawVel = 0; pitchVel = 0; vx = 0; vy = 0;
    lastMoveT = performance.now();
    canvas.style.cursor = 'grabbing';
  }
  function moveDrag(x, y) {
    mouse = { x: x, y: y };
    if (!drag) return;
    const dx = x - drag.x, dy = y - drag.y;
    yaw += dx * SENS;
    pitch = clampPitch(pitch + dy * SENS_Y);
    // 速度按**真实时间**算（px/ms）并做平滑；直接拿每事件位移当每帧位移会把惯性放大好几倍
    const t = performance.now();
    const dt = Math.max(4, t - lastMoveT);
    lastMoveT = t;
    vx = vx * 0.65 + (dx / dt) * 0.35;
    vy = vy * 0.65 + (dy / dt) * 0.35;
    drag = { x: x, y: y };
  }
  function endDrag() {
    drag = null;
    canvas.style.cursor = 'grab';
    // 松手 → 把速度转成每帧弧度（限幅，避免甩飞）
    const lim = (v) => Math.max(-0.18, Math.min(0.18, v));
    yawVel = lim(vx * SENS * FRAME * COAST);
    pitchVel = lim(vy * SENS_Y * FRAME * COAST);
  }

  if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
      startDrag(e.offsetX, e.offsetY);
    });
    canvas.addEventListener('pointermove', (e) => moveDrag(e.offsetX, e.offsetY));
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('lostpointercapture', endDrag);
  } else {
    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const r = canvas.getBoundingClientRect();
      startDrag(e.clientX - r.left, e.clientY - r.top);
    });
    window.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      if (drag) moveDrag(e.clientX - r.left, e.clientY - r.top);
    });
    window.addEventListener('mouseup', endDrag);
  }
  canvas.addEventListener('pointerleave', () => { mouse = null; if (!drag) canvas.style.cursor = 'grab'; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoom = Math.max(0.45, Math.min(2.6, zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
  }, { passive: false });
  canvas.addEventListener('dblclick', () => { yaw = -0.68; pitch = 0.42; zoom = 1; yawVel = 0; pitchVel = 0; });

  return {
    push: push,
    setVisible: function (v) {
      visible = !!v;
      if (visible) { resize(); if (!running) loop(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; running = false; }
    },
    reset: function () { yaw = -0.68; pitch = 0.42; zoom = 1; yawVel = 0; pitchVel = 0; },
    isVisible: function () { return visible; },
    // 配色：传 id 字符串（见 VIZ_PALETTES）或 {l,r,bg} 自定义
    setPalette: function (p) {
      if (p && typeof p === 'object') { palId = 'custom'; palL = p.l.slice(); palR = p.r.slice(); palBg = p.bg || ''; }
      else applyPalette(p);
    },
    setCoverColors: function (list) {
      coverColors = (list || []).slice();
      if (palId === 'cover') deriveCover();
      else if (palId === 'theme') palRamp = coverColors.length >= 2 ? coverColors.slice() : RAMP_FALLBACK.slice();
    },
    paletteId: function () { return palId; },
    // 诊断：层数 / 命中 / 频率范围 / 渲染耗时（用于核对 96 层×双声道是否够 60fps）
    stats: function () {
      const sp = entries.length > 1 ? +(entries[entries.length - 1].t - entries[0].t).toFixed(2) : 0;
      return { layers: entries.length, bands: BANDS, mono: mono, span: sp, frameMs: +frameMs.toFixed(2),
               fMin: +FMIN.toFixed(2), fMax: Math.round(FMAX), binHz: +binHz.toFixed(2),
               mouse: mouse, hit: hit, W: W, H: H, yaw: +yaw.toFixed(3), pitch: +pitch.toFixed(3),
               zoom: +zoom.toFixed(2), visible: visible };
    },
  };
}
