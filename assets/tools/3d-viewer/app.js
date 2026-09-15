/**
 * 3D 模型多视口分析工具
 * ------------------------------------------------------------
 * 架构：Single Renderer, Multiple Viewports
 *   仅创建 1 个 WebGLRenderer，配合 setViewport / setScissor 在同一
 *   Canvas 上绘制 4 个独立视口，共享同一 Scene / Geometry / Material，
 *   显存只占 1 份，规避多 WebGL 上下文的数量限制与性能开销。
 *
 * 四视口（2x2 田字格）：
 *   0 左上：线框（看骨架）   —— overrideMaterial = wireframe
 *   1 右上：UV 棋盘格（看皮囊）—— overrideMaterial = 自定义 UV Shader
 *   2 左下：PBR 标准光照（看光影）—— 原始材质 + 环境贴图 + 阴影
 *   3 右下：法线 / 深度热力图（看异常）—— overrideMaterial = 自定义法线 Shader
 *
 * 全部计算在浏览器本地完成，不上传任何数据。
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { USDZLoader } from 'three/addons/loaders/USDZLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as fflate from 'three/addons/libs/fflate.module.js';

const I18N = {
  zh: {
    'status-load-fail': '加载失败',
    'vn-wire': '线框',
    'vn-normal': '法线',
    'uv-note': '（模型无 UV 坐标，UV 视口无效）',
    'w-tri': '三角面',
    'w-vert': '顶点',
    'puv-pre': '已为 ',
    'puv-post': ' 个网格生成投影 UV（box 投影，非原始数据；导出的文件将包含该 UV）',
    'sample-name': '内置示例 · 环面纽结',
    'err-no-model': '未识别到支持的模型文件（.glb / .gltf / .obj / .fbx / .stl / .usdz，或包含它们的 .zip 压缩包）',
    'parse-pre': '正在解析 ',
    'gltf-hint': '提示：glTF 若引用外部 .bin / 贴图且未内嵌，将无法完整解析；建议连同资源打包成 zip 拖入，或使用 GLB',
    'no-mtl-hint': '提示：未提供 MTL，使用默认材质',
    'usdc-loading': '检测到二进制 usdc 场景，正在加载 WASM 解析器（首次约 1.3MB）…',
    'parse-fail-pre': '解析 ',
    'parse-fail-post': ' 失败：',
    'unzip-pre': '正在解压 ',
    'zip-invalid': '不是合法的 zip 压缩包（也可能是损坏的下载文件）',
    'zip-empty': 'zip 包内没有有效文件',
    'sep': '、',
    'zn-pre': 'zip 内未找到支持的模型文件（共 ',
    'zn-post': ' 个：',
    'zm-pre': 'zip 内识别到 ',
    'zm-post': '，正在解析 …',
    'usd-loading': '检测到 USD 场景，正在加载 WASM 解析器（首次约 1.3MB）…',
    'nm-pre': '',
    'nm-post': '：解析完成但未提取到网格数据',
    'usdz-empty': 'USDZ 无效：zip 包内没有任何文件',
    'usdc-sc-pre': '场景文件（',
    'usdc-sc-post': '）为二进制 usdc 格式',
    'usdz-nf-pre': 'USDZ 内未找到场景文件（首个条目为 ',
    'usdz-nf-post': '），不是标准 usdz 布局',
    'usdz-aa-pre': 'USDZ 内含 ASCII usda（',
    'usdz-aa-mid': '），但其层级 / 语法超出了浏览器端简化解析器的支持范围',
    'usdz-aa-post': '（骨骼、实例、变种等复杂特性不支持），建议转为 GLB 后再导入',
    'usdz-bad-zip': 'USDZ 无效：不是合法的 zip 压缩包',
    'usdc-un': '{F}：usdc 解析完成但未提取到网格数据（骨骼/变种等复杂特性可能不被支持）',
    'exp-pre': '已导出 ',
    'exp-glb-fail': '导出 GLB 失败：',
    'exp-stl-post': '.stl（二进制，可直接用于 3D 打印）',
    'exp-usdz-post': '.usdz（可在 iOS AR Quick Look 中预览）',
    'exp-fail': '导出失败：',
    'measure-off': '关闭测距',
    'measure-on': '开启测距',
    'heat-normal': '法线',
    'heat-depth': '深度',
    'heat-lab-deep': '④ 深度 · 异常 ',
    'heat-lab-norm': '④ 法线 · 异常 '
  },
  en: {
    'status-load-fail': 'Failed to load',
    'vn-wire': 'Wireframe',
    'vn-normal': 'Normals',
    'uv-note': ' (model has no UV coordinates; the UV viewport is inactive)',
    'w-tri': 'triangles',
    'w-vert': 'vertices',
    'puv-pre': 'generated projection UV for ',
    'puv-post': ' mesh(es) (box projection, not original data; exported files will include this UV)',
    'sample-name': 'Built-in sample · Torus knot',
    'err-no-model': 'No supported model file detected (.glb / .gltf / .obj / .fbx / .stl / .usdz, or a .zip archive containing them)',
    'parse-pre': 'Parsing ',
    'gltf-hint': 'Note: if this glTF references external .bin / textures that are not embedded, it cannot be fully parsed; zip the resources together and drop it in, or use GLB',
    'no-mtl-hint': 'Note: no MTL provided, using default materials',
    'usdc-loading': 'Detected a binary usdc scene, loading the WASM parser (about 1.3 MB on first use)…',
    'parse-fail-pre': 'Failed to parse ',
    'parse-fail-post': ': ',
    'unzip-pre': 'Unzipping ',
    'zip-invalid': 'Not a valid zip archive (the download may also be corrupted)',
    'zip-empty': 'No valid files inside the zip',
    'sep': ', ',
    'zn-pre': 'No supported model file found in the zip (',
    'zn-post': '): ',
    'zm-pre': 'Found ',
    'zm-post': ' in the zip, parsing…',
    'usd-loading': 'Detected a USD scene, loading the WASM parser (about 1.3 MB on first use)…',
    'nm-pre': 'Parsing of ',
    'nm-post': ' finished but no mesh data was extracted',
    'usdz-empty': 'Invalid USDZ: the zip contains no files',
    'usdc-sc-pre': 'Scene file (',
    'usdc-sc-post': ') is in binary usdc format',
    'usdz-nf-pre': 'No scene file found in the USDZ (the first entry is ',
    'usdz-nf-post': '), which is not the standard usdz layout',
    'usdz-aa-pre': 'USDZ contains ASCII usda (',
    'usdz-aa-mid': '), but its hierarchy / syntax is beyond this browser-side simplified parser',
    'usdz-aa-post': ' (bones, instances, variants and other complex features are unsupported); convert to GLB before importing',
    'usdz-bad-zip': 'Invalid USDZ: not a valid zip archive',
    'usdc-un': 'usdc parsed but no mesh data was extracted for {F} (complex features such as bones/variants may be unsupported)',
    'exp-pre': 'Exported ',
    'exp-glb-fail': 'Failed to export GLB: ',
    'exp-stl-post': '.stl (binary, ready for 3D printing)',
    'exp-usdz-post': '.usdz (previewable in iOS AR Quick Look)',
    'exp-fail': 'Export failed: ',
    'measure-off': 'Disable measuring',
    'measure-on': 'Enable measuring',
    'heat-normal': 'Normals',
    'heat-depth': 'Depth',
    'heat-lab-deep': '④ Depth · anomalies ',
    'heat-lab-norm': '④ Normals · anomalies '
  }
};
const LANG = (document.documentElement.getAttribute('lang') || 'zh').toLowerCase();
const t = (key) => ((I18N[LANG] && I18N[LANG][key]) != null ? I18N[LANG][key] : (I18N.zh[key] || key));

/* ================= 基础引用 ================= */
const $ = (id) => document.getElementById(id);
const stage = $('tv3d-stage');
const canvas = $('tv3d-canvas');
const statusEl = $('tv3d-status');
const errorEl = $('tv3d-error');
const cells = [...document.querySelectorAll('.tv3d-cell')];
const tabs = [...document.querySelectorAll('#tv3d-tabs button')];
const mlabel = $('tv3d-mlabel');

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
  statusEl.textContent = t('status-load-fail');
}
function clearError() { errorEl.hidden = true; }

