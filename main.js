import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/geometries/RoundedBoxGeometry.js";

const canvas = document.querySelector("#scene-canvas");
const sceneContainer = document.querySelector("#scene-container");
const sceneLoader = document.querySelector("#sceneLoader");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = null;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(13.2, 11.5, 15.1);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.28;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 5.8;
controls.maxDistance = 26;
controls.target.set(0, 0, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 0.8;

const clock = new THREE.Clock();
const pointer = new THREE.Vector2(0, 0);
const raycaster = new THREE.Raycaster();
const interactiveMeshes = [];
const groupPositions = new Map();

const palette = {
  body: new THREE.MeshPhysicalMaterial({
    color: 0x090a0b,
    metalness: 0.82,
    roughness: 0.25,
    clearcoat: 0.72,
    clearcoatRoughness: 0.18,
  }),
  shell: new THREE.MeshPhysicalMaterial({
    color: 0x2a2c30,
    metalness: 0.72,
    roughness: 0.2,
    clearcoat: 0.65,
    clearcoatRoughness: 0.14,
  }),
  shellEdge: new THREE.MeshStandardMaterial({ color: 0x555a60, metalness: 0.84, roughness: 0.24 }),
  black: new THREE.MeshStandardMaterial({ color: 0x020202, metalness: 0.65, roughness: 0.22 }),
  graphite: new THREE.MeshStandardMaterial({ color: 0x36383c, metalness: 0.72, roughness: 0.28 }),
  graphiteSoft: new THREE.MeshStandardMaterial({ color: 0x5a5e63, metalness: 0.65, roughness: 0.34 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x899198, metalness: 0.92, roughness: 0.22 }),
  steelDark: new THREE.MeshStandardMaterial({ color: 0x4f575d, metalness: 0.9, roughness: 0.28 }),
  pcb: new THREE.MeshStandardMaterial({ color: 0x092025, metalness: 0.24, roughness: 0.66 }),
  pcbTrace: new THREE.MeshStandardMaterial({ color: 0x49a3a7, metalness: 0.45, roughness: 0.38 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc99d4a, metalness: 0.95, roughness: 0.17 }),
  white: new THREE.MeshStandardMaterial({ color: 0xe8ecef, metalness: 0.74, roughness: 0.22 }),
  red: new THREE.MeshStandardMaterial({ color: 0x8e242c, metalness: 0.58, roughness: 0.24 }),
  redGlow: new THREE.MeshStandardMaterial({
    color: 0xff4b56,
    metalness: 0.24,
    roughness: 0.18,
    emissive: 0x7b0d16,
    emissiveIntensity: 1.7,
  }),
  blueGlow: new THREE.MeshStandardMaterial({
    color: 0x92c7ff,
    metalness: 0.3,
    roughness: 0.2,
    emissive: 0x174b7a,
    emissiveIntensity: 1.2,
  }),
};

let exploded = false;

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
  context.fillStyle = "rgba(4, 4, 4, 0.94)";
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.fillStyle = accent;
  context.fillRect(52, 54, 8, 148);
  context.fillStyle = "#f3f3f3";
  context.font = "700 68px Inter, sans-serif";
  context.fillText(text, 96, 128);
  context.fillStyle = "#828282";
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

function createHeatsink(card) {
  const heatsink = new THREE.Group();
  heatsink.position.set(0, 0.04, 0.02);
  card.add(heatsink);
  rememberPosition(heatsink, [0, 0.78, 0.13]);

  addMesh(heatsink, new RoundedBoxGeometry(7.7, 0.18, 2.52, 0.05, 4), palette.steelDark, [0, 0, 0]);
  addMesh(heatsink, new RoundedBoxGeometry(6.55, 0.14, 1.94, 0.04, 4), palette.steel, [0, 0.14, 0]);

  for (let finIndex = 0; finIndex < 34; finIndex += 1) {
    const fin = new THREE.Mesh(
      new RoundedBoxGeometry(0.115, 0.83, 0.12, 0.025, 2),
      finIndex % 5 === 0 ? palette.steel : palette.steelDark,
    );
    fin.position.set(-3.8 + finIndex * 0.23, 0.5, 1.24);
    fin.castShadow = true;
    heatsink.add(fin);
  }

  for (let finIndex = 0; finIndex < 24; finIndex += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.68, 0.09), palette.steelDark);
    fin.position.set(-2.7 + finIndex * 0.23, 0.46, -1.18);
    fin.castShadow = true;
    heatsink.add(fin);
  }

  const heatPipe = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.035, 10, 48, Math.PI), palette.gold);
  heatPipe.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  heatPipe.position.set(1.35, 0.28, 0.1);
  heatsink.add(heatPipe);
  return heatsink;
}

