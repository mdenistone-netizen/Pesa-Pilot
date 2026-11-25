# P1 · Onboarding: current prototype (A) vs simpler alternative (B)

**Status:** **Owner decision DEC-026: B is the preferred direction for Stage A, subject to successful testing with real users. A stays as a comparison prototype. Neither is implemented in the app.** Prototypes for comparison. Both are **stand-alone pages outside the app**. They save nothing, change no financial rules and are not deployed to users.

**Try them** (preview origin, cannot touch real data):

| | Link |
|---|---|
| A | `https://deploy-preview-1--pesa-pilot.netlify.app/docs/prototypes/onboarding/` |
| B | `https://deploy-preview-1--pesa-pilot.netlify.app/docs/prototypes/onboarding-simple/` |

The preview only shows them once this branch is pushed and the preview has rebuilt.

**Evidence labels:**
- **[M]** measured by script on the prototypes.
- **[W]** expert walkthrough, judgement only.
- **[U]** needs real users. Not done yet.

---

## 1. What changed in B, and why

B rethinks the journey; it is not a polished A.

| Owner's ask | A (current prototype) | B (simpler) |
|---|---|---|
| 1. Total money now, details later | Separate M-Pesa, cash and extra-account fields | **One number:** "How much money do you have right now?" Splitting into M-Pesa, cash and bank comes later, from Home. |
| 2. Next income, with "not sure" | "Fixed day each month" or "It varies", then a period choice and an optional expected amount | **Three plain choices:** "On a date I know" (pick the date), "Every day or most days", "I'm not sure" (plan one week at a time) |
| 3. Urgent payments, skippable | Asked *after* the first answer, as a checklist item | **Asked before the answer**, with tap-chips (Rent, School fees, Loan / Fuliza, Chama, KPLC tokens, Water, Other) and a "Nothing urgent" button |
| 4. Immediate, understandable picture | "KSh X free… about KSh Y a day", with a note that bills aren't included yet | "**To make your money last until Sat, 28 Nov, plan on about KSh Y a day**", then a plain sum ("You have… You must pay… That leaves…") and "This is a planning guide, not a fixed daily allowance. Some days cost more than others." Home leads with the **amount left until the next money**, with the daily figure underneath "as a guide" (DEC-026). |
| 5. Finish setup gradually on Home | Checklist of 6 items | 4 next steps: split money, put money aside, PIN, backup. Plus "− I spent / + I received" from the first visit. |
| Name and welcome screen | Asked first | **Removed.** It isn't needed for the answer. |

---

## 2. Measured comparison [M]

**Setup**
- Same scenario in both: 7,000 shillings in total; next money on Sat 28 Nov; rent of 3,000 due before then.
- Phone width: 390 px.
- PIN: required at first run in both (DEC-026). **A asks for it first**, so 4 of A's 9 taps are PIN digits. **B asks for it after the answer**, before Home. Without the PIN, A needs 5 taps (the same as B), but its first answer still leaves out the rent.
- Script: it drives each prototype through to the first answer, then counts the work involved.

| | A | B |
|---|---|---|
| Screens before the answer | 5 | **4** |
| Taps to the answer | 9 (incl. 4 PIN digits) | **5** (PIN comes after) |
| Characters typed | 9 | 9 |
| Words to read before the answer | 152 | **100** |
| Words on the answer screen | 92 | **53** |
| Finance terms on screen | "balance", "account" | **none** |
| Reading ease (Flesch; higher is easier) | 77 | **85** |
| Does the first answer include the rent? | **No.** It shows 2,333/day; adding rent later costs 4 taps and 6 characters more. | **Yes**: 1,333/day |
| Final figure once rent is included | KSh 1,333/day | KSh 1,333/day |

**Edge cases checked in B** (each with no sideways scroll, nothing stored and no errors):
- a 320 px phone;
- zero money;
- payments larger than the money held: shows "KSh 0 a day" and the shortfall;
- "every day" and "not sure": 7-day plan;
- Kiswahili;
- PIN required (the optional variant was removed after DEC-026);
- a past date or today: refused, with a message;
- a payment chip tapped with no amount: refused, with a message (fixed during this review, see §4).

---

## 3. Financial accuracy underneath B

B is simpler on the surface. Here is how each answer maps onto existing rules (FINANCIAL_RULES; DEC-015). **No rule changes.**

