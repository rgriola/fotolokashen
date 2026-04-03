# Styling Audit — April 2, 2026

A review of the current design system consistency across the web app.

---

## 1. Font Hierarchy

**Status: No defined hierarchy — ad hoc per component**

### Font Families

- 2 families in use: **Geist** (sans) and **Geist Mono**
- Loaded via `next/font/google`, referenced as CSS vars `--font-geist-sans` / `--font-geist-mono`
- `globals.css` assigns them to `--font-sans` / `--font-mono` but defines no heading or body rules

### Size/Weight Breakdown

| Class                 | Count | Issue                                                      |
| --------------------- | ----- | ---------------------------------------------------------- |
| `text-sm`             | 407   | Most common — used for body, labels, everything            |
| `text-xs`             | 221   | Secondary "small" text                                     |
| `font-semibold`       | 189   | Most common weight                                         |
| `font-medium`         | 178   | Almost equally common — no clear distinction from semibold |
| `font-bold`           | 57    | Titles                                                     |
| `text-base`           | 24    | Rarely used — 14px (`text-sm`) is the de facto body size   |
| `text-lg`             | 45    | Section headers, inconsistent                              |
| `text-2xl`–`text-6xl` | ~72   | Page titles, scattered usage                               |

### Problems

1. **No semantic base size** — `text-base` (16px) appears 24 times; `text-sm` (14px) does the heavy lifting everywhere, making the app feel dense
2. **Two weights almost equally common** — `font-semibold` (189) vs `font-medium` (178) with no clear rule for when to use each
3. **No defined type scale roles** — no named levels like "page title", "section header", "body", "caption"; every component picks sizes independently
4. **No base heading styles** — `h1`–`h6` and `p` tags get no styles from `globals.css`; Tailwind preflight resets them

### Recommended Scale (not implemented)

| Role              | Class                           |
| ----------------- | ------------------------------- |
| Page title        | `text-2xl font-bold`            |
| Section header    | `text-lg font-semibold`         |
| Body              | `text-base font-normal`         |
| Label / secondary | `text-sm font-medium`           |
| Caption / meta    | `text-xs text-muted-foreground` |

---

## 2. Color System

**Status: Semantic tokens exist but hardcoded colors dominate**

### Semantic Tokens (shadcn — correctly used)

| Token                                   | Uses | Purpose           |
| --------------------------------------- | ---- | ----------------- |
| `text-muted-foreground`                 | 428  | Secondary text    |
| `bg-muted`                              | 110  | Muted backgrounds |
| `text-primary` / `bg-primary`           | 89   | Primary brand     |
| `text-destructive` / `bg-destructive`   | 58   | Error/delete      |
| `bg-card`, `bg-background`, `bg-accent` | ~55  | Surface layers    |

Semantic tokens are used frequently and correctly — this is the healthy part.

### Hardcoded Color Families (outside location type badges)

| Family   | Uses | Problem                                                            |
| -------- | ---- | ------------------------------------------------------------------ |
| `gray`   | 236  | Duplicates `muted` / `foreground`; no single shade chosen          |
| `red`    | 200  | Duplicates `destructive`; 8+ different shades                      |
| `blue`   | 178  | 18 different shades (`blue-100` → `blue-950`); no consistent shade |
| `green`  | 160  | Success states; 15+ different shades with no rule                  |
| `amber`  | 103  | Warning states; 13+ different shades                               |
| `slate`  | 54   | Overlaps with `gray` and `muted`; both used as neutrals            |
| `purple` | 36   | Social/following features only — relatively contained              |
| `indigo` | 25   | Overlaps with `blue` for interactive/primary UI                    |
| `orange` | 15   | Sporadic                                                           |
| `yellow` | 17   | Sporadic                                                           |

### Core Problems

1. **No warning/success semantic token** — `green-600`, `green-700`, `green-950` used interchangeably for "success"
2. **Blue has no single shade** — links, buttons, info states all pull from different blue values
3. **`gray` + `slate` coexist** — both used as neutrals with no distinction
4. **`red` and `destructive` are redundant** — `text-red-500/600/800` alongside `text-destructive`
5. **`indigo` and `blue` overlap** — both used for interactive/primary UI seemingly interchangeably

---

## 3. Layout & Max Width

