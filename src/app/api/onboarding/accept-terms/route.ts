import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized || !auth.user) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  try {
    const now = new Date();
    
    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
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
        userId: auth.user.id,
        eventType: 'TERMS_ACCEPTED',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        metadata: { version: '1.0' },
      },
    });

    return Response.json({
      success: true,
      termsAcceptedAt: updatedUser.termsAcceptedAt,
    });
  } catch (error) {
    console.error('Error accepting terms:', error);
    return Response.json(
      { error: 'Failed to record terms acceptance' },
      { status: 500 }
    );
  }
}
