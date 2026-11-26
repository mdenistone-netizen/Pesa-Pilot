# DB-7 Implementation-Readiness Review

**Status:** **Review only (26 Nov 2026). Nothing is implemented.** No code, Netlify configuration, repository settings, schema, PR #1 or production has been changed.

**Brief:** `DB-7_PUBLIC_DEPLOYMENT_BRIEF.md`.

**Evidence labels:**
- **[V]** verified in this session;
- **[T]** tested on a throwaway copy in this session;
- **[E]** expectation, to confirm in your GitHub or Netlify settings;
- **[O]** your decision.

---

## 1. Making the GitHub repository private

### 1.1 What I verified [V]

| Question | Finding |
|---|---|
| Who has access | **You only** (`mdenistone-netizen`, admin). No other collaborators. |
| Forks / stars / watchers | **0 / 0 / 0**, so nobody's copy is detached and nothing is lost |
| GitHub Pages | Not used |
| GitHub Actions | Not used (no `.github/` folder), so no build-minute limits apply |
| How Netlify is connected | Through **Netlify's GitHub app**: PR #1's preview status is posted by `netlify/pesa-pilot/deploy-preview` |
| How Claude is connected | Through the **Claude GitHub app** plus this workspace's GitHub connection |
| Links that will stop working for the public | The demo-data link in RELEASE_1_CHECKLIST §3 (a `raw.githubusercontent.com` address). The owner guide's T17 uses the preview address instead, which DB-7's folder change also removes (§2.6). |

### 1.2 Will things keep working?

| Item | Answer | Basis |
|---|---|---|
| **Netlify deployments and previews** | **Yes, expected**, as long as Netlify's GitHub app has access to this repository. Netlify supports private repositories, including on its free plan [E: confirm the app's repository access first, step 1 below]. | The app is already installed; visibility doesn't change an app's permissions |
| **Claude's workflow** (fetch, push, PR reads) | **Yes, expected**, as long as the Claude GitHub app has access to this repository [E: step 1]. If it doesn't, you'd reconnect at claude.ai/connect-github. | The workspace reaches GitHub through the app, not anonymously |
| **Branch, PR #1, commit history** | **Kept exactly.** Changing visibility doesn't touch branches, pull requests, commits or issues. | GitHub behaviour |
| **Collaborators and integrations** | Nobody else to lose. Apps keep the access they were granted. | §1.1 |
| **The live site** | **Unaffected.** Netlify serves what it last deployed; no deployment is triggered by a visibility change. | — |
| **Already-public content** | **Making it private stops future access, not past copies.** Anything already copied or indexed may remain elsewhere. There's no personal data in the repository files. | — |

### 1.3 Your exact steps in GitHub (when you approve)

**Step 1, before changing anything (checks only; about 3 minutes):**
1. GitHub (app or browser) → your **profile picture** → **Settings** → **Applications** → **Installed GitHub Apps**.
2. Next to **Netlify**, tap **Configure** → under *Repository access*, confirm **All repositories**, or that **Pesa-Pilot** is in the selected list.
3. Do the same for **Claude**.
4. In Netlify: your site **pesa-pilot** → **Site configuration** → **Build & deploy** → **Continuous deployment**. Confirm the repository shows **mdenistone-netizen/Pesa-Pilot** and the production branch is **main**.
5. Send me a screenshot or a short note of what each shows.

**Step 2, change the visibility:**
1. Open the repository → **Settings** (gear tab) → **General** → scroll to **Danger Zone**.
2. **Change repository visibility** → **Change to private** → read the warning → type the repository name to confirm.
3. GitHub may ask for your password or a two-factor code.

**Step 3, check afterwards** (5 minutes, with me):
1. **You:** open the repository in a private or incognito browser window without logging in. It should show **"404 – page not found"**, which proves it's private.
2. **You:** logged in, PR #1 is still there, still a **draft**, with all its commits.
3. **Me:**
   - fetch the branch;
   - read PR #1 through GitHub;
   - push a tiny documentation-only commit.

   That confirms Claude's access.
4. **Me:** that push makes Netlify rebuild the preview. I confirm GitHub shows "**Deploy Preview ready**" for the new commit, which confirms Netlify's access.
5. **You:** open https://pesa-pilot.netlify.app. The live app should open **unchanged**.

**Undo:** the same Danger Zone setting → Change to public. Fully reversible, and nothing is lost (there are no stars or watchers).

**When:** independent of the folder change (§2). **Recommended:** *after* the folder change has been verified on the preview, so that if anything misbehaves we know which change caused it, and **before** any testers (L2).

---

