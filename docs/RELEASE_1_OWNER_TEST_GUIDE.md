# Release 1: Owner Testing Guide (Android phone)

**For:** the owner's own review of the Release 1 preview, **before** any decision to deploy.

**Preview:** **https://deploy-preview-1--pesa-pilot.netlify.app**
- Since DB-7 (CR-008, 26 Nov) the app is served from `app/`, with security headers. The app's code is unchanged from `5bdcb7b` (CR-007). The exact commit is given in Claude's latest report.
- Verified 26 Nov 2026.

**This is not production.**
- The preview is a different web address with its own empty storage. It **can't see or change** the live app or anyone's data.
- **Use made-up numbers only.** Never enter your real balances, and never import a backup from the live app.

**How these expectations were checked:** every expected figure below was produced by running these exact steps on the same code at phone width (390 px). The automated suites also pass. **Neither replaces your review.** If what you see differs, report it.

---

## Before you start (2 minutes)
1. **Open the preview in Chrome**, in a normal tab, not Incognito: Incognito wipes the data when you close it.
2. **If you've used the preview before:** More → Settings → **Delete all data**, then follow the prompts, so you start clean.
3. **How to report a problem:**
   - **Test number:** e.g. "T7".
   - **What you expected and what you saw:** copy the figures exactly.
   - **A screenshot:** on most Android phones, press Power + Volume down. Fake data only, so screenshots are safe to share.
   - **The time:** roughly.
4. **Figures:** expected figures are given as they appear on screen, e.g. "KSh 11,500". A difference of even KSh 1 is worth reporting.

**Where things are:**
- **Bottom bar:** Home · Money · Plan · Savings · **More**. More holds Bills, Debts, Reports and Settings.
- **Home quick buttons:** Expense · Income · Transfer · Save.

---

## Part A · Set up with simple numbers (financial accuracy)

### T1 · Welcome and PIN
- **Tap / enter:** on the welcome screen:
  - Your name: **Test**;
  - Create a PIN: **1234**;
  - Confirm PIN: **1234**.
- **Expect:** Home opens. Available to spend **KSh 0**, Set aside for goals **KSh 0**, Total money **KSh 0**.
- **Failure:** an error; the PIN is accepted when the two entries differ; Home shows anything other than 0.
- **Evidence:** a screenshot of Home.

### T2 · Opening balances and a savings account
- **Tap:** Money → on the **M-Pesa** card tap **Edit** → Opening balance **10000** → Save.
- **Tap:** on the **Cash** card, **Edit** → Opening balance **2000** → Save.
- **Tap:** **＋ Account** → Account name **M-Shwari** → Type **Savings (M-Shwari, SACCO, savings account)** → Opening balance **0** → Save.
- **Expect, on Money:**

| Account | Balance | Set aside | Available to spend |
|---|---|---|---|
| M-Pesa | KSh 10,000 | KSh 0 | KSh 10,000 |
| Cash | KSh 2,000 | KSh 0 | KSh 2,000 |
| M-Shwari | KSh 0 (labelled "Savings account · not counted in safe to spend") | KSh 0 | — |

- **Expect, on Home:** Available to spend **KSh 12,000** · Set aside for goals **KSh 0** · Total money **KSh 12,000**.
- **Failure:** any figure different; M-Shwari counted as spending money.
- **Evidence:** screenshots of Money and Home.

### T3 · An expense
- **Tap:** Home → **Expense** → Amount **500** → Category **Food** → Paid from **M-Pesa** → Description **Lunch (test)** → Save.
- **Expect:**
  - Money: M-Pesa balance **KSh 9,500**; Cash unchanged at **KSh 2,000**.
  - Home: Available to spend **KSh 11,500** · Total **KSh 11,500**.
  - This month: Money in **KSh 0**, Money out **KSh 500**.
- **Failure:** the wrong account reduced; the totals don't fall by exactly 500.