/* ================= 渲染器（全站唯一一个） ================= */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 「阴影柔化度」滑块依赖 PCFSoft

const scene = new THREE.Scene();

/* 环境贴图：RoomEnvironment 程序化生成，无需下载任何 HDR 文件 */
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

/* 灯光（只影响 PBR 视口；线框 / UV / 法线视口用的是不受光照的覆写材质） */
const ambient = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(3, 4, 2);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.radius = 4; // 柔化度滑块控制项
const sc = dirLight.shadow.camera;
sc.left = sc.bottom = -3; sc.right = sc.top = 3; sc.near = 0.1; sc.far = 20;
scene.add(dirLight);

/* 阴影承接地面：仅 PBR 视口可见（ShadowMaterial 只显示阴影本身） */
const ground = new THREE.Mesh(
  new THREE.CircleGeometry(3.2, 48),
  new THREE.ShadowMaterial({ opacity: 0.35 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.25;
ground.receiveShadow = true;
scene.add(ground);

/* ================= 相机：4 个相机共享同一份轨道状态 =================
 * 「相机联动」实现要点：旋转 / 平移 / 缩放只修改 orbit 这一份状态，
 * 每帧由 applyCameras() 同步到全部 4 个相机，保证 4 个维度
 * 始终从同一角度观察模型。 */
const cameras = [0, 1, 2, 3].map(() => new THREE.PerspectiveCamera(45, 1, 0.05, 100));
const orbit = { theta: 0.9, phi: 1.15, radius: 4.4, target: new THREE.Vector3(0, 0, 0) };

function applyCameras() {
  const { theta, phi, radius, target } = orbit;
  for (const cam of cameras) {
    cam.position.set(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta)
    );
    cam.lookAt(target);
  }
}

/* ================= 视口覆写材质 ================= */

/* 视口 0：线框（看骨架）—— 检查三角面分布、模型精度、破面 */
const wireMaterial = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x58e6d9,
  transparent: true,
  opacity: 0.9,
});

/* 视口 1：UV 可视化（看皮囊）—— 纯 Shader 实现，无需外部贴图。
 * 片元着色器将 UV 坐标映射为颜色：R 通道随 U 增大、G 通道随 V 增大，
 * 叠加 8x8 棋盘格与细网格线，用于检查 UV 拉伸与贴图变形：
 * 若模型表面棋盘格疏密不均 → UV 被拉伸；方块错位/镜像 → UV 布局异常。 */
