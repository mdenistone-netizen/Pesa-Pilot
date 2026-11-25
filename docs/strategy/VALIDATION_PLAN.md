# P4 · Customer Validation Plan

**Purpose:** find out, with evidence of behaviour, whether ordinary Kenyans (1) have the problem PesaPilot wants to own, (2) would change how they manage money with PesaPilot, and (3) would genuinely pay.
**Status:** design only (approved as planning work, DEC-023). Collecting money for pre-orders needs a separate owner go-ahead (§6.4).

---

## 1. What we are testing

| # | Hypothesis | What would **support** it (behaviour) | What would **refute** it |
|---|---|---|---|
| H1 | People regularly don't know how much of their money is free, and run out before the next money comes | They describe a *specific recent* time they ran out, Fuliza'd or borrowed to bridge a gap | They can't recall a recent shortfall, or say it's rare and minor |
| H2 | Current coping methods are costly or stressful | Real costs: Fuliza fees, late penalties, borrowing from family, skipped needs | Existing methods (notebook, M-Pesa app, discipline) work fine for them |
| H3 | Seeing "truly free money" and "Will I make it?" changes decisions | In the prototype, they change a spending choice, or ask to keep using it | Polite interest only; no change in what they'd do |
| H4 | People will keep recording manually if it is quick (DEC-024: no M-Pesa capture) | They keep entering during the beta; they use quick entry (repeat, favourites); daily balance check-ins | They stop recording within a week despite quick entry |
| H5 | Some will pay KSh 99–199 a month, or a one-off unlock | They **commit something of value**: time, introductions, a refundable pre-payment | Praise without commitment ("I'd definitely pay…" but no action) |

---

## 2. Who we talk to (24 interviews)
Quotas make sure we hear from **ordinary Kenyans**, not only salaried professionals or budgeting-app users.

### 2.1 Primary income pattern (each person counts once)

| Group | Count | Examples |
|---|---|---|
| Casual and daily earners | 5 | Boda boda rider, mjengo worker, mama mboga, house help, market porter |
| Freelancers and gig workers | 4 | Designer, ride-hailing driver, tutor, content creator |
| Small business owners | 5 | Kiosk, salon or barber, M-Pesa agent, tailor, online seller |
| Salaried (often with side income) | 5 | Teacher, nurse, clerk, junior professional |
| Young parents / young families | 5 | Any income type, with children in school |

### 2.2 Overlapping characteristics (minimum counts across the 24)

| Characteristic | Minimum |
|---|---|
| Regularly supports extended family | 10 |
| Used Fuliza or a loan app in the last 3 months | 10 |
| Active chama or SACCO member | 10 |
| **Does not currently track money in any written or app form** | **12** |
| Already uses a budgeting or tracking app | 3 (not more than 6) |
| Women | 12 |
| Outside Nairobi (one peri-urban town, one rural or smaller town) | 8 |
| Prefers Swahili or Sheng in conversation | Interview in their language |

