/**
 * 图片隐私脱敏器 — 纯前端解析 / 抹除 JPEG(PNG/HEIC) EXIF 元数据，图片不上传
 *
 * 支持：
 *   - JPEG：遍历 APP1 段，识别 "Exif\u0000\u0000" 头，解析 TIFF 元数据
 *   - PNG：遍历数据块，解析 eXIf 块内的 TIFF 元数据
 *   - HEIC/HEIF：解析 ISO-BMFF 结构（iinf/iloc/iref/mdat），定位 Exif item 提取 TIFF 块，
 *     剥离时物理挖除 mdat 中的 Exif 数据并重建 meta（保留原 HEIC 格式）
 *   - TIFF 解析：IFD0 / Exif IFD / GPS IFD 递归展开，常用 tag 中文名
 *   - 一键抹除：JPEG 丢弃含 EXIF 的 APP1 段，PNG 丢弃 eXIf 块，HEIC 重建为无 Exif 的 HEIC
 *   - 擦除前后文件大小对比 + 下载脱敏图片
 *
 * 类名前缀 exif-stripper-，与既有工具同构，资源见 /assets/tools/exif-stripper/
 */
(function () {
  'use strict';

  var ROOT = document.getElementById('exif-stripper-app');
  if (!ROOT) return;

  function $id(k) { return document.getElementById('exif-stripper-' + k); }
  var els = {
    drop: $id('drop'), file: $id('file'), info: $id('info'),
    actions: $id('actions'), strip: $id('strip'), download: $id('download'),
    reset: $id('reset'), status: $id('status'), stats: $id('stats'),
    statBefore: $id('stat-before'), statDiff: $id('stat-diff'),
    sec: $id('sec'), count: $id('count'), tbody: $id('tbody')
  };

  var state = {
    name: '', buffer: null, format: null,
    fields: null, stripped: null
  };

  var LANG = (document.documentElement.lang || 'zh').toLowerCase();
  LANG = (LANG.indexOf('en') !== -1) ? 'en' : 'zh';
  var I18N = {
    zh: {
      'tag-010e': '图像描述', 'tag-010f': '厂商', 'tag-0110': '型号', 'tag-0112': '方向',
      'tag-011a': 'X 分辨率', 'tag-011b': 'Y 分辨率', 'tag-0128': '分辨率单位', 'tag-0131': '软件',
      'tag-0132': '修改时间', 'tag-013b': '作者', 'tag-013e': '白点', 'tag-013f': '主色度',
      'tag-8298': '版权', 'tag-8769': 'Exif 子 IFD', 'tag-8825': 'GPS 信息',
      'tag-a002': '像素宽', 'tag-a003': '像素高',
      'tag-829a': '曝光时间', 'tag-829d': '光圈', 'tag-8827': 'ISO 感光度', 'tag-9000': 'Exif 版本',
      'tag-9003': '拍摄时间', 'tag-9004': '数字化时间', 'tag-9209': '闪光灯', 'tag-920a': '焦距',
      'tag-a001': '色彩空间',
      'tag-0000': '纬度参考', 'tag-0001': '纬度', 'tag-0002': '经度参考', 'tag-0003': '经度',
      'tag-0004': '海拔参考', 'tag-0005': '海拔', 'tag-0006': '时间', 'tag-0007': 'GPS 时间戳',
      'tag-001d': 'GPS 日期',
      'fmt-bmff': '视频或其他 ISO 媒体容器', 'grp-image': '图片', 'grp-coord': '坐标',
      'val-readfail': '（读取失败）', 'inf-mid': ' · 格式 ', 'inf-sep': ' · ',
      'st-before': '原始大小 → 脱敏后', 'st-diff-pre': '元数据约占&nbsp;', 'st-diff-b': ' B（',
      'st-diff-end': '%）',
      'err-iloc-ver-pre': '不支持的 iloc 版本（', 'err-iloc-ver-suf': '），当前仅支持 0/1/2',
      'err-heic-top': 'HEIC 顶层缺少 ftyp / meta / mdat，结构不支持',
      'err-heic-ftyp': 'HEIC 顶层结构不符合预期（ftyp 不在文件开头）',
      'err-heic-iinf': 'HEIC meta 缺少 iinf / iloc，结构不支持',
      'err-heic-big': 'HEIC 文件过大，暂不支持剥离',
      'err-read-pre': '读取文件失败：', 'err-read-msg': '无法读取该文件', 'err-read-cancel': '读取文件已取消',
      'err-fmt-pre': '不支持的图片格式：', 'err-fmt-suf': '。目前仅支持 JPEG / PNG / HEIC',
      'err-ident-pre': '无法识别文件格式或文件已损坏：',
      'err-ident-suf': '。请上传有效的 JPEG / PNG / HEIC 图片',
      'note-none': '未发现可展示的 EXIF 元数据', 'err-parse-pre': '解析图片元数据失败：',
      'f-unnamed': '未命名文件',
      'err-big-pre': '文件过大（', 'err-big-suf': '），请上传小于 128MB 的图片',
      'err-unsup-pre': '暂不支持此图片格式：', 'err-unsup-suf': '。目前仅支持 JPEG / PNG / HEIC',
      'note-heic-fail-pre': 'HEIC 抹除失败：', 'note-heic-none': '该 HEIC 未发现可抹除的 EXIF 元数据',
      'note-stripped': '已抹除全部元数据，可点击「下载脱敏图片」',
      'note-strip-fail-pre': '抹除失败：', 'note-downloaded': '已下载脱敏图片'
    },
    en: {
      'tag-010e': 'Image description', 'tag-010f': 'Make', 'tag-0110': 'Model', 'tag-0112': 'Orientation',
      'tag-011a': 'X resolution', 'tag-011b': 'Y resolution', 'tag-0128': 'Resolution unit', 'tag-0131': 'Software',
      'tag-0132': 'Date time', 'tag-013b': 'Artist', 'tag-013e': 'White point', 'tag-013f': 'Primary chromaticities',
      'tag-8298': 'Copyright', 'tag-8769': 'Exif sub IFD', 'tag-8825': 'GPS info',
      'tag-a002': 'Pixel width', 'tag-a003': 'Pixel height',
      'tag-829a': 'Exposure time', 'tag-829d': 'Aperture', 'tag-8827': 'ISO speed', 'tag-9000': 'Exif version',
      'tag-9003': 'Date time original', 'tag-9004': 'Date time digitized', 'tag-9209': 'Flash', 'tag-920a': 'Focal length',
      'tag-a001': 'Color space',
      'tag-0000': 'Latitude ref', 'tag-0001': 'Latitude', 'tag-0002': 'Longitude ref', 'tag-0003': 'Longitude',
      'tag-0004': 'Altitude ref', 'tag-0005': 'Altitude', 'tag-0006': 'Time', 'tag-0007': 'GPS timestamp',
      'tag-001d': 'GPS date',
      'fmt-bmff': 'Video or other ISO media container', 'grp-image': 'Image', 'grp-coord': 'Coordinates',
      'val-readfail': ' (read failed)', 'inf-mid': ' · format ', 'inf-sep': ' · ',
      'st-before': 'original size → sanitized', 'st-diff-pre': 'metadata ≈ ', 'st-diff-b': ' B (',
      'st-diff-end': '%)',
      'err-iloc-ver-pre': 'Unsupported iloc version (', 'err-iloc-ver-suf': '); only 0/1/2 are supported',
      'err-heic-top': 'HEIC is missing top-level ftyp / meta / mdat — unsupported structure',
      'err-heic-ftyp': 'Unexpected HEIC top-level layout (ftyp is not at the start of the file)',
      'err-heic-iinf': 'HEIC meta is missing iinf / iloc — unsupported structure',
      'err-heic-big': 'HEIC file is too large to strip for now',
      'err-read-pre': 'Failed to read the file: ', 'err-read-msg': 'Could not read the file', 'err-read-cancel': 'File reading cancelled',
      'err-fmt-pre': 'Unsupported image format: ', 'err-fmt-suf': ' — only JPEG / PNG / HEIC are supported',
      'err-ident-pre': 'Could not recognize the file format or the file is corrupted: ',
      'err-ident-suf': ' — please upload a valid JPEG / PNG / HEIC image',
      'note-none': 'No EXIF metadata to display found', 'err-parse-pre': 'Failed to parse image metadata: ',
      'f-unnamed': 'unnamed file',
      'err-big-pre': 'File too large (', 'err-big-suf': ') — please upload an image smaller than 128MB',
      'err-unsup-pre': 'This image format is not supported yet: ', 'err-unsup-suf': ' — only JPEG / PNG / HEIC are supported',
      'note-heic-fail-pre': 'HEIC strip failed: ', 'note-heic-none': 'No strippable EXIF metadata found in this HEIC',
      'note-stripped': 'All metadata stripped — click "Download cleaned image"',
      'note-strip-fail-pre': 'Stripping failed: ', 'note-downloaded': 'Sanitized image downloaded'
    }
  };
  function t(key) { var v = (I18N[LANG] || {})[key]; return v != null ? v : key; }

  /* ---------- 基础工具 ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function note(msg) {
    els.status.classList.remove('exif-stripper-status-err');
    els.status.textContent = msg;
    els.status.setAttribute('aria-hidden', 'false');
  }
  function blankStatus() {
    els.status.classList.remove('exif-stripper-status-err');
    els.status.textContent = '';
    els.status.setAttribute('aria-hidden', 'true');
  }
  // 醒目错误提示：红色高亮，并清理上一次解析成功残留的状态，避免误导
  function showError(msg) {
    els.status.classList.add('exif-stripper-status-err');
    els.status.textContent = msg;
    els.status.setAttribute('aria-hidden', 'false');
    els.info.hidden = true;
    els.actions.hidden = true;
    els.stats.hidden = true;
    els.sec.hidden = true;
    els.tbody.innerHTML = '';
    els.download.disabled = true;
  }
  function fmtBytes(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(2) + ' MB';
  }
  function isExifSeg(bytes, seg) {
    var d = seg.dataStart;
    return bytes[d] === 0x45 && bytes[d + 1] === 0x78 &&
      bytes[d + 2] === 0x69 && bytes[d + 3] === 0x66; // "Exif"
  }

  /* ---------- TIFF 解析 ---------- */
  var TIF_TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };

  var IFD0_NAMES = {
    0x010e: t('tag-010e'), 0x010f: t('tag-010f'), 0x0110: t('tag-0110'), 0x0112: t('tag-0112'),
    0x011a: t('tag-011a'), 0x011b: t('tag-011b'), 0x0128: t('tag-0128'), 0x0131: t('tag-0131'),
    0x0132: t('tag-0132'), 0x013b: t('tag-013b'), 0x013e: t('tag-013e'), 0x013f: t('tag-013f'),
    0x8298: t('tag-8298'), 0x8769: t('tag-8769'), 0x8825: t('tag-8825'),
    0xa002: t('tag-a002'), 0xa003: t('tag-a003')
  };
  var EXIF_NAMES = {
    0x829a: t('tag-829a'), 0x829d: t('tag-829d'), 0x8827: t('tag-8827'), 0x9000: t('tag-9000'),
    0x9003: t('tag-9003'), 0x9004: t('tag-9004'), 0x9209: t('tag-9209'), 0x920a: t('tag-920a'),
    0xa001: t('tag-a001'), 0xa002: t('tag-a002'), 0xa003: t('tag-a003')
  };
  var GPS_NAMES = {
    0x0000: t('tag-0000'), 0x0001: t('tag-0001'), 0x0002: t('tag-0002'), 0x0003: t('tag-0003'),
    0x0004: t('tag-0004'), 0x0005: t('tag-0005'), 0x0006: t('tag-0006'), 0x0007: t('tag-0007'),
    0x001d: t('tag-001d')
  };
  var STARTC = '0123456789';

  function readU16(dv, off, le) { return le ? dv.getUint16(off, true) : dv.getUint16(off, false); }
  function readU32(dv, off, le) { return le ? dv.getUint32(off, true) : dv.getUint32(off, false); }

  function ratToString(num, den) {
    if (!den) return String(num);
    var v = num / den;
    var s = v.toFixed(v && Math.abs(v) < 0.01 ? 6 : 4);
    return s.replace(/\.?0+$/, '').replace(/^0(?=[^\d]|$)/, '0');
  }

  function readTiffAsString(dv, off, count) {
    var bytes = [];
    for (var i = 0; i < count && i < 256 && off + i < dv.byteLength; i++) {
      var b = dv.getUint8(off + i);
      if (b === 0) break;
      bytes.push(b);
    }
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  }

  function readTiffValue(dv, base, type, count, rawOff, le, inlinePos) {
    // TIFF 规范：数据 ≤4 字节时值就地存放于 IFD entry 的 value 字段（inlinePos），
    // 否则 value 字段存的是相对 TIFF 基址的偏移。二者混用会导致误把就地 ASCII 当偏移读而越界。
    var sz = TIF_TYPE_SIZE[type] * count;
    var off = sz <= 4 ? inlinePos : base + rawOff;
    var i, parts, out;
    switch (type) {
      case 1: case 3: case 4: case 6: case 8: case 9:
        if (count === 1) {
          return TIF_TYPE_SIZE[type] === 2 ? readU16(dv, off, le) : readU32(dv, off, le);
        }
        return count;
      case 2: return readTiffAsString(dv, off, count);
      case 5: case 10: {
        if (count === 1) return ratToString(readU32(dv, off, le), readU32(dv, off + 4, le));
        parts = [];
        for (i = 0; i < count; i++) {
          parts.push(ratToString(readU32(dv, off + i * 8, le), readU32(dv, off + i * 8 + 4, le)));
        }
        return parts.join(', ');
      }
      case 7: {
        out = [];
        for (i = 0; i < count && off + i < dv.byteLength; i++) {
          out.push(STARTC[dv.getUint8(off + i) >> 4] + STARTC[dv.getUint8(off + i) & 15]);
        }
        return out.join('');
      }
      case 11: case 12: return count;
    }
    return '';
  }

  function parseIfd(meta, dv, tiffBase, ifdOff, le, group, names, depth) {
    depth = depth || 0;
    // 防畸形数据：IFD 越界或 entry 数异常时直接放弃，避免把数据区误当 IFD 递归解析
    if (ifdOff < tiffBase || ifdOff + 2 > dv.byteLength || depth > 6) return;
    var n = readU16(dv, ifdOff, le);
    if (n > 512 || ifdOff + 2 + n * 12 > dv.byteLength) return;
    var i, tag, type, count, rawOff, entry, sub;
    for (i = 0; i < n; i++) {
      var e = ifdOff + 2 + i * 12;
      tag = readU16(dv, e, le);
      type = readU16(dv, e + 2, le);
      count = readU32(dv, e + 4, le);
      rawOff = readU32(dv, e + 8, le);
      entry = {
        group: group, tag: tag,
        name: (names && names[tag]) || ('0x' + ('0000' + tag.toString(16)).slice(-4)),
        value: readTiffValue(dv, tiffBase, type, count, rawOff, le, e + 8)
      };
      meta.push(entry);
      if (tag === 0x8769) {
        sub = tiffBase + rawOff;
        if (sub > tiffBase && sub + 2 <= dv.byteLength) {
          parseIfd(meta, dv, tiffBase, sub, le, 'Exif', EXIF_NAMES, depth + 1);
        }
      } else if (tag === 0x8825) {
        sub = tiffBase + rawOff;
        if (sub > tiffBase && sub + 2 <= dv.byteLength) {
          parseIfd(meta, dv, tiffBase, sub, le, 'GPS', GPS_NAMES, depth + 1);
        }
      }
    }
  }

  function formatGpsCoordinate(dv, tiffBase, ifdOff, le, latOrLng) {
    // 从 GPS IFD 读取度/分/秒 RATIONAL 与参考方向
    var n = readU16(dv, ifdOff, le);
    var coord = null, ref = '';
    var i;
    for (i = 0; i < n; i++) {
      var e = ifdOff + 2 + i * 12;
      var tag = readU16(dv, e, le);
      var type = readU16(dv, e + 2, le);
      var count = readU32(dv, e + 4, le);
      var rawOff = readU32(dv, e + 8, le);
      if (tag === 0x0001 || tag === 0x0003) {
        if (count === 3 && tiffBase + rawOff + 24 <= dv.byteLength) {
          var d = readU32(dv, tiffBase + rawOff, le) / readU32(dv, tiffBase + rawOff + 4, le);
          var m = readU32(dv, tiffBase + rawOff + 8, le) / readU32(dv, tiffBase + rawOff + 12, le);
          var s = readU32(dv, tiffBase + rawOff + 16, le) / readU32(dv, tiffBase + rawOff + 20, le);
          coord = { d: d, m: m, s: s };
        }
      } else if (tag === 0x0000 || tag === 0x0002) {
        var refOff = TIF_TYPE_SIZE[type] * count <= 4 ? e + 8 : tiffBase + rawOff;
        ref = readTiffAsString(dv, refOff, count).trim();
      }
    }
    if (!coord) return null;
    function fmt3(n, pad) {
      var s = Math.round(n * 1000) / 1000;
      return String(s).replace(/\.?0+$/, '');
    }
    var axis = latOrLng === 0 ? (ref || 'N') : (ref || 'E');
    return axis + ' ' + coord.d + '\u00b0' + fmt3(coord.m) + "'" + fmt3(coord.s) + '"';
  }

  /* ---------- JPEG 段遍历 ---------- */
  function parseJpegSegments(bytes) {
    var segs = [];
    var i = 2, len = bytes.length;
    while (i + 4 <= len && bytes[i] === 0xFF) {
      var marker = bytes[i + 1];
      if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }
      var segLen = (bytes[i + 2] << 8) | bytes[i + 3];
      if (segLen < 2) break;
      segs.push({ marker: marker, start: i, dataStart: i + 4, rawLen: segLen });
      i += 2 + segLen;
    }
    segs.scanStart = i;
    return segs;
  }

  /* ---------- PNG 块遍历 ---------- */
  function parsePngChunks(bytes) {
    var chunks = [];
    var i = 8;
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    while (i + 12 <= bytes.byteLength) {
      var len = dv.getUint32(i, false);
      var t0 = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
      chunks.push({ type: t0, start: i, dataStart: i + 8, len: len });
      i += 12 + len;
    }
    return chunks;
  }

  function detectFormat(bytes) {
    if (bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8) return 'jpeg';
    if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 &&
      bytes[2] === 0x4E && bytes[3] === 0x47) return 'png';
    // ISO BMFF 容器：ftyp box（HEIC/HEIF / MOV / MP4 等）
    if (bytes.length >= 12 && bytes[4] === 0x66 && bytes[5] === 0x74 &&
      bytes[6] === 0x79 && bytes[7] === 0x70) {
      var brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
      if (/^(heic|heix|hevc|hevx|mif1|msf1|heif)$/i.test(brand)) return 'heic';
      return 'bmff';
    }
    if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 &&
      bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'webp';
    if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'gif';
    if (bytes.length >= 4 && ((bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2A && bytes[3] === 0x00) ||
      (bytes[0] === 0x4D && bytes[1] === 0x4D && bytes[2] === 0x00 && bytes[3] === 0x2A))) return 'tiff';
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4D) return 'bmp';
    return '';
  }

  var FORMAT_TIPS = {
    jpeg: 'JPEG', png: 'PNG', heic: 'HEIC/HEIF',
    webp: 'WebP', gif: 'GIF', tiff: 'TIFF', bmp: 'BMP', bmff: t('fmt-bmff')
  };

  /* ---------- 元数据提取 ---------- */
  function extractMeta(buffer, format) {
    var bytes = new Uint8Array(buffer);
    var dv = new DataView(buffer);
    var meta = [];
    if (format === 'jpeg') {
      var segs = parseJpegSegments(bytes);
      for (var i = 0; i < segs.length; i++) {
        var seg = segs[i];
        if (seg.marker === 0xE1 && isExifSeg(bytes, seg)) {
          parseTiff(meta, dv, seg.dataStart + 6);
        }
      }
    } else if (format === 'png') {
      var chunks = parsePngChunks(bytes);
      for (var j = 0; j < chunks.length; j++) {
        if (chunks[j].type === 'eXIf') {
          parseTiff(meta, dv, chunks[j].dataStart);
        }
      }
    } else if (format === 'heic') {
      extractHeicMeta(meta, dv, buffer);
    }
    return meta;
  }

  function parseTiff(meta, dv, tiffOff) {
    var le = dv.getUint16(tiffOff, false) === 0x4949;
    var ifd0 = tiffOff + readU32(dv, tiffOff + 4, le);
    parseIfd(meta, dv, tiffOff, ifd0, le, t('grp-image'), IFD0_NAMES);
    // GPS 坐标格式化（把纬度/经度 RATIONAL 转度分秒）
    if (ifd0 < tiffOff || ifd0 + 2 > dv.byteLength) return;
    var n = readU16(dv, ifd0, le);
    for (var i = 0; i < n; i++) {
      var e = ifd0 + 2 + i * 12;
      var tag = readU16(dv, e, le);
      if (tag === 0x8825) {
        var gpsOff = tiffOff + readU32(dv, e + 8, le);
        if (gpsOff > tiffOff && gpsOff + 2 <= dv.byteLength) {
          var lat = formatGpsCoordinate(dv, tiffOff, gpsOff, le, 0);
          var lng = formatGpsCoordinate(dv, tiffOff, gpsOff, le, 1);
          meta.push({ group: 'GPS', name: t('grp-coord'), value: (lat && lng) ? (lat + ' ' + lng) : (lat || lng || t('val-readfail')) });
        }
      }
    }
  }

  /* ---------- 抹除 ---------- */
  function stripJpeg(bytes) {
    var segs = parseJpegSegments(bytes);
    var out = [bytes[0], bytes[1]];
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i];
      if (seg.marker === 0xE1 && isExifSeg(bytes, seg)) continue;
      for (var j = seg.start; j < seg.start + 2 + seg.rawLen; j++) out.push(bytes[j]);
    }
    for (var k = segs.scanStart; k < bytes.length; k++) out.push(bytes[k]);
    return new Uint8Array(out).buffer;
  }

  function stripPng(bytes) {
    var chunks = parsePngChunks(bytes);
    var head = [];
    for (var i = 0; i < 8; i++) head.push(bytes[i]);
    var out = head;
    for (var j = 0; j < chunks.length; j++) {
      if (chunks[j].type === 'eXIf') continue;
      var c = chunks[j];
      var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      out.push((dv.getUint32(c.start, false) >>> 24) & 255, (dv.getUint32(c.start, false) >>> 16) & 255,
        (dv.getUint32(c.start, false) >>> 8) & 255, dv.getUint32(c.start, false) & 255);
      for (var q = c.dataStart - 4; q < c.dataStart + c.len; q++) out.push(bytes[q]);
      out.push(bytes[c.start + 8 + c.len], bytes[c.start + 9 + c.len], bytes[c.start + 10 + c.len], bytes[c.start + 11 + c.len]);
    }
    return new Uint8Array(out).buffer;
  }

  /* ---------- HEIC (ISO-BMFF) 解析与剥离 ---------- */
  // ISO 14496-12 box 遍历：支持 32/64 位 size；返回含绝对偏移与 header 长度
  function readBoxAt(bytes, dv, off) {
    var size = dv.getUint32(off, false);
    var hdr = 8;
    if (size === 1) {
      size = dv.getUint32(off + 8, false) * 4294967296 + dv.getUint32(off + 12, false);
      hdr = 16;
    } else if (size === 0) {
      size = bytes.byteLength - off;
    }
    return {
      type: String.fromCharCode(bytes[off + 4], bytes[off + 5], bytes[off + 6], bytes[off + 7]),
      off: off, size: size, hdr: hdr
    };
  }

  function walkBoxes(bytes, dv, start, end) {
    var boxes = [];
    var off = start;
    while (off + 8 <= end) {
      var b = readBoxAt(bytes, dv, off);
      if (b.size < b.hdr || off + b.size > end) break;
      boxes.push(b);
      off += b.size;
    }
    return boxes;
  }

  function push16(arr, v) { arr.push((v >>> 8) & 255, v & 255); }
  function push32(arr, v) { arr.push((v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255); }
  function pushInt(arr, v, size) {
    if (size === 1) arr.push(v & 255);
    else if (size === 2) push16(arr, v);
    else if (size === 4) push32(arr, v);
    else if (size === 8) { push32(arr, Math.floor(v / 4294967296)); push32(arr, v >>> 0); }
  }
  function intFrom(dv, off, size) {
    if (size === 1) return dv.getUint8(off);
    if (size === 2) return dv.getUint16(off, false);
    if (size === 4) return dv.getUint32(off, false);
    if (size === 8) return dv.getUint32(off, false) * 4294967296 + dv.getUint32(off + 4, false);
    return 0;
  }
  function concatU8(parts) {
    var len = 0, i;
    for (i = 0; i < parts.length; i++) len += parts[i].length;
    var out = new Uint8Array(len);
    var o = 0;
    for (i = 0; i < parts.length; i++) { out.set(parts[i], o); o += parts[i].length; }
    return out;
  }

  // Exif item 数据常以 4 字节偏移头或 "Exif" 签名开头，实际 TIFF（II*/MM）在头部之后
  function findTiffOffset(bytes, absOff, len) {
    var limit = Math.min(len, 128);
    var i;
    for (i = 0; i + 4 <= limit; i++) {
      var b0 = bytes[absOff + i], b1 = bytes[absOff + i + 1], b2 = bytes[absOff + i + 2], b3 = bytes[absOff + i + 3];
      if ((b0 === 0x49 && b1 === 0x49 && b2 === 0x2A && b3 === 0x00) ||
        (b0 === 0x4D && b1 === 0x4D && b2 === 0x00 && b3 === 0x2A)) return absOff + i;
    }
    return -1;
  }

  // 解析 iinf 内 infe 列表，返回 [{id, type, boxOff, boxSize}]
  function parseIinfItems(bytes, dv, iinf) {
    var p = iinf.off + iinf.hdr;
    var ver = dv.getUint8(p);
    p += 4; // fullbox
    var count = ver >= 1 ? dv.getUint32(p, false) : dv.getUint16(p, false);
    p += ver >= 1 ? 4 : 2;
    var items = [];
    var i;
    for (i = 0; i < count && p + 8 <= iinf.off + iinf.size; i++) {
      var infe = readBoxAt(bytes, dv, p);
      if (infe.size < infe.hdr || p + infe.size > iinf.off + iinf.size) break;
      var ip = infe.off + infe.hdr;
      var iver = dv.getUint8(ip);
      ip += 4;
      // item_ID 宽度：version 0/1/2 均为 16 位，仅 version 3 起为 32 位
      var id = iver >= 3 ? dv.getUint32(ip, false) : dv.getUint16(ip, false);
      ip += iver >= 3 ? 4 : 2;
      ip += 2; // item_protection_index
      if (ip + 4 <= infe.off + infe.size) {
        var type = String.fromCharCode(bytes[ip], bytes[ip + 1], bytes[ip + 2], bytes[ip + 3]);
        items.push({ id: id, type: type, boxOff: p, boxSize: infe.size });
      }
      p += infe.size;
    }
    return items;
  }

  // 解析 iloc，返回 {ver, offsetSize, lengthSize, baseOffsetSize, indexSize, entries}
  function parseIloc(bytes, dv, iloc) {
    var p = iloc.off + iloc.hdr;
    var ver = dv.getUint8(p);
    p += 4; // fullbox
    if (ver >= 3) throw new Error(t('err-iloc-ver-pre') + ver + t('err-iloc-ver-suf'));
    var sizes1 = dv.getUint8(p);
    var sizes2 = dv.getUint8(p + 1);
    p += 2;
    var offsetSize = sizes1 >> 4, lengthSize = sizes1 & 15;
    var baseOffsetSize = sizes2 >> 4, indexSize = sizes2 & 15;
    var idBytes = ver >= 3 ? 4 : 2; // item_ID 仅 v3 起 32 位
    var count = ver >= 2 ? dv.getUint32(p, false) : dv.getUint16(p, false);
    p += ver >= 2 ? 4 : 2;
    // 苹果 HEIC iloc(v1) header 常把 base_offset_size 写为 0，但每个 entry 实际固定多 2 字节 base_offset
    var baseSize = baseOffsetSize > 0 ? baseOffsetSize : 2;
    var entries = [];
    var i, j;
    for (i = 0; i < count; i++) {
      var id = idBytes === 2 ? dv.getUint16(p, false) : dv.getUint32(p, false);
      p += idBytes;
      var dref = dv.getUint16(p, false);
      p += 2; // data_reference_index
      var base = baseSize ? intFrom(dv, p, baseSize) : 0;
      p += baseSize;
      var extCount = dv.getUint16(p, false);
      p += 2;
      var exts = [];
      for (j = 0; j < extCount; j++) {
        if (indexSize) p += indexSize;
        var eo = offsetSize ? intFrom(dv, p, offsetSize) : 0;
        p += offsetSize;
        var el = lengthSize ? intFrom(dv, p, lengthSize) : 0;
        p += lengthSize;
        exts.push([base + eo, el]);
      }
      entries.push({ id: id, dref: dref, base: base, exts: exts });
    }
    return { ver: ver, offsetSize: offsetSize, lengthSize: lengthSize, baseOffsetSize: baseOffsetSize, indexSize: indexSize, entries: entries };
  }

  // 重建 iloc（保留原始 ver/sizes，重写条目与偏移）
  // 重建 iloc：保留原始头部(含 ver/sizes 字节)逐字节不动——Apple 解码器要求 header 原样，
  // 仅重写 entry_count 与各条目(含 extent 偏移重算)
  function buildIloc(ilocInfo, entries, rawHead) {
    var ver = ilocInfo.ver;
    var idBytes = ver >= 3 ? 4 : 2;
    var baseSize = ilocInfo.baseOffsetSize > 0 ? ilocInfo.baseOffsetSize : 2;
    // rawHead 为原始 iloc 的 box 头 + fullbox + sizes（共 14 字节），原样复用
    var head = Array.prototype.slice.call(rawHead);
    var body = [];
    if (ver >= 2) push32(body, entries.length); else push16(body, entries.length);
    var i, j;
    for (i = 0; i < entries.length; i++) {
      var e = entries[i];
      if (idBytes === 2) push16(body, e.id); else push32(body, e.id);
      push16(body, typeof e.dref === 'number' ? e.dref : 0); // data_reference_index（保留原值，idat 引用必须为 1）
      if (baseSize) pushInt(body, e.base, baseSize);
      push16(body, e.exts.length);
      for (j = 0; j < e.exts.length; j++) {
        if (ilocInfo.indexSize) pushInt(body, 0, ilocInfo.indexSize);
        pushInt(body, e.exts[j][0], ilocInfo.offsetSize);
        pushInt(body, e.exts[j][1], ilocInfo.lengthSize);
      }
    }
    var arr = head.concat(body);
    var sz = arr.length;
    arr[0] = (sz >>> 24) & 255; arr[1] = (sz >>> 16) & 255; arr[2] = (sz >>> 8) & 255; arr[3] = sz & 255;
    return new Uint8Array(arr);
  }

  // 重建 iinf：保留的 infe 原样复用，仅重写 entry_count
  function buildIinf(bytes, iinf, items) {
    var head = bytes.subarray(iinf.off, iinf.off + iinf.hdr + 4);
    var parts = [new Uint8Array(head)];
    var cnt = new Uint8Array(2);
    cnt[0] = (items.length >>> 8) & 255; cnt[1] = items.length & 255;
    parts.push(cnt);
    var i;
    for (i = 0; i < items.length; i++) {
      parts.push(bytes.subarray(items[i].boxOff, items[i].boxOff + items[i].boxSize));
    }
    var out = concatU8(parts);
    var sz = out.length;
    out[0] = (sz >>> 24) & 255; out[1] = (sz >>> 16) & 255; out[2] = (sz >>> 8) & 255; out[3] = sz & 255;
    return out;
  }

  // iref 引用子 box 是否涉及 Exif：结构化解析 from_item_ID / to_item_ID 列表，
  // 仅当 from 或任一 to 等于 Exif 的 item_ID 时才视为命中（避免字节流扫描误删 dimg/cdsc）
  function refTargetsExif(bytes, dv, child, exifId) {
    var iv = dv.getUint8(child.off + child.hdr); // reference box version
    var idS = iv === 1 ? 4 : 2;
    var end = child.off + child.size;
    var p = child.off + child.hdr + 4;
    var from, cnt, j;
    if (idS === 2) {
      from = dv.getUint16(p, false); p += 2;
      cnt = dv.getUint16(p, false); p += 2;
    } else {
      from = dv.getUint32(p, false); p += 4;
      cnt = dv.getUint16(p, false); p += 2;
    }
    if (from === exifId) return true;
    for (j = 0; j < cnt; j++) {
      var to = idS === 2 ? dv.getUint16(p, false) : dv.getUint32(p, false);
      p += idS;
      if (to === exifId) return true;
    }
    return false;
  }

  // 重建 iref：删掉引用 Exif 的子 box，其余原样
  function buildIref(bytes, dv, iref, ordinal, exifId) {
    var head = bytes.subarray(iref.off, iref.off + iref.hdr + 4);
    var refs = walkBoxes(bytes, dv, iref.off + iref.hdr + 4, iref.off + iref.size);
    var parts = [new Uint8Array(head)];
    var i;
    for (i = 0; i < refs.length; i++) {
      if (refTargetsExif(bytes, dv, refs[i], exifId)) continue;
      parts.push(bytes.subarray(refs[i].off, refs[i].off + refs[i].size));
    }
    var out = concatU8(parts);
    var sz = out.length;
    out[0] = (sz >>> 24) & 255; out[1] = (sz >>> 16) & 255; out[2] = (sz >>> 8) & 255; out[3] = sz & 255;
    return out;
  }

  // HEIC 元数据提取：定位 Exif item，取 TIFF 块复用 parseTiff（group 记为 'Exif'）
  function extractHeicMeta(meta, dv, buffer) {
    var bytes = new Uint8Array(buffer);
    var tops = walkBoxes(bytes, dv, 0, bytes.byteLength);
    var i, m;
    var metaBox = null;
    for (i = 0; i < tops.length; i++) if (tops[i].type === 'meta') { metaBox = tops[i]; break; }
    if (!metaBox) return;
    var children = walkBoxes(bytes, dv, metaBox.off + metaBox.hdr + 4, metaBox.off + metaBox.size);
    var iinf = null, iloc = null;
    for (i = 0; i < children.length; i++) {
      if (children[i].type === 'iinf') iinf = children[i];
      else if (children[i].type === 'iloc') iloc = children[i];
    }
    if (!iinf || !iloc) return;
    var items = parseIinfItems(bytes, dv, iinf);
    var exifItem = null;
    for (i = 0; i < items.length; i++) if (items[i].type === 'Exif') { exifItem = items[i]; break; }
    if (!exifItem) return;
    var ilocInfo = parseIloc(bytes, dv, iloc);
    var exifEntry = null;
    for (i = 0; i < ilocInfo.entries.length; i++)
      if (ilocInfo.entries[i].id === exifItem.id) { exifEntry = ilocInfo.entries[i]; break; }
    if (!exifEntry) return;
    for (i = 0; i < exifEntry.exts.length; i++) {
      var abs = exifEntry.exts[i][0], elen = exifEntry.exts[i][1];
      if (abs + elen > bytes.byteLength) continue;
      var tiffOff = findTiffOffset(bytes, abs, elen);
      if (tiffOff > 0) {
        var before = meta.length;
        parseTiff(meta, dv, tiffOff);
        for (m = before; m < meta.length; m++) if (meta[m].group === t('grp-image')) meta[m].group = 'Exif';
      }
    }
  }

  // HEIC 剥离：删 Exif infe/iloc 条目/iref 引用，物理挖除 mdat 中 Exif 数据，
  // 重算保留 extent 偏移并重建 meta/mdat。返回新 ArrayBuffer；无 Exif 时返回 null。
  function stripHeic(buffer) {
    // 兼容传入 Uint8Array 或 ArrayBuffer（浏览器上传路径传 Uint8Array，内部测试传 ArrayBuffer）
    var bytes = buffer instanceof Uint8Array ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength) : new Uint8Array(buffer);
    var dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    var tops = walkBoxes(bytes, dv, 0, bytes.byteLength);
    var i, j, k;
    var ftyp = null, meta = null, mdat = null;
    for (i = 0; i < tops.length; i++) {
      if (tops[i].type === 'meta' && !meta) meta = tops[i];
      else if (tops[i].type === 'mdat' && !mdat) mdat = tops[i];
      else if (tops[i].type === 'ftyp' && !ftyp) ftyp = tops[i];
    }
    if (!ftyp || !meta || !mdat) throw new Error(t('err-heic-top'));
    if (ftyp.off !== 0) throw new Error(t('err-heic-ftyp'));
    var children = walkBoxes(bytes, dv, meta.off + meta.hdr + 4, meta.off + meta.size);
    var iinf = null, iloc = null, iref = null;
    for (i = 0; i < children.length; i++) {
      if (children[i].type === 'iinf') iinf = children[i];
      else if (children[i].type === 'iloc') iloc = children[i];
      else if (children[i].type === 'iref') iref = children[i];
    }
    if (!iinf || !iloc) throw new Error(t('err-heic-iinf'));
    var items = parseIinfItems(bytes, dv, iinf);
    var exifItem = null, exifOrdinal = 0;
    for (i = 0; i < items.length; i++)
      if (items[i].type === 'Exif') { exifItem = items[i]; exifOrdinal = i + 1; break; }
    if (!exifItem) return null; // 无 Exif，无需剥离
    var ilocInfo = parseIloc(bytes, dv, iloc);
    var exifEntry = null;
    for (i = 0; i < ilocInfo.entries.length; i++)
      if (ilocInfo.entries[i].id === exifItem.id) { exifEntry = ilocInfo.entries[i]; break; }
    if (!exifEntry) return null;
    // 1) mdat 内需挖除的绝对区间
    var payStart = mdat.off + mdat.hdr;
    var payEnd = mdat.off + mdat.size;
    var carve = [];
    for (i = 0; i < exifEntry.exts.length; i++)
      carve.push([exifEntry.exts[i][0], exifEntry.exts[i][0] + exifEntry.exts[i][1]]);
    carve.sort(function (a, b) { return a[0] - b[0]; });
    // 2) 物理挖除 mdat payload 中的 Exif 区间
    var newPayload = new Uint8Array(payEnd - payStart);
    var wp = 0, cur = payStart;
    for (i = 0; i < carve.length; i++) {
      var cs = carve[i][0], ce = carve[i][1];
      if (cs >= payStart && cs <= payEnd && cs <= ce) {
        var segEnd = Math.min(cs, payEnd);
        if (cur < segEnd) { newPayload.set(bytes.subarray(cur, segEnd), wp); wp += segEnd - cur; }
        cur = Math.max(cur, Math.min(ce, payEnd));
      }
    }
    if (cur < payEnd) { newPayload.set(bytes.subarray(cur, payEnd), wp); wp += payEnd - cur; }
    newPayload = newPayload.subarray(0, wp);

    // 3) 重建 iinf / iref（删除 Exif 相关）
    var keptItems = [];
    for (i = 0; i < items.length; i++) if (items[i] !== exifItem) keptItems.push(items[i]);
    var newIinf = buildIinf(bytes, iinf, keptItems);
    var newIref = iref ? buildIref(bytes, dv, iref, exifOrdinal, exifItem.id) : null;
    // 4) iloc 保留条目（排除 Exif）
    var keptEntries = [];
    for (i = 0; i < ilocInfo.entries.length; i++)
      if (ilocInfo.entries[i].id !== exifItem.id) keptEntries.push(ilocInfo.entries[i]);
    // 5) 先占位构建 iloc 得长度，再推算新绝对偏移
    // rawIlocHead：原始 iloc 的 box头8 + fullbox4 + sizes2（Apple 解码器要求 header 逐字节原样）
    var rawIlocHead = bytes.subarray(iloc.off, iloc.off + iloc.hdr + 2 + 4);
    var dummyIloc = buildIloc(ilocInfo, keptEntries, rawIlocHead);
    var metaHead = bytes.subarray(meta.off, meta.off + meta.hdr + 4); // header(8)+fullbox(4)
    var baseParts = [new Uint8Array(metaHead)];
    for (i = 0; i < children.length; i++) {
      var t = children[i].type;
      if (t === 'iinf') baseParts.push(newIinf);
      else if (t === 'iref') { if (newIref) baseParts.push(newIref); }
      else if (t === 'iloc') continue;
      else baseParts.push(bytes.subarray(children[i].off, children[i].off + children[i].size));
    }
    var metaBase = concatU8(baseParts).length;
    var metaTotal = metaBase + dummyIloc.length;
    var shiftMeta = metaTotal - meta.size;
    var mdatPayloadAbsNew = ftyp.size + metaTotal + 8; // 8 = 新的 32 位 mdat 头
    function carvedShiftBefore(absOff) {
      var s = 0, q;
      for (q = 0; q < carve.length; q++) {
        if (absOff >= carve[q][1]) s += carve[q][1] - carve[q][0];
        else break;
      }
      return s;
    }
    var newKept = [];
    for (i = 0; i < keptEntries.length; i++) {
      var e = keptEntries[i];
      var nx = [];
      for (j = 0; j < e.exts.length; j++) {
        var absOff = e.exts[j][0], el = e.exts[j][1];
        var inCarve = false, q;
        for (q = 0; q < carve.length; q++) {
          if (absOff >= carve[q][0] && absOff + el <= carve[q][1]) { inCarve = true; break; }
        }
        if (inCarve) continue;
        var newAbs;
        if (absOff >= payStart && absOff < payEnd) {
          newAbs = mdatPayloadAbsNew + (absOff - payStart) - carvedShiftBefore(absOff);
        } else if (absOff >= meta.off && absOff < meta.off + meta.size) {
          newAbs = absOff + shiftMeta; // 位于 meta 内部（如 idat），随 meta 平移
        } else {
          newAbs = absOff;
        }
        nx.push([newAbs - e.base, el]);
      }
      newKept.push({ id: e.id, dref: e.dref, base: e.base, exts: nx });
    }
    var newIloc = buildIloc(ilocInfo, newKept, rawIlocHead);
    // 6) 组装 meta（iloc 插回原位置）
    var finalParts = [new Uint8Array(metaHead)];
    for (i = 0; i < children.length; i++) {
      var tt = children[i].type;
      if (tt === 'iinf') finalParts.push(newIinf);
      else if (tt === 'iref') { if (newIref) finalParts.push(newIref); }
      else if (tt === 'iloc') finalParts.push(newIloc);
      else finalParts.push(bytes.subarray(children[i].off, children[i].off + children[i].size));
    }
    var newMeta = concatU8(finalParts);
    var msz = newMeta.length;
    newMeta[0] = (msz >>> 24) & 255; newMeta[1] = (msz >>> 16) & 255;
    newMeta[2] = (msz >>> 8) & 255; newMeta[3] = msz & 255;
    // 7) 重建 mdat（32 位头）
    var newMdatSize = 8 + newPayload.length;
    if (newMdatSize > 0xFFFFFFFF) throw new Error(t('err-heic-big'));
    var mdatHead = new Uint8Array(8);
    mdatHead[0] = (newMdatSize >>> 24) & 255; mdatHead[1] = (newMdatSize >>> 16) & 255;
    mdatHead[2] = (newMdatSize >>> 8) & 255; mdatHead[3] = newMdatSize & 255;
    mdatHead.set([109, 100, 97, 116], 4); // 'mdat'
    var result = concatU8([bytes.subarray(ftyp.off, ftyp.off + ftyp.size), newMeta, mdatHead, newPayload]);
    return result.buffer;
  }

  /* ---------- 渲染 ---------- */
  function renderInfo() {
    var fmtName = { jpeg: 'JPEG', png: 'PNG', heic: 'HEIC/HEIF' }[state.format] || state.format;
    els.info.hidden = false;
    els.info.textContent = state.name + t('inf-mid') + fmtName + t('inf-sep') + fmtBytes(state.buffer.byteLength);
  }

  function renderFields() {
    var fields = state.fields;
    els.sec.hidden = fields.length === 0;
    els.count.textContent = fields.length;
    els.tbody.innerHTML = fields.map(function (f) {
      var groupCls = f.group === 'GPS' ? ' exif-stripper-td-gps' : (f.group === 'Exif' ? ' exif-stripper-td-exif' : '');
      return '<tr><td class="exif-stripper-td-group' + groupCls + '">' + esc(f.group) + '</td>' +
        '<td>' + esc(f.name) + '</td><td class="exif-stripper-td-val">' + esc(f.value) + '</td></tr>';
    }).join('');
  }

  function renderStats() {
    var before = state.buffer.byteLength;
    var after = state.stripped.byteLength;
    els.stats.hidden = false;
    var delta = before - after;
    var pct = before ? (delta / before * 100) : 0;
    els.statBefore.innerHTML = '<b>' + fmtBytes(before) + '</b><span>&nbsp;' + t('st-before') + '&nbsp;</span><b>' + fmtBytes(after) + '</b>';
    els.statDiff.innerHTML = '<span>' + t('st-diff-pre') + '</span><b>' + delta + t('st-diff-b') + pct.toFixed(1) + t('st-diff-end') + '</b>';
  }

  /* ---------- 事件 ---------- */
  function loadBuffer(file) {
    var reader = new FileReader();
    reader.onerror = function () {
      showError(t('err-read-pre') + (reader.error && reader.error.message ? reader.error.message : t('err-read-msg')) + '(' + (file.name || '') + ')');
    };
    reader.onabort = function () {
      showError(t('err-read-cancel'));
    };
    reader.onload = function () {
      var buffer = reader.result;
      var bytes = new Uint8Array(buffer);
      var format = detectFormat(bytes);
      if (format !== 'jpeg' && format !== 'png' && format !== 'heic') {
        if (format) {
          showError(t('err-fmt-pre') + (file.name || '') + '(' + (FORMAT_TIPS[format] || format) + ')' + t('err-fmt-suf'));
        } else {
          showError(t('err-ident-pre') + (file.name || '') + t('err-ident-suf'));
        }
        return;
      }
      try {
        state.name = file.name;
        state.buffer = buffer;
        state.format = format;
        state.stripped = null;
        state.fields = extractMeta(buffer, format);
        renderInfo();
        renderFields();
        els.actions.hidden = false;
        els.download.disabled = true;
        els.stats.hidden = true;
        if (!state.fields.length) note(t('note-none'));
        else blankStatus();
      } catch (e) {
        showError(t('err-parse-pre') + (e && e.message || e) + '(' + (file.name || '') + ')');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function pickFile(f) {
    if (!f) return;
    var name = f.name || t('f-unnamed');
    if (f.size > 128 * 1024 * 1024) {
      showError(t('err-big-pre') + fmtBytes(f.size) + t('err-big-suf'));
      return;
    }
    var t = (f.type || '').toLowerCase();
    var mimeOk = /image\/(jpeg|jpg|png|pipeg|heic|heif)$/.test(t);
    var extOk = /\.(jpe?g|png|heic|heif)$/i.test(name);
    var knownUnsupported = (t.indexOf('image/') === 0 && !mimeOk && !extOk);
    if (knownUnsupported) {
      showError(t('err-unsup-pre') + (t || name) + t('err-unsup-suf'));
      return;
    }
    // MIME 或扩展名任一明确命中 JPEG/PNG/HEIC，直接读取
    if (mimeOk || extOk) { loadBuffer(f); return; }
    // MIME 与扩展名都不明确（无类型/无扩展名），交给魔数判定，load 内部兜底提示
    loadBuffer(f);
  }

  els.drop.addEventListener('click', function () { els.file.click(); });
  els.drop.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.file.click(); }
  });
  ['dragenter', 'dragover'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      els.drop.classList.add('exif-stripper-drop-active');
    });
  });
  ['dragleave', 'drop'].forEach(function (ev) {
    els.drop.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
      els.drop.classList.remove('exif-stripper-drop-active');
    });
  });
  // 阻止文件被拖出 drop 区时浏览器直接打开图片覆盖页面
  ['dragover', 'drop'].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      e.preventDefault(); e.stopPropagation();
    });
  });
  els.drop.addEventListener('drop', function (e) {
    pickFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  els.file.addEventListener('change', function () {
    pickFile(els.file.files && els.file.files[0]);
    els.file.value = '';
  });

  els.strip.addEventListener('click', function () {
    if (!state.buffer) return;
    try {
      var bytes = new Uint8Array(state.buffer);
      if (state.format === 'heic') {
        var heicResult;
        try {
          heicResult = stripHeic(bytes);
        } catch (e2) {
          note(t('note-heic-fail-pre') + (e2 && e2.stack || e2));
          return;
        }
        if (!heicResult) { note(t('note-heic-none')); return; }
        state.stripped = heicResult;
      } else {
        state.stripped = state.format === 'jpeg' ? stripJpeg(bytes) : stripPng(bytes);
      }
      renderStats();
      els.download.disabled = false;
      note(t('note-stripped'));
    } catch (e) {
      note(t('note-strip-fail-pre') + (e && e.message || e));
    }
  });

  els.download.addEventListener('click', function () {
    if (!state.stripped) return;
    var mime = state.format === 'jpeg' ? 'image/jpeg' : (state.format === 'png' ? 'image/png' : 'image/heic');
    var ext = state.format === 'jpeg' ? 'jpg' : (state.format === 'png' ? 'png' : 'heic');
    var blob = new Blob([state.stripped], { type: mime });
    var url = URL.createObjectURL(blob);
    var base = state.name.replace(/\.[^.]+$/, '') || 'image';
    var a = document.createElement('a');
    a.href = url; a.download = base + '-stripped.' + ext;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    note(t('note-downloaded'));
  });

  els.reset.addEventListener('click', function () {
    els.file.value = '';
    state.buffer = null; state.stripped = null; state.fields = null;
    els.info.hidden = true; els.actions.hidden = true; els.stats.hidden = true; els.sec.hidden = true;
    els.download.disabled = true; els.tbody.innerHTML = '';
    blankStatus();
  });
})();
