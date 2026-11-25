# Development Log

Short, dated entries so any new session (Claude, ChatGPT or a person) can continue the work.
**To resume:** read `docs/MASTER_PROJECT_STATE.md` first. This log is the detailed history.

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

### 2026-11-25 · Working arrangement
- The owner set the collaboration model (DEC-014).
- Added `docs/MASTER_PROJECT_STATE.md` as the single living record, and `CLAUDE.md` so future sessions load the rules automatically.
- Raised Phase 2 Decisions A (safe-to-spend model) and B (reconcile) for the owner.

### 2026-11-25 · Phase 2 + production facts
- Verified the deployment setup from GitHub: Netlify auto-deploys `main`, PRs get previews, and `main` is unprotected. PR #1 was open and mergeable, so it was made a draft "[DO NOT MERGE]". User data lives only on users' devices. Recorded in DEC-017, CLAUDE.md and MASTER §2a/§2b.
- Built CR-003 (DEC-015 safe to spend, DEC-016 reconcile with reversals, expected income) plus independent fixes (D11, legacy entry reassignment test).
- 44/44 tests pass.
- Raised Decisions C (release scope) and D (PIN protection).

### 2026-11-25 · Release 1 preparation
- The owner approved C (release scope, with conditions) and D (PIN, with requirements), and required a data-recovery strategy. Recorded as DEC-018, DEC-019 and DEC-020, and in CLAUDE.md.
- Built CR-004: PIN hashing and scrubbing, lockout, backups without PIN or device ids, backup reminder, cross-tab protection.
- Built the migration verification suite: original live app vs new version on 4 representative data sets, plus rollback.
- Found that the original build destroys upgraded data, so the emergency rollback target is now `8370097`. Recorded in RELEASE_1_CHECKLIST.
- 53/53 regression and 4/4 migration pass.
- Waiting for the owner's preview review and deploy approval.

### 2026-11-25 · UI/UX redesign
- The owner asked for a complete redesign (modern, calm, clean, welcoming; their palette; Inter; mobile first; presentation only).
- Before building: captured "before" screenshots and an engine fingerprint (106 functions and constants).
- Built CR-005:
  - design system and dark theme;
  - bottom bar with More;
  - new Home, Money, Plan, Savings, Debts, Bills, Reports and Settings layouts;
  - tests switched to `data-figure` markers;
  - a UI audit tool.
- Found and fixed (CR-006) a live-app bug: in Kenyan time, the month pickers and trend chart skipped the current month (D12).
- Evidence: 54/54 regression, 4/4 migration, engine unchanged, UI audit 0 issues.
- Waiting for the owner's preview review.

### 2026-11-25 · Savings behaviour (owner brief)
- Investigated "set aside doesn't reduce the subtotal". The engine was already correct (30,000 − 5,000 = 25,000 available everywhere, immediately). The cause was Home's headline showing the gross balance, plus a Money summary that mixed savings-account money into "Available".
- Built CR-007:
  - "Available to spend" as the Home headline;
  - a linked "Use money from savings goal";
  - release as un-reserve only;
  - correct and reverse for set-asides;
  - a full goal breakdown.
- 10 new tests cover all 15 of the owner's scenarios. 64/64 regression, 4/4 migration, UI audit 0 issues.

### 2026-11-25 · Product strategy review (research only)
- The owner asked for a Kenyan market-fit and differentiation review.
- Researched FinAccess 2024 (via secondary summaries; the primary PDFs were unreachable from this environment), the Kenya Financial Diaries, digital-credit research, and Kenyan competitors.
- Wrote `strategy/PRODUCT_STRATEGY_2026-11.md`: research, competitors, positioning, signature features, roadmap, pricing hypotheses, validation plan, and decision briefs DB-1 to DB-4.
- No code or rule changes. Master state §7 and §11 updated.

### 2026-11-25 · Product direction approved
- The owner approved the direction (DEC-023) with refinements:
  - progressive onboarding;
  - paste/share M-Pesa capture with full classification and duplicate detection;
  - "Will I make it to my next income?";
  - backup only after a separate assessment, local-first stays the default;
  - prices stay hypotheses;
  - no deployment without the preview review.
- Roadmap rewritten as staged work: planning P1–P6 (independent), then build stages A–F, one at a time, each with its own approval.
- Clarified that the owner's savings issue was corrected in CR-007 and awaits the owner's confirmation in the preview.

### 2026-11-25 · Planning P1–P6 completed (no code)
- **P4:** validation plan (quotas across income patterns, behaviour-over-opinion evidence, willingness-to-pay ladder).
- **P2:** M-Pesa capture spec (16 message types, own-account transfers, charges, Fuliza, reversals, 4-layer duplicate detection). Fuliza and reversal wording unverified.
- **P3:** DB-5 (expected income never counted; verdicts; Before You Spend).
- **P1:** onboarding (2 questions to value, then a checklist).
- **P5:** backup assessment (encrypted file + share sheet recommended).
- **P6:** DB-6 PWA (network-first updates, kill switch).
- Found **D13** while preparing P6 (an older app saving newer-schema data lowers the schema label). Tested; no effect on Release 1.

### 2026-11-25 · M-Pesa capture declined
- The owner declined M-Pesa message capture (DEC-024). DB-1 closed.
- `specs/MPESA_CAPTURE.md` marked as historical. Removed from the roadmap and from DB-6 (no share target). The validation plan's H4 is re-aimed at manual-entry tolerance.
- Priorities set: P4 pack → P1 mock → DB-5 → DB-4 / DB-6 briefs → D13 proposal.

### 2026-11-25 · P4 interview pack drafted (for owner review)
- 7 files: screener with quotas, consent (EN + draft SW), past-behaviour interview guide, timed preview test (5 manual-entry tasks incl. the withdrawal + charge classification test, balance and forgotten-transaction tasks, quick-entry ideas on paper only), 7-day recording trial with daily check-ins (data stays on participants' phones; fixed-version link), scoring sheet separating DID / SAYS / OBS, synthesis template.
- No payments, no M-Pesa messages, nothing collected until the owner approves.

### 2026-11-25 · D13 fix proposal (not implemented)
- `specs/D13_FIX_PROPOSAL.md`: read-only when stored data is newer, and never lower the schema label; reuses the existing read-only mechanism; tests listed.
- Release vehicle options A/B/C; standalone release B recommended.
