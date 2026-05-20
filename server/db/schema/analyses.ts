import { boolean, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './users'

export const analysisStatusEnum = pgEnum('analysis_status', [
  'pending',
  'processing',
  'completed',
  'failed',
])

export const analyses = pgTable('analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default('포트폴리오 분석 결과'),
  pdfUrl: text('pdf_url').notNull(),
  additionalNote: text('additional_note'),
  status: analysisStatusEnum('status').notNull().default('pending'),
  // CLOVA Studio 분석 결과 JSON
  // { scores: [{title, score, comment}], summary: string, suggestions: [{before, after}] }
  result: jsonb('result'),
  isPublic: boolean('is_public').notNull().default(false),
  // 공유 링크용 토큰. 공개 전환 시 생성
  shareToken: text('share_token').unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
