// PesaPilot regression suite. Run: npm test   (or: node tests/run.js)
//
// Each test is either:
//   test(...)        a REGRESSION test - must pass; a failure fails the run.
//   knownDefect(...) asserts the CORRECT behaviour for a confirmed bug that is
//                    scheduled for a later phase. It is expected to fail today
//                    and is reported as "KNOWN DEFECT". When the fix lands the
//                    runner reports "DEFECT FIXED" so it can be promoted to test().
const assert = require("assert/strict");
const h = require("./harness");
const { baseState, tx, realisticMonth } = require("./fixtures");

const tests = [];
const test = (name, fn) => tests.push({ name, fn, known: false });
const knownDefect = (id, name, fn) => tests.push({ name: `[${id}] ${name}`, fn, known: true });

const kes = n => "KSh " + n.toLocaleString("en-KE");
const noErrors = errors => assert.deepEqual(errors, [], "page raised errors: " + errors.join(" | "));

// ---------------------------------------------------------------- baseline
test("fresh install shows the welcome/onboarding form", async () => {
  const { page, context, errors } = await h.openApp({ onboardingDone: false });
  assert.ok(await page.$("#welcomeForm"), "welcome form not shown");
  noErrors(errors); await context.close();
});

test("every screen renders without errors", async () => {
  const { page, context, errors } = await h.openApp({ seed: realisticMonth() });
  for (const view of ["home", "money", "plan", "goals", "bills", "debts", "reports", "settings"]) {
    await h.goView(page, view);
    const html = await page.evaluate(v => document.getElementById(v + "View")?.innerHTML || "", view);
    assert.ok(html.length > 200, `${view} view is empty`);
  }
  noErrors(errors); await context.close();
});

test("home balance equals all-time income minus all-time expenses (current rule)", async () => {
  const { page, context, errors } = await h.openApp({ seed: realisticMonth() });
  // income 53,000 - expenses 30,100 = 22,900 (savings & debt repayments counted as expenses today)
  assert.match(await h.bodyText(page), /recorded money KSh 22,900/);
  noErrors(errors); await context.close();
});

test("adding an expense through the form reduces the balance", async () => {
  const { page, context, errors } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "money");
  await h.clickAction(page, "add-expense");
  await page.fill("#txAmount", "900");
  await page.evaluate(() => document.getElementById("transactionForm").requestSubmit());
  await page.waitForTimeout(200);
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /recorded money KSh 22,000/);
  const saved = await h.storedState(page);
  assert.equal(saved.transactions.length, 9);
  noErrors(errors); await context.close();
});

test("recording a debt repayment creates exactly one linked expense and updates the debt", async () => {
  const { page, context, errors } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "debts");
  await h.clickAction(page, "repay-debt", 40);
  await page.fill("#repaymentAmount", "1000");
  await page.evaluate(() => document.getElementById("repaymentForm").requestSubmit());
  await page.waitForTimeout(200);
  const s = await h.storedState(page);
  assert.equal(s.debts[0].repaid, 3000);
  const linked = s.transactions.filter(t => String(t.reference).startsWith("debt:40:"));
  assert.equal(linked.length, 2);
  noErrors(errors); await context.close();
});

test("paying a bill creates exactly one linked expense for that occurrence", async () => {
  const { page, context, errors } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "bills");
  await h.clickAction(page, "pay-bill", 32);
  await page.evaluate(() => document.getElementById("payBillForm").requestSubmit());
  await page.waitForTimeout(200);
  const s = await h.storedState(page);
  const linked = s.transactions.filter(t => String(t.reference).startsWith("bill:32:"));
  assert.equal(linked.length, 1, "expected one KPLC expense");
  assert.equal(linked[0].amount, 1500);
  noErrors(errors); await context.close();
});

