import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').notNull(),
  userId: uuid('user_id').notNull(),
  parentId: uuid('parent_id'),
  mentionNickname: text('mention_nickname'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
}, (t) => [
  index('comments_post_id_deleted_at_idx').on(t.postId, t.deletedAt),
  index('comments_user_id_idx').on(t.userId),
  index('comments_parent_id_idx').on(t.parentId),
])
