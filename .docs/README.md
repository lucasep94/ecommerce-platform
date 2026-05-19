# Handoff: Storely Home Page

## Overview
Storely is a modern e-commerce marketplace. This bundle contains the high-fidelity design for the **home page** — the primary landing surface a returning logged-in shopper sees. The design positions Storely as a premium, editorial marketplace: warm neutrals, generous whitespace, a single saturated accent (`#FCAF18`), and clean product cards with no heavy borders or shadows.

## About the Design Files
The file `Storely Home.html` in this folder is a **design reference**, not production code. It is a self-contained HTML prototype showing the intended look, layout, hover states, and basic interactions (wishlist hearts, cart counter, hero carousel dots, pill tabs, mini-category tabs, newsletter submit).

Your job is to **recreate this layout inside the target app's existing codebase** — using its component library, design tokens, routing, and data layer. Do not lift the HTML or CSS verbatim. Re-implement components idiomatically (React/Vue/Svelte/etc.) and wire them up to real product/user data. If the project has no front-end stack yet, choose one appropriate for an e-commerce front-end (Next.js + TypeScript + Tailwind is a sensible default) and implement there.

The product imagery in the prototype is rendered as CSS-shape placeholders (`.shoe`, `.tv`, `.headphone`, etc.). **These are stand-ins.** In production, all product imagery must come from real product photography — never ship the CSS shapes. The hero banner and newsletter sections use striped SVG placeholders with monospace explainer labels for the same reason.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, hover states, and copy are locked. Implement pixel-perfect using the tokens listed in the **Design Tokens** section.

---

## Page Structure (top to bottom)

The page is a single scrollable column, min-width 1280px, content centered in a `max-width: 1360px` container with `40px` horizontal padding (the prototype calls this `.wrap`).

1. **Utility bar** — slim 36px bar, 12px text, muted gray, bottom border
2. **Main navbar** — 80px tall, logo + full-width search + account/wishlist/cart icon buttons
3. **Category pills** — horizontal scrollable row of 36px pill tabs, with active state in the accent color
4. **Hero banner** — large warm-cream card (`#F3E0D2`), headline left, product image right, carousel dots
5. **Quick access strip** — warm-cream card with avatar greeting + 4 shortcut tiles + arrow button
6. **Shop by category** — section header + 4-column grid of bordless category cards
7. **Deals & promotions** — 2-column split of large promo cards
8. **Trust banner** — full-width warm-cream card, headline left, product image right, outlined CTA
9. **Last viewed** — section header + horizontally scrollable row of product cards
10. **Top sellers** — section header + 5-column grid of product cards
11. **Comfy styles / promo split** — secondary 2-column promo split
12. **This must be for you** — personalized recommendations, 5-column product card grid
13. **Mini category row** — horizontal scrollable category chip row with arrows
14. **Newsletter** — bold headline, single email input + Subscribe button, illustration right
15. **Footer** — 4 (actually 5) column link groups, brand block, payment chips, copyright

---

## Design Tokens

### Colors
| Token | Value | Use |
|---|---|---|
| `--bg` | `#FCFCFD` | Page background |
| `--bg-warm` | `#F3E0D2` | Section highlights (hero, quick access, trust, deals) |
| `--border` | `#E5E5E5` | Borders, dividers, card hover border |
| `--text` | `#4C4B4D` | Body text |
| `--heading` | `#000000` | Headings, prices, dark CTAs |
| `--accent` | `#FCAF18` | Primary CTAs, badges, active pill state, brand dot |
| `--muted` | `#8a8a8d` | Small/utility text, struck-through prices, captions |

**Accent usage rule:** `#FCAF18` is reserved for primary actions, sale badges, active states, and the brand-dot. Do not use it for general links, body text, or decorative backgrounds.

