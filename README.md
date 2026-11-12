# NVIDIA AI Supercomputer Datacenter & RTX 4090 3D Visualization

[![Three.js](https://img.shields.io/badge/Three.js-r165-black?style=for-the-badge&logo=three.dot_js)](https://threejs.org/)
[![WebGL](https://img.shields.io/badge/WebGL-2.0-990000?style=for-the-badge&logo=webgl)](https://www.khronos.org/webgl/)
[![JavaScript](https://img.shields.io/badge/ES6+-Vanilla%20JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

An interactive, high-fidelity **AI Supercomputer Datacenter Facility** and **NVIDIA GeForce RTX 4090 Founders Edition 3D concept visualization** built with **Three.js** and **WebGL**.

Explore an entire enterprise server room populated with rows of 42U high-density GPU server racks glowing with deep blue LED ambiance, reflective floor tiles, overhead cable ladders, and dynamic telemetry. Inspect individual racks, slide out 4U GPU compute sleds, and zoom seamlessly into an individual RTX 4090 to deconstruct its engineering layers in real-time.

---

## 🌟 Highlights & Features

### 🏢 AI Datacenter Supercomputer Facility (Modeled after reference architecture)
- **Massive Dual-Aisle Server Corridor**: Dual opposing rows of 42U server racks with tinted glass doors and dynamic telemetry activity LEDs (blue, cyan, green, amber).
- **Photorealistic Datacenter Environment**: High-gloss reflective raised tile floor (60×60 cm grid), suspended yellow/blue fiber optic cable ladders, overhead linear LED luminaires, and atmospheric blue volumetric fog.
- **Interactive Hero Rack (Rack 04)**: Smoothly pivot the glass door open (0°–95°) to reveal internal compute blades.
- **Telescoping 4U GPU Compute Sled**: Slide out the 8× GPU server tray forward into the aisle on 3-stage steel slide rails.
- **Web Audio Datacenter Ambient Hum**: Procedural Web Audio API synthesizer generating dual 60Hz/120.6Hz transformer drone + filtered pink noise airflow with mute/unmute control.

### 🔬 Multi-Scale Interactive View Modes
- **🏢 Facility Aisle View**: Wide corridor perspective matching datacenter reference photography.
- **🖥️ Server Rack View**: Beauty angle focusing on Rack 04 (Compute Pod Alpha).
- **🗄️ GPU Blade Sled View**: Top-quarter inspection of the slide-out 8× GPU compute tray.
- **🔬 Single GPU Exploded View**: Smoothly zeroes in on the hero RTX 4090 Founders Edition card.

### 💥 RTX 4090 Exploded Engineering View
- **Real-Time Exploded Deconstruction**: Scrub the **Deconstruct Slider (0%–100%)** or toggle 3D Stack / Linear views to separate the card into 8 distinct engineering assemblies.
- **Dynamic 3D Screen-Projected Callout Badges**: Interactive badges and SVG leader lines pointing to the Front Shroud, Axial Fan, Fan Frame, Heatsink, PCB, Thermal Midplate, Backplate, and Rear Shroud.
- **Technical Specification Inspector**: Click any callout tag or 3D mesh to view detailed engineering materials, dimensions, and cooling parameters.
- **Counter-Rotating Dual Axial Fans**: Front intake and rear exhaust fans spinning in counter-rotation with dynamic blur.

---

## 🕹️ Controls & Navigation

| Action | Shortcut / UI Control |
| :--- | :--- |
| **Facility Aisle View** | Press <kbd>1</kbd> or click `Facility Aisle` |
| **Server Rack View** | Press <kbd>2</kbd> or click `Server Rack` |
| **GPU Blade Sled View** | Press <kbd>3</kbd> or click `GPU Blade` |
| **Single GPU Exploded View** | Press <kbd>4</kbd> or click `GPU Deep Dive` |
| **Toggle Rack Door** | Press <kbd>D</kbd> or click `Open/Close Door` |
| **Slide Compute Tray** | Press <kbd>T</kbd> or click `Extend/Retract Tray` |
| **Toggle Datacenter Sound** | Press <kbd>S</kbd> or click `Audio Hum` |
| **Toggle Exploded View** | Press <kbd>Space</kbd> / <kbd>E</kbd> or click `Explode View` |
| **Switch Explode Mode (3D / Linear)** | Press <kbd>M</kbd> or click `3D Stack` / `Linear View` |
| **Component Quick-Focus** | Press <kbd>5</kbd>–<kbd>8</kbd> or click Part Pills 1–8 |
| **Exit Component Focus** | Press <kbd>Esc</kbd> |
| **Toggle Auto Orbit** | Press <kbd>O</kbd> or click `Auto Orbit` |
| **Reset Camera View** | Press <kbd>R</kbd> or click `Reset View` |

---

## 🔬 Component Breakdown (Card Anatomy)

When toggling the **Exploded View**, the card dynamically separates into its constituent engineering assemblies:

| Component | Engineering Details | Exploded Motion |
| :--- | :--- | :--- |
| **Aerodynamic Shroud & Fans** | 8.46-unit brushed shell with dual-tone finish, carbon side trims, custom typography plates, and triple 92mm fans with glowing inner rings. | Displaces upward (`+Y, +Z`) |
| **High-Density Heatsink** | Dual fin-stack radiator consisting of 58 individually positioned cooling fins, dual heat sink blocks, and a looping gold/copper sintered heat pipe. | Displaces upward (`+Y`) |
| **Die-Cast Armor Midframe** | Structural perimeter stiffener with blue thermal conductivity pads for memory and VRM power modules. | Floats between heatsink & PCB |
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
   python3 -m http.server 4173
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

| Input / Element | Action | Description |
| :--- | :--- | :--- |
| **💥 "Explode View" Button** | **Toggle Explosion** | Smoothly explodes or re-assembles all GPU layers with one click. |
| **🎚️ Deconstruct Slider** | **Continuous Scrub** | Drag from `0%` (assembled) to `100%` (fully separated) in real time. |
| **🎯 Preset Buttons** | **Quick Jump** | Instant presets for `Assembled (0%)`, `50%`, and `Exploded (100%)`. |
| **🏷️ 3D Callout Tags** | **Inspect Component** | Click any floating tag to view full technical specs in the side drawer. |
| **⟳ Auto Orbit Button** | **Continuous Orbit** | Toggles smooth 360° turntable product rotation. |
| **↺ Reset View Button** | **Camera Reset** | Re-centers camera angle, zoom distance, and closes exploded state. |
| **Left Click + Drag** | **Orbit / Rotate** | Rotates the graphics card in 3D space with inertia damping. |
| **Scroll Wheel / Pinch** | **Zoom In / Out** | Smoothly zooms in to examine fine details or zooms out for wide product shots. |
| **Spacebar** or **`E`** | **Toggle Shortcut** | Keyboard toggle between assembled and exploded configurations. |
| **`R` Key** | **Reset Shortcut** | Restores default camera angle, target, and assembled state. |
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
