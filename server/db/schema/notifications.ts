import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const notifTypeEnum = pgEnum('notif_type', ['comment', 'like', 'dm', 'analysis'])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  actorId: uuid('actor_id').notNull(),
  type: notifTypeEnum('type').notNull(),
  referenceId: uuid('reference_id').notNull(),
  linkUrl: text('link_url').notNull().default(''),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (t) => [
  index('notifications_user_id_created_at_idx').on(t.userId, t.createdAt),
  index('notifications_user_id_is_read_idx').on(t.userId, t.isRead),
])
