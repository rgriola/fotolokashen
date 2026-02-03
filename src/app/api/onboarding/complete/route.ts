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
        onboardingCompleted: true,
        onboardingCompletedAt: new Date(),
        onboardingStep: 9, // Complete tour: 9 steps
      },
    });

    return Response.json({
      success: true,
      message: 'Onboarding completed',
    });
  } catch (error) {
    console.error('Onboarding completion error:', error);
    return Response.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
