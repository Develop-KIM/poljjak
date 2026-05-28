import { and, desc, eq, ne, sql } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { notifications, users } from '../../db/schema'
import { formatCommunityDate } from '../../utils/community'

const PAGE_SIZE = 20

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10))
  // popover 모드: page 파라미터 없으면 최근 50개 전체 반환 (DM 포함, store의 dmUnreadCount 유지)
  const isPopover = !query.page
  const limit = isPopover ? 50 : PAGE_SIZE
  const offset = isPopover ? 0 : (page - 1) * PAGE_SIZE

  // 페이지 모드에서는 DM 제외 (bell 알림만 표시)
  const whereCondition = isPopover
    ? eq(notifications.userId, user.id)
    : and(eq(notifications.userId, user.id), ne(notifications.type, 'dm'))

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        linkUrl: notifications.linkUrl,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        actorNickname: users.nickname,
        actorAvatarUrl: users.avatarUrl,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(whereCondition)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset),
    isPopover
      ? Promise.resolve([{ count: 0 }])
      : db
          .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
          .from(notifications)
          .where(whereCondition),
  ])

  const typeMessages: Record<string, (actor: string) => string> = {
    comment: (a) => `${a}님이 내 게시글에 댓글을 달았어요`,
    like: (a) => `${a}님이 내 게시글을 좋아해요`,
    dm: (a) => `${a}님이 메시지를 보냈어요`,
    analysis: () => '포트폴리오 분석이 완료됐어요',
    article: () => '구독한 채널에 새 아티클이 등록됐어요',
  }

  const total = countRows[0]?.count ?? 0

  return {
    data: rows.map((n) => ({
      id: n.id,
      type: n.type,
      message: typeMessages[n.type]?.(n.actorNickname ?? '누군가') ?? '',
      linkUrl: n.linkUrl,
      isRead: n.isRead,
      actorAvatarUrl: n.actorAvatarUrl ?? null,
      createdAt: formatCommunityDate(n.createdAt),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  }
})
