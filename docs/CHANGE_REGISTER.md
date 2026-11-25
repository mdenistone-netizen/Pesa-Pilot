# Change Register

One entry per change to the application. Status values used throughout the project:
**Planned → Implemented → Tested → Verified (independently reviewed) → Deployed.**

---

## CR-001 · Phase 0.5 · Safety net

| | |
|---|---|
| Date | 2026-11-25 |
| Branch | `claude/pesapilot-master-handover-0z1xae` (not merged to `main`) |
| Status | **Implemented + Tested.** Not independently verified. **Not deployed.** |
| User-visible change | None (proven, see evidence) |
| Data change | None to existing records. Migration now *keeps* data it previously deleted. |

### What changed

1. **Automated test suite** (new: `tests/`, `package.json`)
   - `npm test` runs 14 regression tests and 4 known-defect tests in real headless Chromium with a fixed clock (25 Nov 2026, 10:00 Nairobi).
   - `npm run test:ui-snapshot` compares the HTML of 8 screens × 2 data sets × 2 screen sizes + 11 forms (58 snapshots) against a baseline taken on the **unmodified** app.
2. **Non-destructive migration** (`index.html`, `migrate()`, fixes defect D1)
   - Fields the app does not recognise are now kept on transactions, goals, contributions, bills, payments, debts, repayments, budgets and the top level.
   - Transaction types other than income/expense are kept instead of being converted to `expense`. A missing type still means `expense`, and `"Income"`/`"EXPENSE"` are normalised (both verified against all 4 historical versions in git: only `income`/`expense` were ever written).
   - All existing repairs (negative amounts → 0, invalid bill frequency → monthly, legacy debt repayments rebuilt once) are unchanged and tested.
3. **Dead code removed** (`index.html`, fixes defect D7), −87 lines / −25 KB
   - Never called: `renderPlanLegacy`, `renderBillsLegacy`, `previousMonthLegacy`, `renderSettingsLegacy`, `bindActionsLegacy`.
   - Overridden by later copies (JavaScript uses the last definition): first copies of `renderGoals`, `renderDebts`, `renderReports`, `renderSettings`.
   - Kept, still in use: `changeLabel`, `payBillOriginal`, `renderBillsOriginal`, `billFormOriginal`.

### Files
- Modified: `index.html` (diff: `docs/evidence/phase-0.5-index.diff`)
- Added: `package.json`, `tests/harness.js`, `tests/fixtures.js`, `tests/run.js`, `tests/snapshot.js`, `tests/snapshots/ui-baseline.json`, `docs/*`
- Untouched as required: storage keys, `SCHEMA_VERSION` (9), backup format (v3), all screens/text, bill/budget/goal/debt logic.

### Evidence
| Check | Before | After |
|---|---|---|
| Regression tests | 11 pass, 2 fail (the D1 migration tests, as expected) | **14 pass, 0 fail** (1 test added) |
| Known defects D2, D3, D4, D6 | 4 reproduced | 4 still reproduced (intended; later phases) |
| UI snapshots | baseline saved | **58/58 identical** |
| Line endings | CRLF | CRLF |

Full output: `docs/evidence/phase-0.5-tests-before.txt`, `docs/evidence/phase-0.5-tests-after.txt`.

### Known limitations
- A transaction with an unknown type (only possible from imported data written by a future version) is listed with a "−" sign, and saving it from the edit form would turn it into income/expense. No current screen can create one. This is resolved in Phase 1 when real types exist.
- Tests cover the main flows, not every button. Coverage grows with each phase.

### Deployment
Not required on its own: there is no user-visible benefit yet. Recommended to ship together with Phase 1 after review.

### Rollback
`git revert` of the CR-001 commits. No stored data format changed, so rollback is safe at any time.

---

## CR-002 · Phase 1 · Financial model: accounts, transfers, goal allocations

| | |
|---|---|
| Date | 2026-11-25 |
| Branch | `claude/pesapilot-master-handover-0z1xae` (not merged to `main`) |
| Status | **Implemented + Tested.** Not independently verified. **Not deployed.** |
| Approved by owner | Yes: savings model option (c) "Both", goal separate from account, no double allocation |
| Data change | Schema 9 → 10, backup format 3 → 4. One-time, non-destructive, reversible (see FINANCIAL_RULES §7) |

