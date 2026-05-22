import { index, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const bookmarks = pgTable(
  'bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // FK 없음 — 앱 레이어에서 posts / users 조회 (DDD)
    postId: uuid('post_id').notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('bookmarks_post_user_unique').on(t.postId, t.userId),
    // userId 단독 조회용 (마이페이지 저장한 글, 목록 배치 조회)
    index('bookmarks_user_id_idx').on(t.userId),
  ],
)
