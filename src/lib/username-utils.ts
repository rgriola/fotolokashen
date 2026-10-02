import prisma from "@/lib/prisma";

const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,50}$/;

// Forbidden username patterns to prevent phishing/impersonation
const FORBIDDEN_PATTERNS = [
  /^admin/i,
  /^support/i,
  /^fotolokashen/i,
  /^staff/i,
  /^moderator/i,
  /^mod/i,
  /^help/i,
  /^official/i,
  /^system/i,
  /^root/i,
  /^api/i,
];

/**
 * Validate username format
 */
export function validateUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username || username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" };
  }

  if (username.length > 50) {
    return { valid: false, error: "Username must be 50 characters or less" };
  }

  if (!USERNAME_REGEX.test(username)) {
    return {
      valid: false,
      error:
        "Username can only contain letters, numbers, hyphens, and underscores",
    };
  }

  // Check forbidden patterns to prevent phishing/impersonation
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(username)) {
      return {
        valid: false,
        error: "This username pattern is reserved",
      };
    }
  }

  return { valid: true };
}

/**
 * Check if username is available (not taken or reserved)
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const lowerUsername = username.toLowerCase();

  // Check if reserved
  const reserved = await prisma.reservedUsername.findUnique({
    where: { username: lowerUsername },
  });
  if (reserved) return false;

  // Check if taken by another user
  const taken = await prisma.user.findUnique({
    where: { username: lowerUsername },
  });

  return !taken;
}

/**
 * Check if username is available for a specific user (for username changes)
 */
export async function isUsernameAvailableForUser(
  username: string,
  userId: number,
): Promise<boolean> {
  const lowerUsername = username.toLowerCase();

  // Check if reserved
  const reserved = await prisma.reservedUsername.findUnique({
    where: { username: lowerUsername },
  });
  if (reserved) return false;

  // Check if taken by another user (excluding current user)
  const taken = await prisma.user.findFirst({
    where: {
      username: lowerUsername,
      id: { not: userId },
    },
  });

  return !taken;
}

/**
 * Format username for display (@username)
 */
export function formatUsername(username: string): string {
  return `@${username}`;
}

/**
 * Normalize username for storage/lookup (lowercase)
 */
export function normalizeUsername(username: string): string {
  return username.toLowerCase();
}

/**
 * Extract username from formatted string (@username → username)
 */
export function extractUsername(formattedUsername: string): string {
  return formattedUsername.startsWith("@")
    ? formattedUsername.slice(1)
    : formattedUsername;
}
