/**
 * API Route Constants
 * Centralized API endpoint paths
 */

// API Base paths
export const API_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    VERIFY_EMAIL: "/api/auth/verify-email",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
  },
  // Locations
  LOCATIONS: {
    BASE: "/api/locations",
    BY_ID: (id: number) => `/api/locations/${id}`,
  },
  // Photos
  PHOTOS: {
    BASE: "/api/photos",
    BY_ID: (id: number) => `/api/photos/${id}`,
  },
  // ImageKit
  IMAGEKIT: {
    AUTH: "/api/imagekit/auth",
  },
} as const;

// Page Routes
export const PAGE_ROUTES = {
  HOME: "/",
  MAP: "/map",
  LOCATIONS: "/locations",
  LOGIN: "/login",
  REGISTER: "/register",
  VERIFY_EMAIL: "/verify-email",
} as const;
