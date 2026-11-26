// Schema 11 REFERENCE model (planning artefact; not the app, never loaded by index.html).
// Stands in for the not-yet-built schema 11 application so the cancellation-recovery design can be
// tested end to end against the REAL Release 1 build. When DB-5 is built, the same test must be
// re-run against the real schema 11 code.
"use strict";
const SCHEMA = 11, BACKUP_VERSION = 5;

/** Source of truth for a cancellation: a non-empty cancelledAt date. The status field is a convenience copy. */
const isCancelled = item => typeof item.cancelledAt === "string" && item.cancelledAt !== "";

/** Load any schema ≤ 11 data. Idempotent: running it again changes nothing (DEC-004). */
function load(state) {
  const s = JSON.parse(JSON.stringify(state));
  s.expectedIncome = (s.expectedIncome || []).map(item => {
    if (isCancelled(item)) return { ...item, status: "cancelled" };          // repairs a status an older version rewrote
    if (item.status === "cancelled") return { ...item, status: "expected" };  // status without a date is not trusted
    return item;
  });
  s.schemaVersion = SCHEMA;
  return s;
}

function cancelExpected(state, id, date) {
  const s = load(state);
  s.expectedIncome = s.expectedIncome.map(i => (i.id === id ? { ...i, status: "cancelled", cancelledAt: date } : i));
  return s;
}

/** Expected payments still pending: not received, not cancelled. Used by the list, the forecasts and the reminders. */
const pending = state => load(state).expectedIncome.filter(i => i.status !== "received" && !isCancelled(i));
/** "Late" reminders: pending payments whose date has passed. */
const lateReminders = (state, today) => pending(state).filter(i => i.expectedDate && i.expectedDate < today);

module.exports = { SCHEMA, BACKUP_VERSION, load, cancelExpected, pending, lateReminders, isCancelled };
