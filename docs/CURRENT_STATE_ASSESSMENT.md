# PesaPilot — Current-State Assessment (Checkpoint 1)

Date: 2026-11-25 · Branch inspected: `main` @ `8e33d44` · Scope: read-only inspection, no code changed.

## 1. What was available to inspect

| Source | Status |
|---|---|
| GitHub repo `Pesa-Pilot` | Inspected. Holds **one file**: `index.html` (183 KB, 1,569 lines, inline CSS + JS). 4 commits, all web uploads/edits (Jul–Aug 2026). |
| Phase 0 Baseline Inspection Report (.docx) | **Not in the repo and not provided.** Needs to be uploaded (see §6). |
| Technical review + amendments | **Not provided.** |
| Live site pesa-pilot.netlify.app | **Not reachable** from the Claude cloud container (network policy). Whether the live site equals `main` is **unverified**. |
| Firebase | **Not implemented.** No Firebase/Firestore SDK, config or reference anywhere in the code. |

## 2. Actual architecture

- Single-page app, vanilla JavaScript inside one IIFE, no build step, no external libraries, no tests.
- All data lives in browser `localStorage` (`pesapilot_v2`), schema version 9, backup version 3. Nothing leaves the device.
- Data model: `transactions` (income/expense only), `goals` (with contributions), `bills` (with occurrences/payments), `debts` (money I owe only), `categories`, `budgets`, `profile`, `pin`.
- `paymentMethod` (M-Pesa/Cash/Bank/Card/Other) is a **label**, not an account. There is one global balance: all-time income − all-time expense.
- No PWA manifest, no service worker (only a `beforeinstallprompt` listener, which won't fire without a manifest).
- No licensing or `localhost` logic exists in this code. If the Phase 0 report describes it, it describes a different version than what is in GitHub.

## 3. Verified defects (with evidence)

Evidence was produced by loading the real `index.html` in headless Chromium (Nairobi timezone), seeding: income 30,000 · food 5,000 · goal contribution 4,000 · a transfer record of 2,000.

| # | Defect | Evidence | Severity |
|---|---|---|---|
| D1 ✅ fixed CR-001 | Migration runs on **every load**, rebuilds every record and coerces any non-`income` type to `expense`; unknown fields are dropped. | Seeded `{type:"transfer", fromAccount, toAccount}` came back as `{type:"expense"}` with both account fields deleted (`migrate()` ~line 578). | Critical — blocks adding new transaction types safely |
| D2 ✅ fixed CR-002 | Savings contributions are recorded as **expenses**. | Home showed balance **KSh 19,000** (money in savings treated as spent); month expenses **KSh 11,000** instead of 5,000. Savings rate understated. (line 1464) | High |
| D3 | Debt repayments are expenses, but borrowing is never recorded as money received; no "money owed to me" at all. | No receivable/lent/borrow logic exists (keyword search: 0 hits). | High (missing feature) |
| D4 ✅ fixed CR-002 | Deleting/editing a linked transaction does not update its goal/debt/bill. | `delete-transaction` just filters the array (line 1518); `goal.current`, `debt.repaid`, bill payments stay unchanged. | High — silent inconsistency |
| D5 ◐ partly (CR-002), rest Phase 2 | Safe-to-spend uses the all-time balance, assumes a single fixed payday, and debt fallback = 5% of declared monthly income. | `planner()` / `debtCommitments()` (~lines 880–895). Not valid for irregular income. | High |
| D6 | PIN stored and exported in **plaintext**. | `state.pin` is saved raw in localStorage and included in JSON backups (export confirmed the `pin` field). Device fingerprint (user agent) also exported. | High (security) |
| D7 ✅ fixed CR-001 | Dead/duplicate code. | `renderGoals/Debts/Reports/Settings` defined twice (later wins), plus `renderSettingsLegacy`, `bindActionsLegacy`, `payBillOriginal`. | Medium (maintainability) |
| D8 ✅ fixed CR-002 | No multi-account model, opening balances or transfers. | Not present. | Core gap |
| D9 | No PWA manifest/service worker. | Not present. | Medium |
| D10 | Dates use device-local time, not explicitly Africa/Nairobi. Works for phones set to Kenyan time; otherwise mostly safe (noon anchoring). | `todayISO()` uses local date. | Low |

## 4. Requirements vs implementation

| Requirement | State |
|---|---|
| A. Daily tracking (income/expense, categories, history, edit) | Partial — transactions yes; **no daily opening/closing balances**, no expected-vs-actual |
| B. Multiple accounts, transfers | **Not started** |
| C. Income sources | Partial — category only; fixed-payday assumption |
| D. Expenses | Mostly done (categories, filters, monthly comparison) |
| E. Budgeting | Partial — monthly + per-category limits; no custom periods |
| F. Savings goals | Partial — contributions yes, **no withdrawals**, wrong classification (D2) |
| G. Bills | Mostly done — recurring, occurrences, partial payments, reminders |
| H. Debts — I owe | Partial (D3, D4) · Owed to me: **Not started** |
| I. Dashboard/reports | Partial — exists, but figures are distorted by D2/D5 |
| J. Insights | Partial — rule-based insights exist; depend on flawed figures |
| Security / backups | Partial — backup/restore/safety backup exist; PIN plaintext (D6) |
| PWA / offline | Not started |
| Firebase / cloud sync / login | Not started |

## 5. Recommended next phase

Phase 1 cannot start safely until two foundations exist, because every Phase 1 change touches money data:

**Phase 0.5 — Safety net (small, no user-visible change)**
1. Extract the calculation and migration functions so they can be tested (still one deployable page; no framework).
2. Add an automated test suite (Node + the pre-installed Playwright) that pins today's behaviour and the defects above.
3. Make `migrate()` non-destructive: preserve unknown fields and unknown transaction types instead of converting them.
4. Remove dead duplicate code (verified unused).

**Phase 1 — Financial data model**: accounts with opening balances; transaction kinds `income`, `expense`, `transfer`, `savings_in/out`, `borrow`, `repay`, `lend`, `collect`; linked records with consistent edit/delete; one-time, backed-up, reversible migration from schema 9.

Firebase is **not** recommended yet. Correct local data comes first; cloud sync multiplies any data-model mistake.

## 6. Open items needing the owner

1. Upload the Phase 0 report and the technical review/amendments into `docs/` of the repo.
2. Confirm whether the live Netlify site is deployed from this repo's `main` (Netlify → Site → Deploys shows the source), or by manual upload.
3. Confirm whether real users (including yourself) have data in the live app — this decides how careful the migration must be.
