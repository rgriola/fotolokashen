/**
 * Email Template System
 * Beautiful, responsive HTML email templates for Fotolokashen
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const BRAND_COLOR = '#4285f4';
const BRAND_NAME = 'Fotolokashen';

/**
 * Base email template wrapper
 * Provides consistent styling and responsive layout
 */
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${BRAND_NAME}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Email Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <!-- Main Content Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND_COLOR} 0%, #5a67d8 100%); padding: 40px 40px 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                📍 ${BRAND_NAME}
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Location Scouting & Production Management
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e9ecef;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px; color: #6c757d; font-size: 13px;">
                      © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #6c757d; font-size: 12px;">
                      <a href="${APP_URL}" style="color: ${BRAND_COLOR}; text-decoration: none;">Visit Website</a>
                      &nbsp;•&nbsp;
                      <a href="mailto:admin@fotolokashen.com" style="color: ${BRAND_COLOR}; text-decoration: none;">Contact Support</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Footer Note -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 20px auto 0;">
          <tr>
            <td style="text-align: center; color: #6c757d; font-size: 11px; line-height: 16px;">
              This is an automated message. Please do not reply to this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Button component for emails
 */
function emailButton(url: string, text: string, style: 'primary' | 'secondary' = 'primary'): string {
  const bgColor = style === 'primary' ? BRAND_COLOR : '#6c757d';
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 6px; background-color: ${bgColor};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Alert box component
 */
function alertBox(type: 'info' | 'warning' | 'success' | 'danger', content: string): string {
  const colors = {
    info: { bg: '#cfe2ff', border: '#0d6efd', icon: 'ℹ️' },
    warning: { bg: '#fff3cd', border: '#ffc107', icon: '⚠️' },
    success: { bg: '#d1e7dd', border: '#198754', icon: '✅' },
    danger: { bg: '#f8d7da', border: '#dc3545', icon: '🚨' },
  };

  const color = colors[type];

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="background-color: ${color.bg}; border-left: 4px solid ${color.border}; padding: 16px; border-radius: 4px;">
          <p style="margin: 0; color: #212529; font-size: 14px; line-height: 1.6;">
            <strong>${color.icon} ${content}</strong>
          </p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Verification Email Template
 */
export function verificationEmailTemplate(username: string, verificationUrl: string): string {
  const content = `
    <h2 style="margin: 0 0 16px; color: #212529; font-size: 24px; font-weight: 600;">
      Welcome to ${BRAND_NAME}! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hi <strong>${username}</strong>,
    </p>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Thank you for registering! We're excited to have you on board. To get started, please verify your email address by clicking the button below:
    </p>
    
    ${emailButton(verificationUrl, '✓ Verify Email Address', 'primary')}
    
    <p style="margin: 24px 0 8px; color: #6c757d; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 16px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; color: #495057; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${verificationUrl}
    </p>
    
    ${alertBox('info', 'This verification link will expire in 24 hours for security purposes.')}
    
    <p style="margin: 24px 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      If you didn't create an account with ${BRAND_NAME}, you can safely ignore this email.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Verification Email Template
 */
export function welcomeToEmailTemplate(username: string, verificationUrl: string): string {
  const content = `
    <h2 style="margin: 0 0 16px; color: #212529; font-size: 24px; font-weight: 600;">
      Welcome to ${BRAND_NAME}! 🎉
    </h2>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hi <strong>${username}</strong>,
    </p>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Thank you for registering! We're excited to have you on board. To get started, please verify your email address by clicking the button below:
    </p>
    
    ${emailButton(verificationUrl, '✓ Verify Email Address', 'primary')}
    
    <p style="margin: 24px 0 8px; color: #6c757d; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 16px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; color: #495057; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${verificationUrl}
    </p>
    
    ${alertBox('info', 'This verification link will expire in 24 hours for security purposes.')}
    
    <p style="margin: 24px 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      If you didn't create an account with ${BRAND_NAME}, you can safely ignore this email.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmailTemplate(username: string, resetUrl: string): string {
  const content = `
    <h2 style="margin: 0 0 16px; color: #212529; font-size: 24px; font-weight: 600;">
      🔐 Password Reset Request
    </h2>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hi <strong>${username}</strong>,
    </p>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    ${emailButton(resetUrl, 'Reset Password', 'primary')}
    
    <p style="margin: 24px 0 8px; color: #6c757d; font-size: 14px; line-height: 1.6;">
      Or copy and paste this link into your browser:
    </p>
    <p style="margin: 0 0 16px; padding: 12px; background-color: #f8f9fa; border-radius: 4px; color: #495057; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace;">
      ${resetUrl}
    </p>
    
    ${alertBox('warning', 'This link will expire in 15 minutes for security purposes.')}
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; border: 1px solid #dee2e6;">
          <p style="margin: 0 0 12px; color: #212529; font-size: 14px; font-weight: 600;">
            🛡️ Security Tips:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
            <li>Never share this link with anyone</li>
            <li>We will never ask for your password via email</li>
            <li>If you didn't request this, please ignore this email</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <p style="margin: 24px 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Password Changed Notification Template
 */
export function passwordChangedEmailTemplate(
  username: string,
  timestamp: string,
  ipAddress: string | null
): string {
  const content = `
    <h2 style="margin: 0 0 16px; color: #212529; font-size: 24px; font-weight: 600;">
      ✅ Password Successfully Changed
    </h2>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hi <strong>${username}</strong>,
    </p>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Your password was successfully changed on <strong>${timestamp}</strong>.
    </p>
    
    ${ipAddress ? `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="background-color: #f8f9fa; padding: 16px; border-radius: 4px;">
            <p style="margin: 0; color: #495057; font-size: 14px;">
              <strong>IP Address:</strong> <code style="background-color: #e9ecef; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace;">${ipAddress}</code>
            </p>
          </td>
        </tr>
      </table>
    ` : ''}
    
    ${alertBox('success', 'If you made this change, no further action is needed. All active sessions have been logged out for your security.')}
    
    ${alertBox('danger', `If you did NOT make this change:<br><br>
      <ol style="margin: 8px 0; padding-left: 20px;">
        <li>Someone may have unauthorized access to your account</li>
        <li>Contact our support team immediately at <a href="mailto:admin@fotolokashen.com" style="color: #dc3545;">admin@fotolokashen.com</a></li>
        <li>We recommend securing your email account as well</li>
      </ol>
    `)}
    
    <p style="margin: 24px 0 0; color: #6c757d; font-size: 13px; line-height: 1.6;">
      This is an automated security notification to keep your account safe.
    </p>
  `;

  return emailWrapper(content);
}

/**
 * Account Deletion Notification Template
 */
export function accountDeletionEmailTemplate(username: string, email: string): string {
  const content = `
    <h2 style="margin: 0 0 16px; color: #212529; font-size: 24px; font-weight: 600;">
      Account Deletion Confirmation
    </h2>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      Hi <strong>${username}</strong>,
    </p>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      We have successfully deleted your account <strong>${email}</strong> from ${BRAND_NAME}.
    </p>
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 24px 0;">
      <tr>
        <td style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 20px; border-radius: 4px;">
          <p style="margin: 0 0 12px; color: #212529; font-size: 15px; font-weight: 600;">
            📦 What was deleted:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #495057; font-size: 14px; line-height: 1.8;">
            <li>Your profile and account information</li>
            <li>All uploaded photos and images</li>
            <li>All locations and saved places</li>
            <li>All session data and preferences</li>
            <li>All production notes and metadata</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 16px; color: #495057; font-size: 16px; line-height: 1.6;">
      We're sorry to see you go! If you change your mind, you're always welcome to create a new account.
    </p>
    
    ${emailButton(`${APP_URL}/register`, 'Create New Account', 'secondary')}
    
    <p style="margin: 24px 0 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
      If you have any questions or feedback, please don't hesitate to reach out to us at 
      <a href="mailto:admin@fotolokashen.com" style="color: ${BRAND_COLOR}; text-decoration: none;">admin@fotolokashen.com</a>.
    </p>
    
    <p style="margin: 16px 0 0; color: #495057; font-size: 15px; font-weight: 500;">
      - The ${BRAND_NAME} Team
    </p>
  `;

  return emailWrapper(content);
}
