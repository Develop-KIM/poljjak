import { and, desc, eq, isNull, or, sql } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { chatRooms, messages, posts, users } from '../../db/schema'
import { formatCommunityDate, getAuthorInitial } from '../../utils/community'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  // 내가 참여한 채팅방 목록 (마지막 메시지 포함)
  const rooms = await db
    .select({
      id: chatRooms.id,
      initiatorId: chatRooms.initiatorId,
      participantId: chatRooms.participantId,
      sourcePostId: chatRooms.sourcePostId,
      sourcePostTitle: chatRooms.sourcePostTitle,
    })
    .from(chatRooms)
    .where(
      or(eq(chatRooms.initiatorId, user.id), eq(chatRooms.participantId, user.id)),
    )

  if (rooms.length === 0) return { data: [] }

  const result = await Promise.all(
    rooms.map(async (room) => {
      const otherId = room.initiatorId === user.id ? room.participantId : room.initiatorId

      const [other] = await db
        .select({ nickname: users.nickname, avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, otherId))
        .limit(1)

      const [lastMsg] = await db
        .select({ content: messages.content, createdAt: messages.createdAt, isDeleted: messages.isDeleted })
        .from(messages)
        .where(eq(messages.roomId, room.id))
        .orderBy(desc(messages.createdAt))
        .limit(1)

      const unreadCount = await db
        .select({ count: sql<number>`CAST(COUNT(*) AS INTEGER)` })
        .from(messages)
        .where(
          sql`${messages.roomId} = ${room.id} AND ${messages.senderId} != ${user.id} AND ${messages.isRead} = false AND ${messages.isDeleted} = false`,
        )

      return {
        id: room.id,
        otherId,
        otherNickname: other?.nickname ?? '알 수 없음',
        otherInitial: getAuthorInitial(other?.nickname ?? '?'),
        otherAvatarUrl: other?.avatarUrl ?? null,
        lastMessage: lastMsg
          ? lastMsg.isDeleted
            ? '삭제된 메시지예요'
            : lastMsg.content
          : '',
        lastMessageAt: lastMsg ? formatCommunityDate(lastMsg.createdAt) : '',
        unreadCount: unreadCount[0]?.count ?? 0,
        sourcePostId: room.sourcePostId ?? null,
        sourcePostTitle: room.sourcePostTitle ?? null,
        sourcePostDeleted: await (async () => {
          if (!room.sourcePostId) return false
          const [p] = await db
            .select({ id: posts.id })
            .from(posts)
            .where(and(eq(posts.id, room.sourcePostId), isNull(posts.deletedAt)))
            .limit(1)
          return !p
        })(),
      }
    }),
  )

  // 마지막 메시지 최신순 정렬
  result.sort((a, b) => (a.lastMessageAt < b.lastMessageAt ? 1 : -1))

  return { data: result }
})
