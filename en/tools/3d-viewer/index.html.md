---
layout: page
title: 3D Model Multi-Viewport Inspector
icon: fas fa-cube
lang: en
permalink: /tools/3d-viewer/
tool_css: /assets/tools/3d-viewer/app.css?v=202609221
---

A four-viewport 3D model inspector in a single renderer: wireframe for structure, UV for texture mapping, PBR for lighting, normal/depth for anomalies. All parsing and rendering happen locally in your browser — **your model files are never uploaded to any server**.

Notes:

- Loads **GLB / glTF / OBJ (with MTL) / FBX / STL / USDZ** — drag files onto the viewport area or click "Choose model"
- **Zip archives work directly**: downloads from model sites (Sketchfab / CGTrader etc.) are usually zips (main model + .bin / .mtl / textures). No manual extraction needed — the tool unpacks in memory and resolves `.bin`, `.mtl` and textures by their in-archive relative paths
- All four viewports share one scene and camera state: rotate / pan / zoom in any viewport and the other three **follow strictly**
- After loading, one-click export to **GLB / OBJ+MTL / STL (binary, 3D-print ready) / USDZ (previewable in iOS AR Quick Look)**
- Full USDZ support: ASCII usda via the built-in parser; **binary usdc (the default Apple / Reality Converter format) via a built-in WASM parser** (tinyusdz, 1.3 MB zstd-compressed, cached after first load, fully local)
- When the model lacks UV coordinates (STL etc.), the UV viewport shows a hint and offers one-click box-projection UV generation
- Before any model is loaded, a built-in sample (torus knot) is shown so you can try all four viewports right away
- On mobile (width &lt; 768px) the tool switches to a single viewport with tab switching

