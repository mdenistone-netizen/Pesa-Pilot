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
| Data key | A random 256-bit data key (DK) made on the phone when protection is first switched on | Strong, and never typed by anyone |
| Encryption | **AES-GCM-256** with a fresh random IV for every backup | Standard; it **detects any change** to the file [T] |
| Password → key | **PBKDF2-SHA-256, 600,000 rounds**, random 16-byte salt | Slows down guessing. The PIN uses 150,000 rounds because it is checked often on the phone; a file that can be attacked offline needs more. |
| Two locks | DK is stored inside the file twice: once locked with the password, once locked with the recovery code | Either key opens the file |
| Recovery code | 16 characters in 4 groups (e.g. `K7QM-3XRA-9VTE-HW2C`); no look-alike characters (0/O, 1/I/L); about 80 bits of randomness | Practical to write down; too strong to guess |
| File label | `app: "PesaPilot"`, a **new backup version number** (so older apps refuse it [T]), `encrypted: true`, algorithm names and settings. **Nothing about the user's money is readable.** | Safe with older apps; open about how it was made |
| Not in the file | The PIN or its hash (DEC-019), device ids, or DK in readable form | Same rules as today |

**Accurate wording (DEC-019 style)**
- "Your **backup file** is encrypted: it is locked with your backup password."
- "Records **on this phone** are not encrypted. Your PIN locks the app on this phone."
- We never say "your data is encrypted" without saying which data.

## 3a. Key architecture (clarified 25 Nov, owner review)
Checked by `../prototypes/protected-backup/model.js`, which uses the same Web Crypto functions the browser provides. All 7 questions below have passing checks.

### The four things, kept separate

| Name | What it is | Where it exists | Who knows it |
|---|---|---|---|
| **Data key (DK)** | A random 256-bit AES-GCM key. **The only key that encrypts the records** in a backup file. | Made on the phone when protection is switched on. Stored on the phone as the **on-device secret** (below). Inside every backup file, but **only in locked form** (twice). | Nobody types or sees it |
| **Password key (P-key)** | Derived from the backup password with PBKDF2-SHA-256 (600,000 rounds, its own random salt). Its only job is to **lock and unlock DK**. | **Never stored anywhere.** Re-derived from the password when needed, then discarded. | Whoever knows the password |
| **Recovery key (R-key)** | Derived the same way from the recovery code (its own salt). Its only job is to **lock and unlock DK**. | **Never stored anywhere.** | Whoever has the paper code |
| **On-device secret** | A **non-extractable** copy of DK in the browser's IndexedDB, plus the two locked copies of DK (by P-key and by R-key) and their salts | The phone only. **Never in any backup or export** (as the PIN, DEC-019). | — |

**Never stored anywhere:** the password, the recovery code, the P-key or the R-key.

### Answers to the seven questions

**1. How does the password unlock the backup?**
- Password + the salt in the file → P-key.
- P-key unlocks the **password lock** in the file, giving DK.
- DK decrypts the records.
- A wrong password fails at the unlock step, and nothing changes.
- The file's whole header is authenticated with the records (AES-GCM associated data), so editing any part makes it fail [model-checked].

**2. How does the recovery code unlock the same backup?**
- Code + its own salt → R-key.
- R-key unlocks the **code lock** in the same file, giving **the same DK**, which decrypts the same records.
- Two locks, one key inside.
- The code can be typed in lower case, without dashes, and with O/0 or I/1 mixed up [model-checked].

**3. What exactly is stored on the phone for one-tap backups?** Five things, under a storage area of their own, separate from the records:
- a non-extractable DK;
- the password lock (salt, IV, locked DK);
- the code lock (salt, IV, locked DK);
- a key identifier;
- the date protection was set up.

There is no password, no code, no P-key and no R-key [model-checked].

**4. How is the on-device secret protected?**
- **Non-extractable:** the browser lets PesaPilot *use* DK to encrypt, but **refuses to give out its value**, even to PesaPilot's own code [tested in Chromium: export blocked, still usable after a reload].
- **Same-origin isolation:** only pages from PesaPilot's web address can reach it, inside the phone's app sandbox.
- **PIN screen:** the app's screens are behind the PIN (required, DEC-026).
- **Never exported:** checked by the same tests as the PIN (DEC-019).
- **Honest limit:** someone who can open PesaPilot on the unlocked phone can *make new backups*, and can already read the records there. They **cannot** take DK off the phone, and they **cannot** use the phone to open backup files: opening a file always needs the password or the code. Malware with full control of the phone's browser is out of scope, as it is for the records.

