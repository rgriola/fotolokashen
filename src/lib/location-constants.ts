/**
 * Location Types and Color Mapping
 * Centralized configuration for location categories and their associated colors
 */

// Single source of truth for each location type's color and admin visibility
export const LOCATION_TYPE_CONFIG = {
  BROLL: { color: "#3B82F6", adminOnly: false }, // Blue - general footage
  STORY: { color: "#EF4444", adminOnly: false }, // Red - primary story location
  INTERVIEW: { color: "#8B5CF6", adminOnly: false }, // Purple - interview subjects
  "LIVE ANCHOR": { color: "#DC2626", adminOnly: false }, // Dark Red - live broadcast
  "REPORTER LIVE": { color: "#F59E0B", adminOnly: false }, // Orange - reporter on scene
  STAKEOUT: { color: "#6B7280", adminOnly: false }, // Gray - surveillance
  DRONE: { color: "#06B6D4", adminOnly: false }, // Cyan - aerial footage
  SCENE: { color: "#22C55E", adminOnly: false }, // Green - scene location
  EVENT: { color: "#84CC16", adminOnly: false }, // Lime - special events
  BATHROOM: { color: "#0EA5E9", adminOnly: false }, // Sky Blue - bathroom facilities
  OTHER: { color: "#64748B", adminOnly: false }, // Slate - miscellaneous
  HQ: { color: "#1E40AF", adminOnly: true }, // Dark Blue - headquarters
  BUREAU: { color: "#7C3AED", adminOnly: true }, // Violet - bureau office
  "REMOTE STAFF": { color: "#EC4899", adminOnly: true }, // Pink - remote workers
  STORAGE: { color: "#78716C", adminOnly: true }, // Stone - storage facilities
} as const satisfies Record<string, { color: string; adminOnly: boolean }>;

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
