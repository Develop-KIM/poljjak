import { index, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

export const articleSubscriptions = pgTable('article_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  feedName: text('feed_name'),
  tag: text('tag'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('article_subscriptions_user_id_idx').on(t.userId),
  unique('article_subscriptions_user_feed_unique').on(t.userId, t.feedName),
  unique('article_subscriptions_user_tag_unique').on(t.userId, t.tag),
])
