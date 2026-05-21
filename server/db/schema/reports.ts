import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const reportTargetEnum = pgEnum('report_target_type', ['post', 'comment'])

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id').notNull(),
    targetType: reportTargetEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('reports_reporter_target_idx').on(t.reporterId, t.targetId),
    uniqueIndex('reports_reporter_target_unique').on(t.reporterId, t.targetType, t.targetId),
  ]
)
