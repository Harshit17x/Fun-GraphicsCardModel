import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/geometries/RoundedBoxGeometry.js";

// DOM Elements
const canvas = document.querySelector("#scene-canvas");
const sceneContainer = document.querySelector("#scene-container");
const sceneLoader = document.querySelector("#sceneLoader");

const btnExplode = document.querySelector("#btnExplode");
const btnExplodeText = document.querySelector("#btnExplodeText");
const explodeSlider = document.querySelector("#explodeSlider");
const explodeValue = document.querySelector("#explodeValue");
const presetButtons = document.querySelectorAll(".preset-btn");
const partPills = document.querySelectorAll(".part-pill");
const btnResetView = document.querySelector("#btnResetView");
const btnAutoRotate = document.querySelector("#btnAutoRotate");
const btnMode3D = document.querySelector("#btnMode3D");
const btnModeLinear = document.querySelector("#btnModeLinear");

const partCard = document.querySelector("#partCard");
const partCardBadge = document.querySelector("#partCardBadge");
const partCardTitle = document.querySelector("#partCardTitle");
const partCardBody = document.querySelector("#partCardBody");
const partCardClose = document.querySelector("#partCardClose");
const statMaterial = document.querySelector("#statMaterial");
const statFunction = document.querySelector("#statFunction");
const statDimensions = document.querySelector("#statDimensions");
const statCooling = document.querySelector("#statCooling");

// Three.js Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e1014);

const camera = new THREE.PerspectiveCamera(34, window.innerWidth / window.innerHeight, 0.1, 120);
// Tilted perspective showcasing the iconic front hourglass X-frame and axial fan
camera.position.set(5.5, 17.5, 12.5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.35;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 6.0;
controls.maxDistance = 38;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 0.7;

const clock = new THREE.Clock();
const pointer = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const interactiveMeshes = [];
const groupTransformData = new Map();

// ---------------- Textures Generation (NVIDIA Typography & Dies) ----------------

function createRtx4090Texture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#141518";
  ctx.fillRect(0, 0, c.width, c.height);

  // Subtle metallic diagonal grain
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 2;
  for (let i = -512; i < 1500; i += 16) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 400, 512);
    ctx.stroke();
  }

  // Laser-etched RTX 4090 logo
  ctx.fillStyle = "#e2e5e9";
  ctx.font = "700 110px 'Inter', sans-serif";
  ctx.fillText("RTX 4090", 110, 260);

  ctx.fillStyle = "#7a828e";
  ctx.font = "600 28px 'Inter', sans-serif";
  ctx.letterSpacing = "0.2em";
  ctx.fillText("FOUNDERS EDITION • 24 GB", 112, 320);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGeforceLogoTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0c0d10";
  ctx.fillRect(0, 0, c.width, c.height);

  // White illuminated logo
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 62px 'Inter', sans-serif";
  ctx.letterSpacing = "0.08em";
  ctx.fillText("GEFORCE RTX", 60, 86);

  // Green accent bar
  ctx.fillStyle = "#76b900";
  ctx.fillRect(495, 34, 10, 58);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGpuDieTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d");

  // Mirror silicon base
  ctx.fillStyle = "#1b2128";
  ctx.fillRect(0, 0, c.width, c.height);

  // Iridescent silicon wafer circuit grid
  ctx.strokeStyle = "rgba(77, 182, 172, 0.18)";
  ctx.lineWidth = 1;
  for (let x = 0; x < c.width; x += 16) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, c.height);
    ctx.stroke();
  }
  for (let y = 0; y < c.height; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(c.width, y);
    ctx.stroke();
  }

  // Silicon core boundary
  ctx.strokeStyle = "#76b900";
  ctx.lineWidth = 8;
  ctx.strokeRect(120, 120, 784, 784);

  // NVIDIA Eye Logo Mark
  ctx.fillStyle = "#76b900";
  ctx.beginPath();
  ctx.arc(512, 430, 90, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b2128";
  ctx.beginPath();
  ctx.arc(512, 430, 55, 0, Math.PI * 2);
  ctx.fill();

  // Typography
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 68px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NVIDIA", 512, 590);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "600 32px 'Inter', sans-serif";
  ctx.fillText("AD102-300-A1", 512, 650);
  ctx.font = "500 24px 'Inter', sans-serif";
  ctx.fillText("ADA LOVELACE • TSMC 4N", 512, 700);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBackplateXTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#151619";
  ctx.fillRect(0, 0, c.width, c.height);

  // Subtle X-truss lines
  ctx.strokeStyle = "rgba(194, 181, 155, 0.45)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(80, 40);
  ctx.lineTo(944, 472);
  ctx.moveTo(944, 40);
  ctx.lineTo(80, 472);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  ctx.font = "700 32px 'Inter', sans-serif";
  ctx.fillText("RTX 4090", 120, 420);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------- Materials Palette (Authentic RTX 4090 FE) ----------------
const palette = {
  // Champagne/Titanium anodized unibody frame
  champagne: new THREE.MeshPhysicalMaterial({
    color: 0xc2b59b,
    metalness: 0.9,
    roughness: 0.22,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  }),
  // Powder-coated matte obsidian black body
  matteBlack: new THREE.MeshPhysicalMaterial({
    color: 0x141518,
    metalness: 0.32,
    roughness: 0.44,
  }),
  // Dark graphite anodized aluminum
  graphite: new THREE.MeshStandardMaterial({ color: 0x24272c, metalness: 0.78, roughness: 0.28 }),
  graphiteSoft: new THREE.MeshStandardMaterial({ color: 0x3a3f45, metalness: 0.68, roughness: 0.35 }),
  // Cooling radiator aluminum fins
  finMetal: new THREE.MeshStandardMaterial({ color: 0x484f56, metalness: 0.88, roughness: 0.26 }),
  finMetalDark: new THREE.MeshStandardMaterial({ color: 0x2c3136, metalness: 0.82, roughness: 0.32 }),
  // Sintered copper heat pipes
  copper: new THREE.MeshStandardMaterial({ color: 0xc87042, metalness: 0.95, roughness: 0.22 }),
  // High-density PCB substrate
  pcb: new THREE.MeshStandardMaterial({ color: 0x09261a, metalness: 0.25, roughness: 0.55 }),
  pcbTrace: new THREE.MeshStandardMaterial({ color: 0x4db5b9, metalness: 0.55, roughness: 0.3 }),
  // Mirror-polished silicon GPU die
  siliconDie: new THREE.MeshPhysicalMaterial({
    map: createGpuDieTexture(),
    metalness: 0.96,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  }),
  // Micron GDDR6X BGA ICs
  vramChip: new THREE.MeshStandardMaterial({ color: 0x181a1d, metalness: 0.6, roughness: 0.3 }),
  // Hard gold contacts (PCIe and 12VHPWR)
  gold: new THREE.MeshStandardMaterial({ color: 0xd9a845, metalness: 0.98, roughness: 0.15 }),
  // Blue silicone thermal conductivity pads
  thermalPad: new THREE.MeshStandardMaterial({ color: 0x2e6f8a, roughness: 0.85, metalness: 0.1 }),
  // Brushed stainless steel I/O bracket
  steel: new THREE.MeshStandardMaterial({ color: 0x858e96, metalness: 0.94, roughness: 0.2 }),
  // Fan impeller blades
  fanBlade: new THREE.MeshPhysicalMaterial({
    color: 0x16181b,
    metalness: 0.45,
    roughness: 0.3,
    clearcoat: 0.4,
  }),
  // Spun metal metallic fan spinner hub
  fanHubSpinner: new THREE.MeshStandardMaterial({ color: 0x98a2ad, metalness: 0.92, roughness: 0.18 }),
  // Illuminated GEFORCE RTX side logo
  geforceGlow: new THREE.MeshBasicMaterial({
    map: createGeforceLogoTexture(),
  }),
  // DisplayPort blue status glow
  blueGlow: new THREE.MeshStandardMaterial({
    color: 0x76b900,
    emissive: 0x3d6600,
    emissiveIntensity: 1.6,
  }),
};

// ---------------- Explosion State & Dual Modes ----------------
let explosionTarget = 0.0;
let explosionProgress = 0.0;
let explodeMode = "3d"; // "3d" (layered stack) or "linear" (1-8 blueprint strip)

function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  interactiveMeshes.push(mesh);
  return mesh;
}

