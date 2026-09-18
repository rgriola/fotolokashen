/**
 * Map Icon Colors
 * Centralized configuration for all location/marker/cluster icon colors
 */

// Single source of truth for each location type's color and admin visibility
export const LOCATION_TYPE_CONFIG = {
  "LIVE ANCHOR": { color: "#DC2626", adminOnly: false }, // Dark Red - live broadcast
  "REPORTER LIVE": { color: "#F59E0B", adminOnly: false }, // Orange - reporter on scene
  BROLL: { color: "#3B82F6", adminOnly: false }, // Blue - general footage
  STORY: { color: "#EF4444", adminOnly: false }, // Red - primary story location
  INTERVIEW: { color: "#8B5CF6", adminOnly: false }, // Purple - interview subjects
  EVENT: { color: "#84CC16", adminOnly: false }, // Lime - special events
  STAKEOUT: { color: "#6B7280", adminOnly: false }, // Gray - surveillance
  DRONE: { color: "#06B6D4", adminOnly: false }, // Cyan - aerial footage
  SCENE: { color: "#22C55E", adminOnly: false }, // Green - scene location
  BATHROOM: { color: "#0EA5E9", adminOnly: false }, // Sky Blue - bathroom facilities
  OTHER: { color: "#64748B", adminOnly: false }, // Slate - miscellaneous

  HQ: { color: "#1E40AF", adminOnly: true }, // Dark Blue - headquarters
  BUREAU: { color: "#7C3AED", adminOnly: true }, // Violet - bureau office
  "REMOTE STAFF": { color: "#EC4899", adminOnly: true }, // Pink - remote workers
  STORAGE: { color: "#78716C", adminOnly: true }, // Stone - storage facilities
} as const satisfies Record<string, { color: string; adminOnly: boolean }>;

// Fallback color for single-location pins with no type/user color set
export const DEFAULT_MARKER_COLOR = LOCATION_TYPE_CONFIG.STORY.color; // #EF4444

// Public (non-owned) location pins on the shared map
export const PUBLIC_LOCATION_COLOR = "#A855F7";

// Home location marker (distinct constant, not tied to any location type)
export const HOME_MARKER_COLOR = "#3B82F6";

// "Your location" dot - Google Maps' standard blue convention
export const USER_LOCATION_COLOR = "#4285F4";

// Cluster badge colors by group size - reuse existing type colors instead of new hex values
export const CLUSTER_COLORS = {
  small: LOCATION_TYPE_CONFIG.BROLL.color, // #3B82F6
  medium: LOCATION_TYPE_CONFIG.INTERVIEW.color, // #8B5CF6
  large: LOCATION_TYPE_CONFIG["REPORTER LIVE"].color, // #F59E0B
  veryLarge: LOCATION_TYPE_CONFIG["LIVE ANCHOR"].color, // #DC2626
} as const;

// Type-to-Color mapping - contrast compliant colors for map markers and UI
export const TYPE_COLOR_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(LOCATION_TYPE_CONFIG).map(([type, { color }]) => [
    type,
    color,
  ]),
);

// Admin-only location types
export const ADMIN_ONLY_TYPES = Object.entries(LOCATION_TYPE_CONFIG)
  .filter(([, { adminOnly }]) => adminOnly)
  .map(([type]) => type);

// Ordered list of location types (derived from LOCATION_TYPE_CONFIG keys)
export const LOCATION_TYPES = Object.keys(LOCATION_TYPE_CONFIG);

// Get location types filtered by user role
export function getAvailableTypes(isAdmin: boolean): string[] {
  if (isAdmin) {
    return LOCATION_TYPES;
  }
  return LOCATION_TYPES.filter((type) => !ADMIN_ONLY_TYPES.includes(type));
}

// Helper function to get color for a location type
export function getColorForType(type: string): string {
  return TYPE_COLOR_MAP[type] || TYPE_COLOR_MAP["OTHER"];
}

const CLUSTER_THRESHOLDS = { veryLarge: 20, large: 10, medium: 5 };

export function getClusterColor(count: number): string {
  if (count > CLUSTER_THRESHOLDS.veryLarge) return CLUSTER_COLORS.veryLarge;
  if (count > CLUSTER_THRESHOLDS.large) return CLUSTER_COLORS.large;
  if (count > CLUSTER_THRESHOLDS.medium) return CLUSTER_COLORS.medium;
  return CLUSTER_COLORS.small;
}