const uvMaterial = new THREE.ShaderMaterial({
  uniforms: { uGrid: { value: 8.0 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;                                   // 几何体自带的 UV 坐标
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform float uGrid;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      // 8x8 棋盘格：明暗交替
      float checker = mod(floor(uv.x * uGrid) + floor(uv.y * uGrid), 2.0);
      vec3 col = mix(vec3(0.10), vec3(0.85), checker);
      // U/V 参考色：R 随 U 增大、G 随 V 增大（越红 U 越大、越绿 V 越大）
      col = mix(col, col + vec3(0.25 * uv.x, 0.25 * uv.y, 0.0), 0.35);
      // 细网格线
      vec2 g = abs(fract(uv * uGrid) - 0.5);
      float line = smoothstep(0.46, 0.5, max(g.x, g.y));
      col = mix(col, vec3(1.0), line * 0.25);
      gl_FragColor = vec4(col, 1.0);
    }`,
});

/* 视口 3：法线 / 深度热力图（看异常）—— 自定义顶点着色器。
 * 法线模式：法线方向映射颜色（R=X、G=Y、B=Z，红=+X、绿=+Y、蓝=+Z），
 *   若某块面颜色与周围互补 → 法线翻转（背面朝外）。
 * 深度模式：视图空间深度映射为灰度（近白远黑），观察深度分布。 */
const heatMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uMode: { value: 0.0 }, // 0 = 法线，1 = 深度
    uNear: { value: 0.5 },
    uFar: { value: 8.0 },
  },
  vertexShader: /* glsl */`
    varying vec3 vN;
    varying float vDepth;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mv.z;                              // 视图空间深度（相机前方为 -z）
      vN = normalize(normalMatrix * normal);       // 视图空间法线
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */`
    uniform float uMode;
    uniform float uNear;
    uniform float uFar;
    varying vec3 vN;
    varying float vDepth;
    void main() {
      if (uMode < 0.5) {
        // 法线可视化：*0.5+0.5 把 [-1,1] 压到 [0,1]
        vec3 c = normalize(vN) * 0.5 + 0.5;
        gl_FragColor = vec4(c, 1.0);
      } else {
        float d = clamp((vDepth - uNear) / (uFar - uNear), 0.0, 1.0);
        gl_FragColor = vec4(vec3(1.0 - d), 1.0);   // 近白远黑
      }
    }`,
});

/* 视口 2：PBR —— 不覆写（null），直接渲染模型原始材质 + 环境贴图 + 阴影 */
const overrides = [wireMaterial, uvMaterial, null, heatMaterial];
const viewBgs = [0x0d1117, 0x0e1116, 0x14171c, 0x0e1116];
const viewNames = [t('vn-wire'), 'UV', 'PBR', t('vn-normal')];

/* ================= 模型管理 ================= */
const displayRoot = new THREE.Group(); // 场景中的展示副本（归一化缩放）
scene.add(displayRoot);

let originalRoot = null; // 未缩放的原始对象（导出用，几何 / 材质引用共享）
let normScale = 1;       // 归一化缩放系数（原始单位 → 展示空间）
let modelName = 'torus-knot-example';
let pbrMaterials = [];   // PBR 材质列表（滑块调节用）
let modelHasUV = true;   // 当前模型是否带 UV 坐标（决定 UV 视口提示与生成按钮）

function setModel(object, name) {
  clearError();
  // 清理旧模型
  displayRoot.clear();
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  normScale = 2.2 / maxDim;
  displayRoot.scale.setScalar(normScale);
  displayRoot.position.copy(center).multiplyScalar(-normScale);
  displayRoot.add(object);
  originalRoot = object;

  // 阴影 + 材质收集 + 统计
  pbrMaterials = [];
  let tris = 0, verts = 0, hasUV = false;
  object.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = node.receiveShadow = true;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const m of mats) {
        if (m && !pbrMaterials.includes(m)) {
          pbrMaterials.push(m);
          m._origMetalness = m.metalness ?? null;
          m._origRoughness = m.roughness ?? null;
        }
      }
      const g = node.geometry;
      if (g) {
        const pos = g.attributes.position;
        if (pos) verts += pos.count;
        tris += g.index ? g.index.count / 3 : (pos ? pos.count / 3 : 0);
        if (g.attributes.uv) hasUV = true;
      }
    }
  });

  // 相机重置到合适观察距离
  orbit.target.set(0, 0, 0);
  orbit.radius = 4.4;
  orbit.theta = 0.9;
  orbit.phi = 1.15;
  applyCameras();

  modelName = name;
  modelHasUV = hasUV;
  // 无 UV（常见于 STL / 部分 OBJ / 缺 primvars:st 的 USDZ）时在 UV 视口内给出
  // 明确提示 + 「生成投影 UV」入口，而不是渲染成一片死色
  $('tv3d-uv-hint').hidden = hasUV;
  const uvNote = hasUV ? '' : t('uv-note');
  statusEl.textContent =
    `${name} — ${(tris / 1000).toFixed(1)}k ${t('w-tri')} / ${(verts / 1000).toFixed(1)}k ${t('w-vert')}${uvNote}`;

  // 示例也算已加载模型，导出 / 截图可用
  for (const id of ['tv3d-export-glb', 'tv3d-export-obj', 'tv3d-export-stl', 'tv3d-export-usdz', 'tv3d-snap']) {
    $(id).disabled = false;
  }

  clearMeasure();
  applyMaterialOverride(); // 若覆盖开关已开启，保持覆盖
}

/* 「生成投影 UV」：对缺 uv 属性的几何体做 box 投影 —— 取包围盒最薄的轴
 * 作为投影方向，另外两轴归一化到 [0,1] 作为 UV。这不是原始展开（原始文件
 * 本来就没有），但足以让 UV 棋盘格视口工作、并让导出格式携带 UV。 */
function generateProjectedUVs() {
  let generated = 0;
  originalRoot.traverse((node) => {
    if (!node.isMesh || !node.geometry || node.geometry.attributes.uv) return;
    const g = node.geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox;
    const size = new THREE.Vector3();
    bb.getSize(size);
    const pos = g.attributes.position;
    const uvArr = new Float32Array(pos.count * 2);
    const dims = [size.x, size.y, size.z];
    const flat = dims.indexOf(Math.min(size.x, size.y, size.z)); // 最薄轴 = 投影方向
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      let u, v;
      if (flat === 0) { // 沿 X 投影 → 用 (z, y)
        u = (z - bb.min.z) / (size.z || 1);
        v = (y - bb.min.y) / (size.y || 1);
      } else if (flat === 1) { // 沿 Y 投影 → 用 (x, z)
        u = (x - bb.min.x) / (size.x || 1);
        v = (z - bb.min.z) / (size.z || 1);
      } else { // 沿 Z 投影 → 用 (x, y)
        u = (x - bb.min.x) / (size.x || 1);
        v = (y - bb.min.y) / (size.y || 1);
      }
      uvArr[i * 2] = u;
      uvArr[i * 2 + 1] = v;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
    generated++;
  });
  if (generated > 0) {
    modelHasUV = true;
    $('tv3d-uv-hint').hidden = true;
    statusEl.textContent =
      `${modelName} — ${t('puv-pre')}${generated}${t('puv-post')}`;
  }
}
$('tv3d-gen-uv').addEventListener('click', generateProjectedUVs);

/* 内置示例：环面纽结（有 UV 有法线，四个视口都有内容可看） */
function loadSample() {
  const mesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.72, 0.26, 220, 36),
    new THREE.MeshStandardMaterial({ color: 0xb9c2cc, metalness: 0.45, roughness: 0.32 })
  );
  setModel(mesh, t('sample-name'));
}

