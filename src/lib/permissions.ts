import { PublicUser } from '@/types/user';

// Location type for permission checks
interface LocationForPermission {
    createdBy: number;
}

// UserSave type for permission checks
interface UserSaveForPermission {
    userId: number;
}

/**
 * Check if a user can edit a location's details
 * Only the creator OR an admin can edit location information
 */
export function canEditLocation(
    user: PublicUser,
    location: LocationForPermission
): boolean {
    return user.id === location.createdBy || user.isAdmin === true;
}

/**
 * Check if a user can delete a UserSave record
 * Only the user who saved the location can delete it from their saves
 */
export function canDeleteUserSave(
    user: PublicUser,
    userSave: UserSaveForPermission
): boolean {
    return user.id === userSave.userId;
}

/**
 * Check if a user can update their own caption
 * Only the user who saved the location can update their caption
 */
export function canUpdateCaption(
    user: PublicUser,
    userSave: UserSaveForPermission
): boolean {
    return user.id === userSave.userId;
}