### T4 · Income
- **Tap:** Home → **Income** → Amount **3000** → Category **Income** → Received into **Cash** → Save.
- **Expect:**
  - Cash **KSh 5,000**.
  - Home: Available to spend **KSh 14,500** · Total **KSh 14,500**.
  - This month: Money in **KSh 3,000**, Money out **KSh 500**.
- **Failure:** the income goes into the wrong account; the totals are wrong.

### T5 · Transfer (not spending, not income)
- **Tap:** Home → **Transfer** → Amount **1000** → From **M-Pesa** → To **Cash** → "Is this money for a goal?" **No, just moving money** → Note **Withdrawal (test)** → Save.
- **Expect:**
  - M-Pesa **KSh 8,500**, Cash **KSh 6,000**.
  - Home: Available to spend **still KSh 14,500**, Total **still KSh 14,500**.
  - This month: **still** Money in KSh 3,000 / Money out KSh 500.
- **Failure:** the total changes; the transfer appears as income or spending in "This month".

### T6 · Savings goal: set aside (CR-007 savings correction)
- **Tap:** Savings → **＋ New goal** → Goal name **School fees** → Target amount **20000**. Leave the other fields empty → Save.
- **Tap:** on the goal, **Set aside** → From money in **M-Pesa** → Amount **3000** → Save.
- **Expect:**
  - **Money, M-Pesa card:** Balance **KSh 8,500** (unchanged), Set aside **KSh 3,000**, Available to spend **KSh 5,500**.
  - **Home:** Available to spend **KSh 11,500** (down 3,000) · Set aside for goals **KSh 3,000** · Total money **KSh 14,500** (unchanged).
  - **Savings:** saved **KSh 3,000**, remaining **KSh 17,000**.
