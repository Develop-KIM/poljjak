import { asc, eq, or } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { chatRooms, messages, users } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [room] = await db
    .select({ id: chatRooms.id, initiatorId: chatRooms.initiatorId, participantId: chatRooms.participantId })
    .from(chatRooms)
    .where(eq(chatRooms.id, id))
    .limit(1)

  if (!room) throw createError({ statusCode: 404, statusMessage: '채팅방을 찾을 수 없어요' })
  if (room.initiatorId !== user.id && room.participantId !== user.id)
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })

  const rows = await db
    .select({
      id: messages.id,
      content: messages.content,
      senderId: messages.senderId,
      isDeleted: messages.isDeleted,
      createdAt: messages.createdAt,
      senderNickname: users.nickname,
      senderAvatarUrl: users.avatarUrl,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(eq(messages.roomId, id))
    .orderBy(asc(messages.createdAt))
    .limit(200)

  // 읽음 처리
  await db
    .update(messages)
    .set({ isRead: true })
    .where(
      or(
        eq(messages.roomId, id),
      ),
    )

  return {
    data: rows.map((m) => ({
      id: m.id,
      content: m.isDeleted ? null : m.content,
      isMine: m.senderId === user.id,
      isDeleted: m.isDeleted,
      senderNickname: m.senderNickname ?? '알 수 없음',
      senderAvatarUrl: m.senderAvatarUrl ?? null,
      createdAt: m.createdAt.toISOString(),
    })),
  }
})
