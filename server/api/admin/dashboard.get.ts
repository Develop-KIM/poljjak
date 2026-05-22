import { and, count, gte, isNull, sql, sum } from 'drizzle-orm'
import { requireAdmin } from '../../utils/admin'
import { db } from '../../db'
import { analyses, comments, posts, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  // 오늘 00:00 KST 기준 (UTC+9)
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const todayKst = new Date(now.getTime() + kstOffset)
  todayKst.setUTCHours(0, 0, 0, 0)
  const todayStart = new Date(todayKst.getTime() - kstOffset)

  // 오늘 가입자 수
  const [todayUsersRow] = await db
    .select({ count: count() })
    .from(users)
    .where(gte(users.createdAt, todayStart))

  // 오늘 게시글 수
  const [todayPostsRow] = await db
    .select({ count: count() })
    .from(posts)
    .where(gte(posts.createdAt, todayStart))

  // 오늘 댓글 수
  const [todayCommentsRow] = await db
    .select({ count: count() })
    .from(comments)
    .where(gte(comments.createdAt, todayStart))

  // 오늘 로그인 수 (lastLoginAt 기준)
  const [todayLoginsRow] = await db
    .select({ count: count() })
    .from(users)
    .where(and(gte(users.lastLoginAt, todayStart), isNull(users.deletedAt)))

  // 누적 사용자 (deletedAt IS NULL)
  const [totalUsersRow] = await db
    .select({ count: count() })
    .from(users)
    .where(isNull(users.deletedAt))

  // 누적 게시글 (deletedAt IS NULL)
  const [totalPostsRow] = await db
    .select({ count: count() })
    .from(posts)
    .where(isNull(posts.deletedAt))

  // 오늘 분석 현황
  const [todayAnalysesRow] = await db
    .select({ count: count() })
    .from(analyses)
    .where(gte(analyses.createdAt, todayStart))

  const [todaySuccessRow] = await db
    .select({ count: count() })
    .from(analyses)
    .where(and(gte(analyses.createdAt, todayStart), sql`${analyses.status} = 'completed'`))

  const [todayFailedRow] = await db
    .select({ count: count() })
    .from(analyses)
    .where(and(gte(analyses.createdAt, todayStart), sql`${analyses.status} = 'failed'`))

  // 오늘 completed 분석의 평균 응답시간(초)
  const [avgResponseRow] = await db
    .select({
      avgSec: sql<number>`ROUND(AVG(EXTRACT(EPOCH FROM (${analyses.updatedAt} - ${analyses.createdAt}))), 1)`,
    })
    .from(analyses)
    .where(and(gte(analyses.createdAt, todayStart), sql`${analyses.status} = 'completed'`))

  // 오늘 token_usage 합계
  const [todayTokensRow] = await db
    .select({ total: sum(analyses.tokenUsage) })
    .from(analyses)
    .where(gte(analyses.createdAt, todayStart))

  // 누적 token_usage 합계
  const [totalTokensRow] = await db
    .select({ total: sum(analyses.tokenUsage) })
    .from(analyses)

  const todayAnalyses = todayAnalysesRow?.count ?? 0
  const todaySuccess = todaySuccessRow?.count ?? 0
  const todayFailed = todayFailedRow?.count ?? 0
  const successRate = todayAnalyses === 0 ? 0 : Math.round((todaySuccess / todayAnalyses) * 1000) / 10

  return {
    data: {
      todayUsers: todayUsersRow?.count ?? 0,
      todayLogins: todayLoginsRow?.count ?? 0,
      todayPosts: todayPostsRow?.count ?? 0,
      todayComments: todayCommentsRow?.count ?? 0,
      totalUsers: totalUsersRow?.count ?? 0,
      totalPosts: totalPostsRow?.count ?? 0,
      todayAnalyses,
      todaySuccess,
      todayFailed,
      successRate,
      avgResponseSec: Number(avgResponseRow?.avgSec ?? 0),
      todayTokens: Number(todayTokensRow?.total ?? 0),
      totalTokens: Number(totalTokensRow?.total ?? 0),
    },
  }
})
