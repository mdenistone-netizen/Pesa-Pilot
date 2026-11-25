# P1 · Progressive First-Time Setup: design

**Status:** design only (DEC-023). Building it is **Stage A** and needs the owner's review of this design (and of a mock). It uses **existing features only** (opening balances, plan settings, bills, debts, goals, expected income) and changes **no financial rules**.

## 1. Goal and principles
- **Value in under 2 minutes:** two questions, then a real answer: *"You have KSh X free to use: about KSh Y a day until your next income."*
- **Progressive:** everything beyond those two questions is a **checklist of small, optional steps** on Home. Each takes under a minute and can be done today, tomorrow or never.
- **No long questionnaire.** No step is required except the essentials the app genuinely needs.
- **Real numbers, not history.** New users start from *what they hold now* (opening balances), not by typing past transactions.
- **Existing users are never pushed through setup.** They only see checklist items for things they haven't set up.

## 2. Today's first run (baseline)
- The welcome step asks for a name and a **required** PIN.
- The user then lands on Home with M-Pesa and Cash at KSh 0 and an empty plan.
- Nothing tells them to enter what they actually hold, so "Available to spend" and "Safe to spend" start at zero and look broken.

## 3. Proposed flow

### Step 1 · Welcome (about 20 seconds)
- "PesaPilot shows how much of your money is truly free, so you don't run out before the next money comes. Your records stay on this phone."
- **First name** (optional; used for the greeting).
- **Protect with a PIN:** recommended, with "Set PIN" or "Later". See decision §7.1. Today the PIN is mandatory.

### Step 2 · What do you have right now? (about 40 seconds)
- **M-Pesa balance now:** one number. Hint: "Dial \*334# or check your last M-Pesa message."
- **Cash in your pocket or at home:** optional ("skip").
- **"I also have a bank / M-Shwari / SACCO account"** adds a row (name, type, balance). Optional.
- **Mechanics (existing rule):** each becomes the account's **opening balance dated today**. Earlier history is "already included" (FINANCIAL_RULES §1). Nothing new.

### Step 3 · When does your next money come? (about 30 seconds)
- **"On a fixed day each month"** → payday (day of month).
- **"It varies (business, casual work, freelance)"** → plan for 1 week / 2 weeks / 1 month (default 1 week for daily earners, 2 weeks otherwise). Optional: "Are you expecting a specific payment? Amount, date" → expected income (never counted, DB-5).
- **Mechanics:** existing `incomePattern`, `paydayDay`, `planningDays` and expected income.

### The first answer (immediately)
> **"You have KSh 6,200 free to use. That's about KSh 2,066 a day until Fri 28 Nov."**
> "This doesn't yet include rent, loans or other bills. Add them so PesaPilot can protect that money." → [Add a bill] [Later]

### Then: the Home "Finish setting up" checklist (progressive, dismissible)

| Item | What it asks | Why | Existing feature used |
|---|---|---|---|
| ☐ Your big regular payments | Rent, school fees, chama contribution, KPLC… (name, amount, due day) | Protects that money in safe to spend | Bills |
| ☐ Loans you're repaying | Fuliza, M-Shwari, KCB M-Pesa, a friend: amount left, monthly plan | Protects repayments; shows progress | Debts |
| ☐ Something you're saving for | Emergency fund, school fees… and set aside money now (optional) | Stops that money looking spendable | Goals + set aside |
| ☐ A safety buffer | "Always keep at least KSh ___ untouched" | Conservative plan | Plan buffer |
| ☐ Your income sources | Salary, business, side jobs (as income categories); expected payments | Clearer reports; "will I make it?" | Categories, expected income |
| ☐ Back up your records | Download a backup and keep a copy off the phone | Protection against a lost phone | Backup |

- **The checklist shows progress** ("3 of 6 done"), disappears when complete, and can be hidden ("I'll do this later").
- **Gentle nudges, never blocking:** one suggestion at a time, in context. For example, after the first expense: "Is this something you pay every month? Make it a bill."

## 4. Wording and tone
- **Plain words:** "money you have", "free to use", "set aside", "next money". Avoid "allocation", "reconciliation" and "liability" on screen.
- **Short sentences, one question per screen,** a big number keypad and quick-pick chips for common items:
  - bills: Rent, KPLC tokens, Water, School fees, Chama, Internet;
  - loans: Fuliza, M-Shwari, KCB M-Pesa, Hustler Fund, Friend/family.
- Kiswahili can follow once the English wording is tested (P4 interviews).

## 5. Edge cases
- **Negative or unknown M-Pesa balance (Fuliza in use):** allow 0 with "I'm using Fuliza right now → how much do you owe?" That becomes a debt, after DB-3; until then, a plain note.
- **Skips everything:** Home shows an empty-state card ("Tell us what you have to see what's free"), not zeros dressed up as real.
- **Imports a backup on first run:** skip setup entirely.
- **Existing users after the upgrade:** no setup screens. The checklist shows only the missing items, and if their accounts are below zero, "Check your balances (Reconcile)".

## 6. Success measures (to check in the P4 beta)
- **Time to the first answer:** median under 2 minutes.
- **Share reaching the first answer:** at least 80% of new users.
- **Checklist:** at least 50% add at least one bill or loan in the first week.
- **Early drop-off:** fewer than 30% abandon during steps 1–3.

## 7. Choices for the owner
1. **PIN at first run.**
   - Recommended: **"Set PIN" or "Later"** (strongly recommended, remindered in the checklist).
   - Today it is mandatory. Making it optional is a **security policy change** (DEC-019 area), so it is your decision.
   - Alternative: keep it mandatory.
2. **Default planning period for "it varies":** 1 week (recommended for daily earners) or 2 weeks.
3. **Opening balances only, no history import at setup.** Recommended; M-Pesa history arrives later through capture (P2).
4. **Mock review:** I'd build a clickable mock **in the preview only, behind a developer flag that real users can't see**, before Stage A. This needs your go-ahead, since it touches code even though nothing goes live.
