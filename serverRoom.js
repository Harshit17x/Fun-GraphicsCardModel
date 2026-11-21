/**
 * serverRoom.js — Architectural Photorealistic NVIDIA DGX SuperPOD Cleanroom
 *
 * Modeled after real NVIDIA DGX SuperPOD cold-aisle containment facilities:
 * - Matte white raised access floor tiles with brushed-steel cold-aisle airflow grilles
 * - Full-height aluminum & glass cold-aisle containment sliding doors at corridor ends
 * - Acoustic cleanroom ceiling tile grid with recessed architectural LED troffer panels
 * - Overhead cable ladder trays with instanced rungs & structured power/fiber trunk conduits
 * - Dual opposing rows of 42U matte-charcoal cabinets with brushed champagne-platinum DGX faceplates
 *   and individual aisle rack plaques (A01–A09 / B01–B09)
 * - Fully articulated Hero Rack (A04) with glass door, 3-stage steel slide rails,
 *   4U 8-GPU HGX compute sled, and O(1) hover/click hit proxy for locked 60 FPS
 */

import * as THREE from "three";

// ---------------------------------------------------------------------------
// Procedural Architectural PBR Canvas Textures
// ---------------------------------------------------------------------------

/**
 * Raised Cleanroom Floor Tile Texture (600mm Matte White Tiles with subtle joints)
 */
function createFloorCanvasTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f2f4f7";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle ceramic/anti-static laminate speckle
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.4)" : "rgba(148,163,184,0.12)";
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp 2x2 raised floor tile seams
  ctx.strokeStyle = "#cfd6df";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = T.RepeatWrapping;
  texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(12, 28);
  texture.anisotropy = 4;
  return texture;
}

/**
 * Perforated Cold-Aisle Steel Floor Grate Texture (matches real DGX SuperPOD center aisle)
 */
function createAirGrateTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#dfe4ea";
  ctx.fillRect(0, 0, 256, 256);

  // Dark airflow slots
  ctx.fillStyle = "#8a96a6";
  for (let y = 10; y < 246; y += 12) {
    for (let x = 10; x < 246; x += 28) {
      ctx.fillRect(x, y, 20, 5);
    }
  }

  // Tile perimeter frame
  ctx.strokeStyle = "#b8c2ce";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 256, 256);

  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.wrapS = T.RepeatWrapping;
  tex.wrapT = T.RepeatWrapping;
  tex.repeat.set(2, 28);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Cleanroom Acoustic Ceiling Tile Grid Texture
 */
function createCeilingGridTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#eceff4";
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  for (let i = 0; i <= 512; i += 128) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.wrapS = T.RepeatWrapping;
  tex.wrapT = T.RepeatWrapping;
  tex.repeat.set(8, 20);
  return tex;
}

/**
 * Realistic DGX SuperPOD 42U Cabinet Front Faceplate Texture
 */
function createDgxRackFaceTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#14171c";
  ctx.fillRect(0, 0, 512, 1024);

  // EIA vertical rail holes on left and right
  ctx.fillStyle = "#3f4754";
  for (let ry = 16; ry < 1008; ry += 16) {
    ctx.fillRect(10, ry, 8, 6);
    ctx.fillRect(494, ry, 8, 6);
  }

  let y = 20;
  let idx = 0;
  while (y < 992) {
    const isDgxNode = idx % 3 !== 1;
    const h = isDgxNode ? 92 : 44;
    if (y + h > 1004) break;

    if (isDgxNode) {
      // Brushed champagne-platinum DGX H100/SuperPOD faceplate
      const grad = ctx.createLinearGradient(26, y, 486, y + h);
      grad.addColorStop(0, "#d2cab8");
      grad.addColorStop(0.45, "#e2dccf");
      grad.addColorStop(1, "#bfb6a2");
      ctx.fillStyle = grad;
      ctx.fillRect(26, y, 460, h - 6);

      // Subtle top/bottom machined bevel
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(26, y, 460, 2);
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(26, y + h - 8, 460, 2);

      // Left & right dark hexagonal intake mesh cutouts
      ctx.fillStyle = "#191d24";
      ctx.fillRect(40, y + 14, 152, h - 34);
      ctx.fillRect(320, y + 14, 152, h - 34);

      ctx.fillStyle = "#2b323e";
      for (let ly = y + 19; ly < y + h - 22; ly += 7) {
        ctx.fillRect(44, ly, 144, 2);
        ctx.fillRect(324, ly, 144, 2);
      }

      // Center anodized DGX badge bar + NVIDIA green status bar
      ctx.fillStyle = "#1c2028";
      ctx.fillRect(204, y + 28, 104, 26);
      ctx.fillStyle = "#76b900";
      ctx.fillRect(212, y + 36, 10, 10);
      ctx.fillStyle = "#d8dee9";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("DGX POD", 230, y + 46);
    } else {
      // 2U Quantum-2 InfiniBand Switch with QSFP ports & fiber LEDs
      ctx.fillStyle = "#222730";
      ctx.fillRect(26, y, 460, h - 5);
      ctx.fillStyle = "#101318";
      ctx.fillRect(42, y + 8, 356, h - 21);

      // Individual QSFP transceiver cages
      ctx.fillStyle = "#363e4d";
      for (let px = 48; px < 390; px += 20) {
        ctx.fillRect(px, y + 12, 14, 14);
      }

      // Link LEDs
      ctx.fillStyle = "#76b900";
      ctx.fillRect(416, y + 14, 8, 6);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(432, y + 14, 8, 6);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(448, y + 14, 8, 6);
    }

    y += h + 6;
    idx++;
  }

  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/**
 * Individual Rack Number Plaque Texture (e.g. A01..A09, B01..B09)
 */
