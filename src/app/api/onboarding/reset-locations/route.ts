import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized || !auth.user) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  try {
    // Reset locations onboarding status
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        locationsOnboardingCompleted: false,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error resetting locations onboarding:', error);
    return Response.json(
      { error: 'Failed to reset onboarding status' },
      { status: 500 }
    );
  }
}
