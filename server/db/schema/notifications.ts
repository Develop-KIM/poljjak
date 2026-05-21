import { boolean, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const notifTypeEnum = pgEnum('notif_type', ['comment', 'like', 'dm', 'analysis'])

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 users 조회 (DDD)
  userId: uuid('user_id').notNull(),
  actorId: uuid('actor_id').notNull(),
  type: notifTypeEnum('type').notNull(),
  referenceId: uuid('reference_id').notNull(),
  // 알림 클릭 시 이동할 경로
  linkUrl: text('link_url').notNull().default(''),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