### Typography
- **Headings (h1–h5) and brand:** `Montserrat`, weights 500 / 600 / 700, `letter-spacing: -0.01em`. Loaded from Google Fonts.
- **Body, UI, prices, buttons:** `Lato`, weights 400 / 700. Loaded from Google Fonts.
- Base body size **14px**, line-height **1.5**.
- Hero `h1`: ~56px, weight 700, tight leading (~1.05). Hero has an italicized `<em>` for emphasis.
- Section `h2`: ~32px, weight 700.
- Section eyebrow: 11–12px uppercase Lato, muted, `letter-spacing: 0.12em`, sits above the h2.

### Spacing & Layout
- Page container: `max-width: 1360px`, horizontal padding `40px`.
- Section vertical rhythm: each `<section class="block">` is separated by `margin-top: 80px`.
- Section header → content gap: `28px`.
- Card grid gaps: `24px`.
- Border radius scale: small 8–12px (buttons, chips), medium 16px (product cards), large 20–24px (hero / promo / trust cards), pill 999px (search bar, pill tabs).
- No drop shadows anywhere except a very subtle focus ring on search (`box-shadow: 0 0 0 4px rgba(252,175,24,.12)`).

### Component sizes
- Search bar: 48px tall, pill radius, white background, accent-colored Search button inside.
- Utility bar: 36px tall.
- Nav: 80px tall.
- Pill tabs: 36px tall, padding 0 16px.
- Buttons primary: 48px tall, 24px horizontal padding, accent bg, black text, Lato 700, ~14px.
- Buttons outline: 48px tall, transparent bg, 1.5px black border, black text; hover inverts to black bg / white text.
- Icon buttons (nav): 40px tall, transparent, with small badge counter top-right in accent.
- Avatar: 56px circle, black bg, accent text initials.

---

## Sections in detail

### 1. Utility bar
- Left group: `Deliver to [Country] ▾` (with pin icon), `English (EN) ▾`, `USD ▾`. Divided by 1px vertical dividers.
- Right group: `Track order`, `Customer service`, `Sell on Storely`, `Gift cards`.
- 12px text, muted color; on hover items go to `--heading`.

### 2. Main navbar
- Brand wordmark `storely` (Montserrat 700, 24px) with a small accent dot after it.
- Search bar (flex-1): left segment `All categories ▾`, then full-width text input, then accent Search button. Focus state: `border-color: var(--accent)` + accent-tinted focus ring.
- Right cluster: Account, Wishlist (with count badge), Cart (with count badge). Icon + label inline.
- Wishlist hover: heart fills accent and increments count.
- Cart click animates the icon (scale 1 → 1.08 → 1) and increments counter.

### 3. Category pills
- Horizontal scroll-x row, no scrollbar.
- Pills: 36px tall, 1px `--border` border, white background, Lato 400 14px. Active: accent background, black text, no border. First pill has a 2×2 grid icon (the "All categories" pill).
- Clicking a pill makes it active and clears others.

### 4. Hero
- Single full-width `.hero-card` (warm cream, 24px radius, ~520px tall). 2-column grid inside: copy left, product stage right.
- **Left:** eyebrow "Featured this week" with a small accent dot, then `h1` with italic emphasis word, then a 18px lede, then a CTA row (primary "Shop the edit →" + outline "Watch the story"), then a 3-up stats meta row (bold value over caption: `2M+ Curated products`, `120 Countries shipped`, `4.8★ Customer rating`).
- **Right:** 1:1 stage. Striped SVG placeholder labeled "HERO PRODUCT IMAGE / studio headphones, 1:1". Overlay: floating "50% OFF" round badge top-right (accent), and a small floating product card bottom-left with category / product name / 5-star row / price.
- 3 carousel indicator dots top-right of the card (first active).

### 5. Quick access strip
- Same warm-cream card style.
- Left: 56px black circular avatar with white initials → small "Welcome back" + bold "Hi, [Name] — your picks await 👋".
- Then 4 tiles separated by light dividers: each tile is icon + bold title + small subtitle. Two tiles have a small accent `‑30%` sale chip.
- Trailing 40px circular "next" button with chevron right.

