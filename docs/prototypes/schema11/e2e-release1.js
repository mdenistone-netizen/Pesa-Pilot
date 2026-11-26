// End-to-end cancellation-recovery test (owner request, 26 Nov). Planning evidence only.
// Real Release 1 build (index.html on this branch) + the schema 11 REFERENCE model (reference.js).
// Run: node docs/prototypes/schema11/e2e-release1.js
"use strict";
const assert = require("assert");
const h = require("../../../tests/harness.js");
const { baseState } = require("../../../tests/fixtures.js");
const ref = require("./reference.js");
const { willIMakeIt } = require("../will-i-make-it/model.js");
const TODAY = "2026-11-25";
const step = (n, text) => console.log(`${n}. ${text}`);

(async () => {
  const { page, context, errors, dialogs } = await h.openApp({ seed: baseState() });

  // 1. Create an expected payment in Release 1 (real UI).
  await h.goView(page, "plan");
  await h.clickAction(page, "add-expected");
  await h.submitForm(page, "expectedForm", { expSource: "Client payment", expAmount: "3000", expDate: "2026-11-24" });
  let s = await h.storedState(page);
  const client = s.expectedIncome.find(i => i.source === "Client payment");
  assert.ok(client && client.status === "expected" && s.schemaVersion === 10);
  step(1, `Release 1 created "Client payment" KSh 3,000 expected 24 Nov (schema ${s.schemaVersion}, status ${client.status}).`);

  // 2. Cancel it in schema 11 (reference model), as "It won't come" would.
  const s11 = ref.cancelExpected(s, client.id, "2026-11-25");
  assert.equal(s11.schemaVersion, 11);
  assert.equal(ref.pending(s11).length, 0);
  step(2, `Schema 11 cancelled it: status "${s11.expectedIncome[0].status}", cancelledAt ${s11.expectedIncome[0].cancelledAt}; pending payments: ${ref.pending(s11).length}.`);

  // 3. Open in Release 1 (stale tab / rollback scenario) …
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [h.STORAGE_KEY, JSON.stringify(s11)]);
  await page.reload(); await h.settle(page);
  await h.goView(page, "plan");
  const planText = await h.bodyText(page);
  const shownByRelease1 = planText.includes("Client payment");
  await h.goView(page, "home");
  const homeText = await h.bodyText(page);
  const ifArrivesLine = /If expected income arrives/.test(homeText);
  await h.goView(page, "plan");
  step(3, `Release 1 OPENS it: listed on Plan as expected: ${shownByRelease1}; Home "If expected income arrives" line includes it: ${ifArrivesLine}. Stored data unchanged: ${JSON.stringify(await h.storedState(page)) === JSON.stringify(s11)}.`);

  // … and SAVES (any edit; here: adding another expected payment).
  await h.clickAction(page, "add-expected");
  await h.submitForm(page, "expectedForm", { expSource: "Chama payout", expAmount: "1000", expDate: "2026-12-05" });
  const afterR1 = await h.storedState(page);
  const c1 = afterR1.expectedIncome.find(i => i.id === client.id);
  step(4, `Release 1 SAVES: schema ${afterR1.schemaVersion}; client status "${c1.status}"; cancelledAt kept: ${c1.cancelledAt === "2026-11-25"}.`);
  assert.equal(afterR1.schemaVersion, 10); assert.equal(c1.status, "expected"); assert.equal(c1.cancelledAt, "2026-11-25");

  // 5. Reopen in the "new application" (schema 11 reference load).
  const back = ref.load(afterR1);
  const cBack = back.expectedIncome.find(i => i.id === client.id);
  const pending = ref.pending(back), late = ref.lateReminders(back, TODAY);
  assert.equal(back.schemaVersion, 11);
  assert.equal(cBack.status, "cancelled");
  assert.deepEqual(pending.map(i => i.source), ["Chama payout"]);           // the cancelled one is gone; Release 1's new one kept
  assert.equal(late.length, 0);                                              // client was due 24 Nov: would be "Late" if it had come back
  // Forecasts: DB-5 "if it arrives" lines are built from pending payments only.
  const forecast = willIMakeIt({ today: TODAY, free: 4000, setAside: 0, pattern: "irregular", planningDays: 7, mustPay: [], goalPlan: 0, planned: 0, buffer: 0, usualDaily: 300,
    expected: pending.map(i => ({ name: i.source, amount: i.amount, date: i.expectedDate || TODAY })) });
  assert.deepEqual(forecast.ifArrives.map(x => x.name), ["Chama payout"]);
  // Idempotent: loading again changes nothing.
  assert.deepEqual(ref.load(back), back);
  step(5, `New app reopens: schema ${back.schemaVersion}; client status "${cBack.status}" (restored from cancelledAt); pending: [${pending.map(i => i.source)}]; late reminders: ${late.length}; forecast lines: [${forecast.ifArrives.map(x => x.name)}]; second load identical: true.`);

  // 6. Backup-version safeguard: Release 1 refuses a schema 11 backup and a schema 11 safety backup.
  const backup11 = { app: "PesaPilot", backupVersion: ref.BACKUP_VERSION, schemaVersion: 11, exportedAt: "2026-11-25T10:00:00Z", data: s11 };
  const before = await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  await h.goView(page, "settings");
  await page.setInputFiles("#importFile", { name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup11)) });
  await page.waitForTimeout(1200);
  const importMsg = await h.toastText(page);
  const unchangedAfterImport = before === await page.evaluate(() => JSON.stringify(Object.entries(localStorage)));
  await page.evaluate(v => localStorage.setItem("pesapilot_safety_backup_v9", v), JSON.stringify(backup11));
  const before2 = await h.storedState(page);
  await h.clickAction(page, "restore-safety-backup"); await page.waitForTimeout(1200);
  const restoreMsg = await h.toastText(page);
  const unchangedAfterRestore = JSON.stringify(before2) === JSON.stringify(await h.storedState(page));
  step(6, `Release 1 import of a schema 11 backup: refused="${importMsg}", storage unchanged: ${unchangedAfterImport}. Restore of a schema 11 safety backup: "${restoreMsg}", records unchanged: ${unchangedAfterRestore}.`);
  assert.ok(unchangedAfterImport && unchangedAfterRestore);
  assert.match(importMsg, /newer version/); assert.match(restoreMsg, /newer version/);

  assert.deepEqual(errors, []);
  console.log("\nEnd-to-end cancellation recovery: PASS (Release 1 real build + schema 11 reference model).");
  await context.close(); await h.closeBrowser();
})().catch(async e => { console.error(e); await h.closeBrowser(); process.exit(1); });
