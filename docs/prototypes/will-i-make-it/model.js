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

  // Runway: day by day, actual money only. Plans and planned spending on day 1 (conservative),
  // must-pays on their due dates, usual spending every day. Last day the money is still ≥ 0.
  // First payment at risk: only payments due before the next income (later ones are paid from it).
  let bal = x.free - plan, lastOk = null, firstAtRisk = null;
  for (let i = 0; i < 60; i++) {
    const day = addDays(x.today, i);
    const dueToday = x.mustPay.filter(p => (i === 0 ? p.due <= day : p.due === day));
    for (const p of dueToday) {
      if (p.due <= h.end && bal < p.amount && !firstAtRisk) firstAtRisk = { item: p.name, date: i === 0 ? x.today : p.due, have: Math.max(0, r(bal)) };
      bal -= p.amount;
    }
    bal -= x.usualDaily;
    if (bal < 0 && day >= h.end) break;
    if (bal >= 0) lastOk = day;
  }
  // Runway: the last day the money (no income counted) stays at or above zero at usual spending.
  // It continues past the horizon (including later payments) to show what happens if income is late.

  // "If it arrives" lines: one per expected item, never summed, never in the verdict.
  const ifArrives = x.expected.map(e => {
    const reaches = e.amount - (e.autoDeduct || 0);
    const before = inPeriod.filter(p => p.due < e.date).map(p => p.name);
    return { name: e.name, date: e.date, amount: e.amount, reaches, marginIfArrives: margin + reaches,
      inPeriod: e.date <= h.end, paymentsDueBeforeIt: before };
  });

  // Daily guide = today's DEC-015 safe-to-spend per day (keeps the buffer), so the app shows ONE daily figure.
  const dailyGuide = Math.max(0, Math.floor(reserveDEC015 / h.days));
  return { horizon: h, must, mustItems: inPeriod.map(p => p.name), afterPeriod: afterPeriod.map(p => `${p.name} ${p.amount} on ${p.due}`),
    plan, need, leftAfterCommitments, reserveDEC015, margin, cushion, verdict, alreadyShortOn,
    shortOnlyBecauseOfSaving, runwayLastDay: lastOk, firstAtRisk, ifArrives, dailyGuide,
    setAsideNotCounted: x.setAside };
}

// Before You Spend: same calculation with the purchase taken from free money. Records nothing.
function beforeYouSpend(x, amount, opts = {}) {
  const before = willIMakeIt(x);
  const usesSetAside = amount > x.free;                   // would dip into goal money (warn, never block)
  const after = willIMakeIt({ ...x, free: x.free - amount });
  return { amount, usesSetAside, before: before.verdict, after: after.verdict, marginBefore: before.margin,
    marginAfter: after.margin, dailyBefore: before.dailyGuide, dailyAfter: after.dailyGuide,
    firstAtRiskAfter: after.firstAtRisk, offerUseSavings: after.verdict !== "On track" && x.setAside > 0 };
}

module.exports = { willIMakeIt, beforeYouSpend, horizon };