/* ================= 文件加载（GLB / glTF / OBJ+MTL / FBX / STL / USDZ / zip 包） ================= */
async function loadFiles(fileList) {
  const files = [...fileList];
  const main = files.find((f) => /\.(glb|gltf|obj|fbx|stl|usdz|zip)$/i.test(f.name));
  if (!main) { showError(t('err-no-model')); return; }
  const ext = main.name.split('.').pop().toLowerCase();
  const baseName = main.name.replace(/\.[^.]+$/, '');

  try {
    statusEl.textContent = t('parse-pre') + main.name + ' …';
    let object;

    if (ext === 'zip') {
      // 模型站（Sketchfab / CGTrader 等）的 glTF / FBX 下载包：zip 内含主模型
      // + .bin / .mtl / 贴图。解包后按包内相对路径重写资源引用，直接加载
      const zipped = await loadZipModel(await main.arrayBuffer(), main.name);
      setModel(zipped.object, zipped.name.replace(/\.[^.]+$/, ''));
      return;
    } else if (ext === 'glb' || ext === 'gltf') {
      const data = ext === 'glb' ? await main.arrayBuffer() : await main.text();
      object = await new Promise((resolve, reject) =>
        new GLTFLoader().parse(data, '', (g) => resolve(g.scene), reject));
      if (ext === 'gltf') {
        // glTF JSON 引用外部 .bin / 贴图时无法单文件解析
        statusEl.textContent = t('gltf-hint');
      }
    } else if (ext === 'obj') {
      const text = await main.text();
      const loader = new OBJLoader();
      const mtlFile = files.find((f) => /\.mtl$/i.test(f.name));
      if (mtlFile) {
        const creator = new MTLLoader().parse(await mtlFile.text(), '');
        creator.preload();
        loader.setMaterials(creator);
      }
      object = loader.parse(text);
      if (!mtlFile) statusEl.textContent = t('no-mtl-hint');
    } else if (ext === 'fbx') {
      const buf = await main.arrayBuffer();
      object = new FBXLoader().parse(buf, '');
    } else if (ext === 'stl') {
      const geo = new STLLoader().parse(await main.arrayBuffer());
      object = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0xb0b6bf, metalness: 0.35, roughness: 0.45,
      }));
      object.name = baseName;
    } else if (ext === 'usdz') {
      // USDZ：zip 打包的 USD 场景。先用 three.js USDZLoader（仅支持 zip 内
      // 嵌 ASCII usda）；若解析出 0 个网格则二次诊断 —— 二进制 usdc（crate）
      // 时切换到 tinyusdz WASM 解析器（懒加载，首次使用才下载 ~1.3MB）
      const buf = await main.arrayBuffer();
      object = new USDZLoader().parse(buf);
      let meshCount = 0;
      object.traverse((n) => { if (n.isMesh && n.geometry && n.geometry.attributes.position) meshCount++; });
      if (meshCount === 0) {
        const d = diagnoseUsdz(buf);
        if (d.crate) {
          statusEl.textContent = t('usdc-loading');
          object = await loadUsdcUsdz(buf, main.name);
        } else {
          throw new Error(d.message);
        }
      }
    }

    setModel(object, baseName);
  } catch (err) {
    console.error(err);
    showError(t('parse-fail-pre') + main.name + t('parse-fail-post') + (err && err.message ? err.message : err));
  }
}

/* ================= zip 模型包加载 =================
 * 模型站（Sketchfab / CGTrader 等）下载的 glTF / FBX 通常是 zip：主模型 +
 * .bin / .mtl / 贴图。解包后为每个条目建 blob URL，用 LoadingManager 的
 * setURLModifier 把模型内部的相对资源路径（scene.bin / textures/x.png，
 * 以及 FBX 常见的反斜杠绝对路径）重写到对应 blob URL，实现拖 zip 直接加载。
 * 贴图由各 Loader 异步拉取，blob URL 延迟到下一次加载新模型时才释放。 */
let zipBlobUrls = [];

function u8Buffer(u8) {
  // Uint8Array → 独立 ArrayBuffer（避免子视图偏移问题）
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
}

async function loadZipModel(buffer, zipName) {
  statusEl.textContent = t('unzip-pre') + zipName + ' …';
  let zip;
  try {
    zip = fflate.unzipSync(new Uint8Array(buffer));
  } catch (e) {
    throw new Error(t('zip-invalid'));
  }
  // 过滤 macOS 打包垃圾（__MACOSX / 隐藏文件 / 目录占位）
  const entries = Object.keys(zip).filter((p) =>
    !p.startsWith('__MACOSX/') && !p.endsWith('/') && !/(^|\/)\.[^.]/.test(p));
  if (entries.length === 0) throw new Error(t('zip-empty'));

  // 选主模型文件：自包含格式优先，带外部资源的格式靠后；同一扩展名有
  // 多个候选时取路径最短的 —— 根目录的主模型优先，避免误选零件分文件 / 预览图
  const pick = (re) => entries.filter((p) => re.test(p))
    .sort((a, b) => a.length - b.length)[0];
  const mainPath = pick(/\.(glb|usdz)$/i) || pick(/\.gltf$/i) || pick(/\.fbx$/i) ||
    pick(/\.obj$/i) || pick(/\.(usdc|usda)$/i) || pick(/\.stl$/i);
  if (!mainPath) {
    const preview = entries.slice(0, 5).join(t('sep'));
    throw new Error(t('zn-pre') + entries.length + t('zn-post') + preview + (entries.length > 5 ? '…' : ''));
  }
  const ext = mainPath.toLowerCase().split('.').pop();
  const mainData = zip[mainPath];

  // 每个条目一个 blob URL；先释放上一批，避免内存累积
  for (const u of zipBlobUrls) URL.revokeObjectURL(u);
  zipBlobUrls = [];
  const urlByPath = new Map();
  for (const p of entries) {
    const u = URL.createObjectURL(new Blob([zip[p]]));
    urlByPath.set(p, u);
    zipBlobUrls.push(u);
  }

  // 资源路径重写：精确路径 → 目录后缀匹配 → 文件名兜底（大小写不敏感）
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (/^(blob:|data:)/.test(url)) return url;
    let clean = url.split('?')[0].split('#')[0].replace(/\\/g, '/');
    try { clean = decodeURIComponent(clean); } catch { /* 非 URL 编码，保留原样 */ }
    clean = clean.replace(/^\.\//, '');
    if (urlByPath.has(clean)) return urlByPath.get(clean);
    for (const [p, u] of urlByPath) {
      if (p.endsWith('/' + clean) || clean.endsWith('/' + p)) return u;
    }
    const base = clean.split('/').pop().toLowerCase();
    for (const [p, u] of urlByPath) {
      if (p.split('/').pop().toLowerCase() === base) return u;
    }
    return url;
  });

  statusEl.textContent = t('zm-pre') + mainPath + t('zm-post');
  let object;
  if (ext === 'glb' || ext === 'gltf') {
    const data = ext === 'glb' ? u8Buffer(mainData) : new TextDecoder().decode(mainData);
    object = await new Promise((resolve, reject) =>
      new GLTFLoader(manager).parse(data, '', (g) => resolve(g.scene), reject));
  } else if (ext === 'fbx') {
    object = new FBXLoader(manager).parse(u8Buffer(mainData), '');
  } else if (ext === 'obj') {
    const loader = new OBJLoader();
    // OBJ 常见多 MTL：同名 > 同目录 > 任意一个
    const stem = (p) => p.split('/').pop().replace(/\.[^.]+$/, '');
    const dirOf = (p) => p.split('/').slice(0, -1).join('/');
    const mtls = entries.filter((p) => /\.mtl$/i.test(p));
    const mtlPath = mtls.find((p) => stem(p) === stem(mainPath)) ||
      mtls.find((p) => dirOf(p) === dirOf(mainPath)) || mtls[0];
    if (mtlPath) {
      const creator = new MTLLoader(manager).parse(new TextDecoder().decode(zip[mtlPath]), '');
      creator.preload();
      loader.setMaterials(creator);
    }
    object = loader.parse(new TextDecoder().decode(mainData));
  } else if (ext === 'stl') {
    const geo = new STLLoader().parse(u8Buffer(mainData));
    object = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0xb0b6bf, metalness: 0.35, roughness: 0.45,
    }));
    object.name = mainPath.split('/').pop();
  } else if (ext === 'usdz') {
    object = new USDZLoader().parse(u8Buffer(mainData));
    let meshCount = 0;
    object.traverse((n) => { if (n.isMesh && n.geometry && n.geometry.attributes.position) meshCount++; });
    if (meshCount === 0) {
      const d = diagnoseUsdz(u8Buffer(mainData));
      if (d.crate) {
        statusEl.textContent = t('usdc-loading');
        object = await loadUsdcUsdz(u8Buffer(mainData), mainPath);
      } else {
        throw new Error(d.message);
      }
    }
  } else if (ext === 'usdc' || ext === 'usda') {
    statusEl.textContent = t('usd-loading');
    object = await loadUsdcUsdz(u8Buffer(mainData), mainPath);
  }

  let count = 0;
  object.traverse((n) => { if (n.isMesh && n.geometry && n.geometry.attributes.position) count++; });
  if (count === 0) throw new Error(t('nm-pre') + mainPath + t('nm-post'));
  return { object, name: mainPath.split('/').pop() };
}

