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

### 2026-11-25 · P4 pack refined (owner's 7 points) + DEC-025
- Added `00_RESEARCH_DATA_NOTICE.md` (on-phone financial records vs research information collected by the team; who can access it; storage; a deletion schedule; withdrawal) and `08_BUDGET_FOR_REVIEW.md` (equal compensation; amounts not final).
- Consent rewritten as 9 matching English/Kiswahili points, plus 7 trial points.
- No screenshots of anything; the trial is voluntary with no penalty; the 14-day check is a short-term observation only.
- A4 split into A4a (transfer M-Pesa→Cash) and A4b (KSh 29 charge as an expense), with a result check.
- Recorded DEC-025: D13 scope + Option B approved in principle; still open, not implemented.

### 2026-11-25 · P1 onboarding prototype (separate from the app)
- `docs/prototypes/onboarding/index.html`: welcome → PIN (variant switch: required / optional, marked as an owner decision) → "what do you have now" → "when does your next money come" → the first answer with a timer → a Home checklist (bills, loans, savings set-aside, buffer, income sources, backup), updating live.
- Tested at 360/390 px: no overflow, no errors, nothing stored (localStorage 0), maths checked.
- Found and fixed a stuck-button bug in the prototype (payday input).
- Corrected weekday labels in the DB-5 and onboarding docs (25 Nov 2026 is a Wednesday).
- Added a release-checklist item about keeping `docs/` off the live site.

### 2026-11-25 · P1 simpler onboarding (prototype B) + comparison
- The owner asked for a substantially simpler first run in everyday Kenyan language.
- Built `docs/prototypes/onboarding-simple/index.html` (stand-alone, memory only):
  - one total;
  - next money: a date / every day / not sure;
  - urgent payments as chips, skippable;
  - an immediate "about KSh Y a day until <date>" with a plain sum;
  - Home next steps;
  - EN + draft Kiswahili, and a PIN required/optional switch.
- Measured against A on the same scenario: 5 vs 9 taps, 100 vs 174 words, no jargon, reading ease 85 vs 77. Same final figure (1,333/day), but B's first answer already includes the rent.
- Walkthrough fixes in B: past dates and today refused; a payment chip with no amount is refused instead of counting as 0.
- Wrote `specs/ONBOARDING_COMPARISON.md` (metrics, accuracy mapping to existing rules, walkthrough, recommendation) and `interview-pack/09_FIRST_RUN_TEST.md` (unassisted, counterbalanced A vs B, pre-registered criteria). Waiting for owner approval; no real-user test done yet.
- No app code or financial rules changed.

