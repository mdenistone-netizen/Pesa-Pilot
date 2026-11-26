// Proves a change did not touch the financial engine: hashes the exact source of every
// calculation, storage, migration, PIN and backup function in app/index.html.
//   node tests/engine-fingerprint.js save    -> tests/snapshots/engine-fingerprint.json
//   node tests/engine-fingerprint.js compare -> exit 1 if any engine function changed
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const FILE = path.join(__dirname, "snapshots", "engine-fingerprint.json");
const FUNCTIONS = [
  // storage, migration, backups
  "newAccount", "normaliseAccounts", "ensureAccountForMethod", "upgradeToAccounts", "migrateTransactionType", "migrate",
  "loadState", "persist", "backupPayload", "downloadBackup", "createSafetyBackup", "safetyBackupText", "validateBackup",
  "importBackupFile", "restoreSafetyBackup", "preUpgradeSnapshotText", "downloadPreUpgradeSnapshot", "commit",
  // PIN protection
  "derivePinHash", "createPinRecord", "validPinRecord", "equalStrings", "hasPin", "pinLength", "verifyPin", "setPin",
  "withoutSecrets", "scrubStoredCopies", "upgradeStoredPin", "pinAttempts", "pinLockSeconds", "recordPinFailure", "clearPinFailures", "checkPinEntry",
  // balances, classification, goals, debts, bills
  "totals", "monthTotals", "rangeTotals", "accountById", "goalExists", "isValidTransfer", "isReversalPair", "activeTransactions", "isAudited",
  "accountBalance", "liveAllocations", "accountAllocated", "accountAvailable", "totalHeld", "totalAllocated", "totalAvailable",
  "goalSaved", "goalOnAccount", "goalHoldings", "syncDerived", "goalContributions",
  "billPaidAmountOn", "billIsPaidOn", "billOutstanding", "billOccurrencesForMonth", "billOccurrencesBetween", "nextBillOccurrence",
  "billOverdueOccurrence", "billCycleStart", "unpaidBills", "billCommitments", "recordBillExpense",
  // safe to spend
  "isSpendingAccount", "spendingAccounts", "planPeriod", "billsDue", "debtInstalments", "goalPlanReserve", "expectedIncomeItems",
  "cycleBillCommitments", "debtCommitments", "savingsCommitments", "paydayDate", "daysToPayday", "planner", "emergencyFund", "healthScore",
  // linked consistency, adjustments
  "confirmOutflow", "refreshBillStatus", "linkedRecord", "syncLinkedFromTransaction", "removeLinkedForTransaction", "reverseTransaction",
  "isLinkedReference", "defaultAccountId"
];
const CONSTANTS = ["STORAGE_KEY", "SAFETY_BACKUP_KEY", "SCHEMA_VERSION", "BACKUP_VERSION", "PRE_V10_KEY", "PIN_ITERATIONS", "PIN_ATTEMPTS_KEY",
  "INFLOW_KINDS", "OUTFLOW_KINDS", "sum", "roundMoney", "safeNumber", "todayISO", "blankState", "bytesToBase64", "base64ToBytes", "pinCryptoAvailable"];

function extract(src, name) {
  const m = src.match(new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`));
  if (!m) return null;
  let i = src.indexOf("{", m.index), depth = 0, start = m.index;
  for (; i < src.length; i++) { if (src[i] === "{") depth++; else if (src[i] === "}" && --depth === 0) break; }
  return src.slice(start, i + 1);
}
function extractConst(src, name) {
  const m = src.match(new RegExp(`const\\s+${name}\\s*=`));
  if (!m) return null;
  let i = m.index, depth = 0;
  for (; i < src.length; i++) { const c = src[i]; if ("{([".includes(c)) depth++; else if ("})]".includes(c)) depth--; else if (c === ";" && depth === 0) break; }
  return src.slice(m.index, i + 1);
}
const src = fs.readFileSync(path.join(__dirname, "..", "app", "index.html"), "utf8").replace(/\r\n/g, "\n");
const hash = text => text === null ? "MISSING" : crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
const current = {};
FUNCTIONS.forEach(n => { current["function " + n] = hash(extract(src, n)); });
CONSTANTS.forEach(n => { current["const " + n] = hash(extractConst(src, n)); });
const missing = Object.entries(current).filter(([, v]) => v === "MISSING").map(([k]) => k);
if (missing.length) { console.log("Not found:", missing.join(", ")); process.exit(1); }
if (process.argv[2] === "save") { fs.writeFileSync(FILE, JSON.stringify(current, null, 2) + "\n"); console.log(`Saved fingerprint of ${Object.keys(current).length} engine functions/constants`); process.exit(0); }
const base = JSON.parse(fs.readFileSync(FILE, "utf8"));
const changed = Object.keys({ ...base, ...current }).filter(k => base[k] !== current[k]);
changed.forEach(k => console.log("CHANGED  " + k));
console.log(`${Object.keys(current).length - changed.length}/${Object.keys(current).length} engine functions and constants unchanged`);
process.exit(changed.length ? 1 : 0);
