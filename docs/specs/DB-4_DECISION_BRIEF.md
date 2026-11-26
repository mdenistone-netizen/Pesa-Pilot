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
| Backup key pair | An ECDH P-256 key pair made on the phone when protection is switched on. The **public** half stays on the phone. The **private** half exists only inside the two locks. | The phone can lock backups but cannot open them (§3a) |
| File key | A fresh AES-GCM-256 key for **each** backup, made from a one-time key pair plus the backup public key (ECDH, then HKDF-SHA-256) | Every backup has its own key |
| Encryption | **AES-GCM-256** with a fresh random IV for every backup | Standard; it **detects any change** to the file [T] |
| Password → key | **PBKDF2-SHA-256, 600,000 rounds**, random 16-byte salt | Slows down guessing. The PIN uses 150,000 rounds because it is checked often on the phone; a file that can be attacked offline needs more. |
| Two locks | The private key is stored inside each file twice: once locked with the password, once locked with the recovery code | Either one opens the file |
| Recovery code | 16 characters in 4 groups (e.g. `K7QM-3XRA-9VTE-HW2C`); no look-alike characters (0/O, 1/I/L); about 80 bits of randomness | Practical to write down; too strong to guess |
| File label | `app: "PesaPilot"`, a **new backup version number** (so older apps refuse it [T]), `encrypted: true`, algorithm names and settings. **Nothing about the user's money is readable.** | Safe with older apps; open about how it was made |
| Not in the file | The PIN or its hash (DEC-019), device ids, the private key in readable form, the password, the code | Same rules as today |

**Accurate wording (DEC-019 style)**
- "Your **backup file** is encrypted: it is locked with your backup password."
- "Records **on this phone** are not encrypted. Your PIN locks the app on this phone."
- We never say "your data is encrypted" without saying which data.

## 3a. Key architecture: revision 2, "public key on the phone" (26 Nov)

**Evidence**
- `../prototypes/protected-backup/model.js` (the same Web Crypto functions the browser provides): Q1–Q7, plus "the phone alone cannot open any backup", all pass.
- `../prototypes/protected-backup/browser-key-access/` (Chromium, page + service worker): results below.

### Why the design changed: "can't export" is not "can't use"

The round-2 design kept a **non-extractable** data key (DK) in IndexedDB. Tested in Chromium, playing the part of *any* same-origin code with a service worker:

| What we tried with the stored non-extractable key | Result |
|---|---|
| Retrieve the CryptoKey object from IndexedDB | **Succeeded** |
| Export its raw value | Blocked |
| **Ask the browser to decrypt a backup with it** | **Succeeded**: the records were read |

**So "non-extractable" only stops the key's value being copied off the phone.** Any code running under PesaPilot's web address on that phone can *use* the key. That includes:
- the page;
- a service worker;
- a future bug in our own code;
- an injected script.

My round-2 statement that "opening a file always needs the password or the code" was a **screen rule, not a cryptographic guarantee**. I've withdrawn it.

**Revision 2 removes every decrypting key from the phone**:

| What we tried with revision 2's stored key | Result |
|---|---|
| Retrieve it from IndexedDB | Succeeded; it is a **public** key |
| Use it to open a backup | **Impossible**: a public key cannot derive any file key |
| Use it to create a new protected backup | Succeeded |

### The parts, kept separate

| Name | What it is | Where it exists | Can it open a backup? |
|---|---|---|---|
| **Backup public key** | The public half of an ECDH P-256 key pair made at setup | On the phone (IndexedDB) and in every backup file. **Not secret.** | **No** |
| **Backup private key** | The private half | **Only inside the two locks.** It is unlocked in memory for a moment when the user types the password or code (restore, password change), then discarded. **Never stored unlocked.** | Yes, but only once unlocked |
| **Password key (P-key)** | Derived from the password with PBKDF2-SHA-256 (600,000 rounds, own salt). Only locks or unlocks the private key. | **Never stored** | Only through the private key |
| **Recovery key (R-key)** | Derived the same way from the recovery code (own salt) | **Never stored** | Only through the private key |
| **File key** | A fresh AES-GCM-256 key for each backup. A one-time key pair is made, combined with the backup public key (ECDH → HKDF-SHA-256), used once, then **discarded**. | Never stored. Only its one-time *public* part is written in the file. | It *is* what encrypts that one file |
| **On the phone** | Backup public key + the two locks (each a salt, an IV and the locked private key) + a key id | IndexedDB, separate from the records (localStorage). **Never in any export.** | **No** [model-checked + browser-tested] |

