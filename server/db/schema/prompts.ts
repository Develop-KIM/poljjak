import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const promptJobTypeEnum = pgEnum('prompt_job_type', ['developer', 'designer'])

export const prompts = pgTable(
  'prompts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    jobType: promptJobTypeEnum('job_type').notNull(),
    content: text('content').notNull(),
    isActive: boolean('is_active').notNull().default(false),
    // FK 없음 — 앱 레이어에서 users 조회 (DDD)
    createdBy: uuid('created_by').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('prompts_job_type_is_active_idx').on(t.jobType, t.isActive)],
)
