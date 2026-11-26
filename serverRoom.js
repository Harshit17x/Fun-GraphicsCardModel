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
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/utils/BufferGeometryUtils.js";

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

  ctx.fillStyle = "#232a33";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle anti-static laminate speckle catching the overhead light
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillStyle =
      Math.random() > 0.55
        ? "rgba(203,213,225,0.10)"
        : "rgba(2,6,12,0.30)";
    ctx.fillRect(x, y, 2, 2);
  }

  // Crisp 2x2 raised floor tile seams
  ctx.strokeStyle = "#0e1319";
  ctx.lineWidth = 4;
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

  ctx.fillStyle = "#2c3540";
  ctx.fillRect(0, 0, 256, 256);

  // Dark airflow slots
  ctx.fillStyle = "#05080c";
  for (let y = 10; y < 246; y += 12) {
    for (let x = 10; x < 246; x += 28) {
      ctx.fillRect(x, y, 20, 5);
    }
  }

  // Tile perimeter frame
  ctx.strokeStyle = "#414d5c";
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

  ctx.fillStyle = "#3c4652";
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = "#222a33";
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

  // 42U layout: four 8U DGX nodes separated by 2U switch/service strips.
  // Fewer, larger faceplates read as compute nodes instead of a wall of
  // bright cards, and the muted titanium finish holds up under aisle lights.
  const nodeH = 178;
  const switchH = 46;
  const unitGap = 8;
  let y = 22;
  let idx = 0;
  while (y < 970) {
    const isDgxNode = idx % 2 === 0;
    const h = isDgxNode ? nodeH : switchH;
    if (y + h > 1004) break;

    if (isDgxNode) {
      // Brushed titanium-champagne DGX H100/SuperPOD faceplate.
      const grad = ctx.createLinearGradient(26, y, 486, y + h);
      grad.addColorStop(0, "#c2b7a0");
      grad.addColorStop(0.38, "#d3c9b2");
      grad.addColorStop(0.72, "#afa48c");
      grad.addColorStop(1, "#998f79");
      ctx.fillStyle = grad;
      ctx.fillRect(26, y, 460, h - 6);

      // Machined top/bottom bevel.
      ctx.fillStyle = "rgba(255,255,255,0.24)";
      ctx.fillRect(26, y, 460, 2);
      ctx.fillStyle = "rgba(0,0,0,0.38)";
      ctx.fillRect(26, y + h - 8, 460, 2);

      // Left & right dark intake mesh cutouts.
      ctx.fillStyle = "#262d37";
      ctx.fillRect(40, y + 16, 160, h - 32);
      ctx.fillRect(312, y + 16, 160, h - 32);

      ctx.fillStyle = "#3e4855";
      for (let ly = y + 24; ly < y + h - 24; ly += 8) {
        ctx.fillRect(46, ly, 148, 2);
        ctx.fillRect(318, ly, 148, 2);
      }

      // Center anodized badge column with NVIDIA green status block.
      ctx.fillStyle = "rgba(20,24,30,0.94)";
      ctx.fillRect(210, y + 26, 92, h - 58);
      ctx.fillStyle = "rgba(148,163,184,0.22)";
      ctx.fillRect(210, y + 26, 92, 2);
      ctx.fillStyle = "#76b900";
      ctx.fillRect(220, y + 40, 12, 12);
      ctx.fillStyle = "#dbe3ee";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("DGX", 240, y + 51);

      ctx.fillStyle = "rgba(148,163,184,0.8)";
      ctx.font = "600 10px monospace";
      ctx.fillText("H100", 218, y + 78);

      // Status LEDs down the badge column.
      ctx.fillStyle = "#76b900";
      ctx.fillRect(220, y + h - 66, 6, 4);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(232, y + h - 66, 6, 4);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(244, y + h - 66, 6, 4);
      ctx.fillStyle = "rgba(148,163,184,0.65)";
      ctx.font = "600 9px monospace";
      ctx.fillText("POWER", 256, y + h - 62);
    } else {
      // 2U Quantum-2 InfiniBand switch with QSFP cages.
      ctx.fillStyle = "#20252d";
      ctx.fillRect(26, y, 460, h - 5);
      ctx.fillStyle = "#0f1216";
      ctx.fillRect(40, y + 8, 350, h - 20);

      // Individual QSFP transceiver cages.
      ctx.fillStyle = "#343b48";
      for (let px = 46; px < 380; px += 19) {
        ctx.fillRect(px, y + 12, 13, 14);
      }

      // Pull-tab and link LEDs.
      ctx.fillStyle = "#76b900";
      ctx.fillRect(404, y + 14, 8, 6);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(420, y + 14, 8, 6);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(436, y + 14, 8, 6);
      ctx.fillStyle = "rgba(148,163,184,0.55)";
      ctx.font = "600 10px monospace";
      ctx.fillText("QM2", 452, y + 22);
    }

    y += h + unitGap;
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

  ctx.fillStyle = "#0c1219";
  ctx.fillRect(0, 0, 1024, 256);

  ctx.strokeStyle = "#2a3542";
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 1016, 248);

  // Fine engineering grid behind the wordmark
  ctx.strokeStyle = "rgba(118,185,0,0.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1024; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1024, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#76b900";
  ctx.fillRect(20, 20, 14, 216);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "600 44px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.fillText(title, 60, 102);

  ctx.fillStyle = "#9fb0c3";
  ctx.font = "500 24px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.fillText(subtitle, 60, 154);

  ctx.fillStyle = "#76b900";
  ctx.beginPath();
  ctx.arc(66, 202, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7c8da1";
  ctx.font = "500 18px monospace";
  ctx.fillText("COLD-AISLE CONTAINMENT · POD-A · ISO CLASS 7 CLEANROOM", 86, 208);

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

/**
 * Rack plaque texture atlas — all 17 standard rack labels in one GPU texture.
 */
function createRackPlaqueAtlasTexture(T, labels) {
  if (typeof document === "undefined") return null;

  const cols = 4;
  const rows = Math.max(1, Math.ceil(labels.length / cols));
  const cellW = 256;
  const cellH = 64;
  const canvas = document.createElement("canvas");
  canvas.width = cellW * cols;
  canvas.height = cellH * rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  labels.forEach((label, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * cellW;
    const y = row * cellH;

    ctx.fillStyle = "#1a1f28";
    ctx.fillRect(x, y, cellW, cellH);

    ctx.fillStyle = "#76b900";
    ctx.fillRect(x, y, 12, cellH);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "700 28px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + cellW * 0.54, y + cellH * 0.54);

    ctx.strokeStyle = "rgba(148,163,184,0.28)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);
  });

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * 4U DGX faceplate for the articulated hero cabinet. The standard racks get
 * their detail from a full-height atlas; the hero rack needs per-unit faces
 * because its door is open and the interior is seen up close.
 */
function createHeroUnitFaceTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 0, 160);
  bg.addColorStop(0, "#cdc3ac");
  bg.addColorStop(0.48, "#d8ceb8");
  bg.addColorStop(1, "#b5aa93");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 160);

  // Airflow grille on the intake half.
  ctx.fillStyle = "rgba(12,16,21,0.9)";
  ctx.fillRect(28, 34, 196, 92);
  ctx.strokeStyle = "rgba(210,220,232,0.16)";
  ctx.lineWidth = 2;
  for (let y = 44; y < 120; y += 12) {
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(216, y);
    ctx.stroke();
  }

  // Service handle recess.
  ctx.fillStyle = "rgba(12,16,21,0.92)";
  ctx.fillRect(252, 46, 16, 68);
  ctx.fillStyle = "rgba(226,232,240,0.6)";
  ctx.fillRect(255, 52, 10, 56);

  // Branding and status cluster.
  ctx.fillStyle = "rgba(24,29,36,0.94)";
  ctx.font = "700 38px monospace";
  ctx.fillText("DGX", 300, 92);
  ctx.fillStyle = "rgba(44,52,63,0.86)";
  ctx.font = "600 17px monospace";
  ctx.fillText("H100 · 4U", 302, 118);

  ctx.fillStyle = "#76b900";
  ctx.fillRect(446, 52, 14, 14);
  ctx.fillStyle = "rgba(56,189,248,0.95)";
  ctx.fillRect(466, 52, 14, 14);
  ctx.fillStyle = "rgba(52,60,72,0.8)";
  ctx.font = "600 13px monospace";
  ctx.fillText("PSU", 444, 92);

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Floor stencil marking the hero rack's service zone.
 */
function createHeroFloorTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 410;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, 256, 410);
  ctx.strokeStyle = "rgba(118,185,0,0.7)";
  ctx.lineWidth = 6;
  ctx.lineCap = "square";

  // Corner brackets keep the marking legible from a standing height.
  const inset = 14;
  const arm = 54;
  [
    [inset, inset, 1, 1],
    [256 - inset, inset, -1, 1],
    [inset, 410 - inset, 1, -1],
    [256 - inset, 410 - inset, -1, -1],
  ].forEach(([x, y, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(x + arm * sx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + arm * sy);
    ctx.stroke();
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(160,210,60,0.92)";
  ctx.font = "700 92px monospace";
  ctx.fillText("A04", 128, 196);
  ctx.fillStyle = "rgba(148,163,184,0.85)";
  ctx.font = "600 24px monospace";
  ctx.fillText("HERO POD", 128, 246);
  ctx.fillStyle = "rgba(118,185,0,0.5)";
  ctx.fillRect(92, 276, 72, 4);

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Cold-aisle floor direction arrow decal.
 */
function createFloorArrowTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.clearRect(0, 0, 256, 512);

  // Stacked directional chevrons read clearly at grazing angles and keep a
  // strong walking-direction cue without looking like a UI icon.
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";
  ctx.lineWidth = 13;
  [
    { y: 46, alpha: 0.3 },
    { y: 138, alpha: 0.55 },
    { y: 230, alpha: 0.88 },
  ].forEach((chevron) => {
    ctx.strokeStyle = `rgba(118,185,0,${chevron.alpha})`;
    ctx.beginPath();
    ctx.moveTo(42, chevron.y + 82);
    ctx.lineTo(128, chevron.y);
    ctx.lineTo(214, chevron.y + 82);
    ctx.stroke();
  });

  ctx.fillStyle = "rgba(140,160,180,0.85)";
  ctx.font = "600 22px monospace";
  ctx.textAlign = "center";
  ctx.fillText("AISLE 04", 128, 392);
  ctx.fillStyle = "rgba(118,185,0,0.75)";
  ctx.font = "700 20px monospace";
  ctx.fillText("POD-A", 128, 424);

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Diagonal safety hazard band for the containment portal threshold.
 */
function createHazardStripeTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#1a1f28";
  ctx.fillRect(0, 0, 256, 64);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 256, 64);
  ctx.clip();
  ctx.strokeStyle = "#d9a80c";
  ctx.lineWidth = 20;
  for (let x = -64; x < 320; x += 52) {
    ctx.beginPath();
    ctx.moveTo(x, 78);
    ctx.lineTo(x + 78, -14);
    ctx.stroke();
  }
  ctx.restore();

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = T.RepeatWrapping;
  texture.wrapT = T.ClampToEdgeWrapping;
  texture.repeat.set(6, 1);
  texture.anisotropy = 4;
  return texture;
}

/**
 * Back-wall telemetry display (power / thermal) with live-looking bars.
 */
function createStatusDisplayTexture(T, kind) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const isPower = kind === "power";
  const accent = isPower ? "#76b900" : "#38bdf8";

  ctx.fillStyle = "#0a1017";
  ctx.fillRect(0, 0, 512, 256);

  // Faint screen scan grid
  ctx.strokeStyle = "rgba(148,163,184,0.08)";
  ctx.lineWidth = 1;
  for (let y = 0; y < 256; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 8, 256);
  ctx.fillRect(28, 22, 6, 26);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 26px monospace";
  ctx.fillText(isPower ? "POD-A POWER" : "COOLANT LOOP", 46, 44);

  ctx.fillStyle = "#64748b";
  ctx.font = "500 15px monospace";
  ctx.fillText(isPower ? "415 V · 3Ø · 800 A FEED" : "CDU PRIMARY / N+1 REDUNDANT", 46, 70);

  ctx.fillStyle = accent;
  ctx.font = "700 64px monospace";
  ctx.fillText(isPower ? "78%" : "18.4°", 44, 146);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 16px monospace";
  ctx.fillText(isPower ? "UTILIZATION" : "SUPPLY TEMP", 46, 172);

  // Live-looking bar meter
  const bars = isPower ? 12 : 10;
  const lit = isPower ? 9 : 7;
  for (let i = 0; i < bars; i++) {
    ctx.fillStyle = i < lit ? accent : "rgba(100,116,139,0.22)";
    ctx.fillRect(46 + i * 30, 194, 20, 26);
  }

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "600 17px monospace";
  ctx.fillText(isPower ? "PUE 1.12" : "240 L/MIN", 300, 214);

  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(486, 34, 5, 0, Math.PI * 2);
  ctx.fill();

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Compact illuminated aisle sign hung above the containment portal.
 */
function createAisleSignTexture(T, label) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#10161d";
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = "#76b900";
  ctx.fillRect(0, 0, 14, 128);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "700 58px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 276, 58);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 20px monospace";
  ctx.fillText("POD-A · COLD AISLE", 276, 102);

  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  return texture;
}

/**
 * Brushed Titanium "RTX AI SUPERPOD" End-Cap Pylon Faceplate Texture
 */
function createPodPylonTexture(T) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const grad = ctx.createLinearGradient(0, 0, 512, 1024);
  grad.addColorStop(0, "#aeb8c4");
  grad.addColorStop(0.4, "#c8d0da");
  grad.addColorStop(0.8, "#939eab");
  grad.addColorStop(1, "#7b8694");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle horizontal brushed grain
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let y = 0; y < 1024; y += 4) {
    ctx.fillRect(0, y, 512, 1);
  }

  // Framing bevel & emerald stripe
  ctx.strokeStyle = "#2b3542";
  ctx.lineWidth = 10;
  ctx.strokeRect(12, 12, 488, 1000);
  ctx.fillStyle = "#76b900";
  ctx.fillRect(28, 36, 456, 10);

  // Bold NVIDIA RTX SuperPOD typography
  ctx.fillStyle = "#0e131a";
  ctx.textAlign = "center";
  ctx.font = "800 92px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.fillText("RTX", 256, 230);

  ctx.fillStyle = "#1e293b";
  ctx.font = "700 34px -apple-system, BlinkMacSystemFont, 'Inter', sans-serif";
  ctx.fillText("AI SUPERPOD", 256, 286);

  ctx.fillStyle = "#4b5563";
  ctx.font = "600 20px monospace";
  ctx.fillText("AD102 // DGX POD-A", 256, 336);

  // Vertical recessed telemetry slit
  ctx.fillStyle = "#10161e";
  ctx.fillRect(216, 420, 80, 440);
  for (let y = 448; y < 835; y += 26) {
    ctx.fillStyle = y < 600 ? "#76b900" : "#38bdf8";
    ctx.fillRect(234, y, 44, 8);
  }

  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ---------------------------------------------------------------------------
// Shared Architectural PBR Materials
// ---------------------------------------------------------------------------

