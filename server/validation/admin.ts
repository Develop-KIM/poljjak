import { z } from 'zod'

export const promptCreateSchema = z.object({
  jobType: z.enum(['developer', 'designer']),
  content: z.string().min(1, 'content는 비어있을 수 없어요'),
})

export const userRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
})

export const userSuspendSchema = z.object({
  suspend: z.boolean(),
})

export const reportResolveSchema = z.object({
  deleteContent: z.boolean().optional().default(false),
})
