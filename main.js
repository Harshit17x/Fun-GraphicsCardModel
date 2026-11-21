import * as THREE from "three";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/geometries/RoundedBoxGeometry.js";
import { createServerRoom } from "./serverRoom.js";
import { createRtx4090Card } from "./rtx4090Card.js";

// ============================================================================
// DOM Elements
// ============================================================================
const canvas = document.querySelector("#scene-canvas");
const sceneContainer = document.querySelector("#scene-container");
const sceneLoader = document.querySelector("#sceneLoader");

// View Mode Navigation (Clean Segmented Pill)
const btnViewFacility = document.querySelector("#btnViewFacility");
const btnViewRack = document.querySelector("#btnViewRack");
const btnViewTray = document.querySelector("#btnViewTray");
const btnViewGpu = document.querySelector("#btnViewGpu");
const viewButtons = {
  facility: btnViewFacility,
  rack: btnViewRack,
  tray: btnViewTray,
  gpu: btnViewGpu,
};

// Facility Action Buttons (Contextual in Rack & Blade Views)
const btnToggleDoor = document.querySelector("#btnToggleDoor");
const doorBtnText = document.querySelector("#doorBtnText");
const btnToggleTray = document.querySelector("#btnToggleTray");
const trayBtnText = document.querySelector("#trayBtnText");
const btnSoundToggle = document.querySelector("#btnSoundToggle");
const soundIcon = document.querySelector("#soundIcon");
const soundText = document.querySelector("#soundText");

// Camera Presets
const btnCamAisle = document.querySelector("#btnCamAisle");
const btnCamFlythrough = document.querySelector("#btnCamFlythrough");
const btnCamRack = document.querySelector("#btnCamRack");
const btnCamBlade = document.querySelector("#btnCamBlade");
const camPresetButtons = {
  aisle: btnCamAisle,
  flythrough: btnCamFlythrough,
  rack: btnCamRack,
  blade: btnCamBlade,
};

// GPU Explode Controls (Contextual in Explode GPU View)
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

// Component Information Card
const partCard = document.querySelector("#partCard");
const partCardBadge = document.querySelector("#partCardBadge");
const partCardTitle = document.querySelector("#partCardTitle");
const partCardBody = document.querySelector("#partCardBody");
const partCardClose = document.querySelector("#partCardClose");
const statMaterial = document.querySelector("#statMaterial");
const statFunction = document.querySelector("#statFunction");
const statDimensions = document.querySelector("#statDimensions");
const statCooling = document.querySelector("#statCooling");
const btnCardExitFocus = document.querySelector("#btnCardExitFocus");

// 3D Focus Mode Floating Banner
const focusModeBanner = document.querySelector("#focusModeBanner");
const focusTitle = document.querySelector("#focusTitle");
const btnExitFocus = document.querySelector("#btnExitFocus");
const btnFocusTurntable = document.querySelector("#btnFocusTurntable");

// ============================================================================
// Procedural Datacenter Audio Synthesizer (Web Audio API)
// 60Hz Electrical Transformer Hum + Pink Noise Airflow
// ============================================================================
class DatacenterAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.filterNode = null;
    this.noiseNode = null;
    this.osc1 = null;
    this.osc2 = null;
    this.oscSub = null;
    this.isPlaying = false;
    this.isMuted = true;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // 1. Dual 60Hz Transformer Core Hum
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = "sine";
    this.osc1.frequency.setValueAtTime(60.0, this.ctx.currentTime);
    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.setValueAtTime(0.38, this.ctx.currentTime);
    this.osc1.connect(osc1Gain);
    osc1Gain.connect(this.masterGain);

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = "sine";
    this.osc2.frequency.setValueAtTime(120.6, this.ctx.currentTime);
    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    this.osc2.connect(osc2Gain);
    osc2Gain.connect(this.masterGain);

    this.oscSub = this.ctx.createOscillator();
    this.oscSub.type = "triangle";
    this.oscSub.frequency.setValueAtTime(30.0, this.ctx.currentTime);
    const oscSubGain = this.ctx.createGain();
    oscSubGain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    this.oscSub.connect(oscSubGain);
    oscSubGain.connect(this.masterGain);

    // 2. Pink Noise Airflow Generator (Server Chassis Fan Exhaust)
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    this.filterNode = this.ctx.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.setValueAtTime(460, this.ctx.currentTime);
    this.filterNode.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

    this.noiseNode.connect(this.filterNode);
    this.filterNode.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    this.osc1.start();
    this.osc2.start();
    this.oscSub.start();
    this.noiseNode.start();
    this.isPlaying = true;
  }

  toggle() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      const targetGain = this.isMuted ? 0.0001 : 0.16;
      this.masterGain.gain.setTargetAtTime(targetGain, now, 0.08);
    }
    return !this.isMuted;
  }
}

const audioSystem = new DatacenterAudio();

if (btnSoundToggle) {
  btnSoundToggle.addEventListener("click", () => {
    const isPlaying = audioSystem.toggle();
    if (soundText) soundText.textContent = isPlaying ? "Audio On" : "Audio";
    btnSoundToggle.classList.toggle("active", isPlaying);
  });
}

// ============================================================================
// Three.js Scene Setup (High-FPS Photorealistic Cleanroom & Studio IBL)
// ============================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xedf1f6);
scene.fog = new THREE.Fog(0xe2e8f0, 70, 230);

const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 360);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Procedural Studio Softbox Environment Map (realistic metallic reflections, zero extra lights)
function createStudioEnvMap(r) {
  const pmrem = new THREE.PMREMGenerator(r);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xe8eef5);
  const panelMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const warmMat = new THREE.MeshBasicMaterial({ color: 0xf7f1e3 });
  const coolMat = new THREE.MeshBasicMaterial({ color: 0xdbeafe });
  const topPanel = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), panelMat);
  topPanel.position.set(0, 8, 0);
  topPanel.rotation.x = Math.PI / 2;
  envScene.add(topPanel);
  const sideL = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), warmMat);
  sideL.position.set(-9, 2, 2);
  sideL.rotation.y = Math.PI / 2;
  envScene.add(sideL);
  const sideR = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), coolMat);
  sideR.position.set(9, 2, -2);
  sideR.rotation.y = -Math.PI / 2;
  envScene.add(sideR);
  const tex = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return tex;
}
scene.environment = createStudioEnvMap(renderer);

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = true;
controls.minDistance = 1.5;
controls.maxDistance = 220;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.7;

