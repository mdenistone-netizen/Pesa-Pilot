// DB-7 release + rollback path check (DEC-031, 7.3 and 7.7).
// Serves folders with the EXACT headers from netlify.toml (a local stand-in for Netlify) and checks:
//   1. The prepared rollback app is byte-identical to the safe build 8370097.
//   2. A rollback tree (current layout, app/index.html replaced by the rollback app) passes the publish guard,
//      and the guard FAILS if an internal file is put into app/ (negative test).
//   3. Normal release path: the current app runs under the headers with no policy violations, and the core
//      flows work (accounts, expense, transfer, goal set-aside, backup export, import, PIN lock).
//   4. Rollback path: on the same web address, data upgraded by Release 1 is opened by the rollback app, then by
//      Release 1 again: records unchanged, no policy violations, nothing internal published.
// Run: node tests/rollback-check.js
"use strict";
const fs = require("fs"), os = require("os"), path = require("path"), http = require("http");
const { execSync, spawnSync } = require("child_process");
const { chromium } = require("playwright");
const assert = require("assert");
const { realisticMonth } = require("./fixtures.js");
const REPO = path.join(__dirname, ".."), FIXED_NOW = new Date("2026-11-25T09:00:00+03:00");
const results = []; const pass = m => { results.push("PASS  " + m); console.log("PASS  " + m); };

// Headers exactly as configured for Netlify
const toml = fs.readFileSync(path.join(REPO, "netlify.toml"), "utf8");
const HEADERS = {}; for (const m of toml.matchAll(/^\s*([A-Za-z-]+)\s*=\s*"([^"]*)"/gm)) if (m[1] !== "publish" && m[1] !== "for") HEADERS[m[1]] = m[2];
assert.equal(Object.keys(HEADERS).length, 6, "expected 6 headers in netlify.toml");

// 1. Rollback app identity
const rb = fs.readFileSync(path.join(REPO, "release/rollback/schema10-safe-index.html"));
assert.ok(rb.equals(execSync("git show 8370097:index.html", { cwd: REPO })), "rollback copy differs from 8370097");
pass("prepared rollback app is byte-identical to safe build 8370097");

// 2. Rollback tree + guard (positive and negative)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pp-rollback-"));
const tree = path.join(tmp, "tree"); fs.mkdirSync(tree);
fs.copyFileSync(path.join(REPO, "netlify.toml"), path.join(tree, "netlify.toml"));
fs.cpSync(path.join(REPO, "app"), path.join(tree, "app"), { recursive: true });
fs.writeFileSync(path.join(tree, "app/index.html"), rb);
let g = spawnSync("node", [path.join(__dirname, "publish-check.js"), tree], { encoding: "utf8" });
assert.equal(g.status, 0, g.stderr); pass("rollback tree publishes only approved files from app/");
const bad = path.join(tmp, "bad"); fs.cpSync(tree, bad, { recursive: true });
fs.mkdirSync(path.join(bad, "app/docs")); fs.writeFileSync(path.join(bad, "app/docs/DECISIONS.md"), "internal");
g = spawnSync("node", [path.join(__dirname, "publish-check.js"), bad], { encoding: "utf8" });
assert.notEqual(g.status, 0); assert.match(g.stderr, /app\/docs\/DECISIONS\.md is not an approved published file/);
pass("guard FAILS when an internal document is placed in app/ (negative test)");

