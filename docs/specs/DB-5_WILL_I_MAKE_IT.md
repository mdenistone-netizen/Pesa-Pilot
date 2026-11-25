# P3 · DB-5: "Will I make it to my next income?" + "Before You Spend"

**Status:** decision brief and design (planning only, DEC-023). Building it needs **owner approval of the rules in §4 and the choices in §9**. It is a new *read-only* calculation: it would change no stored balances, transactions or existing rules.

## 1. The decision
How should PesaPilot answer two everyday questions?
1. **"Will I make it to my next income?"**
2. **"Before You Spend: can I afford this, and what does it do to the rest of my period?"**

**Why it matters:**
- These questions are the moment the product promise ("know what's truly free") meets a real decision.
- A wrong or over-optimistic answer could push someone into Fuliza.
- So the rules must be conservative, transparent and honest about uncertainty.

## 2. The non-negotiable rule
> **Expected income is never treated as money you have.**

- Every verdict is calculated from **actual money only**.
- Expected income appears **only** in a separate, clearly labelled "if it arrives" line, and **never changes the main verdict**.
- Late expected income stays excluded and is shown as late.

## 3. Three separate inputs, always shown separately

| Input | Source (existing engine) | Shown to the user as |
|---|---|---|
| **A. Money you actually have, free to use** | Available in spending accounts = balance − set aside (FINANCIAL_RULES §3; `planner().spendable`) | "You have KSh X free to use now" |
| **B. What must be paid before your next income** | Bills due, debt instalments, savings plan still to set aside, planned spending, safety buffer (FINANCIAL_RULES §6; same items, counted once) | "KSh Y is already needed for: rent KSh…, KCB loan KSh…" |
| **C. Money you expect** | Expected income items (status "expected") | "You're expecting KSh Z (not counted)" |

**Plus one estimate**, labelled as an estimate:

| | Source | Shown as |
|---|---|---|
| **D. Your usual day-to-day spending** | The average of the last 28 days of day-to-day spending (§4.3) | "You usually spend about KSh W a day (based on the last 4 weeks)", editable |

## 4. Proposed calculations

