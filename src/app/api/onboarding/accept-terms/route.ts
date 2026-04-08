import { withAuth, apiResponse } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export const POST = withAuth(async (request, user) => {
  const now = new Date();

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      termsAcceptedAt: now,
      termsVersion: '1.0',
      privacyAcceptedAt: now,
      privacyVersion: '1.0',
    },
  });

  // Log to SecurityLog for audit trail
  await prisma.securityLog.create({
    data: {
      userId: user.id,
      eventType: 'TERMS_ACCEPTED',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      metadata: { version: '1.0' },
    },
  });

  return apiResponse({
    success: true,
    termsAcceptedAt: updatedUser.termsAcceptedAt,
  });
});