// ---------- Worked examples (clock: Wed 25 Nov 2026) ----------
if (require.main === module) {
  const assert = require("assert");
  const show = (t, o) => console.log(`\n## ${t}\n` + JSON.stringify(o, null, 1));

  // 1. Salaried, bills on different dates, a loan instalment, savings, a buffer.
  const wanjiru = { today: "2026-11-25", free: 12000, setAside: 3000, pattern: "fixed", nextPayday: "2026-11-30",
    mustPay: [{ name: "KPLC tokens", amount: 1000, due: "2026-11-26" }, { name: "Water", amount: 500, due: "2026-11-28" },
      { name: "KCB M-Pesa loan", amount: 1500, due: "2026-11-29" }, { name: "Rent", amount: 6500, due: "2026-12-01" }],
    goalPlan: 0, planned: 0, buffer: 1000, usualDaily: 700, expected: [{ name: "Salary", amount: 35000, date: "2026-11-30" }] };
  const e1 = willIMakeIt(wanjiru); show("1 Wanjiru (salary 30 Nov)", e1);
  assert.equal(e1.horizon.days, 5); assert.equal(e1.must, 3000); assert.equal(e1.need, 3500);
  assert.equal(e1.margin, 5500); assert.equal(e1.verdict, "On track"); assert.equal(e1.reserveDEC015, 8000);

  // 1b. Same, but the employer pays on 2 Dec this month ("My pay is late" one-cycle change).
  const e1b = willIMakeIt({ ...wanjiru, nextPayday: "2026-12-02" }); show("1b Wanjiru, salary moved to 2 Dec", e1b);
  assert.equal(e1b.horizon.days, 7); assert.equal(e1b.must, 9500); assert.equal(e1b.need, 4900);
  assert.equal(e1b.margin, -2400); assert.equal(e1b.verdict, "Short"); assert.equal(e1b.dailyGuide, 214);

  // 2. Irregular, several income sources, Fuliza owed, a chama contribution.
  const otieno = { today: "2026-11-25", free: 4000, setAside: 0, pattern: "irregular", planningDays: 7,
    mustPay: [{ name: "Chama", amount: 1000, due: "2026-11-29" }], goalPlan: 0, planned: 0, buffer: 0, usualDaily: 450,
    expected: [{ name: "Client payment", amount: 3000, date: "2026-11-27", autoDeduct: 800 },
      { name: "Chama payout", amount: 10000, date: "2026-12-05" }] };
  const e2 = willIMakeIt(otieno); show("2 Otieno (irregular)", e2);
  assert.equal(e2.horizon.end, "2026-12-01"); assert.equal(e2.need, 3150); assert.equal(e2.margin, -150);
  assert.equal(e2.verdict, "Short"); assert.equal(e2.runwayLastDay, "2026-11-30"); assert.equal(e2.dailyGuide, 428);
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
  assert.deepEqual(e3.ifArrives[0].paymentsDueBeforeIt, ["Rent"]);

  // 4. Short only because of the savings plan.
  const mwangi = { today: "2026-11-25", free: 6000, setAside: 2000, pattern: "irregular", planningDays: 7,
    mustPay: [{ name: "School fees instalment", amount: 2000, due: "2026-11-30" }], goalPlan: 1500, planned: 0, buffer: 0, usualDaily: 400, expected: [] };
  const e4 = willIMakeIt(mwangi); show("4 Mwangi (savings plan)", e4);
  assert.equal(e4.margin, -300); assert.equal(e4.verdict, "Short"); assert.equal(e4.shortOnlyBecauseOfSaving, true);

  // 5. Before You Spend: unexpected hospital bill for Wanjiru.
  const b5a = beforeYouSpend(wanjiru, 4000), b5b = beforeYouSpend(wanjiru, 5000), b5c = beforeYouSpend(wanjiru, 7000);
  show("5 Before You Spend 4,000 / 5,000 / 7,000", { b5a, b5b, b5c });
  assert.equal(b5a.after, "On track"); assert.equal(b5a.marginAfter, 1500); assert.equal(b5a.firstAtRiskAfter, null); assert.equal(b5a.dailyBefore, 1600); assert.equal(b5a.dailyAfter, 800);
  assert.equal(b5b.after, "Tight"); assert.equal(b5b.marginAfter, 500); assert.equal(b5b.dailyAfter, 600);
  assert.equal(b5c.after, "Short"); assert.equal(b5c.marginAfter, -1500); assert.equal(b5c.dailyAfter, 200); assert.equal(b5c.offerUseSavings, true);
  assert.deepEqual(b5c.firstAtRiskAfter, { item: "KCB M-Pesa loan", date: "2026-11-29", have: 700 });

  // Properties: expected income never changes the verdict; adding a commitment never improves it.
  const rank = { "On track": 3, Tight: 2, Short: 1, "Already short": 0 };
  for (const base of [wanjiru, otieno, akinyi, mwangi]) {
    const v = willIMakeIt(base).verdict;
    assert.equal(willIMakeIt({ ...base, expected: [{ name: "x", amount: 1e6, date: base.today }] }).verdict, v);
    const more = willIMakeIt({ ...base, mustPay: [...base.mustPay, { name: "extra", amount: 500, due: base.today }] }).verdict;
    assert.ok(rank[more] <= rank[v]);
  }
  console.log("\nAll DB-5 worked examples and properties check out.");
}
