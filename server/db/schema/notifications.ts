import { boolean, pgEnum, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const notifTypeEnum = pgEnum('notif_type', ['comment', 'like', 'dm'])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  // 알림 수신자
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notifTypeEnum('type').notNull(),
  // 알림 발생 원천 리소스 ID (comment.id / like.id / message.id)
  referenceId: uuid('reference_id').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
