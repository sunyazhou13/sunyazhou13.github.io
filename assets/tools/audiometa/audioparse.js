// 音频元数据解析（纯前端、零依赖、零上传）
// 直接从字节读取：格式靠魔数、技术参数靠各容器头、标签靠各容器的 tag 区（ID3v2/v1、Vorbis comment、
// APEv2、iTunes ilst、ASF、RIFF-INFO）、封面靠各容器的图片块（APIC / PICTURE / covr / WM/Picture）。
// 不依赖浏览器解码，故 DSF/DFF/SACD-ISO 等也能读出参数与标签。本模块不碰 window/document，可 Node 单测。

// ── 字节工具（大端为主，个别容器小端另行注明）──
function u8(b, o) { return b[o] || 0; }
function u16be(b, o) { return ((b[o] || 0) << 8) | (b[o + 1] || 0); }
function u24be(b, o) { return ((b[o] || 0) << 16) | ((b[o + 1] || 0) << 8) | (b[o + 2] || 0); }
function u32be(b, o) { return (((b[o] || 0) << 24) | ((b[o + 1] || 0) << 16) | ((b[o + 2] || 0) << 8) | (b[o + 3] || 0)) >>> 0; }
function u16le(b, o) { return (b[o] || 0) | ((b[o + 1] || 0) << 8); }
function u32le(b, o) { return ((b[o] || 0) | ((b[o + 1] || 0) << 8) | ((b[o + 2] || 0) << 16) | ((b[o + 3] || 0) * 0x1000000)) >>> 0; }
function u64be(b, o) { return u32be(b, o) * 4294967296 + u32be(b, o + 4); }
function u64le(b, o) { return u32le(b, o) + u32le(b, o + 4) * 4294967296; }
function syncsafe(b, o) { return ((b[o] & 0x7f) << 21) | ((b[o + 1] & 0x7f) << 14) | ((b[o + 2] & 0x7f) << 7) | (b[o + 3] & 0x7f); }
function sz(b, o, n) { let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(b[o + i] || 0); return s; }
function ascii(b, o, n) { let s = ''; for (let i = 0; i < n; i++) { const c = b[o + i]; if (c === 0) break; s += (c >= 0x20 && c <= 0x7e) ? String.fromCharCode(c) : ' '; } return s.trim(); }
function sub(b, o, n) { return b.subarray(o, Math.min(o + n, b.length)); }
function hex(b, o, n) { let s = ''; for (let i = 0; i < n; i++) s += (b[o + i] || 0).toString(16).padStart(2, '0'); return s; }
function copyBytes(b, o, n) { const out = new Uint8Array(n); for (let i = 0; i < n && o + i < b.length; i++) out[i] = b[o + i]; return out; }

// 解码器（按 ID3/Vorbis 的编码标记）
function looksUtf8(bytes) {
  let i = 0, multi = false;
  while (i < bytes.length) {
    const c = bytes[i];
    if (c === 0) break;
    if (c < 0x80) { i++; continue; }
    multi = true;
    if ((c & 0xE0) === 0xC0) { if ((bytes[i + 1] & 0xC0) !== 0x80) return false; i += 2; }
    else if ((c & 0xF0) === 0xE0) { if ((bytes[i + 1] & 0xC0) !== 0x80 || (bytes[i + 2] & 0xC0) !== 0x80) return false; i += 3; }
    else if ((c & 0xF8) === 0xF0) { if ((bytes[i + 1] & 0xC0) !== 0x80 || (bytes[i + 2] & 0xC0) !== 0x80 || (bytes[i + 3] & 0xC0) !== 0x80) return false; i += 4; }
    else return false;
  }
  return multi;
}
function decodeText(bytes, enc) {
  try {
    // 标称 ISO-8859-1，但不少写入器（含 ffmpeg）实际写的是 UTF-8：先探测
    if (enc === 0) { if (looksUtf8(bytes)) { try { return new TextDecoder('utf-8').decode(bytes); } catch (e) { /* fallthrough */ } } return asciiAll(bytes); }
    if (enc === 3) return new TextDecoder('utf-8').decode(bytes);
    if (enc === 1) return new TextDecoder('utf-16').decode(bytes);      // UTF-16 + BOM
    if (enc === 2) return new TextDecoder('utf-16be').decode(bytes);    // UTF-16BE
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) { try { return asciiAll(bytes); } catch (e2) { return ''; } }
}
function asciiAll(bytes) { let s = ''; for (let i = 0; i < bytes.length; i++) { const c = bytes[i]; if (c === 0) break; s += String.fromCharCode(c); } return s.replace(/\0+$/, '').trim(); }
function trimNul(s) { return String(s || '').replace(/\0+$/g, '').trim(); }
// 在 [start,end) 里读到第一个 0x00（或双 0x00）为止，返回 [字符串, 结束偏移]
function readCString(bytes, start, end, wide) {
  let i = start;
  if (wide) { while (i + 1 < end && !(bytes[i] === 0 && bytes[i + 1] === 0)) i += 2; return [decodeText(bytes.subarray(start, i), 1), i + 2]; }
  while (i < end && bytes[i] !== 0) i++;
  return [String.fromCharCode(...bytes.subarray(start, i)), i + 1];
}

// ── 格式识别 ──
const META = {
  mp3: { label: 'MP3 (MPEG Layer III)', mime: 'audio/mpeg' },
  mp2: { label: 'MP2 (MPEG Layer II)', mime: 'audio/mpeg' },
  mp1: { label: 'MP1 (MPEG Layer I)', mime: 'audio/mpeg' },
  aac: { label: 'AAC (ADTS)', mime: 'audio/aac' },
  m4a: { label: 'MP4 / M4A', mime: 'audio/mp4' },
  flac: { label: 'FLAC', mime: 'audio/flac' },
  ogg: { label: 'Ogg (Vorbis)', mime: 'audio/ogg' },
  opus: { label: 'Opus (Ogg)', mime: 'audio/opus' },
  wav: { label: 'WAV (RIFF)', mime: 'audio/wav' },
  aiff: { label: 'AIFF / AIFC', mime: 'audio/aiff' },
  ape: { label: "Monkey's Audio (APE)", mime: 'audio/ape' },
  wma: { label: 'Windows Media (ASF/WMA)', mime: 'audio/x-ms-wma' },
  dsf: { label: 'DSF (DSD Stream File)', mime: 'audio/dsf' },
  dff: { label: 'DFF (DSDIFF)', mime: 'audio/dff' },
  ac3: { label: 'AC-3 (Dolby Digital)', mime: 'audio/ac3' },
  dts: { label: 'DTS', mime: 'audio/vnd.dts' },
  iso: { label: 'SACD ISO (disc image)', mime: 'application/x-iso9660-image' },
  m3u: { label: 'M3U / M3U8 (playlist)', mime: 'audio/x-mpegurl' },
  amr: { label: 'AMR', mime: 'audio/amr' },
  unknown: { label: '未知格式', mime: '' },
};

function detectFormat(b, name) {
  const ext = (String(name || '').split('.').pop() || '').toLowerCase();
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) return 'id3';      // ID3v2 开头
  if (sz(b, 0, 4) === 'fLaC') return 'flac';
  if (sz(b, 0, 4) === 'OggS') { const t = sz(b, 28, 8); return (t.indexOf('OpusHead') === 0 || ext === 'opus') ? 'opus' : 'ogg'; }
  if (sz(b, 4, 4) === 'ftyp') { const br = sz(b, 8, 12); return /M4A|M4B|mp42|isom|iso2|mp41/.test(br) || ext === 'm4a' || ext === 'alac' ? 'm4a' : 'm4a'; }
  if (sz(b, 0, 4) === 'RIFF' && sz(b, 8, 4) === 'WAVE') return 'wav';
  if (sz(b, 0, 4) === 'FORM' && /^(AIFF|AIFC)$/.test(sz(b, 8, 4))) return 'aiff';
  if (sz(b, 0, 4) === 'MAC ') return 'ape';
  if (b[0] === 0x30 && b[1] === 0x26 && b[2] === 0xB2 && b[3] === 0x75) return 'wma'; // ASF GUID
  if (sz(b, 0, 4) === 'DSD ') return 'dsf';
  if (sz(b, 0, 4) === 'FRM8') return 'dff';
  if (sz(b, 0x8001, 5) === 'CD001' || sz(b, 0, 4) === 'SACD') return 'iso';
  if (b[0] === 0x23 && sz(b, 1, 3) === 'EXT') return 'm3u';            // #EXTM3U
  if (/^(m3u|m3u8)$/.test(ext)) return 'm3u';
  if (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0) {                        // MPEG 音频帧头
    const layer = (b[1] >> 1) & 3;
    if (layer === 1) return 'mp3'; if (layer === 2) return 'mp2'; if (layer === 3) return 'mp1';
  }
  if (b[0] === 0xFF && (b[1] & 0xF0) === 0xF0) return 'aac';            // ADTS
  if (sz(b, 0, 6) === '#!AMR\n' || sz(b, 0, 5) === '#AMR\n') return 'amr';
  if (b[0] === 0x0b && b[1] === 0x77) return 'ac3';                       // AC-3 syncframe
  if (b[0] === 0x7f && b[1] === 0xfe && b[2] === 0x80 && b[3] === 0x01) return 'dts'; // DTS syncword
  if (b[0] === 0xFF && b[1] === 0xFB) return 'mp3';
  if (/^(mp3|mp2|aac|flac|wav|aiff|aif|ape|wma|dsf|dff|ogg|oga|opus|m4a|alac|mka|ac3|dts)$/.test(ext)) return ext === 'oga' ? 'ogg' : (ext === 'aif' ? 'aiff' : (ext === 'alac' ? 'm4a' : ext));
  return 'unknown';
}

