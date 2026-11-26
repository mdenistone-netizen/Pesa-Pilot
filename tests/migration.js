// Release-1 migration verification (DEC-018, items 2-4).
// For each representative data copy:
//   A. load it in the ORIGINAL live version (main @ 8e33d44) -> what users see today
//   B. load it in the new version -> upgraded data
//   C. compare every record, and check balances with an independent oracle
//   D. roll back: pre-accounts copy -> import into the original version -> identical to A
// Run: node tests/migration.js
const assert = require("assert/strict");
const fs = require("fs"), os = require("os"), path = require("path"), { execSync } = require("child_process");
const { chromium } = require("playwright");
const h = require("./harness");
const { corpus } = require("./legacy-fixtures");

const ORIGINAL_COMMIT = "8e33d44";
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pp-orig-"));
fs.writeFileSync(path.join(dir, "index.html"), execSync(`git show ${ORIGINAL_COMMIT}:index.html`, { cwd: path.join(__dirname, "..") }));
const ORIGINAL_URL = "file://" + path.join(dir, "index.html");
// Emergency rollback target (RELEASE_1_CHECKLIST §8): the Phase 0.5 build, whose loader never
// deletes or reclassifies data it does not understand (DEC-004).
const SAFE_ROLLBACK_COMMIT = "8370097";
const safeDir = fs.mkdtempSync(path.join(os.tmpdir(), "pp-safe-"));
fs.writeFileSync(path.join(safeDir, "index.html"), execSync(`git show ${SAFE_ROLLBACK_COMMIT}:index.html`, { cwd: path.join(__dirname, "..") }));
async function exportFrom(browser, url, stored) {
  const page = await (await browser.newContext({ acceptDownloads: true, timezoneId: "Africa/Nairobi" })).newPage();
  page.on("dialog", d => d.accept());
  await page.clock.setFixedTime(h.FIXED_NOW);
  await page.goto(url);
  await page.evaluate(seed => { localStorage.clear(); localStorage.setItem("pesapilot_onboarding_v1", "done"); localStorage.setItem("pesapilot_v2", JSON.stringify(seed)); }, stored);
  await page.reload(); await page.waitForTimeout(1200);
  await page.evaluate(() => document.querySelector('[data-view="settings"]').click());
  const [download] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => document.querySelector('[data-action="export-backup"]').click())]);
  const data = JSON.parse(fs.readFileSync(await download.path(), "utf8")).data;
  await page.context().close();
  return data;
}

