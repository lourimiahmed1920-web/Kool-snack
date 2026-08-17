# Kool Snack — Design System

This is the single source of truth for how every screen looks and feels —
customer and staff side alike. The customer app is built as a **native mobile
app** (Capacitor, see CLAUDE.md), and the rules below assume that: a phone
screen, a thumb, and no browser chrome to fall back on.

The system is applied across all screens as of the mobile-app rebuild. When
adding a screen, use what is defined here — never invent a one-off colour,
spacing value, or button style.

## Why this matters (read before implementing)

A "modern" app isn't about clever visuals — it's about **discipline**: the
same colors, spacing, and components used identically everywhere. Never
invent a one-off color, spacing value, or button style for a single screen.
If something needed isn't defined below, stop and ask rather than improvising.

## Color tokens

Define these as CSS variables (or Tailwind theme extensions) ONCE, use
everywhere by name — never hardcode a hex value in a component.

```css
--color-primary: #DC4B34;        /* CTA buttons, active states, price highlights */
--color-primary-hover: #B93D2A;
--color-success: #16A34A;        /* "100% Halal" badge, success states, valid stock */
--color-success-bg: #DCFCE7;
--color-warning: #F59E0B;        /* expiring-soon stock, pending states */
--color-warning-bg: #FEF3C7;
--color-danger: #DC2626;         /* expired stock, errors, cancel actions */
--color-danger-bg: #FEE2E2;

--color-ink-900: #18181B;        /* primary text */
--color-ink-600: #52525B;        /* secondary text */
--color-ink-400: #A1A1AA;        /* muted/placeholder text */
--color-line: #E4E4E7;           /* borders, dividers */
--color-surface: #FFFFFF;        /* cards */
--color-surface-alt: #FAFAFA;    /* page background */

/* One tint per category icon background — used ONLY as icon-fallback tiles */
--tint-pizza: #FEF2F0;   --tint-pizza-fg: #DC4B34;
--tint-burger: #FEF3C7;  --tint-burger-fg: #B45309;
--tint-drink: #E0F2FE;   --tint-drink-fg: #0369A1;
--tint-salad: #ECFDF5;   --tint-salad-fg: #047857;
```

Never use more than ONE primary accent color for buttons/CTAs across the
whole app. `--color-primary` is it — everywhere.

## Typography

- Font: Inter, **self-hosted** via `@fontsource-variable/inter` (imported in
  `src/main.tsx`). Not the Google Fonts CDN: a packaged app must not need a
  network round trip to render its own text on launch.
- Scale (use exactly these, nothing in between):
  - Display (hero titles): 32px / weight 700 / line-height 1.2
  - H1 (page titles): 24px / weight 600
  - H2 (section titles): 18px / weight 600
  - Body: 15px / weight 400 / line-height 1.6
  - Small (meta, captions, badges): 13px / weight 500
  - Micro (timestamps, fine print): 12px / weight 400
- Sentence case everywhere — never Title Case, never ALL CAPS (except tiny
  eyebrow labels like category tags, which may be uppercase + letter-spaced)

## Spacing scale

Use only these values for margin/padding/gap — no arbitrary numbers:
`4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px` (`--space-1` … `--space-16`).

## Where the CSS lives

Four files, in cascade order. Put a rule in the narrowest one that fits:

- `src/index.css` — tokens and primitives only (`.btn`, `.card`, `.field`,
  `.badge`, `.icon-tile`, the type scale). Nothing screen-specific.
- `src/styles/shell.css` — app chrome that persists across screens: app bar,
  tab bar, cart bar, action bar, bottom sheet, option rows, stepper, skeletons.
- `src/styles/screens.css` — customer screen layout (home, menu, cart, checkout,
  tracking, reservation, empty states).
- `src/App.css` — the staff back office only. It `@import`s the two files above.

## This is a mobile app, not a website

The customer side ships as a native app through Capacitor (`/staff/*` is the
back office and follows its own rules, below). That constrains the design:

- **Bottom tab bar is the primary navigation** — Start / Karte / Warenkorb /
  Reservieren, always visible on customer screens. There is no site header with
  nav links, and no footer. Which chrome each route gets is decided in one
  place, `resolveChrome()` in `src/App.tsx` — add routes there, don't let a page
  render its own header.
- **One app bar per screen**, sticky, 52px, centred title, back chevron on
  sub-screens. Screens do not render their own `<h1>` page title on top of it.
- **Modals are bottom sheets** (`src/components/BottomSheet.tsx`) — they slide up
  from the bottom edge, can be flicked down to dismiss, and close on the Android
  back gesture. Never a centred dialog box.
- **Menu items are full-width rows**, not a grid of photo cards: text left,
  96px thumbnail right, quick-add button overhanging the thumbnail. Two-column
  cards leave a dish name ~150px wide on a phone.
- **The primary action of a screen is a fixed bottom action bar**, not an inline
  button at the end of a scroll. Screens using one carry `.screen--with-action`.
- **Touch targets are at least 44px**; the standard control height is 48px.
  Inputs are 16px font minimum — smaller and iOS zooms the page on focus and the
  fixed-bar layout ends up scrolled sideways.
- **Every fixed element pads itself for the safe area** using the `--sat`/`--sar`/
  `--sab`/`--sal` tokens. Never call `env(safe-area-inset-*)` directly: those
  tokens also fold in the CSS variables Capacitor sets on older Android WebViews.
- **Feedback is tactile.** User-initiated actions call `haptic()` from
  `src/lib/native.ts` (no-op on web). Loading states are skeletons that match the
  final layout, not a centred "wird geladen…" line.