## 2. Netlify publishing structure

### 2.1 Proposed structure (option A1, an allowlisted app folder)

```
Pesa-Pilot/ (repository)
├── app/                         ← the ONLY folder Netlify publishes
│   ├── index.html               ← moved here unchanged (git keeps its history)
│   └── fonts/
│       ├── inter-latin-wght-normal.woff2
│       └── OFL-Inter.txt        ← the font's licence, which should ship with it
├── netlify.toml                 ← Netlify settings (not published itself)
├── docs/   tests/   CLAUDE.md   package.json   ← never published
```

Later, the PWA stage adds `app/manifest.webmanifest`, `app/sw.js` and `app/icons/`, and nothing else.

### 2.2 Exact Netlify settings (`netlify.toml`, proposed content)

```toml
[build]
  publish = "app"        # only this folder goes online
  # no build command: Netlify serves the files exactly as they are (DEC-002, no build step)

[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    X-Frame-Options = "DENY"
    Cross-Origin-Opener-Policy = "same-origin"
```

- A `netlify.toml` setting **overrides** the publish setting in Netlify's dashboard, so the repository is the single source of truth.
- Caching is left at Netlify's default ("always recheck"). DB-7 doesn't change it. Long-term caching of versioned files comes with the PWA stage.

### 2.3 What happens to `index.html`, and to users' data
- **Moved unchanged** into `app/`, with git keeping its history (`git mv`).
- **The web address doesn't change.** `https://pesa-pilot.netlify.app/` serves `app/index.html` as its home page.
- **Users' records are unaffected.** Browser storage belongs to the *web address*, not to the folder on the server, so every user's data stays exactly where it is.

### 2.4 Relative paths and assets
- The app's **only** outside file is its font, referenced as `fonts/inter-latin-wght-normal.woff2` [V].
- The font moves together with `index.html`, so the reference keeps working.
- There are no other assets: no images, scripts, stylesheets or links to other sites [V].

### 2.5 Keeping future documents private: three layers
1. **Allowlist:** only what's inside `app/` can ever be published. New documents go to `docs/`, which is never published.
2. **Automated guard (new test):** `npm test` fails if `app/` contains anything outside an approved list (today `index.html` and `fonts/*`; later the PWA files).
3. **Preview check, before every merge:** these addresses must return "not found" on the preview: `/docs/…`, `/tests/run.js`, `/CLAUDE.md`, `/package.json`, `/netlify.toml`, `/app/index.html`.

### 2.6 Is moving necessary? The alternatives

| Option | How | Safety | Complexity | Verdict |
|---|---|---|---|---|
| **A1. Move the app into `app/`** | Above | **Allowlist:** a new file can't go live by accident | Low: 1 file + font moved; 4 test path lines | **Recommended** |
| A1b. Keep files in place; a copy command builds a publish folder | `command = "mkdir dist && cp index.html dist/ && cp -r fonts dist/"`, `publish = "dist"` | Allowlist (the list lives in the command) | Adds a **build step** on Netlify, against DEC-002, and a build that can fail | Workable second choice |
| A2. Blocklist rules | Keep the root; return "not found" for `/docs/*`, `/tests/*`, `/CLAUDE.md`, … | **Blocklist:** every new folder must be remembered; one omission = exposure | Low | Not recommended |

**Moving isn't strictly necessary** (A1b works), but it's the **simplest safe option**: no build step, and the rule ("only `app/` is public") is visible in the folder structure itself.

### 2.7 Knock-on changes (part of the same change)
- **Tests:** 4 path lines (`tests/harness.js:9`, `tests/engine-fingerprint.js:45`, `tests/run.js:948`, `:963`). The tests that read *old* releases from git history (`8e33d44`, `8370097`) are unchanged.
- **Emergency rollback (RELEASE_1_CHECKLIST §8B) must be updated.** The safe rollback build `8370097` **contains `docs/` and `tests/`** [V], and it has no `netlify.toml`. Deploying it as it is would publish them.

  **New procedure:** a rollback branch made from the **current** layout (`app/`, `netlify.toml`), with only `app/index.html` replaced by the safe build's file. It is tested in advance.
- **Owner guide T17:** the demo file would no longer be on the preview. I'd send it to you directly in this chat (it's fake data), and update the guide and checklist.
- **`package.json` description** ("The app itself is index.html") becomes "app/index.html".

---

## 3. Security headers and the content security policy

### 3.1 What the app actually uses [V: inspected `index.html`]

