# DB-7 Decision Brief: public deployment boundary and repository visibility

**Status:** **Proposed, for owner decision (26 Nov 2026).** Planning only. No Netlify configuration, files or repository settings have been changed.

**Why now:** RELEASE_1_CHECKLIST §5 already requires a decision on keeping `docs/` off the live site **before** Release 1 is merged. This brief is that decision, extended for the PWA.

## 1. Facts [V: verified 26 Nov]
- **What Netlify publishes:**
  - the branch `main` goes to https://pesa-pilot.netlify.app;
  - pull requests go to separate preview addresses;
  - there is no `netlify.toml` in the repository, so Netlify publishes the repository's files as they are.
- **`main` contains one file: `index.html`.** That is all the live site can serve today.
- **PR #1 would add:**
  - `docs/` (62 files: planning, decision packs, research plans, prototypes, demo data);
  - `tests/` (11 files);
  - `CLAUDE.md`;
  - `package.json`;
  - `fonts/` (2 files, needed).

  Merged as it stands, **all of it would be reachable on the live address.**
- **The GitHub repository is public.** Anyone can already read every document and every commit there.
- **Content check:** no personal data, financial records or secrets found in the repository files. The only phone numbers are labelled fake examples in the historical M-Pesa research document. The commit history shows the GitHub account names.

## 2. What a static Netlify site can and cannot secure

| Can genuinely secure | Cannot secure |
|---|---|
| **Which files exist on the site at all:** what isn't published can't be fetched | **Anything that *is* sent to the browser:** the app's code is readable by anyone who opens it. There must be no secrets in it, and there are none. |
| HTTPS (encrypted connection) | **"Hidden" addresses:** an unlisted link is not protection |
| Security headers that stop other sites framing PesaPilot, block content sniffing, limit what the page may load, and switch off camera, microphone and location | **Client-side "admin" screens:** any password check in the browser can be bypassed |
| Caching rules (critical for safe updates) | **What's in a public GitHub repository** |
| Site-wide password protection (a Netlify paid-plan feature; to verify) | **Your records' safety:** that depends on the phone, the PIN and backups, not on Netlify |

**Access control for ordinary users: not needed.**
- PesaPilot has no server-side data, so there is nothing on Netlify to log in to.
- The app's PIN locks it **on the phone**.
- Adding user accounts would mean a backend, which is excluded.

**Administrative tools:** none exist in the public app, and none should be added. Developer tools (tests, prototypes, models) stay in the repository and are **never published**.

## 3. Decision A: what Netlify publishes

| Option | How | Pros | Cons |
|---|---|---|---|
| **A1. App folder, an allowlist (recommended)** | Move the app's files into one folder (e.g. `app/`): `index.html` and `fonts/` now; later `manifest.webmanifest`, `sw.js` and `icons/`. `netlify.toml` says "publish `app/` only". | Only what's deliberately put in the folder can ever go live. New documents are safe by default. It is also where the PWA files belong. | Tests point to the new path (small change); one-time move |
| A2. Blocklist rules | Keep files where they are; add rules returning "not found" for `/docs/*`, `/tests/*`, `CLAUDE.md`, `package.json` | No file moves | Every new folder must be remembered. One omission = exposure. Fragile. |
| A3. Separate repositories | Internal documents in another repository | Clean separation | Splits the record Claude sessions rely on; more upkeep |

**Recommendation: A1.**
- It stays within DEC-002: still no build step, just a folder.
- It must land **before Release 1 is merged**. It can be its own tiny change, verified on the PR preview (the `/docs/...` addresses must return "not found" there).

**Effect on the owner guide:** T17 downloads the demo file from the preview's `/docs/demo/` address. After A1, it would come from GitHub's raw file link instead. The guide would be updated.

## 4. Decision B: repository visibility

| Option | Effect | Pros | Cons |
|---|---|---|---|
| **B1. Make the repository private (recommended)** | Only you, and the tools you allow, can see it. Netlify and Claude keep access through their GitHub apps (to confirm in the settings after the switch). | Plans, research and decision packs stay internal. Commit history isn't public. | Lose public transparency (not needed now). A few minutes' checking in GitHub and Netlify settings. |
| B2. Keep it public | Everything stays readable | Openness; no change | Competitors and anyone else can read the full strategy, research plan and decision history |
| B3. Public app repository + private documents repository | Split | Fine-grained | More work; see A3 |

**Recommendation: B1.**
- **Before** opening PesaPilot to testers (L2), or sooner.
- It changes nothing for users or for the live site.
- **Note:** anything already public may have been copied. Making it private stops future exposure, not past.
- **Who does it:** you, in GitHub → Settings → General → Danger Zone → Change visibility. I'd then confirm that Netlify previews and this workspace still work.

## 5. Decision C: security headers (added with A1, in `netlify.toml`)

**Plain-language summary:** only PesaPilot's own files may run; nothing may be loaded from elsewhere; other sites can't embed PesaPilot; the phone's camera, microphone and location are switched off.

**Proposed headers:**

| Header | What it does |
|---|---|
| **Content security policy** | Allows only PesaPilot's own files to run or load, and nothing from elsewhere. This blocks injected scripts, the main risk named in DB-4. |
| `X-Content-Type-Options: nosniff` | Stops the browser treating a file as something it isn't |
| `Referrer-Policy: no-referrer` | Doesn't tell other sites where a visitor came from |
| `Permissions-Policy` | Switches off camera, microphone, location and payment features |
| `frame-ancestors 'none'` | Stops other sites embedding PesaPilot inside their pages |
| Cache rules | `index.html`, `sw.js` and the manifest are always rechecked; fonts and icons are cached long-term, with versioned names |

**One technical choice inside C:**
- Today the app's code sits **inside** `index.html`. A strict security policy then needs either "inline code allowed" (weaker) or a fingerprint (hash) of the code that changes every release.
- **Recommended:** move the code and styles into two files next to it (`app.js`, `app.css`) **as part of the PWA stage**. The policy can then simply say "only our own files".
- This adjusts **DEC-002** from one file to three files in one folder, still with **no build step**. Until then, an interim policy that allows inline code still blocks outside scripts.

## 6. Implications
- **Users:** none visible. Same app, same address, same records.
- **Data:** untouched. The app's storage is unaffected by moving files on the server, because the address stays the same.
- **Risk:** low.
  - A1 is verified on the PR preview before merge.
  - Headers are checked so they don't block the app's own font or code. The tests and UI audit run against the preview.
- **Cost:** KSh 0. Netlify password protection, if ever wanted for a beta site, may need a paid plan (not proposed).
- **Reversible:** yes. Remove the publish setting or headers; make the repository public again.

## 7. Choices for the owner

| # | Choice | Recommendation |
|---|---|---|
| 7.1 | What Netlify publishes | **A1: an app folder (allowlist)**, before Release 1 is merged |
| 7.2 | Repository visibility | **B1: private**, before L2 testers (you change it; I verify) |
| 7.3 | Security headers | **Approve the set in §5**: interim policy now; strict policy with `app.js`/`app.css` in the PWA stage |
| 7.4 | DEC-002 adjustment | **Allow app.js + app.css** (no build step) when the PWA is built |
| 7.5 | Access control for ordinary users | **None** (nothing on the server to protect); no admin tools in the public app |
