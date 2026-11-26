// DB-5 reference model: "Will I make it to my next income?" + Before You Spend.
// PLANNING ARTEFACT ONLY. Not part of the app, never loaded by index.html.
// Purpose: compute the worked examples in docs/specs/DB-5_DECISION_BRIEF.md so
// every number in the brief is calculated, not typed. Run: node model.js
// Rules implemented are the brief's RECOMMENDED options (not yet approved).
"use strict";

const DAY = 86400000;
const d = iso => new Date(iso + "T12:00:00");
const iso = date => date.toISOString().slice(0, 10);
const addDays = (s, n) => iso(new Date(d(s).getTime() + n * DAY));
const daysBetween = (a, b) => Math.round((d(b) - d(a)) / DAY);
const r = n => Math.round(n);

/**
 * input = {
 *   today: "2026-11-25",
 *   free: number,                  // A: available (balance − set aside) in spending accounts
 *   setAside: number,              // goal money already set aside (shown, never counted)
 *   pattern: "fixed" | "irregular",
 *   nextPayday: "YYYY-MM-DD",      // fixed: the next payday (after any one-cycle override)
 *   planningDays: 7 | 14 | 30,     // irregular
 *   mustPay: [{name, amount, due}],// bills + debt instalments (unpaid), with due dates
 *   goalPlan: number,              // this period's goal target not yet set aside
 *   planned: number,               // planned extra spending this period
 *   buffer: number,                // user's safety buffer (0 = none)
 *   usualDaily: number,            // D: usual day-to-day spending (estimate or override)
 *   expected: [{name, amount, date, autoDeduct}], // NEVER counted; autoDeduct = e.g. Fuliza taken first
 * }
 */
function horizon(x) {
  if (x.pattern === "fixed") {
    const end = addDays(x.nextPayday, -1); // up to, not including, payday (DEC-015)
    return { end, days: Math.max(1, daysBetween(x.today, x.nextPayday)) };
  }
  // Irregular: always the planning period, never shortened to an expected-income date.
  return { end: addDays(x.today, x.planningDays - 1), days: x.planningDays };
}

const LOOKAHEAD = 30; // days checked in the timing scenarios

// Day by day: savings plans and planned spending on day 1 (conservative); on each day, payments due
// are taken BEFORE any income that day (income may come late in the day); usual spending every day.
// firstAtRisk = the first payment the money can't fully cover. Each is labelled:
//   "before"  = due before the next income (inside the horizon),
//   "after"   = due after the next income date (only at risk if that income doesn't come).
function simulate(x, h, incomes) {
  let bal = x.free - x.goalPlan - x.planned, runwayLastDay = null, firstAtRisk = null;
  const last = addDays(x.today, LOOKAHEAD - 1);
  for (let i = 0; i < LOOKAHEAD; i++) {
    const day = addDays(x.today, i);
    for (const p of x.mustPay.filter(p => (i === 0 ? p.due <= day : p.due === day))) {
      if (bal < p.amount && !firstAtRisk) firstAtRisk = { item: p.name, amount: p.amount, date: i === 0 ? x.today : p.due,
        have: Math.max(0, r(bal)), when: p.due <= h.end ? "before next income" : "after next income date",
        beforeArrival: incomes.length ? p.due < incomes[0].date || (p.due === incomes[0].date) : null };
      bal -= p.amount;
    }
    for (const inc of incomes.filter(n => n.date === day)) bal += inc.amount;
    bal -= x.usualDaily;
    if (bal >= 0 && runwayLastDay === (i ? addDays(x.today, i - 1) : null)) runwayLastDay = day;
  }
  if (runwayLastDay === last) runwayLastDay = "beyond " + last;
  return { firstAtRisk, runwayLastDay };
}