### 4.1 Horizon: "until your next income"
- **Fixed payday:** until the day before payday (same as today's plan).
- **Irregular income:**
  - Recommended: until the **date of the next expected income the user marks as their "next income"**.
  - If they haven't marked one, until the end of their planning period (7, 14 or 30 days).
- The screen **always states the horizon**: "Until Sat 28 Nov (3 days)".

### 4.2 Will I make it?
- **Free after commitments:** F = A − B. This equals today's "Left to spend".
- **Needed for usual spending:** N = D × days remaining (rounded to the shilling).
- **Margin:** M = F − N.

| Verdict | Condition | Message (draft) |
|---|---|---|
| **On track** | M ≥ buffer cushion¹ | "Yes: at your usual spending you'll have about KSh M left on 28 Nov." |
| **Tight** | 0 ≤ M < cushion | "Just: about KSh M to spare. A small extra cost could leave you short." |
| **Short** | M < 0 | "Not at your usual spending: you'd be about KSh \|M\| short by 28 Nov." |
| **Already short** | F < 0 | "What's due before 28 Nov is more than the money you have, by KSh \|F\|." |

¹ **Cushion:** recommended as the larger of KSh 500 or 10% of N. It's a design choice (§9).

**The separate "if it arrives" line** (only when expected income falls within the horizon):
> "If the KSh 20,000 from the client arrives by 27 Nov, you'd have about KSh M + 20,000 to spare. This is not counted above."

### 4.3 Estimating usual daily spending (D)
- **Recommended:** the average over the **last 28 days** of **expense** entries, **excluding**:
  - bill payments (already in B);
  - money used from savings goals (planned use of saved money);
  - unrecorded-spending reconciliation entries;
  - single expenses above 3× the median expense (one-offs such as a phone purchase).
- Transfers, savings, debt repayments and borrowing are never spending anyway.
- **With fewer than 7 days of history:** ask "About how much do you spend on a normal day?" and use that until there's enough data.
- **The user can always override D** ("I'll spend about KSh 600 a day this week"). This would be stored as an optional `profile.dailySpendOverride`, with an end date.

### 4.4 Day-by-day dips (timing)
- Even when the end-of-period answer is fine, a bill can fall due **before** money comes in.
- A simple day-by-day run of A, minus each commitment on its due date, minus D a day, shows the **lowest point and its date**: "Your lowest point is about KSh 300 on 27 Nov, the day rent is due."
- Expected income is again excluded from this run. It is only shown as the "if it arrives" variant.

### 4.5 Before You Spend
**Input:** amount X, paid from account (default: main spending account), optionally a category. **Output, without recording anything:**
1. **Can you pay it now?**
   - Compare X with that account's *available to spend*.
   - Warn if X would use money set aside for goals (as `confirmOutflow` does today), or exceed the recorded balance.
2. **Effect on your period:**
   - Safe to spend falls from S to S′ a day, where S′ = (F − X) ÷ days.
   - The **Will I make it?** verdict is shown before and after.
3. **Plain recommendation, never a block:**
   - "You can afford this and stay on track."
   - "This makes the rest of the week tight."
   - "This would leave you KSh … short of what's due by 28 Nov."
4. **Actions:**
   - **"Record this expense"** opens the normal expense form pre-filled.
   - **"Not now"** records nothing.
   - **Optional:** "Save it as planned spending" adds X to planned spending.

## 5. Worked examples (these become tests)
Clock: Wed 25 Nov 2026. Payday Sat 28 Nov, so 3 days.

| Case | A free | B due | F | D/day | N | M | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | 9,000 | 1,500 | 7,500 | 1,200 | 3,600 | **3,900** | On track (cushion = max(500, 360) = 500) |
| 2 | 5,000 | 1,500 | 3,500 | 1,000 | 3,000 | **500** | **On track**: 500 ≥ cushion 500 (borderline) |
| 3 | 4,500 | 1,500 | 3,000 | 1,000 | 3,000 | **0** | Tight |
| 4 | 3,000 | 1,500 | 1,500 | 1,000 | 3,000 | **−1,500** | Short. With KSh 2,000 expected on 27 Nov: "if it arrives, KSh 500 to spare" (not counted) |
| 5 | 1,000 | 1,500 | **−500** | — | — | — | Already short |

**Before You Spend on case 1, X = 2,500:**
- F′ = 5,000. Safe to spend falls from 2,500 to 1,667 a day. M′ = 5,000 − 3,600 = **1,400** → still on track.
- With X = 4,500: M′ = −600 → "would leave you about KSh 600 short".

## 6. Assumptions and limitations (shown in the app under "How this is worked out")
- **Based only on what you've recorded.** Unrecorded spending makes the answer too optimistic, so reconcile your accounts regularly.
- **Usual spending is an average.** Real days vary. Big one-offs are left out of the average, so add known ones as planned spending.
- **Expected income may be late or smaller.** That's why it's never counted.
- **Fuliza can let M-Pesa go below zero.** PesaPilot doesn't count Fuliza as your money.
- **Savings accounts are not counted** unless you mark them as spending money.
- **This is guidance, not financial advice.** PesaPilot never blocks a payment.

## 7. What stays unchanged
- No change to balances, transactions, classification, set-asides or existing safe-to-spend rules.
- F is exactly today's "Left to spend". This feature adds the usual-spending estimate, the verdict, the timing view and the Before You Spend preview.
- **The only new stored data (optional):** `profile.dailySpendOverride` (with an end date), and a "this is my next income" flag on one expected-income item.

## 8. Testing (when built)
- Golden tests for the cases in §5 and the Before You Spend examples. Expected values are worked out independently in each test.
- Property tests: expected income **never** changes the main verdict; adding a commitment never improves the verdict; using set-aside money always warns.
- Timing tests: a bill due before payday creates the lowest point on its due date.
- The full regression, migration and engine fingerprint suites. Existing engine functions stay unchanged; new functions only.

## 9. Choices for the owner (DB-5)

| # | Choice | Recommendation | Alternatives |
|---|---|---|---|
| 1 | Approve the **three-input rule** and "expected income never counted" | Yes | — |
| 2 | **Irregular horizon** | The next income date the user marks; otherwise the planning period | Always the planning period (simpler, less personal) |
| 3 | **Usual spending estimate** | 28-day average, excluding bills, goal use, reconciliation entries and outliers; user override | Median of daily totals (more robust, harder to explain); user-entered only |
| 4 | **"Tight" cushion** | max(KSh 500, 10% of N) | Use the safety buffer only; a fixed KSh 1,000 |
| 5 | **Before You Spend actions** | Record / Not now / Save as planned | Record / Not now only |
| 6 | Optional new stored fields | `dailySpendOverride`, "next income" flag | None (no overrides) |

**Reversible?** Yes. It's a read-only calculation with two optional settings, and it can be changed or removed without touching any financial records.