// ── ID3v2 ──
const ID3_TAGS = {
  TIT2: 'title', TT2: 'title', TITLE: 'title',
  TPE1: 'artist', TP1: 'artist', ARTIST: 'artist',
  TPE2: 'albumArtist', TP2: 'albumArtist',
  TALB: 'album', TAL: 'album',
  TRCK: 'track', TRK: 'track',
  TPOS: 'disc', TPA: 'disc',
  TDRC: 'date', TYER: 'year', TYE: 'year', TDRL: 'releaseDate', TDOR: 'originalDate',
  TCON: 'genre', TCO: 'genre',
  TCOM: 'composer', TCM: 'composer',
  TEXT: 'lyricist', TXT: 'lyricist',
  COMM: 'comment', COM: 'comment',
  TCOP: 'copyright', TCR: 'copyright',
  TSRC: 'isrc', TRSN: 'radioStation',
  TBPM: 'bpm', TBP: 'bpm',
  TENC: 'encodedBy', TEN: 'encodedBy',
  TSSE: 'encoderSettings', TSS: 'encoderSettings',
  TPUB: 'publisher', TPB: 'publisher',
  TPE3: 'conductor', TP3: 'conductor',
  TIT1: 'grouping', TT1: 'grouping',
  TIT3: 'subtitle', TT3: 'subtitle',
  TLAN: 'language', TLA: 'language',
  TMED: 'media', TMT: 'media',
  TMOO: 'mood',
  TOPE: 'originalArtist', TOA: 'originalArtist',
  TPE4: 'remixedBy', TP4: 'remixedBy',
  WOAR: 'url', WAR: 'url',
  TCMP: 'compilation',
  MVNM: 'movement', MVIN: 'movementIndex',
  GRP1: 'grouping',
};
function fillID3v2(b, res, base) {
  base = base || 0;
  if (!(b[base] === 0x49 && b[base + 1] === 0x44 && b[base + 2] === 0x33)) return 0;
  const ver = b[base + 3], flags = b[base + 5];
  const size = syncsafe(b, base + 6);
  res.tags.id3v2 = 'v2.' + ver + '.' + b[base + 4];
  let p = base + 10;
  const end = Math.min(base + 10 + size, b.length);
  if (flags & 0x40) { const ext = ver === 3 ? u32be(b, p) : syncsafe(b, p); p += ver === 3 ? 4 + ext : 4 + ext; } // 扩展头
  if (flags & 0x80) { while (p < end && b[p] === 0) p++; } // 去同步（粗略）
  while (p + (ver === 2 ? 6 : 10) <= end) {
    let id, fsize, fo;
    if (ver === 2) { id = sz(b, p, 3); fsize = u24be(b, p + 3); fo = p + 6; }
    else { id = sz(b, p, 4); fsize = ver === 4 ? syncsafe(b, p + 4) : u32be(b, p + 4); fo = p + 10; }
    if (!/^[A-Z0-9]{3,4}$/.test(id) || fsize <= 0) break;
    const d = b.subarray(fo, Math.min(fo + fsize, b.length));
    readID3Frame(id, d, res);
    p = fo + fsize;
  }
  return 10 + size;
}
function readID3Frame(id, d, res) {
  if (!d.length) return;
  const enc = d[0];
  if (id === 'APIC' || id === 'PIC') {
    let mime, q = 1;
    if (id === 'PIC') { mime = 'image/' + sz(d, 1, 3).toLowerCase(); q = 4; }
    else { const [m, n] = readCString(d, 1, d.length, false); mime = m; q = n; }
    const kind = d[q]; q += 1;
    const wide = enc === 1 || enc === 2;
    let desc = '', q2 = q;
    if (wide) { const [s, n] = readCString(d, q, d.length, true); desc = s; q2 = n; }
    else { const [s, n] = readCString(d, q, d.length, false); desc = s; q2 = n; }
    res.pictures.push({ kind: kind === 3 ? 'cover' : (kind === 4 ? 'back' : 'other'), mime: mime || 'image/jpeg', desc: trimNul(desc), bytes: copyBytes(d, q2, d.length - q2) });
    return;
  }
  if (id === 'COMM' || id === 'COM') {
    const [txt] = [decodeText(d.subarray(4), enc)];
    if (!res.tags.comment) res.tags.comment = trimNul(txt);
    return;
  }
  if (id === 'USLT' || id === 'ULT') { res.tags.lyrics = trimNul(decodeText(d.subarray(4), enc)); return; }
  if (id === 'TXXX' || id === 'TXX') {
    const [desc, n] = readCString(d, 1, d.length, enc === 1 || enc === 2);
    const val = trimNul(decodeText(d.subarray(n), enc));
    res.tagsRaw.push(['TXXX:' + trimNul(desc), val]);
    if (/replaygain/i.test(desc) || /ALBUMARTISTSORT|ARTISTSORT|MUSICBRAINZ/i.test(desc)) res.tagsRaw.push([trimNul(desc), val]);
    return;
  }
  if (id === 'WXXX' || id === 'WXX') return;
  if (id[0] === 'T') {
    const val = trimNul(decodeText(d.subarray(1), enc));
    const key = ID3_TAGS[id];
    if (key && val && !res.tags[key]) res.tags[key] = val;
    else if (val) res.tagsRaw.push([id, val]);
    return;
  }
  if (id[0] === 'W') { const v = asciiAll(d); if (v) res.tagsRaw.push([id, v]); }
}
function fillID3v1(b, res) {
  if (b.length < 128) return;
  const o = b.length - 128;
  if (sz(b, o, 3) !== 'TAG') return;
  const get = (s, n) => trimNul(ascii(b, s, n));
  const t = {
    title: get(o + 3, 30), artist: get(o + 33, 30), album: get(o + 63, 30),
    year: get(o + 93, 4), comment: get(o + 97, 28),
  };
  const genre = u8(b, o + 127);
  if (!res.tags.title && t.title) res.tags.title = t.title;
  if (!res.tags.artist && t.artist) res.tags.artist = t.artist;
  if (!res.tags.album && t.album) res.tags.album = t.album;
  if (!res.tags.year && t.year) res.tags.year = t.year;
  if (!res.tags.comment && t.comment) res.tags.comment = t.comment;
  if (!res.tags.genre && GENRES[genre]) res.tags.genre = GENRES[genre];
  res.tags.id3v1 = 'v1.1';
}
const GENRES = ['Blues','Classic Rock','Country','Dance','Disco','Funk','Grunge','Hip-Hop','Jazz','Metal','New Age','Oldies','Other','Pop','R&B','Rap','Reggae','Rock','Techno','Industrial','Alternative','Ska','Death Metal','Pranks','Soundtrack','Euro-Techno','Ambient','Trip-Hop','Vocal','Jazz+Funk','Fusion','Trance','Classical','Instrumental','Acid','House','Game','Sound Clip','Gospel','Noise','AlternRock','Bass','Soul','Punk','Space','Meditative','Instrumental Pop','Instrumental Rock','Ethnic','Gothic','Darkwave','Techno-Industrial','Electronic','Pop-Folk','Eurodance','Dream','Southern Rock','Comedy','Cult','Gangsta','Top 40','Christian Rap','Pop/Funk','Jungle','Native American','Cabaret','New Wave','Psychadelic','Rave','Showtunes','Trailer','Lo-Fi','Tribal','Acid Punk','Acid Jazz','Polka','Retro','Musical','Rock & Roll','Hard Rock','Folk','Folk-Rock','National Folk','Swing','Fast Fusion','Bebob','Latin','Revival','Celtic','Bluegrass','Avantgarde','Gothic Rock','Progressive Rock','Psychedelic Rock','Symphonic Rock','Slow Rock','Big Band','Chorus','Easy Listening','Acoustic','Humour','Speech','Chanson','Opera','Chamber Music','Sonata','Symphony','Booty Bass','Primus','Porn Groove','Satire','Slow Jam','Club','Tango','Samba','Folklore','Ballad','Power Ballad','Rhythmic Soul','Freestyle','Duet','Punk Rock','Drum Solo','A capella','Euro-House','Dance Hall'];

