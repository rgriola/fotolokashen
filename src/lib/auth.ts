import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { PublicUser } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';
const JWT_EXPIRY = '7d'; // 7 days
const JWT_EXPIRY_REMEMBER_ME = '30d'; // 30 days
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
    hash: string
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
    rememberMe: boolean = false
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
        expiresIn: rememberMe ? JWT_EXPIRY_REMEMBER_ME : JWT_EXPIRY,
    });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export function verifyToken(token: string): any | null {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Generate a random token for email verification
 * @returns string - Random token
 */
export function generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a random token for password reset
 * @returns string - Random token
 */
export function generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
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
