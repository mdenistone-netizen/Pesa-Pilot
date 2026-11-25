# DB-4 Decision Brief: protected (encrypted) backup files

**Status:** **Proposed, for owner decision.** Planning only. Nothing is implemented. Local-first stays the default (DEC-023).

**Builds on:**
- `BACKUP_ASSESSMENT.md` (P5), which compared 4 options;
- `../DATA_RECOVERY.md` (DEC-020);
- DEC-019 (PIN).

**Evidence used here**
- **[T] tested in this environment:**
  - today's live app and the Release 1 branch both **refuse** an encrypted-style file, with a clear message and **no change to stored data**;
  - in Chromium: password key derivation at 600,000 rounds took 77 ms; encrypting and decrypting 2 MB took 5 ms; **a tampered file is detected**.
- **[E] estimate:** on a low-end Android phone, about 10–20× slower, so roughly 1–2 seconds to unlock a backup. To be measured on a real phone before building.

---

## 1. The decision

Should PesaPilot let users save a **password-protected (encrypted) backup file**, and if so, how should passwords, recovery and restoring work?

**Why it matters**
- All records live only on the phone. A lost phone, a reset, or cleared browser data loses everything except the backup file.
- **Today's backup file is plain text.**
  - Anyone who finds it in Downloads, a WhatsApp chat, an email or a Drive folder can read the person's whole financial history.
  - That discourages people from keeping a copy off the phone, which is exactly what they need to do.
- **But encryption adds a new way to lose data:** a forgotten password. This brief is mostly about handling that honestly.

## 2. Recommendation in one paragraph
- Add **"protected backups"**: the backup file is locked with a **backup password** the user chooses, plus a **recovery code** shown once for them to write down.
- The phone's **share sheet** lets them save it wherever they like: Google Drive, email to themselves, WhatsApp to themselves, or the phone.
- PesaPilot never receives the file, the password or the code.
- **Plain backups stay available**, with a clear warning, so nobody is pushed into having no backup at all.
- Cost: **KSh 0, no servers.**
- Build it **after Release 1 and the D13 fix.**

## 3. How encryption works (plain words first)

**Plain words**
- Think of a protected backup as a **file in a locked box**.
- The **backup password** opens it, and so does the **recovery code**, which is a spare key you write on paper.
- Without either key the box can't be opened: **not by a thief, not by Google, and not by PesaPilot**. There is no master key.

**Technical detail** (all built-in browser features, as the PIN already uses)

| Part | Choice | Why |
|---|---|---|
| Data key | A random 256-bit key (K) made on the phone when protection is first switched on | Strong, and never typed by anyone |
| Encryption | **AES-GCM-256** with a fresh random IV for every backup | Standard; it **detects any change** to the file [T] |
| Password → key | **PBKDF2-SHA-256, 600,000 rounds**, random 16-byte salt | Slows down guessing. The PIN uses 150,000 rounds because it is checked often on the phone; a file that can be attacked offline needs more. |
| Two locks | K is stored inside the file twice: once locked with the password, once locked with the recovery code | Either key opens the file |
| Recovery code | 16 characters in 4 groups (e.g. `K7QM-3XRA-9VTE-HW2C`); no look-alike characters (0/O, 1/I/L); about 80 bits of randomness | Practical to write down; too strong to guess |
| File label | `app: "PesaPilot"`, a **new backup version number** (so older apps refuse it [T]), `encrypted: true`, algorithm names and settings. **Nothing about the user's money is readable.** | Safe with older apps; open about how it was made |
| Not in the file | The PIN or its hash (DEC-019), device ids, or K in readable form | Same rules as today |

**Accurate wording (DEC-019 style)**
- "Your **backup file** is encrypted: it is locked with your backup password."
- "Records **on this phone** are not encrypted. Your PIN locks the app on this phone."
- We never say "your data is encrypted" without saying which data.

## 4. Passwords

**Setting it up.** The first time the user taps **Back up**:
> **Protect your backup?** A protected backup can only be opened with your password or your recovery code. Not even PesaPilot can open it without them.
> [Protect with a password] (recommended) · [Save without protection]

- **Password rules:**
  - at least 8 characters;
  - not the same as the PIN;
  - if it is only numbers, at least 12 digits.
- **Hint shown:** "A short sentence you'll remember works well, for example `mama mboga 2026`."
- **The recovery code** is shown once, with "I've written it down". The user then types back 4 characters of it as a check.