### What changed (all in `index.html`)
- **Accounts:** balance, set aside and available shown per account on the Money screen. You can add and edit accounts, set opening balances and dates, hide accounts, and delete accounts that have no history.
- **Transfers** between accounts: these never count as income or spending, and can optionally be "for a goal".
- **Goals:** "Set aside" from any account, "Move money", and "Use / release" (with optional expense). Each goal shows its holdings per account and warns about shortfalls. Goal progress is calculated.
- **No double allocation:** you can never set aside more than an account's available amount.
- **Classification fixes:**
  - Savings are no longer counted as spending (fixes D2).
  - Debt repayments are no longer counted as spending.
  - Borrowed money can be recorded but is not income.
- **Linked consistency** (fixes D4):
  - Editing or deleting a repayment or bill payment updates the debt or bill.
  - Deleting a goal transfer reverses its allocations.
  - Linked references can no longer be overwritten from the edit form.
- Expenses, bill payments, debt repayments and transfers ask before using goal money or more than the recorded balance.
- Totals are added in whole cents.
- Safe-to-spend now starts from money not set aside for goals (interim; Phase 2 redesigns it).
- **Phone layout:** fixed sideways scrolling on Home, Plan and Reports, which already overflowed on 390 px phones before this change. Bills is fixed at 390 px but is still 3 px over on 360 px phones.

### Evidence
| Check | Result |
|---|---|
| Regression + Phase 1 tests | **33 passed, 0 failed** (17 new Phase 1 tests, incl. rollback into the real schema 9 app; D2 and D4 promoted to regression tests) |
| Known defects open | D3 (receivables: Phase 3), D6 (PIN: Phase 4) |
| UI snapshots | New baseline (70) saved after the intended changes; stable on re-run; no page errors |
| Horizontal overflow at 390 px | 0 on all 8 screens (was 27–62 px on 4 screens before) |

Full output: `docs/evidence/phase-1-tests.txt`.

### Known limitations
- Upgraded users' individual account balances are only as good as their old payment-method labels. All opening balances start at 0, so some accounts can show below zero until the user enters opening balances. A banner explains this. The **total** is correct.
- Goal and debt entries created by the app before accounts existed land in "Other / unassigned". The app always forced that label, so the real account is unknown.
- There is no "reconcile to my real balance" button yet (recommended for Phase 2).
- Receivables (money owed to me) are not built yet (Phase 3).
- Bills screen is 3 px wider than 360 px phones (calendar). It was 62 px over before this change.

### Rollback (proven by the test "rollback: …")
1. On each device that upgraded, open Settings → **Download pre-accounts copy**. This is the untouched schema 9 data, saved once at upgrade time.
2. Redeploy the previous version (revert the CR-002 commit).
3. In the previous version, Settings → **Import backup** → choose that file.

Entries made *after* upgrading would need re-entering, so a rollback should happen soon after deployment if it is ever needed.

---

## CR-003 · Phase 2 · Safe to spend for irregular income, reconcile, expected income

