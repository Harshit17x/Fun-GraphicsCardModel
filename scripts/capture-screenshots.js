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
      "http://localhost:4173/",
    ]
  );

  chrome.stderr.on("data", (d) => {
    // console.log("chrome err:", d.toString());
  });

  // Wait for DevTools port to open
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
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

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
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

  // Wait until sceneLoader has 'hidden' class
  console.log("Waiting for scene to finish loading...");
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    const evalRes = await send("Runtime.evaluate", {
      expression: 'document.querySelector("#sceneLoader")?.classList.contains("hidden")',
      returnByValue: true,
    });
    if (evalRes?.result?.result?.value === true) {
      console.log("Scene loaded!");
      break;
    }
  }

  // Extra settle time for WebGL frame render
  await sleep(2000);

  // 1. Capture Facility View
  console.log("Capturing Facility Aisle view...");
  let ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/datacenter-ui-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Saved assets/datacenter-ui-view.jpg");
  }

  // 2. Switch to Blade Sled View (Rack 04 with door open & tray extended)
  console.log("Switching to GPU Blade Sled view...");
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnViewTray")?.click()',
  });
  await sleep(3000); // Wait for camera transition, door open, tray slide

  ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/datacenter-blade-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Saved assets/datacenter-blade-view.jpg");
  }

  // 3. Switch to RTX 4090 Explode View
  console.log("Switching to RTX 4090 Exploded view...");
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnViewGpu")?.click()',
  });
  await sleep(2500);

  // Trigger Explode
  await send("Runtime.evaluate", {
    expression: 'document.querySelector("#btnExplode")?.click()',
  });
  await sleep(2500); // Wait for explosion animation

  ss = await send("Page.captureScreenshot", { format: "jpeg", quality: 90 });
  if (ss?.result?.data) {
    fs.writeFileSync("assets/rtx4090-exploded-view.jpg", Buffer.from(ss.result.data, "base64"));
    console.log("Saved assets/rtx4090-exploded-view.jpg");
  }

  ws.close();
  chrome.kill();
  console.log("All screenshots successfully captured!");
}

capture().catch((err) => {
  console.error("Error during capture:", err);
  process.exit(1);
});
