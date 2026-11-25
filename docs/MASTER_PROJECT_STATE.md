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

_Last updated: 2026-11-25 · after Phase 1 (CR-002) and agreement on the working arrangement (DEC-014)._

---

## 1. Snapshot

| | |
|---|---|
| Product | Kenyan personal finance app: accounts (M-Pesa, cash, bank, savings), budgets, goals, bills, debts |
| Live app | https://pesa-pilot.netlify.app/ · runs `main` @ `8e33d44` (schema 9) · **unchanged since July/Aug 2026** |
| Work branch | `claude/pesapilot-master-handover-0z1xae` · schema 10 · **33/33 tests pass** · not deployed |
| Deployment plan | Ship Phases 0.5 + 1 + 2 together, once, after Phase 2 is verified and the owner approves |
| Firebase / cloud | **Not implemented**, and deliberately postponed (DEC-005) |

## 2. Architecture (current)
- **Code:** one file, `index.html`: vanilla JavaScript in a single IIFE, no build step, no dependencies. Netlify serves it as a static site (DEC-002).
- **Storage:**
  - Browser `localStorage` key `pesapilot_v2`, holding one JSON document.
  - A safety backup under `pesapilot_safety_backup_v9`.
  - The pre-accounts snapshot under `pesapilot_pre_v10_snapshot`.
  - Data never leaves the device except through backups the user exports.
- **Data model (schema 10):** `accounts`, `transactions` (kinds: income, expense, transfer, borrow, debt_repayment), `allocations` (goal money per account), `goals`, `bills`, `debts`, `budgets`, `categories`, `profile`, `pin`.
- **Upgrades:** `migrate()` runs on every load. It is non-destructive and idempotent (DEC-004, DEC-012).
- **Tests:** `npm test` runs headless-browser tests with a fixed clock. `npm run test:ui-snapshot` proves screens are unchanged during refactors (DEC-003).

## 3. Phase status

| Phase | Scope | Status |
|---|---|---|
| 0 | Baseline inspection | Done |
| 0.5 | Test suite, non-destructive migration, dead code removed (CR-001) | Implemented + tested |
| 1 | Accounts, transfers, goal allocations, correct classification, reversible upgrade (CR-002) | Implemented + tested |
| **2** | **Safe-to-spend for irregular income, reconcile to real balance, commitment fixes** | **Next: needs decisions A and B below** |
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
| D5 | Safe-to-spend assumes one fixed payday; debt fallback guesses 5% of income | Partly fixed (excludes goal money). **Phase 2** |
| D6 | PIN stored and exported in plain text | Phase 4 (could move earlier) |
| D9 | No PWA manifest / service worker (install & offline don't work) | Phase 4 |
| D10 | Dates use the phone's clock and zone, not explicitly Nairobi | Low; review in Phase 4 |
| D11 | Bills screen 3 px wider than 360 px phones | Low; next UI pass |
| — | Fixed so far | D1, D2, D4, D7, D8 |

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

## 7. Decisions waiting for the owner

### Decision A: How should "safe to spend" work for people without a fixed payday?
- **Why it matters:** it is the number people act on daily. Today it divides money by days until a single fixed payday, which is wrong for freelancers, casual workers and business owners.
- **Recommended:** **"Plan until your next income".**
  1. Each user picks how they're paid: a fixed payday, *or* irregular income with a planning period (1 week, 2 weeks or 1 month).
  2. Safe to spend per day = (spendable money − commitments due within the period) ÷ days in the period.
  3. **Spendable money** = available money in M-Pesa, cash and bank. Savings accounts (M-Shwari, SACCO) are left out unless the user marks one as spending money.
  4. **Expected income is never counted** until it arrives. It is shown separately ("if the KSh 20,000 from the client arrives…").
  5. **Debt commitments** use the debt's repayment plan only. The invented "5% of income" fallback is removed; debts without a plan are flagged for the user instead.
- **Alternatives:**
  - (2) Average past income: simple, but dangerous for irregular earners, because it assumes money that may never come.
  - (3) Keep the fixed payday: fails the core requirement.
- **Trade-offs:** the recommended option is conservative, so the number may feel low after a slow week. That is intentional, because it errs towards never over-promising.
- **Reversible?** Yes. It changes the calculation only, not stored data. One new profile setting is added.

### Decision B: How should "my real balance is…" (reconcile) record the difference?
- **Why it matters:**
  - People forget small M-Pesa and cash transactions, so recorded balances drift from reality.
  - Upgraded users also need an easy way to correct the accounts that started at zero after the Phase 1 upgrade.
- **Recommended:** a labelled **balance adjustment** entry.
  - It changes the account balance and appears in history as "Adjustment".
  - It is **not** income or spending.
  - The app shows the total of unexplained differences, so the user can see how much went unrecorded.
  - When the user knows they spent the money, a tick-box records it as spending under "Unrecorded spending" instead.
- **Alternatives:**
  - (2) Silently change the opening balance: tidy, but it hides the history.
  - (3) Always record the difference as income or spending: it distorts reports when the gap is really an old recording error.
- **Reversible?** Yes: adjustments are ordinary entries that can be edited or deleted. It adds one new transaction kind (`adjustment`).

## 8. Risks
- **Unconfirmed deployment setup:** I still don't know how Netlify deploys (automatically from GitHub `main`, or by manual upload), or whether real user data exists on the live site. Until confirmed, `main` is treated as live and the upgrade is built as if real data exists.
- **Upgraded account balances need correcting:** they start at zero opening balance, so individual accounts can look wrong (below zero) until users reconcile. This is why Decision B is in Phase 2, before deployment.
- **Single-file growth:** `index.html` is about 175 KB. That is acceptable now; I will propose splitting it if changes start to become risky.

## 9. Next steps
1. Owner answers Decisions A and B. Short answers are fine, e.g. "A: recommended, B: recommended".
2. Meanwhile, Claude continues with work those decisions don't block:
   - commitment-calculation fixes;
   - the transaction list's account editing for "Other / unassigned" entries;
   - the 360 px Bills layout;
   - more tests.
3. Build Phase 2, then hold a checkpoint and a deployment decision brief.

## 10. Working arrangement (DEC-014)
- **Claude:** architect and builder. Makes routine engineering decisions alone. Brings **decision briefs** for financial rules, data structures, architecture, security, user data, costs and major features. Keeps working on unblocked tasks. Gives evidence-based checkpoints. Keeps these documents current. Never deploys or destroys data without approval.
- **Owner:** vision, requirements, major decisions.
- **ChatGPT:** independent adviser, consulted at the owner's discretion, usually with §7 or a single decision brief pasted in. **Not an approval gate.**
