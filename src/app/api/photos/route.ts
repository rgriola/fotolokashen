import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiResponse, apiError, requireAuth } from "@/lib/api-middleware";

/**
 * GET /api/photos?locationId=xxx
 * Get all photos for a specific user's location
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.authorized || !authResult.user) {
      return apiError(
        authResult.error || "Authentication required",
        401,
        "UNAUTHORIZED",
      );
    }

    const user = authResult.user;
    const searchParams = request.nextUrl.searchParams;
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return apiError("locationId is required", 400, "VALIDATION_ERROR");
    }

    // Verify this location belongs to the user
    const location = await prisma.location.findFirst({
      where: {
        id: parseInt(locationId),
        createdBy: user.id,
      },
    });

    if (!location) {
      return apiError("Location not found or access denied", 404, "NOT_FOUND");
    }

    // Fetch photos for this user's location
    const photos = await prisma.photo.findMany({
      where: { locationId: parseInt(locationId) },
      orderBy: [{ isPrimary: "desc" }, { uploadedAt: "desc" }],
    });

    return apiResponse({ photos });
  } catch (error: any) {
    console.error("Error fetching photos:", error);
    return apiError("Failed to fetch photos", 500, "FETCH_ERROR");
  }
}

/**
 * POST /api/photos
 * Save photo metadata after ImageKit upload
 * Body: { locationId, placeId, imagekitFileId, imagekitFilePath, originalFilename, fileSize, mimeType, width, height, isPrimary?, caption? }
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);

    if (!authResult.authorized || !authResult.user) {
      return apiError(
        authResult.error || "Authentication required",
        401,
        "UNAUTHORIZED",
      );
    }

    const user = authResult.user;
    const body = await request.json();

    const {
      locationId,
      placeId,
      imagekitFileId,
      imagekitFilePath,
      originalFilename,
      fileSize,
      mimeType,
      width,
      height,
      isPrimary,
      caption,
    } = body;

    // Validation
    if (!locationId || !placeId || !imagekitFileId || !imagekitFilePath) {
      return apiError(
        "Missing required fields: locationId, placeId, imagekitFileId, imagekitFilePath",
        400,
        "VALIDATION_ERROR",
      );
    }

    // Verify this location belongs to the user
    const location = await prisma.location.findFirst({
      where: {
        id: locationId,
        createdBy: user.id,
      },
    });

    if (!location) {
      return apiError("Location not found or access denied", 404, "NOT_FOUND");
    }

    // Create photo record linked to user's specific location
    const photo = await prisma.photo.create({
      data: {
        locationId,
        placeId,
        userId: user.id,
        imagekitFileId,
        imagekitFilePath,
        originalFilename,
        fileSize,
        mimeType,
        width,
        height,
        isPrimary: isPrimary || false,
        caption,
      },
    });

    return apiResponse({ photo }, 201);
  } catch (error: any) {
    console.error("Error saving photo:", error);
    return apiError("Failed to save photo", 500, "SAVE_ERROR");
  }
}
