/**
 * Email Template System
 * Consistent, responsive HTML email templates for Fotolokashen
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const SUPPORT_EMAIL = process.env.EMAIL_REPLY_TO || process.env.EMAIL_FROM_ADDRESS || 'support@fotolokashen.com';
const BRAND_NAME = 'Fotolokashen';

const COLORS = {
  pageBackground: '#f5f5f5',
  cardBackground: '#ffffff',
  footerBackground: '#f8fafc',
  border: '#dbe3ec',
  borderStrong: '#c5d1de',
  primary: '#0f172b',
  primarySoft: '#1f2937',
  text: '#111111',
  muted: '#62748e',
  buttonPrimary: '#0f172b',
  buttonSecondaryBg: '#ffffff',
  buttonSecondaryText: '#0f172b',
  info: '#3b82f6',
  infoSoft: '#e9f2ff',
  success: '#10b981',
  successSoft: '#e8faf3',
  warning: '#f59e0b',
  warningSoft: '#fff6e6',
  danger: '#dc2626',
  dangerSoft: '#fdecec',
};

/**
 * Base email template wrapper.
 * Keeps a strong visual alignment with app surfaces and typography.
 */
function emailWrapper(content: string, preheader = `${BRAND_NAME} notification`): string {
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
    body, table, td, p, a, h1, h2, h3, h4 {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.pageBackground}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: ${COLORS.text};">
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
    ${preheader}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLORS.pageBackground};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: ${COLORS.cardBackground}; border: 1px solid ${COLORS.border}; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background-color: ${COLORS.primary}; padding: 28px 32px 22px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="left">
                    <p style="margin: 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #f5f5f5; opacity: 0.85;">
                      Production Location Platform
                    </p>
                    <h1 style="margin: 10px 0 0; color: #f5f5f5; font-size: 28px; line-height: 1.2; font-weight: 700; letter-spacing: -0.4px;">
                      ${BRAND_NAME}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="padding: 24px 32px 28px; background-color: ${COLORS.footerBackground}; border-top: 1px solid ${COLORS.border};">
              <p style="margin: 0 0 12px; color: ${COLORS.muted}; font-size: 13px; line-height: 1.6;">
                Need help? Reach us at
                <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.primary}; text-decoration: none;">${SUPPORT_EMAIL}</a>.
              </p>
              <p style="margin: 0; color: ${COLORS.muted}; font-size: 12px; line-height: 1.6;">
                <a href="${APP_URL}" style="color: ${COLORS.primary}; text-decoration: none;">Open ${BRAND_NAME}</a>
                &nbsp;|&nbsp;
                <a href="${APP_URL}/privacy-policy" style="color: ${COLORS.primary}; text-decoration: none;">Privacy Policy</a>
              </p>
              <p style="margin: 10px 0 0; color: ${COLORS.muted}; font-size: 12px; line-height: 1.6;">
                Copyright ${new Date().getFullYear()} ${BRAND_NAME}. Automated message.
              </p>
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
 * Button component for emails.
 */