**5. What happens when the password is changed?**
- It needs the **current password or the recovery code**, because the phone's DK can't be read out to re-lock it.
- DK stays the same.
- Only the password lock is replaced.

| | Opens with old password | Opens with new password | Opens with recovery code |
|---|---|---|---|
| Backups made **before** the change | **Yes** | No | **Yes** |
| Backups made **after** the change | No | **Yes** | **Yes** |

[All six cases model-checked.] The screen says: "Older backups still open with your old password or your recovery code."

**6. Can a user restore on a replacement phone using only the recovery code?**
- **Yes.** Import → "Use recovery code instead" → the records are restored.
- The new phone then:
  - keeps DK (non-extractable);
  - asks for a new backup password;
  - keeps the **same** recovery code, so the paper copy stays valid.
- Backups made on the new phone open with the new password **or the same code** [model-checked].

**7. What if the phone is lost but the backup file and recovery code remain?**
- **Everything up to that backup is recovered**, on any phone (as answer 6).
- A wrong code fails without changing anything.
- An edited file is refused [model-checked].
- **Whoever has the lost phone:**
  - can't open the backup files without the password or code;
  - can't take DK off the phone;
  - could read the records on the phone only by getting past the PIN, as today.
- **Advice in the app after recovery:** "Make a new recovery code" if the old paper may also have been seen. That creates a new DK, and future backups need the new code.

**Changed by this design** (compared with §4–§6 before 25 Nov):
- Changing the password now needs the old password **or** the recovery code, not just the PIN. This closes a gap: someone using an unlocked phone can't re-lock DK with their own password and then open old backups found elsewhere.
- If **both** the password and the code are forgotten but the phone is fine, the user starts **new protection** (new DK, new code). Old backups stay locked to the old secrets.

## 4. Passwords

**Setting it up.** The first time the user taps **Back up**:
> **Protect your backup?** A protected backup can only be opened with your password or your recovery code. Not even PesaPilot can open it without them.
> [Protect with a password] (recommended) · [Save without protection]

- **Password rules:**
  - at least 8 characters;
  - not the same as the PIN;
  - if it is only numbers, at least 12 digits.
- **Hint shown:** "Use **four or more unrelated words** you can remember, for example `chungwa basi kumi mlango`. Don't use names, birthdays, phone or ID numbers, or a saying people know."
  - The example is never accepted as a password, and nor is a short list of common passwords.
- **The recovery code** is shown once, with "I've written it down". The user then types back 4 characters of it as a check.

**Day to day: one tap**
- The phone keeps the **on-device secret** (§3a): a non-extractable copy of DK, never exported. So later backups are **one tap** and need no password.
- **Why this is safe enough:** the key can be used but not read out, and opening any backup file still needs the password or code (§3a, answer 4).

**Remembering it**
- Once a month, with the backup reminder (DEC-020): "**Do you still remember your backup password?**" The user types it, and the app checks it on the phone, so nothing is sent anywhere.
- If they've forgotten it, they use the recovery code to set a new one straight away (§3a, answer 5).

**Changing the password** (§3a, answer 5)
- Needs the **current password or the recovery code**.
- New backups use the new password.
- **Older backup files still open with the old password, or with the recovery code**, which doesn't change.
- **"Make a new recovery code"** creates a new DK (needs the current password). Old backups then still need the *old* code or old password. The screen says so in plain words.

## 5. What happens if something is lost

| What's lost | Can the records be recovered? | What the user does |
|---|---|---|
| **Phone lost; password remembered** | **Yes**, up to the latest backup | New phone → open PesaPilot → Import backup → type the password |
| **Phone lost; password forgotten; recovery code kept** | **Yes** | Import → "Use recovery code instead" → then set a new password |
| **Phone lost; password AND recovery code both lost** | **No**, for protected backups. Nobody can open them, including PesaPilot. | Only a plain backup, if one exists, can help. **This is the one real new risk, and the screens say it clearly before the user chooses protection.** |
| **Phone fine; password forgotten** | **Nothing is lost**: the records are on the phone | Use the **recovery code** to set a new password, then make a fresh backup. Older backups still open with the code. |
| **Phone fine; password AND code forgotten** | **Nothing on the phone is lost** | "Start new protection" (new DK, new password, new code) → **make a fresh backup straight away**. Old protected backups stay locked to the old secrets. |
| **Phone fine; recovery code lost** | Nothing is lost | "Make a new recovery code" (needs the password) → write it down → make a fresh backup. Old backups still open with the password. |
| **PIN forgotten** | Unchanged from today (DATA_RECOVERY §3): the "Forgot your PIN?" path saves a copy, resets this phone and re-imports. The backup password isn't needed. **That copy is a plain, unprotected file**, with the warnings in §5a. | As today |
| **Someone finds the backup file** | They can't read it without the password or code. They can see it's a PesaPilot backup, its size, and the date in its file name. | Nothing |
| **Someone has the phone, unlocked** | They can read the records, as today. This brief doesn't change that. Encrypting records on the phone itself is **out of scope** (see §8). | PIN, as today |

