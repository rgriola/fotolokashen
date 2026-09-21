/**
 * Map Icon Colors
 * Centralized configuration for all location/marker/cluster icon colors
 */

// Single source of truth for each location type's color and admin visibility
export const LOCATION_TYPE_CONFIG = {
  "LIVE ANCHOR": { color: "#573014", adminOnly: false }, // Dark Red - live broadcast
  "REPORTER LIVE": { color: "#7F461D", adminOnly: false }, // Orange - reporter on scene
  BROLL: { color: "#A85D27", adminOnly: false }, // Blue - general footage
  STORY: { color: "#D17330", adminOnly: false }, // Red - primary story location
  INTERVIEW: { color: "#F58638", adminOnly: false }, // Purple - interview subjects
  EVENT: { color: "#F5DC38", adminOnly: false }, // Lime - special events
  STAKEOUT: { color: "#4C5C54", adminOnly: false }, // Gray - surveillance
  DRONE: { color: "#5A8F75", adminOnly: false }, // Cyan - aerial footage
  SCENE: { color: "#53C28C", adminOnly: false }, // Green - scene location
  BATHROOM: { color: "#38F59A", adminOnly: false }, // Sky Blue - bathroom facilities
  OTHER: { color: "#CD38F5", adminOnly: false }, // Slate - miscellaneous
  HQ: { color: "#AA53C2", adminOnly: true }, // Dark Blue - headquarters
  BUREAU: { color: "#835A8F", adminOnly: true }, // Violet - bureau office
  "REMOTE STAFF": { color: "#584C5C", adminOnly: true }, // Pink - remote workers
  STORAGE: { color: "#C2B353", adminOnly: true }, // Stone - storage facilities
} as const satisfies Record<string, { color: string; adminOnly: boolean }>;

// Fallback color for single-location pins with no type/user color set
export const DEFAULT_MARKER_COLOR = "#44F538";
// Public (non-owned) location pins on the shared map
export const PUBLIC_LOCATION_COLOR = "#173057";
// Home location marker (distinct constant, not tied to any location type)
export const HOME_MARKER_COLOR = "#2D5DA8";
// "Your location" dot - Google Maps' standard blue convention
export const USER_LOCATION_COLOR = "#4285F4"; // Google Don't Change

// Cluster badge colors by group size - reuse existing type colors instead of new hex values
export const CLUSTER_COLORS = {
  small: "#185714",
  medium: "#247F1D",
  large: "#2FA827",
  veryLarge: "#3BD130",
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
