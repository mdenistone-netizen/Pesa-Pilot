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
