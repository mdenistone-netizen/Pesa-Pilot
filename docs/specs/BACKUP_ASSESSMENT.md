# P5 · Backup Architecture & Privacy Assessment (input to DB-4)

**Status:** assessment only (DEC-023). **The decision proposal is `DB-4_DECISION_BRIEF.md`.** **Local-first stays the default.** No cloud storage or infrastructure will be added without DB-4 approval.

## 1. The problem
- All records live in the phone's browser storage (DATA_RECOVERY.md).
- Losing the phone, clearing browser data or uninstalling the browser loses everything unless the user has a recent backup file kept elsewhere.
- Today's protection is a manual "Download backup" (an unencrypted JSON file) plus a reminder.
- **Risks today:**
  - people forget to back up;
  - the file lands in Downloads on the same phone;
  - the file is readable by anyone who gets it.

## 2. What we must protect

| Asset | Threat | Today |
|---|---|---|
| Financial records (on the phone) | Device loss or reset; browser data cleared | Only a manual backup file protects them |
| The backup file | Read by others (shared phone, WhatsApp forward, Drive account compromise) | **Unencrypted** |
| PIN | Leaked through backups | Never in backups (DEC-019) |
| User trust | The app quietly uploading data | Nothing is uploaded; a key promise |

## 3. Options assessed

| | **0. Today** | **1. Encrypted backup file + "Save to…" (recommended next)** | **2. Automatic backup to the user's own Google Drive (Drive API)** | **3. PesaPilot cloud backup / sync** |
|---|---|---|---|---|
| How it works | Download a JSON file | The phone encrypts the backup with a passphrase (Web Crypto: PBKDF2 → AES-GCM), then opens the **phone's share sheet** so the user saves it to Google Drive, sends it to themselves on email or WhatsApp, or keeps it locally | The app signs in to the user's Google account (OAuth in the browser) and writes encrypted backups to a hidden app folder in **their** Drive, e.g. weekly when the app is opened | Accounts on our servers; backups or sync stored by us |
| Where data goes | User's phone | **Wherever the user chooses.** We never receive it. | User's own Drive. We never receive it, but the app holds a Google token. | **Our servers** |
| Infrastructure | None | **None** (browser features only) | A Google Cloud project and OAuth client. No server for data, but Google configuration, a privacy policy, possibly an app verification review; tokens handled in the browser | Servers, database, accounts, monitoring, backups of backups |
| Running cost | KSh 0 | **KSh 0** | About KSh 0 (free Google API quotas) plus admin and review time | Ongoing hosting and staff time; grows with users |
| Automation | Manual | Manual, with a reminder (could be "one tap") | **Automatic** (when the app opens) | Automatic, continuous |
| Privacy | Excellent | **Excellent** | Good: data stays in the user's Drive, but users must trust the app with Drive access (narrowest scope only) | Weakest: we hold sensitive financial data |
| Security of a lost file | Weak (plain text) | **Strong** (encrypted; useless without the passphrase) | Strong (encrypted) plus Google account security | Depends on our security; we become a target |
| Kenya Data Protection Act exposure | Minimal (we don't process data) | **Minimal** (we still don't receive data) | Low–moderate (we don't receive data, but we request access to the user's account; needs a clear privacy notice) | **High**: we become a data controller/processor of financial data; ODPC obligations, breach duties, legal review needed |
| Failure modes | Forgetting; the file stays on the same phone | **Forgotten passphrase = unrecoverable backup**; still relies on reminders | Token expiry; Google changes; a revoked account; offline phones never back up; the forgotten-passphrase issue too | Outages, breaches, cost; account recovery and support |
| Reversibility | — | Fully reversible | Reversible (users can revoke access) | Hard to undo once people rely on it |

## 4. Key design details for Option 1 (if approved)
- **Encryption:** a passphrase of at least 8 characters (a PIN is too short for files that could be attacked offline). Key derivation with PBKDF2-SHA-256 with a random salt and a high iteration count. **AES-GCM** with a random IV. The file records the algorithm and parameters. All of this uses Web Crypto, which the app already uses for the PIN.
- **Passphrase recovery problem** (the biggest user risk). Options:
  - (a) a **recovery code** shown once (for example 4 words), which the user writes down;
  - (b) an "**unencrypted backup**" choice with a clear warning;
  - (c) both.
  
  Recommendation: (c). Encrypted is the default, plus a printed or written recovery code.
- **Saving:** use the browser's **share sheet with a file** (Web Share API with files; supported in Chrome on Android, to be confirmed on our target devices). Fall back to a normal download.
- **Restoring:** Settings → Import backup asks for the passphrase or recovery code. A wrong passphrase gives a clear message, and nothing is changed.
- **Reminders:** reuse today's backup reminder (DEC-020), with an optional monthly prompt "Back up now (1 tap)".
- **Compatibility:** unencrypted backups keep working. The backup format version is incremented; older app versions must refuse encrypted files clearly, not crash.
- **Tests:** a full round trip (encrypt, share, import), a wrong passphrase, the recovery code, tamper detection (AES-GCM authentication), and old/new compatibility.

## 5. Option 2: what would need checking before any decision
- **Google OAuth requirements** for Drive access from a web app:
  - the narrowest scope (an app-only folder or files the app creates);
  - whether Google's verification review applies;
  - the privacy policy and consent screen requirements.
- **Token storage in the browser,** and what happens when it expires.
- **Behaviour on low-end Android browsers and with intermittent data.**
- **User comprehension:** does "connect Google Drive" feel safe to our target users? (Test in P4 interviews.)

## 6. Recommendation
1. **Keep local-first as the default.** No PesaPilot cloud (Option 3) without customer evidence and a separate, legal-reviewed decision.
2. **Next (DB-4a):** Option 1, an encrypted backup file with "Save to…". It needs zero infrastructure, costs nothing, keeps full user control and closes the "readable backup file" gap. It's a good candidate for the free tier, since protecting people's data shouldn't be paywalled.
3. **Later (DB-4b):** consider Option 2 (automatic, user-owned Drive) as a **paid convenience**, *only if* interviews show demand and the Google requirements check out.

## 7. Decisions for the owner (DB-4)

| # | Decision | Recommendation |
|---|---|---|
| 1 | Approve Option 1 (encrypted backup + share sheet) as a future build stage | Yes, after Release 1 |
| 2 | Recovery approach | Encrypted by default, a recovery code, plus an optional unencrypted export with a warning |
| 3 | Option 2 | Not now. Revisit with P4 evidence. |
| 4 | Option 3 (our cloud) | Not now. Requires a separate brief and legal review. |
