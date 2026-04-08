import prisma from '@/lib/prisma';
import { withAuth, apiResponse } from '@/lib/api-middleware';

export const POST = withAuth(async (_request, user) => {
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

  return apiResponse({ success: true, message: 'Onboarding reset' });
});
