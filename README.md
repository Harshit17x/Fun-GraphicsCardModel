# Fun-GraphicsCardModel

[![Three.js](https://img.shields.io/badge/Three.js-r165-black?style=for-the-badge&logo=three.dot_js)](https://threejs.org/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?style=for-the-badge&logo=webgl)](https://www.khronos.org/webgl/)
[![JavaScript](https://img.shields.io/badge/ES6+-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

An interactive, high-fidelity 3D graphics card concept visualization built from scratch with **Three.js** and **WebGL**. 

Modeled procedurally after flagship triple-fan graphics cards (codenamed **"BLACKOUT / 24 GB"**), this project features physically-based materials (PBR), studio lighting, spinning fans with dynamic RGB glow, smooth orbit controls, and an interactive **Exploded Engineering View** that deconstructs every layer of the GPU in real-time.

---

## 🌟 Highlights & Features

- **🎮 360° Interactive Orbit Controls**: Inspect the card from any angle with smooth damping/inertia, pan restrictions, and zoom clamping.
- **💥 Real-Time Exploded View**: Press `E` or `Space` to separate the card into all its distinct mechanical layers using smooth vector lerp animations.
- **🌀 Triple 92mm Axial Fan Array**: Three independently spinning cooling fans (11 curved blades each with alternating graphite textures) and pulsing RGB LED halo rings.
- **⚡ Procedural Hardware Architecture**: Complete GPU anatomy modeled down to the GPU die, VRAM chips, copper traces, capacitors, heatsink fins, heat pipes, and gold PCIe contacts.
- **💡 Photorealistic Studio Lighting**: Multi-point lighting setup featuring directional key lighting, subtle rim illumination, ambient hemisphere lighting, and localized red/blue accent glows with soft PCF shadow maps.
- **🎯 Interactive Raycasting**: Real-time raycaster tracks pointer position over mesh geometries and dynamically adapts the cursor (`grab` ➔ `pointer`).
- **🔗 URL Query Parameter Support**: Load directly into exploded view using `?view=exploded` (ideal for showcases and presentations).
- **🚀 Zero Build Setup**: Pure ES modules served directly from CDN via modern browser Import Maps. No npm install, Webpack, or Vite required!

---

## 🔬 Component Breakdown (Card Anatomy)

When toggling the **Exploded View**, the card dynamically separates into its constituent engineering assemblies:

| Component | Engineering Details | Exploded Motion |
| :--- | :--- | :--- |
| **Aerodynamic Shroud & Fans** | 8.46-unit brushed shell with dual-tone finish, carbon side trims, custom typography plates, and triple 92mm fans with glowing inner rings. | Displaces upward (`+Y, +Z`) |
| **High-Density Heatsink** | Dual fin-stack radiator consisting of 58 individually positioned cooling fins, dual heat sink blocks, and a looping gold/copper sintered heat pipe. | Displaces upward (`+Y`) |
| **Custom Circuit Board (PCB)** | Dark teal matte solder mask, GPU silicon core with integrated heat spreader (IHS), 12 GDDR memory ICs, 13 signal bus traces, and 8 high-performance capacitors. | Centers on baseline |
| **Structural Metal Backplate** | Rigid matte-graphite backplate with precision cutouts, 8 hex mounting screws, and laser-engraved `"BLACKOUT / 24 GB"` branding plate. | Displaces downward (`-Y, -Z`) |
| **I/O Bracket & Display Ports** | Brushed steel dual-slot PCI bracket with 4 hexagonal exhaust vents and 3 illuminated digital display outputs (blue LED glow). | Displaces outward (`-X`) |
| **PCIe Edge Connector** | Full-bandwidth 16x edge connector featuring 14 individually rendered gold finger contacts. | Displaces forward (`+Z`) |
| **Auxiliary Power Header** | High-power 12V terminal socket with dual gold contact pins. | Displaces rearward (`-Z, +Y`) |

---

## 🚀 How to Start (Run Locally)

Because this project utilizes modern browser **ES Modules** and `<script type="importmap">`, modern browsers require the files to be served over HTTP/HTTPS rather than opened directly via `file://`.

### Prerequisites
- Any modern web browser supporting WebGL (Chrome, Edge, Firefox, Safari, Brave, etc.)
- Any local static file server (Python, Node.js, VS Code, PHP, etc.)

---

### Method 1: Using Python (Recommended & Easiest)

Python comes pre-installed on macOS and Linux, and is readily available on Windows.

1. Open your terminal in the project directory:
   ```bash
   cd "/path/to/graphic card"
   ```

2. Start the local HTTP server:
   ```bash
   # Python 3
   python3 -m http.server 4173
   
   # Or Python 2 (if legacy)
   python -m SimpleHTTPServer 4173
   ```

3. Open your browser and navigate to:
   ```text
   http://localhost:4173
   ```

---

### Method 2: Using Node.js (`npx`)

If you have Node.js installed:

```bash
# Using 'serve'
npx serve .

# Or using 'http-server'
npx http-server -p 4173
```
Then visit the URL displayed in the console (usually `http://localhost:3000` or `http://localhost:4173`).

---

### Method 3: Using VS Code Live Server

1. Open this folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `index.html` and select **"Open with Live Server"** (or click **"Go Live"** in the status bar).

---

## 🕹️ Controls & Navigation

| Input / Key | Action | Description |
| :--- | :--- | :--- |
| **Left Click + Drag** | **Orbit / Rotate** | Rotates the graphics card in 3D space with inertia damping. |
| **Scroll Wheel / Pinch** | **Zoom In / Out** | Smoothly zooms in to examine fine details or zooms out for wide product shots. |
| **Spacebar** or **`E`** | **Toggle Exploded View** | Separates / re-assembles the shroud, heatsink, PCB, backplate, bracket, and connectors. |
| **`R` Key** | **Reset View** | Restores the default camera perspective, target, and assembled view state. |
| **Mouse Hover** | **Mesh Inspection** | Raycasts interactive geometry and updates cursor to pointer. |
| **URL Parameter** | **Direct Presentation** | Append `?view=exploded` to the URL to start immediately in exploded view. |

---

## 📁 Project Structure

```text
Fun-GraphicsCardModel/
├── index.html        # Entry HTML: canvas, viewport metadata, import map
├── styles.css        # Clean studio backdrop styling, loader overlay, reset
├── main.js           # Complete 3D scene: geometries, materials, lighting, animations, controls
├── .gitignore        # Ignores OS and temporary files
└── README.md         # Comprehensive project documentation
```

---

## 🛠️ Technology Stack

- **[Three.js (r165)](https://threejs.org/)**: 3D scene graph, WebGL rendering, physically-based materials, and shadow mapping.
- **[OrbitControls](https://threejs.org/docs/#examples/en/controls/OrbitControls)**: Smooth rotational camera manipulation.
- **[RoundedBoxGeometry](https://threejs.org/docs/#examples/en/geometries/RoundedBoxGeometry)**: Chamfered corner geometry for photorealistic product edges.
- **HTML5 Canvas & WebGL 2.0**: High-performance hardware-accelerated 3D rendering.
- **Modern CSS3**: Studio viewport layout, custom cursors, and loading state transitions.

---

## 🎨 Customization & Tweaks

You can easily customize properties directly inside [main.js](file:///Users/harshitbisht/Desktop/graphic%20card/main.js):

- **Change Accent Lighting**:
  Modify `palette.redGlow` or `palette.blueGlow` (lines 71–85) to customize RGB lighting colors (e.g. emerald green, cyber purple, or ice blue).
- **Adjust Fan Speed**:
  In the `animate()` loop (line 434), change the multiplier `0.012` to increase or decrease rotational fan speeds.
- **Modify Materials**:
  Tune the `roughness`, `metalness`, or `clearcoat` properties in the `palette` object to switch between brushed titanium, matte stealth black, or gloss finishes.
- **Custom Badge Label**:
  Change `"BLACKOUT"` or `"TRI-FAN / 92"` in `createLabelTexture()` to display your custom brand or model name.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

Made with ❤️ by [Harshit Bisht](https://github.com/Harshit17x).
