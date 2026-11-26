# Decision pack: DB-5, DB-4 and DB-6 (34 choices)

**Status:** **For owner review. Nothing here is approved or implemented.**

**Five separate approval matters:**
- Release 1;
- D13;
- DB-4;
- DB-5;
- DB-6.

Approving one approves none of the others. Production is untouched until you explicitly approve a deployment.

**Each brief also needs build approval.** Approving a brief's choices approves the *rules and design* only. Building it still needs its own go-ahead, change record, tests, preview and deployment approval.

**Sources:**
- `DB-5_DECISION_BRIEF.md`
- `DB-4_DECISION_BRIEF.md`
- `DB-6_DECISION_BRIEF.md`

**Key to "Changes an existing rule?"**
- **No**: nothing existing changes.
- **New rule**: adds a financial rule without altering old ones.
- **Extends DEC-xxx**: an existing decision gets a new case.
- **Changes DEC-xxx**: an existing decision's behaviour changes.

---

## Owner decisions so far
- **DB-5: decided 26 Nov (DEC-027).** All 14 choices approved: rules and design only, several with conditions (see each entry). **Not implemented.** DB-5 implementation needs a separate go-ahead after Release 1 and D13 are completed and verified.
  - DEC-015 is amended by 5.7 and 5.8 (recorded in `DECISIONS.md` and `FINANCIAL_RULES.md` §6 as approved, not yet implemented).
- **DB-4: under review next.** 11 choices.
- **DB-6: after DB-4.** 9 choices.

## Changes after your review (26 Nov, round 4)
These are clarifications only. **Nothing is approved for implementation.**

**The pack now has 34 choices.** DB-4.11 (integrity, verification and repair) is new: the lifecycle tests showed it is a separate decision.

| Your point | Where answered | Evidence | Outcome |
|---|---|---|---|
| DB-4: the full lifecycle of design B | DB-4 brief §3b | Model L1–L6: setup verified; 2 one-tap backups with no secret; password change; recovery-code-only replacement phone; **6 backups × 4 secrets** behave as designed; the phone can't open any of its own backups | **Two flaws found and fixed:** (1) repair from an old file would have brought back an old password, so it now re-locks with the current password; (2) one damaged lock broke the whole file, so the locks now authenticate themselves and the other lock still works. |
| DB-4: lost or damaged key material | DB-4 brief §3b | Model D-a to D-e | Damage is caught **before** every backup (integrity check): a backup is refused, never written unopenable. Repair from any earlier file. A deliberate swap is caught at the next password check, with backups made in between locked to the attacker: a stated limit. |
| DB-4: generated or user-created password | DB-4 brief §4 | Guess-time table [estimates from public benchmarks] | **Recommend generated: 5 random words from a 2,048-word list** (≈ 2⁵⁵). 4 generated words (≈ 2⁴⁴, ~4 months on 100 graphics cards) is not enough. A user-made phrase is **not** proof of strength, so it is allowed only if a strength check rates it as strong. |
| DB-5.5: causes of reconcile differences | DB-5 brief §5.4 point 5 | Model R1–R5 | The model can't tell causes apart, so it uses what the user says (DEC-016 tick / reversal). **Only shortfalls** raise the estimate. **Unexplained shortfalls are counted but shown separately**, with the figure without them and an [Explain it] button. A matching pair across accounts is flagged as a possible transfer. |
| Schema 11: retest on real code; record the Release 1 display defect | DB-5 brief §7; ROADMAP Stage B; **RELEASE_1_CHECKLIST R4**; MASTER §8 | — | Retest on the actual DB-5 code is now a release requirement. R4 records that Release 1 can *display* a cancelled payment as expected (never counted in available money). |

## Changes after your review (26 Nov, round 3)
These are clarifications only. **Nothing is approved for implementation.**

| Your point | Where answered | Evidence | Outcome |
|---|---|---|---|
| DB-4: "can't export" vs "can use" | DB-4 brief §3a | **Browser test** (page + service worker): a worker retrieved the stored non-extractable key and **decrypted a backup with it** (export was blocked). | The round-2 design is **withdrawn**. **Revision 2:** the phone keeps only a **public** key plus password/code locks. Tested: the worker can retrieve it and make new backups, but **cannot open any**. Model: Q1–Q7 + "the phone alone cannot open any backup" pass. Limits stated: offline guessing against the locks; malicious same-origin code could capture a typed password or swap the public key; records on the phone remain unencrypted. |
| DB-5.5: recorded day, partial recording, multi-day reconciles, excluded purchases, honest uncertainty | DB-5 brief §5.4 | Model: 16 cases, D1–D11 | Exact recorded-day definition (reversed entries excluded). Four **confidence levels**; **no records-only figure is shown when records are incomplete**. Reconcile gaps spread over each account's own stretch, never double counted, never lowered by "more money found". One-offs listed under "How this is worked out", with **Count it / Undo** (needs a 4th optional stored list in DB-5.12). |
| Schema 11: end-to-end cancellation, and backup-version scope | DB-5 brief §7 | `prototypes/schema11/e2e-release1.js`: real Release 1 build + schema 11 reference model, **PASS** | `cancelledAt` restored the cancellation; it doesn't reappear in pending payments, forecasts or late reminders; idempotent. **New finding:** while Release 1 is running, it *shows* the cancelled payment as expected (Plan list, Home "if it arrives" line), never in Left to spend. Backup-version safeguard: **protects** imports and safety-backup restores (both refused, tested); **does not protect** data already on the phone, Release 1's display, hand-edited files or copies outside the app. |

## Changes after your review (25 Nov, round 2)
Your review position is recorded in `MASTER_PROJECT_STATE.md`. **Nothing is approved for implementation.** The answers to your questions are in the briefs; this list says where.

