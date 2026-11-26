# PesaPilot: Master Project State

**The single living record of where the project stands.** It is updated at the end of every phase and whenever a major decision is made.
Read this first. Other documents hold the detail:

| File | Contains |
|---|---|
| `FINANCIAL_RULES.md` | How money is counted |
| `DECISIONS.md` | Every decision (DEC-xxx) |
| `CHANGE_REGISTER.md` | Every change (CR-xxx) with evidence |
| `DEV_LOG.md` | Session-by-session history |
| `ROADMAP.md` | Phase plan |

_Last updated: 2026-11-25 · M-Pesa capture declined (DEC-024). Next deliverable: the P4 interview pack. Release 1 waiting for the owner's preview review._

---

## 1. Snapshot

| | |
|---|---|
| Product | Kenyan personal finance app: accounts (M-Pesa, cash, bank, savings), budgets, goals, bills, debts |
| Live app | https://pesa-pilot.netlify.app/ · runs `main` @ `8e33d44` (schema 9) · **holds real users' financial data** |
| Work branch | `claude/pesapilot-master-handover-0z1xae` · schema 10 · **64/64 regression · 4/4 migration · UI audit 0 issues** · not deployed · preview: `deploy-preview-1--pesa-pilot.netlify.app` |
| Deployment plan | **Release 1** = Phases 0.5–2 + PIN protection (DEC-018) + redesign (DEC-021) + D12 fix + savings behaviour (DEC-022). Gate and steps: `RELEASE_1_CHECKLIST.md`. Emergency rollback target is `8370097`; **never redeploy `8e33d44`** |
| Firebase / cloud | **Not implemented**, and deliberately postponed (DEC-005) |

## 2. Architecture (current)
- **Code:** `index.html` (vanilla JavaScript in a single IIFE, no build step, no dependencies) plus `fonts/` (self-hosted Inter, DEC-021). Netlify serves them as static files (DEC-002).
- **Design:** tokens and components are documented in `DESIGN_SYSTEM.md`. The phone bottom bar is Home, Money, Plan, Savings and More.
- **Storage:**
  - Browser `localStorage` key `pesapilot_v2`, holding one JSON document.
  - A safety backup under `pesapilot_safety_backup_v9`.
  - The pre-accounts snapshot under `pesapilot_pre_v10_snapshot`.
  - Data never leaves the device except through backups the user exports.
- **Data model (schema 10):** `accounts` (with a `spending` flag), `transactions` (kinds: income, expense, transfer, borrow, debt_repayment, adjustment; reversal links), `allocations` (goal money per account), `expectedIncome`, `goals`, `bills`, `debts`, `budgets`, `categories`, `profile` (income pattern, planning days, buffer), `pin`.
- **Upgrades:** `migrate()` runs on every load. It is non-destructive and idempotent (DEC-004, DEC-012).
- **Tests:** `npm test` runs the regression suite, the migration verification and the engine fingerprint. `npm run test:ui-audit` checks overflow, touch targets and contrast. `npm run test:ui-snapshot` proves screens are unchanged during refactors (DEC-003).

## 2a. Deployment & data facts (verified 2026-11-25 from GitHub)

