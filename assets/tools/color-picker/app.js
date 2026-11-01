/**
 * 图片主色调提取工具 — 纯前端实现，图片不上传
 *
 * 功能：
 *   - 上传/拖拽图片 -> Canvas 读取全部像素 -> 量化算法提取主色调
 *   - 三种算法可选：K-Means 聚类 / 中值切割 / 直方图统计
 *   - 颜色数量与采样精度可调
 *   - 按占比排序输出 HEX + RGB，每个可一键复制
 *   - 生成 Swift / Objective-C / CSS / Android XML 代码片段
 *
 * 算法参考：
 *   - K-Means: Lloyd 1982 / MacQueen 1967，k-means++ 初始化（Arthur & Vassilvitskii 2007）
 *   - Median Cut: Heckbert SIGGRAPH 1982（Color Thief 同源）
 *   - Histogram: 3D 色彩直方图量化
 *
 * 无外部依赖，纯原生 JS + Canvas API。
 * 资源全部位于 /assets/tools/color-picker/，页面结构见 /tools/color-picker.md
 */

(function () {
  'use strict';

  var root = document.getElementById('cp-app');
  if (!root) return;

  var LANG = (document.documentElement.lang || 'zh').toLowerCase();
  if (LANG.indexOf('en') === 0) LANG = 'en';
  var I18N = {
    'zh': {
    'err-pixels': '图片像素不足，无法提取颜色',
    'err-nocolor': '未能提取到颜色，请尝试调整参数',
    'err-extra-pre': '提取失败：',
    'lbl-main': '主色调',
    'lbl-sub': '副色调',
    'lbl-accent': '点缀色',
    'lbl-extra-pre': '辅助色 ',
    'sw-title-pre': '// 图片主色调提取（',
    'sw-title-post': ' 色）',
    'sw-ui-pre': '// 从 HEX 创建 UIColor（便捷扩展）：',
    'sw-swiftui': '// SwiftUI Color 等价写法：',
    'sw-uic-func': '// 从 HEX 创建 UIColor（便捷函数）：',
    'sw-hex-parse': '// 或从 HEX 字符串解析：',
    'sw-hex-ext': '// 从 HEX 字符串创建（便捷扩展）：',
    'mark-imgpx': '// MARK: - 从 UIImage 提取像素',
    'mark-kmeans': '// MARK: - K-Means 聚类（k-means++ 初始化）',
    'ref-lloyd': '// 参考: Lloyd 1982 / Arthur & Vassilvitskii 2007',
    'kmeans-seed': '    // k-means++: 逐个选中心，优先选离已有中心最远的点',
    'lloyd-iter': '    // Lloyd 迭代: 分配 -> 更新 直到收敛',
    'avg-color': '    // 统计每个聚类的平均色与像素数',
    'euc-dist': '// 欧氏距离平方（避免 sqrt）',
    'mark-medcut': '// MARK: - 中值切割（Median Cut, Heckbert 1982）',
    'range-bucket': '        // 找 R/G/B 范围最大的桶',
    'median-cut': '        // 沿最大范围通道排序，从中位数切割',
    'bucket-avg': '    // 每个桶取平均色',
    'mark-histo': '// MARK: - 直方图统计（3D 直方图 + 相似色合并）',
    'rgb-for': '    // 将 RGB 量化到 4 位，组成 12-bit key',
    'desc-arr': '    // 转数组，按像素数降序',
    'greedy': '    // 贪心选 K 个，相似色（距离<30）合并为加权平均',
    'mark-usage': '// MARK: - 使用示例',
    'usage-call': '// let colors = kMeansClustering(pixels, k: 5)   // 或 medianCut / histogramQuantize',
    'rgb-struct': '// RGB 像素结构体',
    'pragma-imgpx': '#pragma mark - 从 UIImage 提取像素',
    'pragma-kmeans': '#pragma mark - K-Means 聚类（k-means++ 初始化）',
    'lloyd-iter-short': '    // Lloyd 迭代: 分配 -> 更新',
    'stat-res': '    // 统计结果',
    'sort-count': '    // 按 count 降序',
    'pragma-medcut': '#pragma mark - 中值切割（Median Cut, Heckbert 1982）',
    'bucket-range': '// 桶内范围计算',
    'nsarr': '    // 用 NSMutableArray 存桶，每桶是 NSMutableIndexSet',
    'pragma-histo': '#pragma mark - 直方图统计（3D 直方图 + 相似色合并）',
    'nsdict': '    // 用 NSMutableDictionary 存桶，key 为 12-bit 量化值',
    'arr-sort': '    // 转数组并排序',
    'greedy-short': '    // 贪心选 K 个，相似色合并',
    'pragma-usage': '#pragma mark - 使用示例',
    'c-kmeans': '/* K-Means 聚类（k-means++ 初始化）',
    'c-ref': ' * 参考: Lloyd 1982 / Arthur & Vassilvitskii 2007',
    'c-return': ' * 返回: [{ r, g, b, count }, ...] 按像素数降序',
    'c-seed': '  // k-means++: 逐个选中心',
    'c-update-center': '    // 更新中心为聚类均值',
    'c-stat-ret': '  // 统计并返回结果',
    'c-medcut': '/* 中值切割（Median Cut, Heckbert 1982）',
    'c-medcut-desc': ' * 反复找范围最大的桶，沿最长轴中位数切割',
    'c-sort-axle': '    // 沿最长通道排序，中位数切割',
    'c-med-avg': '  // 每个桶取平均色',
    'c-histo': '/* 直方图统计（3D 直方图 + 相似色合并）',
    'c-histo-quant': ' * 将 RGB 量化到 4 位，组 12-bit key',
    'c-histo-merge': ' * 相似色（距离<30）合并为加权平均',
    'c-arr-greedy': '  // 转数组排序，贪心选 K 个',
    'c-src-ref': '// 完整源码见 /assets/tools/color-picker/app.js',
    'copied': '已复制',
    'err-not-image': '请选择图片文件（PNG / JPEG / WebP / GIF / BMP 等）',
    'err-load-fail': '图片加载失败，请重试',
    'js-rand-pick': '    else { /* 按距离平方权重随机选 */ }',
    'js-lloyd': '  // Lloyd 迭代: 分配 -> 更新',
    'js-nearest': '    for (var i = 0; i < n; i++) { /* 找最近中心 */ }',
    'js-range-bucket': '    // 找 R/G/B 范围最大的桶',
    'js-quantize': '  for (var i = 0; i < n; i++) { /* 量化 + 累加 */ }',
    },
    'en': {
    'err-pixels': 'Not enough pixels in the image to extract colors',
    'err-nocolor': 'No colors could be extracted, please try adjusting the parameters',
    'err-extra-pre': 'Extraction failed: ',
    'lbl-main': 'Primary',
    'lbl-sub': 'Secondary',
    'lbl-accent': 'Accent',
    'lbl-extra-pre': 'Aux. color ',
    'sw-title-pre': '// Extract dominant colors (',
    'sw-title-post': ' colors)',
    'sw-ui-pre': '// Create a UIColor from HEX (convenience extension):',
    'sw-swiftui': '// SwiftUI Color equivalent:',
    'sw-uic-func': '// Create a UIColor from HEX (convenience function):',
    'sw-hex-parse': '// Or parse from a HEX string:',
    'sw-hex-ext': '// Create from a HEX string (convenience extension):',
    'mark-imgpx': '// MARK: - Extract pixels from UIImage',
    'mark-kmeans': '// MARK: - K-Means clustering (k-means++ initialization)',
    'ref-lloyd': '// Reference: Lloyd 1982 / Arthur & Vassilvitskii 2007',
    'kmeans-seed': '    // k-means++: pick centers one by one, preferring points farthest from existing centers',
    'lloyd-iter': '    // Lloyd iteration: assign -> update until convergence',
    'avg-color': '    // Average color and pixel count of each cluster',
    'euc-dist': '// Squared Euclidean distance (avoiding sqrt)',
    'mark-medcut': '// MARK: - Median Cut (Heckbert 1982)',
    'range-bucket': '        // Find the bucket with the widest R/G/B range',
    'median-cut': '        // Sort by the widest channel, cut at the median',
    'bucket-avg': '    // Average color of each bucket',
    'mark-histo': '// MARK: - Histogram quantization (3D histogram + similar-color merging)',
    'rgb-for': '    // Quantize RGB to 4 bits per channel, forming a 12-bit key',
    'desc-arr': '    // Convert to an array, sorted by pixel count descending',
    'greedy': '    // Greedily pick K, merging similar colors (distance < 30) as weighted average',
    'mark-usage': '// MARK: - Usage example',
    'usage-call': '// let colors = kMeansClustering(pixels, k: 5)   // or medianCut / histogramQuantize',
    'rgb-struct': '// RGB pixel struct',
    'pragma-imgpx': '#pragma mark - Extract pixels from UIImage',
    'pragma-kmeans': '#pragma mark - K-Means clustering (k-means++ initialization)',
    'lloyd-iter-short': '    // Lloyd iteration: assign -> update',
    'stat-res': '    // Aggregate the result',
    'sort-count': '    // Sort by count descending',
    'pragma-medcut': '#pragma mark - Median Cut (Heckbert 1982)',
    'bucket-range': '// Bucket range calculation',
    'nsarr': '    // Use NSMutableArray for buckets, each bucket is an NSMutableIndexSet',
    'pragma-histo': '#pragma mark - Histogram quantization (3D histogram + similar-color merging)',
    'nsdict': '    // Use NSMutableDictionary for buckets, key is the 12-bit quantized value',
    'arr-sort': '    // Convert to an array and sort',
    'greedy-short': '    // Greedily pick K, merging similar colors',
    'pragma-usage': '#pragma mark - Usage example',
    'c-kmeans': '/* K-Means clustering (k-means++ initialization)',
    'c-ref': ' * Reference: Lloyd 1982 / Arthur & Vassilvitskii 2007',
    'c-return': ' * Returns: [{ r, g, b, count }, ...] sorted by pixel count descending',
    'c-seed': '  // k-means++: pick centers one by one',
    'c-update-center': '    // Update centers to the cluster mean',
    'c-stat-ret': '  // Aggregate and return the result',
    'c-medcut': '/* Median Cut (Heckbert 1982)',
    'c-medcut-desc': ' * Repeatedly take the widest-range bucket and cut it at the median along the longest axis',
    'c-sort-axle': '    // Sort by the longest channel, cut at the median',
    'c-med-avg': '  // Average color of each bucket',
    'c-histo': '/* Histogram quantization (3D histogram + similar-color merging)',
    'c-histo-quant': ' * Quantize RGB to 4 bits per channel, building a 12-bit key',
    'c-histo-merge': ' * Similar colors (distance < 30) are merged as a weighted average',
    'c-arr-greedy': '  // Convert to an array, sort, and greedily pick K',
    'c-src-ref': '// Full source: /assets/tools/color-picker/app.js',
    'copied': 'Copied',
    'err-not-image': 'Please choose an image file (PNG / JPEG / WebP / GIF / BMP, etc.)',
    'err-load-fail': 'Failed to load the image, please try again',
    'js-rand-pick': '    else { /* pick randomly weighted by squared distance */ }',
    'js-lloyd': '  // Lloyd iteration: assign -> update',
    'js-nearest': '    for (var i = 0; i < n; i++) { /* find nearest center */ }',
    'js-range-bucket': '    // find the bucket with the widest R/G/B range',
    'js-quantize': '  for (var i = 0; i < n; i++) { /* quantize + accumulate */ }',
    }
  };
  function t(key) { var v = (I18N[LANG] || {})[key]; return v != null ? v : key; }

  var els = {
    drop: document.getElementById('cp-drop'),
    file: document.getElementById('cp-file'),
    choose: document.getElementById('cp-choose'),
    workarea: document.getElementById('cp-workarea'),
    canvas: document.getElementById('cp-canvas'),
    imgInfo: document.getElementById('cp-img-info'),
    algo: document.getElementById('cp-algo'),
    count: document.getElementById('cp-count'),
    quality: document.getElementById('cp-quality'),
    extract: document.getElementById('cp-extract'),
    loading: document.getElementById('cp-loading'),
    palettePanel: document.getElementById('cp-palette-panel'),
    palette: document.getElementById('cp-palette'),
    codePanel: document.getElementById('cp-code-panel'),
    tabs: document.getElementById('cp-tabs'),
    codeOutput: document.getElementById('cp-code-output'),
    copyCode: document.getElementById('cp-copy-code'),
    algoPanel: document.getElementById('cp-algo-src-panel'),
    algoTabs: document.getElementById('cp-algo-src-tabs'),
    algoOutput: document.getElementById('cp-algo-src-output'),
    copyAlgo: document.getElementById('cp-copy-algo'),
    error: document.getElementById('cp-error')
  };

  var state = {
    ctx: null,
    imgW: 0,
    imgH: 0,
    colors: [],
    activeLang: 'swift',
    activeAlgoSrc: 'swift'
  };

  function txt(n) { return n == null ? '' : String(n); }

  function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
  }

  function clearError() {
    els.error.hidden = true;
  }

  /* ---------- 颜色转换 ---------- */

  function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ---------- 像素采样 ---------- */

  function getPixels(step) {
    var imageData = state.ctx.getImageData(0, 0, state.imgW, state.imgH);
    var data = imageData.data;
    var pixels = [];
    for (var y = 0; y < state.imgH; y += step) {
      for (var x = 0; x < state.imgW; x += step) {
        var idx = (y * state.imgW + x) * 4;
        if (data[idx + 3] < 128) continue;
        pixels.push(data[idx], data[idx + 1], data[idx + 2]);
      }
    }
    return pixels;
  }

  /* ---------- 算法 1：K-Means 聚类（k-means++ 初始化） ---------- */

  function kMeans(pixels, k, maxIter) {
    var n = pixels.length / 3;
    if (n < k) k = n;
    if (k < 1) return [];

    /* k-means++ 初始化 */
    var centroids = [];
    var firstIdx = Math.floor(Math.random() * n) * 3;
    centroids.push([pixels[firstIdx], pixels[firstIdx + 1], pixels[firstIdx + 2]]);

    for (var c = 1; c < k; c++) {
      var dists = [];
      var total = 0;
      for (var i = 0; i < n; i++) {
        var idx = i * 3;
        var minD = Infinity;
        for (var j = 0; j < centroids.length; j++) {
          var dr = pixels[idx] - centroids[j][0];
          var dg = pixels[idx + 1] - centroids[j][1];
          var db = pixels[idx + 2] - centroids[j][2];
          var d = dr * dr + dg * dg + db * db;
          if (d < minD) minD = d;
        }
        dists.push(minD);
        total += minD;
      }
      if (total === 0) {
        var ri = Math.floor(Math.random() * n) * 3;
        centroids.push([pixels[ri], pixels[ri + 1], pixels[ri + 2]]);
      } else {
        var r = Math.random() * total;
        var cum = 0;
        for (var i = 0; i < n; i++) {
          cum += dists[i];
          if (cum >= r) {
            var idx = i * 3;
            centroids.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
            break;
          }
        }
      }
    }

    /* 迭代 */
    var assignments = new Array(n);
    for (var iter = 0; iter < maxIter; iter++) {
      var changed = false;
      for (var i = 0; i < n; i++) {
        var idx = i * 3;
        var minD = Infinity, minC = 0;
        for (var c = 0; c < k; c++) {
          var dr = pixels[idx] - centroids[c][0];
          var dg = pixels[idx + 1] - centroids[c][1];
          var db = pixels[idx + 2] - centroids[c][2];
          var d = dr * dr + dg * dg + db * db;
          if (d < minD) { minD = d; minC = c; }
        }
        if (assignments[i] !== minC) {
          assignments[i] = minC;
          changed = true;
        }
      }
      if (!changed && iter > 0) break;

      var sums = [], counts = [];
      for (var c = 0; c < k; c++) { sums.push([0, 0, 0]); counts.push(0); }
      for (var i = 0; i < n; i++) {
        var idx = i * 3;
        var c = assignments[i];
        sums[c][0] += pixels[idx];
        sums[c][1] += pixels[idx + 1];
        sums[c][2] += pixels[idx + 2];
        counts[c]++;
      }
      for (var c = 0; c < k; c++) {
        if (counts[c] > 0) {
          centroids[c] = [
            Math.round(sums[c][0] / counts[c]),
            Math.round(sums[c][1] / counts[c]),
            Math.round(sums[c][2] / counts[c])
          ];
        }
      }
    }

    /* 最终统计 */
    var sums2 = [], counts2 = [];
    for (var c = 0; c < k; c++) { sums2.push([0, 0, 0]); counts2.push(0); }
    for (var i = 0; i < n; i++) {
      var idx = i * 3;
      var minD = Infinity, minC = 0;
      for (var c = 0; c < k; c++) {
        var dr = pixels[idx] - centroids[c][0];
        var dg = pixels[idx + 1] - centroids[c][1];
        var db = pixels[idx + 2] - centroids[c][2];
        var d = dr * dr + dg * dg + db * db;
        if (d < minD) { minD = d; minC = c; }
      }
      sums2[minC][0] += pixels[idx];
      sums2[minC][1] += pixels[idx + 1];
      sums2[minC][2] += pixels[idx + 2];
      counts2[minC]++;
    }

    var result = [];
    for (var c = 0; c < k; c++) {
      if (counts2[c] > 0) {
        result.push({
          r: Math.round(sums2[c][0] / counts2[c]),
          g: Math.round(sums2[c][1] / counts2[c]),
          b: Math.round(sums2[c][2] / counts2[c]),
          count: counts2[c]
        });
      }
    }
    result.sort(function (a, b) { return b.count - a.count; });
    return result;
  }

  /* ---------- 算法 2：中值切割（Median Cut） ---------- */

  function bucketRange(bucket, pixels) {
    var minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
    for (var i = 0; i < bucket.length; i++) {
      var idx = bucket[i] * 3;
      var r = pixels[idx], g = pixels[idx + 1], b = pixels[idx + 2];
      if (r < minR) minR = r; if (r > maxR) maxR = r;
      if (g < minG) minG = g; if (g > maxG) maxG = g;
      if (b < minB) minB = b; if (b > maxB) maxB = b;
    }
    var rR = maxR - minR, gR = maxG - minG, bR = maxB - minB;
    var max = rR, ch = 0;
    if (gR > max) { max = gR; ch = 1; }
    if (bR > max) { max = bR; ch = 2; }
    return { max: max, channel: ch };
  }

  function medianCut(pixels, k) {
    var n = pixels.length / 3;
    if (n < k) k = n;
    if (k < 1) return [];

    var allIdx = [];
    for (var i = 0; i < n; i++) allIdx.push(i);
    var buckets = [allIdx];

    while (buckets.length < k) {
      var maxRange = 0, maxBucket = -1, maxCh = 0;
      for (var b = 0; b < buckets.length; b++) {
        if (buckets[b].length < 2) continue;
        var r = bucketRange(buckets[b], pixels);
        if (r.max > maxRange) {
          maxRange = r.max;
          maxBucket = b;
          maxCh = r.channel;
        }
      }
      if (maxBucket === -1) break;

      var ch = maxCh;
      buckets[maxBucket].sort(function (a, b) {
        return pixels[a * 3 + ch] - pixels[b * 3 + ch];
      });
      var mid = Math.floor(buckets[maxBucket].length / 2);
      var b1 = buckets[maxBucket].slice(0, mid);
      var b2 = buckets[maxBucket].slice(mid);
      buckets.splice(maxBucket, 1, b1, b2);
    }

    var result = [];
    for (var b = 0; b < buckets.length; b++) {
      if (buckets[b].length === 0) continue;
      var sr = 0, sg = 0, sb = 0;
      for (var i = 0; i < buckets[b].length; i++) {
        var idx = buckets[b][i] * 3;
        sr += pixels[idx]; sg += pixels[idx + 1]; sb += pixels[idx + 2];
      }
      var cnt = buckets[b].length;
      result.push({
        r: Math.round(sr / cnt),
        g: Math.round(sg / cnt),
        b: Math.round(sb / cnt),
        count: cnt
      });
    }
    result.sort(function (a, b) { return b.count - a.count; });
    return result;
  }

  /* ---------- 算法 3：直方图统计（带相似色合并） ---------- */

  function histogram(pixels, k) {
    var n = pixels.length / 3;
    if (n === 0) return [];

    var BITS = 4;
    var SHIFT = 8 - BITS;
    var bins = {};

    for (var i = 0; i < n; i++) {
      var idx = i * 3;
      var r = pixels[idx] >> SHIFT;
      var g = pixels[idx + 1] >> SHIFT;
      var b = pixels[idx + 2] >> SHIFT;
      var key = (r << 8) | (g << 4) | b;
      if (!bins[key]) bins[key] = { r: 0, g: 0, b: 0, count: 0 };
      bins[key].r += pixels[idx];
      bins[key].g += pixels[idx + 1];
      bins[key].b += pixels[idx + 2];
      bins[key].count++;
    }

    var arr = [];
    for (var key in bins) {
      var b = bins[key];
      arr.push({
        r: Math.round(b.r / b.count),
        g: Math.round(b.g / b.count),
        b: Math.round(b.b / b.count),
        count: b.count
      });
    }
    arr.sort(function (a, b) { return b.count - a.count; });

    /* 贪心选取 K 个彼此差异足够大的颜色，相似色合并 */
    var result = [];
    var threshold = 30;
    for (var i = 0; i < arr.length && result.length < k; i++) {
      var c = arr[i];
      var dup = false;
      for (var j = 0; j < result.length; j++) {
        var dr = c.r - result[j].r;
        var dg = c.g - result[j].g;
        var db = c.b - result[j].b;
        if (dr * dr + dg * dg + db * db < threshold * threshold) {
          var tc = result[j].count + c.count;
          result[j].r = Math.round((result[j].r * result[j].count + c.r * c.count) / tc);
          result[j].g = Math.round((result[j].g * result[j].count + c.g * c.count) / tc);
          result[j].b = Math.round((result[j].b * result[j].count + c.b * c.count) / tc);
          result[j].count = tc;
          dup = true;
          break;
        }
      }
      if (!dup) result.push({ r: c.r, g: c.g, b: c.b, count: c.count });
    }
    result.sort(function (a, b) { return b.count - a.count; });
    return result;
  }

  /* ---------- 提取主流程 ---------- */

  function runExtract() {
    if (!state.ctx) return;
    clearError();

    var step = parseInt(els.quality.value, 10);
    var k = parseInt(els.count.value, 10);
    var algo = els.algo.value;

    els.loading.hidden = false;
    els.palettePanel.hidden = true;
    els.codePanel.hidden = true;
    els.extract.disabled = true;

    /* 延迟一帧让 UI 更新后再开始重计算 */
    setTimeout(function () {
      try {
        var pixels = getPixels(step);
        if (pixels.length < 3) {
          showError(t('err-pixels'));
          return;
        }
        var totalPixels = pixels.length / 3;

        var colors;
        if (algo === 'kmeans') {
          colors = kMeans(pixels, k, 12);
        } else if (algo === 'mediancut') {
          colors = medianCut(pixels, k);
        } else {
          colors = histogram(pixels, k);
        }

        if (colors.length === 0) {
          showError(t('err-nocolor'));
          return;
        }

        /* 补全 HEX 和占比 */
        for (var i = 0; i < colors.length; i++) {
          colors[i].hex = rgbToHex(colors[i].r, colors[i].g, colors[i].b);
          colors[i].pct = (colors[i].count / totalPixels * 100);
        }

        state.colors = colors;
        renderPalette(colors, totalPixels);
        generateCode(colors);
        els.palettePanel.hidden = false;
        els.codePanel.hidden = false;
      } catch (e) {
        showError(t('err-extra-pre') + txt(e.message || e));
      } finally {
        els.loading.hidden = true;
        els.extract.disabled = false;
      }
    }, 30);
  }

  /* ---------- 调色板渲染 ---------- */

  var LABELS = [t('lbl-main'), t('lbl-sub'), t('lbl-accent')];

  /* 感知亮度（Rec. 601 luma），用于色块上文字配色 */
  function luminance(r, g, b) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function renderPalette(colors, totalPixels) {
    var html = '';
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      var label = i < LABELS.length ? LABELS[i] : t('lbl-extra-pre') + (i + 1);
      var pctStr = c.pct.toFixed(1);
      var hexUp = c.hex.toUpperCase();
      var lum = luminance(c.r, c.g, c.b);
      var textColor = lum > 0.55 ? '#000' : '#fff';
      var bgClass = lum > 0.55 ? 'cp-light-bg' : 'cp-dark-bg';
      html += '<div class="cp-color-item ' + bgClass + '" style="background:' + c.hex + ';color:' + textColor + '">' +
        '<span class="cp-color-tag">' + label + '</span>' +
        '<code class="cp-color-hex">' + hexUp + '</code>' +
        '<span class="cp-color-rgb">RGB(' + c.r + ', ' + c.g + ', ' + c.b + ')</span>' +
        '<span class="cp-color-pct">' + pctStr + '%</span>' +
        '<div class="cp-color-actions">' +
          '<button type="button" class="cp-btn cp-btn-copy" data-copy-value="' + hexUp + '">HEX</button>' +
          '<button type="button" class="cp-btn cp-btn-copy" data-copy-value="rgb(' + c.r + ', ' + c.g + ', ' + c.b + ')">RGB</button>' +
        '</div>' +
      '</div>';
    }
    els.palette.innerHTML = html;
  }

  /* ---------- 代码生成 ---------- */

  /* 轻量级语法高亮 — 单次正则扫描，交替匹配捕获组：
     1 行注释  2 XML注释  3 块注释  4 字符串  5 HEX色值
     6 0x数字  7 十进制数  8 关键字  9 类型名  10 CSS变量 */
  function highlightCode(code) {
    var s = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var re = /(\/\/[^\n]*)|(&lt;!--[\s\S]*?--&gt;)|(\/\*[\s\S]*?\*\/)|('[^']*'|"[^"]*")|(#[0-9A-Fa-f]{3,8}\b)|(0x[0-9A-Fa-f]+)|(\b\d+\.?\d*[fF]?\b)|\b(val|var|let|const|int|float|double|import|func|class|struct|enum|return|if|else|for|in|public|private|static|package)\b|\b([A-Z][a-zA-Z0-9_]*)\b|(--[a-z][-a-z0-9]*)/g;
    return s.replace(re, function(m, c1, c2, c3, s1, h, n1, n2, k, t, v) {
      if (c1 || c2 || c3) return '<span class="tok-c">' + m + '</span>';
      if (s1) return '<span class="tok-s">' + m + '</span>';
      if (h) return '<span class="tok-h">' + m + '</span>';
      if (n1 || n2) return '<span class="tok-n">' + m + '</span>';
      if (k) return '<span class="tok-k">' + m + '</span>';
      if (t) return '<span class="tok-t">' + m + '</span>';
      if (v) return '<span class="tok-v">' + m + '</span>';
      return m;
    });
  }

  function generateCode(colors) {
    var lang = state.activeLang;
    var code = '';
    if (lang === 'swift') code = genSwift(colors);
    else if (lang === 'objc') code = genObjC(colors);
    else if (lang === 'kotlin') code = genKotlin(colors);
    else if (lang === 'java') code = genJava(colors);
    else if (lang === 'arkts') code = genArkTS(colors);
    else code = genDart(colors);
    els.codeOutput.innerHTML = highlightCode(code);
  }

  /* ---------- Swift ---------- */

  function genSwift(colors) {
    var lines = [t('sw-title-pre') + colors.length + t('sw-title-post')];
    lines.push('import UIKit');
    lines.push('');
    lines.push(t('sw-ui-pre'));
    lines.push('extension UIColor {');
    lines.push('    convenience init(hex: String, alpha: CGFloat = 1.0) {');
    lines.push('        let v = UInt32(hex.dropFirst(), radix: 16) ?? 0');
    lines.push('        self.init(red: CGFloat((v >> 16) & 0xFF) / 255.0,');
    lines.push('                  green: CGFloat((v >> 8) & 0xFF) / 255.0,');
    lines.push('                  blue: CGFloat(v & 0xFF) / 255.0, alpha: alpha)');
    lines.push('    }');
    lines.push('}');
    lines.push('');
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      lines.push('// ' + (i + 1) + '. ' + c.hex.toUpperCase() + ' (' + c.pct.toFixed(1) + '%)');
      lines.push('let color' + (i + 1) + ' = UIColor(hex: "' + c.hex.toUpperCase() + '")');
    }
    lines.push('');
    lines.push(t('sw-swiftui'));
    lines.push('extension Color { init(hex: String) { self.init(UIColor(hex: hex)) } }');
    lines.push('');
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      lines.push('let color' + (i + 1) + ' = Color(hex: "' + c.hex.toUpperCase() + '")');
    }
    return lines.join('\n');
  }

  /* ---------- Objective-C ---------- */

  function genObjC(colors) {
    var lines = [t('sw-title-pre') + colors.length + t('sw-title-post')];
    lines.push('');
    lines.push(t('sw-uic-func'));
    lines.push('static inline UIColor *UIColorFromHex(NSString *hex) {');
    lines.push('    NSScanner *s = [NSScanner scannerWithString:[hex substringFromIndex:1]];');
    lines.push('    unsigned v = 0; [s scanHexInt:&v];');
    lines.push('    return [UIColor colorWithRed:((v >> 16) & 0xFF) / 255.0');
    lines.push('                           green:((v >> 8) & 0xFF) / 255.0');
    lines.push('                            blue:(v & 0xFF) / 255.0 alpha:1.0];');
    lines.push('}');
    lines.push('');
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      lines.push('// ' + (i + 1) + '. ' + c.hex.toUpperCase() + ' (' + c.pct.toFixed(1) + '%)');
      lines.push('UIColor *color' + (i + 1) + ' = UIColorFromHex(@"' + c.hex.toUpperCase() + '");');
    }
    return lines.join('\n');
  }

  /* ---------- Kotlin（Jetpack Compose） ---------- */

  function genKotlin(colors) {
    var lines = [t('sw-title-pre') + colors.length + t('sw-title-post')];
    lines.push('import androidx.compose.ui.graphics.Color');
    lines.push('');
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      var argb = '0xFF' + c.hex.slice(1).toUpperCase();
      lines.push('// ' + (i + 1) + '. ' + c.hex.toUpperCase() + ' (' + c.pct.toFixed(1) + '%)');
      lines.push('val color' + (i + 1) + ' = Color(' + argb + ')');
    }
    lines.push('');
    lines.push(t('sw-hex-parse'));
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      lines.push('val color' + (i + 1) + ' = Color(android.graphics.Color.parseColor("' + c.hex.toUpperCase() + '"))');
    }
    return lines.join('\n');
  }

  /* ---------- Java（Android） ---------- */

  function genJava(colors) {
    var lines = [t('sw-title-pre') + colors.length + t('sw-title-post')];
    lines.push('import android.graphics.Color;');
    lines.push('');
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      lines.push('// ' + (i + 1) + '. ' + c.hex.toUpperCase() + ' (' + c.pct.toFixed(1) + '%)');
      lines.push('int color' + (i + 1) + ' = Color.parseColor("' + c.hex.toUpperCase() + '");');
    }
    return lines.join('\n');
  }

  /* ---------- ArkTS（HarmonyOS ArkUI） ---------- */

  function genArkTS(colors) {
    var lines = [t('sw-title-pre') + colors.length + t('sw-title-post')];
    lines.push('');
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      lines.push('// ' + (i + 1) + '. ' + c.hex.toUpperCase() + ' (' + c.pct.toFixed(1) + '%)');
      lines.push('const color' + (i + 1) + ': ResourceColor = \'' + c.hex.toUpperCase() + '\'');
    }
    return lines.join('\n');
  }

  /* ---------- Dart（Flutter） ---------- */

  function genDart(colors) {
    var lines = [t('sw-title-pre') + colors.length + t('sw-title-post')];
    lines.push("import 'package:flutter/material.dart';");
    lines.push('');
    lines.push(t('sw-hex-ext'));
    lines.push('extension HexColor on Color {');
    lines.push('  static Color fromHex(String hex) {');
    lines.push('    final v = int.parse(hex.substring(1), radix: 16);');
    lines.push('    return Color(v | 0xFF000000);');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    for (var i = 0; i < colors.length; i++) {
      var c = colors[i];
      lines.push('// ' + (i + 1) + '. ' + c.hex.toUpperCase() + ' (' + c.pct.toFixed(1) + '%)');
      lines.push('final color' + (i + 1) + ' = HexColor.fromHex(\'' + c.hex.toUpperCase() + '\')');
    }
    return lines.join('\n');
  }

  /* ---------- 算法源码展示 ---------- */

  function renderAlgoSource() {
    var lang = state.activeAlgoSrc;
    var code = '';
    if (lang === 'swift') code = genAlgoSwift();
    else if (lang === 'objc') code = genAlgoObjC();
    else code = genAlgoJS();
    els.algoOutput.innerHTML = highlightCode(code);
  }

  /* Swift 版三种算法 */

  function genAlgoSwift() {
    var L = [];
    L.push(t('mark-imgpx'));
    L.push('func extractPixels(_ image: UIImage, maxDim: Int = 1200) -> [(r: Int, g: Int, b: Int)] {');
    L.push('    var w = Int(image.size.width), h = Int(image.size.height)');
    L.push('    if max(w, h) > maxDim {');
    L.push('        let s = CGFloat(maxDim) / CGFloat(max(w, h))');
    L.push('        w = Int(CGFloat(w) * s); h = Int(CGFloat(h) * s)');
    L.push('    }');
    L.push('    guard let cg = image.cgImage else { return [] }');
    L.push('    let space = CGColorSpaceCreateDeviceRGB()');
    L.push('    var raw = [UInt8](repeating: 0, count: w * h * 4)');
    L.push('    guard let ctx = CGContext(data: &raw, width: w, height: h,');
    L.push('        bitsPerComponent: 8, bytesPerRow: w * 4, space: space,');
    L.push('        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return [] }');
    L.push('    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))');
    L.push('    var px = [(r: Int, g: Int, b: Int)](); px.reserveCapacity(w * h)');
    L.push('    for i in 0..<(w * h) {');
    L.push('        px.append((Int(raw[i*4]), Int(raw[i*4+1]), Int(raw[i*4+2])))');
    L.push('    }');
    L.push('    return px');
    L.push('}');
    L.push('');
    L.push(t('mark-kmeans'));
    L.push(t('ref-lloyd'));
    L.push('func kMeansClustering(_ pixels: [(r: Int, g: Int, b: Int)],');
    L.push('                        k: Int, maxIter: Int = 12) -> [(r: Int, g: Int, b: Int, count: Int)] {');
    L.push('    let n = pixels.count; let actualK = min(k, n)');
    L.push('    guard actualK > 0 else { return [] }');
    L.push('');
    L.push(t('kmeans-seed'));
    L.push('    var centroids = [(r: Int, g: Int, b: Int)]()');
    L.push('    centroids.append(pixels[Int.random(in: 0..<n)])');
    L.push('    for _ in 1..<actualK {');
    L.push('        var dists = [Double](repeating: 0, count: n)');
    L.push('        var total = 0.0');
    L.push('        for i in 0..<n {');
    L.push('            var minD = Double.infinity');
    L.push('            for ctr in centroids {');
    L.push('                let d = sqDist(pixels[i], ctr)');
    L.push('                if d < minD { minD = d }');
    L.push('            }');
    L.push('            dists[i] = minD; total += minD');
    L.push('        }');
    L.push('        if total == 0 { centroids.append(pixels[Int.random(in: 0..<n)]) }');
    L.push('        else {');
    L.push('            let r = Double.random(in: 0..<total); var cum = 0.0');
    L.push('            for i in 0..<n { cum += dists[i]; if cum >= r { centroids.append(pixels[i]); break } }');
    L.push('        }');
    L.push('    }');
    L.push('');
    L.push(t('lloyd-iter'));
    L.push('    var assign = [Int](repeating: -1, count: n)');
    L.push('    for _ in 0..<maxIter {');
    L.push('        var changed = false');
    L.push('        for i in 0..<n {');
    L.push('            var minD = Double.infinity, minC = 0');
    L.push('            for c in 0..<centroids.count {');
    L.push('                let d = sqDist(pixels[i], centroids[c])');
    L.push('                if d < minD { minD = d; minC = c }');
    L.push('            }');
    L.push('            if assign[i] != minC { assign[i] = minC; changed = true }');
    L.push('        }');
    L.push('        if !changed { break }');
    L.push('        var sums = [[Int]](repeating: [0,0,0], count: actualK)');
    L.push('        var counts = [Int](repeating: 0, count: actualK)');
    L.push('        for i in 0..<n { let c = assign[i]; sums[c][0]+=pixels[i].r; sums[c][1]+=pixels[i].g; sums[c][2]+=pixels[i].b; counts[c]+=1 }');
    L.push('        for c in 0..<actualK where counts[c]>0 {');
    L.push('            centroids[c] = (sums[c][0]/counts[c], sums[c][1]/counts[c], sums[c][2]/counts[c])');
    L.push('        }');
    L.push('    }');
    L.push('');
    L.push(t('avg-color'));
    L.push('    var sums2 = [[Int]](repeating: [0,0,0], count: actualK)');
    L.push('    var counts2 = [Int](repeating: 0, count: actualK)');
    L.push('    for i in 0..<n {');
    L.push('        var minD = Double.infinity, minC = 0');
    L.push('        for c in 0..<centroids.count { let d = sqDist(pixels[i], centroids[c]); if d < minD { minD = d; minC = c } }');
    L.push('        sums2[minC][0]+=pixels[i].r; sums2[minC][1]+=pixels[i].g; sums2[minC][2]+=pixels[i].b; counts2[minC]+=1');
    L.push('    }');
    L.push('    var result = [(r: Int, g: Int, b: Int, count: Int)]()');
    L.push('    for c in 0..<actualK where counts2[c]>0 {');
    L.push('        result.append((sums2[c][0]/counts2[c], sums2[c][1]/counts2[c], sums2[c][2]/counts2[c], counts2[c]))');
    L.push('    }');
    L.push('    result.sort { $0.count > $1.count }');
    L.push('    return result');
    L.push('}');
    L.push('');
    L.push(t('euc-dist'));
    L.push('private func sqDist(_ a: (r: Int, g: Int, b: Int), _ b: (r: Int, g: Int, b: Int)) -> Double {');
    L.push('    let dr = Double(a.r - b.r), dg = Double(a.g - b.g), db = Double(a.b - b.b)');
    L.push('    return dr*dr + dg*dg + db*db');
    L.push('}');
    L.push('');
    L.push(t('mark-medcut'));
    L.push('func medianCut(_ pixels: [(r: Int, g: Int, b: Int)], k: Int) -> [(r: Int, g: Int, b: Int, count: Int)] {');
    L.push('    let n = pixels.count; let actualK = min(k, n)');
    L.push('    guard actualK > 0 else { return [] }');
    L.push('    var buckets = [pixels]');
    L.push('');
    L.push('    while buckets.count < actualK {');
    L.push(t('range-bucket'));
    L.push('        var maxRange = 0, maxIdx = -1, maxCh = 0');
    L.push('        for (bi, bucket) in buckets.enumerated() where bucket.count > 1 {');
    L.push('            var lo = (255, 255, 255), hi = (0, 0, 0)');
    L.push('            for p in bucket {');
    L.push('                lo.0 = min(lo.0, p.r); hi.0 = max(hi.0, p.r)');
    L.push('                lo.1 = min(lo.1, p.g); hi.1 = max(hi.1, p.g)');
    L.push('                lo.2 = min(lo.2, p.b); hi.2 = max(hi.2, p.b)');
    L.push('            }');
    L.push('            let rR = hi.0-lo.0, gR = hi.1-lo.1, bR = hi.2-lo.2');
    L.push('            var m = rR; var ch = 0');
    L.push('            if gR > m { m = gR; ch = 1 }; if bR > m { m = bR; ch = 2 }');
    L.push('            if m > maxRange { maxRange = m; maxIdx = bi; maxCh = ch }');
    L.push('        }');
    L.push('        if maxIdx == -1 { break }');
    L.push(t('median-cut'));
    L.push('        let ch = maxCh');
    L.push('        buckets[maxIdx].sort { a, b in');
    L.push('            let va = ch==0 ? a.r : (ch==1 ? a.g : a.b)');
    L.push('            let vb = ch==0 ? b.r : (ch==1 ? b.g : b.b)');
    L.push('            return va < vb');
    L.push('        }');
    L.push('        let mid = buckets[maxIdx].count / 2');
    L.push('        let b1 = Array(buckets[maxIdx][0..<mid])');
    L.push('        let b2 = Array(buckets[maxIdx][mid...])');
    L.push('        buckets.replaceSubrange(maxIdx...maxIdx, with: [b1, b2])');
    L.push('    }');
    L.push('');
    L.push(t('bucket-avg'));
    L.push('    var result = [(r: Int, g: Int, b: Int, count: Int)]()');
    L.push('    for bucket in buckets where !bucket.isEmpty {');
    L.push('        let cnt = bucket.count');
    L.push('        let sr = bucket.reduce(0) { $0 + $1.r }');
    L.push('        let sg = bucket.reduce(0) { $0 + $1.g }');
    L.push('        let sb = bucket.reduce(0) { $0 + $1.b }');
    L.push('        result.append((sr/cnt, sg/cnt, sb/cnt, cnt))');
    L.push('    }');
    L.push('    result.sort { $0.count > $1.count }');
    L.push('    return result');
    L.push('}');
    L.push('');
    L.push(t('mark-histo'));
    L.push('func histogramQuantize(_ pixels: [(r: Int, g: Int, b: Int)], k: Int) -> [(r: Int, g: Int, b: Int, count: Int)] {');
    L.push('    guard !pixels.isEmpty else { return [] }');
    L.push('    let BITS = 4, SHIFT = 8 - BITS');
    L.push('    var bins = [Int: (r: Int, g: Int, b: Int, count: Int)]()');
    L.push('');
    L.push(t('rgb-for'));
    L.push('    for p in pixels {');
    L.push('        let key = (p.r >> SHIFT) << 8 | (p.g >> SHIFT) << 4 | (p.b >> SHIFT)');
    L.push('        if bins[key] == nil { bins[key] = (0, 0, 0, 0) }');
    L.push('        bins[key]!.r += p.r; bins[key]!.g += p.g; bins[key]!.b += p.b; bins[key]!.count += 1');
    L.push('    }');
    L.push('');
    L.push(t('desc-arr'));
    L.push('    var arr = bins.map { (_, v) in (v.r/v.count, v.g/v.count, v.b/v.count, v.count) }');
    L.push('    arr.sort { $0.count > $1.count }');
    L.push('');
    L.push(t('greedy'));
    L.push('    var result = [(r: Int, g: Int, b: Int, count: Int)]()');
    L.push('    let threshold = 30');
    L.push('    for c in arr where result.count < k {');
    L.push('        var dup = false');
    L.push('        for j in result.indices {');
    L.push('            let dr = c.r-result[j].r, dg = c.g-result[j].g, db = c.b-result[j].b');
    L.push('            if dr*dr+dg*dg+db*db < threshold*threshold {');
    L.push('                let tc = result[j].count + c.count');
    L.push('                result[j].r = (result[j].r*result[j].count + c.r*c.count) / tc');
    L.push('                result[j].g = (result[j].g*result[j].count + c.g*c.count) / tc');
    L.push('                result[j].b = (result[j].b*result[j].count + c.b*c.count) / tc');
    L.push('                result[j].count = tc; dup = true; break');
    L.push('            }');
    L.push('        }');
    L.push('        if !dup { result.append(c) }');
    L.push('    }');
    L.push('    result.sort { $0.count > $1.count }');
    L.push('    return result');
    L.push('}');
    L.push('');
    L.push(t('mark-usage'));
    L.push('// let pixels = extractPixels(image)');
    L.push(t('usage-call'));
    L.push('// for c in colors {');
    L.push('//     let color = UIColor(r: c.r, g: c.g, b: c.b)');
    L.push('//     print(String(format: "#%02X%02X%02X %.1f%%", c.r, c.g, c.b, c.count))');
    L.push('// }');
    return L.join('\n');
  }

  /* ObjC 版三种算法（基于 C 结构体，适合高性能像素处理） */

  function genAlgoObjC() {
    var L = [];
    L.push(t('rgb-struct'));
    L.push('typedef struct { int r, g, b; } RGBPixel;');
    L.push('typedef struct { int r, g, b; NSUInteger count; } ColorResult;');
    L.push('');
    L.push(t('pragma-imgpx'));
    L.push('static RGBPixel *extractPixels(UIImage *image, NSUInteger *outCount, NSUInteger maxDim) {');
    L.push('    CGFloat sw = image.size.width, sh = image.size.height;');
    L.push('    if (MAX(sw, sh) > maxDim) {');
    L.push('        CGFloat s = maxDim / MAX(sw, sh);');
    L.push('        sw *= s; sh *= s;');
    L.push('    }');
    L.push('    NSUInteger w = (NSUInteger)sw, h = (NSUInteger)sh;');
    L.push('    CGImageRef cg = image.CGImage;');
    L.push('    if (!cg) { *outCount = 0; return NULL; }');
    L.push('    CGColorSpaceRef space = CGColorSpaceCreateDeviceRGB();');
    L.push('    NSUInteger bytesPerRow = w * 4;');
    L.push('    UInt8 *raw = calloc(bytesPerRow * h, 1);');
    L.push('    CGContextRef ctx = CGBitmapContextCreate(raw, w, h, 8, bytesPerRow, space,');
    L.push('        kCGImageAlphaPremultipliedLast);');
    L.push('    CGContextDrawImage(ctx, CGRectMake(0, 0, w, h), cg);');
    L.push('    RGBPixel *pixels = malloc(sizeof(RGBPixel) * w * h);');
    L.push('    for (NSUInteger i = 0; i < w * h; i++) {');
    L.push('        pixels[i] = (RGBPixel){raw[i*4], raw[i*4+1], raw[i*4+2]};');
    L.push('    }');
    L.push('    CGColorSpaceRelease(space);');
    L.push('    CGContextRelease(ctx); free(raw);');
    L.push('    *outCount = w * h;');
    L.push('    return pixels;');
    L.push('}');
    L.push('');
    L.push(t('pragma-kmeans'));
    L.push(t('ref-lloyd'));
    L.push('static ColorResult *kMeansClustering(RGBPixel *pixels, NSUInteger n,');
    L.push('                                       NSUInteger k, NSUInteger maxIter, NSUInteger *outCount) {');
    L.push('    if (n < k) k = n;');
    L.push('    if (k < 1) { *outCount = 0; return NULL; }');
    L.push('');
    L.push(t('kmeans-seed'));
    L.push('    RGBPixel *centroids = malloc(sizeof(RGBPixel) * k);');
    L.push('    centroids[0] = pixels[arc4random_uniform((uint32_t)n)];');
    L.push('    for (NSUInteger c = 1; c < k; c++) {');
    L.push('        double *dists = malloc(sizeof(double) * n);');
    L.push('        double total = 0;');
    L.push('        for (NSUInteger i = 0; i < n; i++) {');
    L.push('            double minD = INFINITY;');
    L.push('            for (NSUInteger j = 0; j < c; j++) {');
    L.push('                double dr = pixels[i].r - centroids[j].r;');
    L.push('                double dg = pixels[i].g - centroids[j].g;');
    L.push('                double db = pixels[i].b - centroids[j].b;');
    L.push('                double d = dr*dr + dg*dg + db*db;');
    L.push('                if (d < minD) minD = d;');
    L.push('            }');
    L.push('            dists[i] = minD; total += minD;');
    L.push('        }');
    L.push('        if (total == 0) {');
    L.push('            centroids[c] = pixels[arc4random_uniform((uint32_t)n)];');
    L.push('        } else {');
    L.push('            double r = ((double)arc4random() / UINT32_MAX) * total;');
    L.push('            double cum = 0;');
    L.push('            for (NSUInteger i = 0; i < n; i++) {');
    L.push('                cum += dists[i];');
    L.push('                if (cum >= r) { centroids[c] = pixels[i]; break; }');
    L.push('            }');
    L.push('        }');
    L.push('        free(dists);');
    L.push('    }');
    L.push('');
    L.push(t('lloyd-iter-short'));
    L.push('    NSUInteger *assign = calloc(n, sizeof(NSUInteger));');
    L.push('    for (NSUInteger iter = 0; iter < maxIter; iter++) {');
    L.push('        BOOL changed = NO;');
    L.push('        for (NSUInteger i = 0; i < n; i++) {');
    L.push('            double minD = INFINITY; NSUInteger minC = 0;');
    L.push('            for (NSUInteger c = 0; c < k; c++) {');
    L.push('                double dr = pixels[i].r - centroids[c].r;');
    L.push('                double dg = pixels[i].g - centroids[c].g;');
    L.push('                double db = pixels[i].b - centroids[c].b;');
    L.push('                double d = dr*dr + dg*dg + db*db;');
    L.push('                if (d < minD) { minD = d; minC = c; }');
    L.push('            }');
    L.push('            if (assign[i] != minC) { assign[i] = minC; changed = YES; }');
    L.push('        }');
    L.push('        if (!changed && iter > 0) break;');
    L.push('        double sums[k][3]; NSUInteger counts[k];');
    L.push('        memset(sums, 0, sizeof(sums)); memset(counts, 0, sizeof(counts));');
    L.push('        for (NSUInteger i = 0; i < n; i++) {');
    L.push('            NSUInteger c = assign[i];');
    L.push('            sums[c][0] += pixels[i].r; sums[c][1] += pixels[i].g; sums[c][2] += pixels[i].b;');
    L.push('            counts[c]++;');
    L.push('        }');
    L.push('        for (NSUInteger c = 0; c < k; c++) {');
    L.push('            if (counts[c] > 0) {');
    L.push('                centroids[c].r = (int)lround(sums[c][0] / counts[c]);');
    L.push('                centroids[c].g = (int)lround(sums[c][1] / counts[c]);');
    L.push('                centroids[c].b = (int)lround(sums[c][2] / counts[c]);');
    L.push('            }');
    L.push('        }');
    L.push('    }');
    L.push('');
    L.push(t('stat-res'));
    L.push('    double sums2[k][3]; NSUInteger counts2[k];');
    L.push('    memset(sums2, 0, sizeof(sums2)); memset(counts2, 0, sizeof(counts2));');
    L.push('    for (NSUInteger i = 0; i < n; i++) {');
    L.push('        double minD = INFINITY; NSUInteger minC = 0;');
    L.push('        for (NSUInteger c = 0; c < k; c++) {');
    L.push('            double dr = pixels[i].r - centroids[c].r;');
    L.push('            double dg = pixels[i].g - centroids[c].g;');
    L.push('            double db = pixels[i].b - centroids[c].b;');
    L.push('            double d = dr*dr + dg*dg + db*db;');
    L.push('            if (d < minD) { minD = d; minC = c; }');
    L.push('        }');
    L.push('        sums2[minC][0] += pixels[i].r; sums2[minC][1] += pixels[i].g; sums2[minC][2] += pixels[i].b;');
    L.push('        counts2[minC]++;');
    L.push('    }');
    L.push('    ColorResult *result = malloc(sizeof(ColorResult) * k);');
    L.push('    NSUInteger rc = 0;');
    L.push('    for (NSUInteger c = 0; c < k; c++) {');
    L.push('        if (counts2[c] > 0) {');
    L.push('            result[rc] = (ColorResult){');
    L.push('                (int)lround(sums2[c][0]/counts2[c]),');
    L.push('                (int)lround(sums2[c][1]/counts2[c]),');
    L.push('                (int)lround(sums2[c][2]/counts2[c]),');
    L.push('                counts2[c] };');
    L.push('            rc++;');
    L.push('        }');
    L.push('    }');
    L.push('    free(assign); free(centroids);');
    L.push(t('sort-count'));
    L.push('    qsort_b(result, rc, sizeof(ColorResult), ^int(const void *a, const void *b) {');
    L.push('        return (int)((ColorResult *)b)->count - (int)((ColorResult *)a)->count;');
    L.push('    });');
    L.push('    *outCount = rc;');
    L.push('    return result;');
    L.push('}');
    L.push('');
    L.push(t('pragma-medcut'));
    L.push(t('bucket-range'));
    L.push('static void bucketRange(RGBPixel *px, NSUInteger *indices, NSUInteger cnt,');
    L.push('                       int *outMax, int *outCh) {');
    L.push('    int minR=255,maxR=0,minG=255,maxG=0,minB=255,maxB=0;');
    L.push('    for (NSUInteger i = 0; i < cnt; i++) {');
    L.push('        RGBPixel p = px[indices[i]];');
    L.push('        if (p.r<minR) minR=p.r; if (p.r>maxR) maxR=p.r;');
    L.push('        if (p.g<minG) minG=p.g; if (p.g>maxG) maxG=p.g;');
    L.push('        if (p.b<minB) minB=p.b; if (p.b>maxB) maxB=p.b;');
    L.push('    }');
    L.push('    int rR=maxR-minR, gR=maxG-minG, bR=maxB-minB;');
    L.push('    int m=rR, ch=0; if (gR>m){m=gR;ch=1;} if (bR>m){m=bR;ch=2;}');
    L.push('    *outMax=m; *outCh=ch;');
    L.push('}');
    L.push('');
    L.push('static ColorResult *medianCut(RGBPixel *pixels, NSUInteger n,');
    L.push('                                NSUInteger k, NSUInteger *outCount) {');
    L.push('    if (n < k) k = n;');
    L.push('    if (k < 1) { *outCount = 0; return NULL; }');
    L.push(t('nsarr'));
    L.push('    NSMutableArray *buckets = [NSMutableArray array];');
    L.push('    NSMutableIndexSet *all = [NSMutableIndexSet indexSet];');
    L.push('    [all addIndexesInRange:NSMakeRange(0, n)];');
    L.push('    [buckets addObject:all];');
    L.push('');
    L.push('    while (buckets.count < k) {');
    L.push('        int maxRange=0; NSUInteger maxIdx=NSNotFound; int maxCh=0;');
    L.push('        for (NSUInteger b = 0; b < buckets.count; b++) {');
    L.push('            NSMutableIndexSet *bs = buckets[b];');
    L.push('            if (bs.count < 2) continue;');
    L.push('            NSUInteger idxs[bs.count];');
    L.push('            NSUInteger i = 0; [bs getIndexes:idxs maxCount:bs.count inIndexRange:NULL];');
    L.push('            int m, ch; bucketRange(pixels, idxs, bs.count, &m, &ch);');
    L.push('            if (m > maxRange) { maxRange=m; maxIdx=b; maxCh=ch; }');
    L.push('        }');
    L.push('        if (maxIdx == NSNotFound) break;');
    L.push(t('median-cut'));
    L.push('        int ch = maxCh;');
    L.push('        NSMutableIndexSet *bucket = buckets[maxIdx];');
    L.push('        NSUInteger sortedIdxs[bucket.count];');
    L.push('        NSUInteger i = 0; [bucket getIndexes:sortedIdxs maxCount:bucket.count inIndexRange:NULL];');
    L.push('        qsort_b(sortedIdxs, bucket.count, sizeof(NSUInteger), ^int(const void *a, const void *b) {');
    L.push('            int va = (ch==0)?pixels[*(NSUInteger*)a].r : (ch==1)?pixels[*(NSUInteger*)a].g : pixels[*(NSUInteger*)a].b;');
    L.push('            int vb = (ch==0)?pixels[*(NSUInteger*)b].r : (ch==1)?pixels[*(NSUInteger*)b].g : pixels[*(NSUInteger*)b].b;');
    L.push('            return va - vb;');
    L.push('        });');
    L.push('        NSUInteger mid = bucket.count / 2;');
    L.push('        NSMutableIndexSet *b1 = [NSMutableIndexSet indexSet];');
    L.push('        NSMutableIndexSet *b2 = [NSMutableIndexSet indexSet];');
    L.push('        for (NSUInteger i = 0; i < mid; i++) [b1 addIndex:sortedIdxs[i]];');
    L.push('        for (NSUInteger i = mid; i < bucket.count; i++) [b2 addIndex:sortedIdxs[i]];');
    L.push('        [buckets replaceObjectAtIndex:maxIdx withObject:b1];');
    L.push('        [buckets insertObject:b2 atIndex:maxIdx+1];');
    L.push('    }');
    L.push('');
    L.push(t('bucket-avg'));
    L.push('    ColorResult *result = malloc(sizeof(ColorResult) * buckets.count);');
    L.push('    NSUInteger rc = 0;');
    L.push('    for (NSMutableIndexSet *bucket in buckets) {');
    L.push('        if (bucket.count == 0) continue;');
    L.push('        NSUInteger idxs[bucket.count];');
    L.push('        [bucket getIndexes:idxs maxCount:bucket.count inIndexRange:NULL];');
    L.push('        long sr=0,sg=0,sb=0;');
    L.push('        for (NSUInteger i = 0; i < bucket.count; i++) {');
    L.push('            sr += pixels[idxs[i]].r; sg += pixels[idxs[i]].g; sb += pixels[idxs[i]].b;');
    L.push('        }');
    L.push('        NSUInteger cnt = bucket.count;');
    L.push('        result[rc++] = (ColorResult){(int)(sr/cnt),(int)(sg/cnt),(int)(sb/cnt),cnt};');
    L.push('    }');
    L.push('    qsort_b(result, rc, sizeof(ColorResult), ^int(const void *a, const void *b) {');
    L.push('        return (int)((ColorResult *)b)->count - (int)((ColorResult *)a)->count;');
    L.push('    });');
    L.push('    *outCount = rc;');
    L.push('    return result;');
    L.push('}');
    L.push('');
    L.push(t('pragma-histo'));
    L.push('static ColorResult *histogramQuantize(RGBPixel *pixels, NSUInteger n,');
    L.push('                                     NSUInteger k, NSUInteger *outCount) {');
    L.push('    if (n == 0) { *outCount = 0; return NULL; }');
    L.push('    int BITS = 4, SHIFT = 8 - BITS;');
    L.push(t('nsdict'));
    L.push('    NSMutableDictionary *bins = [NSMutableDictionary dictionary];');
    L.push('    for (NSUInteger i = 0; i < n; i++) {');
    L.push('        int r = pixels[i].r >> SHIFT;');
    L.push('        int g = pixels[i].g >> SHIFT;');
    L.push('        int b = pixels[i].b >> SHIFT;');
    L.push('        NSNumber *key = @((r << 8) | (g << 4) | b);');
    L.push('        NSMutableArray *arr = bins[key];');
    L.push('        if (!arr) { arr = @[@0,@0,@0,@0].mutableCopy; bins[key] = arr; }');
    L.push('        arr[0] = @([arr[0] integerValue] + pixels[i].r);');
    L.push('        arr[1] = @([arr[1] integerValue] + pixels[i].g);');
    L.push('        arr[2] = @([arr[2] integerValue] + pixels[i].b);');
    L.push('        arr[3] = @([arr[3] integerValue] + 1);');
    L.push('    }');
    L.push(t('arr-sort'));
    L.push('    NSMutableArray *arr2 = [NSMutableArray array];');
    L.push('    for (NSArray *v in bins.allValues) {');
    L.push('        NSUInteger cnt = [v[3] integerValue];');
    L.push('        [arr2 addObject:@[@([v[0] integerValue]/cnt), @([v[1] integerValue]/cnt),');
    L.push('                           @([v[2] integerValue]/cnt), @(cnt)]];');
    L.push('    }');
    L.push('    [arr2 sortUsingComparator:^NSComparisonResult(id a, id b) {');
    L.push('        return [b[3] compare:a[3]];');
    L.push('    }];');
    L.push(t('greedy-short'));
    L.push('    NSMutableArray *result = [NSMutableArray array];');
    L.push('    int threshold = 30;');
    L.push('    for (NSArray *c in arr2) {');
    L.push('        if (result.count >= k) break;');
    L.push('        BOOL dup = NO;');
    L.push('        for (NSMutableArray *r in result) {');
    L.push('            int dr = [c[0] intValue] - [r[0] intValue];');
    L.push('            int dg = [c[1] intValue] - [r[1] intValue];');
    L.push('            int db = [c[2] intValue] - [r[2] intValue];');
    L.push('            if (dr*dr+dg*dg+db*db < threshold*threshold) {');
    L.push('                NSUInteger tc = [r[3] integerValue] + [c[3] integerValue];');
    L.push('                r[0] = @(([r[0] intValue]*[r[3] integerValue] + [c[0] intValue]*[c[3] integerValue]) / tc);');
    L.push('                r[1] = @(([r[1] intValue]*[r[3] integerValue] + [c[1] intValue]*[c[3] integerValue]) / tc);');
    L.push('                r[2] = @(([r[2] intValue]*[r[3] integerValue] + [c[2] intValue]*[c[3] integerValue]) / tc);');
    L.push('                r[3] = @(tc); dup = YES; break;');
    L.push('            }');
    L.push('        }');
    L.push('        if (!dup) [result addObject:c.mutableCopy];');
    L.push('    }');
    L.push('    [result sortUsingComparator:^NSComparisonResult(id a, id b) {');
    L.push('        return [b[3] compare:a[3]];');
    L.push('    }];');
    L.push('    ColorResult *ret = malloc(sizeof(ColorResult) * result.count);');
    L.push('    for (NSUInteger i = 0; i < result.count; i++) {');
    L.push('        NSArray *r = result[i];');
    L.push('        ret[i] = (ColorResult){[r[0] intValue],[r[1] intValue],[r[2] intValue],[r[3] integerValue]};');
    L.push('    }');
    L.push('    *outCount = result.count;');
    L.push('    return ret;');
    L.push('}');
    L.push('');
    L.push(t('pragma-usage'));
    L.push('// NSUInteger n = 0;');
    L.push('// RGBPixel *px = extractPixels(image, &n, 1200);');
    L.push('// NSUInteger cnt = 0;');
    L.push('// ColorResult *colors = kMeansClustering(px, n, 5, 12, &cnt);');
    L.push('// for (NSUInteger i = 0; i < cnt; i++) {');
    L.push('//     NSLog(@"#%02X%02X%02X %.1f%%", colors[i].r, colors[i].g, colors[i].b,');
    L.push('//           (double)colors[i].count / n * 100);');
    L.push('// }');
    L.push('// free(px); free(colors);');
    return L.join('\n');
  }

  /* JavaScript 版（工具实际使用的实现） */

  function genAlgoJS() {
    var L = [];
    L.push(t('c-kmeans'));
    L.push(t('c-ref'));
    L.push(' * pixels: Uint8ClampedArray [r,g,b, r,g,b, ...]');
    L.push(t('c-return'));
    L.push(' */');
    L.push('function kMeans(pixels, k, maxIter) {');
    L.push('  var n = pixels.length / 3;');
    L.push('  if (n < k) k = n;');
    L.push('  if (k < 1) return [];');
    L.push('');
    L.push(t('c-seed'));
    L.push('  var centroids = [];');
    L.push('  var firstIdx = Math.floor(Math.random() * n) * 3;');
    L.push('  centroids.push([pixels[firstIdx], pixels[firstIdx+1], pixels[firstIdx+2]]);');
    L.push('  for (var c = 1; c < k; c++) {');
    L.push('    var dists = [], total = 0;');
    L.push('    for (var i = 0; i < n; i++) {');
    L.push('      var idx = i * 3, minD = Infinity;');
    L.push('      for (var j = 0; j < centroids.length; j++) {');
    L.push('        var dr = pixels[idx]-centroids[j][0];');
    L.push('        var dg = pixels[idx+1]-centroids[j][1];');
    L.push('        var db = pixels[idx+2]-centroids[j][2];');
    L.push('        var d = dr*dr + dg*dg + db*db;');
    L.push('        if (d < minD) minD = d;');
    L.push('      }');
    L.push('      dists.push(minD); total += minD;');
    L.push('    }');
    L.push('    if (total === 0) { centroids.push(pixels.slice(...)); }');
    L.push(t('js-rand-pick'));
    L.push('  }');
    L.push('');
    L.push(t('js-lloyd'));
    L.push('  var assign = new Array(n);');
    L.push('  for (var iter = 0; iter < maxIter; iter++) {');
    L.push('    var changed = false;');
    L.push(t('js-nearest'));
    L.push('    if (!changed && iter > 0) break;');
    L.push(t('c-update-center'));
    L.push('  }');
    L.push(t('c-stat-ret'));
    L.push('}');
    L.push('');
    L.push(t('c-medcut'));
    L.push(t('c-medcut-desc'));
    L.push(' */');
    L.push('function medianCut(pixels, k) {');
    L.push('  var buckets = [allPixelIndices];');
    L.push('  while (buckets.length < k) {');
    L.push(t('js-range-bucket'));
    L.push(t('c-sort-axle'));
    L.push('  }');
    L.push(t('c-med-avg'));
    L.push('}');
    L.push('');
    L.push(t('c-histo'));
    L.push(t('c-histo-quant'));
    L.push(t('c-histo-merge'));
    L.push(' */');
    L.push('function histogram(pixels, k) {');
    L.push('  var bins = {};');
    L.push(t('js-quantize'));
    L.push(t('c-arr-greedy'));
    L.push('}');
    L.push('');
    L.push(t('c-src-ref'));
    return L.join('\n');
  }

  /* ---------- 复制 ---------- */

  function copyFallback(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) { /* 忽略 */ }
    ta.remove();
  }

  function flashCopied(btn) {
    var old = btn.textContent;
    btn.textContent = t('copied');
    btn.classList.add('cp-copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(function () {
      btn.textContent = old;
      btn.classList.remove('cp-copied');
    }, 1200);
  }

  function copyText(text, btn) {
    function done() { flashCopied(btn); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        copyFallback(text);
        done();
      });
    } else {
      copyFallback(text);
      done();
    }
  }

  /* ---------- 图片加载 ---------- */

  function loadFile(file) {
    clearError();
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      showError(t('err-not-image'));
      return;
    }
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var w = img.naturalWidth;
      var h = img.naturalHeight;
      /* 限制最大尺寸，避免超大图卡顿 */
      var MAX_DIM = 1200;
      if (w > MAX_DIM || h > MAX_DIM) {
        var scale = MAX_DIM / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      els.canvas.width = w;
      els.canvas.height = h;
      state.ctx = els.canvas.getContext('2d', { willReadFrequently: true });
      state.ctx.drawImage(img, 0, 0, w, h);
      state.imgW = w;
      state.imgH = h;
      URL.revokeObjectURL(url);

      els.workarea.hidden = false;
      els.imgInfo.textContent = w + '\u00D7' + h + ' px';
      els.palettePanel.hidden = true;
      els.codePanel.hidden = true;
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      showError(t('err-load-fail'));
    };
    img.src = url;
  }

  /* ---------- 事件：上传与拖拽 ---------- */

  els.choose.addEventListener('click', function () { els.file.click(); });
  els.file.addEventListener('change', function () {
    loadFile(els.file.files && els.file.files[0]);
    els.file.value = '';
  });

  ['dragenter', 'dragover'].forEach(function (type) {
    els.drop.addEventListener(type, function (e) {
      e.preventDefault();
      els.drop.classList.add('cp-drag');
    });
  });
  ['dragleave', 'drop'].forEach(function (type) {
    els.drop.addEventListener(type, function (e) {
      e.preventDefault();
      els.drop.classList.remove('cp-drag');
    });
  });
  els.drop.addEventListener('drop', function (e) {
    var files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length) loadFile(files[0]);
  });

  /* ---------- 事件：提取与代码 ---------- */

  els.extract.addEventListener('click', runExtract);

  /* 设置变更后若有结果则自动重新提取 */
  [els.algo, els.count, els.quality].forEach(function (el) {
    el.addEventListener('change', function () {
      if (!els.palettePanel.hidden) runExtract();
    });
  });

  /* Tab 切换 */
  els.tabs.addEventListener('click', function (e) {
    var btn = e.target;
    while (btn && btn !== els.tabs && !(btn.getAttribute && btn.getAttribute('data-lang'))) {
      btn = btn.parentNode;
    }
    if (!btn || btn === els.tabs) return;
    var lang = btn.getAttribute('data-lang');
    state.activeLang = lang;
    var tabs = els.tabs.querySelectorAll('.cp-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('cp-tab-active', tabs[i] === btn);
    }
    generateCode(state.colors);
  });

  /* 复制：委托 */
  root.addEventListener('click', function (e) {
    var btn = e.target;
    /* 单色复制 */
    while (btn && btn !== root && !(btn.getAttribute && btn.getAttribute('data-copy-value'))) {
      btn = btn.parentNode;
    }
    if (btn !== root && btn.getAttribute && btn.getAttribute('data-copy-value')) {
      copyText(btn.getAttribute('data-copy-value'), btn);
      return;
    }
    /* 代码复制 */
    if (e.target === els.copyCode || (e.target.parentNode === els.copyCode)) {
      copyText(els.codeOutput.textContent, els.copyCode);
    }
    /* 算法源码复制 */
    if (e.target === els.copyAlgo || (e.target.parentNode === els.copyAlgo)) {
      copyText(els.algoOutput.textContent, els.copyAlgo);
    }
  });

  /* 算法源码 Tab 切换 */
  if (els.algoTabs) {
    els.algoTabs.addEventListener('click', function (e) {
      var btn = e.target;
      while (btn && btn !== els.algoTabs && !(btn.getAttribute && btn.getAttribute('data-algo-src'))) {
        btn = btn.parentNode;
      }
      if (!btn || btn === els.algoTabs) return;
      var lang = btn.getAttribute('data-algo-src');
      state.activeAlgoSrc = lang;
      var tabs = els.algoTabs.querySelectorAll('.cp-tab');
      for (var i = 0; i < tabs.length; i++) {
        tabs[i].classList.toggle('cp-tab-active', tabs[i] === btn);
      }
      renderAlgoSource();
    });
  }

  /* ---------- 启动 ---------- */

  clearError();
  renderAlgoSource();
})();