function createRackPlaqueTexture(T, label, isHero = false) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = isHero ? "#182018" : "#1a1f28";
  ctx.fillRect(0, 0, 256, 64);

  ctx.fillStyle = isHero ? "#76b900" : "#64748b";
  ctx.fillRect(0, 0, 12, 64);

  ctx.fillStyle = "#f1f5f9";
  ctx.font = "700 28px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 134, 34);

  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  return tex;
}

/**
 * Architectural Facility Header Sign Texture
 */
function createSignCanvasTexture(T, title, subtitle) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 1016, 248);

  ctx.fillStyle = "#76b900";
  ctx.fillRect(20, 20, 14, 216);

  ctx.fillStyle = "#0f172a";
  ctx.font = "600 44px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.fillText(title, 60, 102);

  ctx.fillStyle = "#475569";
  ctx.font = "500 24px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.fillText(subtitle, 60, 154);

  ctx.fillStyle = "#76b900";
  ctx.beginPath();
  ctx.arc(66, 202, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#64748b";
  ctx.font = "500 18px monospace";
  ctx.fillText("COLD-AISLE CONTAINMENT · POD-A · ISO CLASS 7 CLEANROOM", 86, 208);

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

// ---------------------------------------------------------------------------
// Shared Architectural PBR Materials
// ---------------------------------------------------------------------------

function createSharedMaterials(T) {
  return {
    floor: new T.MeshStandardMaterial({
      color: 0xffffff,
      map: createFloorCanvasTexture(T) || undefined,
      roughness: 0.28,
      metalness: 0.06,
    }),

    airGrate: new T.MeshStandardMaterial({
      color: 0xffffff,
      map: createAirGrateTexture(T) || undefined,
      roughness: 0.36,
      metalness: 0.45,
    }),

    ceiling: new T.MeshStandardMaterial({
      color: 0xffffff,
      map: createCeilingGridTexture(T) || undefined,
      roughness: 0.8,
      metalness: 0.04,
    }),

    wall: new T.MeshStandardMaterial({
      color: 0xe5ebf2,
      roughness: 0.68,
      metalness: 0.06,
    }),

    aluminumFrame: new T.MeshStandardMaterial({
      color: 0xbac4d0,
      roughness: 0.28,
      metalness: 0.85,
    }),

    containmentGlass: new T.MeshStandardMaterial({
      color: 0xe2f1fb,
      transparent: true,
      opacity: 0.22,
      roughness: 0.06,
      metalness: 0.78,
    }),

    rackFrame: new T.MeshStandardMaterial({
      color: 0x1a1e25,
      roughness: 0.42,
      metalness: 0.68,
    }),

    rackPanel: new T.MeshStandardMaterial({
      color: 0x242a34,
      roughness: 0.44,
      metalness: 0.62,
    }),

    rackFaceMap: new T.MeshStandardMaterial({
      map: createDgxRackFaceTexture(T) || undefined,
      roughness: 0.34,
      metalness: 0.56,
    }),

    rackRail: new T.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.28,
      metalness: 0.86,
    }),

    glassDoor: new T.MeshStandardMaterial({
      color: 0xdbeafe,
      transparent: true,
      opacity: 0.15,
      roughness: 0.08,
      metalness: 0.72,
    }),

    heroGlassDoor: new T.MeshStandardMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.18,
      roughness: 0.06,
      metalness: 0.78,
    }),

    doorFrame: new T.MeshStandardMaterial({
      color: 0x262c36,
      roughness: 0.34,
      metalness: 0.8,
    }),

    doorHandle: new T.MeshStandardMaterial({
      color: 0xd4ccbc,
      roughness: 0.22,
      metalness: 0.9,
    }),

    chassisBody: new T.MeshStandardMaterial({
      color: 0x2a313d,
      roughness: 0.4,
      metalness: 0.68,
    }),

    chassisFace: new T.MeshStandardMaterial({
      color: 0xd6cfc0,
      roughness: 0.28,
      metalness: 0.8,
    }),

    pcb: new T.MeshStandardMaterial({
      color: 0x132b20,
      roughness: 0.44,
      metalness: 0.24,
    }),

    heatsinkFin: new T.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.26,
      metalness: 0.88,
    }),

    goldContact: new T.MeshStandardMaterial({
      color: 0xe5b44c,
      roughness: 0.18,
      metalness: 0.96,
    }),

    steelRail: new T.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.18,
      metalness: 0.92,
    }),

    fanHub: new T.MeshStandardMaterial({
      color: 0x1d222b,
      roughness: 0.4,
      metalness: 0.55,
    }),

    fanBlade: new T.MeshStandardMaterial({
      color: 0x333c4a,
      roughness: 0.32,
      metalness: 0.45,
    }),

    ledGreen: new T.MeshBasicMaterial({ color: 0x76b900 }),
    trofferLight: new T.MeshBasicMaterial({ color: 0xffffff }),
    aisleTrim: new T.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.75,
    }),

    cableTray: new T.MeshStandardMaterial({
      color: 0x8b98a8,
      roughness: 0.38,
      metalness: 0.82,
    }),
    cableYellow: new T.MeshStandardMaterial({ color: 0xd4a006, roughness: 0.48, metalness: 0.12 }),
    cableBlue: new T.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.48, metalness: 0.12 }),
  };
}

// ---------------------------------------------------------------------------
// Server Room Procedural Construction
// ---------------------------------------------------------------------------

