// D14 point 5 evidence (owner, 26 Nov): does the REAL Release 1 build keep plannedLedger and plannedUsed when it saves,
// changes the plan by hand and deletes a planned expense? Then: does the reference model detect the deletion?
// Planning evidence only; uses copies of made-up data. Run: node docs/prototypes/planned-spending/release1-ledger.js
"use strict";
const assert = require("assert");
const h = require("../../../tests/harness.js");
const { realisticMonth, tx } = require("../../../tests/fixtures.js");
const model = require("./model.js");
const step = (n, t) => console.log(`${n}. ${t}`);

(async () => {
  const seed = realisticMonth(); seed.transactions.push(tx(50, "expense", 2000, "Shopping", "2026-11-25", { description: "School shoes (planned)" }));
  const { page, context, errors } = await h.openApp({ seed });
  // Make it schema 11-like: the expense holds 2,000 of the plan; the ledger says 2,000 is held this period.
  const s11 = await h.storedState(page);
  s11.schemaVersion = 11; s11.profile.plannedExpenses = 0;
  s11.profile.plannedLedger = { periodStart: "2026-11-25", used: 2000 };
  s11.transactions.find(t => t.id === 50).plannedUsed = 2000;
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [h.STORAGE_KEY, JSON.stringify(s11)]);
  await page.reload(); await h.settle(page);
  step(1, "Schema 11-like data: expense 50 holds 2,000 of the plan; plannedLedger { periodStart 2026-11-25, used 2000 }.");

  // Release 1 changes the plan by hand (an authorised change): planned spending 1,500.
  await h.goView(page, "plan"); await h.clickAction(page, "edit-plan");
  await h.submitForm(page, "plannerForm", { planExpenses: "1500" });
  let st = await h.storedState(page);
  step(2, `Release 1 edits the plan: plannedExpenses ${st.profile.plannedExpenses}; ledger kept: ${JSON.stringify(st.profile.plannedLedger)}; schema ${st.schemaVersion}.`);
  assert.equal(st.profile.plannedExpenses, 1500); assert.deepEqual(st.profile.plannedLedger, { periodStart: "2026-11-25", used: 2000 });

  // Release 1 deletes the planned expense.
  await h.goView(page, "money"); await h.clickAction(page, "delete-transaction", 50);
  st = await h.storedState(page);
  const gone = !st.transactions.some(t => t.id === 50);
  step(3, `Release 1 deletes expense 50: entry gone: ${gone}; ledger kept: ${JSON.stringify(st.profile.plannedLedger)}.`);
  assert.ok(gone); assert.deepEqual(st.profile.plannedLedger, { periodStart: "2026-11-25", used: 2000 });

  // Release 1 edits the profile (another full profile write).
  await h.goView(page, "settings");
  await page.evaluate(() => { const f = document.getElementById("profileForm"); document.getElementById("profileName").value = "Wanjiku M"; f.requestSubmit(); });
  await page.waitForTimeout(200);
  st = await h.storedState(page);
  step(4, `Release 1 edits the profile: name "${st.profile.name}"; ledger kept: ${JSON.stringify(st.profile.plannedLedger)}.`);
  assert.deepEqual(st.profile.plannedLedger, { periodStart: "2026-11-25", used: 2000 });

  // Reopen in the "new application" (reference model): map the stored data and look for discrepancies.
  const asModel = {
    schemaVersion: st.schemaVersion, period: { start: "2026-11-25", end: "2026-11-27" }, free: 10000, planned: st.profile.plannedExpenses,
    expenses: st.transactions.filter(t => t.type === "expense").map(t => ({ id: t.id, date: t.date, amount: t.amount, ...(t.plannedUsed ? { plannedUsed: t.plannedUsed } : {}) })),
    ledger: st.profile.plannedLedger,
  };
  const up = model.migrateTo11(asModel);
  const found = model.discrepancies(up);
  step(5, `New app reopens (schema ${asModel.schemaVersion} → ${up.schemaVersion}): discrepancies ${JSON.stringify(found.map(d => [d.key, d.amount]))}; manual plan change 1,500 accepted (not flagged); held back ${model.heldBack(up)}; Left to spend ${model.leftToSpend(up)} (10,000 − planned 1,500 − held back 2,000).`);
  assert.deepEqual(found.map(d => [d.key, d.amount]), [["deleted", 2000]]);
  assert.equal(model.leftToSpend(up), 6500);
  assert.deepEqual(errors, []);
  console.log("\nPart 1, Release 1 keeps plannedLedger through plan edit, delete and profile edit; the deletion is detected: PASS");
  await context.close();

  // ---- Part 2 (owner, 26 Nov): can an OLD Release 1 tab reopen a discrepancy the user has already resolved? ----
  // Tab A: Release 1, opened while the discrepancy was unresolved. Tab B: stands in for the new app and saves "Add back".
  const unresolved = st;                                                        // from part 1: ledger 2,000; expense 50 gone; planned 1,500
  const resolvedState = JSON.parse(JSON.stringify(unresolved));
  resolvedState.schemaVersion = 11; resolvedState.profile.plannedExpenses = 1500 + 2000; resolvedState.profile.plannedLedger = { periodStart: "2026-11-25", used: 0 };
  const ctx2 = await (await require("playwright").chromium.launch()).newContext({ timezoneId: "Africa/Nairobi" });
  const tabA = await ctx2.newPage(), tabB = await ctx2.newPage();
  for (const t of [tabA, tabB]) { t.on("dialog", d => d.accept()); await t.clock.setFixedTime(h.FIXED_NOW); }
  const url = "file://" + require("path").resolve(__dirname, "../../../index.html");
  await tabA.goto(url);
  await tabA.evaluate(([k, v]) => { localStorage.setItem("pesapilot_onboarding_v1", "done"); localStorage.setItem(k, v); }, [h.STORAGE_KEY, JSON.stringify(unresolved)]);
  await tabA.reload(); await tabA.waitForTimeout(1200);
  await tabA.evaluate(() => { window.__openedBeforeResolution = true; });
  await tabB.goto(url); await tabB.waitForTimeout(800);
  const reloaded = tabA.waitForEvent("load", { timeout: 5000 }).then(() => true).catch(() => false);
  await tabB.evaluate(([k, v]) => localStorage.setItem(k, v), [h.STORAGE_KEY, JSON.stringify(resolvedState)]);   // the user chose "Add back"
  const didReload = await reloaded; await tabA.waitForTimeout(1200);
  const stillOld = await tabA.evaluate(() => window.__openedBeforeResolution === true);
  step(6, `Tab B saves the resolution (Add back: planned 3,500, ledger 0). Old tab A reloaded automatically: ${didReload && !stillOld}.`);
  // Tab A (Release 1) now saves something ordinary: a profile edit.
  await tabA.evaluate(() => document.querySelector('[data-view="settings"]').click()); await tabA.waitForTimeout(200);
  await tabA.evaluate(() => { document.getElementById("profileName").value = "Wanjiku Mwangi"; document.getElementById("profileForm").requestSubmit(); });
  await tabA.waitForTimeout(300);
  const after = await tabA.evaluate(k => JSON.parse(localStorage.getItem(k)), h.STORAGE_KEY);
  const back = model.migrateTo11({ schemaVersion: after.schemaVersion, period: { start: "2026-11-25", end: "2026-11-27" }, free: 10000, planned: after.profile.plannedExpenses,
    expenses: after.transactions.filter(t => t.type === "expense").map(t => ({ id: t.id, date: t.date, amount: t.amount, ...(t.plannedUsed ? { plannedUsed: t.plannedUsed } : {}) })), ledger: after.profile.plannedLedger });
  step(7, `Old tab A saves a profile edit: name "${after.profile.name}"; planned ${after.profile.plannedExpenses}; ledger ${JSON.stringify(after.profile.plannedLedger)}; discrepancies when the new app reopens: ${JSON.stringify(model.discrepancies(back))}.`);
  assert.ok(didReload && !stillOld);
  assert.equal(after.profile.plannedExpenses, 3500); assert.deepEqual(after.profile.plannedLedger, { periodStart: "2026-11-25", used: 0 });
  assert.deepEqual(model.discrepancies(back), []); assert.equal(after.profile.name, "Wanjiku Mwangi");
  console.log("\nPart 2, an old tab reloads before it can save, so the resolved discrepancy stays resolved: PASS");
  await ctx2.browser().close(); await h.closeBrowser();
})().catch(async e => { console.error(e); await h.closeBrowser(); process.exit(1); });
