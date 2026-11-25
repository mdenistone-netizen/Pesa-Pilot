# Technical Decision Register

Each decision records what was decided, why, and what would make us revisit it.
"Owner approval" marks decisions that need the product owner's agreement.

| ID | Date | Decision | Why | Revisit when | Status |
|---|---|---|---|---|---|
| DEC-001 | 2026-11-25 | The source of truth is the code in GitHub `main`. The Phase 0 report was never available, so `docs/CURRENT_STATE_ASSESSMENT.md` is the official baseline. | Only the code can be verified. | Never | Agreed by owner |
| DEC-002 | 2026-11-25 | Keep the single-file, no-build architecture for now. | It works, it is easy to deploy from a phone, and a rewrite would put correct behaviour at risk. | The file becomes hard to change safely, or we need cloud sync / multiple developers. At that point split into modules (still no framework needed). | Adopted |
| DEC-003 | 2026-11-25 | Testing uses black-box Playwright tests against the real `index.html`, with no test framework and no app dependencies. | It tests what users actually run, and Playwright is already installed in the Claude cloud environment. | We split the code into modules, at which point add unit tests for the calculation engine. | Adopted |
| DEC-004 | 2026-11-25 | Migrations must never delete or reclassify data they do not understand. Unknown fields and types are carried forward. | Data integrity; lets old and new versions coexist safely. | Never | Implemented (CR-001) |
| DEC-005 | 2026-11-25 | No Firebase / cloud backend yet. | Not implemented today. Correct local data comes first: syncing a flawed model would spread the errors to every device. It also adds accounts, privacy and cost obligations. | Phase 1–2 are done and verified. A separate owner-approved proposal is needed. | Recommended, **owner approval** |
| DEC-006 | 2026-11-25 | Work happens on `claude/*` branches. `main` changes only after test evidence and owner approval. | Netlify may deploy `main` automatically (not yet confirmed), so `main` is treated as live. | The owner confirms how Netlify deploys. | Adopted |
| DEC-007 | 2026-11-25 | Files keep their existing CRLF line endings. | Avoids diffs where every line appears changed, which would hide real changes from review. | Never | Adopted |
| DEC-008 | 2026-11-25 | Savings model: a goal is separate from accounts. Money is either set aside inside an account (balance unchanged, available reduced) or moved by a transfer marked for the goal (the allocation moves with it). | Owner decision (option c). Matches how Kenyans save: M-Pesa, M-Shwari, SACCO or mental envelopes. | Never | **Approved by owner**, implemented CR-002 |
| DEC-009 | 2026-11-25 | Allocations can never exceed an account's available amount. Spending into set-aside money is allowed only after a warning, then shown as a shortfall. | Prevents double counting without blocking real life (emergencies). | User feedback | Implemented |
| DEC-010 | 2026-11-25 | Debt repayments are not spending. Borrowing is not income. | Counting the purchase made with borrowed money *and* the repayment would count the same spending twice. | Interest/fees split (Phase 3) | Implemented |
| DEC-011 | 2026-11-25 | Goal progress and debt repaid are calculated from records, never stored as typed numbers. | Makes D4-type inconsistencies impossible. | Never | Implemented |
| DEC-012 | 2026-11-25 | Upgrade 9→10 keeps every entry, records `legacyType`, and stores an untouched snapshot readable by the old app. | Data-integrity principle; reversible. | Never | Implemented |
| DEC-013 | 2026-11-25 | App-created legacy goal/debt entries go to "Other / unassigned", not a guessed account. | The old app forced "Other"; guessing M-Pesa would invent facts. The total is unaffected, and the user can reassign entries. | Owner prefers a default | Implemented |
