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
const btnResetView = document.querySelector("#btnResetView");
const btnAutoRotate = document.querySelector("#btnAutoRotate");

const partCard = document.querySelector("#partCard");
const partCardTitle = document.querySelector("#partCardTitle");
const partCardBody = document.querySelector("#partCardBody");
const partCardClose = document.querySelector("#partCardClose");
const statMaterial = document.querySelector("#statMaterial");
const statFunction = document.querySelector("#statFunction");

// Three.js Scene Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfcfdfd);
scene.fog = null;

const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(13.5, 11.2, 15.5);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 5.5;
controls.maxDistance = 28;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 0.75;

const clock = new THREE.Clock();
const pointer = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const interactiveMeshes = [];
const groupPositions = new Map();

// Materials Palette
const palette = {
  body: new THREE.MeshPhysicalMaterial({
    color: 0x111315,
    metalness: 0.82,
    roughness: 0.22,
    clearcoat: 0.75,
    clearcoatRoughness: 0.16,
  }),
  shell: new THREE.MeshPhysicalMaterial({
    color: 0x22252a,
    metalness: 0.75,
    roughness: 0.2,
    clearcoat: 0.65,
    clearcoatRoughness: 0.15,
  }),
  shellEdge: new THREE.MeshStandardMaterial({ color: 0x555a60, metalness: 0.84, roughness: 0.24 }),
  black: new THREE.MeshStandardMaterial({ color: 0x050505, metalness: 0.65, roughness: 0.22 }),
  graphite: new THREE.MeshStandardMaterial({ color: 0x2e3034, metalness: 0.72, roughness: 0.26 }),
  graphiteSoft: new THREE.MeshStandardMaterial({ color: 0x505459, metalness: 0.65, roughness: 0.32 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x939ba2, metalness: 0.92, roughness: 0.2 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x485056, metalness: 0.9, roughness: 0.28 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x071e22, metalness: 0.22, roughness: 0.62 }),
  pcbTrace: new THREE.MeshStandardMaterial({ color: 0x4db5b9, metalness: 0.45, roughness: 0.36 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd4a74e, metalness: 0.95, roughness: 0.16 }),
  copper: new THREE.MeshStandardMaterial({ color: 0xcc6e42, metalness: 0.92, roughness: 0.2 }),
  white: new THREE.MeshStandardMaterial({ color: 0xeef2f5, metalness: 0.74, roughness: 0.2 }),
  thermalPad: new THREE.MeshStandardMaterial({ color: 0x3d748f, roughness: 0.85, metalness: 0.1 }),
  red: new THREE.MeshStandardMaterial({ color: 0x9e1b24, metalness: 0.58, roughness: 0.24 }),
  redGlow: new THREE.MeshStandardMaterial({
    color: 0xff3b47,
    metalness: 0.24,
    roughness: 0.18,
    emissive: 0x990d18,
    emissiveIntensity: 1.8,
  }),
  blueGlow: new THREE.MeshStandardMaterial({
    color: 0x92c7ff,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0x1d5894,
    emissiveIntensity: 1.4,
  }),
};

// Continuous Explosion State (0.0 = Assembled, 1.0 = Fully Exploded)
let explosionTarget = 0.0;
let explosionProgress = 0.0;

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

function rememberPosition(object, explodedPosition) {
  groupPositions.set(object, {
    normal: object.position.clone(),
    exploded: new THREE.Vector3(...explodedPosition),
  });
}

