# DB-6 Decision Brief: installable and offline PesaPilot (PWA; fixes D9)

**Status:** **Design approved by the owner: DEC-029 (26 Nov), with the conditions below. Not implemented.** Implementation needs separate authorisation after Release 1 and D13. Local-first is preserved: no server, no data upload.

## Owner decisions (DEC-029) and how each condition is met

| # | Decision | Condition | How the design meets it |
|---|---|---|---|
| 6.1 | Approved | After Release 1 and D13 | Stage C follows C0 (D13) in the roadmap |
| 6.2 | Approved with conditions | **A failed update leaves the existing working version intact** | All-or-nothing install into a new cache; any failure keeps the current version in charge, online and offline [T, two clean runs]; the empty leftover cache is deleted; retried on the next online open (§3a.1–2) |
| 6.3 | Approved | Reload banner; no switching during forms; tabs coordinated; **no loss of unsaved work** | The banner never reloads by itself. Tapping Reload while a form has unsaved input asks: "Finish or discard your entry first". Tabs reload together only once each tab reports **no open form**. A tab with a form open shows the banner and reloads after the form is saved or closed. Until then, the D13 guard stops an old tab saving newer data (§3a.3). |
| 6.4 | Approved with conditions | **The emergency switch reliably removes the saved app copies when devices reconnect** | `sw.js` is never served from the HTTP cache (`updateViaCache: "none"`, always-revalidate header), and the app checks for an update on every open. The switch deletes **all** `pesapilot-*` caches and unregisters itself [T]. Release test: on real phones, after reconnecting, no PesaPilot cache and no worker remain (§3a.4). |
| 6.5 | Approved | App files only; never records, demo data or `/docs/` | Explicit list of cached files; a test fails if any other path, or any storage API, appears in `sw.js` (§2a, §8) |
| 6.6 | Approved with conditions | **Explain that the browser may refuse, and that it is not a substitute for backups** | Wording: "PesaPilot asked your browser to keep its data. Your browser decides; it may say no. Either way, **only a backup protects your records** if the phone is lost or reset." If refused: "Your browser didn't agree. Keep backing up regularly." |
| 6.7 | Approved | Settings + one dismissible Home tip | §5 |
| 6.8 | Approved with conditions | Emergency switch in rollback procedures after Stage C; **never roll back to a version incompatible with the current data** | **Rollback floor:** for each schema there is a named safe rollback build that understands it (as `8370097` is for schema 10). After schema 11, never Release 1. The recovery procedure gains "deploy the emergency switch with the rollback" (RELEASE_1_CHECKLIST §9). |
| 6.9 | Approved | No native app for now | — |

**Release requirements kept:**
- real Android testing (install, offline, update, interrupted update, emergency switch, rollback, slow network);
- the full test suites;
- the safeguards in RELEASE_1_CHECKLIST §9.



**Builds on:**
- `DB-6_PWA_ASSESSMENT.md` (P6);
- DEC-025 (D13 fix first).

This brief replaces that assessment where they differ (§10).

**Evidence**
- **[T] tested in this environment.** A throw-away proof (scratchpad only, **not in the repo or the app**) used a copy of today's app, its font and the demo data, on a local web server in Chromium:

  | # | Step | Result |
  |---|---|---|
  | 1 | Open online | The worker installs and caches the app files |
  | 2 | Reopen **offline** | The app opens; data identical |
  | 3 | "Deploy" a new version and reopen online | **The new version loads at once**; data identical |
  | 4 | Go offline again | **The newest version seen** opens, not the old one |
  | 5 | Deploy the **kill switch** | Worker and caches removed; data identical |
  | 6 | Offline after the kill switch | Doesn't open: back to normal web behaviour, as intended |

- **[T] Bug the proof caught:** in the first attempt, step 4 served the **old** version offline. The cause was a cache write the code didn't wait for, plus a lookup across all caches. That is precisely the "old code on newer data" danger (D13). The fix (each version reads and writes only its own cache, and waits for the write) is part of the design below, with a test for it.
- **[T] Size:** the app page is 257 KB, or **62 KB compressed**; the font is 48 KB.
- **[E] Estimates, to verify on the preview:** Netlify's revalidation behaviour, and opening times on a slow phone network.

---

## 1. The decision

Should PesaPilot become an **installable app that opens without internet** (a Progressive Web App), and how should updates reach phones **without anyone getting stuck on an old version**?

**Why it matters**

