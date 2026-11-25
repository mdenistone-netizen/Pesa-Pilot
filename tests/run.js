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

test("home balance is the total held across all accounts", async () => {
  const { page, context, errors } = await h.openApp({ seed: realisticMonth() });
  // income 53,000 - spending 25,100 - debt repayment 2,000 = 25,900. The 3,000 goal
  // contribution is still the user's money (now in a savings account), not spending.
  // Schema 9 showed 22,900 because it counted that saving as an expense (defect D2).
  assert.match(await h.bodyText(page), /recorded money KSh 25,900 KSh 3,000 set aside for goals · KSh 22,900 available/);
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
  assert.match(await h.bodyText(page), /recorded money KSh 25,000/);
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
  seed.accounts = [{ id: "mpesa", name: "M-Pesa", kind: "mpesa", openingBalance: 1200, nickname: "Main line" }];
  const { page, context } = await h.openApp({ seed });
  const d = (await h.exportBackup(page)).data;
  assert.equal(d.transactions.find(t => t.id === 1).accountId, "mpesa");
  assert.equal(d.goals[0].accountId, "savings-box");
  assert.equal(d.goals[0].contributions[0].fromAccount, "mpesa");
  assert.equal(d.bills[0].payee, "Landlord");
  assert.equal(d.debts[0].direction, "i_owe");
  const mpesa = d.accounts.find(a => a.id === "mpesa");
  assert.equal(mpesa.openingBalance, 1200);
  assert.equal(mpesa.nickname, "Main line");
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
  // it has no valid destination account, so it moves nothing: total unchanged at 25,900
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /recorded money KSh 25,900/);
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
  assert.match(await h.bodyText(page), /recorded money KSh 25,900/);
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

// ------------------------------------- Phase 1: accounts, transfers, goal allocations
// A schema 10 wallet: KSh 10,000 salary in M-Pesa, an empty M-Shwari, two goals.
function wallet(extra = {}) {
  return baseState({
    schemaVersion: 10,
    accounts: [
      { id: "mpesa", name: "M-Pesa", kind: "mpesa", openingBalance: 0, openingDate: "", archived: false },
      { id: "cash", name: "Cash", kind: "cash", openingBalance: 0, openingDate: "", archived: false },
      { id: "mshwari", name: "M-Shwari", kind: "savings", openingBalance: 0, openingDate: "", archived: false }
    ],
    allocations: [],
    transactions: [tx(1, "income", 10000, "Income", "2026-11-20", { accountId: "mpesa" })],
    goals: [
      { id: 50, name: "Emergency fund", target: 20000, current: 0, targetDate: "", requiredMonthly: 0, requiredWeekly: 0, contributions: [] },
      { id: 51, name: "School fees", target: 15000, current: 0, targetDate: "", requiredMonthly: 0, requiredWeekly: 0, contributions: [] }
    ],
    ...extra
  });
}
const accountCard = async (page, name) => {
  await h.goView(page, "money");
  const text = await h.bodyText(page);
  const m = text.match(new RegExp(`${name} [A-Za-z /-]*? ?(−?KSh [0-9,]+) Set aside (KSh [0-9,]+) · Available (−?KSh [0-9,]+)`));
  assert.ok(m, `no account card for ${name}`);
  return { balance: m[1], setAside: m[2], available: m[3] };
};
const setAside = async (page, goalId, accountId, amount) => {
  await h.goView(page, "goals");
  await h.clickAction(page, "contribute-goal", goalId);
  await h.submitForm(page, "contributionForm", { contributionAccount: accountId, contributionAmount: String(amount) });
};
const goalSavedOf = async (page, goalId) => (await h.storedState(page)).goals.find(g => g.id === goalId).current;

test("upgrade 9 -> 10: accounts created, nothing lost, saving becomes a transfer, reversible", async () => {
  const seed = realisticMonth();
  const { page, context, errors } = await h.openApp({ seed });
  const d = (await h.exportBackup(page)).data;
  assert.equal(d.schemaVersion, 10);
  assert.deepEqual(d.transactions.map(t => t.id).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8], "every entry kept");
  const t5 = d.transactions.find(t => t.id === 5), t7 = d.transactions.find(t => t.id === 7);
  assert.deepEqual([t5.type, t5.legacyType, t5.toAccountId, t5.goalId], ["transfer", "expense", "savings-migrated", 20]);
  assert.deepEqual([t7.type, t7.legacyType], ["debt_repayment", "expense"]);
  assert.equal(d.goals[0].current, 3000, "goal progress unchanged");
  assert.deepEqual(d.allocations.map(a => [a.goalId, a.accountId, a.amount]), [[20, "savings-migrated", 3000]]);
  assert.equal(d.debts[0].repaid, 2000);
  assert.deepEqual((await accountCard(page, "M-Pesa")).balance, "KSh 35,600");
  assert.deepEqual((await accountCard(page, "Savings \\(before accounts\\)")).balance, "KSh 3,000");
  const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem("pesapilot_pre_v10_snapshot")));
  assert.equal(snapshot.backupVersion, 3, "snapshot must be importable by the schema 9 app");
  assert.deepEqual(snapshot.data, seed, "pre-upgrade snapshot is the untouched original");
  noErrors(errors); await context.close();
});

