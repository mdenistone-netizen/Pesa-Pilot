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

_Last updated: 2026-11-25 · UI/UX redesign (CR-005) and D12 fix (CR-006) added to the Release 1 candidate. **Waiting for the owner's preview review and explicit deploy approval.**_

---

## 1. Snapshot

| | |
|---|---|
| Product | Kenyan personal finance app: accounts (M-Pesa, cash, bank, savings), budgets, goals, bills, debts |
| Live app | https://pesa-pilot.netlify.app/ · runs `main` @ `8e33d44` (schema 9) · **holds real users' financial data** |
| Work branch | `claude/pesapilot-master-handover-0z1xae` · schema 10 · **54/54 regression · 4/4 migration · engine unchanged · UI audit 0 issues** · not deployed · preview: `deploy-preview-1--pesa-pilot.netlify.app` |
| Deployment plan | **Release 1** = Phases 0.5–2 + PIN protection (DEC-018) + redesign (DEC-021) + D12 fix. Gate and steps: `RELEASE_1_CHECKLIST.md`. Emergency rollback target is `8370097`; **never redeploy `8e33d44`** |
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
- Goals are separate from accounts. Money is "set aside" inside an account (balance unchanged, available reduced) or moved by a transfer marked for the goal.
- An account's set-aside total can never exceed its available money, so no shilling counts for two goals.
- Goal progress and debt repaid are calculated from records.
- Totals are exact to the cent.

Full detail: `FINANCIAL_RULES.md`.

## 5. Outstanding defects

| ID | Defect | Status / plan |
|---|---|---|
| D3 | No "money owed to me" (receivables) | Phase 3 |
| D9 | No PWA manifest / service worker (install & offline don't work) | Phase 4 |
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
- DEC-021: UI/UX redesign: modern, calm, clean and welcoming; presentation only. **Owner-requested.**
- DEC-020: data protection & recovery strategy (`DATA_RECOVERY.md`), with an in-app backup reminder. **Owner-required.**

## 7. Decisions waiting for the owner
- **Redesign review.** Do the new look and the UX choices in DEC-021 work for you? The main choices: the bottom bar with a "More" menu, "Goals" renamed "Savings", and Home leading with spending-account money plus safe to spend.
- **Release 1 deployment** (now including the redesign). Needs (1) the owner's preview review (`RELEASE_1_CHECKLIST.md` §3) and (2) an explicit "deploy" instruction.

## 8. Risks
- **Real users, data only on their devices:** a faulty release could damage data we can't see or restore centrally. Mitigations: on-device snapshot, proven rollback, deployment checklist, and owner approval (DEC-017).
- **Redeploying the original build would damage upgraded data** (proven). Use the safe rollback build `8370097` (checklist §8).
- **Old tab open during deployment** could overwrite new data. The new version protects itself; residual risk is reduced by deploying at a quiet hour.
- **`main` is unprotected on GitHub:** one accidental merge publishes. Mitigated by the draft "[DO NOT MERGE]" PR; the owner should enable branch protection.
- **Upgraded account balances need correcting:** they start at zero opening balance, so individual accounts can look wrong (below zero) until users reconcile. This is why Decision B is in Phase 2, before deployment.
- **Single-file growth:** `index.html` is about 175 KB. That is acceptable now; I will propose splitting it if changes start to become risky.

## 9. Next steps
1. **Owner:** review the redesigned preview on your phone with the demo data. Report anything confusing, then approve or hold Release 1.
2. **Claude:** act on the feedback, re-run every check (regression, migration, engine fingerprint, UI audit), then follow checklist §5–§7 **only after** explicit approval.
3. **After Release 1:** Phase 3. Recommended order: receivables (D3; the redesign already has its place in Debts), the daily opening/closing view, flexible budgets. Then Phase 4 (PWA/offline D9).
4. **Owner (recommended):** enable branch protection on `main`.

## 10. Working arrangement (DEC-014)
- **Claude:** architect and builder. Makes routine engineering decisions alone. Brings **decision briefs** for financial rules, data structures, architecture, security, user data, costs and major features. Keeps working on unblocked tasks. Gives evidence-based checkpoints. Keeps these documents current. Never deploys or destroys data without approval.
- **Owner:** vision, requirements, major decisions.
- **ChatGPT:** independent adviser, consulted at the owner's discretion, usually with §7 or a single decision brief pasted in. **Not an approval gate.**