// ── FLAC ──
function fillFLAC(b, res) {
  let p = 4;
  while (p + 4 <= b.length) {
    const hdr = b[p]; const last = hdr & 0x80; const type = hdr & 0x7f;
    const len = u24be(b, p + 1);
    const d = p + 4;
    if (type === 0 && len >= 34) {
      const x1 = u32be(b, d + 10), x2 = u32be(b, d + 14);
      res.tech.sampleRate = Math.round((x1 >>> 12) * 1 + ((x2 >>> 20) & 0xff) / 4096 * 4096) || ((x1 >>> 12));
      // 更稳妥：20bit 采样率 = (x1>>>12)
      res.tech.sampleRate = (x1 >>> 12) >>> 0;
      res.tech.channels = ((x1 >>> 9) & 7) + 1;
      res.tech.bitDepth = ((x1 >>> 4) & 31) + 1;
      const total = ((x1 & 0xf) * 4294967296 + x2) >>> 0;
      res.tech.totalSamples = total;
      res.tech.md5 = hex(b, d + 18, 16);
      res.tech.codec = 'FLAC';
      res.tech.lossless = true;
    } else if (type === 4) {
      let q = d;
      const vl = u32le(b, q); q += 4;
      res.tech.encoder = trimNul(new TextDecoder('utf-8').decode(b.subarray(q, q + vl))); q += vl;
      const n = u32le(b, q); q += 4;
      for (let i = 0; i < n && q < d + len; i++) {
        const l = u32le(b, q); q += 4;
        const s = new TextDecoder('utf-8').decode(b.subarray(q, q + l)); q += l;
        const eq = s.indexOf('=');
        if (eq > 0) vorbisEntry(s.slice(0, eq).toUpperCase(), s.slice(eq + 1), res);
      }
    } else if (type === 6 && len > 32) {
      let q = d;
      const pt = u32be(b, q); q += 4;
      const ml = u32be(b, q); q += 4; const mime = sz(b, q, ml); q += ml;
      const dl = u32be(b, q); q += 4; const desc = trimNul(new TextDecoder('utf-8').decode(b.subarray(q, q + dl))); q += dl;
      q += 16; // w,h,depth,colors
      const pl = u32be(b, q); q += 4;
      res.pictures.push({ kind: pt === 3 ? 'cover' : (pt === 4 ? 'back' : 'other'), mime: mime || 'image/jpeg', desc, bytes: copyBytes(b, q, pl) });
    }
    if (last) break;
    p = d + len;
  }
}
function vorbisEntry(k, v, res) {
  const MAP = {
    TITLE: 'title', ARTIST: 'artist', ALBUM: 'album', ALBUMARTIST: 'albumArtist', ALBUM_ARTIST: 'albumArtist',
    TRACKNUMBER: 'track', TRACKTOTAL: 'trackTotal', DISCNUMBER: 'disc', DISCTOTAL: 'discTotal',
    DATE: 'date', YEAR: 'year', GENRE: 'genre', COMPOSER: 'composer', LYRICIST: 'lyricist',
    COMMENT: 'comment', DESCRIPTION: 'comment', COPYRIGHT: 'copyright', ISRC: 'isrc',
    BPM: 'bpm', ENCODER: 'encoder', ORGANIZATION: 'publisher', LABEL: 'publisher',
    PERFORMER: 'performer', CONDUCTOR: 'conductor', LYRIC: 'lyrics', LYRICS: 'lyrics',
    LANGUAGE: 'language', MEDIA: 'media', MOOD: 'mood', GROUPING: 'grouping',
    REPLAYGAIN_TRACK_GAIN: 'replayGainTrack', REPLAYGAIN_ALBUM_GAIN: 'replayGainAlbum',
    'COVERART': null, 'METADATA_BLOCK_PICTURE': null,
  };
  if (k === 'METADATA_BLOCK_PICTURE') { try { const raw = b64(v); const pic = { bytes: null, mime: 'image/jpeg', desc: '', kind: 'cover' }; parseFlacPictureBlock(raw, pic); res.pictures.push(pic); } catch (e) { } return; }
  if (k === 'COVERART') { try { res.pictures.push({ kind: 'cover', mime: 'image/jpeg', desc: '', bytes: b64(v) }); } catch (e) { } return; }
  const key = MAP[k];
  if (key && v && !res.tags[key]) res.tags[key] = v;
  else if (v) res.tagsRaw.push([k, v]);
}
function parseFlacPictureBlock(d, pic) {
  let q = 0; q += 4; const ml = u32be(d, q); q += 4; pic.mime = sz(d, q, ml) || 'image/jpeg'; q += ml;
  const dl = u32be(d, q); q += 4; pic.desc = trimNul(new TextDecoder('utf-8').decode(d.subarray(q, q + dl))); q += dl;
  q += 16; const pl = u32be(d, q); q += 4;
  pic.bytes = copyBytes(d, q, pl);
}
function b64(s) {
  if (typeof atob === 'function') { const bin = atob(s.replace(/\s+/g, '')); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
  return new Uint8Array(Buffer.from(s, 'base64'));
}

// ── Ogg（Vorbis / Opus）──
function fillOgg(b, res) {
  let p = 0, packets = [];
  let ch = null, sr = null, bitrate = null, vendor = '', first3 = [];
  while (p + 27 <= b.length && packets.length < 3) {
    if (sz(b, p, 4) !== 'OggS') break;
    const nseg = b[p + 26];
    let q = p + 27; let pkt = [];
    for (let i = 0; i < nseg; i++) { const l = b[q + i]; pkt.push(sub(b, q + nseg + pkt.offset ? q + nseg : q + nseg, l)); }
    // 简化：整页数据
    const dataStart = p + 27 + nseg;
    let dataLen = 0; for (let i = 0; i < nseg; i++) dataLen += b[p + 27 + i];
    packets.push(sub(b, dataStart, dataLen));
    p = dataStart + dataLen;
  }
  const idp = packets[0] || new Uint8Array(0);
  const cmt = packets[1] || new Uint8Array(0);
  if (sz(idp, 0, 7) === '\x01vorbis') {
    res.tech.codec = 'Vorbis'; res.tech.lossless = false;
    res.tech.channels = u8(idp, 11);
    res.tech.sampleRate = u32le(idp, 12);
    const bmax = u32le(idp, 16), bnom = u32le(idp, 20), bmin = u32le(idp, 24);
    res.tech.bitrateNominal = bnom ? Math.round(bnom / 1000) : null;
    res.tech.bitrateMode = (bmin > 0 || bmax > 0 || bnom > 0) ? 'VBR' : 'CBR';
  } else if (sz(idp, 0, 8) === 'OpusHead') {
    res.tech.codec = 'Opus'; res.tech.lossless = false;
    res.tech.channels = u8(idp, 9);
    res.tech.preSkip = u16le(idp, 10);
    res.tech.inputSampleRate = u32le(idp, 12);
    res.tech.sampleRate = 48000; // Opus 固定 48k 输出
  }
  if (sz(cmt, 0, 7) === '\x03vorbis') {
    let q = 7; const vl = u32le(cmt, q); q += 4; vendor = trimNul(new TextDecoder('utf-8').decode(cmt.subarray(q, q + vl))); q += vl;
    const n = u32le(cmt, q); q += 4;
    for (let i = 0; i < n; i++) { const l = u32le(cmt, q); q += 4; const s = new TextDecoder('utf-8').decode(cmt.subarray(q, q + l)); q += l; const eq = s.indexOf('='); if (eq > 0) vorbisEntry(s.slice(0, eq).toUpperCase(), s.slice(eq + 1), res); }
  } else if (sz(cmt, 0, 8) === 'OpusTags') {
    let q = 8; const vl = u32le(cmt, q); q += 4; vendor = trimNul(new TextDecoder('utf-8').decode(cmt.subarray(q, q + vl))); q += vl;
    const n = u32le(cmt, q); q += 4;
    for (let i = 0; i < n; i++) { const l = u32le(cmt, q); q += 4; const s = new TextDecoder('utf-8').decode(cmt.subarray(q, q + l)); q += l; const eq = s.indexOf('='); if (eq > 0) vorbisEntry(s.slice(0, eq).toUpperCase(), s.slice(eq + 1), res); }
  }
  if (vendor) res.tech.encoder = vendor;
  // 时长：回扫最后一页 Ogg 页头的 granule position（采样数）
  try {
    let last = -1;
    for (let i = b.length - 27; i >= Math.max(0, b.length - 300000); i--) {
      if (b[i] === 0x4f && b[i + 1] === 0x67 && b[i + 2] === 0x67 && b[i + 3] === 0x53) { last = i; break; }
    }
    if (last >= 0) {
      const granule = u64le(b, last + 6);
      res.tech.granulePos = granule;
      if (res.tech.codec === 'Opus') res.tech.duration = Math.round(granule / 48000 * 1000) / 1000;
      else if (res.tech.sampleRate) res.tech.duration = Math.round(granule / res.tech.sampleRate * 1000) / 1000;
    }
  } catch (e) { /* ignore */ }
}

// ── MP4 / M4A ──
const MP4_TAGS = {
  '\u00A9nam': 'title', '\u00A9ART': 'artist', aART: 'albumArtist', '\u00A9alb': 'album',
  '\u00A9day': 'date', '\u00A9gen': 'genre', gnre: 'genre', '\u00A9wrt': 'composer',
  '\u00A9cmt': 'comment', '\u00A9too': 'encoder', '\u00A9lyr': 'lyrics',
  '\u00A9grp': 'grouping', '\u00A9con': 'conductor', cprt: 'copyright',
  '\u00A9pub': 'publisher', '\u00A9mvn': 'movement', '\u00A9nam2': 'title',
  soaa: 'albumArtist', soal: 'album', soar: 'artist', soco: 'composer', sonm: 'title', sosn: 'title',
  trkn: 'track', disk: 'disc', tmpo: 'bpm', cpil: 'compilation', pgap: 'gapless',
  '----': 'custom',
};
function fillMP4(b, res) {
  const boxes = [];
  walkMp4(b, 0, b.length, boxes);
  const find = (t) => boxes.find((x) => x.type === t);
  const mvhd = find('mvhd');
  if (mvhd) {
    const v = b[mvhd.data];
    if (v === 1) { res.tech.timescale = u32be(b, mvhd.data + 20); res.tech.duration = u64be(b, mvhd.data + 24) / res.tech.timescale; }
    else { res.tech.timescale = u32be(b, mvhd.data + 12); res.tech.duration = u32be(b, mvhd.data + 16) / res.tech.timescale; }
  }
  const stsd = find('stsd');
  if (stsd) {
    const entry = stsd.data + 8;
    const fmt = sz(b, entry + 4, 4);
    const ch = u16be(b, entry + 24), bd = u16be(b, entry + 26), sr1632 = u32be(b, entry + 32);
    if (ch) res.tech.channels = ch;
    if (bd) res.tech.bitDepth = bd;
    if (sr1632 >>> 16) res.tech.sampleRate = sr1632 >>> 16;
    const CODECS = { mp4a: 'AAC (mp4a)', alac: 'ALAC (Apple Lossless)', 'ac-3': 'AC-3', 'ec-3': 'E-AC-3', Opus: 'Opus', fLaC: 'FLAC', lpcm: 'LPCM', samr: 'AMR-NB', sawb: 'AMR-WB' };
    res.tech.codec = CODECS[fmt] || fmt;
    res.tech.lossless = /alac|fLaC|lpcm/i.test(fmt);
    // 子盒子（esds / alac cookie）在 AudioSampleEntry 头之后：v0 = 36 字节，v1 +16，v2 +36。
    // ⚠️ 旧实现写的 `entry + 8 + u16be(b, entry + 28)` 是错的 —— entry+28 是 compressionID（通常=0），
    // 等于从 entry+8 开始找，永远找不到 esds → M4A 的真实码率/编码档次（AAC LC）全丢。
    const seVer = u16be(b, entry + 16);
    const childStart = entry + 36 + (seVer === 1 ? 16 : seVer === 2 ? 36 : 0);
    const entryEnd = entry + (u32be(b, entry) || 0);
    if (fmt === 'alac') { const alac = findBoxAt(b, childStart, entryEnd, 'alac'); if (alac) { res.tech.sampleRate = u32be(b, alac.data + 20) || res.tech.sampleRate; res.tech.channels = u8(b, alac.data + 25) || res.tech.channels; res.tech.bitDepth = u8(b, alac.data + 25) ? u8(b, alac.data + 21) : res.tech.bitDepth; } }
    if (fmt === 'mp4a') {
      const esds = findBoxAt(b, childStart, entryEnd, 'esds');
      if (esds) parseEsds(b, esds, res);
    }
    res.tech.codecId = fmt;
  }
  // 标签
  const ilst = find('ilst');
  if (ilst) {
    let p = ilst.data;
    while (p + 8 <= ilst.end) {
      const s = u32be(b, p); const t = sz(b, p + 4, 4); const de = p + s;
      let q = p + 8;
      while (q + 8 <= de) {
        const ds = u32be(b, q); const dt = sz(b, q + 4, 4);
        if (dt === 'data') {
          const typ = u32be(b, q + 8) & 0xffffff;
          const vstart = q + 16, vlen = ds - 16;
          readMp4Value(t, typ, b, vstart, vlen, res);
        }
        q += ds || 8;
      }
      p = de;
    }
  }
  const udta = find('udta');
  if (udta) {
    for (const t of ['\u00A9nam', '\u00A9ART', '\u00A9alb', '\u00A9cmt', '\u00A9day']) {
      const bx = findBoxAt(b, udta.data, udta.end, t);
      if (bx) { const va = findBoxAt(b, bx.data, bx.end, 'data'); if (va) readMp4Value(t, 1, b, va.data + 8, va.end - va.data - 8, res); }
    }
  }
}
function skipDescLen(b, q) { let n = 0, c; do { c = b[q++]; n = (n << 7) | (c & 0x7f); } while (c & 0x80); return q + n; }
// 解析 MP4 的 esds（AAC AudioSpecificConfig：采样率/对象类型/码率）
function parseEsds(b, esds, res) {
  let p = esds.data + 4;
  const readLen = () => { let n = 0, c; do { c = b[p++]; n = (n << 7) | (c & 0x7f); } while (c & 0x80); return n; };
  try {
    if (b[p] === 0x03) { p++; readLen(); }
    p += 2; const fl = b[p++];
    if (fl & 0x80) p += 2;
    if (fl & 0x40) { const ul = b[p++]; p += ul; }
    if (fl & 0x20) p += 2;
    if (b[p] === 0x04) { p++; readLen(); }
    p += 1; // objectTypeIndication
    p += 1; // streamType
    p += 3; // bufferSizeDB
    // esds 里是 bps，统一换算成 kbps，跟 MP3 等其它格式口径一致（否则表格会显示成 256000 kbps）
    const mxBps = u32be(b, p); p += 4;
    const avgBps = u32be(b, p); p += 4;
    if (mxBps) res.tech.bitrateMax = Math.round(mxBps / 1000);
    if (avgBps) res.tech.bitrateAvg = Math.round(avgBps / 1000);
    res.tech.bitrate = res.tech.bitrateAvg || res.tech.bitrateMax || null;
    if (res.tech.bitrateMax && res.tech.bitrateAvg) {
      res.tech.bitrateMode = (res.tech.bitrateMax > res.tech.bitrateAvg * 1.25) ? 'VBR' : 'CBR';
    }
    if (b[p] === 0x05) {
      p++; readLen();
      const aot = (b[p] >> 3) & 0x1f;
      const sfi = ((b[p] & 0x07) << 1) | ((b[p + 1] >> 7) & 1);
      res.tech.audioObjectType = aot;
      if (ASC_HZ[sfi]) res.tech.sampleRate = ASC_HZ[sfi];
      const N = { 1: 'Main', 2: 'LC', 3: 'SSR', 4: 'LTP', 5: 'HE (SBR)', 29: 'HE v2 (PS)' };
      if (N[aot]) res.tech.codec = 'AAC ' + N[aot];
    }
  } catch (e) { /* ignore */ }
}
const ASC_HZ = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
function readMp4Value(type, dtype, b, start, len, res) {
  if (type === 'covr') {
    const mime = dtype === 13 ? 'image/jpeg' : (dtype === 14 ? 'image/png' : 'image/jpeg');
    res.pictures.push({ kind: 'cover', mime, desc: '', bytes: copyBytes(b, start, len) });
    return;
  }
  if (type === 'trkn' || type === 'disk') {
    const n = u16be(b, start + 2), total = u16be(b, start + 4);
    const key = type === 'trkn' ? 'track' : 'disc';
    if (n) res.tags[key] = String(n);
    if (total) res.tags[key + 'Total'] = String(total);
    return;
  }
  if (type === 'tmpo') { res.tags.bpm = String(u16be(b, start)); return; }
  if (type === 'cpil') { res.tags.compilation = u8(b, start) ? '1' : '0'; return; }
  if (type === 'gnre') { const g = u16be(b, start); if (GENRES[g - 1]) res.tags.genre = res.tags.genre || GENRES[g - 1]; return; }
  const txt = trimNul(new TextDecoder('utf-8').decode(b.subarray(start, start + len)));
  const key = MP4_TAGS[type];
  if (key && key !== 'custom' && txt && !res.tags[key]) res.tags[key] = txt;
  else if (txt) res.tagsRaw.push([key === 'custom' || !key ? '----' : type, txt]);
}
function walkMp4(b, start, end, out) {
  let p = start;
  const containers = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'meta', 'ilst', 'dinf']);
  while (p + 8 <= end) {
    let size = u32be(b, p); const type = sz(b, p + 4, 4); let hdr = 8;
    if (size === 1) { size = u64be(b, p + 8); hdr = 16; }
    else if (size === 0) size = end - p;
    if (size < hdr) break;
    out.push({ type, start: p, data: p + hdr, end: p + size });
    if (containers.has(type)) walkMp4(b, type === 'meta' ? p + hdr + 4 : p + hdr, p + size, out);
    p += size;
  }
}
function findBoxAt(b, start, end, type) {
  let p = start;
  while (p + 8 <= end) {
    let size = u32be(b, p); const t = sz(b, p + 4, 4); let hdr = 8;
    if (size === 1) { size = u64be(b, p + 8); hdr = 16; } else if (size === 0) size = end - p;
    if (size < hdr) return null;
    if (t === type) return { type: t, start: p, data: p + hdr, end: p + size };
    p += size;
  }
  return null;
}