// Streamlined 3-Light Studio Illumination Rig (locked 60 FPS)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 1.15);
hemiLight.position.set(0, 60, 0);
scene.add(hemiLight);

const aisleKeyLight = new THREE.DirectionalLight(0xffffff, 1.35);
aisleKeyLight.position.set(14, 64, 34);
aisleKeyLight.castShadow = true;
aisleKeyLight.shadow.mapSize.set(1024, 1024);
aisleKeyLight.shadow.bias = -0.0004;
scene.add(aisleKeyLight);

const fillLight = new THREE.DirectionalLight(0xeef6ff, 0.65);
fillLight.position.set(-18, 42, -26);
scene.add(fillLight);

const clock = new THREE.Clock();
const pointer = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
let interactiveMeshes = [];
let groupTransformData = new Map();
let partGroupByKey = {};
let heroSpotlight = null;

// ============================================================================
// Camera Transition & Multi-Scale View Modes
// ============================================================================
let currentViewMode = "facility"; // 'facility', 'rack', 'tray', 'gpu'
let isCameraTransitioning = false;
const cameraStartPos = new THREE.Vector3();
const cameraEndPos = new THREE.Vector3();
const cameraStartTarget = new THREE.Vector3();
const cameraEndTarget = new THREE.Vector3();
let cameraStartFov = 36;
let cameraEndFov = 36;
let cameraTransitionProgress = 0.0;
let cameraTransitionSpeed = 0.035;

function transitionCamera(targetPos, targetTarget, targetFov = null, speed = 0.035) {
  cameraStartPos.copy(camera.position);
  cameraStartTarget.copy(controls.target);
  cameraEndPos.copy(targetPos);
  cameraEndTarget.copy(targetTarget);
  cameraStartFov = camera.fov;
  cameraEndFov = targetFov || camera.fov;
  cameraTransitionProgress = 0.0;
  cameraTransitionSpeed = speed;
  isCameraTransitioning = true;
}

// 3D Component Inspection / Focus State
let focusedPartKey = null;
let isTurntableActive = false;

