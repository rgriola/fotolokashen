import { Resend } from 'resend';
import {
  EMAIL_SUBJECTS,
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
  welcomeToEmailTemplate,
} from './email-content';
import { prisma } from './prisma';
import { env } from './env';

// Environment variables — using validated env to prevent silent defaults
const APP_URL = env.NEXT_PUBLIC_APP_URL;
const EMAIL_MODE = env.EMAIL_MODE;
const EMAIL_API_KEY = env.EMAIL_API_KEY;
// Production safety guard: catch misconfigured EMAIL_MODE before any emails are attempted
if (process.env.NODE_ENV === 'production' && EMAIL_MODE !== 'production') {
  console.error(
    '\n🚨🚨🚨 CRITICAL: EMAIL_MODE is set to "' + EMAIL_MODE + '" in a production environment!\n' +
    '   All emails will be silently logged to console instead of sent.\n' +
    '   Set EMAIL_MODE="production" in Vercel environment variables to fix.\n'
  );
}

// Initialize Resend client (lazy initialization)
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && EMAIL_API_KEY) {
    resendClient = new Resend(EMAIL_API_KEY);
  }
  if (!resendClient) {
    throw new Error('Resend API key is not configured. Set EMAIL_API_KEY in environment variables.');
  }
  return resendClient;
}

/**
 * Send email using Resend API
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - Email HTML content
 * @param options - Optional send options (templateId, text, previewText, replyTo)
 * @returns Promise<boolean> - Success status
 */
