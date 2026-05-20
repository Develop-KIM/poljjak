import { pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { posts } from './posts'
import { users } from './users'

export const likes = pgTable(
  'likes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    // 동일 사용자가 같은 게시글에 중복 좋아요 방지
    uniqueIndex('likes_post_user_unique').on(t.postId, t.userId),
  ]
)