| B's answer | What the real app would store | Accuracy note |
|---|---|---|
| One total | An **opening balance dated today** on one account (suggested: "M-Pesa" or "My money") | When the user later splits it, the split must **add up to the same total**. Otherwise it is a labelled reconcile (DEC-016), never a silent change. |
| "On a date I know" + date | `paydayDay` / next-income date | Only dates after today are accepted. |
| "Every day" / "Not sure" | Irregular pattern, 7-day planning period | Matches the 1-week default recommended in ONBOARDING §7.2. |
| Urgent payments | **Bills** due before the next income (name + amount) | Due dates default to "before next income"; the exact day can be added later. A Loan / Fuliza payment becomes a bill, or a debt repayment once a debt is added. |
| "You can use about KSh Y a day" | DEC-015 safe to spend: (money − payments due before next income) ÷ days left | Matches the app's rule when no buffer or goals are set. Rounds down, shows 0 if short, and states the shortfall. |
| Money you're waiting for | **Never counted** (DEC-015, DB-5) | B never asks for an expected amount, so it cannot be counted by mistake. The line "Money you're waiting for is not counted until it arrives" says so. |

**Known simplifications** (to settle before Stage A):
1. **The total lands in one account.** Until the user splits it, account-level figures (M-Pesa vs cash) are unknown. "Available to spend" is still correct.
2. **Someone using Fuliza right now** may have a negative M-Pesa balance. B relies on the "Loan / Fuliza" chip for the amount owed. Whether people understand this needs testing [U].
3. **The day count** treats the payday itself as a new-money day. Today (Wed 25 Nov) → Sat 28 Nov gives 3 days: Wed, Thu and Fri. This matches the current app.

---

## 4. Expert walkthrough: can someone new do it alone? [W]

For each screen I asked three things:
- Will they know what to do?
- Will they see how to do it?
- Will they understand what happened?

| Screen | Likely to work | Risk | Done / proposed |
|---|---|---|---|
| Money now | One question, one box, a reassuring "a rough figure is fine" | People may leave out bank or M-Shwari money, or not know whether to include it | Test the wording [U]. Possible hint: "Only money you can use this week." |
| Next money | Three cards with everyday examples (salary; boda, kiosk, casual work) | The date picker on cheap Android phones can be confusing | Past dates refused with a message ✅. Test on a low-end phone [U]. |
| Must pay | Familiar chips; skip is obvious | Tapping a chip but forgetting the amount used to count as 0 and **over-promise** | **Fixed:** "Type how much for Rent, or tap it again to remove it." ✅ |
| The answer | One big number, one plain sum | "A day" may be read as "I *must* spend this daily" | Test what people say it means [U]. |
| Home | Big headline plus the two most common actions | Next steps may be ignored | Fine. They are optional by design. |

**Honest limit:** this walkthrough is my judgement, and the numbers in §2 are proxies (effort and reading level). **Neither proves that an ordinary user understands B without help.** Only watching real people do it can show that. The test is ready in `../strategy/interview-pack/09_FIRST_RUN_TEST.md` and is **waiting for your approval** as part of the P4 pack.

---

## 5. Recommendation

**Use B as the basis for Stage A**, subject to the first-run test.

- **Why B:**
  - a third fewer words before the answer (100 vs 152), 42% fewer on the answer screen (53 vs 92), and the answer arrives before the PIN step;
  - no finance jargon;
  - and, most importantly, **the first number already protects urgent payments**, so it doesn't over-promise.
- **Keep from A:**
  - the extra-account rows;
  - the buffer;
  - income sources.
  
  These move into Home's "next steps", where they are optional.
- **Decide after testing:**
  - the "a day" framing vs "KSh X until <date>";
  - the Fuliza wording;
  - whether to ask the name at all.

**Owner decisions this raises** (none urgent):
1. ~~PIN at first run~~ → **decided: required** (DEC-026). Unchanged from today's app; any change needs its own decision brief.
2. ~~Approve the first-run test~~ → **test design approved** (DEC-026). Running it waits for approval of the complete P4 pack.
3. ~~A or B~~ → **B preferred**, subject to the real-user test (DEC-026).

**Implementation note for Stage A (to settle in its brief):** B asks for the PIN *after* the first answer. In the real app nothing may be saved before the PIN is set, or the PIN screen moves before the questions. Either keeps the security position unchanged.

**Reversible:** yes. Both are throw-away prototypes, and nothing in the app has changed.
