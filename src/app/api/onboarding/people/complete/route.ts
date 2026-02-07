import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[People Onboarding] API called');
  const auth = await requireAuth(request);
  console.log('[People Onboarding] Auth result:', { authorized: auth.authorized, userId: auth.user?.id });
  
  if (!auth.authorized || !auth.user) {
    console.log('[People Onboarding] Auth failed:', auth.error);
    return Response.json({ error: auth.error }, { status: 401 });
  }

  try {
    console.log('[People Onboarding] Updating user:', auth.user.id);
    // Update user's people onboarding status
    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        peopleOnboardingCompleted: true,
      },
    });
    console.log('[People Onboarding] Updated successfully:', updatedUser.peopleOnboardingCompleted);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error marking people onboarding complete:', error);
    return Response.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}