// ── WAV (RIFF) ──
function fillWAV(b, res) {
  let p = 12, byteRate = 0, dataSize = 0;
  const entries = [];
  while (p + 8 <= b.length) {
    const id = sz(b, p, 4); const size = u32le(b, p + 4); const d = p + 8;
    if (id === 'fmt ') {
      const af = u16le(b, d);
      res.tech.channels = u16le(b, d + 2);
      res.tech.sampleRate = u32le(b, d + 4);
      byteRate = u32le(b, d + 8);
      res.tech.bitrate = Math.round(byteRate * 8 / 1000);
      res.tech.bitDepth = u16le(b, d + 14);
      const FMT = { 1: 'PCM (整数)', 3: 'IEEE Float', 6: 'A-law', 7: 'µ-law', 0xfffe: 'PCM (Extensible)', 0x2000: 'AC-3', 0x2001: 'DTS', 0x0055: 'MP3', 0xf1ac: 'FLAC' };
      res.tech.codec = FMT[af] || ('0x' + af.toString(16));
      res.tech.lossless = (af === 1 || af === 0xfffe || af === 0xf1ac);
      if (af === 0xfffe && size >= 40) { res.tech.validBits = u16le(b, d + 18); res.tech.channelMask = '0x' + u32le(b, d + 20).toString(16); const g = sz(b, d + 24, 4); if (sz(b, d + 24, 4) === 'DTS ') res.tech.codec = 'PCM (DTS 编码标记)'; }
    } else if (id === 'data') { dataSize = size; res.tech.dataSize = size; }
    else if (id === 'LIST') {
      const lt = sz(b, d, 4);
      if (lt === 'INFO') {
        let q = d + 4;
        while (q + 8 <= d + size) { const iid = sz(b, q, 4); const il = u32le(b, q + 4); const val = trimNul(decodeText(sub(b, q + 8, il), 0)); const RK = { INAM: 'title', IART: 'artist', IPRD: 'album', ICRD: 'date', IGNR: 'genre', ICMT: 'comment', ITRK: 'track', ICOP: 'copyright', ISFT: 'encoder', IENG: 'engineer', ISBJ: 'subject' }; if (RK[iid] && val && !res.tags[RK[iid]]) res.tags[RK[iid]] = val; else if (val) res.tagsRaw.push([iid, val]); q += 8 + il + (il & 1); }
      }
    } else if (id === 'id3 ' || id === 'ID3 ' || id === 'iD3 ') {
      res.tags.__id3off = d;
    }
    entries.push(id);
    p = d + size + (size & 1);
  }
  res.tech.container = 'RIFF/WAVE';
  if (dataSize && byteRate) res.tech.duration = Math.round(dataSize / byteRate * 1000) / 1000;
  if (res.tech.sampleRate && res.tech.bitDepth && res.tech.channels && !res.tech.bitrate) res.tech.bitrate = Math.round(res.tech.sampleRate * res.tech.bitDepth * res.tech.channels / 1000);
}

