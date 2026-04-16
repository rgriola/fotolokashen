# ScrollWheelPicker — Design & Implementation Guide

> How the custom scroll-wheel picker component was built, the problems solved along the way, and a ready-to-use prompt to recreate it.

---

## What It Is

A mobile-friendly scroll-wheel selector that mimics native iOS picker behavior in the browser. Used for the Date of Birth picker on the registration form (Month / Day / Year), but designed as a generic, reusable component.

**Location**: `src/components/ui/ScrollWheelPicker.tsx`

---

## Architecture

```
┌────────────────────────┐
│   Trigger Button       │  ← Click to open/close
│   "March"         ▾    │
├────────────────────────┤
│   ░░░ fade gradient ░░░│  ← Top fade overlay
│                        │
│      January           │  ← Scrollable item (muted)
│   ┌──────────────────┐ │
│   │   February       │ │  ← Highlight band (bold, accent bg)
│   └──────────────────┘ │
│      March             │  ← Scrollable item (muted)
│                        │
│   ░░░ fade gradient ░░░│  ← Bottom fade overlay
└────────────────────────┘
```

### Key Visual Elements

| Element | Implementation |
|---------|---------------|
| **Trigger button** | Styled like a form input with chevron icon |
| **Highlight band** | `absolute` positioned div at the center row with `bg-accent/60` and border |
| **Fade gradients** | `pointer-events-none` overlays with `bg-gradient-to-b/t from-popover` |
| **Scrollbar** | Hidden via `scrollbar-hide` utility class |
| **Positioning** | Dropdown overlays trigger — highlight band aligns on top of trigger button |

---

## Technical Decisions & Bugs Fixed

### 1. The Scroll-Snap Feedback Loop (Critical Bug)

**Problem**: The first version used CSS `scroll-snap-type: y mandatory` combined with an `onScroll` handler that called `onChange` on every frame. This caused:

1. User scrolls → `onScroll` fires → `onChange` called → React re-renders
2. Re-render updates `value` prop → `useEffect` tries to sync scroll position
3. `scrollTo` fires another `onScroll` event → loop repeats
4. **Result**: Picker "jumps" between two values and gets stuck

**Fix**: Three-part solution:
- **Debounced scroll-end detection** (120ms timeout) — `onChange` only fires after scrolling completely stops
- **`isUserScrolling` ref** — blocks external value-driven scroll updates during active scroll
- **`committedValue` ref** — prevents redundant `onChange` calls when value hasn't actually changed
- **Removed CSS `scroll-snap`** entirely — manual snap-to-center via `scrollTo({ behavior: 'smooth' })` after debounce settles

### 2. Dropdown Misalignment

**Problem**: Using `position: absolute` + `margin-top: 0.25rem` placed the dropdown below the trigger with a visible gap. The large `paddingTop` (for centering the first item) created blank space at the top of the dropdown.

**Fix**: Negative top offset positions the dropdown so the center highlight band sits directly on the trigger button:
```tsx
top: -(halfVisible * ITEM_HEIGHT)
```

### 3. Scrollbar Visibility

**Problem**: Native scrollbar appeared on the right side of the wheel, breaking the clean look.

**Fix**: Used existing `scrollbar-hide` utility class from `globals.css` which covers all browsers:
```css
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.scrollbar-hide::-webkit-scrollbar { display: none; }
```

---

## Props API

```typescript
interface ScrollWheelPickerProps {
  items: { value: string; label: string }[];  // List of options
  value: string;                               // Currently selected value
  onChange: (value: string) => void;           // Called when selection changes
  placeholder?: string;                        // Trigger text when no value (default: "Select")
  disabled?: boolean;                          // Disable interaction
  hasError?: boolean;                          // Red border for validation errors
  visibleCount?: number;                       // Visible items (odd number, default: 5)
}
```

---

## Usage Example

```tsx
import { ScrollWheelPicker } from '@/components/ui/ScrollWheelPicker';

const months = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  // ...
];

<ScrollWheelPicker
  items={months}
  value={selectedMonth}
  onChange={setSelectedMonth}
  placeholder="Month"
  visibleCount={5}
/>
```

---

## Dependencies

- **React** (useState, useRef, useEffect, useCallback)
- **`cn()` utility** from `@/lib/utils` (Tailwind class merging via clsx + tailwind-merge)
- **`scrollbar-hide`** CSS utility class in `globals.css`
- **No external libraries** — pure React + CSS

---

## CSS Requirements

Add this to your global CSS if not already present:

```css
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

---

## Prompt to Recreate

Use this prompt to recreate the component from scratch in any React + Tailwind project:

---

> **Prompt:**
>
> Create a React scroll-wheel picker component called `ScrollWheelPicker` for use in forms (e.g., Date of Birth). Requirements:
>
> **Behavior:**
> - A trigger button that looks like a form input with a chevron icon
> - Clicking the trigger opens a dropdown overlay with a scrollable list of items
> - The dropdown positions so its center highlight band sits directly on top of the trigger button (negative top offset)
> - Items scroll vertically — the item at the center of the visible area is the "selected" one
> - A highlight band (accent background + border) marks the center selection zone
> - Top and bottom fade gradients create depth
> - Scrollbar is hidden but scrolling still works
> - Click outside to close
> - Click on any item to select it and scroll to it
> - Selected/highlighted item text is bold, other items are muted
>
> **Critical technical requirements (to avoid scroll bugs):**
> - Do NOT use CSS `scroll-snap` — it fights with JavaScript scroll handlers and causes a feedback loop
> - Use a **debounced scroll-end handler** (120ms timeout) — only commit the value AFTER scrolling stops completely
> - Use a **ref (`isUserScrolling`)** to track active scrolling — block external value prop changes from triggering scroll updates during active scroll
> - Use a **ref (`committedValue`)** to track the last committed value — prevent redundant `onChange` calls
> - On scroll-end: calculate the centered index from `scrollTop / ITEM_HEIGHT`, snap to it via `scrollTo({ behavior: 'smooth' })`, then fire `onChange` if the value changed
> - Pad the scroll container with `paddingTop` and `paddingBottom` = `halfVisible * ITEM_HEIGHT` so the first and last items can reach the center
>
> **Props:**
> - `items: { value: string; label: string }[]`
> - `value: string`
> - `onChange: (value: string) => void`
> - `placeholder?: string` (default: "Select")
> - `disabled?: boolean`
> - `hasError?: boolean` (red border for validation errors)
> - `visibleCount?: number` (default: 5, should be odd)
>
> **Styling:** Use Tailwind CSS. Item height = 36px. Use a `cn()` utility for conditional classes. Hide scrollbar with `scrollbar-width: none` + `::-webkit-scrollbar { display: none }`. Use `WebkitOverflowScrolling: 'touch'` for iOS momentum scrolling.

---

## Iteration History

| Version | Change | Problem Solved |
|---------|--------|---------------|
| v1 | Initial with `scroll-snap` + `onScroll` | Basic functionality |
| v2 | Debounced scroll-end, removed scroll-snap, ref-based state | Fixed jumping/stuck values |
| v3 | Negative top offset positioning | Fixed dropdown misalignment with trigger |
| v4 | `scrollbar-hide` class | Removed visible scrollbar |
| v5 | `visibleCount` 7→5, `font-semibold`→`font-bold` | More compact, bolder selected text |
