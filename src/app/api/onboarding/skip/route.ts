import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized || !auth.user) {
    return Response.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
  }

  const user = auth.user;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        onboardingSkipped: true,
        onboardingStep: null,
      },
    });

    return Response.json({
      success: true,
      message: 'Onboarding skipped',
    });
  } catch (error) {
    console.error('Onboarding skip error:', error);
    return Response.json(
      { error: 'Failed to skip onboarding' },
      { status: 500 }
    );
  }
}