| Question | Answer | Evidence |
|---|---|---|
| What triggers production deploys? | Changes to **`main`** (the repo's default branch). Netlify is connected to GitHub. | Netlify bot and status checks on the repo. The production-branch setting itself lives in Netlify and cannot be read from here: to confirm, check Netlify → Site configuration → Build & deploy → Branches. |
| Branch we develop on | `claude/pesapilot-master-handover-0z1xae` | — |
| Do PRs get previews? | **Yes.** PR #1 → `deploy-preview-1--pesa-pilot.netlify.app`, rebuilt on every push. | `netlify/pesa-pilot/deploy-preview` status on the branch commits |
| Does merging publish? | **Yes**, automatically, and `main` has **no branch protection**. | GitHub branch list (`protected: false`) |
| Is PR #1 safe? | It was open and "clean", so a single tap could have merged it. It is now a **draft titled "[DO NOT MERGE]"**. | — |
| Where is user data? | **Only in each user's own browser** (localStorage on their phone or computer). There is no backend or database, and neither we nor Netlify hold a copy. | Code inspection: no network calls or backend |
| Can a preview touch real data? | **No.** A preview has a different web address, and browsers keep each address's storage separate. Previews start empty. | Browser same-origin storage rule |
| Is the repo public? | Yes. Code and docs are public; no user data is in it. Never commit real backups. | — |

**What this means for releases**
- Because data lives on devices, a release *is* the migration: each user's data upgrades the first time they open the new version.
- We cannot roll back users' data centrally. The protection is therefore on the device:
  - an automatic untouched pre-upgrade snapshot;
  - a "Download pre-accounts copy" button;
  - an import path into the old version, proven by a test.
- **Owner action recommended:** turn on branch protection for `main` in GitHub (Settings → Branches → Add rule → require a pull request before merging). That makes an accidental push impossible.

## 2b. Production safeguards (DEC-017, required by owner)
1. All development and testing happen on separate branches. Nothing unverified or unfinished reaches `main`.
2. No migration runs against production data during development. Migrations are tested on copies of representative data.
3. Before any production release, backups and rollback are verified by tests.
4. Existing records and history are always preserved. Production data is never reset, overwritten or cleared.
5. Deploy previews are used for visual and functional testing. They are isolated from production storage.
6. Every production deployment needs a **deployment checklist** and the owner's **explicit approval**.

## 3. Phase status

| Phase | Scope | Status |
|---|---|---|
| 0 | Baseline inspection | Done |
| 0.5 | Test suite, non-destructive migration, dead code removed (CR-001) | Implemented + tested |
| 1 | Accounts, transfers, goal allocations, correct classification, reversible upgrade (CR-002) | Implemented + tested |
| 2 | Safe to spend for irregular income (DEC-015), reconcile with reversible adjustments (DEC-016), expected income (CR-003) | Implemented + tested |
| S | Savings: available to spend as the headline, use money from a goal (linked), release, correct/reverse, goal breakdown (DEC-022, CR-007) | Implemented + tested · awaiting owner preview review |
| UI | Complete UI/UX redesign (DEC-021, CR-005) + D12 fix (CR-006). Presentation only; engine proven unchanged | Implemented + tested · **awaiting owner preview review** |
| R1 | Release 1 preparation: PIN protection (DEC-019), recovery strategy (DEC-020), migration verification, checklist (CR-004) | Implemented + tested · **awaiting owner preview review + approval** |
| 3 | Money owed to me, savings/debt refinements, daily opening/closing view, flexible budgets | Planned |
| 4 | Security & reliability: hashed PIN, backup hardening, PWA/offline | Planned |
| 5 | Dashboard & insights on the corrected numbers | Planned |
| 6 | Release verification and deployment | Planned |

## 4. Financial rules in one paragraph
- Every shilling sits in an account.
- **Income** is the only earnings and **expense** is the only spending.
- Transfers, borrowing and debt repayments move money without counting as either.
- Goals are separate from accounts. Money is "set aside" inside an account (balance unchanged, **available = balance − set aside**) or moved by a transfer marked for the goal. Using goal money records one linked expense and reduces the goal by the same amount. Corrections add history entries and never create income or spending.
- An account's set-aside total can never exceed its available money, so no shilling counts for two goals.
- Goal progress and debt repaid are calculated from records.
- Totals are exact to the cent.

Full detail: `FINANCIAL_RULES.md`.

## 5. Outstanding defects

| ID | Defect | Status / plan |
|---|---|---|
| D3 | No "money owed to me" (receivables) | Phase 3 |
| D9 | No PWA manifest / service worker (install & offline don't work) | Phase 4 |
| D13 | Opening data saved by a *newer* version keeps it intact but re-labels it as schema 10 when saving, so a future version could re-run its upgrade. Found in P6. No effect on Release 1. | Fix before PWA/any later release (DB-6 §3.4) |
| D14 | **Planned spending can be deducted twice** (found 26 Nov). Planned spending is one amount the user maintains, and recording the actual expense doesn't reduce it. **Cautious direction** (Left to spend too low), but inaccurate. Present in the live app and Release 1. | Open, minor, **not blocking** Release 1. **Fix designed and approved** (DEC-027 5.11 + DEC-030: `plannedUsed`, rules T0–T6). Built with DB-5. Open sub-decision: `plannedLedger` (A) or residual risk (B). |
| D10 | Dates use the phone's clock and zone | Assessed: upgrade identical across timezones; not blocking (checklist §4) |
| — | Fixed so far | D1, D2, D4, D5, D6, D7, D8, D11, D12 |

## 6. Approved decisions (summary; detail in `DECISIONS.md`)
- DEC-002: single-file architecture kept.
- DEC-004: migrations never destroy data.
- DEC-005: no cloud yet.
- DEC-006: `main` treated as live.
- DEC-008: savings model "both": goals separate from accounts. **Owner-approved.**
- DEC-009: no double allocation; warn-then-shortfall.
- DEC-010: debt repayments are not spending, borrowing is not income.
- DEC-011: derived goal and debt totals.
- DEC-012: reversible upgrade.
- DEC-013: legacy app-created entries go to "Other / unassigned".
- DEC-014: working arrangement (below).
- DEC-015: safe to spend = plan until your next income. **Owner-approved** with refinements: deduct allocations, buffer, no double counting, expected income shown separately.
- DEC-016: reconcile = labelled adjustment with an audit trail. **Owner-approved** with refinements: reversal instead of deletion, optional "unrecorded spending".
- DEC-017: production protection (§2b).
- DEC-018: Release 1 scope and conditions. Preparing ≠ deploying. **Owner-approved.**
- DEC-019: PIN = PBKDF2 with a unique salt, never in backups; storage protection only, not encryption. **Owner-approved.**
- DEC-022: savings behaviour: available = balance − set aside; linked use-from-goal; corrections never create income or spending. **Owner-specified.**
- DEC-021: UI/UX redesign: modern, calm, clean and welcoming; presentation only. **Owner-requested.**
- DEC-020: data protection & recovery strategy (`DATA_RECOVERY.md`), with an in-app backup reminder. **Owner-required.**
- DEC-030: **D14:** `plannedUsed` approved as the preferred design (proposed 5th optional field, extending DB-5.12); rules T0–T6. Open: the 6th field `plannedLedger` vs accepting the residual risk. **Owner-approved** (design).
- DEC-029: **DB-6 installable/offline: design approved** with conditions (failed updates keep the working version; no loss of unsaved work; a reliable emergency switch; persistent-storage honesty; rollback floor). Extends DEC-017's release process from Stage C. Not implementation. **Owner-approved.**
- DEC-028: **DB-4 protected backups: design approved** with conditions (real-Android performance, recovery and share-sheet testing; crypto implementation review; password and code each restore independently; a monthly check that never forces or locks; repair needs confirmation and never touches records). Extends DEC-020. Not implementation. **Owner-approved.**
- DEC-027: **DB-5 rules and design approved** with conditions (payday note, unexplained shortfalls kept distinct, Fuliza disclosure, no planned/actual double counting, schema 11 only after D13 with full tests, 5.14 wording for testing). **Amends DEC-015** (missed payday; one-cycle late pay). Not implementation. **Owner-approved.**
- DEC-026: onboarding prototype B preferred for Stage A (subject to a real-user test; not implemented); first-run test design approved (running it isn't); **PIN stays required at first run**; the daily figure is a planning guide, not an allowance. **Owner-decided.**

## 7. Decisions waiting for the owner

**Needs owner approval**

| # | Decision | Status |
|---|---|---|
| 1 | **Release 1 deployment**, including confirming the corrected savings behaviour (CR-007) in the preview | Waiting for preview review |
| 2 | DEC-021/022 UX choices (bottom bar with More, "Savings" naming, available-to-spend headline) | Owner sees them in the preview |
| 3 | ~~**DB-5**~~ | **Decided: DEC-027** (rules + design approved with conditions). Implementation needs a separate go-ahead after Release 1 and D13. Previously: **Brief ready:** `specs/DB-5_DECISION_BRIEF.md`, 14 choices (refined 25 Nov: two labelled timing scenarios; precise Short vs Already short). **Not approved**; owner will review §8 together with DB-4 and DB-6 |
| 4 | ~~DB-1 M-Pesa capture~~ | **Closed: declined by owner (DEC-024)** |
| 5 | ~~**DB-6**~~ | **Decided: DEC-029** (design approved with conditions; not implementation). Previously: **Brief ready:** `specs/DB-6_DECISION_BRIEF.md`, 9 choices. **Not approved** |
| 6 | **DB-3** Fuliza, chama and family-support rules | Brief exists (strategy §8) |
| 7 | ~~**DB-4**~~ | **Decided: DEC-028** (design approved with conditions; not implementation). Previously: **Brief ready:** `specs/DB-4_DECISION_BRIEF.md`, 10 choices. **Not approved** |
| 8 | **DB-2** Paid tier and measurement | Waits for customer evidence (P4) |
| 9 | ~~Onboarding design (P1)~~ | **Decided (DEC-026):** B preferred subject to a real-user test; PIN required. Stage A build needs its own approval |
| 10 | **D13 schema guard**: scope and Option B approved in principle (DEC-025). **Implementation needs a separate go-ahead** after Release 1 | Open defect |
| 11 | **P4 interview pack** approval (and interviewer, thank-you amount, Kiswahili review) | Ready for review |

**Owner review position (25 Nov, round 1). Feedback, not approval:**
- **DB-5:** supports the verdicts, expected-income treatment, irregular horizon, savings protections, Before You Spend, and Short vs Already short.
  - DB-5.5 needed clarification (done: brief §5.4).
  - DB-5.6 provisional, with the cushion as a warning only (confirmed: §5.5).
  - DB-5.7/5.8 supported, subject to D13 and schema 11 safeguards.
  - DB-5.12 not before D13 is released (safeguards: §7).
- **DB-4:** supports encrypted backups, with cloud out of scope.
  - DB-4.3/4.5 wait for the key architecture (done: §3a).
  - Stronger password example (done).
  - Forgot-PIN process kept, with an unmistakable plain-copy warning (done: §5a).
- **DB-6:** supports the PWA after Release 1 and D13.
  - The storage statement is corrected (§2a).
  - Update safeguards specified (§3a).
  - Real Android testing is required.
- **No schema change, code, merge or deployment is authorised.** Release 1, D13, DB-4, DB-5 and DB-6 stay separate.

**Round 3 (26 Nov), the owner's 3 final clarifications, done. Still not approval:**
- **DB-4:** the non-extractable key design is withdrawn (a worker could *use* it to decrypt). Revision 2 keeps only a public key + locks on the phone; the phone can't open backups (tested).
- **DB-5.5:** recorded-day definition, confidence levels, reconcile spreading, and Count it / Undo for one-offs (4th optional field).
- **Schema 11:** end-to-end test passes with the real Release 1 build. Release 1 *displays* a cancelled payment while it runs, but never counts it.

**Systematic review complete (26 Nov).**

| Item | Decision | Status | Next |
|---|---|---|---|
| **DB-5** Will I make it? + Before You Spend | DEC-027 (14 choices, with conditions); amends DEC-015 | **Design approved; not implemented** | Implementation go-ahead after Release 1 and D13 |
| **D14** planned-spending restoration | DEC-030 (`plannedUsed` preferred; proposed 5th field of DB-5.12) | **Design approved; not implemented.** Open: the 6th field `plannedLedger` (A) vs residual risk (B) | Owner: choose A or B |
| **DB-4** protected backups | DEC-028 (11 choices, with conditions); extends DEC-020 | **Design approved; not implemented** | Implementation authorisation after Release 1 and D13 |
| **DB-6** installable / offline | DEC-029 (9 choices, with conditions); extends DEC-017 | **Design approved; not implemented** | Implementation authorisation after Release 1 and D13 |
| **Release 1** | DEC-018 | Implemented and verified on the branch; **not approved for deployment** | Owner's preview review + explicit deploy approval |
| **D13** schema guard | DEC-025 (in principle) | Open defect; not implemented | Go-ahead to implement after Release 1 |

**Round 4 (26 Nov), the owner's final clarifications, done. Still not approval:**
- **DB-4 full lifecycle** model-checked (L1–L6, D-a to D-e). Two flaws found and fixed: repair re-locks with the current password; one damaged lock no longer breaks a file.
  - Generated 5-word password recommended. A user-made phrase is not proof of strength.
  - New DB-4.11: integrity, verification and repair.
- **DB-5.5:** only shortfalls raise the estimate. Unexplained shortfalls are counted but shown separately with [Explain it]. Tests R1–R5 cover income, transfers, reversals and unexplained withdrawals.
- **Schema 11:** retest on the actual DB-5 code is a release requirement. The Release 1 display issue is recorded as **R4** (RELEASE_1_CHECKLIST).
- **Review order agreed:** DB-5, then DB-4, then DB-6.

**Owner review pending (round 2):** clarifications ready. All 33 choices are in one place: `specs/DECISION_PACK_DB5_DB4_DB6.md`. Each choice gives the decision, recommendation, alternatives, the effect on an ordinary user, risks, and whether it changes an existing rule. Release 1, D13, DB-4, DB-5 and DB-6 are **separate approval matters**. Nothing in them is approved or implemented. Other waiting items: Release 1 preview review, P4 pack approval, D13 implementation go-ahead after Release 1.

## 8. Risks
- **Real users, data only on their devices:** a faulty release could damage data we can't see or restore centrally. Mitigations: on-device snapshot, proven rollback, deployment checklist, and owner approval (DEC-017).
- **Redeploying the original build would damage upgraded data** (proven). Use the safe rollback build `8370097` (checklist §8).
- **Old tab open during deployment** could overwrite new data. The new version protects itself; residual risk is reduced by deploying at a quiet hour.
- **`main` is unprotected on GitHub:** one accidental merge publishes. Mitigated by the draft "[DO NOT MERGE]" PR; the owner should enable branch protection.
- **Upgraded account balances need correcting:** they start at zero opening balance, so individual accounts can look wrong (below zero) until users reconcile. This is why Decision B is in Phase 2, before deployment.
- **R4 (release risk register):** Release 1 would *display* a schema-11-cancelled expected payment as expected (never counted in available money). Mitigated at schema 11, which requires the cancellation test to be re-run on the real DB-5 code.
- **Single-file growth:** `index.html` is about 175 KB. That is acceptable now; I will propose splitting it if changes start to become risky.

## 9. Next steps
1. **Owner:** review the preview, including the savings behaviour, then approve or hold Release 1.
2. **Claude:** planning work P1–P6 (`ROADMAP.md`), one document at a time. No feature code until Release 1 is decided and the stage's decision is approved.
3. **After Release 1 is live and stable:** build stages A → F **one at a time**, each with its own change record, full test evidence, preview and approval.
4. **Owner (recommended):** enable branch protection on `main`.

## 10. Working arrangement (DEC-014)
- **Claude:** architect and builder. Makes routine engineering decisions alone. Brings **decision briefs** for financial rules, data structures, architecture, security, user data, costs and major features. Keeps working on unblocked tasks. Gives evidence-based checkpoints. Keeps these documents current. Never deploys or destroys data without approval.
- **Owner:** vision, requirements, major decisions.
- **ChatGPT:** independent adviser, consulted at the owner's discretion, usually with §7 or a single decision brief pasted in. **Not an approval gate.**

## 11. Product strategy (November 2026 review)
Full report: `strategy/PRODUCT_STRATEGY_2026-11.md` (with the owner's refinements in §11). **Direction approved (DEC-023). Features not yet approved or built.**

- **Evidence:** only 18.3% of Kenyan adults are financially healthy (FinAccess 2024). Casual labour is the most common livelihood (26.5%). Income is volatile (Financial Diaries). Fuliza use is about 18.4%, at roughly Sh2.7 bn a day in 2024. Savings sit in banks, M-Pesa, chamas (19.7%) and secret places (16.2%).
- **Competition:** M-Pesa capture, fee/Fuliza totals and savings goals are **not** unique (M-PESA My Spend, PesaSense, Shmoney, PesaTrail, Wavvy, Chumz and others). No Kenyan app was found that combines forward-looking "truly free" money, irregular-income planning, set-aside-in-place savings, strict money correctness and local-only privacy.
- **Owned problem:** "I don't know how much of my money is actually free, so I run out before the next money comes."
- **Positioning:** *PesaPilot tells you how much you can safely spend today, after rent, loans, chama and savings are covered, even when your income isn't the same every month. Your money stays on your phone.*
- **Signature (approved direction):** true available balance + irregular-income plan + bills and commitments + savings allocation, experienced through **Before You Spend** and **"Will I make it to my next income?"** (actual money, commitments and expected income kept separate, assumptions explained). The weekly check-in is the retention habit. Kenyan specifics (chama, Fuliza, family support) are essential localisation.
- **Biggest weakness:** manual entry. Message capture was **declined** (DEC-024), so quick manual entry and balance check-ins are the mitigation (§13).
- **Initial target [assumption]:** urban 22–35, Android, M-Pesa-first, salary plus side income or irregular income, regular commitments, occasional Fuliza.
- **Commercial (hypotheses, not validated):** core stays free. "Plus" at KSh 99–199/month, or a ~KSh 1,500 lifetime unlock. Validate with 20 interviews, a 30–50 user beta and real M-Pesa till pre-orders.
- **Roadmap:** Release 1 scope frozen. Then planning P1–P6, then build stages A–F one at a time (see `ROADMAP.md`).
  - **Avoid for now:** bank integrations, selling investments or loans, credit scoring, an AI adviser, default cloud accounts, bookkeeping, crypto.

## 12. Planning deliverables (P1–P6, approved as research and design only)
None of these approves implementation, rule changes, infrastructure, merging or deployment.

| # | Deliverable | Status | Key decisions it raises |
|---|---|---|---|
| P4 | `strategy/VALIDATION_PLAN.md`: 24 interviews with quotas (casual, freelance, small business, salaried, young families; overlaps for family support, borrowers, chama/SACCO, ≥12 non-trackers); behaviour-over-opinion evidence log; willingness-to-pay ladder; pre-registered success criteria | **Done** | Owner: whether to run refundable till pre-orders (§6.4); who interviews |
| P2 | **⛔ Declined by owner (DEC-024)**; kept as history only. `specs/MPESA_CAPTURE.md`: message catalogue (16 types), classification rules (own-account transfers, withdraw/deposit as M-Pesa⇄Cash, charges as linked "M-Pesa charges" expenses, Fuliza as borrowing + fees), reversals, 4-layer duplicate detection (code, batch, probable manual duplicate, balance hint), verification plan | Declined | None. DB-1 closed. No samples collected. |
| P3 | `specs/DB-5_WILL_I_MAKE_IT.md`: three separate inputs (actual free money, commitments, expected income) + a labelled usual-spending estimate; expected income **never** counted (only an "if it arrives" line); verdicts On track / Tight / Short / Already short; day-by-day low point; Before You Spend preview that never blocks or records by itself; worked examples; assumptions and limits | **Done** | DB-5: approve the rule and 5 choices (irregular horizon, spending estimate, tight cushion, actions, 2 optional fields) |
| P1 | `specs/ONBOARDING.md`: 3 short steps (welcome, "what do you have now" as opening balances, "when does your next money come") → an immediate answer ("KSh X free, about KSh Y a day"), then an optional Home checklist (bills, loans, savings, buffer, income sources, backup); existing users never forced; existing features only | **Done** | Owner: PIN mandatory vs "Set PIN / Later" (security policy); default period for irregular income; go-ahead for a preview-only mock before Stage A |
| P5 | `specs/BACKUP_ASSESSMENT.md`: threats; 4 options compared on privacy, security, user control, cost, data-protection exposure and failure modes. Recommended next: **encrypted backup file + phone share sheet** (zero infrastructure, KSh 0, user keeps control); user-owned Drive automation only later with evidence; no PesaPilot cloud | **Done** | DB-4: approve Option 1 as a future stage; recovery approach (recovery code + optional unencrypted export); defer Options 2 and 3 |
| P6 | `specs/DB-6_PWA_ASSESSMENT.md`: manifest + service worker that caches app files only (never data); network-first updates, versioned caches, reload prompt, kill switch; privacy, security, user control, update reliability, cost (KSh 0) assessed | **Done** | DB-6: approve a full PWA for Stage C; fix **D13** (schema guard) first; no share target (DEC-024) |

## 13. Work status and next deliverables (after DEC-024)
Status words: **Proposed → Designed → Approved → Implemented → Verified → Deployed.**

| Item | Status | Next step |
|---|---|---|
| Release 1 (incl. CR-007 savings fix) | Implemented + verified on the branch; **not approved for deployment** | Owner's preview review |
| M-Pesa capture (DB-1) | **Declined** (DEC-024) | None |
| P4 interview pack | **Designed and refined (10 files incl. a research data notice, budget and first-run onboarding test), waiting for owner approval.** No recruiting, pilot or data collection until approved. | Owner: approve the pack, the data notice and the budget; Kiswahili parity check |
| P1 onboarding | **Two prototypes ready for review, neither part of the app** (memory only, verified): A `prototypes/onboarding/` (original design) and **B `prototypes/onboarding-simple/`** (one total; next money incl. "not sure"; urgent payments before the answer; Home next steps; EN + draft Kiswahili). Compared in `specs/ONBOARDING_COMPARISON.md`: B needs 5 taps vs 9 and 100 words vs 174, uses no finance jargon, and its first answer already protects urgent payments. **Recommended: B, subject to a real first-run test** (`interview-pack/09_FIRST_RUN_TEST.md`, pending pack approval). No financial rules changed. | Owner tries both on Android; approves the first-run test; decides the PIN policy; chooses A or B for Stage A |
| P3 / DB-5 Will I make it? + Before You Spend | **Approved (rules + design): DEC-027, 26 Nov**, with conditions. Brief: `specs/DB-5_DECISION_BRIEF.md`; evidence: `prototypes/will-i-make-it/model.js`, `prototypes/schema11/`. **Not implemented.** | Separate implementation go-ahead after Release 1 and D13 are completed and verified (Stage B). Before release: the schema 11 cancellation test re-run on the real code. |
| P5 / DB-4 encrypted user-controlled backup | **Design approved: DEC-028, 26 Nov**, with conditions. Brief: `specs/DB-4_DECISION_BRIEF.md` (design B; §3c clarifications); evidence: `prototypes/protected-backup/`. **Not implemented.** | Separate authorisation after Release 1 and D13. Release requirements: real-Android performance and restoration tests, share-sheet device tests, crypto implementation review. |
| P6 / DB-6 installable and offline | **Design approved: DEC-029, 26 Nov**, with conditions. Brief: `specs/DB-6_DECISION_BRIEF.md`; safeguards in RELEASE_1_CHECKLIST §9. **Not implemented.** | Separate authorisation after Release 1 and D13 (Stage C after C0). Real-Android tests required. |
| D13 schema guard | **Open defect.** Fix scope + Option B **approved in principle (DEC-025)**; not implemented. `specs/D13_FIX_PROPOSAL.md`. Scope: read-only if data is newer, never lower the label; about 10–15 lines; no rule changes | Go-ahead to implement as a small release right after Release 1 |

**Adviser note: the main risk after declining capture.**
- Manual entry fatigue is the most common reason people abandon money apps [assumption, consistent with competitor positioning].
- **Privacy-preserving mitigations to explore,** as designs only, each needing approval before building:
  1. **Quick entry:** repeat last, favourites (e.g. "Matatu 100"), amount presets, a one-screen keypad, a home-screen shortcut once installable (DB-6).
  2. **Balance check-ins:** "What's your M-Pesa balance now?" in 10 seconds. The difference becomes a labelled, reversible unrecorded-spending adjustment, using the existing reconcile rules (DEC-016), so the totals stay right even when people don't record every small expense.
  3. **Recurring entries** for salary, rent and chama, proposed on their due date for one-tap confirmation.
- **The P4 interviews will test** how much manual recording people will actually do.

