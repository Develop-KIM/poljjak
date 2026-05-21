import { eq } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { users } from '../../db/schema'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 3 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: '파일을 업로드해주세요' })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'JPG, PNG, WEBP 형식만 지원해요' })
  }
  if (file.size > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: '파일 크기는 3MB 이하여야 해요' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${user.id}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from('avatars')
    .upload(filename, buffer, { contentType: file.type, upsert: true })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: '이미지 업로드에 실패했어요' })
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename)
  const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

  await db.update(users).set({ avatarUrl, updatedAt: new Date() }).where(eq(users.id, user.id))

  return { data: { avatarUrl } }
})
