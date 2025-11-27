-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'all';

-- CreateIndex
CREATE INDEX "Post_category_idx" ON "Post"("category");
