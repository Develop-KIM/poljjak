import { and, gte, sql } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { db } from '../../../db'
import { analyses } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  // 관리자 권한 확인
  await requireAdmin(event)

  // 오늘 00:00 KST 기준 (UTC+9)
  const now = new Date()
  const kstOffset = 9 * 60 * 60 * 1000
  const todayKst = new Date(now.getTime() + kstOffset)
  todayKst.setUTCHours(0, 0, 0, 0)
  const todayStart = new Date(todayKst.getTime() - kstOffset)

  // 최근 7일 시작일
  const sevenDaysAgo = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)

  // KST 시간 추출용 표현식 (TIMESTAMP WITHOUT TIME ZONE → UTC 해석 → KST 변환)
  const kstHour = sql`EXTRACT(HOUR FROM ${analyses.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul')`
  const kstDate = sql`TO_CHAR(${analyses.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD')`

  // 오늘 시간대별 분석 요청 수 (KST 기준) — SELECT와 GROUP BY 표현식 일치
  const hourlyRaw = await db
    .select({
      hour: sql<number>`${kstHour}::int`,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(analyses)
    .where(gte(analyses.createdAt, todayStart))
    .groupBy(kstHour)

  // 데이터 없는 시간대를 0으로 채워 0~23 전체 24개 반환
  const hourMap = new Map<number, number>()
  for (const row of hourlyRaw) {
    hourMap.set(Number(row.hour), Number(row.count))
  }
  const hourlyRequests = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    count: hourMap.get(h) ?? 0,
  }))

  // 최근 7일 completed 분석 일별 평균 응답시간(초) — SELECT/GROUP BY/ORDER BY 표현식 일치
  const dailyRaw = await db
    .select({
      date: sql<string>`${kstDate}`,
      avgSec: sql<number>`ROUND(AVG(EXTRACT(EPOCH FROM (${analyses.updatedAt} - ${analyses.createdAt}))), 1)`,
    })
    .from(analyses)
    .where(and(gte(analyses.createdAt, sevenDaysAgo), sql`${analyses.status} = 'completed'`))
    .groupBy(kstDate)
    .orderBy(kstDate)

  const dailyAvgResponseSec = dailyRaw.map((row) => ({
    date: row.date,
    avgSec: Number(row.avgSec),
  }))

  return {
    data: {
      hourlyRequests,
      dailyAvgResponseSec,
    },
  }
})
