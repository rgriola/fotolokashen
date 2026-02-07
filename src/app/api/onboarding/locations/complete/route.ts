import { requireAuth } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[Locations Onboarding] API called');
  const auth = await requireAuth(request);
  console.log('[Locations Onboarding] Auth result:', { authorized: auth.authorized, userId: auth.user?.id });
  
  if (!auth.authorized || !auth.user) {
    console.log('[Locations Onboarding] Auth failed:', auth.error);
    return Response.json({ error: auth.error }, { status: 401 });
  }

  try {
    console.log('[Locations Onboarding] Updating user:', auth.user.id);
    // Update user's locations onboarding status
    const updatedUser = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        locationsOnboardingCompleted: true,
      },
    });
    console.log('[Locations Onboarding] Updated successfully:', updatedUser.locationsOnboardingCompleted);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error marking locations onboarding complete:', error);
    return Response.json(
      { error: 'Failed to update onboarding status' },
      { status: 500 }
    );
  }
}