function createSharedMaterials(T) {
  return {
    floor: new T.MeshStandardMaterial({
      color: 0xffffff,
      map: createFloorCanvasTexture(T) || undefined,
      roughness: 0.38,
      metalness: 0.12,
      envMapIntensity: 0.55,
    }),

    airGrate: new T.MeshStandardMaterial({
      color: 0xffffff,
      map: createAirGrateTexture(T) || undefined,
      roughness: 0.44,
      metalness: 0.55,
      envMapIntensity: 0.55,
    }),

    ceiling: new T.MeshStandardMaterial({
      color: 0xffffff,
      map: createCeilingGridTexture(T) || undefined,
      roughness: 0.85,
      metalness: 0.04,
    }),

    wall: new T.MeshStandardMaterial({
      color: 0x3f4a58,
      roughness: 0.72,
      metalness: 0.08,
    }),

    aluminumFrame: new T.MeshStandardMaterial({
      color: 0xbac4d0,
      roughness: 0.28,
      metalness: 0.85,
    }),

    containmentGlass: new T.MeshStandardMaterial({
      color: 0x9fc2d8,
      transparent: true,
      opacity: 0.13,
      roughness: 0.06,
      metalness: 0.7,
      envMapIntensity: 0.6,
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
      roughness: 0.48,
      metalness: 0.52,
      envMapIntensity: 0.62,
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

    // Facility detailing & wayfinding
    markingStrip: new T.MeshBasicMaterial({ color: 0x7fa61c }),
    wallPilaster: new T.MeshStandardMaterial({
      color: 0x505d6d,
      roughness: 0.62,
      metalness: 0.12,
    }),
    statusFrame: new T.MeshStandardMaterial({
      color: 0x11161d,
      roughness: 0.38,
      metalness: 0.55,
    }),
    accentStrip: new T.MeshBasicMaterial({ color: 0x9bd426 }),
    dataMote: new T.MeshBasicMaterial({ color: 0xb6f23a }),
    statusBeacon: new T.MeshBasicMaterial({ color: 0x8fd21c }),
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
  const roomLength = 420.0;
  const roomWidth = 140.0;
  const roomHeight = 92.0;
  const aisleRun = rackSpacingZ * racksPerRow;

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

  // Green light line along the header edge marks the pod boundary.
  const portalAccent = new T.Mesh(
    new T.BoxGeometry(aisleWidth + 2, 0.32, 0.2),
    materials.accentStrip
  );
  portalAccent.position.set(0, rackHeight + 0.05, 0.72);
  portalGroup.add(portalAccent);

  // Vertical jambs close the containment frame.
  [-1, 1].forEach((side) => {
    const jamb = new T.Mesh(
      new T.BoxGeometry(0.9, rackHeight, 1.3),
      materials.aluminumFrame
    );
    jamb.position.set(side * (aisleWidth * 0.5 + 0.55), rackHeight * 0.5, 0);
    portalGroup.add(jamb);
  });

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
      new T.PlaneGeometry(46, 11.5),
      new T.MeshBasicMaterial({ map: signTexture, fog: false })
    );
    signMesh.position.set(0, 80.5, -roomLength / 2 + 0.8);
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

    // Unmistakable A04 identity from down the aisle: illuminated corner
    // columns, a lit threshold, and a painted service-zone stencil.
    const heroColumnGeo = new T.BoxGeometry(0.22, rackHeight - 5.0, 0.5);
    [-1, 1].forEach((side) => {
      const column = new T.Mesh(heroColumnGeo, materials.accentStrip);
      column.position.set(halfD + 0.78, rackHeight * 0.5, side * (halfW - 0.8));
      rack.add(column);
    });

    const heroThreshold = new T.Mesh(
      new T.BoxGeometry(1.5, 0.1, rackWidth - 3.4),
      materials.markingStrip
    );
    heroThreshold.position.set(halfD + 1.4, 0.08, 0);
    rack.add(heroThreshold);

    const floorStencilTexture = createHeroFloorTexture(T);
    if (floorStencilTexture) {
      const stencil = new T.Mesh(
        new T.PlaneGeometry(5.2, 8.3),
        new T.MeshBasicMaterial({
          map: floorStencilTexture,
          transparent: true,
          opacity: 0.82,
          depthWrite: false,
        })
      );
      stencil.rotation.x = -Math.PI / 2;
      stencil.position.set(halfD + 4.2, 0.06, 0);
      stencil.renderOrder = 2;
      rack.add(stencil);
    }

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

    const heroUnitFaceMaterial = new T.MeshStandardMaterial({
      map: createHeroUnitFaceTexture(T) || undefined,
      roughness: 0.44,
      metalness: 0.5,
      envMapIntensity: 0.55,
    });

    const addRackUnit = (yCenter) => {
      const chassis = new T.Mesh(chassis4UGeo, materials.chassisBody);
      chassis.position.set(0, yCenter, 0);
      rack.add(chassis);

      const bezel = new T.Mesh(bezel4UGeo, heroUnitFaceMaterial);
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

    // Pulsing rack-top status beacon
    const heroBeacon = new T.Mesh(
      new T.BoxGeometry(1.1, 0.45, 1.1),
      materials.statusBeacon
    );
    heroBeacon.position.set(0, rackHeight + 0.38, 0);
    rack.add(heroBeacon);

    heroRackObj.group = rack;
    heroRackObj.doorPivot = heroDoorPivot;
    heroRackObj.tray = heroTray;
    heroRackObj.gpuMount = heroGpuMount;
    heroRackObj.hitProxy = hitProxy;
    heroRackObj.beacon = heroBeacon;

    return rack;
  }

  // -------------------------------------------------------------------------
  // 5. Construct Left (A01–A09) & Right (B01–B09) Rack Rows
  //    Standard cabinets are GPU-instanced: 3 draw calls for all 17 racks.
  // -------------------------------------------------------------------------

  const halfRows = Math.floor(racksPerRow / 2);
  const heroZ = (heroRackIndex - halfRows) * rackSpacingZ;

  const standardRackPlacements = [];
  for (let i = 0; i < racksPerRow; i++) {
    const rackZ = (i - halfRows) * rackSpacingZ;
    const num = String(i + 1).padStart(2, "0");
    if (i !== heroRackIndex) {
      standardRackPlacements.push({
        x: leftTrayX,
        z: rackZ,
        isLeft: true,
        label: `A${num}`,
      });
    }
    standardRackPlacements.push({
      x: rightTrayX,
      z: rackZ,
      isLeft: false,
      label: `B${num}`,
    });
  }

  const standardRackCount = standardRackPlacements.length;
  const rackBodyInst = new T.InstancedMesh(
    rackBodyGeo,
    materials.rackFrame,
    standardRackCount
  );
  const rackFaceInst = new T.InstancedMesh(
    rackFaceGeo,
    materials.rackFaceMap,
    standardRackCount
  );
  const rackDoorInst = new T.InstancedMesh(
    doorGeo,
    materials.glassDoor,
    standardRackCount
  );
  rackBodyInst.name = "StandardRackBodies";
  rackFaceInst.name = "StandardRackFaces";
  rackDoorInst.name = "StandardRackDoors";

  standardRackPlacements.forEach((placement, index) => {
    const dir = placement.isLeft ? 1 : -1;
    const halfD = rackDepth * 0.5;

    dummy.position.set(placement.x, rackHeight * 0.5, placement.z);
    dummy.rotation.set(0, placement.isLeft ? 0 : Math.PI, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    rackBodyInst.setMatrixAt(index, dummy.matrix);

    dummy.position.set(
      placement.x + dir * (halfD + 0.05),
      rackHeight * 0.5,
      placement.z
    );
    dummy.rotation.set(0, placement.isLeft ? Math.PI / 2 : -Math.PI / 2, 0);
    dummy.updateMatrix();
    rackFaceInst.setMatrixAt(index, dummy.matrix);

    dummy.position.set(
      placement.x + dir * (halfD + 0.35),
      rackHeight * 0.5,
      placement.z
    );
    dummy.updateMatrix();
    rackDoorInst.setMatrixAt(index, dummy.matrix);
  });

  [rackBodyInst, rackFaceInst, rackDoorInst].forEach((inst) => {
    inst.instanceMatrix.setUsage(T.StaticDrawUsage);
    inst.instanceMatrix.needsUpdate = true;
  });

  roomGroup.add(rackBodyInst);
  roomGroup.add(rackFaceInst);
  roomGroup.add(rackDoorInst);

  // Merge all 17 rack plaques into one mesh sharing a single atlas texture.
  const plaqueAtlas = createRackPlaqueAtlasTexture(
    T,
    standardRackPlacements.map((placement) => placement.label)
  );
  if (plaqueAtlas) {
    const atlasCols = 4;
    const atlasRows = Math.max(1, Math.ceil(standardRackCount / atlasCols));
    const plaqueGeometries = standardRackPlacements.map((placement, index) => {
      const col = index % atlasCols;
      const row = Math.floor(index / atlasCols);
      const u0 = (col + 0.012) / atlasCols;
      const u1 = (col + 0.988) / atlasCols;
      const v1 = 1 - (row + 0.02) / atlasRows;
      const v0 = 1 - (row + 0.98) / atlasRows;

      const geometry = new T.PlaneGeometry(6.4, 1.6);
      geometry.rotateY(placement.isLeft ? Math.PI / 2 : -Math.PI / 2);
      geometry.translate(
        placement.x + (placement.isLeft ? 1 : -1) * (rackDepth * 0.5 + 0.12),
        rackHeight - 0.7,
        placement.z
      );

      const uv = geometry.attributes.uv;
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(
          i,
          u0 + uv.getX(i) * (u1 - u0),
          v0 + uv.getY(i) * (v1 - v0)
        );
      }
      return geometry;
    });

    const mergedPlaques = mergeGeometries(plaqueGeometries, false);
    plaqueGeometries.forEach((geometry) => geometry.dispose());
    if (mergedPlaques) {
      const plaqueMesh = new T.Mesh(
        mergedPlaques,
        new T.MeshBasicMaterial({ map: plaqueAtlas })
      );
      plaqueMesh.name = "StandardRackPlaques";
      roomGroup.add(plaqueMesh);
    }
  }

  // Hero rack remains fully articulated and individually authored.
  roomGroup.add(
    buildHeroRack(
      leftTrayX,
      heroZ,
      `A${String(heroRackIndex + 1).padStart(2, "0")}`
    )
  );

  // Rack-top status light strips (one draw call for all 18 cabinets).
  const rackTopPlacements = standardRackPlacements
    .map((placement) => ({ x: placement.x, z: placement.z }))
    .concat([{ x: leftTrayX, z: heroZ }]);
  const rackTopInst = new T.InstancedMesh(
    new T.BoxGeometry(0.32, 0.2, 13.5),
    materials.ledGreen,
    rackTopPlacements.length
  );
  rackTopPlacements.forEach((placement, index) => {
    dummy.position.set(placement.x, rackHeight + 0.16, placement.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    rackTopInst.setMatrixAt(index, dummy.matrix);
  });
  rackTopInst.instanceMatrix.setUsage(T.StaticDrawUsage);
  rackTopInst.instanceMatrix.needsUpdate = true;
  roomGroup.add(rackTopInst);

  // -------------------------------------------------------------------------
  // 6. Facility Environmental Detail (wayfinding, telemetry, accent lighting)
  // -------------------------------------------------------------------------

  const detailGroup = new T.Group();
  detailGroup.name = "FacilityDetail";
  roomGroup.add(detailGroup);

  // NVIDIA-green aisle boundary lines
  const aisleLineGeo = new T.BoxGeometry(0.4, 0.05, aisleRun);
  [-1, 1].forEach((side) => {
    const line = new T.Mesh(aisleLineGeo, materials.markingStrip);
    line.position.set(side * (aisleWidth * 0.5 - 1.7), 0.045, 0);
    detailGroup.add(line);
  });

  // Hazard threshold band in front of the containment portal
  const hazardTexture = createHazardStripeTexture(T);
  if (hazardTexture) {
    const hazardBand = new T.Mesh(
      new T.PlaneGeometry(aisleWidth - 1.5, 3.2),
      new T.MeshStandardMaterial({
        map: hazardTexture,
        roughness: 0.58,
        metalness: 0.08,
      })
    );
    hazardBand.rotation.x = -Math.PI / 2;
    hazardBand.position.set(0, 0.065, -120.4);
    detailGroup.add(hazardBand);
  }

  // Repeating cold-aisle floor direction arrows
  const arrowTexture = createFloorArrowTexture(T);
  if (arrowTexture) {
    const arrowMaterial = new T.MeshBasicMaterial({
      map: arrowTexture,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
    });
    const arrowInst = new T.InstancedMesh(
      new T.PlaneGeometry(8.5, 17.0),
      arrowMaterial,
      4
    );
    [-92, -36, 20, 76].forEach((z, index) => {
      dummy.position.set(0, 0.075, z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      arrowInst.setMatrixAt(index, dummy.matrix);
    });
    arrowInst.instanceMatrix.setUsage(T.StaticDrawUsage);
    arrowInst.instanceMatrix.needsUpdate = true;
    arrowInst.renderOrder = 2;
    detailGroup.add(arrowInst);
  }

  // Side-wall pilasters and a continuous accent stripe
  const pilasterInst = new T.InstancedMesh(
    new T.BoxGeometry(1.1, roomHeight, 1.6),
    materials.wallPilaster,
    16
  );
  let pilasterIndex = 0;
  for (let side = -1; side <= 1; side += 2) {
    for (let k = 0; k < 8; k++) {
      dummy.position.set(
        side * (roomWidth * 0.5 - 0.55),
        roomHeight * 0.5,
        -140 + k * 40
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      pilasterInst.setMatrixAt(pilasterIndex++, dummy.matrix);
    }
  }
  pilasterInst.instanceMatrix.setUsage(T.StaticDrawUsage);
  pilasterInst.instanceMatrix.needsUpdate = true;
  detailGroup.add(pilasterInst);

  const wallStripeGeo = new T.BoxGeometry(0.2, 0.7, roomLength - 40);
  [-1, 1].forEach((side) => {
    const stripe = new T.Mesh(wallStripeGeo, materials.accentStrip);
    stripe.position.set(side * (roomWidth * 0.5 - 0.28), 60, 0);
    detailGroup.add(stripe);
  });

  // Containment roof accent strips
  const roofStripGeo = new T.BoxGeometry(0.22, 0.16, roomLength - 68);
  [-1, 1].forEach((side) => {
    const strip = new T.Mesh(roofStripGeo, materials.accentStrip);
    strip.position.set(side * (aisleWidth * 0.5 - 0.3), rackHeight + 0.34, 0);
    detailGroup.add(strip);
  });

  // Back-wall telemetry displays (power + thermal)
  [
    { kind: "power", x: -20 },
    { kind: "thermal", x: 20 },
  ].forEach((display) => {
    const texture = createStatusDisplayTexture(T, display.kind);
    const frame = new T.Mesh(
      new T.BoxGeometry(21, 11.6, 0.9),
      materials.statusFrame
    );
    frame.position.set(display.x, 66.5, -roomLength * 0.5 + 0.55);
    detailGroup.add(frame);

    if (texture) {
      const screen = new T.Mesh(
        new T.PlaneGeometry(19.9, 10.5),
        new T.MeshBasicMaterial({ map: texture, fog: false })
      );
      screen.position.set(display.x, 66.5, -roomLength * 0.5 + 1.05);
      detailGroup.add(screen);
    }
  });

  // Illuminated aisle sign above the portal
  const aisleSignTexture = createAisleSignTexture(T, "AISLE 04");
  if (aisleSignTexture) {
    const aisleSign = new T.Mesh(
      new T.PlaneGeometry(13.5, 3.4),
      new T.MeshBasicMaterial({ map: aisleSignTexture, fog: false })
    );
    aisleSign.position.set(0, 80.3, -125.4);
    detailGroup.add(aisleSign);
  }

  // Animated fiber/data motes running along both overhead cable ladders
  const moteCount = 16;
  const moteInst = new T.InstancedMesh(
    new T.BoxGeometry(0.5, 0.3, 0.9),
    materials.dataMote,
    moteCount
  );
  moteInst.name = "CableDataMotes";
  moteInst.instanceMatrix.setUsage(T.DynamicDrawUsage);
  detailGroup.add(moteInst);

  const moteSpan = roomLength - 52;
  const motes = [];
  for (let m = 0; m < moteCount; m++) {
    const onLeft = m % 2 === 0;
    const lane = m % 4 < 2 ? -2.4 : 1.4;
    motes.push({
      x: (onLeft ? leftTrayX : rightTrayX) + lane,
      y: trayY + 0.86 + (m % 3) * 0.14,
      offset: (m / moteCount) * moteSpan + Math.random() * 12,
      speed: 15 + (m % 5) * 4.5,
    });
  }

  // -------------------------------------------------------------------------
  // 7. Blender-authored Facility Support Equipment (CDU / PDU / CRAC)
  // -------------------------------------------------------------------------

  // Support-hall floor inlay and illuminated perimeter
  const hallInlay = new T.Mesh(
    new T.PlaneGeometry(128, 80),
    new T.MeshStandardMaterial({
      color: 0x232c36,
      roughness: 0.42,
      metalness: 0.22,
      envMapIntensity: 0.5,
    })
  );
  hallInlay.rotation.x = -Math.PI / 2;
  hallInlay.position.set(0, 0.05, -168);
  detailGroup.add(hallInlay);

  [-1, 1].forEach((side) => {
    const longEdge = new T.Mesh(
      new T.BoxGeometry(0.35, 0.06, 80),
      materials.accentStrip
    );
    longEdge.position.set(side * 64, 0.09, -168);
    detailGroup.add(longEdge);

    const shortEdge = new T.Mesh(
      new T.BoxGeometry(128, 0.06, 0.35),
      materials.accentStrip
    );
    shortEdge.position.set(0, 0.09, -168 + side * 40);
    detailGroup.add(shortEdge);
  });

  // Illuminated walkway edges and service crossings define the hall floor
  // plane so the support equipment never reads as floating in a void.
  [-14, 14].forEach((x) => {
    const walkway = new T.Mesh(
      new T.BoxGeometry(0.3, 0.05, 70),
      materials.markingStrip
    );
    walkway.position.set(x, 0.1, -170);
    detailGroup.add(walkway);
  });
  [-138, -186].forEach((z) => {
    const crossing = new T.Mesh(
      new T.BoxGeometry(70, 0.05, 0.3),
      materials.markingStrip
    );
    crossing.position.set(0, 0.1, z);
    detailGroup.add(crossing);
  });

  // Overhead coolant mains with drops into the CRAC bank
  const coolantRed = new T.MeshStandardMaterial({
    color: 0x8f2f2f,
    roughness: 0.36,
    metalness: 0.72,
  });
  const coolantBlue = new T.MeshStandardMaterial({
    color: 0x1f5f8c,
    roughness: 0.36,
    metalness: 0.72,
  });
  [
    { y: 84.0, material: coolantRed },
    { y: 79.4, material: coolantBlue },
  ].forEach((pipeSpec) => {
    const main = new T.Mesh(
      new T.CylinderGeometry(1.15, 1.15, 150, 12),
      pipeSpec.material
    );
    main.rotation.z = Math.PI / 2;
    main.position.set(0, pipeSpec.y, -168);
    detailGroup.add(main);
  });
  // The Blender CRAC assets already carry their own supply/return risers, so
  // the overhead mains simply run above the bank.

  // Support-hall ceiling structure and hanging light bars
  const hallBeamGeo = new T.BoxGeometry(126, 0.7, 0.6);
  const hallTrofferGeo = new T.BoxGeometry(10.5, 0.18, 1.0);
  [-140, -168, -196].forEach((z) => {
    const beam = new T.Mesh(hallBeamGeo, materials.aluminumFrame);
    beam.position.set(0, 89.5, z);
    detailGroup.add(beam);

    const troffer = new T.Mesh(hallTrofferGeo, materials.trofferLight);
    troffer.position.set(0, 89.1, z);
    detailGroup.add(troffer);
  });

  const hangingBarGeo = new T.BoxGeometry(15, 0.35, 0.9);
  [-148, -184].forEach((z) => {
    const bar = new T.Mesh(hangingBarGeo, materials.trofferLight);
    bar.position.set(0, 74, z);
    detailGroup.add(bar);
  });

  // Back-wall light blades frame the equipment gallery outside the
  // telemetry display footprint.
  [-35, 35].forEach((x) => {
    const blade = new T.Mesh(
      new T.BoxGeometry(0.55, 72, 0.28),
      new T.MeshBasicMaterial({ color: 0x9bd426, fog: false })
    );
    blade.position.set(x, 36, -roomLength * 0.5 + 0.6);
    detailGroup.add(blade);
  });

  const supportGroup = new T.Group();
  supportGroup.name = "FacilitySupportEquipment";
  roomGroup.add(supportGroup);

  // Support-hall lighting (unshadowed points keep the 60 FPS budget intact)
  const hallKeyLight = new T.PointLight(0xcfe4ff, 900, 170, 2);
  hallKeyLight.position.set(0, 66, -152);
  roomGroup.add(hallKeyLight);

  const hallFillLight = new T.PointLight(0xffffff, 620, 150, 2);
  hallFillLight.position.set(0, 52, -188);
  roomGroup.add(hallFillLight);

  // Wash lights above the CRAC bank so the Blender assets read through glass.
  [-30, 30].forEach((x) => {
    const wash = new T.PointLight(0xdfeeff, 520, 82, 2);
    wash.position.set(x, 54, -156);
    roomGroup.add(wash);
  });

  const hallAccentLight = new T.PointLight(0x76b900, 170, 62, 2);
  hallAccentLight.position.set(0, 10, -150);
  roomGroup.add(hallAccentLight);

  // Localized fill for the hero cabinet so A04's open face and extended tray
  // read from the cold aisle without flattening the rest of the row.
  const heroRackLight = new T.PointLight(0xdcecff, 300, 64, 2);
  heroRackLight.position.set(-2, 52, heroZ);
  roomGroup.add(heroRackLight);

  const supportPlacements = [
    // Row-end CDUs in the side aisles, facing the cold aisle
    { asset: "cdu", x: -57, z: -112, rotY: Math.PI / 2, scale: 22 },
    { asset: "cdu", x: 57, z: -112, rotY: -Math.PI / 2, scale: 22 },
    // CRAC pair flanks the central gallery, angled slightly toward the aisle
    { asset: "crac", x: -30, z: -168, rotY: 0.16, scale: 19 },
    { asset: "crac", x: 30, z: -168, rotY: -0.16, scale: 19 },
    // Matched switchgear lineup closes the corridor; the seam sits behind
    // the containment door mullion so it reads as one continuous wall.
    { asset: "pdu", x: -7, z: -202, rotY: 0, scale: 16 },
    { asset: "pdu", x: 7, z: -202, rotY: 0, scale: 16 },
    // Coolant distribution units line the hall's side walls
    { asset: "cdu", x: -47, z: -188, rotY: Math.PI / 2, scale: 20 },
    { asset: "cdu", x: 47, z: -188, rotY: -Math.PI / 2, scale: 20 },
    // Side-aisle PDUs along the length of the pod
    { asset: "pdu", x: -57, z: -84, rotY: Math.PI / 2, scale: 22 },
    { asset: "pdu", x: 57, z: -84, rotY: -Math.PI / 2, scale: 22 },
    { asset: "pdu", x: -57, z: 0, rotY: Math.PI / 2, scale: 22 },
    { asset: "pdu", x: 57, z: 0, rotY: -Math.PI / 2, scale: 22 },
    { asset: "pdu", x: -57, z: 84, rotY: Math.PI / 2, scale: 22 },
    { asset: "pdu", x: 57, z: 84, rotY: -Math.PI / 2, scale: 22 },
  ];

  const assetUrls = {
    cdu: new URL("./assets/cdu.glb", import.meta.url).href,
    pdu: new URL("./assets/pdu.glb", import.meta.url).href,
    crac: new URL("./assets/crac.glb", import.meta.url).href,
    workstation: new URL("./assets/lab_workstation.glb", import.meta.url).href,
    keyboard: new URL("./assets/gaming_keyboard.glb", import.meta.url).href,
    player: new URL("./assets/player_model.glb", import.meta.url).href,
    pedestal: new URL("./assets/gpu_core_pedestal.glb", import.meta.url).href,
  };

  // -------------------------------------------------------------------------
  // 7b. Creative Computer & Gaming Lab Observation Wing (Z = +126 to +210)
  // -------------------------------------------------------------------------
  const labGroup = new T.Group();
  labGroup.name = "ComputerLabWing";
  roomGroup.add(labGroup);

  // Dark anti-static Lab Observation Deck floor covering Z = +126..+208
  const labDeck = new T.Mesh(
    new T.PlaneGeometry(roomWidth - 4, 82),
    new T.MeshStandardMaterial({
      color: 0x161c24,
      roughness: 0.28,
      metalness: 0.25,
      envMapIntensity: 0.65,
    })
  );
  labDeck.rotation.x = -Math.PI / 2;
  labDeck.position.set(0, 0.06, 167);
  labDeck.receiveShadow = true;
  labGroup.add(labDeck);

  // Glowing NVIDIA-green & cyan walkway runway strips leading from Desk to Aisle 04
  [-16.5, 16.5].forEach((rx) => {
    const runwayLine = new T.Mesh(
      new T.BoxGeometry(0.32, 0.06, 40),
      materials.accentStrip
    );
    runwayLine.position.set(rx, 0.075, 146);
    labGroup.add(runwayLine);
  });

  // Lab perimeter floor light trim
  [-66, 66].forEach((sideX) => {
    const edge = new T.Mesh(
      new T.BoxGeometry(0.35, 0.06, 78),
      materials.markingStrip
    );
    edge.position.set(sideX, 0.075, 167);
    labGroup.add(edge);
  });

  // Panoramic Glass Partition Wall at Z = +126 separating Lab from Aisle 04
  const frontPortal = new T.Group();
  frontPortal.position.set(0, 0, 126);
  labGroup.add(frontPortal);

  // Overhead Portal Beam & Green Edge Light
  const frontHeader = new T.Mesh(
    new T.BoxGeometry(roomWidth - 4, 3.2, 1.8),
    materials.aluminumFrame
  );
  frontHeader.position.set(0, rackHeight - 0.8, 0);
  frontPortal.add(frontHeader);

  const frontHeaderGlow = new T.Mesh(
    new T.BoxGeometry(roomWidth - 6, 0.35, 0.24),
    materials.accentStrip
  );
  frontHeaderGlow.position.set(0, rackHeight - 2.4, 0.95);
  frontPortal.add(frontHeaderGlow);

  // Left & Right Brushed Titanium "RTX AI SUPERPOD" Pylons framing the open aisle portal
  const pylonTex = createPodPylonTexture(T);
  const pylonFaceMat = pylonTex
    ? new T.MeshStandardMaterial({ map: pylonTex, roughness: 0.32, metalness: 0.65 })
    : materials.chassisFace;

  [-31, 31].forEach((px) => {
    const pylon = new T.Mesh(
      new T.BoxGeometry(24.0, rackHeight - 2.4, 2.2),
      materials.rackFrame
    );
    pylon.position.set(px, (rackHeight - 2.4) * 0.5, 0);
    frontPortal.add(pylon);

    const pylonFace = new T.Mesh(
      new T.PlaneGeometry(23.2, rackHeight - 3.4),
      pylonFaceMat
    );
    pylonFace.position.set(px, (rackHeight - 2.4) * 0.5, 1.15);
    frontPortal.add(pylonFace);
  });

  // Side Panoramic Glass Windows (X = -68..-43 and +43..+68)
  [-56, 56].forEach((wx) => {
    const winGlass = new T.Mesh(
      new T.BoxGeometry(25.0, rackHeight - 4.0, 0.32),
      materials.containmentGlass
    );
    winGlass.position.set(wx, (rackHeight - 4.0) * 0.5, 0);
    frontPortal.add(winGlass);

    const mullion = new T.Mesh(
      new T.BoxGeometry(0.8, rackHeight - 2.4, 1.2),
      materials.rackFrame
    );
    mullion.position.set(wx + (wx < 0 ? -12.6 : 12.6), (rackHeight - 2.4) * 0.5, 0);
    frontPortal.add(mullion);
  });

  // Open Sliding Glass Door Leaves tucked to the sides (leaving X = -18..+18 wide open!)
  [-21.5, 21.5].forEach((dx) => {
    const openDoor = new T.Mesh(
      new T.BoxGeometry(10.0, rackHeight - 4.0, 0.25),
      materials.containmentGlass
    );
    openDoor.position.set(dx, (rackHeight - 4.0) * 0.5, 1.6);
    frontPortal.add(openDoor);

    const edgeStile = new T.Mesh(
      new T.BoxGeometry(0.65, rackHeight - 4.0, 0.5),
      materials.aluminumFrame
    );
    edgeStile.position.set(dx + (dx < 0 ? 5.0 : -5.0), (rackHeight - 4.0) * 0.5, 1.6);
    frontPortal.add(edgeStile);
  });

  // Lab Portal Header Sign facing Lab (+Z)
  const labPortalSignTex = createAisleSignTexture(T, "AISLE 04");
  if (labPortalSignTex) {
    const labPortalSign = new T.Mesh(
      new T.PlaneGeometry(14.5, 3.6),
      new T.MeshBasicMaterial({ map: labPortalSignTex, fog: false })
    );
    labPortalSign.position.set(0, rackHeight - 0.6, 1.15);
    frontPortal.add(labPortalSign);
  }

  // Suspended Architectural Studio Halo Ring above the Command Desk
  const haloRing = new T.Mesh(
    new T.TorusGeometry(28.0, 0.75, 12, 48),
    materials.trofferLight
  );
  haloRing.rotation.x = Math.PI / 2;
  haloRing.position.set(0, 79.0, 166.0);
  labGroup.add(haloRing);

  const haloTrim = new T.Mesh(
    new T.TorusGeometry(29.2, 0.25, 8, 48),
    materials.accentStrip
  );
  haloTrim.rotation.x = Math.PI / 2;
  haloTrim.position.set(0, 78.6, 166.0);
  labGroup.add(haloTrim);

  // Side Wall Illuminated Concept & Circuit Artwork Lightboxes (from image-generator!)
  const artLoader = new T.TextureLoader();
  [
    { url: "./assets/lab_concept_vision.jpg", x: -roomWidth * 0.5 + 1.0, rotY: Math.PI / 2, z: 166 },
    { url: "./assets/lab_deskmat_art.jpg", x: roomWidth * 0.5 - 1.0, rotY: -Math.PI / 2, z: 166 },
  ].forEach((mural) => {
    const frame = new T.Mesh(
      new T.BoxGeometry(44.0, 24.5, 1.0),
      materials.statusFrame
    );
    frame.rotation.y = mural.rotY;
    frame.position.set(mural.x, 42.0, mural.z);
    labGroup.add(frame);

    artLoader.load(mural.url, (tex) => {
      tex.colorSpace = T.SRGBColorSpace;
      const artPlane = new T.Mesh(
        new T.PlaneGeometry(42.2, 22.8),
        new T.MeshBasicMaterial({ map: tex })
      );
      artPlane.rotation.y = mural.rotY;
      artPlane.position.set(mural.x + (mural.x < 0 ? 0.65 : -0.65), 42.0, mural.z);
      labGroup.add(artPlane);
    });
  });

  // Lab Lighting Rig (unshadowed studio points for locked 60 FPS)
  const labOverheadLight = new T.PointLight(0xf6f9ff, 1450, 175, 2);
  labOverheadLight.position.set(0, 72, 166);
  labGroup.add(labOverheadLight);

  const labMonitorFill = new T.PointLight(0x9be8ff, 340, 80, 2);
  labMonitorFill.position.set(-2, 42, 178);
  labGroup.add(labMonitorFill);

  const labAccentGlow = new T.PointLight(0x76b900, 220, 75, 2);
  labAccentGlow.position.set(0, 18, 144);
  labGroup.add(labAccentGlow);

  // Interactive Lab & Player State
  const WORLD_METER_SCALE = 34.0;
  const workstationPos = new T.Vector3(0, 0, 164.0);
  const keyboardMountPos = new T.Vector3(-3.4, 25.84, 168.08);
  const pedestalSpinners = [];
  const keyboardKeysMap = new Map();
  let keyboardHitProxy = null;
  let workstationHitProxy = null;

  const playerRig = {
    root: null,
    pelvis: null,
    torso: null,
    head: null,
    armL: null,
    armR: null,
    legL: null,
    legR: null,
    hitProxy: null,
    pos: new T.Vector3(45.0, 0.0, 166.0),
    rotY: Math.PI * 0.80,
    walkPhase: 0.0,
    isMoving: false,
  };

  // O(1) Click Hit Proxy on the Gaming Keyboard so users can click it to zoom in
  keyboardHitProxy = new T.Mesh(
    new T.BoxGeometry(14.5, 4.5, 8.5),
    new T.MeshBasicMaterial({ visible: false })
  );
  keyboardHitProxy.position.set(keyboardMountPos.x, keyboardMountPos.y + 1.5, keyboardMountPos.z);
  keyboardHitProxy.name = "GamingKeyboardHitProxy";
  labGroup.add(keyboardHitProxy);

  workstationHitProxy = new T.Mesh(
    new T.BoxGeometry(72.0, 48.0, 32.0),
    new T.MeshBasicMaterial({ visible: false })
  );
  workstationHitProxy.position.set(workstationPos.x, 24.0, workstationPos.z);
  workstationHitProxy.name = "LabWorkstationHitProxy";
  labGroup.add(workstationHitProxy);

  const supportLoader = new GLTFLoader();
  const tunedSupportMaterials = new Set();
  let pendingSupportAssets = Object.keys(assetUrls).length;
  let resolveAssetsReady = null;
  const assetsReady = new Promise((resolve) => {
    resolveAssetsReady = resolve;
  });

  function finishSupportAsset() {
    pendingSupportAssets -= 1;
    if (pendingSupportAssets <= 0 && resolveAssetsReady) {
      resolveAssetsReady();
      resolveAssetsReady = null;
    }
  }

  function tuneSupportMaterial(material) {
    if (!material || tunedSupportMaterials.has(material)) return;
    tunedSupportMaterials.add(material);

    if ("envMapIntensity" in material) {
      material.envMapIntensity = 0.7;
    }

    // The Blender assets ship with near-black graphite shells tuned for a
    // bright studio. Lift them so the support hall reads under dark haze.
    const name = (material.name || "").toLowerCase();
    if (name.includes("graphite")) {
      if (material.color) material.color.setHex(0x39424f);
      if ("metalness" in material) material.metalness = 0.55;
      if ("roughness" in material) material.roughness = 0.46;
    } else if (name.includes("dark_panel") || name.includes("dark panel")) {
      if (material.color) material.color.setHex(0x1b222c);
      if ("roughness" in material) material.roughness = 0.58;
    } else if (name.includes("panel_metal") || name.includes("panel metal")) {
      if (material.color) material.color.setHex(0x2b3542);
      if ("roughness" in material) material.roughness = 0.5;
    } else if (name.includes("brushed")) {
      if (material.color) material.color.setHex(0x8d97a4);
      if ("metalness" in material) material.metalness = 0.72;
      if ("roughness" in material) material.roughness = 0.34;
    } else if (name.includes("polished")) {
      if (material.color) material.color.setHex(0xb9c2cc);
      if ("metalness" in material) material.metalness = 0.85;
      if ("roughness" in material) material.roughness = 0.26;
    } else if (name.includes("screen")) {
      if (material.color) material.color.setHex(0x0b141d);
      if (material.emissive) material.emissive.setHex(0x0e2436);
      if ("emissiveIntensity" in material) material.emissiveIntensity = 0.9;
    } else if (name.includes("label")) {
      if ("emissiveIntensity" in material) material.emissiveIntensity = 1.1;
    } else if (name.includes("emissive")) {
      if ("emissiveIntensity" in material) material.emissiveIntensity = 2.0;
    } else if (name.includes("safety")) {
      if ("emissiveIntensity" in material) material.emissiveIntensity = 1.2;
    }
  }

  function placeSupportAsset(assetKey, template) {
    supportPlacements
      .filter((placement) => placement.asset === assetKey)
      .forEach((placement) => {
        const model = template.clone(true);
        const scale = placement.scale || 16;
        model.scale.setScalar(scale);
        model.updateMatrixWorld(true);

        const bounds = new T.Box3().setFromObject(model);
        const center = bounds.getCenter(new T.Vector3());
        const size = bounds.getSize(new T.Vector3());
        model.position.set(-center.x, -bounds.min.y, -center.z);

        model.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = false;
          child.receiveShadow = false;
          if (child.material) {
            const mats = Array.isArray(child.material)
              ? child.material
              : [child.material];
            mats.forEach(tuneSupportMaterial);
          }
        });

        const holder = new T.Group();
        holder.name = `Support_${assetKey.toUpperCase()}`;
        holder.position.set(placement.x, 0, placement.z);
        holder.rotation.y = placement.rotY || 0;
        holder.add(model);

        // Small status beacon on the equipment face
        const beacon = new T.Mesh(
          new T.BoxGeometry(1.1, 0.45, 0.18),
          materials.statusBeacon
        );
        beacon.position.set(
          size.x * 0.3,
          size.y * 0.68,
          size.z * 0.5 + 0.08
        );
        holder.add(beacon);

        supportGroup.add(holder);
      });
  }

  function placeCustomLabAsset(assetKey, gltfScene) {
    if (assetKey === "workstation") {
      const ws = gltfScene;
      ws.name = "Blender_LabWorkstation";
      ws.scale.setScalar(WORLD_METER_SCALE);
      ws.position.copy(workstationPos);
      ws.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        if ("envMapIntensity" in child.material) {
          child.material.envMapIntensity = 0.72;
        }
      });
      labGroup.add(ws);
      return;
    }

    if (assetKey === "keyboard") {
      const kb = gltfScene;
      kb.name = "Blender_GamingKeyboard";
      kb.scale.setScalar(WORLD_METER_SCALE * 1.05);
      kb.position.copy(keyboardMountPos);
      kb.traverse((child) => {
        if (!child.isMesh) return;
        if (child.name && child.name.startsWith("Key_")) {
          // Strip optional _Mesh suffix from Blender object/mesh naming
          const rawKey = child.name.replace(/_Mesh$/, "");
          // Clone material per keycap so individual key press RGB flash works cleanly
          child.material = child.material.clone();
          keyboardKeysMap.set(rawKey, {
            mesh: child,
            baseY: child.position.y,
            pressProgress: 0.0,
            isDown: false,
            origEmissive: child.material.emissive ? child.material.emissive.clone() : new T.Color(0x000000),
            origEmissiveInt: child.material.emissiveIntensity || 0.0,
          });
        }
      });
      labGroup.add(kb);
      return;
    }

    if (assetKey === "player") {
      const pl = gltfScene;
      pl.name = "Blender_PlayerAvatar";
      pl.scale.setScalar(29.0);
      pl.position.copy(playerRig.pos);
      pl.rotation.y = playerRig.rotY;

      pl.traverse((obj) => {
        if (obj.name === "Player_Pelvis") playerRig.pelvis = obj;
        else if (obj.name === "Player_Torso") playerRig.torso = obj;
        else if (obj.name === "Player_Head") playerRig.head = obj;
        else if (obj.name === "Player_Arm_L") playerRig.armL = obj;
        else if (obj.name === "Player_Arm_R") playerRig.armR = obj;
        else if (obj.name === "Player_Leg_L") playerRig.legL = obj;
        else if (obj.name === "Player_Leg_R") playerRig.legR = obj;
      });
      if (playerRig.pelvis) {
        playerRig.pelvisBaseY = playerRig.pelvis.position.y;
      }
      playerRig.root = pl;

      const pHit = new T.Mesh(
        new T.BoxGeometry(0.65, 1.85, 0.55),
        new T.MeshBasicMaterial({ visible: false })
      );
      pHit.position.set(0, 0.92, 0);
      pHit.name = "PlayerAvatarHitProxy";
      pl.add(pHit);
      playerRig.hitProxy = pHit;

      labGroup.add(pl);
      return;
    }

    if (assetKey === "pedestal") {
      [
        { x: -31.0, z: 142.0, rotY: 0.35 },
        { x: 31.0, z: 142.0, rotY: -0.35 },
      ].forEach((p, idx) => {
        const ped = gltfScene.clone(true);
        ped.name = `Blender_GpuCorePedestal_${idx}`;
        ped.scale.setScalar(WORLD_METER_SCALE);
        ped.position.set(p.x, 0, p.z);
        ped.rotation.y = p.rotY;
        ped.traverse((obj) => {
          if (obj.name === "Pedestal_Core_Spinner") {
            pedestalSpinners.push({
              obj,
              baseY: obj.position.y,
              phaseOffset: idx * Math.PI * 0.7,
            });
          }
        });
        labGroup.add(ped);
      });
    }
  }

  Object.entries(assetUrls).forEach(([assetKey, url]) => {
    supportLoader.load(
      url,
      (gltf) => {
        if (["workstation", "keyboard", "player", "pedestal"].includes(assetKey)) {
          placeCustomLabAsset(assetKey, gltf.scene);
        } else {
          placeSupportAsset(assetKey, gltf.scene);
        }
        finishSupportAsset();
      },
      undefined,
      (error) => {
        console.warn(`[serverRoom] Failed to load ${assetKey}.glb`, error);
        finishSupportAsset();
      }
    );
  });

  // -------------------------------------------------------------------------
  // 8. Camera Presets
  // -------------------------------------------------------------------------

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
      // Diagonal hero shot centered on A04, far enough for the full cabinet
      // while the lit identity columns and open face still read.
      position: new T.Vector3(12.0, 46.0, heroZ + 80.0),
      target: new T.Vector3(heroFrontX - 2.0, 40.0, heroZ),
      fov: 44,
      minDistance: 3,
      maxDistance: 140,
    },
    rackFront: {
      // Medium three-quarter portrait: the open 4U face fills the height while
      // the support hall and lit floor keep the facility context.
      position: new T.Vector3(16.0, 44.0, heroZ + 22.0),
      target: new T.Vector3(heroFrontX, 39.0, heroZ),
      fov: 70,
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
    lab: {
      // Wide elevated architectural view showing full Desk, Keyboard, Triple Monitors,
      // Panoramic Glass PC Tower, Gaming Chair, Player Avatar, Cryo Pedestals & Aisle 04.
      position: new T.Vector3(-12.0, 56.0, 206.0),
      target: new T.Vector3(4.0, 26.0, 118.0),
      fov: 54,
      minDistance: 6,
      maxDistance: 190,
    },
    keyboard: {
      // Macro showcase framing the Blender-authored 3D mechanical gaming keyboard + coiled cable + wrist rest
      position: new T.Vector3(-4.2, 36.8, 181.2),
      target: new T.Vector3(-3.4, 26.2, 168.1),
      fov: 35,
      minDistance: 3.5,
      maxDistance: 60,
    },
    computer: {
      // Unobstructed showcase framing the panoramic glass liquid-cooled PC rig & triple monitors
      position: new T.Vector3(10.0, 39.0, 186.0),
      target: new T.Vector3(24.5, 32.5, 164.5),
      fov: 38,
      minDistance: 5.0,
      maxDistance: 90,
    },
    player: {
      position: new T.Vector3(45.0, 54.0, 206.0),
      target: new T.Vector3(45.0, 30.0, 166.0),
      fov: 48,
      minDistance: 20,
      maxDistance: 120,
    },
  };

  // -------------------------------------------------------------------------
  // 9. Public Methods & Animation Loop
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
    if (key.includes("key")) return cameraPresets.keyboard;
    if (key.includes("comp") || key.includes("pc")) return cameraPresets.computer;
    if (key.includes("play") || key.includes("walk")) return cameraPresets.player;
    if (key.includes("lab")) return cameraPresets.lab;
    if (key.includes("fac") || key.includes("aisle") || key.includes("default")) {
      return cameraPresets.facility;
    }
    if (key.includes("top")) return cameraPresets.bladeTopDown;
    if (key.includes("blade") || key.includes("tray") || key.includes("sled")) {
      return cameraPresets.blade;
    }
    if (key.includes("gpu") || key.includes("inspect")) return cameraPresets.gpu;
    if (key.includes("front")) return cameraPresets.rackFront;
    if (key.includes("rack")) return cameraPresets.rack;
    if (key.includes("fly")) return cameraPresets.flythrough;
    return cameraPresets[name] || cameraPresets.facility;
  }

  function triggerKeyPress(code, isDown) {
    const mapCode = {
      KeyW: "Key_W", KeyA: "Key_A", KeyS: "Key_S", KeyD: "Key_D",
      KeyE: "Key_E", KeyR: "Key_R", KeyT: "Key_T", KeyM: "Key_M",
      KeyO: "Key_O", KeyQ: "Key_Q", KeyF: "Key_F", KeyC: "Key_C",
      Space: "Key_Space", Enter: "Key_Enter", Escape: "Key_Esc",
      ArrowUp: "Key_Up", ArrowDown: "Key_Down", ArrowLeft: "Key_Left", ArrowRight: "Key_Right",
      Digit1: "Key_1", Digit2: "Key_2", Digit3: "Key_3", Digit4: "Key_4",
      Digit5: "Key_5", Digit6: "Key_6", Digit7: "Key_7", Digit8: "Key_8",
    };
    const keyName = mapCode[code] || code;
    const entry = keyboardKeysMap.get(keyName);
    if (entry) entry.isDown = Boolean(isDown);
  }

  function clampPlayerPosition(nx, nz) {
    // Allow walking smoothly inside the Lab Deck (Z: +126..+202) and down Aisle 04 (Z: -195..+126)
    let x = nx;
    let z = Math.max(-192, Math.min(200, nz));

    if (z <= 127.0) {
      // Inside Aisle 04 / Glass Portal / Support Hall
      x = Math.max(-13.5, Math.min(13.5, x));
      // Avoid clipping into Hero Tray when extended into aisle
      if (currentTrayFactor > 0.35 && z > heroZ - 12.5 && z < heroZ + 12.5 && x < -4.0) {
        x = -4.0;
      }
    } else {
      // Inside Computer Lab Observation Wing
      x = Math.max(-60.0, Math.min(60.0, x));
      // Desk + Chair collision box around X in [-38..38], Z in [147..196]
      if (Math.abs(x) < 38.0 && z > 147.0 && z < 196.0) {
        const dxEdge = 38.0 - Math.abs(x);
        const dzFront = z - 147.0;
        const dzBack = 196.0 - z;
        if (dxEdge < dzFront && dxEdge < dzBack) {
          x = x >= 0 ? 38.0 : -38.0;
        } else if (dzFront < dzBack) {
          z = 147.0;
        } else {
          z = 196.0;
        }
      }
      // Cryo Core Pedestal collision circles at (+-31, 142)
      [-31.0, 31.0].forEach((px) => {
        const dx = x - px;
        const dz = z - 142.0;
        const dist = Math.hypot(dx, dz);
        if (dist < 14.5 && dist > 0.001) {
          x = px + (dx / dist) * 14.5;
          z = 142.0 + (dz / dist) * 14.5;
        }
      });
    }
    return { x, z };
  }

  function setPlayerMovement(forward, right, viewYaw, dt) {
    if (!playerRig.root) return false;
    const mag = Math.hypot(forward, right);
    if (mag < 0.01) {
      playerRig.isMoving = false;
      return false;
    }

    const nf = forward / Math.max(1.0, mag);
    const nr = right / Math.max(1.0, mag);
    // View direction in XZ: camera forward is (-sin(yaw), -cos(yaw)), right is (cos(yaw), -sin(yaw))
    const moveX = (-Math.sin(viewYaw) * nf + Math.cos(viewYaw) * nr);
    const moveZ = (-Math.cos(viewYaw) * nf - Math.sin(viewYaw) * nr);

    const speed = 44.0 * Math.min(dt || 0.016, 0.05);
    const next = clampPlayerPosition(playerRig.pos.x + moveX * speed, playerRig.pos.z + moveZ * speed);
    playerRig.pos.x = next.x;
    playerRig.pos.z = next.z;
    playerRig.root.position.copy(playerRig.pos);

    const targetYaw = Math.atan2(moveX, moveZ);
    let diff = targetYaw - playerRig.rotY;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    playerRig.rotY += diff * Math.min(1.0, (dt || 0.016) * 12.0);
    playerRig.root.rotation.y = playerRig.rotY;
    playerRig.isMoving = true;
    return true;
  }

  function resetPlayerPosition() {
    playerRig.pos.set(45.0, 0.0, 166.0);
    playerRig.rotY = Math.PI * 0.80;
    playerRig.isMoving = false;
    if (playerRig.root) {
      playerRig.root.position.copy(playerRig.pos);
      playerRig.root.rotation.y = playerRig.rotY;
    }
  }

  function update(delta, elapsed = 0) {
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

    // Fiber/data motes streaming along the overhead cable ladders
    for (let m = 0; m < motes.length; m++) {
      const mote = motes[m];
      const z = ((mote.offset + elapsed * mote.speed) % moteSpan) - moteSpan * 0.5;
      dummy.position.set(mote.x, mote.y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      moteInst.setMatrixAt(m, dummy.matrix);
    }
    moteInst.instanceMatrix.needsUpdate = true;

    // Synchronized status-beacon heartbeat (hero rack + support equipment)
    const pulse = 0.62 + 0.38 * Math.sin(elapsed * 3.4);
    materials.statusBeacon.color.setRGB(
      0.56 * pulse,
      0.82 * pulse,
      0.11 * pulse
    );

    // Levitate & rotate Cryo GPU Core spinners inside lab pedestals
    for (let p = 0; p < pedestalSpinners.length; p++) {
      const sp = pedestalSpinners[p];
      sp.obj.rotation.y = elapsed * 0.85 + sp.phaseOffset;
      sp.obj.position.y = sp.baseY + Math.sin(elapsed * 2.1 + sp.phaseOffset) * 0.025;
    }

    // Mechanical 3D Gaming Keyboard spring travel & RGB flash
    keyboardKeysMap.forEach((k) => {
      const target = k.isDown ? 1.0 : 0.0;
      k.pressProgress += (target - k.pressProgress) * Math.min(1.0, dt * 24.0);
      k.mesh.position.y = k.baseY - k.pressProgress * 0.0042;
      if (k.mesh.material && k.mesh.material.emissive) {
        if (k.pressProgress > 0.05) {
          k.mesh.material.emissive.setHex(0x76b900);
          k.mesh.material.emissiveIntensity = 1.6 * k.pressProgress;
        } else {
          k.mesh.material.emissive.copy(k.origEmissive);
          k.mesh.material.emissiveIntensity = k.origEmissiveInt;
        }
      }
    });

    // Articulated Player Model walk & idle breathing animation
    if (playerRig.root) {
      if (playerRig.isMoving) {
        playerRig.walkPhase += dt * 9.5;
        const swing = Math.sin(playerRig.walkPhase) * 0.58;
        if (playerRig.legL) playerRig.legL.rotation.x = swing;
        if (playerRig.legR) playerRig.legR.rotation.x = -swing;
        if (playerRig.armL) playerRig.armL.rotation.x = -swing * 0.68;
        if (playerRig.armR) playerRig.armR.rotation.x = swing * 0.68;
        if (playerRig.pelvis && playerRig.pelvisBaseY !== undefined) {
          playerRig.pelvis.position.y = playerRig.pelvisBaseY + Math.abs(Math.cos(playerRig.walkPhase)) * 0.032;
        }
        if (playerRig.torso) playerRig.torso.rotation.y = Math.sin(playerRig.walkPhase) * 0.06;
      } else {
        const relax = Math.min(1.0, dt * 10.0);
        if (playerRig.legL) playerRig.legL.rotation.x *= (1.0 - relax);
        if (playerRig.legR) playerRig.legR.rotation.x *= (1.0 - relax);
        if (playerRig.armL) playerRig.armL.rotation.x *= (1.0 - relax);
        if (playerRig.armR) playerRig.armR.rotation.x *= (1.0 - relax);
        if (playerRig.torso) {
          playerRig.torso.rotation.y *= (1.0 - relax);
          playerRig.torso.rotation.x = Math.sin(elapsed * 1.6) * 0.015;
        }
        if (playerRig.head) {
          playerRig.head.rotation.y = Math.sin(elapsed * 0.7) * 0.14;
        }
        if (playerRig.pelvis && playerRig.pelvisBaseY !== undefined) {
          playerRig.pelvis.position.y = playerRig.pelvisBaseY + Math.sin(elapsed * 1.6) * 0.008;
        }
      }
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
    labTargets: {
      keyboardHitProxy,
      workstationHitProxy,
      playerRig,
    },
    triggerKeyPress,
    setPlayerMovement,
    resetPlayerPosition,
    getPlayerTransform: () => ({
      position: playerRig.pos,
      rotationY: playerRig.rotY,
      isReady: Boolean(playerRig.root),
    }),
    assetsReady,
    update,
    dispose,
  };
}

export default createServerRoom;