function willIMakeIt(x) {
  const h = horizon(x);
  const inPeriod = x.mustPay.filter(p => p.due <= h.end);  // overdue items have due < today, so they're included
  const afterPeriod = x.mustPay.filter(p => p.due > h.end);
  const must = inPeriod.reduce((a, p) => a + p.amount, 0);
  const plan = x.goalPlan + x.planned;
  const need = r(x.usualDaily * h.days);                     // N
  const leftAfterCommitments = x.free - must - plan;          // before usual spending and buffer
  const reserveDEC015 = leftAfterCommitments - x.buffer;      // today's "Left to spend" (unchanged rule)
  const margin = leftAfterCommitments - need;                 // M
  const cushion = x.buffer > 0 ? x.buffer : Math.max(500, r(0.1 * need));

  // Already short: must-pays, taken in due-date order, exceed the money now (ignoring daily spending).
  let run = x.free, alreadyShortOn = null;
  for (const p of [...inPeriod].sort((a, b) => a.due.localeCompare(b.due))) {
    run -= p.amount; if (run < 0 && !alreadyShortOn) alreadyShortOn = { date: p.due, by: -run, item: p.name };
  }
  let verdict;
  if (alreadyShortOn) verdict = "Already short";
  else if (margin < 0) verdict = "Short";
  else if (margin < cushion) verdict = "Tight";
  else verdict = "On track";

  // Short only because of the savings plan? (never released automatically)
  const shortOnlyBecauseOfSaving = verdict === "Short" && margin + x.goalPlan >= 0;

  // Two separate timing scenarios, never mixed (owner, 2026-11-25):
  //  - "If no money comes in": actual money only, for the next LOOKAHEAD days, so payments due
  //    AFTER an expected payday are still checked (the payday may not happen).
  //  - "If <payment> arrives on <date>": the same run with only that one payment added on its date.
  const noIncome = simulate(x, h, []);
  const ifArrives = x.expected.map(e => {
    const reaches = e.amount - (e.autoDeduct || 0);
    const sim = simulate(x, h, [{ date: e.date, amount: reaches }]);
    return { name: e.name, date: e.date, amount: e.amount, reaches, marginIfArrives: margin + reaches,
      inPeriod: e.date <= h.end, firstAtRisk: sim.firstAtRisk, runwayLastDay: sim.runwayLastDay };
  });

  // Daily guide = today's DEC-015 safe-to-spend per day (keeps the buffer), so the app shows ONE daily figure.
  const dailyGuide = Math.max(0, Math.floor(reserveDEC015 / h.days));
  return { horizon: h, must, mustItems: inPeriod.map(p => p.name), afterPeriod: afterPeriod.map(p => `${p.name} ${p.amount} on ${p.due}`),
    plan, need, leftAfterCommitments, reserveDEC015, margin, cushion, verdict, alreadyShortOn,
    shortOnlyBecauseOfSaving, noIncome, ifArrives, dailyGuide,
    setAsideNotCounted: x.setAside };
}

// Before You Spend: same calculation with the purchase taken from free money. Records nothing.
function beforeYouSpend(x, amount, opts = {}) {
  const before = willIMakeIt(x);
  const usesSetAside = amount > x.free;                   // would dip into goal money (warn, never block)
  const after = willIMakeIt({ ...x, free: x.free - amount });
  return { amount, usesSetAside, before: before.verdict, after: after.verdict, marginBefore: before.margin,
    marginAfter: after.margin, dailyBefore: before.dailyGuide, dailyAfter: after.dailyGuide,
    firstAtRiskAfter: after.noIncome.firstAtRisk, offerUseSavings: after.verdict !== "On track" && x.setAside > 0 };
}


