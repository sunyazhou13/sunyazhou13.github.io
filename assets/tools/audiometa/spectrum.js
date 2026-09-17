// 频谱分析 —— 纯手写 FFT + Canvas 绘制，零外部依赖
//
// 为什么自己写而不用 AnalyserNode：AnalyserNode 只能拿到「正在播放」的实时频谱，
// 对 DSF / APE / WMA 这些浏览器根本解不了的格式完全无效。
// 这里统一走「拿到 PCM → 分窗 FFT → 平均幅度谱」，所以任何能被解成 PCM 的格式都能分析
// （原生解不了的格式先交给 ffmpeg.wasm 转码，与试听共用同一条链路）。

// ── 迭代式基 2 FFT（原地） ──
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

function median(a) {
  const s = Array.from(a).sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/**
 * 对已解码的 AudioBuffer 做频谱分析。
 * 返回 { sr, freqs, db, cutoff, noiseFloor }
 *   db      —— 每个频点对应的电平（dB，0 dB = 满幅正弦）
 *   cutoff  —— 有效带宽上限（Hz）：自奈奎斯特频率往下扫，电平首次高出「底噪 + 10 dB」的位置
 */
export function analyzeSpectrum(buf) {
  const sr = buf.sampleRate;
  const chs = buf.numberOfChannels;
  const len = buf.length;

  let N = 16384;
  while (N > len && N > 1024) N >>= 1;
  const half = N >> 1;

  // 汉宁窗（幅度补偿按窗和的一半）
  const win = new Float32Array(N);
  let winSum = 0;
  for (let i = 0; i < N; i++) { win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)); winSum += win[i]; }
  const scale = 2 / winSum;

  // 取多段数据，避免只看开头
  const raw = [];
  for (let c = 0; c < chs; c++) raw.push(buf.getChannelData(c));

  // 逐声道单独做 FFT，再逐频点取最大值。
  // 不能先把多声道平均成单声道 —— 左右声道反相的成份会被抵消掉，频谱会凭空少一块。
  const K = Math.max(1, Math.min(32, Math.floor(len / N) || 1));
  const re = new Float64Array(N), im = new Float64Array(N);
  const perCh = [];
  for (let c = 0; c < chs; c++) {
    const acc = new Float32Array(half + 1);
    for (let w = 0; w < K; w++) {
      const off = Math.floor((w + 0.5) / K * Math.max(0, len - N));
      for (let i = 0; i < N; i++) { re[i] = (raw[c][off + i] || 0) * win[i]; im[i] = 0; }
      fft(re, im);
      for (let k = 0; k <= half; k++) acc[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k]) * scale;
    }
    const d = new Float32Array(half + 1);
    for (let k = 0; k <= half; k++) d[k] = Math.max(-140, 20 * Math.log10(Math.max(acc[k] / K, 1e-10)));
    perCh.push(d);
  }

  const freqs = new Float32Array(half + 1);
  const db = new Float32Array(half + 1);
  for (let k = 0; k <= half; k++) {
    freqs[k] = k * sr / N;
    let m = -140;
    for (let c = 0; c < chs; c++) if (perCh[c][k] > m) m = perCh[c][k];
    db[k] = m;
  }

  // 高频段电平（最靠上一小段的中位数）—— 用于展示，不适合当判据
  const top = [];
  for (let k = Math.floor(half * 0.95); k <= half; k++) top.push(db[k]);
  const hfLevel = top.length ? median(top) : -140;

  // 截止判据：以「200 Hz – 10 kHz 的中位电平」为参考，往下 60 dB 作为门槛。
  // 不能用「最高频段的中位数 + 10 dB」当参考 —— 对白噪声这类宽带信号，
  // 内容电平和底噪是同一个值，那样会把满带宽误判成"没内容"。
  const binHz = sr / N;
  const kLo = Math.max(1, Math.round(200 / binHz));
  const kHi = Math.min(half, Math.round(Math.min(10000, sr / 4) / binHz));
  const mid = [];
  for (let k = kLo; k <= kHi; k++) mid.push(db[k]);
  const ref = mid.length ? median(mid) : -140;
  const thr = Math.max(ref - 60, -115);

  let cutoff = 0;
  for (let k = half; k >= 1; k--) {
    if (db[k] > thr) { cutoff = freqs[k]; break; }
  }

  // 升采样判据：取「紧邻 22.05 kHz」的两个窄带比电平。
  //
  // 为什么必须是紧邻窄带，而不是拿 18–21 kHz 和 24–30 kHz 这种相距很远的带子比？
  // 因为真实音乐的高频本来就比低频低，天然滚降本身就会贡献一个"落差"，
  // 用远距带比会把平缓滚降的音乐误判成断崖。
  // 紧邻窄带（21–22 kHz / 23–25 kHz，间隔仅 1–3 kHz）里，天然滚降只贡献 1–3 dB，
  // 而 44.1 kHz 升采样留下的砖墙断崖是 40 dB 以上 —— 两者差一个量级，可以安全区分。
  let hfDrop = null, hfInner = null;
  if (sr >= 80000) {
    const bandM = (f0, f1) => {
      const a = [];
      for (let k = 1; k <= half; k++) if (freqs[k] >= f0 && freqs[k] <= f1) a.push(db[k]);
      return a.length ? median(a) : -140;
    };
    hfInner = bandM(21000, 22000);
    hfDrop = bandM(23000, 25000) - hfInner;
  }
  return { sr, freqs, db, cutoff, hfDrop, hfInner, hfLevel, ref, thr };
}

