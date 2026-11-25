# P2 · M-Pesa Message Capture (paste/share): research & specification

**Status:** research and design only (DEC-023). Building it needs **DB-1 approval** (§9), and the Fuliza parts also need **DB-3**. No code is written.

**Goal:** let users paste or share an M-Pesa confirmation message into PesaPilot, which then:
- extracts the details **on the phone**;
- **proposes** a correctly classified entry for the user to confirm;
- never double-counts.

There is **no SMS-reading permission and no server**.

---

## 1. Principles
1. **The user confirms every entry.** Nothing is saved automatically. The parser proposes; the person decides.
2. **When unsure, ask.** An unrecognised or ambiguous message opens the normal form pre-filled with whatever was understood. It never guesses silently.
3. **Same rules as manual entry.** Captured entries are ordinary PesaPilot entries (income, expense, transfer, borrow, debt repayment), so every existing financial rule and test applies unchanged.
4. **Privacy.**
   - The message text is processed in the browser and **discarded**. Only the extracted fields and the M-Pesa code are kept.
   - No real messages are ever committed to the public repository.
5. **Pasted text can't be verified as genuinely from M-PESA.** That's fine for a personal record: it is the user's own data. But the confirm screen says "from a message you pasted", and the app never treats it as proof of payment.

---

## 2. What we know about message formats

