import prisma from '../src/lib/prisma';
import {
  verificationEmailTemplate,
  welcomeToEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
} from '../src/lib/email-templates';

/**
 * Seed Email Templates
 * Populates the database with default email templates from the hard-coded templates
 */
async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

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
  ];

  for (const template of templates) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: template.key },
    });

    if (existing) {
      console.log(`  ⏭️  Template "${template.key}" already exists, skipping...`);
      continue;
    }

    await prisma.emailTemplate.create({
      data: {
        ...template,
        requiredVariables: template.requiredVariables,
      },
    });

    console.log(`  ✅ Created template: ${template.name}`);
  }

  console.log('✨ Email templates seeded successfully!\n');
}

async function main() {
  try {
    await seedEmailTemplates();
  } catch (error) {
    console.error('❌ Error seeding email templates:', error);
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
