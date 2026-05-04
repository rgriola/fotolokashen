import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import {
  verificationEmailTemplate,
  welcomeToEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
  publicSupportRequestTemplate,
  memberSupportRequestTemplate,
  supportConfirmationTemplate,
} from '@/lib/email-templates';

/**
 * POST /api/admin/email-templates/seed
 * Seed default email templates into the database
 * Super admin only - safe to run multiple times (idempotent)
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  // Super admin only
  if (authResult.user.role !== 'super_admin') {
    return apiError('Super admin access required', 403);
  }

  try {
    const templates = [
      {
        key: 'verification',
        name: 'Email Verification',
        description: 'Email sent to new users to verify their email address',
        category: 'system',
        subject: 'Confirm your email address',
        htmlBody: verificationEmailTemplate('{{username}}', '{{verificationUrl}}'),
        requiredVariables: ['username', 'verificationUrl'],
        isDefault: true,
      },
      {
        key: 'welcome',
        name: 'Welcome Email',
        description: 'Welcome email sent after email verification',
        category: 'system',
        subject: 'Email Confirmed - Welcome to Fotolokashen!',
        htmlBody: welcomeToEmailTemplate('{{username}}'),
        requiredVariables: ['username'],
        isDefault: true,
      },
      {
        key: 'password_reset',
        name: 'Password Reset',
        description: 'Email sent when user requests password reset',
        category: 'system',
        subject: 'Reset your password',
        htmlBody: passwordResetEmailTemplate('{{username}}', '{{resetUrl}}'),
        requiredVariables: ['username', 'resetUrl'],
        isDefault: true,
      },
      {
        key: 'password_changed',
        name: 'Password Changed Notification',
        description: 'Notification sent after password is successfully changed',
        category: 'system',
        subject: 'Your Password Was Changed',
        htmlBody: passwordChangedEmailTemplate('{{username}}', '{{timestamp}}', '{{ipAddress}}'),
        requiredVariables: ['username', 'timestamp', 'ipAddress'],
        isDefault: true,
      },
      {
        key: 'account_deletion',
        name: 'Account Deletion Confirmation',
        description: 'Confirmation email sent when account is deleted',
        category: 'system',
        subject: 'We deleted your Fotolokashen account',
        htmlBody: accountDeletionEmailTemplate('{{username}}', '{{email}}'),
        requiredVariables: ['username', 'email'],
        isDefault: true,
      },
      {
        key: 'support_request_public',
        name: 'Public Support Request (Admin)',
        description: 'Email sent to admin when public support form is submitted',
        category: 'support',
        subject: '[Support] {{subject}}',
        htmlBody: publicSupportRequestTemplate('{{name}}', '{{email}}', '{{subject}}', '{{message}}'),
        requiredVariables: ['name', 'email', 'subject', 'message'],
        isDefault: true,
      },
      {
        key: 'support_request_member',
        name: 'Member Support Request (Admin)',
        description: 'Email sent to admin when member support form is submitted',
        category: 'support',
        subject: '[Member Support] {{subject}}',
        htmlBody: memberSupportRequestTemplate('{{name}}', '{{email}}', '{{subject}}', '{{message}}', '{{username}}'),
        requiredVariables: ['name', 'email', 'subject', 'message', 'username'],
        isDefault: true,
      },
      {
        key: 'support_confirmation',
        name: 'Support Request Confirmation',
        description: 'Confirmation email sent to user after support request',
        category: 'support',
        subject: 'Your Support Request Has Been Received',
        htmlBody: supportConfirmationTemplate('{{name}}', '{{subject}}'),
        requiredVariables: ['name', 'subject'],
        isDefault: true,
      },
    ];

    const results = {
      created: [] as string[],
      updated: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    for (const template of templates) {
      try {
        const existing = await prisma.emailTemplate.findUnique({
          where: { key: template.key },
        });

        if (existing) {
          if (!existing.isDefault) {
            results.skipped.push(template.key);
            continue;
          }

          const existingRequiredVariables = Array.isArray(existing.requiredVariables)
            ? existing.requiredVariables.map(String)
            : [];
          const requiredVariablesChanged =
            JSON.stringify(existingRequiredVariables) !== JSON.stringify(template.requiredVariables);

          const hasChanges =
            existing.name !== template.name ||
            existing.description !== template.description ||
            existing.category !== template.category ||
            existing.subject !== template.subject ||
            existing.htmlBody !== template.htmlBody ||
            requiredVariablesChanged;

          if (!hasChanges) {
            results.skipped.push(template.key);
            continue;
          }

          const nextVersion = existing.version + 1;

          const updatedTemplate = await prisma.emailTemplate.update({
            where: { id: existing.id },
            data: {
              ...template,
              version: nextVersion,
              updatedBy: authResult.user.id,
            },
          });

          await prisma.emailTemplateVersion.create({
            data: {
              templateId: updatedTemplate.id,
              version: updatedTemplate.version,
              subject: updatedTemplate.subject,
              htmlBody: updatedTemplate.htmlBody,
              textBody: updatedTemplate.textBody,
              customization: {
                brandColor: updatedTemplate.brandColor,
                headerGradientStart: updatedTemplate.headerGradientStart,
                headerGradientEnd: updatedTemplate.headerGradientEnd,
                buttonColor: updatedTemplate.buttonColor,
              },
              changeNote: 'Refreshed default template content and styling',
              createdBy: authResult.user.id,
            },
          });

          results.updated.push(template.key);
          continue;
        }

        await prisma.emailTemplate.create({
          data: {
            ...template,
            createdBy: authResult.user.id,
            updatedBy: authResult.user.id,
          },
        });

        results.created.push(template.key);
      } catch (error) {
        console.error(`Error creating template ${template.key}:`, error);
        results.errors.push(template.key);
      }
    }

    return apiResponse({
      message: 'Email templates seeding complete',
      results,
      summary: `Created: ${results.created.length}, Updated: ${results.updated.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
    });
  } catch (error) {
    console.error('Error seeding email templates:', error);
    return apiError('Failed to seed email templates', 500);
  }
}

/**
 * GET /api/admin/email-templates/seed
 * Check seeding status
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (authResult.user.role !== 'super_admin') {
    return apiError('Super admin access required', 403);
  }

  try {
    const defaultKeys = [
      'verification',
      'welcome',
      'password_reset',
      'password_changed',
      'account_deletion',
      'support_request_public',
      'support_request_member',
      'support_confirmation',
    ];
    
    const existing = await prisma.emailTemplate.findMany({
      where: { key: { in: defaultKeys } },
      select: { key: true, name: true, updatedAt: true },
    });

    const existingKeys = existing.map(t => t.key);
    const missing = defaultKeys.filter(k => !existingKeys.includes(k));

    return apiResponse({
      seeded: existing.length === defaultKeys.length,
      existing: existing,
      missing: missing,
      message: missing.length > 0 
        ? `Missing ${missing.length} templates. POST to this endpoint to seed them.`
        : 'All default templates are seeded.',
    });
  } catch (error) {
    console.error('Error checking seed status:', error);
    return apiError('Failed to check seed status', 500);
  }
}
