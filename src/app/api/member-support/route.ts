import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { rateLimit } from '@/lib/rate-limit';
import { Resend } from 'resend';

// Environment variables
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const SUPPORT_EMAIL = 'rodczaro@gmail.com';

// Initialize Resend client
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && EMAIL_API_KEY) {
    resendClient = new Resend(EMAIL_API_KEY);
  }
  if (!resendClient) {
    throw new Error('Email service not configured');
  }
  return resendClient;
}

// Validation constants
const VALIDATION = {
  name: { min: 2, max: 100 },
  email: { max: 254 },
  subject: { min: 5, max: 200 },
  message: { min: 10, max: 2000 },
  holdDuration: { min: 3000 }, // 3 seconds minimum
};

// Email regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SupportRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

function validateRequest(body: SupportRequest): string | null {
  const { name, email, subject, message } = body;

  // Name validation
  if (!name || typeof name !== 'string') {
    return 'Name is required';
  }
  if (name.length < VALIDATION.name.min || name.length > VALIDATION.name.max) {
    return `Name must be between ${VALIDATION.name.min} and ${VALIDATION.name.max} characters`;
  }

  // Email validation
  if (!email || typeof email !== 'string') {
    return 'Email is required';
  }
  if (email.length > VALIDATION.email.max) {
    return 'Email is too long';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }

  // Subject validation
  if (!subject || typeof subject !== 'string') {
    return 'Subject is required';
  }
  if (subject.length < VALIDATION.subject.min || subject.length > VALIDATION.subject.max) {
    return `Subject must be between ${VALIDATION.subject.min} and ${VALIDATION.subject.max} characters`;
  }

  // Message validation
  if (!message || typeof message !== 'string') {
    return 'Message is required';
  }
  if (message.length < VALIDATION.message.min || message.length > VALIDATION.message.max) {
    return `Message must be between ${VALIDATION.message.min} and ${VALIDATION.message.max} characters`;
  }

  return null;
}

function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

function createSupportEmailHtml(name: string, email: string, subject: string, message: string, username?: string): string {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'long',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Member Support Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📬 Member Support Request</h1>
  </div>
  
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; width: 120px;">From:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${sanitizeInput(name)}</td>
      </tr>
      ${username ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-weight: bold;">Username:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">@${sanitizeInput(username)}</td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-weight: bold;">Email:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">
          <a href="mailto:${sanitizeInput(email)}" style="color: #667eea;">${sanitizeInput(email)}</a>
        </td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef; font-weight: bold;">Subject:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e9ecef;">${sanitizeInput(subject)}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold;">Received:</td>
        <td style="padding: 10px 0;">${timestamp}</td>
      </tr>
    </table>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #333; font-size: 18px; margin-top: 0;">Message:</h2>
    <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">
${sanitizeInput(message)}
    </div>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
    <p>This message was sent via the Fotolokashen Member Support Form</p>
  </div>
</body>
</html>
`;
}

function createConfirmationEmailHtml(name: string, subject: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">✅ Support Request Received</h1>
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e9ecef; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-top: 0;">Hi ${sanitizeInput(name)},</p>
    
    <p>Thank you for contacting Fotolokashen support! We've received your message regarding:</p>
    
    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
      <strong>${sanitizeInput(subject)}</strong>
    </div>
    
    <p>Our support team will review your message and get back to you within 24-48 hours.</p>
    
    <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px;">
      If you have any additional information to add, please reply to this email.
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #6c757d; font-size: 12px;">
    <p>Fotolokashen Support Team</p>
  </div>
</body>
</html>
`;
}

/**
 * POST /api/member-support
 * Submit a member support request (authenticated users only)
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const auth = await requireAuth(request);
    if (!auth.authorized || !auth.user) {
      return apiError(auth.error || 'Unauthorized', 401, 'UNAUTHORIZED');
    }

    const user = auth.user;

    // Rate limiting: 5 requests per hour for authenticated users
    const rateLimitResult = rateLimit(request, {
      limit: 5,
      windowMs: 60 * 60 * 1000, // 1 hour
      keyPrefix: 'member-support',
    });

    if (!rateLimitResult.allowed) {
      const retryMinutes = Math.ceil(rateLimitResult.retryAfter / 60000);
      return apiError(
        `Too many support requests. Please try again in ${retryMinutes} minute${retryMinutes === 1 ? '' : 's'}.`,
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Parse request body
    let body: SupportRequest;
    try {
      body = await request.json();
    } catch {
      return apiError('Invalid request body', 400, 'INVALID_JSON');
    }

    // Validate request
    const validationError = validateRequest(body);
    if (validationError) {
      return apiError(validationError, 400, 'VALIDATION_ERROR');
    }

    const { name, email, subject, message } = body;

    // Send emails
    try {
      const resend = getResendClient();
      const fromName = process.env.EMAIL_FROM_NAME || 'Fotolokashen Support';
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@fotolokashen.com';

      // Send support request email to admin
      await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: SUPPORT_EMAIL,
        replyTo: email,
        subject: `[Member Support] ${subject}`,
        html: createSupportEmailHtml(name, email, subject, message, user.username),
      });

      // Send confirmation email to member
      await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: email,
        subject: 'Your Support Request Has Been Received',
        html: createConfirmationEmailHtml(name, subject),
      });

      console.log(`✅ Member support email sent from ${email} (@${user.username}): ${subject}`);

      return apiResponse({
        success: true,
        message: 'Your message has been sent successfully! Check your email for confirmation.',
      });
    } catch (emailError) {
      console.error('❌ Member support email error:', emailError);
      return apiError(
        'Failed to send message. Please try again later.',
        500,
        'EMAIL_SEND_ERROR'
      );
    }
  } catch (error) {
    console.error('Member support API error:', error);
    return apiError('An unexpected error occurred', 500, 'INTERNAL_ERROR');
  }
}
