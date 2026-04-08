import prisma from '@/lib/prisma';
import { withAuth, apiResponse } from '@/lib/api-middleware';

export const POST = withAuth(async (_request, user) => {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      onboardingStep: 9,
    },
  });

  return apiResponse({ success: true, message: 'Onboarding completed' });
});
