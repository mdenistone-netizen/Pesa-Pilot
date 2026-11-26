# DB-8 Brief: PesaPilot identity and app icon

**Status:** **Proposed, for owner review (26 Nov 2026).** Design brief only. No icons, images or manifest have been created or installed.

## 1. What the identity must say
**Four qualities:**
- **Trust:** steady and calm, never flashy.
- **Control:** "I know where my money is heading".
- **Financial confidence:** clear, sure, positive.
- **Simplicity:** readable at a glance, even at 48 px on a cheap phone.

**Avoid generic banking:** no classical columns, coins, wallets, piggy banks, upward-arrow charts, gold-on-navy, or shield-and-lock clichés.

## 2. Name

| | Proposal | Notes |
|---|---|---|
| **App name** (`name`) | **PesaPilot** | Shown on the splash screen and install prompt |
| **Short name** (`short_name`) | **PesaPilot** | 9 characters; fits under a home-screen icon (about 12 maximum) |
| **Description** | "Know how much of your money is truly free, and make it last until your next income." | Used by Chrome's install screen; plain words (DEC-023 promise) |
| **Language** | English first; Kiswahili later, with the onboarding work | — |

## 3. Colours (from the approved palette, DEC-021)

| Role | Colour | Use |
|---|---|---|
| **Theme** (status bar, top of the app switcher) | **Forest green `#183B35`** | Replaces today's leftover navy `#0F172A` |
| **Background** (splash screen) | **Warm off-white `#FAF9F6`** | Calm, not stark white |
| **Icon background** | Forest green `#183B35` | Stands out on busy home screens |
| **Icon mark** | Off-white `#FAF9F6`, with **ochre `#D99A45`** as the single accent | Warmth; ochre is the "destination" |
| Text | Charcoal `#253238` | — |
| Soft surfaces | Sage `#E8F0E9` | — |
| Dark mode | Forest stays the theme; the splash background is fixed by Android from the manifest | One splash background is allowed |

## 4. Icon concept (recommendation)

**"The heading": a P drawn as a path.**
- The letter **P** in off-white, formed by one continuous **path**.
- The bowl of the P curves forward and ends in a small **ochre dot**: the next income, the destination.
- **The meaning:** "your money, steered to where it needs to go". It ties "Pilot" and the product promise ("make it to your next income") together without using money symbols.
- **Shape:** a forest-green square with Android's own rounding (maskable).
  - The mark sits inside the central **safe zone**: the middle 80% circle, so Android's circle, squircle or rounded-square masks never cut it.
  - Strokes thick enough to read at 48 px.

**Alternatives for the review rounds:**
1. **Compass P:** the bowl of the P forms a compass needle pointing ahead. Strong "pilot" meaning, but compasses are common in travel and finance apps.
2. **Two-tone "PP" monogram:** distinctive, but less meaningful.

**How the review would run:**
1. 2–3 concepts as simple drawings.
2. Each tested at real size on a phone home screen, among WhatsApp, M-Pesa and similar icons, in light and dark wallpapers.
3. You choose.
4. The final assets are produced.

No paid designer is needed for this; it is an owner choice if you want one.

## 5. Required assets (for the PWA stage)

| Asset | Size | Purpose |
|---|---|---|
| Icon, standard | **192 × 192** PNG | Home screen, app switcher |
| Icon, large | **512 × 512** PNG | Splash screen, install screen |
| Icon, **maskable** | **512 × 512** PNG (mark inside the safe zone) | Android's shaped icons, never cropped |
| Icon, monochrome (optional) | 512 × 512 | Android 13+ themed icons (support varies) |
| iPhone icon | 180 × 180 PNG | "Add to Home Screen" on iPhone |
| Favicon | SVG + 32 × 32 | Browser tab |
| **Screenshots** for Chrome's richer install screen | 3–4 phone screenshots (portrait, e.g. 1080 × 2340) of Home, Money, Plan and Savings, **with demo data only** | Shows what PesaPilot looks like before installing |

**Icon file names carry a version** (e.g. `icon-512-v1.png`), so caches update cleanly (DB-7 cache rules).

## 6. Splash screen and opening
- **Android builds the splash** from the manifest: the 512 icon centred on warm off-white, with the name below.
- **The app's own splash** is then shortened when launched from the icon, so users don't see **two splashes**.
- **Full-screen opening:** no address bar (`display: standalone`). The status bar is forest green.

## 7. Installation experience
- **The browser's own offer:** a bar or menu item "Install PesaPilot".
- **In the app (DB-6 6.7):**
  - **Settings → Install app**;
  - **one** dismissible Home tip after the first backup ("Add PesaPilot to your home screen").
- **iPhone:** a short instruction (Share → Add to Home Screen), since iPhones don't offer an install button.
- **Wording:** "Install PesaPilot: it opens like an app and works without internet. Your records stay on this phone."

## 8. Promotional presentation (for L1–L4, later)
- **A one-page install guide** with pictures (also suitable for WhatsApp).
- **The four screenshots above.**
- **A short line:** "Know what's truly free. Make it to your next income."
- **No claims of encryption or bank-level security beyond what's true** (DEC-019 wording rules). For example, "Your records stay on your phone".
- **A custom domain** (e.g. a `.co.ke` address) would strengthen the identity. It is a cost decision [O], not required now.

## 9. Choices for the owner

| # | Choice | Recommendation |
|---|---|---|
| 8.1 | Name and short name | **PesaPilot / PesaPilot** |
| 8.2 | Theme / background colours | **Forest `#183B35` / warm off-white `#FAF9F6`**; fix the leftover navy |
| 8.3 | Icon direction | **"The heading" P with an ochre destination dot**, plus 2 alternatives for the review rounds |
| 8.4 | Asset set | **§5 list**, versioned file names |
| 8.5 | Screenshots | **Demo data only**, 4 screens |
| 8.6 | Custom domain | **Later** (cost decision) |
