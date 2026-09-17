import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { PublicUser } from "@/types/user";

const JWT_SECRET = process.env.JWT_SECRET!; // env.ts validates this exists at startup — no fallback

/**
 * Access-token lifetime. Session rows and OAuth `expires_in` must be derived from
 * these so a token can never outlive the session row that validates it.
 */
export const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const JWT_EXPIRY_REMEMBER_ME_SECONDS = 30 * 24 * 60 * 60; // 30 days
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns Promise<boolean> - True if passwords match
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * @param user - Public user data
 * @param rememberMe - Whether to extend token expiry
 * @returns string - JWT token
 */
export function generateToken(
  user: PublicUser,
  rememberMe: boolean = false,
): string {
  const payload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
    role: user.role,
    avatar: user.avatar,
    bannerImage: user.bannerImage,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: rememberMe ? JWT_EXPIRY_REMEMBER_ME_SECONDS : JWT_EXPIRY_SECONDS,
  });
}

/**
 * Decoded JWT payload shape.
 * Must stay in sync with the payload object in generateToken().
 */
export interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  isAdmin: boolean;
  role: string;
  avatar: string | null;
  bannerImage: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Generate a random token for email verification
 * @returns string - Random token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Generate a random token for password reset
 * @returns string - Random token
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a token with SHA-256 for secure storage.
 * Raw tokens are sent to the user (email, deep link); only the hash is stored in DB.
 * On verification, hash the incoming token and compare to the stored hash.
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Get token expiry time (1 hour from now)
 * @returns Date - Expiry date
 */
export function getResetTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 1);
  return expiry;
}