<div id="tv3d-app">

  <div class="tv3d-banner">
    <span>Single WebGL renderer · four linked viewports · local rendering, nothing uploaded</span>
  </div>

  <div class="tv3d-toolbar">
    <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-load">Choose model</button>
    <input type="file" id="tv3d-file" multiple accept=".glb,.gltf,.obj,.mtl,.fbx,.stl,.usdz,.zip" hidden>
    <span class="tv3d-hint">or drag files onto the viewport area below</span>
    <span class="tv3d-sep"></span>
    <button type="button" class="tv3d-btn" id="tv3d-export-glb" disabled>Export GLB</button>
    <button type="button" class="tv3d-btn" id="tv3d-export-obj" disabled>Export OBJ+MTL</button>
    <button type="button" class="tv3d-btn" id="tv3d-export-stl" disabled>Export STL</button>
    <button type="button" class="tv3d-btn" id="tv3d-export-usdz" disabled>Export USDZ</button>
  </div>

  <div class="tv3d-stage" id="tv3d-stage">
    <canvas id="tv3d-canvas"></canvas>

    <div class="tv3d-cells" id="tv3d-cells">
      <div class="tv3d-cell" data-vp="0"><span class="tv3d-cell-title">① Wireframe · Structure</span></div>
      <div class="tv3d-cell" data-vp="1"><span class="tv3d-cell-title">② UV · Texture</span>
        <div class="tv3d-uv-hint" id="tv3d-uv-hint" hidden>
          <p>This model has no UV coordinates<br><small>STL and similar formats have no UVs natively; some OBJ / USDZ files miss them too</small></p>
          <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-gen-uv">Generate projection UV</button>
        </div>
      </div>
      <div class="tv3d-cell" data-vp="2"><span class="tv3d-cell-title">③ PBR · Lighting</span></div>
      <div class="tv3d-cell" data-vp="3"><span class="tv3d-cell-title"><span id="tv3d-heat-label">④ Normal · Anomalies</span>
        <button type="button" class="tv3d-mini" id="tv3d-heat-mode" title="Toggle normal / depth">Depth</button>
      </span></div>
    </div>

    <div class="tv3d-tabs" id="tv3d-tabs">
      <button type="button" data-vp="0" class="active">Wireframe</button>
      <button type="button" data-vp="1">UV</button>
      <button type="button" data-vp="2">PBR</button>
      <button type="button" data-vp="3">Normal</button>
    </div>

    <div class="tv3d-dropmask" id="tv3d-dropmask" hidden>Release to load the model</div>
    <div class="tv3d-status" id="tv3d-status">No model loaded — showing the built-in sample (torus knot)</div>
    <div class="tv3d-measure-label" id="tv3d-mlabel" hidden></div>
  </div>

  <section class="tv3d-panel">
    <h2 class="tv3d-title">Fine-tuning (live)</h2>

    <div class="tv3d-sliders">
      <div class="tv3d-slider">
        <label for="tv3d-ambient">Ambient intensity <output id="tv3d-ambient-v">1.0</output></label>
        <input type="range" id="tv3d-ambient" min="0" max="3" step="0.05" value="1">
      </div>
      <div class="tv3d-slider">
        <label for="tv3d-direct">Direct light intensity <output id="tv3d-direct-v">1.2</output></label>
        <input type="range" id="tv3d-direct" min="0" max="5" step="0.1" value="1.2">
      </div>
      <div class="tv3d-slider">
        <label for="tv3d-shadow">Shadow softness <output id="tv3d-shadow-v">4</output></label>
        <input type="range" id="tv3d-shadow" min="0" max="16" step="1" value="4">
      </div>
    </div>

    <div class="tv3d-override">
      <label class="tv3d-check">
        <input type="checkbox" id="tv3d-override"> Material override (force metalness / roughness, PBR viewport only)
      </label>
      <div class="tv3d-sliders">
        <div class="tv3d-slider">
          <label for="tv3d-metal">Global metalness <output id="tv3d-metal-v">0.50</output></label>
          <input type="range" id="tv3d-metal" min="0" max="1" step="0.01" value="0.5" disabled>
        </div>
        <div class="tv3d-slider">
          <label for="tv3d-rough">Global roughness <output id="tv3d-rough-v">0.50</output></label>
          <input type="range" id="tv3d-rough" min="0" max="1" step="0.01" value="0.5" disabled>
        </div>
      </div>
    </div>
  </section>

  <section class="tv3d-panel">
    <h2 class="tv3d-title">Measure & annotate (PBR viewport)</h2>

    <div class="tv3d-measurebar">
      <button type="button" class="tv3d-btn" id="tv3d-measure">Measure distance</button>
      <label class="tv3d-inline">Model unit
        <select id="tv3d-unit" class="tv3d-select">
          <option value="m" selected>Meters (glTF standard)</option>
          <option value="cm">Centimeters</option>
          <option value="mm">Millimeters</option>
          <option value="inch">Inches</option>
        </select>
      </label>
      <button type="button" class="tv3d-btn" id="tv3d-clear-measure">Clear measurements</button>
      <span class="tv3d-sep"></span>
      <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-snap" disabled>Annotate viewport ③</button>
      <span class="tv3d-hint">Measuring: enable, then click the model surface twice in viewport ③</span>
    </div>
  </section>

  <div class="tv3d-error" id="tv3d-error" hidden></div>

</div>

<div class="tv3d-annot" id="tv3d-annot" hidden>
  <div class="tv3d-annot-bar">
    <button type="button" class="tv3d-btn tv3d-tool active" data-tool="pen">Pen</button>
    <button type="button" class="tv3d-btn tv3d-tool" data-tool="arrow">Arrow</button>
    <button type="button" class="tv3d-btn tv3d-tool" data-tool="rect">Rectangle</button>
    <span class="tv3d-sep"></span>
    <span class="tv3d-colors">
      <button type="button" class="tv3d-color active" data-color="#ff4d4f" style="background:#ff4d4f" title="Red"></button>
      <button type="button" class="tv3d-color" data-color="#ffd666" style="background:#ffd666" title="Yellow"></button>
      <button type="button" class="tv3d-color" data-color="#40a9ff" style="background:#40a9ff" title="Blue"></button>
      <button type="button" class="tv3d-color" data-color="#ffffff" style="background:#ffffff" title="White"></button>
    </span>
    <select id="tv3d-annot-width" class="tv3d-select">
      <option value="2">Thin 2px</option>
      <option value="4" selected>Medium 4px</option>
      <option value="8">Thick 8px</option>
    </select>
    <span class="tv3d-sep"></span>
    <button type="button" class="tv3d-btn" id="tv3d-annot-undo">Undo</button>
    <button type="button" class="tv3d-btn tv3d-btn-primary" id="tv3d-annot-save">Download PNG</button>
    <button type="button" class="tv3d-btn" id="tv3d-annot-close">Exit annotation</button>
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
