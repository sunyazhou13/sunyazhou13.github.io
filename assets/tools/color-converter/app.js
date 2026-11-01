/**
 * 色彩格式转换工具 — 纯前端，无外部依赖
 * 支持：HEX / RGB / HSL / SwiftUI / UIColor / Android / CSS
 */

// ── 预设色板 ─────────────────────────────────────────
const PRESETS = [
  { hex: '#FF5733', name: '橙' },
  { hex: '#FF33F5', name: '粉紫' },
  { hex: '#33FF57', name: '绿' },
  { hex: '#3357FF', name: '蓝' },
  { hex: '#FFEC33', name: '黄' },
  { hex: '#000000', name: '黑' },
  { hex: '#FFFFFF', name: '白' },
  { hex: '#808080', name: '灰' },
  { hex: '#8B4513', name: '棕' },
  { hex: '#00CED1', name: '青' },
];

// ── 核心解析 ─────────────────────────────────────────

/**
 * 通用解析入口：接受任意格式字符串 → {r, g, b, a}（0-255整数，a为0-1或null）
 */
function parseColor(input) {
  if (!input || typeof input !== 'string') return null;
  const s = input.trim();

  // 1. HEX 3位
  const m3 = s.match(/^#([0-9a-fA-F]{3})$/);
  if (m3) {
    const [r, g, b] = [m3[1][0], m3[1][1], m3[1][2]].map(c => parseInt(c + c, 16));
    return { r, g, b, a: null };
  }
  // 2. HEX 6位
  const m6 = s.match(/^#([0-9a-fA-F]{6})$/i);
  if (m6) {
    const n = parseInt(m6[1], 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: null };
  }
  // 3. HEX 8位（带 Alpha）
  const m8 = s.match(/^#([0-9a-fA-F]{8})$/i);
  if (m8) {
    const n = parseInt(m8[1], 16);
    return { r: (n >> 24) & 255, g: (n >> 16) & 255, b: (n >> 8) & 255, a: +(n & 255) / 255 };
  }
  // 4. HEX 4位（带 Alpha）
  const m4 = s.match(/^#([0-9a-fA-F]{4})$/i);
  if (m4) {
    const [r, g, b, a] = [m4[1][0], m4[1][1], m4[1][2], m4[1][3]].map(c => parseInt(c + c, 16));
    return { r, g, b, a: a / 255 };
  }

  // 5. rgb(...) / rgba(...)
  const mRGB = s.match(
    /^(?:rgba?\()?\s*([0-9]{1,3}(?:\.\d+)?%?)\s*[,\s]\s*([0-9]{1,3}(?:\.\d+)?%?)\s*[,\s]\s*([0-9]{1,3}(?:\.\d+)?%?)(?:\s*[,\/]\s*([01]?(?:\.\d+)?))?\s*\)?$/i
  );
  if (mRGB) {
    const toV = (v) => {
      if (v.endsWith('%')) return Math.round(parseFloat(v) * 2.55);
      return Math.min(255, Math.round(parseFloat(v)));
    };
    const r = toV(mRGB[1]);
    const g = toV(mRGB[2]);
    const b = toV(mRGB[3]);
    const a = mRGB[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(mRGB[4]))) : null;
    return { r, g, b, a };
  }

  // 6. hsl(...) / hsla(...)
  const mHSL = s.match(
    /^(?:hsla?\()?\s*([0-9]{1,3}(?:\.\d+)?)\s*[,\s]\s*([0-9]{1,3}(?:\.\d+)?)%?\s*[,\s]\s*([0-9]{1,3}(?:\.\d+)?)%?(?:\s*[,\/]\s*([01]?(?:\.\d+)?))?\s*\)?$/i
  );
  if (mHSL) {
    const h = parseFloat(mHSL[1]) % 360;
    const s_ = Math.min(100, Math.max(0, parseFloat(mHSL[2]))) / 100;
    const l = Math.min(100, Math.max(0, parseFloat(mHSL[3]))) / 100;
    const a = mHSL[4] !== undefined ? Math.min(1, Math.max(0, parseFloat(mHSL[4]))) : null;
    const { r, g, b } = hslToRgb(h, s_, l);
    return { r, g, b, a };
  }

  return null;
}

/** HSL → RGB */
function hslToRgb(h, s, l) {
  h /= 360;
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/** RGB → HSL */
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// ── 格式输出生成 ─────────────────────────────────────

function toHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function toHex8(r, g, b, a) {
  const hex = [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
  const aa = a !== null ? Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase() : 'FF';
  return '#' + hex + aa;
}

function toRgb(r, g, b, a) {
  if (a !== null) return `rgba(${r}, ${g}, ${b}, ${parseFloat(a.toFixed(3))})`;
  return `rgb(${r}, ${g}, ${b})`;
}

function toHsl(r, g, b, a) {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (a !== null) return `hsla(${h}, ${s}%, ${l}%, ${parseFloat(a.toFixed(3))})`;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

function toSwiftUIColor(r, g, b, a) {
  const rf = (r / 255).toFixed(3);
  const gf = (g / 255).toFixed(3);
  const bf = (b / 255).toFixed(3);
  if (a !== null) {
    return `Color(uiColor: UIColor(red: ${rf}, green: ${gf}, blue: ${bf}, alpha: ${parseFloat(a.toFixed(3))}))`;
  }
  return `Color(red: ${rf}, green: ${gf}, blue: ${bf})`;
}

function toUIColor(r, g, b, a) {
  const rf = (r / 255).toFixed(3);
  const gf = (g / 255).toFixed(3);
  const bf = (b / 255).toFixed(3);
  if (a !== null) {
    return `UIColor(red: ${rf}, green: ${gf}, blue: ${bf}, alpha: ${parseFloat(a.toFixed(3))})`;
  }
  return `UIColor(red: ${rf}, green: ${gf}, blue: ${bf}, alpha: 1.0)`;
}

function toAndroid(r, g, b) {
  const to2 = v => v.toString(16).toUpperCase().padStart(2, '0');
  return `android.graphics.Color.parseColor("#${to2(r)}${to2(g)}${to2(b)}")`;
}

function toCSS(r, g, b, a) {
  const rf = (r / 255).toFixed(3);
  const gf = (g / 255).toFixed(3);
  const bf = (b / 255).toFixed(3);
  if (a !== null) {
    return `rgb(${rf} ${gf} ${bf} / ${parseFloat(a.toFixed(3))})`;
  }
  return `rgb(${rf} ${gf} ${bf})`;
}

function toCSSHex(r, g, b) {
  return toHex(r, g, b);
}

// ── UI 渲染 ─────────────────────────────────────────

const DEFINITIONS = [
  { key: 'hex',       label: 'HEX',        fn: (r,g,b,a) => toHex(r,g,b) },
  { key: 'hex8',     label: 'HEX+Alpha',  fn: (r,g,b,a) => toHex8(r,g,b,a) },
  { key: 'rgb',       label: 'RGB',        fn: (r,g,b,a) => toRgb(r,g,b,a) },
  { key: 'hsl',       label: 'HSL',        fn: (r,g,b,a) => toHsl(r,g,b,a) },
  { key: 'swiftui',   label: 'SwiftUI',    fn: (r,g,b,a) => toSwiftUIColor(r,g,b,a) },
  { key: 'uicolor',   label: 'UIColor',    fn: (r,g,b,a) => toUIColor(r,g,b,a) },
  { key: 'android',   label: 'Android',    fn: (r,g,b,a) => toAndroid(r,g,b) },
  { key: 'css',       label: 'CSS',        fn: (r,g,b,a) => toCSS(r,g,b,a) },
  { key: 'csshex',    label: 'CSS Hex',    fn: (r,g,b,a) => toCSSHex(r,g,b) },
];

const MAX_VISIBLE_CHARS = 72;
const containers = {};
let state = null; // {r,g,b,a} 或 null

function init() {
  // 渲染预设色板
  const presetsRow = document.getElementById('cc-presets-row');
  PRESETS.forEach(({ hex }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cc-preset-swatch';
    btn.style.background = hex;
    btn.title = hex;
    btn.setAttribute('aria-label', `Preset color ${hex}`);
    btn.addEventListener('click', () => {
      document.getElementById('cc-input').value = hex;
      onInput(hex);
    });
    presetsRow.appendChild(btn);
  });

  // 渲染格式卡片
  const outputs = document.getElementById('cc-outputs');
  DEFINITIONS.forEach(({ key, label }) => {
    const card = document.createElement('div');
    card.className = 'cc-card';
    card.id = `cc-card-${key}`;
    card.innerHTML = `
      <div class="cc-card-header">
        <span class="cc-card-name">${label}</span>
        <button type="button" class="cc-copy-btn" data-key="${key}">复制</button>
      </div>
      <pre class="cc-card-value" id="cc-val-${key}">—</pre>
    `;
    outputs.appendChild(card);
    containers[key] = card.querySelector('.cc-card-value');
    card.querySelector('.cc-copy-btn').addEventListener('click', () => copyCard(key));
  });

  // 输入监听
  const input = document.getElementById('cc-input');
  input.addEventListener('input', () => onInput(input.value));

  // 预设色板默认选中
  onInput('#FF5733');
  input.value = '#FF5733';
}

function onInput(value) {
  if (!value.trim()) {
    setState(null);
    return;
  }
  const parsed = parseColor(value);
  setState(parsed);
}

function setState(parsed) {
  state = parsed;
  const errorEl = document.getElementById('cc-error');
  const previewSwatch = document.getElementById('cc-preview-swatch');
  const previewLabel = document.getElementById('cc-preview-label');

  if (!parsed) {
    errorEl.hidden = false;
    DEFINITIONS.forEach(({ key }) => {
      const el = document.getElementById(`cc-val-${key}`);
      if (el) el.textContent = '—';
    });
    previewSwatch.style.background = '#cccccc';
    previewLabel.textContent = '—';
    return;
  }

  errorEl.hidden = true;
  const { r, g, b, a } = parsed;
  const hex = toHex(r, g, b);

  // 预览
  previewSwatch.style.background = hex;
  previewLabel.textContent = hex;

  // 更新各格式卡片
  DEFINITIONS.forEach(({ key, fn }) => {
    const el = document.getElementById(`cc-val-${key}`);
    if (!el) return;
    const raw = fn(r, g, b, a);
    el.textContent = raw;

    // 超长时显示展开按钮
    if (raw.length > MAX_VISIBLE_CHARS) {
      el.style.display = 'block';
    } else {
      el.style.display = 'block';
    }
  });

  // 更新原生 color input
  const nativePicker = document.getElementById('cc-color-native');
  if (nativePicker) nativePicker.value = hex;
}

async function copyCard(key) {
  const el = document.getElementById(`cc-val-${key}`);
  if (!el || !el.textContent || el.textContent === '—') return;
  const text = el.textContent;
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.querySelector(`[data-key="${key}"]`);
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '已复制';
    btn.classList.add('cc-copied');
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove('cc-copied');
    }, 1500);
  } catch {
    // fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

// ── 原生吸管按钮 ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const pickerBtn = document.getElementById('cc-picker-btn');
  const colorInput = document.getElementById('cc-color-native');
  const textInput = document.getElementById('cc-input');

  if (pickerBtn && colorInput) {
    // 点击触发原生 color picker
    pickerBtn.addEventListener('click', () => {
      colorInput.click();
    });

    colorInput.addEventListener('input', () => {
      const hex = colorInput.value;
      textInput.value = hex;
      onInput(hex);
    });
  }

  init();
});