test("backup export -> import round-trips every record unchanged", async () => {
  const first = await h.openApp({ seed: realisticMonth() });
  const backup = await h.exportBackup(first.page);
  assert.equal(backup.app, "PesaPilot");
  await first.context.close();
  const second = await h.openApp({ seed: baseState() });
  await h.importBackup(second.page, backup);
  const again = await h.exportBackup(second.page);
  for (const key of ["transactions", "goals", "bills", "debts", "budgets", "categories", "profile"]) {
    assert.deepEqual(again.data[key], backup.data[key], `${key} changed in round-trip`);
  }
  noErrors(second.errors); await second.context.close();
});

test("legacy data: debt repayments without transactions are rebuilt once, not duplicated", async () => {
  const legacy = { schemaVersion: 3, profile: { name: "Old" }, transactions: [tx(1, "income", 10000, "Income", "2026-10-01")],
    goals: [], bills: [], debts: [{ id: 5, name: "Chama loan", total: 4000, repaid: 1500, repayments: [{ id: 6, amount: 1500, date: "2026-10-10" }] }], nextId: 10 };
  const { page, context, errors } = await h.openApp({ seed: legacy });
  const once = (await h.exportBackup(page)).data;
  assert.equal(once.transactions.filter(t => t.reference === "debt:5:6").length, 1);
  await h.importBackup(page, { app: "PesaPilot", backupVersion: 3, data: once });
  const twice = (await h.exportBackup(page)).data;
  assert.equal(twice.transactions.filter(t => t.reference === "debt:5:6").length, 1);
  noErrors(errors); await context.close();
});

test("a safety backup is stored before an older schema is upgraded", async () => {
  const legacy = { schemaVersion: 4, profile: { name: "Old" }, transactions: [tx(1, "income", 500, "Income", "2026-10-01")], goals: [], bills: [], debts: [] };
  const { page, context } = await h.openApp({ seed: legacy });
  const safety = await page.evaluate(() => JSON.parse(localStorage.getItem("pesapilot_safety_backup_v9") || "null"));
  assert.equal(safety?.sourceSchemaVersion, 4);
  assert.equal(safety.data.transactions[0].amount, 500);
  await context.close();
});

// ---------------------------------------------- migration safety (Phase 0.5)
test("migration keeps fields it does not recognise on every record type", async () => {
  const seed = realisticMonth();
  seed.transactions[0].accountId = "mpesa";
  seed.goals[0].accountId = "savings-box";
  seed.goals[0].contributions[0].fromAccount = "mpesa";
  seed.bills[0].payee = "Landlord";
  seed.debts[0].direction = "i_owe";
  seed.accounts = [{ id: "mpesa", name: "M-Pesa", openingBalance: 1200 }];
  const { page, context } = await h.openApp({ seed });
  const d = (await h.exportBackup(page)).data;
  assert.equal(d.transactions.find(t => t.id === 1).accountId, "mpesa");
  assert.equal(d.goals[0].accountId, "savings-box");
  assert.equal(d.goals[0].contributions[0].fromAccount, "mpesa");
  assert.equal(d.bills[0].payee, "Landlord");
  assert.equal(d.debts[0].direction, "i_owe");
  assert.deepEqual(d.accounts, seed.accounts);
  await context.close();
});

test("migration keeps transaction types it does not recognise (e.g. transfer)", async () => {
  const seed = realisticMonth();
  seed.transactions.push(tx(9, "transfer", 2000, "Transfer", "2026-11-15", { fromAccount: "mpesa", toAccount: "bank" }));
  const { page, context, errors } = await h.openApp({ seed });
  const t = (await h.exportBackup(page)).data.transactions.find(x => x.id === 9);
  assert.equal(t.type, "transfer");
  assert.equal(t.fromAccount, "mpesa");
  assert.equal(t.toAccount, "bank");
  // and it is not counted as an expense: balance unchanged at 22,900
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /recorded money KSh 22,900/);
  noErrors(errors); await context.close();
});

