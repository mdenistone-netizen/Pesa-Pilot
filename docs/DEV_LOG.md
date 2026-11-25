# Development Log

Short, dated entries so any new session (Claude, ChatGPT or a person) can continue the work.
**To resume:** read this file first, then `docs/ROADMAP.md`, then the latest entry in `docs/CHANGE_REGISTER.md`.

## How to run the checks
```
npm test                    # regression + known-defect tests
npm run test:ui-snapshot    # proves screens are unchanged vs baseline
```
These need Node and Playwright, which are pre-installed in Claude Code cloud sessions. Nothing needs to be installed on the phone.

---

### 2026-11-25 · Session 1
- Inspected the repo: one `index.html`, localStorage only, no Firebase, no PWA, no tests. The live site could not be reached from the cloud container. The Phase 0 report does not exist (confirmed by the owner).
- Wrote `docs/CURRENT_STATE_ASSESSMENT.md`, which lists defects D1–D10 with evidence.
- Phase 0.5 (CR-001): added the test suite, made `migrate()` non-destructive (D1) and removed dead code (D7). 14/14 tests pass and 58/58 UI snapshots are identical. Not deployed.
- Open questions for the owner: how Netlify deploys (from GitHub `main` or manual upload), whether real data exists in the live app, and the savings model (see ROADMAP Phase 1).
- **Next:** Phase 1 design approval, then build.

### 2026-11-25 · Session 1 (continued): Phase 1
- The owner approved savings model (c) "Both": goals are separate from accounts, money can be allocated within an account or moved by a transfer, and there is no double allocation.
- Built CR-002: accounts, transfers, set aside / move / release, borrowed money, correct classification, linked-entry consistency, cent-exact totals, and the schema 10 upgrade with a reversible snapshot.
- My own review caught and fixed a bill-status bug that could have un-marked legacy paid months, before it shipped.
- Fixed phone sideways scrolling, which predated this work on 4 screens.
- 33/33 tests pass, including an end-to-end rollback test. Not deployed. Rules documented in `FINANCIAL_RULES.md`.
- **Next:** owner review (ideally an independent ChatGPT review of `FINANCIAL_RULES.md` + `CHANGE_REGISTER.md` CR-002), then Phase 2 (safe-to-spend for irregular income + reconcile). Deployment decision after that.
