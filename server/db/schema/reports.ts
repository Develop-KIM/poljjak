import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const reportTargetEnum = pgEnum('report_target_type', ['post', 'comment'])

export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 users 조회 (DDD)
  reporterId: uuid('reporter_id').notNull(),
  targetType: reportTargetEnum('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