| Today | With the PWA |
|---|---|
| "Install app" in Settings usually says it isn't available (D9) | Home-screen icon; opens full-screen like an app |
| **No internet = the app won't open**, even though all records are on the phone | Opens and works fully offline; nothing in the app needs the internet |
| The browser may clear site data under storage pressure | An installed app can ask the browser to keep its data ("persistent storage") |
| Every visit downloads the page | The page is revalidated: little data when nothing changed [E] |

**The risk:** a service worker keeps a copy of the app on the phone. If it's done badly, phones keep running an **old version**. We have proven that an old version can damage newer data (RELEASE_1_CHECKLIST R2, D13). **The update design (§3) is the heart of this decision.**

## 2. What would be added

| Piece | What it does | Touches records? |
|---|---|---|
| `manifest.webmanifest` + icons (192, 512, maskable) | Name, icon and colours for installing | No |
| `sw.js` (service worker) | Keeps a copy of the **app files only** (page, font, icons) for offline opening | **No.** The records are in localStorage, which a service worker **cannot reach** [tested]. See §2a for what a worker *can* reach. |
| Update prompt in the app | "A new version of PesaPilot is ready. [Reload]" | No |
| `navigator.storage.persist()` | Asks the browser not to clear PesaPilot's data | No (protects it) |
| Netlify headers | `sw.js` and the page always revalidated | No |

**Not included:**
- no share target (DEC-024);
- no push notifications;
- no background sync;
- no analytics.

## 2a. Where the records live, and what a worker can reach (corrected 25 Nov)
**Correction:** the earlier wording said a service worker "can't read browser storage at all". That was too broad.

**PesaPilot's storage today** (checked in `index.html`): **localStorage only.** The app uses no IndexedDB, no cookies, no Cache Storage and no sessionStorage.

| Key | Holds |
|---|---|
| `pesapilot_v2` | All financial records and settings |
| `pesapilot_safety_backup_v9` | The safety backup |
| `pesapilot_pre_v10_snapshot` | The pre-upgrade copy |
| `pesapilot_device_id` | Device id |
| `pesapilot_onboarding_v1` | Onboarding done |
| `pesapilot_pin_attempts` | PIN lockout counter |

**What a service worker can reach** [tested in Chromium, from inside the worker]:

| Storage | Reachable by the worker? | Holds |
|---|---|---|
| localStorage | **No** (`undefined` inside workers, by design of the web platform) | **All PesaPilot records** |
| sessionStorage | **No** | Nothing |
| Cache Storage | Yes | The app-file copies the worker itself makes |
| IndexedDB | **Yes**, and it can retrieve **and use** any CryptoKey stored there, even a non-extractable one [tested, 26 Nov] | Nothing today. DB-4 (revision 2) proposes only a backup **public** key and locked items there, none of which can open a backup. |

**Demonstrated:**
- with records in localStorage, the worker installed, updated, failed an update and was killed;
- **the records were identical after every step**;
- a worker cannot modify what it cannot reach.

**The remaining theoretical path is our own worker code touching IndexedDB.** The design prevents it in three ways:
1. the worker's code does only caching;
2. a test fails the build if `sw.js` mentions IndexedDB or any storage API;
3. **DB-4 revision 2 stores nothing in IndexedDB that can open a backup:** only a public key and password/code locks.
   - **Correction (26 Nov):** an earlier version relied on a *non-extractable* key. A test showed that a worker can retrieve such a key and **use** it to decrypt, even though it can't export it. That design was withdrawn (DB-4 brief §3a).

## 3. Update design (how nobody gets stuck)

1. **Page: network first, with a time limit.**
   - When online, PesaPilot always asks Netlify for the latest page.
   - If the answer doesn't come within **3 seconds** (slow network), or the phone is offline, it uses the copy on the phone.
   - So whenever the network works, users get the current version.
2. **One cache per version.**
   - Each release has its own named copy, and **each version reads only its own copy** (the fix found by the proof).
   - When a new version takes over, older copies are deleted.
