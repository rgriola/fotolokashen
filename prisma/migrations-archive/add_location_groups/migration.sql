-- CreateTable: location_groups
CREATE TABLE "location_groups" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "type" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "cover_photo_id" INTEGER,
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_group_types
CREATE TABLE "user_group_types" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type_name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_group_types_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add group_id to locations
ALTER TABLE "locations" ADD COLUMN "group_id" INTEGER;

-- CreateIndex
CREATE INDEX "idx_location_groups_created_by" ON "location_groups"("created_by");
CREATE INDEX "idx_user_group_types_user" ON "user_group_types"("user_id");
CREATE INDEX "idx_locations_group_id" ON "locations"("group_id");
CREATE UNIQUE INDEX "user_group_types_user_id_type_name_key" ON "user_group_types"("user_id", "type_name");

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "location_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "location_groups" ADD CONSTRAINT "location_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_group_types" ADD CONSTRAINT "user_group_types_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
