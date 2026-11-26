# 04 · Preview Test Script (about 15 minutes)

**Setup (before the session):**
- On the **test phone**, open the preview (`deploy-preview-1--pesa-pilot.netlify.app`).
- Import the demo data (`docs/demo/pesapilot-demo-schema9.json`). Set no PIN.
- Have a stopwatch ready (the phone clock or a second phone).
- **Reset the phone between participants** (Settings → Delete all data, then re-import the demo).
- **Use made-up numbers only.** Hand the participant the task cards below; never let them use their own phone or real details.

**For each task, record:**
- **time** (seconds, from "start" to saved);
- **errors** (wrong type, wrong account, wrong amount, abandoned);
- **hesitations** (pauses over 5 s, "where is…?");
- **help given** (none / hint / showed).

**Think-aloud instruction:** "Please say out loud what you're thinking as you go. If you get stuck, tell me what you're looking for. I'll only help if you ask."

---

## Part A · Manual recording (the core test)
Hand the cards one at a time, in this order. **Don't demonstrate first.**

| # | Task card (read aloud) | Correct result | Watch for |
|---|---|---|---|
| A1 | "You just paid **KSh 100 matatu fare in cash**. Record it." | Expense · KSh 100 · Transport · Cash | Finding "Expense"; choosing the Cash account; category |
| A2 | "You **received KSh 2,500** on M-Pesa from a customer. Record it." | Income · KSh 2,500 · M-Pesa | Income vs expense; account |
| A3 | "You bought **airtime for KSh 50** with M-Pesa. Record it." | Expense · KSh 50 · M-Pesa | Speed on the second expense (learning effect) |
| A4 | "You **took KSh 1,000 cash out at an M-Pesa agent**. The agent's **charge was KSh 29**. Record what happened." *(Don't use the words "transfer" or "expense".)* | **Two records:** (a) **transfer** of KSh 1,000 **from M-Pesa to Cash**, not spending and not income; (b) **expense** of KSh 29 from M-Pesa, category M-Pesa charges (or similar) | See **A4 check** below |
| A5 | "You **sent KSh 500 to your mother**. Record it." | Expense · 500 · M-Pesa (e.g. Family) | Category choice; time |

**A4 check (record each part separately on the scoring sheet):**
- **A4a, the withdrawal:** recorded as a *transfer* M-Pesa → Cash? Or wrongly as an *expense* (counted as spending), as *income* to Cash, or only one side?
- **A4b, the charge:** recorded as a *separate expense* of KSh 29 from M-Pesa? Or forgotten, or added into the 1,000 (KSh 1,029 transferred), or recorded as part of the transfer?
- **Result check** (look at the account cards after A4): M-Pesa down by 1,029; Cash up by 1,000; spending up by **only 29**.
- **Afterwards, ask:** "How did you decide how to record the KSh 1,000? And the KSh 29?" [SAYS]. This tells us whether wording or design caused any error.

**After A5:**
- "How did that feel? Which was hardest?" [SAYS]
- "**If you did this every day for a week, which of these would you actually record, and which would you skip?**" [SAYS: compare later with the 7-day trial]

## Part B · Checking what's free and finding the balance
| # | Task card | Correct result | Watch for |
|---|---|---|---|
| B1 | "How much money do you have **free to spend** right now?" | Reads "Available to spend" on Home | Do they read the right number, or the total? |
| B2 | "How much is in **M-Pesa** specifically?" | Money → M-Pesa card balance | Navigation |
| B3 | "Your real M-Pesa balance is **KSh 300 less** than the app shows: you forgot something. What would you do?" | Finds **Reconcile** (or edits). Any sensible attempt counts. | Do they look for "Reconcile"? Do they understand an "unrecorded spending" option? |

## Part C · Does it change a decision?
| # | Task card | Watch for |
|---|---|---|
| C1 | "You want to buy **shoes for KSh 2,500** today. Using the app, would you buy them?" | Do they use "Safe to spend today" or the Plan? **Do they change the decision?** Record yes/no + what they said |

*(Before You Spend and "Will I make it?" are **not built**. Don't show mock-ups of them in this round. C1 tests whether the current figures already guide a decision.)*

## Part D · Ideas to make recording easier (described on paper, not in the app)
Show each idea as a **short sentence on a card**. It is **not** a working feature. Ask **D0 before showing any card.**

- **D0:** "What, if anything, would have made the recording tasks easier for you?" [SAYS] (unprompted ideas first)

| Card | Idea (exact wording) | Then ask |
|---|---|---|
| D1 | "**Repeat & favourites:** tap 'Matatu 100' once instead of typing it." | "Which of today's tasks would this have helped with?" (ties it to observed behaviour) |
| D2 | "**Balance check-in:** once a day, type your real M-Pesa balance. If it differs from the app, the difference is saved as a clearly labelled **'unrecorded spending'** entry that you can see, trace and undo. The app **never makes up** what you bought." | "When would you do this? What would you want it to show you?" *Probe trust:* "Is it clear what the app did with the difference?" |
| D3 | "**Recurring entries:** salary, rent or chama appear on their date for you to confirm with one tap." | "Which of your payments would you set up like this?" |

**Rank:** "If only one of these existed, which would make you keep recording?" Record the ranking [SAYS] **and** whether it matches what slowed them down in Part A [OBS].

## Close (1 min)
- "Would you be willing to try the app on **your own phone for 7 days**, recording as much as you naturally would, with one short WhatsApp question each evening?" → if yes, give `05_RECORDING_TRIAL.md` instructions and read its consent.
- Thank them. Pay the thank-you.
