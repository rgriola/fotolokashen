import prisma from '@/lib/prisma';
import { withAuth, apiResponse } from '@/lib/api-middleware';

export const POST = withAuth(async (_request, user) => {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      onboardingSkipped: true,
      onboardingStep: null,
    },
  });

  return apiResponse({ success: true, message: 'Onboarding skipped' });
});