export function createServerRoom(scene, options = {}) {
  const T = options.THREE || THREE;
  const materials = createSharedMaterials(T);

  const racksPerRow = options.racksPerRow || 9;
  const rackSpacingZ = 28.0;
  const aisleWidth = options.aisleWidth || 36.0;
  const rackDepth = 26.0;
  const rackWidth = 24.0;
  const rackHeight = 78.0;
  const roomLength = 320.0;
  const roomWidth = 140.0;
  const roomHeight = 92.0;

  const heroRackIndex = options.heroRackIndex !== undefined ? options.heroRackIndex : 3;

  const roomGroup = new T.Group();
  roomGroup.name = "DatacenterServerRoom";
  if (scene) {
    scene.add(roomGroup);
  }

  const animatedFans = [];
  let heroDoorPivot = null;
  let heroTray = null;
  let heroGpuMount = null;
  let intermediateRailLeft = null;
  let intermediateRailRight = null;
  const heroRackObj = {};

  let targetDoorFactor = 0.0;
  let currentDoorFactor = 0.0;
  let targetTrayFactor = 0.0;
  let currentTrayFactor = 0.0;

  const maxDoorAngle = -Math.PI * 0.53;
  const trayRetractedX = -30.75;
  const trayMaxTravel = 19.0;
  const trayExtendedX = trayRetractedX + trayMaxTravel;

  // -------------------------------------------------------------------------
  // 1. Cleanroom Architecture & Cold-Aisle Containment
  // -------------------------------------------------------------------------

  // Raised access floor
  const floorMesh = new T.Mesh(new T.PlaneGeometry(roomWidth, roomLength), materials.floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Center cold-aisle brushed-steel perforated airflow floor grilles
  const grateStrip = new T.Mesh(
    new T.PlaneGeometry(14.0, roomLength - 56),
    materials.airGrate
  );
  grateStrip.rotation.x = -Math.PI / 2;
  grateStrip.position.set(0, 0.03, 0);
  grateStrip.receiveShadow = true;
  roomGroup.add(grateStrip);

  // Brushed aluminum floor transition trim along rack bases
  const trimGeo = new T.BoxGeometry(0.45, 0.14, roomLength - 52);
  const trimL = new T.Mesh(trimGeo, materials.aisleTrim);
  trimL.position.set(-(aisleWidth * 0.5) + 0.25, 0.07, 0);
  roomGroup.add(trimL);

  const trimR = new T.Mesh(trimGeo, materials.aisleTrim);
  trimR.position.set(aisleWidth * 0.5 - 0.25, 0.07, 0);
  roomGroup.add(trimR);

  // Acoustic ceiling grid
  const ceilingMesh = new T.Mesh(new T.PlaneGeometry(roomWidth, roomLength), materials.ceiling);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = roomHeight;
  roomGroup.add(ceilingMesh);

  // Cold-Aisle Containment Skylight Roof Panels & Aluminum Cross-Beams
  const roofGlass = new T.Mesh(
    new T.PlaneGeometry(aisleWidth, roomLength - 64),
    materials.containmentGlass
  );
  roofGlass.rotation.x = Math.PI / 2;
  roofGlass.position.set(0, rackHeight + 0.2, 0);
  roomGroup.add(roofGlass);

  // Architectural cross-beams + recessed ceiling LED troffers via InstancedMesh
  const beamGeo = new T.BoxGeometry(aisleWidth + 0.6, 0.65, 0.55);
  const beamCount = 10;
  const beamInst = new T.InstancedMesh(beamGeo, materials.aluminumFrame, beamCount);
  const trofferGeo = new T.BoxGeometry(6.8, 0.25, 16.0);
  const trofferInst = new T.InstancedMesh(trofferGeo, materials.trofferLight, beamCount - 1);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < beamCount; i++) {
    const bz = -126 + i * 28;
    dummy.position.set(0, rackHeight + 0.5, bz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    beamInst.setMatrixAt(i, dummy.matrix);

    if (i < beamCount - 1) {
      dummy.position.set(0, roomHeight - 0.3, bz + 14);
      dummy.updateMatrix();
      trofferInst.setMatrixAt(i, dummy.matrix);
    }
  }
  beamInst.instanceMatrix.needsUpdate = true;
  trofferInst.instanceMatrix.needsUpdate = true;
  roomGroup.add(beamInst);
  roomGroup.add(trofferInst);

  // Full-Height Cold-Aisle Containment Glass Sliding Doors at Far End (Z = -126)
  const portalGroup = new T.Group();
  portalGroup.position.set(0, 0, -126);
  roomGroup.add(portalGroup);

  const portalHeader = new T.Mesh(
    new T.BoxGeometry(aisleWidth + 2, 2.2, 1.4),
    materials.aluminumFrame
  );
  portalHeader.position.set(0, rackHeight - 1.1, 0);
  portalGroup.add(portalHeader);

  // Left & Right sliding glass door leaves with brushed aluminum frames
  [-aisleWidth * 0.25, aisleWidth * 0.25].forEach((dx) => {
    const leafW = aisleWidth * 0.5 - 0.5;
    const leafH = rackHeight - 2.4;
    const glass = new T.Mesh(
      new T.BoxGeometry(leafW, leafH, 0.25),
      materials.containmentGlass
    );
    glass.position.set(dx, leafH * 0.5, 0);
    portalGroup.add(glass);

    const stile = new T.Mesh(
      new T.BoxGeometry(0.7, leafH, 0.55),
      materials.aluminumFrame
    );
    stile.position.set(dx + (dx < 0 ? leafW * 0.5 : -leafW * 0.5), leafH * 0.5, 0);
    portalGroup.add(stile);

    const handle = new T.Mesh(
      new T.BoxGeometry(0.35, 16, 0.8),
      materials.doorHandle
    );
    handle.position.set(dx + (dx < 0 ? leafW * 0.5 - 1.4 : -leafW * 0.5 + 1.4), 34, 0.45);
    portalGroup.add(handle);
  });

  // Containment Walls
  const endWallGeo = new T.PlaneGeometry(roomWidth, roomHeight);
  const backWall = new T.Mesh(endWallGeo, materials.wall);
  backWall.position.set(0, roomHeight / 2, -roomLength / 2);
  roomGroup.add(backWall);

  const frontWall = new T.Mesh(endWallGeo, materials.wall);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, roomHeight / 2, roomLength / 2);
  roomGroup.add(frontWall);

  const sideWallGeo = new T.PlaneGeometry(roomLength, roomHeight);
  const leftSideWall = new T.Mesh(sideWallGeo, materials.wall);
  leftSideWall.rotation.y = Math.PI / 2;
  leftSideWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  roomGroup.add(leftSideWall);

  const rightSideWall = new T.Mesh(sideWallGeo, materials.wall);
  rightSideWall.rotation.y = -Math.PI / 2;
  rightSideWall.position.set(roomWidth / 2, roomHeight / 2, 0);
  roomGroup.add(rightSideWall);

  // Back Wall Architectural Facility Signage
  const signTexture = createSignCanvasTexture(
    T,
    "NVIDIA DGX SuperPOD™",
    "SUPERCLUSTER CLOUD POD-A · AISLE 04"
  );
  if (signTexture) {
    const signMesh = new T.Mesh(
      new T.PlaneGeometry(42, 10.5),
      new T.MeshBasicMaterial({ map: signTexture })
    );
    signMesh.position.set(0, 58.0, -roomLength / 2 + 0.8);
    roomGroup.add(signMesh);
  }

  // -------------------------------------------------------------------------
  // 2. Overhead Structured Cable Ladders (Instanced Rungs)
  // -------------------------------------------------------------------------

  const trayY = rackHeight + 4.5;
  const leftTrayX = -(aisleWidth * 0.5 + rackDepth * 0.5);
  const rightTrayX = aisleWidth * 0.5 + rackDepth * 0.5;

  function buildCableTrayLadder(xPos) {
    const ladderGroup = new T.Group();
    const sideRailGeo = new T.BoxGeometry(0.32, 0.8, roomLength - 44);
    const rail1 = new T.Mesh(sideRailGeo, materials.cableTray);
    rail1.position.set(xPos - 5.2, trayY, 0);
    ladderGroup.add(rail1);

    const rail2 = new T.Mesh(sideRailGeo, materials.cableTray);
    rail2.position.set(xPos + 5.2, trayY, 0);
    ladderGroup.add(rail2);

    const rungCount = 30;
    const rungInst = new T.InstancedMesh(
      new T.BoxGeometry(10.4, 0.18, 0.35),
      materials.cableTray,
      rungCount
    );
    for (let r = 0; r < rungCount; r++) {
      dummy.position.set(xPos, trayY - 0.25, -130 + r * 9.0);
      dummy.updateMatrix();
      rungInst.setMatrixAt(r, dummy.matrix);
    }
    rungInst.instanceMatrix.needsUpdate = true;
    ladderGroup.add(rungInst);

    const yellowCable = new T.Mesh(
      new T.BoxGeometry(1.4, 0.68, roomLength - 52),
      materials.cableYellow
    );
    yellowCable.position.set(xPos - 2.4, trayY + 0.34, 0);
    ladderGroup.add(yellowCable);

    const blueCable = new T.Mesh(
      new T.BoxGeometry(2.0, 0.62, roomLength - 52),
      materials.cableBlue
    );
    blueCable.position.set(xPos + 1.4, trayY + 0.31, 0);
    ladderGroup.add(blueCable);

    return ladderGroup;
  }

  roomGroup.add(buildCableTrayLadder(leftTrayX));
  roomGroup.add(buildCableTrayLadder(rightTrayX));

  // -------------------------------------------------------------------------
  // 3. Shared Geometries for 42U DGX Cabinets
  // -------------------------------------------------------------------------

  const rackBodyGeo = new T.BoxGeometry(rackDepth, rackHeight, rackWidth);
  const rackFaceGeo = new T.PlaneGeometry(rackWidth - 1.6, rackHeight - 2.8);
  const doorGeo = new T.BoxGeometry(0.24, rackHeight - 3.0, rackWidth - 1.8);
  const plaqueGeo = new T.PlaneGeometry(6.4, 1.6);

  const postGeo = new T.BoxGeometry(1.2, rackHeight, 1.2);
  const topCapGeo = new T.BoxGeometry(rackDepth, 1.4, rackWidth);
  const sidePanelGeo = new T.BoxGeometry(rackDepth - 1.2, rackHeight - 2.0, 0.4);
  const eiaRailGeo = new T.BoxGeometry(0.6, rackHeight - 4.0, 0.6);

  const chassis4UGeo = new T.BoxGeometry(rackDepth - 3.0, 6.8, rackWidth - 2.4);
  const bezel4UGeo = new T.BoxGeometry(0.45, 6.4, rackWidth - 2.8);
  const ledDotGeo = new T.BoxGeometry(0.12, 0.16, 0.24);

  function buildStandardRack(rackX, rackZ, isLeft, label) {
    const rack = new T.Group();
    rack.position.set(rackX, 0, rackZ);
    rack.rotation.y = isLeft ? 0 : Math.PI;

    const halfD = rackDepth * 0.5;

    const body = new T.Mesh(rackBodyGeo, materials.rackFrame);
    body.position.set(0, rackHeight * 0.5, 0);
    rack.add(body);

    const face = new T.Mesh(rackFaceGeo, materials.rackFaceMap);
    face.rotation.y = Math.PI / 2;
    face.position.set(halfD + 0.05, rackHeight * 0.5, 0);
    rack.add(face);

    const door = new T.Mesh(doorGeo, materials.glassDoor);
    door.position.set(halfD + 0.35, rackHeight * 0.5, 0);
    rack.add(door);

    // Individual Rack Number Plaque above top header
    const plaque = new T.Mesh(
      plaqueGeo,
      new T.MeshBasicMaterial({ map: createRackPlaqueTexture(T, label, false) })
    );
    plaque.rotation.y = Math.PI / 2;
    plaque.position.set(halfD + 0.12, rackHeight - 0.7, 0);
    rack.add(plaque);

    return rack;
  }

  // -------------------------------------------------------------------------
  // 4. Articulated Hero Rack (A04)
  // -------------------------------------------------------------------------

  function buildHeroRack(rackX, rackZ, label) {
    const rack = new T.Group();
    rack.name = "HeroRack_A04";
    rack.position.set(rackX, 0, rackZ);

    const halfD = rackDepth * 0.5 - 0.6;
    const halfW = rackWidth * 0.5 - 0.6;

    const postPositions = [
      [-halfD, rackHeight * 0.5, -halfW],
      [halfD, rackHeight * 0.5, -halfW],
      [-halfD, rackHeight * 0.5, halfW],
      [halfD, rackHeight * 0.5, halfW],
    ];
    for (let p = 0; p < postPositions.length; p++) {
      const post = new T.Mesh(postGeo, materials.rackFrame);
      post.position.set(...postPositions[p]);
      rack.add(post);
    }

    const topCap = new T.Mesh(topCapGeo, materials.rackFrame);
    topCap.position.set(0, rackHeight - 0.7, 0);
    rack.add(topCap);

    const plaque = new T.Mesh(
      plaqueGeo,
      new T.MeshBasicMaterial({ map: createRackPlaqueTexture(T, label, true) })
    );
    plaque.rotation.y = Math.PI / 2;
    plaque.position.set(halfD + 0.68, rackHeight - 0.7, 0);
    rack.add(plaque);

    const baseCap = new T.Mesh(topCapGeo, materials.rackFrame);
    baseCap.position.set(0, 0.7, 0);
    rack.add(baseCap);

    const side1 = new T.Mesh(sidePanelGeo, materials.rackPanel);
    side1.position.set(0, rackHeight * 0.5, -halfW);
    rack.add(side1);

    const side2 = new T.Mesh(sidePanelGeo, materials.rackPanel);
    side2.position.set(0, rackHeight * 0.5, halfW);
    rack.add(side2);

    const backPanel = new T.Mesh(
      new T.BoxGeometry(0.4, rackHeight - 2.0, rackWidth - 1.2),
      materials.rackPanel
    );
    backPanel.position.set(-halfD, rackHeight * 0.5, 0);
    rack.add(backPanel);

    const frontRail1 = new T.Mesh(eiaRailGeo, materials.rackRail);
    frontRail1.position.set(halfD - 1.2, rackHeight * 0.5, -9.5);
    rack.add(frontRail1);

    const frontRail2 = new T.Mesh(eiaRailGeo, materials.rackRail);
    frontRail2.position.set(halfD - 1.2, rackHeight * 0.5, 9.5);
    rack.add(frontRail2);

    const addRackUnit = (yCenter) => {
      const chassis = new T.Mesh(chassis4UGeo, materials.chassisBody);
      chassis.position.set(0, yCenter, 0);
      rack.add(chassis);

      const bezel = new T.Mesh(bezel4UGeo, materials.chassisFace);
      bezel.position.set(halfD - 1.0, yCenter, 0);
      rack.add(bezel);

      const led = new T.Mesh(ledDotGeo, materials.ledGreen);
      led.position.set(halfD - 0.72, yCenter, -7.8);
      rack.add(led);
    };

    [6.6, 14.0, 21.4, 28.8, 44.6, 52.0, 59.4, 66.8].forEach(addRackUnit);

    const heroOuterShell = new T.Mesh(
      new T.BoxGeometry(rackDepth - 2.5, 7.2, rackWidth - 2.2),
      materials.chassisBody
    );
    heroOuterShell.position.set(0, 36.6, 0);
    rack.add(heroOuterShell);

    const fixedRailGeo = new T.BoxGeometry(rackDepth - 3.0, 0.45, 0.35);
    const fixedRailLeft = new T.Mesh(fixedRailGeo, materials.steelRail);
    fixedRailLeft.position.set(0, 36.6, -10.2);
    rack.add(fixedRailLeft);

    const fixedRailRight = new T.Mesh(fixedRailGeo, materials.steelRail);
    fixedRailRight.position.set(0, 36.6, 10.2);
    rack.add(fixedRailRight);

    const interRailGeo = new T.BoxGeometry(rackDepth - 4.0, 0.35, 0.25);
    intermediateRailLeft = new T.Mesh(interRailGeo, materials.steelRail);
    intermediateRailLeft.position.set(0, 36.6, -10.0);
    rack.add(intermediateRailLeft);

    intermediateRailRight = new T.Mesh(interRailGeo, materials.steelRail);
    intermediateRailRight.position.set(0, 36.6, 10.0);
    rack.add(intermediateRailRight);

    // Hero 4U Compute Tray
    heroTray = new T.Group();
    heroTray.name = "HeroComputeTray_4U";
    heroTray.position.set(0, 36.6, 0);
    rack.add(heroTray);

    const trayBed = new T.Mesh(new T.BoxGeometry(22.0, 0.35, 19.8), materials.chassisBody);
    trayBed.position.set(0, -3.2, 0);
    heroTray.add(trayBed);

    const traySideGeo = new T.BoxGeometry(22.0, 1.8, 0.3);
    const traySideL = new T.Mesh(traySideGeo, materials.steelRail);
    traySideL.position.set(0, -2.3, -9.8);
    heroTray.add(traySideL);

    const traySideR = new T.Mesh(traySideGeo, materials.steelRail);
    traySideR.position.set(0, -2.3, 9.8);
    heroTray.add(traySideR);

    const trayFrontBezel = new T.Mesh(new T.BoxGeometry(0.6, 6.6, 20.2), materials.chassisFace);
    trayFrontBezel.position.set(11.3, 0, 0);
    heroTray.add(trayFrontBezel);

    const handleGeo = new T.BoxGeometry(0.4, 3.8, 0.4);
    const handleL = new T.Mesh(handleGeo, materials.doorHandle);
    handleL.position.set(11.8, 0, -8.6);
    heroTray.add(handleL);

    const handleR = new T.Mesh(handleGeo, materials.doorHandle);
    handleR.position.set(11.8, 0, 8.6);
    heroTray.add(handleR);

    const oledScreen = new T.Mesh(new T.PlaneGeometry(5.8, 1.0), materials.ledGreen);
    oledScreen.rotation.y = Math.PI / 2;
    oledScreen.position.set(11.62, 1.8, 0);
    heroTray.add(oledScreen);

    // 4 Front Intake Blower Fans
    const fanBankZ = [-6.6, -2.2, 2.2, 6.6];
    const fanCasingGeo = new T.CylinderGeometry(1.4, 1.4, 0.8, 14);
    fanCasingGeo.rotateZ(Math.PI / 2);
    const fanHubGeo = new T.CylinderGeometry(0.45, 0.45, 0.82, 10);
    fanHubGeo.rotateZ(Math.PI / 2);
    const fanBladeGeo = new T.BoxGeometry(0.12, 0.9, 0.04);

    for (let f = 0; f < fanBankZ.length; f++) {
      const fz = fanBankZ[f];
      const casing = new T.Mesh(fanCasingGeo, materials.fanHub);
      casing.position.set(10.2, -1.0, fz);
      heroTray.add(casing);

      const bladesGroup = new T.Group();
      bladesGroup.position.set(10.2, -1.0, fz);
      bladesGroup.add(new T.Mesh(fanHubGeo, materials.fanHub));

      for (let b = 0; b < 5; b++) {
        const blade = new T.Mesh(fanBladeGeo, materials.fanBlade);
        const angle = (b / 5) * Math.PI * 2;
        blade.position.set(0, Math.sin(angle) * 0.7, Math.cos(angle) * 0.7);
        blade.rotation.x = angle + 0.35;
        bladesGroup.add(blade);
      }

      heroTray.add(bladesGroup);
      animatedFans.push({ group: bladesGroup, direction: f % 2 === 0 ? 1 : -1 });
    }

    // HGX Baseboard
    const mobo = new T.Mesh(new T.BoxGeometry(20.0, 0.25, 19.0), materials.pcb);
    mobo.position.set(-0.5, -2.8, 0);
    heroTray.add(mobo);

    // 8x GPU Blade Layout
    const gpuRowsX = [4.2, -4.8];
    const gpuColsZ = [-6.6, -2.2, 2.2, 6.6];
    const heatsinkGeo = new T.BoxGeometry(7.6, 2.4, 3.8);
    const topPlateGeo = new T.BoxGeometry(7.8, 0.16, 4.0);
    const stripeGeo = new T.BoxGeometry(7.6, 0.08, 0.18);
    const slotSocketGeo = new T.BoxGeometry(8.0, 0.38, 0.6);

    function createCompanionGpu() {
      const gpu = new T.Group();
      const heatsink = new T.Mesh(heatsinkGeo, materials.heatsinkFin);
      heatsink.position.set(0, 1.2, 0);
      gpu.add(heatsink);

      const topPlate = new T.Mesh(topPlateGeo, materials.chassisFace);
      topPlate.position.set(0, 2.48, 0);
      gpu.add(topPlate);

      const stripe = new T.Mesh(stripeGeo, materials.ledGreen);
      stripe.position.set(0, 2.58, 1.85);
      gpu.add(stripe);

      return gpu;
    }

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const posX = gpuRowsX[r];
        const posZ = gpuColsZ[c];

        const slotSocket = new T.Mesh(slotSocketGeo, materials.chassisBody);
        slotSocket.position.set(posX, -2.6, posZ);
        heroTray.add(slotSocket);

        if (r === 0 && c === 2) {
          heroGpuMount = new T.Group();
          heroGpuMount.name = "HeroGpuMount_RTX4090";
          heroGpuMount.position.set(posX, -2.4, posZ);

          const mountSocketGold = new T.Mesh(
            new T.BoxGeometry(7.2, 0.2, 0.16),
            materials.goldContact
          );
          mountSocketGold.position.set(0, 0.1, 0);
          heroGpuMount.add(mountSocketGold);
          heroTray.add(heroGpuMount);
        } else {
          const compGpu = createCompanionGpu();
          compGpu.position.set(posX, -2.4, posZ);
          heroTray.add(compGpu);
        }
      }
    }

    // Animated Hero Glass Door
    heroDoorPivot = new T.Group();
    heroDoorPivot.name = "HeroDoorPivot";
    heroDoorPivot.position.set(halfD, 0, -halfW);
    rack.add(heroDoorPivot);

    const heroDoorPanel = new T.Mesh(
      new T.BoxGeometry(0.28, rackHeight - 3.2, rackWidth - 1.8),
      materials.heroGlassDoor
    );
    heroDoorPanel.position.set(0, rackHeight * 0.5, halfW - 0.2);
    heroDoorPivot.add(heroDoorPanel);

    const hFrameTop = new T.Mesh(new T.BoxGeometry(0.4, 0.8, rackWidth - 1.6), materials.doorFrame);
    hFrameTop.position.set(0, rackHeight - 1.8, halfW - 0.2);
    heroDoorPivot.add(hFrameTop);

    const hFrameBottom = new T.Mesh(new T.BoxGeometry(0.4, 0.8, rackWidth - 1.6), materials.doorFrame);
    hFrameBottom.position.set(0, 1.8, halfW - 0.2);
    heroDoorPivot.add(hFrameBottom);

    const hFrameHingeSide = new T.Mesh(new T.BoxGeometry(0.4, rackHeight - 3.0, 0.8), materials.doorFrame);
    hFrameHingeSide.position.set(0, rackHeight * 0.5, 0.4);
    heroDoorPivot.add(hFrameHingeSide);

    const hFrameLatchSide = new T.Mesh(new T.BoxGeometry(0.4, rackHeight - 3.0, 0.8), materials.doorFrame);
    hFrameLatchSide.position.set(0, rackHeight * 0.5, rackWidth - 2.0);
    heroDoorPivot.add(hFrameLatchSide);

    const heroHandle = new T.Mesh(
      new T.BoxGeometry(0.4, rackHeight * 0.45, 0.35),
      materials.doorHandle
    );
    heroHandle.position.set(0.4, rackHeight * 0.5, rackWidth - 3.0);
    heroDoorPivot.add(heroHandle);

    // O(1) Invisible Hit Proxy for instant click/hover detection
    const hitProxy = new T.Mesh(
      new T.BoxGeometry(rackDepth + 4, rackHeight, rackWidth + 2),
      new T.MeshBasicMaterial({ visible: false })
    );
    hitProxy.position.set(2, rackHeight * 0.5, 0);
    hitProxy.name = "HeroRackHitProxy";
    rack.add(hitProxy);

    heroRackObj.group = rack;
    heroRackObj.doorPivot = heroDoorPivot;
    heroRackObj.tray = heroTray;
    heroRackObj.gpuMount = heroGpuMount;
    heroRackObj.hitProxy = hitProxy;

    return rack;
  }

  // -------------------------------------------------------------------------
  // 5. Construct Left (A01–A09) & Right (B01–B09) Rack Rows
  // -------------------------------------------------------------------------

  const leftRackRowGroup = new T.Group();
  leftRackRowGroup.name = "LeftRackRow";

  const rightRackRowGroup = new T.Group();
  rightRackRowGroup.name = "RightRackRow";

  const halfRows = Math.floor(racksPerRow / 2);

  for (let i = 0; i < racksPerRow; i++) {
    const rackZ = (i - halfRows) * rackSpacingZ;
    const num = String(i + 1).padStart(2, "0");
    if (i === heroRackIndex) {
      leftRackRowGroup.add(buildHeroRack(leftTrayX, rackZ, `A${num}`));
    } else {
      leftRackRowGroup.add(buildStandardRack(leftTrayX, rackZ, true, `A${num}`));
    }
    rightRackRowGroup.add(buildStandardRack(rightTrayX, rackZ, false, `B${num}`));
  }

  roomGroup.add(leftRackRowGroup);
  roomGroup.add(rightRackRowGroup);

  // -------------------------------------------------------------------------
  // 6. Camera Presets
  // -------------------------------------------------------------------------

  const heroZ = (heroRackIndex - halfRows) * rackSpacingZ;
  const heroFrontX = leftTrayX + rackDepth * 0.5;

  const cameraPresets = {
    facility: {
      position: new T.Vector3(0, 30.0, 102.0),
      target: new T.Vector3(0, 28.0, -30.0),
      fov: 36,
      minDistance: 4,
      maxDistance: 220,
    },
    aisle: {
      position: new T.Vector3(0, 30.0, 102.0),
      target: new T.Vector3(0, 28.0, -30.0),
      fov: 36,
      minDistance: 4,
      maxDistance: 220,
    },
    rack: {
      position: new T.Vector3(-4.0, 40.0, heroZ + 20.0),
      target: new T.Vector3(heroFrontX, 37.0, heroZ),
      fov: 34,
      minDistance: 3,
      maxDistance: 120,
    },
    rackFront: {
      position: new T.Vector3(-4.0, 40.0, heroZ + 20.0),
      target: new T.Vector3(heroFrontX, 37.0, heroZ),
      fov: 34,
      minDistance: 3,
      maxDistance: 120,
    },
    blade: {
      position: new T.Vector3(-2.0, 48.0, heroZ + 14.0),
      target: new T.Vector3(trayExtendedX + 2.0, 36.0, heroZ),
      fov: 32,
      minDistance: 2,
      maxDistance: 80,
    },
    bladeSled: {
      position: new T.Vector3(-2.0, 48.0, heroZ + 14.0),
      target: new T.Vector3(trayExtendedX + 2.0, 36.0, heroZ),
      fov: 32,
      minDistance: 2,
      maxDistance: 80,
    },
    // Close hero showcase framing the lifted RTX 4090 floating cleanly in open aisle space
    gpu: {
      position: new T.Vector3(0.4, 46.2, heroZ + 18.2),
      target: new T.Vector3(0.0, 41.8, heroZ + 2.2),
      fov: 32,
      minDistance: 2.0,
      maxDistance: 65,
    },
    inspect: {
      position: new T.Vector3(0.4, 46.2, heroZ + 18.2),
      target: new T.Vector3(0.0, 41.8, heroZ + 2.2),
      fov: 32,
      minDistance: 2.0,
      maxDistance: 65,
    },
    bladeTopDown: {
      position: new T.Vector3(trayExtendedX, 64.0, heroZ),
      target: new T.Vector3(trayExtendedX, 36.0, heroZ),
      fov: 35,
      minDistance: 2,
      maxDistance: 90,
    },
    flythrough: {
      position: new T.Vector3(8.0, 48.0, 112.0),
      target: new T.Vector3(-6.0, 30.0, -55.0),
      fov: 40,
      minDistance: 4,
      maxDistance: 240,
    },
  };

  // -------------------------------------------------------------------------
  // 7. Public Methods & Animation Loop
  // -------------------------------------------------------------------------

  function openHeroDoor(factor, immediate = false) {
    targetDoorFactor = Math.max(0.0, Math.min(1.0, factor));
    if (immediate) {
      currentDoorFactor = targetDoorFactor;
      if (heroDoorPivot) {
        heroDoorPivot.rotation.y = currentDoorFactor * maxDoorAngle;
      }
    }
  }

  function extendHeroTray(factor, immediate = false) {
    targetTrayFactor = Math.max(0.0, Math.min(1.0, factor));
    if (immediate) {
      currentTrayFactor = targetTrayFactor;
      if (heroTray) {
        heroTray.position.x = currentTrayFactor * trayMaxTravel;
      }
      if (intermediateRailLeft && intermediateRailRight) {
        const interTravel = currentTrayFactor * (trayMaxTravel * 0.5);
        intermediateRailLeft.position.x = interTravel;
        intermediateRailRight.position.x = interTravel;
      }
    }
  }

  function getHeroGpuMount() {
    return {
      group: heroGpuMount,
      position: heroGpuMount ? heroGpuMount.position : new T.Vector3(),
      rotation: heroGpuMount ? heroGpuMount.rotation : new T.Euler(),
      getWorldPosition: (target = new T.Vector3()) =>
        heroGpuMount ? heroGpuMount.getWorldPosition(target) : target,
      getWorldQuaternion: (target = new T.Quaternion()) =>
        heroGpuMount ? heroGpuMount.getWorldQuaternion(target) : target,
    };
  }

  function getCameraPreset(name) {
    const key = String(name || "facility").toLowerCase();
    if (key.includes("fac") || key.includes("aisle") || key.includes("default")) {
      return cameraPresets.facility;
    }
    if (key.includes("top")) return cameraPresets.bladeTopDown;
    if (key.includes("blade") || key.includes("tray") || key.includes("sled")) {
      return cameraPresets.blade;
    }
    if (key.includes("gpu") || key.includes("inspect")) return cameraPresets.gpu;
    if (key.includes("rack")) return cameraPresets.rack;
    if (key.includes("fly")) return cameraPresets.flythrough;
    return cameraPresets[name] || cameraPresets.facility;
  }

  function update(delta) {
    const dt = Math.min(delta || 0.016, 0.05);
    const lerpSpeed = 1.0 - Math.exp(-dt * 7.5);

    if (Math.abs(targetDoorFactor - currentDoorFactor) > 0.0005) {
      currentDoorFactor += (targetDoorFactor - currentDoorFactor) * lerpSpeed;
      if (heroDoorPivot) {
        heroDoorPivot.rotation.y = currentDoorFactor * maxDoorAngle;
      }
    }

    if (Math.abs(targetTrayFactor - currentTrayFactor) > 0.0005) {
      currentTrayFactor += (targetTrayFactor - currentTrayFactor) * lerpSpeed;
      if (heroTray) {
        heroTray.position.x = currentTrayFactor * trayMaxTravel;
      }
      if (intermediateRailLeft && intermediateRailRight) {
        const interTravel = currentTrayFactor * (trayMaxTravel * 0.5);
        intermediateRailLeft.position.x = interTravel;
        intermediateRailRight.position.x = interTravel;
      }
    }

    const fanStep = dt * 32.0;
    for (let f = 0; f < animatedFans.length; f++) {
      animatedFans[f].group.rotation.x += fanStep * animatedFans[f].direction;
    }
  }

  function dispose() {
    roomGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    if (scene) scene.remove(roomGroup);
  }

  return {
    group: roomGroup,
    heroRack: heroRackObj,
    heroTray,
    heroGpuMount,
    lights: [],
    cameraPresets,
    openHeroDoor,
    extendHeroTray,
    getHeroDoorFactor: () => currentDoorFactor,
    getHeroTrayFactor: () => currentTrayFactor,
    getHeroGpuMount,
    getCameraPreset,
    update,
    dispose,
  };
}

export default createServerRoom;
