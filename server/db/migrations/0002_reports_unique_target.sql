CREATE UNIQUE INDEX IF NOT EXISTS "reports_reporter_target_unique"
ON "reports" ("reporter_id", "target_type", "target_id");