| Resource | Found | Policy needed |
|---|---|---|
| Inline `<script>` blocks | **1** (all the app's code) | `script-src 'self' 'unsafe-inline'` (interim), or a split for strict |
| Inline `<style>` blocks | **1** | `style-src 'self' 'unsafe-inline'` |
| `style="…"` attributes in screen templates | **82** | `style-src 'unsafe-inline'` (kept even in the strict policy; style injection can't run code) |
| Inline event handlers (`onclick=` etc.) | **0** | — |
| `eval`, `new Function`, string timers | **0** | — |
| External scripts, libraries, stylesheets, links | **0** | — |
| Fonts | 1, self-hosted (`fonts/…woff2`) | `font-src 'self'` |
| Images | 0 files; icons are inline SVG | `img-src 'self' data: blob:` (headroom for icons and the manifest) |
| Network requests (fetch, XHR, WebSocket, beacons) | **0** | `connect-src 'self'` (the PWA's update checks) |
| Backup download | the browser's temporary-file link (`createObjectURL`) | Downloads aren't restricted by the policy [T: works] |
| Frames, pop-ups, printing | 0 | — |

### 3.2 Each header in plain English

| Header | What it does for PesaPilot |
|---|---|
| **Content security policy** | A list of what the page may load and run. Here: **only PesaPilot's own files**; nothing from any other website; no plugins; no being embedded in other sites. If someone ever managed to inject code, it **couldn't load more code from elsewhere or send data out** through normal web requests. |
| `X-Content-Type-Options: nosniff` | The browser must treat each file as exactly what it says it is, never "guess" it into a script |
| `Referrer-Policy: no-referrer` | When leaving PesaPilot, the next site isn't told where the visitor came from |
| `Permissions-Policy` | Switches off camera, microphone, location, payments and USB. PesaPilot needs none of them, so nothing can ever ask for them. |
| `X-Frame-Options: DENY` (plus `frame-ancestors 'none'`) | No other website can show PesaPilot inside its own page, which blocks "click-jacking" tricks |
| `Cross-Origin-Opener-Policy: same-origin` | Keeps PesaPilot's window separate from any other site's window |
| Not added now | **HSTS** (forcing HTTPS): Netlify already serves the site over HTTPS. It is worth adding with a custom domain later. **Caching changes:** left to the PWA stage. |

### 3.3 Test results [T]
A stand-in for Netlify served the proposed `app/` folder with exactly these headers. The browser recorded every policy violation. Tools: `../prototypes/db7-headers/`.

| Test | Interim policy, current single file | Strict policy, current single file | Strict policy, script moved to `app.js` (throwaway copy) |
|---|---|---|---|
| App starts; font loads | ✅ | ❌ **the app doesn't start** (its inline script is blocked) | ✅ |
| Welcome + PIN, accounts, expense, transfer, goal set-aside, reconcile, plan | ✅ Available 6,400; Total 9,400; Safe 771 a day (all correct) | — | ✅ same figures |
| Backup download (no PIN inside) → import → figures restored | ✅ | — | ✅ |
| Locked after reload; unlocks with the PIN | ✅ | — | ✅ |
| Dark mode | ✅ | — | ✅ |
| **Policy violations by the app** | **0** | many | **0** |
| Another site embedding PesaPilot | **Blocked** | — | **Blocked** |
| An injected outside script | **Blocked** | — | **Blocked** |
| A request to an outside website | **Blocked** | — | **Blocked** |
| Full regression suite | (current suite: 64/64) | — | **64/64 passed** against the split copy (2 tests always use the repository's own file) |

### 3.4 Recommendation for the policy
- **DB-7 now: the interim policy.**
  - It works with today's single file and caused zero violations.
  - It keeps DEC-002 untouched.
  - It already blocks outside code, outside requests and embedding.
- **The residual risk, stated:** with `'unsafe-inline'`, *injected* inline code could run. It couldn't fetch anything or send data through normal requests, but it could still navigate the page away. No policy can stop that.
- **Strict policy later, with the PWA stage:**
  - move the code into `app/app.js` (a mechanical cut and paste);
  - one `<script src="app.js">` line in `index.html`;
  - CRLF line endings kept.

  This needs your approval then, because it adjusts DEC-002 from one file to two, still with no build step.

  **Testing for the split:**
  - the full suites run against the split files;
  - the engine fingerprint is pointed at `app.js`;
  - the strict-policy smoke test;
  - and, because the PWA saves files on the phone, a check that the page and `app.js` always update together.

---

## 4. Regression and release-protection test plan (for the implementation)

| # | Proves | How | Pass |
|---|---|---|---|
| 1 | The app works after the move | `npm test` on the branch | **64/64 regression** |
| 2 | Upgrade and rollback | Migration suite | **4/4** (original-build and safe-rollback reads from git history are unchanged) |
| 3 | Screens | `npm run test:ui-snapshot` | **78/78 identical.** The file content is unchanged, so **no update** is expected. Any difference is investigated, not re-saved. |
| 4 | Calculations unchanged | Engine fingerprint (path updated) | **106/106** |
| 5 | Backup / restore, PIN | Included in #1, plus the header smoke test (§3.3) against the final `app/` | Pass, with 0 policy violations |
| 6 | Only allowed files published | New `tests/publish-check.js` in `npm test` | Fails if `app/` holds anything unapproved |
| 7 | **No internal documents on the deployed preview** | Request each internal address on the **real Netlify preview** | **"Not found"** for `/docs/RELEASE_1_CHECKLIST.md`, `/docs/demo/pesapilot-demo-schema9.json`, `/docs/prototypes/onboarding/`, `/tests/run.js`, `/CLAUDE.md`, `/package.json`, `/netlify.toml`, `/app/index.html`; **the app** at `/` |
| 8 | **Real headers on the real preview** | Read the response headers of the preview | All 6 headers present; the app shows 0 violations |
| 9 | **Android Chrome** | You, on the preview: T1–T6, T14–T16 of the owner guide (about 15 minutes) | Same results as before; font and layout normal |
| 10 | Rollback still possible | Build the updated rollback branch (current layout + the safe build's `index.html`) and run it on a local copy | It opens the data unchanged and publishes nothing internal |

**One practical point about #7 and #8:**
- This workspace currently **can't reach Netlify addresses** (blocked by its network settings).
- **Options:**
  - when we implement, I ask you once to allow the preview address (`deploy-preview-1--pesa-pilot.netlify.app`) in the workspace settings, so I can run #7 and #8 myself (**recommended**); or
  - you open the 8 addresses on your phone, and use a free header-checking website for #8.

---

## 5. Decisions and boundaries

| Already covered by an existing decision | Where |
|---|---|
| Develop on a branch; check on the preview; deployment only with the checklist and your explicit approval; backup and rollback proven | **DEC-017** (production protection), DEC-018 (Release 1 gate) |
| Keeping `docs/` off the live site was already a **pre-merge checklist item** | RELEASE_1_CHECKLIST §5 |
| Cache only app files; never `/docs/` (PWA stage) | DEC-029 (DB-6 6.5) |

| DB-7 proposes (new) | Needs your approval? |
|---|---|
| 7.1 Publish only `app/` (A1), with the guard test and the preview check | **Yes** |
| 7.2 Make the repository private (you do it; I verify), after the folder change is verified and before testers | **Yes** (your action) |
| 7.3 The interim header set (§2.2) now; strict policy with the PWA stage | **Yes** |
| 7.5 No access control for ordinary users; no admin tools in the public app | Yes (confirmation) |
| 7.6 **Add the DB-7 change to Release 1**, as a non-functional change record (CR-008) before the merge | **Yes**: it **amends DEC-018's scope** (deployment configuration only; the app's behaviour is unchanged) |
| 7.7 **Update the emergency-rollback procedure** (RELEASE_1_CHECKLIST §8B) to use a prepared rollback branch in the new layout | **Yes**: changes the recovery procedure |
| 7.8 Allow the workspace to reach the preview address, for verification | **Yes**, when implementing (an approval prompt) |

**Decisions that change:**
- **DEC-018:** scope extended with CR-008 (7.6).
- **RELEASE_1_CHECKLIST §5 and §8B:** updated.
- **DEC-002:** **not** changed now. Its later adjustment (an `app.js` file) is a PWA-stage decision (7.4, deferred).
- **DEC-017** is unchanged and governs the whole process.

### Safest order
1. **You approve DB-7** (7.1, 7.3, 7.5, 7.6, 7.7).
2. **You do the step-1 checks** (§1.3): the two GitHub apps, and Netlify's repository setting. No change yet.
3. **I implement CR-008 on the branch:**
   - move to `app/` and add `netlify.toml`;
   - update the 4 test paths and add the guard test;
   - update the rollback procedure, checklist, guide and docs.
4. **I run tests 1–6 and 10 locally**, then push. PR #1 stays a draft and `main` is untouched.
5. **Preview verification:** tests 7–8 (with 7.8 or your help) and test 9 (you, on Android).
6. **You make the repository private** (§1.3 step 2). **I re-verify** (step 3).
7. **The Release 1 checklist continues.** Deployment remains a separate, explicit decision.

Each step is reversible:
- the move: undo the commit;
- headers: remove the block;
- privacy: switch back.