// ---------- DB-5.5 usual daily spending estimate (D): revision 2 (26 Nov) ----------
// Definitions (DB-5 brief §5.4):
//  window      = the last 28 FULL calendar days before today (fewer if recording started later); today excluded.
//  divisor     = calendar days in the window. A day with no entries counts as zero.
//  recorded day= a window day (by the entry's own date) with ≥1 QUALIFYING expense: type expense, amount > 0,
//                not reversed. One-offs count as recorded days. Bills, goal use, transfers, adjustments do not.
//  reconcile   = revision 3 (26 Nov). difference = actual balance − recorded balance (negative = SHORTFALL).
//                kind "unrecordedSpending": the user ticked "this was spending I didn't record" (exists today, DEC-016).
//                kind "adjustment": a plain balance correction; the cause is NOT known.
//                Only SHORTFALLS can raise the estimate. Surpluses (unrecorded income, refunds, transfers in)
//                never lower it. A reversed adjustment is ignored: the user explains a difference by reversing it
//                and recording what really happened (a transfer, income, a refund), which counts by its own type.
//                Unexplained shortfalls are counted (the cautious choice) but reported separately as "unexplained",
//                with a prompt to explain them; matching opposite differences on two accounts are flagged as a
//                possible transfer. Each shortfall is spread evenly over the days after that account's previous
//                reconcile (or tracking start) up to the reconcile date; only the window part counts.
//  confidence  = ask (<7 days) · incomplete (<50% of days recorded, not checked) · records-only (not checked)
//                · checked (every spending account reconciled in the last 14 days).
const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const round10 = n => Math.round(n / 10) * 10;
function estimateUsualDaily({ today, trackingStart, entries, reconciles = [], spendingAccounts = ["mpesa"], userDaily = null, restoredIds = [] }) {
  const end = addDays(today, -1);
  const days = Math.min(28, daysBetween(trackingStart, today));
  if (days < 7) return { status: "ask", reason: "fewer than 7 full days of records", daily: userDaily, used: "your figure" };
  const start = addDays(today, -days), dayBefore = addDays(start, -1);
  const inWin = d => d >= start && d <= end;
  const qualifying = entries.filter(e => inWin(e.date) && e.kind === "expense" && e.amount > 0 && !e.reversed);
  let oneOffs = [];
  if (qualifying.length >= 10) { const m = median(qualifying.map(e => e.amount)); oneOffs = qualifying.filter(e => e.amount > 3 * m); }
  const excluded = oneOffs.filter(e => !restoredIds.includes(e.id));
  const counted = qualifying.filter(e => !excluded.includes(e));
  let unrecorded = 0, unexplained = 0, moreMoneyFound = 0;
  const live = reconciles.filter(r => !r.reversed && inWin(r.date));
  for (const rc of live) {
    if (rc.difference >= 0) { moreMoneyFound += rc.difference; continue; }   // surplus or exact match: never lowers D
    const since = rc.since || trackingStart;
    const span = Math.max(1, daysBetween(since, rc.date));
    const overlap = Math.max(0, daysBetween(since > dayBefore ? since : dayBefore, rc.date));
    const part = -rc.difference * Math.min(1, overlap / span);
    unrecorded += part;
    if (rc.kind !== "unrecordedSpending") unexplained += part;
  }
  // Possible unrecorded transfers: plain adjustments of equal size and opposite sign on two accounts, within 3 days.
  const plain = live.filter(r => r.kind !== "unrecordedSpending" && r.difference !== 0);
  const possibleTransfers = [];
  for (const a of plain) for (const b of plain) if (a.difference < 0 && b.difference > 0 && a.account !== b.account && -a.difference === b.difference && Math.abs(daysBetween(a.date, b.date)) <= 3)
    possibleTransfers.push(`${a.account} → ${b.account} ${b.difference}`);
  const total = counted.reduce((t, e) => t + e.amount, 0) + unrecorded;
  const computed = Math.round(total / days);
  const recordedDays = new Set(qualifying.map(e => e.date)).size, coverage = recordedDays / days;
  const checkedSince = addDays(today, -14);
  const checked = spendingAccounts.every(a => reconciles.some(r => r.account === a && !r.reversed && r.date >= checkedSince));
  let status, daily = computed, used = "records";
  if (checked) status = "checked";
  else if (coverage < 0.5) { status = "incomplete"; if (userDaily != null) { daily = Math.max(computed, userDaily); used = daily === computed ? "records" : "your figure (higher)"; } else { daily = null; used = "none yet: ask"; } }
  else status = "records-only";
  return { status, days, recordedDays, coverage: Math.round(coverage * 100), counted: Math.round(total - unrecorded), unrecorded: Math.round(unrecorded),
    unexplained: Math.round(unexplained), possibleTransfers, withoutUnexplained: Math.round((total - unexplained) / days), moreMoneyFound, excluded: excluded.map(e => ({ id: e.id, note: e.note || "expense", amount: e.amount, date: e.date })),
    restored: oneOffs.filter(e => restoredIds.includes(e.id)).map(e => e.id), computed, daily, shown: daily == null ? null : round10(daily), used };
}

