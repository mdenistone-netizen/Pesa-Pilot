# 05 · Seven-Day Recording Trial (**voluntary**; for interviewees who agree)

**Why:** it answers "will people consistently record manually?" with **behaviour over time**. One interview can't.

**Privacy:**
- Participants use the preview on **their own phone**. **Everything they enter stays on their phone, and we never see it.**
- We learn only what they reply to one evening question, plus what they *choose* to show at the end.
- They may use real or rough numbers as they wish. We never ask for exact amounts.
- **WhatsApp replies are research information collected by the team**, handled as in `00_RESEARCH_DATA_NOTICE.md`.
- **No screenshots** are requested or accepted. If someone sends one, delete it immediately and remind them it isn't needed.
- **Voluntary:** participants can leave at any time, without a reason and without penalty. Everyone who starts receives the **same trial thank-you**, even if they leave early or record little.

## Version freeze (important)
- The usual preview address (`deploy-preview-1--…`) **changes code whenever the branch is updated**. During a trial that could change the app under a participant mid-week.
- **Use a fixed-version link instead:** Netlify gives every deploy its own permanent address. Claude will provide the exact link for the approved version before the first trial.
- Every participant uses that same link for the whole trial.
- Data entered on one address doesn't appear on another, so people must keep the same link.

## Setup (5 minutes, at the end of the interview)
1. Open the **fixed-version trial link** on their phone. Add it to the home screen if they want.
2. They enter their **approximate** current M-Pesa and cash balances (or skip).
3. Agree a check-in time (for example 8 pm).
4. Explain: "Record what you naturally would. **Don't try to impress us.** Skipping is useful information."

## Evening WhatsApp check-in (about 30 seconds to answer)
Sent by the interviewer from a dedicated study number. The same 3 questions every day:
1. "About how many payments or receipts did you **record** in PesaPilot today?" (0 / 1–2 / 3–5 / 6+)
2. "About how many did you **not** record?" (0 / 1–2 / 3–5 / 6+)
3. "If you skipped any, why? (Reply with a letter or your own words.)"
   - **a** forgot
   - **b** no time / busy
   - **c** too small to bother
   - **d** didn't know how to record it
   - **e** didn't want to (privacy, mood)
   - **f** phone or data problem
   - **g** other

**Day 4 only, extra:** "Did you check how much money was free to spend today? Did it change anything you did?"

## Day 7 call (10 minutes)
1. *(Only if they're comfortable:)* "On your Money screen, **how many entries** are there for this week? Just the number." They **read it out**; we never ask to see the screen or for a screenshot, and we record the number only. [DID]
2. "Which days did you record most and least? What was different about those days?" [DID]
3. "**When did you first skip?** What happened?" [DID]
4. "What did you do when you forgot something: add it later, reconcile, or ignore it?" [DID]
5. "Will you keep using it after today?" [SAYS]
   - **14-day follow-up (separate, optional):** one WhatsApp question a week later: "Did you record anything in PesaPilot in the last 3 days?" It's a **short-term retention observation only, not proof of long-term retention.** No extra payment, and no reminder if they don't reply.
6. Remind them how to delete everything (Settings → Delete all data) if they wish.

## What we measure

| Measure | Source | Meaning |
|---|---|---|
| **Recording consistency** | Days with ≥ 1 entry out of 7 (check-ins and day-7 count) | ≥ 5/7 = consistent; 2–4 = patchy; ≤ 1 = stopped |
| **Coverage** | recorded ÷ (recorded + not recorded) | Share of real transactions captured |
| **Drop-off day** | First day with 0 recorded | When habits break |
| **Stop reasons** | Q3 letters, counted | What to fix first |
| **Recovery behaviour** | Day-7 Q4 | Do people reconcile? (Tests whether the balance check-in idea fits real behaviour) |
| **14-day observation** | Separate follow-up | **Short-term indication only, not proof of long-term retention** (small sample, self-reported, prompted) |

**Trial thank-you:** the **same amount for everyone who starts the trial**, paid even if they withdraw early or record little. The amount is set by the owner (`08_BUDGET_FOR_REVIEW.md`).