// ── AIFF ──
function fillAIFF(b, res) {
  res.tech.container = sz(b, 8, 4);
  let p = 12;
  while (p + 8 <= b.length) {
    const id = sz(b, p, 4); const size = u32be(b, p + 4); const d = p + 8;
    if (id === 'COMM') {
      res.tech.channels = u16be(b, d);
      res.tech.totalSamples = u32be(b, d + 2);
      res.tech.bitDepth = u16be(b, d + 6);
      res.tech.sampleRate = Math.round(ext80(b, d + 8));
      if (size >= 22) { const comp = sz(b, d + 18, 4); res.tech.codec = comp === 'NONE' ? 'PCM' : comp; res.tech.lossless = comp === 'NONE' || comp === 'sowt' || comp === 'twos'; }
      else { res.tech.codec = 'PCM'; res.tech.lossless = true; }
    } else if (id === 'SSND') { res.tech.dataSize = size; }
    else if (id === 'ID3 ' || id === 'id3 ') { res.tags.__id3off = d; }
    else if (id === 'NAME') { const v = trimNul(decodeText(sub(b, d, size), 0)); if (v) res.tags.title = res.tags.title || v; }
    else if (id === 'AUTH') { const v = trimNul(decodeText(sub(b, d, size), 0)); if (v) res.tags.artist = res.tags.artist || v; }
    else if (id === 'ANNO') { const v = trimNul(decodeText(sub(b, d, size), 0)); if (v) res.tags.comment = res.tags.comment || v; }
    p = d + size + (size & 1);
  }
}
function ext80(b, o) { // 80-bit IEEE extended float（AIFF 采样率）
  const e = ((b[o] & 0x7f) << 8) | b[o + 1];
  if (e === 0) return 0;
  let m = 0; for (let i = 0; i < 8; i++) m = m * 256 + (b[o + 2 + i] || 0);
  const sign = (b[o] & 0x80) ? -1 : 1;
  const exp = e - 16383 - 63;
  return sign * m * Math.pow(2, exp);
}

// ── APE (Monkey's Audio) ──
function fillAPE(b, res) {
  res.tech.container = "Monkey's Audio (APE)";
  const ver = u16le(b, 4);
  res.tech.apeVersion = (ver / 1000).toFixed(2);
  if (ver >= 3980) {
    // MAC 头 52 字节（'MAC ' + version + padding + 各长度字段 + fileMD5），APEv2 描述符紧随其后
    const d = 52;
    const comp = u16le(b, d);
    const blocksPerFrame = u32le(b, d + 4), finalFrameBlocks = u32le(b, d + 8), totalFrames = u32le(b, d + 12);
    const bps = u16le(b, d + 16), ch = u16le(b, d + 18), sr = u32le(b, d + 20);
    const COMP = { 1000: 'Fast', 2000: 'Normal', 3000: 'High', 4000: 'Extra High', 5000: 'Insane' };
    res.tech.codec = "Monkey's Audio"; res.tech.lossless = true;
    res.tech.compression = (COMP[comp] || comp) + ' (' + comp + ')';
    res.tech.channels = ch; res.tech.sampleRate = sr; res.tech.bitDepth = bps;
    res.tech.totalFrames = totalFrames;
    if (totalFrames > 0) res.tech.totalSamples = (totalFrames - 1) * blocksPerFrame + finalFrameBlocks;
    res.tech.fileMD5 = hex(b, 36, 16);
    const audioBytes = u32le(b, 24);
    if (res.tech.totalSamples && sr) res.tech.bitrate = Math.round(audioBytes * 8 / (res.tech.totalSamples / sr) / 1000);
  }
  // APEv2 标签：文件尾部
  fillAPEv2(b, res);
}
function fillAPEv2(b, res) {
  const FOOT = 32;
  let q = b.length - FOOT;
  if (q < 0 || sz(b, q, 8) !== 'APETAGEX') { // 也许带 header
    return;
  }
  const tagSize = u32le(b, q + 12); const count = u32le(b, q + 16);
  let start = q - (tagSize - FOOT);
  if (start < 0 || sz(b, start, 8) !== 'APETAGEX') start = q - (tagSize - FOOT - 32);
  let p = start + 32;
  if (sz(b, p, 8) !== 'APETAGEX' && p + 8 <= b.length) {
    if (sz(b, p, 8) !== 'APETAGEX') { /* no header */ }
  } else { p += 32; }
  if (p >= q) p = start + 32;
  for (let i = 0; i < count && p + 8 <= q; i++) {
    const vl = u32le(b, p); const fl = u32le(b, p + 4); p += 8;
    if (vl <= 0 || p + vl > q + 8) break;
    let k = ''; while (p < b.length && b[p] !== 0) { k += String.fromCharCode(b[p]); p++; }
    p++;
    const val = sub(b, p, vl); p += vl;
    const KK = k.toUpperCase();
    if (KK === 'COVER ART (FRONT)' || KK === 'COVER ART (BACK)') {
      let n = 0; while (n < val.length && val[n] !== 0) n++;
      res.pictures.push({ kind: KK.indexOf('FRONT') > 0 ? 'cover' : 'back', mime: 'image/jpeg', desc: asciiAll(val.subarray(0, n)), bytes: copyBytes(val, n + 1, val.length - n - 1) });
    } else {
      const key = { TITLE: 'title', ARTIST: 'artist', ALBUM: 'album', 'ALBUM ARTIST': 'albumArtist', YEAR: 'year', DATE: 'date', GENRE: 'genre', TRACK: 'track', COMMENT: 'comment', COMPOSER: 'composer', COPYRIGHT: 'copyright', ISRC: 'isrc', BPM: 'bpm', LYRIC: 'lyrics', LYRICS: 'lyrics', ENCODER: 'encoder', 'REPLAYGAIN_TRACK_GAIN': 'replayGainTrack' }[KK];
      const txt = trimNul(new TextDecoder('utf-8').decode(val));
      if (key && txt && !res.tags[key]) res.tags[key] = txt; else if (txt) res.tagsRaw.push([k, txt]);
    }
  }
}

