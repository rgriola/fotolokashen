export interface User {
    id: number
    email: string
    username: string
    passwordHash: string
    firstName: string | null
    lastName: string | null
    emailVerified: boolean
    verificationToken: string | null
    verificationTokenExpiry: Date | null
    resetToken: string | null
    resetTokenExpiry: Date | null
    isActive: boolean
    isAdmin: boolean

    // GPS Permission
    gpsPermission: string | null  // 'not_asked', 'granted', 'denied'
    gpsPermissionUpdated: Date | null

    // Home Location (default map center)
    homeLocationName: string | null
    homeLocationLat: number | null
    homeLocationLng: number | null
    homeLocationUpdated: Date | null

    // Profile fields
    avatar: string | null
    bio: string | null
    phoneNumber: string | null
    city: string | null
    country: string | null
    timezone: string | null
    language: string | null

    // Preferences
    emailNotifications: boolean

    // Two-Factor Authentication
    twoFactorEnabled: boolean
    twoFactorSecret: string | null

    // OAuth
    googleId: string | null
    appleId: string | null

    // Activity
    lastLoginAt: Date | null

    // Soft delete
    deletedAt: Date | null

    createdAt: Date
    updatedAt: Date
}

export interface PublicUser {
    id: number
    email: string
    username: string
    firstName: string | null
    lastName: string | null
    emailVerified: boolean
    isActive: boolean
    isAdmin: boolean

    // Profile fields (public)
    avatar: string | null
    city: string | null
    country: string | null
    language: string | null
    timezone: string | null

    // Preferences
    emailNotifications: boolean

    // GPS Permission
    gpsPermission: string | null  // 'not_asked', 'granted', 'denied'
    gpsPermissionUpdated: Date | null

    // Home Location (default map center)
    homeLocationName: string | null
    homeLocationLat: number | null
    homeLocationLng: number | null
    homeLocationUpdated: Date | null

    createdAt: Date
}


export interface AuthResponse {
    user: PublicUser
    token: string
}

export interface LoginRequest {
    email: string
    password: string
    rememberMe?: boolean
}

export interface RegisterRequest {
    email: string
    username: string
    password: string
    firstName?: string
    lastName?: string
}
