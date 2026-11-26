# PesaPilot Design System (DEC-021)

**Direction:** modern, calm, clean and welcoming, like a friendly banking app rather than accounting software.

All tokens live at the top of the `<style>` block in `index.html`. Components only use tokens, so changing a token changes the whole app consistently.

## 1. Colour

| Token | Light | Use |
|---|---|---|
| `--c-primary` | #183B35 deep forest | Primary buttons, brand mark, Home summary card, active navigation |
| `--c-sage` | #E8F0E9 soft sage | Supporting surfaces: callouts, chips, progress tracks, hover |
| `--c-bg` / `--c-card` | #FAF9F6 / #FFFFFF | Page / cards |
| `--c-text` / `--c-text-2` | #253238 / #56656A | Main / secondary text |
| `--c-success` (+ `-text`) | #27845B (#1F6E4B for small text) | Money in, on track, progress |
| `--c-danger` (+ `-text`) | #C65B55 (#A8443F for small text) | Money out, overdue, errors |
| `--c-amber` (+ `-text`) | #D99A45 (#8A5A17 for small text) | Attention: due soon, reminders, warnings |

**Rules**
- Green is for actions and positive status only, not decoration.
- Money in is green, money out is red, transfers are neutral grey, borrowed money is forest.
- Status badges always pair colour with words ("Overdue", "In 2 days"), so colour is never the only signal.
- Every text colour meets **WCAG AA** contrast in both themes. `tests/ui-audit.js` checks this automatically.
- **Dark mode** (an existing feature) has its own token set. The primary green is darkened so white text stays readable (≥4.5:1).

## 2. Typography
- **Inter** (variable, self-hosted in `fonts/`, 48 KB, SIL OFL licence). It falls back to the phone's system font.
- No external font service, so there are no third-party requests.

| Role | Size / weight |
|---|---|
| Page heading | 22px / 700 |
| Section / card heading | 17px / 600 |
| Body | 15px / 400 |
| Supporting text | 12–13px |
| Main figures | 26–30px / 700, tabular numbers |

- No all-capital headings and no letter-spaced labels.
- Amounts use tabular figures and never wrap.

## 3. Spacing, shape, touch
- **Spacing scale:** 4 / 8 / 12 / 16 / 20 / 24 / 32 px.
- **Corner radius:** 10 (small controls), 12 (inputs, buttons), 16 (cards), 20 (dialogs).
- **Touch:** buttons are ≥44px high (≥38px for small secondary buttons), and form fields are 46px. The audit enforces minimums at every width.
- Cards use a light border and a soft shadow, with no heavy outlines.

## 4. Components
| Component | Notes |
|---|---|
| Buttons | `primary` (forest), default (outline), `danger` (soft red), `small`, `btn-link` |
| Cards | `.card`, `.card.soft` (sage), `.card.flat`, `.hero` (forest summary) |
| Figures | `data-figure="…"` markers on key money figures; tests read these, not wording |
| Lists | `.list-row` with a round icon, two-line text and the amount right-aligned. `.tx-row` wraps actions under the row on phones. |
| Account card | Icon, name and type. **Balance** (large), **Set aside**, **Available**. |
| Summary figures | Cards on desktop; compact label-and-amount rows on phones |
| Forms | Bottom-sheet dialogs on phones, centred dialogs on desktop. Labels above the fields. |
| Navigation | Desktop: icon tabs. Phone: bottom bar with Home, Money, Plan, Savings and More (Bills, Debts, Reports, Settings). |
| Icons | Inline SVG line icons, no external files |

## 5. Screen structure
- Every screen starts with a plain title ("Money", "Plan", "Savings", …) and one sentence saying what it is for, then the main action.
- **Home:** spending-account summary, safe to spend today, quick actions (Expense, Income, Transfer, Save), this month, coming up, savings, accounts, recent activity.
- **Money:** accounts first, then transactions. Search and filters are tucked away; the latest 30 transactions show, with "Show more" for older ones.
- **Plan:** safe to spend in everyday words, with every line of the calculation visible. Expected income is shown separately.

## 6. Guardrails
- A redesign must not change the financial engine. `tests/engine-fingerprint.js` hashes 106 engine functions and constants, and must report "unchanged".
- Re-run `tests/ui-audit.js` after visual changes. It checks for sideways scrolling, touch targets and contrast at 320/360/390/1280 px, in light and dark mode.