**Day to day: one tap**
- The phone keeps K (like the PIN, it is never put in any export), so later backups are **one tap** and need no password.
- **Why this is safe enough:** anyone who can already open the app on this phone can see the records anyway. K adds no new exposure on the phone itself.

**Remembering it**
- Once a month, with the backup reminder (DEC-020): "**Do you still remember your backup password?**" The user types it, and the app checks it on the phone, so nothing is sent anywhere.
- If they've forgotten it, they set a new one straight away (see §5).

**Changing the password**
- Needs the PIN.
- New backups use the new password.
- **Older backup files still open with the old password, or with the recovery code**, which doesn't change.
- **"Make a new recovery code"** creates a new K. Old backups then still need the *old* code or old password. The screen says so in plain words.

## 5. What happens if something is lost

| What's lost | Can the records be recovered? | What the user does |
|---|---|---|
| **Phone lost; password remembered** | **Yes**, up to the latest backup | New phone → open PesaPilot → Import backup → type the password |
| **Phone lost; password forgotten; recovery code kept** | **Yes** | Import → "Use recovery code instead" → then set a new password |
| **Phone lost; password AND recovery code both lost** | **No**, for protected backups. Nobody can open them, including PesaPilot. | Only a plain backup, if one exists, can help. **This is the one real new risk, and the screens say it clearly before the user chooses protection.** |
| **Phone fine; password forgotten** | **Nothing is lost**: the records are on the phone | Unlock with the PIN → set a new backup password → **make a fresh backup straight away**. (Older backups still need the old password or the recovery code.) |
| **Phone fine; recovery code lost** | Nothing is lost | "Make a new recovery code" → write it down → make a fresh backup |
| **PIN forgotten** | Unchanged from today (DATA_RECOVERY §3): the "Forgot your PIN?" path saves a copy, resets this phone and re-imports. The backup password isn't needed. | As today |
| **Someone finds the backup file** | They can't read it without the password or code. They can see it's a PesaPilot backup, its size, and the date in its file name. | Nothing |
| **Someone has the phone, unlocked** | They can read the records, as today. This brief doesn't change that. Encrypting records on the phone itself is **out of scope** (see §8). | PIN, as today |

## 6. Restoring

**Steps:** Settings → **Import backup** → choose the file.
1. **Plain backup:** works exactly as today.
2. **Protected backup:** "This backup is protected. Type your backup password." There is a link: "Use recovery code instead".
3. **Wrong password:** "That password doesn't open this backup. **Nothing on this phone has changed.**" Each attempt takes 1–2 seconds by design [E], which also slows down anyone guessing.
4. **Damaged or edited file:** "This backup file is damaged or was changed, so it can't be opened safely. Nothing on this phone has changed." [T: tampering is detected]
5. **Before replacing anything:** a summary, e.g. "Backup from Fri 20 Nov: 5 accounts, 312 entries, 3 goals. Replace what's on this phone?"
6. **Then, as today:**
   - a safety copy of the current data is made first;
   - the phone keeps **its own PIN** (DEC-019);
   - a new phone without a PIN is asked to set one (PIN required, DEC-026).
7. **After restoring:** the phone takes over K from the file, so **the same password and recovery code keep working** for future backups.

**Older app versions:** today's live app and Release 1 both refuse a protected file with "This backup was created by a newer version of PesaPilot." Nothing is changed [T].

