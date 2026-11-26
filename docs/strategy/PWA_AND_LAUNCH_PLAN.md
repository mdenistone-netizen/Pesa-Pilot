# PesaPilot as an installable, offline Android app: plan and assessment

**Status:** **Planning only (26 Nov 2026).** Nothing here is implemented or authorised. It respects the approved designs:
- DB-6, the PWA (DEC-029);
- DB-4, protected backups (DEC-028);
- DB-5 and D14 (DEC-027, DEC-030);
- DEC-024: no M-Pesa SMS access;
- local-first, with no backend.

**Owner's note on Release 1 (26 Nov):** "happy with Release 1 for now". Recorded as satisfaction, **not deployment approval**. Deployment still needs the preview review results and an explicit "Deploy Release 1" (DEC-018).

**Evidence labels:**
- **[V]** verified in this session (repository, GitHub, code);
- **[E]** expert expectation, to confirm on real phones;
- **[O]** owner decision needed.

**About "similar to DEGUM LANDLORD":** I haven't reviewed that app, so I've taken it to mean a polished, branded app that installs on the home screen, opens full-screen with its own icon and splash, and feels fast and trustworthy. If you share what you like about it (screenshots are enough), I'll align the details.

---

## 1. Current architecture assessment [V]

**How PesaPilot is built today**
- **One file**, `index.html` (about 257 KB, or 62 KB compressed), plus a self-hosted font (`fonts/`). There is no build step (DEC-002).
- **All financial records live in the phone's browser storage** (`localStorage`). There is no server, no account and no upload.
- **Netlify publishes the GitHub branch `main`** to https://pesa-pilot.netlify.app. Each pull request gets a separate preview address.

**Is it partly prepared for installation?** A little:

| Already there | Missing for a real installable app |
|---|---|
| Mobile viewport and "web-app capable" tags | **Manifest:** the file that tells Android the app's name, icon and colours |
| An "Install app" button in Settings, and code that listens for the browser's install offer | **Service worker:** the small background script that lets the app open without internet. Without it, Android never makes the install offer, so the button always says "not available" (D9). |
| A self-hosted font (no outside requests) | **App icons** (none exist) |
| An in-app splash screen | **`netlify.toml`:** caching rules, security headers, and which files are published |
| Works fully on the phone once loaded | **Correct colours:** the page still declares the old navy `#0F172A` as its theme colour, not forest green |

**Files Netlify would publish if PR #1 were merged today:**
- `main` currently contains **only `index.html`**.
- PR #1 adds 62 documents (`docs/`), 11 test files, `CLAUDE.md` and `package.json`. **All of them would become reachable on the live address.**
- This is already a pre-merge item in RELEASE_1_CHECKLIST §5. It is now proposed as **DB-7**, and must be settled **before** Release 1 is deployed.

**The GitHub repository is public [V].** Every document, decision pack and prototype can already be read on GitHub by anyone. Excluding files from Netlify doesn't change that. I found no personal data in the repository files. The only phone numbers are clearly labelled fake examples in the historical M-Pesa research document. Commit history shows the account names used on GitHub. See DB-7.

---

## 2. Target PWA architecture (within DB-6)

### 2.1 The pieces and how they work together

```
pesa-pilot.netlify.app/
├── index.html            the app (its screens and logic)
├── manifest.webmanifest  name, short name, icons, colours, "open full-screen", start page
├── sw.js                 service worker: keeps a copy of the app files for offline opening
├── icons/                PNG icons (192, 512, 512 maskable, 180 for iPhone, favicons)
└── fonts/                Inter
netlify.toml (in the repository, not published): which folder to publish, caching rules, security headers
```

**The pieces in plain words:**
- **The manifest** is the app's "ID card": name, icon and colours. Chrome reads it to offer **Install** and to draw the icon and splash screen.
- **The service worker** is a doorman that keeps a spare copy of the app's *files* (not your records) on the phone:
  - online, it fetches the newest version;
  - offline, or on a very slow network, it opens the spare copy.