/**
 * 把 AudioBuffer 降采样成 W 个像素列的 (min, max) 包络 —— 静态波形用。
 * 和实时示波器不同：实时那条是「当前这一小段窗口」，这里要的是「整首歌的包络」，
 * 所以按列取 min/max 而不是直接抽样（抽样会漏掉瞬态，波形看着像随机噪声）。
 * 返回 { width, chans: [{ min: Float32Array, max: Float32Array }] }
 */
export function computeWaveform(buf, width) {
  const W = Math.max(1, Math.min(4000, Math.round(width) || 900));
  const n = buf.length;
  const chans = [];
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    const mn = new Float32Array(W), mx = new Float32Array(W);
    const step = n / W;
    for (let i = 0; i < W; i++) {
      const s = Math.floor(i * step);
      const e = Math.min(n, Math.max(s + 1, Math.floor((i + 1) * step)));
      let lo = 0, hi = 0;
      for (let j = s; j < e; j++) { const v = d[j]; if (v < lo) lo = v; else if (v > hi) hi = v; }
      mn[i] = lo; mx[i] = hi;
    }
    chans.push({ min: mn, max: mx });
  }
  return { width: W, chans };
}

/**
 * 画静态波形：每个声道一条泳道（中线 + min/max 包络竖线），风格与站点一致、扁平无渐变。
 */
export function drawWaveform(canvas, wf, opts) {
  const o = opts || {};
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 900, H = o.height || 96;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);

  const chans = (wf && wf.chans) || [];
  const lanes = Math.max(1, chans.length);
  const laneH = H / lanes;
  const dark = isDark();

  // 中线
  g.strokeStyle = dark ? 'rgba(148,163,184,0.22)' : 'rgba(107,114,128,0.20)';
  g.lineWidth = 1;
  for (let c = 0; c < lanes; c++) {
    const y = Math.round(laneH * (c + 0.5)) + 0.5;
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }

  // 包络
  g.strokeStyle = dark ? 'rgba(91,143,240,0.92)' : 'rgba(47,111,222,0.90)';
  g.lineWidth = 1;
  const half = Math.max(2, laneH / 2 - 3);
  const sx = W / Math.max(1, wf ? wf.width : 1);
  for (let c = 0; c < chans.length; c++) {
    const midY = laneH * (c + 0.5);
    const mn = chans[c].min, mx = chans[c].max;
    g.beginPath();
    for (let i = 0; i < (wf ? wf.width : 0); i++) {
      const x = Math.round(i * sx) + 0.5;
      g.moveTo(x, midY - mx[i] * half);
      g.lineTo(x, midY - mn[i] * half);
    }
    g.stroke();
  }

  // 多声道时标 L / R
  if (lanes > 1 && lanes <= 8) {
    g.fillStyle = dark ? 'rgba(148,163,184,0.75)' : 'rgba(107,114,128,0.75)';
    g.font = '10px ui-monospace, SFMono-Regular, Menlo, monospace';
    g.textAlign = 'left'; g.textBaseline = 'top';
    const NM = ['L', 'R', 'C', 'LFE', 'Ls', 'Rs', 'Lb', 'Rb'];
    for (let c = 0; c < lanes; c++) g.fillText(NM[c] || String(c + 1), 3, laneH * c + 2);
  }
}

// ── 播放时的实时频谱动画（Web Audio AnalyserNode） ──
// 频域柱状 + 峰值帽；播放时由音频驱动，暂停时走循环待机动画（不会变成死图）。
let vCtx = null, vAn = null, vSrc = null, vSrcEl = null, vRaf = 0, vBuf = null;

const BARS = 64;
const RAMP = [[0, [56, 138, 221]], [0.34, [29, 158, 117]], [0.66, [239, 159, 39]], [1, [226, 75, 74]]];

