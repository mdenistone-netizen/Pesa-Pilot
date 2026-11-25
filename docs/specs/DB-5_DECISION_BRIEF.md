# DB-5 Decision Brief: "Will I make it to my next income?" + Before You Spend

**Status:** **Proposed, for owner decision.** Planning only. Nothing is implemented, and no financial rule changes until you approve.

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

### 5.4 Usual spending estimate (D)
- **Recommended:** the average of the last 28 days of **expense entries**, excluding:
  - bill payments (already in must-pay);
  - money used from savings goals;
  - unrecorded-spending adjustments;
  - single expenses over 3× the median (one-offs).
- **With under 7 days of records,** ask: "About how much do you spend on a normal day?"
- **The user can override it,** with an end date.
- **Always shown** with "based on the last 4 weeks" or "your estimate".

### 5.5 Cushion
The safety buffer if set; otherwise max(KSh 500, 10% of N).

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
  3. an expected-income "cancelled" status, kept in history.

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
| 5 | Usual spending | **28-day average with exclusions, plus override** | Median of daily totals; user-entered only |
| 6 | Cushion | **Buffer if set; else max(500, 10% of N)** | Buffer only; a fixed KSh 1,000 |
| 7 | Late or missing income | **Late status + Received / New date / Won't come; "Waiting for your pay" after a missed payday** | Do nothing until the user edits it |
| 8 | Late salary | **One-cycle "my pay is late"** | Edit the usual payday (affects later months) |
| 9 | Savings | **Never automatic; suggest a smaller set-aside; offer "use from goal" in Before You Spend** | Don't mention savings |
| 10 | Fuliza and auto-repaid loans | **Decide in DB-3**; until then, a warning only | Deduct the Fuliza balance now as a must-pay |
| 11 | Before You Spend actions | **Record / Not now / Save as planned** | Record / Not now |
| 12 | The 3 optional stored fields (§7) | **Approve** (additive, after D13) | None (fewer features) |
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