### 6. Shop by category
- Section header: eyebrow "Discover", h2 "Shop by category", right-aligned "All departments →" link.
- 4-column grid of category cards. **No card container border** — just floating image on top, then a label below in Montserrat 600 16px, then a muted "N,NNN products" sub.
- Each `.ph` is a soft-tinted background tile (~280×280, 16px radius) with a placeholder product shape centered inside it.
- Category labels & background tints used: Beauty & Care, Computers, Electronics, Home & Kitchen.

### 7. Deals & promotions split
- 2-column grid, `gap: 24px`.
- Each `.deal-card` is a warm-cream tile, 20px radius, with: eyebrow → big h3 → muted body → underline-on-hover text CTA → product illustration tile bottom.

### 8. Trust banner
- Full-width warm-cream card, 24px radius. 2-col grid: copy left, large product stage right.
- Left: eyebrow "Discover Storely", h2 "We deliver beautifully, to your door.", body copy about shipping/returns, outline CTA "Learn how it works".
- Below copy: a 3-up feature row of small icons + bold + caption (e.g. shipping, returns, support).

### 9, 11. Product card grids (Last viewed, Top sellers, Recommendations)
- See **Product Card** section below.
- Last viewed: 5-col grid with horizontal scroll overflow (scrollbar styled to use `--border`).
- Top sellers, Recommendations: clean 5-col grid.

### 10. Promo split (Comfy styles)
- Two-column secondary promo row, similar styling to deals but with different copy.

### 12. Mini category row
- Horizontal chip row with prev/next arrow buttons on the ends.
- Each chip = small image + label. Active chip is accent-bordered.

### 13. Newsletter
- Warm-cream card, 24px radius, 2-col: copy left, illustration right.
- Form is a single row: pill-shaped input + accent Subscribe button.
- On submit: show confirmation message "✓ Welcome aboard — check your inbox to confirm."

### 14. Footer
- White bg, 1px top border.
- 5-column grid: brand block (logo + tagline + 4 social icons), then 4 link groups: **Get to know us**, **Make money with us**, **Let us help you**, **Payment & gifts**. Each group has an h5 (Montserrat 600 14px, uppercase letter-spacing) and a `<ul>` of links.
- Bottom row: legal links left (© 2026 Storely Inc., Conditions of use, Privacy notice, Interest-based ads), payment chips right (VISA, MC, AMEX, PAYPAL, APPLE).

---

## Product Card (used in last viewed, top sellers, recommendations)

A single reusable card component. Props:
- `brand` (string) — small label
- `name` (string) — product name, clamps to 2 lines
- `price` (number)
- `orig` (number, optional) — original price, struck through
- `save` (number, optional) — savings amount, accent chip
- `badge` (string, optional) — top-left badge (e.g. "Best seller"), accent background
- `rating` (1–5) — star row
- `reviews` (number)
- `ships` (boolean) — shows "Ships to United States" microcopy
- `image` — product photo URL (placeholder in prototype)

**Visual rules:**
- White background, 16px radius, NO border at rest.
- On hover: 1px `--border` border appears (subtle), wishlist heart fades in.
- Image area: square, top of card. No background container — product photo floats.
- Wishlist heart button: top-right, hover/active fills accent.
- Badge: top-left, accent background, black text, Lato 700, 11px, 6px radius.
- Brand label: muted Lato 12px, uppercase letter-spacing.
- Product name: Montserrat 500 14–15px, 2-line clamp, min-height reserves 2 lines so cards align.
- Star row: 5 small star SVGs (filled or outlined per rating), accent fill, followed by review count.
- Price row: bold black price, then optional struck-through original price in muted gray, then optional accent "Save $X" chip.

---

## Interactions & Behavior