function rememberPartTransform(object, stackPos, linearPos) {
  groupTransformData.set(object, {
    normal: object.position.clone(),
    stack: new THREE.Vector3(...stackPos),
    linear: new THREE.Vector3(...linearPos),
  });
}

// ---------------- 120mm Axial Flow Fan Assembly ----------------
function createAxialFan(parent, isFront = true) {
  const fanGroup = new THREE.Group();
  parent.add(fanGroup);

  // Outer aerodynamic duct ring connecting the blade tips
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.68, 0.06, 16, 64), palette.fanBlade);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.castShadow = true;
  fanGroup.add(outerRing);

  // Impeller Blade Group (7 aerodynamic swept blades)
  const bladeGroup = new THREE.Group();
  fanGroup.add(bladeGroup);
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.06, 1.35),
      palette.fanBlade,
    );
    blade.position.set(Math.sin(angle) * 0.75, 0, Math.cos(angle) * 0.75);
    blade.rotation.y = angle + (isFront ? 0.42 : -0.42);
    blade.rotation.x = isFront ? 0.15 : -0.15;
    blade.castShadow = true;
    bladeGroup.add(blade);
  }

  // Concave motor hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.58, 0.24, 48), palette.matteBlack);
  hub.castShadow = true;
  fanGroup.add(hub);

  // Center spin-finish metallic cap
  const centerCap = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 36), palette.fanHubSpinner);
  centerCap.position.y = isFront ? 0.13 : -0.13;
  fanGroup.add(centerCap);

  fanGroup.userData = { bladeGroup, isFront };
  return fanGroup;
}

// ---------------- The 8 Authentic Assemblies (Ref Blueprint 1 to 8) ----------------

