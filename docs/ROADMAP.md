# PesaPilot Roadmap (prioritised)

Priority order (owner's): Financial accuracy → Data integrity → Security → Usability → Reliability → Intelligence → Growth.
Each phase ends with tests passing, a change-register entry and owner review. **One deployment per phase, at most.**

| Phase | Goal | Status |
|---|---|---|
| 0 | Baseline inspection | **Done:** `CURRENT_STATE_ASSESSMENT.md` |
| 0.5 | Safety net: tests, non-destructive migration, dead code | **Implemented + tested** (CR-001), not deployed |
| 1 | Financial model: accounts, transfers, goal allocations, classification | **Implemented + tested** (CR-002), not deployed. Rules: `FINANCIAL_RULES.md` |
| 2 | Safe to spend for irregular income, reconcile, expected income | **Implemented + tested** (CR-003), not deployed |
| R1 | Release 1 (0.5–2 + PIN protection): prepared and verified (CR-004) | **Awaiting owner preview review + approval** |
| 3 | Core features: receivables, savings withdrawals, daily balances, flexible budgets | Planned |
| 4 | Security & reliability: hashed PIN, PWA/offline, backup hardening | Planned (PIN fix may move earlier) |
| 5 | Dashboard & insights on correct numbers | Planned |
| 6 | Release: regression run on realistic scenarios, deploy | Planned |
| Later | Cloud sync / login (Firebase or other), M-Pesa SMS import, multi-device | Needs separate approval |

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
