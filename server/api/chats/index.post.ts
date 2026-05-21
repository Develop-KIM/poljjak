import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { chatRooms, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody<unknown>(event)
  const parsed = z
    .object({
      targetUserId: z.string().uuid(),
      sourcePostId: z.string().uuid().optional(),
      sourcePostTitle: z.string().max(200).optional(),
    })
    .safeParse(body)

  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const { targetUserId, sourcePostId, sourcePostTitle } = parsed.data
  if (targetUserId === user.id)
    throw createError({ statusCode: 400, statusMessage: '자기 자신과 채팅할 수 없어요' })

  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, targetUserId), isNull(users.deletedAt)))
    .limit(1)

  if (!target) throw createError({ statusCode: 404, statusMessage: '상대방을 찾을 수 없어요' })

  const [a, b] = [user.id, targetUserId].sort()
  const initiatorId = a!
  const participantId = b!

  const [existing] = await db
    .select({ id: chatRooms.id, sourcePostId: chatRooms.sourcePostId })
    .from(chatRooms)
    .where(and(eq(chatRooms.initiatorId, initiatorId), eq(chatRooms.participantId, participantId)))
    .limit(1)

  if (existing) {
    // 게시글 정보가 없으면 업데이트
    if (!existing.sourcePostId && sourcePostId) {
      await db
        .update(chatRooms)
        .set({ sourcePostId, sourcePostTitle: sourcePostTitle ?? null })
        .where(eq(chatRooms.id, existing.id))
    }
    return { data: { id: existing.id } }
  }

  const [created] = await db
    .insert(chatRooms)
    .values({ initiatorId, participantId, sourcePostId, sourcePostTitle })
    .returning({ id: chatRooms.id })

  if (!created) throw createError({ statusCode: 500, statusMessage: '채팅방 생성에 실패했어요' })

  return { data: { id: created.id } }
})