// PART 1: FRONT SHROUD (Hourglass X-Frame & RTX 4090 Inscription)
function createPart1FrontShroud(card) {
  const group = new THREE.Group();
  group.position.set(0, 0.98, 0);
  card.add(group);
  rememberPartTransform(group, [0, 4.4, 0.3], [-14.0, 0, 0]);

  // Outer unibody champagne-gold beveled perimeter rim (304 mm x 137 mm proportion: 10.0 x 4.5)
  addMesh(group, new RoundedBoxGeometry(10.0, 0.22, 4.5, 0.25, 6), palette.champagne, [0, 0, 0]);

  // Recessed matte black face insert
  addMesh(group, new RoundedBoxGeometry(9.6, 0.1, 4.1, 0.18, 5), palette.matteBlack, [0, 0.08, 0]);

  // Left side matte plate with laser-etched "RTX 4090"
  const rtxTexture = createRtx4090Texture();
  const rtxMat = new THREE.MeshBasicMaterial({ map: rtxTexture, side: THREE.DoubleSide });
  const rtxPlate = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.8), rtxMat);
  rtxPlate.rotation.x = -Math.PI / 2;
  rtxPlate.position.set(-2.45, 0.14, 0);
  group.add(rtxPlate);

  // Right circular intake aperture well
  const intakeWell = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.78, 0.12, 64), palette.matteBlack);
  intakeWell.position.set(2.45, 0.08, 0);
  group.add(intakeWell);

  // Center diagonal X-brace rib (Champagne Gold)
  const rib1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 5.2), palette.champagne);
  rib1.rotation.y = 0.44;
  rib1.position.y = 0.14;
  group.add(rib1);

  const rib2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 5.2), palette.champagne);
  rib2.rotation.y = -0.44;
  rib2.position.y = 0.14;
  group.add(rib2);

  group.userData = { partKey: "frontShroud", partNum: 1 };
  return group;
}

// PART 2: AXIAL FAN (120mm Fluid-Dynamic Bearing Intake Fan)
function createPart2AxialFan(card) {
  const group = new THREE.Group();
  group.position.set(2.45, 0.82, 0);
  card.add(group);
  rememberPartTransform(group, [2.45, 3.4, 0.2], [-10.0, 0, 0]);

  const fan = createAxialFan(group, true);
  group.userData = { fan, partKey: "frontFan", partNum: 2 };
  return group;
}

// PART 3: FAN FRAME (Structural Inner Cast Skeleton)
function createPart3FanFrame(card) {
  const group = new THREE.Group();
  group.position.set(2.45, 0.52, 0);
  card.add(group);
  rememberPartTransform(group, [2.45, 2.4, 0.1], [-6.0, 0, 0]);

  // Cast-aluminum circular motor mounting frame
  addMesh(group, new THREE.CylinderGeometry(1.82, 1.82, 0.18, 48, 1, true), palette.graphite, [0, 0, 0]);

  // Triangular motor support struts
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 1.7), palette.graphite);
    strut.position.set(Math.sin(angle) * 0.85, 0, Math.cos(angle) * 0.85);
    strut.rotation.y = angle;
    group.add(strut);
  }

  // Motor stator casing with gold coil accents
  addMesh(group, new THREE.CylinderGeometry(0.68, 0.68, 0.16, 32), palette.matteBlack, [0, 0, 0]);
  addMesh(group, new THREE.TorusGeometry(0.55, 0.04, 10, 32), palette.gold, [0, 0, 0], [Math.PI / 2, 0, 0]);

  group.userData = { partKey: "fanFrame", partNum: 3 };
  return group;
}

// PART 4: HEATSINK (Dual Fin-Stack Radiator & Sintered Heat Pipes)
function createPart4Heatsink(card) {
  const group = new THREE.Group();
  group.position.set(0, 0.22, 0);
  card.add(group);
  rememberPartTransform(group, [0, 1.35, 0], [-2.0, 0, 0]);

  // Vapor chamber copper nickel baseplate
  addMesh(group, new RoundedBoxGeometry(3.0, 0.14, 2.6, 0.04, 3), palette.copper, [-0.2, -0.16, 0]);

  // Massive 64 dark cooling fins
  for (let i = 0; i < 64; i += 1) {
    const x = -4.4 + i * 0.14;
    // Skip opening for front fan pass-through
    if (x > 0.8 && x < 4.1) {
      // Lower fins beneath front fan
      const lowerFin = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.38, 3.8), palette.finMetalDark);
      lowerFin.position.set(x, -0.15, 0);
      lowerFin.castShadow = true;
      group.add(lowerFin);
    } else {
      // Full height fins
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.82, 3.9), i % 4 === 0 ? palette.finMetal : palette.finMetalDark);
      fin.position.set(x, 0.14, 0);
      fin.castShadow = true;
      group.add(fin);
    }
  }

  // 4x Looping Sintered Copper Heat Pipes (Signature 4090 looping geometry)
  const pipeMat = palette.copper;
  const pipe1 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.065, 12, 48, Math.PI), pipeMat);
  pipe1.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  pipe1.position.set(-1.2, 0.1, 0.4);
  group.add(pipe1);

  const pipe2 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.06, 12, 48, Math.PI), pipeMat);
  pipe2.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  pipe2.position.set(-1.2, 0.1, -0.4);
  group.add(pipe2);

  const pipe3 = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.065, 12, 48, Math.PI), pipeMat);
  pipe3.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  pipe3.position.set(0.6, 0.05, 0.6);
  group.add(pipe3);

  group.userData = { partKey: "heatsink", partNum: 4 };
  return group;
}

