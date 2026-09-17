-- Add GPS and EXIF metadata fields to photos table
-- Migration: Add photo GPS/EXIF redundancy
-- Date: 2024-12-26

ALTER TABLE `photos` 
  -- GPS/Location metadata (from EXIF) - Redundancy for photo-based locations
  ADD COLUMN `gpsLatitude` DOUBLE NULL COMMENT 'GPS latitude from EXIF',
  ADD COLUMN `gpsLongitude` DOUBLE NULL COMMENT 'GPS longitude from EXIF',
  ADD COLUMN `gpsAltitude` DOUBLE NULL COMMENT 'GPS altitude in meters',
  ADD COLUMN `gpsAccuracy` DOUBLE NULL COMMENT 'GPS accuracy in meters',
  
  -- EXIF Camera metadata
  ADD COLUMN `cameraMake` VARCHAR(100) NULL COMMENT 'Camera manufacturer',
  ADD COLUMN `cameraModel` VARCHAR(100) NULL COMMENT 'Camera model',
  ADD COLUMN `lensMake` VARCHAR(100) NULL COMMENT 'Lens manufacturer',
  ADD COLUMN `lensModel` VARCHAR(100) NULL COMMENT 'Lens model',
  
  -- EXIF Exposure settings
  ADD COLUMN `dateTaken` DATETIME NULL COMMENT 'Original date/time photo was taken',
  ADD COLUMN `iso` INT NULL COMMENT 'ISO speed rating',
  ADD COLUMN `focalLength` VARCHAR(20) NULL COMMENT 'Focal length (e.g., 24mm)',
  ADD COLUMN `aperture` VARCHAR(20) NULL COMMENT 'Aperture value (e.g., f/2.8)',
  ADD COLUMN `shutterSpeed` VARCHAR(50) NULL COMMENT 'Shutter speed (e.g., 1/250s)',
  ADD COLUMN `exposureMode` VARCHAR(50) NULL COMMENT 'Exposure mode',
  ADD COLUMN `whiteBalance` VARCHAR(50) NULL COMMENT 'White balance setting',
  ADD COLUMN `flash` VARCHAR(50) NULL COMMENT 'Flash mode/status',
  ADD COLUMN `orientation` INT NULL COMMENT 'Image orientation (EXIF 1-8)',
  ADD COLUMN `colorSpace` VARCHAR(50) NULL COMMENT 'Color space (sRGB, etc.)',
  
  -- Additional properties
  ADD COLUMN `tags` TEXT NULL COMMENT 'Comma-separated tags',
  ADD COLUMN `uploadSource` VARCHAR(50) NULL DEFAULT 'manual' COMMENT 'Source: manual, photo_gps, bulk_upload',
  ADD COLUMN `hasGpsData` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Quick flag for GPS availability';

-- Add indexes for better query performance
CREATE INDEX `idx_photos_hasGpsData` ON `photos` (`hasGpsData`);
CREATE INDEX `idx_photos_dateTaken` ON `photos` (`dateTaken`);
CREATE INDEX `idx_photos_uploadSource` ON `photos` (`uploadSource`);
