CREATE TABLE "account_media_cleanup" (
    "id" TEXT NOT NULL,
    "file_ids" TEXT[] NOT NULL,
    "folder_path" TEXT NOT NULL,
    "purge_urls" TEXT[] NOT NULL,
    "pending_purge_urls" TEXT[] NOT NULL,
    "purge_request_ids" TEXT[] NOT NULL,
    "final_sweep_completed" BOOLEAN NOT NULL DEFAULT false,
    "sweep_after" TIMESTAMP(3) NOT NULL,
    "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_token" TEXT,
    "locked_until" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "account_media_cleanup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "account_media_cleanup_next_attempt_at_idx"
    ON "account_media_cleanup"("next_attempt_at");