// PART 5: COMPACT V-NOTCHED PCB (AD102 GPU Silicon + 24GB GDDR6X + VRMs)
function createPart5Pcb(card) {
  const group = new THREE.Group();
  group.position.set(0, -0.15, 0);
  card.add(group);
  // Stays centered on the focal axis
  rememberPartTransform(group, [0, -0.15, 0], [2.0, 0, 0]);

  // Main 14-layer dark emerald substrate
  addMesh(group, new RoundedBoxGeometry(8.2, 0.12, 3.8, 0.06, 4), palette.pcb, [-0.3, 0, 0]);

  // Rear V-Notch cutout (authentic 4090 PCB shape)
  addMesh(group, new THREE.BoxGeometry(1.2, 0.14, 1.4), palette.matteBlack, [3.4, 0, 0]);

  // NVIDIA AD102 Silicon Core Die (Exact proportions with reflective silicon wafer)
  const die = addMesh(group, new RoundedBoxGeometry(1.9, 0.1, 1.6, 0.04, 3), palette.siliconDie, [-0.5, 0.1, 0]);
  // Silver retention bracket frame
  addMesh(group, new THREE.CylinderGeometry(1.25, 1.25, 0.08, 4), palette.steel, [-0.5, 0.07, 0], [0, Math.PI / 4, 0]);

  // 12x Micron GDDR6X VRAM ICs surrounding the core
  for (let i = 0; i < 12; i += 1) {
    const chip = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.07, 0.38, 0.03, 2), palette.vramChip);
    const row = Math.floor(i / 6);
    const col = i % 6;
    chip.position.set(-2.3 + col * 0.72, 0.09, row === 0 ? -1.3 : 1.3);
    group.add(chip);
  }

  // 23-Phase DrMOS Power Stage Inductors (Chokes)
  for (let i = 0; i < 16; i += 1) {
    const choke = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.16, 0.24, 0.03, 2), palette.graphite);
    choke.position.set(1.95, 0.12, -1.5 + i * 0.2);
    group.add(choke);
  }

  // High-Frequency Solid Polymer Capacitors
  for (let i = 0; i < 12; i += 1) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.22, 16), palette.steel);
    cap.position.set(-2.8, 0.14, -1.2 + i * 0.22);
    group.add(cap);
  }

  // Micro-circuit signal trace lines
  for (let i = 0; i < 16; i += 1) {
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.016, 1.8), palette.pcbTrace);
    trace.position.set(-2.2 + i * 0.26, 0.075, 0);
    trace.rotation.y = i % 2 ? 0.08 : -0.08;
    group.add(trace);
  }

  group.userData = { partKey: "pcb", partNum: 5 };
  return group;
}

// PART 6: THERMAL MIDPLATE (Die-Cast Aluminum Stiffener & Heat Spreader)
function createPart6ThermalPlate(card) {
  const group = new THREE.Group();
  group.position.set(0, -0.42, 0);
  card.add(group);
  rememberPartTransform(group, [0, -1.4, 0], [6.0, 0, 0]);

  // Die-cast aluminum frame with cutouts
  addMesh(group, new RoundedBoxGeometry(8.6, 0.1, 4.0, 0.05, 3), palette.graphite, [-0.2, 0, 0]);

  // Center window cutout exposing GPU socket
  addMesh(group, new THREE.BoxGeometry(2.4, 0.14, 2.2), palette.matteBlack, [-0.5, 0, 0]);

  // Blue thermal conductivity pads for memory modules and VRMs
  for (let i = 0; i < 10; i += 1) {
    const pad = new THREE.Mesh(new RoundedBoxGeometry(0.52, 0.04, 0.42, 0.02, 2), palette.thermalPad);
    pad.position.set(-2.1 + (i % 5) * 0.85, 0.06, i < 5 ? -1.3 : 1.3);
    group.add(pad);
  }

  group.userData = { partKey: "thermalPlate", partNum: 6 };
  return group;
}

// PART 7: REINFORCED BACKPLATE (Anodized Alloy Armor & Spring X-Bracket)
function createPart7Backplate(card) {
  const group = new THREE.Group();
  group.position.set(0, -0.78, 0);
  card.add(group);
  rememberPartTransform(group, [0, -2.7, -0.2], [10.0, 0, 0]);

  // Anodized black backplate
  const backTex = createBackplateXTexture();
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    color: 0x181a1d,
    metalness: 0.85,
    roughness: 0.35,
  });
  const plate = new THREE.Mesh(new RoundedBoxGeometry(9.6, 0.12, 4.3, 0.15, 4), backMat);
  plate.castShadow = true;
  group.add(plate);
  interactiveMeshes.push(plate);

  // Left flow-through exhaust window
  addMesh(group, new THREE.BoxGeometry(3.6, 0.16, 3.4), palette.matteBlack, [-2.4, 0, 0]);

  // Spring-Steel X-Bracket (GPU Socket retention clamp)
  const xBracket = new THREE.Group();
  xBracket.position.set(1.4, -0.08, 0);
  group.add(xBracket);

  const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 2.4), palette.champagne);
  arm1.rotation.y = Math.PI / 4;
  xBracket.add(arm1);

  const arm2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 2.4), palette.champagne);
  arm2.rotation.y = -Math.PI / 4;
  xBracket.add(arm2);

  // 4 Corner spring-loaded screws
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 16), palette.steel);
    screw.position.set(Math.sin(angle) * 0.95, -0.04, Math.cos(angle) * 0.95);
    xBracket.add(screw);
  }

  // Perimeter hex mounting screws
  for (let i = 0; i < 8; i += 1) {
    const x = i < 4 ? -4.3 : 4.3;
    const z = -1.6 + (i % 4) * 1.05;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16), palette.steel);
    screw.position.set(x, -0.08, z);
    group.add(screw);
  }

  group.userData = { partKey: "backplate", partNum: 7 };
  return group;
}