/* USDZ 空结果诊断：打开 zip 看主场景文件到底是什么格式。
 * usdz 规范：zip 的第一个条目即主场景文件（UsdStage）。
 * 返回 { crate: 是否二进制 usdc, message: 诊断文案 }。 */
function diagnoseUsdz(buffer) {
  try {
    const zip = fflate.unzipSync(new Uint8Array(buffer));
    const names = Object.keys(zip);
    if (names.length === 0) return { crate: false, message: t('usdz-empty') };
    const first = names[0];
    const head = zip[first];
    // crate 文件头 8 字节魔数 "PXR-USDC"
    const isCrate = head && head.length >= 8 &&
      head[0] === 0x50 && head[1] === 0x58 && head[2] === 0x52 && head[3] === 0x2D &&
      head[4] === 0x55 && head[5] === 0x53 && head[6] === 0x44 && head[7] === 0x43;
    if (isCrate || /\.usdc$/i.test(first)) {
      return { crate: true, message: t('usdc-sc-pre') + first + t('usdc-sc-post') };
    }
    if (!/\.(usda?|usdc)$/i.test(first)) {
      return { crate: false, message: t('usdz-nf-pre') + first + t('usdz-nf-post') };
    }
    return {
      crate: false,
      message: t('usdz-aa-pre') + first + t('usdz-aa-mid') + t('usdz-aa-post'),
    };
  } catch (e) {
    return { crate: false, message: t('usdz-bad-zip') };
  }
}

/* ================= usdc 二进制解析：tinyusdz WASM（懒加载） =================
 * three.js 官方 USDZLoader 不支持 crate 二进制格式。tinyusdz 是目前浏览器端
 * 唯一成熟的 usdc 解析方案：WASM 核心 zstd 压缩后约 1.3MB，与 three 一起
 * 全部本地托管（lib/tinyusdz/），只在首次遇到 usdc 文件时才动态加载。 */
let tinyUsdzLoaderPromise = null;
async function loadUsdcUsdz(buffer, filename) {
  tinyUsdzLoaderPromise ??= (async () => {
    const { TinyUSDZLoader } = await import(
      '/assets/tools/3d-viewer/lib/tinyusdz/TinyUSDZLoader.js'
    );
    const { TinyUSDZLoaderUtils } = await import(
      '/assets/tools/3d-viewer/lib/tinyusdz/TinyUSDZLoaderUtils.js'
    );
    const loader = new TinyUSDZLoader();
    // useZstdCompressedWasm：加载 tinyusdz.wasm.zst（1.3MB）而非裸 wasm（6.4MB）
    await loader.init({ useZstdCompressedWasm: true });
    return { TinyUSDZLoaderUtils, loader };
  })();

  const { TinyUSDZLoaderUtils, loader } = await tinyUsdzLoaderPromise;
  const url = URL.createObjectURL(new Blob([buffer], { type: 'model/vnd.usdz+zip' }));
  try {
    const usdScene = await loader.loadAsync(url);
    const usdRoot = usdScene.getDefaultRootNode();
    const defaultMtl = TinyUSDZLoaderUtils.createDefaultMaterial();
    const threeNode = await TinyUSDZLoaderUtils.buildThreeNode(usdRoot, defaultMtl, usdScene, {
      overrideMaterial: false, // 保留 USD 材质（UsdPreviewSurface → MeshPhysicalMaterial）
    });
    let count = 0;
    threeNode.traverse((n) => { if (n.isMesh && n.geometry && n.geometry.attributes.position) count++; });
    if (count === 0) {
      throw new Error(t('usdc-un').replace('{F}', filename));
    }
    return threeNode;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ================= 视口分割与渲染循环（核心） =================
 * 单 Canvas 四视口的分割逻辑：
 *   1. layout() 根据容器尺寸 / 模式（四宫格 or 单视口）计算每个视口的
 *      矩形（CSS 像素，坐标原点在左下角，与 setViewport 一致）；
 *   2. renderAll() 对每个视口依次调用 setViewport + setScissor 锁定
 *      绘制区域，设置该视口的 overrideMaterial 与背景色后 render，
 *      同一帧内完成 4 次局部渲染，拼成完整画面；
 *   3. 4 个视口共享同一 Scene —— 显存中的几何体 / 材质只有 1 份。 */
const mqMobile = window.matchMedia('(max-width: 767px)');
let viewMode = mqMobile.matches ? 'single' : 'quad';
let activeVp = 2; // 单视口模式当前显示的视口（默认 PBR）
let rects = [];   // 每视口 CSS 像素矩形 {vp, x, y, w, h}
let devRects = []; // 设备像素矩形（截图用）

function layout() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (viewMode === 'quad') {
    const hw = Math.floor(w / 2), hh = Math.floor(h / 2);
    const rw = w - hw, rh = h - hh;
    rects = [
      { vp: 0, x: 0, y: h - hh, w: hw, h: hh }, // 左上（y 轴向上，所以上半区 y 从 h-hh 起）
      { vp: 1, x: hw, y: h - hh, w: rw, h: hh }, // 右上
      { vp: 2, x: 0, y: 0, w: hw, h: hh },      // 左下
      { vp: 3, x: hw, y: 0, w: rw, h: hh },     // 右下
    ];
  } else {
    rects = [{ vp: activeVp, x: 0, y: 0, w, h }];
  }
  const pr = renderer.getPixelRatio();
  devRects = rects.map((r) => ({
    ...r, x: r.x * pr, y: r.y * pr, w: r.w * pr, h: r.h * pr,
  }));
  for (const r of rects) {
    cameras[r.vp].aspect = r.w / r.h;
    cameras[r.vp].updateProjectionMatrix();
  }
}

function renderAll() {
  for (const r of rects) {
    const vp = r.vp;
    renderer.setViewport(r.x, r.y, r.w, r.h);
    renderer.setScissor(r.x, r.y, r.w, r.h);
    renderer.setScissorTest(true);
    renderer.setClearColor(viewBgs[vp]);
    scene.overrideMaterial = overrides[vp]; // 视口 2 为 null → 用原始 PBR 材质
    ground.visible = vp === 2;              // 阴影地面只在 PBR 视口出现
    measureGroup.visible = vp === 2;        // 测量标记只在 PBR 视口出现
    renderer.render(scene, cameras[vp]);
  }
  scene.overrideMaterial = null;
}

function tick() {
  requestAnimationFrame(tick);
  // 深度模式的归一化范围跟随相机距离动态更新
  heatMaterial.uniforms.uNear.value = Math.max(0.05, orbit.radius - 2.2);
  heatMaterial.uniforms.uFar.value = orbit.radius + 2.2;
  renderAll();
  updateMeasureLabel();
}

/* ================= 自定义轨道控制（四视口联动） =================
 * 不使用 OrbitControls：它绑定单一 DOM 元素且各自独立相机，
 * 无法天然满足「任一视口操作、四视口强制同步」的联动需求。
 * 这里直接维护 orbit 状态：左键旋转、右键/中键/Shift 平移、滚轮缩放。 */
let drag = null;

function eventVp(e) {
  const rect = stage.getBoundingClientRect();
  const px = e.clientX - rect.left, py = e.clientY - rect.top;
  if (viewMode === 'single') return { vp: activeVp, px, py, nx: (px / rect.width) * 2 - 1, ny: -(py / rect.height) * 2 + 1 };
  const col = px > rect.width / 2 ? 1 : 0;
  const row = py > rect.height / 2 ? 1 : 0;
  const vp = row * 2 + col;
  const x0 = col * rect.width / 2, y0 = row * rect.height / 2;
  return {
    vp, px, py,
    nx: ((px - x0) / (rect.width / 2)) * 2 - 1,
    ny: -(((py - y0) / (rect.height / 2)) * 2 - 1),
  };
}

stage.addEventListener('pointerdown', (e) => {
  stage.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, moved: 0, vp: eventVp(e).vp };
});