interface SendEmailOptions {
  templateId?: number;
  text?: string;
  previewText?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

/** Strip HTML tags and decode common entities to produce a plain-text fallback. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/?(div|tr|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<a[^>]+href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function injectPreviewText(html: string, previewText?: string): string {
  if (!previewText?.trim()) {
    return html;
  }

  const escapedPreview = previewText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const hiddenPreview = `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;">${escapedPreview}</div>`;

  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body([^>]*)>/i, `<body$1>${hiddenPreview}`);
  }

  return `${hiddenPreview}${html}`;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options: SendEmailOptions = {}
): Promise<boolean> {
  const { templateId, text, previewText, replyTo, headers: extraHeaders } = options;
  const fromName = env.EMAIL_FROM_NAME;
  const fromAddress = env.EMAIL_FROM_ADDRESS;
  const replyToAddress = replyTo || env.EMAIL_REPLY_TO || fromAddress;
  const htmlWithPreview = injectPreviewText(html, previewText);
  const plainText = text || htmlToPlainText(htmlWithPreview);

  // Headers that improve deliverability with corporate mail filters (Microsoft 365, Proofpoint)
  const deliverabilityHeaders: Record<string, string> = {
    'Precedence': 'transactional',
    'X-Auto-Response-Suppress': 'OOF, AutoReply',
    'List-Unsubscribe': `<mailto:${replyToAddress}?subject=unsubscribe>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    ...extraHeaders,
  };

  try {
    console.log(`[Email] Attempting send — mode: ${EMAIL_MODE}, to: ${to}, subject: "${subject}"`);
    const resend = getResendClient();
    const result = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to,
      subject,
      html: htmlWithPreview,
      text: plainText,
      headers: deliverabilityHeaders,
      ...(replyToAddress ? { replyTo: replyToAddress } : {}),
    });
    const resendId = result?.data?.id || 'unknown';
    
    console.log(`✅ Email sent to ${to}: ${subject} (Resend ID: ${resendId}, Reply-To: ${replyToAddress})`);
    
    // Log all sends so webhook lifecycle events can map back to provider message IDs.
    try {
      await prisma.emailLog.create({
        data: {
          ...(templateId !== undefined ? { templateId } : {}),
          to,
          subject,
          status: 'sent',
          sentAt: new Date(),
          errorMessage: resendId !== 'unknown' ? `provider=resend; messageId=${resendId}` : undefined,
        },
      });
    } catch (logError) {
      console.error('Failed to log email to database:', logError);
      // Don't fail the email send if logging fails.
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Email send FAILED — mode: ${EMAIL_MODE}, to: ${to}, subject: "${subject}"`);
    console.error('   Error details:', error);
    
    // Log all failures for traceability and delivery debugging.
    try {
      await prisma.emailLog.create({
        data: {
          ...(templateId !== undefined ? { templateId } : {}),
          to,
          subject,
          status: 'failed',
          sentAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log email error to database:', logError);
    }
    
    return false;
  }
}

/**
 * Send email verification email
 * @param email - User's email address
 * @param token - Verification token
 * @param username - User's username
 * @param platform - Optional platform identifier (e.g. 'ios') — appended to verification URL
 *                   so the verify-email page can redirect back to the native app
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  username: string,
  platform?: string
): Promise<boolean> {
  const platformParam = platform ? `&platform=${platform}` : '';
  const verificationUrl = `${APP_URL}/verify-email?token=${token}${platformParam}`;

  // In development mode, just log the URL to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 VERIFICATION EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your email address for Fotolokashen`);
    console.log(`\nHi ${username},\n`);
    console.log(`Click the link below to verify your email:\n`);
    console.log(`🔗 ${verificationUrl}\n`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  const verificationSubject = EMAIL_SUBJECTS.verification;
  const verificationText = [
    `Hi ${username},`,
    '',
    'A new Fotolokashen account was created with this email address.',
    'Verify your email to activate the account:',
    verificationUrl,
    '',
    'This link expires in 30 minutes.',
    'If you did not create this account, you can ignore this email.',
  ].join('\n');

  return sendEmail(
    email,
    verificationSubject,
    verificationEmailTemplate(username, verificationUrl),
    {
      text: verificationText,
      previewText: 'Verify your email address to activate your account.',
    }
  );
}

/**
 * Send welcome email (after verification)
 * @param email - User's email address
 * @param username - User's username
 */
export async function sendWelcomeEmail(
  email: string,
  username: string
): Promise<boolean> {
  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('🎉 WELCOME EMAIL (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Email Confirmed - Welcome to Fotolokashen!`);
    console.log(`\nHi ${username},\n`);
    console.log(`Your email has been confirmed! Welcome to Fotolokashen.`);
    console.log(`\nStart adding locations, photos, and building your projects!`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  return sendEmail(
    email,
    EMAIL_SUBJECTS.welcome,
    welcomeToEmailTemplate(username)
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
  username: string,
  platform?: string
): Promise<boolean> {
  const platformParam = platform ? `&platform=${platform}` : '';
  const resetUrl = `${APP_URL}/reset-password?token=${token}${platformParam}`;

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

  return sendEmail(
    email,
    EMAIL_SUBJECTS.password_reset,
    passwordResetEmailTemplate(username, resetUrl)
  );
}

/**
 * Send password changed notification email
 * @param email - User's email address
 * @param username - User's username
 * @param ipAddress - IP address where change occurred
 * @param timestamp - When the change occurred
 * @param userTimezone - User's timezone preference (optional)
 */
export async function sendPasswordChangedEmail(
  email: string,
  username: string,
  ipAddress: string | null,
  timestamp: Date,
  userTimezone?: string | null
): Promise<boolean> {
  // Format timestamp in user's timezone if available, otherwise UTC
  const timezone = userTimezone || 'UTC';

  const formattedTime = timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
    timeZoneName: 'short',
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
    console.log(`\nIf you didn't make this change, contact: admin@fotolokashen.com`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  return sendEmail(
    email,
    EMAIL_SUBJECTS.password_changed,
    passwordChangedEmailTemplate(username, formattedTime, ipAddress)
  );
}

/**
 * Send account deletion notification email
 * @param email - User's email address
 * @param username - User's username or full name
 */
export async function sendAccountDeletionEmail(
  email: string,
  username: string
): Promise<boolean> {
  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('🗑️  ACCOUNT DELETION NOTIFICATION (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: We deleted your fotolokashen account `);
    console.log(`\nHi ${username},\n`);
    console.log(`We have removed your account (${email}) entirely.`);
    console.log(`This deletion removed all personal information,`);
    console.log(`photos, and metadata related to your account.`);
    console.log(`\nAt any time you may register again.`);
    console.log(`\n- MV Team`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  return sendEmail(
    email,
    EMAIL_SUBJECTS.account_deletion,
    accountDeletionEmailTemplate(username, email)
  );
}

/**
 * Send email change verification to NEW email
 * @param newEmail - New email address
 * @param username - User's username
 * @param token - Verification token
 * @param oldEmail - Old email address (for reference)
 */
export async function sendEmailChangeVerification(
  newEmail: string,
  username: string,
  token: string,
  oldEmail: string
): Promise<boolean> {
  const verifyUrl = `${APP_URL}/verify-email-change?token=${token}`;

  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('📧 EMAIL CHANGE VERIFICATION (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${newEmail}`);
    console.log(`Subject: Verify Your New Email Address`);
    console.log(`\nHi ${username},\n`);
    console.log(`You requested to change your email from ${oldEmail} to ${newEmail}.`);
    console.log(`\nVerify URL: ${verifyUrl}`);
    console.log(`\nThis link expires in 30 minutes.`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email
  const html = `
    <h2>Verify Your New Email Address</h2>
    <p>Hi ${username},</p>
    <p>You requested to change your email address from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
    <p>Click the button below to confirm this change:</p>
    <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify New Email</a>
    <p>This link expires in 30 minutes.</p>
    <p>If you didn't request this change, please ignore this email.</p>
  `;

  return sendEmail(newEmail, 'Verify Your New Email Address', html);
}

/**
 * Send email change alert to OLD email
 * @param oldEmail - Old email address
 * @param username - User's username
 * @param newEmail - New email address
 * @param cancelToken - Cancellation token
 * @param ipAddress - IP address of request
 */
export async function sendEmailChangeAlert(
  oldEmail: string,
  username: string,
  newEmail: string,
  cancelToken: string,
  ipAddress: string | null
): Promise<boolean> {
  const cancelUrl = `${APP_URL}/cancel-email-change?token=${cancelToken}`;

  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log('⚠️  EMAIL CHANGE ALERT (Development Mode)');
    console.log('='.repeat(80));
    console.log(`To: ${oldEmail}`);
    console.log(`Subject: ⚠️ Email Change Request`);
    console.log(`\nHi ${username},\n`);
    console.log(`Someone requested to change your email to ${newEmail}.`);
    if (ipAddress) console.log(`Request from IP: ${ipAddress}`);
    console.log(`\nCancel URL: ${cancelUrl}`);
    console.log(`\nThis link expires in 30 minutes.`);
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email
  const html = `
    <h2>⚠️ Email Change Request</h2>
    <p>Hi ${username},</p>
    <p>Someone requested to change your email address to <strong>${newEmail}</strong>.</p>
    ${ipAddress ? `<p>Request from IP: ${ipAddress}</p>` : ''}
    <p><strong>If this was you:</strong> Check your new email (${newEmail}) for a verification link.</p>
    <p><strong>If this wasn't you:</strong> Click the button below to cancel this request immediately:</p>
    <a href="${cancelUrl}" style="display: inline-block; padding: 12px 24px; background-color: #DC2626; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Cancel Email Change</a>
    <p>This link expires in 30 minutes.</p>
    <p>If you didn't request this change, we recommend changing your password immediately.</p>
  `;

  return sendEmail(oldEmail, '⚠️ Email Change Request', html);
}

/**
 * Send confirmation after email change
 * @param email - Email address (new or old)
 * @param username - User's username
 * @param emailType - 'new' or 'old'
 */
export async function sendEmailChangeConfirmation(
  email: string,
  username: string,
  emailType: 'old' | 'new'
): Promise<boolean> {
  // In development mode, just log to console
  if (EMAIL_MODE === 'development') {
    console.log('\n' + '='.repeat(80));
    console.log(`✅ EMAIL CHANGE CONFIRMATION - ${emailType.toUpperCase()} (Development Mode)`);
    console.log('='.repeat(80));
    console.log(`To: ${email}`);
    console.log(`Subject: Email Changed`);
    console.log(`\nHi ${username},\n`);
    if (emailType === 'new') {
      console.log(`Your email address has been successfully changed to ${email}.`);
      console.log(`You can now log in with your new email address.`);
    } else {
      console.log(`Your email address has been changed.`);
      console.log(`This email address is no longer associated with your account.`);
    }
    console.log('='.repeat(80) + '\n');
    return true;
  }

  // Send actual email
  const html = emailType === 'new'
    ? `
      <h2>✅ Email Changed Successfully</h2>
      <p>Hi ${username},</p>
      <p>Your email address has been successfully changed to <strong>${email}</strong>.</p>
      <p>You can now log in with your new email address.</p>
      <p>All active sessions have been logged out for security.</p>
    `
    : `
      <h2>Email Address Changed</h2>
      <p>Hi ${username},</p>
      <p>Your email address has been changed. This email address is no longer associated with your account.</p>
      <p>If you didn't make this change, please contact support immediately.</p>
    `;

  return sendEmail(email, 'Email Changed', html);
}
