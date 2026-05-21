ALTER TABLE "chat_rooms" ADD COLUMN IF NOT EXISTS "initiator_left_at" timestamp;
ALTER TABLE "chat_rooms" ADD COLUMN IF NOT EXISTS "participant_left_at" timestamp;