### 2026-11-25 · DEC-026 + DB-5 decision brief
- The owner decided (DEC-026):
  - B is the preferred onboarding direction, subject to real-user testing; A kept for comparison; neither implemented;
  - the first-run test design is approved (running it isn't);
  - the PIN stays required at first run;
  - the daily figure is a planning guide, not an allowance.
- Prototypes:
  - removed the PIN-optional switch and the owner-decision banner from both;
  - B's answer now reads "To make your money last until …, plan on about KSh Y a day", with "a planning guide, not a fixed daily allowance";
  - B's Home leads with the amount left until the next money.
- Re-measured, fixing the script's text split: words before the answer 100 vs 152; words on the answer screen 53 vs 92. A's 9 taps include 4 PIN digits.
- `09_FIRST_RUN_TEST.md`: understanding checks U1–U5 (money now, must-pay, what remains, the daily figure as a guide, expected income not counted), red flags and pre-registered criteria.
- Wrote `specs/DB-5_DECISION_BRIEF.md` (12 choices) and `prototypes/will-i-make-it/model.js`, a reference model that computes and asserts every example.
- The model exposed and corrected:
  - an unsafe irregular horizon (ending at an expected payment assumes it arrives);
  - a meaningless lowest-point view (with no income counted, money only falls), replaced by runway and first payment at risk;
  - cushion double-counting of the buffer;
  - a second daily figure (now one: DEC-015 safe to spend per day).
- No app code or financial rules changed.

### 2026-11-25 · DB-5 refined; DB-4 and DB-6 decision briefs (planning only)
- The owner accepted DEC-026 as recorded. DB-5 is not approved; they asked for:
  - a clear split between the no-income and if-it-arrives timing scenarios;
  - a precise Short vs Already short.
- **DB-5:**
  - the model now runs a 30-day "if no money comes in" scenario, which includes payments after an expected payday, plus one "if it arrives" scenario per payment. Same-day payments are taken before income.
  - **New example 6 (Njeri):** school fees due after an expected payment fail only if it doesn't come.
  - **New property:** expected income never changes the no-income warning.
  - Already short = "the bills alone don't fit"; Short = "bills plus everyday spending don't fit".
  - 14 choices.
- **DB-4** (`specs/DB-4_DECISION_BRIEF.md`):
  - protected backups with a password + recovery code; share sheet; plain backups kept;
  - what-if-lost table; restore steps.
  - **Tested:** both live 8e33d44 and the Release 1 branch refuse an encrypted-style file with a clear message and no storage change. AES-GCM detects tampering. PBKDF2 at 600k rounds takes 77 ms in cloud Chromium (estimated 1–2 s on a low-end phone).
- **DB-6** (`specs/DB-6_DECISION_BRIEF.md`):
  - network first with a 3 s limit; per-version caches; reload banner; self-removing kill switch.
  - **Tested** with a throw-away service-worker proof in the scratchpad: offline open, update, offline-after-update, kill switch, data identical throughout.
  - The proof caught a stale-copy bug (offline served the old version after an update); the fix is in the design and the test list.
- No app code, financial rules or infrastructure changed. Nothing merged or deployed.

### 2026-11-25 · Decision pack for owner review
- Wrote `specs/DECISION_PACK_DB5_DB4_DB6.md`: all 33 choices (DB-5 ×14, DB-4 ×10, DB-6 ×9). Each has the exact decision, recommendation, alternatives, ordinary-user effect, risks, and whether it changes an existing rule.
- Found and corrected 2 issues in DB-5 while mapping it against existing rules:
  1. **Choices 7 and 8 extend DEC-015's planning period.** "Waiting for your pay" and "my pay is late" change which dates Left to spend covers. The brief had wrongly said DEC-015 was unchanged.
  2. **The "cancelled" expected-income status needs schema 11.** Release 1's loader (`index.html:853`) rewrites unknown statuses to "expected", so the D13 guard must apply. This makes it a small production migration.
- DB-4: proposed keeping the backup key under its own storage key (never exported, no schema change).
- Nothing approved or implemented.

### 2026-11-25 · Decision pack round 2 (owner feedback; no approval)
- **DB-5.5:** exact estimate rules (calendar-day divisor, empty days = 0, coverage check → ask and use the higher figure, one-offs listed). `estimateUsualDaily` added to the model with examples D1–D6.
  - **Correction:** reconcile gaps are now included, spread over time; excluding them made the estimate too low for people who forget to record.
- **DB-5.6:** added a model property: the default cushion never changes Left to spend or the daily guide.
- **Schema 11, tested on a copy of Release 1:** opening changes nothing; saving relabels to 10 and rewrites "cancelled" to "expected", but keeps extra fields. Design: 4 layers (D13 first; schema 11 + backup version; `cancelledAt` as the source of truth; rollback floor).
- **DB-4:** key architecture (DK, P-key, R-key, on-device secret) with `prototypes/protected-backup/model.js`; all 7 owner questions are model-checked.
  - Chromium: a non-extractable key in IndexedDB survives a reload and can't be exported.
  - **Change:** a password change needs the old password or the code.
  - New password example; "NOT protected" Forgot-PIN copy wording.
- **DB-6:** corrected the storage claim. Tested: inside a worker, localStorage is undefined, while IndexedDB and caches are available.
  - Records are only in localStorage (checked).
  - Safeguards specified; clean repeated proof runs: a failed install keeps the old version; a good update clears old caches.
- No app code, schema or production change.

### 2026-11-26 · Decision pack round 3 (owner's final clarifications; no approval)
- **DB-4:** browser test showed a service worker can retrieve a non-extractable CryptoKey from IndexedDB and use it to decrypt; only export is blocked. The round-2 design is withdrawn.
  - **Revision 2:** the phone stores only an ECDH P-256 public key + password/code locks of the private key. Each backup gets a fresh one-time key (ECDH → HKDF → AES-GCM).
  - Model: Q1–Q7 + "the phone alone cannot open any backup" pass. Browser: the worker can retrieve the public key and make backups, but can't open them.
  - Evidence: `prototypes/protected-backup/model.js`, `browser-key-access/`.
- **DB-5.5 revision 2:** recorded day = ≥1 expense above zero, not reversed, by entry date. Confidence levels: checked / records-only / incomplete (no figure shown) / ask. Reconcile gaps spread per account stretch; negative differences never lower the estimate; one-offs with Count it / Undo. 16 model cases (D1–D11).
- **Schema 11 end-to-end** (`prototypes/schema11/e2e-release1.js`, real Release 1 + reference model): PASS.
  - **New finding:** Release 1 displays a cancelled payment as expected while running (Plan list, Home "if it arrives"); it is never counted.
  - Backup-version scope documented.
- No app code, schema or production change.

### 2026-11-26 · Decision pack round 4 (owner's final clarifications; no approval)
- **DB-4 lifecycle** in `prototypes/protected-backup/model.js`:
  - L1–L6: setup self-verifies; one-tap backups take no secret; password change; recovery-code-only replacement phone; 6 backups × 4 secrets; the phone can't open its own backups.
  - D-a to D-e: integrity check refuses backups when items are damaged or missing; repair from any earlier file; one damaged lock still leaves the other; a deliberate swap is detected at the next password check.
  - **Fixed 2 flaws** found by these tests: repair now re-locks with the current password; the locks are excluded from the content's shared authentication (each lock is self-authenticated, and swapped locks are still refused).
- **DB-4 password:** generated 5 words from a 2,048-word list (≈ 2⁵⁵); guess-time estimates documented; a user-made phrase is allowed only if rated as strong. Added choice DB-4.11 (34 choices total).
- **DB-5.5 revision 3:** difference = actual − recorded; only shortfalls count; unexplained shortfalls are counted but reported separately, with the figure without them; possible-transfer pairs flagged; explanations go through the DEC-016 tick or reversal. Tests R1–R5.
- **Schema 11:** retest on the actual DB-5 code required before release (DB-5 brief §7, ROADMAP Stage B). Added **R4** to the RELEASE_1_CHECKLIST risk register and to MASTER §8.
- No app code, schema or production change.
