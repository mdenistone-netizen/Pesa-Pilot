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


// ---------- DB-5.5 usual daily spending estimate (D) ----------
// Window: the last 28 FULL calendar days before today (today is excluded because it is incomplete),
// or fewer if the user started recording less than 28 days ago. Divided by CALENDAR days in the window:
// a day with no entries counts as a zero-spending day. Quality checks decide whether the figure can be
// trusted on its own (see the brief's §5.4).
const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
function estimateUsualDaily({ today, trackingStart, entries, adjustments = [], userDaily = null }) {
  const end = addDays(today, -1);
  const days = Math.min(28, daysBetween(trackingStart, today));          // full days available
  if (days < 7) return { status: "ask", reason: "fewer than 7 days of records", daily: userDaily, used: "your figure" };
  const start = addDays(today, -days);
  const inWin = e => e.date >= start && e.date <= end;
  const spend = entries.filter(e => inWin(e) && e.kind === "expense");   // bill payments and goal use are not counted (already elsewhere)
  let excluded = [];
  if (spend.length >= 10) {                                               // one-offs only judged with enough entries
    const m = median(spend.map(e => e.amount));
    excluded = spend.filter(e => e.amount > 3 * m);
  }
  const counted = spend.filter(e => !excluded.includes(e));
  // Unrecorded spending found by reconciling: spread over the days since that account's previous reconcile,
  // and only the part that falls inside the window is counted.
  const unrecorded = adjustments.filter(a => a.date >= start && a.date <= end).reduce((t, a) => {
    const span = Math.max(1, daysBetween(a.since, a.date)), dayBefore = addDays(start, -1), overlap = Math.max(0, daysBetween(a.since > dayBefore ? a.since : dayBefore, a.date)); // days after `since`, up to and incl. the reconcile date
    return t + a.amount * Math.min(1, overlap / span);
  }, 0);
  const total = counted.reduce((t, e) => t + e.amount, 0) + unrecorded;
  const computed = Math.round(total / days);
  const recordedDays = new Set(spend.map(e => e.date)).size, coverage = recordedDays / days;
  const incomplete = coverage < 0.5 && unrecorded === 0;
  let daily = computed, used = "records", status = "ok";
  if (incomplete) { status = "check"; if (userDaily != null) { daily = Math.max(computed, userDaily); used = daily === computed ? "records" : "your figure (higher)"; } }
  return { status, days, recordedDays, coverage: Math.round(coverage * 100), counted: Math.round(total - unrecorded), unrecorded: Math.round(unrecorded),
    excluded: excluded.map(e => `${e.note || "expense"} ${e.amount}`), computed, daily, used };
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

  // ---------- DB-5.5 estimate examples ----------
  const T = "2026-11-25", day = i => addDays(T, -i);                // day(1) = yesterday … day(28)
  // E1 good records: 21 of 28 days have entries; 600 on each recorded day → 12,600 / 28 calendar days = 450.
  const e1d = Array.from({ length: 21 }, (_, i) => ({ date: day(i + 1), amount: 600, kind: "expense" }));
  const d1 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e1d, { date: day(3), amount: 6500, kind: "bill" }, { date: day(4), amount: 2000, kind: "goalUse" }] });
  show("D1 good records", d1); assert.equal(d1.daily, 450); assert.equal(d1.status, "ok"); assert.equal(d1.coverage, 75);
  // E2 incomplete: only 8 days recorded, 300 each → 2,400 / 28 = 86 a day. Flagged; user says 400 → 400 used.
  const e2d = Array.from({ length: 8 }, (_, i) => ({ date: day(i * 3 + 1), amount: 300, kind: "expense" }));
  const d2a = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e2d });
  const d2b = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e2d, userDaily: 400 });
  show("D2 incomplete records", { d2a, d2b }); assert.equal(d2a.computed, 86); assert.equal(d2a.status, "check"); assert.equal(d2b.daily, 400);
  // E3 same records, but a reconcile on M-Pesa found 7,000 unrecorded spending since a reconcile 35 days ago:
  // 28/35 of it is inside the window = 5,600 → (2,400 + 5,600) / 28 = 286. Trusted (the gap was measured).
  const d3 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: e2d, adjustments: [{ date: day(1), amount: 7000, since: day(36) }] });
  show("D3 with reconcile", d3); assert.equal(d3.unrecorded, 5600); assert.equal(d3.daily, 286); assert.equal(d3.status, "ok");
  // E4 a one-off: 20 entries of about 300 plus a 12,000 phone → phone left out and listed.
  const e4d = Array.from({ length: 20 }, (_, i) => ({ date: day(i + 1), amount: 300, kind: "expense" }));
  const d4 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e4d, { date: day(2), amount: 12000, kind: "expense", note: "Phone" }] });
  show("D4 one-off", d4); assert.deepEqual(d4.excluded, ["Phone 12000"]); assert.equal(d4.daily, 214);
  // E5 new user (4 days) → ask, never guess.
  const d5 = estimateUsualDaily({ today: T, trackingStart: day(4), entries: e1d.slice(0, 3) });
  assert.equal(d5.status, "ask");
  // E6 today's partial day is never in the average.
  const d6 = estimateUsualDaily({ today: T, trackingStart: "2026-09-01", entries: [...e1d, { date: T, amount: 50000, kind: "expense" }] });
  assert.equal(d6.daily, 450);

  // DB-5.6: the default cushion is a warning threshold only. It never changes Left to spend or the daily guide.
  for (const base of [otieno, akinyi, mwangi, njeri]) {        // all have no buffer, so the default cushion applies
    const res = willIMakeIt(base);
    assert.equal(res.reserveDEC015, res.leftAfterCommitments);  // nothing extra deducted
    assert.equal(res.dailyGuide, Math.max(0, Math.floor(res.leftAfterCommitments / res.horizon.days)));
  }
  console.log("\nAll DB-5 worked examples and properties check out.");
}