## Component patterns

**Cards**: white background, `1px solid var(--color-line)`, `border-radius: 12px`,
padding `16px`. No shadow by default — shadows are reserved for elements that
genuinely float above the page (bottom sheet, action bar, cart bar).

**Buttons**:
- Primary: `background: var(--color-primary)`, white text, `border-radius: 10px`,
  min-height 48px, `font-weight: 600`. Hover: `--color-primary-hover`.
  Active/pressed: `transform: scale(0.97)`.
- Secondary: white background, `1px solid var(--color-line)`, dark text
- Destructive (cancel, delete): `background: var(--color-danger-bg)`,
  `color: var(--color-danger)`, `1px solid transparent` so it matches the
  secondary button's box, border turning `--color-danger` on hover. Never solid
  red — solid red is `--color-primary`'s alone, and a destructive action must not
  out-shout the screen's actual CTA.
- Never more than ONE primary button visible at once per screen/section. In a
  list, that primary belongs to the section (the form submit, the "add" button);
  the per-row actions are secondary or destructive, never primary.
- The one exception is the kitchen display (`/kueche`): advancing an order is the
  only thing that screen exists to do and it is read across a kitchen, so its
  per-card advance button stays primary even though that means one solid CTA per
  open order. A screen may claim this exception only if it has a single purpose
  and no competing primary of its own.

**Badges/pills**: `border-radius: 999px`, padding `4px 12px`, `font-size: 13px`,
`font-weight: 500`, colored background from the tint tokens + matching dark
text (never white text on a pale badge)

**Category icon fallback** (when `image_url` is null): square/rounded tile,
`border-radius: 10px`, background from the matching `--tint-*` token, a single
centered lucide-react icon in the matching `-fg` color, sized ~32px

**Forms**: inputs 48px height, `border-radius: 8px`, `1px solid var(--color-line)`,
focus state: `border-color: var(--color-primary)` + subtle ring, no heavy glow.
Prefer a stepper over a number input for small integers, and a segmented control
over radio buttons for 2–4 mutually exclusive choices.

## Motion (subtle — this is what separates "modern" from "cheap")

- All hover/transition effects: `150ms ease`
- Button press: `transform: scale(0.97)` on `:active`
- Sheets slide in over `260ms cubic-bezier(0.32, 0.72, 0, 1)` — the one place a
  spring-ish curve is allowed
- Page/list content fade+slide in on load: `opacity 0→1, translateY(8px→0)`
  over `200ms`, staggered ~30-40ms per item for lists — tasteful, not bouncy
- Never animate more than opacity/transform (no animating width/height/color —
  causes jank)
- Everything must be disabled under `prefers-reduced-motion: reduce` (already
  handled globally in `index.css`)

## Layout rules

**Responsive, not mobile-only.** Mobile-first means the phone layout is the
*base*, not the only one. A screen that stays a phone-width column on a 1920px
monitor has failed this section just as badly as one that breaks at 375px.

- Design for 375–430px first, then let each breakpoint add columns
- Screen padding: 16px, stepping to 24px+ from `sm`, plus the horizontal
  safe-area insets
- **Max content width on desktop: 1200px** (`--content-max`), centred. Screens
  must expand *into* that width — more grid columns, side-by-side panels — not
  merely sit centred in it with whitespace either side
- The staff back office is exempt from the cap and uses the full window (below)
- Grid gaps: 12px on mobile, 16px on wider screens — never inconsistent between
  sections

### Breakpoints

Four, and only these four. A one-off breakpoint for a single component is how a
layout stops being predictable.

| Name | Min width | What changes                                          |
| ---- | --------- | ----------------------------------------------------- |
| `sm` | 600px     | padding 16→24px, highlight grid → 4 up                 |
| `md` | 768px     | dish list → 2 columns                                  |
| `lg` | 1024px    | **desktop switch** (below)                             |
| `xl` | 1280px    | dish list → 3 columns, category grid → 5               |

`lg` is the significant one: the bottom tab bar becomes a sticky top nav with
the brand, the app bar becomes a static left-aligned page heading, the fixed
cart/action bars return to normal flow, bottom sheets become centred dialogs,
and cart/checkout split into two columns with a sticky summary. Below `lg` the
app is the phone layout — which is what the native shell always is.

Two consequences to keep in mind when editing the shell:

- `TabBar` must stay **first** in `.app`'s DOM. It is `fixed` on mobile (so
  order doesn't matter) but `sticky` on desktop, and sticky cannot lift an
  element above its preceding siblings.
- Sticky in-page elements offset from `--sticky-top`, which resolves to the app
  bar on phones and the top nav on desktop. Don't hardcode either height.

## The staff back office is a different product

`/staff/*` and `/kueche` are dense, data-heavy screens used on a phone in a
kitchen as often as on a desk. They share the tokens and primitives but not the
customer layout: navy chrome instead of white, a sidebar above 820px and a
bottom tab bar below it (`StaffLayout` swaps markup, it does not reflow), and
their own `--staff-*` tokens. Do not "unify" them with the customer screens.

**The back office is desktop-primary and takes the full window.** `.staff-content`
has no `max-width` on purpose — KPI cards, stock lists, the team roster and
attendance all use `repeat(auto-fit, minmax(…, 1fr))` so they gain columns as
the monitor gets wider, instead of running down a narrow centred strip. The
1200px customer cap does **not** apply here. The exception is forms
(`.checkout-form`, the login card), which stay ~480px because a 1600px-wide text
input helps nobody.
