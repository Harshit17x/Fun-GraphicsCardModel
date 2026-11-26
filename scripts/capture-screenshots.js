import { spawn } from "node:child_process";
import fs from "node:fs";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function capture() {
  console.log("Launching Chrome...");
  const chrome = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9222",
      "--user-data-dir=/tmp/chrome-ss-profile",
      "--window-size=1920,1080",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "http://localhost:4173/?debug=1",
    ]
  );

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    try {
      const res = await fetch("http://127.0.0.1:9222/json");
      const list = await res.json();
      if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
        wsUrl = list[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      // retry
    }
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome DevTools port");
    chrome.kill();
    process.exit(1);
  }

  console.log("Connected to Chrome:", wsUrl);
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  let msgId = 1;
  const callbacks = new Map();
  const consoleLogs = [];
  const exceptions = [];

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.method === "Runtime.consoleAPICalled") {
      const txt = (data.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ");
      consoleLogs.push(`[${data.params.type}] ${txt}`);
    } else if (data.method === "Runtime.exceptionThrown") {
      exceptions.push(data.params.exceptionDetails?.text || "Runtime exception");
    }
    if (data.id && callbacks.has(data.id)) {
      callbacks.get(data.id)(data);
      callbacks.delete(data.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = msgId++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Page.enable");
  await send("Runtime.enable");

  console.log("Waiting for scene and GLTF assets to finish loading...");
  for (let i = 0; i < 30; i++) {
    await sleep(400);
    const evalRes = await send("Runtime.evaluate", {
      expression: 'document.querySelector("#sceneLoader")?.classList.contains("hidden")',
      returnByValue: true,
    });
    if (evalRes?.result?.result?.value === true) {
      console.log("Scene loaded!");
      break;
    }
  }
  await sleep(2500);

  // Verify loaded Blender assets inside Three.js scene
  const checkRes = await send("Runtime.evaluate", {
    expression: `(() => {
      const s = window.__viewer?.scene;
      if (!s) return { ok: false };
      const names = [];
      s.traverse(o => { if (o.name && o.name.startsWith("Blender_")) names.push(o.name); });
      return { ok: true, blenderAssets: names };
    })()`,
    returnByValue: true,
  });
  console.log("Three.js Scene Check:", JSON.stringify(checkRes?.result?.result?.value));

  // 1. Capture Default Lab View (Workstation + Keyboard + PC + Player + Pedestals + Glass Aisle)
  let ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 92 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/lab-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Saved assets/lab-view.jpg");
  }

  // 2. Switch to Gaming Keyboard View + press 'W' & 'Space' keys!
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnViewKeyboard")?.click()',
  });
  await sleep(2200);
  await send("Runtime.evaluate", {
    expression: 'window.__viewer?.datacenter?.triggerKeyPress("KeyW", true); window.__viewer?.datacenter?.triggerKeyPress("Space", true);',
  });
  await sleep(300);

  ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 92 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/keyboard-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Saved assets/keyboard-view.jpg");
  }
  await send("Runtime.evaluate", {
    expression: 'window.__viewer?.datacenter?.triggerKeyPress("KeyW", false); window.__viewer?.datacenter?.triggerKeyPress("Space", false);',
  });

  // 3. Switch to Computer / PC Showcase View
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnViewLab")?.click();',
  });
  await sleep(1600);
  await send("Runtime.evaluate", {
    expression: `(() => {
      const p = window.__viewer?.datacenter?.getCameraPreset("computer");
      if (p) {
        window.__viewer.camera.position.copy(p.position);
        window.__viewer.controls.target.copy(p.target);
        window.__viewer.camera.fov = p.fov;
        window.__viewer.camera.updateProjectionMatrix();
        window.__viewer.controls.update();
      }
    })()`,
  });
  await sleep(800);
  ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 92 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/computer-pc-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Saved assets/computer-pc-view.jpg");
  }

  // 4. Switch to Player Walk View and simulate walking into the corridor!
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnViewPlayer")?.click()',
  });
  await sleep(2000);
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnWalkToAisle")?.click()',
  });
  await sleep(2000);
  ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 92 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/player-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Saved assets/player-view.jpg");
  }

  // 5. Refresh Aisle View screenshot
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnViewFacility")?.click()',
  });
  await sleep(2400);
  ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 92 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/datacenter-ui-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Updated assets/datacenter-ui-view.jpg");
  }

  console.log("Console Logs:", consoleLogs.length ? consoleLogs : "None");
  console.log("Exceptions:", exceptions.length ? exceptions : "None");

  ws.close();
  chrome.kill();
}

capture().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});
