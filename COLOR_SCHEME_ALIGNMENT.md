# Map Icon Color Scheme Alignment (Web ↔ iOS)

**Date:** September 18, 2026

## Purpose

The web app's map/marker colors were recently centralized into a single source of truth:
[`fotolokashen/src/lib/map-icon-colors.ts`](../../fotolokashen/src/lib/map-icon-colors.ts).
While doing that, the location-type hex values were changed (currently look like placeholder/test
values, not confirmed final brand colors — **confirm with design before iOS adopts them**).

iOS has its own independent, hardcoded color source in
[`Services/UI/LocationTypeColors.swift`](../fotolokashen/fotolokashen/Services/UI/LocationTypeColors.swift)
and [`Services/Locations/MarkerIconGenerator.swift`](../fotolokashen/fotolokashen/Services/Locations/MarkerIconGenerator.swift).
It still reflects the **original** web palette (from before this round of changes), so the two
platforms are now out of sync. This doc captures exactly what differs so iOS can be updated
deliberately, one time, once the target palette is confirmed.

> Web is also moving away from persisting a resolved marker `color` per saved location in the
> database — colors will always be derived live from `type`. iOS's `MarkerIconGenerator` already
> works this way (color is always computed from `type`, never read from a stored per-location
> field), so no iOS behavior change is needed there — just the hex values below.

## 1. Location-Type Colors

| Type                 | iOS (current) — `LocationTypeColors.swift` | Web (current) — `map-icon-colors.ts` | Match? |
| -------------------- | ------------------------------------------ | ------------------------------------ | ------ |
| BROLL                | `#3B82F6`                                  | `#A85D27`                            | ❌     |
| STORY                | `#EF4444`                                  | `#D17330`                            | ❌     |
| INTERVIEW            | `#8B5CF6`                                  | `#F58638`                            | ❌     |
| LIVE ANCHOR          | `#DC2626`                                  | `#573014`                            | ❌     |
| REPORTER LIVE        | `#F59E0B`                                  | `#7F461D`                            | ❌     |
| STAKEOUT             | `#6B7280`                                  | `#4C5C54`                            | ❌     |
| DRONE                | `#06B6D4`                                  | `#5A8F75`                            | ❌     |
| SCENE                | `#22C55E`                                  | `#53C28C`                            | ❌     |
| EVENT                | `#84CC16`                                  | `#F5DC38`                            | ❌     |
| BATHROOM             | `#0EA5E9`                                  | `#38F59A`                            | ❌     |
| OTHER                | `#64748B`                                  | `#CD38F5`                            | ❌     |
| HQ (admin)           | `#1E40AF`                                  | `#AA53C2`                            | ❌     |
| BUREAU (admin)       | `#7C3AED`                                  | `#835A8F`                            | ❌     |
| REMOTE STAFF (admin) | `#EC4899`                                  | `#584C5C`                            | ❌     |
| STORAGE (admin)      | `#78716C`                                  | `#C2B353`                            | ❌     |

All 15 types currently differ. **Action:** once the web palette above is confirmed final, update
each `case` in `LocationTypeColors.uiColor(for:)` to match.

## 2. Cluster Badge Colors

| Tier             | iOS (current)    | Web (current) | Match? |
| ---------------- | ---------------- | ------------- | ------ |
| small (≤5)       | `#3B82F6` blue   | `#185714`     | ❌     |
| medium (6–10)    | `#8B5CF6` purple | `#247F1D`     | ❌     |
| large (11–20)    | `#F59E0B` amber  | `#2FA827`     | ❌     |
| very large (21+) | `#DC2626` red    | `#3BD130`     | ❌     |

Thresholds (`>5`, `>10`, `>20`) already match between platforms — only the hex values differ.
iOS: `MarkerIconGenerator.clusterIcon(count:)`. Web: `getClusterColor()` in `map-icon-colors.ts`.

## 3. Other Marker Colors

| Purpose                           | iOS (current)                                                   | Web (current)               | Match?                                           |
| --------------------------------- | --------------------------------------------------------------- | --------------------------- | ------------------------------------------------ |
| Default/fallback marker (no type) | `#64748B` (falls through to OTHER)                              | `#44F538`                   | ❌                                               |
| Public/social location marker     | `#5C4DFF`-ish brand purple (`MarkerIconGenerator.socialMarker`) | `#173057`                   | ❌                                               |
| Home location marker              | _not implemented_ — iOS has no distinct home marker icon yet    | `#2D5DA8`                   | N/A — iOS feature gap, not just a color mismatch |
| "Your location" dot               | Native/system location dot (Google Maps default)                | `#4285F4` (Google standard) | ✅ effectively aligned                           |

## 4. Files Involved

**Web (source of truth):**

- [`src/lib/map-icon-colors.ts`](../../fotolokashen/src/lib/map-icon-colors.ts) — all hex values, `getColorForType()`, `getClusterColor()`

**iOS (needs updating once palette is confirmed):**

- [`Services/UI/LocationTypeColors.swift`](../fotolokashen/fotolokashen/Services/UI/LocationTypeColors.swift) — `uiColor(for:)` switch statement (15 types)
- [`Services/Locations/MarkerIconGenerator.swift`](../fotolokashen/fotolokashen/Services/Locations/MarkerIconGenerator.swift) — `clusterIcon(count:)` thresholds/colors, `socialMarker()` purple constant
- No existing file for a home-location marker — would be new work if iOS wants parity with the web's home pin

## 5. Recommended Next Steps

1. Confirm the current web hex values in `map-icon-colors.ts` are final (they read as a
   test/placeholder gradient right now, not an obviously deliberate brand palette).
2. Once confirmed, update the 15 `case` values in `LocationTypeColors.swift` to match.
3. Update `MarkerIconGenerator.clusterIcon(count:)` color constants to match `CLUSTER_COLORS`.
4. Update `MarkerIconGenerator.socialMarker()`'s `purpleColor` to match `PUBLIC_LOCATION_COLOR`.
5. Decide whether iOS should get a home-location marker at all; if so, use `HOME_MARKER_COLOR`.
6. No change needed for the "your location" dot or for how iOS resolves marker color per save
   (iOS already always derives it from `type`, never from a stored per-location value).
