# Prepared emergency rollback build (DB-7 7.7, DEC-031)

**Never deploy commit `8370097` directly.** Its tree contains `docs/` and `tests/` and has no `netlify.toml`, so it would publish internal files.

`schema10-safe-index.html` is the safe rollback app (`8370097`'s `index.html`, byte-identical; checked by `tests/rollback-check.js`). It is:
- compatible with schema 10 data: proven by `tests/migration.js` ("safe-rollback build keeps data");
- compatible with the interim security headers (tested).

This folder is outside `app/`, so it is never published.

**Emergency procedure** (see `docs/RELEASE_1_CHECKLIST.md` §8B):
1. Create a branch from the current `main`.
2. Replace `app/index.html` with `release/rollback/schema10-safe-index.html`, keeping its CRLF line endings. Change nothing else.
3. Run `node tests/rollback-check.js`, then open a PR and check its preview.
4. The owner approves the merge.

The layout, `netlify.toml` and headers stay as they are, so only `app/` is published.

**Only valid while the data is schema 10.** After any schema change (e.g. schema 11), a new safe build for that schema must be prepared here first: the rollback floor (DEC-029 6.8).