function createLabelTexture(text, accent = "#f3f3f3", subtitle = "PRECISION ENGINEERING / 01") {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 256;
  const context = textureCanvas.getContext("2d");

  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.fillStyle = "rgba(6, 7, 8, 0.94)";
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.fillStyle = accent;
  context.fillRect(52, 54, 8, 148);
  context.fillStyle = "#ffffff";
  context.font = "700 68px Inter, sans-serif";
  context.fillText(text, 96, 128);
  context.fillStyle = "#8a8f96";
  context.font = "500 20px Inter, sans-serif";
  context.fillText(subtitle, 98, 174);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addTextPlate(parent, text, position, rotation = [0, 0, 0], scale = [1.9, 0.48, 1], accent = "#f3f3f3") {
  const material = new THREE.MeshBasicMaterial({
    map: createLabelTexture(text, accent),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), material);
  plate.position.set(...position);
  plate.rotation.set(...rotation);
  plate.scale.set(...scale);
  parent.add(plate);
  return plate;
}

// ---------------- 3D Assembly Modules ----------------

function createFan(parent, x, index) {
  const fanGroup = new THREE.Group();
  fanGroup.position.set(x, 0.22, 0.04);
  parent.add(fanGroup);

  const well = new THREE.Mesh(new THREE.CylinderGeometry(1.03, 1.03, 0.08, 64), palette.black);
  well.position.y = -0.12;
  well.castShadow = true;
  fanGroup.add(well);

  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.97, 0.105, 16, 72), palette.steelDark);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.castShadow = true;
  fanGroup.add(outerRing);

  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.034, 10, 64), palette.redGlow);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.03;
  fanGroup.add(innerRing);

  const bladeGroup = new THREE.Group();
  bladeGroup.position.y = 0.03;
  fanGroup.add(bladeGroup);
  for (let bladeIndex = 0; bladeIndex < 11; bladeIndex += 1) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.06, 0.7),
      bladeIndex % 2 ? palette.graphite : palette.graphiteSoft,
    );
    const angle = (bladeIndex / 11) * Math.PI * 2;
    blade.rotation.y = angle + 0.36;
    blade.position.set(Math.sin(angle) * 0.13, 0, Math.cos(angle) * 0.13);
    blade.castShadow = true;
    bladeGroup.add(blade);
  }

  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.29, 0.17, 48), palette.black);
  hub.position.y = 0.12;
  hub.castShadow = true;
  fanGroup.add(hub);

  const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32), palette.white);
  hubCap.position.y = 0.22;
  fanGroup.add(hubCap);

  for (let boltIndex = 0; boltIndex < 4; boltIndex += 1) {
    const angle = (boltIndex / 4) * Math.PI * 2 + Math.PI / 4;
    const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), palette.steel);
    bolt.position.set(Math.sin(angle) * 0.35, 0.19, Math.cos(angle) * 0.35);
    fanGroup.add(bolt);
  }

  fanGroup.userData = { bladeGroup, innerRing, index };
  return fanGroup;
}

// 1. Aerodynamic Shroud & Triple-Fan Unit
function createShroud(card) {
  const shroud = new THREE.Group();
  shroud.position.set(0, 0.62, 0);
  card.add(shroud);
  // Exploded position: lifts dramatically upward
  rememberPosition(shroud, [0, 3.8, 0.35]);

  addMesh(shroud, new RoundedBoxGeometry(8.46, 0.24, 3.12, 0.12, 6), palette.shell, [0, 0, 0]);
  addMesh(shroud, new RoundedBoxGeometry(8.1, 0.08, 2.82, 0.08, 6), palette.body, [0, 0.13, 0]);
  addMesh(shroud, new RoundedBoxGeometry(8.1, 0.08, 0.12, 0.035, 3), palette.red, [0, -0.03, -1.46]);
  addMesh(shroud, new RoundedBoxGeometry(8.1, 0.08, 0.12, 0.035, 3), palette.blueGlow, [0, -0.03, 1.46]);

  const fanGroup = new THREE.Group();
  shroud.add(fanGroup);
  const fans = [-2.55, 0, 2.55].map((x, index) => createFan(fanGroup, x, index));
  addTextPlate(shroud, "TRI-FAN / 92", [0, -0.015, 1.58], [0, 0, 0], [1.45, 0.32, 1], "#ffffff");
  
  shroud.userData = { fans, partKey: "shroud" };
  return shroud;
}

// 2. High-Density Radiator & Sintered Heat Pipes
function createHeatsink(card) {
  const heatsink = new THREE.Group();
  heatsink.position.set(0, 0.12, 0.02);
  card.add(heatsink);
  // Exploded position: floats in upper-mid layer
  rememberPosition(heatsink, [0, 2.0, 0.14]);

  // Dual radiator core blocks
  addMesh(heatsink, new RoundedBoxGeometry(7.7, 0.22, 2.52, 0.05, 4), palette.steelDark, [0, 0, 0]);
  addMesh(heatsink, new RoundedBoxGeometry(6.55, 0.16, 1.94, 0.04, 4), palette.steel, [0, 0.16, 0]);

  // Copper Contact Baseplate (contacts the GPU die directly)
  addMesh(heatsink, new RoundedBoxGeometry(2.0, 0.08, 1.8, 0.02, 3), palette.copper, [-0.1, -0.13, 0]);

  // Front Cooling Fins (34 fins)
  for (let finIndex = 0; finIndex < 34; finIndex += 1) {
    const fin = new THREE.Mesh(
      new RoundedBoxGeometry(0.115, 0.86, 0.14, 0.025, 2),
      finIndex % 5 === 0 ? palette.steel : palette.steelDark,
    );
    fin.position.set(-3.8 + finIndex * 0.23, 0.5, 1.24);
    fin.castShadow = true;
    heatsink.add(fin);
  }

  // Rear Cooling Fins (24 fins)
  for (let finIndex = 0; finIndex < 24; finIndex += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.72, 0.11), palette.steelDark);
    fin.position.set(-2.7 + finIndex * 0.23, 0.46, -1.18);
    fin.castShadow = true;
    heatsink.add(fin);
  }

  // Dual Copper / Gold Heat Pipes
  const heatPipe1 = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.04, 12, 48, Math.PI), palette.gold);
  heatPipe1.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  heatPipe1.position.set(1.35, 0.3, 0.1);
  heatsink.add(heatPipe1);

  const heatPipe2 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.038, 12, 48, Math.PI), palette.copper);
  heatPipe2.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
  heatPipe2.position.set(-1.8, 0.28, -0.1);
  heatsink.add(heatPipe2);

  heatsink.userData = { partKey: "heatsink" };
  return heatsink;
}

