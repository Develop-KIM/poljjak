import { index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const reportTargetEnum = pgEnum('report_target_type', ['post', 'comment'])
export const reportStatusEnum = pgEnum('report_status', ['pending', 'resolved'])

export const reports = pgTable(
  'reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    reporterId: uuid('reporter_id').notNull(),
    targetType: reportTargetEnum('target_type').notNull(),
    targetId: uuid('target_id').notNull(),
    reason: text('reason').notNull(),
    status: reportStatusEnum('status').notNull().default('pending'),
    resolvedAt: timestamp('resolved_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('reports_reporter_target_idx').on(t.reporterId, t.targetId),
    index('reports_status_idx').on(t.status),
    uniqueIndex('reports_reporter_target_unique').on(t.reporterId, t.targetType, t.targetId),
  ]
)
