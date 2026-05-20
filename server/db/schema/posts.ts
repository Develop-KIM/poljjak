import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const postCategoryEnum = pgEnum('post_category', ['feedback', 'project', 'study'])

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 users 조회 (DDD)
  userId: uuid('user_id').notNull(),
  category: postCategoryEnum('category').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  // 피드백 탭 분석 결과 첨부 ID (선택). FK 없음 — 앱 레이어에서 analyses 조회
  analysisId: uuid('analysis_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export const postImages = pgTable('post_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 posts 조회 (DDD)
  postId: uuid('post_id').notNull(),
  url: text('url').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