test("setting money aside inside M-Pesa keeps the balance and lowers what is available", async () => {
  const { page, context, errors } = await h.openApp({ seed: wallet() });
  await setAside(page, 50, "mpesa", 2000);
  assert.deepEqual(await accountCard(page, "M-Pesa"), { balance: "KSh 10,000", setAside: "KSh 2,000", available: "KSh 8,000" });
  assert.equal(await goalSavedOf(page, 50), 2000);
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /recorded money KSh 10,000 KSh 2,000 set aside for goals · KSh 8,000 available/);
  noErrors(errors); await context.close();
});

test("the same money cannot be set aside for two goals", async () => {
  const { page, context } = await h.openApp({ seed: wallet() });
  await setAside(page, 50, "mpesa", 6000);
  await setAside(page, 51, "mpesa", 5000);                 // only 4,000 is free
  assert.match(await h.toastText(page), /Only KSh 4,000 in M-Pesa is not already set aside/);
  assert.equal(await goalSavedOf(page, 51), 0, "blocked allocation must not be saved");
  await h.clickAction(page, "close-modal");
  await setAside(page, 51, "mpesa", 4000);                 // exactly what is free: allowed
  assert.equal(await goalSavedOf(page, 51), 4000);
  assert.deepEqual(await accountCard(page, "M-Pesa"), { balance: "KSh 10,000", setAside: "KSh 10,000", available: "KSh 0" });
  await h.clickAction(page, "close-modal").catch(() => {});
  await setAside(page, 50, "mpesa", 1);                    // nothing left
  assert.match(await h.toastText(page), /Nothing in M-Pesa is free to set aside/);
  await context.close();
});

test("a transfer moves money between accounts without changing income, spending or the total", async () => {
  const { page, context, errors } = await h.openApp({ seed: wallet() });
  await h.goView(page, "money");
  await h.clickAction(page, "add-transfer");
  await h.submitForm(page, "transferForm", { trAmount: "3000", trFrom: "mpesa", trTo: "mshwari" });
  assert.equal((await accountCard(page, "M-Pesa")).balance, "KSh 7,000");
  assert.equal((await accountCard(page, "M-Shwari")).balance, "KSh 3,000");
  await h.goView(page, "home");
  const text = await h.bodyText(page);
  assert.match(text, /recorded money KSh 10,000/);
  assert.match(text, /This month in KSh 10,000/);
  assert.match(text, /This month out KSh 0/);
  noErrors(errors); await context.close();
});

test("moving goal money to M-Shwari keeps it set aside for the same goal", async () => {
  const { page, context, errors } = await h.openApp({ seed: wallet() });
  await setAside(page, 50, "mpesa", 5000);
  await h.goView(page, "goals");
  await h.clickAction(page, "move-goal", 50);
  await h.submitForm(page, "transferForm", { trAmount: "5000", trFrom: "mpesa", trTo: "mshwari" });
  assert.equal(await goalSavedOf(page, 50), 5000, "goal total unchanged");
  assert.deepEqual(await accountCard(page, "M-Pesa"), { balance: "KSh 5,000", setAside: "KSh 0", available: "KSh 5,000" });
  assert.deepEqual(await accountCard(page, "M-Shwari"), { balance: "KSh 5,000", setAside: "KSh 5,000", available: "KSh 0" });
  noErrors(errors); await context.close();
});

