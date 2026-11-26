# PesaPilot: Kenyan Market Fit & Product Strategy Review (November 2026)

**Status:** research and recommendations only. Nothing here is implemented or approved. Items needing a decision are listed in §8 as decision briefs (DB-1 to DB-4).

**How to read the evidence labels:**
- **[R]** research evidence, with a source link.
- **[R2]** secondary summary of research. Reliable source, but I could not open the primary document from this environment.
- **[M]** vendor or marketing claim (competitor listings).
- **[A]** my assumption or judgement. To be validated with customers.

---

## 1. The Kenyan user: what the evidence says

### 1.1 Key evidence

| Finding | Evidence |
|---|---|
| Only **18.3%** of Kenyan adults are financially healthy (17.1% in 2021). People manage day to day and shocks a little better, but struggle to plan and invest for the future. | [R] [FSD Kenya, 2024 FinAccess key insights](https://www.fsdkenya.org/blogs-publications/2024-finaccess-household-survey-key-insights-into-kenyas-financial-landscape/); [CBK main report](https://www.centralbank.go.ke/wp-content/uploads/2024/12/2024-FINACCESS-HOUSEHOLD-SURVEY-MAIN-REPORT.pdf) |
| Formal access is **84.8%**. About **52.6%** use mobile money **daily**. | [R2] [FSD Kenya](https://www.fsdkenya.org/blogs-publications/2024-finaccess-household-survey-key-insights-into-kenyas-financial-landscape/), [FSD Kenya on X](https://x.com/FSDKe/status/1863939797963694525) |
| **Casual labour is the most common main livelihood (26.5%)**, then agriculture 17.9%, then employment 13.2%. Among 18–25s: employment 39.4%, casual work 27.5%. | [R2] [Kenya Times citing KNBS/FinAccess 2024](https://thekenyatimes.com/latest-kenya-times-news/report-reveals-top-source-of-money-for-kenyans-in-2024/) |
| **Income is volatile.** In the Kenya Financial Diaries (300 households, 2012–13), median monthly income swung by about 54%. Households juggled many small, erratic income streams and bridged gaps with small savings, informal borrowing and help from family. The first interviews also missed 49% of income sources. | [R2] [Kenya Financial Diaries overview](https://fsdkenya.org/wp-content/uploads/2014/08/Kenya_Financial_Diaries_Overview_Report_FINAL.pdf); [FSD Kenya blog on survey bias](https://www.fsdkenya.org/blogs-publications/blog/how-big-is-our-bias-what-the-kenya-financial-diaries-tells-us-about-what-we-might-be-missing-in-finaccess/). *Old but still the best Kenyan diary evidence.* |
| **Fuliza** (overdraft): about 18.4% usage in FinAccess 2024. About Sh982 bn borrowed in 2024 (≈Sh2.7 bn a day; my arithmetic). About Sh1.24 tn in 2025 (≈Sh3.3 bn a day). | [R2] [CBK launch presentation](https://www.centralbank.go.ke/wp-content/uploads/2024/12/2024-FinAccess-Household-Survey-Launch-Presentation.pdf); [Radio Generation](https://radiogeneration.co.ke/news/12705/fuliza-usage-climbs-by-800000-users-disbursements-reach-sh982-billion-in-2024); [Money254](https://www.money254.co.ke/post/kenyas-fuliza-usage-rises-to-ksh3-3-billion-per-day-as-mshwari-declines-news) |
| **Debt distress is rising.** FSD Kenya reports that 16.6% of borrowers defaulted entirely. Earlier digital-credit research found 47% had repaid late, about 1 in 5 cut food to repay, and 14% held loans from several providers. | [R2] [FSD Kenya, "reaching its limits"](https://www.fsdkenya.org/blogs-publications/the-2024-finaccess-household-survey-is-kenyas-financial-sector-reaching-its-limits/); [CGAP, digital credit five years on](https://www.cgap.org/blog/kenyas-digital-credit-revolution-five-years-on) (2017–19 data) |
| **Where people save** (2024): bank 60.2%, mobile money 35.9%, **group/chama 19.7%**, secret place 16.2%, **SACCO 8.7%**. Rural adults rely more on chamas (32.3%) than SACCOs (24.2%); urban adults the reverse (35.4% SACCO vs 28.5% groups). | [R2] [Kenyan Wall Street](https://kenyanwallstreet.com/68-of-kenyan-adults-now-save-with-banks-leading-as-informal-channels-fade); [Kenya News Agency](https://www.kenyanews.go.ke/financial-access-in-kiambu-county-keeps-growing/) |
| **Why people borrow:** emergencies 27%, business 23%, school fees 12%, food 7%. **Savings motives** (2024): day-to-day needs 36%, emergencies 28%. | [R2] [GeoPoll citing FinAccess](https://www.geopoll.com/blog/kenyas-financial-landscape-report/) *(not confirmed in the primary report)*; [Kenyan Wall Street](https://kenyanwallstreet.com/68-of-kenyan-adults-now-save-with-banks-leading-as-informal-channels-fade) |
| **Advice and support come from people:** about half rely on personal networks for financial advice (51.3% of women, 42.4% of men), and people lean on family and friends to cope. | [R2] [Kenyan Wall Street](https://kenyanwallstreet.com/kenyans-avoid-chamas-as-source-of-financial-advice-finacess-survey); [FSD Kenya](https://www.fsdkenya.org/blogs-publications/the-2024-finaccess-household-survey-is-kenyas-financial-sector-reaching-its-limits/) |
| **Health costs** push families into begging and borrowing. 11% of households in the Kenya Health Financial Diaries had outstanding medical debt. | [R2] [FSD Kenya, "Healed but not free"](https://www.fsdkenya.org/blogs-publications/healed-but-not-free-the-enduring-forced-indignity-of-begging-and-borrowing-for-healthcare/) |

**Not verified here** (they need the primary PDF): how many people go without food or medicine, the national share of remittance income, and exact digital-loan usage. I did not use these.

### 1.2 What this means by segment

| Segment | Core money problem | What helps | Fit for PesaPilot now |
|---|---|---|---|
| **Salaried + side income** (young urban, 22–35) | Salary is gone before month end; Fuliza bridges the gap; rent, loans, chama and family claims all hit at once [A, consistent with R] | Seeing what is *really* free after commitments; a daily allowance until payday | **High.** Smartphone use, M-Pesa-heavy, can pay small amounts [A] |
| **Freelancers & casual workers** | Uneven income, no payday; feast-or-famine spending [R income volatility] | Planning by period, not payday; buffers; expected income kept separate | **High.** The engine already supports this (DEC-015) |
| **Small business owners** | Business and personal money mixed; stock money spent on household [A] | Separating "business float" from personal money | **Medium.** Partly served by accounts and set-asides; full bookkeeping is out of scope |
| **Boda boda / daily earners** | Daily cash in and daily costs (fuel, owner payment), with lumpy needs [A] | A daily "what's left after today's costs" view; very quick entry | **Medium-low for now.** Typing every entry is too much work; needs quick capture first |
| **Young families** | School fees, rent, health shocks [R borrowing reasons] | Planning for lumpy obligations; emergency fund | **High.** Bills, goals and safe to spend fit |
| **Supporting extended family** | Unplanned requests; lending that is never repaid [R networks; A for the size of the burden] | A family-support budget; tracking money lent | **High value, partly missing** (receivables, D3) |
| **Chama/SACCO members** | Contributions are a fixed commitment; payouts are lumpy [R usage] | Contributions as commitments; payouts as expected income | **Medium.** Works today as bills and expected income, but the rules are not explicit (DB-3) |
| **Multiple borrowers** | Fuliza, M-Shwari, KCB M-Pesa and app loans overlap; costs are hidden [R] | One view of what is owed, what is due and what it costs | **Medium.** Debts work; Fuliza and fee costs are not modelled (DB-3) |

### 1.3 Problems existing apps don't solve well (my synthesis)
1. **"How much is actually free?"** Trackers show what happened. Few answer what is left after rent, loans, chama and savings, especially without a fixed payday.
2. **Money with a job inside M-Pesa.** People keep savings "mentally" in M-Pesa (or a secret place, 16.2%). Savings apps *move* money (Chumz, M-Shwari Lock). Few let you earmark money where it already sits and stop showing it as spendable.
3. **Irregular income.** Most budgeting assumes a monthly salary. For the largest livelihood group (casual work), that is the wrong model.
4. **Social money.** Family support and lending to friends are real and frequent, and rarely tracked properly.
5. **Trust.** SMS-reading apps need broad phone permissions. Local-only data is a credible privacy position, *but only if backup is easy and well explained.*

---

## 2. Competitor comparison

**Sources:** app listings and vendor pages [M]; [Shmoney comparison](https://shmoney.co.ke/blog/best-budget-expense-tracking-apps-in-kenya-2026-m-pesa-fees-fuliza-compared/); [PesaTrail comparison](https://pesatrail.com/best-budget-apps-kenya.html) (written by competitors, so biased); [Safaricom M-PESA app manual](https://www.safaricom.co.ke/images/Downloads/M-PESA_App_Manual.pdf); [M-PESA Ratiba](https://www.safaricom.co.ke/personal/m-pesa/do-more-with-m-pesa/m-pesa-ratiba); Chumz coverage ([TechCabal](https://techcabal.com/2025/09/09/chumz-savings-psychology/), [Disrupt Africa](https://disrupt-africa.com/2023/05/23/how-kenyas-chumz-is-helping-users-save-and-invest-from-their-mobile-money-accounts/)). Features not verified hands-on.

| | **M-PESA app** (My Spend + Ratiba) | **SMS trackers** (PesaSense, Shmoney, PesaTrail, Wavvy, CountPesa, EK Budget Planner, FlowWise) | **Chumz / savings apps** (M-Shwari, KCB, MMFs) | **Global apps** (YNAB, Spendee, Monefy, Goodbudget) | **PesaPilot (work branch)** |
|---|---|---|---|---|---|
| Transaction capture | Automatic (M-Pesa only), 6 months, categories editable [M] | **Automatic from M-Pesa SMS** (Android); some import statement PDFs [M] | Not a tracker | Manual or bank feeds | **Manual only** ← biggest gap |
| M-Pesa support | Native | Strong; fee and Fuliza totals (PesaTrail, Shmoney) [M] | M-Pesa funding | Weak | Account type; no automatic capture |
| Cash tracking | No | Mostly manual or none [A] | No | Manual | **Yes** (accounts) |
| Multiple accounts | M-Pesa only | Mostly M-Pesa only [A] | Their own product | Yes | **Yes** (M-Pesa, cash, bank, savings, other) |
| Savings allocation | No (Lock savings moves money) | EK: envelopes + goals [M] | **Moves** money into goals, auto-save, round-ups (Chumz) [M] | YNAB/Goodbudget: envelopes | **Set aside in place + moved, no double counting** |
| Debt management | Fuliza/M-Shwari within M-Pesa | Fuliza cost totals [M] | No | Basic | Debts, repayments, borrowed ≠ income; no Fuliza model |
| Bills & commitments | **Ratiba**: standing orders, budget vs balance [M] | Some budgets | No | Some | Bills with occurrences, part payments, calendar |
| Irregular income | No | Not evident [A] | N/A | YNAB "age of money" [A] | **Yes**: period-based plan, expected income kept separate |
| Safe to spend | No | Not evident [A] | No | Rare | **Yes**: daily allowance after commitments, buffer |
| Insights | Category charts | Category and fee analytics; some "AI" [M] | Savings nudges, gamification | Reports | Reports, health score, rule-based insights |
| Privacy | Safaricom holds data anyway | Reads SMS on device; some offer optional cloud or AI [M] | Account + KYC | Cloud accounts | **Local-only; no account, no SMS access** |
| Pricing | Free | Free to KSh 200/month (Shmoney Premium); FlowWise KES 300/month [M] | Free (earns on investments) | USD subscriptions (YNAB is costly for Kenya [A]) | Free (no paid tier) |

### What is *not* unique
- M-Pesa SMS capture, Fuliza and fee totals, category charts, savings goals and envelopes all exist already.
- Kenya-specific categories exist too: PesaSense advertises 38 [M].

### Where PesaPilot can genuinely differentiate
I found no evidence of a Kenyan app that combines these:
1. **A forward-looking "what is truly free"** that subtracts commitments *and* money set aside in place.
2. **Irregular-income planning** by period.
3. **Strict money correctness:** transfers, savings and borrowing never treated as income or spending; reversals; reconciliation.
4. **Local-only privacy without SMS permissions.**

The weakness that could sink it is **manual entry**: competitors capture M-Pesa automatically (§8, DB-1).

---

## 3. Product positioning

**Initial target customer [A, to validate]:**
- Urban and peri-urban Kenyans aged about 22–35 on Android.
- M-Pesa as their main wallet, with **salary plus side income, or irregular income**.
- Regular commitments (rent, loans, chama, family support) and *at least occasional Fuliza use*.
- Already "trying to budget" (screenshots, notebooks, Excel) but still running out before the next money comes.

**Core problem to own:** *"I don't know how much of my money is actually free to spend, so I run out before the next money comes."*

**Positioning statement (draft):**
> **PesaPilot tells you how much you can safely spend today, after rent, loans, chama and savings are covered, even when your income isn't the same every month.** Your money stays on your phone: no account, no SMS access.

**Why this, not "track your M-Pesa":**
- Tracking is commoditised and free in the M-Pesa app itself.
- The evidence points to a planning and resilience gap: low financial health, heavy overdraft use, volatile income. A recording gap is the smaller problem.

---

## 4. Signature features: evaluation of A–G

| | Proposal | Exists today? | Evidence of need | Uniqueness | Build cost | Verdict |
|---|---|---|---|---|---|---|
| **A** | True available balance | **Built** (CR-007) | High [R volatility, Fuliza] | High in combination | Done | **Signature (core)** |
| **B** | Commitments & obligations planner | **Mostly built** (bills, debt plans, goal plans); chama and family not explicit | High [R borrowing for emergencies and school fees] | Medium (Ratiba covers standing orders) | Low–medium | **Part of the signature** (feeds A) |
| **C** | Irregular-income planning | **Built** (DEC-015) | High [R casual labour 26.5%] | High | Done | **Signature (core)** |
| **D** | Savings allocation in place | **Built** (DEC-008, DEC-022) | Medium–high [R mental/secret savings, chamas] | High vs Chumz and trackers | Done | **Signature (supporting)** |
| **E** | "Before You Spend" check | **Not built** | Plausible [A]: makes A+B+C actionable in one moment | **High** (none found) | **Low**: a question on top of the existing engine | **Signature (interaction)**. Build next |
| **F** | Weekly money check-in | **Not built** (the weekly guardrail exists on Plan) | Habit and retention [A] | Low alone | Low (in-app); reminders need a PWA (D9) | **Retention feature**, not signature |
| **G** | Kenyan M-Pesa, cash, SACCO, bank, chama, family | **Partly**: accounts yes; chama and family rules unclear; no receivables | High [R] | Low alone (others localise too) | Medium | **Essential localisation**, not signature |

**Recommendation: one promise, three parts.**
- **Signature = "Know what's truly free"**, made of A + C + B (with D inside it), experienced through **E ("Can I afford this?")**.
- **F** is the habit loop that brings people back.
- **G** is table stakes for trust and relevance.

---

## 5. Review of the existing application

| | Findings |
|---|---|
| **Works well** | A correct money engine (accounts, transfers, set-asides, reversals, reconciliation, safe to spend for irregular income); local-first privacy; PIN protection; proven migrations and rollback; redesigned, accessible UI; 64 regression tests |
| **Incomplete** | No automatic capture (D9 blocks Share-to-app too); no receivables (D3); no reminders or notifications; no guided setup of real balances; no Fuliza model; chama and family support not explicit; daily opening/closing view not built; budgets are monthly only |
| **Confusing [A, from review]** | Plan is dense for a first-time user; "set aside / release / use / move" is four verbs to learn; new users start with M-Pesa = 0 and must discover "Reconcile" or "opening balance"; the categories miss Kenyan staples (airtime and data, M-Pesa charges, chama, Fuliza fees, church giving) |
| **Rules needing a decision** | Fuliza (is a negative M-Pesa balance a debt?); chama contributions and payouts; family support vs lending; the interest/fee part of loan repayments (noted in DEC-010). See DB-3 |
| **Onboarding** | Today it is name + PIN only. A first commercial release needs a **2-minute setup**: what you hold now in M-Pesa, cash and bank (sets opening balances); how you're paid (fixed or irregular, period); your 3 biggest regular commitments; first savings goal (optional). This uses existing features only; no new rules. |
| **Essential for a first *commercial* release** | Guided setup; Kenyan default categories; "Before You Spend"; installable PWA with reliable offline loading (D9); clearer backup prompts (done); at least one low-friction capture path (DB-1) |

---

## 6. Commercial strategy

### 6.1 Free vs paid (hypothesis; not validated)
Principle: **the core promise stays free.** Charging for "how much can I spend" would block the habit we need people to form.

| Free | Paid ("PesaPilot Plus") |
|---|---|
| Accounts, transactions, transfers | Advanced reports and trends, CSV/PDF export |
| Safe to spend, Before You Spend | Multiple savings plans with schedules; debt payoff plans (avalanche or snowball) |
| Bills, debts, savings goals (limited number) | Unlimited goals and bills; family-support and chama tools |
| Weekly check-in | Encrypted backup to the user's own Google Drive *(needs DB-4)* |
| Local backup files | Fuliza and fee cost insights; "what if" planning |

### 6.2 Pricing hypotheses (KSh; **to be tested, not validated**)
- **Monthly:** KSh 99 / 149 / 199. **Yearly:** KSh 990–1,490.
- Market reference points (listings, [M]):
  - Shmoney Premium: KSh 200 a month.
  - FlowWise: KES 150 the first month, then 300.
  - The M-Pesa app's own spend view is free, which caps what people will pay for *tracking alone* [A].
- **One more hypothesis:** a **one-off "lifetime" unlock** (for example KSh 1,500) may suit a local-first app and a market wary of subscriptions [A].

### 6.3 Customer validation plan (8 weeks, low cost)

| Weeks | Activity | Output |
|---|---|---|
| 1–2 | **20 interviews** (5 each: salaried+side income, casual/freelance, small business, young family), via personal networks, a chama, a SACCO and WhatsApp groups. Script: their last "ran out of money" moment, how they decide what they can spend, Fuliza use, family requests, tools tried. | A problem ranking; quotes; whether the core problem resonates |
| 2–3 | **Prototype test** of "Before You Spend" and guided setup on the preview, with 8 interviewees doing tasks while thinking aloud | Usability fixes; time to first "aha" |
| 3–8 | **Beta with 30–50 users** on the live app after Release 1. A WhatsApp group for support. Week 4 survey. | Retention and engagement data (below) |
| 6–8 | **Willingness-to-pay test:** a price-sensitivity survey plus a "Plus" fake door showing the price, and **pre-orders via a manual M-Pesa till** (no new infrastructure) | Real paid commitments, not stated intent |

**Success criteria (set before testing, to avoid fooling ourselves):**
- ≥40% of beta users still active in week 4.
- ≥30% check safe to spend at least 3 days a week.
- ≥10% of active users pre-pay at the tested price.

### 6.4 Metrics
- **Activation:** guided setup completed plus ≥3 entries within 48 hours.
- **Engagement:**
  - weekly active users;
  - days per week safe to spend is viewed;
  - share of income recorded vs reconciled (accuracy);
  - Before You Spend checks per week.
- **Retention:** D1, D7 and D30; week-4 cohort curve.
- **Outcomes (self-reported, monthly):**
  - "ran out before next income" (yes/no);
  - number of Fuliza days;
  - emergency savings started.
- **Trust:** backups downloaded; PIN enabled; uninstall reasons.
- **Willingness to pay:** fake-door click rate; pre-order conversion; churn after the first paid month.

**Measurement constraint:** the app has **no analytics** (local-first). Measuring requires either an **opt-in, anonymous, aggregate-only usage report** (a privacy decision, DB-2) or surveys plus self-reports. Recommendation: surveys and opt-in only. No silent tracking.

---

## 7. Prioritised roadmap

| Tier | Items | Why |
|---|---|---|
| **Essential for Release 1** (current candidate) | **Freeze scope.** Ship what is built (Phases 0.5–2, PIN, redesign, savings behaviour) after the owner's review. Optional, low risk: Kenyan default categories (new installs only; existing categories untouched). | Release 1 protects existing users from known money bugs. Adding features adds migration risk. |
| **Important next (Release 2: first commercial release)** | 1. Guided 2-minute setup. 2. **Before You Spend**. 3. PWA install + offline (D9), which enables Share-to-app. 4. **Paste/Share M-Pesa SMS capture** (DB-1). 5. Receivables + family support (D3, DB-3). 6. Weekly check-in. 7. Fuliza and chama rules (DB-3). | Turns a correct engine into a daily habit with low entry effort, and owns the core problem |
| **Future differentiators** | Encrypted backup to the user's own cloud (DB-4); debt payoff planner; chama tools (contribution schedule, payout planning); daily-earner mode (boda/mama mboga: "today's float"); M-Pesa statement import; Kiswahili interface | High value, but each needs validation, extra infrastructure, or both |
| **Deliberately avoid for now** | Bank/open-banking integrations; selling or advising on investments, MMFs or loans (licensing: CMA/CBK); credit scoring or lending; an AI chat adviser; social feeds and gamified leaderboards; accounts and cloud sync by default; business bookkeeping and inventory; crypto | Cost, regulation and privacy risk, or they dilute the core promise |

---

## 8. Decision briefs (major changes; owner input needed **before** any build)

### DB-1: How should transactions get in without tedious typing?
- **Why it matters:** manual entry is the main way personal-finance apps lose users [A], and every Kenyan competitor captures M-Pesa automatically [M]. It is our biggest weakness.
- **Recommended: local "Paste or Share an M-Pesa message".**
  - The user shares or pastes an M-Pesa confirmation SMS into PesaPilot.
  - PesaPilot parses amount, type, counterparty, M-Pesa code, fee and balance **on the phone** and proposes an entry to confirm.
  - Sharing needs an installed PWA with a share target, so D9 comes first.
  - **No SMS permission, no server, nothing leaves the phone.**
  - The M-Pesa code doubles as a **duplicate check**, and the balance in the SMS gives **automatic reconciliation hints**.
- **Alternatives:**
  - (2) **A native Android app reading SMS automatically:** best convenience, but a new codebase and app-store work. Google Play restricts SMS permissions (exact eligibility unverified here), and it weakens our privacy positioning.
  - (3) **M-Pesa statement PDF import:** good for catching up, but needs a PDF library (about 1 MB) and password handling.
  - (4) **Manual only:** no work, high abandonment risk.
- **Implications:** new parsing code (message formats change, so it needs ongoing tests) and a PWA manifest plus service worker (D9). No change to financial rules: entries go through the existing forms.
- **Reversible?** Yes. It is an additional input path.

### DB-2: How do we charge, and measure, without breaking local-first privacy?
- **Why it matters:** a paid tier needs payment plus an "is this user paid?" check. Measuring retention needs data. Both pull towards servers and accounts.
- **Recommended, in stages:**
  - (a) **Validation stage:** manual M-Pesa till pre-orders, honour system, no new infrastructure.
  - (b) **Later:** an **offline, cryptographically signed unlock code** issued after payment. The app checks it without contacting a server, and **financial data never leaves the phone**.
  - (c) Measurement only through **opt-in** anonymous summaries or surveys.
- **Alternatives:** accounts plus a subscription backend (Daraja STK push). Smoother renewals, but it means running servers, holding personal data, data-protection obligations (Kenya Data Protection Act) and running costs.
- **Reversible?** Stage (a) fully. Stage (b) mostly. Accounts are hard to undo once users depend on them.

### DB-3: Kenyan money rules (Fuliza, chama, family support)
These need **financial-rule decisions** (FINANCIAL_RULES changes):
- **Fuliza.**
  - *Recommended:* when M-Pesa would go below zero, offer to record the shortfall as Fuliza borrowing: a debt that is not income (as DEC-010), with access and daily fees recorded as spending.
  - *Alternative:* keep showing a negative balance with a warning (today's behaviour).
- **Chama.**
  - *Recommended:* contributions to a savings-type chama are a **transfer to a "Chama" account** (savings, not spending). A merry-go-round payout is that money coming back (transfer) plus any surplus as income. Welfare or non-refundable contributions are spending.
  - *Alternative:* treat all contributions as spending (simpler, but understates what people own).
- **Family support.**
  - *Recommended:* a "Family support" category with an optional monthly budget (spending). Money that is *expected back* is recorded as lending (receivables, D3), never as spending.
- **Reversible?** Classification rules can be re-applied by migration, but they change reports. Agree them before building.

### DB-4: Protecting users who lose their phone (encrypted cloud backup)
- **Why it matters:** local-only data means a lost phone with no backup file loses everything (DATA_RECOVERY.md). This is the strongest *paid* value candidate [A].
- **Recommended (later):**
  - The backup file is encrypted on the phone with a passphrase, then saved to the **user's own** Google Drive, using a standard browser file picker or Drive access.
  - We never see the data, and there is no PesaPilot server.
- **Alternatives:**
  - A PesaPilot cloud: easiest for users, but we hold sensitive financial data, with costs and liability.
  - Status quo: manual backup files only.
- **Implications:** revisits DEC-005. A forgotten passphrase means an unrecoverable backup (must be explained clearly).
- **Reversible?** Yes, while it stays optional.

---

## 9. Summary recommendations
1. **Own one problem:** "how much of my money is truly free, until the next money comes."
2. **Signature:** true available balance + irregular-income plan + commitments, delivered as **"Before You Spend."** Most of this is already built and correct, a real head start.
3. **Biggest risk:** manual entry. Plan **paste/share M-Pesa capture** (DB-1) as the first major post-Release-1 build, after D9.
4. **Keep the core free.** Test **KSh 99–199/month or a ~KSh 1,500 lifetime unlock** for Plus, with **real pre-orders**, not survey intent.
5. **Validate with 20 interviews and a 30–50 user beta** before building paid infrastructure.
6. **Freeze Release 1 scope**, ship it after review, and put the new ideas into Release 2.

## 10. Research limitations
- I could not open the CBK/FSD primary documents from this environment, because the network was blocked. Figures marked [R2] come from reputable secondary summaries; check them in the [CBK main report](https://www.centralbank.go.ke/wp-content/uploads/2024/12/2024-FINACCESS-HOUSEHOLD-SURVEY-MAIN-REPORT.pdf) before quoting them publicly.
- Competitor details are from listings and vendor comparisons (some written by competitors), not hands-on testing. Prices change.
- Segment needs marked [A] are informed judgement, not research. They are exactly what the interviews in §6.3 are designed to test.

---

## 11. Owner refinements (accepted, DEC-023)
1. **Onboarding:** progressive, optional, not overwhelming. It covers accounts and real balances, income sources and pattern, commitments, savings and debts. Every step is skippable, with gentle "finish later" prompts.
2. **M-Pesa capture (DB-1):** paste/share only, no SMS permission. The classifier must distinguish **income, transfers between own accounts, expenses, withdrawals, deposits, Fuliza (borrowing, repayment, fees), charges and reversals**. **Duplicate detection is essential:** M-Pesa code first, then amount + time + counterparty as a fallback. Every captured entry is confirmed by the user before it is saved.
3. **"Will I make it to my next income?" (DB-5)** sits alongside Before You Spend. It uses **actual money, upcoming commitments and expected income as three separate inputs**, shows each assumption in plain words, and never counts expected income as money you have.
4. **Backup (DB-4):** needs a separate architecture and privacy assessment (P5) before any decision. **Local-first remains the default.** No cloud storage or new infrastructure without a decision brief and owner approval.
5. **Pricing:** KSh 99–199/month and a one-off unlock remain **hypotheses**. Interviews and willingness-to-pay experiments come before any payment infrastructure (P4, then DB-2).
6. **Release 1:** this strategy is **not** deployment approval. The owner reviews the preview first, including the savings behaviour corrected in CR-007.

## 12. Owner decision after review: M-Pesa capture declined (DEC-024)
- DB-1 (§8) is **closed as declined**. PesaPilot will not paste, share, parse or import M-Pesa messages, will not request SMS permission, and will not access M-Pesa accounts. Manual recording is the supported approach.
- **Strategic consequence:**
  - **Speed of manual entry and balance-based checking become retention priorities** (see `MASTER_PROJECT_STATE.md` §13).
  - **Privacy becomes an even clearer differentiator:** "PesaPilot never needs your messages."