**Status: No global constraint — 5 different max-widths across content pages**

### Page-by-Page Max Width

| Page                          | Max Width          | px equivalent |
| ----------------------------- | ------------------ | ------------- |
| `/locations`                  | `max-w-7xl`        | 1280px        |
| `/profile`                    | `max-w-6xl`        | 1152px        |
| `/preview`                    | `max-w-6xl`        | 1152px        |
| `[username]` (public profile) | `max-w-4xl`        | 896px         |
| `/member-support`             | `max-w-4xl`        | 896px         |
| `/projects`                   | `max-w-4xl`        | 896px         |
| `/search`                     | `max-w-4xl`        | 896px         |
| `create-with-photo`           | `max-w-2xl`        | 672px         |
| `/map`                        | None (full screen) | — intentional |

### Problems

1. **No global page wrapper** — `layout.tsx` sets no max-width; every page decides independently
2. **5 different max-widths** in content pages: `2xl`, `4xl`, `6xl`, `7xl`, full
3. **`container` used 37×** without a configured max-width in Tailwind config — falls back to breakpoint-based defaults
4. **Spacing anomalies** (found separately): `pt-25`, `mt-6.25`, `m-6.938` are off the 4px Tailwind grid

---

## Summary of Issues to Address

| Priority | Area       | Issue                                                                              |
| -------- | ---------- | ---------------------------------------------------------------------------------- |
| High     | Colors     | Add `success` and `warning` semantic tokens to replace raw `green-*` and `amber-*` |
| High     | Colors     | Unify `gray` + `slate` into `muted`/`foreground` tokens                            |
| High     | Colors     | Consolidate `red-*` into `destructive` token                                       |
| High     | Colors     | Pick one blue shade for interactive UI, one for info states                        |
| Medium   | Typography | Define 5 named type scale roles in `globals.css` or a shared utility               |
| Medium   | Typography | Establish clear rule: `font-semibold` for headings, `font-medium` for labels       |
| Medium   | Layout     | Standardize content page max-width (suggest `max-w-5xl` or `max-w-6xl`)            |
| Low      | Layout     | Fix 3 off-grid spacing values: `pt-25`, `mt-6.25`, `m-6.938`                       |
| Low      | Colors     | Evaluate if `indigo` and `purple` should be unified or explicitly separated        |

---

## 4. Recommended Consolidation Plan

_Added April 2, 2026 — concrete changes to implement_

### Phase A: Add Semantic Color Tokens (globals.css)

Add 4 new semantic tokens to `:root` and `.dark`. This is the foundation — everything else replaces hardcoded values with these tokens.

**New tokens to add:**

| Token | Light Mode | Dark Mode | Replaces |
|---|---|---|---|
| `--success` | `oklch(0.55 0.2 145)` (~green-600) | `oklch(0.65 0.2 145)` (~green-500) | `green-500/600/700/800/900/950` |
| `--success-foreground` | `oklch(1 0 0)` (white) | `oklch(1 0 0)` (white) | `text-white` on green |
| `--warning` | `oklch(0.75 0.18 75)` (~amber-500) | `oklch(0.75 0.18 75)` (~amber-500) | `amber-500/600/700/800/900/950` |
| `--warning-foreground` | `oklch(0.25 0.05 60)` (dark amber) | `oklch(1 0 0)` (white) | text on amber |
| `--info` | `oklch(0.55 0.2 260)` (~blue-600) | `oklch(0.65 0.2 260)` (~blue-400) | `blue-400/500/600/700` for info states |
| `--info-foreground` | `oklch(1 0 0)` (white) | `oklch(1 0 0)` (white) | text on blue |
| `--social` | `oklch(0.55 0.25 300)` (~purple-600) | `oklch(0.65 0.25 300)` (~purple-500) | `purple-600/700` for social features |
| `--social-foreground` | `oklch(1 0 0)` (white) | `oklch(1 0 0)` (white) | text on purple |

Add the corresponding `@theme inline` mappings:

```css
--color-success: var(--success);
--color-success-foreground: var(--success-foreground);
--color-warning: var(--warning);
--color-warning-foreground: var(--warning-foreground);
--color-info: var(--info);
--color-info-foreground: var(--info-foreground);
--color-social: var(--social);
--color-social-foreground: var(--social-foreground);
```

