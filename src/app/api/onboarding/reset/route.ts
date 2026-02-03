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
        onboardingCompleted: false,
        onboardingSkipped: false,
        onboardingStep: null,
        onboardingStartedAt: null,
        onboardingCompletedAt: null,
      },
    });

    return Response.json({
      success: true,
      message: 'Onboarding reset',
    });
  } catch (error) {
    console.error('Onboarding reset error:', error);
    return Response.json(
      { error: 'Failed to reset onboarding' },
      { status: 500 }
    );
  }
}
