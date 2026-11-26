// D14 reference model: planned spending reduced when an expense is confirmed as planned, restored on reversal.
// PLANNING ARTEFACT ONLY. Not part of the app, never loaded by index.html. Run: node model.js
// Stored data used (all optional): expense.plannedUsed (5th DB-5.12 field, DEC-030) and, if the owner
// approves it, profile.plannedLedger { periodStart, used } (proposed 6th field, for detecting old-tab deletions).
"use strict";
const r = n => Math.round(n);

/** Left to spend, simplified to what D14 touches: free money − planned spending − unresolved planned amounts.
 *  Unresolved amounts (left by an older version) are deducted until the user decides: never silently optimistic. */
const leftToSpend = s => s.free - s.planned - unresolved(s).reduce((t, u) => t + u.amount, 0);
const inPeriod = (s, e) => e.date >= s.period.start && e.date <= s.period.end;
const active = e => !e.deleted && (e.reversedAmount || 0) < e.amount;
const clone = s => JSON.parse(JSON.stringify(s));

/** Record an expense; if confirmed as planned, use min(amount, planned left). */
function record(state, { id, date, amount, planned: confirmed }) {
  const s = clone(state); s.free -= amount;
  const e = { id, date, amount };
  if (confirmed && s.planned > 0) {
    e.plannedUsed = Math.min(amount, s.planned); s.planned -= e.plannedUsed;
    if (s.ledger) s.ledger.used += e.plannedUsed;
  }
  s.expenses.push(e); return s;
}

/** What a reversal (full or partial) would restore, and the planned figure before → after, for the confirm dialog.
 *  Rule 1: restore only the planned share of what is actually reversed (proportional), never more than is still recorded.
 *  Rule 4: nothing is restored if the expense belongs to an earlier planning period. */
function restorePreview(s, e, reversedNow) {
  if (!e.plannedUsed) return { restore: 0, reason: "not planned" };
  if (!inPeriod(s, e)) return { restore: 0, reason: "earlier plan" };
  const share = r(reversedNow * e.plannedUsed / (e.amount - (e.reversedAmount || 0)));
  const restore = Math.min(e.plannedUsed, share);
  return { restore, plannedNow: s.planned, plannedAfter: s.planned + restore };
}

/** Reverse all or part of an expense. `addBack` is the user's choice in the confirm dialog (default true). */
function reverse(state, id, reversedNow, { addBack = true } = {}) {
  const s = clone(state); const e = s.expenses.find(x => x.id === id);
  if (!e || !active(e)) return { state: s, restored: 0, note: "already fully reversed" };   // rule 2
  reversedNow = Math.min(reversedNow, e.amount - (e.reversedAmount || 0));
  const p = restorePreview(s, e, reversedNow);
  s.free += reversedNow; e.reversedAmount = (e.reversedAmount || 0) + reversedNow;
  if (p.restore > 0) {
    e.plannedUsed -= p.restore;                            // rule 2: the restorable amount is used up either way
    if (s.ledger) s.ledger.used -= p.restore;
    if (addBack) s.planned += p.restore;
  }
  return { state: s, restored: addBack ? p.restore : 0, preview: p };
}

/** Delete (unaudited expenses only, as today). Same rule as a full reversal. */
function remove(state, id, opts) {
  const e0 = state.expenses.find(x => x.id === id);
  const { state: s, restored, preview } = reverse(state, id, e0.amount - (e0.reversedAmount || 0), opts);
  s.expenses.find(x => x.id === id).deleted = true; return { state: s, restored, preview };
}

/** Rule 5: edit the amount down → restore the planned share no longer spent; unmark → restore what is left. */
function editAmount(state, id, newAmount, opts) {
  const e = state.expenses.find(x => x.id === id);
  if (newAmount >= e.amount) { const s = clone(state); s.free -= newAmount - e.amount; s.expenses.find(x => x.id === id).amount = newAmount; return { state: s, restored: 0 }; }
  const res = reverse(state, id, e.amount - newAmount, opts);
  const x = res.state.expenses.find(y => y.id === id); x.amount = newAmount; x.reversedAmount = 0;  // an edit changes the entry, not a reversal record
  return res;
}
function unmark(state, id, { addBack = true } = {}) {
  const s = clone(state); const e = s.expenses.find(x => x.id === id);
  const restore = inPeriod(s, e) ? (e.plannedUsed || 0) : 0;
  if (s.ledger) s.ledger.used -= e.plannedUsed || 0;
  delete e.plannedUsed; if (addBack) s.planned += restore;
  return { state: s, restored: addBack ? restore : 0 };
}

