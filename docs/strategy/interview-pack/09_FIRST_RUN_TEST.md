# 09 · First-Run Test: can someone set up PesaPilot without help? (about 10 minutes)

**Status:** **Test design approved by the owner (DEC-026).** Part of the P4 pack. Recruitment, piloting and collecting any participant information stay **unauthorised** until the owner approves the complete pack.

**Purpose:** see whether people who don't track their money can:
- get through first-time setup alone;
- understand the answer it gives.

It compares two prototypes:
- **A** (`/docs/prototypes/onboarding/`);
- **B** (`/docs/prototypes/onboarding-simple/`).

Background: `../../specs/ONBOARDING_COMPARISON.md`.

## Rules
- Run it on the **test phone**, never the participant's phone. Both prototypes save nothing. Tap **Restart** between people.
- Use the **made-up situation card** below. Never ask about the participant's real money.
- **PIN:** both prototypes ask for a PIN (required at first run, DEC-026). Ask the participant to type **1234**, never a PIN they really use.
- **Give no help.** If they ask, say: "What would you try?" If they are stuck for 60 seconds, note "stuck" and move on.
- **Counterbalance:** odd participant codes (P01, P03…) do A first; even codes do B first.
- **Language:** the participant chooses English or Kiswahili with the button at the top. Record the choice.

## The situation card (read aloud and hand over)
> "Imagine this is you. You have **5,000 shillings** on M-Pesa and **2,000 cash**. Your next money comes on **Saturday**. Before then you must pay **rent of 3,000**. Please set up the app as if it were yours."

The right answer in both prototypes is about **KSh 1,333 a day**, until Saturday.

## For each prototype, record

| Measure | How |
|---|---|
| Finished alone? | yes / with a hint / no |
| Time to the answer | the prototype shows it; also note it yourself |
| Where they hesitated (over 5 s) | screen name + what they said |
| Wrong entries | e.g. typed only M-Pesa, missed the rent, picked "not sure" |
| Understanding check | Part U below, asked after the answer screen and **without explaining anything** |

## Part U · Understanding check (after each prototype's answer screen)
Leave the answer screen visible. Ask each question exactly as written, and do not hint. Record their words.

| # | What we check | Question | A right answer (in their own words) |
|---|---|---|---|
| U1 | **Money they have now** | "According to the app, how much money do you have right now?" | KSh 7,000 |
| U2 | **What must be paid before the next income** | "What does the app say you must pay before your next money comes? Has it been taken care of?" | The rent, KSh 3,000; yes, it's already taken out |
| U3 | **What remains after commitments** | "After that, how much is left for everything else?" | KSh 4,000 |
| U4 | **What the daily figure means** | "What does the KSh 1,333 a day mean to you?" Then: "If tomorrow you had to spend 2,500 on something important, what would that mean?" | A guide for spreading the 4,000 until Saturday, **not** a fixed daily allowance. Spending more one day means less on the other days; it doesn't mean they've broken a rule or are now short. |
| U5 | **Why expected income isn't counted** | "Imagine someone owes you 2,000 and says they'll pay on Friday. Does the app count it? Why, or why not?" | No, because it hasn't arrived yet and might be late or not come. |

**Score each 0 / 1 / 2:** 0 = wrong or "don't know"; 1 = partly (e.g. the right number but can't say what it's for); 2 = right in their own words.

**Red flags** (note them word for word):
- U4: they treat the daily figure as a guaranteed allowance or a limit they must not cross, or think spending more one day means the app is wrong.
- U5: they think the money they're waiting for is already included.

## After both
- "Which was easier? Why?" [SAYS]
- "Which number would you trust more? Why?" [SAYS]
- Compare with what you saw them do [OBS]. Behaviour counts more than opinion.

## Success criteria (pre-registered)
B (or A) is good enough for Stage A if, across the first 12 participants:
- **at least 10 out of 12** finish without a hint;
- the median time to the answer is **under 2 minutes**;
- **at least 9 out of 12** score 2 on each of U1, U2 and U3;
- **at least 9 out of 12** score 2 on U4 (daily figure as a guide) and on U5 (expected income not counted);
- **no more than 1 in 12** shows a U4 or U5 red flag. More than that means the wording changes and is retested before Stage A.

## Notes
- Use participant codes only. Store notes outside GitHub, as in `00_RESEARCH_DATA_NOTICE.md`.
- No screenshots, no real balances, no names on the sheet.
