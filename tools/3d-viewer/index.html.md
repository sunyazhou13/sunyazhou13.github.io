---
layout: page
title: 3D 模型多视口分析
icon: fas fa-cube
tool_css: /assets/tools/3d-viewer/app.css?v=2
---

单渲染器四视口 3D 模型分析工具：线框看骨架、UV 看皮囊、PBR 看光影、法线/深度看异常。所有解析与渲染都在你的浏览器本地完成，**模型文件不会被上传到任何服务器**。

几点说明：

- 支持加载 **GLB / glTF / OBJ（可配套 MTL）/ FBX / STL / USDZ**，拖拽到视口区或点击「选择模型」
- **支持直接拖入 zip 压缩包**：模型站（Sketchfab / CGTrader 等）下载的 glTF / FBX / OBJ 通常是 zip（主模型 + .bin / .mtl / 贴图），无需手动解压，工具会在内存中解包并把 `.bin`、`.mtl`、贴图按包内相对路径就地解析
- 四个视口共享同一场景与相机状态，任一视口旋转 / 平移 / 缩放，其余三个**强制同步**
- 加载后可一键导出 **GLB / OBJ+MTL / STL（二进制，可用于 3D 打印）/ USDZ（可在 iOS AR Quick Look 预览）**
- USDZ 完整支持：ASCII usda 用内置解析器；**二进制 usdc（Apple / Reality Converter 默认格式）走内置 WASM 解析器**（tinyusdz，zstd 压缩 1.3MB，首次加载后缓存，全程本地）
- 模型缺少 UV 坐标时（STL 等），UV 视口会给出提示并支持一键生成 box 投影 UV
- 未加载模型时显示内置示例（环面纽结），打开即可体验四个视口
- 移动端（宽度 &lt; 768px）自动切换为单视口 + 标签切换

<div id="tv3d-app">

  <div class="tv3d-banner">
    <span>单 WebGL 渲染器 · 四视口联动 · 纯本地渲染不上传</span>
  </div>

  <div class="tv3d-toolbar">
    <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-load">选择模型</button>
    <input type="file" id="tv3d-file" multiple accept=".glb,.gltf,.obj,.mtl,.fbx,.stl,.usdz,.zip" hidden>
    <span class="tv3d-hint">或拖拽文件到下方视口区</span>
    <span class="tv3d-sep"></span>
    <button type="button" class="tv3d-btn" id="tv3d-export-glb" disabled>导出 GLB</button>
    <button type="button" class="tv3d-btn" id="tv3d-export-obj" disabled>导出 OBJ+MTL</button>
    <button type="button" class="tv3d-btn" id="tv3d-export-stl" disabled>导出 STL</button>
    <button type="button" class="tv3d-btn" id="tv3d-export-usdz" disabled>导出 USDZ</button>
  </div>

  <div class="tv3d-stage" id="tv3d-stage">
    <canvas id="tv3d-canvas"></canvas>

    <div class="tv3d-cells" id="tv3d-cells">
      <div class="tv3d-cell" data-vp="0"><span class="tv3d-cell-title">① 线框 · 骨架</span></div>
      <div class="tv3d-cell" data-vp="1"><span class="tv3d-cell-title">② UV · 皮囊</span>
        <div class="tv3d-uv-hint" id="tv3d-uv-hint" hidden>
          <p>该模型不含 UV 坐标<br><small>STL 等格式天生没有 UV，部分 OBJ / USDZ 也会缺失</small></p>
          <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-gen-uv">生成投影 UV</button>
        </div>
      </div>
      <div class="tv3d-cell" data-vp="2"><span class="tv3d-cell-title">③ PBR · 光影</span></div>
      <div class="tv3d-cell" data-vp="3"><span class="tv3d-cell-title"><span id="tv3d-heat-label">④ 法线 · 异常</span>
        <button type="button" class="tv3d-mini" id="tv3d-heat-mode" title="切换 法线 / 深度">深度</button>
      </span></div>
    </div>

    <div class="tv3d-tabs" id="tv3d-tabs">
      <button type="button" data-vp="0" class="active">线框</button>
      <button type="button" data-vp="1">UV</button>
      <button type="button" data-vp="2">PBR</button>
      <button type="button" data-vp="3">法线</button>
    </div>

    <div class="tv3d-dropmask" id="tv3d-dropmask" hidden>松开鼠标加载模型</div>
    <div class="tv3d-status" id="tv3d-status">未加载模型 — 当前为内置示例（环面纽结）</div>
    <div class="tv3d-measure-label" id="tv3d-mlabel" hidden></div>
  </div>

  <section class="tv3d-panel">
    <h2 class="tv3d-title">参数微调（实时生效）</h2>

    <div class="tv3d-sliders">
      <div class="tv3d-slider">
        <label for="tv3d-ambient">环境光强度 <output id="tv3d-ambient-v">1.0</output></label>
        <input type="range" id="tv3d-ambient" min="0" max="3" step="0.05" value="1">
      </div>
      <div class="tv3d-slider">
        <label for="tv3d-direct">直接光强度 <output id="tv3d-direct-v">1.2</output></label>
        <input type="range" id="tv3d-direct" min="0" max="5" step="0.1" value="1.2">
      </div>
      <div class="tv3d-slider">
        <label for="tv3d-shadow">阴影柔化度 <output id="tv3d-shadow-v">4</output></label>
        <input type="range" id="tv3d-shadow" min="0" max="16" step="1" value="4">
      </div>
    </div>

    <div class="tv3d-override">
      <label class="tv3d-check">
        <input type="checkbox" id="tv3d-override"> 材质覆盖（强制指定金属度 / 粗糙度，仅影响 PBR 视口）
      </label>
      <div class="tv3d-sliders">
        <div class="tv3d-slider">
          <label for="tv3d-metal">全局金属度 <output id="tv3d-metal-v">0.50</output></label>
          <input type="range" id="tv3d-metal" min="0" max="1" step="0.01" value="0.5" disabled>
        </div>
        <div class="tv3d-slider">
          <label for="tv3d-rough">全局粗糙度 <output id="tv3d-rough-v">0.50</output></label>
          <input type="range" id="tv3d-rough" min="0" max="1" step="0.01" value="0.5" disabled>
        </div>
      </div>
    </div>
  </section>

  <section class="tv3d-panel">
    <h2 class="tv3d-title">测量与标注（PBR 视口）</h2>

    <div class="tv3d-measurebar">
      <button type="button" class="tv3d-btn" id="tv3d-measure">开启测距</button>
      <label class="tv3d-inline">模型单位
        <select id="tv3d-unit" class="tv3d-select">
          <option value="m" selected>米（glTF 标准）</option>
          <option value="cm">厘米</option>
          <option value="mm">毫米</option>
          <option value="inch">英寸</option>
        </select>
      </label>
      <button type="button" class="tv3d-btn" id="tv3d-clear-measure">清除测量</button>
      <span class="tv3d-sep"></span>
      <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-snap" disabled>截图标注视口③</button>
      <span class="tv3d-hint">测距：开启后在视口③点击模型表面两次</span>
    </div>
  </section>

  <div class="tv3d-error" id="tv3d-error" hidden></div>

