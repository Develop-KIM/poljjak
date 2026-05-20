import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { posts } from './posts'
import { users } from './users'

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  // 소프트 삭제. UI에서 "삭제된 댓글이에요" 표시용
  deletedAt: timestamp('deleted_at'),
})