### Phase B: Color Consolidation Map

Once the tokens exist, replace hardcoded classes across the codebase. **Each row = one find/replace pass.**

#### B1. Success (green) — ~160 instances

| Current (inconsistent) | Replace with |
|---|---|
| `bg-green-600`, `bg-green-700` | `bg-success` |
| `hover:bg-green-700` | `hover:bg-success/90` |
| `text-green-600`, `text-green-500` | `text-success` |
| `bg-green-50`, `bg-green-100` | `bg-success/10` |
| `border-green-200`, `border-green-800` | `border-success/20` |
| `text-green-800/900` (on light bg) | `text-success` (adjust opacity if needed) |
| `text-green-100/200/300` (dark mode) | `dark:text-success` |
| `bg-green-950` (dark mode surface) | `dark:bg-success/10` |

#### B2. Warning (amber) — ~103 instances

| Current | Replace with |
|---|---|
| `bg-amber-50`, `bg-amber-100` | `bg-warning/10` |
| `text-amber-600` | `text-warning` |
| `text-amber-700/800/900` | `text-warning` (adjust opacity) |
| `text-amber-500` (icon fills) | `text-warning` |
| `border-amber-200` | `border-warning/20` |
| `bg-amber-500` (password meter) | `bg-warning` |
| `bg-amber-950` (dark surface) | `dark:bg-warning/10` |

#### B3. Destructive/Error (red) — consolidate into existing `destructive` token

| Current | Replace with |
|---|---|
| `text-red-500` (validation errors, required *) | `text-destructive` |
| `bg-red-50` | `bg-destructive/10` |
| `border-red-200`, `border-red-500` | `border-destructive/20` or `border-destructive` |
| `bg-red-100` (error icon bg) | `bg-destructive/10` |
| `bg-red-600` (toast) | `bg-destructive` |
| `ring-red-500` | `ring-destructive` |

#### B4. Info (blue) — ~178 instances

| Current | Replace with |
|---|---|
| `bg-blue-600`, `bg-blue-700` (buttons) | `bg-info` |
| `hover:bg-blue-700` | `hover:bg-info/90` |
| `text-blue-600` (links, spinners) | `text-info` |
| `bg-blue-50` (info banners) | `bg-info/10` |
| `border-blue-200` | `border-info/20` |
| `text-blue-700/800/900` | `text-info` |
| `bg-blue-400/20` (decorative blobs) | `bg-info/20` |
| `bg-blue-950` (dark surface) | `dark:bg-info/10` |

#### B5. Social (purple) — ~36 instances, already scoped

| Current | Replace with |
|---|---|
| `bg-purple-600`, `hover:bg-purple-700` | `bg-social`, `hover:bg-social/90` |
| `text-purple-600/700` | `text-social` |
| `bg-purple-50` | `bg-social/10` |
| `border-purple-200` | `border-social/20` |

#### B6. Neutrals — eliminate slate/gray overlap

**Decision: Kill `slate`, keep `gray` only as a transition, push toward semantic tokens.**

| Current | Replace with |
|---|---|
| `bg-slate-900` (27×) | `bg-foreground` or `bg-gray-900` → eventually `bg-card` in dark |
| `border-slate-700` (25×) | `border-border` |
| `bg-slate-800` (2×) | `bg-muted` or `bg-card` |
| `text-gray-900` → `text-foreground` | Already have the token |
| `text-gray-600/500` → `text-muted-foreground` | Already have the token |
| `text-gray-400/700` | `text-muted-foreground` or `text-foreground` |
| `bg-gray-50/100/200` | `bg-muted` |
| `border-gray-200/300` | `border-border` |

#### B7. Indigo — merge into semantic tokens

**Indigo is used in two patterns:**

| Pattern | Files | Replace with |
|---|---|---|
| Auth page gradients (`from-indigo-900/80 via-purple-900/80`) | 6 auth pages | Keep as-is — this is a decorative brand gradient |
| Primary action buttons (`bg-indigo-600`, `hover:bg-indigo-700`) | loading spinners, onboarding, map controls | `bg-primary` or `bg-info` depending on context |
| `border-indigo-600`, `ring-indigo-500` | focus rings | `ring-ring` |

#### B8. Orange / Yellow — keep, but contained

