/**
 * serverRoom.js — High-Fidelity Procedural Datacenter Server Room for Three.js
 * 
 * Features:
 * - Two opposing rows of 42U server racks (9 per row = 18 total) lining a central polished corridor.
 * - High-gloss reflective raised tile floor with procedural canvas textures and specular roughness.
 * - Dual overhead cable ladders with yellow power conduits and blue/cyan fiber optic bundles.
 * - Suspended linear LED aisle light fixtures emitting cool white/cyan illumination.
 * - Blue neon cove lighting running along floor kickplates and ceiling perimeters.
 * - Industrial back and front containment walls with air ventilation louvers and glowing facility signage.
 * - Designated Hero Rack (Left Aisle Rack 04):
 *   * Front tinted glass door with animated pivot hinge (0° to 95°).
 *   * 4U GPU Compute Node chassis with telescoping 3-stage steel slide rails.
 *   * Slide-out tray ('heroTray') extending forward into the aisle walkway.
 *   * 8x GPU compute blade layout with 7 stylized GPU nodes and 1 dedicated mount for the hero RTX 4090 card.
 *   * Front cooling fan bank with rotating counter-rotating impeller blades.
 * - Optimized 60 FPS performance via shared geometries, shared materials, and animated activity LEDs.
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js";

// ---------------------------------------------------------------------------
// Procedural Canvas Texture Generators
// ---------------------------------------------------------------------------

/**
 * Procedural Raised Access Floor Tile Texture (600mm Datacenter Tiles - Bright Cleanroom)
 */
function createFloorCanvasTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Base bright cleanroom white / light silver
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 1024, 1024);

  // Subtle cleanroom epoxy speckle
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 6;
    data[i] = Math.max(235, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(238, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(242, Math.min(255, data[i + 2] + noise + 2)); // ultra-clean cool white
  }
  ctx.putImageData(imgData, 0, 0);

  // 2x2 raised floor tile grid - crisp clean seams
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 1024, 1024);
  ctx.beginPath();
  ctx.moveTo(512, 0);
  ctx.lineTo(512, 1024);
  ctx.moveTo(0, 512);
  ctx.lineTo(1024, 512);
  ctx.stroke();

  // Subtle inner tile bevel highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 504, 504);
  ctx.strokeRect(516, 4, 504, 504);
  ctx.strokeRect(4, 516, 504, 504);
  ctx.strokeRect(516, 516, 504, 504);

  // Raised tile corner screw discs / suction lifter sockets
  const corners = [
    [28, 28], [494, 28], [28, 494], [494, 494],
    [540, 28], [996, 28], [540, 494], [996, 494],
    [28, 540], [494, 540], [28, 996], [494, 996],
    [540, 540], [996, 540], [540, 996], [996, 996]
  ];

  for (let c = 0; c < corners.length; c++) {
    const [cx, cy] = corners[c];
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Screw center slot
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy);
    ctx.lineTo(cx + 3, cy);
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = T.RepeatWrapping;
  texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(10, 26);
  return texture;
}

/**
 * Procedural Floor Roughness Map (mirror-gloss reflective white floor)
 */
function createFloorRoughnessCanvasTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Tile body is ultra-glossy (dark = low roughness = mirror specular reflection)
  ctx.fillStyle = "#1e1e1e"; // ~0.11 roughness
  ctx.fillRect(0, 0, 512, 512);

  // Tile seams have slightly higher roughness
  ctx.strokeStyle = "#555555";
  ctx.lineWidth = 5;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = T.RepeatWrapping;
  texture.wrapT = T.RepeatWrapping;
  texture.repeat.set(10, 26);
  return texture;
}

/**
 * Procedural Facility Wall Sign Texture (Clean Light Theme)
 */
function createSignCanvasTexture(T, title, subtitle) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Background clean architectural acrylic
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 1024, 256);

  // Border with glowing cyan accent
  ctx.strokeStyle = "#0284c7";
  ctx.lineWidth = 5;
  ctx.strokeRect(8, 8, 1008, 240);

  // NVIDIA Green Accent Bar on Left
  ctx.fillStyle = "#76b900";
  ctx.fillRect(16, 16, 18, 224);

  // Title Text
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(title, 56, 92);

  // Subtitle / Telemetry Text
  ctx.fillStyle = "#0284c7";
  ctx.font = "600 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(subtitle, 56, 150);

  // Status Indicator Dot & Label
  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  ctx.arc(60, 200, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#475569";
  ctx.font = "600 20px monospace";
  ctx.fillText("FACILITY ONLINE • 512 COMPUTE BLADES ACTIVE • 100% HEALTH", 80, 206);

  const texture = new T.CanvasTexture(canvas);
  return texture;
}

// ---------------------------------------------------------------------------
// Shared Materials & Palette Factory
// ---------------------------------------------------------------------------

function createSharedMaterials(T) {
  const floorTexture = createFloorCanvasTexture(T);
  const floorRoughness = createFloorRoughnessCanvasTexture(T);

  return {
    // Architectural - Bright Cleanroom Surfaces
    floor: new T.MeshStandardMaterial({
      color: 0xffffff,
      map: floorTexture || undefined,
      roughnessMap: floorRoughness || undefined,
      roughness: 0.12,
      metalness: 0.08,
      envMapIntensity: 2.2
    }),

    ceiling: new T.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.45,
      metalness: 0.1
    }),

    wall: new T.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.5,
      metalness: 0.2
    }),

    louver: new T.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.85
    }),

    // Server Racks - Modern Anodized Aluminum Frames with Crystal-Clear Glass Doors
    rackFrame: new T.MeshStandardMaterial({
      color: 0x242a36,
      roughness: 0.45,
      metalness: 0.65
    }),

    rackPanel: new T.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.7
    }),

    rackRail: new T.MeshStandardMaterial({
      color: 0xd1d5db,
      roughness: 0.25,
      metalness: 0.95
    }),

    // High Transparency Glass Doors so servers and glowing LEDs are clearly visible from outside
    glassDoor: new T.MeshPhysicalMaterial({
      color: 0xa5f3fc,
      transparent: true,
      opacity: 0.24,
      roughness: 0.04,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 0.98
    }),

    heroGlassDoor: new T.MeshPhysicalMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.22,
      roughness: 0.03,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
      reflectivity: 0.98
    }),

    doorFrame: new T.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.35,
      metalness: 0.85
    }),

    doorHandle: new T.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.15,
      metalness: 0.98
    }),

    // Server Chassis & Blades - Bright Brushed Aluminum Faceplates & Metallic Rails
    chassisBody: new T.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.4,
      metalness: 0.7
    }),

    chassisFace: new T.MeshStandardMaterial({
      color: 0xd8e0ec,
      roughness: 0.28,
      metalness: 0.75
    }),

    ventMesh: new T.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.3
    }),

    pcb: new T.MeshStandardMaterial({
      color: 0x0f4024, // vibrant enterprise server green PCB
      roughness: 0.35,
      metalness: 0.3
    }),

    heatsinkFin: new T.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.22,
      metalness: 0.92
    }),

    copperPipe: new T.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9
    }),

    goldContact: new T.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.2,
      metalness: 0.98
    }),

    steelRail: new T.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.12,
      metalness: 0.98
    }),

    fanHub: new T.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.6
    }),

    fanBlade: new T.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.3,
      metalness: 0.5
    }),

    // Emissive Lighting & Indicators - High-Vibrancy Status LEDs
    ledBlue: new T.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 3.2,
      toneMapped: false
    }),

    ledCyan: new T.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 3.4,
      toneMapped: false
    }),

    ledGreen: new T.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 3.0,
      toneMapped: false
    }),

    ledAmber: new T.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 2.8,
      toneMapped: false
    }),

    coveBlue: new T.MeshStandardMaterial({
      color: 0x00b4d8,
      emissive: 0x00b4d8,
      emissiveIntensity: 3.2,
      toneMapped: false
    }),

    coveCeiling: new T.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 2.6,
      toneMapped: false
    }),

    overheadLinearLight: new T.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 3.5,
      toneMapped: false
    }),

    // Cable Management - Bright Galvanized Trays & Vivid Bundles
    cableTray: new T.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.35,
      metalness: 0.85
    }),

    cableYellow: new T.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.35,
      metalness: 0.2
    }),

    cableBlue: new T.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.35,
      metalness: 0.2
    }),

    cableCyan: new T.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.35,
      metalness: 0.2
    })
  };
}