// 3D Come-Out Vectors for each component
const focusOffsets = {
  frontShroud: {
    "3d": new THREE.Vector3(0, 3.8, 1.8),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  frontFan: {
    "3d": new THREE.Vector3(-1.0, 4.0, 1.8),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  fanFrame: {
    "3d": new THREE.Vector3(-1.0, 4.2, 1.8),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  heatsink: {
    "3d": new THREE.Vector3(0, 4.2, 2.0),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  pcb: {
    "3d": new THREE.Vector3(0, 5.0, 2.2),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  thermalPlate: {
    "3d": new THREE.Vector3(0, 4.4, 2.0),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  backplate: {
    "3d": new THREE.Vector3(0, -4.0, 1.8),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  rearShroud: {
    "3d": new THREE.Vector3(1.0, -4.0, 1.8),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  bracket: {
    "3d": new THREE.Vector3(-2.5, 2.0, 2.0),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  pcie: {
    "3d": new THREE.Vector3(0, 2.0, 3.0),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
  power: {
    "3d": new THREE.Vector3(0, 2.5, -2.5),
    linear: new THREE.Vector3(0, 1.8, 4.5),
  },
};

// Light theme frosted translucent ghost material for contextual background components
const ghostMaterial = new THREE.MeshStandardMaterial({
  color: 0x94a3b8,
  roughness: 0.7,
  metalness: 0.1,
  transparent: true,
  opacity: 0.22,
  depthWrite: false,
});

// ============================================================================
// Instantiate Datacenter Server Room Environment
// ============================================================================
const datacenter = createServerRoom(scene, { addLights: true });

// ============================================================================
// Explosion State & Modular Photorealistic RTX 4090 Mounting
// ============================================================================
let explosionTarget = 0.0;
let explosionProgress = 0.0;
let explodeMode = "3d"; // "3d" or "linear"
let cardShowcaseFactor = 0.0;

function createCardStudioLighting(targetGroup) {
  const lightRig = new THREE.Group();
  lightRig.name = "CardInspectionLighting";

  heroSpotlight = new THREE.SpotLight(0xffffff, 0, 45, Math.PI / 4, 0.45, 1.2);
  heroSpotlight.position.set(2, 16, 6);
  lightRig.add(heroSpotlight);
  lightRig.add(heroSpotlight.target);

  targetGroup.add(lightRig);
  return lightRig;
}

// Build photorealistic RTX 4090 FE and mount to Hero Rack A04 4U compute sled
const builtCard = createRtx4090Card({ RoundedBoxGeometry });
const card = builtCard.card;
partGroupByKey = builtCard.partGroupByKey;
interactiveMeshes = builtCard.interactiveMeshes;
groupTransformData = builtCard.groupTransformData;

const heroGpuMount = datacenter.getHeroGpuMount();
heroGpuMount.group.add(card);
card.position.set(0, 1.2, 0);
card.rotation.set(0, 0, 0);

// Attach dedicated focus spotlight to hero mount
createCardStudioLighting(heroGpuMount.group);

function getPartKeyFromObject(obj) {
  let curr = obj;
  while (curr && curr.parent && curr !== card) {
    if (curr.userData && curr.userData.partKey) {
      return curr.userData.partKey;
    }
    curr = curr.parent;
  }
  return null;
}

function applyFocusMaterials(focusedKey) {
  if (!focusedKey) {
    interactiveMeshes.forEach((mesh) => {
      if (mesh.userData.origMaterial) {
        mesh.material = mesh.userData.origMaterial;
      }
    });
    return;
  }

  interactiveMeshes.forEach((mesh) => {
    const key = getPartKeyFromObject(mesh);
    if (!mesh.userData.origMaterial) {
      mesh.userData.origMaterial = mesh.material;
    }
    if (key === focusedKey) {
      mesh.material = mesh.userData.origMaterial;
    } else {
      mesh.material = ghostMaterial;
    }
  });
}

function resizeRenderer() {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

// ============================================================================
// Technical Specifications (Authentic RTX 4090 Data)
// ============================================================================
const partData = {
  frontShroud: {
    num: "Part 1",
    title: "Front Shroud & X-Frame",
    desc: "Unibody champagne-gold anodized aluminum perimeter frame with radiused corners, matte black left face, and circular intake duct for the front axial fan.",
    material: "CNC Extruded Aluminum Alloy (Anodized Champagne)",
    arch: "NVIDIA Dual Axial Flow-Through Shroud",
    dims: "304 mm × 137 mm × 12 mm",
    cooling: "Active Front Intake Guide Channel",
  },
  frontFan: {
    num: "Part 2",
    title: "Axial Flow Intake Fan",
    desc: "120mm counter-rotating axial fan with 7 aerodynamic swept blades connected by an outer stabilizer duct ring and spun-finish metallic center spinner.",
    material: "Reinforced Polycarbonate & Metallic Cap",
    arch: "Fluid Dynamic Bearing (FDB) Brushless Motor",
    dims: "Ø 120 mm × 25 mm Depth",
    cooling: "Pulls High-Velocity Cool Air Across Radiator",
  },
  fanFrame: {
    num: "Part 3",
    title: "Cast Fan Frame",
    desc: "Die-cast aluminum internal mounting bracket with triangular aerodynamic motor support struts and integrated vibration isolation dampeners.",
    material: "Die-Cast A380 Aluminum",
    arch: "Tri-Strut Motor Retention Armature",
    dims: "125 mm × 125 mm × 15 mm",
    cooling: "Optimized Air Turbulence Minimization",
  },
  heatsink: {
    num: "Part 4",
    title: "Vapor Chamber Heatsink",
    desc: "Massive dual radiator core with 64 ultra-fine dark aluminum cooling fins, nickel-plated vapor chamber baseplate, and 4 looped sintered copper heat pipes.",
    material: "Alloy 1050 Stamped Fins & Sintered Copper",
    arch: "Dual-Stack Vapor Chamber Cooling Engine",
    dims: "270 mm × 130 mm × 45 mm",
    cooling: "Dissipates up to 450W - 600W Total TDP",
  },
  pcb: {
    num: "Part 5",
    title: "Compact V-Notched PCB",
    desc: "14-layer server-grade compact PCB featuring the NVIDIA AD102-300-A1 silicon die, 24 GB GDDR6X Micron memory, and 23-phase DrMOS power stages.",
    material: "High-TG FR-4 Epoxy & 2oz Copper Traces",
    arch: "Ada Lovelace AD102 (16,384 CUDA Cores / 76.3B Transistors)",
    dims: "215 mm × 128 mm × 1.8 mm (V-Notched)",
    cooling: "Direct Vapor Chamber & Thermal Pad Contact",
  },
  thermalPlate: {
    num: "Part 6",
    title: "Die-Cast Thermal Midplate",
    desc: "Precision structural aluminum midframe providing torsional anti-sag rigidity and dual-sided thermal dissipation pads for VRAM and MOSFET power stages.",
    material: "Die-Cast Aluminum with Silicone Thermal Pads",
    arch: "Full-Board Stiffener & Heat Spreader",
    dims: "235 mm × 132 mm × 4 mm",
    cooling: "Transfers VRAM & VRM Heat to Main Heatsink",
  },
  backplate: {
    num: "Part 7",
    title: "Reinforced Backplate",
    desc: "Anodized obsidian aluminum backplate with stamped X-truss reinforcement lines, countersunk perimeter screws, and spring-steel GPU retention X-clamp.",
    material: "Anodized 6061-T6 Aluminum & Spring Steel",
    arch: "Structural Rigid Armor & Flow-Through Vents",
    dims: "300 mm × 135 mm × 3.5 mm",
    cooling: "Passive Back Radiation & Socket Clamping",
  },
  rearShroud: {
    num: "Part 8",
    title: "Rear Shroud & Exhaust Fan",
    desc: "Rear unibody housing with parallel fin exhaust grilles and the second 120mm axial exhaust fan, pulling air through the card and exhausting directly upward.",
    material: "Anodized Champagne Aluminum & FDB Fan",
    arch: "Patented Flow-Through Rear Exhaust Architecture",
    dims: "304 mm × 137 mm × 14 mm",
    cooling: "Pushes Hot Air Out Top/Back of Chassis",
  },
  bracket: {
    num: "I/O Ports",
    title: "Stainless Steel I/O Bracket",
    desc: "Rigid stainless steel chassis mounting bracket featuring hexagonal flow exhaust cutouts, 3x DisplayPort 2.1 outputs, and 1x HDMI 2.1a port.",
    material: "Stamped Stainless Steel (AISI 304)",
    arch: "Triple-Slot Rigid Chassis Mount",
    dims: "120 mm × 61 mm × 1.2 mm",
    cooling: "Passive High-Velocity Hexagonal Vent",
  },
  pcie: {
    num: "PCIe",
    title: "PCIe 4.0 x16 Interface",
    desc: "High-bandwidth 16-lane peripheral component interface with 30 micro-inch electroplated hard gold contacts supporting up to 64 GB/s bi-directional throughput.",
    material: "FR-4 PCB with Hard Gold Electroplate",
    arch: "PCI Express Gen 4.0 x16 Signaling",
    dims: "89 mm × 11 mm × 1.6 mm",
    cooling: "Direct Motherboard Bus Interface",
  },
  power: {
    num: "Power",
    title: "16-Pin 12VHPWR Connector",
    desc: "Side-mounted ATX 3.0 PCIe 5.0 12VHPWR power connector rated for 600W sustained delivery, accompanied by the signature white-illuminated GEFORCE RTX logo plate.",
    material: "High-Temp Polyamide & Gold-Plated Terminals",
    arch: "12 Power + 4 Sideband Sense Pins (600W)",
    dims: "32 mm × 18 mm × 14 mm",
    cooling: "Illuminated Side Branding & 12V Power Delivery",
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

  partPills.forEach((p) => {
    p.classList.toggle("active", p.dataset.part === key);
  });
}

function hidePartInfo() {
  if (partCard) partCard.classList.remove("visible");
  partPills.forEach((p) => p.classList.remove("active"));
}

function focusOnPart(key) {
  if (!key || !partData[key]) return;
  focusedPartKey = key;

  if (currentViewMode !== "gpu") {
    switchViewMode("gpu");
  }

  if (explosionTarget < 0.4) {
    setExplosionTarget(0.75);
  }

  showPartInfo(key);

  if (focusModeBanner && focusTitle) {
    focusTitle.textContent = partData[key].title;
    focusModeBanner.classList.add("visible");
  }

  if (sceneContainer) {
    sceneContainer.classList.add("is-part-focused");
  }

  applyFocusMaterials(key);

  const group = partGroupByKey[key];
  if (!group) return;

  card.updateMatrixWorld(true);
  const partWorldCenter = new THREE.Vector3();
  group.getWorldPosition(partWorldCenter);

  const cardWorldQuat = new THREE.Quaternion();
  card.getWorldQuaternion(cardWorldQuat);

  const offset = (focusOffsets[key] && focusOffsets[key][explodeMode]) || new THREE.Vector3(0, 4.0, 2.0);
  const worldOffset = offset.clone().applyQuaternion(cardWorldQuat);
  const targetCenter = partWorldCenter.clone().add(worldOffset);

  const cardFrontNormal = new THREE.Vector3(0, 1, 0).applyQuaternion(cardWorldQuat).normalize();
  const isRear = key === "backplate" || key === "rearShroud";

  let targetCamPos;
  if (isRear) {
    const cardBackNormal = cardFrontNormal.clone().negate();
    targetCamPos = targetCenter.clone()
      .addScaledVector(cardBackNormal, 9.5)
      .add(new THREE.Vector3(-1.8, -4.5, -4.0));
  } else {
    targetCamPos = targetCenter.clone()
      .addScaledVector(cardFrontNormal, 9.5)
      .add(new THREE.Vector3(1.8, 4.5, 4.5));
  }

  transitionCamera(targetCamPos, targetCenter, 30, 0.045);
}

function clearPartFocus() {
  if (!focusedPartKey) return;
  focusedPartKey = null;

  if (focusModeBanner) {
    focusModeBanner.classList.remove("visible");
  }
  if (sceneContainer) {
    sceneContainer.classList.remove("is-part-focused");
  }

  if (btnFocusTurntable) {
    btnFocusTurntable.classList.remove("active");
  }
  isTurntableActive = false;
  controls.autoRotate = false;
  if (btnAutoRotate) {
    btnAutoRotate.classList.remove("active");
  }

  applyFocusMaterials(null);

  if (currentViewMode === "gpu") {
    const preset = datacenter.getCameraPreset("gpu");
    transitionCamera(preset.position, preset.target, preset.fov, 0.045);
  }
}

if (btnExitFocus) {
  btnExitFocus.addEventListener("click", () => {
    clearPartFocus();
    hidePartInfo();
  });
}

if (btnCardExitFocus) {
  btnCardExitFocus.addEventListener("click", () => {
    clearPartFocus();
    hidePartInfo();
  });
}

if (btnFocusTurntable) {
  btnFocusTurntable.addEventListener("click", () => {
    isTurntableActive = !isTurntableActive;
    btnFocusTurntable.classList.toggle("active", isTurntableActive);
    controls.autoRotate = isTurntableActive;
    controls.autoRotateSpeed = 1.2;
    if (btnAutoRotate) {
      btnAutoRotate.classList.toggle("active", isTurntableActive);
    }
  });
}

if (partCardClose) {
  partCardClose.addEventListener("click", () => {
    hidePartInfo();
    clearPartFocus();
  });
}

controls.addEventListener("start", () => {
  isCameraTransitioning = false;
});

// ============================================================================
// Multi-Scale View Mode Controller ('facility', 'rack', 'tray', 'gpu')
// ============================================================================
function updateDoorBtn(isOpen) {
  if (doorBtnText) doorBtnText.textContent = isOpen ? "Close Door" : "Open Door";
  if (btnToggleDoor) btnToggleDoor.classList.toggle("active", isOpen);
}

function updateTrayBtn(isExtended) {
  if (trayBtnText) trayBtnText.textContent = isExtended ? "Retract Tray" : "Slide Tray";
  if (btnToggleTray) btnToggleTray.classList.toggle("active", isExtended);
}

function updateActiveCamBtn(camKey) {
  Object.entries(camPresetButtons).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle("active", key === camKey);
  });
}

function switchViewMode(mode, immediate = false) {
  if (!["facility", "rack", "tray", "gpu"].includes(mode)) return;
  currentViewMode = mode;

  // Toggle container classes for contextual HUD sliding
  sceneContainer.classList.remove("view-facility", "view-rack", "view-tray", "view-gpu");
  sceneContainer.classList.add(`view-${mode}`);

  // Update navigation button active state
  Object.entries(viewButtons).forEach(([key, btn]) => {
    if (btn) btn.classList.toggle("active", key === mode);
  });

  if (mode === "facility") {
    clearPartFocus();
    hidePartInfo();
    const preset = datacenter.getCameraPreset("facility");
    transitionCamera(preset.position, preset.target, preset.fov, 0.035);
    controls.minDistance = preset.minDistance || 4;
    controls.maxDistance = preset.maxDistance || 220;
    updateActiveCamBtn("aisle");
  } else if (mode === "rack") {
    clearPartFocus();
    hidePartInfo();
    datacenter.openHeroDoor(1.0);
    updateDoorBtn(true);
    const preset = datacenter.getCameraPreset("rack");
    transitionCamera(preset.position, preset.target, preset.fov, 0.035);
    controls.minDistance = preset.minDistance || 3;
    controls.maxDistance = preset.maxDistance || 120;
    updateActiveCamBtn("rack");
  } else if (mode === "tray") {
    clearPartFocus();
    hidePartInfo();
    datacenter.openHeroDoor(1.0);
    updateDoorBtn(true);
    datacenter.extendHeroTray(1.0);
    updateTrayBtn(true);
    const preset = datacenter.getCameraPreset("blade");
    transitionCamera(preset.position, preset.target, preset.fov, 0.035);
    controls.minDistance = preset.minDistance || 2;
    controls.maxDistance = preset.maxDistance || 80;
    updateActiveCamBtn(null);
  } else if (mode === "gpu") {
    datacenter.openHeroDoor(1.0);
    updateDoorBtn(true);
    datacenter.extendHeroTray(1.0);
    updateTrayBtn(true);
    const preset = datacenter.getCameraPreset("gpu");
    transitionCamera(preset.position, preset.target, preset.fov, 0.035);
    controls.minDistance = preset.minDistance || 1.5;
    controls.maxDistance = preset.maxDistance || 60;
    updateActiveCamBtn(null);
  }
}

// Bind View Mode Nav Buttons
if (btnViewFacility) btnViewFacility.addEventListener("click", () => switchViewMode("facility"));
if (btnViewRack) btnViewRack.addEventListener("click", () => switchViewMode("rack"));
if (btnViewTray) btnViewTray.addEventListener("click", () => switchViewMode("tray"));
if (btnViewGpu) btnViewGpu.addEventListener("click", () => switchViewMode("gpu"));

// Door & Tray Toggle Buttons
if (btnToggleDoor) {
  btnToggleDoor.addEventListener("click", () => {
    const isCurrentlyOpen = datacenter.getHeroDoorFactor() > 0.5;
    const target = isCurrentlyOpen ? 0.0 : 1.0;
    datacenter.openHeroDoor(target);
    updateDoorBtn(!isCurrentlyOpen);
  });
}

if (btnToggleTray) {
  btnToggleTray.addEventListener("click", () => {
    const isCurrentlyExtended = datacenter.getHeroTrayFactor() > 0.5;
    if (isCurrentlyExtended) {
      datacenter.extendHeroTray(0.0);
      updateTrayBtn(false);
    } else {
      datacenter.openHeroDoor(1.0);
      updateDoorBtn(true);
      datacenter.extendHeroTray(1.0);
      updateTrayBtn(true);
    }
  });
}

// Camera Presets
if (btnCamAisle) {
  btnCamAisle.addEventListener("click", () => {
    switchViewMode("facility");
    const p = datacenter.getCameraPreset("facility");
    transitionCamera(p.position, p.target, p.fov);
    updateActiveCamBtn("aisle");
  });
}
if (btnCamFlythrough) {
  btnCamFlythrough.addEventListener("click", () => {
    const p = datacenter.getCameraPreset("flythrough");
    transitionCamera(p.position, p.target, p.fov);
    updateActiveCamBtn("flythrough");
  });
}
if (btnCamRack) {
  btnCamRack.addEventListener("click", () => {
    switchViewMode("rack");
    updateActiveCamBtn("rack");
  });
}
if (btnCamBlade) {
  btnCamBlade.addEventListener("click", () => {
    datacenter.openHeroDoor(1.0);
    updateDoorBtn(true);
    datacenter.extendHeroTray(1.0);
    updateTrayBtn(true);
    const p = datacenter.getCameraPreset("bladeTopDown");
    transitionCamera(p.position, p.target, p.fov);
    updateActiveCamBtn("blade");
  });
}

// ============================================================================
// HUD & Explode Controls Logic
// ============================================================================
function setExplosionTarget(target) {
  explosionTarget = Math.max(0, Math.min(1, target));
  updateUI();
}

function updateUI() {
  const percent = Math.round(explosionTarget * 100);

  if (explodeSlider) {
    if (document.activeElement !== explodeSlider) {
      explodeSlider.value = percent;
    }
    explodeSlider.style.setProperty("--explode-pct", `${percent}%`);
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
    focusOnPart(part);
  });
});

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
  clearPartFocus();
  hidePartInfo();
  setExplosionTarget(0.0);
  const targetMode = currentViewMode === "tray" ? "blade" : currentViewMode;
  const preset = datacenter.getCameraPreset(targetMode);
  transitionCamera(preset.position, preset.target, preset.fov);
}

// ============================================================================
// 3D Screen-Space Callouts & SVG Leader Lines
// ============================================================================
const svgLayer = document.getElementById("callout-lines");
const leaderElements = new Map();

const calloutMap = [
  { id: "tagFrontShroud", key: "frontShroud", group: card.userData.part1, localOffset: [-2.0, 0.35, 0.0], flank: "right" },
  { id: "tagFrontFan", key: "frontFan", group: card.userData.part2, localOffset: [0.0, 0.3, 0.0], flank: "right" },
  { id: "tagFanFrame", key: "fanFrame", group: card.userData.part3, localOffset: [1.2, 0.25, 0.6], flank: "right" },
  { id: "tagHeatsink", key: "heatsink", group: card.userData.part4, localOffset: [0.0, 0.35, 0.6], flank: "right" },
  { id: "tagPcb", key: "pcb", group: card.userData.part5, localOffset: [-2.45, 0.22, 0.0], flank: "left" },
  { id: "tagThermalPlate", key: "thermalPlate", group: card.userData.part6, localOffset: [1.6, 0.15, -0.4], flank: "left" },
  { id: "tagBackplate", key: "backplate", group: card.userData.part7, localOffset: [0.0, -0.2, 0.0], flank: "left" },
  { id: "tagRearShroud", key: "rearShroud", group: card.userData.part8, localOffset: [-2.45, -0.3, 0.0], flank: "left" },
];

let hoveredPartKey = null;

calloutMap.forEach((item) => {
  const el = document.getElementById(item.id);
  if (el) {
    item.el = el;
    el.addEventListener("click", () => focusOnPart(item.key));
    el.addEventListener("mouseenter", () => {
      hoveredPartKey = item.key;
      updateLeaderHighlight();
    });
    el.addEventListener("mouseleave", () => {
      if (hoveredPartKey === item.key) hoveredPartKey = null;
      updateLeaderHighlight();
    });
  }

  if (svgLayer) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "leader-line-group");
    g.id = `leader-${item.key}`;

    const pulseCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pulseCircle.setAttribute("class", "leader-anchor-pulse");

    const anchorCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    anchorCircle.setAttribute("class", "leader-anchor-dot");
    anchorCircle.setAttribute("r", "3.5");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "leader-path");

    g.appendChild(path);
    g.appendChild(pulseCircle);
    g.appendChild(anchorCircle);
    svgLayer.appendChild(g);

    leaderElements.set(item.key, { g, path, pulseCircle, anchorCircle });
  }
});

function updateLeaderHighlight() {
  const activeKey = focusedPartKey || hoveredPartKey;
  calloutMap.forEach((item) => {
    const isAct = item.key === activeKey;
    if (item.el) item.el.classList.toggle("active", isAct);
    const leader = leaderElements.get(item.key);
    if (leader) leader.g.classList.toggle("active", isAct);
  });
}

const tempWorldVec = new THREE.Vector3();

function updateCallouts() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isExplodedEnough = currentViewMode === "gpu" && explosionProgress > 0.14;

  if (!isExplodedEnough) {
    calloutMap.forEach((item) => {
      if (item.el) item.el.classList.remove("visible");
      const leader = leaderElements.get(item.key);
      if (leader) leader.g.style.display = "none";
    });
    return;
  }

  const activeItems = [];
  calloutMap.forEach((item) => {
    if (!item.el || !item.group) return;

    tempWorldVec.set(...item.localOffset);
    item.group.localToWorld(tempWorldVec);
    tempWorldVec.project(camera);

    if (tempWorldVec.z > 1.0) {
      item.el.classList.remove("visible");
      const leader = leaderElements.get(item.key);
      if (leader) leader.g.style.display = "none";
      return;
    }

    const ax = (tempWorldVec.x * 0.5 + 0.5) * width;
    const ay = (-(tempWorldVec.y * 0.5) + 0.5) * height;

    activeItems.push({
      item,
      ax,
      ay,
      el: item.el,
      key: item.key,
      flank: item.flank,
    });
  });

  if (activeItems.length === 0) return;

  const minSpacing = 50;

  if (explodeMode === "3d") {
    const rightItems = activeItems.filter((i) => i.flank === "right");
    const leftItems = activeItems.filter((i) => i.flank === "left");

    if (rightItems.length > 0) {
      const isCardOpen = partCard && partCard.classList.contains("visible");
      const maxAnchorRight = Math.max(...rightItems.map((i) => i.ax));
      let rightX = Math.max(width * 0.58, maxAnchorRight + 85);
      rightX = Math.min(rightX, width - 245);
      rightX = Math.max(width * 0.52, rightX);

      let curY = isCardOpen ? Math.max(340, rightItems[0].ay) : Math.max(85, rightItems[0].ay - 20);
      rightItems.forEach((it) => {
        it.labelX = rightX;
        it.labelY = Math.max(curY, it.ay - 16);
        curY = it.labelY + minSpacing;
      });

      const lastRight = rightItems[rightItems.length - 1];
      if (lastRight && lastRight.labelY > height - 135) {
        const overflow = lastRight.labelY - (height - 135);
        rightItems.forEach((it) => {
          it.labelY = Math.max(isCardOpen ? 300 : 80, it.labelY - overflow);
        });
      }
    }

    if (leftItems.length > 0) {
      const minAnchorLeft = Math.min(...leftItems.map((i) => i.ax));
      let leftX = Math.min(width * 0.42, minAnchorLeft - 85);
      leftX = Math.max(30, leftX);
      leftX = Math.min(width * 0.45, leftX);

      let curY = Math.max(85, leftItems[0].ay - 20);
      leftItems.forEach((it) => {
        it.labelX = leftX;
        it.labelY = Math.max(curY, it.ay - 16);
        curY = it.labelY + minSpacing;
      });

      const lastLeft = leftItems[leftItems.length - 1];
      if (lastLeft && lastLeft.labelY > height - 135) {
        const overflow = lastLeft.labelY - (height - 135);
        leftItems.forEach((it) => {
          it.labelY = Math.max(80, it.labelY - overflow);
        });
      }
    }
  } else {
    const isCardOpen = partCard && partCard.classList.contains("visible");
    activeItems.sort((a, b) => a.ax - b.ax);

    const stepWidth = (width - 160) / Math.max(1, activeItems.length - 1);
    activeItems.forEach((it, idx) => {
      it.labelX = Math.max(30, Math.min(width - 245, 80 + idx * stepWidth));
      it.labelY = isCardOpen ? Math.max(360, it.ay + 75) : (it.ay > height * 0.5 ? it.ay - 90 : it.ay + 75);
      it.labelY = Math.max(85, Math.min(height - 135, it.labelY));
    });
  }

  activeItems.forEach((entry) => {
    const { item, ax, ay, el, key, labelX, labelY } = entry;
    el.style.transform = `translate3d(${labelX.toFixed(1)}px, ${labelY.toFixed(1)}px, 0)`;
    el.classList.add("visible");

    const leader = leaderElements.get(key);
    if (!leader) return;

    leader.g.style.display = "block";
    leader.anchorCircle.setAttribute("cx", ax.toFixed(1));
    leader.anchorCircle.setAttribute("cy", ay.toFixed(1));

    if (!item.cachedWidth) {
      item.cachedWidth = el.offsetWidth || 150;
    }
    const tagMidY = labelY + 14;
    const tagWidth = item.cachedWidth;

    if (explodeMode === "3d") {
      if (labelX > ax) {
        const elbowX = ax + (labelX - ax) * 0.45;
        leader.path.setAttribute(
          "d",
          `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${elbowX.toFixed(1)} ${tagMidY.toFixed(1)} L ${labelX.toFixed(1)} ${tagMidY.toFixed(1)}`
        );
      } else {
        const badgeRight = labelX + tagWidth;
        const elbowX = badgeRight + (ax - badgeRight) * 0.55;
        leader.path.setAttribute(
          "d",
          `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${elbowX.toFixed(1)} ${tagMidY.toFixed(1)} L ${badgeRight.toFixed(1)} ${tagMidY.toFixed(1)}`
        );
      }
    } else {
      const tagMidX = labelX + tagWidth / 2;
      const isAbove = labelY < ay;
      const targetY = isAbove ? labelY + 28 : labelY;
      const elbowY = ay + (targetY - ay) * 0.5;
      leader.path.setAttribute(
        "d",
        `M ${ax.toFixed(1)} ${ay.toFixed(1)} L ${ax.toFixed(1)} ${elbowY.toFixed(1)} L ${tagMidX.toFixed(1)} ${elbowY.toFixed(1)} L ${tagMidX.toFixed(1)} ${targetY.toFixed(1)}`
      );
    }
  });
}

// ============================================================================
// Animation Loop
// ============================================================================
const partFocusProgressMap = new Map();
const tempBasePos = new THREE.Vector3();
const tempTargetPos = new THREE.Vector3();
let lastDisplayedPct = -1;

function animateParts() {
  explosionProgress += (explosionTarget - explosionProgress) * 0.1;

  const pct = Math.round(explosionProgress * 100);
  if (pct !== lastDisplayedPct) {
    lastDisplayedPct = pct;
    if (explodeValue) explodeValue.textContent = `${pct}%`;
    if (explodeSlider) explodeSlider.style.setProperty("--explode-pct", `${pct}%`);
  }

  groupTransformData.forEach((data, object) => {
    const baseExploded = explodeMode === "3d" ? data.stack : data.linear;
    tempBasePos.lerpVectors(data.normal, baseExploded, explosionProgress);

    const partKey = object.userData && object.userData.partKey;
    const isThisFocused = focusedPartKey && partKey === focusedPartKey;

    let curFocus = partFocusProgressMap.get(object) || 0.0;
    const targetFocus = isThisFocused ? 1.0 : (focusedPartKey ? -0.3 : 0.0);
    curFocus += (targetFocus - curFocus) * 0.085;
    partFocusProgressMap.set(object, curFocus);

    if (Math.abs(curFocus) > 0.001) {
      if (curFocus > 0) {
        const offset = (focusOffsets[partKey] && focusOffsets[partKey][explodeMode]) 
          || new THREE.Vector3(0, 4.0, 2.0);
        tempTargetPos.copy(tempBasePos).add(offset);
        object.position.lerpVectors(tempBasePos, tempTargetPos, curFocus);
      } else {
        const recedeVec = new THREE.Vector3(0, 0, -0.8);
        tempTargetPos.copy(tempBasePos).add(recedeVec);
        object.position.lerpVectors(tempBasePos, tempTargetPos, -curFocus / 0.3);
      }
    } else {
      object.position.copy(tempBasePos);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // 1. Update Datacenter Server Room procedural animations (fans, LEDs, doors, tray)
  if (datacenter && datacenter.update) {
    datacenter.update(delta, elapsed);
  }

  // 2. Smooth camera glide during view transitions
  if (isCameraTransitioning) {
    cameraTransitionProgress += cameraTransitionSpeed;
    if (cameraTransitionProgress >= 1.0) {
      cameraTransitionProgress = 1.0;
      isCameraTransitioning = false;
    }
    const t = 1 - Math.pow(1 - cameraTransitionProgress, 3);
    camera.position.lerpVectors(cameraStartPos, cameraEndPos, t);
    controls.target.lerpVectors(cameraStartTarget, cameraEndTarget, t);
    if (Math.abs(camera.fov - cameraEndFov) > 0.01) {
      camera.fov = THREE.MathUtils.lerp(cameraStartFov, cameraEndFov, t);
      camera.updateProjectionMatrix();
    }
  }

  controls.update();
  animateParts();
  updateCallouts();

  // 3. Update hero spotlight tracking focused part
  if (heroSpotlight) {
    if (focusedPartKey && partGroupByKey[focusedPartKey]) {
      const partLocalPos = partGroupByKey[focusedPartKey].position;
      heroSpotlight.target.position.copy(partLocalPos);
      heroSpotlight.intensity = THREE.MathUtils.lerp(heroSpotlight.intensity, 6.0, 0.08);
    } else {
      heroSpotlight.intensity = THREE.MathUtils.lerp(heroSpotlight.intensity, 0.0, 0.1);
    }
  }

  // 4. Smoothly lift & present the RTX 4090 out of the tray toward the viewer in GPU mode
  const targetShowcase = currentViewMode === "gpu" ? 1.0 : 0.0;
  cardShowcaseFactor += (targetShowcase - cardShowcaseFactor) * Math.min(1, delta * 5.5);

  const hoverOffset = currentViewMode === "gpu" && !focusedPartKey ? Math.sin(elapsed * 0.9) * 0.08 : 0.0;
  card.position.set(
    THREE.MathUtils.lerp(0.0, 7.8, cardShowcaseFactor),
    THREE.MathUtils.lerp(1.2, 7.6, cardShowcaseFactor) + hoverOffset,
    THREE.MathUtils.lerp(0.0, 0.0, cardShowcaseFactor)
  );
  card.rotation.set(
    THREE.MathUtils.lerp(0.0, 0.42, cardShowcaseFactor),
    THREE.MathUtils.lerp(0.0, -0.18, cardShowcaseFactor),
    THREE.MathUtils.lerp(0.0, -0.05, cardShowcaseFactor)
  );
  const showcaseScale = THREE.MathUtils.lerp(1.0, 1.24, cardShowcaseFactor);
  card.scale.setScalar(showcaseScale);

  // 5. Front Intake Fan and Rear Exhaust Fan dynamic rotation
  if (card.userData.part2 && card.userData.part2.userData.fan) {
    card.userData.part2.userData.fan.userData.bladeGroup.rotation.y += 0.024;
  }
  if (card.userData.part8 && card.userData.part8.userData.rearFan) {
    card.userData.part8.userData.rearFan.userData.bladeGroup.rotation.y -= 0.024;
  }

  renderer.render(scene, camera);
}

// ============================================================================
// Event Handlers & O(1) Throttled Raycasting (Zero Per-Frame Lag)
// ============================================================================
let pointerDownPos = { x: 0, y: 0 };
let isDragMove = false;
let lastHoverCheck = 0;

function updateHoverState() {
  raycaster.setFromCamera(pointer, camera);

  if (currentViewMode === "gpu") {
    const cardHits = raycaster.intersectObjects(interactiveMeshes, false);
    canvas.style.cursor = cardHits.length > 0 ? "pointer" : "grab";
    const meshHoveredKey = cardHits.length > 0 ? getPartKeyFromObject(cardHits[0].object) : null;
    if (meshHoveredKey !== hoveredPartKey) {
      hoveredPartKey = meshHoveredKey;
      updateLeaderHighlight();
    }
    return;
  }

  if (hoveredPartKey) {
    hoveredPartKey = null;
    updateLeaderHighlight();
  }

  if ((currentViewMode === "facility" || currentViewMode === "rack") && datacenter.heroRack.hitProxy) {
    const hits = raycaster.intersectObject(datacenter.heroRack.hitProxy, false);
    canvas.style.cursor = hits.length > 0 ? "pointer" : "grab";
  } else {
    canvas.style.cursor = "grab";
  }
}

canvas.addEventListener("pointerdown", (e) => {
  pointerDownPos = { x: e.clientX, y: e.clientY };
  isDragMove = false;
  isCameraTransitioning = false;
});

canvas.addEventListener("pointermove", (e) => {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((e.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((e.clientY - bounds.top) / bounds.height) * 2 + 1;

  const dx = e.clientX - pointerDownPos.x;
  const dy = e.clientY - pointerDownPos.y;
  if (Math.hypot(dx, dy) > 5) {
    isDragMove = true;
  }

  const now = performance.now();
  if (now - lastHoverCheck > 60) {
    lastHoverCheck = now;
    updateHoverState();
  }
});

canvas.addEventListener("pointerleave", () => {
  pointer.set(0, 0);
  canvas.style.cursor = "grab";
});

// Interactive Raycasting Click
canvas.addEventListener("click", () => {
  if (isDragMove) return;
  raycaster.setFromCamera(pointer, camera);

  // 1. Intersect GPU Card Components
  if (currentViewMode === "gpu" || currentViewMode === "tray") {
    const hits = raycaster.intersectObjects(interactiveMeshes, false);
    if (hits.length > 0) {
      if (currentViewMode !== "gpu") {
        switchViewMode("gpu");
        return;
      }
      const key = getPartKeyFromObject(hits[0].object);
      if (key) {
        focusOnPart(key);
        return;
      }
    }
  }

  // 2. If in GPU mode and clicked off while part is focused, unfocus
  if (currentViewMode === "gpu" && focusedPartKey) {
    clearPartFocus();
    hidePartInfo();
    return;
  }

  // 3. O(1) Hero Rack Hit Proxy (Rack / Tray Zoom)
  if (datacenter.heroRack.hitProxy) {
    const rackHits = raycaster.intersectObject(datacenter.heroRack.hitProxy, false);
    if (rackHits.length > 0) {
      if (currentViewMode === "facility") {
        switchViewMode("rack");
      } else if (currentViewMode === "rack") {
        switchViewMode("tray");
      }
    }
  }
});

// Keyboard Shortcuts
window.addEventListener("keydown", (e) => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;

  if (e.key === "Escape") {
    clearPartFocus();
    hidePartInfo();
    return;
  }

  // View Mode Switcher: Keys 1 to 4
  if (e.key === "1") {
    switchViewMode("facility");
    return;
  }
  if (e.key === "2") {
    switchViewMode("rack");
    return;
  }
  if (e.key === "3") {
    switchViewMode("tray");
    return;
  }
  if (e.key === "4") {
    switchViewMode("gpu");
    return;
  }

  // Action hotkeys: D for Door, T for Tray
  if (e.key.toLowerCase() === "d") {
    const isCurrentlyOpen = datacenter.getHeroDoorFactor() > 0.5;
    datacenter.openHeroDoor(isCurrentlyOpen ? 0.0 : 1.0);
    updateDoorBtn(!isCurrentlyOpen);
    return;
  }

  if (e.key.toLowerCase() === "t") {
    const isCurrentlyExtended = datacenter.getHeroTrayFactor() > 0.5;
    if (isCurrentlyExtended) {
      datacenter.extendHeroTray(0.0);
      updateTrayBtn(false);
    } else {
      datacenter.openHeroDoor(1.0);
      updateDoorBtn(true);
      datacenter.extendHeroTray(1.0);
      updateTrayBtn(true);
    }
    return;
  }

  // Explode view hotkeys: E or Space
  if (e.key.toLowerCase() === "e" || e.code === "Space") {
    e.preventDefault();
    if (currentViewMode !== "gpu") {
      switchViewMode("gpu");
    }
    setExplosionTarget(explosionTarget > 0.5 ? 0.0 : 1.0);
    return;
  }

  // Mode toggle: M
  if (e.key.toLowerCase() === "m") {
    explodeMode = explodeMode === "3d" ? "linear" : "3d";
    if (btnMode3D && btnModeLinear) {
      btnMode3D.classList.toggle("active", explodeMode === "3d");
      btnModeLinear.classList.toggle("active", explodeMode === "linear");
    }
    return;
  }

  // Reset: R
  if (e.key.toLowerCase() === "r") {
    resetCamera();
    return;
  }

  // Auto-Orbit: O
  if (e.key.toLowerCase() === "o") {
    controls.autoRotate = !controls.autoRotate;
    if (btnAutoRotate) btnAutoRotate.classList.toggle("active", controls.autoRotate);
    return;
  }

  // Sound: S
  if (e.key.toLowerCase() === "s") {
    if (btnSoundToggle) btnSoundToggle.click();
    return;
  }

  // Component Direct Focus: Keys 5 to 8
  if (e.key >= "5" && e.key <= "8") {
    const keys = ["frontShroud", "frontFan", "fanFrame", "heatsink", "pcb", "thermalPlate", "backplate", "rearShroud"];
    focusOnPart(keys[parseInt(e.key, 10) - 1]);
  }
});

window.addEventListener("resize", resizeRenderer);

// ============================================================================
// Initialization
// ============================================================================
resizeRenderer();

// Check URL Params for deep linking
const urlParams = new URLSearchParams(window.location.search);
const initialView = urlParams.get("view");
if (initialView === "exploded" || initialView === "gpu") {
  switchViewMode("gpu", true);
  setExplosionTarget(1.0);
} else if (initialView === "rack") {
  switchViewMode("rack", true);
} else if (initialView === "tray" || initialView === "blade") {
  switchViewMode("tray", true);
} else {
  // Default: Facility Aisle perspective matching photorealistic cleanroom
  switchViewMode("facility", true);
  const initPreset = datacenter.getCameraPreset("facility");
  camera.position.copy(initPreset.position);
  controls.target.copy(initPreset.target);
  camera.fov = initPreset.fov;
  camera.updateProjectionMatrix();
  controls.update();
  setExplosionTarget(0.0);
}

// Dismiss loading overlay
if (sceneLoader) {
  sceneLoader.classList.add("hidden");
}

// Start master render loop
animate();
