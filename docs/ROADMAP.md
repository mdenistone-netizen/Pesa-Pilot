# PesaPilot Roadmap (staged)

- **The problem we own (DEC-023):** *"I don't know how much of my money is actually free, so I run out before the next money comes."*
- **Priority order (owner's):** financial accuracy → data integrity → security → usability → reliability → intelligence → growth.
- **Working rule:** **one feature stage at a time.** Each stage has its own change record and tests (regression, migration, engine fingerprint, UI audit), a preview review and separate release approval. Nothing is built in parallel with an unresolved financial-rule decision.

## Where we are

| Stage | Scope | Status |
|---|---|---|
| 0–2 | Safety net, financial model, safe to spend, reconcile (CR-001 to CR-003) | Implemented + tested |
| R1 prep | PIN protection, recovery, migration verification (CR-004) | Implemented + tested |
| UI | Redesign (CR-005) + D12 month fix (CR-006) | Implemented + tested |
| S | Savings: available to spend, use/release/correct (CR-007). **The owner's savings issue: investigated and corrected; the owner confirms it in the preview** | Implemented + tested |
| **Release 1** | Everything above, as one upgrade | **Waiting for the owner's preview review and explicit deploy approval.** Scope frozen. |

## Planning work (no code): **all six done** (see MASTER_PROJECT_STATE §12)

| # | Work | Output | Leads to |
|---|---|---|---|
| P1 | **Onboarding design:** a progressive, optional first-time setup covering accounts and real balances, how you're paid, income sources, commitments, savings, debts. Every step skippable; "finish later" prompts. | Screen-by-screen spec + clickable mock in the preview (behind a dev flag, not live) | Stage A (UI only, existing features) |
| P2 | ~~M-Pesa message research~~ **Declined by owner (DEC-024)**; kept as history only. Original scope: a catalogue of confirmation-SMS formats (sent, received, paybill, till, withdrawal, deposit, Fuliza, charges, reversals, M-Shwari, airtime). Synthetic test corpus (no real messages in the repo). Classification and duplicate-detection spec. | `docs/specs/MPESA_CAPTURE.md` + test corpus | DB-1 → Stage D |
| P3 | **"Will I make it to my next income?" + Before You Spend:** the calculation, the wording, and how assumptions are shown | DB-5 (needs approval: new financial rule) | Stage B |
| P4 | **Customer validation design:** interview guide (20 interviews), prototype task script, willingness-to-pay experiments (price-sensitivity survey, fake door, manual till pre-orders), success criteria set in advance | `docs/strategy/VALIDATION_PLAN.md` | Owner-run interviews; evidence for DB-2 |
| P5 | **Backup architecture & privacy assessment** (Google Drive or other): threat model, Kenya Data Protection Act considerations, encryption design, failure modes, cost | `docs/specs/BACKUP_ASSESSMENT.md` | DB-4 (needs approval) |
| P6 | **PWA (D9) assessment:** install, offline, update strategy so users can't get stuck on old versions | DB-6 (needs approval: architecture) | Stage C |

## Then: build stages (one at a time, after Release 1 is live and stable)

| Stage | Build | Needs first | Engine impact |
|---|---|---|---|
| A | Guided onboarding | P1 reviewed by the owner | None: UI over existing features (opening balances, plan settings, bills, goals, debts) |
| B | "Will I make it?" + Before You Spend (+ D14 fix) | DB-5 design approved (DEC-027, DEC-030) ✅; separate implementation authorisation; D13 fixed and released. **Before release: the schema 11 cancellation test (`prototypes/schema11/e2e-release1.js`) re-run against the actual DB-5 code and passing.** | New read-only calculation; schema 11 with 6 optional stored fields (spending override, one-cycle payday change, `cancelledAt`, restored one-offs, `plannedUsed`, `plannedLedger`): a production data migration under DEC-017 |
| R1-pre | **DB-7 public deployment boundary** (publish an app folder only; `netlify.toml`; headers). **Before Release 1 is merged.** | DB-7 approval | No app behaviour change; test paths move |
| C0 | **D13 schema guard** (never lower the schema version; read-only if data is newer) | Owner approval | Small storage-safety fix; full tests |
| C | PWA install/offline | DB-6 design approved (DEC-029) ✅; C0 done; separate implementation authorisation. **Before release:** RELEASE_1_CHECKLIST §9 safeguards + real-Android tests | Delivery architecture, not money rules |
| ~~D~~ | ~~Paste/Share M-Pesa capture~~ **Declined (DEC-024).** Manual recording is the supported approach; quick manual entry is improved instead (see below). | — | — |
| E | Weekly check-in | Stage B | Read-only |
| F | Receivables, family support, Fuliza & chama rules | DB-3 approved | Financial-rule change: migration + full verification |
| G | **Protected (encrypted) backups** (DB-4 design B) | DEC-028 ✅ (design); Release 1 and D13 done; separate implementation authorisation. **Before release:** real low-end Android performance and restoration tests, share-sheet device tests, crypto implementation review | New on-phone items (IndexedDB); new backup format v5; records unchanged |
| Later | Paid tier | DB-2 **with customer evidence** | Separate approval |

**Never (owner decision DEC-024):** SMS access, M-Pesa message capture or import, direct access to users' M-Pesa accounts.

**Deliberately avoid for now:** bank integrations; selling or advising on investments or loans; credit scoring; an AI adviser; cloud accounts by default; bookkeeping; crypto.

---

## Phase 1: Financial model (as designed; implemented in CR-002, with the savings model refined by DEC-008)

### The core idea
Today the app has one number: everything you ever earned minus everything you ever spent. Phase 1 gives every shilling a **location** (an account) and every movement a **kind**, so the app always knows *where* your money is and *what* each movement means.

### Accounts (new)
`{ id, name, kind: mpesa | cash | bank | savings | sacco | other, openingBalance, openingDate, archived }`
- **Balance = opening balance + money in − money out**, per account. The total of all accounts is what you actually hold.
- Defaults created on upgrade: M-Pesa, Cash, Bank (based on the payment methods already used).

### Transaction kinds and how each one counts

| Kind | Example | Account balance | Counts as income | Counts as spending | Other effect |
|---|---|---|---|---|---|
| income | Salary, freelance pay, business sales | + to account | **Yes** | No | — |
| expense | Food, fare, airtime | − from account | No | **Yes** | budgets |
| transfer | M-Pesa → bank, ATM withdrawal | − from one, + to other | No | No | total unchanged |
| savings deposit | Into M-Shwari / SACCO / goal | moves to savings account (or earmarks) | No | **No** (fixes D2) | goal progress + |
| savings withdrawal | Taking from emergency fund | back to spending account | No | No | goal progress − |
| borrow | Fuliza, loan from a friend | + to account | **No** | No | debt + |
| debt repayment | Paying back Fuliza | − from account | No | Only interest/fees | debt − |
| lend | Lending a friend KSh 2,000 | − from account | No | No | owed-to-me + |
| collection | Friend pays you back | + to account | No | No | owed-to-me − |
| opening balance | Starting amount | sets start | No | No | — |
| fee | M-Pesa transaction charge | − from account | No | Yes (category "Charges") | — |

### Integrity rules
1. Goal progress, debt repaid and bill paid amounts are **calculated from their linked transactions**, not stored separately. Deleting or editing a transaction therefore can never leave them wrong (fixes D4).
2. Every linked movement is created, edited and deleted through **one function**, so the two sides always change together.
3. Amounts are stored rounded to the cent, and totals are calculated in whole cents. This avoids floating-point drift (e.g. 0.1 + 0.2).
4. A transfer is one record with a "from" and a "to", never two loose records.

### Upgrade of existing data (schema 9 → 10)
1. The existing safety backup step runs first, and the backup is downloaded.
2. Accounts are created, and each transaction gets an account based on its payment method.
3. Records the app itself created are reclassified by their reference: `goal:` → savings deposit, `debt:` → debt repayment. The original type is kept in `legacyType`, so the upgrade can be reversed.
4. Nothing is deleted. Balances before and after are compared in tests: total money held must stay the same, and only how it is classified changes.
5. Opening balances start at 0. The app then invites the user to reconcile ("Your M-Pesa shows X, PesaPilot shows Y. Add the difference as an opening balance?").

### Acceptance criteria
- Transfers change no income, spending or total.
- Savings deposits do not appear in spending, and savings rate is calculated correctly.
- Borrowed money never appears as income.
- Deleting any linked transaction updates its goal, debt or bill.
- Upgrading every fixture (including legacy schema 3/4 data) preserves the total held and every record.
- All Phase 0.5 tests still pass. D2 and D4 move from "known defect" to "passing".

### My additional recommendations (not in your original requirements)
- **Fee capture for M-Pesa:** an optional "transaction cost" field on M-Pesa expenses and transfers. Charges add up quickly, and few apps show them.
- **Reconcile button per account:** "my real balance is …" creates a correcting entry. This is how the app stays trustworthy when people forget to record small items.
- **Postpone:** cloud sync, SMS import and bank integrations, until Phases 1–2 are verified.

## Launch phases (planning, 26 Nov)
See `strategy/PWA_AND_LAUNCH_PLAN.md`: **L1** app readiness → **L2** 5–10 trusted testers → **L3** the approved 24-person research (P4) → **L4** wider public access (DB-4 recommended before L4). Identity: `specs/DB-8_IDENTITY_BRIEF.md`.