test("moving money for a goal that was not set aside first earmarks it on arrival", async () => {
  const { page, context } = await h.openApp({ seed: wallet() });
  await h.goView(page, "goals");
  await h.clickAction(page, "move-goal", 51);
  await h.submitForm(page, "transferForm", { trAmount: "2500", trFrom: "mpesa", trTo: "mshwari" });
  assert.equal(await goalSavedOf(page, 51), 2500);
  assert.deepEqual(await accountCard(page, "M-Pesa"), { balance: "KSh 7,500", setAside: "KSh 0", available: "KSh 7,500" });
  await context.close();
});

test("partial release and spend-from-goal: progress, balance and spending all correct", async () => {
  const { page, context, errors } = await h.openApp({ seed: wallet() });
  await setAside(page, 50, "mpesa", 5000);
  await h.goView(page, "goals");
  await h.clickAction(page, "release-goal", 50);
  await h.submitForm(page, "releaseForm", { releaseAccount: "mpesa", releaseAmount: "1000" });
  assert.equal(await goalSavedOf(page, 50), 4000);
  assert.deepEqual(await accountCard(page, "M-Pesa"), { balance: "KSh 10,000", setAside: "KSh 4,000", available: "KSh 6,000" });
  await h.goView(page, "goals");
  await h.clickAction(page, "release-goal", 50);
  await h.submitForm(page, "releaseForm", { releaseAccount: "mpesa", releaseAmount: "500", releaseSpent: true, releaseCategory: "Health" });
  assert.equal(await goalSavedOf(page, 50), 3500);
  assert.deepEqual(await accountCard(page, "M-Pesa"), { balance: "KSh 9,500", setAside: "KSh 3,500", available: "KSh 6,000" });
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /This month out KSh 500/);
  await h.goView(page, "goals");
  await h.clickAction(page, "release-goal", 50);
  await h.submitForm(page, "releaseForm", { releaseAccount: "mpesa", releaseAmount: "9000" });
  assert.match(await h.toastText(page), /Only KSh 3,500 of Emergency fund is held in M-Pesa/);
  noErrors(errors); await context.close();
});

test("spending money that is set aside asks first, then shows the goal shortfall", async () => {
  const { page, context, dialogs } = await h.openApp({ seed: wallet() });
  await setAside(page, 50, "mpesa", 9000);
  await h.goView(page, "money");
  await h.clickAction(page, "add-expense");
  await h.submitForm(page, "transactionForm", { txAmount: "2500", txAccountForm: "mpesa" });
  assert.ok(dialogs.some(m => /KSh 1,500 of this is money set aside for goals in M-Pesa/.test(m)), "expected a warning: " + dialogs.join(" | "));
  assert.deepEqual(await accountCard(page, "M-Pesa"), { balance: "KSh 7,500", setAside: "KSh 9,000", available: "−KSh 1,500" });
  await h.goView(page, "goals");
  assert.match(await h.bodyText(page), /M-Pesa holds less than is set aside \(short by KSh 1,500\)/);
  await context.close();
});

test("borrowed money increases the account but is not income; repayments are not spending", async () => {
  const { page, context, errors } = await h.openApp({ seed: wallet() });
  await h.goView(page, "debts");
  await h.clickAction(page, "add-debt");
  await h.submitForm(page, "debtForm", { debtName: "Loan from Otieno", debtTotal: "5000", debtReceived: "mpesa" });
  assert.equal((await accountCard(page, "M-Pesa")).balance, "KSh 15,000");
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /This month in KSh 10,000/);
  const debtId = (await h.storedState(page)).debts[0].id;
  await h.goView(page, "debts");
  await h.clickAction(page, "repay-debt", debtId);
  await h.submitForm(page, "repaymentForm", { repaymentAmount: "1000", repaymentAccount: "mpesa" });
  assert.equal((await accountCard(page, "M-Pesa")).balance, "KSh 14,000");
  await h.goView(page, "home");
  assert.match(await h.bodyText(page), /This month out KSh 0/);
  const s = await h.storedState(page);
  assert.equal(s.debts[0].repaid, 1000);
  noErrors(errors); await context.close();
});