**Evidence:**
- Public parsing projects and examples show a consistent anatomy: a 10-character transaction code, "Confirmed.", the amount, the counterparty, the date and time, "New M-PESA balance is Ksh…", and "Transaction cost, Ksh…". Paybill messages add "for account …". Received money says "You have received Ksh… from …".
  - Sources: [Piyese/MPesa-decoder](https://github.com/Piyese/MPesa-decoder); [Medium: extracting M-Pesa messages](https://medium.com/@kaluwanjala/using-python-to-extract-useful-information-from-m-pesa-messages-for-analysis-f4bd6e9d340e).
- **Fuliza:** Safaricom confirms an SMS is sent after every Fuliza transaction showing the outstanding amount, and that incoming money automatically repays Fuliza. Public sources describe the *content* (amount borrowed, access fee, outstanding amount), but **I could not find verified wording**.
  - Source: [Safaricom Fuliza FAQ](https://www.safaricom.co.ke/media-center-landing/frequently-asked-questions/fuliza-m-pesa).
- **Reversals:** customers forward a message to 456. The "Reversal" sender confirms the request started and later reports the outcome. **The wording of the completion message is not publicly documented.**
  - Source: [Safaricom M-PESA reversal](https://safaricom.co.ke/media-center-landing/terms-and-conditions/m-pesa-reversal).

**Therefore:**
- The examples in §3 are **illustrative synthetic messages** built from the public anatomy, with fake codes, names and numbers.
- **Before any build, every pattern must be verified against real messages**, supplied privately by the owner or beta volunteers and kept outside the repo (§8).
- Formats also change over time (promotional tails such as Ziidi adverts, wording tweaks), so the parser must be tolerant and well tested.

---

## 3. Message catalogue and classification

Legend:
- **Verified anatomy** = matches public examples.
- **Unverified** = wording must be confirmed with real messages.

| # | Message type | Illustrative synthetic example *(fake)* | Proposed PesaPilot entry | Fee handling | Confidence |
|---|---|---|---|---|---|
| 1 | **Money received** (person) | `TKA1B2C3D4 Confirmed.You have received Ksh2,500.00 from JANE WANJIRU 0712345678 on 21/11/26 at 6:42 PM New M-PESA balance is Ksh4,310.50.` | **Ask:** income (default, with category) **or** money paid back to me **or** transfer from my own other line or account **or** loan received (borrow) | None | Verified anatomy |
| 2 | Money received from a **business or bank** (salary, refund, bank transfer) | `TKB… Confirmed.You have received Ksh35,000.00 from EQUITY BULK ACCOUNT 300600 on 28/11/26 at 10:01 AM New M-PESA balance is Ksh39,310.50.` | Income (salary) by default; a **transfer** if the sender is mapped as the user's own bank account | None | Verified anatomy (sender names vary) |
| 3 | **Send money** to a person | `TKC… Confirmed. Ksh1,000.00 sent to JOHN OTIENO 0798765432 on 22/11/26 at 9:15 AM. New M-PESA balance is Ksh3,310.50. Transaction cost, Ksh13.00. Amount you can transact within the day is 499,000.00.` | **Ask:** expense (category, e.g. family support) **or** lent to someone (receivable, after D3) **or** transfer to my own other line | **Separate linked expense** "M-Pesa charges" Ksh13 | Verified anatomy |
| 4 | **Pay Bill** | `TKD… Confirmed. Ksh1,500.00 sent to KPLC PREPAID for account 37145678901 on 23/11/26 at 7:02 PM New M-PESA balance is Ksh1,797.50. Transaction cost, Ksh0.00.` | Expense (category from the business name, e.g. Utilities) **unless** the paybill is mapped to the user's own account (bank, SACCO, M-Shwari/KCB loan account) → **transfer**, or **debt repayment** if mapped to a loan | Linked fee if > 0 | Verified anatomy |
| 5 | **Buy Goods (till)** | `TKE… Confirmed. Ksh450.00 paid to NAIVAS SUPERMARKET. on 23/11/26 at 1:10 PM.New M-PESA balance is Ksh1,347.50. Transaction cost, Ksh0.00.` | Expense (category from the merchant, remembered per merchant) | Linked fee if > 0 | Verified anatomy |
| 6 | **Withdraw** at an agent | `TKF… Confirmed.on 24/11/26 at 8:30 AMWithdraw Ksh1,000.00 from 123456 - ABC AGENCIES KENYATTA AVE New M-PESA balance is Ksh318.50. Transaction cost, Ksh29.00.` | **Transfer M-Pesa → Cash.** *Not spending.* | Linked fee Ksh29 = expense "M-Pesa charges" | Verified anatomy (needs real samples) |
| 7 | **Deposit** at an agent | `TKG… Confirmed. On 24/11/26 at 5:00 PM Give Ksh2,000.00 cash to XYZ SHOP New M-PESA balance is Ksh2,318.50.` | **Transfer Cash → M-Pesa.** *Not income.* | None | Unverified wording |
| 8 | **Airtime / bundles** | `TKH… confirmed.You bought Ksh100.00 of airtime on 25/11/26 at 7:45 AM.New M-PESA balance is Ksh2,218.50.` | Expense "Airtime & data" | None | Verified anatomy |
| 9 | **To M-Shwari / lock savings** | `TKJ… Confirmed.Ksh500.00 transferred to M-Shwari account on 25/11/26 at 8:00 AM. M-PESA balance is Ksh1,718.50. New M-Shwari saving account balance is Ksh3,500.00.` | **Transfer M-Pesa → M-Shwari** (savings account; offered "for a goal?") | None | Unverified wording |
| 10 | **From M-Shwari** | `TKK… Confirmed.Ksh1,000.00 transferred from M-Shwari account …` | Transfer M-Shwari → M-Pesa | None | Unverified wording |
| 11 | **Payment that used Fuliza** | `TKL… Confirmed. Ksh800.00 sent to … Fuliza M-PESA amount is Ksh300.00. Access Fee charged Ksh3.00. Total Fuliza M-PESA outstanding amount is Ksh303.00 due on 25/12/26 …` | The payment as normal (#3/#4/#5) **plus** borrow Ksh300 into M-Pesa (a debt "Fuliza", **not income**) **plus** expense "Fuliza charges" Ksh3 | Access fee = expense | **Unverified wording**; **needs DB-3** |
| 12 | **Fuliza auto-repayment** when money arrives | `… Ksh303.00 from your M-PESA has been used to fully pay your outstanding Fuliza M-PESA …` | **Debt repayment** Ksh303 against "Fuliza" (not spending) | Daily fees, if itemised, = "Fuliza charges" | **Unverified wording**; DB-3 |
| 13 | **Reversal completed** | `TKM… Confirmed. Transaction TKC… has been reversed. Your account balance is now Ksh…` | Find the original by code. If it was captured, **propose reversing that entry** (§5). If not, offer a manual correction. | Fee reversal if stated | **Unverified wording** |
| 14 | **Reversal requested / declined** ("Reversal" sender) | — | **No entry.** Optionally note "reversal pending" on the original | — | Unverified |
| 15 | **Pochi la Biashara / Global pay / bank-to-M-Pesa / KCB M-Pesa loan / Hustler Fund** | — | Map to the same rules (expense, transfer, borrow, repayment) once real samples are collected | — | To research |
| 16 | **Failed / insufficient funds / balance enquiry / promotions** | — | **Ignore** (no entry); say "This message isn't a completed transaction" | — | — |

### 3.1 Transfers between the user's own accounts (the most important rule)
- An entry is a **transfer** only when **both sides are the user's own accounts**. Examples: M-Pesa ⇄ cash (withdraw/deposit), M-Pesa ⇄ M-Shwari, M-Pesa ⇄ own bank (paybill to own account number, or "received from" own bank), M-Pesa ⇄ SACCO savings, M-Pesa ⇄ the user's own second line.
- **How we know it's "own":** a local **mapping table** the user confirms once:
  - paybill + account number → my Equity account;
  - sender name → my bank;
  - phone number → my other line.
  
  After that, matching messages are proposed as transfers automatically, still confirmed by the user.
- Withdrawals and deposits at agents are *always* treated as M-Pesa ⇄ Cash transfers. A user without a Cash account is prompted to create one.
- **Never** treat a transfer as income or spending (FINANCIAL_RULES §2).

### 3.2 Charges
- The transaction cost becomes a **separate expense** in category **"M-Pesa charges"**, linked to the main entry by the M-Pesa code.
  - It is only created when the cost is > 0.
  - It is deleted or edited together with its parent.
- **Why a separate entry:** it stays visible in reports ("you paid KSh 412 in charges this month"). The main entry keeps the true amount sent. And it needs no change to how transactions are stored.

### 3.3 Fuliza (depends on DB-3)
- **Borrowing:** the Fuliza amount is recorded as **borrow** (money into M-Pesa that is **not income**) against a debt named "Fuliza". The access fee is spending ("Fuliza charges").
- **Repayment:** auto-repayment is a **debt repayment** (not spending).
- **Daily maintenance fees** are spending when a message states them. Otherwise, the user can reconcile using the outstanding amount in the next message.
- **Until DB-3 is decided,** Fuliza messages fall back to "ask the user" with a plain explanation.

---

## 4. Field extraction (tolerant parsing)

| Field | Rule |
|---|---|
| Code | The first 10-character uppercase alphanumeric token before "Confirmed" |
| Amount | The **first** `Ksh` amount that is *not* preceded by balance, cost, Fuliza or limit labels. Handle commas, "Ksh" and "KES", and decimals. |
| Counterparty | Text after "sent to", "paid to", "from" or "to", up to the phone number, " for account", " on " or "." |
| Phone | Masked or full Kenyan formats (07…, 01…, 2547…, 07******123); stored only if the user maps it as their own line |
| Account ref | The text after "for account" |
| Date/time | `d/m/yy` at `h:mm AM/PM` → the local date. Sanity-check it against today (reject dates more than a year ahead). |
| New balance | After "New M-PESA balance is" (or "M-PESA balance is") |
| Cost | After "Transaction cost" |
| Fuliza fields | Amount, access fee, outstanding, due date (patterns to be confirmed) |

**Robustness:**
- Accept text forwarded through WhatsApp (extra spaces, line breaks) and several messages pasted at once (split on transaction codes).
- Handle promotional tails, and messages split into several SMS parts (warn if the balance or cost label is missing).
- **Swahili-language messages:** catalogue them after collecting samples.

---

## 5. Reversals (needs a rule decision in DB-1)
- **Today, only adjustments can be reversed** (DEC-016).
- For an M-Pesa reversal of a captured payment, the recommended rule is to **extend the reversal pair to ordinary captured entries**:
  - add a reversal entry linked to the original;
  - both stay in history;
  - both are excluded from balances and totals.
- So a reversed KSh 1,000 payment is **not** counted as spending, and the history shows exactly what happened.
- **Alternative:** delete the original. Simpler, but it loses the record.
- The linked charge is reversed too, if the reversal message includes it.

---

## 6. Duplicate detection (essential)

| Layer | Rule | Action |
|---|---|---|
| 1. **Exact code** | An entry with the same M-Pesa code already exists | **Block** a second entry: "Already recorded on 23 Nov (Naivas KSh 450)". Offer to open it. |
| 2. **Same paste batch** | The code repeats inside one paste | Keep one, and say so |
| 3. **Probable manual duplicate** | An entry with no code, same account, same amount, within ±1 day, and similar counterparty or category | **Ask:** "You may have entered this already: link this message to it?" Linking adds the code to the existing entry instead of creating a new one. |
| 4. **Balance continuity hint** | The message's "New M-PESA balance" ≠ PesaPilot's M-Pesa balance after this entry | Show the difference and offer **Reconcile** (DEC-016). Never adjust automatically. |

Codes are stored as an **external reference** (`mpesa:<CODE>`) separate from the user-editable reference field. This is a new optional field: part of the DB-1 approval.

---

## 7. User experience (outline)
1. **Paste:** Money → "＋ From M-Pesa message" → paste. Or **share** from the Messages app straight into PesaPilot (needs an installed PWA with a share target: P6/DB-6).
2. **The confirm card shows:** what we understood ("Sent KSh 1,000 to John Otieno · 22 Nov · charge KSh 13"), the proposed classification with the one or two plausible alternatives, the account and category, and any duplicate or balance warnings.
3. **"Remember this"** for merchants, paybills, senders and own accounts makes the next one faster.
4. **Unrecognised message:** opens the manual form pre-filled with what was found.

---

## 8. Verification and test plan (before any build)
- **Real-format collection:**
  - The owner and 5–10 beta volunteers paste **their own** messages into a *private* note.
  - Codes, names and numbers are anonymised before anything is used as a test fixture.
  - **Aim for at least 3 real samples per message type** (§3), including Fuliza, reversals, withdrawals, M-Shwari, bank and paybill.
- **Synthetic test corpus** in the repo (`tests/fixtures/mpesa-messages.json`, *future*): every type, plus edge cases (commas, KES vs Ksh, line breaks, multi-paste, missing cost, future date, duplicate code, promotional tail).
- **Golden tests:** message → exact proposed entry (kind, amount, account(s), category, fee entry, Fuliza parts).
- **Financial tests:** after confirming a mixed batch, account balances, spending totals, debt outstanding and transfers all match independently calculated expectations. Withdrawals and transfers are never spending; Fuliza is never income.
- **Duplicate tests:** the same message twice; a message after a manual entry; the same code inside one paste.
- **Regression:** the full existing suite plus the engine fingerprint. Only the agreed new entry points may change.

---

## 9. What DB-1 approval would cover
1. Build a **paste**-based parser now. **Share** comes after DB-6 (PWA).
2. New optional fields:
   - `externalRef` (`mpesa:<code>`) on transactions;
   - a local **counterparty/own-account mapping** table.
3. **Charges** as separate linked expenses ("M-Pesa charges").
4. **Reversal pairs** extended to captured ordinary entries (§5).
5. **Fuliza** handling only after DB-3; until then, "ask the user".

**Explicitly excluded:**
- reading the SMS inbox;
- any server, upload or AI service;
- automatic saving without confirmation.