function emailButton(url: string, text: string, style: 'primary' | 'secondary' = 'primary'): string {
  const isPrimary = style === 'primary';
  const bgColor = isPrimary ? COLORS.buttonPrimary : COLORS.buttonSecondaryBg;
  const textColor = isPrimary ? '#f5f5f5' : COLORS.buttonSecondaryText;
  const border = isPrimary ? 'none' : `1px solid ${COLORS.primary}`;

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 10px; background-color: ${bgColor}; border: ${border};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 15px; line-height: 1.2; font-weight: 600; color: ${textColor}; text-decoration: none; border-radius: 10px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Highlight box component.
 */
function alertBox(type: 'info' | 'warning' | 'success' | 'danger', content: string): string {
  const colors = {
    info: { bg: COLORS.infoSoft, border: COLORS.info, text: '#1e3a8a', label: 'Info' },
    warning: { bg: COLORS.warningSoft, border: COLORS.warning, text: '#92400e', label: 'Security Notice' },
    success: { bg: COLORS.successSoft, border: COLORS.success, text: '#065f46', label: 'Update' },
    danger: { bg: COLORS.dangerSoft, border: COLORS.danger, text: '#7f1d1d', label: 'Action Required' },
  };

  const color = colors[type];

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="background-color: ${color.bg}; border-left: 4px solid ${color.border}; padding: 14px 16px; border-radius: 8px;">
          <p style="margin: 0; color: ${color.text}; font-size: 14px; line-height: 1.6;">
            <strong>${color.label}:</strong> ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Plain URL block for clients that do not render buttons.
 */
function urlBlock(url: string): string {
  return `
    <p style="margin: 8px 0 0; color: ${COLORS.muted}; font-size: 13px; line-height: 1.6;">
      If the button does not work, copy and paste this URL:
    </p>
    <p style="margin: 8px 0 0; padding: 12px; border: 1px solid ${COLORS.border}; border-radius: 8px; background-color: ${COLORS.footerBackground}; color: ${COLORS.primarySoft}; font-size: 12px; line-height: 1.6; word-break: break-all; font-family: 'Courier New', monospace;">
      ${url}
    </p>
  `;
}

/**
 * Key/value details block for event metadata.
 */
function detailsTable(rows: Array<{ label: string; value: string }>): string {
  const rowsHtml = rows
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding: 8px 10px 8px 0; width: 140px; color: ${COLORS.muted}; font-size: 13px; line-height: 1.5; vertical-align: top;">${label}</td>
          <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 14px; line-height: 1.5; border-bottom: 1px solid ${COLORS.border};">${value}</td>
        </tr>
      `
    )
    .join('');

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid ${COLORS.border}; border-radius: 10px; background-color: ${COLORS.footerBackground}; padding: 12px 14px;">
      ${rowsHtml}
    </table>
  `;
}

/**
 * Verification Email Template
 */
export function verificationEmailTemplate(username: string, verificationUrl: string): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Confirm your email address
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${username}</strong>,
    </p>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      A new ${BRAND_NAME} account was created with this email address. Confirm your email to activate access.
    </p>

    ${emailButton(verificationUrl, 'Confirm Email', 'primary')}

    ${urlBlock(verificationUrl)}

    ${alertBox('info', 'For security, this link expires in 30 minutes.')}

    <p style="margin: 18px 0 0; color: ${COLORS.muted}; font-size: 14px; line-height: 1.7;">
      If you did not sign up, you can safely ignore this message.
    </p>
  `;

  return emailWrapper(content, 'Confirm your email to activate your account.');
}

/**
 * Welcome Email Template (Post-Verification)
 */
export function welcomeToEmailTemplate(username: string): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Welcome to ${BRAND_NAME}
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${username}</strong>, your email is confirmed and your account is ready.
    </p>

    <p style="margin: 0 0 12px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Start fast with your production workflow:
    </p>

    <ul style="margin: 0 0 14px; padding-left: 20px; color: ${COLORS.text}; font-size: 15px; line-height: 1.8;">
      <li>Save your first location with notes and tags</li>
      <li>Upload reference photos and organize context</li>
      <li>Share location links with your team</li>
    </ul>

    ${emailButton(`${APP_URL}/locations`, 'Open Locations', 'primary')}

    ${alertBox('success', 'Your account is active and ready for production use.')}
  `;

  return emailWrapper(content, 'Your account is active. Start creating locations now.');
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmailTemplate(username: string, resetUrl: string): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Reset your password
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${username}</strong>,
    </p>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      We received a request to reset your password. Use the button below to create a new password.
    </p>

    ${emailButton(resetUrl, 'Reset Password', 'primary')}

    ${urlBlock(resetUrl)}

    ${alertBox('warning', 'This reset link expires in 15 minutes.')}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="border: 1px solid ${COLORS.borderStrong}; border-radius: 10px; background-color: ${COLORS.footerBackground}; padding: 14px 16px;">
          <p style="margin: 0 0 10px; color: ${COLORS.primary}; font-size: 14px; font-weight: 700;">Security reminders</p>
          <ul style="margin: 0; padding-left: 20px; color: ${COLORS.text}; font-size: 14px; line-height: 1.8;">
            <li>Never share this link with anyone</li>
            <li>We never ask for passwords by email</li>
            <li>If this was not you, ignore this email</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(content, 'Use this secure link to reset your password.');
}

/**
 * Password Changed Notification Template
 */
export function passwordChangedEmailTemplate(
  username: string,
  timestamp: string,
  ipAddress: string | null
): string {
  const rows = [{ label: 'Changed at', value: timestamp }];

  if (ipAddress) {
    rows.push({
      label: 'IP address',
      value: `<span style="font-family: 'Courier New', monospace; background-color: #e2e8f0; padding: 1px 6px; border-radius: 5px;">${ipAddress}</span>`,
    });
  }

  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Password updated
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${username}</strong>, your password was changed successfully.
    </p>

    ${detailsTable(rows)}

    ${alertBox('success', 'If this was you, no further action is needed. Active sessions were signed out for security.')}

    ${alertBox(
      'danger',
      `If this was not you, secure your account immediately:<ol style="margin: 8px 0 0; padding-left: 20px;"><li>Reset your password now</li><li>Secure your email account</li><li>Contact support at <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.danger}; text-decoration: none;">${SUPPORT_EMAIL}</a></li></ol>`
    )}
  `;

  return emailWrapper(content, 'Your password has been changed. Review this activity now.');
}

/**
 * Account Deletion Notification Template
 */
export function accountDeletionEmailTemplate(username: string, email: string): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Account deletion confirmation
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${username}</strong>,
    </p>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      We deleted account <strong>${email}</strong> from ${BRAND_NAME}.
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="border: 1px solid ${COLORS.borderStrong}; border-radius: 10px; background-color: ${COLORS.footerBackground}; padding: 14px 16px;">
          <p style="margin: 0 0 10px; color: ${COLORS.primary}; font-size: 14px; font-weight: 700;">Removed data</p>
          <ul style="margin: 0; padding-left: 20px; color: ${COLORS.text}; font-size: 14px; line-height: 1.8;">
            <li>Profile and account details</li>
            <li>Uploaded photos and assets</li>
            <li>Saved locations and notes</li>
            <li>Session and preference data</li>
          </ul>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 14px; color: ${COLORS.muted}; font-size: 14px; line-height: 1.7;">
      If you deleted this account by mistake, you can register again anytime.
    </p>

    ${emailButton(`${APP_URL}/register`, 'Create New Account', 'secondary')}
  `;

  return emailWrapper(content, 'Your account was deleted from Fotolokashen.');
}

/**
 * Public Support Request Template (sent to admin)
 */
export function publicSupportRequestTemplate(
  name: string,
  email: string,
  subject: string,
  message: string
): string {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'long',
  });

  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.2px;">
      New public support request
    </h2>

    ${detailsTable([
      { label: 'From', value: name },
      { label: 'Email', value: `<a href="mailto:${email}" style="color: ${COLORS.primary}; text-decoration: none;">${email}</a>` },
      { label: 'Subject', value: subject },
      { label: 'Received', value: timestamp },
    ])}

    <h3 style="margin: 20px 0 8px; color: ${COLORS.primary}; font-size: 17px; line-height: 1.3; font-weight: 700;">
      Message
    </h3>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0;">
      <tr>
        <td style="background-color: ${COLORS.footerBackground}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 14px 16px; white-space: pre-wrap; word-break: break-word; color: ${COLORS.text}; font-size: 14px; line-height: 1.7;">