test("migration is idempotent: loading migrated data again changes nothing", async () => {
  const { page, context } = await h.openApp({ seed: realisticMonth() });
  const once = (await h.exportBackup(page)).data;
  await page.evaluate(({ key, data }) => localStorage.setItem(key, JSON.stringify(data)), { key: h.STORAGE_KEY, data: once });
  await page.reload(); await h.settle(page);
  const twice = (await h.exportBackup(page)).data;
  assert.deepEqual(twice, once);
  await context.close();
});

test("migration normalises legacy types: missing -> expense, 'Income' -> income", async () => {
  const seed = realisticMonth();
  delete seed.transactions[2].type;          // 6,500 food with no type
  seed.transactions[1].type = "Income";      // 8,000 freelance, capitalised
  const { page, context } = await h.openApp({ seed });
  const d = (await h.exportBackup(page)).data;
  assert.equal(d.transactions.find(t => t.id === 3).type, "expense");
  assert.equal(d.transactions.find(t => t.id === 2).type, "income");
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /recorded money KSh 22,900/);
  await context.close();
});

test("migration still repairs invalid values (negative amounts, unknown frequency)", async () => {
  const seed = realisticMonth();
  seed.transactions[2].amount = -50;
  seed.bills[1].frequency = "fortnightly-ish";
  const { page, context } = await h.openApp({ seed });
  const d = (await h.exportBackup(page)).data;
  assert.equal(d.transactions.find(t => t.id === 3).amount, 0);
  assert.equal(d.bills.find(b => b.id === 32).frequency, "monthly");
  await context.close();
});

// --------------------------------------------- known defects (later phases)
knownDefect("D2", "savings contributions are not counted as spending", async () => {
  const { page, context } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "reports");
  // Real November spending excluding the 3,000 savings move = 25,900 (app shows 28,900)
  assert.match(await h.bodyText(page), new RegExp(kes(25900)));
  assert.doesNotMatch(await h.bodyText(page), new RegExp(kes(28900)));
  await context.close();
});

knownDefect("D4", "deleting a goal's linked savings entry also reverses the goal progress", async () => {
  const { page, context } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "money");
  await h.clickAction(page, "delete-transaction", 5);
  await page.waitForTimeout(200);
  const s = await h.storedState(page);
  assert.equal(s.transactions.some(t => t.id === 5), false);
  assert.equal(s.goals[0].current, 0, "goal still shows the deleted 3,000");
  await context.close();
});

knownDefect("D6", "exported backups never contain the PIN in plain text", async () => {
  const seed = realisticMonth(); seed.pin = "4821";
  const { page, context } = await h.openApp({ seed });
  await page.evaluate(() => { for (const d of "4821") document.querySelector(`[data-pin="${d}"]`).click(); });
  await page.waitForTimeout(300);
  const backup = await h.exportBackup(page);
  assert.ok(!JSON.stringify(backup).includes('"4821"'), "PIN 4821 found in backup");
  await context.close();
});

knownDefect("D3", "the app can record money other people owe me", async () => {
  const { page, context } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "debts");
  assert.match(await h.bodyText(page), /owed to me|owe me|lent/i);
  await context.close();
});

// ------------------------------------------------------------------ runner
(async () => {
  const only = process.argv[2];
  let failed = 0, passed = 0, known = 0, fixed = 0;
  for (const t of tests) {
    if (only && !t.name.includes(only)) continue;
    try {
      await t.fn();
      if (t.known) { fixed++; console.log(`DEFECT FIXED  ${t.name}  -> promote to a regression test`); }
      else { passed++; console.log(`PASS          ${t.name}`); }
    } catch (err) {
      const msg = String(err.message).split("\n")[0].slice(0, 160);
      if (t.known) { known++; console.log(`KNOWN DEFECT  ${t.name}\n              (${msg})`); }
      else { failed++; console.log(`FAIL          ${t.name}\n              ${msg}`); }
    }
  }
  await h.closeBrowser();
  console.log(`\n${passed} passed, ${failed} failed, ${known} known defects open, ${fixed} known defects now fixed`);
  process.exit(failed ? 1 : 0);
})();
