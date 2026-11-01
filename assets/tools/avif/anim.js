/* anim.js — 动图支持模块（图片转 AVIF 工具专用）
 * 纯 JS、零依赖、无 DOM，可在浏览器与 Node 中运行：
 *   1. decodeGif()          GIF 逐帧解码（LZW + 帧合成 + disposal 语义）
 *   2. parseAvifStill()     解析单帧 AVIF 文件（提取 AV1 裸流 / av1C / 属性盒子）
 *   3. muxAnimatedAvif()    将逐帧 AV1 样本封装为 HEIF 序列（动画 AVIF）
 * 结构参考：libavif 输出的动画 AVIF（ftyp + meta + moov + mdat）
 */

/* ================================================================
 * 一、GIF 解码器
 * ================================================================ */

/**
 * 解码 GIF，逐帧回调（合成后的完整 RGBA 帧）。
 * @param {ArrayBuffer|Uint8Array} buf
 * @param {(frame:{rgba:Uint8Array,delayMs:number,index:number})=>void} onFrame
 * @returns {{width:number,height:number,frameCount:number,loop:number}}
 */
export function decodeGif(buf, onFrame) {
  var u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (u8.length < 13 || u8[0] !== 0x47 || u8[1] !== 0x49 || u8[2] !== 0x46) {
    throw new Error('不是有效的 GIF 文件');
  }
  var width = u8[6] | (u8[7] << 8);
  var height = u8[8] | (u8[9] << 8);
  var packed = u8[10];
  var gctFlag = packed & 0x80;
  var gctSize = 0;
  if (gctFlag) gctSize = 3 * (1 << ((packed & 0x07) + 1));
  var p = 13;
  var gct = null;
  if (gctFlag) {
    gct = u8.subarray(p, p + gctSize);
    p += gctSize;
  }

  var MAX_FRAMES = 500;
  var canvas = new Uint8Array(width * height * 4); // 合成画布（RGBA）
  var savedCanvas = null;   // disposal 3 恢复用
  var frameIndex = 0;
  var loop = -1;            // -1 = 无循环信息（播放一次），0 = 无限循环

  // 当前帧的 GCE 状态
  var gceDisposal = 0;
  var gceTransparent = false;
  var gceTransparentIdx = 0;
  var gceDelayCs = 0;

  while (p < u8.length) {
    var b = u8[p];
    if (b === 0x3B) break; // trailer
    if (b === 0x21) { // 扩展块
      var label = u8[p + 1];
      p += 2;
      if (label === 0xF9) { // Graphic Control Extension
        // 此时 p 指向块大小字节：[size=4][packed][delay_lo][delay_hi][trans_idx][0]
        var gceSize = u8[p];
        var gp = u8[p + 1];
        gceDisposal = (gp >> 2) & 0x07;
        gceTransparent = (gp & 0x01) === 1;
        gceDelayCs = u8[p + 2] | (u8[p + 3] << 8);
        gceTransparentIdx = u8[p + 4];
        p += 1 + gceSize + 1; // size 字节 + 数据 + 终止符
        continue;
      }
      if (label === 0xFF) { // Application Extension（找 NETSCAPE 循环次数）
        // 此刻 p 指向第一个子块（[11][标识 8B][认证码 3B] 本身就是子块序列的开头）
        var blockSize = u8[p];
        if (blockSize === 11) {
          var app = String.fromCharCode.apply(null, u8.subarray(p + 1, p + 12));
          if (app === 'NETSCAPE2.0') {
            var q = p + 12;
            while (q < u8.length && u8[q] !== 0) {
              if (u8[q] === 3 && u8[q + 1] === 1) {
                loop = u8[q + 2] | (u8[q + 3] << 8);
              }
              q += 1 + u8[q];
            }
          }
        }
        // 按子块序列跳过整个扩展
        while (p < u8.length && u8[p] !== 0) p += 1 + u8[p];
        p += 1;
        continue;
      }
      // 其它扩展（注释 / 文本）：跳过子块
      while (p < u8.length && u8[p] !== 0) p += 1 + u8[p];
      p += 1;
      continue;
    }
    if (b === 0x2C) { // 图像描述符
      var ix = u8[p + 1] | (u8[p + 2] << 8);
      var iy = u8[p + 3] | (u8[p + 4] << 8);
      var iw = u8[p + 5] | (u8[p + 6] << 8);
      var ih = u8[p + 7] | (u8[p + 8] << 8);
      var ipacked = u8[p + 9];
      p += 10;
      var lct = null;
      if (ipacked & 0x80) {
        var lctSize = 3 * (1 << ((ipacked & 0x07) + 1));
        lct = u8.subarray(p, p + lctSize);
        p += lctSize;
      }
      var interlaced = (ipacked & 0x40) !== 0;
      var minCodeSize = u8[p];
      p += 1;

      // 收集 LZW 数据子块
      var lzwChunks = [];
      var lzwLen = 0;
      while (p < u8.length && u8[p] !== 0) {
        var sz = u8[p];
        lzwChunks.push(u8.subarray(p + 1, p + 1 + sz));
        lzwLen += sz;
        p += 1 + sz;
      }
      p += 1; // 跳过块终止符

      var lzwData = new Uint8Array(lzwLen);
      var off = 0;
      for (var ci = 0; ci < lzwChunks.length; ci++) {
        lzwData.set(lzwChunks[ci], off);
        off += lzwChunks[ci].length;
      }

      // LZW 解码得到像素索引
      var indices = new Uint8Array(iw * ih);
      gifLzwDecode(minCodeSize, lzwData, indices);

      // disposal 3：先保存当前画布
      var needRestore = gceDisposal === 3;
      if (needRestore) {
        if (!savedCanvas) savedCanvas = new Uint8Array(canvas.length);
        savedCanvas.set(canvas);
      }

      // 把本帧像素画到画布
      var palette = lct || gct;
      if (!palette) throw new Error('GIF 缺少调色板');
      compositeFrame(canvas, width, height, indices, iw, ih, ix, iy,
        palette, interlaced, gceTransparent, gceTransparentIdx);

      // 输出当前帧（拷贝，画布还要继续用）
      var frameRgba = new Uint8Array(canvas);
      var delayMs = gceDelayCs * 10;
      if (delayMs < 20) delayMs = 100; // 浏览器对过短延时的通用归一化（Firefox 规则）
      if (onFrame && frameIndex < MAX_FRAMES) {
        onFrame({ rgba: frameRgba, delayMs: delayMs, index: frameIndex });
      }
      frameIndex++;

      // 本帧结束后的画布处理
      if (gceDisposal === 2) {
        for (var dy = iy; dy < iy + ih && dy < height; dy++) {
          for (var dx = ix; dx < ix + iw && dx < width; dx++) {
            var o = (dy * width + dx) * 4;
            canvas[o] = canvas[o + 1] = canvas[o + 2] = canvas[o + 3] = 0;
          }
        }
      } else if (gceDisposal === 3 && savedCanvas) {
        canvas.set(savedCanvas);
      }

      // 重置 GCE（每帧独立）
      gceDisposal = 0; gceTransparent = false; gceDelayCs = 0;
      continue;
    }
    // 未知块：保守终止
    break;
  }

  return { width: width, height: height, frameCount: frameIndex, loop: loop };
}

