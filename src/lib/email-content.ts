/**
 * Email Content
 *
 * Single source of truth for all transactional email subjects and HTML bodies.
 * New code should import from here. `email-templates.ts` is the legacy file
 * that will be removed in Phase 2 of the email simplification.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const SUPPORT_EMAIL =
  process.env.EMAIL_REPLY_TO ||
  process.env.EMAIL_FROM_ADDRESS ||
  "support@fotolokashen.com";
const BRAND_NAME = "Fotolokashen";

// ── Subject lines ─────────────────────────────────────────────────────────────

export const EMAIL_SUBJECTS = {
  verification: "Verify Email for Fotolokashen",
  welcome: "Email Confirmed - Welcome to Fotolokashen!",
  password_reset: "Reset Password",
  password_changed: "Password Updated",
  account_deletion: "We Deleted Your Fotolokashen Account",
} as const;

// ── Design tokens ─────────────────────────────────────────────────────────────

const COLORS = {
  pageBackground: "#ffffff", //out body background
  cardBackground: "#f5f5f5", //body
  otherBackground: "#FFFCEB", // other background
  footerBackground: "#ffffff", // footer background

  border: "#dbe3ec",
  borderStrong: "#c5d1de",

  primary: "#5038F5", // brand color
  primarySoft: "#2a1d7f", // mono step down

  text: "#111111",
  muted: "#111111",

  buttonPrimary: "#0f172b",
  buttonSecondaryBg: "#ffffff",
  buttonSecondaryText: "#0f172b",

  successBright: "#379153",

  info: "#3b82f6",
  infoSoft: "#e9f2ff",

  success: "#10b981",
  successSoft: "#e8faf3",
  warning: "#f59e0b",
  warningSoft: "#fff6e6",

  danger: "#dc2626",
  dangerSoft: "#fdecec",
  buttonGradientImage: "linear-gradient(#08C745, #379153)",

  headerBgGradientImage: "linear-gradient(#5038F5, #2a1d7f)",
};

// ── Layout primitives ─────────────────────────────────────────────────────────

function emailWrapper(
  content: string,
  preheader = `${BRAND_NAME} notification`,
): string {
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
    body, table, td, p, a, h1, h2, h3, h4 {
          font-family: Arial, Helvetica, sans-serif !important;
        }
  </style>
  <![endif]-->
</head>
<!-- Body -->
<body style="margin: 0; padding: 0; background-color: ${COLORS.pageBackground}; 
font-family: Arial, Helvetica, sans-serif !important; color: ${COLORS.text};">

  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">
    ${preheader}
  </div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLORS.pageBackground};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: ${COLORS.cardBackground}; border: 1px solid ${COLORS.border}; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background-color: ${COLORS.primary}; background-image: ${COLORS.headerBgGradientImage}; padding: 28px 32px 22px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="left">
                    <!-- alt text is the fallback when images are blocked -->
                    <img src="${APP_URL}/logo.png" alt="${BRAND_NAME} - Production Knowledge" width="300" height="78" style="display: block; border: 0; outline: none; text-decoration: none; height: auto; max-width: 280px; font-size: 20px; font-weight: 700; color: #f5f5f5;">
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
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="vertical-align: top;">
                    <p style="margin: 0 0 12px; color: ${COLORS.text}; font-size: 13px; line-height: 1.6;">
                      Need help? Reach us at
                      <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.text}; text-decoration: none;">${SUPPORT_EMAIL}</a>.
                    </p>
                    <p style="margin: 0; color: ${COLORS.text}; font-size: 12px; line-height: 1.6;">
                      <a href="${APP_URL}" style="color: ${COLORS.text}; text-decoration: none;">Open ${BRAND_NAME}</a>
                      &nbsp;|&nbsp;
                      <a href="${APP_URL}/privacy-policy" style="color: ${COLORS.text}; text-decoration: none;">Privacy Policy</a>
                    </p>
                    <p style="margin: 10px 0 0; color: ${COLORS.text}; font-size: 12px; line-height: 1.6;">
                      Copyright ${new Date().getFullYear()} ${BRAND_NAME}. This message is automated. Please do not reply.
                    </p>
                  </td>
                  <td style="vertical-align: top; text-align: right; padding-left: 16px; width: 44px;">
                    <a href="https://apps.apple.com/us/app/fotolokashen/id6757991683" target="_blank">
                      <img src="${APP_URL}/AppIcon.png" alt="${BRAND_NAME} - Download on the App Store" width="44" height="44" style="display: block; border: 0; outline: none; text-decoration: none; border-radius: 10px;">
                    </a>
                  </td>
                </tr>
              </table>
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

function emailButton(url: string, text: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
      <tr>
        <td style="border-radius: 10px; background-color: ${COLORS.successBright}; background-image: ${COLORS.buttonGradientImage}; border: none;">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 12px 24px; font-size: 15px; letter-spacing: 0.05em; line-height: 1.2; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

function alertBox(
  type: "info" | "warning" | "success" | "danger",
  content: string,
): string {
  const colors = {
    info: {
      bg: COLORS.infoSoft,
      border: COLORS.info,
      text: "#1e3a8a",
      label: "",
    },
    warning: {
      bg: COLORS.warningSoft,
      border: COLORS.warning,
      text: "#92400e",
      label: "Note:",
    },
    success: {
      bg: COLORS.successSoft,
      border: COLORS.success,
      text: "#065f46",
      label: "Update:",
    },
    danger: {
      bg: COLORS.dangerSoft,
      border: COLORS.danger,
      text: "#7f1d1d",
      label: "Action Required:",
    },
  };
  const color = colors[type];

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="background-color: ${color.bg}; border-left: 4px solid ${color.border}; padding: 14px 16px; border-radius: 8px;">
          <p style="margin: 0; color: ${color.text}; font-size: 14px; line-height: 1.6;">
            <strong>${color.label}</strong> ${content}
          </p>
        </td>
      </tr>
    </table>
  `;
}

function urlBlock(url: string): string {
  return `
    <p style="margin: 8px 0 0; color: ${COLORS.muted}; font-size: 13px; line-height: 1.6;">
    Copy/Paste this URL:
    </p>
    <p style="margin: 8px 0 0; padding: 12px; border: 1px solid ${COLORS.border}; border-radius: 8px; background-color: ${COLORS.otherBackground}; color: ${COLORS.text}; font-size: 12px; line-height: 1.6; word-break: break-all; font-family: 'Courier New', monospace;">
      ${url}
    </p>
  `;
}

function detailsTable(rows: Array<{ label: string; value: string }>): string {
  const rowsHtml = rows
    .map(
      ({ label, value }) => `
        <tr>
          <td style="padding: 8px 10px 8px 0; width: 140px; color: ${COLORS.text}; font-size: 13px; line-height: 1.5; vertical-align: top;">${label}</td>
          <td style="padding: 8px 0; color: ${COLORS.text}; font-size: 14px; line-height: 1.5; border-bottom: 1px solid ${COLORS.border};">${value}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0; border: 1px solid ${COLORS.border}; border-radius: 10px; background-color: ${COLORS.footerBackground}; padding: 12px 14px;">
      ${rowsHtml}
    </table>
  `;
}

// ── Transactional email templates ─────────────────────────────────────────────

export function verificationEmailTemplate(
  username: string,
  verificationUrl: string,
  email: string,
): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Confirm your email
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hey there <strong>${username}</strong>,
    </p>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      We created your ${BRAND_NAME} account, the next step is to confirm your email below. This link will expire in 30 minutes. </p>

      <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
        Login: <strong>${email}</strong></p>

    <!-- ${alertBox("info", "For security, this link expires in 30 minutes.")} --> 

    ${emailButton(verificationUrl, "Confirm Email")}

    ${urlBlock(verificationUrl)}

    <!--
    <p style="margin: 18px 0 0; color: ${COLORS.text}; font-size: 14px; line-height: 1.7;">
      If you do not recognize this action, ignore this message.
    </p>
    -->

  `;

  return emailWrapper(content, "Confirm your email to activate your account.");
}

export function welcomeToEmailTemplate(username: string): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Welcome to ${BRAND_NAME}
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Welcome <strong>${username}</strong>, <br />
       Your account is confirmed and ready.
    </p>

    <p style="margin: 0 0 12px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
    Start adding Production Knowledge:
    </p>

    <ul style="margin: 0 0 14px; padding-left: 20px; color: ${COLORS.text}; font-size: 15px; line-height: 1.8;">
    <li>Add a production spot in snap & save</li>
    <li>Use a photo to create the location</li>
    <li>Connect with your team and share those spots</li>
    </ul>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 18px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 10px;">
          <a href="https://apps.apple.com/us/app/fotolokashen/id6757991683" target="_blank">
            <img src="${APP_URL}/AppIcon.png" alt="${BRAND_NAME} - Download on the App Store" width="44" height="44" style="display: block; border: 0; outline: none; text-decoration: none; border-radius: 10px;">
          </a>
        </td>
        <td style="vertical-align: middle;">
          <a href="https://apps.apple.com/us/app/fotolokashen/id6757991683" target="_blank" style="color: ${COLORS.text}; font-size: 15px; font-weight: 600; text-decoration: none;">
            Download for iOS
          </a>
        </td>
      </tr>
    </table>

    ${emailButton(`${APP_URL}/locations`, "To Fotolokashen")}

    <!-- ${alertBox("success", "Your account is active and ready for production use.")} --> 
  `;

  return emailWrapper(
    content,
    "Your account is active. Start creating locations now.",
  );
}

export function passwordResetEmailTemplate(
  username: string,
  resetUrl: string,
): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Reset Your Password
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hello <strong>${username}</strong>,
    </p>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      We received a request to reset your password. Use the button below to create a new password.
    </p>

    ${emailButton(resetUrl, "Reset Password")}

    ${urlBlock(resetUrl)}

    ${alertBox("warning", "This reset link expires in 15 minutes.")}

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="border: 1px solid ${COLORS.borderStrong}; border-radius: 10px; background-color: ${COLORS.footerBackground}; padding: 14px 16px;">
          <p style="margin: 0 0 10px; color: ${COLORS.text}; font-size: 14px; font-weight: 700;">Security Reminder:</p>
          <ul style="margin: 0; padding-left: 20px; color: ${COLORS.text}; font-size: 14px; line-height: 1.8;">
            <li>Never share this link with anyone</li>
            <li>We never ask for passwords by email</li>
            <li>If this was not you, ignore this email</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(content, "Use this secure link to reset your password.");
}

export function passwordChangedEmailTemplate(
  username: string,
  timestamp: string,
  ipAddress: string | null,
): string {
  const rows = [{ label: "Changed at", value: timestamp }];

  if (ipAddress) {
    rows.push({
      label: "IP address",
      value: `<span style="font-family: 'Courier New', monospace; background-color: #e2e8f0; padding: 1px 6px; border-radius: 5px;">${ipAddress}</span>`,
    });
  }

  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Password Updated
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${username}</strong>, your password was changed successfully.
    </p>

    ${detailsTable(rows)}

    ${alertBox("success", "If this was you, no further action is needed. </br> Active sessions were signed out for security.")}

    ${alertBox(
      "danger",
      `If this was not you, secure your account immediately:<ol style="margin: 8px 0 0; padding-left: 20px;"><li>Reset your password now</li><li>Secure your email account</li><li>Contact support at <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.text}; text-decoration: none;">${SUPPORT_EMAIL}</a></li></ol>`,
    )}
  `;

  return emailWrapper(
    content,
    "Your password was updated. Review this activity now.",
  );
}

export function accountDeletionEmailTemplate(
  username: string,
  email: string,
): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 26px; line-height: 1.25; font-weight: 700; letter-spacing: -0.3px;">
      Account Deleted
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${username}</strong>,
    </p>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      We know sometimes things don't click. You are welcome back anytime. We deleted your account: <strong>${email}</strong> from ${BRAND_NAME}. 
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 20px 0;">
      <tr>
        <td style="border: 1px solid ${COLORS.borderStrong}; border-radius: 10px; background-color: ${COLORS.footerBackground}; padding: 14px 16px;">
          <p style="margin: 0 0 10px; color: ${COLORS.text}; font-size: 14px; font-weight: 700;">Removed Data</p>
          <ul style="margin: 0; padding-left: 20px; color: ${COLORS.text}; font-size: 14px; line-height: 1.8;">
            <li>Profile and account details</li>
            <li>Uploaded photos and assets</li>
            <li>Saved locations and notes</li>
            <li>Session and preference data</li>
          </ul>
        </td>
      </tr>
    </table>
  `;

  return emailWrapper(content, "Your account was deleted from Fotolokashen.");
}

export function publicSupportRequestTemplate(
  name: string,
  email: string,
  subject: string,
  message: string,
): string {
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "long",
  });

  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.2px;">
      External Support Request
    </h2>

    ${detailsTable([
      { label: "From", value: name },
      {
        label: "Email",
        value: `<a href="mailto:${email}" style="color: ${COLORS.text}; text-decoration: none;">${email}</a>`,
      },
      { label: "Subject", value: subject },
      { label: "Received", value: timestamp },
    ])}

    <h3 style="margin: 20px 0 8px; color: ${COLORS.text}; font-size: 17px; line-height: 1.3; font-weight: 700;">
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

export function memberSupportRequestTemplate(
  name: string,
  email: string,
  subject: string,
  message: string,
  username: string,
): string {
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "full",
    timeStyle: "long",
  });

  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.2px;">
      Member Support Request
    </h2>

    ${detailsTable([
      { label: "From", value: name },
      { label: "Username", value: `@${username}` },
      {
        label: "Email",
        value: `<a href="mailto:${email}" style="color: ${COLORS.text}; text-decoration: none;">${email}</a>`,
      },
      { label: "Subject", value: subject },
      { label: "Received", value: timestamp },
    ])}

    <h3 style="margin: 20px 0 8px; color: ${COLORS.text}; font-size: 17px; line-height: 1.3; font-weight: 700;">
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

  return emailWrapper(content, `Member support request: ${subject}`);
}

export function supportConfirmationTemplate(
  name: string,
  subject: string,
): string {
  const content = `
    <h2 style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.2px;">
      Support Request Received
    </h2>

    <p style="margin: 0 0 14px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Hi <strong>${name}</strong>, thanks for contacting ${BRAND_NAME} support.
    </p>

    <p style="margin: 0 0 10px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      We logged your request with this subject:
    </p>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 18px;">
      <tr>
        <td style="background-color: ${COLORS.footerBackground}; border: 1px solid ${COLORS.border}; border-left: 4px solid ${COLORS.text}; border-radius: 10px; padding: 12px 14px; color: ${COLORS.text}; font-size: 15px; font-weight: 600; line-height: 1.6;">
          ${subject}
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 10px; color: ${COLORS.text}; font-size: 15px; line-height: 1.7;">
      Our team usually responds within <strong>24 to 48 hours</strong>.
    </p>
  `;

  return emailWrapper(content, "We received your support request.");
}