- **`netlify.toml`** tells Netlify:
  1. publish **only** the app folder (DB-7);
  2. never let browsers hold old copies of `sw.js` or `index.html`;
  3. send security headers.
- **Icons** appear on the home screen, in the app switcher and on the splash screen.

The manifest file name: DB-6 used `manifest.webmanifest`; `manifest.json` works equally well. This is a naming detail, not a design change.

### 2.2 How offline operation works
1. **First visit, online:** the app loads and the service worker saves copies of the app files.
2. **Later, with no internet:** tapping the PesaPilot icon opens the saved copy.
3. **Everything works offline:** all calculations run on the phone, so recording income and expenses and viewing accounts, savings, bills and plans all work.
4. **Nothing in PesaPilot needs the internet** except fetching updates. Today's app makes no outside requests.

### 2.3 How financial data stays available offline, and private
- **Your records never leave the phone.** They stay in the browser storage they're in today.
- **The service worker can't reach that storage at all**, and it is designed to touch **only** app files [V: tested, DB-6 §2a].
- **Offline doesn't add a copy anywhere:** it's the same records, on the same phone, readable without a connection.
- **"Persistent storage" request (DB-6 6.6):** asks Android not to clear PesaPilot's data when space runs low. It is not guaranteed, and **it is not a backup**.

### 2.4 How updates are delivered safely (DB-6 6.2–6.4)
- **Online:** always fetch the latest app. If there's no answer within 3 seconds, use the saved copy.
- **New version found while the app is open:** a banner says "A new version is ready. **Reload**".
  - It never switches during a form, so nothing unsaved is lost.
  - All open windows reload together. That includes the **installed app and a browser tab open at the same time**, which share the same records.
- **Updates are all-or-nothing:** a failed download leaves the working version in place [V: tested in the proof].

### 2.5 How old versions are prevented from damaging newer data
- **D13 guard first** (DEC-025, release C0): an older copy that finds newer data refuses to save, and asks you to reload.
- **Every later version keeps that guard,** so a phone that stays offline through an update can't damage data.
- **Release 1 has no guard.** For the windows where it could still run (an old tab, a rollback), the safeguards are R4, the rollback floor, `cancelledAt` and `plannedLedger`. They are already designed.

### 2.6 How emergency rollback works (DB-6 6.4, 6.8)
1. **Emergency switch:** a replacement `sw.js` that deletes its saved copies and stops itself. Each phone picks it up the next time it opens PesaPilot online, then goes back to normal web loading.
2. **Rollback build:** Netlify serves a previous safe version, **never one that can't read the current data** (the rollback floor; e.g. after schema 11, never Release 1).
3. **Both are deployed together,** and they are practised on real phones before the PWA release.

**DB-6 changes:** none of its 9 decisions needs redesigning. Two additions come from this review, and both are proposed in DB-7:
- security headers, including a strict **content security policy**;
- the publish-folder rule.

---

## 3. Identity and icon
**Proposed in a separate brief:** `../specs/DB-8_IDENTITY_BRIEF.md`.

**In short:**
- name and short name **PesaPilot**;
- theme colour **forest green `#183B35`**, background **warm off-white `#FAF9F6`**;
- icon concept: a **"heading" mark**, a simple P whose curve becomes a path ending in an ochre point ("where your money is heading"). It avoids banking clichés (columns, coins, wallets);
- the full standard icon set, maskable for Android, and screenshots for Chrome's richer install screen.

---

## 4. Security and public-file exposure
**Proposed in a separate brief:** `../specs/DB-7_PUBLIC_DEPLOYMENT_BRIEF.md`.

**In short:**
- publish only an explicit **app folder** (an allowlist, not a blocklist);
- decide whether the repository should be private;
- add security headers;
- **no access control is needed for ordinary users**: there is nothing on the server to protect. Your PIN locks the app on the phone;
- **no admin tools in the public app** (there are none today);
- **hiding a URL is not security**, and nothing in the plan relies on it.

