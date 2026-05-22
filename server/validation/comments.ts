import { z } from 'zod'

export const commentCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, '댓글을 입력해주세요')
    .max(1000, '댓글은 1000자 이하로 입력해주세요'),
  parentId: z.string().uuid().optional().nullable(),
  mentionNickname: z.string().max(50).optional().nullable(),
})
