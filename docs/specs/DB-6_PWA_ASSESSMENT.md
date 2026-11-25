# P6 · DB-6: Installable & Offline PesaPilot (PWA, defect D9): assessment

**Status:** assessment and decision brief (planning only, DEC-023). Building it is **Stage C** and needs owner approval. **Local-first is preserved.** A PWA adds no server and no data upload.

## 1. The decision
Should PesaPilot become a full Progressive Web App (PWA), and how should it update itself safely?

**Why it matters:**
1. **Install:** a home-screen icon and a full-screen app feel. "Install app" in Settings doesn't work today (D9).
2. **Offline opening:** today the app can't open without data, though records are stored locally.
3. ~~Share target~~: no longer needed. M-Pesa capture was declined (DEC-024).
4. **Less risk of the browser clearing data:** installed apps can ask for "persistent storage".

**The risk:** a service worker caches the app. Done badly, people get **stuck on an old version**. In a finance app with data migrations, an old version running against newer data is dangerous. We proved the original build damages upgraded data (RELEASE_1_CHECKLIST R2).

## 2. What it involves

| Piece | Purpose | Notes |
|---|---|---|
| `manifest.webmanifest` | Name, icons, colours, start URL, display mode (no share target: DEC-024) | A static file; no risk to data |
| `sw.js` (service worker) | Caches app files (`index.html`, the font) for offline opening | **Never caches or touches financial data.** Data stays in browser storage as today. |
| Icons | 192/512 px, maskable | Brand mark |
| `navigator.storage.persist()` | Asks the browser not to evict PesaPilot storage | Best effort; browsers decide |
| Netlify headers | `sw.js` and `index.html` served as "always check for a newer version" | A small `netlify.toml` or `_headers` file |

## 3. Update strategy (the critical part)
Recommended: **"network first for the app page, cache as fallback, never silently old"**.
1. **When online:** always fetch the latest `index.html` from Netlify. Use the cached copy **only when offline**.
2. **Versioned caches:** each release has a cache name with its version. Old caches are deleted when the new worker activates.
3. **Visible updates:** if a new version is found while the app is open, show "A new version is ready. **Reload**". Never swap code in the middle of a form.
4. **Schema guard (must come first; new defect D13).**
   - **Tested today:** if the current version opens data saved by a *newer* version, it keeps the unknown fields (good, DEC-004) but **saves the data back labelled as schema 10**. The newer version would then wrongly re-run its upgrade.
   - **Fix:** never lower the stored schema version. If stored data is newer than the app, show "Please reload to update PesaPilot" and block saving until updated.
   - This protects every future release, with or without a PWA, so it should be built **before or with** Stage C.
5. **Kill switch:** the worker checks a tiny `sw-control.json`. If it says "unregister", every device removes the worker and returns to plain web loading. Tested before launch.
6. **Testing:**
   - Playwright tests for offline opening, update prompts, the old-cache clean-up, the schema guard and the kill switch;
   - the full regression and migration suites;
   - the rollback path re-checked with a worker installed.

## 4. Assessment

| Criterion | Assessment |
|---|---|
| **Privacy** | Unchanged. The worker caches only app files. No analytics, no data leaves the phone. |
| **Security** | Same origin (HTTPS on Netlify). The worker can't read other apps' data. The main new risk is stale code, handled by §3. Pinned version caches stop a mixed-version app. |
| **User control** | The user chooses to install. Updates are visible (prompt). Uninstalling removes the app; data follows normal browser rules. Backups stay the user's safety net. |
| **Update reliability** | **The main risk, mitigated by:** network-first page, versioned caches, a reload prompt, the schema guard (D13), the kill switch and tests. Residual: a phone offline for weeks runs the cached version, which is safe with the schema guard. |
| **Offline behaviour** | The app opens and works offline (all logic is local). Nothing needs a network today, except possibly future Drive options. |
| **Cost** | KSh 0. Static files on Netlify's existing hosting; no new services. Development: a moderate stage with careful testing. |
| **Compatibility** | Install: Chrome on Android (our main target). iOS Safari installs PWAs with some limits. Android users are the majority of our market [assumption, to check in P4]. |
| **Reversibility** | Yes, through the kill switch and removing the manifest. |

## 5. Alternatives
- **(2) Manifest only, no service worker:** gives install on some browsers. No offline opening, and share-target support is limited. Low risk, low value.
- **(3) A native Android app** (wrapping the web app): Play Store presence and possibly automatic SMS reading later. A new release channel, store policies, signing keys, and update delays through store review. Not justified until there is customer evidence.
- **(4) Do nothing:** D9 stays open; no install or offline opening.

## 6. Recommendation
1. **Approve Stage C as a full PWA** using the §3 update strategy.
2. **Build the schema guard (D13) first.** It's small, protects all future releases, and could even be included in a later release ahead of the PWA.
3. **Order:** D13 guard → manifest + icons → service worker with network-first + kill switch → persistent-storage request.

## 7. Decisions for the owner (DB-6)

| # | Decision | Recommendation |
|---|---|---|
| 1 | Approve a full PWA (Stage C) with network-first updates, a reload prompt and a kill switch | Yes, after Release 1 |
| 2 | Fix D13 (schema guard) ahead of Stage C | Yes. Its own small change, tested and released separately. |
| 3 | ~~Share target~~ | Not applicable: capture declined (DEC-024) |
| 4 | Native Android app | Not now |
