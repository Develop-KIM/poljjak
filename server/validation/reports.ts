import { z } from 'zod'

export const reportCreateSchema = z.object({
  targetType: z.enum(['post', 'comment']),
  targetId: z.string().uuid('잘못된 신고 대상이에요'),
  reason: z.string().min(1, '신고 사유를 선택해주세요').max(100),
})