---

## 5. Android installation and offline testing plan
Run on real phones before the PWA release is offered for approval (DB-6 release requirements, RELEASE_1_CHECKLIST §9).

**Phones:**
- at least one **low-end** (2 GB RAM, Android Go class, e.g. Tecno or Itel);
- one **mid-range** (e.g. Samsung A-series or Infinix);
- browsers: **Chrome**, plus the phone's own browser (e.g. Samsung Internet). Opera Mini's data-saving mode doesn't support offline apps; the install guide will say so [E].

| # | Test | Pass when |
|---|---|---|
| 1 | Install from the browser's offer, the ⋮ menu and Settings → Install app | Icon and name on the home screen; the icon isn't cropped |
| 2 | Open from the icon | Full-screen (no address bar), forest-green status bar, splash with icon on off-white, no double splash |
| 3 | Airplane mode, cold start | Opens; all screens work |
| 4 | Record income, an expense and a transfer offline; close; reopen offline | Saved and correct |
| 5 | Back online, a new version published | Reload banner; never during a form; all windows reload together |
| 6 | Data switched off **during** an update download | The old version keeps working; the update completes next time |
| 7 | Installed app + Chrome tab open at the same time | No lost entries; both show the same data |
| 8 | Emergency switch | After reconnecting: no saved copies, no worker; records intact |
| 9 | Rollback build + switch | The rolled-back version opens; records intact; never below the rollback floor |
| 10 | Persistent storage | The request is shown with honest wording |
| 11 | **Uninstall the app** | **Must be tested:** whether Android keeps or clears the records varies [E]. The install guide will tell users to **back up before uninstalling**. |
| 12 | Chrome → "Clear browsing data" | **Wipes records** [E]. Backup education covers this. |
| 13 | Slow network (simulated 2G) | Opens within about 3 s from the saved copy |
| 14 | Storage full | Clear message; no partial saves |

---

## 6. Bringing people on board: launch phases
To avoid confusion with the existing build stages (A–G in ROADMAP), these are named **L1–L4**. They correspond to your Stages A–D.

### L1 · App readiness (your Stage A)
**Needs:**
- Release 1 deployed (your approval);
- DB-7 applied (before or with Release 1);
- D13 released;
- PWA built and phone-tested (DB-6);
- identity assets (DB-8);
- onboarding B (Stage A build) recommended.

**Materials:**
- **Install guide** (one page, pictures): Chrome → Install; what the icon looks like; iPhone instructions (Share → Add to Home Screen).
- **Privacy explanation** (plain words): "Your records stay on this phone. PesaPilot has no server and can't see your money. Nobody can recover your records except from your own backup."
- **Backup education:**
  - why it matters ("lost phone = lost records, unless you have a backup");
  - how to save a backup to Google Drive or WhatsApp-to-yourself;
  - warnings about "Clear browsing data" and uninstalling.
- **Support channel [O]:** e.g. a WhatsApp Business number or an email address, plus who answers it and a response time.
- **Feedback route:** a short form or WhatsApp message. **Never** asks for financial details or screenshots of balances.
- **Version and release notes:** the version is visible in Settings, with "What's new" in plain words.

### L2 · Small controlled tester group (your Stage B): 5–10 trusted people
- **People you know:** varied phones, varied income patterns.
- **A one-page tester note [O]:**
  - what PesaPilot is;
  - their data stays on their phone;
  - back up weekly;
  - how to send feedback;
  - they can stop any time.
- **They use their own real data on their own phones.** Nothing is collected except what they choose to tell us.
- **Duration:** 2–3 weeks.
- **Goals:** installation success, offline use, update experience, confusing screens.

### L3 · Customer validation research (your Stage C): the 24-person study
- Uses the P4 pack, **after your approval** of the complete pack (data notice, consent, budget, interviewer), including the approved first-run test (DEC-026).
- **Uses a fixed app version** during the 7-day trial (P4 `05`), so the app doesn't change mid-study.
- **No recruiting or data collection until you approve.**