// PART 8: REAR SHROUD & EXHAUST FAN (Flow-Through Dual Axial Cooling)
function createPart8RearShroud(card) {
  const group = new THREE.Group();
  group.position.set(0, -0.98, 0);
  card.add(group);
  rememberPartTransform(group, [0, -4.2, -0.3], [14.0, 0, 0]);

  // Rear champagne-gold beveled outer rim
  addMesh(group, new RoundedBoxGeometry(10.0, 0.2, 4.5, 0.25, 6), palette.champagne, [0, 0, 0]);

  // Left circular aperture housing the REAR EXHAUST FAN
  const rearWell = new THREE.Mesh(new THREE.CylinderGeometry(1.82, 1.82, 0.14, 48), palette.matteBlack);
  rearWell.position.set(-2.45, 0, 0);
  group.add(rearWell);

  // Second 120mm Axial Flow Fan (Counter-Rotating Flow-Through)
  const rearFan = createAxialFan(group, false);
  rearFan.position.set(-2.45, -0.06, 0);

  // Right side flow-through ventilation grilles
  for (let i = 0; i < 18; i += 1) {
    const grille = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 3.4), palette.graphite);
    grille.position.set(1.2 + i * 0.18, 0.05, 0);
    group.add(grille);
  }

  group.userData = { rearFan, partKey: "rearShroud", partNum: 8 };
  return group;
}

// ---------------- Exterior Details (I/O Bracket, PCIe, 12VHPWR Logo) ----------------

function createIoBracket(card) {
  const bracket = new THREE.Group();
  bracket.position.set(-5.08, 0, 0);
  card.add(bracket);
  rememberPartTransform(bracket, [-7.6, 0, 0], [-17.5, 0, 0]);

  // 3-Slot Stainless Steel PCI Bracket
  addMesh(bracket, new RoundedBoxGeometry(0.16, 2.15, 4.4, 0.03, 3), palette.steel, [0, 0, 0]);

  // Hexagonal Exhaust Ventilation Grille
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 6; col += 1) {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.18), palette.matteBlack);
      vent.position.set(-0.09, -0.6 + row * 0.3, -1.2 + col * 0.28);
      bracket.add(vent);
    }
  }

  // 3x DisplayPort 1.4a/2.1 outputs
  for (let i = 0; i < 3; i += 1) {
    const dp = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.44), palette.blueGlow);
    dp.position.set(-0.1, 0.45, -1.0 + i * 0.65);
    bracket.add(dp);
  }

  // 1x HDMI 2.1a output
  const hdmi = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.42), palette.blueGlow);
  hdmi.position.set(-0.1, 0.45, 1.15);
  bracket.add(hdmi);

  bracket.userData = { partKey: "bracket" };
  return bracket;
}

function createPcieConnector(card) {
  const conn = new THREE.Group();
  conn.position.set(0.6, -0.22, 2.32);
  card.add(conn);
  rememberPartTransform(conn, [0.6, -0.9, 3.8], [2.0, -2.5, 0]);

  // PCIe PCB Tongue
  addMesh(conn, new RoundedBoxGeometry(5.2, 0.18, 0.32, 0.03, 3), palette.matteBlack, [0, 0, 0]);

  // 16x Hard Gold-Plated Fingers
  for (let i = 0; i < 18; i += 1) {
    addMesh(conn, new THREE.BoxGeometry(0.18, 0.16, 0.035), palette.gold, [-2.2 + i * 0.26, 0, 0.16]);
  }

  conn.userData = { partKey: "pcie" };
  return conn;
}

function createTopLogoAndPower(card) {
  const topGroup = new THREE.Group();
  topGroup.position.set(0, 0, -2.26);
  card.add(topGroup);
  rememberPartTransform(topGroup, [0, 1.2, -3.8], [-2.0, 2.5, 0]);

  // Illuminated "GEFORCE RTX" Logo Plate
  const logoPlate = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.48), palette.geforceGlow);
  logoPlate.position.set(1.8, 0.14, -0.02);
  topGroup.add(logoPlate);

  // 16-Pin 12VHPWR Power Receptacle
  addMesh(topGroup, new RoundedBoxGeometry(0.9, 0.38, 0.26, 0.03, 3), palette.matteBlack, [-1.8, 0.12, -0.06]);
  // 16 terminal gold pins
  for (let r = 0; r < 2; r += 1) {
    for (let c = 0; c < 6; c += 1) {
      addMesh(topGroup, new THREE.BoxGeometry(0.04, 0.04, 0.03), palette.gold, [-2.1 + c * 0.12, 0.06 + r * 0.12, -0.19]);
    }
  }

  topGroup.userData = { partKey: "power" };
  return topGroup;
}