| | |
|---|---|
| Date | 2026-11-25 |
| Branch | `claude/pesapilot-master-handover-0z1xae` (PR #1 is a draft "[DO NOT MERGE]", used for preview only) |
| Status | **Implemented + Tested.** Not independently verified. **Not deployed.** |
| Approved by owner | DEC-015 (safe to spend) and DEC-016 (reconcile), with the owner's refinements |
| Data change | No schema bump; still schema 10, which has never been released. New optional fields: `profile.incomePattern`, `profile.planningDays`, `profile.minimumBuffer`, `account.spending`, `expectedIncome[]`, and the `adjustment` transaction kind with `reconciliation`, `reversedBy` and `reversesId`. Older data gets safe defaults. |

### What changed (all in `index.html`)
- **Safe to spend (DEC-015, FINANCIAL_RULES §6):**
  - fixed payday *or* irregular income with a 7, 14 or 30 day period;
  - only spending accounts count, and savings accounts are excluded unless marked;
  - goal money is deducted once;
  - bills due in the period plus the latest overdue one;
  - this month's unpaid debt instalment, only where a plan exists (the 5% guess is removed and unplanned debts are flagged);
  - this month's goal target minus what was already set aside;
  - planned spending and an optional minimum buffer.
- The Plan screen shows every line of the calculation and which accounts are counted.
- **Expected income:** add, edit, remove and "Received" (records the actual amount and date). It is never counted beforehand, and an "if it arrives" figure is shown separately. Deleting the resulting income entry puts it back on the expected list.
- **Reconcile (DEC-016, FINANCIAL_RULES §8):**
  - Records the recorded balance on the chosen date, the actual balance, the difference, the date and the reason.
  - The difference becomes a labelled adjustment (not income or spending), or "Unrecorded spending" if the user ticks the box.
  - Adjustments cannot be edited or deleted; **Reverse** adds a reversal entry, and both stay in history and cancel out.
  - Each account has a reconciliation history and shows when it was last reconciled. Net corrections and unrecorded spending totals are shown on the Money screen.
- The account form has "Count as spending money".
- Debt cards flag a missing repayment plan.
- Wording no longer assumes everyone has a payday.
- **Phone layout:** Bills no longer overflows on 320 and 360 px phones (D11), and expected-income rows wrap on phones.

### Evidence
| Check | Result |
|---|---|
| Tests | **44 passed, 0 failed.** 11 new: fixed and irregular safe to spend with hand-checked numbers, no double counting, expected income, savings-account toggle, 4 reconcile cases, reversal-only audit, upgraded-account fix, legacy entry reassignment, small-phone overflow at 320/360 px. Output: `docs/evidence/phase-2-tests.txt` |
| UI snapshots | New baseline of 76 after the intended changes; stable on re-run; no page errors |
| Known defects open | D3 (receivables), D6 (plain-text PIN), D9 (PWA), D10 (timezone) |

### Known limitations
- Debt instalments are reserved per calendar month. A planning period that crosses a month end reserves only the current month's instalment.
- The weekly guardrail still uses 7 × the daily amount, which is fine but simple.
- Balance adjustments are per account. There is no bulk "reconcile everything" step.

---

## CR-004 · Release 1 preparation · PIN protection, recovery strategy, release verification

| | |
|---|---|
| Date | 2026-11-25 |
| Status | **Implemented + Tested.** Not independently verified. **Not deployed:** waiting for the owner's preview review and approval (DEC-018) |
| Approved by owner | DEC-018 (release conditions), DEC-019 (PIN requirements), DEC-020 (recovery strategy) |
| Data change | `pin` → `pinHash` (PBKDF2-SHA-256, 150,000 iterations, 16-byte random salt, PIN length). Backups and downloadable copies no longer contain `pin`, `pinHash`, `deviceId` or `deviceFingerprint`. New `profile.lastBackupAt`. |

### What changed
- **PIN (DEC-019):**
  - Salted, hashed storage via Web Crypto.
  - Existing PINs are converted on load, and plain-text copies are scrubbed from the safety backup and snapshot keys.
  - Constant-time comparison.
  - Pause after every 5 wrong attempts (30 s, doubling, max 15 min).
  - Importing keeps the device's PIN.
  - The PIN form and Settings explain that this is PIN-storage protection, not encryption.
- **Recovery (DEC-020):**
  - Last backup date shown in Settings, with clearer backup guidance.
  - A Home reminder until a backup exists or when it is more than 30 days old.
  - Full strategy in `DATA_RECOVERY.md`.
- **Cross-tab protection:** if PesaPilot saves in another tab, this tab reloads instead of overwriting.
- **Release verification:**
  - `tests/migration.js` compares the original live app and the new version on 4 representative data sets, with an independent balance oracle, the rollback into the original app, and the emergency-rollback build.
  - `tests/legacy-fixtures.js` holds the representative data.
  - `docs/demo/pesapilot-demo-schema9.json` is made-up demo data for the owner's preview review.
- `RELEASE_1_CHECKLIST.md`: gate, preview guide, blocker assessment, deployment steps, verification and recovery.

### Findings during preparation
- **The original build destroys upgraded data** if it is ever redeployed (proven). The emergency rollback target is therefore `8370097`, which is proven safe.
- **A capitalised type ("Income")** would be read as an expense by the live app but as income by the new version. No release ever wrote such a value, and the live app rewrites types on save, so it is not realistic. Documented and not part of the representative data.

### Evidence
| Check | Result |
|---|---|
| Regression | **53 passed, 0 failed.** New: PIN conversion and scrubbing, salts, lockout, change PIN, import keeps the PIN, forgotten-PIN journey, backup reminder, two tabs, timezones. Output: `evidence/release-1-tests.txt` |
| Migration | **4 of 4** data sets upgraded correctly, rolled back identically, and safe under the emergency build (`evidence/release-1-migration.txt`) |
| UI snapshots | 76/76 stable |
| Known defects open | D3, D9 (not release-blocking: checklist §4) |

---

## CR-005 · Complete UI/UX redesign (presentation only)

| | |
|---|---|
| Date | 2026-11-25 |
| Status | **Implemented + Tested.** Not deployed: waiting for the owner's preview review |
| Requested by | Owner (UI/UX redesign brief) · DEC-021 |
| Engine / data change | **None.** `tests/engine-fingerprint.js`: 106/106 engine functions and constants byte-identical to before the redesign |

### What changed (index.html styles and templates; new `fonts/`)
- **New design system:** tokens for colour, type, spacing, radius and shadow; light and dark themes; Inter self-hosted.
- **Navigation:** icon tabs on desktop. On phones, a bottom bar with Home, Money, Plan, Savings and More; the More menu holds Bills, Debts, Reports and Settings.
- **Home:** money in spending accounts (set aside / free to use / total including savings), safe to spend today with its explanation, quick actions, this month (in/out and budget), coming up (bill status badges), savings progress, accounts, recent activity.
- **Money:**
  - Account cards clearly separate **Balance / Set aside / Available**, with type icons.
  - Transactions are a clean list. Search and filters are tucked away. The latest 30 show, with "Show more" for older ones.
- **Plan:** plain-language breakdown ("Money free to use", "Bills due", "Left to spend"). The weekly guardrail and next-move card moved here from Home. "How this works" is collapsible.
- **Savings** (was Goals): saved / target / still needed; holdings labelled "In M-Shwari" (moved to a savings account) vs "Set aside in M-Pesa" (reserved in place).
- **Debts:** "Money I owe" section; "Money others owe me" shown as coming later (D3 stays open, and its test now checks for a real way to record lending, not just the words).
- **Bills:** Overdue / Due today / In N days / Part paid / Upcoming badges.
- **Reports:** cleaner summary figures ("Spending").
- **Settings:** regrouped as Backups & recovery (3 simple steps, last backup, recovery copies), Security, Profile & preferences, Categories, App, Delete all data.
  - This **also fixes** an old patch that overwrote the honest PIN wording (DEC-019) right after the screen was drawn.
- **Phones:** bottom-sheet dialogs; compact figure rows; badges move under names on narrow screens; nothing clips at 320 px.

### Functionality
Nothing was removed. Every action, form and field is kept. Removed from Home but still available elsewhere: the weekly guardrail (now on Plan), the next-move card (Plan), the week's spending figure (Plan → Cash flow), and the separate bill-reminder card (merged into "Coming up"; the top reminder pill stays).

### Tests
- **Tests now read money figures through `data-figure` markers** instead of wording. Expected amounts are unchanged.
- New tools:
  - `tests/engine-fingerprint.js` proves the engine is untouched;
  - `tests/ui-audit.js` checks sideways scrolling, touch targets and WCAG AA contrast on 8 screens and 5 dialogs, at 320/360/390/1280 px, in light and dark mode.

| Check | Result |
|---|---|
| Regression | 53 passed, 0 failed |
| Migration (4 representative data sets, rollback) | 4/4 |
| Engine fingerprint | 106/106 unchanged |
| UI audit | **0 issues** (light and dark, 4 widths) |
| UI snapshots | New baseline after intended changes; stable |

### Found while redesigning (fixed separately as CR-006)
D12: the Reports month picker and trend chart skip the current month in Kenyan time. This exists in the live app today.
