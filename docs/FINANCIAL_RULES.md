# PesaPilot Financial Rules (schema 10)

This is the single reference for how PesaPilot counts money. Every rule here is covered by an automated test in `tests/run.js`. If code and this document ever disagree, that is a bug.

## 1. Where money is: accounts
- Every transaction belongs to an **account** (M-Pesa, Cash, Bank, Savings such as M-Shwari or a SACCO, Other).
- **Account balance** = opening balance + money in − money out.
- If an account has an **opening date**, entries dated before it are treated as already included in the opening balance.
- **Total held** = the sum of all account balances. This is the big number on Home.

## 2. What each movement means

| Kind | Changes account balance | Counts as income | Counts as spending |
|---|---|---|---|
| Income | + receiving account | **Yes** | No |
| Expense | − paying account | No | **Yes** |
| Transfer | − from, + to (total unchanged) | No | No |
| Borrowed | + receiving account | **No** | No |
| Debt repayment | − paying account | No | **No** (borrowing was never income) |

- **Saved this month** = income − spending − debt repayments.
- **Savings rate** = saved ÷ income.

## 3. Goals: money set aside
A goal is separate from the accounts that hold its money. Money reaches a goal in two ways:

1. **Set aside (allocate) inside an account.** Example: KSh 2,000 of M-Pesa for the Emergency fund.
   - The M-Pesa balance is **unchanged**.
   - M-Pesa *available* drops by 2,000.
2. **Move money for a goal (transfer).** Example: KSh 5,000 from M-Pesa to M-Shwari "for Emergency fund".
   - M-Pesa goes down 5,000 and M-Shwari goes up 5,000.
   - The goal's set-aside amount moves with the money: up to 5,000 is released in M-Pesa, and 5,000 is set aside in M-Shwari.
   - If nothing was set aside in M-Pesa first, the full 5,000 still becomes goal money in M-Shwari.

Definitions:
- **Set aside (account)** = the sum of all goal allocations in that account.
- **Available (account)** = balance − set aside.
- **Goal progress** = the sum of that goal's allocations across all accounts. It is calculated, never typed in.

### The no-double-counting rule
You can set aside at most the account's **available** amount. Once a shilling is set aside for one goal it is no longer available, so a second goal cannot claim it.

### The three amounts (DEC-022)
For every account:

| Amount | Meaning | Formula |
|---|---|---|
| **Actual balance** | What the account really holds | opening + money in − money out |
| **Set aside** | Money reserved for savings goals in that account | sum of that account's goal allocations |
| **Available to spend** | What is free to use | **actual balance − set aside** |

- **Example:** M-Pesa holds 30,000 and 5,000 is set aside for the Emergency fund. Balance 30,000 · set aside 5,000 · **available 25,000**.
- **Total money owned stays 30,000.** Setting money aside never reduces what you own; it only reduces what is available to spend.
- **Home** leads with *available to spend* across spending accounts. Totals including savings accounts are shown separately.
- **Savings-type accounts** (M-Shwari, SACCO) are not spending money. Their unreserved money is shown as "not set aside", never as "available to spend".

### Using, releasing and correcting goal money (DEC-022)
- **Use money from a savings goal:** the user chooses the goal, the amount, the account that **actually paid**, which goal holding to reduce, the category, the date and a description.
  - It records **one** expense from the paying account (counted as spending once).
  - It reduces the goal by the same amount.
  - The two are linked: editing the expense adjusts the goal, and deleting it restores the goal.
- *Example:* 5,000 set aside in M-Pesa (balance 30,000), then 1,500 used, paid from M-Pesa. Balance 28,500 · set aside 3,500 · available **25,000**. The goal shows 3,500 saved and 1,500 used.
- *If the savings were in M-Shwari but you paid from M-Pesa:* M-Pesa falls by 1,500. M-Shwari keeps its 5,000, of which 3,500 is still reserved and 1,500 is no longer reserved.
- **Release:** the money is no longer reserved. It stays in the same account and becomes available again. Nothing is spent or moved.
- **Correct / reverse a set-aside:** this adds a correction entry for the difference (e.g. 5,000 → 3,000 adds −2,000). The original entry stays in the history. **No income or spending is ever created.**
- **Spending money that is set aside without using "Use money"** is still allowed after a warning. Available then shows below zero, and the goal shows the shortfall until it is replaced or released.
- **Deleting a goal** frees its set-aside money. Transfers it made stay recorded, because the money really moved.

### Goal figures
- **Saved now** = net of all set-asides, moves, uses, releases and corrections. It reflects money still saved, not historical contributions.
- **Still needed** = target − saved now.
- **Held in savings accounts** + **Set aside in spending accounts** = saved now.
- **Used so far** and **Released** are shown separately. Every entry is listed in History.