// ── ASF / WMA ──
function fillASF(b, res) {
  res.tech.container = 'ASF (Windows Media)';
  if (!guidIs(b, 0, ASF_GUID.header)) return;
  res.tech.objectCount = u32le(b, 24);
  walkAsf(b, 30, Math.min(u64le(b, 16), b.length), res);
  // WMA 的 WAVEFORMATEX.nAvgBytesPerSec 常不可靠，用「文件大小 / 时长」兜底
  if (res.tech.duration && (!res.tech.bitrate || res.tech.bitrate < 32)) {
    res.tech.bitrate = Math.round(b.length * 8 / res.tech.duration / 1000);
  }
}
// ASF 对象 GUID 前 4 字节（小端）即可判别
const ASF_GUID = {
  header: [0x30, 0x26, 0xb2, 0x75],
  fileprop: [0xa1, 0xdc, 0xab, 0x8c],
  streamprop: [0x91, 0x07, 0xdc, 0xb7],
  contentdesc: [0x33, 0x26, 0xb2, 0x75],
  extcontentdesc: [0x40, 0xa4, 0xd0, 0xd2],
  headerext: [0xb5, 0x03, 0xbf, 0x5f],
  metadata: [0xea, 0xcb, 0xf8, 0xc5],
  audioMedia: [0x40, 0x9e, 0x69, 0xf8],
};
function guidIs(b, o, g) { for (let i = 0; i < 4; i++) if (b[o + i] !== g[i]) return false; return true; }
const WMA_FMT = { 0x0001: 'PCM', 0x000a: 'WMA Voice', 0x0160: 'WMA v1', 0x0161: 'WMA v2', 0x0162: 'WMA Pro', 0x0163: 'WMA Lossless', 0x0055: 'MP3' };
function walkAsf(b, start, end, res) {
  let p = start;
  while (p + 24 <= end && p + 24 <= b.length) {
    const size = u64le(b, p + 16);
    if (size < 24) break;
    const d = p + 24;
    if (guidIs(b, p, ASF_GUID.fileprop)) {
      res.tech.fileSize = u64le(b, d + 16);
      const play = u64le(b, d + 40) / 1e7, preroll = u64le(b, d + 56) / 1000;
      res.tech.duration = Math.max(0, Math.round((play - preroll) * 1000) / 1000);
      res.tech.bitrate = Math.round(u32le(b, d + 76) / 1000);
    } else if (guidIs(b, p, ASF_GUID.streamprop)) {
      if (guidIs(b, d, ASF_GUID.audioMedia)) {
        const tag = u16le(b, d + 54);
        res.tech.codec = WMA_FMT[tag] || ('0x' + tag.toString(16));
        res.tech.lossless = /Lossless|PCM/.test(res.tech.codec);
        const ch = u16le(b, d + 56), sr = u32le(b, d + 58), br = u32le(b, d + 62), bd = u16le(b, d + 68);
        if (ch) res.tech.channels = ch;
        if (sr) res.tech.sampleRate = sr;
        if (br) res.tech.bitrate = Math.round(br / 1000);
        if (bd) res.tech.bitDepth = bd;
      }
    } else if (guidIs(b, p, ASF_GUID.contentdesc)) {
      const L = [u16le(b, d), u16le(b, d + 2), u16le(b, d + 4), u16le(b, d + 6), u16le(b, d + 8)];
      let q = d + 10;
      const rd = (l) => { const s = trimNul(new TextDecoder('utf-16le').decode(sub(b, q, l))); q += l; return s; };
      const T = rd(L[0]), A = rd(L[1]), C = rd(L[2]), D = rd(L[3]); rd(L[4]);
      if (T && !res.tags.title) res.tags.title = T;
      if (A && !res.tags.artist) res.tags.artist = A;
      if (C && !res.tags.copyright) res.tags.copyright = C;
      if (D && !res.tags.comment) res.tags.comment = D;
    } else if (guidIs(b, p, ASF_GUID.extcontentdesc)) {
      const count = u16le(b, d);
      let q = d + 2;
      for (let k = 0; k < count && q + 6 <= end; k++) {
        const nl = u16le(b, q), dt = u16le(b, q + 2), vl = u16le(b, q + 4); q += 6;
        const name = trimNul(new TextDecoder('utf-16le').decode(sub(b, q, nl))); q += nl;
        const v = sub(b, q, vl); q += vl;
        readAsfValue(name, dt, v, res);
      }
    } else if (guidIs(b, p, ASF_GUID.metadata)) {
      const count = u16le(b, d);
      let q = d + 2;
      for (let k = 0; k < count && q + 12 <= end; k++) {
        const nl = u16le(b, q + 4), dt = u16le(b, q + 6), dl = u32le(b, q + 8); q += 12;
        const name = trimNul(new TextDecoder('utf-16le').decode(sub(b, q, nl))); q += nl;
        const v = sub(b, q, dl); q += dl;
        readAsfValue(name, dt, v, res);
      }
    } else if (guidIs(b, p, ASF_GUID.headerext)) {
      walkAsf(b, p + 24 + 16 + 2 + 4, p + size, res); // 预留 GUID(16)+预留(2)+扩展数据长度(4)
    }
    p += size;
  }
}
function readAsfValue(name, dt, v, res) {
  const U = name.toUpperCase();
  if (U === 'WM/PICTURE') { parseAsfPicture(v, res); return; }
  let txt;
  if (dt === 0) txt = trimNul(new TextDecoder('utf-16le').decode(v));
  else if (dt === 1) txt = trimNul(new TextDecoder('utf-8').decode(v));
  else if (dt === 2) txt = String(v[0] | (v[1] << 8) | (v[2] << 16) | (v[3] << 24));
  else if (dt === 3) txt = String(u32le(v, 0));
  else if (dt === 4) txt = String(u64le(v, 0));
  else if (dt === 5) txt = String(u16le(v, 0));
  else return;
  const key = ASF_TAGS[U];
  if (key && txt && !res.tags[key]) res.tags[key] = txt;
  else if (txt) res.tagsRaw.push([name, txt]);
}
const ASF_TAGS = {
  'WM/ALBUMTITLE': 'album', 'WM/TRACKNUMBER': 'track', 'WM/GENRE': 'genre', 'WM/YEAR': 'year',
  'WM/COMPOSER': 'composer', 'WM/CONDUCTOR': 'conductor', 'WM/PUBLISHER': 'publisher',
  'WM/ISRC': 'isrc', 'WM/BEATSPERMINUTE': 'bpm', 'WM/ENCODEDBY': 'encoder',
  'WM/PICTURE': 'picture', 'WM/ALBUMARTIST': 'albumArtist', 'WM/LYRICS': 'lyrics',
  'WM/PROVIDER': 'publisher', 'WM/ENCODINGSETTINGS': 'encoderSettings', 'WM/DESCRIPTION': 'comment',
};
function parseAsfPicture(v, res) {
  // WM/Picture: type(1) size(4 LE) mimeLen(2) mime descLen(2) desc data
  try {
    let q = 1; const sz2 = u32le(v, q); q += 4; const ml = u16le(v, q); q += 2; const mime = trimNul(new TextDecoder('utf-16le').decode(sub(v, q, ml))); q += ml;
    const dl = u16le(v, q); q += 2; q += dl;
    res.pictures.push({ kind: 'cover', mime: mime || 'image/jpeg', desc: '', bytes: copyBytes(v, q, sz2) });
  } catch (e) { }
}

// ── DSF ──
function fillDSF(b, res) {
  res.tech.container = 'DSF (DSD Stream File)';
  const metaPtr = u64le(b, 20);
  if (sz(b, 28, 4) === 'fmt ') {
    const d = 40; // 'fmt ' 块：type(4) + size(8) → 数据自 28+12 起
    res.tech.formatVersion = u32le(b, d);
    res.tech.formatId = u32le(b, d + 4);
    const channelType = u32le(b, d + 8);
    res.tech.channels = u32le(b, d + 12);
    res.tech.sampleRate = u32le(b, d + 16);
    res.tech.bitDepth = u32le(b, d + 20);
    res.tech.totalSamples = u64le(b, d + 24);
    res.tech.blockSize = u32le(b, d + 32);
    res.tech.codec = 'DSD'; res.tech.lossless = true;
    res.tech.channelType = channelType === 1 ? '单声道' : (channelType === 2 ? '立体声' : (channelType === 3 ? '3 声道' : (channelType === 4 ? '4 声道' : (channelType === 5 ? '4 声道 (3.0/2.0)' : (channelType === 6 ? '5.1 声道' : (channelType === 7 ? '7.1 声道' : '其他'))))));
    // DSD 是恒定码率：采样率 × 声道数 × 1 bit（不含文件头与块对齐填充）
    if (res.tech.sampleRate && res.tech.channels) {
      res.tech.bitrate = Math.round(res.tech.sampleRate * res.tech.channels / 1000);
      res.tech.dsdRate = 'DSD' + Math.round(res.tech.sampleRate / 44100);
    }
    // 位序：DSF 的 bitsPerSample 字段 1 = LSB 优先（Little），8 = MSB 优先（Big）
    res.tech.bitOrder = res.tech.bitDepth === 8 ? 'Big（MSB 优先）' : 'Little（LSB 优先）';
  }
  // 音频流大小：扫块找 'data'（DSF 各块的 size 字段都是「整块大小（含 12 字节块头）」）
  for (let q = 0; q + 12 <= b.length;) {
    const id = sz(b, q, 4);
    const size = u64le(b, q + 4);
    if (!/^[\x20-\x7e]{4}$/.test(id) || size < 12 || q + size > b.length) break;
    if (id === 'data') { res.tech.dataSize = size - 12; break; }
    q += size;
  }
  if (metaPtr > 0 && metaPtr + 3 < b.length) fillID3v2(b, res, metaPtr);
}
// ── DFF (DSDIFF) ──
function fillDFF(b, res) {
  res.tech.container = 'DFF (DSDIFF)';
  // 规范规定块长度为 8 字节，但部分写入器用 4 字节 —— 自动判别（块类型应紧跟在长度之后）
  const isTag = (o) => /^[ -~]{4}$/.test(sz(b, o, 4));
  const s4 = isTag(8);
  const SZ = s4 ? 4 : 8;
  const readSize = (o) => (s4 ? u32be(b, o) : u64be(b, o));
  const step = 4 + SZ;
  let p = 4 + SZ + 4; // FRM8 + 长度 + formType('DSD ')
  while (p + step <= b.length) {
    const id = sz(b, p, 4); const size = readSize(p + 4); const d = p + step;
    if (!isTag(p) || size <= 0) break;
    if (id === 'FVER') res.tech.formatVersion = '0x' + hex(b, d, 4);
    else if (id === 'PROP') {
      let q = sz(b, d, 4) === 'SND ' ? d + 4 : d; // PROP 负载常以 'SND ' 开头，个别写入器省略
      while (q + step <= d + size) {
        const sid = sz(b, q, 4); const ssize = readSize(q + 4); const sd = q + step;
        if (!isTag(q) || ssize <= 0) break;
        if (sid === 'FS  ') res.tech.sampleRate = u32be(b, sd);
        else if (sid === 'CHNL') { const n = u16be(b, sd); res.tech.channels = n; const ids = []; for (let i = 0; i < n; i++) ids.push(sz(b, sd + 2 + i * 4, 4)); res.tech.channelIds = ids.filter(Boolean).join(' '); }
        else if (sid === 'CMPR') { const cm = sz(b, sd, 4); res.tech.codec = (cm === 'DSD ' ? 'DSD' : trimNul(cm)); res.tech.lossless = true; }
        q = sd + ssize + (ssize & 1);
      }
    } else if (id === 'ID3 ' || id === 'id3 ') { fillID3v2(b, res, d); }
    else if (id === 'DSD ') { res.tech.dataSize = size; }
    const nextP = d + size + (size & 1);
    p = (!isTag(nextP) && isTag(d + size)) ? d + size : nextP; // 个别写入器未做偶数字节对齐
  }
  if (!res.tech.codec) { res.tech.codec = 'DSD'; res.tech.lossless = true; }
  if (res.tech.sampleRate && !res.tech.bitDepth) res.tech.bitDepth = 1; // DSD 为 1 bit
  if (res.tech.sampleRate && res.tech.channels) {
    if (!res.tech.bitrate) res.tech.bitrate = Math.round(res.tech.sampleRate * res.tech.channels / 1000);
    res.tech.dsdRate = 'DSD' + Math.round(res.tech.sampleRate / 44100);
  }
  // DFF 无样本总数，用数据块字节数换算：每样本 1 bit
  if (res.tech.dataSize && res.tech.sampleRate && res.tech.channels && !res.tech.duration) {
    res.tech.duration = Math.round(res.tech.dataSize * 8 / (res.tech.sampleRate * res.tech.channels) * 1000) / 1000;
  }
}
// ── M3U / M3U8 ──
function fillM3U(b, res) {
  const text = new TextDecoder('utf-8').decode(b);
  const lines = text.split(/\r?\n/);
  let dur = 0, entries = [], cur = null, isExt = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line === '#EXTM3U') { isExt = true; res.tags.playlistType = 'EXTM3U (扩展)'; continue; }
    if (line.indexOf('#EXTINF:') === 0) { const m = /#EXTINF:(-?\d+(?:\.\d+)?)\s*,(.*)/.exec(line); dur += parseFloat(m ? m[1] : 0) || 0; cur = m ? m[2].trim() : ''; continue; }
    if (line[0] === '#') continue;
    entries.push({ url: line, title: cur || '' }); cur = null;
  }
  res.tech.entryCount = entries.length;
  res.tech.totalDuration = dur ? Math.round(dur) : null;
  res.tech.isStream = /#EXT-X-(TARGETDURATION|MEDIA-SEQUENCE|STREAM-INF)/.test(text);
  res.playlist = entries;
}

