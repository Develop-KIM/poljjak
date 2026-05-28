DO $$
BEGIN
  CREATE TYPE "career_level" AS ENUM('entry', 'junior', 'mid', 'senior');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "recruitment_status" AS ENUM('open', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "posts"
  ADD COLUMN IF NOT EXISTS "analysis_id" uuid,
  ADD COLUMN IF NOT EXISTS "recruitment_status" "recruitment_status",
  ADD COLUMN IF NOT EXISTS "job_type" text,
  ADD COLUMN IF NOT EXISTS "career_level" "career_level";

CREATE TABLE IF NOT EXISTS "post_images" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL,
  "url" text NOT NULL,
  "order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "post_images_post_id_order_idx"
  ON "post_images" ("post_id", "order");

DO $$
BEGIN
  ALTER TABLE "post_images"
    ADD CONSTRAINT "post_images_post_id_posts_id_fk"
    FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE NOT VALID;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
