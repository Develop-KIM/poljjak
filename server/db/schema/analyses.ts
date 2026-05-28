import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const analysisStatusEnum = pgEnum('analysis_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const jobRoleEnum = pgEnum('job_role', ['frontend', 'backend', 'fullstack', 'devops', 'ml'])

export const seniorityEnum = pgEnum('seniority', ['junior', 'mid', 'senior'])

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 users 조회 (DDD)
  userId: uuid('user_id').notNull(),
  title: text('title').notNull().default('포트폴리오 분석 결과'),
  additionalNote: text('additional_note'),
  status: analysisStatusEnum('status').notNull().default('pending'),
  // v1 결과 (하위호환)
  result: jsonb('result'),
  tokenUsage: integer('token_usage'),
  isPublic: boolean('is_public').notNull().default(false),
  shareToken: text('share_token').unique(),
  // v2 필드
  jobRole: jobRoleEnum('job_role'),
  seniority: seniorityEnum('seniority'),
  pdfUrl: text('pdf_url'),
  issues: jsonb('issues'),
  actionPlan: jsonb('action_plan'),
  checkedItems: text('checked_items').array(),
  afterHtml: text('after_html'),
  jdUrl: text('jd_url'),
  jdComparison: jsonb('jd_comparison'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