| Interaction | Behavior |
|---|---|
| Click pill tab | Sets active; only one active at a time |
| Click mini category chip | Same |
| Click hero dot | Sets active hero slide indicator (carousel is not auto-cycling in the prototype) |
| Hover product card | 1px border fades in; wishlist heart visible |
| Click wishlist heart | Toggles active state; increments/decrements nav wishlist count |
| Click product card (not heart) | Increments cart count; nav cart icon scales 1 → 1.08 → 1 (animation 220ms) |
| Focus search input | Border becomes accent + 4px tinted focus ring |
| Submit newsletter | Show success feedback row, clear input |
| Hover button-outline | Inverts to black background / white text |
| Hover button-primary | Background goes to `#ffbe3a` |
| Click button-primary | Scale down to .98 momentarily |

In a real codebase: wishlist + cart counts must come from real state (Zustand / Redux / server). Pill tabs should filter the category navigation or route. The hero carousel should auto-cycle (e.g. 6s) in production.

---

## State Management

Minimum app state needed:
- `user` — `{ id, firstName, initials, country, currency, language }` (drives utility bar, greeting, avatar)
- `cart` — array of items; nav badge shows length
- `wishlist` — set of product IDs; nav badge shows size; product cards reflect membership in their heart state
- `activeCategory` — for the pill row
- `activeMiniCategory` — for the mini-cat row
- `heroSlideIndex` — 0..n-1
- `newsletterStatus` — `idle | success | error` for the form

Data fetching required:
- Personalized recommendations ("This must be for you, [Name]")
- Last viewed products (per-user, persisted)
- Top sellers (global, cached)
- Category list with product counts
- Hero slides (CMS-driven)
- Promo banner content (CMS-driven)

Form validation:
- Newsletter: HTML5 `type="email" required`. On real submit, validate, POST to subscription endpoint, show success / error feedback.

---

## Responsiveness
- The prototype is **fixed at 1280px minimum**; the viewport meta is `width=1280`.
- For production, design responsively down to mobile:
  - Below ~1024px: collapse 5-col grids to 2-col, hide labels on icon buttons, hamburger nav, vertical hero stack.
  - The dimensions and tokens in this doc are for the desktop reference.

---

## Assets
- **Fonts:** Montserrat (500/600/700) and Lato (400/700) via Google Fonts.
- **Icons:** Inline SVG strokes (1.7px stroke-width) drawn in the prototype — replace with the codebase's icon library (Lucide, Heroicons, Phosphor, etc.). Icons used: location pin, user, heart, cart, search, package, chevron-right, chevron-down, calendar, home, clock, star, social icons (Instagram, Twitter, Pinterest, YouTube).
- **Product photography:** Not included — the prototype uses CSS-rendered shape placeholders. Provide real product images from the catalog/CDN.
- **Hero & newsletter imagery:** Striped SVG placeholders in the prototype; replace with editorial lifestyle photography per the CMS.
- **No brand assets shipped** — the "storely" wordmark is just Montserrat 700 with a colored dot. If a real logomark is created, swap it in.

---

## Files in this handoff
- `README.md` — this document
- `Storely Home.html` — the design reference (open in a browser for the live prototype). All styles are inline in a single `<style>` block; product data and small interactions are in a single `<script>` block at the bottom.

---

## Implementation checklist for the developer
1. Set up the project (or pick the right place in the existing codebase) and import the Montserrat + Lato Google Fonts.
2. Define the design tokens (CSS variables, Tailwind theme, or design-system tokens) listed above.
3. Build the **Product Card** first — it appears 3× and is the most reused component.
4. Build shared chrome: utility bar, navbar, footer.
5. Build sections top-to-bottom, wiring each grid to its data source.
6. Replace all CSS-shape product placeholders and striped SVG placeholders with real imagery before shipping.
7. Add responsive breakpoints below 1280px.
8. Wire wishlist + cart state, newsletter submission, pill filtering, and hero carousel auto-cycling.
9. Test focus states, keyboard navigation, and screen reader labels on the icon buttons.