function rampColor(t) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < RAMP.length - 1; i++) {
    const a = RAMP[i], b = RAMP[i + 1];
    if (t >= a[0] && t <= b[0]) {
      const k = (t - a[0]) / (b[0] - a[0] || 1);
      return 'rgb(' + Math.round(a[1][0] + (b[1][0] - a[1][0]) * k) + ','
        + Math.round(a[1][1] + (b[1][1] - a[1][1]) * k) + ','
        + Math.round(a[1][2] + (b[1][2] - a[1][2]) * k) + ')';
    }
  }
  return 'rgb(226,75,74)';
}

function rrect(g, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.lineTo(x + w - rr, y);
  g.quadraticCurveTo(x + w, y, x + w, y + rr);
  g.lineTo(x + w, y + h);
  g.lineTo(x, y + h);
  g.lineTo(x, y + rr);
  g.quadraticCurveTo(x, y, x + rr, y);
  g.closePath();
  g.fill();
}

function vizPaint(canvas, buf, peaks, idleT) {
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 600, H = canvas.clientHeight || 84;
  if (canvas.width !== Math.round(W * dpr)) canvas.width = Math.round(W * dpr);
  if (canvas.height !== Math.round(H * dpr)) canvas.height = Math.round(H * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);

  const gap = 2, bw = (W - gap * (BARS - 1)) / BARS;
  const n = buf ? buf.length : 0;
  const nyq = (vCtx ? vCtx.sampleRate : 48000) / 2;
  const binHz = n ? nyq / n : 1;
  const top = 6, usable = H - top - 4;
  let prev = 1;

  for (let i = 0; i < BARS; i++) {
    let v = 0;
    if (n) {
      const f = 20 * Math.pow(nyq / 20, i / (BARS - 1));
      const b = Math.min(n - 1, Math.max(prev, Math.round(f / binHz)));
      for (let k = prev; k <= b; k++) if (buf[k] > v) v = buf[k];
      prev = b + 1;
    } else if (idleT) {
      const w = Math.sin(idleT * 1.7 + i * 0.30) * 0.5 + 0.5;
      v = 8 + w * 16;
    }
    const h = Math.max(2, (v / 255) * usable);
    const x = i * (bw + gap);
    g.fillStyle = rampColor(i / (BARS - 1));
    rrect(g, x, H - 4 - h, bw, h, Math.min(bw / 2, 2));
    // 峰值帽：慢慢往下掉
    if (peaks) {
      if (h >= peaks[i]) peaks[i] = h;
      else peaks[i] = Math.max(2, peaks[i] - 0.9);
      g.fillStyle = 'rgba(120,130,145,0.55)';
      g.fillRect(x, H - 4 - peaks[i] - 2, bw, 2);
    }
  }
}

export function stopVisualizer(canvas) {
  if (vRaf) { cancelAnimationFrame(vRaf); vRaf = 0; }
  if (canvas) vizPaint(canvas, null, null, 0);
}

function isDark() { return document.documentElement.getAttribute('mode') === 'dark'; }

// ── Safari 静音坑 ──
// createMediaElementSource() 之后，<audio> 的声音只能从 AudioContext 出去。
// 若 AudioContext 是在「非用户手势」的上下文里被创建/resume（例如 DSF 先转码、几秒后才建播放器），
// Safari 会一直把它保持在 suspended —— 表现为进度条在走、却没有声音。
// 修法：在任何一次用户手势里、以及 <audio> 触发 play 时，主动 resume 一次。
function unlockAudio() {
  if (vCtx && vCtx.state === 'suspended') { try { vCtx.resume(); } catch (e) { } }
}
let gestureArmed = false;
function armGestureUnlock() {
  if (gestureArmed) return;
  gestureArmed = true;
  document.addEventListener('pointerdown', unlockAudio, true);
  document.addEventListener('keydown', unlockAudio, true);
  document.addEventListener('touchstart', unlockAudio, true);
}

