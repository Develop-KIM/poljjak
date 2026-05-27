CREATE TABLE IF NOT EXISTS "article_clicks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "article_id" uuid NOT NULL,
  "user_id" uuid,
  "client_id" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "article_clicks_article_created_at_idx"
  ON "article_clicks" ("article_id", "created_at");

CREATE INDEX IF NOT EXISTS "article_clicks_created_at_idx"
  ON "article_clicks" ("created_at");

CREATE INDEX IF NOT EXISTS "article_clicks_client_id_idx"
  ON "article_clicks" ("client_id");

CREATE TABLE IF NOT EXISTS "article_feed_statuses" (
  "feed_name" text PRIMARY KEY NOT NULL,
  "category" "article_category" NOT NULL,
  "url" text NOT NULL,
  "last_checked_at" timestamp DEFAULT now() NOT NULL,
  "last_success_at" timestamp,
  "last_error" text,
  "last_item_count" integer DEFAULT 0 NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "article_feed_statuses_category_idx"
  ON "article_feed_statuses" ("category");

CREATE INDEX IF NOT EXISTS "article_feed_statuses_last_checked_at_idx"
  ON "article_feed_statuses" ("last_checked_at");