### 2.3 Recruiting
- **Channels:** chama and SACCO meetings (with the chair's permission), church or community groups, boda stages, markets, WhatsApp community groups, referrals from interviewees.
- **No more than 5 people from the owner's own close circle.** Friends are kind, and kindness ruins evidence.
- **Screener** (2 minutes):
  - main source of income;
  - phone type (Android or not);
  - M-Pesa use;
  - Fuliza or loan use in the last 3 months;
  - chama/SACCO membership;
  - how they keep track of money today;
  - family support.
- **Thank-you:** KSh 300–500 airtime or M-Pesa, the same for everyone, paid **regardless of what they say**. It's paid for their time, never conditional on liking the product.
- **Budget estimate:** 24 × KSh 400 ≈ **KSh 9,600**, plus transport for in-person sessions.

---

## 3. Consent, privacy and ethics
- **Verbal consent script** (§8.2). People can skip any question or stop at any time.
- **Never collect** PINs, M-Pesa statements, ID numbers or real account balances in writing. Talk about patterns and recent examples, not exact private figures.
- **Notes:** use a participant code (P01…), with no names in notes. Record audio only with explicit consent, and delete it after notes are written.
- **Store interview notes outside the public GitHub repository.** Only the anonymised summary goes into the repo.
- **Don't give financial advice** during interviews. If someone is in obvious debt distress, share neutral information (for example, how to check a Fuliza balance with \*334#), never lending products.

---

## 4. The interview (45 minutes)
**Method:** ask about **past behaviour and specifics**, not opinions about the future. Never pitch PesaPilot before section E. Don't ask "would you use…?" or "would you pay…?"

### A. Warm-up (5 min)
- Tell me a bit about how money comes to you in a normal month. *(Listen for: regular or irregular, how many sources.)*
- Which of these do you use: M-Pesa, cash, bank, M-Shwari or KCB M-Pesa, SACCO, chama?

### B. The last shortfall (10 min): tests H1, H2
- **When was the last time money ran out before the next money came?** Walk me through it.
- What did you do? *(Fuliza, borrowed from whom, skipped what, sold something.)*
- What did that cost you, in money and otherwise?
- How often does that happen? When was the time before that?

### C. How they decide today (10 min): tests H1, H4
- Yesterday or the last time you spent money: how did you know you could afford it?
- Do you keep money aside for something inside M-Pesa? How do you stop yourself from using it?
- Do you write anything down, or use any app? **Show me** (only if they're comfortable). When did you last update it? Why did you stop, if you did?
- How do you keep track of chama contributions, loans, or money you've lent or given to family?

### D. Money they've paid for (5 min): context for H5
- What apps or services do you pay for monthly (bundles, Showmax or DStv, Spotify, betting, SACCO fees)? How much?
- Have you ever paid to make managing money easier? What happened?

### E. Prototype reaction (10 min): tests H3
Show the preview on a test phone with demo data. Tasks (think aloud):
1. "Find out how much money you can actually use this week."
2. "You want to buy something for KSh 2,500. Can you afford it before the next money comes?" *(Before You Spend / Will I make it, as a concept mock.)*
3. "Put KSh 1,000 aside for school fees without moving it."

Observe and note: where they hesitate; what they misread; whether they **change a decision**. Then ask: "What, if anything, would you change about how you spend this week after seeing that?"

### F. Commitment close (5 min): tests H4, H5
Offer, **in this order**, and record exactly what they accept:
1. Join a 4-week beta using it with your real money (time commitment).
2. Introduce one person in your chama or circle who should try it (reputation commitment).
3. Pre-order "PesaPilot Plus" at a stated price, refundable (money commitment; only if approved, §6.4).

---

## 5. Separating what people say from what they do
Every interview gets a **behaviour evidence log** (template §8.3). Score evidence, not enthusiasm.

| Signal type | Counts as evidence | Does **not** count |
|---|---|---|
| Problem | A specific recent episode, with a date and cost | "Yes, that happens to everyone" |
| Current workaround | They show it, or describe it in detail | "I should probably track…" |
| Value | Changed a decision in the prototype; asked to keep it | "Nice app", "very useful" |
| Engagement | Joined the beta **and** recorded entries in week 1 | Signed up then never opened |
| Payment | Pre-paid (refundable), or kept paying after a trial | "I'd pay KSh 500 for this!" |

**Rule for synthesis:**
- Compliments and hypothetical answers get **zero weight** on willingness to pay.
- Stated price answers are used only to choose which prices to test, never as proof.

---

## 6. Willingness-to-pay experiments (in increasing strength)

### 6.1 Price-sensitivity questions (weak evidence; used only to pick test prices)
Asked at the end of interviews and in the beta survey. Four questions:
- At what monthly price would it be *too cheap to trust*?
- At what price would it be a *bargain*?
- At what price would it be *getting expensive*?
- At what price would it be *too expensive*?

Ask the same for a one-off price.

### 6.2 Randomised price display (moderate evidence)
Each beta participant is shown **one** price, assigned in rotation: monthly KSh 99 / 149 / 199, or one-off KSh 999 / 1,500. We record who asks to be notified at their price. It shows sensitivity to price, not payment.

### 6.3 Fake door (moderate, needs a small UI change later)
A "PesaPilot Plus" card listing the paid features and the price, with "Notify me". **Nothing is charged.** The page says clearly that it isn't available yet. This needs an implementation decision, so it is not part of this planning work.

### 6.4 Refundable pre-order via a manual M-Pesa till (strongest; **needs owner approval before running**)
- Interviewees and beta users who want Plus can pre-pay the price they were shown via a business till number.
- It is **fully refundable** on request, and if Plus isn't delivered within a stated time.
- No payment software is built; records are kept manually.
- **The owner decides** whether to run it, considering: a till or Pochi la Biashara in the business name, record keeping, tax treatment, and the refund promise.

### 6.5 What counts as validated willingness to pay
- **At least 10% of active beta users** pre-pay at a tested price (or of interviewees, if there is no beta yet).
- **And** at least 3 different income groups are among the payers.
- Below that, prices stay hypotheses and we revisit the paid features or the price.

---

## 7. Beta (weeks 3–8) and measurement without tracking
- **Who:** 30–50 participants from interviews and referrals. They use the live app after Release 1 is approved, or the preview with their own made-up mirror data if Release 1 is not yet approved.
- **Support:** a WhatsApp group (no money talk in the group; one-to-one for private questions).
- **Measurement stays local-first:** no analytics in the app. Data comes from:
  - a **weekly 2-minute survey**: days used, whether they checked safe to spend, "did you run out this week?", Fuliza days;
  - optional voluntary screenshots;
  - week 4 and week 8 calls with 10 participants.
- **Pre-registered success criteria** (decided now, before seeing results):

| Metric | Target | If missed |
|---|---|---|
| Problem confirmed (H1): specific recent shortfall | ≥ 60% of interviewees | Rethink the core problem |
| Changed a decision in the prototype (H3) | ≥ 40% | Rework the explanation and UX |
| Week 4 still using (self-reported ≥ 3 days/week) | ≥ 40% of beta | Fix onboarding and capture first |
| Still recording manually in week 2 (H4) | ≥ 50% of beta | Prioritise quick-entry design (no message capture: DEC-024) |
| Refundable pre-orders | ≥ 10% of active beta | Prices stay unvalidated |

---

## 8. Templates

### 8.1 Screener (read aloud)
1. What is your main way of getting money? (salary / casual work / business / freelance / farming / support from others)
2. Do you use an Android smartphone daily? Do you use M-Pesa?
3. In the last 3 months, have you used Fuliza or a loan app?
4. Are you in a chama or SACCO?
5. How do you keep track of your money now? (nothing / notebook / phone notes / app: which?)
6. Do you regularly send money to family?

### 8.2 Consent script
> "Thank you for your time. We're building an app to help people plan their money. We want to learn how you manage money today; we are not selling anything and there are no right answers. You can skip any question or stop at any time. We won't ask for your PIN, ID or exact balances. Notes won't include your name. May we take notes? *(May we record audio, which we'll delete after writing notes?)* You'll receive KSh ___ for your time whatever you say."

### 8.3 Behaviour evidence log (one per participant)
| Field | Entry |
|---|---|
| Code / group / location | P07 · casual · Thika |
| Last shortfall (date, how bridged, cost) | |
| Current tracking method (shown? last updated?) | |
| Fuliza / loans / family borrowing in the last 3 months | |
| Chama/SACCO role in their planning | |
| Prototype: hesitations, misreadings | |
| Prototype: **decision changed?** (Y/N, what) | |
| Commitments accepted: beta / referral / pre-order (price) | |
| Notable quotes (exact words) | |
| Stated price answers (§6.1) | |

### 8.4 Synthesis
1. After every 6 interviews, sort evidence by hypothesis (affinity map).
2. Count **behaviours**, not opinions.
3. Write a 1-page summary per group.
4. Put only anonymised findings in `docs/strategy/VALIDATION_FINDINGS.md`.

---

## 9. Timeline and roles

| Week | Activity | Who |
|---|---|---|
| 0 | Approve the plan; decide on 6.4 (pre-orders) | Owner |
| 1–3 | Recruit and run 24 interviews (about 8 a week) | Owner (or a hired interviewer); Claude prepares materials and synthesis |
| 2–3 | Prototype sessions within interviews | Owner, using the preview |
| 3–8 | Beta, weekly surveys | Owner runs the group; Claude analyses anonymised results |
| 8 | Findings and decisions (pricing, quick-entry priorities, DB-2) | Owner + Claude |