// 3. Die-Cast Aluminum Midframe / Thermal Armor
function createMidframe(card) {
  const midframe = new THREE.Group();
  midframe.position.set(0, -0.02, 0);
  card.add(midframe);
  // Exploded position: floats between heatsink and PCB
  rememberPosition(midframe, [0, 0.9, 0.04]);

  // Perimeter reinforcing armor frame with cutouts
  addMesh(midframe, new RoundedBoxGeometry(8.1, 0.07, 0.32, 0.03, 3), palette.graphite, [0, 0, 1.4]);
  addMesh(midframe, new RoundedBoxGeometry(8.1, 0.07, 0.32, 0.03, 3), palette.graphite, [0, 0, -1.4]);
  addMesh(midframe, new RoundedBoxGeometry(0.38, 0.07, 2.5, 0.03, 3), palette.graphite, [3.85, 0, 0]);

  // Blue silicone thermal pads for VRAM & VRM heat transfer
  for (let padIndex = 0; padIndex < 6; padIndex += 1) {
    const pad = new THREE.Mesh(new RoundedBoxGeometry(0.48, 0.035, 0.38, 0.015, 2), palette.thermalPad);
    pad.position.set(-2.3 + (padIndex % 3) * 0.9, 0.04, padIndex < 3 ? -0.85 : 0.85);
    midframe.add(pad);
  }

  midframe.userData = { partKey: "midframe" };
  return midframe;
}

// 4. Custom Circuit Board (PCB) with GPU Core, VRAM & Power VRMs
function createPcb(card) {
  const pcbGroup = new THREE.Group();
  pcbGroup.position.set(0, -0.15, 0);
  card.add(pcbGroup);
  // Stays centered on the focal plane
  rememberPosition(pcbGroup, [0, -0.15, 0]);

  // Main 14-layer dark teal PCB
  addMesh(pcbGroup, new RoundedBoxGeometry(7.75, 0.12, 2.56, 0.05, 4), palette.pcb, [0, 0, 0]);

  // GPU Silicon Core Die & Heat Spreader
  const gpuCore = addMesh(pcbGroup, new RoundedBoxGeometry(1.68, 0.12, 1.45, 0.04, 4), palette.black, [-0.1, 0.12, 0]);
  const siliconDie = new THREE.Mesh(new RoundedBoxGeometry(1.36, 0.04, 1.15, 0.02, 3), palette.steelDark);
  siliconDie.position.y = 0.06;
  gpuCore.add(siliconDie);

  // 12x GDDR6X High-Speed VRAM Memory ICs
  for (let chipIndex = 0; chipIndex < 12; chipIndex += 1) {
    const chip = new THREE.Mesh(new RoundedBoxGeometry(0.44, 0.08, 0.34, 0.03, 2), palette.graphite);
    chip.position.set(-2.35 + (chipIndex % 6) * 0.78, 0.11, chipIndex < 6 ? -0.84 : 0.84);
    pcbGroup.add(chip);
  }

  // Gold & Cyan Micro-signal circuit traces
  for (let traceIndex = 0; traceIndex < 13; traceIndex += 1) {
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.016, 1.5 - traceIndex * 0.06), palette.pcbTrace);
    trace.position.set(-3.2 + traceIndex * 0.52, 0.09, traceIndex % 2 ? 0.1 : -0.16);
    trace.rotation.y = traceIndex % 2 ? -0.06 : 0.06;
    pcbGroup.add(trace);
  }

  // 8x Solid Polymer VRM Power Delivery Capacitors
  for (let capIndex = 0; capIndex < 8; capIndex += 1) {
    const capacitor = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.22, 20), palette.red);
    capacitor.position.set(1.4 + (capIndex % 4) * 0.24, 0.16, -0.34 + Math.floor(capIndex / 4) * 0.68);
    pcbGroup.add(capacitor);
  }

  // Surface Mount Inductors (Chokes)
  for (let chokeIndex = 0; chokeIndex < 6; chokeIndex += 1) {
    const choke = new THREE.Mesh(new RoundedBoxGeometry(0.24, 0.16, 0.24, 0.03, 2), palette.steelDark);
    choke.position.set(2.4, 0.14, -0.7 + chokeIndex * 0.28);
    pcbGroup.add(choke);
  }

  pcbGroup.userData = { partKey: "pcb" };
  return pcbGroup;
}