### The seven questions

**1. How does the password unlock the backup?**
- Password + salt → P-key.
- P-key unlocks the **password lock** in the file, giving the private key.
- Private key + the file's one-time public key → that file's key.
- The file key decrypts the records.
- A wrong password fails at the unlock step, and nothing changes. Any edit to the file (header or content) makes it fail [model-checked].

**2. How does the recovery code unlock the same backup?**
- The same steps, using the **code lock** and the R-key.
- It gives the **same private key**, so the same file opens.
- Lower case, missing dashes and O/0 or I/1 mix-ups are accepted [model-checked].

**3. What exactly is stored on the phone for one-tap backups?**
- the backup **public** key;
- the password lock;
- the code lock;
- a key id.

No password, no code, no P-key or R-key, and no usable private key [model-checked].

**4. How is it protected, and what are the limits?**
- **Nothing stored on the phone can decrypt a backup.**
  - The public key can only *lock*.
  - The private key is stored only locked, and can be unlocked only by someone who knows the password or code. Guessing is slowed by 600,000 PBKDF2 rounds.
- **Limits, stated plainly:**
  1. **The locks are the same ones written into every backup file.** Anyone who copies them, from the phone or from a file, can try to guess the password offline. That is why the rounds are high and the password guidance asks for 4+ unrelated words. The recovery code (80 bits) can't be guessed.
  2. **Malicious code on PesaPilot's address, while it is running, could:**
     - capture the password **as the user types it**, during a restore or password change;
     - replace the stored public key with its own, so that **future** backups are locked to an attacker.

     The same code could already read the records directly. Defences against such code: no third-party scripts (the app loads none today), a content security policy, and our own worker containing no storage code (test-enforced).
  3. **Records on the phone are not encrypted** (as today). Someone who gets past the PIN can read them. This design protects the **backup files**, not the phone.
- **Not claimed:** that the stored items are hidden from code on PesaPilot's address. They are *reachable*. The protection is that **none of them can open a backup without the password or code**.

**5. What happens when the password is changed?**
- It needs the **current password or the recovery code**: the private key must be unlocked to re-lock it.
- The key pair stays the same. Only the password lock is replaced.

| | Old password | New password | Recovery code |
|---|---|---|---|
| Backups made **before** the change | **Opens** | No | **Opens** |
| Backups made **after** the change | No | **Opens** | **Opens** |

[All six cases model-checked.]

**6. Can a user restore on a replacement phone using only the recovery code?**
- **Yes.** The code unlocks the private key in memory, and the records are restored.
- The new phone then stores:
  - the **same** public key;
  - a new password lock (the user sets a password);
  - the **same** code lock.
- The paper code stays valid for every backup, old and new [model-checked].

**7. What if the phone is lost but the backup file and recovery code remain?**
- **Everything up to that backup is recovered**, on any phone. A wrong code fails, and an edited file is refused [model-checked].
- **Whoever has the lost phone:**
  - finds only a public key and two locks;
  - **cannot open any backup** without the password or code;
  - can read the records on the phone only by getting past the PIN, as today.
- **After recovery the app advises:** "Make a new recovery code if your old one may have been seen". That creates a new key pair, and future backups need the new code.

**Changed from round 2:**
- the phone keeps a **public** key instead of a usable data key;
- each backup has its own file key;
- changing the password still needs the old password or the code;
- no other user-facing behaviour changes. One-tap backups still need no password.

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
- The phone keeps the backup **public** key and the two locks (§3a), never exported. So later backups are **one tap** and need no password.
- **Why this is safe:** nothing stored on the phone can open a backup. Only the password or the recovery code can (§3a, answer 4, including its limits).

**Remembering it**
- Once a month, with the backup reminder (DEC-020): "**Do you still remember your backup password?**" The user types it, and the app checks it on the phone, so nothing is sent anywhere.
- If they've forgotten it, they use the recovery code to set a new one straight away (§3a, answer 5).

**Changing the password** (§3a, answer 5)
- Needs the **current password or the recovery code**.
- New backups use the new password.
- **Older backup files still open with the old password, or with the recovery code**, which doesn't change.
- **"Make a new recovery code"** creates a new key pair (needs the current password). Old backups then still need the *old* code or old password. The screen says so in plain words.

