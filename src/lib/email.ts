import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'mailtrap';
const EMAIL_MODE = process.env.EMAIL_MODE || 'development';

// Initialize Resend for production (lazy initialization)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && process.env.EMAIL_API_KEY) {
    resendClient = new Resend(process.env.EMAIL_API_KEY);
  }
  if (!resendClient) {
    throw new Error('Resend API key is not configured');
  }
  return resendClient;
}

// Email service configuration for SMTP (Mailtrap)
const emailConfig = {
  host: process.env.EMAIL_HOST || 'sandbox.smtp.mailtrap.io',
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// Create reusable transporter for SMTP
const transporter = EMAIL_SERVICE === 'mailtrap'
  ? nodemailer.createTransport(emailConfig)
  : null;

/**
 * Send email using the configured service (Resend or Mailtrap)
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 * @returns Promise<boolean> - Success status
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  const fromName = process.env.EMAIL_FROM_NAME || 'Merkel Vision';
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@example.com';

  try {
    if (EMAIL_SERVICE === 'resend') {
      // Production: Use Resend API
      const resend = getResendClient();
      await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to,
        subject,
        html,
      });
      return true;
    } else if (EMAIL_SERVICE === 'mailtrap' && transporter) {
      // Development: Use Mailtrap SMTP
      await transporter.sendMail({
        from: `"${fromName}" <${fromAddress}>`,
        to,
        subject,
        html,
      });
      return true;
    } else {
      console.error('No email service configured');
      return false;
    }
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

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

  // Send actual email via configured service
  return sendEmail(
    email,
    'Verify your email address',
    `
      <h2>Welcome to Merkel Vision!</h2>
      <p>Hi ${username},</p>
      <p>Thank you for registering. Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verify Email</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `
  );
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

  // Send actual email via configured service
  return sendEmail(
    email,
    'Reset your password',
    `
      <h2>Password Reset Request</h2>
      <p>Hi ${username},</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4285f4; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">Reset Password</a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p><strong>This link will expire in 15 minutes.</strong></p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p style="color: #666; font-size: 12px;">For security: Never share this link with anyone.</p>
    `
  );
}

/**
 * Send password changed notification email
 * @param email - User's email address
 * @param username - User's username
 * @param ipAddress - IP address where change occurred
 * @param timestamp - When the change occurred
 */
export async function sendPasswordChangedEmail(
  email: string,
  username: string,
  ipAddress: string | null,
  timestamp: Date
): Promise<boolean> {
  const formattedTime = timestamp.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  });

  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('✅ PASSWORD CHANGED NOTIFICATION (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Your password was changed`);
    console.log(`\nHi ${username},\n`);
    console.log(`Your password was successfully changed on ${formattedTime}`);
    if (ipAddress) {
      console.log(`IP Address: ${ipAddress}`);
    }
    console.log(`\nIf you didn't make this change, contact: admin@merkelvision.com`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email via configured service
  return sendEmail(
    email,
    'Your Password Was Changed',
    `
      <h2>Password Changed</h2>
      <p>Hi ${username},</p>
      <p>Your password was successfully changed on <strong>${formattedTime}</strong>.</p>
      ${ipAddress ? `<p>IP Address: <code>${ipAddress}</code></p>` : ''}
      <p>If you made this change, no further action is needed.</p>
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0;">
        <strong>⚠️ If you did NOT make this change:</strong>
        <ol style="margin: 10px 0;">
          <li>Someone may have unauthorized access to your account</li>
          <li>Contact our support team immediately at <a href="mailto:admin@merkelvision.com">admin@merkelvision.com</a></li>
          <li>We recommend securing your email account as well</li>
        </ol>
      </div>
      <p>For your security, all active sessions have been logged out.</p>
      <p style="color: #666; font-size: 12px;">This is an automated security notification.</p>
    `
  );
}