stage.addEventListener('pointermove', (e) => {
  // 悬停高亮：当前指针所在视口加蓝色边框
  const info = eventVp(e);
  cells.forEach((c) => c.classList.toggle('hover', viewMode === 'quad' && +c.dataset.vp === info.vp));

  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.moved += Math.abs(dx) + Math.abs(dy);
  drag.x = e.clientX; drag.y = e.clientY;

  if (e.shiftKey || e.buttons & 4 || e.buttons & 2) {
    // 平移：沿相机右 / 上方向移动观察目标
    const cam = cameras[drag.vp];
    cam.updateMatrixWorld();
    const el = cam.matrixWorld.elements;
    const right = new THREE.Vector3(el[0], el[1], el[2]);
    const up = new THREE.Vector3(el[4], el[5], el[6]);
    const k = (orbit.radius * 2) / stage.clientHeight;
    orbit.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
  } else {
    // 旋转
    orbit.theta -= dx * 0.006;
    orbit.phi = THREE.MathUtils.clamp(orbit.phi - dy * 0.006, 0.05, Math.PI - 0.05);
  }
  applyCameras();
});

stage.addEventListener('pointerup', (e) => {
  const info = eventVp(e);
  // 测距模式：视口在 PBR（quad 模式下）或单视口模式正好显示 PBR 时拾取
  const measureTarget = viewMode === 'quad' ? info.vp === 2 : activeVp === 2;
  if (drag && drag.moved < 5 && measureMode && measureTarget) {
    pickMeasurePoint(info);
  }
  drag = null;
});

stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  orbit.radius = THREE.MathUtils.clamp(orbit.radius * Math.exp(e.deltaY * 0.0012), 0.3, 60);
  applyCameras();
}, { passive: false });

stage.addEventListener('contextmenu', (e) => e.preventDefault());
stage.addEventListener('pointerleave', () => cells.forEach((c) => c.classList.remove('hover')));

/* ================= 拖拽上传 ================= */
const dropmask = $('tv3d-dropmask');
let dragDepth = 0;
stage.addEventListener('dragenter', (e) => { e.preventDefault(); dragDepth++; dropmask.hidden = false; });
stage.addEventListener('dragover', (e) => e.preventDefault());
stage.addEventListener('dragleave', (e) => { e.preventDefault(); if (--dragDepth <= 0) { dragDepth = 0; dropmask.hidden = true; } });
stage.addEventListener('drop', (e) => {
  e.preventDefault(); dragDepth = 0; dropmask.hidden = true;
  if (e.dataTransfer.files.length) loadFiles(e.dataTransfer.files);
});

