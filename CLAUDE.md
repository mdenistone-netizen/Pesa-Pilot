# PesaPilot: instructions for Claude sessions

1. **Start here:** read `docs/MASTER_PROJECT_STATE.md`. It is the current state, the pending decisions and the next steps. Detail lives in the other files under `docs/`.
2. **Roles (DEC-014):**
   - Claude is the architect and builder.
   - Routine engineering decisions are Claude's to make.
   - Financial rules, data structures, architecture, security, user data, costs and major features need a decision brief and owner approval. A brief covers: the decision, why it matters, the recommendation, alternatives, pros and cons, implications, and whether it can be reversed.
   - Keep working on tasks no pending decision blocks.
3. **Never** deploy, merge to `main`, or run destructive data changes without explicit owner approval. `main` is treated as live (DEC-006).
4. **Code:** everything is in `index.html` (single file, no build). Keep its CRLF line endings (DEC-007). Migrations must stay non-destructive and idempotent (DEC-004).
5. **Test before claiming anything:** `npm test` and `npm run test:ui-snapshot`. Re-save the snapshot (`npm run test:ui-snapshot:save`) only after intended UI changes.
6. **Docs are part of the work:**
   - After each change, update `CHANGE_REGISTER.md`, `DEV_LOG.md`, `DECISIONS.md` and `FINANCIAL_RULES.md` as relevant.
   - Always update `MASTER_PROJECT_STATE.md`.
   - Report to the owner with short summaries and file or ID references. Don't paste whole documents.
7. **The owner works from an Android phone:** keep instructions short and avoid asking for file transfers.