module.exports = { willIMakeIt, beforeYouSpend, horizon, estimateUsualDaily };

// ---------- Worked examples (clock: Wed 25 Nov 2026) ----------
if (require.main === module) {
  const assert = require("assert");
  const show = (t, o) => console.log(`\n## ${t}\n` + JSON.stringify(o, null, 1));
  const risk = f => f && [f.item, f.date, f.have, f.when];

  // 1. Salaried, bills on different dates, a loan instalment, savings, a buffer.
  const wanjiru = { today: "2026-11-25", free: 12000, setAside: 3000, pattern: "fixed", nextPayday: "2026-11-30",
    mustPay: [{ name: "KPLC tokens", amount: 1000, due: "2026-11-26" }, { name: "Water", amount: 500, due: "2026-11-28" },
      { name: "KCB M-Pesa loan", amount: 1500, due: "2026-11-29" }, { name: "Rent", amount: 6500, due: "2026-12-01" }],
    goalPlan: 0, planned: 0, buffer: 1000, usualDaily: 700, expected: [{ name: "Salary", amount: 35000, date: "2026-11-30" }] };
  const e1 = willIMakeIt(wanjiru); show("1 Wanjiru (salary 30 Nov)", e1);
  assert.equal(e1.horizon.days, 5); assert.equal(e1.must, 3000); assert.equal(e1.need, 3500);
  assert.equal(e1.margin, 5500); assert.equal(e1.verdict, "On track"); assert.equal(e1.reserveDEC015, 8000);
  // On track because the salary is expected on 30 Nov. But if it doesn't come, rent on 1 Dec can't be paid:
  assert.deepEqual(risk(e1.noIncome.firstAtRisk), ["Rent", "2026-12-01", 4800, "after next income date"]);
  assert.equal(e1.noIncome.runwayLastDay, "2026-11-30");
  assert.equal(e1.ifArrives[0].firstAtRisk, null);  // if the salary arrives on 30 Nov, everything is covered

  // 1b. Same, but the employer pays on 2 Dec this month ("My pay is late" one-cycle change).
  const e1b = willIMakeIt({ ...wanjiru, nextPayday: "2026-12-02", expected: [{ name: "Salary", amount: 35000, date: "2026-12-02" }] }); show("1b Wanjiru, salary moved to 2 Dec", e1b);
  assert.equal(e1b.horizon.days, 7); assert.equal(e1b.must, 9500); assert.equal(e1b.need, 4900);
  assert.equal(e1b.margin, -2400); assert.equal(e1b.verdict, "Short"); assert.equal(e1b.dailyGuide, 214);
  assert.deepEqual(risk(e1b.noIncome.firstAtRisk), ["Rent", "2026-12-01", 4800, "before next income"]);
  assert.equal(e1b.ifArrives[0].firstAtRisk.beforeArrival, true); // rent is due before the late salary arrives

  // 2. Irregular, several income sources, Fuliza owed, a chama contribution.
  const otieno = { today: "2026-11-25", free: 4000, setAside: 0, pattern: "irregular", planningDays: 7,
    mustPay: [{ name: "Chama", amount: 1000, due: "2026-11-29" }], goalPlan: 0, planned: 0, buffer: 0, usualDaily: 450,
    expected: [{ name: "Client payment", amount: 3000, date: "2026-11-27", autoDeduct: 800 },
      { name: "Chama payout", amount: 10000, date: "2026-12-05" }] };
  const e2 = willIMakeIt(otieno); show("2 Otieno (irregular)", e2);
  assert.equal(e2.horizon.end, "2026-12-01"); assert.equal(e2.need, 3150); assert.equal(e2.margin, -150);
  assert.equal(e2.verdict, "Short"); assert.equal(e2.noIncome.runwayLastDay, "2026-11-30"); assert.equal(e2.noIncome.firstAtRisk, null); assert.equal(e2.dailyGuide, 428);
  assert.equal(e2.ifArrives[0].reaches, 2200); assert.equal(e2.ifArrives[0].marginIfArrives, 2050);
  assert.equal(e2.ifArrives[1].inPeriod, false);

  // 2b. Two days later the client hasn't paid. Nothing was counted, so the verdict is unchanged
  // except for real spending: he spent 450 + 450 = 900 as usual.
  const e2b = willIMakeIt({ ...otieno, today: "2026-11-27", free: 3100 }); show("2b Otieno, client payment late", e2b);
  assert.equal(e2b.horizon.end, "2026-12-03"); assert.equal(e2b.verdict, "Short");

  // 3. Already short: rent due before any money arrives.
  const akinyi = { today: "2026-11-25", free: 5000, setAside: 0, pattern: "irregular", planningDays: 7,
    mustPay: [{ name: "Rent", amount: 6500, due: "2026-11-27" }], goalPlan: 0, planned: 0, buffer: 0, usualDaily: 300,
    expected: [{ name: "Tailoring order", amount: 4000, date: "2026-11-28" }] };
  const e3 = willIMakeIt(akinyi); show("3 Akinyi (already short)", e3);
  assert.equal(e3.verdict, "Already short"); assert.deepEqual(e3.alreadyShortOn, { date: "2026-11-27", by: 1500, item: "Rent" });
  assert.deepEqual(risk(e3.noIncome.firstAtRisk), ["Rent", "2026-11-27", 4400, "before next income"]);
  assert.equal(e3.ifArrives[0].firstAtRisk.item, "Rent"); assert.equal(e3.ifArrives[0].firstAtRisk.beforeArrival, true);

  // 4. Short only because of the savings plan.
  const mwangi = { today: "2026-11-25", free: 6000, setAside: 2000, pattern: "irregular", planningDays: 7,
    mustPay: [{ name: "School fees instalment", amount: 2000, due: "2026-11-30" }], goalPlan: 1500, planned: 0, buffer: 0, usualDaily: 400, expected: [] };
  const e4 = willIMakeIt(mwangi); show("4 Mwangi (savings plan)", e4);
  assert.equal(e4.margin, -300); assert.equal(e4.verdict, "Short"); assert.equal(e4.shortOnlyBecauseOfSaving, true);

  // 5. Before You Spend: unexpected hospital bill for Wanjiru.
  const b5a = beforeYouSpend(wanjiru, 4000), b5b = beforeYouSpend(wanjiru, 5000), b5c = beforeYouSpend(wanjiru, 7000);
  show("5 Before You Spend 4,000 / 5,000 / 7,000", { b5a, b5b, b5c });
  assert.equal(b5a.after, "On track"); assert.equal(b5a.marginAfter, 1500); assert.deepEqual(risk(b5a.firstAtRiskAfter), ["Rent", "2026-12-01", 800, "after next income date"]); assert.equal(b5a.dailyBefore, 1600); assert.equal(b5a.dailyAfter, 800);
  assert.equal(b5b.after, "Tight"); assert.equal(b5b.marginAfter, 500); assert.equal(b5b.dailyAfter, 600);
  assert.equal(b5c.after, "Short"); assert.equal(b5c.marginAfter, -1500); assert.equal(b5c.dailyAfter, 200); assert.equal(b5c.offerUseSavings, true);
  assert.deepEqual(risk(b5c.firstAtRiskAfter), ["KCB M-Pesa loan", "2026-11-29", 700, "before next income"]);

  // 6. A payment due AFTER the expected payment, which only fails if that payment doesn't come.
  const njeri = { today: "2026-11-25", free: 3000, setAside: 0, pattern: "irregular", planningDays: 7,
    mustPay: [{ name: "School fees", amount: 2500, due: "2026-11-30" }], goalPlan: 0, planned: 0, buffer: 0, usualDaily: 300,
    expected: [{ name: "Wholesale customer", amount: 5000, date: "2026-11-27" }] };
  const e6 = willIMakeIt(njeri); show("6 Njeri (payment after the expected date)", e6);
  assert.equal(e6.verdict, "Short"); assert.equal(e6.margin, -1600); assert.equal(e6.alreadyShortOn, null);
  assert.deepEqual(risk(e6.noIncome.firstAtRisk), ["School fees", "2026-11-30", 1500, "before next income"]);
  assert.equal(e6.ifArrives[0].firstAtRisk, null); // if the customer pays on 27 Nov, the fees are covered

  // Properties: expected income never changes the verdict or the no-income warning; adding a commitment never improves the verdict.
  const rank = { "On track": 3, Tight: 2, Short: 1, "Already short": 0 };
  for (const base of [wanjiru, otieno, akinyi, mwangi, njeri]) {
    const v = willIMakeIt(base).verdict;
    assert.equal(willIMakeIt({ ...base, expected: [{ name: "x", amount: 1e6, date: base.today }] }).verdict, v);
    assert.deepEqual(willIMakeIt({ ...base, expected: [{ name: "x", amount: 1e6, date: base.today }] }).noIncome, willIMakeIt(base).noIncome);
    const more = willIMakeIt({ ...base, mustPay: [...base.mustPay, { name: "extra", amount: 500, due: base.today }] }).verdict;
    assert.ok(rank[more] <= rank[v]);
  }

  // ---------- DB-5.5 estimate examples (revision 2) ----------
  const T = "2026-11-25", day = i => addDays(T, -i);              // day(1) = yesterday … day(28)
  const ex = (id, i, amount, extra = {}) => ({ id, date: day(i), amount, kind: "expense", ...extra });
  const e1d = Array.from({ length: 21 }, (_, i) => ex(i + 1, i + 1, 600));
  // D1 21 of 28 days recorded, 600 each; plus rent (bill) and goal use → 12,600 / 28 = 450, but NOT checked against a balance.
  const d1 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e1d, { id: 90, date: day(3), amount: 6500, kind: "bill" }, { id: 91, date: day(4), amount: 2000, kind: "goalUse" }] });
  show("D1 good coverage, unchecked", d1); assert.equal(d1.daily, 450); assert.equal(d1.status, "records-only"); assert.equal(d1.coverage, 75);
  // D1b same records + M-Pesa reconciled 5 days ago with no difference → "checked".
  const d1b = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e1d, reconciles: [{ account: "mpesa", date: day(5), since: day(40), difference: 0, kind: "adjustment" }] });
  assert.equal(d1b.status, "checked"); assert.equal(d1b.daily, 450);
  // D2 only 8 days recorded → incomplete. No figure until the user answers; then the HIGHER of 86 and 400.
  const e2d = Array.from({ length: 8 }, (_, i) => ex(100 + i, i * 3 + 1, 300));
  const d2a = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e2d });
  const d2b = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e2d, userDaily: 400 });
  show("D2 incomplete", { d2a, d2b }); assert.equal(d2a.computed, 86); assert.equal(d2a.status, "incomplete"); assert.equal(d2a.daily, null); assert.equal(d2b.daily, 400);
  // D3 as D2 + an M-Pesa reconcile yesterday finding 7,000 unrecorded since a reconcile 35 days earlier:
  //    7,000 × 28/35 = 5,600 inside the window → (2,400 + 5,600) / 28 = 286, "checked".
  const d3 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e2d, reconciles: [{ account: "mpesa", date: day(1), since: day(36), difference: -7000, kind: "unrecordedSpending" }] });
  show("D3 reconcile spread", d3); assert.equal(d3.unrecorded, 5600); assert.equal(d3.daily, 286); assert.equal(d3.status, "checked");
  // D4 a one-off: 20 × 300 + a 12,000 phone → phone excluded and listed (6,000 / 28 = 214).
  const e4d = Array.from({ length: 20 }, (_, i) => ex(200 + i, i + 1, 300));
  const phoneBuy = ex(299, 2, 12000, { note: "Phone" });
  const d4 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e4d, phoneBuy] });
  show("D4 one-off", d4); assert.deepEqual(d4.excluded.map(e => [e.note, e.amount, e.date]), [["Phone", 12000, day(2)]]); assert.equal(d4.daily, 214);
  // D4b the user taps "Count it" → restored: (6,000 + 12,000) / 28 = 643.
  const d4b = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e4d, phoneBuy], restoredIds: [299] });
  assert.deepEqual(d4b.restored, [299]); assert.equal(d4b.excluded.length, 0); assert.equal(d4b.daily, 643);
  // D5 new user (4 days) → ask, never guess.
  assert.equal(estimateUsualDaily({ today: T, trackingStart: day(4), entries: e1d.slice(0, 3) }).status, "ask");
  // D6 today's half-finished day is never counted.
  assert.equal(estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e1d, { id: 98, date: T, amount: 50000, kind: "expense" }] }).daily, 450);
  // D7 a reversed entry counts neither as spending nor as a recorded day.
  const d7 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e1d, ex(97, 25, 5000, { reversed: true })] });
  assert.equal(d7.recordedDays, 21); assert.equal(d7.daily, 450);
  // D8 partial recording: every day has an entry (100) but real spending is ~400. Coverage looks perfect,
  //    so the figure is labelled "records-only" (not checked). A reconcile then finds 8,400 unrecorded over the 28 days → 400, checked.
  const e8d = Array.from({ length: 28 }, (_, i) => ex(300 + i, i + 1, 100));
  const d8a = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e8d });
  const d8b = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e8d, reconciles: [{ account: "mpesa", date: day(1), since: day(29), difference: -8400, kind: "unrecordedSpending" }] });
  show("D8 partial recording", { d8a, d8b }); assert.equal(d8a.status, "records-only"); assert.equal(d8a.daily, 100); assert.equal(d8b.status, "checked"); assert.equal(d8b.daily, 400);
  // D9 a reconcile finding MORE money than recorded never lowers the estimate; it is shown.
  const d9 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e1d, reconciles: [{ account: "mpesa", date: day(2), since: day(30), difference: 3000, kind: "adjustment" }] });
  assert.equal(d9.daily, 450); assert.equal(d9.moreMoneyFound, 3000); assert.equal(d9.status, "checked");
  // D10 two accounts: only M-Pesa reconciled → not "checked" (cash spending unmeasured).
  const d10 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e1d, spendingAccounts: ["mpesa", "cash"], reconciles: [{ account: "mpesa", date: day(2), since: day(30), difference: 0, kind: "adjustment" }] });
  assert.equal(d10.status, "records-only");
  // D11 a reconcile older than the window spreads nothing into it; two reconciles on one account never overlap.
  const d11 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e1d, reconciles: [
    { account: "mpesa", date: day(15), since: day(43), difference: -2800, kind: "unrecordedSpending" },   // covers day(42)…day(15): 14 of its 28 days in the window → 1,400
    { account: "mpesa", date: day(1), since: day(15), difference: -1400, kind: "unrecordedSpending" } ] }); // covers day(14)…day(1): all 14 days → 1,400
  assert.equal(d11.unrecorded, 2800); assert.equal(d11.daily, 550);

  // ---------- Reconcile causes (revision 3, owner 26 Nov). Base: D1 records (12,600 over 28 days = 450). ----------
  const rcBase = { today: T, trackingStart: "2026-09-01", entries: e1d, spendingAccounts: ["mpesa", "cash"] };
  // R1 unrecorded INCOME (balance 3,000 higher than recorded): never lowers the estimate.
  const r1 = estimateUsualDaily({ ...rcBase, reconciles: [{ account: "mpesa", date: day(2), since: day(30), difference: 3000, kind: "adjustment" }] });
  assert.equal(r1.daily, 450); assert.equal(r1.moreMoneyFound, 3000); assert.equal(r1.unexplained, 0);
  // R2a an unrecorded TRANSFER, explained: the user reversed the adjustment and recorded the transfer → no effect.
  const r2a = estimateUsualDaily({ ...rcBase, entries: [...e1d, { id: 400, date: day(10), amount: 2000, kind: "transfer" }],
    reconciles: [{ account: "mpesa", date: day(2), since: day(30), difference: -2000, kind: "adjustment", reversed: true }] });
  assert.equal(r2a.daily, 450); assert.equal(r2a.unrecorded, 0);
  // R2b the same transfer NOT explained: M-Pesa 2,000 short, Cash 2,000 over, 1 day apart → counted (cautious), flagged.
  const r2b = estimateUsualDaily({ ...rcBase, reconciles: [
    { account: "mpesa", date: day(2), since: day(30), difference: -2000, kind: "adjustment" },
    { account: "cash", date: day(1), since: day(30), difference: 2000, kind: "adjustment" } ] });
  show("R2b unexplained transfer", r2b);
  assert.equal(r2b.unexplained, 1929); assert.deepEqual(r2b.possibleTransfers, ["mpesa → cash 2000"]); assert.equal(r2b.withoutUnexplained, 450); assert.equal(r2b.daily, 519);
  // R3a a REVERSAL that returned money (a payment bounced back, not recorded): a surplus → no effect.
  const r3a = estimateUsualDaily({ ...rcBase, reconciles: [{ account: "mpesa", date: day(3), since: day(30), difference: 1500, kind: "adjustment" }] });
  assert.equal(r3a.daily, 450);
  // R3b a reversal that TOOK money back (income reversed), explained by reversing the adjustment → no effect.
  const r3b = estimateUsualDaily({ ...rcBase, reconciles: [{ account: "mpesa", date: day(3), since: day(30), difference: -1500, kind: "adjustment", reversed: true }] });
  assert.equal(r3b.daily, 450);
  // R4 an UNEXPLAINED WITHDRAWAL: 2,800 short on M-Pesa, cause unknown, covering the last 28 days → counted, reported as unexplained.
  const r4 = estimateUsualDaily({ ...rcBase, reconciles: [{ account: "mpesa", date: day(1), since: day(29), difference: -2800, kind: "adjustment" }] });
  show("R4 unexplained withdrawal", r4);
  assert.equal(r4.unexplained, 2800); assert.equal(r4.daily, 550); assert.equal(r4.withoutUnexplained, 450); assert.deepEqual(r4.possibleTransfers, []);
  // R5 the same shortfall labelled "spending I didn't record" → counted, NOT unexplained.
  const r5 = estimateUsualDaily({ ...rcBase, reconciles: [{ account: "mpesa", date: day(1), since: day(29), difference: -2800, kind: "unrecordedSpending" }] });
  assert.equal(r5.daily, 550); assert.equal(r5.unexplained, 0);

  // DB-5.6: the default cushion is a warning threshold only. It never changes Left to spend or the daily guide.
  for (const base of [otieno, akinyi, mwangi, njeri]) {        // all have no buffer, so the default cushion applies
    const res = willIMakeIt(base);
    assert.equal(res.reserveDEC015, res.leftAfterCommitments);  // nothing extra deducted
    assert.equal(res.dailyGuide, Math.max(0, Math.floor(res.leftAfterCommitments / res.horizon.days)));
  }
  console.log("\nAll DB-5 worked examples and properties check out.");
}