function createPcb(card) {
  const pcbGroup = new THREE.Group();
  pcbGroup.position.set(0, 0.02, 0);
  card.add(pcbGroup);
  rememberPosition(pcbGroup, [0, -0.1, 0]);

  addMesh(pcbGroup, new RoundedBoxGeometry(7.65, 0.14, 2.52, 0.05, 4), palette.pcb, [0, 0, 0]);
  addMesh(pcbGroup, new RoundedBoxGeometry(3.4, 0.1, 1.5, 0.04, 3), palette.black, [-1.0, 0.12, 0.1]);

  for (let chipIndex = 0; chipIndex < 12; chipIndex += 1) {
    const chip = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.08, 0.32, 0.035, 2), palette.graphite);
    chip.position.set(-2.35 + (chipIndex % 6) * 0.78, 0.13, chipIndex < 6 ? -0.82 : 0.82);
    pcbGroup.add(chip);
  }

  for (let traceIndex = 0; traceIndex < 13; traceIndex += 1) {
    const trace = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.016, 1.5 - traceIndex * 0.06), palette.pcbTrace);
    trace.position.set(-3.2 + traceIndex * 0.52, 0.12, traceIndex % 2 ? 0.1 : -0.16);
    trace.rotation.y = traceIndex % 2 ? -0.06 : 0.06;
    pcbGroup.add(trace);
  }

  const gpu = addMesh(pcbGroup, new RoundedBoxGeometry(1.58, 0.1, 1.34, 0.05, 4), palette.black, [-0.1, 0.15, 0]);
  gpu.add(new THREE.Mesh(new RoundedBoxGeometry(1.34, 0.04, 1.12, 0.03, 3), palette.steelDark));

  for (let capIndex = 0; capIndex < 8; capIndex += 1) {
    const capacitor = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.18, 20), palette.red);
    capacitor.position.set(1.35 + (capIndex % 4) * 0.22, 0.19, -0.32 + Math.floor(capIndex / 4) * 0.64);
    pcbGroup.add(capacitor);
  }

  return pcbGroup;
}

function createBackplate(card) {
  const backplate = new THREE.Group();
  backplate.position.set(0, -0.56, 0.03);
  card.add(backplate);
  rememberPosition(backplate, [0, -1.55, -0.12]);

  addMesh(backplate, new RoundedBoxGeometry(8.25, 0.1, 3.0, 0.06, 4), palette.shell, [0, 0, 0]);
  addMesh(backplate, new RoundedBoxGeometry(6.55, 0.025, 1.7, 0.02, 3), palette.black, [-0.2, -0.065, 0]);
  addTextPlate(backplate, "BLACKOUT / 24 GB", [0.75, -0.09, 1.51], [Math.PI, 0, 0], [1.65, 0.36, 1], "#ff7777");

  for (let screwIndex = 0; screwIndex < 8; screwIndex += 1) {
    const x = screwIndex % 4 < 2 ? -3.72 : 3.72;
    const z = screwIndex % 2 ? 1.18 : -1.18;
    const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.035, 20), palette.steel);
    screw.rotation.x = Math.PI / 2;
    screw.position.set(x, -0.08, z);
    backplate.add(screw);
  }
  return backplate;
}

function createBracket(card) {
  const bracket = new THREE.Group();
  bracket.position.set(-4.42, 0, 0);
  card.add(bracket);
  rememberPosition(bracket, [-4.94, 0, -0.12]);

  addMesh(bracket, new RoundedBoxGeometry(0.2, 1.36, 3.32, 0.035, 3), palette.steel, [0, 0, 0]);
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, -1.04]);
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, -0.37]);
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, 0.37]);
  addMesh(bracket, new THREE.BoxGeometry(0.055, 0.78, 0.48), palette.black, [-0.13, 0.22, 1.04]);

  for (let portIndex = 0; portIndex < 3; portIndex += 1) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.43, 0.4), palette.blueGlow);
    port.position.set(-0.15, -0.35, -0.7 + portIndex * 0.7);
    bracket.add(port);
  }
  return bracket;
}

function createEdgeConnector(card) {
  const connectorGroup = new THREE.Group();
  connectorGroup.position.set(2.45, -0.08, 1.68);
  card.add(connectorGroup);
  rememberPosition(connectorGroup, [2.45, -0.08, 2.5]);

  addMesh(connectorGroup, new RoundedBoxGeometry(2.05, 0.23, 0.16, 0.03, 3), palette.black, [0, 0, 0]);
  for (let pinIndex = 0; pinIndex < 14; pinIndex += 1) {
    addMesh(connectorGroup, new THREE.BoxGeometry(0.085, 0.13, 0.025), palette.gold, [-0.78 + pinIndex * 0.12, 0.01, 0.09]);
  }
  return connectorGroup;
}