| Color | Usage | Recommendation |
|---|---|---|
| `orange-*` (15×) | Home location marker, create-with-photo tips, landing page icon, offline badge | Keep — distinct semantic purpose (home/tips), small count |
| `yellow-*` (17×) | Star ratings, password strength meter | Keep — standard star/caution color, small count |

### Phase C: Typography Scale

Add to `globals.css` `@layer base`:

```css
@layer base {
  h1 { @apply text-2xl font-bold tracking-tight; }
  h2 { @apply text-xl font-semibold; }
  h3 { @apply text-lg font-semibold; }
  h4 { @apply text-base font-semibold; }
  p  { @apply text-sm; }
  small, .caption { @apply text-xs text-muted-foreground; }
}
```

**Weight rules:**
| Weight | When to use |
|---|---|
| `font-bold` | Page titles (`h1`) only |
| `font-semibold` | Section headers (`h2`, `h3`, `h4`) and emphasized labels |
| `font-medium` | Interactive elements (buttons, tabs, nav items) |
| `font-normal` | Body text, form inputs, descriptions |

**Note:** This is the most disruptive change. Because `text-sm` is used 407 times, the base body size is effectively 14px. Moving to `text-base` (16px) will change visual density across the entire app. Consider doing this **last** after colors are consolidated, and review page-by-page.

### Phase D: Layout Standardization

**Simplify to 3 max-width tiers:**

| Tier | Class | When |
|---|---|---|
| Full screen | No max-width | `/map` (immersive full-bleed) |
| Wide content | `max-w-6xl` (1152px) | Grid/list pages: `/locations`, `/profile`, `/search` |
| Narrow focus | `max-w-2xl` (672px) | Single-task: forms, `create-with-photo`, `member-support` |

**Changes needed:**

