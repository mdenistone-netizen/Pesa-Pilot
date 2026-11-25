# PesaPilot: instructions for Claude sessions

1. **Start here:** read `docs/MASTER_PROJECT_STATE.md`. It is the current state, the pending decisions and the next steps. Detail lives in the other files under `docs/`.
2. **Roles (DEC-014):**
   - Claude is the architect and builder.
   - Routine engineering decisions are Claude's to make.
   - Financial rules, data structures, architecture, security, user data, costs and major features need a decision brief and owner approval. A brief covers: the decision, why it matters, the recommendation, alternatives, pros and cons, implications, and whether it can be reversed.
   - Keep working on tasks no pending decision blocks.
3. **PRODUCTION PROTECTION (DEC-017): the live app holds real users' financial data.**
   - `main` = production. Netlify auto-deploys every change to `main` to https://pesa-pilot.netlify.app/.
   - **Never** push, merge or open a non-draft PR into `main`. Never mark PR #1 ready for review. Develop only on `claude/*` branches.
   - User data lives **only in each user's browser** (localStorage). There is no server copy, so a deployment *is* the migration: every user's data upgrades on their device the next time they open the app. Treat every release as a production data migration.
   - Test migrations only on copies of representative data (`tests/fixtures.js`, or an owner-supplied backup kept **out of the repo**, which is public).
   - Before any release: backup and rollback must be proven by tests, and the owner gets a **deployment checklist** and gives **explicit approval**. No exceptions for "small" changes.
   - Never write code that resets, clears or overwrites stored data without a user-initiated, backed-up, confirmed action.
   - Use the PR #1 deploy preview (`deploy-preview-1--pesa-pilot.netlify.app`) for visual and functional checks. It is a different web origin, so it cannot read or change production data.
3a. **Security & recovery (DEC-019, DEC-020):**
   - Never put the PIN or its hash in any export or download.
   - PINs are PBKDF2 with a unique random salt.
   - Describe PIN hashing as PIN-storage protection only, never as encryption of records.
   - Backup and recovery guidance lives in `docs/DATA_RECOVERY.md`; keep the in-app wording consistent with it.
3b. **Release 1 gate (DEC-018):** deploy only after every item in `docs/RELEASE_1_CHECKLIST.md` is done **and** the owner has explicitly said to deploy. Preparing a release is not approval to deploy it.
4. **Code:** everything is in `index.html` (single file, no build). Keep its CRLF line endings (DEC-007). Migrations must stay non-destructive and idempotent (DEC-004).
5. **Test before claiming anything:** `npm test` and `npm run test:ui-snapshot`. Re-save the snapshot (`npm run test:ui-snapshot:save`) only after intended UI changes.
6. **Docs are part of the work:**
   - After each change, update `CHANGE_REGISTER.md`, `DEV_LOG.md`, `DECISIONS.md` and `FINANCIAL_RULES.md` as relevant.
   - Always update `MASTER_PROJECT_STATE.md`.
   - Report to the owner with short summaries and file or ID references. Don't paste whole documents.
7. **The owner works from an Android phone:** keep instructions short and avoid asking for file transfers.