/** Rule 6: amounts left unresolved by an OLDER version, found when the new version opens the data. */
function unresolved(s) {
  const out = [];
  for (const e of s.expenses) {
    if (!e.plannedUsed || !inPeriod(s, e)) continue;
    if (!active(e)) out.push({ id: e.id, amount: e.plannedUsed, why: "reversed or deleted by an older version" });   // old version reversed it
    else if (e.plannedUsed > e.amount) out.push({ id: e.id, amount: e.plannedUsed - e.amount, why: "edited down by an older version" });
  }
  if (s.ledger && s.ledger.periodStart === s.period.start) {                                  // deletions leave no trace on entries
    // Every planned amount still written on an entry (active, reversed or edited, whoever did it). Only an entry
    // that has disappeared leaves a gap between the ledger and the entries.
    const onEntries = s.expenses.filter(e => inPeriod(s, e)).reduce((t, e) => t + (e.plannedUsed || 0), 0);
    const missing = s.ledger.used - onEntries;
    if (missing > 0) out.push({ id: null, amount: missing, why: "a planned expense was deleted by an older version" });
  }
  return out;
}
/** The user decides each unresolved amount: add back to planned spending, or let it go. */
function resolve(state, decisions) {
  const s = clone(state);
  for (const u of unresolved(state)) {
    const addBack = decisions[u.id ?? "deleted"] !== false;
    if (addBack) s.planned += u.amount;
    if (u.id != null) { const e = s.expenses.find(x => x.id === u.id); if (!active(e)) e.plannedUsed = 0; else e.plannedUsed = e.amount; }
    if (s.ledger) s.ledger.used -= u.amount;
  }
  return s;
}

/** An OLDER version (Release 1) acting on the data: it keeps unknown fields but doesn't know plannedUsed. */
const oldVersion = {
  reverse: (state, id) => { const s = clone(state); const e = s.expenses.find(x => x.id === id); s.free += e.amount - (e.reversedAmount || 0); e.reversedAmount = e.amount; return s; },
  remove: (state, id) => { const s = clone(state); const e = s.expenses.find(x => x.id === id); s.free += e.amount; s.expenses = s.expenses.filter(x => x.id !== id); return s; },
  editAmount: (state, id, a) => { const s = clone(state); const e = s.expenses.find(x => x.id === id); s.free += e.amount - a; e.amount = a; return s; },
};

module.exports = { record, reverse, remove, editAmount, unmark, unresolved, resolve, restorePreview, leftToSpend, oldVersion };