/** 经典 GIF LZW 解码（输出像素索引） */
function gifLzwDecode(minCodeSize, data, out) {
  var clearCode = 1 << minCodeSize;
  var eoiCode = clearCode + 1;
  var codeSize = minCodeSize + 1;
  var dict = new Int32Array(4096 * 2); // [prefix, suffix] 交错
  var dictStack = new Uint8Array(4096);
  var nextCode = eoiCode + 1;

  // 初始化字典
  for (var i = 0; i < clearCode; i++) { dict[i * 2] = -1; dict[i * 2 + 1] = i; }

  var bitPos = 0;
  var totalBits = data.length * 8;
  var prev = -1;
  var outPos = 0;
  var firstByte = -1;

  function readCode(bits) {
    if (bitPos + bits > totalBits) return -1;
    var byteIdx = bitPos >> 3;
    var bitOff = bitPos & 7;
    var v = data[byteIdx] | (byteIdx + 1 < data.length ? data[byteIdx + 1] << 8 : 0) |
      (byteIdx + 2 < data.length ? data[byteIdx + 2] << 16 : 0);
    v = (v >>> bitOff) & ((1 << bits) - 1);
    bitPos += bits;
    return v;
  }

  // 展开一个码到栈
  function emit(code) {
    var sp = 0;
    var c = code;
    while (c >= 0) {
      dictStack[sp++] = dict[c * 2 + 1];
      c = dict[c * 2];
    }
    while (sp > 0 && outPos < out.length) out[outPos++] = dictStack[--sp];
  }

  for (;;) {
    var code = readCode(codeSize);
    if (code === -1 || code === eoiCode) break;
    if (code === clearCode) {
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      prev = -1;
      firstByte = -1;
      continue;
    }
    if (prev === -1) {
      // 第一个码必为根码
      emit(code);
      firstByte = dict[code * 2 + 1];
      prev = code;
    } else {
      var inDict = code < nextCode;
      if (inDict) {
        emit(code);
        var last = code;
        while (dict[last * 2] >= 0) last = dict[last * 2];
        firstByte = dict[last * 2 + 1];
      } else {
        // 码不在字典中：expand(prev) + firstByte(prev)
        emit(prev);
        if (outPos < out.length) out[outPos++] = firstByte;
      }
      if (nextCode < 4096) {
        dict[nextCode * 2] = prev;
        dict[nextCode * 2 + 1] = firstByte;
        nextCode++;
        if (nextCode === (1 << codeSize) && codeSize < 12) codeSize++;
      }
      prev = code;
    }
    if (outPos >= out.length) break;
  }
}