| Page | Current | Change to |
|---|---|---|
| `/locations` | `max-w-7xl` | `max-w-6xl` |
| `/profile` | `max-w-6xl` | Keep |
| `[username]` | `max-w-4xl` | `max-w-6xl` (matches profile) |
| `/projects` | `max-w-4xl` | `max-w-6xl` |
| `/search` | `max-w-4xl` | `max-w-6xl` |
| `/member-support` | `max-w-4xl` | `max-w-2xl` (it's a form) |
| `create-with-photo` | `max-w-2xl` | Keep |

**Fix 3 off-grid spacing anomalies:**

| Current | File (find via grep) | Replace with |
|---|---|---|
| `pt-25` (100px) | 1 file | `pt-24` (96px) |
| `mt-6.25` (25px) | 1 file | `mt-6` (24px) |
| `m-6.938` (~28px) | 1 file | `m-7` (28px) |

---

## 5. Execution Order

**Recommended sequence — lowest risk first:**

1. **Phase A** — Add tokens to `globals.css` (zero visual change, purely additive)
2. **Phase B6** — Neutrals: `slate` → `border`/`muted`/`foreground` (low risk, cleans noise)
3. **Phase B3** — Red → `destructive` (straightforward, token already exists)
4. **Phase D spacing** — Fix 3 off-grid values (trivial)
5. **Phase B1** — Green → `success` (clear semantic mapping)
6. **Phase B2** — Amber → `warning` (clear semantic mapping)
7. **Phase B4** — Blue → `info` / `primary` (largest, most roles — needs case-by-case review)
8. **Phase B5** — Purple → `social` (small, contained scope)
9. **Phase B7** — Indigo → `primary` / brand gradient (small scope, careful with auth pages)
10. **Phase D layout** — Max-width standardization (coordinate with visual review)
11. **Phase C** — Typography scale (most disruptive — do last, review page-by-page)

**Estimated scope:** ~1,024 hardcoded color instances to replace across ~60 files. Recommend doing one Phase B sub-step per PR to keep diffs reviewable.

---

## 6. 60-30-10 Color Framework

The [60-30-10 rule](https://en.wikipedia.org/wiki/Color_theory) is a design principle where 60% of visible color is the dominant/neutral surface, 30% is secondary (text, borders, interactive chrome), and 10% is accent (CTAs, status indicators, alerts).

### Current State — No 60-30-10

| Layer | Target | Token coverage | Hardcoded leakage | Actual % |
|---|---|---|---|---|
| **60% Dominant** (surfaces) | `bg-background`, `bg-card`, `bg-muted` | 157 instances | +95 (`bg-white`, `bg-gray-50/100`, `bg-slate-900`) | ~25% ← too low |
| **30% Secondary** (text/borders) | `text-muted-foreground`, `text-foreground`, `border-border` | 447 instances | +236 (`text-gray-*`, `border-gray-*`, `border-slate-*`) | ~57% ← too high |
| **10% Accent** (CTAs/status) | `bg-primary`, `text-destructive` | 131 instances | +476 (`green-*`, `blue-*`, `amber-*`, `purple-*`, `red-*`) | ~18% ← too high |

The secondary layer is inflated because `text-muted-foreground` (427×) carries all the weight. The accent layer is bloated at 18% because 476 hardcoded color classes bypass the token system.

### Target State After Consolidation

| Layer | Role | Allowed Tokens | Maps to |
|---|---|---|---|
| **60%** Dominant | Backgrounds, cards, page wrappers, surfaces | `bg-background`, `bg-card`, `bg-muted`, `bg-popover` | Neutral oklch grays from `:root` |
| **30%** Secondary | Body text, borders, muted labels, form inputs, interactive chrome | `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`, `bg-accent`, `bg-secondary` | Blue-gray oklch palette |
| **10%** Accent | Primary CTAs, success/warning/error/info/social states | `bg-primary`, `bg-destructive`, `bg-success`, `bg-warning`, `bg-info`, `bg-social` | 6 chromatic semantic tokens |

### Enforcement Rules

**60% — Dominant surfaces:**
- Any `bg-*` on a full-width container, card, sheet, or page wrapper **must** use `background`, `card`, `muted`, or `popover`
- **Banned:** `bg-white`, `bg-gray-50`, `bg-gray-100`, `bg-slate-900`, `bg-slate-800`
- These get replaced with `bg-background` (page), `bg-card` (elevated), or `bg-muted` (recessed)

**30% — Secondary chrome:**
- All text uses `text-foreground` (primary) or `text-muted-foreground` (secondary) — no `text-gray-*`
- All borders use `border-border` or `border-input` — no `border-gray-*`, `border-slate-*`
- Interactive hover states use `bg-accent` — no `bg-gray-100` hover overlays
- **Banned:** `text-gray-*`, `border-gray-*`, `text-slate-*`, `border-slate-*`

**10% — Accent colors:**
- Chromatic color **only** through 6 semantic tokens:
  - `primary` — main CTAs, active nav, brand emphasis
  - `destructive` — delete, errors, validation, required field markers
  - `success` — confirmations, check marks, positive status
  - `warning` — caution states, email verification, pending actions
  - `info` — informational banners, loading spinners, links, tips
  - `social` — follow actions, public/friends locations, social features
- **Banned:** raw `blue-*`, `green-*`, `amber-*`, `red-*`, `purple-*`, `indigo-*` (except allowed exceptions below)

### Allowed Exceptions (not subject to 60-30-10)

| Exception | Colors | Reason |
|---|---|---|
| Location type badges | `TYPE_COLOR_MAP` (15 hex values) | Domain-specific, applied via inline `style` not Tailwind classes |
| Star ratings | `yellow-400` | Universal star color convention |
| Auth page brand gradient | `from-indigo-900/80 via-purple-900/80` | Decorative background, not functional UI color |
| Orange home marker | `orange-500/600` | Distinct map marker, 6 instances only |
| Password strength meter | `yellow-500` | Standard strength indicator |

### How to Validate

After completing Phases A–B, re-run this audit:

```bash
# Should return 0 — no hardcoded neutrals
grep -rch --include='*.tsx' 'bg-white\|bg-gray-\|bg-slate-\|text-gray-\|text-slate-\|border-gray-\|border-slate-' src/ | awk '{s+=$1} END {print s}'

# Should return 0 — no hardcoded chromatic (excluding exceptions)
grep -rh --include='*.tsx' 'bg-green-\|bg-blue-\|bg-amber-\|bg-red-\|bg-purple-\|bg-indigo-\|text-red-\|text-green-\|text-blue-\|text-amber-' src/ | grep -v 'TYPE_COLOR\|yellow-400\|indigo-900.*purple-900\|orange-' | wc -l
```

Both commands returning 0 confirms full 60-30-10 compliance.