| Your point | Where answered | Evidence | What changed |
|---|---|---|---|
| DB-5.5 divisor, empty days, incomplete records | DB-5 brief §5.4 | Model examples D1–D6 | Divided by **calendar** days; empty days = 0; a coverage check asks the user and uses the higher figure. **Correction:** reconcile gaps are now *included*, spread over time (excluding them made the estimate too low). |
| DB-5.6 cushion is a threshold only | DB-5 brief §5.5 | Model property for every no-buffer example | Confirmed. Wording made explicit. |
| DB-5.7/5.8/5.12 Release 1 must not overwrite schema 11 | DB-5 brief §7 | **Tested on a copy:** Release 1 opening schema 11 changes nothing; *saving* relabels it 10 and rewrites "cancelled" to "expected", **but keeps extra fields** | 4 layers: D13 first; schema 11 + backup version; `cancelledAt` date as the source of truth (survives Release 1); rollback floor (never Release 1 after schema 11) |
| DB-4 key architecture, Q1–Q7 (**superseded in round 3**: the non-extractable design was withdrawn) | DB-4 brief §3a | Model: all 7 answers checked. Chromium: non-extractable key survives a reload and can't be exported. | Four items separated (DK, P-key, R-key, on-device secret). **Change:** the phone key is non-extractable in IndexedDB, so changing the password needs the old password **or** the recovery code. This closes the "unlocked phone re-locks the key" gap. |
| DB-4.6 example | DB-4 brief §4 | — | `chungwa basi kumi mlango` (4 unrelated words). The example and common passwords are refused. |
| DB-4.9 plain copy | DB-4 brief §5a | — | "NOT protected" warning, `UNPROTECTED` in the file name, and a delete reminder. The process is unchanged. |
| DB-6.5 storage claim | DB-6 brief §2a | Chromium: worker sees localStorage `undefined`, IndexedDB and caches available; records identical after every step | **Corrected:** the worker can't reach localStorage (where all records are) but *can* reach IndexedDB and caches. A test forbids storage code in `sw.js`. |
| DB-6.2/6.4 safeguards | DB-6 brief §3a | Clean repeated runs: a failed install keeps the old version; a good update clears old caches; the kill switch removes everything | Atomic installs, failed downloads, version mixing, kill-switch delivery (`updateViaCache: "none"`), offline rollback, rollback floor, real-Android test list |

## Summary

