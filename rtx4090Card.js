/**
 * rtx4090Card.js — Photorealistic NVIDIA GeForce RTX 4090 Founders Edition (Three.js)
 *
 * Built from real hardware teardown proportions:
 * - Extruded chamfered titanium-champagne hourglass figure-8 perimeter frame
 * - Matte charcoal left shroud plate with engraved RTX 4090 typography & top/bottom fin wedges
 * - 7-blade curved swept-profile 120mm axial intake & counter-rotating rear exhaust fans
 * - 76-fin dark anodized radiator stack rendered in 1 draw call via InstancedMesh + TubeGeometry copper heat pipes
 * - Matte-black V-notched PCB (real FE shape) with mirror AD102 silicon die, 12 GDDR6X chips,
 *   LR22 VRM chokes, SMD polymer capacitors, and 4 metallic display port housings
 * - Die-cast thermal midplate with silicone thermal pads, stamped X-truss backplate,
 *   stainless steel triple-slot I/O bracket, gold PCIe 4.0 x16 fingers, and 16-pin 12VHPWR header
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Procedural Micro-Brushed & Engraved Hardware Textures
// ---------------------------------------------------------------------------

function createBrushedMetalTexture(baseHex = "#c7bfb0", streakAlpha = 0.08) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 2) {
    const shade = Math.random() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${(Math.random() * streakAlpha).toFixed(3)})`;
    ctx.fillRect(0, y, 512, 1);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createRtx4090FaceplateTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 768;
  const ctx = c.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 1024, 768);
  grad.addColorStop(0, "#1c1f24");
  grad.addColorStop(0.5, "#17191e");
  grad.addColorStop(1, "#121418");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 768);

  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 768;
    ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.025).toFixed(3)})`;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#d9dee6";
  ctx.font = "600 92px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("RTX 4090", 470, 390);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function createGeforceEdgeLogoTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#111317";
  ctx.fillRect(0, 0, 1024, 128);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "600 54px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("GEFORCE RTX", 512, 66);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createGpuDieTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const ctx = c.getContext("2d");

  const grad = ctx.createLinearGradient(0, 0, 512, 512);
  grad.addColorStop(0, "#1c2430");
  grad.addColorStop(0.35, "#2b3948");
  grad.addColorStop(0.65, "#19202a");
  grad.addColorStop(1, "#2f3e46");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "rgba(148, 197, 210, 0.14)";
  ctx.lineWidth = 1;
  for (let i = 32; i < 480; i += 24) {
    ctx.beginPath();
    ctx.moveTo(i, 32);
    ctx.lineTo(i, 480);
    ctx.moveTo(32, i);
    ctx.lineTo(480, i);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(226, 232, 240, 0.72)";
  ctx.font = "600 30px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("NVIDIA", 256, 236);
  ctx.font = "500 20px monospace";
  ctx.fillStyle = "rgba(186, 198, 212, 0.75)";
  ctx.fillText("AD102-300-A1", 256, 276);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createBackplateTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#171a1f";
  ctx.fillRect(0, 0, 1024, 512);

  for (let y = 0; y < 512; y += 3) {
    ctx.fillStyle = `rgba(255,255,255,${(Math.random() * 0.018).toFixed(3)})`;
    ctx.fillRect(0, y, 1024, 1);
  }

  ctx.strokeStyle = "rgba(202, 194, 178, 0.55)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(260, 26);
  ctx.lineTo(640, 486);
  ctx.moveTo(640, 26);
  ctx.lineTo(260, 486);
  ctx.stroke();

  ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
  ctx.font = "600 36px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.fillText("RTX 4090", 96, 430);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ---------------------------------------------------------------------------
// Custom Extruded Geometry Helpers (Real Industrial Profiles)
// ---------------------------------------------------------------------------

function createRoundedFrameGeometry(outerW, outerH, cornerR, borderW, depth) {
  const makeRoundedRect = (w, h, r) => {
    const hw = w / 2;
    const hh = h / 2;
    const s = new THREE.Shape();
    s.moveTo(-hw + r, -hh);
    s.lineTo(hw - r, -hh);
    s.quadraticCurveTo(hw, -hh, hw, -hh + r);
    s.lineTo(hw, hh - r);
    s.quadraticCurveTo(hw, hh, hw - r, hh);
    s.lineTo(-hw + r, hh);
    s.quadraticCurveTo(-hw, hh, -hw, hh - r);
    s.lineTo(-hw, -hh + r);
    s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return s;
  };

  const outer = makeRoundedRect(outerW, outerH, cornerR);
  const inner = makeRoundedRect(
    outerW - borderW * 2,
    outerH - borderW * 2,
    Math.max(0.1, cornerR - borderW * 0.7)
  );
  outer.holes.push(inner);

  const geo = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
    curveSegments: 16,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -depth / 2, 0);
  return geo;
}

function createSweptFanBladeGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0.0, 0.42);
  s.quadraticCurveTo(0.28, 0.85, 0.36, 1.56);
  s.lineTo(0.04, 1.6);
  s.quadraticCurveTo(-0.14, 1.0, -0.18, 0.46);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.045,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 10,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

function createVNotchedPcbGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-3.55, -2.02);
  s.lineTo(2.95, -2.02);
  s.lineTo(3.45, -1.42);
  s.lineTo(2.35, 0.0);
  s.lineTo(3.45, 1.42);
  s.lineTo(2.95, 2.02);
  s.lineTo(-3.55, 2.02);
  s.closePath();

  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.11,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 1,
  });
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, -0.055, 0);
  return geo;
}

// ---------------------------------------------------------------------------
// Main Photorealistic RTX 4090 Card Builder
// ---------------------------------------------------------------------------

export function createRtx4090Card({ RoundedBoxGeometry }) {
  const interactiveMeshes = [];
  const groupTransformData = new Map();

  const brushedChampagneTex = createBrushedMetalTexture("#cac2b2", 0.09);
  const brushedDarkTex = createBrushedMetalTexture("#252930", 0.06);

  const palette = {
    champagne: new THREE.MeshStandardMaterial({
      color: 0xd0c7b6,
      map: brushedChampagneTex,
      metalness: 0.88,
      roughness: 0.24,
    }),
    matteCharcoal: new THREE.MeshStandardMaterial({
      color: 0x1a1d22,
      map: brushedDarkTex,
      metalness: 0.32,
      roughness: 0.44,
    }),
    anodizedDark: new THREE.MeshStandardMaterial({
      color: 0x262b33,
      metalness: 0.72,
      roughness: 0.3,
    }),
    finAnodized: new THREE.MeshStandardMaterial({
      color: 0x3a404a,
      metalness: 0.84,
      roughness: 0.28,
    }),
    copper: new THREE.MeshStandardMaterial({
      color: 0xd97845,
      metalness: 0.94,
      roughness: 0.18,
    }),
    nickelChamber: new THREE.MeshStandardMaterial({
      color: 0xc2c8d0,
      metalness: 0.92,
      roughness: 0.2,
    }),
    pcbBlack: new THREE.MeshStandardMaterial({
      color: 0x14171c,
      metalness: 0.18,
      roughness: 0.46,
    }),
    substrateTeal: new THREE.MeshStandardMaterial({
      color: 0x16423c,
      metalness: 0.25,
      roughness: 0.42,
    }),
    siliconDie: new THREE.MeshPhysicalMaterial({
      map: createGpuDieTexture(),
      metalness: 0.92,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
    }),
    vramChip: new THREE.MeshStandardMaterial({
      color: 0x1e2127,
      metalness: 0.35,
      roughness: 0.38,
    }),
    chokeGray: new THREE.MeshStandardMaterial({
      color: 0x454b54,
      metalness: 0.55,
      roughness: 0.42,
    }),
    capacitorSilver: new THREE.MeshStandardMaterial({
      color: 0xd4dae2,
      metalness: 0.92,
      roughness: 0.18,
    }),
    gold: new THREE.MeshStandardMaterial({
      color: 0xe2b148,
      metalness: 0.96,
      roughness: 0.16,
    }),
    thermalPad: new THREE.MeshStandardMaterial({
      color: 0x4c8ea8,
      metalness: 0.05,
      roughness: 0.82,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0xb2bac4,
      metalness: 0.92,
      roughness: 0.22,
    }),
    fanBlade: new THREE.MeshStandardMaterial({
      color: 0x20242b,
      metalness: 0.38,
      roughness: 0.28,
    }),
    fanHubMetal: new THREE.MeshStandardMaterial({
      color: 0x9aa4b0,
      metalness: 0.9,
      roughness: 0.2,
    }),
    geforceGlow: new THREE.MeshBasicMaterial({
      map: createGeforceEdgeLogoTexture(),
    }),
  };

  const bladeGeo = createSweptFanBladeGeometry();

  function addMesh(parent, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  function rememberPartTransform(object, stackPos, linearPos) {
    groupTransformData.set(object, {
      normal: object.position.clone(),
      stack: new THREE.Vector3(...stackPos),
      linear: new THREE.Vector3(...linearPos),
    });
  }

  function createAxialFan(parent, isFront = true) {
    const fanGroup = new THREE.Group();
    parent.add(fanGroup);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.66, 0.055, 14, 56), palette.fanBlade);
    outerRing.rotation.x = Math.PI / 2;
    fanGroup.add(outerRing);

    const bladeGroup = new THREE.Group();
    fanGroup.add(bladeGroup);

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const pivot = new THREE.Group();
      pivot.rotation.y = angle;
      const blade = new THREE.Mesh(bladeGeo, palette.fanBlade);
      blade.rotation.z = isFront ? 0.28 : -0.28;
      blade.position.y = -0.02;
      pivot.add(blade);
      bladeGroup.add(pivot);
    }

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.56, 0.22, 40), palette.matteCharcoal);
    fanGroup.add(hub);

    const capRing = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.022, 10, 36), palette.champagne);
    capRing.rotation.x = Math.PI / 2;
    capRing.position.y = isFront ? 0.115 : -0.115;
    fanGroup.add(capRing);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.04, 36), palette.fanHubMetal);
    cap.position.y = isFront ? 0.11 : -0.11;
    fanGroup.add(cap);

    fanGroup.userData = { bladeGroup, isFront };
    return fanGroup;
  }

  const card = new THREE.Group();
  card.name = "RTX4090_FoundersEdition";

  // PART 1: FRONT SHROUD
  const part1 = new THREE.Group();
  part1.position.set(0, 0.96, 0);
  card.add(part1);
  rememberPartTransform(part1, [0, 4.4, 0.3], [-14.0, 0, 0]);

  const outerRimGeo = createRoundedFrameGeometry(10.0, 4.46, 0.72, 0.26, 0.26);
  addMesh(part1, outerRimGeo, palette.champagne, [0, 0, 0]);

  const leftPlateShape = new THREE.Shape();
  leftPlateShape.moveTo(-4.62, -1.86);
  leftPlateShape.lineTo(-1.8, -1.86);
  leftPlateShape.lineTo(-0.08, 0.0);
  leftPlateShape.lineTo(-1.8, 1.86);
  leftPlateShape.lineTo(-4.62, 1.86);
  leftPlateShape.quadraticCurveTo(-4.68, 1.86, -4.68, 1.6);
  leftPlateShape.lineTo(-4.68, -1.6);
  leftPlateShape.quadraticCurveTo(-4.68, -1.86, -4.62, -1.86);
  const leftPlateGeo = new THREE.ExtrudeGeometry(leftPlateShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  leftPlateGeo.rotateX(-Math.PI / 2);
  addMesh(part1, leftPlateGeo, palette.matteCharcoal, [0, -0.04, 0]);

  const rtxPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 2.55),
    new THREE.MeshBasicMaterial({ map: createRtx4090FaceplateTexture() })
  );
  rtxPlate.rotation.x = -Math.PI / 2;
  rtxPlate.position.set(-2.65, 0.135, 0);
  part1.add(rtxPlate);

  const makeWedge = (signZ) => {
    const s = new THREE.Shape();
    s.moveTo(-1.45, signZ * 1.94);
    s.lineTo(1.45, signZ * 1.94);
    s.lineTo(0.0, signZ * 0.26);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.025,
      bevelSize: 0.025,
      bevelSegments: 1,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  };
  addMesh(part1, makeWedge(1), palette.matteCharcoal, [0, -0.04, 0]);
  addMesh(part1, makeWedge(-1), palette.matteCharcoal, [0, -0.04, 0]);

  addMesh(part1, new RoundedBoxGeometry(0.18, 0.24, 5.15, 2, 0.04), palette.champagne, [0, 0.04, 0], [0, 0.72, 0]);
  addMesh(part1, new RoundedBoxGeometry(0.18, 0.24, 5.15, 2, 0.04), palette.champagne, [0, 0.04, 0], [0, -0.72, 0]);

  const fanTrim = new THREE.Mesh(new THREE.TorusGeometry(1.76, 0.06, 14, 56), palette.champagne);
  fanTrim.rotation.x = Math.PI / 2;
  fanTrim.position.set(2.45, 0.08, 0);
  part1.add(fanTrim);

  part1.userData = { partKey: "frontShroud", partNum: 1 };

  // PART 2: AXIAL FAN
  const part2 = new THREE.Group();
  part2.position.set(2.45, 0.82, 0);
  card.add(part2);
  rememberPartTransform(part2, [2.45, 3.4, 0.2], [-10.0, 0, 0]);

  const frontFan = createAxialFan(part2, true);
  part2.userData = { fan: frontFan, partKey: "frontFan", partNum: 2 };

  // PART 3: FAN FRAME
  const part3 = new THREE.Group();
  part3.position.set(2.45, 0.54, 0);
  card.add(part3);
  rememberPartTransform(part3, [2.45, 2.4, 0.1], [-6.0, 0, 0]);

  addMesh(part3, new THREE.CylinderGeometry(1.8, 1.8, 0.16, 48, 1, true), palette.anodizedDark, [0, 0, 0]);
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    addMesh(
      part3,
      new THREE.BoxGeometry(0.1, 0.07, 1.72),
      palette.anodizedDark,
      [Math.sin(angle) * 0.85, 0, Math.cos(angle) * 0.85],
      [0, angle, 0]
    );
  }
  addMesh(part3, new THREE.CylinderGeometry(0.64, 0.64, 0.16, 32), palette.matteCharcoal, [0, 0, 0]);
  addMesh(part3, new THREE.TorusGeometry(0.48, 0.04, 10, 32), palette.copper, [0, 0, 0], [Math.PI / 2, 0, 0]);

  part3.userData = { partKey: "fanFrame", partNum: 3 };

  // PART 4: VAPOR CHAMBER HEATSINK (76 Instanced Fins + Bent Copper Heat Pipes)
  const part4 = new THREE.Group();
  part4.position.set(0, 0.2, 0);
  card.add(part4);
  rememberPartTransform(part4, [0, 1.4, 0], [-2.0, 0, 0]);

  addMesh(part4, new RoundedBoxGeometry(4.4, 0.2, 3.85, 2, 0.06), palette.nickelChamber, [-1.85, -0.22, 0]);

  const finCount = 76;
  const finGeo = new THREE.BoxGeometry(0.032, 0.98, 4.1);
  const finInstanced = new THREE.InstancedMesh(finGeo, palette.finAnodized, finCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < finCount; i++) {
    const x = -4.55 + i * 0.121;
    dummy.position.set(x, 0.3, 0);
    const scaleY = Math.abs(x) < 0.7 ? 0.9 : 1.0;
    dummy.scale.set(1, scaleY, 1);
    dummy.updateMatrix();
    finInstanced.setMatrixAt(i, dummy.matrix);
  }
  finInstanced.instanceMatrix.needsUpdate = true;
  part4.add(finInstanced);

  const pipeOffsetsZ = [-1.35, -0.45, 0.45, 1.35];
  pipeOffsetsZ.forEach((zOff, idx) => {
    const bendZ = idx < 2 ? zOff - 0.18 : zOff + 0.18;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.2, -0.14, zOff * 0.65),
      new THREE.Vector3(-1.8, -0.14, zOff * 0.72),
      new THREE.Vector3(0.4, 0.02, bendZ),
      new THREE.Vector3(2.4, 0.12, bendZ),
      new THREE.Vector3(4.3, 0.12, zOff * 0.92),
    ]);
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.105, 10, false);
    addMesh(part4, tubeGeo, palette.copper, [0, 0, 0]);
  });

  part4.userData = { partKey: "heatsink", partNum: 4 };

  // PART 5: MATTE-BLACK V-NOTCHED PCB, AD102 DIE & 24GB GDDR6X
  const part5 = new THREE.Group();
  part5.position.set(-1.15, -0.06, 0);
  card.add(part5);
  rememberPartTransform(part5, [-1.15, 0.2, 0], [2.0, 0, 0]);

  addMesh(part5, createVNotchedPcbGeometry(), palette.pcbBlack, [0, 0, 0]);

  addMesh(part5, new RoundedBoxGeometry(1.92, 0.06, 1.92, 2, 0.03), palette.substrateTeal, [-0.55, 0.075, 0]);
  addMesh(part5, new RoundedBoxGeometry(1.78, 0.08, 1.78, 2, 0.03), palette.steel, [-0.55, 0.085, 0]);
  addMesh(part5, new RoundedBoxGeometry(1.22, 0.1, 1.38, 2, 0.02), palette.siliconDie, [-0.55, 0.11, 0]);

  const vramCoords = [
    [-1.85, -1.15], [-1.85, -0.38], [-1.85, 0.38], [-1.85, 1.15],
    [0.75, -1.15], [0.75, -0.38], [0.75, 0.38], [0.75, 1.15],
    [-0.95, -1.48], [-0.15, -1.48],
    [-0.95, 1.48], [-0.15, 1.48],
  ];
  const vramInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.46, 0.055, 0.58),
    palette.vramChip,
    vramCoords.length
  );
  vramCoords.forEach(([vx, vz], idx) => {
    dummy.position.set(vx, 0.08, vz);
    dummy.scale.set(1, 1, 1);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    vramInst.setMatrixAt(idx, dummy.matrix);
  });
  vramInst.instanceMatrix.needsUpdate = true;
  part5.add(vramInst);

  const chokeInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.32, 0.16, 0.28),
    palette.chokeGray,
    20
  );
  for (let i = 0; i < 10; i++) {
    const z = -1.62 + i * 0.36;
    dummy.position.set(-2.55, 0.12, z);
    dummy.updateMatrix();
    chokeInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(1.48, 0.12, z);
    dummy.updateMatrix();
    chokeInst.setMatrixAt(i + 10, dummy.matrix);
  }
  chokeInst.instanceMatrix.needsUpdate = true;
  part5.add(chokeInst);

  const capInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.18, 12),
    palette.capacitorSilver,
    16
  );
  for (let i = 0; i < 8; i++) {
    const z = -1.4 + i * 0.4;
    dummy.position.set(-2.98, 0.13, z);
    dummy.updateMatrix();
    capInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(1.92, 0.13, z);
    dummy.updateMatrix();
    capInst.setMatrixAt(i + 8, dummy.matrix);
  }
  capInst.instanceMatrix.needsUpdate = true;
  part5.add(capInst);

  part5.userData = { partKey: "pcb", partNum: 5 };

  // PART 6: DIE-CAST THERMAL MIDPLATE & SILICONE PADS
  const part6 = new THREE.Group();
  part6.position.set(-1.15, -0.26, 0);
  card.add(part6);
  rememberPartTransform(part6, [-1.15, -1.1, 0], [6.0, 0, 0]);

  addMesh(part6, new RoundedBoxGeometry(7.2, 0.14, 4.18, 2, 0.06), palette.anodizedDark, [0, 0, 0]);

  const pads = [
    [-1.85, 0.09, -0.75], [-1.85, 0.09, 0.75],
    [0.75, 0.09, -0.75], [0.75, 0.09, 0.75],
    [1.48, 0.09, 0], [-2.55, 0.09, 0],
  ];
  pads.forEach(([px, py, pz]) => {
    addMesh(part6, new THREE.BoxGeometry(0.45, 0.04, 1.25), palette.thermalPad, [px, py, pz]);
  });

  part6.userData = { partKey: "thermalPlate", partNum: 6 };

  // PART 7: ANODIZED BACKPLATE & SPRING-STEEL X-CLAMP
  const part7 = new THREE.Group();
  part7.position.set(0, -0.68, 0);
  card.add(part7);
  rememberPartTransform(part7, [0, -2.4, -0.1], [10.0, 0, 0]);

  addMesh(part7, new RoundedBoxGeometry(9.8, 0.13, 4.38, 3, 0.18), palette.matteCharcoal, [0, 0, 0]);

  const bpPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 4.05),
    new THREE.MeshBasicMaterial({ map: createBackplateTexture(), side: THREE.DoubleSide })
  );
  bpPlate.rotation.x = Math.PI / 2;
  bpPlate.position.set(0, -0.072, 0);
  part7.add(bpPlate);

  addMesh(part7, new THREE.BoxGeometry(1.65, 0.07, 0.2), palette.steel, [-1.7, -0.09, 0], [0, 0.785, 0]);
  addMesh(part7, new THREE.BoxGeometry(1.65, 0.07, 0.2), palette.steel, [-1.7, -0.09, 0], [0, -0.785, 0]);
  addMesh(part7, new THREE.CylinderGeometry(1.74, 1.74, 0.18, 44), palette.anodizedDark, [2.45, 0, 0]);

  part7.userData = { partKey: "backplate", partNum: 7 };

  // PART 8: REAR SHROUD & FLOW-THROUGH EXHAUST FAN
  const part8 = new THREE.Group();
  part8.position.set(0, -0.96, 0);
  card.add(part8);
  rememberPartTransform(part8, [0, -4.0, -0.2], [14.0, 0, 0]);

  const rearRimGeo = createRoundedFrameGeometry(10.0, 4.46, 0.72, 0.26, 0.22);
  addMesh(part8, rearRimGeo, palette.champagne, [0, 0, 0]);

  const rearFan = createAxialFan(part8, false);
  rearFan.position.set(2.45, -0.02, 0);

  for (let i = 0; i < 9; i++) {
    addMesh(part8, new THREE.BoxGeometry(0.08, 0.2, 3.85), palette.champagne, [-4.1 + i * 0.46, 0, 0]);
  }

  part8.userData = { rearFan, partKey: "rearShroud", partNum: 8 };

  // EXTERIOR INTERFACES: I/O Bracket, PCIe 4.0 x16, 12VHPWR
  const bracket = new THREE.Group();
  bracket.position.set(-5.06, -0.14, 0);
  card.add(bracket);
  rememberPartTransform(bracket, [-7.2, 0, 0], [-17.5, 0, 0]);

  addMesh(bracket, new RoundedBoxGeometry(0.12, 2.38, 4.3, 2, 0.04), palette.steel, [0, 0, 0]);
  [-1.35, -0.45, 0.45, 1.35].forEach((z, idx) => {
    addMesh(bracket, new THREE.BoxGeometry(0.24, 0.36, 0.62), palette.steel, [0.06, -0.42, z]);
    addMesh(bracket, new THREE.BoxGeometry(0.06, 0.2, 0.44), palette.matteCharcoal, [-0.07, -0.42, z]);
    if (idx === 3) {
      addMesh(bracket, new THREE.BoxGeometry(0.05, 0.08, 0.36), palette.gold, [-0.09, -0.42, z]);
    }
  });
  bracket.userData = { partKey: "bracket" };

  const pcie = new THREE.Group();
  pcie.position.set(0.45, -0.22, 2.3);
  card.add(pcie);
  rememberPartTransform(pcie, [0.45, -0.9, 3.8], [2.0, -2.5, 0]);

  addMesh(pcie, new RoundedBoxGeometry(5.1, 0.15, 0.3, 2, 0.03), palette.pcbBlack, [0, 0, 0]);
  const fingerInst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 0.035), palette.gold, 22);
  for (let i = 0; i < 22; i++) {
    dummy.position.set(-2.3 + i * 0.22, 0, 0.155);
    dummy.updateMatrix();
    fingerInst.setMatrixAt(i, dummy.matrix);
  }
  fingerInst.instanceMatrix.needsUpdate = true;
  pcie.add(fingerInst);
  pcie.userData = { partKey: "pcie" };

  const topBar = new THREE.Group();
  topBar.position.set(0, 0, -2.26);
  card.add(topBar);
  rememberPartTransform(topBar, [0, 1.2, -3.8], [-2.0, 2.5, 0]);

  const logoPlate = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.44), palette.geforceGlow);
  logoPlate.position.set(1.7, 0.12, -0.02);
  topBar.add(logoPlate);

  addMesh(topBar, new RoundedBoxGeometry(0.86, 0.36, 0.26, 2, 0.03), palette.matteCharcoal, [-0.15, 0.12, -0.04]);
  topBar.userData = { partKey: "power" };

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

  const partGroupByKey = {
    frontShroud: part1,
    frontFan: part2,
    fanFrame: part3,
    heatsink: part4,
    pcb: part5,
    thermalPlate: part6,
    backplate: part7,
    rearShroud: part8,
    bracket,
    pcie,
    power: topBar,
  };

  card.traverse((child) => {
    if (child.isMesh) {
      interactiveMeshes.push(child);
      child.userData.origMaterial = child.material;
    }
  });

  return { card, partGroupByKey, interactiveMeshes, groupTransformData };
}

export default createRtx4090Card;
