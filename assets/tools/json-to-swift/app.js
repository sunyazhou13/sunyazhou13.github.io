/**
 * JSON ↔ Swift Codable 互转工具（v1）
 * 纯原生 JS，零依赖，纯本地处理，不请求任何外部 API。
 *
 * 功能：
 *  - JSON → Swift (Codable)：推断类型，生成嵌套结构体 + CodingKeys
 *  - Swift → 示例 JSON：解析 struct 属性，生成合理测试数据
 *  - Swift / Objective-C 双语言输出
 *  - 蛇形命名开关（snake_case ↔ camelCase）
 */

(function () {
  'use strict';

  var app = document.getElementById('js2s-app');
  if (!app) return;

  // ---------- DOM ----------
  var input = app.querySelector('#js2s-input');
  var inputWrap = app.querySelector('#js2s-input-wrap');
  var inputPre = app.querySelector('#js2s-input-pre');
  var inputCode = app.querySelector('#js2s-input-code');
  var output = app.querySelector('#js2s-output'); // 隐藏 textarea，存原文供复制
  var outputWrap = app.querySelector('#js2s-output-wrap');
  var outputCode = app.querySelector('#js2s-output-code');
  var errorBox = app.querySelector('#js2s-error');
  var rootNameInput = app.querySelector('#js2s-rootname');
  var snakeToggle = app.querySelector('#js2s-snake');
  var inputLabel = app.querySelector('#js2s-input-label');
  var tabs = app.querySelectorAll('.js2s-tab');
  var dirToSwift = app.querySelector('#js2s-to-swift');
  var dirToJson = app.querySelector('#js2s-to-json');
  var copyInputBtn = app.querySelector('#js2s-copy-input');
  var copyOutputBtn = app.querySelector('#js2s-copy-output');
  var jsonIndentSel = app.querySelector('#js2s-json-indent');
  var swiftIndentSel = app.querySelector('#js2s-swift-indent');
  var swiftKindSel = app.querySelector('#js2s-swift-kind');
  var swiftOptSel = app.querySelector('#js2s-swift-opt');
  var formatBtn = app.querySelector('#js2s-format');

  // ---------- state ----------
  var lang = 'swift';      // 'swift' | 'objc'
  var mode = 'json';       // 'json' | 'swift'（当前输入模式）
  var outputMode = 'empty'; // 'code' | 'json' | 'empty'
  var currentSwift = '';
  var currentObjc = '';
  var jsonIndent = 2;
  var swiftIndent = 4;
  var swiftKind = 'struct';
  var swiftOptional = 'question';

  // ---------- 工具函数 ----------
  function showError(msg) {
    if (!msg) {
      errorBox.hidden = true;
      errorBox.textContent = '';
      return;
    }
    errorBox.hidden = false;
    errorBox.textContent = msg;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        resolve();
      } catch (e) { reject(e); }
    });
  }

  /**
   * 将代码/JSON 写入高亮显示区
   * @param {string} type 'swift' | 'json'
   * @param {string} text 原始文本
   */
  function setOutput(type, text) {
    if (!outputCode) return;
    // 写入 <code> 元素并触发 Highlight.js 高亮
    outputCode.textContent = text;
    ensureHljsThen(function () { applyHighlight(type); });
    outputMode = type === 'swift' ? 'code' : 'json';
  }

  function applyHighlight(type) {
    if (!outputCode || typeof hljs === 'undefined') return;
    if (type === 'swift') {
      outputCode.className = 'language-swift hljs';
      if (outputWrap) outputWrap.className = 'js2s-output-wrap';
    } else {
      outputCode.className = 'language-json hljs';
      if (outputWrap) outputWrap.className = 'js2s-output-wrap js2s-json-mode';
    }
    try {
      var lang = type === 'swift' ? 'swift' : 'json';
      var result = hljs.highlight(outputCode.textContent, { language: lang, ignoreIllegals: true });
      outputCode.innerHTML = result.value;
    } catch (e) {
      // 高亮失败保持原文
    }
  }

  /**
   * 实时同步输入区到高亮背景
   * @param {string} mode 'json' | 'swift' | 'auto'（自动根据 mode 决定）
   */
  function highlightInput(targetMode) {
    if (!inputCode) return;
    var useMode = targetMode || mode;
    var langClass = (useMode === 'swift') ? 'language-swift' : 'language-json';
    inputCode.className = langClass + ' hljs';
    if (inputWrap) {
      inputWrap.classList.toggle('js2s-input-json', useMode === 'json');
      inputWrap.classList.toggle('js2s-input-swift', useMode === 'swift');
    }
    // 优先用 hljs 高亮。失败或 hljs 未加载则只赋原文（不做 innerHTML 写入避免竞态）。
    var raw = input.value;
    if (typeof hljs !== 'undefined' && raw) {
      try {
        var lang = (useMode === 'swift') ? 'swift' : 'json';
        var result = hljs.highlight(raw, { language: lang, ignoreIllegals: true });
        if (result && typeof result.value === 'string') {
          inputCode.innerHTML = result.value;
        } else {
          inputCode.textContent = raw;
        }
      } catch (e) {
        inputCode.textContent = raw;
      }
    } else {
      inputCode.textContent = raw;
    }
  }

  function ensureHljsThen(cb) {
    if (typeof hljs !== 'undefined') { cb(); return; }
    // 全量包（包含所有语言，无需分语言加载）
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js';
    s.onload = function () { cb(); };
    s.onerror = function () {
      // 回退：core + swift + json
      var s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js';
      s2.onload = function () {
        var pending = 2;
        function done() { if (--pending <= 0) cb(); }
        ['swift','json'].forEach(function (lang) {
          var sk = document.createElement('script');
          sk.src = 'https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/languages/' + lang + '.min.js';
          sk.onload = done;
          document.head.appendChild(sk);
        });
      };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s);
  }

  var RESERVED = new Set([
    'class','struct','let','var','type','default','switch','func','init','self',
    'protocol','enum','extension','public','private','internal','static','return',
    'if','else','for','while','import','where','in','as','is','try','catch','throw',
    'nil','true','false','do','guard','case','break','continue','associatedtype',
    'deinit','subscript','super','mutating','nonmutating','override','required',
    'lazy','weak','unowned','finally','repeat','defer','get','set'
  ]);

  function sanitizeIdent(key) {
    var s = (key || '').trim();
    if (!s) s = 'field';
    s = s.replace(/[^0-9a-zA-Z_$]/g, '_');
    if (/^[0-9]/.test(s)) s = '_' + s;
    if (RESERVED.has(s)) s = '_' + s;
    return s;
  }

  function toCamel(key) {
    var parts = (key || '').trim().split(/[_\-\s]+/).filter(Boolean);
    if (parts.length === 0) return 'field';
    return parts.map(function (p, i) {
      if (i === 0) return p.charAt(0).toLowerCase() + p.slice(1);
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    }).join('');
  }

  function toPascal(name) {
    var camel = toCamel(name);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  }

  function singularize(name) {
    if (/ies$/i.test(name)) return name.slice(0, -3) + 'y';
    if (/(ses|xes|zes|ches|shes)$/i.test(name)) return name.slice(0, -2);
    if (/s$/i.test(name) && !/ss$/i.test(name)) return name.slice(0, -1);
    return name;
  }

  // =====================================================================
  //  JSON → Swift
  // =====================================================================

  // 推断 JSON 为一个带 id 的 schema 树，便于后续去重命名
  var objIdSeq = 0;
  function infer(value) {
    if (value === null || value === undefined) return { kind: 'null' };
    if (Array.isArray(value)) {
      if (value.length === 0) return { kind: 'array', elem: { kind: 'any' } };
      return { kind: 'array', elem: infer(value[0]) };
    }
    if (typeof value === 'object') {
      var node = { kind: 'object', id: ++objIdSeq, props: {} };
      Object.keys(value).forEach(function (k) {
        node.props[k] = infer(value[k]);
      });
      return node;
    }
    if (typeof value === 'boolean') return { kind: 'bool' };
    if (typeof value === 'number') return Number.isInteger(value) ? { kind: 'int' } : { kind: 'double' };
    if (typeof value === 'string') return { kind: 'string' };
    return { kind: 'any' };
  }

  var usedNames = new Set();
  var structMap = new Map();   // id -> entry
  var structList = [];

  function uniqueName(base) {
    base = toPascal(base) || 'Model';
    if (!usedNames.has(base)) { usedNames.add(base); return base; }
    var i = 2;
    while (usedNames.has(base + i)) i++;
    var n = base + i;
    usedNames.add(n);
    return n;
  }

  function typeString(node, nameHint, emit) {
    switch (node.kind) {
      case 'string': return 'String';
      case 'int': return 'Int';
      case 'double': return 'Double';
      case 'bool': return 'Bool';
      case 'null': return 'Any?';
      case 'any': return 'Any?';
      case 'array': return '[' + emit(node.elem, singularize(nameHint || 'Item'), emit) + ']';
      case 'object': return registerStruct(node, nameHint, emit);
      default: return 'Any?';
    }
  }

  function registerStruct(node, hint, emit) {
    if (structMap.has(node.id)) return structMap.get(node.id).name;
    var name = uniqueName(hint || 'Model');
    var entry = { name: name, fields: [] };
    structMap.set(node.id, entry);
    structList.push(entry);
    Object.keys(node.props).forEach(function (key) {
      var prop = snakeToggle.checked ? toCamel(key) : sanitizeIdent(key);
      var typeStr = emit(node.props[key], key, emit);
      entry.fields.push({
        key: key,
        prop: prop,
        typeStr: typeStr,
        hasCodingKey: prop !== key
      });
    });
    return name;
  }

  function indentStr(n) {
    if (n === 'tab') return '\t';
    var num = (typeof n === 'number') ? n : parseInt(n, 10);
    if (!(num >= 2)) num = 4;
    return new Array(num + 1).join(' ');
  }

  function defaultValueFor(type) {
    type = (type || '').trim();
    if (type === 'String') return '""';
    if (/^U?Int(eger)?\d*$/.test(type) || type === 'NSInteger' || type === 'NSUInteger') return '0';
    if (/^(Double|Float|CGFloat|Decimal)$/.test(type) || type === 'NSNumber') return '0';
    if (type === 'Bool' || type === 'BOOL') return 'false';
    if (type === 'Data' || type === 'NSData') return 'Data()';
    if (type === 'Date' || type === 'NSDate') return 'Date()';
    if (type === 'URL' || type === 'NSURL') return 'URL(string: "")!';
    if (type.indexOf('[') === 0) {
      if (/^\[[^\]]+:\s*/.test(type)) return '[:]';
      return '[]';
    }
    return type + '()';
  }

  function applyOptionalStyle(typeStr, style) {
    if (style === 'question') return typeStr;
    var isOpt = /[?!]\s*$/.test(typeStr);
    if (!isOpt) return typeStr;
    var base = typeStr.replace(/[?!]\s*$/, '').trim();
    if (style === 'force') return base + '!';
    if (style === 'explicit') return base + ' = ' + defaultValueFor(base);
    return typeStr;
  }

  function styleOpts() {
    return {
      jsonIndent: jsonIndent,
      swiftIndent: swiftIndent,
      swiftKind: swiftKind,
      swiftOptional: swiftOptional
    };
  }

  function generateSwift(rootName, schema, opts) {
    opts = opts || { swiftIndent: 4, swiftKind: 'struct', swiftOptional: 'question' };
    var ind = indentStr(opts.swiftIndent);
    usedNames = new Set();
    structMap = new Map();
    structList = [];
    registerStruct(schema, rootName || 'Root', typeString);
    var code = '';
    structList.forEach(function (st) {
      code += opts.swiftKind + ' ' + st.name + ': Codable {\n';
      st.fields.forEach(function (f) {
        code += ind + 'let ' + f.prop + ': ' + applyOptionalStyle(f.typeStr, opts.swiftOptional) + '\n';
      });
      var needsCoding = st.fields.some(function (f) { return f.hasCodingKey; });
      if (needsCoding) {
        code += '\n' + ind + 'enum CodingKeys: String, CodingKey {\n';
        st.fields.forEach(function (f) {
          if (f.hasCodingKey) code += ind + ind + 'case ' + f.prop + ' = "' + f.key + '"\n';
        });
        code += ind + '}\n';
      }
      code += '}\n\n';
    });
    return code.trimEnd() + '\n';
  }

  function objcType(sw) {
    sw = (sw || '').trim();
    if (sw.endsWith('?')) sw = sw.slice(0, -1).trim();
    var dict = sw.match(/^\[String:\s*(.+)\]$/);
    if (dict) {
      var vt = objcType(dict[1]).type;
      return { type: 'NSDictionary<NSString *, ' + vt + '> *', qualifier: 'copy' };
    }
    var arr = sw.match(/^\[(.+)\]$/);
    if (arr) {
      var et = objcType(arr[1]).type;
      return { type: 'NSArray<' + et + '> *', qualifier: 'copy' };
    }
    switch (sw) {
      case 'String': return { type: 'NSString *', qualifier: 'copy' };
      case 'Int': return { type: 'NSInteger', qualifier: 'assign' };
      case 'Double': return { type: 'double', qualifier: 'assign' };
      case 'Float': return { type: 'float', qualifier: 'assign' };
      case 'Bool': return { type: 'BOOL', qualifier: 'assign' };
      case 'Data': return { type: 'NSData *', qualifier: 'copy' };
      case 'Date': return { type: 'NSDate *', qualifier: 'copy' };
      case 'URL': return { type: 'NSURL *', qualifier: 'copy' };
      case 'Any': return { type: 'id', qualifier: 'copy' };
      default: return { type: sw + ' *', qualifier: 'copy' };
    }
  }

  function generateObjC(rootName, schema) {
    usedNames = new Set();
    structMap = new Map();
    structList = [];
    registerStruct(schema, rootName || 'Root', typeString);
    var header = '//\n//  ' + rootName + '.h\n//  Auto-generated from JSON schema\n//\n\n';
    header += '#import <Foundation/Foundation.h>\n\n';
    var blocks = [];
    structList.forEach(function (st) {
      // 第一遍：构建条目，统计最长前缀（含 qualifier）与最长类型
      var entries = [];
      var maxPrefixLen = 0;
      var maxTypeLen = 0;
      st.fields.forEach(function (f) {
        var oc = objcType(f.typeStr);
        var prefix = '@property (nonatomic, ' + oc.qualifier + ') ';
        if (prefix.length > maxPrefixLen) maxPrefixLen = prefix.length;
        if (oc.type.length > maxTypeLen) maxTypeLen = oc.type.length;
        entries.push({
          prefix: prefix,
          type: oc.type,
          propName: f.prop,
          hasCodingKey: f.hasCodingKey,
          key: f.key
        });
      });
      // 第二遍：同时补齐前缀（qualifier 长度差）与类型，让属性名对齐到同一列
      var padded = entries.map(function (e) {
        var prefixPad = ' '.repeat(maxPrefixLen - e.prefix.length);
        var typePad = ' '.repeat(maxTypeLen - e.type.length);
        var line = e.prefix + prefixPad + e.type + typePad + ' ' + e.propName + ';';
        if (e.hasCodingKey) {
          // 在 // 后注释 JSON 原 key（与 Swift CodingKeys 语义一致）
          line += ' // "' + e.key + '"';
        }
        return line;
      });
      var block = '@interface ' + st.name + ' : NSObject\n\n';
      padded.forEach(function (l) { block += l + '\n'; });
      block += '\n@end\n';
      blocks.push(block);
    });
    return header + blocks.join('\n');
  }

  function runJsonToSwift() {
    showError('');
    var text = input.value.trim();
    if (!text) { showError('请输入 JSON 文本'); return; }
    var data;
    try { data = JSON.parse(text); }
    catch (e) { showError('JSON 解析失败：' + e.message); return; }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      showError('JSON 根节点需要是一个对象（{}），暂不支持根数组或标量');
      return;
    }
    var schema = infer(data);
    var rootName = (rootNameInput.value.trim()) || 'Root';
    currentSwift = generateSwift(rootName, schema, styleOpts());
    currentObjc = generateObjC(rootName, schema);
    var code = (lang === 'swift') ? currentSwift : currentObjc;
    setOutput('swift', code);
    output.value = code;
  }

  // =====================================================================
  //  Swift → 示例 JSON
  // =====================================================================

  function findBlock(src, from) {
    var open = src.indexOf('{', from);
    if (open === -1) return null;
    var depth = 0;
    for (var i = open; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) return [open, i]; }
    }
    return null;
  }

  function parseSwift(src) {
    var s = src;
    // 去除注释与字符串字面量，避免其中大括号干扰解析
    s = s.replace(/\/\*[\s\S]*?\*\//g, ' ');
    s = s.replace(/\/\/[^\n]*/g, ' ');
    s = s.replace(/#"(?:[^"\\]|\\.)*?"#/g, ' "" ');
    s = s.replace(/"[^"\\]*(\\.[^"\\]*)*"/g, ' "" ');
    s = s.replace(/'[^'\\]*(\\.[^'\\]*)*'/g, " '' ");

    var structs = {}; // name -> innerText
    var re = /\bstruct\s+([A-Za-z_][A-Za-z0-9_]*)/g;
    var m;
    while ((m = re.exec(s)) !== null) {
      var name = m[1];
      var block = findBlock(s, m.index);
      if (!block) continue;
      if (!structs[name]) structs[name] = s.slice(block[0] + 1, block[1]);
    }

    var result = {};
    Object.keys(structs).forEach(function (n) {
      result[n] = parseProps(structs[n]);
    });
    return result;
  }

  function parseProps(inner) {
    // 跳过嵌套 struct / enum 块，避免其内部属性被算作父级属性
    var exclusions = [];
    var re = /\b(struct|enum)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
    var mm;
    while ((mm = re.exec(inner)) !== null) {
      var block = findBlock(inner, mm.index);
      if (block) exclusions.push([mm.index, block[1] + 1]);
    }
    function inExclusion(pos) {
      return exclusions.some(function (r) { return pos >= r[0] && pos <= r[1]; });
    }

    var props = [];
    var lines = inner.split('\n');
    var offset = 0;
    var propRe = /^\s*(?:let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^={}\n]+?)\s*(?:=\s*[^;{}\n]*)?$/;
    for (var li = 0; li < lines.length; li++) {
      var line = lines[li];
      var lineStart = offset;
      offset += line.length + 1;
      if (inExclusion(lineStart)) continue;
      var pm = line.match(propRe);
      if (pm) {
        var type = pm[2].trim();
        props.push({ name: pm[1], type: type });
      }
    }
    return props;
  }

  function splitTopLevel(str, sep) {
    var parts = [], depth = 0, cur = '';
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === '<') depth++;
      else if (ch === '>') depth--;
      if (ch === sep && depth === 0) { parts.push(cur); cur = ''; }
      else cur += ch;
    }
    parts.push(cur);
    return parts;
  }

  function matchDictionary(type) {
    type = type.trim();
    if (type.indexOf('Dictionary<') === 0 || /^Dict</i.test(type)) {
      var inner = type.slice(type.indexOf('<') + 1, type.lastIndexOf('>'));
      var parts = splitTopLevel(inner, ',');
      if (parts.length >= 2) return { keyType: parts[0].trim(), valType: parts.slice(1).join(',').trim() };
    }
    if (type.charAt(0) === '[' && type.charAt(type.length - 1) === ']') {
      var inr = type.slice(1, -1);
      var ci = inr.indexOf(':');
      if (ci !== -1) return { keyType: inr.slice(0, ci).trim(), valType: inr.slice(ci + 1).trim() };
    }
    return null;
  }

  function exampleValue(type, structMap, stack) {
    type = (type || '').trim().replace(/\?$/, '').trim();
    var dict = matchDictionary(type);
    if (dict) {
      if (/^Any\b/i.test(dict.valType.trim()) || dict.valType.trim() === '') return {};
      var sample = {};
      sample['key'] = exampleValue(dict.valType, structMap, stack);
      return sample;
    }
    var arr = type.match(/^\[(.+)\]$/);
    if (arr) {
      var inner = arr[1].trim();
      if (inner === '') return [];
      return [exampleValue(inner, structMap, stack)];
    }
    var am = type.match(/^Array<(.+)>$/i);
    if (am) return [exampleValue(am[1].trim(), structMap, stack)];
    var dm = type.match(/^Dictionary<(.+)>$/i);
    if (dm) {
      var dparts = splitTopLevel(dm[1].trim(), ',');
      if (dparts.length === 2) {
        var vt = dparts[1].trim();
        if (/^Any\b/i.test(vt)) return {};
        var o = {};
        o['key'] = exampleValue(vt, structMap, stack);
        return o;
      }
      return {};
    }
    var t = type.trim();
    if (/^Int/i.test(t) || /^UInt/i.test(t) || /^NS(?:U?Integer)$/i.test(t)) return 0;
    if (/^(Double|Float|CGFloat|Decimal|NSNumber)/i.test(t)) return 0.0;
    if (/^(Bool|BOOL)/i.test(t)) return false;
    if (/^(String|NSString|Character)/i.test(t)) return 'string';
    if (/^(Data|NSData)/i.test(t)) return '';
    if (/^(Date|NSDate)/i.test(t)) return '2024-01-01T00:00:00Z';
    if (/^(URL|NSURL)/i.test(t)) return 'https://example.com';
    if (/^(Any|id|AnyHashable)/i.test(t)) return null;
    if (structMap[t]) return buildExample(t, structMap, stack);
    return null;
  }

  function buildExample(name, structMap, stack) {
    if (stack.has(name)) return {};
    var props = structMap[name];
    if (!props) return {};
    var obj = {};
    stack.add(name);
    props.forEach(function (p) {
      obj[p.name] = exampleValue(p.type, structMap, stack);
    });
    stack.delete(name);
    return obj;
  }

  function runSwiftToJson() {
    showError('');
    var text = input.value;
    if (!text.trim()) { showError('请输入 Swift struct 代码'); return; }
    var smap;
    try { smap = parseSwift(text); }
    catch (e) { showError('Swift 解析失败：' + e.message); return; }
    var keys = Object.keys(smap);
    if (keys.length === 0) { showError('未找到任何 struct 定义'); return; }
    var rootName = (rootNameInput.value.trim()) || keys[0];
    if (!smap[rootName]) rootName = keys[0];
    try {
      var example = buildExample(rootName, smap, new Set());
      var jsonText = JSON.stringify(example, null, indentStr(jsonIndent));
      setOutput('json', jsonText);
      output.value = jsonText;
    } catch (e) {
      showError('生成示例 JSON 失败：' + e.message);
    }
  }

  // =====================================================================
  //  示例数据
  // =====================================================================

  var JSON_SAMPLE = [
    '{',
    '  "user_id": 12345,',
    '  "user_name": "sunyazhou",',
    '  "is_active": true,',
    '  "profile": {',
    '    "nick_name": "SY",',
    '    "age": 30,',
    '    "tags": ["iOS", "Swift"],',
    '    "score": 98.5',
    '  },',
    '  "roles": ["admin", "editor"],',
    '  "metadata": {',
    '    "level": 2,',
    '    "verified": false',
    '  }',
    '}'
  ].join('\n');

  var SWIFT_SAMPLE = [
    'struct User: Codable {',
    '    let id: Int',
    '    let name: String',
    '    let isVip: Bool',
    '    let profile: Profile',
    '    let tags: [String]',
    '    let posts: [Post]',
    '}',
    '',
    'struct Profile: Codable {',
    '    let age: Int',
    '    let nickname: String',
    '    let settings: [String: Int]',
    '}',
    '',
    'struct Post: Codable {',
    '    let title: String',
    '    let views: Int',
    '    let published: Bool',
    '}'
  ].join('\n');

  // =====================================================================
  //  事件绑定
  // =====================================================================

  function updateDirButtons() {
    dirToSwift.classList.toggle('js2s-btn-active', mode === 'json');
    dirToJson.classList.toggle('js2s-btn-active', mode === 'swift');
  }

  function setMode(newMode) {
    mode = newMode;
    if (inputLabel) {
      inputLabel.textContent = (mode === 'swift') ? '输入（Swift struct）' : '输入（JSON）';
    }
    // 切换模式时清空输出，避免新旧结果叠加
    output.value = '';
    if (outputCode) { outputCode.textContent = ''; outputCode.className = 'language-swift hljs'; }
    if (outputWrap) outputWrap.className = 'js2s-output-wrap';
    showError('');
    outputMode = 'empty';
    updateDirButtons();
    // 同步输入区高亮语言
    highlightInput();
  }

  app.querySelector('#js2s-to-swift').addEventListener('click', function () {
    setMode('json');
    runJsonToSwift();
  });

  app.querySelector('#js2s-to-json').addEventListener('click', function () {
    setMode('swift');
    runSwiftToJson();
  });

  // 右上角复制按钮（图标形式，悬停显示）
  function bindCopyBtn(btn, getText) {
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var text = getText();
      copyText(text).then(function () {
        btn.classList.add('js2s-copied');
        setTimeout(function () { btn.classList.remove('js2s-copied'); }, 1500);
      });
    });
  }
  bindCopyBtn(copyInputBtn, function () { return input.value; });
  bindCopyBtn(copyOutputBtn, function () { return output.value; });

  // 工具栏复制按钮（保持兼容）
  app.querySelector('#js2s-copy').addEventListener('click', function () {
    if (!output.value) { showError('没有可复制的内容'); return; }
    var btn = this;
    copyText(output.value).then(function () {
      var old = btn.textContent;
      btn.textContent = '已复制';
      btn.classList.add('js2s-copied');
      setTimeout(function () {
        btn.textContent = old;
        btn.classList.remove('js2s-copied');
      }, 1200);
    }).catch(function () {
      showError('复制失败，请手动选择文本复制');
    });
  });

  app.querySelector('#js2s-clear').addEventListener('click', function () {
    input.value = '';
    highlightInput();
    output.value = '';
    if (outputCode) { outputCode.textContent = ''; outputCode.className = 'language-swift hljs'; }
    if (outputWrap) outputWrap.className = 'js2s-output-wrap';
    showError('');
    outputMode = 'empty';
  });

  app.querySelector('#js2s-sample').addEventListener('click', function () {
    var text;
    if (mode === 'swift') {
      text = (typeof SWIFT_SAMPLE === 'string') ? SWIFT_SAMPLE : SWIFT_SAMPLE.join('\n');
    } else {
      text = (typeof JSON_SAMPLE === 'string') ? JSON_SAMPLE : JSON_SAMPLE.join('\n');
    }
    if (!text) { showError('示例数据为空'); return; }
    input.value = text;
    highlightInput();
    showError('');
    if (mode === 'json') runJsonToSwift();
    else runSwiftToJson();
  });

  snakeToggle.addEventListener('change', function () {
    if (outputMode === 'code') runJsonToSwift();
  });

  // 代码风格选择器 + 格式化按钮
  function syncStyleState() {
    jsonIndent = jsonIndentSel ? jsonIndentSel.value : 2;
    swiftIndent = swiftIndentSel ? swiftIndentSel.value : 4;
    swiftKind = swiftKindSel ? swiftKindSel.value : 'struct';
    swiftOptional = swiftOptSel ? swiftOptSel.value : 'question';
  }

  function reformatOutput() {
    if (outputMode === 'empty') {
      showError('请先点击「JSON → Swift」或「Swift → 示例 JSON」生成结果');
      return;
    }
    if (mode === 'json') runJsonToSwift();
    else runSwiftToJson();
  }

  [jsonIndentSel, swiftIndentSel, swiftKindSel, swiftOptSel].forEach(function (sel) {
    if (!sel) return;
    sel.addEventListener('change', function () {
      syncStyleState();
      reformatOutput();
    });
  });
  if (formatBtn) {
    formatBtn.addEventListener('click', function () {
      syncStyleState();
      reformatOutput();
    });
  }
  syncStyleState();

  Array.prototype.forEach.call(tabs, function (t) {
    t.addEventListener('click', function () {
      lang = t.dataset.lang;
      Array.prototype.forEach.call(tabs, function (x) {
        x.classList.toggle('js2s-tab-active', x === t);
      });
      if (outputMode === 'code') {
        var code = (lang === 'swift') ? currentSwift : currentObjc;
        setOutput('swift', code);
        output.value = code;
      }
    });
  });

  // 初始状态
  setMode('json');

  // ---------- 输入区高亮同步 ----------
  // 提前加载 hljs，供输入区高亮
  ensureHljsThen(function () { highlightInput(); });

  // 实时同步高亮背景（防抖 80ms）
  var hlDebounce = null;
  input.addEventListener('input', function () {
    inputCode.textContent = input.value;
    if (hlDebounce) clearTimeout(hlDebounce);
    hlDebounce = setTimeout(function () { highlightInput(); }, 80);
  });
  // 滚动同步：textarea 滚动时同步 pre
  input.addEventListener('scroll', function () {
    inputPre.scrollTop = input.scrollTop;
    inputPre.scrollLeft = input.scrollLeft;
  });
  // Tab 插入两个空格（不丢失焦点）
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      var start = this.selectionStart, end = this.selectionEnd;
      this.value = this.value.slice(0, start) + '  ' + this.value.slice(end);
      this.selectionStart = this.selectionEnd = start + 2;
      // 触发 input 事件
      this.dispatchEvent(new Event('input'));
    }
  });
})();