// ── AC-3 ──
const AC3_BITRATE = [32,32,40,40,48,48,56,56,64,64,80,80,96,96,112,112,128,128,160,160,192,192,224,224,256,256,320,320,384,384,448,448,512,512,576,576,640,640];
const AC3_ACMOD = [2,1,2,3,3,4,4,5];
const AC3_CH = ['1+1 (Dual Mono)','1/0 (Mono)','2/0 (Stereo)','3/0','2/1','3/1','2/2','3/2 (5.1)'];
function fillAC3(b, res) {
  let p = 0;
  while (p + 6 <= b.length && !(b[p] === 0x0b && b[p + 1] === 0x77)) p++;
  if (p + 6 > b.length) return;
  const fscod = (b[p + 4] >> 6) & 3, frmsizecod = b[p + 4] & 0x3f;
  const bsid = (b[p + 5] >> 3) & 0x1f;
  const acmod = (b[p + 6] >> 5) & 7;
  const SR = fscod === 0 ? 48000 : (fscod === 1 ? 44100 : (fscod === 2 ? 32000 : 0));
  res.tech.codec = 'AC-3';
  res.tech.lossless = false;
  res.tech.bsid = bsid;
  if (SR) res.tech.sampleRate = SR;
  res.tech.bitrate = AC3_BITRATE[frmsizecod] || null;
  res.tech.channels = AC3_ACMOD[acmod];
  res.tech.channelLayout = AC3_CH[acmod] || '';
  let q = p, dur = 0, frames = 0;
  while (q + 6 <= b.length && frames < 200000) {
    if (!(b[q] === 0x0b && b[q + 1] === 0x77)) { q++; continue; }
    const fsc = (b[q + 4] >> 6) & 3, fsz = b[q + 4] & 0x3f;
    const sr = fsc === 1 ? 44100 : (fsc === 0 ? 48000 : 32000);
    const br = AC3_BITRATE[fsz];
    if (br == null) break;
    // AC-3 帧长 = 码率(bit/s) × 每帧采样数(1536) ÷ 采样率 ÷ 8。
    // 44.1 kHz 的帧长与 48/32 kHz 不同，不能从帧长码直接查固定表（那是 48 kHz 基准）。
    const want = Math.max(4, Math.round(br * 1000 * 1536 / (sr * 8)));
    dur += 1536 / sr;
    frames++;
    // 以下一个真正的同步字为准重新对齐（带容差，避开音频数据里偶发的伪同步字）；
    // 找不到下一个同步字说明已是最后一帧，直接结束。
    let next = -1;
    for (let n = q + 4; n + 1 < b.length; n++) {
      if (b[n] === 0x0b && b[n + 1] === 0x77) {
        const d = n - q;
        if (d >= want - 16 && d <= want + 24) { next = n; break; }
      }
    }
    if (next < 0) break;
    q = next;
  }
  if (frames >= 2) { res.tech.duration = Math.round(dur * 1000) / 1000; res.tech.frameCount = frames; }
}
// ── DTS ──
const DTS_SR = [8000, 16000, 32000, 0, 0, 0, 11025, 22050, 44100, 0, 0, 0, 0, 0, 0, 0];
const DTS_BR = [32,56,64,96,112,128,192,224,256,320,384,448,512,576,640,768,960,1024,1152,1280,1344,1408,1411,1472,1536,0,0,0,0,0,0,0];
const DTS_AMODE = [[1,'1/0 (Mono)'],[2,'2/0 (Dual Mono)'],[2,'2/0 (Stereo)'],[2,'2/0 (Sum-Diff)'],[2,'2/0 (LT/RT)'],
  [3,'3/0 (C L R)'],[3,'2/1 (L R S)'],[4,'3/1 (C L R S)'],[4,'2/2 (L R SL SR)'],
  [5,'3/2 (C L R SL SR)'],[6,'3/2+LFE (5.1)'],[6,'3/2+LFE (5.1 Lt/Rt)'],
  [7,'3/3 (6.1)'],[8,'3/3+LFE (7.1)'],[0,''],[0,'']];
function fillDTS(b, res) {
  let p = 0;
  while (p + 4 <= b.length && !(b[p] === 0x7f && b[p + 1] === 0xfe && b[p + 2] === 0x80 && b[p + 3] === 0x01)) p++;
  if (p + 4 > b.length) return;
  const bitAt = (o, k) => (b[o + (k >> 3)] >> (7 - (k & 7))) & 1;
  const readBits = (o, k, n) => { let v = 0; for (let i = 0; i < n; i++) { v = (v << 1) | bitAt(o, k + i); } return v; };
  try {
    let k = 7; // frame type(1)+deficit(5)+crc(1)
    const nblks = readBits(p + 4, k, 7) + 1; k += 7;
    const fsize = readBits(p + 4, k, 14) + 1; k += 14;
    const amode = readBits(p + 4, k, 6); k += 6;
    const sfreq = readBits(p + 4, k, 4); k += 4;
    const rate = readBits(p + 4, k, 5); k += 5;
    res.tech.codec = 'DTS'; res.tech.lossless = false;
    if (DTS_SR[sfreq]) res.tech.sampleRate = DTS_SR[sfreq];
    if (DTS_BR[rate]) res.tech.bitrate = DTS_BR[rate];
    const am = DTS_AMODE[amode] || [null, ''];
    if (am[0]) res.tech.channels = am[0];
    res.tech.channelLayout = am[1];
    res.tech.frameSize = fsize;
    res.tech.samplesPerBlock = nblks * 32;
    let q = p, dur = 0, frames = 0;
    while (q + 4 <= b.length && frames < 200000) {
      if (!(b[q] === 0x7f && b[q + 1] === 0xfe && b[q + 2] === 0x80 && b[q + 3] === 0x01)) { q++; continue; }
      const nb = readBits(q + 4, 7, 7) + 1;
      const fs2 = readBits(q + 4, 21, 14) + 1;
      if (fs2 <= 4) break;
      dur += (nb * 32) / (DTS_SR[sfreq] || 44100);
      frames++; q += fs2;
    }
    if (frames >= 2) { res.tech.duration = Math.round(dur * 1000) / 1000; res.tech.frameCount = frames; }
  } catch (e) { /* ignore */ }
}

// 声道数 → 常见扬声器布局。AC-3 / DTS 的码流自带布局（用自己的），其余格式按声道数推导。
const CH_LAYOUT = { 1: '单声道 (Mono)', 2: '立体声 (Stereo)', 3: '2.1', 4: '四声道 (Quad)', 5: '5.0', 6: '5.1', 7: '6.1', 8: '7.1' };

// 声道标识（扬声器位置）—— MediaInfo 里显示的「声道布局 : L R」就是这个
const CH_IDS = { 1: 'M', 2: 'L R', 3: 'L R LFE', 4: 'L R Ls Rs', 5: 'L R C Ls Rs', 6: 'L R C LFE Ls Rs', 7: 'L R C LFE Ls Rs Lb', 8: 'L R C LFE Ls Rs Lb Rb' };

// 解码后 PCM 为「平面 (Planar)」的格式；其余视为「交错 (Interleaved)」。
// 交错 = 同一帧内各声道样本相邻存放（L R L R…）；平面 = 每个声道一整条独立序列（L…L R…R）。
// 规则：PCM / 无损容器 → 交错；有损编码与 DSD → 平面。
// 依据是主流解码器（FFmpeg：mp3/aac/vorbis/opus/wma/ac3/dts 解出来都是 fltp 平面浮点，DSD 是 dsd_*_planar；
// 而 wav/aiff/ape/flac/alac 解出来是交错整型）。编码前的码流本身不分交不交错。
const SAMPLE_PLANAR = new Set(['mp3', 'mp2', 'aac', 'ogg', 'opus', 'wma', 'ac3', 'dts', 'dsf', 'dff']);