// 5. Structural Reinforced Metal Backplate
function createBackplate(card) {
  const backplate = new THREE.Group();
  backplate.position.set(0, -0.58, 0.03);
  card.add(backplate);
  // Exploded position: drops down significantly to expose the bottom
  rememberPosition(backplate, [0, -2.5, -0.3]);

  addMesh(backplate, new RoundedBoxGeometry(8.25, 0.1, 3.0, 0.06, 4), palette.shell, [0, 0, 0]);
  addMesh(backplate, new RoundedBoxGeometry(6.55, 0.025, 1.7, 0.02, 3), palette.black, [-0.2, -0.065, 0]);
  addTextPlate(backplate, "BLACKOUT / 24 GB", [0.75, -0.09, 1.51], [Math.PI, 0, 0], [1.65, 0.36, 1], "#ff6666");

  // Hex Screws
  for (let screwIndex = 0; screwIndex < 8; screwIndex += 1) {
    const x = screwIndex % 4 < 2 ? -3.72 : 3.72;
    const z = screwIndex % 2 ? 1.18 : -1.18;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 20), palette.steel);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(x, -0.08, z);
    backplate.add(screw);
  }

  backplate.userData = { partKey: "backplate" };
  return backplate;
}

// 6. Dual-Slot I/O PCI Bracket & Video Outlets
function createBracket(card) {
  const bracket = new THREE.Group();
  bracket.position.set(-4.42, 0, 0);
  card.add(bracket);
  // Exploded position: slides outward to the left
  rememberPosition(bracket, [-6.6, 0, -0.15]);

  addMesh(bracket, new RoundedBoxGeometry(0.2, 1.48, 3.32, 0.035, 3), palette.steel, [0, 0, 0]);
  // Exhaust Vents
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, -1.04]);
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, -0.37]);
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, 0.37]);
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, 1.04]);

  // 3x DisplayPort / HDMI connectors with illuminated status
  for (let portIndex = 0; portIndex < 3; portIndex += 1) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.43, 0.4), palette.blueGlow);
    port.position.set(-0.15, -0.35, -0.7 + portIndex * 0.7);
    bracket.add(port);
  }

  bracket.userData = { partKey: "bracket" };
  return bracket;
}

// 7. PCIe 4.0 Gold Edge Connector
function createEdgeConnector(card) {
  const connectorGroup = new THREE.Group();
  connectorGroup.position.set(2.45, -0.22, 1.68);
  card.add(connectorGroup);
  // Exploded position: slides forward & down
  rememberPosition(connectorGroup, [2.45, -0.9, 2.9]);

  addMesh(connectorGroup, new RoundedBoxGeometry(2.1, 0.24, 0.16, 0.03, 3), palette.black, [0, 0, 0]);
  for (let pinIndex = 0; pinIndex < 14; pinIndex += 1) {
    addMesh(connectorGroup, new THREE.BoxGeometry(0.085, 0.14, 0.025), palette.gold, [-0.78 + pinIndex * 0.12, 0.01, 0.09]);
  }

  connectorGroup.userData = { partKey: "connector" };
  return connectorGroup;
}

// 8. 12V-2x6 Auxiliary Power Socket
function createPowerSocket(card) {
  const powerGroup = new THREE.Group();
  powerGroup.position.set(0.2, 0.2, -1.72);
  card.add(powerGroup);
  // Exploded position: slides rearward & upward
  rememberPosition(powerGroup, [0.2, 1.1, -2.8]);

  addMesh(powerGroup, new RoundedBoxGeometry(0.8, 0.36, 0.2, 0.035, 3), palette.black, [0, 0, 0]);
  addMesh(powerGroup, new THREE.BoxGeometry(0.34, 0.12, 0.03), palette.gold, [0, 0.03, -0.11]);

  powerGroup.userData = { partKey: "power" };
  return powerGroup;
}

