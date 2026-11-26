# DB-5 Decision Brief: "Will I make it to my next income?" + Before You Spend

**Status:** **Rules and design approved by the owner: DEC-027 (26 Nov), with the conditions below. Not implemented.** Implementation needs a separate go-ahead after Release 1 and D13 are completed and verified.

## Owner decisions (DEC-027)

| # | Decision | Condition to honour in the build |
|---|---|---|
| 5.1 | Approved | — |
| 5.2 | Approved | — |
| 5.3 | Approved | — |
| 5.4 | Approved | **The payday exclusion must be clearly explained** on screen ("Your plan runs until the day before payday. Rent due on payday isn't included; if your pay comes late, …"). |
| 5.5 | Approved | Confidence levels, transparent reconcile adjustments, Count it/Undo. **Unexplained shortfalls stay distinguishable from recorded spending:** shown separately, with the figure without them. |
| 5.6 | Approved | The cushion is a warning threshold only, never deducted (model property). |
| 5.7 | Approved, **amends DEC-015** | Clear treatment of each state: **late** (worked out from the date; Received / New date / Won't come), **cancelled** (`cancelledAt`; kept in history; never in lists, forecasts or reminders), **received** (recorded as real income on the actual date and amount). |
| 5.8 | Approved, **amends DEC-015** | One cycle only; removed automatically after that payday. |
| 5.9 | Approved | Savings are never automatically released or used. |
| 5.10 | Approved (deferral to DB-3) | **Disclose** on Plan / "How this is worked out": "Fuliza and loans that M-Pesa repays automatically aren't fully included yet. Money coming in may be taken for them first." |
| 5.11 | Approved | **No double counting of actual and planned spending** (design below; also fixes defect D14). |
| 5.12 | Approved conditionally | Only after D13 is released, with migration, rollback, backup-compatibility and cancellation-recovery tests. The last is re-run on the real DB-5 code. |
| 5.13 | Approved | — |
| 5.14 | Approved **for user testing** | Not permanently final wording; revisit after testing. |

### How 5.11's condition will be met (reducing needs no new field; restoring on reversal: D14 proposal)
- **Today (defect D14):** planned spending is one amount the user maintains. Recording the real expense doesn't reduce it, so it can be deducted twice. That errs on the cautious side, but is inaccurate.
- **When recording an expense while planned spending is above zero,** the form asks: "Was this part of your planned spending (KSh 2,000 left)?"
  - **Yes** (the default when the expense comes from Before You Spend's saved plan) reduces planned spending by the expense amount, never below zero.
  - **No** leaves it.
- **Reversing or deleting that expense:** see the D14 proposal below (for owner decision).
- **At the start of a new planning period,** leftover planned spending is shown for the user to keep or clear. It is never silently carried over.

### D14 proposal: restore planned spending when a planned expense is reversed (for owner decision, 26 Nov)
**Goal (owner):**
- planned spending is **reduced** when an expense is confirmed as part of the plan;
- it is **restored appropriately** if that expense is reversed or deleted;
- **no unnecessary stored data**.

**Why something must be stored:**
- Planned spending is one amount. After the fact, nothing in the records says which expenses used it, or how much.
- Asking the user at reversal time ("add it back?") stores nothing, but relies on memory and can be answered wrongly.
- **The minimum that makes it automatic and exact is one optional number on the expense:** `plannedUsed`, how much of the plan this expense used.
  - No new list, no ids, no links.
  - Expenses not marked as planned carry nothing.

**Proposed behaviour**

| Event | What happens to planned spending | Stored |
|---|---|---|
| **Record an expense, confirmed "part of my plan"** | Reduced by `min(expense amount, planned left)` | `plannedUsed` = that amount, on the expense |
| **Reverse it, or delete it** (same planning period) | **Restored** by `plannedUsed`. Toast: "Planned spending back to KSh 2,000. [Undo]" | — (the expense is reversed or removed) |
| **Reverse or delete it in a later planning period** | **Not restored**, because the old plan has ended. Message: "This was part of an earlier plan, so your current planned spending isn't changed." | — |
| **Edit the amount down** (e.g. 2,000 → 1,500, `plannedUsed` 2,000) | Restored by the difference (500); `plannedUsed` becomes 1,500 | updated |
| **Edit the amount up** | No automatic extra reduction. "Use more of your plan?" asks | updated only if yes |
| **Edit to "not part of my plan"** | Restored by `plannedUsed`; the field is removed | removed |
| **The user changed planned spending by hand in between** | Restoring adds `plannedUsed` to whatever it is now, with **Undo**. The app never guesses what the user meant. | — |
| **Reversal pairs** (DEC-016) | Restored **once**, when the original becomes reversed. Never again for the same entry. | — |

**"Same planning period"** is worked out, not stored: it means the expense's date falls inside the current planning period (DEC-015 as amended by DEC-027).

**Tests:**
1. planned 2,000, an expense of 2,000 confirmed → Left to spend falls once (not twice) → reversed → planned back to 2,000;
2. a partial expense (1,500 of 2,000) → 500 left → deleted → 2,000;
3. a reversal in the next period → planned unchanged, with the message;
4. edit down / up / unmark;
5. double reversal → restored once only;
6. Undo after a restore;
7. an expense not marked as planned → nothing stored, nothing restored.

**Data and compatibility**
- **This is a fifth optional field**, so it **amends DB-5.12** (approved with 4 fields). It needs your approval.
- It goes into schema 11 with the others. No extra migration: old entries simply don't have it.
- Release 1 keeps unknown fields on entries (`index.html:778`), so the field survives.
- **Mixed-version limit:** if Release 1 (an old tab or a rollback) reverses such an expense, it won't restore planned spending, because it doesn't know the field. Planned spending then stays too low and Left to spend **too high** by that amount, until the user corrects it. This is the less cautious direction, so it is covered by the same safeguards as R4 (D13 first; never roll back to Release 1 after schema 11) and noted with R4.

**Alternative (no stored data):** at reversal, ask "Add KSh 2,000 back to planned spending?". The user must remember what the expense was for.

**Recommendation:** the `plannedUsed` field. It is the smallest addition that meets your "restored appropriately" requirement automatically and exactly.

- **If itemised planned spending** (several named items) is wanted later, that would need a stored list and its own approval.



**Builds on:**
- `DB-5_WILL_I_MAKE_IT.md` (first design);
- FINANCIAL_RULES §6 (DEC-015).

This brief replaces the first design where they differ (see §10).

**Evidence:** every number in the examples was calculated by a reference model, `../prototypes/will-i-make-it/model.js`. It is not part of the app. Run it with `node model.js`; it checks all examples and two safety properties.

---

## 1. The decision

Approve the rules PesaPilot uses (14 choices in §8) to answer two questions:
1. **"Will I make it to my next income?"** A verdict (On track / Tight / Short / Already short), with the reasons, the timing and the assumptions.
2. **"Before You Spend":** what a purchase would do to that verdict, **before** anything is recorded.

**Why it matters**
- This is the moment PesaPilot's promise meets a real decision.
- An over-optimistic answer could push someone into Fuliza or a digital loan.
- A confusing answer won't be trusted.
- The rules must be **conservative, explainable and honest about uncertainty**.

## 2. Principles (non-negotiable)

1. **Expected income is never treated as money you have.**
   - It is not in the verdict, not in the daily figure and not in the runway.
   - It appears only as separate "if it arrives" lines, **one per payment, never added together**.
2. **Only what is real counts:**
   - money in spending accounts, minus money set aside for goals;
   - commitments with amounts and dates.
3. **Each shilling is counted once** (DEC-015, DEC-022).
4. **PesaPilot never blocks, never records by itself, and never moves or releases savings** without the user's action.
5. **The daily figure is a planning guide, not an allowance** (DEC-026).
6. **Every answer shows its working:** the horizon, the items deducted, the spending estimate and the assumptions.

## 3. Definitions

| Symbol | Meaning | Source |
|---|---|---|
| **A** | Free money now: available (balance − set aside) in spending accounts | DEC-015, existing |
| **Must-pay** | Unpaid bills and debt instalments **due on or before the end of the horizon**, including overdue ones | Bills and debts, which already have due dates |
| **Plans** | This period's goal target not yet set aside, plus planned extra spending | DEC-015, existing |
| **D** | Usual day-to-day spending per day (an estimate, editable) | New, read-only (§5.4) |
| **N** | D × days in the horizon | New |
| **Left after commitments** | A − must-pay − plans | Same as today's figure before the buffer |
| **M (margin)** | Left after commitments − N | New |
| **Cushion** | Your safety buffer if you set one; otherwise max(KSh 500, 10% of N) | §5.5 |

**Verdicts**

The verdict is about the time **until your next income** (the horizon). It counts money you actually have, never expected income.

| Verdict | Exact rule | What it means, in plain words | Draft message |
|---|---|---|---|
| **Already short** | The must-pays due before your next income, added up in date order, are **more than A**. Usual spending, savings plans and the buffer are **ignored** for this test. | "**Your payments alone are more than your money.** Even if you spent nothing on food or transport, you couldn't pay what's due before your next money." | "Rent of KSh 6,500 is due on Fri 27 Nov. You have KSh 5,000. **Even if you spend nothing else**, you need KSh 1,500 more by 27 Nov." |
| **Short** | **Not** Already short, but **M < 0**. | "**You can pay what's due, but not that plus your normal daily spending.** Something has to give: spend less each day, pay something later, or find more money." | "You can pay the chama, but **at your usual spending** (about KSh 450 a day) you'd run out on Tue 1 Dec, about KSh 150 short. To make it, keep to about KSh 428 a day." |
| **Tight** | 0 ≤ M < cushion | "You should make it, but with very little to spare." | "You should make it, with only about KSh 500 to spare. One unexpected cost could leave you short." |
| **On track** | M ≥ cushion | "You should make it, and keep your safety money." | "Yes. At your usual spending you'd still have about KSh 5,500 on Sun 29 Nov, and your KSh 1,000 safety buffer stays untouched." |

**The difference between Short and Already short, in one line each** (for the app's "What does this mean?"):
- **Already short** = *the bills alone don't fit.* Cutting daily spending can't fix it. You need more money, or to agree a later date for a payment.
- **Short** = *the bills fit, but bills plus everyday spending don't.* Spending less each day can fix it, and the app says by how much.

The two are tested in that order, so a person is never shown both. A "Short" result whose cause is only the savings plan says so (§4.5).

### Timing: two scenarios, never mixed

A payment due *after* an expected payday is only safe if that money really comes. So the timing check runs **two separate scenarios** over the **next 30 days**, and the screen labels them clearly.

**1. "If no money comes in"** (always shown)
- Uses actual money only.
- Usual spending every day; savings plans and planned spending on the first day.
- Each payment is taken on its due date, **including payments due after the expected payday**.
- It shows:
  - **the first payment you couldn't fully pay**, and how much you'd have towards it;
  - **how long your money lasts** (the runway).
- Its wording depends on when the payment falls:
  - **Before your next income:** "School fees KSh 2,500 on Mon 30 Nov: you'd have about KSh 1,500." This always matches a Short or Already-short verdict.
  - **After your expected payday:** "**If your salary doesn't come on 30 Nov**, rent of KSh 6,500 on 1 Dec couldn't be paid: you'd have about KSh 4,800." This can appear **even when the verdict is On track**, because the verdict assumes a fixed payday happens (DEC-015). This warning is the safety net if it doesn't.

**2. "If [payment] arrives on [date]"** (one per expected payment, never combined)
- The same run, with **only that one payment** added on its date.
- On the payment's date, payments due that day are taken **before** the money arrives, since it may come late in the day.
- It shows either:
  - "If the KSh 5,000 from the wholesale customer arrives on Fri 27 Nov, your payments in the next 30 days are covered"; or
  - "Even if it arrives, rent on Fri 27 Nov is due **before** it: you'd have about KSh 4,400 of KSh 6,500."
- It **never changes the verdict** or the no-income scenario.

**Rules the model checks for every example:**
- Adding expected income changes **neither the verdict nor the no-income warning**.
- Adding a payment never improves the verdict.

**Today's "Left to spend" (DEC-015) stays exactly as it is.** The verdict is a new layer on top of it.

**One daily figure only:** the daily guide in every message is today's safe to spend per day (DEC-015: Left to spend ÷ days, which keeps the buffer). The verdict adds no second daily number.

## 4. The seven situations you asked about

### 4.1 Irregular income
- **Horizon:** always the user's planning period (7, 14 or 30 days; 7 is suggested by onboarding B). It is **never shortened** to the date of an expected payment.
  - *Why:* a horizon that ends on the day an uncertain payment is due quietly assumes it arrives. The first design proposed this; the model showed it is unsafe. Otieno, with only 2 days to plan for, looked **On track**. Over the full 7 days he is **Short**.
- **Usual spending** comes from the last 28 days. A daily earner can override it ("this week I'll spend about KSh 400 a day").
- **Runway** matters most here: "your money lasts until Mon 30 Nov" is meaningful even when nobody knows when the next income comes.

### 4.2 Multiple income sources
- Each expected payment (salary, client, chama payout, side job) is **a separate "if it arrives" line, with its own date**. There is **no combined total**.
  - Today's Plan screen shows one combined "If expected income arrives: KSh X a day". **I recommend replacing it with per-payment lines** in Stage B (choice 2).
- Each line shows:
  - how much would actually reach the user (e.g. "Fuliza takes KSh 800 first; about KSh 2,200 reaches you"; this depends on DB-3, see §6);
  - whether any payment falls due **before** that money is expected.
- **Payments outside the horizon** are listed under "Expected later", not used.

### 4.3 Bills due on different dates
- Every must-pay is placed on its **due date**. This gives:
  - the **first payment you couldn't pay if no money comes in**, checked 30 days ahead, so payments due after an expected payday are included (§3, Timing);
  - an **"Already short"** warning when a bill falls due before the money exists, even if the end-of-period sum looks fine.
- **Bills due soon after payday** (e.g. rent on 1 Dec when salary comes on 30 Nov) are not deducted, because the salary pays them. But the **no-income scenario still checks them** and warns if they would fail without the salary: "If your salary doesn't come on 30 Nov, rent on 1 Dec couldn't be paid" (examples 1 and 1b).
- **A bill due on payday itself** is outside the period under DEC-015. If the pay arrives late in the day, it could still bite. **Recommended:** keep the rule and show a note ("Rent is due on your payday. If your pay comes late, pay it from …"). The alternative is to amend DEC-015 (choice 4).

### 4.4 Debt repayments
- Debts **with a repayment plan**: the instalment is a must-pay on the debt's due date. This is the existing rule (DEC-015), now with timing.
- Debts **without a plan**: not guessed, as today; shown as "No repayment plan: the app can't protect money for this".
- **Fuliza and loans repaid automatically from incoming M-Pesa** belong to **DB-3**. Until then, they are not deducted, but the "if it arrives" line warns that some of the incoming money may be taken first.

### 4.5 Savings allocations
- Money **set aside** for goals is **not counted** in A. It is shown separately: "You also have KSh 3,000 set aside for School fees (not counted)."
- This period's **savings plan** is part of *Plans*. If the user is Short **only because of the plan**, the message says: "You'd make it if you set aside KSh 1,500 less this period." The choice stays the user's (example 4).
- **Savings are never released or used automatically.** When a purchase would make things Short and money is set aside, Before You Spend **offers** "Use money from a savings goal" (the existing DEC-022 action) and explains what it means.

### 4.6 Unexpected expenses and the safety buffer
- **The safety buffer** (existing setting) is the money the user wants never to touch. It becomes the **cushion** for the verdict.
  - On track means the buffer is untouched.
  - Tight means the buffer would be partly used.
- **With no buffer,** a small default cushion (the larger of KSh 500 and 10% of N) still separates "comfortable" from "Tight". It is not deducted anywhere; it only labels the verdict.
- **One-off big costs are left out of usual spending**, so the verdict doesn't treat a one-off phone purchase as a daily habit. Unexpected costs are what the cushion is for.
- **Before You Spend** is the main tool for a surprise cost (example 5).

### 4.7 When the payday changes or income doesn't arrive

| Situation | What PesaPilot does | Why it stays accurate |
|---|---|---|
| **Expected payment is late** (date passed, not marked received) | It is marked **"Late"** (worked out from the date; nothing is stored). It asks once: **Received** (records the real amount and date) / **New date** / **It won't come** (kept in history as cancelled, not deleted). | It was never counted, so **the verdict doesn't suddenly change**. Only its "if it arrives" line changes (example 2b). |
| **Partly paid** | Record what arrived. "Is the rest still coming?" → Yes: the remainder stays expected, with a date. No: closed. | Only received money counts. |
| **Salary paid later this month** | **"My pay is late this month"** sets a new date **for this cycle only**. The usual payday is unchanged. | The horizon grows, and bills that now fall before the pay (e.g. rent) become must-pays. Example 1b: On track → **Short by KSh 2,400**. |
| **Payday passes and no income is recorded** | The plan **doesn't roll over** to the next month as if paid. It shows "Waiting for your pay", keeps counting days and bills, and asks once a day: "Has your pay arrived?" | Stops the app from planning next month with money that hasn't come. |
| **Income stops** (job loss, no clients) | The runway becomes the headline: "Your money lasts until …". It suggests setting the planning period to 30 days and reviewing bills. | Nothing expected is counted, so nothing needs undoing. |

## 5. Before You Spend

**Input:**
- an amount;
- optionally, the account and what it's for.

**Output (nothing is recorded):**
1. **Can you pay it now?** It warns if the amount is more than that account's free money and would use money **set aside** (as today's spending warning does).
2. **Verdict before → after**, with the margin and the new daily guide.
3. **The first payment at risk after the purchase,** in both scenarios, labelled "if no money comes in" or "even if [payment] arrives".
4. **When it would make you Short and you have savings set aside:** an offer of "Use money from a savings goal", explained, never automatic.
5. **Actions:** **Record this expense** (opens the normal form, pre-filled) / **Not now** / **Save as planned spending**.

**Example 5 (Wanjiru, unexpected hospital bill)**

| Amount | After | Margin | Daily guide | Message |
|---|---|---|---|---|
| 4,000 | On track | 1,500 | 1,600 → 800 | "You can pay this and stay on track **if your salary comes on 30 Nov**. If it doesn't, rent of KSh 6,500 on 1 Dec couldn't be paid: you'd have about KSh 800." |
| 5,000 | **Tight** | 500 | 600 | "You can pay it, but you'd use half your safety buffer." |
| 7,000 | **Short** | −1,500 | 200 | "This would leave you about KSh 1,500 short. The KCB loan on 29 Nov would have only about KSh 700 towards KSh 1,500. You have KSh 3,000 set aside for School fees. Using it is your choice." |

### 5.4 Usual spending estimate (D): exact rules (revision 2, 26 Nov)
Checked by `estimateUsualDaily` in `../prototypes/will-i-make-it/model.js`: 16 cases, D1–D11.

**Principle:** the app says how sure it is. **It never shows a precise-looking figure from records it can't vouch for.**

**1. Window and divisor**
- **Window:** the last **28 full calendar days before today**. Today is excluded because it isn't finished.
- **Shorter history:** fewer days if recording started less than 28 days ago.
- **Divisor:** the number of calendar days in the window. **A day with no entries counts as zero spending.**

**2. What counts as "a day with an entry" (a recorded day)**
A calendar day in the window, using the **date on the entry**, not when it was typed, with at least one **qualifying expense**:
- the type is *expense* (M-Pesa charges included);
- the amount is above zero;
- it is **not reversed**. An entry and its reversal count as neither spending nor a recorded day [D7];
- a large one-off still marks the day as recorded, even when its amount is left out.

**These do not make a day "recorded":**
- bill payments;
- money used from a savings goal;
- transfers, savings, debt repayments, borrowing;
- reconcile adjustments.

**3. What is counted in the total**
- Qualifying expenses, minus excluded one-offs (point 6).
- Unrecorded spending measured by reconciling (point 5).

**4. Partially recorded spending: what the app can and cannot know**
- **The honest limit:** if someone records lunch every day but forgets matatu fares, every day looks "recorded". Coverage can't see the gap [D8: coverage 100%, real spending 4× higher].
- **Only checking against the real balance (reconcile, DEC-016) can reveal partial recording.**
- So the estimate carries a **confidence level**, and the screen says which one applies:

| Level | When | What the user sees (draft) | Used in the verdict? |
|---|---|---|---|
| **Checked** | Every spending account (e.g. M-Pesa *and* Cash) reconciled in the last 14 days | "About **KSh 450** a day, **checked against your balances** on Fri 20 Nov." | Yes |
| **From your records only** | Not checked, but at least half the days have entries | "About **KSh 450** a day **from what you've recorded**. Not yet checked against your real balance. If anything wasn't recorded, you spend more." [Check my balances] | Yes, and the verdict says "based on your records, not yet checked" |
| **Incomplete** | Not checked, and **fewer than half** the days have entries | "Your records cover only **8 of the last 28 days**, so PesaPilot can't tell your usual spending yet. About how much do you spend on a normal day?" **No figure from the records is shown as the answer.** | Only after the user answers. Then **the higher** of their figure and the records' figure. |
| **Not enough history** | Fewer than 7 full days of records | "About how much do you spend on a normal day?" | Only the user's figure |

- **Figures are rounded to the nearest KSh 10 and always say "about".**
- **The working is always one tap away:** total, days, recorded days, reconcile gaps and one-offs.

**5. Reconcile differences: causes, direction and spreading** (revision 3, 26 Nov; model cases R1–R5 and D3, D8, D9, D11)

**The model cannot tell causes apart by itself.** A balance difference is just a number. It could be:
- forgotten spending or charges;
- unrecorded income;
- a transfer between the user's own accounts;
- an M-Pesa reversal;
- a refund;
- something else.

So PesaPilot uses **what the user says**, through mechanisms that already exist (DEC-016), and is cautious when nobody knows:

| What the reconcile found | How it is recorded today (DEC-016) | Effect on the usual-spending estimate |
|---|---|---|
| **Less money than recorded, ticked "spending I didn't record"** | An "Unrecorded spending" expense | **Counted**, spread over the days it covers |
| **Less money than recorded, cause not given** (an unexplained withdrawal) | A plain adjustment | **Counted (cautious), but reported separately as "unexplained"** [R4] |
| **Less money, later explained** as a transfer to another own account, a reversal of income, or anything else | The user **reverses** the adjustment (DEC-016) and records the real movement (a transfer, or a correction of the income) | **Not counted.** Reversed adjustments are ignored; transfers are never spending [R2a, R3b] |
| **More money than recorded** (unrecorded income, a refund, a reversal that returned money, a transfer in) | A plain adjustment (money in) | **Never counted, never lowers the estimate.** Shown as "more money found" [R1, R3a] |
| **Matching opposite differences on two accounts**, within 3 days (e.g. M-Pesa −2,000, Cash +2,000) | Two plain adjustments | Counted until explained, and **flagged as a possible unrecorded transfer**: "Was this a withdrawal from M-Pesa to cash?" [R2b] |

**Only shortfalls can raise the estimate.** Surpluses never lower it.

**When the cause can't be identified, and what the user is told**
- An unexplained shortfall is **counted**, because if it was spending, leaving it out would make the daily figure too low.
- It is **never hidden**. The estimate says so, and shows the figure without it:

> "About **KSh 520** a day. This **includes KSh 1,930 your balance checks couldn't explain** (M-Pesa, 24 Nov). If that wasn't spending, it's about **KSh 450**. [Explain it]"

- **"Explain it"** offers:
  - "It was spending" (records it as unrecorded spending);
  - "It was a transfer" (records the transfer and reverses the adjustment);
  - "It was a reversal / refund" (records it and reverses the adjustment);
  - "I don't know" (it stays counted, and flagged).
- The verdict uses the cautious figure, with the line: "includes unexplained differences".

**Spreading over several days** (unchanged in principle)
- **Each shortfall belongs to one account.** It is spread evenly over the days after that account's previous reconcile (or the day recording started) up to the reconcile date. **Only the days inside the 28-day window count.** Examples:
  - D3: 7,000 over 35 days, 28 of them inside the window, so 5,600 is counted;
  - R2b: 2,000 over 28 days, 27 inside the window, so 1,929.
- **Consecutive reconciles on one account cover separate stretches,** so nothing is counted twice [D11].
- **Even spreading is an assumption,** and the working says so.

**Model cases for causes**

| # | Situation | Estimate (base: 450 from records) |
|---|---|---|
| R1 | Unrecorded **income**: M-Pesa 3,000 higher than recorded | **450**; "3,000 more money found" shown |
| R2a | Unrecorded **transfer**, explained (adjustment reversed, transfer recorded) | **450** |
| R2b | The same transfer **not** explained: M-Pesa −2,000, Cash +2,000, a day apart | **519**: includes 1,929 unexplained; "without it: 450"; flagged "possible transfer M-Pesa → Cash" |
| R3a | A **reversal that returned money** (a payment bounced back) | **450** |
| R3b | A **reversal that took money back**, explained | **450** |
| R4 | **Unexplained withdrawal**: M-Pesa 2,800 short over the last 28 days | **550**: includes 2,800 unexplained; "without it: 450" |
| R5 | The same shortfall ticked "spending I didn't record" | **550**, not flagged |

**6. Large purchases left out: inspecting and restoring**
- **Rule:** a single expense over 3× the median expense in the window, applied only when there are at least 10 expenses.
- **Where the user sees it:** Plan → "How this is worked out" → **"Left out as one-offs"**. Each line shows the item, date and amount, and why it was left out:
  > Phone · Mon 23 Nov · KSh 12,000 (over 3× your typical expense of KSh 300) [Count it]
- **"Count it"** puts it back into the average at once [D4b: 214 → 643]. "Undo" leaves it out again.
- **The choice is remembered** until the purchase leaves the 28-day window. This needs one more optional stored list, the restored entry ids (added to DB-5.12).
- **Nothing is ever deleted or changed in the records.** This only affects the estimate.

**7. Examples (model-checked)**

| # | Situation | Result |
|---|---|---|
| D1 | 21 of 28 days, 600 each (+ rent bill, goal use) | **About 450**, "from your records only" |
| D1b | Same, M-Pesa reconciled 5 days ago | **About 450**, "checked" |
| D2 | 8 of 28 days recorded | **Incomplete:** no figure; asks. User says 400, so the higher figure, **400**, is used. |
| D3 | D2 + a reconcile finding 7,000 over 35 days | 5,600 counted. **About 290** (286), "checked" |
| D4 / D4b | 20 × 300 + a 12,000 phone | Phone listed and left out: **about 210** (214). "Count it" → **about 640** (643). |
| D5 | 4 days of history | Asks |
| D6 | Big expense today | Ignored until tomorrow |
| D7 | A reversed 5,000 entry | Not spending, not a recorded day |
| D8 | Every day recorded at 100; real spending about 400 | **"From your records only", about 100**, with the warning. After a reconcile finds 8,400: **about 400, checked** |
| D9 | A reconcile found 3,000 *more* than recorded | Estimate unchanged; shown |
| D10 | M-Pesa reconciled, Cash not | Not "checked" |
| D11 | Two reconciles on one account | Separate stretches; no double counting |

### 5.5 Cushion: a warning threshold only
- The cushion is the safety buffer if set; otherwise max(KSh 500, 10% of N).
- **The default cushion is never deducted from anything.** It only decides whether the verdict says "On track" or "Tight".
- Left to spend and the daily guide are unchanged by it. The model checks this for every example with no buffer.
- Only a buffer the **user** sets is deducted, as DEC-015 already does.

## 6. Worked examples (clock: Wed 25 Nov 2026)

| # | Who | Key facts | Result |
|---|---|---|---|
| 1 | **Wanjiru**, salaried, pay Mon 30 Nov | A 12,000 (3,000 set aside, not counted). KPLC 1,000 (26 Nov), water 500 (28 Nov), KCB loan 1,500 (29 Nov). Rent 6,500 on 1 Dec, *after* payday. Buffer 1,000. D = 700. 5 days. | Must-pay 3,000. N 3,500. **M 5,500 → On track.** Today's Left to spend 8,000 (unchanged). **If no money comes in:** rent on 1 Dec couldn't be paid (about 4,800 of 6,500); money lasts until 30 Nov. **If the salary arrives on 30 Nov:** everything is covered. |
| 1b | Same, **salary moved to Wed 2 Dec** | 7 days. Rent now falls before the pay. | Must-pay 9,500. N 4,900. **M −2,400 → Short.** "Keep to about KSh 214 a day" (this keeps the KSh 1,000 buffer). Rent on 1 Dec now falls **before** the pay: about 4,800 of 6,500, in both scenarios ("even if your salary arrives on 2 Dec, rent is due before it"). |
| 2 | **Otieno**, irregular (boda + clients), 7-day plan | A 4,000. Chama 1,000 (29 Nov). D = 450. Expecting client 3,000 (27 Nov) and chama payout 10,000 (5 Dec). Fuliza 800 owed. | Must-pay 1,000. N 3,150. **M −150 → Short.** "Keep to about KSh 428 a day." Runway to Mon 30 Nov. If the client pays: Fuliza may take 800, so about 2,200 reaches him and about 2,050 is spare (**not counted**). Chama payout: "Expected later". |
| 2b | Otieno on Fri 27 Nov; **the client hasn't paid** | He spent as usual (A now 3,100). | **Still Short**, same runway (30 Nov). Nothing jumps, because the payment was never counted. The client line shows "Late: Received / New date / It won't come". |
| 3 | **Akinyi**, tailoring | A 5,000. Rent 6,500 due Fri 27 Nov. Order payment 4,000 expected 28 Nov. | **Already short by 1,500 on 27 Nov** (the bills alone don't fit). No income: about 4,400 towards rent on 27 Nov. "Even if the order is paid on 28 Nov, rent is due before it." |
| 4 | **Mwangi**, saving for school fees | A 6,000 (2,000 set aside, not counted). Fees instalment 2,000. Savings plan 1,500 this period. D = 400. 7 days. | **M −300 → Short**, but only because of the savings plan: "You'd make it if you set aside KSh 1,500 less this period." |
| 5 | Before You Spend | Example 5 table above | — |
| 6 | **Njeri**, mama mboga, 7-day plan | A 3,000. School fees 2,500 due Mon 30 Nov. D = 300. Expecting 5,000 from a wholesale customer on Fri 27 Nov. | Not Already short (the fees fit: 2,500 ≤ 3,000). **M −1,600 → Short** (fees plus usual spending don't fit). **If no money comes in:** school fees on 30 Nov, about 1,500 of 2,500. **If the customer pays on 27 Nov:** covered. The fees fall *after* the expected payment, which is exactly why both scenarios are shown. |

**Properties the model checks** (these become tests if built):
- Adding any amount of expected income **never** changes the verdict **or the no-income warning**.
- Adding a commitment **never** improves the verdict.

## 7. What it would change, and what it wouldn't
- **Unchanged:**
  - balances, transactions, set-asides and classification;
  - DEC-015's **formula** for Left to spend;
  - every existing calculation.
- The verdict calculation is **new and read-only**.
- **Correction (25 Nov): choices 7 and 8 extend DEC-015's planning period.**
  - "Waiting for your pay" stops the period rolling over after a missed payday.
  - "My pay is late this month" moves the end of this cycle's period.
  - Left to spend must use the same period as the verdict, or the two figures would disagree. So these two choices change **which dates** DEC-015 plans for, not its formula.
  - They need your explicit approval as amendments to DEC-015 (see `DECISION_PACK_DB5_DB4_DB6.md`).
- **New stored data (all optional, all additive):**
  1. a usual-spending override with an end date;
  2. a one-cycle payday change ("my pay is late this month");
  3. an expected-income "cancelled" status, recorded by a `cancelledAt` date and kept in history;
  4. a list of one-off purchases the user chose to "Count it" in the estimate (§5.4.6). Added 26 Nov.

  **Schema 11 safeguards (tested on a copy, 25 Nov).**

  | Test | Result |
  |---|---|
  | Release 1 **only opens** schema 11 data | Nothing changes |
  | Release 1 **saves** schema 11 data (any edit) | Schema relabelled 10 (D13); a `"cancelled"` status rewritten to `"expected"`; **but extra fields survive**: a `cancelledAt` date and both new profile settings were kept |

  **The design therefore has 4 layers:**
  1. **D13 released first.** Every version from then on refuses to save newer data.
  2. **Schema 11 + a new backup version.** Release 1 refuses schema 11 backups (refusal tested for DB-4 files).
  3. **"Cancelled" is recorded by a `cancelledAt` date, which is the source of truth.**
     - The status field is a convenience copy.
     - If Release 1 ever rewrites the status, the next schema 11 load restores it from `cancelledAt`.
     - The 10 → 11 upgrade runs safely again if Release 1 relabels the data: it is idempotent (DEC-004).
     - To be tested exactly as above.
  4. **Rollback floor.** After schema 11, emergency rollback must use a build that understands schema 11, **never Release 1**. The recovery procedure is updated with the stage.

  **Remaining exposure:** a Release 1 tab left open from before the update.
  - Release 1 reloads when another tab saves (R1, tested), so it fetches the new version.
  - Layer 3 repairs any status it rewrote.

  **End-to-end cancellation test (26 Nov):** `../prototypes/schema11/e2e-release1.js`. It uses the **real Release 1 build** for steps 1, 3, 4 and 6, and a **schema 11 reference model** (`reference.js`) for the new app, which isn't built.

  **Release requirement (owner, 26 Nov):** before any DB-5 / schema 11 release is offered for approval, this exact test must be **re-run against the actual DB-5 implementation** (not the reference model) and pass. Its output goes into the release evidence. It is also on the Stage B entry in `ROADMAP.md` and in the release risk register (RELEASE_1_CHECKLIST R4).

  | Step | Result |
  |---|---|
  | 1. Release 1 creates "Client payment" KSh 3,000, expected 24 Nov | Stored, schema 10, status expected |
  | 2. Schema 11 cancels it ("It won't come") | status cancelled, `cancelledAt` 25 Nov; pending payments 0 |
  | 3. Release 1 **opens** it | Stored data unchanged. **But while Release 1 is running, it lists the payment as expected on Plan and includes it in Home's "If expected income arrives" line**, because Release 1 knows only "received" and "not received". It is **never** counted in Left to spend or safe to spend. |
  | 4. Release 1 **saves** (adds "Chama payout") | Schema relabelled 10; the client's status rewritten to "expected"; **`cancelledAt` kept** |
  | 5. Reopened in the new app | Schema 11; the client is **cancelled again (restored from `cancelledAt`)**; pending: only "Chama payout"; **late reminders: 0** (it was due 24 Nov, so it would have been "Late" if it had come back); **forecast lines: only "Chama payout"**; a second load is identical (idempotent) |
  | 6. Release 1 imports a schema 11 backup, and restores a schema 11 safety backup | **Both refused** ("created by a newer version"); storage unchanged |

  **Rules the new app must follow** (from the test):
  - `cancelledAt` is the **only** source of truth. A "cancelled" status **without** a date is not trusted and is shown as expected. The cautious choice is to show it, never to hide money silently.
  - Every list, forecast and reminder uses the same "pending" rule: not received and no `cancelledAt`.

  **What the backup-version safeguard protects, and what it doesn't**

  | Protects | Does **not** protect |
  |---|---|
  | **Importing** a schema 11 backup file into Release 1 or the live 8e33d44: refused, nothing changed [tested] | Data **already on the phone** being opened or saved by Release 1 code (an old open tab, or a rollback to Release 1). That is covered by D13, the rollback floor and `cancelledAt`. |
  | **Restoring** a schema 11 *safety backup* inside Release 1: refused [tested] | **What Release 1 shows while it runs:** a cancelled payment appears as expected until the new app reopens (step 3) |
  | | A file whose version number someone **edited by hand** |
  | | Copies outside PesaPilot: a backup opened in another program, or a plain file forwarded to someone |
  | | Older backups imported into the new app. Not a risk: the new app upgrades them (DEC-004). |

  **Correction (25 Nov): this needs a schema bump (10 → 11).**
  - Release 1 rewrites any expected-income status other than "received" to "expected" (`index.html:853`), so a "cancelled" item would come back if an older version saved the data.
  - With schema 11, **D13's guard** (DEC-025, fixed first) makes older versions read-only for this data.
  - The bump is a small production data migration under DEC-017.
- **Display change (needs your OK):** replace the combined "If expected income arrives: KSh X a day" with per-payment lines (choice 2).
- **Builds in Stage B,** after Release 1 and the D13 release, with its own change record, tests (these examples, the properties and the full regression), preview and approval.

## 8. Choices for you

| # | Choice | Recommendation | Alternatives |
|---|---|---|---|
| 1 | Principles §2 and verdicts §3 | **Approve** | Change the wording or thresholds |
| 2 | Expected income | Per-payment "if it arrives" lines; **remove the combined line** on Plan | Keep the combined line as well |
| 3 | Irregular horizon | **Always the planning period** | End at a payment the user marks (not recommended: assumes it arrives) |
| 4 | Bill due on payday | **Keep DEC-015 and show a note** | Amend DEC-015 to count it in this period (more cautious; changes Left to spend) |
| 5 | Usual spending | **§5.4 rules: 28 calendar days; empty days = 0; reversed entries ignored; reconcile gaps spread over their own stretch; one-offs listed with "Count it"; confidence shown (Checked / Records only / Incomplete / Not enough history); no records-only figure when incomplete** | Median of daily totals; user-entered only |
| 6 | Cushion | **Buffer if set; else max(500, 10% of N)** | Buffer only; a fixed KSh 1,000 |
| 7 | Late or missing income | **Late status + Received / New date / Won't come; "Waiting for your pay" after a missed payday** | Do nothing until the user edits it |
| 8 | Late salary | **One-cycle "my pay is late"** | Edit the usual payday (affects later months) |
| 9 | Savings | **Never automatic; suggest a smaller set-aside; offer "use from goal" in Before You Spend** | Don't mention savings |
| 10 | Fuliza and auto-repaid loans | **Decide in DB-3**; until then, a warning only | Deduct the Fuliza balance now as a must-pay |
| 11 | Before You Spend actions | **Record / Not now / Save as planned** | Record / Not now |
| 12 | The 4 optional stored fields (§7) | **Approve** (additive, after D13) | None (fewer features) |
| 13 | Timing scenarios (§3) | **"If no money comes in" always shown, 30 days ahead, including payments after the expected payday; plus one "if it arrives" scenario per payment; same-day payments taken before income** | Look only until the next income (misses the late-salary case); 14 days ahead |
| 14 | Short vs Already short wording (§3) | **As drafted**: "the bills alone don't fit" vs "bills plus everyday spending don't fit"; to be checked in user testing | Other wording after testing |

**Reversible?**
- **Yes.** It is a read-only layer, and the optional fields are additive and ignorable.
- **Choices that touch an existing rule:**
  - choices 7 and 8 extend DEC-015's planning period;
  - choice 4's alternative would change which bills DEC-015 counts;
  - choice 2 removes an existing display line.

  All others add new rules without changing old ones.

## 9. Risks and limits (shown in the app under "How this is worked out")
- **It is only as good as the records.** Unrecorded spending makes it too optimistic, so it encourages regular balance checks (reconcile).
- **Usual spending is an average.** Real days vary (DEC-026). The cushion and Before You Spend exist for this.
- **Expected income may be late, smaller or never come.** That is why it is never counted.
- **It is guidance, not financial advice,** and it never blocks a payment.

## 10. Differences from the first design (`DB-5_WILL_I_MAKE_IT.md`)

**1. Irregular horizon** now never ends at an expected-payment date.
- **Why:** the model showed that this assumes the payment arrives.

**2. "Lowest point" replaced by runway and first payment at risk, in two labelled scenarios** (no income / if a payment arrives; owner's review, 25 Nov).
- With no expected income counted, the money only goes down. So the lowest point is always the end of the period, and the old timing view added nothing.
- The useful timing questions are:
  - which payment is first at risk;
  - how long the money lasts.

**3. The cushion uses the user's safety buffer when one is set,** instead of max(500, 10%) in every case.
- **Why:** the buffer was already deducted, so using a separate cushion as well counted it twice.

**4. New:**
- multiple income sources (§4.2);
- payday changes and missing income (§4.7);
- savings-plan messaging (§4.5);
- the "no combined expected total" recommendation.

**5. Dropped:** the "next income" flag.
- **Why:** no longer needed after change 1.