// ---------------- Master Card Assembly ----------------
function createRtx4090Card() {
  const card = new THREE.Group();
  card.rotation.set(-0.48, 0.32, -0.12);
  scene.add(card);

  // 8 Exact Assemblies from Reference Image
  const part1 = createPart1FrontShroud(card);
  const part2 = createPart2AxialFan(card);
  const part3 = createPart3FanFrame(card);
  const part4 = createPart4Heatsink(card);
  const part5 = createPart5Pcb(card);
  const part6 = createPart6ThermalPlate(card);
  const part7 = createPart7Backplate(card);
  const part8 = createPart8RearShroud(card);

  // Exterior Interfaces
  const bracket = createIoBracket(card);
  const pcie = createPcieConnector(card);
  const topBar = createTopLogoAndPower(card);

  card.userData = {
    part1,
    part2,
    part3,
    part4,
    part5,
    part6,
    part7,
    part8,
    bracket,
    pcie,
    topBar,
  };
  return card;
}

// ---------------- Studio Lighting (Cinematic GeForce Look) ----------------
function createStudioLighting() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x181a20, 1.4));

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.6);
  keyLight.position.set(6, 12, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -12;
  keyLight.shadow.camera.right = 12;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -12;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xcfd8e3, 3.8);
  rimLight.position.set(-8, 5, -6);
  scene.add(rimLight);

  // Signature NVIDIA GeForce green accent glow
  const greenGlow = new THREE.PointLight(0x76b900, 2.4, 16, 2);
  greenGlow.position.set(-5, 3.5, 4.5);
  scene.add(greenGlow);

  const topFill = new THREE.PointLight(0xffffff, 2.5, 14, 2);
  topFill.position.set(0, 9, 0);
  scene.add(topFill);
}

const card = createRtx4090Card();
createStudioLighting();

const baseCameraPosition = camera.position.clone();
const baseTarget = controls.target.clone();