/** 把一帧索引像素合成到 RGBA 画布（含隔行扫描） */
function compositeFrame(canvas, cw, ch, indices, iw, ih, ix, iy,
  palette, interlaced, transparent, transparentIdx) {
  var rows = [];
  if (interlaced) {
    // 4 趟：步长 8 起 0；步长 8 起 4；步长 4 起 2；步长 2 起 1
    for (var y0 = 0; y0 < ih; y0 += 8) rows.push(y0);
    for (var y4 = 4; y4 < ih; y4 += 8) rows.push(y4);
    for (var y2 = 2; y2 < ih; y2 += 4) rows.push(y2);
    for (var y1 = 1; y1 < ih; y1 += 2) rows.push(y1);
  } else {
    for (var yn = 0; yn < ih; yn++) rows.push(yn);
  }
  for (var r = 0; r < rows.length; r++) {
    var sy = rows[r];       // 帧内行号
    var dy = iy + sy;       // 画布行号
    if (dy < 0 || dy >= ch) continue;
    for (var sx = 0; sx < iw; sx++) {
      var dx = ix + sx;
      if (dx < 0 || dx >= cw) continue;
      var idx = indices[sy * iw + sx];
      var o = (dy * cw + dx) * 4;
      if (transparent && idx === transparentIdx) {
        canvas[o + 3] = 0;
        continue;
      }
      var pi = idx * 3;
      canvas[o] = palette[pi];
      canvas[o + 1] = palette[pi + 1];
      canvas[o + 2] = palette[pi + 2];
      canvas[o + 3] = 255;
    }
  }
}

/* ================================================================
 * 二、单帧 AVIF 解析（ISOBMFF）
 * ================================================================ */

function u16be(b, o) { return (b[o] << 8) | b[o + 1]; }
function u32be(b, o) { return ((b[o] << 24) | (b[o + 1] << 16) | (b[o + 2] << 8) | b[o + 3]) >>> 0; }

/** 遍历 [start,end) 内的盒子，回调 (type, bodyStart, bodyEnd, boxStart) */
function walkBoxes(buf, start, end, cb) {
  var o = start;
  while (o + 8 <= end) {
    var size = u32be(buf, o);
    var type = String.fromCharCode(buf[o + 4], buf[o + 5], buf[o + 6], buf[o + 7]);
    var hdr = 8;
    if (size === 1) {
      // 64 位大小（截断到 32 位范围足够）
      size = u32be(buf, o + 12); // 低 32 位（高位在前：+8 高 +12 低）
      hdr = 16;
    } else if (size === 0) {
      size = end - o;
    }
    if (size < hdr || o + size > end) return;
    cb(type, o + hdr, o + size, o);
    o += size;
  }
}

