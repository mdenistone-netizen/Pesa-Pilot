# Decision pack: DB-5, DB-4 and DB-6 (33 choices)

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

## Summary

| # | Question | Recommendation | Changes an existing rule? |
|---|---|---|---|
| DB-5.1 | Principles and four verdicts | Approve | New rule |
| DB-5.2 | How expected income is shown | One line per payment; remove the combined line | No rule; **removes a display line** |
| DB-5.3 | Planning horizon for irregular income | Always the planning period | No (confirms DEC-015) |
| DB-5.4 | A bill due on payday itself | Keep DEC-015; show a note | No (alternative changes DEC-015) |
| DB-5.5 | Usual daily spending estimate | 28-day average with exclusions; user can override | New rule |
| DB-5.6 | Cushion for "Tight" | Safety buffer if set; else max(500, 10%) | New rule |
| DB-5.7 | Late or missing income | Late status; Received / New date / Won't come; "Waiting for your pay" | **Extends DEC-015** + new data value |
| DB-5.8 | Salary late this month | One-cycle "my pay is late" | **Extends DEC-015** + new setting |
| DB-5.9 | Savings in the verdict | Never automatic; suggest a smaller set-aside; offer "use from goal" | No (uses DEC-022) |
| DB-5.10 | Fuliza and auto-repaid loans | Decide in DB-3; warning only until then | No |
| DB-5.11 | Before You Spend actions | Record / Not now / Save as planned | No |
| DB-5.12 | Three optional stored fields | Approve, after D13, with schema 11 | **Data structure + migration (schema 11)** |
| DB-5.13 | Timing scenarios | No-income (30 days) + one per expected payment | New rule |
| DB-5.14 | Short vs Already short wording | As drafted; test with users | No |
| DB-4.1 | Add protected backups | Yes, after Release 1 and D13 | **Extends DEC-020** |
| DB-4.2 | Encryption method | AES-GCM-256; PBKDF2 600k | No |
| DB-4.3 | Recovery | Password + recovery code | No |
| DB-4.4 | Default | Offer protection; plain stays available | No |
| DB-4.5 | One-tap backups (key kept on phone) | Yes | **New on-device secret** (DEC-019 style) |
| DB-4.6 | Password rules | 8+ chars; not the PIN; 12+ if only digits | No |
| DB-4.7 | Monthly password check | Yes, with the backup reminder | Extends DEC-020 reminder |
| DB-4.8 | How the file is saved | Share sheet; download as fallback | No |
| DB-4.9 | Forgot-PIN path | Unchanged | No |
| DB-4.10 | Drive auto-backup / PesaPilot cloud | Not now | No (keeps DEC-005, DEC-023) |
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

**Decision:** How PesaPilot estimates "usual spending per day" (D).

**Recommendation:**
- The average of the last 28 days of expense entries.
- Excluded:
  - bill payments;
  - money used from savings goals;
  - unrecorded-spending adjustments;
  - single expenses over 3× the median.
- With under 7 days of records, ask the user.
- The user can always override it, with an end date.

**Alternatives:**
- the median of daily totals (more robust, harder to explain);
- user-entered only (simplest; often guessed low).

**For an ordinary user:** "You usually spend about KSh 450 a day (last 4 weeks)." They can change it ("this week I'll spend 400").

**Risks:**
- **Financial:** too low an estimate makes the verdict optimistic. Mitigated by showing the figure and allowing overrides.
- **Accuracy:** if many expenses aren't recorded, it is too low. The reconcile reminder helps.
- **Maintenance:** the exclusion rules need tests.

**Changes an existing rule?** **New rule.** Its override is stored data: see DB-5.12.

---

### DB-5.6 · Cushion for "Tight"

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

### DB-5.12 · Three optional stored fields

**Decision:** Allow three new, optional, additive pieces of stored data:
1. a usual-spending override with an end date (DB-5.5);
2. a one-cycle payday change (DB-5.8);
3. a "cancelled" status for expected income (DB-5.7).

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

**Changes an existing rule?** **Data structure change:** schema 11, with optional fields. No existing field changes meaning. A production data migration under DEC-017.

---

### DB-5.13 · Timing scenarios

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

**Decision:** The phone keeps the backup key, so later backups need no password. The key is **never** put in any export, like the PIN.

**Recommendation:** Yes.

**Alternative:** Type the password for every backup. This is better password practice, but more friction, so fewer backups.

**For an ordinary user:** "Back up" is one tap, which means more frequent backups.

**Risks:**
- **Security:** someone who can open the app on the phone could change the backup password and then open older backups, **if** they also get those files. Changing the password needs the PIN (required at first run, DEC-026). Anyone inside the app can already see the records.
- **Maintenance:** a new secret on the phone, scrubbed from exports with the same tests as DEC-019.

**Changes an existing rule?** **New on-phone secret,** handled by DEC-019's rule: never exported.

**Proposed storage:** its own storage key, separate from the records. Then it is never part of any backup or export by design, needs no schema change, and older versions simply ignore it.

---

### DB-4.6 · Password rules

**Decision:**
- at least 8 characters;
- not the same as the PIN;
- if only numbers, at least 12 digits;
- hint: "a short sentence you'll remember".

**Recommendation:** Approve.

**Alternative:** Stricter rules (mixed characters). These are harder to remember, so more lost passwords.

**For an ordinary user:** Something like `mama mboga 2026` works, which is easy to remember.

**Risks:**
- **Security:** a guessable sentence is weaker. The 600,000 rounds slow guessing down a lot.
- **Data-loss:** stricter rules would raise forgotten-password loss.

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

**Recommendation:** Unchanged.

**Alternative:** Make that copy a protected file. This is more private, but if the user has also forgotten the backup password, they could lose everything during the reset.

**For an ordinary user:** As today.

**Risks:**
- **Privacy:** that copy is a plain file left in Downloads. Someone with the phone could already use this path today; DATA_RECOVERY states it honestly. The alternative trades this for data-loss risk.

**Changes an existing rule?** **No.**

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
- **Privacy:** unchanged; the worker can't read records.
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

**Changes an existing rule?** **No.**

---

### DB-6.5 · What is cached

**Decision:** Cache **only** the app files (page, font, icons, manifest). **Never** `/docs/`, prototypes, demo data or any records.

**Recommendation:** Approve.

**Alternative:** None sensible.

**For an ordinary user:** Nothing visible. Small storage use.

**Risks:**
- **Privacy:** none added. Service workers can't read browser storage at all.
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
