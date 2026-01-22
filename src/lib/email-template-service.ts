/**
 * Email Template Service
 * Manages email templates stored in database with fallback to hard-coded defaults
 */

import prisma from './prisma';
import Handlebars from 'handlebars';
import DOMPurify from 'isomorphic-dompurify';
import {
  verificationEmailTemplate,
  welcomeToEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  accountDeletionEmailTemplate,
} from './email-templates';
import { EmailTemplate, EmailTemplateVersion } from '@prisma/client';

// ============================================================================
// TYPES
// ============================================================================

export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

export interface CreateTemplateInput {
  key: string;
  name: string;
  description?: string;
  category?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  previewText?: string;
  brandColor?: string;
  headerGradientStart?: string;
  headerGradientEnd?: string;
  buttonColor?: string;
  requiredVariables?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  subject?: string;
  htmlBody?: string;
  textBody?: string;
  previewText?: string;
  brandColor?: string;
  headerGradientStart?: string;
  headerGradientEnd?: string;
  buttonColor?: string;
  requiredVariables?: string[];
  changeNote?: string;
}

export interface TemplateWithVersions extends EmailTemplate {
  versions: EmailTemplateVersion[];
}

// ============================================================================
// CACHING
// ============================================================================

// Simple in-memory cache for templates
const templateCache = new Map<string, { template: EmailTemplate; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedTemplate(key: string): EmailTemplate | null {
  const cached = templateCache.get(key);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    templateCache.delete(key);
    return null;
  }

  return cached.template;
}

function setCachedTemplate(key: string, template: EmailTemplate): void {
  templateCache.set(key, {
    template,
    timestamp: Date.now(),
  });
}

function invalidateCache(key?: string): void {
  if (key) {
    templateCache.delete(key);
  } else {
    templateCache.clear();
  }
}

// ============================================================================
// HARD-CODED TEMPLATE FALLBACKS
// ============================================================================

function getHardCodedTemplate(key: string, variables: TemplateVariables): string | null {
  const username = String(variables.username || 'User');
  
  switch (key) {
    case 'verification':
      return verificationEmailTemplate(username, String(variables.verificationUrl || '#'));
    
    case 'welcome':
      return welcomeToEmailTemplate(username);
    
    case 'password_reset':
      return passwordResetEmailTemplate(username, String(variables.resetUrl || '#'));
    
    case 'password_changed':
      return passwordChangedEmailTemplate(
        username,
        String(variables.timestamp || new Date().toISOString()),
        variables.ipAddress ? String(variables.ipAddress) : null
      );
    
    case 'account_deletion':
      return accountDeletionEmailTemplate(username, String(variables.email || 'user@example.com'));
    
    default:
      return null;
  }
}

// ============================================================================
// TEMPLATE RENDERING
// ============================================================================

/**
 * Render template with variables using Handlebars
 */
export function renderTemplate(htmlBody: string, variables: TemplateVariables): string {
  try {
    // Add standard variables
    const allVariables = {
      ...variables,
      appName: process.env.NEXT_PUBLIC_APP_NAME || 'Fotolokashen',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      currentYear: new Date().getFullYear(),
      supportEmail: process.env.EMAIL_FROM_ADDRESS || 'admin@fotolokashen.com',
    };

    // Compile and render template
    const template = Handlebars.compile(htmlBody);
    const rendered = template(allVariables);

    // Sanitize HTML to prevent XSS
    return DOMPurify.sanitize(rendered, {
      ALLOWED_TAGS: [
        'a', 'b', 'br', 'div', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'i', 'img', 'li', 'ol', 'p', 'span', 'strong', 'table', 'tbody',
        'td', 'th', 'thead', 'tr', 'u', 'ul', 'code', 'pre', 'blockquote',
        'hr', 'meta', 'style', 'title', 'head', 'body', 'html'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'style', 'class', 'id', 'width',
        'height', 'align', 'border', 'cellpadding', 'cellspacing', 'role',
        'bgcolor', 'color', 'target', 'rel', 'name', 'content', 'charset',
        'http-equiv', 'lang'
      ],
      ALLOW_DATA_ATTR: false,
    });
  } catch (error) {
    console.error('Template rendering error:', error);
    throw new Error('Failed to render email template');
  }
}

/**
 * Validate that all required variables are provided
 */
export function validateVariables(
  requiredVariables: string[],
  providedVariables: TemplateVariables
): { valid: boolean; missing: string[] } {
  const missing = requiredVariables.filter(
    (varName) => !(varName in providedVariables) || providedVariables[varName] === undefined
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

/**
 * Get email template by key
 * Checks cache first, then database, then falls back to hard-coded template
 */
export async function getEmailTemplate(key: string): Promise<EmailTemplate | null> {
  // Check cache first
  const cached = getCachedTemplate(key);
  if (cached) {
    console.log(`[EmailTemplateService] Cache hit for template: ${key}`);
    return cached;
  }

  // Fetch from database
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: {
        key,
        isActive: true,
        deletedAt: null,
      },
    });

    if (template) {
      console.log(`[EmailTemplateService] Database hit for template: ${key}`);
      setCachedTemplate(key, template);
      return template;
    }

    console.log(`[EmailTemplateService] Template not found in database: ${key}`);
    return null;
  } catch (error) {
    console.error(`[EmailTemplateService] Error fetching template ${key}:`, error);
    return null;
  }
}