## 5a. Forgot-PIN copy: make the plain file unmistakable (owner, 25 Nov)
The process stays as today (DB-4.9). The **wording and file name** change so nobody mistakes the copy for a protected backup. This is also proposed for the current app wording, as part of DB-4's build.

**Before it downloads:**
> **This copy is NOT protected.** Anyone who opens this file can read all your records. Keep it private, and delete it after you've restored your records.
> [I understand, save the copy] · [Cancel]

**File name:** `PesaPilot-UNPROTECTED-copy-2026-11-25.json`

**After restoring:**
> Your records are back. **Delete the unprotected copy** from your phone's Downloads. PesaPilot can't delete it for you. [How to delete it] · [Make a protected backup now]

The same message goes in `DATA_RECOVERY.md` §3, so the in-app wording and the recovery guide match (CLAUDE.md 3a).

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
7. **After restoring:** the phone keeps DK (non-extractable) and asks for a backup password. The **same recovery code** keeps working for future backups (§3a, answer 6).

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
| **Stored data** | The on-device secret (§3a) in **IndexedDB**, a browser storage area the app doesn't use today, kept apart from the records (localStorage). Never exported. No change to records and no schema change. Note for DB-6: a service worker *can* technically reach IndexedDB. PesaPilot's worker will contain no storage code, and a test checks that. |
| **Order of work** | After Release 1, and after the D13 fix (so an older app can't damage the new setting). Can be built separately from DB-5 and DB-6. |

## 10. Testing (when built)
- **Round trip:** protect → back up → import on a fresh profile, with the password and with the recovery code.
- **Failure cases:** wrong password, wrong code, a tampered file, a truncated file → refused, **nothing changed**.
- **Changes:** after a password change, old files still open with the old password or the code; a new code needs a new DK; changing the password needs the old password or the code; the on-device DK cannot be exported.
- **Compatibility:** plain ↔ protected; refusal by today's live app and Release 1 (already tested).
- **Exports:** no PIN, PIN hash, DK or lock record appears in any export or plain backup (extends the existing DEC-019 tests).
- **Real devices:** unlock time on a low-end Android phone; the share sheet to WhatsApp, Drive and Gmail.
- **Full suites:** regression, migration, engine fingerprint and UI audit.

## 11. Choices for you

| # | Choice | Recommendation | Alternatives |
|---|---|---|---|
| 1 | Add protected backups as a future stage | **Yes**, after Release 1 and D13 | Not now |
| 2 | Encryption method | **AES-GCM-256; PBKDF2-SHA-256 at 600,000 rounds; random salt and IV** | Other parameters after phone timing tests |
| 3 | Recovery | **Password + recovery code (1b)**, with the key architecture in §3a | Password only (1a); code only (1c) |
| 4 | Default | **Offer protection first; "Save without protection" stays available, with a warning** | Force protection; keep plain as the default |
| 5 | One-tap backups (non-extractable DK in IndexedDB, never exported; §3a answers 3–4) | **Yes** | Type the password for every backup |
| 6 | Password rules | **At least 8 characters; not the PIN; 12+ if only numbers; common passwords and the example refused; guidance: 4+ unrelated words** | Stricter minimum (e.g. 12 characters) |
| 7 | Monthly "do you remember your password?" check | **Yes, with the backup reminder** | No checks |
| 8 | Saving | **Share sheet, with download as the fallback** | Download only |
| 9 | Forgot-PIN path | **Process unchanged; the plain copy clearly labelled "NOT protected", with a delete reminder (§5a)** | Make that copy protected (risks loss if the password is also forgotten) |
| 10 | Automatic Drive backup (Option 2) / PesaPilot cloud (Option 3) | **Not now** | Investigate Option 2 after interviews |

**Reversible?** Yes.
- Plain backups keep working.
- The feature can be switched off. Already-made protected files still open in any version that supports them, so the decryption code must be kept.
- The one thing that can't be undone: **a protected file whose password and recovery code are both lost stays unreadable.** That is the point of encryption, and why §4 and §5 are designed around it.
