import { NextRequest } from 'next/server';
import { requireAuth, apiResponse, apiError } from '@/lib/api-middleware';
import { canAccessAdminPanel } from '@/lib/permissions';
import { getTemplateById, renderTemplate, validateVariables } from '@/lib/email-template-service';
import type { TemplateWithVersions } from '@/lib/email-template-service';
import { Resend } from 'resend';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Initialize Resend client
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient && EMAIL_API_KEY) {
    resendClient = new Resend(EMAIL_API_KEY);
  }
  if (!resendClient) {
    throw new Error('Resend API key is not configured');
  }
  return resendClient;
}

/**
 * POST /api/admin/email-templates/[id]/test
 * Send test email using template
 * Super admin only - sends to current user's email
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);

  if (!authResult.authorized || !authResult.user) {
    return apiError('Unauthorized', 401);
  }

  if (!canAccessAdminPanel(authResult.user)) {
    return apiError('Admin access required', 403);
  }

  // Super admin only
  if (authResult.user.role !== 'super_admin') {
    return apiError('Super admin access required to send test emails', 403);
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return apiError('Invalid template ID', 400);
    }

    const body = await req.json();
    const variables = body.variables || {};

    // Get template
    const templateData = await getTemplateById(id);

    if (!templateData) {
      return apiError('Template not found', 404);
    }

    // Type assertion to access EmailTemplate properties
    const template = templateData as TemplateWithVersions & {
      htmlBody: string;
      subject: string;
      name: string;
      key: string;
      requiredVariables?: string[];
    };

    // Add default test variables
    const testVariables = {
      username: authResult.user.username,
      email: authResult.user.email,
      firstName: authResult.user.firstName || authResult.user.username,
      lastName: authResult.user.lastName || '',
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=test-token-123`,
      resetUrl: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=test-token-456`,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
      ipAddress: '192.168.1.100',
      ...variables,
    };

    // Validate required variables
    const requiredVars = Array.isArray(template.requiredVariables)
      ? (template.requiredVariables as string[])
      : [];

    const validation = validateVariables(requiredVars, testVariables);

    if (!validation.valid) {
      return apiError(
        `Missing required variables: ${validation.missing.join(', ')}`,
        400
      );
    }

    // Render template
    const htmlBody = await renderTemplate(template.htmlBody, testVariables);
    const subject = await renderTemplate(template.subject, testVariables);

    // Send email in development mode
    const EMAIL_MODE = process.env.EMAIL_MODE || 'development';

    if (EMAIL_MODE === 'development') {
      // In development, just log to console
      console.log('\n' + '='.repeat(80));
      console.log('📧 TEST EMAIL (Development Mode)');
      console.log('='.repeat(80));
      console.log(`Template: ${template.name} (${template.key})`);
      console.log(`To: ${authResult.user.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Variables used: ${Object.keys(testVariables).join(', ')}`);
      console.log('='.repeat(80) + '\n');

      return apiResponse({
        message: 'Test email logged to console (development mode)',
        preview: {
          to: authResult.user.email,
          subject,
          htmlPreview: htmlBody.substring(0, 500) + '...',
        },
      });
    }

    // Send actual email
    try {
      const resend = getResendClient();
      const fromName = process.env.EMAIL_FROM_NAME || 'Fotolokashen';
      const fromAddress = process.env.EMAIL_FROM_ADDRESS || 'noreply@fotolokashen.com';

      await resend.emails.send({
        from: `${fromName} <${fromAddress}>`,
        to: authResult.user.email,
        subject: `[TEST] ${subject}`,
        html: htmlBody,
      });

      return apiResponse({
        message: `Test email sent successfully to ${authResult.user.email}`,
        preview: {
          to: authResult.user.email,
          subject: `[TEST] ${subject}`,
        },
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return apiError('Failed to send test email', 500);
    }
  } catch (error) {
    console.error('Error sending test email:', error);

    if (error instanceof Error) {
      return apiError(error.message, 400);
    }

    return apiError('Failed to send test email', 500);
  }
}