test("editing or deleting a debt repayment entry keeps the debt in step", async () => {
  const { page, context } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "money");
  await h.clickAction(page, "edit-transaction", 7);
  await h.submitForm(page, "transactionForm", { txAmount: "1500" });
  let s = await h.storedState(page);
  assert.equal(s.debts[0].repaid, 1500);
  assert.equal(s.debts[0].repayments[0].amount, 1500);
  await h.clickAction(page, "edit-transaction", 7);
  await h.submitForm(page, "transactionForm", { txAmount: "9000" });   // more than the 5,000 debt
  assert.match(await h.toastText(page), /more than the KSh 5,000 left on Fuliza/);
  await h.clickAction(page, "close-modal");
  await h.clickAction(page, "delete-transaction", 7);
  s = await h.storedState(page);
  assert.equal(s.debts[0].repaid, 0);
  assert.equal(s.debts[0].repayments.length, 0);
  await context.close();
});

test("deleting a bill payment entry reopens that bill occurrence", async () => {
  const { page, context } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "money");
  await h.clickAction(page, "delete-transaction", 6);
  const rent = (await h.storedState(page)).bills.find(b => b.id === 30);
  assert.deepEqual(rent.payments, []);
  assert.deepEqual(rent.paidOccurrences, []);
  await context.close();
});

test("deleting one bill payment leaves the bill's other paid months untouched (legacy data)", async () => {
  const seed = realisticMonth();
  seed.bills[0].paidOccurrences = ["2026-10-05", "2026-11-05"];   // October marked paid with no payment record (older data)
  const { page, context } = await h.openApp({ seed });
  await h.goView(page, "money");
  await h.clickAction(page, "delete-transaction", 6);               // November rent payment
  const rent = (await h.storedState(page)).bills.find(b => b.id === 30);
  assert.deepEqual(rent.paidOccurrences, ["2026-10-05"]);
  await context.close();
});

test("opening balance with an opening date: earlier entries are treated as already included", async () => {
  const seed = wallet();
  seed.accounts.push({ id: "equity", name: "Equity", kind: "bank", openingBalance: 20000, openingDate: "2026-11-15", archived: false });
  seed.transactions.push(tx(2, "expense", 4000, "Shopping", "2026-11-10", { accountId: "equity" }));  // before: ignored
  seed.transactions.push(tx(3, "expense", 1500, "Food", "2026-11-18", { accountId: "equity" }));      // after: counted
  const { page, context } = await h.openApp({ seed });
  assert.equal((await accountCard(page, "Equity")).balance, "KSh 18,500");
  await context.close();
});

test("adding an account through the form and money totals stay exact to the cent", async () => {
  const seed = wallet({ transactions: [tx(1, "income", 0.3, "Income", "2026-11-20", { accountId: "mpesa" }), tx(2, "expense", 0.1, "Food", "2026-11-20", { accountId: "mpesa" }), tx(3, "expense", 0.2, "Food", "2026-11-20", { accountId: "mpesa" })] });
  const { page, context, errors } = await h.openApp({ seed });
  // 0.3 - 0.1 - 0.2 is -0.0000000000000000277 in plain floating point; it must be exactly 0
  assert.match(await h.bodyText(page), /recorded money KSh 0 /);
  await h.goView(page, "money");
  await h.clickAction(page, "add-account");
  await h.submitForm(page, "accountForm", { accName: "KCB M-Pesa", accKind: "savings", accOpening: "2500", accOpeningDate: "" });
  assert.equal((await accountCard(page, "KCB M-Pesa")).balance, "KSh 2,500");
  await h.clickAction(page, "add-account");
  await h.submitForm(page, "accountForm", { accName: "kcb m-pesa" });
  assert.match(await h.toastText(page), /already have an account with that name/);
  noErrors(errors); await context.close();
});

