import { pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const jobTypeEnum = pgEnum('job_type', ['developer', 'designer'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  kakaoId: text('kakao_id').unique().notNull(),
  nickname: text('nickname').notNull(),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  jobType: jobTypeEnum('job_type'),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

export type SelectUser = typeof users.$inferSelect
export type InsertUser = typeof users.$inferInsert
