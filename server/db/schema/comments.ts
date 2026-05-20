import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 posts / users 조회 (DDD)
  postId: uuid('post_id').notNull(),
  userId: uuid('user_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
