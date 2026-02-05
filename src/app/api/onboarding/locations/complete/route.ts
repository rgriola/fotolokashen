import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized || !auth.user) {
    return Response.json({ error: auth.error }, { status: 401 });
  }

  try {
    // Update user's locations onboarding status
    await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        locationsOnboardingCompleted: true,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error marking locations onboarding complete:', error);
    return Response.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}
