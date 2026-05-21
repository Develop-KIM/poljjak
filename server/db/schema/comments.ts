import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 posts / users 조회 (DDD)
  postId: uuid('post_id').notNull(),
  userId: uuid('user_id').notNull(),
  // null = 최상위 댓글, uuid = 답글 (depth 1에만 허용)
  parentId: uuid('parent_id'),
  // 답글이 향하는 사용자 닉네임 (@mention 표시용)
  mentionNickname: text('mention_nickname'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})
