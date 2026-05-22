import { z } from 'zod'

export const chatRoomCreateSchema = z.object({
  targetUserId: z.string().uuid(),
  sourcePostId: z.string().uuid().optional(),
  sourcePostTitle: z.string().max(200).optional(),
})

export const messageCreateSchema = z.object({
  content: z.string().trim().min(1).max(2000, '2000자 이하로 입력해주세요'),
})