function createCard() {
  const card = new THREE.Group();
  card.rotation.set(-0.16, 0.16, -0.055);
  scene.add(card);

  // Sub-assemblies (each has distinct exploded coordinates)
  const pcb = createPcb(card);
  const midframe = createMidframe(card);
  const heatsink = createHeatsink(card);
  const shroud = createShroud(card);
  const backplate = createBackplate(card);
  const bracket = createBracket(card);
  const edgeConnector = createEdgeConnector(card);
  const powerGroup = createPowerSocket(card);

  addTextPlate(card, "BLACKOUT", [0.35, -0.06, 1.69], [0, 0, 0], [1.18, 0.33, 1], "#ff7777");

  card.userData = { pcb, midframe, heatsink, shroud, backplate, bracket, edgeConnector, powerGroup };
  return card;
}

function createEnvironment() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.7));

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
  keyLight.position.set(4, 9, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -10;
  keyLight.shadow.camera.right = 10;
  keyLight.shadow.camera.top = 10;
  keyLight.shadow.camera.bottom = -10;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xdbe6ff, 3.8);
  rimLight.position.set(-7, 4, -5);
  scene.add(rimLight);

  const redAccentLight = new THREE.PointLight(0xff334b, 1.8, 12, 2);
  redAccentLight.position.set(-4.5, 2.5, 3.5);
  scene.add(redAccentLight);

  const topFillLight = new THREE.PointLight(0xffffff, 2.8, 12, 2);
  topFillLight.position.set(0, 8, 1);
  scene.add(topFillLight);
}

const card = createCard();
createEnvironment();

const baseCameraPosition = camera.position.clone();
const baseTarget = controls.target.clone();

function resizeRenderer() {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

// ---------------- Component Technical Specifications ----------------
const partData = {
  shroud: {
    title: "Tri-Fan Aerodynamic Shroud",
    desc: "Triple 92mm high-static pressure fans with fluid dynamic bearings, alternating aero-curved graphite blades, and dynamic RGB halo illumination.",
    material: "Polycarbonate & Brushed Metal Alloy",
    function: "Active Intake Cooling (110 CFM)",
  },
  heatsink: {
    title: "Dual-Stack Fin Radiator",
    desc: "58 stamped aluminum cooling fins paired with precision sintered copper heat pipes and mirror-polished copper GPU contact cold-plate.",
    material: "Alloy 1050 Aluminum & Sintered Copper",
    function: "Thermal Dissipation (up to 450W TDP)",
  },
  midframe: {
    title: "Die-Cast Reinforcement Armor",
    desc: "Structural aluminum midplate providing anti-sag torsional rigidity with direct high-conductivity thermal pads for GDDR6X VRAM and MOSFETs.",
    material: "Die-Cast A380 Aluminum",
    function: "Structural Rigidity & Memory Cooling",
  },
  pcb: {
    title: "14-Layer High-Density PCB",
    desc: "Flagship GPU silicon die surrounded by 12x Micron GDDR6X memory ICs (24 GB total), 24-phase DrMOS power stages, and gold trace routing.",
    material: "FR-4 High TG Epoxy & 2oz Copper",
    function: "Computing Architecture & Power Distribution",
  },
  backplate: {
    title: "Reinforced Armor Backplate",
    desc: "CNC-machined aluminum backplate featuring structural ventilation cutouts, precision hex screws, and laser-etched BLACKOUT / 24 GB branding.",
    material: "Anodized 6061-T6 Aluminum",
    function: "Component Protection & Passive Cooling",
  },
  bracket: {
    title: "Dual-Slot I/O PCI Bracket",
    desc: "Heavy-gauge stainless steel mounting bracket with 4 hexagonal exhaust air vents and 3x DisplayPort 2.1 outputs with illuminated ports.",
    material: "SUS304 Stainless Steel",
    function: "Chassis Mounting & Video Output",
  },
  connector: {
    title: "PCIe 4.0 x16 Gold Interface",
    desc: "14-pin high-bandwidth edge fingers plated with 30 micro-inches of hard gold over nickel barrier, supporting up to 64 GB/s bi-directional bandwidth.",
    material: "Hard Gold Over Nickel Barrier",
    function: "Host Bus Data Transmission",
  },
  power: {
    title: "12V-2x6 Auxiliary Power Socket",
    desc: "High-current 16-pin power receptacle with four sideband sensory pins, engineered to deliver up to 600 Watts of continuous power.",
    material: "High-Temp Nylon & Gold-Plated Terminals",
    function: "Primary 12V DC Power Ingestion",
  },
};

function showPartInfo(key) {
  const data = partData[key];
  if (!data || !partCard) return;
  partCardTitle.textContent = data.title;
  partCardBody.textContent = data.desc;
  statMaterial.textContent = data.material;
  statFunction.textContent = data.function;
  partCard.classList.add("visible");
}

function hidePartInfo() {
  if (partCard) partCard.classList.remove("visible");
}

if (partCardClose) {
  partCardClose.addEventListener("click", hidePartInfo);
}

// ---------------- Interactive HUD & Explosion Control Logic ----------------

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
    if (Math.abs(val - percent) <= 5) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Toggle Button Click
if (btnExplode) {
  btnExplode.addEventListener("click", () => {
    setExplosionTarget(explosionTarget > 0.5 ? 0.0 : 1.0);
  });
}

// Range Slider Scrubbing
if (explodeSlider) {
  explodeSlider.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value) / 100;
    setExplosionTarget(val);
  });
}

