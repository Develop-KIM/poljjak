import { and, count, desc, ilike, isNull, or, sql } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../db'
import { users } from '../../../db/schema'
import { formatCommunityDate } from '../../../utils/community'

const PAGE_SIZE = 20

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const q = query.q as string | undefined
  const page = Math.max(1, Number(query.page ?? 1))
  const offset = (page - 1) * PAGE_SIZE

  const whereClause = q
    ? and(
        isNull(users.deletedAt),
        or(ilike(users.nickname, `%${q}%`), ilike(users.email, `%${q}%`))
      )
    : isNull(users.deletedAt)

  const userRows = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      email: users.email,
      role: users.role,
      jobType: users.jobType,
      suspendedAt: users.suspendedAt,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      postCount: sql<number>`(SELECT COUNT(*) FROM posts WHERE user_id = "users"."id" AND deleted_at IS NULL)`,
      commentCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE user_id = "users"."id" AND deleted_at IS NULL)`,
      analysisCount: sql<number>`(SELECT COUNT(*) FROM analyses WHERE user_id = "users"."id")`,
    })
    .from(users)
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset)

  const [totalRow] = await db.select({ count: count() }).from(users).where(whereClause)

  const items = userRows.map((row) => ({
    id: row.id,
    nickname: row.nickname,
    email: row.email,
    role: row.role,
    jobType: row.jobType,
    suspendedAt: row.suspendedAt ? formatCommunityDate(row.suspendedAt) : null,
    lastLoginAt: row.lastLoginAt ? formatCommunityDate(row.lastLoginAt) : null,
    createdAt: formatCommunityDate(row.createdAt),
    postCount: Number(row.postCount),
    commentCount: Number(row.commentCount),
    analysisCount: Number(row.analysisCount),
  }))

  return { data: { items, total: totalRow?.count ?? 0 } }
})