- **Failure:**
  - Available to spend doesn't fall by 3,000 (this was your original savings concern);
  - the M-Pesa *balance* falls (setting aside isn't spending);
  - the total changes.
- **Evidence:** screenshots of Money and Home.

### T7 · Can't set aside more than is free
- **Tap:** Savings → School fees → **Set aside** → M-Pesa → Amount **9000** → Save.
- **Expect:** refused with "**Only KSh 5,500 in M-Pesa is not already set aside.**" The form stays open and nothing changes. Close it.
- **Failure:** it's accepted, or any figure changes.

### T8 · Move goal money to M-Shwari
- **Tap:** Savings → School fees → **Move money** → Amount **2000** → From **M-Pesa** → To **M-Shwari** → "Is this money for a goal?" **Yes: School fees** → Save.
- **Expect:**
  - **Money:**
    - M-Pesa balance **KSh 6,500**, Set aside **KSh 1,000**, Available **KSh 5,500**;
    - M-Shwari balance **KSh 2,000**, Set aside **KSh 2,000**.
  - **Home:** Available to spend **KSh 11,500** (unchanged) · **Set aside for goals KSh 1,000** · Total **KSh 14,500**.
  - **Savings:** saved **KSh 3,000**: **KSh 1,000** in spending accounts + **KSh 2,000** held in savings accounts.
- **Failure:** the total changes; Available to spend changes; the goal no longer shows 3,000 saved.
- **Please judge:** Home's "Set aside for goals" now shows **1,000**, not 3,000. It counts only money held back *inside spending accounts*; the 2,000 in M-Shwari is shown on Savings and included in the total. **Is that clear to you?**

### T9 · Use money from the goal
- **Tap:** Savings → School fees → **Use money** → Amount used **500** → Paid from **M-Pesa** → Take from savings held in **M-Pesa** → Category **Education** → Save.
- **Expect:**
  - Toast "KSh 500 spent from School fees".
  - **Money:** M-Pesa balance **KSh 6,000**, Set aside **KSh 500**, Available **KSh 5,500**.
  - **Home:** Available to spend **KSh 11,500** (unchanged: the money spent was already set aside) · Set aside **KSh 500** · Total **KSh 14,000** · Money out **KSh 1,000**.
  - **Savings:** saved **KSh 2,500**, used **KSh 500**.
- **Failure:** Available to spend falls (that would count the money twice); the goal doesn't fall by 500.

### T10 · Release goal money
- **Tap:** Savings → School fees → **Release** → Money held in **M-Pesa** → Amount **500** → Save.
- **Expect:**
  - Toast "KSh 500 released from School fees".
  - **Home:** Available to spend **KSh 12,000** · Set aside **KSh 0** · Total **KSh 14,000** (unchanged).
  - **Savings:** saved **KSh 2,000** (all in M-Shwari).
- **Failure:** the total changes; release shows as income.

### T11 · Reconcile (check against the real balance) and reverse
- **Tap:** Money → **Cash** card → **Reconcile** → Actual balance **5800** → Reason **Counted my cash (test)**.
  - **Watch the message:** "Difference −KSh 200. It will be recorded as a balance adjustment: not income or spending."
- **Tap:** tick **"I spent the difference and didn't record it: count it as spending"**.
  - The message should change to "**…It will be recorded as unrecorded spending.**"
- **Tap:** Save.
- **Expect:**
  - Cash **KSh 5,800**, marked "Reconciled …".
  - Home: Available to spend **KSh 11,800**, Total **KSh 13,800**, Money out **KSh 1,200**.
  - Money's list shows a "**Counted my cash (test) · Unrecorded spending −KSh 200**" entry with a **Reverse** button.
- **Tap:** **Reverse** on that entry → confirm the message ("…Both entries stay in your history and cancel each other out.").
- **Expect:**
  - Cash back to **KSh 6,000**.
  - Home: Available **KSh 12,000**, Total **KSh 14,000**, Money out **KSh 1,000**.
  - **Both entries still visible** in the history. Cash card → **History** shows the reconcile with its status.
- **Failure:** the message doesn't change when ticked; figures are wrong; an entry disappears instead of being reversed.

### T12 · Safe to spend (planning)
- **Tap:** Plan → **Edit plan** → How are you paid? **Irregularly (business, freelance, casual work)** → Planning period **1 week** → Minimum buffer **1000** → Planned extra spending **0** → Save.
  - Irregular makes the result the same whatever today's date is.
- **Tap:** More → Bills → **＋ Add bill** → Bill name **Rent (test)** → Amount **3000** → Usual payment date **3 days from today** → Frequency **Monthly** → Category **Housing** → Save.
- **Expect, on Plan:**

| Line | Expected |
|---|---|
| Period | For the next 7 days |
| Spending money | KSh 12,000 |
| Bills | −KSh 3,000 |
| Buffer | −KSh 1,000 |
| Left after commitments | KSh 8,000 |
| **Safe to spend a day** | **KSh 1,143** (8,000 ÷ 7) |

- **Expect, on Home:** Safe to spend today **KSh 1,143**.
- **Failure:** any line is different; M-Shwari's 2,000 is counted; the goal money is counted.
- **Evidence:** a screenshot of Plan.

### T13 · Expected income is not counted until it arrives
- **Tap:** Plan → **＋ Expected income** → From **Client (test)** → Amount **5000** → Expected date **2 days from today** → Will arrive in **M-Pesa** → Save.
- **Expect:**
  - Safe to spend **still KSh 1,143**.
  - A separate line: "**If expected income arrives: KSh 1,857 a day.**" ((8,000 + 5,000) ÷ 7)
- **Tap:** on that expected income, tap **Received** → Amount actually received **5000** → Received into **M-Pesa** → Save.
- **Expect:**
  - Toast "…recorded as income".
  - M-Pesa **KSh 11,000**.
  - Home: Available **KSh 17,000**, Total **KSh 19,000**, Money in **KSh 8,000**.
  - Safe to spend **KSh 1,857**.
- **Failure:** the expected money is counted before it's received; the received money goes to the wrong account.

---

## Part B · Security, backup and restore

### T14 · Backup
- **Tap:** More → Settings → **Download backup**. Let Chrome save the file.
- **Expect:**
  - The "Backup needed" reminder changes to "**Last backup: today**".
  - A `.json` file appears in Downloads.
  - The screen says backups never contain your PIN and are **not encrypted**.
- **Failure:** no file; the reminder doesn't change.

### T15 · Restore the backup
- **Tap:** Home → **Expense** → **100**, Food, from **Cash** → Save. Available becomes **KSh 16,900**.
- **Tap:** More → Settings → **Import backup** → choose the file from T14 → confirm "Import this backup? Your current data will be saved as a safety backup first, then replaced."
- **Expect:**
  - The app reloads, the 100 expense is **gone**, and everything matches T13's end: Available **KSh 17,000**, Total **KSh 19,000**, Safe to spend **KSh 1,857**.
  - **Your PIN still works** (it isn't in the backup; the phone keeps its own).
- **Failure:** any figure differs from T13's end; goals, bills or history missing; the PIN changed or disappeared.

### T16 · PIN lock
- **Tap:** close the Chrome tab completely and reopen the preview link.
- **Expect:** "**PesaPilot is locked**".
- **Tap:** enter **9999** five times.
- **Expect:**
  - "Incorrect PIN" each time;
  - after the 5th: "**Too many attempts. Try again in 30 seconds.**";
  - during that wait, even **1234** is refused.
- **Tap:** after 30 seconds, enter **1234**.
- **Expect:** it unlocks; your data is intact.
- **Tap:** More → Settings → **Change PIN** → Current PIN **1234** → New PIN **2468** → Confirm new PIN **2468** → Save. Close and reopen the tab, then unlock with **2468**.
- **Expect:** it unlocks with 2468; 1234 no longer works.
- **Failure:** the app opens without the PIN; an old PIN still works; no slow-down after repeated wrong PINs.

---

## Part C · Upgrade of older data (the demo file)
This uses made-up data in the **old** format, as stored by today's live app, so it exercises the upgrade. **It replaces your test data,** so do it last.

### T17 · Import the demo data
- **Get the file:** I'll send `pesapilot-demo-schema9.json` to you in the chat. Save it to your phone (Downloads).
  - Since DB-7 the preview no longer publishes `/docs/`. That address now correctly shows "Not found".
- **Tap:** back in the preview: More → Settings → **Import backup** → choose `pesapilot-demo-schema9.json` → confirm.
- **Expect, on Home:** Available to spend **KSh 58,259** · Set aside for goals **KSh 3,000** · Total money **KSh 73,259**.
  - Safe to spend depends on today's date and the demo's payday (the 28th), so it isn't a pass/fail figure here.
- **Expect, on Money:**

| Account | Balance | Note |
|---|---|---|
| M-Pesa | KSh 86,142 | Set aside 3,000, available 83,142 |
| Cash | **−KSh 10,883** | "Below zero: reconcile with the real balance." |
| Other / unassigned | **−KSh 14,000** | "Below zero: reconcile with the real balance." |
| Savings (before accounts) | KSh 12,000 | All set aside for goals |

  Plus the banner "**Some accounts are below zero.**"
- **Why some balances are below zero (expected):** old entries didn't record which account they used, so they are placed by payment method. Goal and debt entries go to "Other / unassigned" rather than guessing (DEC-013). Reconcile fixes them.
- **Expect:** goals **Emergency fund** (target 60,000) and **New phone** (25,000); debts **Fuliza** and **Loan from Otieno**.
- **Try:**
  - Reconcile Cash to an amount you choose: the warning for Cash should disappear.
  - Debts: "Loan from Otieno" shows "No repayment plan".
- **Failure:** the import is refused; the figures differ from the above; goals or debts missing.

---

## Part D · Look and feel (your judgement)

### T18 · Design and layout
- **Check:**
  - every screen fits your phone with **no sideways scrolling**;
  - text is readable, and buttons are easy to tap;
  - the bottom bar and **More** work.
- **Dark mode:** More → Settings → Appearance → **Dark**. Recheck Home and Money, then set it back to "Match my phone".
- **Tell me:**
  - anything confusing, slow or wrong-looking;
  - whether each screen is clear without explanation.

### T19 (optional) · Forgot PIN
- **Tap:** lock screen → **Forgot your PIN?**, and follow the steps.
- **Expect:** it **downloads a backup first**, then resets *this preview*, lets you set a new PIN, and you can import that backup.
- **Only on the preview.** It wipes the preview's test data, which is fine.

---

## Known limitations to keep in mind while testing (not failures)

| Item | What you'll notice |
|---|---|
| **D9** | Settings → "Install app" says install isn't available (no PWA yet; DB-6 is a later stage) |
| **D3** | No "money owed to me" yet |
| **D14** | Planned extra spending isn't reduced when you record the expense; lower it yourself (fix approved for later) |
| **Pre-accounts copy** | Settings shows "Download pre-accounts copy" only when data **already on the phone** upgrades on opening, as will happen on the live app. **Importing** a file (T17) doesn't create it. That path is covered by automated migration tests and by the post-deployment check (RELEASE_1_CHECKLIST §7). |
| **Backups** | Not encrypted (protected backups are DB-4, later) |
| **Safe to spend on a fixed payday** | Changes with the date (days left until payday). T12 uses "Irregularly" so your result matches |
| **Home "Set aside for goals"** | Counts only money held back in spending accounts (see T8) |

**What you can't test on the preview** (covered by automated tests, plus checks after deployment):
- the automatic upgrade of data already stored on users' phones;
- the rollback build;
- old tabs during deployment (R1).

---

## When you've finished
Send me, for example: "T1–T18 done; T8 unclear; T12 showed …; screenshots attached".
- **I'll investigate anything you report** using made-up data, and fix and re-verify on the branch.
- **Nothing is deployed** until you've reviewed the preview and explicitly approved (DEC-018).

---

## DB-7 preview checks (CR-008; about 5 minutes)
These confirm on the **real** Netlify preview that only the app is published.

**1. These addresses must show Netlify's "Page not found":**
- https://deploy-preview-1--pesa-pilot.netlify.app/docs/RELEASE_1_CHECKLIST.md
- https://deploy-preview-1--pesa-pilot.netlify.app/docs/demo/pesapilot-demo-schema9.json
- https://deploy-preview-1--pesa-pilot.netlify.app/docs/prototypes/onboarding/
- https://deploy-preview-1--pesa-pilot.netlify.app/tests/run.js
- https://deploy-preview-1--pesa-pilot.netlify.app/CLAUDE.md
- https://deploy-preview-1--pesa-pilot.netlify.app/package.json
- https://deploy-preview-1--pesa-pilot.netlify.app/netlify.toml
- https://deploy-preview-1--pesa-pilot.netlify.app/release/rollback/README.md
- https://deploy-preview-1--pesa-pilot.netlify.app/app/index.html

  **Failure:** any of them shows text, a file or a download.

**2. The app must still open normally:**
- https://deploy-preview-1--pesa-pilot.netlify.app/ shows PesaPilot with its normal font and layout.

**3. Security headers** (optional, your choice of tool):
- On a free header-checking website (for example securityheaders.com), enter `https://deploy-preview-1--pesa-pilot.netlify.app`.
- It should list: **Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-Frame-Options** and **Cross-Origin-Opener-Policy**.
- The preview address is already public, and the check sends nothing about your data.
- A screenshot of the result is enough.

**4. A short app check:** T1–T6 and T14–T16 above. The figures must be the same as before DB-7.
- **Note:** the preview is a new deployment, but it has the **same web address**, so any test data you entered earlier is still there. Use More → Settings → Delete all data first if you want a clean start.
