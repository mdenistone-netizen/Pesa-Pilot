# PesaPilot Data Protection & Recovery Strategy (DEC-020)

PesaPilot keeps every record **only on the user's own device**, inside the browser. There is no PesaPilot server or cloud copy. That is good for privacy, but it means **the user's backup file is the only way to recover from losing the device or the browser data.** This document is the strategy; the in-app wording follows it.

## 1. What can cause data loss

| Event | Data lost? | Protection |
|---|---|---|
| Phone lost, stolen, broken or reset | **Yes**, unless a backup file exists elsewhere | Regular backup file kept off the phone |
| Browser data / site data cleared, browser uninstalled | **Yes** | Same |
| Using a different browser or phone | Data is not there; it is not lost from the original | Export from the original, import on the new one |
| Private / incognito mode | **Yes**, when the window closes | Don't use private mode for PesaPilot |
| Forgotten PIN | No, but the device must be reset (records are backed up first) | Backup → reset → import |
| A faulty PesaPilot update | Protected | Automatic pre-upgrade snapshot + proven rollback (CHANGE_REGISTER CR-002) |

## 2. Backups the app makes

| Backup | Where | When |
|---|---|---|
| **Backup file** (Settings → Download backup) | Phone's Downloads folder, as a `.json` file | When the user taps it; also automatically before import, restore, reset and forgotten-PIN reset |
| Safety backup | Inside the browser | Before every import, restore, reset and upgrade (protects against mistakes, **not** against device loss) |
| Pre-accounts copy | Inside the browser, downloadable from Settings | Once, at the schema 10 upgrade (for rollback) |

- Backup files contain the financial records and settings.
- Since DEC-019 they contain **no PIN and no PIN hash, and no device identifiers**.
- They are **not encrypted**. Anyone who opens the file can read the records. Store it like a bank statement.

## 3. What users should do (in-app guidance)
1. **Download a backup regularly.** At least monthly, and before changing phones or clearing the browser. The app shows the date of the last backup and reminds the user when it is missing or older than 30 days.
2. **Keep a copy off the phone:** for example Google Drive, email to yourself, or a computer.
3. **Moving to a new phone or browser:** download a backup on the old one, open PesaPilot on the new one, then Settings → Import backup.
4. **Forgotten PIN:** use "Forgot your PIN?". It downloads a backup, resets this device, then lets you set a new PIN and import the backup.

## 4. PIN and backups (DEC-019)
- The PIN is a **lock for this device only**. It is never stored in backups.
- **Importing a backup keeps the PIN of the device you import on.**
  - A device with no PIN stays unlocked, and the user can set a PIN in Settings.
  - So restoring on another device never needs the old PIN.
- **Honest limits:**
  - PIN hashing improves *PIN storage*. It is **not encryption of the financial records**.
  - Someone with full access to an unlocked phone, its browser storage or a backup file can read the records.
  - The "Forgot your PIN?" path deliberately lets the holder of the device recover their own data, so the PIN deters casual access rather than a determined attacker.
  - Encrypting the records themselves would be a separate, larger decision with a real risk of permanent data loss if the PIN is forgotten.

## 5. What the PesaPilot team can and cannot do
- We **cannot** see, back up or restore anyone's data. There is no server copy.
- We **can** make sure every release:
  - upgrades data without loss (tested on representative copies);
  - keeps an untouched pre-upgrade copy on the device;
  - can be rolled back (procedure in `docs/RELEASE_1_CHECKLIST.md`).

## 6. Future options (not decided)
- **Cloud backup or sync** (DEC-005, postponed): would protect against device loss, but needs accounts, privacy terms and running costs.
- **Encrypted backup files** with a user passphrase.
- **PWA install** (D9), which makes browsers less likely to clear stored data.
