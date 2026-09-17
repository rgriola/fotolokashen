-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "username" VARCHAR(30) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" VARCHAR(50),
    "lastName" VARCHAR(50),
    "dateOfBirth" TIMESTAMP(3),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "autoLoginToken" TEXT,
    "autoLoginTokenExpiry" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "appleId" TEXT,
    "avatar" TEXT,
    "avatarFileId" TEXT,
    "bannerImage" TEXT,
    "bannerFileId" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "googleId" TEXT,
    "language" TEXT DEFAULT 'en',
    "lastLoginAt" TIMESTAMP(3),
    "phoneNumber" TEXT,
    "timezone" TEXT,
    "gpsPermission" TEXT DEFAULT 'not_asked',
    "gpsPermissionUpdated" TIMESTAMP(3),
    "homeLocationName" TEXT,
    "homeLocationLat" DOUBLE PRECISION,
    "homeLocationLng" DOUBLE PRECISION,
    "homeLocationUpdated" TIMESTAMP(3),
    "verificationTokenExpiry" TIMESTAMP(3),
    "lastVerificationEmailSent" TIMESTAMP(3),
    "bio" VARCHAR(500),
    "deletedAt" TIMESTAMP(3),
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "profileVisibility" TEXT NOT NULL DEFAULT 'public',
    "showInSearch" BOOLEAN NOT NULL DEFAULT true,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "showSavedLocations" TEXT NOT NULL DEFAULT 'public',
    "allowFollowRequests" BOOLEAN NOT NULL DEFAULT true,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" INTEGER,
    "onboarding_skipped" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_started_at" TIMESTAMP(3),
    "onboarding_completed_at" TIMESTAMP(3),
    "onboarding_version" INTEGER NOT NULL DEFAULT 1,
    "terms_accepted_at" TIMESTAMP(3),
    "terms_version" TEXT,
    "privacy_accepted_at" TIMESTAMP(3),
    "privacy_version" TEXT,
    "locations_onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "people_onboarding_completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhoneVerification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhoneVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" SERIAL NOT NULL,
    "placeId" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "address" VARCHAR(250),
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "type" TEXT,
    "rating" DOUBLE PRECISION,
    "createdBy" INTEGER NOT NULL,
    "lastModifiedBy" INTEGER,
    "lastModifiedAt" TIMESTAMP(3),
    "productionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "access" TEXT,
    "city" TEXT,
    "entryPoint" TEXT,
    "isPermanent" BOOLEAN NOT NULL DEFAULT false,
    "number" TEXT,
    "parking" TEXT,
    "productionNotes" TEXT,
    "details" VARCHAR(500),
    "state" TEXT,
    "street" TEXT,
    "zipcode" TEXT,
    "bestTimeOfDay" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "indoorOutdoor" TEXT,
    "operatingHours" TEXT,
    "permitCost" DOUBLE PRECISION,
    "permitRequired" BOOLEAN NOT NULL DEFAULT false,
    "restrictions" TEXT,
    "group_id" INTEGER,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saves" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "color" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "personalRating" DOUBLE PRECISION,
    "caption" TEXT,
    "tags" JSONB,
    "visitedAt" TIMESTAMP(3),
    "visibility" TEXT NOT NULL DEFAULT 'private',

    CONSTRAINT "user_saves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "country" TEXT,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "loginMethod" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "placeId" TEXT NOT NULL,
    "userId" INTEGER,
    "imagekitFileId" TEXT NOT NULL,
    "imagekitFilePath" TEXT NOT NULL,
    "originalFilename" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "gpsAltitude" DOUBLE PRECISION,
    "gpsAccuracy" DOUBLE PRECISION,
    "cameraMake" TEXT,
    "cameraModel" TEXT,
    "lensMake" TEXT,
    "lensModel" TEXT,
    "dateTaken" TIMESTAMP(3),
    "iso" INTEGER,
    "focalLength" TEXT,
    "aperture" TEXT,
    "shutterSpeed" TEXT,
    "exposureMode" TEXT,
    "whiteBalance" TEXT,
    "flash" TEXT,
    "orientation" INTEGER,
    "colorSpace" TEXT,
    "tags" TEXT,
    "uploadSource" TEXT DEFAULT 'manual',
    "hasGpsData" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'planning',
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_locations" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "shootDate" TIMESTAMP(3),
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_members" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "addedBy" INTEGER,

    CONSTRAINT "project_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_contacts" (
    "id" SERIAL NOT NULL,
    "locationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "invitedBy" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_change_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "oldEmail" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "cancelToken" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "email_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "username_change_requests" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "oldUsername" TEXT NOT NULL,
    "newUsername" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "username_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserved_usernames" (
    "username" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserved_usernames_pkey" PRIMARY KEY ("username")
);

-- CreateTable
CREATE TABLE "user_follows" (
    "id" SERIAL NOT NULL,
    "followerId" INTEGER NOT NULL,
    "followingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_clients" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT,
    "name" TEXT NOT NULL,
    "redirectUris" TEXT[],
    "scopes" TEXT[],
    "grantTypes" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_authorization_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "oauth_authorization_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "oauth_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerEmailId" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_webhook_events" (
    "id" SERIAL NOT NULL,
    "webhookEventId" TEXT NOT NULL,
    "providerEmailId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processingError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_suppressions" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_suppressions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_emails" (
    "id" SERIAL NOT NULL,
    "providerEmailId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "fromRaw" TEXT NOT NULL,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "toCsv" TEXT NOT NULL,
    "toJson" JSONB NOT NULL,
    "ccCsv" TEXT,
    "ccJson" JSONB,
    "bccCsv" TEXT,
    "bccJson" JSONB,
    "replyToCsv" TEXT,
    "replyToJson" JSONB,
    "subject" TEXT NOT NULL,
    "textBody" TEXT,
    "htmlBody" TEXT,
    "headers" JSONB,
    "threadId" TEXT,
    "inReplyTo" TEXT,
    "references" TEXT,
    "rawDownloadUrl" TEXT,
    "rawExpiresAt" TIMESTAMP(3),
    "forwardConfigured" BOOLEAN NOT NULL DEFAULT false,
    "forwardStatus" TEXT,
    "forwardedToCsv" TEXT,
    "forwardedToJson" JSONB,
    "forwardedFrom" TEXT,
    "forwardProviderId" TEXT,
    "forwardError" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inbound_emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inbound_email_attachments" (
    "id" SERIAL NOT NULL,
    "inboundEmailId" INTEGER NOT NULL,
    "providerAttachmentId" TEXT NOT NULL,
    "filename" TEXT,
    "size" INTEGER,
    "contentType" TEXT,
    "contentId" TEXT,
    "contentDisposition" TEXT,

    CONSTRAINT "inbound_email_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "type" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "coverPhotoId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_group_types" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "typeName" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_group_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_autoLoginToken_key" ON "users"("autoLoginToken");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleId_key" ON "users"("appleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_city_idx" ON "users"("city");

-- CreateIndex
CREATE INDEX "users_country_idx" ON "users"("country");

-- CreateIndex
CREATE INDEX "PhoneVerification_userId_idx" ON "PhoneVerification"("userId");

-- CreateIndex
CREATE INDEX "PhoneVerification_phoneNumber_idx" ON "PhoneVerification"("phoneNumber");

-- CreateIndex
CREATE INDEX "PhoneVerification_code_idx" ON "PhoneVerification"("code");

-- CreateIndex
CREATE INDEX "locations_createdBy_idx" ON "locations"("createdBy");

-- CreateIndex
CREATE INDEX "locations_lastModifiedBy_idx" ON "locations"("lastModifiedBy");

-- CreateIndex
CREATE INDEX "locations_placeId_idx" ON "locations"("placeId");

-- CreateIndex
CREATE INDEX "locations_group_id_idx" ON "locations"("group_id");

-- CreateIndex
CREATE INDEX "locations_lat_lng_idx" ON "locations"("lat", "lng");

-- CreateIndex
CREATE INDEX "locations_type_createdAt_idx" ON "locations"("type", "createdAt");

-- CreateIndex
CREATE INDEX "user_saves_locationId_idx" ON "user_saves"("locationId");

-- CreateIndex
CREATE INDEX "user_saves_visibility_idx" ON "user_saves"("visibility");

-- CreateIndex
CREATE INDEX "user_saves_userId_visibility_savedAt_idx" ON "user_saves"("userId", "visibility", "savedAt");

-- CreateIndex
CREATE INDEX "user_saves_visibility_savedAt_idx" ON "user_saves"("visibility", "savedAt");

-- CreateIndex
CREATE INDEX "user_saves_locationId_visibility_idx" ON "user_saves"("locationId", "visibility");

-- CreateIndex
CREATE UNIQUE INDEX "user_saves_userId_locationId_key" ON "user_saves"("userId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "photos_locationId_idx" ON "photos"("locationId");

-- CreateIndex
CREATE INDEX "photos_placeId_idx" ON "photos"("placeId");

-- CreateIndex
CREATE INDEX "photos_userId_idx" ON "photos"("userId");

-- CreateIndex
CREATE INDEX "idx_photos_dateTaken" ON "photos"("dateTaken");

-- CreateIndex
CREATE INDEX "idx_photos_hasGpsData" ON "photos"("hasGpsData");

-- CreateIndex
CREATE INDEX "idx_photos_uploadSource" ON "photos"("uploadSource");

-- CreateIndex
CREATE INDEX "photos_locationId_isPrimary_idx" ON "photos"("locationId", "isPrimary");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "project_locations_locationId_idx" ON "project_locations"("locationId");

-- CreateIndex
CREATE UNIQUE INDEX "project_locations_projectId_locationId_key" ON "project_locations"("projectId", "locationId");

-- CreateIndex
CREATE INDEX "project_members_userId_idx" ON "project_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "project_members_projectId_userId_key" ON "project_members"("projectId", "userId");

-- CreateIndex
CREATE INDEX "location_contacts_locationId_idx" ON "location_contacts"("locationId");

-- CreateIndex
CREATE INDEX "team_members_invitedBy_idx" ON "team_members"("invitedBy");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_invitedBy_key" ON "team_members"("userId", "invitedBy");

-- CreateIndex
CREATE INDEX "security_logs_userId_createdAt_idx" ON "security_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "security_logs_eventType_createdAt_idx" ON "security_logs"("eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_requests_token_key" ON "email_change_requests"("token");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_requests_cancelToken_key" ON "email_change_requests"("cancelToken");

-- CreateIndex
CREATE INDEX "email_change_requests_userId_idx" ON "email_change_requests"("userId");

-- CreateIndex
CREATE INDEX "email_change_requests_token_idx" ON "email_change_requests"("token");

-- CreateIndex
CREATE INDEX "email_change_requests_cancelToken_idx" ON "email_change_requests"("cancelToken");

-- CreateIndex
CREATE INDEX "email_change_requests_createdAt_idx" ON "email_change_requests"("createdAt");

-- CreateIndex
CREATE INDEX "username_change_requests_userId_idx" ON "username_change_requests"("userId");

-- CreateIndex
CREATE INDEX "username_change_requests_createdAt_idx" ON "username_change_requests"("createdAt");

-- CreateIndex
CREATE INDEX "user_follows_followerId_idx" ON "user_follows"("followerId");

-- CreateIndex
CREATE INDEX "user_follows_followingId_idx" ON "user_follows"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_follows_followerId_followingId_key" ON "user_follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_clients_clientId_key" ON "oauth_clients"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_authorization_codes_code_key" ON "oauth_authorization_codes"("code");

-- CreateIndex
CREATE INDEX "oauth_authorization_codes_code_idx" ON "oauth_authorization_codes"("code");

-- CreateIndex
CREATE INDEX "oauth_authorization_codes_userId_idx" ON "oauth_authorization_codes"("userId");

-- CreateIndex
CREATE INDEX "oauth_authorization_codes_clientId_idx" ON "oauth_authorization_codes"("clientId");

-- CreateIndex
CREATE INDEX "oauth_authorization_codes_expiresAt_idx" ON "oauth_authorization_codes"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "oauth_refresh_tokens_token_key" ON "oauth_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "oauth_refresh_tokens_token_idx" ON "oauth_refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "oauth_refresh_tokens_userId_idx" ON "oauth_refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "oauth_refresh_tokens_clientId_idx" ON "oauth_refresh_tokens"("clientId");

-- CreateIndex
CREATE INDEX "oauth_refresh_tokens_expiresAt_idx" ON "oauth_refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "email_logs_templateId_idx" ON "email_logs"("templateId");

-- CreateIndex
CREATE INDEX "email_logs_to_idx" ON "email_logs"("to");

-- CreateIndex
CREATE INDEX "email_logs_sentAt_idx" ON "email_logs"("sentAt");

-- CreateIndex
CREATE INDEX "email_logs_status_idx" ON "email_logs"("status");

-- CreateIndex
CREATE INDEX "email_logs_providerEmailId_idx" ON "email_logs"("providerEmailId");

-- CreateIndex
CREATE UNIQUE INDEX "email_webhook_events_webhookEventId_key" ON "email_webhook_events"("webhookEventId");

-- CreateIndex
CREATE INDEX "email_webhook_events_providerEmailId_eventType_idx" ON "email_webhook_events"("providerEmailId", "eventType");

-- CreateIndex
CREATE INDEX "email_webhook_events_receivedAt_idx" ON "email_webhook_events"("receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_suppressions_email_key" ON "email_suppressions"("email");

-- CreateIndex
CREATE INDEX "email_suppressions_reason_idx" ON "email_suppressions"("reason");

-- CreateIndex
CREATE INDEX "email_suppressions_createdAt_idx" ON "email_suppressions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_emails_providerEmailId_key" ON "inbound_emails"("providerEmailId");

-- CreateIndex
CREATE INDEX "inbound_emails_receivedAt_idx" ON "inbound_emails"("receivedAt");

-- CreateIndex
CREATE INDEX "inbound_emails_fromEmail_idx" ON "inbound_emails"("fromEmail");

-- CreateIndex
CREATE INDEX "inbound_emails_subject_idx" ON "inbound_emails"("subject");

-- CreateIndex
CREATE INDEX "inbound_emails_forwardStatus_idx" ON "inbound_emails"("forwardStatus");

-- CreateIndex
CREATE INDEX "inbound_email_attachments_inboundEmailId_idx" ON "inbound_email_attachments"("inboundEmailId");

-- CreateIndex
CREATE INDEX "inbound_email_attachments_providerAttachmentId_idx" ON "inbound_email_attachments"("providerAttachmentId");

-- CreateIndex
CREATE UNIQUE INDEX "inbound_email_attachments_inboundEmailId_providerAttachment_key" ON "inbound_email_attachments"("inboundEmailId", "providerAttachmentId");

-- CreateIndex
CREATE INDEX "location_groups_createdBy_idx" ON "location_groups"("createdBy");

-- CreateIndex
CREATE INDEX "user_group_types_userId_idx" ON "user_group_types"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_group_types_userId_typeName_key" ON "user_group_types"("userId", "typeName");

-- AddForeignKey
ALTER TABLE "PhoneVerification" ADD CONSTRAINT "PhoneVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_lastModifiedBy_fkey" FOREIGN KEY ("lastModifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "location_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saves" ADD CONSTRAINT "user_saves_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saves" ADD CONSTRAINT "user_saves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_locations" ADD CONSTRAINT "project_locations_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_locations" ADD CONSTRAINT "project_locations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_contacts" ADD CONSTRAINT "location_contacts_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_invitedBy_fkey" FOREIGN KEY ("invitedBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_change_requests" ADD CONSTRAINT "email_change_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "username_change_requests" ADD CONSTRAINT "username_change_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_authorization_codes" ADD CONSTRAINT "oauth_authorization_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "oauth_clients"("clientId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oauth_refresh_tokens" ADD CONSTRAINT "oauth_refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbound_email_attachments" ADD CONSTRAINT "inbound_email_attachments_inboundEmailId_fkey" FOREIGN KEY ("inboundEmailId") REFERENCES "inbound_emails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_groups" ADD CONSTRAINT "location_groups_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_group_types" ADD CONSTRAINT "user_group_types_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

