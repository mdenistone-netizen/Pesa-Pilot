// D14 reference model: planned spending reduced when an expense is confirmed as planned, restored on reversal,
// with the plannedLedger safeguard (owner chose option A, 26 Nov).
// PLANNING ARTEFACT ONLY. Not part of the app, never loaded by index.html. Run: node model.js
//
// Stored data (all optional, schema 11, DEC-030):
//   expense.plannedUsed            how much of the plan this expense still holds (5th DB-5.12 field)
//   profile.plannedLedger          { periodStart, used }  (6th field)
//     periodStart  the first day of the planning period the ledger belongs to
//     used         the TOTAL plannedUsed held by this period's expenses, as last written by a version that knows it
// Invariant kept by every new-version action: ledger.used === Σ plannedUsed over this period's entries.
// The ledger never stores the planned-spending AMOUNT, so changing that amount by hand never touches it.
"use strict";
const r = n => Math.round(n);
const clone = s => JSON.parse(JSON.stringify(s));
const inPeriod = (s, e) => e.date >= s.period.start && e.date <= s.period.end;
const active = e => !e.deleted && (e.reversedAmount || 0) < e.amount;
const heldOnEntries = s => s.expenses.filter(e => inPeriod(s, e)).reduce((t, e) => t + (e.plannedUsed || 0), 0);
const consistent = s => !s.ledger || s.ledger.periodStart !== s.period.start || s.ledger.used === heldOnEntries(s);

// ---------------- New-version actions (each keeps the invariant) ----------------
function record(state, { id, date, amount, planned: confirmed }) {
  const s = clone(state); s.free -= amount;
  const e = { id, date, amount };
  if (confirmed && s.planned > 0 && inPeriod(s, e)) { e.plannedUsed = Math.min(amount, s.planned); s.planned -= e.plannedUsed; s.ledger.used += e.plannedUsed; }
  s.expenses.push(e); return s;
}
/** Point 2: a deliberate change of the planned amount. The ledger is NOT touched: it tracks what expenses hold, not the plan size. */
function setPlanned(state, amount) { const s = clone(state); s.planned = amount; return s; }

/** Rule 1/2/4: the planned share of what is actually reversed; capped by what the entry still holds; nothing for an earlier plan. */
function restorePreview(s, e, reversedNow) {
  if (!e.plannedUsed) return { restore: 0, reason: "not planned" };
  if (!inPeriod(s, e)) return { restore: 0, reason: "earlier plan" };
  const restore = Math.min(e.plannedUsed, r(reversedNow * e.plannedUsed / (e.amount - (e.reversedAmount || 0))));
  return { restore, plannedNow: s.planned, plannedAfter: s.planned + restore };
}
function reverse(state, id, reversedNow, { addBack = true } = {}) {
  const s = clone(state); const e = s.expenses.find(x => x.id === id);
  if (!e || !active(e)) return { state: s, restored: 0, note: "already fully reversed" };
  reversedNow = Math.min(reversedNow, e.amount - (e.reversedAmount || 0));
  const p = restorePreview(s, e, reversedNow);
  s.free += reversedNow; e.reversedAmount = (e.reversedAmount || 0) + reversedNow;
  if (p.restore > 0) { e.plannedUsed -= p.restore; s.ledger.used -= p.restore; if (addBack) s.planned += p.restore; }  // point 3
  return { state: s, restored: addBack ? p.restore : 0, preview: p };
}
function remove(state, id, opts) {      // a new-version delete: restores first, so the entry holds 0 when it disappears
  const e0 = state.expenses.find(x => x.id === id);
  const res = reverse(state, id, e0.amount - (e0.reversedAmount || 0), opts);
  res.state.expenses = res.state.expenses.filter(x => x.id !== id); return res;
}
function editAmount(state, id, newAmount, opts) {
  const e = state.expenses.find(x => x.id === id);
  if (newAmount >= e.amount) { const s = clone(state); s.free -= newAmount - e.amount; s.expenses.find(x => x.id === id).amount = newAmount; return { state: s, restored: 0 }; }
  const res = reverse(state, id, e.amount - newAmount, opts);
  const x = res.state.expenses.find(y => y.id === id); x.amount = newAmount; x.reversedAmount = 0;
  return res;
}
function unmark(state, id, { addBack = true } = {}) {
  const s = clone(state); const e = s.expenses.find(x => x.id === id);
  const held = e.plannedUsed || 0, restore = inPeriod(s, e) ? held : 0;
  if (inPeriod(s, e)) s.ledger.used -= held;
  delete e.plannedUsed; if (addBack) s.planned += restore;
  return { state: s, restored: addBack ? restore : 0 };
}

