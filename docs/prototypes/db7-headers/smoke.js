// DB-7 evidence (26 Nov). Planning artefact; not deployed. Copy index.html + fonts into ./app, then: node smoke.js "<CSP>"
const { chromium } = require("playwright"); const { spawn } = require("child_process"); const fs = require("fs");
const CSP = process.argv[2];
const srv = spawn("node", ["server.js"], { cwd: __dirname, env: { ...process.env, CSP, PORT: "8790" }, stdio: "inherit" });
const wait = ms => new Promise(r => setTimeout(r, ms)); const URL = "http://127.0.0.1:8790/";
(async () => {
  await wait(600);
  const b = await chromium.launch(); const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 }, timezoneId: "Africa/Nairobi" });
  await ctx.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI || ""} ${e.sample || ""}`.trim())); });
  const p = await ctx.newPage(); const errors = [], cspConsole = [];
  p.on("pageerror", e => errors.push(e.message)); p.on("console", m => { if (/Content Security Policy|Refused to/i.test(m.text())) cspConsole.push(m.text().slice(0, 160)); });
  p.on("dialog", d => d.accept());
  const act = (a, id) => p.evaluate(([a, id]) => { const el = document.querySelector(`[data-action="${a}"]${id ? `[data-id="${id}"]` : ""}`); if (!el) throw new Error("no " + a); el.click(); }, [a, id]);
  const view = v => p.evaluate(v => document.querySelector(`[data-view="${v}"]`).click(), v);
  const submit = (form, vals) => p.evaluate(([form, vals]) => { for (const [k, v] of Object.entries(vals)) { const el = document.getElementById(k); if (el.type === "checkbox") el.checked = !!v; else el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); } document.getElementById(form).requestSubmit(); }, [form, vals]);
  const fig = n => p.evaluate(n => document.querySelector(`.view.active [data-figure="${n}"]`)?.textContent.trim(), n);
  await p.goto(URL); await wait(1300);
  const fontOk = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some(f => f.family.includes("Inter") && f.status === "loaded"); });
  await submit("welcomeForm", { welcomeName: "Test", welcomePin: "1234", welcomePinConfirm: "1234" }); await wait(900);
  await view("money"); await act("edit-account", "mpesa"); await submit("accountForm", { accOpening: "10000" }); await wait(150);
  await view("home"); await act("add-expense"); await submit("transactionForm", { txAmount: "500", txCategoryForm: "Food", txAccountForm: "mpesa" }); await wait(150);
  await view("money"); await act("add-transfer"); await submit("transferForm", { trAmount: "1000", trFrom: "mpesa", trTo: "cash" }); await wait(150);
  await view("goals"); await act("add-goal"); await submit("goalForm", { goalName: "School fees", goalTarget: "20000" }); await wait(150);
  const gid = await p.evaluate(() => JSON.parse(localStorage.getItem("pesapilot_v2")).goals[0].id);
  await view("goals"); await act("contribute-goal", gid); await submit("contributionForm", { contributionAccount: "mpesa", contributionAmount: "3000" }); await wait(150);
  await view("money"); await act("reconcile-account", "cash"); await submit("reconcileForm", { recActual: "900", recReason: "test" }); await wait(150);
  await view("plan"); await act("edit-plan"); await p.evaluate(() => { const s = document.getElementById("planPattern"); s.value = "irregular"; s.dispatchEvent(new Event("change", { bubbles: true })); }); await submit("plannerForm", { planDays: "7", planBuffer: "1000" }); await wait(150);
  await view("home"); const home = { available: await fig("home-free"), setAside: await fig("home-set-aside"), total: await fig("total-held"), safe: await fig("safe-daily") };
  await view("settings"); const [dl] = await Promise.all([p.waitForEvent("download"), act("export-backup")]); const backupText = fs.readFileSync(await dl.path(), "utf8");
  await p.evaluate(() => { const s = document.getElementById("profileTheme"); s.value = "dark"; s.dispatchEvent(new Event("change", { bubbles: true })); document.getElementById("profileForm").requestSubmit(); }); await wait(200);
  await view("home"); await act("add-expense"); await submit("transactionForm", { txAmount: "100", txCategoryForm: "Food", txAccountForm: "mpesa" }); await wait(150);
  await view("settings"); const nav = p.waitForNavigation().catch(() => {});
  await p.setInputFiles("#importFile", { name: "b.json", mimeType: "application/json", buffer: Buffer.from(backupText) }); await nav; await wait(1300);
  // PIN lock after reload, unlock
  const locked = await p.evaluate(() => [...document.querySelectorAll("body *")].some(e => e.offsetParent && e.children.length < 30 && /^PesaPilot is locked/.test(e.innerText.trim())));
  for (const d of "1234") { await p.evaluate(d => [...document.querySelectorAll("button")].find(x => x.offsetParent && x.innerText.trim() === d)?.click(), d); await wait(80); }
  await wait(900);
  const lockVisible = () => p.evaluate(() => [...document.querySelectorAll("body *")].some(e => e.offsetParent && e.children.length < 30 && /^PesaPilot is locked/.test(e.innerText.trim())));
  const unlocked = !(await lockVisible());
  await view("home"); const afterImport = { available: await fig("home-free"), total: await fig("total-held") };
  // Framing must be refused
  const framed = await ctx.newPage(); await framed.setContent(`<iframe id="f" src="${URL}"></iframe>`); await wait(800);
  const frameBlocked = await framed.evaluate(() => { try { return !document.getElementById("f").contentDocument?.body?.innerText?.includes("PesaPilot"); } catch { return true; } });
  // An injected EXTERNAL script must be refused; an outside request must be refused
  const extBlocked = await p.evaluate(() => new Promise(r => { const s = document.createElement("script"); s.src = "https://example.com/x.js"; s.onerror = () => r(true); s.onload = () => r(false); document.head.appendChild(s); setTimeout(() => r(true), 1500); }));
  const fetchBlocked = await p.evaluate(() => fetch("https://example.com/").then(() => false).catch(() => true));
  const csp = await p.evaluate(() => window.__csp);
  console.log(JSON.stringify({ fontOk, home, backupHasRecords: backupText.includes('"transactions"'), backupHasPinHash: /pinHash|"pin":"\d/.test(backupText), locked, unlocked, afterImport, frameBlocked, extBlocked, fetchBlocked, appViolations: csp.filter(v => !/example\.com/.test(v)), consoleCsp: cspConsole.filter(v => !/example\.com/.test(v)), errors }, null, 1));
  await b.close(); srv.kill();
})().catch(e => { console.error(e); srv.kill(); process.exit(1); });
