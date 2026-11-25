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

### When reality changes
- **Spending or moving money that is set aside** is allowed, because real life happens, but the app asks first.
- Afterwards the account shows available below zero, and the goal shows the shortfall until you release or replace the money.
- **Release** a goal's money: it becomes available again in the same account. Nothing moves.
- **Use** a goal's money: release it *and* record the expense in one step.
- **Deleting a goal** frees its set-aside money. Transfers it made stay recorded, because the money really moved.

## 4. Debts
- **Repaid** = repaid before tracking started + the sum of recorded repayments. It is calculated.
- Adding a debt can record where the borrowed money went (a "borrowed" entry). That entry is never income.

## 5. Linked entries stay consistent
- Editing a debt-repayment or bill-payment entry updates the debt or bill.
- Deleting one removes it from the debt or bill. For bills, only the affected month is re-checked.
- Deleting a goal transfer removes the goal allocations it created.
- Amounts are rounded to the cent and totals are added in whole cents, so floating-point drift cannot occur.

## 6. Safe to spend (interim, improved in Phase 2)
- Reserve = total held − set aside for goals − bills due before payday − debt plan − goal monthly targets − planned expenses.
- Per day = reserve ÷ days to payday.
- Phase 2 will replace the single fixed payday with an income-pattern-aware calculation.

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