// ---------------------------------------------------------------------------
// Server Room Procedural Construction
// ---------------------------------------------------------------------------

export function createServerRoom(scene, options = {}) {
  const T = options.THREE || THREE;
  const materials = createSharedMaterials(T);

  // Configuration
  const racksPerRow = options.racksPerRow || 9;
  const rackSpacingZ = 28.0;
  const aisleWidth = options.aisleWidth || 36.0;
  const rackDepth = 26.0;
  const rackWidth = 24.0;
  const rackHeight = 78.0;
  const roomLength = 320.0;
  const roomWidth = 140.0;
  const roomHeight = 92.0;

  // The hero rack index (0 to racksPerRow - 1)
  // Index 3 corresponds to Left Aisle Rack 04
  const heroRackIndex = options.heroRackIndex !== undefined ? options.heroRackIndex : 3;

  // Root Room Group
  const roomGroup = new T.Group();
  roomGroup.name = "DatacenterServerRoom";
  if (scene) {
    scene.add(roomGroup);
  }

  // Animation Tracking References
  const animatedFans = [];
  const blinkingLeds = [];
  let heroDoorPivot = null;
  let heroTray = null;
  let heroGpuMount = null;
  let intermediateRailLeft = null;
  let intermediateRailRight = null;
  const heroRackObj = {};

  // Interactive Target States
  let targetDoorFactor = 0.0;
  let currentDoorFactor = 0.0;
  let targetTrayFactor = 0.0;
  let currentTrayFactor = 0.0;

  const maxDoorAngle = -Math.PI * 0.53; // ~95 degrees open outward
  const trayRetractedX = -30.75;
  const trayMaxTravel = 19.0;
  const trayExtendedX = trayRetractedX + trayMaxTravel; // -11.75
  const intermediateRailBaseX = -30.0;

  // -------------------------------------------------------------------------
  // 1. Architecture: Floor, Ceiling, Cove Lighting, End Walls
  // -------------------------------------------------------------------------

  // Polished Raised Access Tile Floor
  const floorGeo = new T.PlaneGeometry(roomWidth, roomLength, 1, 1);
  const floorMesh = new T.Mesh(floorGeo, materials.floor);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  roomGroup.add(floorMesh);

  // Blue Neon Cove Lighting Strips along Floor Kickplates
  const coveFloorGeo = new T.BoxGeometry(0.35, 0.16, roomLength - 40);

  // Left floor cove strip
  const coveFloorLeft = new T.Mesh(coveFloorGeo, materials.coveBlue);
  coveFloorLeft.position.set(-(aisleWidth * 0.5) + 0.2, 0.08, 0);
  roomGroup.add(coveFloorLeft);

  // Right floor cove strip
  const coveFloorRight = new T.Mesh(coveFloorGeo, materials.coveBlue);
  coveFloorRight.position.set(aisleWidth * 0.5 - 0.2, 0.08, 0);
  roomGroup.add(coveFloorRight);

  // Ceiling
  const ceilingGeo = new T.PlaneGeometry(roomWidth, roomLength, 1, 1);
  const ceilingMesh = new T.Mesh(ceilingGeo, materials.ceiling);
  ceilingMesh.rotation.x = Math.PI / 2;
  ceilingMesh.position.y = roomHeight;
  roomGroup.add(ceilingMesh);

  // Ceiling Perimeter Blue Cove Strips
  const coveCeilingGeo = new T.BoxGeometry(0.4, 0.2, roomLength - 30);
  const coveCeilLeft = new T.Mesh(coveCeilingGeo, materials.coveCeiling);
  coveCeilLeft.position.set(-46, roomHeight - 0.5, 0);
  roomGroup.add(coveCeilLeft);

  const coveCeilRight = new T.Mesh(coveCeilingGeo, materials.coveCeiling);
  coveCeilRight.position.set(46, roomHeight - 0.5, 0);
  roomGroup.add(coveCeilRight);

  // Overhead Linear LED Light Fixtures (suspended down the aisle ceiling)
  const linearLightFixtureGeo = new T.BoxGeometry(0.9, 0.35, roomLength - 50);
  const linearLightLeft = new T.Mesh(linearLightFixtureGeo, materials.overheadLinearLight);
  linearLightLeft.position.set(-5.5, roomHeight - 4.5, 0);
  roomGroup.add(linearLightLeft);

  const linearLightRight = new T.Mesh(linearLightFixtureGeo, materials.overheadLinearLight);
  linearLightRight.position.set(5.5, roomHeight - 4.5, 0);
  roomGroup.add(linearLightRight);

  // Suspension Hanger Rods for Overhead Fixtures
  const hangerGeo = new T.CylinderGeometry(0.04, 0.04, 4.5, 6);
  for (let hz = -120; hz <= 120; hz += 40) {
    const rodL = new T.Mesh(hangerGeo, materials.rackRail);
    rodL.position.set(-5.5, roomHeight - 2.25, hz);
    roomGroup.add(rodL);

    const rodR = new T.Mesh(hangerGeo, materials.rackRail);
    rodR.position.set(5.5, roomHeight - 2.25, hz);
    roomGroup.add(rodR);
  }

  // End Walls & Back Wall Louvers
  const endWallGeo = new T.PlaneGeometry(roomWidth, roomHeight);

  // Back Wall (Z = -roomLength / 2)
  const backWall = new T.Mesh(endWallGeo, materials.wall);
  backWall.position.set(0, roomHeight / 2, -roomLength / 2);
  roomGroup.add(backWall);

  // Front Wall (Z = +roomLength / 2)
  const frontWall = new T.Mesh(endWallGeo, materials.wall);
  frontWall.rotation.y = Math.PI;
  frontWall.position.set(0, roomHeight / 2, roomLength / 2);
  roomGroup.add(frontWall);

  // Industrial Air Return Louvers on Back Wall
  const louverWidth = 32.0;
  const louverHeight = 0.5;
  const louverGeo = new T.BoxGeometry(louverWidth, louverHeight, 0.1);
  for (let lz = 0; lz < 18; lz++) {
    const louver = new T.Mesh(louverGeo, materials.louver);
    louver.rotation.x = 0.35; // angled slat
    louver.position.set(0, 16.0 + lz * 1.8, -roomLength / 2 + 0.6);
    roomGroup.add(louver);
  }

  // Glowing Facility Signage over Back Wall Louvers
  const signTexture = createSignCanvasTexture(
    T,
    "NVIDIA DGX SuperPOD™ Facility",
    "SUPERCLUSTER CLOUD POD-A • AISLE 04"
  );
  if (signTexture) {
    const signMat = new T.MeshStandardMaterial({
      map: signTexture,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0xffffff,
      emissiveMap: signTexture,
      emissiveIntensity: 0.75
    });
    const signMesh = new T.Mesh(new T.PlaneGeometry(42, 10.5), signMat);
    signMesh.position.set(0, 56.0, -roomLength / 2 + 0.8);
    roomGroup.add(signMesh);
  }

  // Side Containment Walls behind Racks
  const sideWallGeo = new T.PlaneGeometry(roomLength, roomHeight);
  const leftSideWall = new T.Mesh(sideWallGeo, materials.wall);
  leftSideWall.rotation.y = Math.PI / 2;
  leftSideWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
  roomGroup.add(leftSideWall);

  const rightSideWall = new T.Mesh(sideWallGeo, materials.wall);
  rightSideWall.rotation.y = -Math.PI / 2;
  rightSideWall.position.set(roomWidth / 2, roomHeight / 2, 0);
  roomGroup.add(rightSideWall);

  // -------------------------------------------------------------------------
  // 2. Overhead Cable Ladders & Fiber Bundles
  // -------------------------------------------------------------------------

  const trayY = rackHeight + 4.0; // Y = 82
  const leftTrayX = -(aisleWidth * 0.5 + rackDepth * 0.5); // -31
  const rightTrayX = (aisleWidth * 0.5 + rackDepth * 0.5); // +31

  function buildCableTrayLadder(xPos) {
    const ladderGroup = new T.Group();

    // Side Rails
    const sideRailGeo = new T.BoxGeometry(0.3, 0.8, roomLength - 40);
    const rail1 = new T.Mesh(sideRailGeo, materials.cableTray);
    rail1.position.set(xPos - 5.5, trayY, 0);
    ladderGroup.add(rail1);

    const rail2 = new T.Mesh(sideRailGeo, materials.cableTray);
    rail2.position.set(xPos + 5.5, trayY, 0);
    ladderGroup.add(rail2);

    // Cross Rungs
    const rungGeo = new T.BoxGeometry(11.0, 0.2, 0.4);
    for (let rz = -120; rz <= 120; rz += 8) {
      const rung = new T.Mesh(rungGeo, materials.cableTray);
      rung.position.set(xPos, trayY - 0.3, rz);
      ladderGroup.add(rung);
    }

    // Yellow Power Cables Bundle
    const yellowCableGeo = new T.CylinderGeometry(0.42, 0.42, roomLength - 50, 8);
    const yellowCable1 = new T.Mesh(yellowCableGeo, materials.cableYellow);
    yellowCable1.rotation.x = Math.PI / 2;
    yellowCable1.position.set(xPos - 3.2, trayY + 0.4, 0);
    ladderGroup.add(yellowCable1);

    const yellowCable2 = new T.Mesh(yellowCableGeo, materials.cableYellow);
    yellowCable2.rotation.x = Math.PI / 2;
    yellowCable2.position.set(xPos - 2.2, trayY + 0.4, 0);
    ladderGroup.add(yellowCable2);

    // Blue 400G InfiniBand Twinax Bundles
    const blueCableGeo = new T.CylinderGeometry(0.36, 0.36, roomLength - 50, 8);
    const blueCable1 = new T.Mesh(blueCableGeo, materials.cableBlue);
    blueCable1.rotation.x = Math.PI / 2;
    blueCable1.position.set(xPos + 0.2, trayY + 0.35, 0);
    ladderGroup.add(blueCable1);

    const blueCable2 = new T.Mesh(blueCableGeo, materials.cableBlue);
    blueCable2.rotation.x = Math.PI / 2;
    blueCable2.position.set(xPos + 1.2, trayY + 0.35, 0);
    ladderGroup.add(blueCable2);

    // Cyan Optical Fiber Trunk Bundle
    const cyanCableGeo = new T.CylinderGeometry(0.28, 0.28, roomLength - 50, 8);
    const cyanCable1 = new T.Mesh(cyanCableGeo, materials.cableCyan);
    cyanCable1.rotation.x = Math.PI / 2;
    cyanCable1.position.set(xPos + 3.2, trayY + 0.3, 0);
    ladderGroup.add(cyanCable1);

    return ladderGroup;
  }

  roomGroup.add(buildCableTrayLadder(leftTrayX));
  roomGroup.add(buildCableTrayLadder(rightTrayX));

  // Cross-Aisle Cable Bridges (connecting left and right overhead trays)
  const bridgeZPositions = [-84, 0, 84];
  const bridgeSpan = Math.abs(rightTrayX - leftTrayX);
  const bridgeRailGeo = new T.BoxGeometry(bridgeSpan, 0.6, 0.3);
  const bridgeRungGeo = new T.BoxGeometry(0.3, 0.18, 9.0);

  for (let b = 0; b < bridgeZPositions.length; b++) {
    const bz = bridgeZPositions[b];
    const bridgeGroup = new T.Group();

    const bRail1 = new T.Mesh(bridgeRailGeo, materials.cableTray);
    bRail1.position.set(0, trayY + 1.2, bz - 4.5);
    bridgeGroup.add(bRail1);

    const bRail2 = new T.Mesh(bridgeRailGeo, materials.cableTray);
    bRail2.position.set(0, trayY + 1.2, bz + 4.5);
    bridgeGroup.add(bRail2);

    for (let rx = -24; rx <= 24; rx += 6) {
      const bRung = new T.Mesh(bridgeRungGeo, materials.cableTray);
      bRung.position.set(rx, trayY + 1.0, bz);
      bridgeGroup.add(bRung);
    }

    roomGroup.add(bridgeGroup);
  }

  // -------------------------------------------------------------------------
  // 3. Shared Server Rack Components & Geometries
  // -------------------------------------------------------------------------

  // Pre-created reusable box geometries for maximum GPU memory efficiency
  const postGeo = new T.BoxGeometry(1.2, rackHeight, 1.2);
  const topCapGeo = new T.BoxGeometry(rackDepth, 1.4, rackWidth);
  const sidePanelGeo = new T.BoxGeometry(rackDepth - 1.2, rackHeight - 2.0, 0.4);
  const eiaRailGeo = new T.BoxGeometry(0.6, rackHeight - 4.0, 0.6);

  // Server Chassis Geometries
  const chassis1UGeo = new T.BoxGeometry(rackDepth - 3.0, 1.6, rackWidth - 2.4);
  const chassis2UGeo = new T.BoxGeometry(rackDepth - 3.0, 3.4, rackWidth - 2.4);
  const chassis4UGeo = new T.BoxGeometry(rackDepth - 3.0, 7.0, rackWidth - 2.4);

  // Front Panel Bezel Geometries
  const bezel2UGeo = new T.BoxGeometry(0.5, 3.2, rackWidth - 2.8);
  const bezel4UGeo = new T.BoxGeometry(0.5, 6.8, rackWidth - 2.8);
  const ventSlotGeo = new T.BoxGeometry(0.52, 0.28, rackWidth - 5.0);
  const ledDotGeo = new T.BoxGeometry(0.12, 0.16, 0.2);

  /**
   * Builds a standard non-hero 42U Server Rack
   */
  function buildStandardRack(rackX, rackZ, isLeft) {
    const rack = new T.Group();
    rack.position.set(rackX, 0, rackZ);

    // Orientation: Left racks face +X (corridor center), Right racks face -X
    const facingSign = isLeft ? 1 : -1;
    rack.rotation.y = isLeft ? 0 : Math.PI;

    // Corner Posts
    const halfD = rackDepth * 0.5 - 0.6;
    const halfW = rackWidth * 0.5 - 0.6;
    const postPositions = [
      [-halfD, rackHeight * 0.5, -halfW],
      [halfD, rackHeight * 0.5, -halfW],
      [-halfD, rackHeight * 0.5, halfW],
      [halfD, rackHeight * 0.5, halfW]
    ];

    for (let p = 0; p < postPositions.length; p++) {
      const post = new T.Mesh(postGeo, materials.rackFrame);
      post.position.set(...postPositions[p]);
      rack.add(post);
    }

    // Top Cap & Base Kickplate
    const topCap = new T.Mesh(topCapGeo, materials.rackFrame);
    topCap.position.set(0, rackHeight - 0.7, 0);
    rack.add(topCap);

    const baseCap = new T.Mesh(topCapGeo, materials.rackFrame);
    baseCap.position.set(0, 0.7, 0);
    rack.add(baseCap);

    // Side Panels
    const side1 = new T.Mesh(sidePanelGeo, materials.rackPanel);
    side1.position.set(0, rackHeight * 0.5, -halfW);
    rack.add(side1);

    const side2 = new T.Mesh(sidePanelGeo, materials.rackPanel);
    side2.position.set(0, rackHeight * 0.5, halfW);
    rack.add(side2);

    // Back Panel
    const backPanelGeo = new T.BoxGeometry(0.4, rackHeight - 2.0, rackWidth - 1.2);
    const backPanel = new T.Mesh(backPanelGeo, materials.rackPanel);
    backPanel.position.set(-halfD, rackHeight * 0.5, 0);
    rack.add(backPanel);

    // Front Tinted Glass Door (Closed for standard racks)
    const doorGeo = new T.BoxGeometry(0.3, rackHeight - 3.0, rackWidth - 1.8);
    const door = new T.Mesh(doorGeo, materials.glassDoor);
    door.position.set(halfD, rackHeight * 0.5, 0);
    rack.add(door);

    // Door Frame Trim
    const doorFrameGeo = new T.BoxGeometry(0.4, rackHeight - 2.8, 0.6);
    const dfLeft = new T.Mesh(doorFrameGeo, materials.doorFrame);
    dfLeft.position.set(halfD, rackHeight * 0.5, -halfW + 0.6);
    rack.add(dfLeft);

    const dfRight = new T.Mesh(doorFrameGeo, materials.doorFrame);
    dfRight.position.set(halfD, rackHeight * 0.5, halfW - 0.6);
    rack.add(dfRight);

    // Internal EIA 19" Vertical Rails
    const frontRail1 = new T.Mesh(eiaRailGeo, materials.rackRail);
    frontRail1.position.set(halfD - 1.2, rackHeight * 0.5, -9.5);
    rack.add(frontRail1);

    const frontRail2 = new T.Mesh(eiaRailGeo, materials.rackRail);
    frontRail2.position.set(halfD - 1.2, rackHeight * 0.5, 9.5);
    rack.add(frontRail2);

    // Stacked Server Nodes filling the 42U Rack
    let currentY = 3.0;
    while (currentY < rackHeight - 6.0) {
      const is4U = (currentY % 14.0 < 7.0);
      const nodeH = is4U ? 6.8 : 3.2;
      const chassisGeo = is4U ? chassis4UGeo : chassis2UGeo;
      const bezelGeo = is4U ? bezel4UGeo : bezel2UGeo;

      const chassis = new T.Mesh(chassisGeo, materials.chassisBody);
      chassis.position.set(0, currentY + nodeH * 0.5, 0);
      rack.add(chassis);

      const bezel = new T.Mesh(bezelGeo, materials.chassisFace);
      bezel.position.set(halfD - 1.0, currentY + nodeH * 0.5, 0);
      rack.add(bezel);

      // Vent Slots on Bezel
      const ventCount = is4U ? 4 : 2;
      for (let v = 0; v < ventCount; v++) {
        const vent = new T.Mesh(ventSlotGeo, materials.ventMesh);
        vent.position.set(halfD - 0.74, currentY + 0.9 + v * 1.4, 0);
        rack.add(vent);
      }

      // Blinking Status LEDs (Blue, Cyan, Green, Amber)
      const ledColors = [materials.ledBlue, materials.ledCyan, materials.ledGreen, materials.ledAmber];
      for (let ledIdx = 0; ledIdx < 4; ledIdx++) {
        const led = new T.Mesh(ledDotGeo, ledColors[ledIdx % 4]);
        led.position.set(halfD - 0.72, currentY + nodeH * 0.5, -8.0 + ledIdx * 1.2);
        rack.add(led);
        blinkingLeds.push({ mesh: led, phase: Math.random() * Math.PI * 2, speed: 2.0 + Math.random() * 8.0 });
      }

      currentY += nodeH + 0.4;
    }

    return rack;
  }

  // -------------------------------------------------------------------------
  // 4. The Hero Rack (Left Aisle Rack 04)
  // -------------------------------------------------------------------------

  /**
   * Builds the fully articulated Hero Rack with animated pivot door,
   * slide-out 4U GPU compute tray, and 8-GPU blade layout.
   */
  function buildHeroRack(rackX, rackZ) {
    const rack = new T.Group();
    rack.name = "HeroRack_L04";
    rack.position.set(rackX, 0, rackZ);

    const halfD = rackDepth * 0.5 - 0.6; // 12.4
    const halfW = rackWidth * 0.5 - 0.6; // 11.4

    // Corner Posts
    const postPositions = [
      [-halfD, rackHeight * 0.5, -halfW],
      [halfD, rackHeight * 0.5, -halfW],
      [-halfD, rackHeight * 0.5, halfW],
      [halfD, rackHeight * 0.5, halfW]
    ];
    for (let p = 0; p < postPositions.length; p++) {
      const post = new T.Mesh(postGeo, materials.rackFrame);
      post.position.set(...postPositions[p]);
      rack.add(post);
    }

    // Top Cap & Base Kickplate
    const topCap = new T.Mesh(topCapGeo, materials.rackFrame);
    topCap.position.set(0, rackHeight - 0.7, 0);
    rack.add(topCap);

    const baseCap = new T.Mesh(topCapGeo, materials.rackFrame);
    baseCap.position.set(0, 0.7, 0);
    rack.add(baseCap);

    // Side Panels
    const side1 = new T.Mesh(sidePanelGeo, materials.rackPanel);
    side1.position.set(0, rackHeight * 0.5, -halfW);
    rack.add(side1);

    const side2 = new T.Mesh(sidePanelGeo, materials.rackPanel);
    side2.position.set(0, rackHeight * 0.5, halfW);
    rack.add(side2);

    // Back Panel
    const backPanelGeo = new T.BoxGeometry(0.4, rackHeight - 2.0, rackWidth - 1.2);
    const backPanel = new T.Mesh(backPanelGeo, materials.rackPanel);
    backPanel.position.set(-halfD, rackHeight * 0.5, 0);
    rack.add(backPanel);

    // Internal EIA 19" Mounting Rails
    const frontRail1 = new T.Mesh(eiaRailGeo, materials.rackRail);
    frontRail1.position.set(halfD - 1.2, rackHeight * 0.5, -9.5);
    rack.add(frontRail1);

    const frontRail2 = new T.Mesh(eiaRailGeo, materials.rackRail);
    frontRail2.position.set(halfD - 1.2, rackHeight * 0.5, 9.5);
    rack.add(frontRail2);

    // Non-Hero Chassis units above and below the 4U Hero Tray
    // Chest height for 4U Hero Tray: Y = 33.0 to 40.2 (center Y = 36.6)
    const heroSlotBottom = 33.0;
    const heroSlotTop = 40.2;

    // Populate Lower Chassis (Y = 3.0 to 33.0)
    let yCursor = 3.0;
    while (yCursor < heroSlotBottom - 2.0) {
      const is4U = (yCursor % 10.0 < 5.0);
      const nodeH = is4U ? 6.8 : 3.2;
      const chassis = new T.Mesh(is4U ? chassis4UGeo : chassis2UGeo, materials.chassisBody);
      chassis.position.set(0, yCursor + nodeH * 0.5, 0);
      rack.add(chassis);

      const bezel = new T.Mesh(is4U ? bezel4UGeo : bezel2UGeo, materials.chassisFace);
      bezel.position.set(halfD - 1.0, yCursor + nodeH * 0.5, 0);
      rack.add(bezel);

      for (let ledIdx = 0; ledIdx < 4; ledIdx++) {
        const led = new T.Mesh(ledDotGeo, [materials.ledBlue, materials.ledCyan, materials.ledGreen, materials.ledAmber][ledIdx]);
        led.position.set(halfD - 0.72, yCursor + nodeH * 0.5, -8.0 + ledIdx * 1.2);
        rack.add(led);
        blinkingLeds.push({ mesh: led, phase: Math.random() * Math.PI * 2, speed: 3.0 + Math.random() * 6.0 });
      }

      yCursor += nodeH + 0.4;
    }

    // Populate Upper Chassis & Quantum-2 InfiniBand Switches (Y = 40.2 to 74.0)
    yCursor = heroSlotTop + 0.6;
    while (yCursor < rackHeight - 6.0) {
      const is4U = (yCursor > 56.0);
      const nodeH = is4U ? 6.8 : 3.2;
      const chassis = new T.Mesh(is4U ? chassis4UGeo : chassis2UGeo, materials.chassisBody);
      chassis.position.set(0, yCursor + nodeH * 0.5, 0);
      rack.add(chassis);

      const bezel = new T.Mesh(is4U ? bezel4UGeo : bezel2UGeo, materials.chassisFace);
      bezel.position.set(halfD - 1.0, yCursor + nodeH * 0.5, 0);
      rack.add(bezel);

      for (let ledIdx = 0; ledIdx < 4; ledIdx++) {
        const led = new T.Mesh(ledDotGeo, [materials.ledGreen, materials.ledCyan, materials.ledBlue, materials.ledAmber][ledIdx]);
        led.position.set(halfD - 0.72, yCursor + nodeH * 0.5, -8.0 + ledIdx * 1.2);
        rack.add(led);
        blinkingLeds.push({ mesh: led, phase: Math.random() * Math.PI * 2, speed: 2.0 + Math.random() * 8.0 });
      }

      yCursor += nodeH + 0.4;
    }

    // Fixed Outer Chassis Enclosure for 4U Hero Node
    const heroOuterShellGeo = new T.BoxGeometry(rackDepth - 2.5, 7.2, rackWidth - 2.2);
    const heroOuterShell = new T.Mesh(heroOuterShellGeo, materials.chassisBody);
    heroOuterShell.position.set(0, 36.6, 0);
    rack.add(heroOuterShell);

    // Telescoping Fixed Slide Rails (mounted to outer chassis)
    const fixedRailGeo = new T.BoxGeometry(rackDepth - 3.0, 0.45, 0.35);
    const fixedRailLeft = new T.Mesh(fixedRailGeo, materials.steelRail);
    fixedRailLeft.position.set(0, 36.6, -10.2);
    rack.add(fixedRailLeft);

    const fixedRailRight = new T.Mesh(fixedRailGeo, materials.steelRail);
    fixedRailRight.position.set(0, 36.6, 10.2);
    rack.add(fixedRailRight);

    // Telescoping Intermediate Slide Rails (travels halfway)
    const interRailGeo = new T.BoxGeometry(rackDepth - 4.0, 0.35, 0.25);
    intermediateRailLeft = new T.Mesh(interRailGeo, materials.steelRail);
    intermediateRailLeft.position.set(0, 36.6, -10.0);
    rack.add(intermediateRailLeft);

    intermediateRailRight = new T.Mesh(interRailGeo, materials.steelRail);
    intermediateRailRight.position.set(0, 36.6, 10.0);
    rack.add(intermediateRailRight);

    // -----------------------------------------------------------------------
    // The Hero Tray (Slide-out 4U GPU Compute Node)
    // -----------------------------------------------------------------------
    heroTray = new T.Group();
    heroTray.name = "HeroComputeTray_4U";
    // Default retracted position inside rack
    heroTray.position.set(0, 36.6, 0);
    rack.add(heroTray);

    // Tray Bottom Plate
    const trayBedGeo = new T.BoxGeometry(22.0, 0.35, 19.8);
    const trayBed = new T.Mesh(trayBedGeo, materials.chassisFace);
    trayBed.position.set(0, -3.2, 0);
    heroTray.add(trayBed);

    // Tray Side Rail Guides
    const traySideGeo = new T.BoxGeometry(22.0, 1.8, 0.3);
    const traySideL = new T.Mesh(traySideGeo, materials.steelRail);
    traySideL.position.set(0, -2.3, -9.8);
    heroTray.add(traySideL);

    const traySideR = new T.Mesh(traySideGeo, materials.steelRail);
    traySideR.position.set(0, -2.3, 9.8);
    heroTray.add(traySideR);

    // Front Bezel / Pull Handle & OLED Display Panel
    const trayFrontBezelGeo = new T.BoxGeometry(0.6, 6.6, 20.2);
    const trayFrontBezel = new T.Mesh(trayFrontBezelGeo, materials.chassisFace);
    trayFrontBezel.position.set(11.3, 0, 0);
    heroTray.add(trayFrontBezel);

    // Dual Ergonomic Aluminum Pull Handles
    const handleGeo = new T.BoxGeometry(0.4, 3.8, 0.4);
    const handleL = new T.Mesh(handleGeo, materials.doorHandle);
    handleL.position.set(11.8, 0, -8.6);
    heroTray.add(handleL);

    const handleR = new T.Mesh(handleGeo, materials.doorHandle);
    handleR.position.set(11.8, 0, 8.6);
    heroTray.add(handleR);

    // OLED Telemetry Display on Front Bezel
    const oledGeo = new T.PlaneGeometry(6.0, 1.2);
    const oledMat = new T.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00d4ff,
      emissiveIntensity: 2.5
    });
    const oledScreen = new T.Mesh(oledGeo, oledMat);
    oledScreen.rotation.y = Math.PI / 2;
    oledScreen.position.set(11.62, 1.8, 0);
    heroTray.add(oledScreen);

    // Front Intake Fan Bank: 4 High-Velocity Blower Fans
    const fanBankZ = [-6.6, -2.2, 2.2, 6.6];
    const fanCasingGeo = new T.CylinderGeometry(1.4, 1.4, 0.8, 16);
    fanCasingGeo.rotateZ(Math.PI / 2);

    const fanHubGeo = new T.CylinderGeometry(0.45, 0.45, 0.82, 12);
    fanHubGeo.rotateZ(Math.PI / 2);

    const fanBladeGeo = new T.BoxGeometry(0.12, 0.9, 0.04);

    for (let f = 0; f < fanBankZ.length; f++) {
      const fz = fanBankZ[f];

      const casing = new T.Mesh(fanCasingGeo, materials.fanHub);
      casing.position.set(10.2, -1.0, fz);
      heroTray.add(casing);

      // Rotating Fan Blades Group
      const bladesGroup = new T.Group();
      bladesGroup.position.set(10.2, -1.0, fz);

      const hub = new T.Mesh(fanHubGeo, materials.fanHub);
      bladesGroup.add(hub);

      for (let b = 0; b < 7; b++) {
        const blade = new T.Mesh(fanBladeGeo, materials.fanBlade);
        const angle = (b / 7) * Math.PI * 2;
        blade.position.set(0, Math.sin(angle) * 0.7, Math.cos(angle) * 0.7);
        blade.rotation.x = angle + 0.35; // pitch angle
        bladesGroup.add(blade);
      }

      heroTray.add(bladesGroup);
      animatedFans.push({ group: bladesGroup, direction: f % 2 === 0 ? 1 : -1 });
    }

    // Motherboard / HGX Baseboard
    const moboGeo = new T.BoxGeometry(20.0, 0.25, 19.0);
    const mobo = new T.Mesh(moboGeo, materials.pcb);
    mobo.position.set(-0.5, -2.8, 0);
    heroTray.add(mobo);

    // -----------------------------------------------------------------------
    // 8x GPU Blade Layout (2 Rows of 4 GPUs)
    // -----------------------------------------------------------------------
    const gpuRowsX = [4.2, -4.8]; // Row 0 (front), Row 1 (rear)
    const gpuColsZ = [-6.6, -2.2, 2.2, 6.6];

    /**
     * Stylized Companion GPU Module
     */
    function createCompanionGpu() {
      const gpu = new T.Group();

      // Heatsink Fin Stack
      const heatsinkGeo = new T.BoxGeometry(7.6, 2.4, 3.8);
      const heatsink = new T.Mesh(heatsinkGeo, materials.heatsinkFin);
      heatsink.position.set(0, 1.2, 0);
      gpu.add(heatsink);

      // Dual Copper Heat Pipes looping over the die
      const pipeGeo = new T.CylinderGeometry(0.18, 0.18, 7.8, 8);
      pipeGeo.rotateZ(Math.PI / 2);

      const pipe1 = new T.Mesh(pipeGeo, materials.copperPipe);
      pipe1.position.set(0, 2.44, -0.9);
      gpu.add(pipe1);

      const pipe2 = new T.Mesh(pipeGeo, materials.copperPipe);
      pipe2.position.set(0, 2.44, 0.9);
      gpu.add(pipe2);

      // Top Illuminated Branding Shroud Plate
      const topPlateGeo = new T.BoxGeometry(7.8, 0.16, 4.0);
      const topPlate = new T.Mesh(topPlateGeo, materials.chassisFace);
      topPlate.position.set(0, 2.48, 0);
      gpu.add(topPlate);

      // Glowing Cyan Edge Stripe
      const stripeGeo = new T.BoxGeometry(7.6, 0.08, 0.2);
      const stripe = new T.Mesh(stripeGeo, materials.ledCyan);
      stripe.position.set(0, 2.58, 1.85);
      gpu.add(stripe);

      // Gold PCIe Connector Contacts at bottom
      const goldContactsGeo = new T.BoxGeometry(6.4, 0.4, 0.12);
      const goldContacts = new T.Mesh(goldContactsGeo, materials.goldContact);
      goldContacts.position.set(0, -0.2, 0);
      gpu.add(goldContacts);

      // Micro Status Activity LED
      const microLed = new T.Mesh(ledDotGeo, materials.ledGreen);
      microLed.position.set(3.6, 2.58, -1.6);
      gpu.add(microLed);

      return gpu;
    }

    // Populate the 8 GPU slots
    // Dedicated slot for Hero RTX 4090: Row 0, Col 2 (Front Row, near center aisle)
    const heroGpuRow = 0;
    const heroGpuCol = 2;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const posX = gpuRowsX[r];
        const posZ = gpuColsZ[c];

        // PCIe Gen5 Baseboard Slot Socket
        const slotSocketGeo = new T.BoxGeometry(8.0, 0.38, 0.6);
        const slotSocket = new T.Mesh(slotSocketGeo, materials.chassisFace);
        slotSocket.position.set(posX, -2.6, posZ);
        heroTray.add(slotSocket);

        if (r === heroGpuRow && c === heroGpuCol) {
          // Dedicated Mount Point for the Hero RTX 4090 Card
          heroGpuMount = new T.Group();
          heroGpuMount.name = "HeroGpuMount_RTX4090";
          heroGpuMount.position.set(posX, -2.4, posZ);

          // Golden Contact Receptacle
          const mountSocketGold = new T.Mesh(new T.BoxGeometry(7.2, 0.2, 0.16), materials.goldContact);
          mountSocketGold.position.set(0, 0.1, 0);
          heroGpuMount.add(mountSocketGold);

          // 12VHPWR Power Cable Wiring Harness
          const wireConduitGeo = new T.CylinderGeometry(0.2, 0.2, 3.2, 8);
          wireConduitGeo.rotateZ(Math.PI / 2);
          const wireConduit = new T.Mesh(wireConduitGeo, materials.cableYellow);
          wireConduit.position.set(4.2, 0.6, 0.8);
          heroGpuMount.add(wireConduit);

          // Active PCIe Status Indicator (Pulsing Green)
          const pcieStatusLed = new T.Mesh(ledDotGeo, materials.ledGreen);
          pcieStatusLed.position.set(4.0, 0.4, -0.8);
          heroGpuMount.add(pcieStatusLed);
          blinkingLeds.push({ mesh: pcieStatusLed, phase: 0, speed: 4.0 });

          heroTray.add(heroGpuMount);
        } else {
          // Populated Companion GPU Module
          const compGpu = createCompanionGpu();
          compGpu.position.set(posX, -2.4, posZ);
          heroTray.add(compGpu);
        }
      }
    }

    // -----------------------------------------------------------------------
    // The Hero Front Glass Door (Animated Pivot Hinge)
    // -----------------------------------------------------------------------
    // Hinge Pivot placed at corner: X = halfD, Z = -halfW (front-left corner)
    heroDoorPivot = new T.Group();
    heroDoorPivot.name = "HeroDoorPivot";
    heroDoorPivot.position.set(halfD, 0, -halfW);
    rack.add(heroDoorPivot);

    // Door Panel extends along +Z from hinge
    const heroDoorGeo = new T.BoxGeometry(0.3, rackHeight - 3.2, rackWidth - 1.8);
    const heroDoorPanel = new T.Mesh(heroDoorGeo, materials.heroGlassDoor);
    heroDoorPanel.position.set(0, rackHeight * 0.5, halfW - 0.2);
    heroDoorPivot.add(heroDoorPanel);

    // Outer Aluminum Door Frame
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

    // Full-Length Brushed Aluminum Vertical Pull Handle
    const heroHandleGeo = new T.BoxGeometry(0.4, rackHeight * 0.45, 0.35);
    const heroHandle = new T.Mesh(heroHandleGeo, materials.doorHandle);
    heroHandle.position.set(0.4, rackHeight * 0.5, rackWidth - 3.0);
    heroDoorPivot.add(heroHandle);

    // Mechanical Latch & Keylock Barrel
    const lockGeo = new T.CylinderGeometry(0.25, 0.25, 0.6, 12);
    lockGeo.rotateZ(Math.PI / 2);
    const lock = new T.Mesh(lockGeo, materials.doorHandle);
    lock.position.set(0.3, rackHeight * 0.5 - 12.0, rackWidth - 2.0);
    heroDoorPivot.add(lock);

    // Store references on heroRackObj
    heroRackObj.group = rack;
    heroRackObj.doorPivot = heroDoorPivot;
    heroRackObj.tray = heroTray;
    heroRackObj.gpuMount = heroGpuMount;

    return rack;
  }

  // -------------------------------------------------------------------------
  // 5. Construct Left and Right Rack Rows
  // -------------------------------------------------------------------------

  const leftRackRowGroup = new T.Group();
  leftRackRowGroup.name = "LeftRackRow";

  const rightRackRowGroup = new T.Group();
  rightRackRowGroup.name = "RightRackRow";

  const halfRows = Math.floor(racksPerRow / 2);

  // Left Row Racks (facing +X)
  for (let i = 0; i < racksPerRow; i++) {
    const rackZ = (i - halfRows) * rackSpacingZ;
    if (i === heroRackIndex) {
      const heroRack = buildHeroRack(leftTrayX, rackZ);
      leftRackRowGroup.add(heroRack);
    } else {
      const rack = buildStandardRack(leftTrayX, rackZ, true);
      leftRackRowGroup.add(rack);
    }
  }

  // Right Row Racks (facing -X)
  for (let i = 0; i < racksPerRow; i++) {
    const rackZ = (i - halfRows) * rackSpacingZ;
    const rack = buildStandardRack(rightTrayX, rackZ, false);
    rightRackRowGroup.add(rack);
  }

  roomGroup.add(leftRackRowGroup);
  roomGroup.add(rightRackRowGroup);

  // -------------------------------------------------------------------------
  // 6. Datacenter Lighting Rig (Bright Cleanroom Light Theme)
  // -------------------------------------------------------------------------

  const datacenterLights = [];

  if (options.addLights !== false) {
    // Ambient Daylight / Cleanroom White - eliminates pitch-black shadows
    const ambientLight = new T.AmbientLight(0xffffff, 1.8);
    roomGroup.add(ambientLight);
    datacenterLights.push(ambientLight);

    // Hemisphere: Crisp White Sky bounce, Light Silver Floor bounce
    const hemiLight = new T.HemisphereLight(0xffffff, 0xe2e8f0, 1.4);
    hemiLight.position.set(0, roomHeight, 0);
    roomGroup.add(hemiLight);
    datacenterLights.push(hemiLight);

    // Primary Directional Aisle Fill Lights for crisp metallic highlights
    const dirLight1 = new T.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(18.0, 75.0, 30.0);
    roomGroup.add(dirLight1);
    datacenterLights.push(dirLight1);

    const dirLight2 = new T.DirectionalLight(0xffffff, 1.2);
    dirLight2.position.set(-18.0, 75.0, -30.0);
    roomGroup.add(dirLight2);
    datacenterLights.push(dirLight2);

    // Downward Overhead Fluorescent / LED Troffers (7 fixtures along aisle corridor)
    const aisleZPoints = [-105, -70, -35, 0, 35, 70, 105];
    for (let lz = 0; lz < aisleZPoints.length; lz++) {
      const light = new T.PointLight(0xffffff, 2.2, 120, 1.2);
      light.position.set(0, roomHeight - 5.0, aisleZPoints[lz]);
      roomGroup.add(light);
      datacenterLights.push(light);
    }

    // Floor Level High-Tech Cyan Accent Wash Lights
    const floorZPoints = [-70, 0, 70];
    for (let fz = 0; fz < floorZPoints.length; fz++) {
      const washLightL = new T.PointLight(0x00b4d8, 1.4, 45, 1.8);
      washLightL.position.set(-17.0, 1.2, floorZPoints[fz]);
      roomGroup.add(washLightL);
      datacenterLights.push(washLightL);

      const washLightR = new T.PointLight(0x00b4d8, 1.4, 45, 1.8);
      washLightR.position.set(17.0, 1.2, floorZPoints[fz]);
      roomGroup.add(washLightR);
      datacenterLights.push(washLightR);
    }

    // Dedicated Hero Rack Internal Illumination (makes internal GPUs shine)
    const heroInternalLight = new T.PointLight(0xffffff, 2.8, 38, 1.2);
    heroInternalLight.position.set(leftTrayX + 6.0, 40.0, (heroRackIndex - halfRows) * rackSpacingZ);
    roomGroup.add(heroInternalLight);
    datacenterLights.push(heroInternalLight);

    // Hero Rack Key Studio Spotlight (illuminates Rack 04 and extended 4U tray)
    const heroSpot = new T.SpotLight(0xffffff, 3.2, 110, Math.PI / 3.2, 0.45, 1.1);
    heroSpot.position.set(-6.0, 56.0, (heroRackIndex - halfRows) * rackSpacingZ + 20.0);
    heroSpot.target.position.set(leftTrayX + 12.0, 36.6, (heroRackIndex - halfRows) * rackSpacingZ);
    roomGroup.add(heroSpot);
    roomGroup.add(heroSpot.target);
    datacenterLights.push(heroSpot);
  }

  // -------------------------------------------------------------------------
  // 7. Dynamic Camera Presets
  // -------------------------------------------------------------------------

  const heroZ = (heroRackIndex - halfRows) * rackSpacingZ;
  const heroFrontX = leftTrayX + rackDepth * 0.5; // -18.0

  const cameraPresets = {
    // Wide corridor matching user reference image
    facility: {
      position: new T.Vector3(0, 32.0, 105.0),
      target: new T.Vector3(0, 28.0, -25.0),
      fov: 36,
      minDistance: 4,
      maxDistance: 220
    },
    aisle: {
      position: new T.Vector3(0, 32.0, 105.0),
      target: new T.Vector3(0, 28.0, -25.0),
      fov: 36,
      minDistance: 4,
      maxDistance: 220
    },
    // Front-quarter beauty shot of Hero Rack 04
    rack: {
      position: new T.Vector3(-4.0, 40.0, heroZ + 20.0),
      target: new T.Vector3(heroFrontX, 37.0, heroZ),
      fov: 34,
      minDistance: 3,
      maxDistance: 120
    },
    rackFront: {
      position: new T.Vector3(-4.0, 40.0, heroZ + 20.0),
      target: new T.Vector3(heroFrontX, 37.0, heroZ),
      fov: 34,
      minDistance: 3,
      maxDistance: 120
    },
    // Extended 4U GPU Compute Blade inspection
    blade: {
      position: new T.Vector3(-2.0, 48.0, heroZ + 14.0),
      target: new T.Vector3(trayExtendedX + 2.0, 36.0, heroZ),
      fov: 32,
      minDistance: 2,
      maxDistance: 80
    },
    bladeSled: {
      position: new T.Vector3(-2.0, 48.0, heroZ + 14.0),
      target: new T.Vector3(trayExtendedX + 2.0, 36.0, heroZ),
      fov: 32,
      minDistance: 2,
      maxDistance: 80
    },
    // Close macro focus on the hero RTX 4090 card on its mount
    gpu: {
      position: new T.Vector3(-4.5, 41.5, heroZ + 4.5),
      target: new T.Vector3(trayExtendedX + 4.2, 36.6, heroZ + 2.2),
      fov: 30,
      minDistance: 1.5,
      maxDistance: 60
    },
    inspect: {
      position: new T.Vector3(-4.5, 41.5, heroZ + 4.5),
      target: new T.Vector3(trayExtendedX + 4.2, 36.6, heroZ + 2.2),
      fov: 30,
      minDistance: 1.5,
      maxDistance: 60
    },
    // Direct overhead top-down view of 8-GPU motherboard
    bladeTopDown: {
      position: new T.Vector3(trayExtendedX, 64.0, heroZ),
      target: new T.Vector3(trayExtendedX, 36.0, heroZ),
      fov: 35,
      minDistance: 2,
      maxDistance: 90
    },
    // Sweeping high-altitude flythrough perspective
    flythrough: {
      position: new T.Vector3(8.0, 50.0, 115.0),
      target: new T.Vector3(-6.0, 30.0, -55.0),
      fov: 40,
      minDistance: 4,
      maxDistance: 240
    }
  };

  // -------------------------------------------------------------------------
  // 8. Public Methods & Animation Controller
  // -------------------------------------------------------------------------

  /**
   * Set hero rack front door open factor
   * @param {number} factor 0.0 (closed) to 1.0 (open ~95 deg)
   * @param {boolean} [immediate=false]
   */
  function openHeroDoor(factor, immediate = false) {
    targetDoorFactor = Math.max(0.0, Math.min(1.0, factor));
    if (immediate) {
      currentDoorFactor = targetDoorFactor;
      if (heroDoorPivot) {
        heroDoorPivot.rotation.y = currentDoorFactor * maxDoorAngle;
      }
    }
  }

  /**
   * Set hero 4U compute blade tray extension factor
   * @param {number} factor 0.0 (retracted) to 1.0 (fully extended forward)
   * @param {boolean} [immediate=false]
   */
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

  /**
   * Returns dedicated mount point for the hero RTX 4090 card
   */
  function getHeroGpuMount() {
    return {
      group: heroGpuMount,
      position: heroGpuMount ? heroGpuMount.position : new T.Vector3(),
      rotation: heroGpuMount ? heroGpuMount.rotation : new T.Euler(),
      getWorldPosition: (target = new T.Vector3()) => {
        return heroGpuMount ? heroGpuMount.getWorldPosition(target) : target;
      },
      getWorldQuaternion: (target = new T.Quaternion()) => {
        return heroGpuMount ? heroGpuMount.getWorldQuaternion(target) : target;
      }
    };
  }

  /**
   * Returns camera preset vector pair
   * @param {string} name
   */
  function getCameraPreset(name) {
    const key = String(name || "facility").toLowerCase();
    if (key.includes("fac") || key.includes("aisle") || key.includes("default")) {
      return cameraPresets.facility;
    }
    if (key.includes("top")) {
      return cameraPresets.bladeTopDown;
    }
    if (key.includes("blade") || key.includes("tray") || key.includes("sled")) {
      return cameraPresets.blade;
    }
    if (key.includes("gpu") || key.includes("inspect")) {
      return cameraPresets.gpu;
    }
    if (key.includes("rack")) {
      return cameraPresets.rack;
    }
    if (key.includes("fly")) {
      return cameraPresets.flythrough;
    }
    return cameraPresets[name] || cameraPresets.facility;
  }

  /**
   * Master per-frame animation update loop
   * @param {number} delta Delta time in seconds
   * @param {number} elapsed Elapsed time in seconds
   */
  function update(delta, elapsed) {
    const dt = Math.min(delta || 0.016, 0.1);
    const time = elapsed !== undefined ? elapsed : performance.now() * 0.001;

    // Smooth critically damped lerp for door and tray
    const lerpSpeed = 1.0 - Math.exp(-dt * 6.5);
    currentDoorFactor += (targetDoorFactor - currentDoorFactor) * lerpSpeed;
    currentTrayFactor += (targetTrayFactor - currentTrayFactor) * lerpSpeed;

    // Update Door Angle
    if (heroDoorPivot) {
      heroDoorPivot.rotation.y = currentDoorFactor * maxDoorAngle;
    }

    // Update Tray Travel along +X
    if (heroTray) {
      heroTray.position.x = currentTrayFactor * trayMaxTravel;
    }

    // Update Telescoping Intermediate Slide Rails
    if (intermediateRailLeft && intermediateRailRight) {
      const interTravel = currentTrayFactor * (trayMaxTravel * 0.5);
      intermediateRailLeft.position.x = interTravel;
      intermediateRailRight.position.x = interTravel;
    }

    // Rotate Fan Impellers (counter-rotating pairs)
    const fanSpeed = 38.0; // rad/sec
    for (let f = 0; f < animatedFans.length; f++) {
      const fan = animatedFans[f];
      fan.group.rotation.x += dt * fanSpeed * fan.direction;
    }

    // Twinkling Server Status LEDs across all Racks
    const flicker1 = 0.7 + 0.3 * Math.sin(time * 7.5);
    const flicker2 = 0.65 + 0.35 * Math.cos(time * 11.2);
    const pulseActive = Math.sin(time * 16.0) > 0.3 ? 1.4 : 0.4;
    const alertFlicker = Math.sin(time * 3.4) > 0.75 ? 1.8 : 0.4;

    materials.ledBlue.emissiveIntensity = 2.6 * flicker1;
    materials.ledCyan.emissiveIntensity = 2.8 * pulseActive;
    materials.ledGreen.emissiveIntensity = 2.3 * flicker2;
    materials.ledAmber.emissiveIntensity = 2.0 * alertFlicker;

    // Subtle Breathing Cove Light Modulation along Floor
    materials.coveBlue.emissiveIntensity = 3.2 + 0.45 * Math.sin(time * 1.6);
  }

  /**
   * Cleanup resources when unloading
   */
  function dispose() {
    roomGroup.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
    if (scene) {
      scene.remove(roomGroup);
    }
  }

  return {
    group: roomGroup,
    heroRack: heroRackObj,
    heroTray,
    heroGpuMount,
    lights: datacenterLights,
    cameraPresets,
    openHeroDoor,
    extendHeroTray,
    getHeroDoorFactor: () => currentDoorFactor,
    getHeroTrayFactor: () => currentTrayFactor,
    getHeroGpuMount,
    getCameraPreset,
    update,
    dispose
  };
}

export default createServerRoom;