function createShroud(card) {
  const shroud = new THREE.Group();
  shroud.position.set(0, 0.58, 0);
  card.add(shroud);
  rememberPosition(shroud, [0, 2.18, 0.25]);

  addMesh(shroud, new RoundedBoxGeometry(8.46, 0.22, 3.12, 0.12, 6), palette.shell, [0, 0, 0]);
  addMesh(shroud, new RoundedBoxGeometry(8.1, 0.07, 2.82, 0.08, 6), palette.body, [0, 0.13, 0]);
  addMesh(shroud, new RoundedBoxGeometry(8.1, 0.07, 0.12, 0.035, 3), palette.red, [0, -0.03, -1.46]);
  addMesh(shroud, new RoundedBoxGeometry(8.1, 0.07, 0.12, 0.035, 3), palette.blueGlow, [0, -0.03, 1.46]);

  const fanGroup = new THREE.Group();
  shroud.add(fanGroup);
  const fans = [-2.55, 0, 2.55].map((x, index) => createFan(fanGroup, x, index));
  addTextPlate(shroud, "TRI-FAN / 92", [0, -0.015, 1.58], [0, 0, 0], [1.45, 0.32, 1], "#ffffff");
  shroud.userData = { fans };
  return shroud;
}

function createCard() {
  const card = new THREE.Group();
  card.rotation.set(-0.16, 0.16, -0.055);
  scene.add(card);

  addMesh(card, new RoundedBoxGeometry(8.7, 1.1, 3.35, 0.14, 6), palette.body, [0, 0, 0]);
  addMesh(card, new RoundedBoxGeometry(8.28, 0.12, 3.0, 0.06, 5), palette.graphite, [0, -0.53, 0]);
  addMesh(card, new RoundedBoxGeometry(8.12, 0.1, 0.11, 0.035, 3), palette.shellEdge, [0, 0.02, -1.67]);

  const pcb = createPcb(card);
  const heatsink = createHeatsink(card);
  const shroud = createShroud(card);
  const backplate = createBackplate(card);
  const bracket = createBracket(card);
  const edgeConnector = createEdgeConnector(card);

  const powerGroup = new THREE.Group();
  powerGroup.position.set(0.2, 0.2, -1.72);
  card.add(powerGroup);
  rememberPosition(powerGroup, [0.2, 0.72, -2.05]);
  addMesh(powerGroup, new RoundedBoxGeometry(0.76, 0.34, 0.18, 0.035, 3), palette.black, [0, 0, 0]);
  addMesh(powerGroup, new THREE.BoxGeometry(0.32, 0.1, 0.03), palette.gold, [0, 0.03, -0.1]);

  addTextPlate(card, "BLACKOUT", [0.35, -0.06, 1.69], [0, 0, 0], [1.18, 0.33, 1], "#ff7777");
  card.userData = { pcb, heatsink, shroud, backplate, bracket, edgeConnector, powerGroup };
  return card;
}

function createEnvironment() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x505050, 1.8));

  const keyLight = new THREE.DirectionalLight(0xffffff, 4.4);
  keyLight.position.set(4, 8, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -9;
  keyLight.shadow.camera.right = 9;
  keyLight.shadow.camera.top = 9;
  keyLight.shadow.camera.bottom = -9;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0xd8e6ff, 4.2);
  rimLight.position.set(-7, 3.5, -4);
  scene.add(rimLight);

  const redLight = new THREE.PointLight(0xff3049, 1.6, 10, 2);
  redLight.position.set(-4.2, 2.2, 3.2);
  scene.add(redLight);

  const topLight = new THREE.PointLight(0xffffff, 3.2, 11, 2);
  topLight.position.set(0, 7, 1);
  scene.add(topLight);
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

function setExplodedState(nextState) {
  exploded = nextState;
}

function animateParts() {
  groupPositions.forEach((positions, object) => {
    const target = exploded ? positions.exploded : positions.normal;
    object.position.lerp(target, 0.075);
  });
}

function resetCamera() {
  camera.position.copy(baseCameraPosition);
  controls.target.copy(baseTarget);
  controls.update();
  setExplodedState(false);
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  controls.update();
  animateParts();

  card.position.y = Math.sin(elapsed * 0.75) * 0.055;
  card.userData.shroud.userData.fans.forEach((fan, index) => {
    fan.userData.bladeGroup.rotation.y += 0.012 + index * 0.0015;
    fan.userData.innerRing.material.emissiveIntensity = 1.25 + Math.sin(elapsed * 2.2 + index) * 0.3;
  });

  palette.redGlow.emissiveIntensity = 1.4 + Math.sin(elapsed * 2.1) * 0.25;

  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(interactiveMeshes, false);
  canvas.style.cursor = intersections.length ? "pointer" : "grab";

  renderer.render(scene, camera);
}

canvas.addEventListener("pointermove", (event) => {
  const bounds = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
});

canvas.addEventListener("pointerleave", () => {
  pointer.set(0, 0);
});

window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "e" || event.code === "Space") {
    event.preventDefault();
    setExplodedState(!exploded);
  }

  if (event.key.toLowerCase() === "r") {
    resetCamera();
  }
});

window.addEventListener("resize", resizeRenderer);

resizeRenderer();
setExplodedState(new URLSearchParams(window.location.search).get("view") === "exploded");
sceneLoader.classList.add("hidden");
animate();