/* ================= 导出（GLB / OBJ+MTL / STL） ================= */
function downloadBlob(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function buildMTL(root) {
  // 从模型材质生成简易 MTL（颜色 / 高光 / 透明度 / 漫反射贴图引用）
  const seen = new Map();
  root.traverse((node) => {
    if (!node.isMesh) return;
    const mats = Array.isArray(node.material) ? node.material : [node.material];
    mats.forEach((m, i) => {
      if (m && !seen.has(m)) {
        const name = m.name || `material_${seen.size}`;
        m.name = name; // 与 OBJExporter 输出的 usemtl 对齐
        seen.set(m, name);
      }
    });
  });
  let out = '# Generated by sunyazhou.com 3D viewer\n';
  for (const [m, name] of seen) {
    const c = m.color || new THREE.Color(0.75, 0.75, 0.75);
    const rough = m.roughness ?? 0.5;
    const metal = m.metalness ?? 0;
    out += `\nnewmtl ${name}\n`;
    out += `Kd ${c.r.toFixed(4)} ${c.g.toFixed(4)} ${c.b.toFixed(4)}\n`;
    out += `Ka ${(c.r * 0.1).toFixed(4)} ${(c.g * 0.1).toFixed(4)} ${(c.b * 0.1).toFixed(4)}\n`;
    out += `Ks ${metal.toFixed(4)} ${metal.toFixed(4)} ${metal.toFixed(4)}\n`;
    out += `Ns ${(Math.max(0.02, 1 - rough) * 900).toFixed(0)}\n`;
    if (m.opacity != null && m.opacity < 1) out += `d ${m.opacity.toFixed(4)}\n`;
    if (m.map && m.map.image) {
      const src = m.map.image.src || m.map.image.datasetURI || '';
      const file = src.split('/').pop() || `${name}.png`;
      out += `map_Kd ${file}\n`;
    }
    out += 'illum 2\n';
  }
  return out;
}

async function exportCurrent(type) {
  if (!originalRoot) return;
  const name = modelName.replace(/[^\w.-]+/g, '_');
  originalRoot.updateMatrixWorld(true);
  try {
    if (type === 'glb') {
      new GLTFExporter().parse(originalRoot, (result) => {
        downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), `${name}.glb`);
        statusEl.textContent = t('exp-pre') + name + '.glb';
      }, (err) => showError(t('exp-glb-fail') + (err.message || err)), { binary: true });
    } else if (type === 'obj') {
      buildMTL(originalRoot); // 先统一材质名，保证与 OBJExporter 的 usemtl 输出一致
      const objText = new OBJExporter().parse(originalRoot);
      downloadBlob(new Blob([objText], { type: 'text/plain' }), `${name}.obj`);
      downloadBlob(new Blob([buildMTL(originalRoot)], { type: 'text/plain' }), `${name}.mtl`);
      statusEl.textContent = t('exp-pre') + name + '.obj + ' + name + '.mtl';
    } else if (type === 'stl') {
      const data = new STLExporter().parse(originalRoot, { binary: true });
      downloadBlob(new Blob([data], { type: 'model/stl' }), `${name}.stl`);
      statusEl.textContent = t('exp-pre') + name + t('exp-stl-post');
    } else if (type === 'usdz') {
      const result = await new USDZExporter().parse(originalRoot);
      downloadBlob(new Blob([result], { type: 'model/vnd.usdz+zip' }), `${name}.usdz`);
      statusEl.textContent = t('exp-pre') + name + t('exp-usdz-post');
    }
  } catch (err) {
    showError(t('exp-fail') + (err.message || err));
  }
}
$('tv3d-export-glb').addEventListener('click', () => exportCurrent('glb'));
$('tv3d-export-obj').addEventListener('click', () => exportCurrent('obj'));
$('tv3d-export-stl').addEventListener('click', () => exportCurrent('stl'));
$('tv3d-export-usdz').addEventListener('click', () => exportCurrent('usdz'));

/* ================= P1：滑块实时控制 ================= */
function applyEnvIntensity(v) {
  for (const m of pbrMaterials) if ('envMapIntensity' in m) m.envMapIntensity = v;
}
$('tv3d-ambient').addEventListener('input', (e) => {
  const v = +e.target.value;
  $('tv3d-ambient-v').textContent = v.toFixed(2);
  ambient.intensity = 0.5 * v;
  applyEnvIntensity(v);
});
$('tv3d-direct').addEventListener('input', (e) => {
  const v = +e.target.value;
  $('tv3d-direct-v').textContent = v.toFixed(1);
  dirLight.intensity = v;
});
$('tv3d-shadow').addEventListener('input', (e) => {
  const v = +e.target.value;
  $('tv3d-shadow-v').textContent = String(v);
  dirLight.shadow.radius = v;
});

/* 材质覆盖：强制指定全局金属度 / 粗糙度。
 * 只改 PBR 材质参数 —— 线框 / UV / 法线视口用的是覆写材质，天然不受影响。 */
function applyMaterialOverride() {
  const on = $('tv3d-override').checked;
  const metal = +$('tv3d-metal').value;
  const rough = +$('tv3d-rough').value;
  $('tv3d-metal').disabled = $('tv3d-rough').disabled = !on;
  for (const m of pbrMaterials) {
    if (on) {
      if ('metalness' in m) m.metalness = metal;
      if ('roughness' in m) m.roughness = rough;
    } else if (m._origMetalness != null || m._origRoughness != null) {
      if (m._origMetalness != null) m.metalness = m._origMetalness;
      if (m._origRoughness != null) m.roughness = m._origRoughness;
    }
  }
}
$('tv3d-override').addEventListener('change', applyMaterialOverride);
$('tv3d-metal').addEventListener('input', (e) => {
  $('tv3d-metal-v').textContent = (+e.target.value).toFixed(2);
  applyMaterialOverride();
});
$('tv3d-rough').addEventListener('input', (e) => {
  $('tv3d-rough-v').textContent = (+e.target.value).toFixed(2);
  applyMaterialOverride();
});

/* ================= P2：点对点测距（视口③） ================= */
const raycaster = new THREE.Raycaster();
let measureMode = false;
const measureGroup = new THREE.Group();
scene.add(measureGroup);
const measurePts = [];

function pickMeasurePoint(info) {
  raycaster.setFromCamera(new THREE.Vector2(info.nx, info.ny), cameras[2]);
  const hits = raycaster.intersectObject(displayRoot, true);
  if (!hits.length) return;
  const p = hits[0].point.clone();
  measurePts.push(p);

  const dot = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0x69f0ae })
  );
  dot.position.copy(p);
  measureGroup.add(dot);

  if (measurePts.length === 2) {
    const [a, b] = measurePts;
    const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
    measureGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x69f0ae })));
    // 距离换算：展示空间距离 / 归一化系数 = 模型原始单位距离
    const rawDist = a.distanceTo(b) / normScale;
    mlabel.dataset.dist = String(rawDist);
    mlabel.removeAttribute('hidden');
    mlabel.style.display = '';
  }
}

function updateMeasureLabel() {
  if (measurePts.length !== 2) return;
  const mid = measurePts[0].clone().add(measurePts[1]).multiplyScalar(0.5);
  const ndc = mid.clone().project(cameras[2]);
  const r = rects.find((r) => r.vp === 2);
  if (!r || ndc.z > 1) { mlabel.style.display = 'none'; return; }
  mlabel.style.display = '';
  const px = r.x + ((ndc.x + 1) / 2) * r.w;
  const pyScreen = stage.clientHeight - (r.y + ((1 - ndc.y) / 2) * r.h);
  mlabel.style.left = `${px}px`;
  mlabel.style.top = `${pyScreen}px`;
  mlabel.textContent = formatDistance(+mlabel.dataset.dist, $('tv3d-unit').value);
}