test("deleting a goal frees its money and keeps transfers it made", async () => {
  const { page, context } = await h.openApp({ seed: wallet() });
  await h.goView(page, "goals");
  await h.clickAction(page, "move-goal", 50);
  await h.submitForm(page, "transferForm", { trAmount: "4000", trFrom: "mpesa", trTo: "mshwari" });
  await h.goView(page, "goals");
  await h.clickAction(page, "delete-goal", 50);
  const s = await h.storedState(page);
  assert.equal(s.allocations.length, 0);
  assert.equal(s.transactions.filter(t => t.type === "transfer").length, 1);
  assert.deepEqual(await accountCard(page, "M-Shwari"), { balance: "KSh 4,000", setAside: "KSh 0", available: "KSh 4,000" });
  await context.close();
});

test("a schema 9 safety backup restores into the new version and is upgraded", async () => {
  const { page, context, errors } = await h.openApp({ seed: wallet() });
  const legacy = { app: "PesaPilot", backupVersion: 3, schemaVersion: 9, data: realisticMonth() };
  await h.importBackup(page, legacy);
  const d = (await h.exportBackup(page)).data;
  assert.equal(d.schemaVersion, 10);
  assert.equal(d.goals[0].current, 3000);
  assert.equal(d.transactions.length, 8);
  noErrors(errors); await context.close();
});

test("rollback: the pre-accounts copy downloads and imports into the original schema 9 app", async () => {
  const seed = realisticMonth();
  const { page, context, errors } = await h.openApp({ seed });
  await h.goView(page, "settings");
  const [download] = await Promise.all([page.waitForEvent("download"), h.clickAction(page, "download-pre-upgrade")]);
  const copy = JSON.parse(require("fs").readFileSync(await download.path(), "utf8"));
  assert.deepEqual(copy.data, seed);
  noErrors(errors); await context.close();
  // Load the last schema 9 release (commit 8e33d44) and import the copy into it.
  const os = require("os"), path = require("path"), fs = require("fs");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pp-v9-"));
  fs.writeFileSync(path.join(dir, "index.html"), require("child_process").execSync("git show 8e33d44:index.html", { cwd: path.join(__dirname, "..") }));
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const old = await (await browser.newContext({ acceptDownloads: true, timezoneId: "Africa/Nairobi" })).newPage();
  old.on("dialog", d => d.accept());
  await old.clock.setFixedTime(h.FIXED_NOW);
  await old.goto("file://" + path.join(dir, "index.html"));
  await old.evaluate(() => { localStorage.clear(); localStorage.setItem("pesapilot_onboarding_v1", "done"); });
  await old.reload(); await old.waitForTimeout(1200);
  await old.evaluate(() => document.querySelector('[data-view="settings"]').click());
  const nav = old.waitForNavigation();
  await old.setInputFiles("#importFile", { name: "copy.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(copy)) });
  await nav; await old.waitForTimeout(1200);
  const restored = await old.evaluate(() => JSON.parse(localStorage.getItem("pesapilot_v2")));
  assert.equal(restored.schemaVersion, 9);
  assert.deepEqual(restored.transactions.map(t => [t.id, t.type, t.amount]), seed.transactions.map(t => [t.id, t.type, t.amount]));
  assert.equal(restored.goals[0].current, 3000);
  await browser.close();
});

// --------------------------------------------- known defects (later phases)
test("[D2 fixed] savings and debt repayments are not counted as spending", async () => {
  const { page, context } = await h.openApp({ seed: realisticMonth() });
  await h.goView(page, "reports");
  // November spending = food 6,500 + transport 2,400 + rent 15,000 = 23,900.
  // Schema 9 showed 28,900 (it added the 3,000 saving and the 2,000 debt repayment).
  const text = await h.bodyText(page);
  assert.match(text, /Expenses KSh 23,900/);
  assert.match(text, /Set aside for goals KSh 3,000 not counted as spending/);
  assert.doesNotMatch(text, new RegExp(kes(28900)));
  await context.close();
});

test("[D4 fixed] deleting a goal's linked savings entry also reverses the goal progress", async () => {
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