${message}
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(content, `New public support request: ${subject}`);
}

/**
 * Member Support Request Template (sent to admin)
 */
export function memberSupportRequestTemplate(
  name: string,
  email: string,
  subject: string,
  message: string,
  username: string
): string {
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'long',
  });

  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.2px;">
      New member support request
    </h2>

    ${detailsTable([
      { label: 'From', value: name },
      { label: 'Username', value: `@${username}` },
      { label: 'Email', value: `<a href="mailto:${email}" style="color: ${COLORS.primary}; text-decoration: none;">${email}</a>` },
      { label: 'Subject', value: subject },
      { label: 'Received', value: timestamp },
    ])}

    <h3 style="margin: 20px 0 8px; color: ${COLORS.primary}; font-size: 17px; line-height: 1.3; font-weight: 700;">
      Message
    </h3>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0;">
      <tr>
        <td style="background-color: ${COLORS.footerBackground}; border: 1px solid ${COLORS.border}; border-radius: 10px; padding: 14px 16px; white-space: pre-wrap; word-break: break-word; color: ${COLORS.text}; font-size: 14px; line-height: 1.7;">
${message}
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(content, `New member support request: ${subject}`);
}

/**
 * Support Confirmation Template (sent to user)
 */
export function supportConfirmationTemplate(name: string, subject: string): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.primary}; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.2px;">
      We received your support request
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${name}</strong>, thanks for contacting ${BRAND_NAME} support.
    </p>

    <p style="margin: 0 0 10px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      We logged your request with this subject:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 18px;">
      <tr>
        <td style="background-color: ${COLORS.footerBackground}; border: 1px solid ${COLORS.border}; border-left: 4px solid ${COLORS.primary}; border-radius: 10px; padding: 12px 14px; color: ${COLORS.text}; font-size: 15px; font-weight: 600; line-height: 1.6;">
          ${subject}
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 10px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Our team usually responds within <strong>24 to 48 hours</strong>.
    </p>

    ${alertBox('info', 'If you need to add details, reply to this email and we will include your update in the same thread.')}

    ${emailButton(`${APP_URL}/member-support`, 'Open Support Center', 'secondary')}
  `;

  return emailWrapper(content, 'Your support request has been received.');
}