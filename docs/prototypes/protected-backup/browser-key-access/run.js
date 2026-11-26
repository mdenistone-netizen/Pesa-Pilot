// Evidence for DB-4 §3a (26 Nov). Planning artefact; not part of the app. Run: node run.js
const { chromium } = require("playwright"); const { spawn } = require("child_process");
const srv = spawn("python3", ["-m", "http.server", "8767", "--bind", "127.0.0.1"], { cwd: __dirname + "/site", stdio: "ignore" });
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => { await wait(800); const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  await p.goto("http://127.0.0.1:8767/index.html"); await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await wait(500);
  await p.evaluate(async () => {
    // A: non-extractable data key + a "backup" encrypted with it
    const dk = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, dk, new TextEncoder().encode("Rent 6500; M-Pesa 12000"));
    await put("dk", dk); await put("sample", { iv, ct });
    // B: static key pair made at setup; ONLY the public key is stored on the phone (private key only inside password/code locks)
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    const eph = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    await put("pub", kp.publicKey); await put("sampleB", { ephPub: eph.publicKey });
  });
  const out = await p.evaluate(() => new Promise(r => { navigator.serviceWorker.onmessage = e => r(e.data); navigator.serviceWorker.controller.postMessage("go"); }));
  console.log(JSON.stringify(out, null, 1)); await b.close(); srv.kill(); })().catch(e => { console.error(e); srv.kill(); process.exit(1); });