// ---------------- Detection (point 4) and recovery (point 6) ----------------
/** Amounts an OLDER version left unresolved in the current period. Each item explains itself. */
function discrepancies(s) {
  const out = [];
  for (const e of s.expenses) {
    if (!e.plannedUsed || !inPeriod(s, e)) continue;
    if (!active(e)) out.push({ key: `rev:${e.id}`, amount: e.plannedUsed, why: `An expense of KSh ${e.amount} on ${e.date} was reversed by an older version of PesaPilot. KSh ${e.plannedUsed} of your planned spending was tied to it.` });
    else if (e.plannedUsed > e.amount) out.push({ key: `edit:${e.id}`, amount: e.plannedUsed - e.amount, why: `An expense was reduced to KSh ${e.amount} by an older version. KSh ${e.plannedUsed - e.amount} of your plan was tied to the removed part.` });
  }
  if (s.ledger && s.ledger.periodStart === s.period.start) {
    const missing = s.ledger.used - heldOnEntries(s);
    if (missing > 0) out.push({ key: "deleted", amount: missing, why: `KSh ${missing} of planned spending was tied to expenses that are no longer in your records. They were probably deleted by an older version of PesaPilot.` });
  }
  return out;
}
/** Left to spend: unresolved amounts are HELD BACK (deducted) until the user decides, and shown as such. */
const heldBack = s => discrepancies(s).reduce((t, d) => t + d.amount, 0);
const leftToSpend = s => s.free - s.planned - heldBack(s);

/** The user's decision for each item: "addBack" (becomes planned spending), "letGo" (released), "later" (stays held back, visible). */
function resolve(state, decisions) {
  const s = clone(state);
  for (const d of discrepancies(state)) {
    const choice = decisions[d.key] || "later";
    if (choice === "later") continue;
    if (choice === "addBack") s.planned += d.amount;
    if (d.key === "deleted") s.ledger.used -= d.amount;                         // the ledger now matches the entries
    else {
      const e = s.expenses.find(x => `rev:${x.id}` === d.key || `edit:${x.id}` === d.key);
      e.plannedUsed = d.key.startsWith("rev:") ? 0 : e.amount; s.ledger.used -= d.amount;
    }
  }
  return s;
}

// ---------------- Period change and migration (point 5) ----------------
/** New planning period: unresolved items of the old period LAPSE (that plan is over), with one message; nothing is deducted
 *  indefinitely. A new ledger starts from the new period's entries. */
function startNewPeriod(state, period) {
  const s = clone(state); const lapsed = discrepancies(state);
  s.period = period; s.ledger = { periodStart: period.start, used: 0 }; s.ledger.used = heldOnEntries(s);
  return { state: s, lapsed: lapsed.map(d => d.amount), message: lapsed.length ? "Some planned spending from your last plan couldn't be matched to your records. That plan has ended, so nothing is held back any more." : null };
}
/** Upgrade to schema 11. Never resets an existing ledger (that would erase the evidence of a deletion). Creates one only if
 *  absent, from the entries. Atomic: on any failure the stored data is left exactly as it was (single write after success). */
function migrateTo11(stored, { failMidway = false } = {}) {
  const s = clone(stored);
  if (!s.ledger) s.ledger = { periodStart: s.period.start, used: heldOnEntries(s) };
  if (failMidway) throw new Error("migration failed");
  s.schemaVersion = 11; return s;
}
function safeUpgrade(storage, opts) {           // what the app does on load
  const before = storage.data;
  try { storage.data = migrateTo11(before, opts); } catch { storage.data = before; storage.error = "upgrade failed; nothing changed"; }
  return storage;
}

// ---------------- An OLDER version (Release 1): keeps unknown fields, doesn't understand them ----------------
const oldVersion = {
  reverse: (st, id) => { const s = clone(st); const e = s.expenses.find(x => x.id === id); s.free += e.amount - (e.reversedAmount || 0); e.reversedAmount = e.amount; return s; },
  remove: (st, id) => { const s = clone(st); const e = s.expenses.find(x => x.id === id); s.free += e.amount; s.expenses = s.expenses.filter(x => x.id !== id); return s; },
  editAmount: (st, id, a) => { const s = clone(st); const e = s.expenses.find(x => x.id === id); s.free += e.amount - a; e.amount = a; return s; },
  setPlanned: (st, a) => { const s = clone(st); s.planned = a; return s; },
};

