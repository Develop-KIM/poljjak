import { z } from 'zod'

export const onboardingSchema = z.object({
  nickname: z.string().regex(/^[가-힣a-zA-Z0-9]{2,15}$/, '닉네임 형식이 올바르지 않아요'),
  jobType: z.enum(['developer', 'designer']).nullable().optional(),
  agreedMarketing: z.boolean().optional().default(false),
})
