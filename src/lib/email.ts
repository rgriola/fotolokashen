import * as nodemailer from 'nodemailer';


const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const EMAIL_MODE = process.env.EMAIL_MODE || 'development';

// Email service configuration
const emailConfig = {
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

/**
 * Send email verification email
 * @param email - User's email address
 * @param token - Verification token
 * @param username - User's username
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string
): Promise<boolean> {
  const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

  // In development mode, just log the URL to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 VERIFICATION EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your email address`);
    console.log(`\nHi ${username},\n`);
    console.log(`Click the link below to verify your email:\n`);
    console.log(`🔗 ${verificationUrl}\n`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Production mode: send actual email via Mailtrap
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Verify your email address',
      html: `
        <h2>Welcome to GoogleMaps Search!</h2>
        <p>Hi ${username},</p>
        <p>Thank you for registering. Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${verificationUrl}</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

/**
 * Send password reset email
 * @param email - User's email address
 * @param token - Reset token
 * @param username - User's username
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  username: string
): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  // In development mode, just log the URL to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 PASSWORD RESET EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Reset your password`);
    console.log(`\nHi ${username},\n`);
    console.log(`Click the link below to reset your password:\n`);
    console.log(`🔗 ${resetUrl}\n`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Production mode: send actual email
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hi ${username},</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>Or copy and paste this link into your browser:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}