module.exports = { record, setPlanned, reverse, remove, editAmount, unmark, discrepancies, resolve, leftToSpend, heldBack, startNewPeriod, migrateTo11, safeUpgrade, restorePreview, consistent, oldVersion };

if (require.main === module) {
  const assert = require("assert"), L = console.log;
  const P = { start: "2026-11-25", end: "2026-11-30" };
  const base = () => ({ schemaVersion: 11, period: P, free: 10000, planned: 2000, expenses: [], ledger: { periodStart: P.start, used: 0 } });
  const withPlanned = (amount = 2000) => record(base(), { id: 1, date: "2026-11-26", amount, planned: true });

  // ===== Point 1: ledger structure and updates =====
  let s = withPlanned();
  assert.deepEqual(s.ledger, { periodStart: "2026-11-25", used: 2000 }); assert.ok(consistent(s));
  assert.equal(leftToSpend(s), 8000);                                                   // T0: deducted once
  L("P1 ledger after a planned expense of 2,000:", JSON.stringify(s.ledger), "· consistent with entries · Left to spend 8,000 (deducted once)");

  // ===== Point 2: deliberate changes to the planned amount are not "missing expenses" =====
  let m = setPlanned(s, 5000); assert.deepEqual(discrepancies(m), []); assert.ok(consistent(m)); assert.equal(leftToSpend(m), 3000);
  m = setPlanned(m, 0);        assert.deepEqual(discrepancies(m), []); assert.equal(leftToSpend(m), 8000);
  const mOld = oldVersion.setPlanned(s, 300); assert.deepEqual(discrepancies(mOld), []);   // even when an older version changes it
  L("P2 planned amount changed by hand (5,000, then 0; and 300 in an older version): no discrepancy, ledger untouched");

  // ===== Point 3: partial reversals and edits are counted once =====
  s = withPlanned(2500);                                                                 // 2,500 expense, 2,000 planned
  let a = reverse(s, 1, 1000); assert.equal(a.restored, 800); assert.ok(consistent(a.state)); assert.equal(a.state.ledger.used, 1200);
  let b = reverse(a.state, 1, 1500); assert.equal(b.restored, 1200); assert.equal(b.state.ledger.used, 0); assert.ok(consistent(b.state));
  assert.equal(reverse(b.state, 1, 2500).restored, 0);                                   // nothing twice
  assert.deepEqual(discrepancies(b.state), []);                                          // restored amounts are never flagged later
  let c = editAmount(withPlanned(), 1, 1500); assert.equal(c.restored, 500); assert.equal(c.state.ledger.used, 1500); assert.ok(consistent(c.state));
  let k = reverse(withPlanned(), 1, 2000, { addBack: false }); assert.equal(k.state.planned, 0); assert.equal(k.state.ledger.used, 0); assert.deepEqual(discrepancies(k.state), []);
  // Rule 4: reversal after the period ended restores nothing; Rule 5: unmark restores what is left
  const ended = startNewPeriod(withPlanned(), { start: "2026-12-01", end: "2026-12-06" }).state; ended.planned = 1500;
  const r4 = reverse(ended, 1, 2000); assert.equal(r4.restored, 0); assert.equal(r4.preview.reason, "earlier plan"); assert.equal(r4.state.planned, 1500); assert.ok(consistent(r4.state));
  const r5 = unmark(c.state, 1); assert.equal(r5.restored, 1500); assert.equal(r5.state.planned, 2000); assert.equal(r5.state.ledger.used, 0); assert.ok(consistent(r5.state));
  L("P3 partial reversals 800 + 1,200, an edit (500) and a 'keep current plan' choice: ledger follows exactly; nothing restored twice or flagged later");

  // ===== Point 4: an older version DELETES a planned expense → detected, held back conservatively =====
  s = withPlanned();
  let old = oldVersion.remove(s, 1);                                                     // older version: money back, entry gone
  assert.equal(old.free - old.planned, 10000);                                           // what the older version shows (optimistic by 2,000)
  const d = discrepancies(old);
  assert.deepEqual(d.map(x => [x.key, x.amount]), [["deleted", 2000]]);
  assert.equal(heldBack(old), 2000); assert.equal(leftToSpend(old), 8000);               // new version: held back, not optimistic
  L("P4 deletion by an older version: found from the ledger (2,000 expected, 0 on entries); 2,000 held back → Left to spend 8,000, not 10,000");
  L("   message:", d[0].why);

  // ===== Point 6: recovery and the user's choice (never silent either way) =====
  const addBack = resolve(old, { deleted: "addBack" }); assert.equal(addBack.planned, 2000); assert.equal(leftToSpend(addBack), 8000); assert.deepEqual(discrepancies(addBack), []); assert.ok(consistent(addBack));
  const letGo = resolve(old, { deleted: "letGo" });     assert.equal(letGo.planned, 0);     assert.equal(leftToSpend(letGo), 10000); assert.deepEqual(discrepancies(letGo), []);
  const later = resolve(old, { deleted: "later" });     assert.equal(heldBack(later), 2000); assert.equal(leftToSpend(later), 8000);   // still held, still shown
  const lapse = startNewPeriod(later, { start: "2026-12-01", end: "2026-12-06" });
  assert.deepEqual(lapse.lapsed, [2000]); assert.equal(heldBack(lapse.state), 0); assert.ok(lapse.message);              // never held back indefinitely
  L("P6 choices: 'Add back' → planned 2,000 (Left 8,000) · 'Let it go' → Left 10,000 by the user's choice · 'Later' → still held back and shown, until the period ends, then it lapses with a message");

  // Other older-version actions are still detected from the entries, without double counting through the ledger
  const oRev = oldVersion.reverse(withPlanned(), 1); assert.deepEqual(discrepancies(oRev).map(x => [x.key, x.amount]), [["rev:1", 2000]]);
  const oEd = oldVersion.editAmount(withPlanned(), 1, 1200); assert.deepEqual(discrepancies(oEd).map(x => [x.key, x.amount]), [["edit:1", 800]]);
  assert.ok(consistent(resolve(oRev, { "rev:1": "addBack" }))); assert.ok(consistent(resolve(oEd, { "edit:1": "letGo" })));
  // Combined: an older version reverses one planned expense and deletes another → two items, correct total
  let two = record(withPlanned(1000), { id: 2, date: "2026-11-27", amount: 600, planned: true });   // planned 2,000: 1,000 + 600 used
  two = oldVersion.remove(oldVersion.reverse(two, 1), 2);
  assert.deepEqual(discrepancies(two).map(x => [x.key, x.amount]), [["rev:1", 1000], ["deleted", 600]]); assert.equal(heldBack(two), 1600);
  L("   older version reversed one and deleted another: 1,000 + 600 held back, each explained separately");

  // ===== Point 5: the ledger survives older versions, rollbacks and failed migrations =====
  // 5a An older version keeps unknown profile fields when it saves (proved on the REAL Release 1 build: release1-ledger.js).
  // 5b Upgrade never resets an existing ledger, even when entries no longer match it (that would erase the evidence):
  const afterOldDelete = { ...oldVersion.remove(withPlanned(), 1), schemaVersion: 10 };          // older version also relabelled schema 10
  const up = migrateTo11(afterOldDelete); assert.deepEqual(up.ledger, { periodStart: "2026-11-25", used: 2000 }); assert.equal(heldBack(up), 2000);
  assert.deepEqual(migrateTo11(up), up);                                                          // idempotent
  // 5c A failed upgrade changes nothing; the next attempt works.
  const store = { data: afterOldDelete }; safeUpgrade(store, { failMidway: true });
  assert.strictEqual(store.data, afterOldDelete); assert.equal(store.error, "upgrade failed; nothing changed");
  safeUpgrade(store); assert.equal(store.data.ledger.used, 2000); assert.equal(heldBack(store.data), 2000);
  // 5d Data with NO ledger (older than schema 11) gets one built from its entries: nothing to lose, no false alarm.
  const legacy = clone(withPlanned()); delete legacy.ledger; legacy.schemaVersion = 10;
  const fresh = migrateTo11(legacy); assert.equal(fresh.ledger.used, 2000); assert.deepEqual(discrepancies(fresh), []);
  // 5e If a ledger were ever lost entirely, a deletion before that point can't be proven: stated limit (why 5a–5c matter).
  const lost = clone(old); delete lost.ledger; assert.deepEqual(discrepancies(migrateTo11(lost)), []);
  L("P5 upgrade keeps an existing ledger (2,000 still held back after an older version's delete + relabel); idempotent; a failed upgrade changes nothing; no-ledger data gets one from its entries; a lost ledger can't prove past deletions (stated limit)");

  console.log("\nAll D14 + ledger checks pass (P1–P6, plus T0–T6 behaviour).");
}