function formatDistance(d, unit) {
  const conv = { m: 1, cm: 0.01, mm: 0.001, inch: 0.0254 };
  const meters = d * (conv[unit] || 1);
  if (meters >= 1) return `${meters.toFixed(3)} m`;
  if (meters >= 0.01) return `${(meters * 100).toFixed(2)} cm`;
  return `${(meters * 1000).toFixed(2)} mm`;
}

function clearMeasure() {
  measureGroup.clear();
  measurePts.length = 0;
  mlabel.style.display = 'none';
}

$('tv3d-measure').addEventListener('click', () => {
  measureMode = !measureMode;
  $('tv3d-measure').textContent = measureMode ? t('measure-off') : t('measure-on');
  $('tv3d-measure').classList.toggle('tv3d-btn-primary', measureMode);
  stage.style.cursor = measureMode ? 'crosshair' : '';
});
$('tv3d-clear-measure').addEventListener('click', clearMeasure);
$('tv3d-unit').addEventListener('change', updateMeasureLabel);

/* ================= P2：截图标注（视口③） ================= */
const annot = $('tv3d-annot');
const annotCanvas = $('tv3d-annot-canvas');
const actx = annotCanvas.getContext('2d');
let annotTool = 'pen', annotColor = '#ff4d4f', annotWidth = 4;
let annotDrawing = null, undoStack = [];

$('tv3d-snap').addEventListener('click', () => {
  // 同步渲染一帧后立即截取 PBR 视口区域（同一事件循环内，无需 preserveDrawingBuffer）
  renderAll();
  const r = devRects.find((r) => r.vp === 2);
  if (!r) return;
  annotCanvas.width = r.w;
  annotCanvas.height = r.h;
  actx.drawImage(canvas, r.x, canvas.height - r.y - r.h, r.w, r.h, 0, 0, r.w, r.h);
  undoStack = [actx.getImageData(0, 0, r.w, r.h)];
  annot.hidden = false;
});

function annotPos(e) {
  const rect = annotCanvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (annotCanvas.width / rect.width),
    y: (e.clientY - rect.top) * (annotCanvas.height / rect.height),
  };
}

annotCanvas.addEventListener('pointerdown', (e) => {
  annotCanvas.setPointerCapture(e.pointerId);
  const p = annotPos(e);
  annotDrawing = { sx: p.x, sy: p.y, last: p };
  if (annotTool !== 'pen') undoStack.push(actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height));
  if (undoStack.length > 25) undoStack.shift();
});

annotCanvas.addEventListener('pointermove', (e) => {
  if (!annotDrawing) return;
  const p = annotPos(e);
  actx.lineCap = 'round';
  actx.lineJoin = 'round';
  actx.strokeStyle = annotColor;
  actx.fillStyle = annotColor;
  actx.lineWidth = annotWidth;
  if (annotTool === 'pen') {
    actx.beginPath();
    actx.moveTo(annotDrawing.last.x, annotDrawing.last.y);
    actx.lineTo(p.x, p.y);
    actx.stroke();
    annotDrawing.last = p;
  } else {
    // 箭头 / 矩形：每帧恢复下笔前快照再画预览
    actx.putImageData(undoStack[undoStack.length - 1], 0, 0);
    if (annotTool === 'arrow') drawArrow(annotDrawing.sx, annotDrawing.sy, p.x, p.y);
    else actx.strokeRect(annotDrawing.sx, annotDrawing.sy, p.x - annotDrawing.sx, p.y - annotDrawing.sy);
  }
});

annotCanvas.addEventListener('pointerup', () => {
  if (annotDrawing) {
    // pen 与 arrow/rect 统一在下笔完成时压栈，保证 undo 一次撤一笔
    undoStack.push(actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height));
    if (undoStack.length > 25) undoStack.shift();
  }
  annotDrawing = null;
});

function drawArrow(x1, y1, x2, y2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const head = Math.max(annotWidth * 3, 12);
  actx.beginPath();
  actx.moveTo(x1, y1);
  actx.lineTo(x2, y2);
  actx.stroke();
  actx.beginPath();
  actx.moveTo(x2, y2);
  actx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
  actx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
  actx.closePath();
  actx.fill();
}

document.querySelectorAll('.tv3d-tool').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tv3d-tool').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  annotTool = b.dataset.tool;
}));
document.querySelectorAll('.tv3d-color').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.tv3d-color').forEach((x) => x.classList.remove('active'));
  b.classList.add('active');
  annotColor = b.dataset.color;
}));
$('tv3d-annot-width').addEventListener('change', (e) => { annotWidth = +e.target.value; });
$('tv3d-annot-undo').addEventListener('click', () => {
  if (undoStack.length > 1) {
    undoStack.pop();
    actx.putImageData(undoStack[undoStack.length - 1], 0, 0);
  }
});
$('tv3d-annot-save').addEventListener('click', () => {
  annotCanvas.toBlob((blob) => downloadBlob(blob, `${modelName || 'snapshot'}.png`));
});
$('tv3d-annot-close').addEventListener('click', () => { annot.hidden = true; });

/* ================= 视口 3 法线 / 深度切换 ================= */
$('tv3d-heat-mode').addEventListener('click', () => {
  const depth = heatMaterial.uniforms.uMode.value < 0.5;
  heatMaterial.uniforms.uMode.value = depth ? 1.0 : 0.0;
  $('tv3d-heat-mode').textContent = depth ? t('heat-normal') : t('heat-depth');
  $('tv3d-heat-label').firstChild.textContent = depth ? t('heat-lab-deep') : t('heat-lab-norm');
});

/* ================= 模式切换 / 响应式 ================= */
function setViewMode(mode) {
  viewMode = mode;
  cells.forEach((c, i) => c.classList.toggle('active', mode === 'single' && i === activeVp));
  tabs.forEach((t) => t.classList.toggle('active', mode === 'single' && +t.dataset.vp === activeVp));
  layout();
}
// 阻止移动端标签切换误触发拖拽 / 测量拾取
$('tv3d-tabs').addEventListener('pointerdown', (e) => e.stopPropagation());
tabs.forEach((t) => t.addEventListener('click', () => {
  activeVp = +t.dataset.vp;
  setViewMode('single');
}));
mqMobile.addEventListener('change', (e) => setViewMode(e.matches ? 'single' : 'quad'));

new ResizeObserver(() => {
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  layout();
}).observe(stage);

/* ================= 启动 ================= */
$('tv3d-load').addEventListener('click', () => $('tv3d-file').click());
$('tv3d-file').addEventListener('change', (e) => { if (e.target.files.length) loadFiles(e.target.files); e.target.value = ''; });

renderer.setSize(stage.clientWidth, stage.clientHeight, false);
layout();
applyCameras();
loadSample();
setViewMode(viewMode);
tick();
