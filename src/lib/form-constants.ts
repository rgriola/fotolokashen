/**
 * Form Field Constants
 * Shared constants for form fields and validation
 */

import * as z from "zod";

// Indoor/Outdoor options
export const INDOOR_OUTDOOR_OPTIONS = ["indoor", "outdoor", "both"] as const;
export type IndoorOutdoorType = (typeof INDOOR_OUTDOOR_OPTIONS)[number];
export const DEFAULT_INDOOR_OUTDOOR: IndoorOutdoorType = "outdoor";

// Indoor/Outdoor Zod schema (reusable)
export const indoorOutdoorSchema = z.enum(INDOOR_OUTDOOR_OPTIONS).optional();

// Sort options for locations
export const LOCATION_SORT_OPTIONS = [
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "rating", label: "Highest Rating" },
] as const;

// Personal rating range
export const MIN_RATING = 0;
export const MAX_RATING = 5;
export const DEFAULT_RATING = 0;