</div>

<div class="tv3d-annot" id="tv3d-annot" hidden>
  <div class="tv3d-annot-bar">
    <button type="button" class="tv3d-btn tv3d-tool active" data-tool="pen">画笔</button>
    <button type="button" class="tv3d-btn tv3d-tool" data-tool="arrow">箭头</button>
    <button type="button" class="tv3d-btn tv3d-tool" data-tool="rect">矩形</button>
    <span class="tv3d-sep"></span>
    <span class="tv3d-colors">
      <button type="button" class="tv3d-color active" data-color="#ff4d4f" style="background:#ff4d4f" title="红"></button>
      <button type="button" class="tv3d-color" data-color="#ffd666" style="background:#ffd666" title="黄"></button>
      <button type="button" class="tv3d-color" data-color="#40a9ff" style="background:#40a9ff" title="蓝"></button>
      <button type="button" class="tv3d-color" data-color="#ffffff" style="background:#ffffff" title="白"></button>
    </span>
    <select id="tv3d-annot-width" class="tv3d-select">
      <option value="2">细 2px</option>
      <option value="4" selected>中 4px</option>
      <option value="8">粗 8px</option>
    </select>
    <span class="tv3d-sep"></span>
    <button type="button" class="tv3d-btn" id="tv3d-annot-undo">撤销</button>
    <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-annot-save">下载 PNG</button>
    <button type="button" class="tv3d-btn" id="tv3d-annot-close">退出标注</button>
  </div>
  <div class="tv3d-annot-body"><canvas id="tv3d-annot-canvas"></canvas></div>
</div>

<script type="importmap">
{
  "imports": {
    "three": "/assets/tools/3d-viewer/lib/three.module.js",
    "three/addons/": "/assets/tools/3d-viewer/lib/addons/",
    "three/examples/jsm/": "/assets/tools/3d-viewer/lib/addons/",
    "fzstd": "/assets/tools/3d-viewer/lib/tinyusdz/fzstd.mjs"
  }
}
</script>

<script type="module" src="/assets/tools/3d-viewer/app.js?v=202609221"></script>