## 5. What happens if something is lost

| What's lost | Can the records be recovered? | What the user does |
|---|---|---|
| **Phone lost; password remembered** | **Yes**, up to the latest backup | New phone → open PesaPilot → Import backup → type the password |
| **Phone lost; password forgotten; recovery code kept** | **Yes** | Import → "Use recovery code instead" → then set a new password |
| **Phone lost; password AND recovery code both lost** | **No**, for protected backups. Nobody can open them, including PesaPilot. | Only a plain backup, if one exists, can help. **This is the one real new risk, and the screens say it clearly before the user chooses protection.** |
| **Phone fine; password forgotten** | **Nothing is lost**: the records are on the phone | Use the **recovery code** to set a new password, then make a fresh backup. Older backups still open with the code. |
| **Phone fine; password AND code forgotten** | **Nothing on the phone is lost** | "Start new protection" (new key pair, new password, new code) → **make a fresh backup straight away**. Old protected backups stay locked to the old secrets. |
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
7. **After restoring:** the phone stores the same public key and code lock, and asks for a new backup password. The **same recovery code** keeps working (§3a, answer 6).

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
| **Stored data** | The backup public key + two locks (§3a) in **IndexedDB**, a browser storage area the app doesn't use today, kept apart from the records (localStorage). Never exported. Not secret enough to open anything. No change to records and no schema change. |
| **Order of work** | After Release 1, and after the D13 fix (so an older app can't damage the new setting). Can be built separately from DB-5 and DB-6. |

## 10. Testing (when built)
- **Round trip:** protect → back up → import on a fresh profile, with the password and with the recovery code.
- **Failure cases:** wrong password, wrong code, a tampered file, a truncated file → refused, **nothing changed**.
- **Changes:** after a password change, old files open with the old password or the code and new files with the new password or the code; a new code needs a new key pair; changing the password needs the old password or the code.
- **Phone cannot open backups:** with only the phone's stored items, opening any backup fails. Tested in the browser from both the page and a service worker.
- **Compatibility:** plain ↔ protected; refusal by today's live app and Release 1 (already tested).
- **Exports:** no PIN, PIN hash or on-phone backup item appears in any plain export (extends the existing DEC-019 tests).
- **Real devices:** unlock time on a low-end Android phone; the share sheet to WhatsApp, Drive and Gmail.
- **Full suites:** regression, migration, engine fingerprint and UI audit.

## 11. Choices for you

| # | Choice | Recommendation | Alternatives |
|---|---|---|---|
| 1 | Add protected backups as a future stage | **Yes**, after Release 1 and D13 | Not now |
| 2 | Encryption method | **AES-GCM-256; PBKDF2-SHA-256 at 600,000 rounds; random salt and IV** | Other parameters after phone timing tests |
| 3 | Recovery | **Password + recovery code (1b)**, with the key architecture in §3a | Password only (1a); code only (1c) |
| 4 | Default | **Offer protection first; "Save without protection" stays available, with a warning** | Force protection; keep plain as the default |
| 5 | One-tap backups (the phone keeps only the backup **public** key + locks in IndexedDB; nothing on the phone can open a backup; §3a) | **Yes** | Type the password for every backup |
| 6 | Password rules | **At least 8 characters; not the PIN; 12+ if only numbers; common passwords and the example refused; guidance: 4+ unrelated words** | Stricter minimum (e.g. 12 characters) |
| 7 | Monthly "do you remember your password?" check | **Yes, with the backup reminder** | No checks |
| 8 | Saving | **Share sheet, with download as the fallback** | Download only |
| 9 | Forgot-PIN path | **Process unchanged; the plain copy clearly labelled "NOT protected", with a delete reminder (§5a)** | Make that copy protected (risks loss if the password is also forgotten) |
| 10 | Automatic Drive backup (Option 2) / PesaPilot cloud (Option 3) | **Not now** | Investigate Option 2 after interviews |

**Reversible?** Yes.
- Plain backups keep working.
- The feature can be switched off. Already-made protected files still open in any version that supports them, so the decryption code must be kept.
- The one thing that can't be undone: **a protected file whose password and recovery code are both lost stays unreadable.** That is the point of encryption, and why §4 and §5 are designed around it.
