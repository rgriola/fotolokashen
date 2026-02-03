/**
 * Current User API
 * 
 * GET /api/v1/users/me - Get current user profile
 * PATCH /api/v1/users/me - Update current user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, apiError } from '@/lib/api-middleware';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.authorized || !authResult.user) {
      return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const userId = authResult.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bannerImage: true,
        bio: true,
        city: true,
        country: true,
        language: true,
        timezone: true,
        emailNotifications: true,
        // Privacy settings
        profileVisibility: true,
        showInSearch: true,
        showLocation: true,
        showSavedLocations: true,
        allowFollowRequests: true,
        // Onboarding fields
        onboardingCompleted: true,
        onboardingSkipped: true,
        onboardingStep: true,
        onboardingStartedAt: true,
        onboardingCompletedAt: true,
        onboardingVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.authorized || !authResult.user) {
      return apiError(authResult.error || 'Authentication required', 401, 'UNAUTHORIZED');
    }

    const userId = authResult.user.id;

    const body = await request.json();

    // Define allowed fields for update
    const allowedFields = [
      'firstName',
      'lastName',
      'bio',
      'city',
      'country',
      'language',
      'timezone',
      'emailNotifications',
      // Privacy settings
      'profileVisibility',
      'showInSearch',
      'showLocation',
      'showSavedLocations',
      'allowFollowRequests',
    ];

    // Filter out any fields not in allowedFields
    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    // Validate privacy settings values
    if (updateData.profileVisibility && 
        !['public', 'followers', 'private'].includes(updateData.profileVisibility as string)) {
      return NextResponse.json(
        { error: 'Invalid profileVisibility value' },
        { status: 400 }
      );
    }

    if (updateData.showSavedLocations && 
        !['public', 'followers', 'private'].includes(updateData.showSavedLocations as string)) {
      return NextResponse.json(
        { error: 'Invalid showSavedLocations value' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        bannerImage: true,
        bio: true,
        city: true,
        country: true,
        language: true,
        timezone: true,
        emailNotifications: true,
        profileVisibility: true,
        showInSearch: true,
        showLocation: true,
        showSavedLocations: true,
        allowFollowRequests: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('Update current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