### Safe to spend and savings
Money already set aside is excluded from "money free to use". This month's savings target is reduced by what was set aside this month. So setting aside your monthly target does **not** reduce safe to spend a second time (tested).

## 4. Debts
- **Repaid** = repaid before tracking started + the sum of recorded repayments. It is calculated.
- Adding a debt can record where the borrowed money went (a "borrowed" entry). That entry is never income.

## 5. Linked entries stay consistent
- Editing a debt-repayment or bill-payment entry updates the debt or bill.
- Deleting one removes it from the debt or bill. For bills, only the affected month is re-checked.
- Deleting a goal transfer removes the goal allocations it created.
- Amounts are rounded to the cent and totals are added in whole cents, so floating-point drift cannot occur.

## 6. Safe to spend (DEC-015)

**Planning period**
- **Fixed payday:** from today up to (not including) the next payday.
- **Irregular income:** the next 7, 14 or 30 days (the user chooses), starting today.

**Spending money** = the sum of *available* (balance − set aside) across **spending accounts**.
- M-Pesa, cash, bank and other accounts are spending accounts by default.
- Savings-type accounts (M-Shwari, SACCO, savings) are excluded unless the user marks one "count as spending money".
- Goal money is therefore deducted exactly once: through *available*, and only in accounts that are counted at all.

**Deducted from spending money (each item once):**

| Commitment | Amount |
|---|---|
| Bills | Unpaid remainder of each bill occurrence due within the period, plus the most recent overdue unpaid occurrence. Partial payments reduce it. |
| Debt instalments | For each debt with a monthly plan: the plan minus repayments already recorded this calendar month (never below 0), capped at what is still owed. Debts with no plan are **not** guessed: they are listed as "no repayment plan". |
| Goal plans | For each unfinished goal with a monthly target (or weekly × 4.33): min(target, still needed) − money set aside for it this calendar month (never below 0). Money already set aside is excluded here because it was already deducted through *available*. |
| Planned spending | The amount the user enters for known extra spending in this period. |
| Minimum buffer | Optional amount the user always wants left untouched. |

**Result**
- Reserve = spending money − all deductions.
- Safe to spend per day = reserve ÷ days in the period. A negative result is shown as a shortfall.

**Income**
- Only income actually received is counted.
- **Expected income** (source, amount, expected date, account) is listed separately with "if it arrives" figures.
- Marking it received creates a normal income entry for the amount and date actually received.

## 7. Upgrade from schema 9 (one time, reversible)

| Before (schema 9) | After (schema 10) |
|---|---|
| Payment method label | Account (M-Pesa, Cash, Bank (also Card), Other / unassigned) |
| Goal contribution recorded as "Savings" expense | Transfer to "Savings (before accounts)", set aside for that goal; `legacyType: "expense"` kept |
| Debt repayment recorded as expense | Debt repayment; `legacyType: "expense"` kept |
| Goal amount typed directly (no transaction) | Set aside in M-Pesa (that money was never deducted) |
| Debt "already repaid" | Repaid before tracking |

Safeguards:
- Nothing is deleted.
- The untouched original data is stored once in `pesapilot_pre_v10_snapshot`, in a format the schema 9 app can import.
- Total held rises by exactly the savings that schema 9 had wrongly counted as spent.

## 8. Balance adjustments and reconciliation (DEC-016)

**Reconcile an account:** the user enters what an account *actually* held on a date.
- **Recorded balance** = the account balance including every entry dated on or before that date.
- **Difference** = actual − recorded.

**What gets recorded**
- An **adjustment** entry (`type: "adjustment"`, direction in or out).
  - It stores the recorded balance, the actual balance, the difference, the date and the reason.
  - It changes the account balance. It is **not** income or spending.
- If the actual balance is lower and the user knows they spent the money, the difference is recorded instead as an **expense** in category "Unrecorded spending", with the same reconciliation details. That one counts as spending.

**Reversals instead of deletion**
- Adjustments and reconciliation expenses **cannot be edited or deleted**.
- **Reverse** creates a reversal entry and links the two.
- Both stay visible in history, and both are excluded from every balance and total, so their combined effect is zero.
- A reversal cannot itself be reversed: reconcile again instead.

**Audit trail**
- Each account has a reconciliation history: date, recorded, actual, difference, classification, reason and reversal status.
- The Money screen shows the net total of unexplained differences.

## 9. Records, security and recovery (DEC-019, DEC-020)
- Financial records are never deleted by upgrades.
- Adjustments are reversed, never deleted (§8).
- Backups contain every financial record but **no PIN and no PIN hash**.
- The PIN only locks the app on one device. PIN hashing is **not** encryption of the records.
- Recovery after losing a device depends on the user's backup file. See `DATA_RECOVERY.md`.