/**
 * Get all active templates
 */
export async function getAllActiveTemplates(): Promise<EmailTemplate[]> {
  return prisma.emailTemplate.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });
}

/**
 * Get template by ID with version history
 */
export async function getTemplateById(id: number): Promise<TemplateWithVersions | null> {
  return prisma.emailTemplate.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 20, // Keep last 20 versions
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
      updater: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Create new email template
 */
export async function createTemplate(
  data: CreateTemplateInput,
  userId: number
): Promise<EmailTemplate> {
  // Check if key already exists
  const existing = await prisma.emailTemplate.findUnique({
    where: { key: data.key },
  });

  if (existing) {
    throw new Error(`Template with key "${data.key}" already exists`);
  }

  // Create template
  const template = await prisma.emailTemplate.create({
    data: {
      key: data.key,
      name: data.name,
      description: data.description,
      category: data.category || 'system',
      subject: data.subject,
      htmlBody: data.htmlBody,
      textBody: data.textBody,
      previewText: data.previewText,
      brandColor: data.brandColor || '#4285f4',
      headerGradientStart: data.headerGradientStart || '#4285f4',
      headerGradientEnd: data.headerGradientEnd || '#5a67d8',
      buttonColor: data.buttonColor || '#4285f4',
      requiredVariables: data.requiredVariables || [],
      createdBy: userId,
      updatedBy: userId,
    },
  });

  // Create initial version
  await prisma.emailTemplateVersion.create({
    data: {
      templateId: template.id,
      version: 1,
      subject: template.subject,
      htmlBody: template.htmlBody,
      textBody: template.textBody,
      customization: {
        brandColor: template.brandColor,
        headerGradientStart: template.headerGradientStart,
        headerGradientEnd: template.headerGradientEnd,
        buttonColor: template.buttonColor,
      },
      changeNote: 'Initial version',
      createdBy: userId,
    },
  });

  console.log(`[EmailTemplateService] Created template: ${template.key}`);
  invalidateCache(template.key);

  return template;
}

/**
 * Update email template (creates new version)
 */
export async function updateTemplate(
  id: number,
  data: UpdateTemplateInput,
  userId: number
): Promise<EmailTemplate> {
  const existing = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error('Template not found');
  }

  if (existing.isDefault) {
    // For default templates, create a new custom version instead of modifying
    throw new Error('Cannot modify default templates. Create a custom template instead.');
  }

  // Update template
  const updated = await prisma.emailTemplate.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category && { category: data.category }),
      ...(data.subject && { subject: data.subject }),
      ...(data.htmlBody && { htmlBody: data.htmlBody }),
      ...(data.textBody !== undefined && { textBody: data.textBody }),
      ...(data.previewText !== undefined && { previewText: data.previewText }),
      ...(data.brandColor && { brandColor: data.brandColor }),
      ...(data.headerGradientStart && { headerGradientStart: data.headerGradientStart }),
      ...(data.headerGradientEnd && { headerGradientEnd: data.headerGradientEnd }),
      ...(data.buttonColor && { buttonColor: data.buttonColor }),
      ...(data.requiredVariables && { requiredVariables: data.requiredVariables }),
      version: existing.version + 1,
      updatedBy: userId,
    },
  });

  // Create version snapshot
  await prisma.emailTemplateVersion.create({
    data: {
      templateId: updated.id,
      version: updated.version,
      subject: updated.subject,
      htmlBody: updated.htmlBody,
      textBody: updated.textBody,
      customization: {
        brandColor: updated.brandColor,
        headerGradientStart: updated.headerGradientStart,
        headerGradientEnd: updated.headerGradientEnd,
        buttonColor: updated.buttonColor,
      },
      changeNote: data.changeNote || 'Updated template',
      createdBy: userId,
    },
  });

  // Clean up old versions (keep only last 20)
  const versions = await prisma.emailTemplateVersion.findMany({
    where: { templateId: id },
    orderBy: { version: 'desc' },
    select: { id: true },
  });

  if (versions.length > 20) {
    const toDelete = versions.slice(20).map((v) => v.id);
    await prisma.emailTemplateVersion.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log(`[EmailTemplateService] Cleaned up ${toDelete.length} old versions`);
  }

  console.log(`[EmailTemplateService] Updated template: ${updated.key} (v${updated.version})`);
  invalidateCache(updated.key);

  return updated;
}