async function originalApp(browser, seed, importPayload = null) {
  const page = await (await browser.newContext({ acceptDownloads: true, timezoneId: "Africa/Nairobi" })).newPage();
  page.on("dialog", d => d.accept());
  await page.clock.setFixedTime(h.FIXED_NOW);
  await page.goto(ORIGINAL_URL);
  await page.evaluate(seed => { localStorage.clear(); localStorage.setItem("pesapilot_onboarding_v1", "done"); if (seed) localStorage.setItem("pesapilot_v2", JSON.stringify(seed)); }, seed);
  await page.reload(); await page.waitForTimeout(1200);
  if (importPayload) {
    await page.evaluate(() => document.querySelector('[data-view="settings"]').click());
    const nav = page.waitForNavigation();
    await page.setInputFiles("#importFile", { name: "copy.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(importPayload)) });
    await nav; await page.waitForTimeout(1200);
  }
  await page.evaluate(() => document.querySelector('[data-view="settings"]').click());
  const [download] = await Promise.all([page.waitForEvent("download"), page.evaluate(() => document.querySelector('[data-action="export-backup"]').click())]);
  const data = JSON.parse(fs.readFileSync(await download.path(), "utf8")).data;
  await page.context().close();
  return data;
}

// ---- Independent oracle: FINANCIAL_RULES.md sections 1-2, written separately from the app.
const cents = v => Math.round((Number(v) || 0) * 100);
function oracleAccountBalances(d) {
  const ids = new Set(d.accounts.map(a => a.id)), out = {};
  d.accounts.forEach(a => { out[a.id] = cents(a.openingBalance); });
  d.transactions.forEach(t => {
    if (t.reversedBy || t.reversesId) return;
    const v = cents(t.amount);
    if (t.type === "transfer") { if (ids.has(t.accountId) && ids.has(t.toAccountId) && t.accountId !== t.toAccountId) { out[t.accountId] -= v; out[t.toAccountId] += v; } return; }
    if (!ids.has(t.accountId)) return;
    if (t.type === "income" || t.type === "borrow") out[t.accountId] += v;
    else if (t.type === "expense" || t.type === "debt_repayment") out[t.accountId] -= v;
    else if (t.type === "adjustment") out[t.accountId] += t.direction === "out" ? -v : v;
  });
  return out;
}
const oldBalanceCents = d => d.transactions.reduce((s, t) => s + (t.type === "income" ? cents(t.amount) : -cents(t.amount)), 0);
const goalLinkedCents = d => d.transactions.filter(t => String(t.reference || "").startsWith("goal:")).reduce((s, t) => s + cents(t.amount), 0);
const byId = list => new Map(list.map(x => [String(x.id), x]));
const kes = c => "KSh " + Math.abs(Math.round(c / 100)).toLocaleString("en-KE");
const signedKes = c => (c < 0 ? "−" : "") + kes(c);

async function verify(name, seed, browser) {
  const A = await originalApp(browser, seed);                       // what the user has today
  const { page, context, errors } = await h.openApp({ seed });
  await page.waitForTimeout(700);                                   // PIN conversion is async
  const stored = await h.storedState(page);
  const B = (await h.exportBackup(page)).data;                      // upgraded

  // -- every record survives with the same values
  const a = byId(A.transactions), b = byId(B.transactions);
  assert.deepEqual([...b.keys()].sort(), [...a.keys()].sort(), `${name}: transaction ids differ`);
  for (const [tid, oldT] of a) {
    const newT = b.get(tid), ref = String(oldT.reference || "");
    const expectedType = oldT.type === "expense" && ref.startsWith("goal:") ? "transfer" : oldT.type === "expense" && ref.startsWith("debt:") ? "debt_repayment" : oldT.type;
    assert.equal(newT.type, expectedType, `${name}: tx ${tid} type`);
    assert.equal(cents(newT.amount), cents(oldT.amount), `${name}: tx ${tid} amount`);
    for (const f of ["date", "category", "notes", "description", "reference"]) assert.equal(newT[f], oldT[f], `${name}: tx ${tid} ${f}`);
    if (expectedType !== oldT.type) assert.equal(newT.legacyType, oldT.type, `${name}: tx ${tid} legacyType`);
    assert.ok(B.accounts.some(acc => acc.id === newT.accountId), `${name}: tx ${tid} has an account`);
  }
  const ag = byId(A.goals), bg = byId(B.goals);
  for (const [gid, g] of ag) {
    assert.equal(cents(bg.get(gid).current), cents(g.current), `${name}: goal ${gid} progress`);
    assert.equal(bg.get(gid).target, g.target);
    const allocated = B.allocations.filter(x => String(x.goalId) === gid).reduce((s, x) => s + cents(x.amount), 0);
    assert.equal(allocated, cents(g.current), `${name}: goal ${gid} allocations = progress`);
  }
  const ad = byId(A.debts), bd = byId(B.debts);
  for (const [did, dOld] of ad) {
    const dNew = bd.get(did);
    assert.equal(cents(dNew.total), cents(dOld.total)); assert.equal(cents(dNew.repaid), cents(dOld.repaid), `${name}: debt ${did} repaid`);
    assert.deepEqual(dNew.repayments.map(r => [r.id, cents(r.amount), r.date]), dOld.repayments.map(r => [r.id, cents(r.amount), r.date]));
  }
  const ab = byId(A.bills), bb = byId(B.bills);
  assert.deepEqual([...bb.keys()].sort(), [...ab.keys()].sort(), `${name}: bills`);
  for (const [bid, billOld] of ab) {
    const billNew = bb.get(bid);
    assert.deepEqual(billNew.paidOccurrences, billOld.paidOccurrences, `${name}: bill ${bid} paid months`);
    assert.deepEqual(billNew.payments.map(p => [p.id, p.occurrenceDate, p.paymentDate, cents(p.amount)]), billOld.payments.map(p => [p.id, p.occurrenceDate, p.paymentDate, cents(p.amount)]), `${name}: bill ${bid} payments`);
  }
  assert.deepEqual(B.budgets.categoryBudgets, A.budgets.categoryBudgets, `${name}: budgets`);
  assert.equal(B.budgets.monthlySpending, A.budgets.monthlySpending);
  for (const c of A.categories) assert.ok(B.categories.some(x => x.name === c.name), `${name}: category ${c.name}`);
  for (const f of ["name", "paydayDay", "monthlyIncome", "plannedExpenses", "currency", "theme"]) assert.equal(B.profile[f], A.profile[f], `${name}: profile.${f}`);

  // -- balances: new total = what the old app showed + savings it wrongly counted as spent
  const balances = oracleAccountBalances(B), totalNew = Object.values(balances).reduce((s, v) => s + v, 0);
  assert.equal(totalNew, oldBalanceCents(A) + goalLinkedCents(A), `${name}: total held`);
  await h.goView(page, "money");
  for (const acc of B.accounts) {
    const shown = await h.figure(page, "balance", `#moneyView [data-account="${acc.id}"]`);
    assert.equal(shown, (balances[acc.id] < 0 ? "−" : "") + kes(balances[acc.id]), `${name}: account card ${acc.name} matches oracle`);
  }
  // -- PIN converted, never exported
  if (seed.pin) {
    assert.equal(stored.pin, ""); assert.equal(stored.pinHash.length, seed.pin.length);
    const all = await page.evaluate(() => Object.keys(localStorage).map(k => localStorage.getItem(k)).join("|"));
    assert.ok(!all.includes(`"${seed.pin}"`), `${name}: plain PIN left in storage`);
  }
  assert.ok(!("pin" in B) && !("pinHash" in B), `${name}: PIN material in backup`);
  // -- idempotent: loading the upgraded data again changes nothing
  await page.evaluate(({ key, data }) => { const cur = JSON.parse(localStorage.getItem(key)); localStorage.setItem(key, JSON.stringify({ ...data, pinHash: cur.pinHash, pin: cur.pin })); }, { key: h.STORAGE_KEY, data: B });
  await page.reload(); await h.settle(page);
  assert.deepEqual((await h.exportBackup(page)).data, B, `${name}: second load changed data`);
  // -- rollback: pre-accounts copy into the original version gives back exactly A
  await h.goView(page, "settings");
  const [download] = await Promise.all([page.waitForEvent("download"), h.clickAction(page, "download-pre-upgrade")]);
  const copy = JSON.parse(fs.readFileSync(await download.path(), "utf8"));
  assert.equal(errors.length, 0, `${name}: page errors ${errors.join(" | ")}`);
  await context.close();
  const R = await originalApp(browser, null, copy);
  for (const key of ["transactions", "goals", "bills", "debts", "budgets"]) assert.deepEqual(R[key], A[key], `${name}: rollback ${key}`);
  // -- emergency code rollback: upgraded data through the safe rollback build and back is unchanged
  const viaSafe = await exportFrom(browser, "file://" + path.join(safeDir, "index.html"), B);
  for (const key of ["accounts", "allocations", "expectedIncome"]) assert.deepEqual(viaSafe[key], B[key], `${name}: safe rollback build kept ${key}`);
  assert.deepEqual(viaSafe.transactions.map(t => [t.id, t.type, t.amount, t.accountId, t.toAccountId]), B.transactions.map(t => [t.id, t.type, t.amount, t.accountId, t.toAccountId]), `${name}: safe rollback build kept transactions`);
  // -- and the original build would damage upgraded data, so it must never be redeployed
  const viaOriginal = await exportFrom(browser, ORIGINAL_URL, B);
  const damaged = !viaOriginal.accounts || viaOriginal.transactions.some((t, i) => t.type !== B.transactions[i].type);
  if (B.transactions.some(t => t.type === "transfer" || t.type === "debt_repayment")) assert.ok(damaged, `${name}: expected the original build to be unsafe for upgraded data`);
  return { transactions: A.transactions.length, accounts: B.accounts.length, totalOld: oldBalanceCents(A), totalNew, damaged };
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const [name, make] of Object.entries(corpus)) {
    try {
      const r = await verify(name, make(), browser);
      console.log(`PASS  ${name.padEnd(13)} ${String(r.transactions).padStart(5)} entries · ${r.accounts} accounts · old total ${signedKes(r.totalOld)} → new total ${signedKes(r.totalNew)} (difference = savings no longer counted as spent) · rollback identical · safe-rollback build keeps data${r.damaged ? " · original build would damage it" : ""}`);
    } catch (err) { failed++; console.log(`FAIL  ${name}\n      ${String(err.message).split("\n").slice(0, 3).join(" ")}`); }
  }
  await browser.close(); await h.closeBrowser();
  console.log(`\n${Object.keys(corpus).length - failed} of ${Object.keys(corpus).length} representative data sets upgraded and rolled back correctly`);
  process.exit(failed ? 1 : 0);
})();
