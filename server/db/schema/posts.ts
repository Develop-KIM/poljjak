import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const postCategoryEnum = pgEnum('post_category', ['feedback', 'project', 'study'])
export const recruitmentStatusEnum = pgEnum('recruitment_status', ['open', 'closed'])
export const careerLevelEnum = pgEnum('career_level', ['entry', 'junior', 'mid', 'senior'])

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    category: postCategoryEnum('category').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    analysisId: uuid('analysis_id'),
    viewCount: integer('view_count').notNull().default(0),
    // project·study 전용 (feedback은 null)
    recruitmentStatus: recruitmentStatusEnum('recruitment_status'),
    // feedback 전용 필터 필드
    jobType: text('job_type'),
    careerLevel: careerLevelEnum('career_level'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
  },
  (t) => [
    index('posts_category_deleted_at_idx').on(t.category, t.deletedAt),
    index('posts_user_id_idx').on(t.userId),
    index('posts_created_at_idx').on(t.createdAt),
  ]
)

export const postImages = pgTable(
  'post_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    postId: uuid('post_id').notNull(),
    url: text('url').notNull(),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('post_images_post_id_order_idx').on(t.postId, t.order)]
)