/**
 * 解析单帧 AVIF 文件。
 * @returns {{av1:Uint8Array, av1C:Uint8Array, ispe:Uint8Array|null,
 *            pixi:Uint8Array|null, colr:Uint8Array|null,
 *            width:number, height:number, brands:string[]}}
 */
export function parseAvifStill(buf) {
  var u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  var brands = [];
  var metaStart = -1, metaEnd = -1;

  walkBoxes(u8, 0, u8.length, function (type, body, end) {
    if (type === 'ftyp') {
      for (var i = body + 8; i + 4 <= end; i += 4) {
        brands.push(String.fromCharCode(u8[i], u8[i + 1], u8[i + 2], u8[i + 3]));
      }
    } else if (type === 'meta') {
      metaStart = body + 4; // 跳过 version/flags
      metaEnd = end;
    }
  });
  if (metaStart < 0) throw new Error('AVIF 缺少 meta 盒子');

  var itemLocs = {};   // itemId -> [ {offset,length} ]
  var itemTypes = {};  // itemId -> 'av01'
  var ipcoProps = [];  // 属性盒子列表（完整盒子字节）
  var itemProps = {};  // itemId -> 属性索引数组（1 基）

  walkBoxes(u8, metaStart, metaEnd, function (type, body, end) {
    // 注意：body 指向盒子头之后；fullbox 的 version 在 body[0]、flags 在 body[1..3]、数据从 body+4 开始
    if (type === 'iloc') {
      var ver = u8[body];
      var b = body + 4;
      var offsetSize = u8[b] >> 4, lengthSize = u8[b] & 15;
      var baseOffSize = u8[b + 1] >> 4, indexSize = u8[b + 1] & 15;
      b += 2;
      var count = ver < 2 ? u16be(u8, b) : u32be(u8, b);
      b += ver < 2 ? 2 : 4;
      for (var i = 0; i < count; i++) {
        var itemId = ver < 2 ? u16be(u8, b) : u32be(u8, b);
        b += ver < 2 ? 2 : 4;
        if (ver === 1 || ver === 2) b += 2; // construction_method（仅支持 0=文件绝对偏移）
        b += 2; // data_reference_index
        var baseOffset = 0;
        if (baseOffSize) {
          for (var k = 0; k < baseOffSize; k++) baseOffset = baseOffset * 256 + u8[b + k];
          b += baseOffSize;
        }
        var extentCount = u16be(u8, b); b += 2;
        var exts = [];
        for (var e = 0; e < extentCount; e++) {
          if (indexSize) b += indexSize; // extent_index（未用）
          var eo = 0, el = 0;
          for (var k2 = 0; k2 < offsetSize; k2++) eo = eo * 256 + u8[b + k2];
          b += offsetSize;
          for (var k3 = 0; k3 < lengthSize; k3++) el = el * 256 + u8[b + k3];
          b += lengthSize;
          exts.push({ offset: baseOffset + eo, length: el });
        }
        itemLocs[itemId] = exts;
      }
    } else if (type === 'iinf') {
      var ver2 = u8[body];
      var bb = body + 4;
      bb += ver2 === 0 ? 2 : 4; // entry_count
      walkBoxes(u8, bb, end, function (t2, b2, e2) {
        if (t2 === 'infe') {
          var v = u8[b2];
          if (v >= 2) {
            var id = u16be(u8, b2 + 4);
            var itype = String.fromCharCode(u8[b2 + 8], u8[b2 + 9], u8[b2 + 10], u8[b2 + 11]);
            itemTypes[id] = itype;
          }
        }
      });
    } else if (type === 'iprp') {
      walkBoxes(u8, body, end, function (t2, b2, e2) {
        if (t2 === 'ipco') {
          walkBoxes(u8, b2, e2, function (t3, b3, e3) {
            ipcoProps.push({ type: t3, bytes: u8.slice(b3 - 8, e3) }); // 完整盒子
          });
        } else if (t2 === 'ipma') {
          var v = u8[b2];
          var flags = u32be(u8, b2) & 0xffffff;
          var entryCount = u32be(u8, b2 + 4);
          var q = b2 + 8;
          var idSize = (v === 1) ? 4 : 2;
          for (var i = 0; i < entryCount; i++) {
            var iid = idSize === 4 ? u32be(u8, q) : u16be(u8, q);
            q += idSize;
            var assocCount = u8[q]; q += 1;
            var list = [];
            for (var a = 0; a < assocCount; a++) {
              if (flags & 1) { // 每项 2 字节
                list.push(u16be(u8, q) & 0x7fff);
                q += 2;
              } else {
                list.push(u8[q] & 0x7f);
                q += 1;
              }
            }
            itemProps[iid] = list;
          }
        }
      });
    }
  });

  // 找 av01 item
  var av1ItemId = -1;
  for (var key in itemTypes) {
    if (itemTypes[key] === 'av01') { av1ItemId = parseInt(key, 10); break; }
  }
  if (av1ItemId < 0 || !itemLocs[av1ItemId]) throw new Error('未找到 AV1 数据项');

  // 拼接 extents
  var total = 0;
  itemLocs[av1ItemId].forEach(function (e) { total += e.length; });
  var av1 = new Uint8Array(total);
  var wpos = 0;
  itemLocs[av1ItemId].forEach(function (e) {
    av1.set(u8.subarray(e.offset, e.offset + e.length), wpos);
    wpos += e.length;
  });

  // 从属性中取 av1C / ispe / pixi / colr
  function pick(name) {
    var propIdxs = itemProps[av1ItemId] || [];
    for (var i = 0; i < propIdxs.length; i++) {
      var prop = ipcoProps[propIdxs[i] - 1];
      if (prop && prop.type === name) return prop.bytes;
    }
    return null;
  }
  var av1C = pick('av1C');
  if (!av1C) throw new Error('未找到 av1C 属性');
  var ispe = pick('ispe');
  var width = 0, height = 0;
  if (ispe) {
    width = u32be(ispe, 12);
    height = u32be(ispe, 16);
  }

  return {
    av1: av1,
    av1C: av1C,
    ispe: ispe,
    pixi: pick('pixi'),
    colr: pick('colr'),
    width: width,
    height: height,
    brands: brands
  };
}

