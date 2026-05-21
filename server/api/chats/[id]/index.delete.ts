import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { chatRooms } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [room] = await db
    .select({
      id: chatRooms.id,
      initiatorId: chatRooms.initiatorId,
      participantId: chatRooms.participantId,
    })
    .from(chatRooms)
    .where(eq(chatRooms.id, id))
    .limit(1)

  if (!room) throw createError({ statusCode: 404, statusMessage: '채팅방을 찾을 수 없어요' })
  if (room.initiatorId !== user.id && room.participantId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })
  }

  const now = new Date()
  await db
    .update(chatRooms)
    .set(room.initiatorId === user.id ? { initiatorLeftAt: now } : { participantLeftAt: now })
    .where(eq(chatRooms.id, id))

  return { data: { ok: true } }
})