## 7. Saving the file
- **Phone share sheet** (Web Share with files, available in Chrome on Android): Google Drive, Gmail, WhatsApp "message yourself", Files, Bluetooth…
- **Fallback:** a normal download.
- **File name:** `PesaPilot-backup-2026-11-25.json`. The date shows which copy is newest; it reveals nothing else.
- **To test before building:**
  - WhatsApp and Drive accept the file type on common Kenyan Android phones (Tecno, Infinix, Samsung A-series; Chrome and the phone's own browser);
  - the file opens again from each.

## 8. Alternatives considered

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **0. Keep plain backups only** (today) | Nothing to forget; simplest | Anyone with the file can read everything; people avoid keeping copies off the phone | Keep it as a choice, not the only option |
| **1a. Protected backups, password only** | Simpler; one secret | One forgotten password = backups lost forever | Not recommended |
| **1b. Password + recovery code** (**recommended**) | A spare key covers the most common failure (a forgotten password) | One more step at setup; the paper code can itself be lost | **Recommended** |
| **1c. Recovery code only** (the app makes the key; no password) | Nothing to remember | Typing 16 characters on every restore; losing the paper = loss | Not recommended |
| **Force protection** (no plain option) | Every file is safe if found | More people end up with **no backup at all**; the forgotten-password risk is forced on everyone | Not recommended |
| **2. Automatic backup to the user's own Google Drive** | Automatic | Google sign-in and verification, tokens, a privacy policy and support work | **Not now**; revisit with interview evidence (P5 §5) |
| **3. PesaPilot cloud** | Automatic, cross-device | We'd hold financial data: Kenya Data Protection Act duties, cost, a breach target | **Not now**; needs its own brief and legal review |
| **Encrypt records on the phone** (with the PIN) | Protects an unlocked or stolen phone's storage | A 4–8 digit PIN is too weak for this; a forgotten PIN would mean **permanent loss of everything** | **Out of scope**; would need its own decision |

## 9. Implications

| Area | Effect |
|---|---|
| **Privacy** | Better. Files are unreadable if found, and PesaPilot still receives nothing. |
| **Security** | Strong encryption from standard browser features; no new attack surface on our side; no servers |
| **User control** | Full. The user chooses protection, where to keep the file, and the password |
| **Data loss risk** | **New:** losing both the password and the recovery code means protected backups can't be opened. Reduced by: the recovery code, monthly password checks, fresh backups after any change, and plain backups staying available |
| **Cost** | KSh 0; no infrastructure |
| **Kenya Data Protection Act** | Minimal: we still don't collect or process users' financial data |
| **Support** | We **cannot** recover a forgotten password. The app, the FAQ and `DATA_RECOVERY.md` must say so plainly. |
| **Compatibility** | Plain backups keep working both ways. Older apps refuse protected files safely [T]. |
| **Stored data** | One new on-phone setting (K plus its two locked copies), never exported. No change to records. |
| **Order of work** | After Release 1, and after the D13 fix (so an older app can't damage the new setting). Can be built separately from DB-5 and DB-6. |

## 10. Testing (when built)
- **Round trip:** protect → back up → import on a fresh profile, with the password and with the recovery code.
- **Failure cases:** wrong password, wrong code, a tampered file, a truncated file → refused, **nothing changed**.
- **Changes:** after a password change, old files still open with the old password or the code; a new code needs a new K.
- **Compatibility:** plain ↔ protected; refusal by today's live app and Release 1 (already tested).
- **Exports:** no PIN, PIN hash or K appears in any export (extends the existing DEC-019 tests).
- **Real devices:** unlock time on a low-end Android phone; the share sheet to WhatsApp, Drive and Gmail.
- **Full suites:** regression, migration, engine fingerprint and UI audit.

## 11. Choices for you

| # | Choice | Recommendation | Alternatives |
|---|---|---|---|
| 1 | Add protected backups as a future stage | **Yes**, after Release 1 and D13 | Not now |
| 2 | Encryption method | **AES-GCM-256; PBKDF2-SHA-256 at 600,000 rounds; random salt and IV** | Other parameters after phone timing tests |
| 3 | Recovery | **Password + recovery code (1b)** | Password only (1a); code only (1c) |
| 4 | Default | **Offer protection first; "Save without protection" stays available, with a warning** | Force protection; keep plain as the default |
| 5 | One-tap backups (phone keeps the backup key, never exported) | **Yes** | Type the password for every backup |
| 6 | Password rules | **At least 8 characters; not the PIN; 12+ if only numbers** | Stricter rules |
| 7 | Monthly "do you remember your password?" check | **Yes, with the backup reminder** | No checks |
| 8 | Saving | **Share sheet, with download as the fallback** | Download only |
| 9 | Forgot-PIN path | **Unchanged** | — |
| 10 | Automatic Drive backup (Option 2) / PesaPilot cloud (Option 3) | **Not now** | Investigate Option 2 after interviews |

**Reversible?** Yes.
- Plain backups keep working.
- The feature can be switched off. Already-made protected files still open in any version that supports them, so the decryption code must be kept.
- The one thing that can't be undone: **a protected file whose password and recovery code are both lost stays unreadable.** That is the point of encryption, and why §4 and §5 are designed around it.
