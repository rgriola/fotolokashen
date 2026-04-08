import prisma from '@/lib/prisma';
import { withAuth, apiResponse } from '@/lib/api-middleware';

export const POST = withAuth(async (_request, user) => {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingStartedAt: new Date(),
      onboardingStep: 0,
      onboardingSkipped: false,
    },
  });

  return apiResponse({ success: true, message: 'Onboarding started' });
});
