import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // FK 없음 — 앱 레이어에서 posts / users 조회 (DDD)
    postId: uuid('post_id').notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    // 같은 게시글에 중복 좋아요 방지 — 집합 무결성 유지
    uniqueIndex('likes_post_user_unique').on(t.postId, t.userId),
  ]
)
