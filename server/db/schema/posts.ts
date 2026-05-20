import { integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { analyses } from './analyses'
import { users } from './users'

export const postCategoryEnum = pgEnum('post_category', ['feedback', 'project', 'study'])

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  category: postCategoryEnum('category').notNull(),
  // 최대 100자 제한은 앱 레이어에서 검증
  title: text('title').notNull(),
  // 최대 5000자 제한은 앱 레이어에서 검증
  body: text('body').notNull(),
  // 피드백 탭에서 분석 결과 첨부 (선택)
  analysisId: uuid('analysis_id').references(() => analyses.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// 게시글 첨부 이미지. 최대 10장, 5MB 이하는 앱 레이어에서 검증
export const postImages = pgTable('post_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