export function bindVisualizer(audio, canvas) {
  // 关键：vRaf 是模块级唯一变量。重新选歌会再次 bind，若不先停掉上一条循环，
  // 旧循环会和新循环逐帧抢共享的 vSrc / vSrcEl —— 旧循环发现 vSrcEl 不是自己的 audio，
  // 就 disconnect 掉当前的 source、再想给自己的 audio 重建一个（同一 <audio> 重复
  // createMediaElementSource 会抛错），结果把音频图拆烂：换歌后 currentTime 卡在 0、
  // 波形一条平线、彻底没声。实测未修时，第二首的 createMediaElementSource 被调 123 次、抛错 121 次。
  if (vRaf) { cancelAnimationFrame(vRaf); vRaf = 0; }
  const peaks = new Float32Array(BARS);
  let idleT = 0;
  armGestureUnlock();
  audio.addEventListener('play', unlockAudio);
  const ensure = () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      if (!vCtx) vCtx = new AC();
      if (vCtx.state === 'suspended') vCtx.resume();
      if (vSrcEl !== audio) {
        if (vSrc) { try { vSrc.disconnect(); } catch (e) { } }
        vSrc = vCtx.createMediaElementSource(audio);
        if (!vAn) {
          vAn = vCtx.createAnalyser();
          vAn.fftSize = 2048;
          vAn.smoothingTimeConstant = 0.75;
          vAn.connect(vCtx.destination);
        }
        vSrc.connect(vAn);
        vSrcEl = audio;
        vBuf = new Uint8Array(vAn.frequencyBinCount);
      }
      return true;
    } catch (e) { return false; }
  };
  const loop = () => {
    const live = ensure() && !audio.paused && !audio.ended;
    if (live) {
      vAn.getByteFrequencyData(vBuf);
      vizPaint(canvas, vBuf, peaks, 0);
    } else {
      idleT += 0.035;
      vizPaint(canvas, null, peaks, idleT);
    }
    vRaf = requestAnimationFrame(loop);
  };
  vizPaint(canvas, null, peaks, 0);
  loop();
}

/**
 * 把频谱画到 canvas。风格与站点一致：扁平、细网格、无渐变。
 */
export function drawSpectrum(canvas, spec, opts) {
  const o = opts || {};
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.clientWidth || 900, H = o.height || 300;
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  canvas.style.height = H + 'px';
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, W, H);

  const padL = 44, padR = 14, padT = 12, padB = 30;
  const pw = W - padL - padR, ph = H - padT - padB;
  const dbMin = -120, dbMax = 0;
  const maxF = Math.min(spec.sr / 2, o.maxF || spec.sr / 2);

  const x = (f) => padL + (f / maxF) * pw;
  const y = (v) => padT + ((dbMax - Math.max(dbMin, Math.min(dbMax, v))) / (dbMax - dbMin)) * ph;

  // 网格
  g.strokeStyle = 'rgba(128,128,128,0.16)'; g.lineWidth = 1;
  g.fillStyle = '#6b7280'; g.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  g.textAlign = 'right'; g.textBaseline = 'middle';
  for (let v = dbMax; v >= dbMin; v -= 20) {
    const yy = Math.round(y(v)) + 0.5;
    g.beginPath(); g.moveTo(padL, yy); g.lineTo(W - padR, yy); g.stroke();
    g.fillText(String(v), padL - 6, yy);
  }
  g.textAlign = 'center'; g.textBaseline = 'top';
  const stepF = maxF > 60000 ? 20000 : (maxF > 30000 ? 10000 : 5000);
  for (let f = 0; f <= maxF + 1; f += stepF) {
    const xx = Math.round(x(f)) + 0.5;
    g.strokeStyle = 'rgba(128,128,128,0.10)';
    g.beginPath(); g.moveTo(xx, padT); g.lineTo(xx, padT + ph); g.stroke();
    g.fillStyle = '#6b7280';
    g.fillText((f / 1000) + 'k', xx, padT + ph + 6);
  }

  // 截止频率竖线
  if (o.cutoff && o.cutoff > 0) {
    const xx = Math.round(x(o.cutoff)) + 0.5;
    g.strokeStyle = '#A32D2D'; g.setLineDash([4, 4]); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(xx, padT); g.lineTo(xx, padT + ph); g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#A32D2D'; g.textAlign = xx > W - 90 ? 'right' : 'left'; g.textBaseline = 'top';
    g.fillText((o.cutoffLabel || (Math.round(o.cutoff / 100) / 10) + ' kHz'), xx + (xx > W - 90 ? -5 : 5), padT + 2);
  }

  // 频谱曲线
  const bins = spec.freqs.length;
  const step = Math.max(1, Math.floor(bins / Math.max(1, pw * 2)));
  g.strokeStyle = o.color || '#185FA5'; g.lineWidth = 1.6;
  g.beginPath();
  let first = true;
  for (let k = 0; k < bins; k += step) {
    if (spec.freqs[k] > maxF) break;
    const xx = x(spec.freqs[k]), yy = y(spec.db[k]);
    if (first) { g.moveTo(xx, yy); first = false; } else g.lineTo(xx, yy);
  }
  g.stroke();

  // 轴标题
  g.fillStyle = '#6b7280'; g.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
  g.textAlign = 'center'; g.textBaseline = 'top';
  g.fillText('频率 (Hz)', padL + pw / 2, H - 14);
}