// Preset Buttons
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const val = parseFloat(btn.dataset.preset) / 100;
    setExplosionTarget(val);
  });
});

// Reset View Button
if (btnResetView) {
  btnResetView.addEventListener("click", () => {
    resetCamera();
  });
}

// Auto-Rotate Button
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

// ---------------- 3D Callout Tags Mapping ----------------
const calloutMap = [
  { id: "tagShroud", partKey: "shroud", group: card.userData.shroud, offset: [0, 0.45, 0] },
  { id: "tagHeatsink", partKey: "heatsink", group: card.userData.heatsink, offset: [0, 0.55, 0] },
  { id: "tagPcb", partKey: "pcb", group: card.userData.pcb, offset: [0, 0.25, 0] },
  { id: "tagBackplate", partKey: "backplate", group: card.userData.backplate, offset: [0, -0.45, 0] },
  { id: "tagBracket", partKey: "bracket", group: card.userData.bracket, offset: [-0.4, 0, 0] },
  { id: "tagConnector", partKey: "connector", group: card.userData.edgeConnector, offset: [0, -0.3, 0.4] },
];

calloutMap.forEach((item) => {
  const el = document.getElementById(item.id);
  if (el) {
    item.el = el;
    el.addEventListener("click", () => {
      showPartInfo(item.partKey);
    });
  }
});

const tempWorldVec = new THREE.Vector3();

function updateCallouts() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isExplodedEnough = explosionProgress > 0.18;

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

    // Behind camera check
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

// ---------------- Animate & Render Loop ----------------

function animateParts() {
  // Smooth continuous lerp towards target
  explosionProgress += (explosionTarget - explosionProgress) * 0.085;

  // Update slider label display during lerp if not actively dragging
  if (explodeValue) {
    explodeValue.textContent = `${Math.round(explosionProgress * 100)}%`;
  }

  // Lerp all sub-assembly groups smoothly
  groupPositions.forEach((positions, object) => {
    object.position.lerpVectors(positions.normal, positions.exploded, explosionProgress);
  });
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  controls.update();
  animateParts();
  updateCallouts();

  // Subtle natural floating hover motion
  card.position.y = Math.sin(elapsed * 0.75) * 0.055;

  // Fans rotation and breathing inner LED rings
  card.userData.shroud.userData.fans.forEach((fan, index) => {
    fan.userData.bladeGroup.rotation.y += 0.012 + index * 0.0015;
    fan.userData.innerRing.material.emissiveIntensity = 1.25 + Math.sin(elapsed * 2.2 + index) * 0.3;
  });

  palette.redGlow.emissiveIntensity = 1.4 + Math.sin(elapsed * 2.1) * 0.25;

  // Raycasting for interactive mesh pointer
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(interactiveMeshes, false);
  canvas.style.cursor = intersections.length ? "pointer" : "grab";

  renderer.render(scene, camera);
}

// ---------------- Event Listeners ----------------

canvas.addEventListener("pointermove", (event) => {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
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
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "e" || event.code === "Space") {
    event.preventDefault();
    setExplosionTarget(explosionTarget > 0.5 ? 0.0 : 1.0);
  }

  if (event.key.toLowerCase() === "r") {
    resetCamera();
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
