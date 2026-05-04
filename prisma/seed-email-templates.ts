import prisma from '../src/lib/prisma';
import {
  verificationEmailTemplate,
  welcomeToEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
  publicSupportRequestTemplate,
  memberSupportRequestTemplate,
  supportConfirmationTemplate,
} from '../src/lib/email-templates';

/**
 * Seed Email Templates
 * Creates missing defaults and refreshes existing system defaults.
 */
async function seedEmailTemplates() {
  console.log('Seeding email templates...');

  const templates = [
    {
      key: 'verification',
      name: 'Email Verification',
      description: 'Email sent to new users to verify their email address',
      category: 'system',
      subject: 'Verify your email address for Fotolokashen',
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
    created: 0,
    updated: 0,
    skipped: 0,
  };

  for (const template of templates) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: template.key },
    });

    if (!existing) {
      await prisma.emailTemplate.create({
        data: {
          ...template,
          requiredVariables: template.requiredVariables,
        },
      });

      results.created += 1;
      console.log(`Created template: ${template.name}`);
      continue;
    }

    if (!existing.isDefault) {
      results.skipped += 1;
      console.log(`Skipped template \"${template.key}\": existing template is not a system default`);
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
      results.skipped += 1;
      console.log(`Skipped template \"${template.key}\": no changes`);
      continue;
    }

    await prisma.emailTemplate.update({
      where: { id: existing.id },
      data: {
        ...template,
        version: existing.version + 1,
      },
    });

    results.updated += 1;
    console.log(`Updated template: ${template.name}`);
  }

  console.log('Email templates seed complete');
  console.log(`Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}\n`);
}

async function main() {
  try {
    await seedEmailTemplates();
  } catch (error) {
    console.error('Error seeding email templates:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });