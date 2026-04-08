import { withAuth, apiResponse } from '@/lib/api-middleware';
import prisma from '@/lib/prisma';

export const POST = withAuth(async (_request, user) => {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      peopleOnboardingCompleted: false,
    },
  });

  return apiResponse({ success: true });
});
