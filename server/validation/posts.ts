import { z } from 'zod'

export const postCategoryValues = ['feedback', 'project', 'study'] as const
export type PostCategory = (typeof postCategoryValues)[number]

export const feedbackJobTypes = [
  'frontend',
  'backend',
  'ios',
  'android',
  'fullstack',
  'data',
  'ai',
  'devops',
  'ux_ui',
  'brand',
  'motion',
  'pm',
] as const
export type FeedbackJobType = (typeof feedbackJobTypes)[number]

export const careerLevels = ['entry', 'junior', 'mid', 'senior'] as const
export type CareerLevel = (typeof careerLevels)[number]

const categoryInputMap = {
  feedback: 'feedback',
  project: 'project',
  study: 'study',
  피드백: 'feedback',
  '프로젝트 모집': 'project',
  '스터디 모집': 'study',
} as const satisfies Record<string, PostCategory>

const postCategoryInputSchema = z
  .enum(['feedback', 'project', 'study', '피드백', '프로젝트 모집', '스터디 모집'])
  .transform((category) => categoryInputMap[category])

export function parsePostCategory(value: unknown): PostCategory | null {
  const firstValue = Array.isArray(value) ? value[0] : value
  const result = postCategoryInputSchema.safeParse(firstValue)
  return result.success ? result.data : null
}

export const postCreateSchema = z
  .object({
    category: postCategoryInputSchema,
    title: z
      .string()
      .trim()
      .min(1, '제목을 입력해주세요')
      .max(100, '제목은 100자 이하로 입력해주세요'),
    body: z.string().trim().max(5000, '본문은 5000자 이하로 입력해주세요').default(''),
    analysisId: z.string().uuid('잘못된 분석 결과예요').optional().nullable(),
    imageUrls: z.array(z.string().url()).max(5).optional().default([]),
    jobType: z.enum(feedbackJobTypes).optional().nullable(),
    careerLevel: z.enum(careerLevels).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.analysisId && value.category !== 'feedback') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['analysisId'],
        message: '분석 결과는 피드백 글에만 첨부할 수 있어요',
      })
    }

    if (!value.analysisId && value.body.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['body'],
        message: '본문을 입력해주세요',
      })
    }
  })

export const postUpdateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해주세요')
    .max(100, '제목은 100자 이하로 입력해주세요'),
  body: z.string().trim().max(5000, '본문은 5000자 이하로 입력해주세요').default(''),
  imageUrls: z.array(z.string().url()).max(10).optional().default([]),
  recruitmentStatus: z.enum(['open', 'closed']).optional(),
})
