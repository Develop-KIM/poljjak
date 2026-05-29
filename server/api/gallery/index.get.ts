import { and, desc, eq, isNotNull, lt, sql } from 'drizzle-orm'
import { db } from '../../db'
import { analyses } from '../../db/schema'
import type { AnalysisIssue, AnalysisResultV2 } from '../../utils/clova'

const LIMIT = 20

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const jobRole = query.jobRole as string | undefined
  const seniority = query.seniority as string | undefined
  const cursor = query.cursor as string | undefined // ISO 날짜 문자열

  const VALID_JOB_ROLES = ['frontend', 'backend', 'fullstack', 'devops', 'ml']
  const VALID_SENIORITIES = ['junior', 'mid', 'senior']

  const conditions = [
    eq(analyses.isPublic, true),
    eq(analyses.status, 'completed'),
    isNotNull(analyses.shareToken),
    isNotNull(analyses.result),
  ]

  if (jobRole && VALID_JOB_ROLES.includes(jobRole)) {
    conditions.push(sql`${analyses.jobRole} = ${jobRole}`)
  }
  if (seniority && VALID_SENIORITIES.includes(seniority)) {
    conditions.push(sql`${analyses.seniority} = ${seniority}`)
  }
  if (cursor) {
    conditions.push(lt(analyses.createdAt, new Date(cursor)))
  }

  const rows = await db
    .select({
      id: analyses.id,
      shareToken: analyses.shareToken,
      jobRole: analyses.jobRole,
      seniority: analyses.seniority,
      pdfUrl: analyses.pdfUrl,
      issues: analyses.issues,
      result: analyses.result,
      createdAt: analyses.createdAt,
    })
    .from(analyses)
    .where(and(...conditions))
    .orderBy(desc(analyses.createdAt))
    .limit(LIMIT + 1)

  const hasMore = rows.length > LIMIT
  const items = hasMore ? rows.slice(0, LIMIT) : rows

  const data = items.map((row) => {
    const result = row.result as AnalysisResultV2 | null
    const issues = row.issues as AnalysisIssue[] | null
    return {
      id: row.id,
      shareToken: row.shareToken,
      jobRole: row.jobRole,
      seniority: row.seniority,
      pdfUrl: row.pdfUrl,
      issueCount: Array.isArray(issues) ? issues.length : 0,
      summary: result?.summary ?? null,
      createdAt: row.createdAt,
    }
  })

  const nextCursor = hasMore ? items[items.length - 1]!.createdAt.toISOString() : null

  return { data, nextCursor }
})