// ── 主入口 ──
export function parseAudio(bytes, fileName) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const res = {
    fileName: fileName || '', fileSize: b.length, formatKey: 'unknown',
    tech: {}, tags: {}, tagsRaw: [], pictures: [], playlist: null,
  };
  try {
    let key = detectFormat(b, fileName);
    if (key === 'id3') key = guessFromExt(fileName) || 'mp3';
    res.formatKey = key;
    const m = META[key] || META.unknown;
    res.format = m.label; res.mime = m.mime;

    if (key === 'flac') fillFLAC(b, res);
    else if (key === 'ogg' || key === 'opus') fillOgg(b, res);
    else if (key === 'm4a') fillMP4(b, res);
    else if (key === 'wav') fillWAV(b, res);
    else if (key === 'aiff') fillAIFF(b, res);
    else if (key === 'ape') fillAPE(b, res);
    else if (key === 'wma') fillASF(b, res);
    else if (key === 'dsf') fillDSF(b, res);
    else if (key === 'dff') fillDFF(b, res);
    else if (key === 'm3u') fillM3U(b, res);
    else if (key === 'ac3') fillAC3(b, res);
    else if (key === 'dts') fillDTS(b, res);
    else if (key === 'iso') { res.tech.container = 'ISO 光盘镜像'; res.tech.note = 'SACD/ISO 镜像（未展开内部音轨）'; }
    else if (/^(mp3|mp2|mp1|aac|amr)$/.test(key)) fillMPEGAudio(b, res, key);

    // 通用：ID3v2（在开头）+ ID3v1（在结尾）；若容器另有 ID3 偏移则优先用它
    if (key !== 'm3u' && key !== 'iso') {
      if (res.tags.__id3off != null) { fillID3v2(b, res, res.tags.__id3off); delete res.tags.__id3off; }
      else if (!/^(flac|ogg|opus|m4a|dsf|dff)$/.test(key)) { fillID3v2(b, res, 0); }
      if (key === 'mp3' || key === 'mp2') fillID3v1(b, res);
    }
    if (res.tech.sampleRate && res.tech.totalSamples && !res.tech.duration) res.tech.duration = res.tech.totalSamples / res.tech.sampleRate;
    if (res.tech.duration) res.tech.duration = Math.round(res.tech.duration * 1000) / 1000;
    // 通用兜底码率：有些容器本身不存码率（典型是 FLAC 的 STREAMINFO —— 只有采样率/位深/总采样数），
    // 用「音频数据字节数 / 时长」估一个，别让「码率」整行缺失。
    // 优先用容器已知的音频数据大小（如 WAV 的 data 块），否则退回整个文件大小（含标签/封面，会略偏高）。
    if (!res.tech.bitrate && res.tech.duration > 0) {
      const bytes = res.tech.dataSize || res.tech.audioSize || b.length;
      const kbps = Math.round(bytes * 8 / res.tech.duration / 1000);
      if (kbps > 0 && kbps < 200000) { res.tech.bitrate = kbps; res.tech.bitrateEst = true; }
    }
    // 声道布局兜底：AC-3 / DTS 在各自解析器里已按码流设好，其余格式这里按声道数推导
    if (!res.tech.channelLayout && res.tech.channels) {
      res.tech.channelLayout = CH_LAYOUT[res.tech.channels] || (res.tech.channels + ' 声道');
    }
    // 样本交错布局（Interleaved / Planar）—— PCM/无损容器为交错，有损编码与 DSD 为平面
    if (res.tech.channels) {
      const fk = res.formatKey || '';
      // M4A 里 ALAC（无损）是交错、AAC（有损）是平面
      const planar = fk === 'm4a' ? /AAC/i.test(res.tech.codec || '') : SAMPLE_PLANAR.has(fk);
      res.tech.sampleLayout = planar ? '平面 (Planar)' : '交错 (Interleaved)';
      if (!res.tech.channelIds) res.tech.channelIds = CH_IDS[res.tech.channels] || '';
    }
    // 总体码率（容器层 = 文件大小 ÷ 时长）—— 与「码率」（音频流）不是一回事，MediaInfo 也是分两行列的
    if (res.tech.duration > 0) {
      res.tech.overallBitrate = Math.round(b.length * 8 / res.tech.duration / 1000);
      // 音频流占整个文件的比例（配合「流大小」看）
      if (res.tech.dataSize) {
        const pct = Math.round(res.tech.dataSize / b.length * 1000) / 10;
        if (pct > 0 && pct <= 100) res.tech.streamPct = pct;
      }
    }
  } catch (e) {
    res._error = String((e && e.message) || e);
  }
  return res;
}
function guessFromExt(name) {
  const ext = (String(name || '').split('.').pop() || '').toLowerCase();
  return { mp3: 'mp3', mp2: 'mp2', aac: 'aac', flac: 'flac', wav: 'wav', aiff: 'aiff', aif: 'aiff', ape: 'ape', wma: 'wma', m4a: 'm4a', alac: 'm4a', ogg: 'ogg', opus: 'opus', dsf: 'dsf', dff: 'dff', iso: 'iso', m3u: 'm3u', m3u8: 'm3u' }[ext] || '';
}
// 解析一个 MPEG 音频帧头；非法返回 null
function mpegHeader(b, p) {
  if (p + 4 > b.length) return null;
  if (b[p] !== 0xFF || (b[p + 1] & 0xE0) !== 0xE0) return null;
  const verBits = (b[p + 1] >> 3) & 3, layerBits = (b[p + 1] >> 1) & 3;
  const brIdx = (b[p + 2] >> 4) & 0xF, srIdx = (b[p + 2] >> 2) & 3, pad = (b[p + 2] >> 1) & 1;
  const chMode = (b[p + 3] >> 6) & 3;
  if (verBits === 1 || layerBits === 0 || srIdx === 3 || brIdx === 0 || brIdx === 15) return null;
  const srBase = [44100, 48000, 32000][srIdx];
  const sampleRate = verBits === 3 ? srBase : (verBits === 2 ? srBase / 2 : srBase / 4);
  const li = 3 - layerBits;
  const BRv1 = [[0,32,64,96,128,160,192,224,256,288,320,352,384,416,448],
    [0,32,48,56,64,80,96,112,128,160,192,224,256,320,384],
    [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320]];
  const BRv2 = [[0,32,48,56,64,80,96,112,128,144,160,176,192,224,256],
    [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160],
    [0,8,16,24,32,40,48,56,64,80,96,112,128,144,160]];
  const bitrate = (verBits === 3 ? BRv1 : BRv2)[li][brIdx];
  const spf = layerBits === 3 ? 384 : (verBits === 3 ? 1152 : 576);
  const frameLen = Math.floor((spf / 8) * bitrate * 1000 / sampleRate) + pad;
  return { verBits, layerBits, chMode, sampleRate, bitrate, spf, frameLen };
}
function findMpegFrame(b, from) {
  for (let p = from; p + 4 <= b.length; p++) {
    const h = mpegHeader(b, p);
    if (!h || h.frameLen < 4) continue;
    const h2 = mpegHeader(b, p + h.frameLen);
    if (h2 && h2.sampleRate === h.sampleRate && h2.layerBits === h.layerBits) return { p, h };
  }
  return null;
}
// 裸 MPEG 音频（MP3/MP2/MP1/AAC/AMR）
function fillMPEGAudio(b, res, key) {
  if (key === 'amr') { res.tech.codec = 'AMR'; res.tech.channels = 1; return; }
  if (key === 'aac') {
    if (b[0] === 0xFF && (b[1] & 0xF0) === 0xF0) {
      const profile = ((b[2] >> 6) & 3) + 1;
      const srIdx = (b[2] >> 2) & 0xf;
      const chCfg = ((b[2] & 1) << 2) | ((b[3] >> 6) & 3);
      res.tech.codec = 'AAC ' + ['', 'Main', 'LC', 'SSR', 'LTP'][profile];
      res.tech.sampleRate = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350][srIdx];
      res.tech.channels = chCfg; res.tech.lossless = false;
      let frames = 0, bytes = 0, p = 0, dur = 0;
      while (p + 7 <= b.length && b[p] === 0xFF && (b[p + 1] & 0xF0) === 0xF0 && frames < 20000) {
        const fl = ((b[p + 3] & 3) << 11) | (b[p + 4] << 3) | ((b[p + 5] >> 5) & 7);
        if (fl < 7) break;
        bytes += fl; frames++; p += fl; dur += 1024 / (res.tech.sampleRate || 44100);
      }
      if (frames) { res.tech.duration = Math.round(dur * 1000) / 1000; res.tech.bitrate = Math.round(bytes * 8 / dur / 1000); }
    }
    return;
  }
  let from = 0;
  if (sz(b, 0, 3) === 'ID3') from = 10 + syncsafe(b, 6);
  const found = findMpegFrame(b, from);
  if (!found) return;
  const h = found.h;
  const verName = ['MPEG 2.5', '', 'MPEG 2', 'MPEG 1'][h.verBits];
  const layerName = ['', 'Layer III', 'Layer II', 'Layer I'][h.layerBits];
  res.tech.codec = verName + ' ' + layerName;
  res.tech.lossless = false;
  res.tech.sampleRate = h.sampleRate;
  res.tech.channels = h.chMode === 3 ? 1 : 2;
  res.tech.channelMode = ['立体声 (Stereo)', '联合立体声 (Joint Stereo)', '双声道 (Dual)', '单声道 (Mono)'][h.chMode];
  res.tech.bitrate = h.bitrate;
  let p = found.p, dur = 0, frames = 0, bytes = 0;
  while (p + 4 <= b.length && frames < 300000) {
    const hh = mpegHeader(b, p);
    if (!hh || hh.frameLen < 4) break;
    dur += hh.spf / hh.sampleRate; bytes += hh.frameLen; frames++; p += hh.frameLen;
  }
  if (frames >= 3) {
    res.tech.frameCount = frames;
    res.tech.duration = Math.round(dur * 1000) / 1000;
    res.tech.bitrateAvg = Math.round(bytes * 8 / dur / 1000);
    res.tech.bitrateMode = (Math.abs(res.tech.bitrateAvg - h.bitrate) <= 2) ? 'CBR' : 'VBR';
  }
  // Xing / Info 头 + LAME 扩展：拿编码器标识（MP3 的 STREAMINFO 里没有这信息）
  // 位置 = 首帧头(4) + side info（MPEG1: 单声道 17 / 其他 32；MPEG2: 9 / 17）
  const sideInfo = (h.verBits === 3) ? (h.chMode === 3 ? 17 : 32) : (h.chMode === 3 ? 9 : 17);
  const xp = found.p + 4 + sideInfo;
  const xt = sz(b, xp, 4);
  if (xt === 'Xing' || xt === 'Info') {
    const xflags = u32be(b, xp + 4);
    let q = xp + 8;
    if (xflags & 1) q += 4;      // frames
    if (xflags & 2) q += 4;      // bytes
    if (xflags & 4) q += 100;    // TOC
    if (xflags & 8) q += 4;      // quality
    const lame = sz(b, q, 9);
    if (/^(LAME|GOGO|L3\.|Lavf|Lavc)/i.test(lame)) {
      res.tech.encoder = trimNul(lame);
      if (res.tech.bitrateMode === 'CBR' && xt === 'Xing') res.tech.bitrateMode = 'VBR';
    }
  }
}