/* ================================================================
 * 三、HEIF 序列封装器（动画 AVIF）
 * ================================================================ */

function str4(s) {
  return [s.charCodeAt(0), s.charCodeAt(1), s.charCodeAt(2), s.charCodeAt(3)];
}

function box(type, payload) {
  var out = new Uint8Array(8 + payload.length);
  out[0] = (payload.length + 8) >>> 24; out[1] = (payload.length + 8) >>> 16;
  out[2] = (payload.length + 8) >>> 8; out[3] = (payload.length + 8) & 0xff;
  out.set(str4(type), 4);
  out.set(payload, 8);
  return out;
}

function fullbox(type, version, flags, payload) {
  var p = new Uint8Array(4 + payload.length);
  p[0] = version; p[1] = (flags >> 16) & 0xff; p[2] = (flags >> 8) & 0xff; p[3] = flags & 0xff;
  p.set(payload, 4);
  return box(type, p);
}

function u32(v) { return [(v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]; }
function u16(v) { return [(v >>> 8) & 0xff, v & 0xff]; }
function concatBytes(arrs) {
  var total = 0;
  for (var i = 0; i < arrs.length; i++) total += arrs[i].length;
  var out = new Uint8Array(total);
  var o = 0;
  for (var j = 0; j < arrs.length; j++) { out.set(arrs[j], o); o += arrs[j].length; }
  return out;
}

var MATRIX_BYTES = concatBytes([
  u32(0x00010000), u32(0), u32(0),
  u32(0), u32(0x00010000), u32(0),
  u32(0), u32(0), u32(0x40000000)
]);

var CCST_BYTES = new Uint8Array([0, 0, 0, 0x10, 0x63, 0x63, 0x73, 0x74, 0, 0, 0, 0, 0x7c, 0, 0, 0]);

/**
 * 封装动画 AVIF。
 * @param {{width:number, height:number, av1C:Uint8Array,
 *          pixi?:Uint8Array|null, colr?:Uint8Array|null,
 *          frames:Array<{data:Uint8Array, durationMs:number}>}} opts
 * @returns {Uint8Array}
 */
export function muxAnimatedAvif(opts) {
  var width = opts.width, height = opts.height;
  var av1C = opts.av1C, pixi = opts.pixi || null, colr = opts.colr || null;
  var frames = opts.frames;
  if (!frames || frames.length < 2) throw new Error('动画至少需要 2 帧');

  var TIMESCALE = 1000;
  var totalDur = 0;
  var durations = frames.map(function (f) {
    var d = Math.max(1, Math.round(f.durationMs));
    totalDur += d;
    return d;
  });

  // ---- 先用占位偏移量构建，量出 meta/moov 尺寸，再填真实偏移 ----
  function build(mdatDataOffset) {
    // ---- meta（海报帧 = 第 1 帧样本）----
    var hdlr = fullbox('hdlr', 0, 0, concatBytes([
      u32(0), str4('pict'),
      u32(0), u32(0), u32(0), [0]
    ]));
    var pitm = fullbox('pitm', 0, 0, u16(1));
    var posterLen = frames[0].data.length;
    var ilocPayload = concatBytes([
      [0x44, 0x00],                    // off_sz=4 len_sz=4 base=0 idx=0
      u16(1),                          // item_count
      u16(1),                          // item_ID = 1
      u16(0),                          // data_reference_index
      u16(1),                          // extent_count
      u32(mdatDataOffset),             // extent_offset
      u32(posterLen)                   // extent_length
    ]);
    var iloc = fullbox('iloc', 0, 0, ilocPayload);
    var infe = fullbox('infe', 2, 0, concatBytes([
      u16(1),                          // item_ID
      u16(0),                          // item_protection_index
      str4('av01'),                    // item_type
      [0]                              // item_name（空）
    ]));
    var iinf = fullbox('iinf', 0, 0, concatBytes([u16(1), infe]));

    // 属性：ispe / pixi? / av1C / colr?
    var props = [];
    props.push(fullbox('ispe', 0, 0, concatBytes([u32(width), u32(height)])));
    if (pixi) props.push(pixi);
    props.push(av1C);
    if (colr) props.push(colr);
    var av1CIndex = 3; // av1C 在属性列表中的 1 基序号
    var ipco = box('ipco', concatBytes(props));
    var ipmaAssoc = [];
    for (var ai = 1; ai <= props.length; ai++) {
      ipmaAssoc.push(ai === av1CIndex ? (0x80 | ai) : ai); // av1C 标记 essential
    }
    var ipma = fullbox('ipma', 0, 0, concatBytes([
      u32(1), u16(1), [props.length]
    ].concat(ipmaAssoc.map(function (v) { return [v]; }))));
    var iprp = box('iprp', concatBytes([ipco, ipma]));
    var meta = fullbox('meta', 0, 0, concatBytes([hdlr, pitm, iloc, iinf, iprp]));

    // ---- moov ----
    var mvhd = fullbox('mvhd', 0, 0, concatBytes([
      u32(0), u32(0),                  // creation, modification
      u32(TIMESCALE), u32(totalDur),
      u32(0x00010000),                 // rate 1.0
      u16(0x0100),                     // volume 1.0
      u16(0),                          // reserved
      u32(0), u32(0),                  // reserved[2]
      MATRIX_BYTES,
      new Uint8Array(24),              // pre_defined
      u32(2)                           // next_track_ID
    ]));
    var tkhd = fullbox('tkhd', 0, 1, concatBytes([
      u32(0), u32(0),                  // creation, modification
      u32(1), u32(0),                  // track_ID, reserved
      u32(totalDur),                   // duration
      new Uint8Array(8),               // reserved
      u16(0), u16(0),                  // layer, alternate_group
      u16(0), u16(0),                  // volume, reserved
      MATRIX_BYTES,
      u32(width << 16), u32(height << 16)
    ]));
    var elst = fullbox('elst', 0, 0, concatBytes([
      u32(1),                          // entry_count
      u32(totalDur), u32(0),           // segment_duration, media_time
      u32(0x00010000)                  // rate 1.0
    ]));
    var edts = box('edts', elst);
    var mdhd = fullbox('mdhd', 0, 0, concatBytes([
      u32(0), u32(0),
      u32(TIMESCALE), u32(totalDur),
      u16(0x55c4),                     // language 'und'
      u16(0)
    ]));
    var mdiaHdlr = fullbox('hdlr', 0, 0, concatBytes([
      u32(0), str4('pict'), u32(0), u32(0), u32(0), [0]
    ]));
    var vmhd = fullbox('vmhd', 0, 1, concatBytes([u16(0), u16(0), u16(0), u16(0)]));
    var urlBox = fullbox('url ', 0, 1, new Uint8Array(0));
    var dref = fullbox('dref', 0, 0, concatBytes([u32(1), urlBox]));
    var dinf = box('dinf', dref);

    // av01 VisualSampleEntry
    var sampleEntry = concatBytes([
      new Uint8Array(6), u16(1),       // reserved, data_reference_index
      u16(0), u16(0), new Uint8Array(12), // pre_defined/reserved
      u16(width), u16(height),
      u32(0x00480000), u32(0x00480000),// 72dpi
      u32(0), u16(1),                  // reserved, frame_count
      new Uint8Array(32),              // compressorname（空）
      u16(0x0018), u16(0xffff),        // depth=24, pre_defined=-1
      av1C,
      colr || new Uint8Array(0),
      CCST_BYTES
    ]);
    var av01 = box('av01', sampleEntry);
    var stsd = fullbox('stsd', 0, 0, concatBytes([u32(1), av01]));

    // stts：合并连续相同时长
    var sttsEntries = [];
    for (var i = 0; i < durations.length; i++) {
      if (sttsEntries.length && sttsEntries[sttsEntries.length - 1].d === durations[i]) {
        sttsEntries[sttsEntries.length - 1].n++;
      } else {
        sttsEntries.push({ n: 1, d: durations[i] });
      }
    }
    var sttsPayload = [u32(sttsEntries.length)];
    sttsEntries.forEach(function (e) { sttsPayload.push(u32(e.n), u32(e.d)); });
    var stts = fullbox('stts', 0, 0, concatBytes(sttsPayload));

    var stsc = fullbox('stsc', 0, 0, concatBytes([
      u32(1), u32(1), u32(frames.length), u32(1)
    ]));
    var stszPayload = [u32(0), u32(frames.length)];
    frames.forEach(function (f) { stszPayload.push(u32(f.data.length)); });
    var stsz = fullbox('stsz', 0, 0, concatBytes(stszPayload));
    var stco = fullbox('stco', 0, 0, concatBytes([u32(1), u32(mdatDataOffset)]));
    // 全关键帧轨道：stss 列出全部样本
    var stssPayload = [u32(frames.length)];
    for (var s = 1; s <= frames.length; s++) stssPayload.push(u32(s));
    var stss = fullbox('stss', 0, 0, concatBytes(stssPayload));

    var stbl = box('stbl', concatBytes([stsd, stts, stsc, stsz, stco, stss]));
    var minf = box('minf', concatBytes([vmhd, dinf, stbl]));
    var mdia = box('mdia', concatBytes([mdhd, mdiaHdlr, minf]));
    var trak = box('trak', concatBytes([tkhd, edts, mdia]));
    var moov = box('moov', concatBytes([mvhd, trak]));

    // ---- ftyp ----
    var brands = opts.brands && opts.brands.length ? opts.brands.slice() : ['avif', 'mif1', 'miaf'];
    ['avis', 'msf1', 'iso8', 'avif', 'mif1', 'miaf'].forEach(function (b) {
      if (brands.indexOf(b) < 0) brands.push(b);
    });
    var ftypPayload = [str4('avis'), u32(0)];
    brands.forEach(function (b) { ftypPayload.push(str4(b)); });
    var ftyp = box('ftyp', concatBytes(ftypPayload));

    return { ftyp: ftyp, meta: meta, moov: moov };
  }

  // 第一次构建拿尺寸，第二次填真实 mdat 偏移
  var first = build(0);
  var mdatDataOffset = first.ftyp.length + first.meta.length + first.moov.length + 8;
  var parts = build(mdatDataOffset);

  var mdatLen = 0;
  frames.forEach(function (f) { mdatLen += f.data.length; });
  var mdat = box('mdat', concatBytes(frames.map(function (f) { return f.data; })));

  return concatBytes([parts.ftyp, parts.meta, parts.moov, mdat]);
}