// Local stand-in for Netlify: /r1/ = current app/, /rb/ = rollback tree app/; anything else 404. Same origin → same storage.
const ROOTS = { "/r1/": path.join(REPO, "app"), "/rb/": path.join(tree, "app") };
const TYPES = { ".html": "text/html; charset=utf-8", ".woff2": "font/woff2", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  const prefix = Object.keys(ROOTS).find(p => url.startsWith(p));
  let file = prefix && path.join(ROOTS[prefix], url.slice(prefix.length) || "index.html");
  if (!prefix || !file.startsWith(ROOTS[prefix]) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404, HEADERS); return res.end("Not found"); }
  res.writeHead(200, { ...HEADERS, "Content-Type": TYPES[path.extname(file)] || "application/octet-stream" }); fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const BASE = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 390, height: 844 }, timezoneId: "Africa/Nairobi" });
  await ctx.addInitScript(() => { window.__csp = []; document.addEventListener("securitypolicyviolation", e => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
  const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(e.message)); page.on("dialog", d => d.accept());
  await page.clock.setFixedTime(FIXED_NOW);
  const wait = ms => page.waitForTimeout(ms);
  const act = (a, id) => page.evaluate(([a, id]) => document.querySelector(`[data-action="${a}"]${id ? `[data-id="${id}"]` : ""}`).click(), [a, id]);
  const view = v => page.evaluate(v => document.querySelector(`[data-view="${v}"]`).click(), v);
  const submit = (form, vals) => page.evaluate(([form, vals]) => { for (const [k, v] of Object.entries(vals)) { const el = document.getElementById(k); el.value = v; el.dispatchEvent(new Event("change", { bubbles: true })); } document.getElementById(form).requestSubmit(); }, [form, vals]);
  const fig = n => page.evaluate(n => document.querySelector(`.view.active [data-figure="${n}"]`)?.textContent.trim(), n);
  const violations = () => page.evaluate(() => window.__csp);
  const lockShown = () => page.evaluate(() => [...document.querySelectorAll("body *")].some(e => e.offsetParent && e.children.length < 30 && /^PesaPilot is locked/.test(e.innerText.trim())));

  // 3. Normal release path
  await page.goto(BASE + "/r1/"); await wait(1300);
  assert.ok(await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some(f => f.family.includes("Inter") && f.status === "loaded"); }), "font did not load");
  await submit("welcomeForm", { welcomeName: "Test", welcomePin: "1234", welcomePinConfirm: "1234" }); await wait(900);
  await view("money"); await act("edit-account", "mpesa"); await submit("accountForm", { accOpening: "10000" }); await wait(150);
  await view("home"); await act("add-expense"); await submit("transactionForm", { txAmount: "500", txCategoryForm: "Food", txAccountForm: "mpesa" }); await wait(150);
  await view("money"); await act("add-transfer"); await submit("transferForm", { trAmount: "1000", trFrom: "mpesa", trTo: "cash" }); await wait(150);
  await view("goals"); await act("add-goal"); await submit("goalForm", { goalName: "School fees", goalTarget: "20000" }); await wait(150);
  const gid = await page.evaluate(() => JSON.parse(localStorage.getItem("pesapilot_v2")).goals[0].id);
  await view("goals"); await act("contribute-goal", gid); await submit("contributionForm", { contributionAccount: "mpesa", contributionAmount: "3000" }); await wait(150);
  await view("home");
  assert.deepEqual([await fig("home-free"), await fig("home-set-aside"), await fig("total-held")], ["KSh 6,500", "KSh 3,000", "KSh 9,500"]);
  await view("settings"); const [dl] = await Promise.all([page.waitForEvent("download"), act("export-backup")]);
  const backup = fs.readFileSync(await dl.path(), "utf8"); assert.ok(backup.includes('"transactions"') && !/pinHash|"pin":"\d/.test(backup), "backup content");
  await view("home"); await act("add-expense"); await submit("transactionForm", { txAmount: "100", txCategoryForm: "Food", txAccountForm: "cash" }); await wait(150);
  await view("settings"); const nav = page.waitForNavigation().catch(() => {});
  await page.setInputFiles("#importFile", { name: "b.json", mimeType: "application/json", buffer: Buffer.from(backup) }); await nav; await wait(1300);
  assert.ok(await lockShown(), "PIN lock not shown after reload");
  for (const d of "1234") { await page.evaluate(d => [...document.querySelectorAll("button")].find(x => x.offsetParent && x.innerText.trim() === d).click(), d); await wait(80); }
  await wait(900); assert.ok(!(await lockShown()), "PIN did not unlock");
  await view("home"); assert.deepEqual([await fig("home-free"), await fig("total-held")], ["KSh 6,500", "KSh 9,500"]);
  assert.deepEqual(await violations(), []); assert.deepEqual(errors, []);
  pass("release path: app runs under the real headers with 0 policy violations; accounts, expense, transfer, set-aside, backup (no PIN), import, PIN lock/unlock all correct");

  // 4. Rollback path, same origin (same storage): Release 1 data → rollback app → Release 1 again
  await page.evaluate(() => localStorage.clear());
  const seed = realisticMonth(); delete seed.pin;
  await page.evaluate(s => { localStorage.setItem("pesapilot_v2", JSON.stringify(s)); localStorage.setItem("pesapilot_onboarding_v1", "done"); }, seed);
  await page.goto(BASE + "/r1/"); await wait(1300);                                     // Release 1 upgrades in memory on opening…
  await view("settings"); await page.evaluate(() => document.getElementById("profileForm").requestSubmit()); await wait(300);  // …and writes schema 10 at the next save
  const upgraded = await page.evaluate(() => JSON.parse(localStorage.getItem("pesapilot_v2")));
  assert.equal(upgraded.schemaVersion, 10);
  await view("home"); const before = [await fig("home-free"), await fig("home-set-aside"), await fig("total-held")];
  await page.goto(BASE + "/rb/"); await wait(1300); await page.reload(); await wait(1300); // rollback app opens it (twice)
  assert.deepEqual(await violations(), [], "rollback app caused policy violations");
  const afterRb = await page.evaluate(() => JSON.parse(localStorage.getItem("pesapilot_v2")));
  for (const k of ["accounts", "allocations", "transactions", "goals", "debts", "bills"]) assert.deepEqual(afterRb[k], upgraded[k], `rollback app changed ${k}`);
  await page.goto(BASE + "/r1/"); await wait(1300); await view("home");                  // re-release
  assert.deepEqual([await fig("home-free"), await fig("home-set-aside"), await fig("total-held")], before);
  assert.deepEqual(await violations(), []); assert.deepEqual(errors, []);
  pass(`rollback path: rollback app opens Release 1 data with 0 violations; accounts, allocations, transactions, goals, debts, bills unchanged; after re-release Home shows the same ${before.join(" / ")}`);

  // Only app files are reachable through the stand-in (the real Netlify preview is checked separately)
  for (const p of ["/docs/DECISIONS.md", "/tests/run.js", "/CLAUDE.md", "/package.json", "/netlify.toml", "/release/rollback/schema10-safe-index.html"]) {
    const r = await page.request.get(BASE + p); assert.equal(r.status(), 404, p);
  }
  pass("internal paths return 404 through the stand-in");
  await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${results.length} of 6 release/rollback checks passed`);
})().catch(e => { console.error("FAIL  " + (e && e.message || e)); server.close(); process.exit(1); });