| # | Question | Recommendation | Changes an existing rule? |
|---|---|---|---|
| DB-5.1 | Principles and four verdicts | **Approved** (DEC-027) | New rule |
| DB-5.2 | How expected income is shown | **Approved** (DEC-027) | No rule; **removes a display line** |
| DB-5.3 | Planning horizon for irregular income | **Approved** (DEC-027) | No (confirms DEC-015) |
| DB-5.4 | A bill due on payday itself | **Approved, provided the payday exclusion is clearly explained** (DEC-027) | No (alternative changes DEC-015) |
| DB-5.5 | Usual daily spending estimate | **Approved, with confidence levels, transparent reconcile adjustments and Count it/Undo; unexplained shortfalls stay distinguishable from recorded spending** (DEC-027) | New rule |
| DB-5.6 | Cushion for "Tight" | **Approved: a warning threshold only, never deducted** (DEC-027) | New rule |
| DB-5.7 | Late or missing income | **Approved, with the DEC-015 amendment and clear treatment of late, cancelled and received payments** (DEC-027) | **Extends DEC-015** + new data value |
| DB-5.8 | Salary late this month | **Approved: one cycle only** (DEC-027) | **Extends DEC-015** + new setting |
| DB-5.9 | Savings in the verdict | **Approved: savings never automatically released or used** (DEC-027) | No (uses DEC-022) |
| DB-5.10 | Fuliza and auto-repaid loans | **Approved deferral to DB-3; until then, disclose that Fuliza repayments are not fully modelled** (DEC-027) | No |
| DB-5.11 | Before You Spend actions | **Approved, provided actual and planned spending can't be double counted (design in DB-5 brief; also fixes D14)** (DEC-027) | No |
| DB-5.12 | Four optional stored fields | **Approved conditionally: after D13, with migration, rollback, backup-compatibility and cancellation-recovery tests** (DEC-027) | **Data structure + migration (schema 11)** |
| DB-5.13 | Timing scenarios | **Approved** (DEC-027) | New rule |
| DB-5.14 | Short vs Already short wording | **Approved for user testing, not as final wording** (DEC-027) | No |
| DB-4.1 | Add protected backups | Yes, after Release 1 and D13 | **Extends DEC-020** |
| DB-4.2 | Encryption method | AES-GCM-256; PBKDF2 600k | No |
| DB-4.3 | Recovery | Password + recovery code | No |
| DB-4.4 | Default | Offer protection; plain stays available | No |
| DB-4.5 | One-tap backups (public key + locks on phone; phone can't open backups) | Yes | **New on-phone items** (DEC-019 style: never exported) |
| DB-4.6 | Backup password | Generated 5 random words; user-made only if rated as strong | No |
| DB-4.7 | Monthly password check | Yes, with the backup reminder | Extends DEC-020 reminder |
| DB-4.8 | How the file is saved | Share sheet; download as fallback | No |
| DB-4.9 | Forgot-PIN path | Unchanged | No |
| DB-4.10 | Drive auto-backup / PesaPilot cloud | Not now | No (keeps DEC-005, DEC-023) |
| DB-4.11 | Integrity, verification and repair | Check before every backup; verify at key moments and monthly; repair from any earlier file | No |
| DB-6.1 | Build a full PWA | Yes, Stage C, after Release 1 and D13 | Fixes D9; **extends release process (DEC-017)** |
| DB-6.2 | Page update method | Network first, 3-second limit | No |
| DB-6.3 | Switching versions | Reload banner; never mid-form; all tabs | No |
| DB-6.4 | Kill switch | Self-removing worker | No |
| DB-6.5 | What is cached | App files only | No |
| DB-6.6 | Persistent storage request | Yes | No |
| DB-6.7 | Install suggestion | Settings + one dismissible Home tip | No |
| DB-6.8 | Rollback procedure | Add "deploy kill switch" | **Changes the RELEASE_1 recovery procedure** (later releases) |
| DB-6.9 | Native Android app | Not now | No |

---

# DB-5 · "Will I make it to my next income?" + Before You Spend

### DB-5.1 · Principles and the four verdicts

> **Owner decision (DEC-027, 26 Nov): Approved.**

**Decision:** Adopt the principles in brief §2:
- expected income never counted;
- only real money and dated commitments;
- each shilling counted once;
- never blocks, records or moves savings by itself;
- the daily figure is a guide;
- the working is always shown.

Also adopt the four verdicts in brief §3 (On track / Tight / Short / Already short), defined by margin M = free money − must-pays − savings plans − usual spending.

**Recommendation:** Approve.

**Alternatives:**
- a single yes/no answer (simpler, but hides "tight" situations);
- no verdict, only the existing Left to spend (no new rule, no new help).

**For an ordinary user:** One clear answer to "Will I make it?", with the reasons ("rent 6,500 on Fri 27 Nov…") and what to do ("keep to about KSh 428 a day").

**Risks:**
- **Financial:** a wrong verdict could mislead. It is limited because expected income is never counted, and by the model's checks: expected income never changes the verdict, and adding a payment never improves it.
- **Accuracy:** depends on recorded data. Unrecorded spending makes it too optimistic, which is stated on screen.
- **Maintenance:** a new calculation module with its own tests.

**Changes an existing rule?** **New rule.** DEC-015's Left to spend formula is unchanged.

---

### DB-5.2 · How expected income is shown

> **Owner decision (DEC-027, 26 Nov): Approved.**

**Decision:** Show each expected payment as its own "If [payment] arrives on [date]" line, **never added together**. **Remove** today's combined Plan line, "If expected income arrives: KSh X a day".

**Recommendation:** Approve both parts.

**Alternatives:**
- keep the combined line alongside the per-payment lines;
- keep only the combined line (today).

**For an ordinary user:** Someone expecting 3,000 from a client and 10,000 from a chama payout sees two separate lines with dates, instead of one big "if it all comes" number that can feel like money already in hand.

**Risks:**
- **Financial:** the combined total encourages counting money before it arrives. Removing it reduces that risk.
- **Habit:** existing users lose a familiar line. This is a small change to explain.

**Changes an existing rule?** **No financial rule** (DEC-015 already says expected income is shown separately). It **removes an existing display line** (from CR-003).

---

### DB-5.3 · Planning horizon for irregular income

> **Owner decision (DEC-027, 26 Nov): Approved.**

**Decision:** For irregular income, the verdict always covers the user's planning period (7, 14 or 30 days), **never shortened** to the date of an expected payment.

**Recommendation:** Approve.

**Alternative:** End the horizon at an expected payment the user marks as "my next income". This is not recommended: the model showed it assumes the payment arrives (Otieno looked On track over 2 days, but is Short over 7).

**For an ordinary user:** A boda rider or mama mboga gets an answer for the whole week, whether or not a promised payment comes.

**Risks:**
- **Financial:** the alternative is the risky one.
- **Usability:** a longer horizon can look stricter. That is intentional.

**Changes an existing rule?** **No.** It confirms DEC-015's irregular planning period.

---

### DB-5.4 · A bill due on payday itself

> **Owner decision (DEC-027, 26 Nov): Approved, provided the payday exclusion is clearly explained.**

**Decision:** Under DEC-015 the period ends the day *before* payday, so a bill due *on* payday isn't counted in this period. Choose whether to keep that and add a warning note, or count such bills in this period.

**Recommendation:** Keep DEC-015 and show a note: "Rent is due on your payday. If your pay comes late, …"

**Alternative:** Amend DEC-015 to count payday bills in the current period. This is more cautious, but lowers Left to spend for everyone with a payday bill.

**For an ordinary user:** With the recommendation, a person whose rent and salary share a date sees a warning, not a reduced figure. With the alternative, their daily figure drops before payday even if the salary always arrives in the morning.

**Risks:**
- **Financial:** the recommendation relies on the user reading the note.
- **Consistency:** the alternative would change existing users' figures after an update.

**Changes an existing rule?** Recommendation: **No.** Alternative: **changes DEC-015.**

---

### DB-5.5 · Usual daily spending estimate

> **Owner decision (DEC-027, 26 Nov): Approved, with confidence levels, transparent reconcile adjustments and Count it/Undo; unexplained shortfalls stay distinguishable from recorded spending.**

**Decision:** How PesaPilot estimates "usual spending per day" (D), and how it shows how sure it is.

**Recommendation** (exact rules in DB-5 brief §5.4; 16 model-checked cases):
- **Total ÷ 28 calendar days** (the last 28 full days before today). Empty days count as zero.
- **A recorded day** is a day with ≥ 1 expense above zero that isn't reversed, by the entry's own date. Bills, goal use, transfers and adjustments don't count.
- **Reconcile differences:** only **shortfalls** raise the estimate. Surpluses (income, refunds, transfers in) never lower it. A shortfall ticked "spending I didn't record" is counted. An **unexplained** shortfall is counted (the cautious choice) but **shown separately** ("includes KSh X your balance checks couldn't explain; without it, about KSh Y") with [Explain it]. Explained transfers or reversals are reversed and not counted. Each shortfall is spread over its own account's stretch; only the window part counts (DB-5 brief §5.4.5, cases R1–R5).
- **One-offs** (over 3× the median, with ≥ 10 entries) are left out and listed under "How this is worked out", with **Count it / Undo**.
- **Confidence shown:**
  - **Checked:** every spending account reconciled within 14 days;
  - **From your records only:** labelled "not yet checked; if anything wasn't recorded, you spend more";
  - **Incomplete:** under half the days recorded. **No figure from the records is shown**; the app asks, then uses the higher figure;
  - **Not enough history:** under 7 days; the app asks.
- Figures are rounded to the nearest KSh 10 and always say "about".
- The user can override, with an end date.

**Alternatives:**
- the median of daily totals (more robust, harder to explain);
- user-entered only (simplest; often guessed low).

**For an ordinary user:** "You usually spend about KSh 450 a day (last 4 weeks)." They can change it ("this week I'll spend 400").

**Risks:**
- **Financial:** too low an estimate makes the verdict optimistic. Mitigated by showing the figure and allowing overrides.
- **Accuracy:** forgotten entries make it too low. Guarded by the coverage check, reconcile gaps, "use the higher figure", and the confidence label.
- **Partial recording** (every day has *some* entry) can't be detected except by reconciling. It is labelled "from your records only" until checked.
- **Too high:** one-offs are listed and excluded; bills are excluded.
- **Maintenance:** the exclusion rules need tests.

**Changes an existing rule?** **New rule.** Its override is stored data: see DB-5.12.

---

### DB-5.6 · Cushion for "Tight"

> **Owner decision (DEC-027, 26 Nov): Approved: a warning threshold only, never deducted.**

**Decision:** What separates "On track" from "Tight".

**Recommendation:** The user's safety buffer if set; otherwise max(KSh 500, 10% of usual spending for the period). The default cushion only labels the verdict; it is never deducted.

**Alternatives:**
- the buffer only (users without a buffer never see "Tight");
- a fixed KSh 1,000 (too big for a 3-day horizon, too small for a month).

**For an ordinary user:** "Tight" means "one surprise cost could leave you short", which is a useful early warning.

**Risks:**
- **Financial:** low.
- The default threshold is a judgement call, to be checked in testing.

**Changes an existing rule?** **New rule.** It reuses the existing buffer setting without changing how the buffer is deducted (DEC-015).

---

### DB-5.7 · Late or missing income

> **Owner decision (DEC-027, 26 Nov): Approved, with the DEC-015 amendment and clear treatment of late, cancelled and received payments.**

**Decision:**
- **(a)** An expected payment whose date has passed shows **"Late"** (worked out, not stored). The user is asked once: **Received** / **New date** / **It won't come**. "It won't come" is kept in history as *cancelled*, not deleted. Partly paid: the remainder can stay expected.
- **(b)** For a fixed payday: when payday passes with no income recorded, the plan **doesn't roll over** to next month. It shows "Waiting for your pay" and keeps counting days and bills until income is recorded or the user answers.

**Recommendation:** Approve both.

**Alternative:** Do nothing until the user edits the item. This is today's behaviour: after payday, the plan rolls over as if paid.

**For an ordinary user:**
- When a client doesn't pay, nothing jumps: the money was never counted.
- When a salary is late, the app stops planning the new month with money that hasn't come, and asks, "Has your pay arrived?"

**Risks:**
- **Financial:** today's roll-over can overstate free money after a missed payday. This fixes it.
- **Data:** a new "cancelled" status value.
- **Usability:** a daily question until answered; it can be dismissed.

**Changes an existing rule?**
- **(a): New rule.** The new status value is covered by DB-5.12.
- **(b): Extends DEC-015.** The planning period no longer automatically rolls over at payday. Left to spend uses the same period as the verdict, so this changes which dates DEC-015 plans for, not its formula.

---

### DB-5.8 · Salary late this month

> **Owner decision (DEC-027, 26 Nov): Approved: one cycle only.**

**Decision:** Add "My pay is late this month", which sets a new payday **for this cycle only**. The usual payday is unchanged.

**Recommendation:** Approve.

**Alternative:** The user edits their usual payday, and must remember to change it back. This risks wrong plans in later months.

**For an ordinary user:** "Salary comes on the 2nd this time." The plan stretches to cover it, and bills that now fall before the pay (e.g. rent) are protected. In example 1b this turns On track into Short by KSh 2,400, which is the honest answer.

**Risks:**
- **Financial:** reduces risk.
- **Data:** a new optional setting, removed automatically after that payday.
- **Maintenance:** small.

**Changes an existing rule?** **Extends DEC-015.** This cycle's period end moves, for both Left to spend and the verdict. Stored data: DB-5.12.

---

### DB-5.9 · Savings in the verdict

> **Owner decision (DEC-027, 26 Nov): Approved: savings never automatically released or used.**

**Decision:**
- Money set aside is never counted, and is shown separately.
- If the user is Short only because of this period's savings plan, say "You'd make it if you set aside KSh X less this period".
- Before You Spend may **offer** "Use money from a savings goal" (the existing action).
- Nothing is ever released or used automatically.

**Recommendation:** Approve.

**Alternative:** Don't mention savings in the verdict (simpler, but hides a real option).

**For an ordinary user:** Their school-fees savings stay protected, and they learn they *could* save less this week without the app touching anything.

**Risks:**
- **Financial:** low. The decision always stays with the user.
- **Behaviour:** the suggestion might tempt people to under-save. The wording stays neutral.

**Changes an existing rule?** **No.** It uses DEC-022 as approved.

---

### DB-5.10 · Fuliza and loans repaid automatically

> **Owner decision (DEC-027, 26 Nov): Approved deferral to DB-3; until then, disclose that Fuliza repayments are not fully modelled.**

**Decision:** How to treat debts that M-Pesa repays automatically from incoming money.

**Recommendation:** Decide this in **DB-3** (Fuliza, chama and family-support rules). Until then:
- don't deduct them;
- the "if it arrives" lines warn that some incoming money may be taken first.

**Alternative:** Deduct the outstanding Fuliza balance now as a must-pay. This is more cautious, but sets a debt rule ahead of DB-3.

**For an ordinary user:** With the recommendation, a user with Fuliza 800 sees "If the 3,000 arrives, Fuliza may take 800 first", but the 800 isn't yet protected in the verdict.

**Risks:**
- **Financial:** until DB-3, the verdict can be slightly optimistic for heavy Fuliza users. The warning line reduces this.

**Changes an existing rule?** **No.** The alternative would add a debt rule (DEC-010 area) early.

---

### DB-5.11 · Before You Spend actions

> **Owner decision (DEC-027, 26 Nov): Approved, provided actual and planned spending can't be double counted (design in DB-5 brief; also fixes D14).**

**Decision:** The buttons after a Before You Spend check.

**Recommendation:**
- **Record this expense** (opens the normal form, pre-filled);
- **Not now** (records nothing);
- **Save as planned spending** (adds to the existing planned-spending amount).

**Alternative:** Record / Not now only.

**For an ordinary user:** "I'll buy the school shoes on Saturday" can be planned now, so the daily guide already allows for it.

**Risks:**
- **Accuracy:** planned spending is a single amount today. Users may forget to clear it after buying, which would double count until removed. This needs clear wording, and a prompt when a matching expense is recorded.

**Changes an existing rule?** **No.** It uses DEC-015's planned spending.

---

### DB-5.12 · Four optional stored fields

> **Owner decision (DEC-027, 26 Nov): Approved conditionally: after D13, with migration, rollback, backup-compatibility and cancellation-recovery tests.**

**Decision:** Allow three new, optional, additive pieces of stored data:
1. a usual-spending override with an end date (DB-5.5);
2. a one-cycle payday change (DB-5.8);
3. a "cancelled" status for expected income, recorded by a `cancelledAt` date (DB-5.7);
4. a list of one-off purchases the user chose to "Count it" in the estimate (DB-5.5; added 26 Nov).

**Recommendation:** Approve, **only after D13 is fixed and released**, and with a **schema version bump (10 → 11)** plus a new backup version.

**Why the bump is needed (checked in the code):**
- Release 1 keeps unknown profile settings (fields 1 and 2 survive).
- But Release 1 **rewrites any expected-income status other than "received" to "expected"** (`index.html:853`).
- If Release 1 ever saved data containing "cancelled", a cancelled payment would come back as expected. It still wouldn't be counted, but it would reappear.
- With the bump:
  - the D13 guard makes an older version read-only for this data;
  - an older version refuses the new backups (tested for DB-4: "created by a newer version").

**Alternative:** None. This drops DB-5.5's override, DB-5.7's "won't come" and DB-5.8.

**For an ordinary user:** Nothing visible on its own. It enables the features above.

**Risks:**
- **Data-loss:** low. The fields are additive and need no migration.
- **Compatibility:** an older version saving newer data is exactly D13, so D13 must ship first, and the schema must be bumped so the guard applies.
- **Migration:** the bump is a **small data migration** (10 → 11: only the version label and defaults). Under DEC-017 it gets the full migration and rollback tests and deployment approval.
- **Maintenance:** included in backups; tested with import into older versions.

**Tested on a copy (25 Nov):**
- Release 1 only *opening* schema 11 data changes nothing.
- Release 1 *saving* it relabels it schema 10 and rewrites "cancelled" to "expected", **but keeps a `cancelledAt` date and both new profile settings**.

**So the design has four layers:**
1. D13 first;
2. schema 11 + a new backup version (Release 1 refuses the backups);
3. `cancelledAt` as the source of truth, with the status restored from it on the next load;
4. a rollback floor (never Release 1 after schema 11).

Details: DB-5 brief §7.

**End-to-end test (26 Nov), real Release 1 + schema 11 reference:** PASS.
- create → cancel → Release 1 opens and saves → reopen;
- the cancellation is restored from `cancelledAt`; it is absent from pending payments, forecasts and late reminders;
- the backup and safety-backup refusals were tested.
- **Limit:** while Release 1 runs, it displays the payment as expected (never counted).

Details and the backup-version scope: DB-5 brief §7.

**Release requirement:** the cancellation test must be **re-run against the actual DB-5 implementation** and pass before any schema 11 release is offered for approval. The Release 1 display issue is recorded as **R4** in the release risk register.

**Changes an existing rule?** **Data structure change:** schema 11, with optional fields. No existing field changes meaning. A production data migration under DEC-017.

---

### DB-5.13 · Timing scenarios

> **Owner decision (DEC-027, 26 Nov): Approved.**

**Decision:**
- **"If no money comes in"** is always shown and checks the **next 30 days**, including payments **after** an expected payday. It shows the first payment that couldn't be fully paid, and how long the money lasts.
- **One "if [payment] arrives" scenario per expected payment.** On the day money is expected, payments due that day are taken *before* the money arrives.

**Recommendation:** Approve.

**Alternatives:**
- check only until the next income (misses "salary late, rent unpaid");
- 14 days ahead (lighter, but misses bills later in the month).

**For an ordinary user:** "If your salary doesn't come on 30 Nov, rent on 1 Dec couldn't be paid: you'd have about KSh 4,800." This is shown even when the verdict is On track, as a safety net.

**Risks:**
- **Usability:** more lines on screen. They must be short and clearly labelled.
- **Financial:** this reduces risk.
- **Accuracy:** repeating bills must be expanded into their actual dates within the 30 days. This must be tested.

**Changes an existing rule?** **New rule.**

---

### DB-5.14 · Short vs Already short wording

> **Owner decision (DEC-027, 26 Nov): Approved for user testing, not as final wording.**

**Decision:** Plain explanations:
- **Already short** = "the bills alone don't fit". Spending less can't fix it.
- **Short** = "the bills fit, but bills plus everyday spending don't". Spending less can, and the app says by how much.

**Recommendation:** Approve as drafted, then check it in user testing, as with DEC-026's first-run test.

**Alternative:** Different wording after testing.

**For an ordinary user:** They know at once whether cutting daily spending is enough, or whether they need more money or a later payment date.

**Risks:** Misunderstanding, to be measured in testing. Low otherwise.

**Changes an existing rule?** **No.**

---

# DB-4 · Protected (encrypted) backup files

### DB-4.1 · Add protected backups

**Decision:** Add password-protected backup files as a future build stage, **after Release 1 and the D13 release**.

**Recommendation:** Yes.

**Alternative:** Not now. Plain backups only (today).

**For an ordinary user:** They can keep a copy of their records on Google Drive, email or WhatsApp-to-self, knowing nobody can read it without their password.

**Risks:**
- **Privacy:** improves. Today's file is readable by anyone who gets it.
- **Data-loss:** **new risk.** If both the password and the recovery code are lost, protected backups can't be opened by anyone, including PesaPilot. Records still on the phone are unaffected.
- **Maintenance:** decryption code must be kept forever, so old files stay openable.
- **Cost:** KSh 0, no servers.

**Changes an existing rule?** **Extends DEC-020.** `DATA_RECOVERY.md` and the in-app wording must change: "backups are not encrypted" becomes "plain or protected".

DEC-019 is unchanged: no PIN or hash in any file. The wording stays accurate: "your **backup file** is encrypted", never "your records are encrypted".

---

### DB-4.2 · Encryption method

**Decision:**
- AES-GCM with a 256-bit key and a random IV for each backup;
- the password turned into a key with PBKDF2-SHA-256 at **600,000 rounds** and a random salt;
- everything in standard browser features.

**Recommendation:** Approve. Confirm the rounds after timing on a real low-end Android phone (target: unlock in about 2 seconds or less).

**Alternative:** Different settings if phone timing is too slow (fewer rounds = faster, but easier to guess).

**For an ordinary user:** Opening a protected backup takes a second or two. Everything else is unchanged.

**Risks:**
- **Security:** strong, standard choices. **Tested:** tampering is detected.
- **Performance:** 77 ms in this environment; estimated 1–2 s on a low-end phone (to verify).

**Changes an existing rule?** **No.** The PIN keeps its own setting (DEC-019).

---

### DB-4.3 · Recovery approach

**Decision:** What opens a protected backup.

**Recommendation:** **Password + recovery code.** The recovery code is 16 characters (like `K7QM-3XRA-9VTE-HW2C`), shown once, written on paper. Either opens the file.
- **How:** each one unlocks its own locked copy of the backup private key, which then opens that file's key. A replacement phone can be restored with **the code alone**, and the code stays valid afterwards.
- All 7 of your questions are model-checked (DB-4 brief §3a).

**Alternatives:**
- password only (one forgotten password = backups lost);
- recovery code only (nothing to remember, but typing 16 characters on every restore, and losing the paper = loss).

**For an ordinary user:** If they forget the password, the paper code still gets their records back on a new phone.

**Risks:**
- **Data-loss:** reduced compared with password only.
- **Security:** the paper code must be kept private, like an M-Pesa PIN slip.
- **Usability:** one extra setup step, plus a 4-character check that they wrote it down.

**Changes an existing rule?** **No.**

---

### DB-4.4 · Default choice

**Decision:** What happens the first time a user taps Back up.

**Recommendation:** Offer protection first ("recommended"). "Save without protection" stays available, with a clear warning.

**Alternatives:**
- force protection (more people may end up with no backup at all);
- keep plain as the default (weaker privacy).

**For an ordinary user:** A clear, guided choice. Nobody is blocked from backing up.

**Risks:**
- **Privacy:** some users will choose plain files.
- **Data-loss:** forcing protection would spread the forgotten-password risk to everyone. The recommendation avoids that.

**Changes an existing rule?** **No.**

---

### DB-4.5 · One-tap backups

**Decision (revision 2, 26 Nov):**
- The phone keeps the backup **public key** and the two password/code **locks** in IndexedDB.
- Each backup is locked with a fresh one-time key that only the matching private key can open. That private key exists only inside the locks.
- So backups are one tap, with no password, but **nothing stored on the phone can open a backup**.
- Never put in any export.

Full architecture: DB-4 brief §3a.

**Recommendation:** Yes.

**Alternative:** Type the password for every backup (no stored items at all, but more friction, so fewer backups).

**Withdrawn alternative:** keep a non-extractable data key on the phone (round 2).
- **Tested:** same-origin code (a service worker) retrieved it and **decrypted a backup**.
- "Non-extractable" stops copying the key's value, **not using it**.

**For an ordinary user:** "Back up" is one tap, so backups happen more often. Nothing else changes.

**Risks:**
- **Security (what is guaranteed):** with only the phone's stored items, **no backup can be opened**. Model-checked, and browser-tested from a worker.
- **Limits (stated, not hidden):**
  - the stored items are **reachable** by code on PesaPilot's address;
  - the locks can be copied and **guessed offline**, as they can from any backup file. Hence 600,000 rounds and the 4-word guidance;
  - malicious code on PesaPilot's address could capture a password **while it is typed**, or swap the public key so that *future* backups are locked to it. Such code could already read the records directly. Defences: no third-party scripts, a content security policy, and a worker with no storage code.
- **Maintenance:** new stored items, kept out of every export by tests like DEC-019's.

**Changes an existing rule?** **New on-phone items** (not secret enough to open anything), handled by DEC-019's rule: never exported.

**Proposed storage:** IndexedDB, separate from the records (localStorage). No schema change; older versions ignore it.

---

### DB-4.6 · Backup password (revised 26 Nov)

**Decision:** Whether PesaPilot generates the backup password or the user creates it, and what strength is required.

**Recommendation:**
- **PesaPilot generates it:** 5 words chosen by the phone's secure random generator from a fixed list of 2,048 short Kiswahili and English words (≈ 2⁵⁵ possibilities).
- "Give me different words" lets the user pick a memorable set.
- **A user-created password is allowed only if** a strength check rates it at least as strong.
- Never the PIN; never stored; never in any file.

**Alternatives:**
- generated only (simplest, strongest);
- user-created with simple rules: **not recommended**, because a made-up four-word phrase gives no assurance of strength;
- 4 generated words: ≈ 2⁴⁴, about 4 months on 100 graphics cards [estimate], so **not enough**.

**For an ordinary user:** They get five everyday words to write down or remember, for example (format only) `mvua kalamu tisa dirisha punda`, plus the recovery code on paper.

**Risks:**
- **Security:** strong against offline guessing (~600 years on 100 graphics cards [estimate]).
- **Data-loss:** generated words can be forgotten. The recovery code and the monthly check cover this.
- **Maintenance:** a curated 2,048-word list, reviewed by a Kiswahili speaker, that must **never change** once in use; plus a strength checker if user-created passwords are allowed.

**Changes an existing rule?** **No.**

---

### DB-4.7 · Monthly password check

**Decision:** With the monthly backup reminder, ask "Do you still remember your backup password?" and check it on the phone.

**Recommendation:** Yes.

**Alternative:** No checks.

**For an ordinary user:** A short monthly prompt. If they've forgotten, they set a new password and make a fresh backup before it matters.

**Risks:**
- **Usability:** a small monthly nudge.
- **Data-loss:** reduces it.

**Changes an existing rule?** **Extends DEC-020's** backup reminder.

---

### DB-4.8 · How the file is saved

**Decision:** Use the phone's share sheet (Drive, Gmail, WhatsApp, Files…), with a normal download as the fallback.

**Recommendation:** Approve. Test the file type with WhatsApp and Drive on common Kenyan Android phones first.

**Alternative:** Download only (today). The file stays in Downloads on the same phone, which doesn't protect against losing the phone.

**For an ordinary user:** "Save to Drive" or "send to myself on WhatsApp" in one step.

**Risks:**
- **Privacy:** the user chooses where the file goes. It is protected if they chose protection.
- **Compatibility:** some apps may reject the file type; to test.

**Changes an existing rule?** **No.**

---

### DB-4.9 · Forgot-PIN path

**Decision:** Keep today's "Forgot your PIN?" path unchanged: it saves a copy, resets the phone and re-imports.

**Recommendation:** Keep the process unchanged, but make the plain copy **unmistakable** (DB-4 brief §5a):
- "**This copy is NOT protected.** Anyone who opens this file can read all your records";
- the file is named `PesaPilot-UNPROTECTED-copy-<date>.json`;
- after restoring: "Delete the unprotected copy from Downloads. PesaPilot can't delete it for you";
- the same wording in `DATA_RECOVERY.md`.

**Alternative:** Make that copy a protected file. This is more private, but if the user has also forgotten the backup password, they could lose everything during the reset.

**For an ordinary user:** As today, but with clear warnings and a reminder to delete the copy.

**Risks:**
- **Privacy:** that copy is a plain file left in Downloads. Someone with the phone could already use this path today; DATA_RECOVERY states it honestly. The alternative trades this for data-loss risk.

**Changes an existing rule?** **No rule.** Wording changes in the current Forgot-PIN screens and in `DATA_RECOVERY.md` (DEC-020), built with DB-4.

---

### DB-4.10 · Automatic Drive backup and PesaPilot cloud

**Decision:** Whether to pursue:
- (Option 2) automatic backups to the user's own Google Drive; or
- (Option 3) a PesaPilot cloud.

**Recommendation:** **Not now.**
- Revisit Option 2 with interview evidence.
- Option 3 needs its own brief and legal review.

**Alternatives:**
- investigate Option 2 now;
- plan Option 3.

**For an ordinary user:** Backups stay manual, with reminders.

**Risks:**
- **Data-loss:** manual backups depend on habit.
- **Option 2:** Google sign-in, verification and support costs.
- **Option 3:** we would hold financial data, with Kenya Data Protection Act duties, cost and breach risk.

**Changes an existing rule?** **No.** It keeps DEC-005 (no cloud) and DEC-023 (local-first).

---

### DB-4.11 · Integrity, verification and repair (new, 26 Nov)

**Decision:** How PesaPilot detects lost, damaged or swapped backup-protection items on the phone, and how users recover.

**Recommendation** (DB-4 brief §3b; model cases D-a to D-e):
- **Before every one-tap backup:** an integrity check of the stored items. If they are missing or damaged, **the backup is refused** ("Backup protection needs repair"), so no file nobody can open is ever written.
- **Verify** that the locked private key matches the stored public key (needs the password or code):
  - right after setup;
  - after a password change, restore or repair;
  - in the **monthly password check**.

  This catches a deliberate swap within a month.
- **Repair from any earlier backup file** with the password or code. It is re-locked with the **current** password, with the same key pair and the same recovery code. "Start new protection" is the fallback.

**Alternative:** No repair. After any damage the user must start new protection (new code), and old backups need the old secrets.

**For an ordinary user:** If something goes wrong on the phone, PesaPilot says so *before* making a useless backup, and fixes it with their password or code and one of their backup files.

**Risks:**
- **Security:** a deliberate swap by malicious code on PesaPilot's address is detected only at the next verification. **Backups made in between are locked to the attacker's key** (a stated limit; the same code could already read the records).
- **Maintenance:** small; covered by the model's tests.

**Changes an existing rule?** **No.** It extends DEC-020's monthly reminder with the verification.

---

# DB-6 · Installable and offline PesaPilot (PWA)

### DB-6.1 · Build a full PWA

**Decision:** Make PesaPilot installable and able to open offline, as **Stage C**, **after Release 1 and the D13 release**.

**Recommendation:** Yes.

**Alternatives:**
- manifest only (little value; no offline opening);
- do nothing.

**For an ordinary user:**
- a home-screen icon;
- the app opens with no data bundle;
- "Install app" in Settings finally works.

**Risks:**
- **Maintenance:** a new release-risk area, because stale copies on phones could run old code. Handled by DB-6.2 to DB-6.5 and the D13 guard.
- **Privacy:** unchanged. The records are in localStorage, which a worker can't reach [tested]. The worker contains no storage code (test-enforced). See DB-6 brief §2a.
- **Cost:** KSh 0.

**Changes an existing rule?**
- Fixes **D9**.
- **Extends DEC-017's release process**: every release must bump the worker version and have the kill switch ready.
- Stays within DEC-002: still no build step, just two small extra files.

---

### DB-6.2 · Page update method

**Decision:** When online, always fetch the latest app. Use the phone's saved copy if there is no answer within **3 seconds**, or when offline.

**Recommendation:** Approve.

**Alternatives:**
- cache first: fastest, but every update runs the **old version at least once**, which is dangerous with data changes;
- strict network first: always newest, but slow or no opening on poor networks.

**For an ordinary user:**
- On a good network: always the current version.
- On a poor one: the app still opens within about 3 seconds.
- Offline: it opens normally.

**Risks:**
- **Data:** an offline phone runs its saved copy. That is safe because of the D13 guard (an older copy facing newer data won't save).
- **Tested:** offline after an update now opens the newest version seen. The first proof had a bug here; the fix is in the design.

**Safeguards** (DB-6 brief §3a):
- **atomic installs:** all files or nothing; a failed install keeps the current version [tested];
- **failed or slow downloads:** the current version's copy is used;
- **no mixing:** each version uses only its own cache; the page/worker version is checked; all tabs reload together; D13 guard;
- **real-Android testing:** required before any deployment approval.

**Changes an existing rule?** **No.**

---

### DB-6.3 · Switching versions

**Decision:** When a new version arrives while the app is open:
- show "A new version is ready. **Reload**";
- never switch mid-form;
- all open tabs reload together.

**Recommendation:** Approve.

**Alternative:** Switch automatically. This risks interrupting someone typing an entry.

**For an ordinary user:** They finish what they're doing, then tap Reload.

**Risks:**
- **Usability:** a user who never taps Reload stays on the current version until they next close and reopen. That is acceptable, because the page is fetched fresh on the next open.

**Changes an existing rule?** **No.** It works with the existing cross-tab protection (R1).

---

### DB-6.4 · Kill switch

**Decision:** How to switch the offline feature off on every phone in an emergency.

**Recommendation:** A self-removing worker file. When deployed, each phone that comes online deletes the saved copies and returns to normal web loading.

**Alternative:** A separate control file the worker checks. More moving parts.

**For an ordinary user:** Nothing visible, unless it is used. Then the app simply needs internet to open again, as today.

**Risks:**
- **Reach:** a phone that stays offline keeps its copy until it comes online. The D13 guard protects its data.
- **Tested:** the worker and copies were removed, and the data was identical.

**Delivery and rollback** (DB-6 brief §3a):
- `sw.js` is never taken from the HTTP cache (`updateViaCache: "none"`), and the app checks for updates on every open. So every phone that opens online gets the kill switch on that open [tested].
- **Offline phones** get it on their first online open; until then the D13 guard protects them.
- **Rollback floor:** after a schema change, roll back only to a build that understands that schema.

**Changes an existing rule?** **No.**

---

### DB-6.5 · What is cached

**Decision:** Cache **only** the app files (page, font, icons, manifest). **Never** `/docs/`, prototypes, demo data or any records.

**Recommendation:** Approve.

**Alternative:** None sensible.

**For an ordinary user:** Nothing visible. Small storage use.

**Risks:**
- **Privacy:** none added.
  - **Corrected:** a service worker can't reach **localStorage**, where all PesaPilot records are kept [tested]. It *can* reach IndexedDB and Cache Storage.
  - The worker's code only caches app files.
  - A test fails if `sw.js` mentions any storage API.
  - **Corrected 26 Nov:** a worker *can* retrieve and **use** CryptoKeys in IndexedDB, even non-extractable ones (tested). DB-4 revision 2 therefore stores there only a public key and locks, which can't open a backup.
- **Maintenance:** the file list must be updated if app files change; a test checks it.

**Changes an existing rule?** **No.** It complements the open Release 1 checklist item about keeping `/docs/` off the live site.

---

### DB-6.6 · Persistent storage request

**Decision:** Ask the browser to keep PesaPilot's data ("persistent storage") after installing or after the first backup.

**Recommendation:** Yes.

**Alternative:** Don't ask.

**For an ordinary user:** Less chance of the phone clearing PesaPilot's records when storage runs low. It doesn't help if the user clears data themselves or loses the phone; backups remain essential.

**Risks:**
- **Low.** The browser decides, and it may show a permission prompt on some browsers.

**Changes an existing rule?** **No.** It supports DEC-020.

---

### DB-6.7 · Install suggestion

**Decision:** How PesaPilot suggests installing.

**Recommendation:**
- the Settings button;
- the browser's own offer;
- **one** dismissible Home tip after the first backup, never repeated.

**Alternative:** Settings only.

**For an ordinary user:** One gentle tip, no nagging.

**Risks:**
- **Low.**

**Changes an existing rule?** **No.**

---

### DB-6.8 · Rollback procedure

**Decision:** Once Stage C exists, emergency rollback must also deploy the kill switch.

**Recommendation:** Approve. Update the release checklist's recovery steps when Stage C is built.

**Alternative:** None safe. Without it, some phones could keep a saved copy longer than intended.

**For an ordinary user:** Nothing visible. It makes emergency recovery reliable.

**Risks:**
- **Maintenance:** one more step in an emergency, practised in testing.

**Changes an existing rule?** **Changes the recovery procedure** in `RELEASE_1_CHECKLIST.md` §8, for releases after Stage C. Release 1 itself is unaffected.

---

### DB-6.9 · Native Android app

**Decision:** Whether to build a Play Store app.

**Recommendation:** **Not now.**

**Alternative:** Investigate later, with evidence of demand.

**For an ordinary user:** No Play Store listing. The installable web app gives a similar experience.

**Risks:**
- **If built:** signing keys, store policies, slower updates and a second release channel.

**Changes an existing rule?** **No.**

---

## What happens after your review
1. You approve, change or reject each choice. I record approved choices in `DECISIONS.md` (one decision per brief) and in `MASTER_PROJECT_STATE.md`.
2. **No building starts** until you separately approve building that brief.
3. **The order stays:**
   - Release 1 (needs your preview review and deploy approval);
   - then the D13 release;
   - then DB-4, DB-5 and DB-6 stages, each approved, built, tested and deployed on its own.
