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

_Last updated: 2026-11-25 · Phase 2 implemented and tested (CR-003). Production protection in force (DEC-017). Release decisions pending (§7)._

---

## 1. Snapshot

| | |
|---|---|
| Product | Kenyan personal finance app: accounts (M-Pesa, cash, bank, savings), budgets, goals, bills, debts |
| Live app | https://pesa-pilot.netlify.app/ · runs `main` @ `8e33d44` (schema 9) · **holds real users' financial data** |
| Work branch | `claude/pesapilot-master-handover-0z1xae` · schema 10 · **44/44 tests pass** · not deployed · preview: `deploy-preview-1--pesa-pilot.netlify.app` |
| Deployment plan | Ship Phases 0.5 + 1 + 2 together, once, after Phase 2 is verified, a deployment checklist is presented and the owner explicitly approves |
| Firebase / cloud | **Not implemented**, and deliberately postponed (DEC-005) |

## 2. Architecture (current)
- **Code:** one file, `index.html`: vanilla JavaScript in a single IIFE, no build step, no dependencies. Netlify serves it as a static site (DEC-002).
- **Storage:**
  - Browser `localStorage` key `pesapilot_v2`, holding one JSON document.
  - A safety backup under `pesapilot_safety_backup_v9`.
  - The pre-accounts snapshot under `pesapilot_pre_v10_snapshot`.
  - Data never leaves the device except through backups the user exports.
- **Data model (schema 10):** `accounts` (with a `spending` flag), `transactions` (kinds: income, expense, transfer, borrow, debt_repayment, adjustment; reversal links), `allocations` (goal money per account), `expectedIncome`, `goals`, `bills`, `debts`, `budgets`, `categories`, `profile` (income pattern, planning days, buffer), `pin`.
- **Upgrades:** `migrate()` runs on every load. It is non-destructive and idempotent (DEC-004, DEC-012).
- **Tests:** `npm test` runs headless-browser tests with a fixed clock. `npm run test:ui-snapshot` proves screens are unchanged during refactors (DEC-003).

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
| D6 | PIN stored and exported in plain text | Phase 4 (could move earlier) |
| D9 | No PWA manifest / service worker (install & offline don't work) | Phase 4 |
| D10 | Dates use the phone's clock and zone, not explicitly Nairobi | Low; review in Phase 4 |
| — | Fixed so far | D1, D2, D4, D5, D7, D8, D11 |

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

## 7. Decisions waiting for the owner

### Decision C: What goes into the first production release?
- **Why it matters:** this is the first release to real users, and their data upgrades on their own devices. Every extra item adds risk, but leaving out a known security weakness also has a cost.
- **Recommended:** ship **Phases 0.5–2 plus the PIN fix (Decision D)** as one release. Before that, the owner tries the preview on their phone.
- **Alternatives:**
  - (2) Ship 0.5–2 now and the PIN fix later. Faster, but backups keep exposing PINs and users go through two upgrades.
  - (3) Wait for Phase 3 (receivables). It delays fixes to wrong totals that users are seeing today.
- **Reversible?** Yes. Rollback is proven by test (CR-002).

### Decision D: How should the PIN be protected? (defect D6)
- **Why it matters:** today the PIN is stored as plain text and written into every exported backup file. Anyone who sees a backup sees the PIN.
- **Recommended:**
  - Store only a salted, slow hash of the PIN (PBKDF2 via the browser's built-in WebCrypto; no new dependency).
  - Remove the PIN from backups entirely; importing a backup keeps the PIN already on that device, as today.
  - Existing PINs are converted automatically on first load.
  - Forgotten-PIN recovery stays as it is (back up, then reset this device).
- **Honest limit:** a 4–8 digit PIN on a device can't resist a determined attacker who has the phone's storage. It protects against casual access and leaked backups. Real encryption of the data would be a bigger, separate decision.
- **Alternatives:**
  - (2) Only remove the PIN from backups: smaller, but the plain text stays on the device.
  - (3) Encrypt all data with the PIN: much stronger, but a forgotten PIN means data loss, and it adds complexity. Better later.
- **Reversible?** Partly. A hash can't be turned back into the PIN. Rolling back uses the pre-accounts snapshot, which keeps the old PIN.

## 8. Risks
- **Real users, data only on their devices:** a faulty release could damage data we can't see or restore centrally. Mitigations: on-device snapshot, proven rollback, deployment checklist, and owner approval (DEC-017).
- **`main` is unprotected on GitHub:** one accidental merge publishes. Mitigated by the draft "[DO NOT MERGE]" PR; the owner should enable branch protection.
- **Upgraded account balances need correcting:** they start at zero opening balance, so individual accounts can look wrong (below zero) until users reconcile. This is why Decision B is in Phase 2, before deployment.
- **Single-file growth:** `index.html` is about 175 KB. That is acceptable now; I will propose splitting it if changes start to become risky.

## 9. Next steps
1. **Owner:** open the preview on your phone and try it with made-up numbers. It is safe, because the preview is a separate address with its own empty storage.
2. **Owner:** answer Decisions C and D.
3. **Claude:** build D if approved. Then prepare the **deployment checklist** for explicit approval, including a test upgrade of a real-shaped backup and the rollback steps.
4. **Owner (recommended):** enable branch protection on `main` (§2a).

## 10. Working arrangement (DEC-014)
- **Claude:** architect and builder. Makes routine engineering decisions alone. Brings **decision briefs** for financial rules, data structures, architecture, security, user data, costs and major features. Keeps working on unblocked tasks. Gives evidence-based checkpoints. Keeps these documents current. Never deploys or destroys data without approval.
- **Owner:** vision, requirements, major decisions.
- **ChatGPT:** independent adviser, consulted at the owner's discretion, usually with §7 or a single decision brief pasted in. **Not an approval gate.**