function resizeRenderer() {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

// ---------------- Technical Specifications (Authentic RTX 4090 Data) ----------------
const partData = {
  frontShroud: {
    num: "PART 01",
    title: "1. Front Shroud & Hourglass X-Frame",
    desc: "Unibody champagne-gold anodized aluminum perimeter frame with radiused corners, matte black left face, and circular intake duct for the front axial fan.",
    material: "CNC Extruded Aluminum Alloy (Anodized Champagne)",
    arch: "NVIDIA Dual Axial Flow-Through Shroud",
    dims: "304 mm × 137 mm × 12 mm",
    cooling: "Active Front Intake Guide Channel",
  },
  frontFan: {
    num: "PART 02",
    title: "2. Front Axial Flow Fan (Intake)",
    desc: "120mm counter-rotating axial fan with 7 aerodynamic swept blades connected by an outer stabilizer duct ring and spun-finish metallic center spinner.",
    material: "Reinforced Polycarbonate & Metallic Cap",
    arch: "Fluid Dynamic Bearing (FDB) Brushless Motor",
    dims: "Ø 120 mm × 25 mm Depth",
    cooling: "Pulls High-Velocity Cool Air Across Radiator",
  },
  fanFrame: {
    num: "PART 03",
    title: "3. Structural Cast Fan Frame",
    desc: "Die-cast aluminum internal mounting bracket with triangular aerodynamic motor support struts and integrated vibration isolation dampeners.",
    material: "Die-Cast A380 Aluminum",
    arch: "Tri-Strut Motor Retention Armature",
    dims: "125 mm × 125 mm × 15 mm",
    cooling: "Optimized Air Turbulence Minimization",
  },
  heatsink: {
    num: "PART 04",
    title: "4. Massive Heatsink & Heat Pipes",
    desc: "Massive dual radiator core with 64 ultra-fine dark aluminum cooling fins, nickel-plated vapor chamber baseplate, and 4 looped sintered copper heat pipes.",
    material: "Alloy 1050 Stamped Fins & Sintered Copper",
    arch: "Dual-Stack Vapor Chamber Cooling Engine",
    dims: "270 mm × 130 mm × 45 mm",
    cooling: "Dissipates up to 450W - 600W Total TDP",
  },
  pcb: {
    num: "PART 05",
    title: "5. Compact V-Notched PCB (GPU + VRAM)",
    desc: "14-layer server-grade compact PCB featuring the NVIDIA AD102-300-A1 silicon die, 24 GB GDDR6X Micron memory, and 23-phase DrMOS power stages.",
    material: "High-TG FR-4 Epoxy & 2oz Copper Traces",
    arch: "Ada Lovelace AD102 (16,384 CUDA Cores / 76.3B Transistors)",
    dims: "215 mm × 128 mm × 1.8 mm (V-Notched)",
    cooling: "Direct Vapor Chamber & Thermal Pad Contact",
  },
  thermalPlate: {
    num: "PART 06",
    title: "6. Die-Cast Thermal Midplate",
    desc: "Precision structural aluminum midframe providing torsional anti-sag rigidity and dual-sided thermal dissipation pads for VRAM and MOSFET power stages.",
    material: "Die-Cast Aluminum with Silicone Thermal Pads",
    arch: "Full-Board Stiffener & Heat Spreader",
    dims: "235 mm × 132 mm × 4 mm",
    cooling: "Transfers VRAM & VRM Heat to Main Heatsink",
  },
  backplate: {
    num: "PART 07",
    title: "7. Reinforced Backplate & X-Bracket",
    desc: "Anodized obsidian aluminum backplate with stamped X-truss reinforcement lines, countersunk perimeter screws, and spring-steel GPU retention X-clamp.",
    material: "Anodized 6061-T6 Aluminum & Spring Steel",
    arch: "Structural Rigid Armor & Flow-Through Vents",
    dims: "300 mm × 135 mm × 3.5 mm",
    cooling: "Passive Back Radiation & Socket Clamping",
  },
  rearShroud: {
    num: "PART 08",
    title: "8. Rear Shroud & Exhaust Fan",
    desc: "Rear unibody housing with parallel fin exhaust grilles and the second 120mm axial exhaust fan, pulling air through the card and exhausting directly upward.",
    material: "Anodized Champagne Aluminum & FDB Fan",
    arch: "Patented Flow-Through Rear Exhaust Architecture",
    dims: "304 mm × 137 mm × 14 mm",
    cooling: "Pushes Hot Air Out Top/Back of Chassis",
  },
};

function showPartInfo(key) {
  const data = partData[key];
  if (!data || !partCard) return;
  partCardBadge.textContent = data.num;
  partCardTitle.textContent = data.title;
  partCardBody.textContent = data.desc;
  statMaterial.textContent = data.material;
  statFunction.textContent = data.arch;
  statDimensions.textContent = data.dims;
  statCooling.textContent = data.cooling;
  partCard.classList.add("visible");

  // Highlight pill
  partPills.forEach((p) => {
    p.classList.toggle("active", p.dataset.part === key);
  });
}

function hidePartInfo() {
  if (partCard) partCard.classList.remove("visible");
  partPills.forEach((p) => p.classList.remove("active"));
}

if (partCardClose) {
  partCardClose.addEventListener("click", hidePartInfo);
}

// ---------------- HUD & Controls Logic ----------------
function setExplosionTarget(target) {
  explosionTarget = Math.max(0, Math.min(1, target));
  updateUI();
}

function updateUI() {
  const percent = Math.round(explosionTarget * 100);

  if (explodeSlider && document.activeElement !== explodeSlider) {
    explodeSlider.value = percent;
  }
  if (explodeValue) {
    explodeValue.textContent = `${percent}%`;
  }

  if (btnExplode) {
    if (explosionTarget > 0.5) {
      btnExplode.classList.add("exploded");
      btnExplode.setAttribute("aria-pressed", "true");
      btnExplodeText.textContent = "Assemble View";
    } else {
      btnExplode.classList.remove("exploded");
      btnExplode.setAttribute("aria-pressed", "false");
      btnExplodeText.textContent = "Explode View";
    }
  }

  presetButtons.forEach((btn) => {
    const val = parseInt(btn.dataset.preset, 10);
    btn.classList.toggle("active", Math.abs(val - percent) <= 5);
  });
}

if (btnExplode) {
  btnExplode.addEventListener("click", () => {
    setExplosionTarget(explosionTarget > 0.5 ? 0.0 : 1.0);
  });
}

if (explodeSlider) {
  explodeSlider.addEventListener("input", (e) => {
    setExplosionTarget(parseFloat(e.target.value) / 100);
  });
}

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    setExplosionTarget(parseFloat(btn.dataset.preset) / 100);
  });
});

partPills.forEach((btn) => {
  btn.addEventListener("click", () => {
    const part = btn.dataset.part;
    showPartInfo(part);
    if (explosionTarget < 0.25) {
      setExplosionTarget(1.0);
    }
  });
});

// Mode Toggle: 3D Stack vs Linear Blueprint Strip
if (btnMode3D && btnModeLinear) {
  btnMode3D.addEventListener("click", () => {
    explodeMode = "3d";
    btnMode3D.classList.add("active");
    btnModeLinear.classList.remove("active");
  });

  btnModeLinear.addEventListener("click", () => {
    explodeMode = "linear";
    btnModeLinear.classList.add("active");
    btnMode3D.classList.remove("active");
  });
}

if (btnResetView) {
  btnResetView.addEventListener("click", resetCamera);
}

if (btnAutoRotate) {
  btnAutoRotate.addEventListener("click", () => {
    controls.autoRotate = !controls.autoRotate;
    btnAutoRotate.classList.toggle("active", controls.autoRotate);
  });
}

function resetCamera() {
  camera.position.copy(baseCameraPosition);
  controls.target.copy(baseTarget);
  controls.update();
  setExplosionTarget(0.0);
  hidePartInfo();
}