/**
 * Soft delete template (custom templates only)
 */
export async function deleteTemplate(id: number, userId: number): Promise<void> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (template.isDefault) {
    throw new Error('Cannot delete default system templates');
  }

  // Soft delete
  await prisma.emailTemplate.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: userId,
    },
  });

  console.log(`[EmailTemplateService] Soft deleted template: ${template.key}`);
  invalidateCache(template.key);
}

/**
 * Revert template to previous version
 */
export async function revertToVersion(
  templateId: number,
  versionNumber: number,
  userId: number
): Promise<EmailTemplate> {
  const version = await prisma.emailTemplateVersion.findFirst({
    where: {
      templateId,
      version: versionNumber,
    },
  });

  if (!version) {
    throw new Error(`Version ${versionNumber} not found`);
  }

  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (template.isDefault) {
    throw new Error('Cannot revert default templates');
  }

  const customization = version.customization as {
    brandColor?: string;
    headerGradientStart?: string;
    headerGradientEnd?: string;
    buttonColor?: string;
  };

  // Update template with version data
  const updated = await prisma.emailTemplate.update({
    where: { id: templateId },
    data: {
      subject: version.subject,
      htmlBody: version.htmlBody,
      textBody: version.textBody,
      brandColor: customization.brandColor || template.brandColor,
      headerGradientStart: customization.headerGradientStart || template.headerGradientStart,
      headerGradientEnd: customization.headerGradientEnd || template.headerGradientEnd,
      buttonColor: customization.buttonColor || template.buttonColor,
      version: template.version + 1,
      updatedBy: userId,
    },
  });

  // Create new version entry for the revert
  await prisma.emailTemplateVersion.create({
    data: {
      templateId: updated.id,
      version: updated.version,
      subject: updated.subject,
      htmlBody: updated.htmlBody,
      textBody: updated.textBody,
      customization,
      changeNote: `Reverted to version ${versionNumber}`,
      createdBy: userId,
    },
  });

  console.log(`[EmailTemplateService] Reverted template ${template.key} to v${versionNumber}`);
  invalidateCache(template.key);

  return updated;
}

/**
 * Get rendered email HTML for sending
 * Tries database first, falls back to hard-coded templates
 */
export async function getRenderedEmail(
  key: string,
  variables: TemplateVariables
): Promise<{ subject: string; html: string; templateId?: number } | null> {
  // Try database template first
  const dbTemplate = await getEmailTemplate(key);
  
  if (dbTemplate) {
    // Validate variables
    const requiredVars = Array.isArray(dbTemplate.requiredVariables)
      ? (dbTemplate.requiredVariables as string[])
      : [];
    
    const validation = validateVariables(requiredVars, variables);
    
    if (!validation.valid) {
      console.warn(
        `[EmailTemplateService] Missing required variables for ${key}:`,
        validation.missing
      );
    }

    const html = renderTemplate(dbTemplate.htmlBody, variables);
    const subject = renderTemplate(dbTemplate.subject, variables);

    return {
      subject,
      html,
      templateId: dbTemplate.id,
    };
  }

  // Fallback to hard-coded template
  console.log(`[EmailTemplateService] Falling back to hard-coded template: ${key}`);
  const hardCodedHtml = getHardCodedTemplate(key, variables);

  if (!hardCodedHtml) {
    console.error(`[EmailTemplateService] No template found for key: ${key}`);
    return null;
  }

  // Get subject from hard-coded defaults
  const subjectMap: Record<string, string> = {
    verification: 'Confirm your email address',
    welcome: 'Email Confirmed - Welcome to Fotolokashen!',
    password_reset: 'Reset your password',
    password_changed: 'Your Password Was Changed',
    account_deletion: 'We deleted your Fotolokashen account',
  };

  return {
    subject: subjectMap[key] || 'Notification from Fotolokashen',
    html: hardCodedHtml,
  };
}

/**
 * Duplicate existing template
 */
export async function duplicateTemplate(
  id: number,
  newKey: string,
  newName: string,
  userId: number
): Promise<EmailTemplate> {
  const source = await prisma.emailTemplate.findUnique({
    where: { id },
  });

  if (!source) {
    throw new Error('Source template not found');
  }

  return createTemplate(
    {
      key: newKey,
      name: newName,
      description: source.description || undefined,
      category: source.category,
      subject: source.subject,
      htmlBody: source.htmlBody,
      textBody: source.textBody || undefined,
      previewText: source.previewText || undefined,
      brandColor: source.brandColor,
      headerGradientStart: source.headerGradientStart,
      headerGradientEnd: source.headerGradientEnd,
      buttonColor: source.buttonColor,
      requiredVariables: Array.isArray(source.requiredVariables)
        ? (source.requiredVariables as string[])
        : [],
    },
    userId
  );
}
