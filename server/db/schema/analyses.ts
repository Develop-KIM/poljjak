import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const analysisStatusEnum = pgEnum('analysis_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 users 조회 (DDD)
  userId: uuid('user_id').notNull(),
  title: text('title').notNull().default('포트폴리오 분석 결과'),
  pdfUrl: text('pdf_url').notNull(),
  additionalNote: text('additional_note'),
  status: analysisStatusEnum('status').notNull().default('pending'),
  result: jsonb('result'),
  tokenUsage: integer('token_usage'),
  isPublic: boolean('is_public').notNull().default(false),
  shareToken: text('share_token').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