### L4 · Wider public access (your Stage D)
**Before opening up:**
- DB-4 (protected backups) **recommended first**, because plain backup files are the main privacy weak point once strangers use the app;
- the privacy notice published;
- support capacity confirmed;
- a custom domain considered (e.g. a `.co.ke` address; a cost decision [O]).

**Measurement:** voluntary feedback only. **No analytics or tracking without a separate decision.**

---

## 7. Implementation sequence and complexity
Each step needs **your separate authorisation**.

**Complexity:**
- **S:** about 1 working session;
- **M:** 2–4 sessions;
- **L:** 5 or more sessions, including real-phone testing rounds.

| # | Step | Needs first | Complexity | Notes |
|---|---|---|---|---|
| 0 | **You finish the Release 1 preview review** (T1–T19) | — | — | Your results decide the next step |
| 1 | **DB-7 public deployment boundary** (publish folder + `netlify.toml` + headers; repository visibility) | DB-7 approval | **S–M** | **Must land before Release 1 is merged**, or internal files go live with it. Moves app files into a folder and updates test paths; no change to the app's behaviour. |
| 2 | **Release 1 deployment** | Steps 0–1 + "Deploy Release 1" | S (plus the checklist) | RELEASE_1_CHECKLIST §5–§8 |
| 3 | **D13 release** (C0) | Step 2 stable + go-ahead | **S** | DEC-025 option B |
| 4 | **Identity assets** (icon rounds, colours, screenshots) | DB-8 approval | **S–M** | Design work; can run alongside steps 2–3; you approve the final icon |
| 5 | **PWA** (DB-6: manifest, icons, `sw.js`, update banner, window coordination, emergency switch, storage request, headers) | Steps 3 + 4 + authorisation | **L** | Includes real-Android testing (§5) |
| 6 | **Onboarding B** (Stage A build) | Your authorisation; PIN detail settled | **M** | Ideally after the first-run test (DEC-026) |
| 7 | **L2 tester group** | Steps 5–6; tester note approved | — | |
| 8 | **DB-4 protected backups** (Stage G) | Authorisation | **L** | Phone tests + crypto review |
| 9 | **DB-5 + D14** (Stage B, schema 11) | Authorisation | **L** | Production data migration (DEC-017); cancellation retest on real code |
| 10 | **L3 research → L4 public** | P4 approval; steps above | — | |

**Order note:**
- Steps 8 and 9 can swap. I suggest DB-4 before public access (privacy).
- DB-5 can follow research findings.

---

## 8. New decision briefs
1. **DB-7: public deployment boundary and repository visibility** (`../specs/DB-7_PUBLIC_DEPLOYMENT_BRIEF.md`). **Needed before Release 1 is merged.**
2. **DB-8: PesaPilot identity and icon** (`../specs/DB-8_IDENTITY_BRIEF.md`).
3. **Later, not yet written: DB-9, the beta programme and user support.** It covers the tester note, support channel, feedback route and privacy-notice wording. It is best written once DB-7 and DB-8 are decided, before L2.

---

## 9. Recommendation: what to build first, and why
**First: DB-7, the public deployment boundary.** Reasons:
1. **It protects Release 1.** Merging PR #1 today would publish 62 internal documents, the tests and `CLAUDE.md` on the live address. The live site currently serves only `index.html`. It must be fixed **before** deployment, and it is already a checklist item.
2. **The PWA depends on it.** `netlify.toml` and the app folder are exactly where the manifest, service worker, icons and caching rules will live.
3. **It's small and safe:** no change to how the app behaves or to anyone's data, and fully reversible.
4. **It forces the repository-visibility decision early,** before more people look at PesaPilot.

**In parallel (design only):** DB-8 icon rounds, so assets are ready when the PWA is authorised.

**Then:** Release 1 deployment (your call) → D13 → the PWA.

I'll wait for your review before implementing anything.
