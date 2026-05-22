import { and, eq } from 'drizzle-orm'
import { requireAdmin } from '../../../utils/admin'
import { promptCreateSchema } from '../../../validation/admin'
import { db } from '../../../db'
import { prompts } from '../../../db/schema'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)

  const body = await readValidatedBody(event, promptCreateSchema.parse)

  // 트랜잭션: 기존 활성 프롬프트 비활성화 → 새 프롬프트 삽입
  const newPrompt = await db.transaction(async (tx) => {
    // 1. 기존 is_active=true row를 false로 업데이트
    await tx
      .update(prompts)
      .set({ isActive: false })
      .where(and(eq(prompts.jobType, body.jobType), eq(prompts.isActive, true)))

    // 2. 새 row 삽입 (is_active=true, createdBy=어드민 id)
    const [inserted] = await tx
      .insert(prompts)
      .values({
        jobType: body.jobType,
        content: body.content,
        isActive: true,
        createdBy: admin.id,
      })
      .returning({ id: prompts.id })

    if (!inserted) {
      throw createError({ statusCode: 500, statusMessage: '프롬프트 저장에 실패했어요' })
    }

    return inserted
  })

  return { data: { id: newPrompt.id } }
})