// ---------------- 3D Screen-Space Callouts ----------------
const calloutMap = [
  { id: "tagFrontShroud", key: "frontShroud", group: card.userData.part1, offset: [0, 0.45, 0] },
  { id: "tagFrontFan", key: "frontFan", group: card.userData.part2, offset: [0, 0.45, 0] },
  { id: "tagFanFrame", key: "fanFrame", group: card.userData.part3, offset: [0, 0.4, 0] },
  { id: "tagHeatsink", key: "heatsink", group: card.userData.part4, offset: [0, 0.5, 0] },
  { id: "tagPcb", key: "pcb", group: card.userData.part5, offset: [0, 0.35, 0] },
  { id: "tagThermalPlate", key: "thermalPlate", group: card.userData.part6, offset: [0, -0.4, 0] },
  { id: "tagBackplate", key: "backplate", group: card.userData.part7, offset: [0, -0.45, 0] },
  { id: "tagRearShroud", key: "rearShroud", group: card.userData.part8, offset: [0, -0.5, 0] },
];

calloutMap.forEach((item) => {
  const el = document.getElementById(item.id);
  if (el) {
    item.el = el;
    el.addEventListener("click", () => showPartInfo(item.key));
  }
});

const tempWorldVec = new THREE.Vector3();

function updateCallouts() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isExplodedEnough = explosionProgress > 0.16;

  calloutMap.forEach(({ el, group, offset }) => {
    if (!el || !group) return;

    if (!isExplodedEnough) {
      el.classList.remove("visible");
      return;
    }

    group.getWorldPosition(tempWorldVec);
    tempWorldVec.x += offset[0];
    tempWorldVec.y += offset[1];
    tempWorldVec.z += offset[2];

    tempWorldVec.project(camera);

    if (tempWorldVec.z > 1.0) {
      el.classList.remove("visible");
      return;
    }

    const screenX = (tempWorldVec.x * 0.5 + 0.5) * width;
    const screenY = (-(tempWorldVec.y * 0.5) + 0.5) * height;

    el.style.left = `${screenX.toFixed(1)}px`;
    el.style.top = `${screenY.toFixed(1)}px`;
    el.classList.add("visible");
  });
}

// ---------------- Animation Loop ----------------
function animateParts() {
  explosionProgress += (explosionTarget - explosionProgress) * 0.085;

  if (explodeValue) {
    explodeValue.textContent = `${Math.round(explosionProgress * 100)}%`;
  }

  // Smooth lerp based on selected mode
  groupTransformData.forEach((data, object) => {
    const targetPos = explodeMode === "3d" ? data.stack : data.linear;
    object.position.lerpVectors(data.normal, targetPos, explosionProgress);
  });
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  controls.update();
  animateParts();
  updateCallouts();

  // Subtle floating breathing hover
  card.position.y = Math.sin(elapsed * 0.7) * 0.05;

  // Front Intake Fan and Rear Exhaust Fan dynamic rotation (Counter-rotating flow)
  if (card.userData.part2.userData.fan) {
    card.userData.part2.userData.fan.userData.bladeGroup.rotation.y += 0.024;
  }
  if (card.userData.part8.userData.rearFan) {
    card.userData.part8.userData.rearFan.userData.bladeGroup.rotation.y -= 0.024;
  }

  // Raycasting
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(interactiveMeshes, false);
  canvas.style.cursor = intersections.length ? "pointer" : "grab";

  renderer.render(scene, camera);
}

// ---------------- Event Handlers ----------------
canvas.addEventListener("pointermove", (e) => {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;
});

canvas.addEventListener("pointerleave", () => {
  pointer.set(0, 0);
});

// Click mesh to show part info
canvas.addEventListener("click", () => {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveMeshes, true);
  if (hits.length > 0) {
    let curr = hits[0].object;
    while (curr && curr.parent && curr !== card) {
      if (curr.userData && curr.userData.partKey) {
        showPartInfo(curr.userData.partKey);
        return;
      }
      curr = curr.parent;
    }
  }
});

// Keyboard Shortcuts
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "e" || e.code === "Space") {
    e.preventDefault();
    setExplosionTarget(explosionTarget > 0.5 ? 0.0 : 1.0);
  } else if (e.key.toLowerCase() === "r") {
    resetCamera();
  } else if (e.key.toLowerCase() === "m") {
    // Toggle explode mode
    explodeMode = explodeMode === "3d" ? "linear" : "3d";
    if (btnMode3D && btnModeLinear) {
      btnMode3D.classList.toggle("active", explodeMode === "3d");
      btnModeLinear.classList.toggle("active", explodeMode === "linear");
    }
  } else if (e.key >= "1" && e.key <= "8") {
    const keys = ["frontShroud", "frontFan", "fanFrame", "heatsink", "pcb", "thermalPlate", "backplate", "rearShroud"];
    showPartInfo(keys[parseInt(e.key, 10) - 1]);
    if (explosionTarget < 0.25) {
      setExplosionTarget(1.0);
    }
  }
});

window.addEventListener("resize", resizeRenderer);

// Initialize
resizeRenderer();
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get("view") === "exploded") {
  setExplosionTarget(1.0);
} else {
  setExplosionTarget(0.0);
}

sceneLoader.classList.add("hidden");
animate();