3. **Visible, safe switching.**
   - If a new version arrives while PesaPilot is open, a banner says: "**A new version is ready. Reload**".
   - It never switches in the middle of a form.
   - With two tabs open, all of them reload together (this ties in with today's cross-tab protection, R1).
4. **The D13 guard ships first** (DEC-025). If an older copy ever opens data saved by a newer version, it doesn't save. It says "Please reload to update PesaPilot". This is the safety net for the rare phone that stays offline through an update.
5. **Kill switch.**
   - **Recommended:** a "self-removing" `sw.js` that deletes its copies and unregisters itself.
   - Browsers check `sw.js` for changes at least once a day when the app is opened online, so deploying it reaches every phone that comes online [T, step 5].
   - Simpler than the assessment's separate control file.
6. **Rollback still works.**
   - The rollback build (`8370097`) has no worker. With network first, phones load whatever Netlify serves, so a rollback reaches online phones on the next open.
   - The rollback procedure gains one step: **deploy the kill switch with it**.
   - RELEASE_1_CHECKLIST §8 gets that step when Stage C is built.

**What an offline user sees:** the app works normally, with a small note: "You're offline. Everything still works; updates when you're back online."

## 3a. Update safeguards in detail (owner review, 25 Nov)
**[T]** means tested in the throw-away proof (scratchpad, Chromium, clean runs repeated twice). Everything here must be **re-tested on real Android phones** with the finished build (§8).

**1. Atomic updates: a phone never ends up with half a version.**
- A new worker copies **all** of its version's files into a new, separate cache before it can take over.
- If any file fails, the whole install fails and the current version stays in charge, untouched [T].
- The switch happens only after a complete copy, and only when the user taps Reload (or at the next fresh open).
- Old caches are deleted only *after* the switch [T].
- The app is one page with its code inside, so the page and its logic always match. Only the font and icons are separate; they are version-stamped and can't change behaviour.

**2. Failed or interrupted downloads**
- **Install fails** (data runs out, server error) → the current version keeps running, online and offline [T]. The leftover empty cache is deleted, and the update is retried on the next online open.
- **A page download fails or takes over 3 s** → the phone's copy of the **current** version opens.
- **A half-downloaded page is never cached:** only complete, successful responses are stored.

**3. No mixing of versions**

| Risk | Guard |
|---|---|
| Two versions' files mixed | Each version reads and writes **only its own cache** [T; the first proof's bug] |
| Page and worker on different versions | The page records its version. If the controlling worker is a different version, the page shows the Reload banner. Its logic is all in the page, so a mismatch can't mix code. |
| Two tabs on different versions | On Reload, all tabs reload together (a message between tabs). A tab that doesn't reload is stopped from saving newer data by the D13 guard. |
| Old code meeting newer data (offline phone, old tab) | **D13 guard** (released before Stage C): read-only, with "Please reload to update" |

**4. Kill-switch delivery**
- The worker is registered so that its file is **never taken from the browser's HTTP cache** (`updateViaCache: "none"`). Netlify serves `sw.js` with "always revalidate".
- The app also asks for an update check on every open.
- So **every phone that opens PesaPilot online gets the kill switch on that open** [T: it removed the worker and caches; the records were identical].
- **Limit:** a phone that never comes online keeps its copy. It is protected by the D13 guard, and it gets the kill switch on its first online open.

**5. Offline rollback and rollback in general**
- A phone that is offline during a rollback keeps running the version it has until it comes online. Then network first loads the rolled-back page, and the kill switch (deployed with the rollback) removes the worker.
- **Rollback floor:** after any schema change (e.g. schema 11, DB-5.12), the rollback build must understand that schema. Otherwise the D13 guard would rightly make it read-only for everyone.
  - So each schema gets a named "safe rollback build", as `8370097` is for schema 10.
  - **Release 1 is never a rollback target after schema 11.**
- The recovery procedure (RELEASE_1_CHECKLIST §8 pattern) gets both steps when Stage C is built.

## 4. Data use and phones in Kenya
- **First open after an update:** about 62 KB compressed for the page, plus the font (48 KB) only when it changes.
- **Opens with no change:** Netlify normally answers "not modified" (a few hundred bytes) [E, to confirm on the preview]. That is less data than today, where the page is always downloaded.
- **Slow networks:** the 3-second limit means a poor connection opens the phone's copy instead of waiting.
- **Installing:** Chrome on Android (the main target) supports installing and offline use. Other browsers may only offer offline opening. iPhones support it with limits.

## 5. Install experience
- **Settings → "Install app":** it works once the PWA exists (fixes D9).
- **The browser's own install offer** may appear.
- **One gentle suggestion on Home** after the first backup: "Add PesaPilot to your home screen." It can be dismissed and never repeats.
- **No nagging.** Installing is the user's choice.
- **Persistent storage** is requested after installing, or after the first backup.
  - It helps against automatic clearing.
  - It **doesn't** help if the user clears data themselves or loses the phone. Backups remain the safety net (DEC-020; DB-4).

