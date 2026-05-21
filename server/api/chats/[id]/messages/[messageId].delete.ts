import { and, eq } from 'drizzle-orm'
import { requireAuth } from '../../../../utils/auth'
import { db } from '../../../../db'
import { chatRooms, messages } from '../../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const roomId = getRouterParam(event, 'id')
  const messageId = getRouterParam(event, 'messageId')
  if (!roomId || !messageId) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })
  }

  const [room] = await db
    .select({ initiatorId: chatRooms.initiatorId, participantId: chatRooms.participantId })
    .from(chatRooms)
    .where(eq(chatRooms.id, roomId))
    .limit(1)

  if (!room) throw createError({ statusCode: 404, statusMessage: '채팅방을 찾을 수 없어요' })
  if (room.initiatorId !== user.id && room.participantId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })
  }

  const [message] = await db
    .select({ id: messages.id, senderId: messages.senderId, isDeleted: messages.isDeleted })
    .from(messages)
    .where(and(eq(messages.id, messageId), eq(messages.roomId, roomId)))
    .limit(1)

  if (!message) throw createError({ statusCode: 404, statusMessage: '메시지를 찾을 수 없어요' })
  if (message.senderId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: '내 메시지만 삭제할 수 있어요' })
  }

  if (!message.isDeleted) {
    await db
      .update(messages)
      .set({ isDeleted: true })
      .where(and(eq(messages.id, messageId), eq(messages.roomId, roomId)))
  }

  return { data: { id: messageId, isDeleted: true } }
})
