import { index, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const articleCategoryEnum = pgEnum('article_category', ['domestic', 'international'])

export const articles = pgTable(
  'articles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    feedName: text('feed_name').notNull(),
    category: articleCategoryEnum('category').notNull(),
    title: text('title').notNull(),
    url: text('url').notNull(),
    summary: text('summary'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    publishedAt: timestamp('published_at').notNull(),
    collectedAt: timestamp('collected_at').notNull().defaultNow(),
    aiSummary: text('ai_summary'),
    aiKeyPoints: text('ai_key_points').array().default(sql`'{}'::text[]`),
    aiConcepts: jsonb('ai_concepts').$type<Array<{ name: string; desc: string }>>(),
    aiDifficulty: text('ai_difficulty'),
  },
  (t) => [
    uniqueIndex('articles_url_unique').on(t.url),
    index('articles_category_published_at_idx').on(t.category, t.publishedAt),
  ],
)

export const articleBookmarks = pgTable(
  'article_bookmarks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    articleId: uuid('article_id').notNull(),
    userId: uuid('user_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('article_bookmarks_article_user_unique').on(t.articleId, t.userId),
    index('article_bookmarks_user_id_idx').on(t.userId),
  ],
)
