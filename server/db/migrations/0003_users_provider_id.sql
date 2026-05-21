ALTER TABLE "users" RENAME COLUMN "kakao_id" TO "provider_id";
ALTER TABLE "users" RENAME CONSTRAINT "users_kakao_id_unique" TO "users_provider_id_unique";