## 6. Alternatives

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| **A. Full PWA with this update design** (**recommended**) | Install + offline + less data + persistent storage; KSh 0; reversible with the kill switch | Careful engineering and testing; a new release risk area | **Recommended**, Stage C |
| B. Manifest only (no worker) | Very low risk | Install works poorly or not at all on Chrome; **no offline opening** | Low value |
| C. Cache first ("fast open, update next time") | Fastest opening | Every update runs the **old version at least once**; dangerous with data migrations | Not recommended |
| D. Strict network first (no time limit) | Always newest | Slow, or no opening at all, on poor networks | Not recommended |
| E. Native Android app (Play Store) | Store presence | Signing keys, store policies, slower updates, a second codebase or wrapper; not needed without evidence | Not now |
| F. Do nothing | No new risk | D9 stays; no offline opening; more data use | Not recommended |

## 7. Implications

| Area | Effect |
|---|---|
| **Privacy** | Unchanged. Only app files are cached. The records (localStorage) are out of the worker's reach [tested]. The worker contains no code for IndexedDB, which it *could* reach (§2a); a test enforces this. Nothing is sent anywhere. |
| **Security** | Same HTTPS site. New risk: stale code, handled by §3 and D13. Only listed app files are cached, never `/docs/` pages, prototypes or demo data. |
| **User control** | Installing is optional. Updates are visible. Uninstalling removes the icon; the records follow normal browser rules. |
| **Update reliability** | The main risk. Mitigated by: network first with a time limit, per-version caches, the reload prompt, the D13 guard, the kill switch and tests. Residual: a phone offline for weeks runs its saved copy, which is safe because of D13. |
| **Cost** | KSh 0. Static files on the existing Netlify hosting. |
| **Release process** | Every future release also bumps the worker's version. The release checklist gains "worker version bumped" and "kill switch ready" items. |
| **Order** | Release 1 → D13 release → Stage C (this). Independent of DB-4 and DB-5. |
| **Docs on the live site** | The existing checklist item (keep `/docs/` off the live site) must be settled before Release 1. The worker never caches `/docs/` in any case. |

## 8. Testing (when built)
- **Offline:** open offline; record an entry offline; reopen.
- **Updates:**
  - a new version loads online;
  - **offline after an update opens the newest version seen** (the bug the proof caught);
  - the reload prompt appears and never interrupts a form;
  - two tabs reload together;
  - old caches are deleted.
- **D13 guard:** an older copy facing newer data is read-only.
- **Kill switch:** the worker and caches are removed and the data is untouched; the rollback path works with a worker installed.
- **Slow network:** with a simulated poor connection, the phone's copy opens within about 3 seconds.
- **Scope:**
  - `/docs/` is never cached;
  - a test reads `sw.js` and fails if it mentions `indexedDB`, `localStorage`, `cookie` or any address outside PesaPilot;
  - the records are byte-identical before and after install, update and kill switch.
- **Full suites:** regression, migration, engine fingerprint, UI audit and snapshot.
- **Real Android phones (required before approval to deploy):**
  - at least one low-end and one mid-range phone, in Chrome and the phone's own browser;
  - install, offline open, update with Reload, an interrupted update (data switched off mid-download), the kill switch and a rollback;
  - confirm Netlify revalidation and the 3-second fallback on a slow connection.

## 9. Choices for you

| # | Choice | Recommendation | Alternatives |
|---|---|---|---|
| 1 | Build a full PWA as Stage C | **Yes**, after Release 1 and the D13 release | Manifest only (B); not now |
| 2 | Page update method | **Network first with a 3-second limit, then the phone's copy** | Cache first (C); strict network first (D) |
| 3 | Switching versions | **Reload banner; never mid-form; all tabs together** | Automatic switch |
| 4 | Kill switch | **Self-removing worker file** | Separate control file |
| 5 | What is cached | **App files only (page, font, icons, manifest); never `/docs/`, never data** | — |
| 6 | Persistent storage request | **Yes**, after install or the first backup | No |
| 7 | Install suggestion | **Settings button + one dismissible Home suggestion after the first backup** | Settings only |
| 8 | Rollback procedure | **Add "deploy the kill switch" to the recovery steps when Stage C is built** | — |
| 9 | Native Android app | **Not now** | Investigate later with evidence |

**Reversible?** Yes.
- The kill switch returns every phone that comes online to plain web loading [T].
- Removing the manifest removes installing.
- Records are never touched.

## 10. Differences from the assessment (`DB-6_PWA_ASSESSMENT.md`)
1. **Network first now has a 3-second time limit,** for slow networks.
2. **Each version reads only its own cache.** A proof showed that the plain version can serve an old copy offline.
3. **The kill switch is a self-removing worker** instead of a control file. Tested.
4. **Added:**
   - data use;
   - install suggestion rules;
   - the rollback step;
   - "never cache `/docs/`";
   - a separate item for every test.
