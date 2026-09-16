import { NextRequest } from "next/server";
import { requireAdmin, apiResponse, apiError } from "@/lib/api-middleware";
import { env } from "@/lib/env";
import {
  EMAIL_SUBJECTS,
  verificationEmailTemplate,
  welcomeToEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
  publicSupportRequestTemplate,
  memberSupportRequestTemplate,
  supportConfirmationTemplate,
} from "@/lib/email-content";

// Sample data only — renders the real email-content.ts templates for branding review.
const APP_URL = env.NEXT_PUBLIC_APP_URL;

const TEMPLATES = {
  verification: {
    label: "Verify Email",
    subject: EMAIL_SUBJECTS.verification,
    html: () =>
      verificationEmailTemplate(
        "Jordan",
        `${APP_URL}/verify-email?token=sample-token`,
        "jordan@example.com",
      ),
  },
  welcome: {
    label: "Welcome",
    subject: EMAIL_SUBJECTS.welcome,
    html: () => welcomeToEmailTemplate("Jordan"),
  },
  password_reset: {
    label: "Password Reset",
    subject: EMAIL_SUBJECTS.password_reset,
    html: () =>
      passwordResetEmailTemplate(
        "Jordan",
        `${APP_URL}/reset-password?token=sample-token`,
      ),
  },
  password_changed: {
    label: "Password Changed",
    subject: EMAIL_SUBJECTS.password_changed,
    html: () =>
      passwordChangedEmailTemplate(
        "Jordan",
        new Date().toLocaleString("en-US", {
          dateStyle: "long",
          timeStyle: "short",
        }),
        "192.168.1.42",
      ),
  },
  account_deletion: {
    label: "Account Deletion",
    subject: EMAIL_SUBJECTS.account_deletion,
    html: () => accountDeletionEmailTemplate("Jordan", "jordan@example.com"),
  },
  public_support_request: {
    label: "Public Support Request (internal)",
    subject: "New public support request: Cannot upload photos",
    html: () =>
      publicSupportRequestTemplate(
        "Alex Rivera",
        "alex@example.com",
        "Cannot upload photos",
        "Photos fail to upload on the create-with-photo page.",
      ),
  },
  member_support_request: {
    label: "Member Support Request (internal)",
    subject: "New member support request: Cannot upload photos",
    html: () =>
      memberSupportRequestTemplate(
        "Alex Rivera",
        "alex@example.com",
        "Cannot upload photos",
        "Photos fail to upload on the create-with-photo page.",
        "alexr",
      ),
  },
  support_confirmation: {
    label: "Support Confirmation",
    subject: "We received your support request",
    html: () =>
      supportConfirmationTemplate("Alex Rivera", "Cannot upload photos"),
  },
} as const;

export type EmailPreviewTemplateKey = keyof typeof TEMPLATES;

/**
 * GET /api/admin/email-preview
 * - No `template` param: list available templates (key, label, subject)
 * - `?template=<key>`: render that template's real HTML from email-content.ts
 * Admin only.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (!authResult.authorized) {
    return apiError(authResult.error || "Unauthorized", 401);
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("template");

  if (!key) {
    const templates = Object.entries(TEMPLATES).map(([value, t]) => ({
      value,
      label: t.label,
      subject: t.subject,
    }));
    return apiResponse({ templates });
  }

  if (!(key in TEMPLATES)) {
    return apiError("Unknown template", 400);
  }

  const template = TEMPLATES[key as EmailPreviewTemplateKey];
  return apiResponse({
    html: template.html(),
    subject: template.subject,
    label: template.label,
  });
}