if (require.main === module) {
  const assert = require("assert"), L = console.log;
  const base = (ledger = true) => ({ period: { start: "2026-11-25", end: "2026-11-30" }, free: 10000, planned: 2000, expenses: [], ...(ledger ? { ledger: { periodStart: "2026-11-25", used: 0 } } : {}) });

  // T0 the D14 fix itself: planned 2,000 + a planned expense of 2,000 → Left to spend falls ONCE.
  let s = base(); const lts0 = leftToSpend(s);                       // 10,000 − 2,000 = 8,000
  s = record(s, { id: 1, date: "2026-11-26", amount: 2000, planned: true });
  assert.equal(leftToSpend(s), lts0);                                 // still 8,000: not 6,000
  L("T0 planned expense deducted once: Left to spend stays", leftToSpend(s));

  // T1 Rule 1, partial reversal: expense 2,500 of which 2,000 planned; 1,000 refunded → restore 2,000 × 1,000/2,500 = 800.
  s = record(base(), { id: 2, date: "2026-11-26", amount: 2500, planned: true });
  let res = reverse(s, 2, 1000);
  assert.equal(res.restored, 800); assert.equal(res.state.planned, 800); assert.equal(res.state.expenses[0].plannedUsed, 1200);
  // a second partial reversal of the remaining 1,500 restores the remaining 1,200, never more
  const res2 = reverse(res.state, 2, 1500);
  assert.equal(res2.restored, 1200); assert.equal(res2.state.planned, 2000); assert.equal(res2.state.expenses[0].plannedUsed, 0);
  L("T1 partial reversals restore 800 then 1,200: total 2,000, exactly what was used");

  // T2 Rule 2, repeated or duplicate reversal: nothing more is restored.
  const res3 = reverse(res2.state, 2, 2500);
  assert.equal(res3.restored, 0); assert.equal(res3.state.planned, 2000); assert.equal(res3.note, "already fully reversed");
  L("T2 a repeated reversal restores nothing");

  // T3 Rule 3, the plan changed by hand after the expense: planned 2,000 → expense uses 2,000 → user sets planned to 1,000
  //    → reversal. The dialog shows the RESULT before anything changes; the user can keep the current plan.
  s = record(base(), { id: 3, date: "2026-11-26", amount: 2000, planned: true }); s.planned = 1000;
  const prev = restorePreview(s, s.expenses[0], 2000);
  assert.deepEqual([prev.plannedNow, prev.restore, prev.plannedAfter], [1000, 2000, 3000]);
  assert.equal(reverse(s, 3, 2000).state.planned, 3000);                  // "Add back" (default)
  const kept = reverse(s, 3, 2000, { addBack: false });
  assert.equal(kept.state.planned, 1000); assert.equal(kept.state.expenses[0].plannedUsed, 0);   // "Keep KSh 1,000": used up, can't come back later
  L("T3 plan edited in between: dialog shows 1,000 → 3,000; 'Keep 1,000' leaves 1,000 and the amount can't return later");

  // T4 Rule 4, reversal after the planning period ended: nothing restored, message shown.
  s = record(base(), { id: 4, date: "2026-11-26", amount: 2000, planned: true });
  s.period = { start: "2026-12-01", end: "2026-12-06" }; s.planned = 1500; s.ledger = { periodStart: "2026-12-01", used: 0 };
  res = reverse(s, 4, 2000);
  assert.equal(res.restored, 0); assert.equal(res.preview.reason, "earlier plan"); assert.equal(res.state.planned, 1500);
  L("T4 reversal in a later period: nothing restored ('this was part of an earlier plan')");

  // T5 Rule 5, edit down and unmark.
  s = record(base(), { id: 5, date: "2026-11-26", amount: 2000, planned: true });
  res = editAmount(s, 5, 1500);
  assert.equal(res.restored, 500); assert.equal(res.state.planned, 500); assert.equal(res.state.expenses[0].plannedUsed, 1500);
  const um = unmark(res.state, 5);
  assert.equal(um.restored, 1500); assert.equal(um.state.planned, 2000); assert.equal(um.state.expenses[0].plannedUsed, undefined);
  assert.equal(leftToSpend(um.state), 10000 - 1500 - 2000);
  L("T5 edit 2,000 → 1,500 restores 500; unmarking restores the other 1,500");

  // T6 Rule 6, an OLD version (Release 1 tab or rollback) acts on the data, then the new version reopens it.
  // T6a old version REVERSES a planned expense → detected from the entry; deducted until the user decides.
  s = record(base(), { id: 6, date: "2026-11-26", amount: 2000, planned: true });          // planned 0, Left to spend 8,000
  let old = oldVersion.reverse(s, 6);                                                        // money back: free 10,000, planned still 0
  assert.equal(old.free - old.planned, 10000);                                               // what the OLD version shows: optimistic by 2,000
  assert.deepEqual(unresolved(old).map(u => [u.amount, u.why]), [[2000, "reversed or deleted by an older version"]]);
  assert.equal(leftToSpend(old), 8000);                                                      // new version: NOT optimistic
  assert.equal(leftToSpend(resolve(old, { 6: true })), 8000); assert.equal(resolve(old, { 6: true }).planned, 2000);
  assert.equal(leftToSpend(resolve(old, { 6: false })), 10000);                              // only if the user says "let it go"
  assert.deepEqual(unresolved(resolve(old, { 6: true })), []);                               // asked once only
  L("T6a old version reversed it: new version deducts the 2,000 until the user decides (asked once)");
  // T6b old version DELETES it → the entry is gone. Detected only through the ledger (proposed 6th field).
  old = oldVersion.remove(s, 6);
  assert.deepEqual(unresolved(old).map(u => [u.amount, u.why]), [[2000, "a planned expense was deleted by an older version"]]);
  assert.equal(leftToSpend(old), 8000);
  const sNoLedger = record(base(false), { id: 6, date: "2026-11-26", amount: 2000, planned: true });
  const oldNoLedger = oldVersion.remove(sNoLedger, 6);
  assert.deepEqual(unresolved(oldNoLedger), []); assert.equal(leftToSpend(oldNoLedger), 10000);   // WITHOUT the ledger: silently optimistic
  L("T6b old version deleted it: caught only with the ledger; without it Left to spend would silently rise by 2,000");
  // T6c old version EDITS it down → detected from the entry (plannedUsed > amount).
  old = oldVersion.editAmount(s, 6, 1200);
  assert.deepEqual(unresolved(old).map(u => [u.amount, u.why]), [[800, "edited down by an older version"]]);
  assert.equal(leftToSpend(old), 10000 - 1200 - 800);
  L("T6c old version edited it down: the 800 difference is held back until the user decides");
  // T6d nothing unusual → no prompts.
  assert.deepEqual(unresolved(s), []);
  console.log("\nAll D14 rules check out (T0–T6).");
}
