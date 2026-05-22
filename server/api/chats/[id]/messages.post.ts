import { eq } from 'drizzle-orm'
import { requireAuth } from '../../../utils/auth'
import { db } from '../../../db'
import { chatRooms, messages, notifications } from '../../../db/schema'
import { messageCreateSchema } from '../../../validation/chats'

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
  if (room.initiatorId !== user.id && room.participantId !== user.id)
    throw createError({ statusCode: 403, statusMessage: '권한이 없어요' })

  const body = await readBody<unknown>(event)
  const parsed = messageCreateSchema.safeParse(body)

  if (!parsed.success)
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message ?? '입력값을 확인해주세요',
    })

  const [inserted] = await db
    .insert(messages)
    .values({ roomId: id, senderId: user.id, content: parsed.data.content })
    .returning({ id: messages.id, createdAt: messages.createdAt })

  if (!inserted) throw createError({ statusCode: 500, statusMessage: '메시지 전송에 실패했어요' })

  await db
    .update(chatRooms)
    .set({ initiatorLeftAt: null, participantLeftAt: null })
    .where(eq(chatRooms.id, id))

  // 상대방 알림
  const recipientId = room.initiatorId === user.id ? room.participantId : room.initiatorId
  if (recipientId !== user.id) {
    await db
      .insert(notifications)
      .values({
        userId: recipientId,
        actorId: user.id,
        type: 'dm',
        referenceId: inserted.id,
        linkUrl: `/chat`,
      })
      .catch(() => {})
  }

  return {
    data: {
      id: inserted.id,
      content: parsed.data.content,
      isMine: true,
      isDeleted: false,
      senderNickname: user.nickname,
      senderAvatarUrl: user.avatarUrl ?? null,
      createdAt: inserted.createdAt.toISOString(),
    },
  }
})
