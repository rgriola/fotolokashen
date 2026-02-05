import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized || !auth.user) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  try {
    // Update user's people onboarding status
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        peopleOnboardingCompleted: true,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error marking people onboarding complete:', error);
    return Response.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}
