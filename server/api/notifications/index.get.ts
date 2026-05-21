import { desc, eq } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { notifications, users } from '../../db/schema'
import { formatCommunityDate } from '../../utils/community'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const rows = await db
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
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50)

  const typeMessages: Record<string, (actor: string) => string> = {
    comment: (a) => `${a}님이 내 게시글에 댓글을 달았어요`,
    like: (a) => `${a}님이 내 게시글을 좋아해요`,
    dm: (a) => `${a}님이 메시지를 보냈어요`,
    analysis: () => '포트폴리오 분석이 완료됐어요',
  }

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
  }
})
