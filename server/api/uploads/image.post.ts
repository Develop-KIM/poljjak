import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '../../utils/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!(file instanceof File)) {
    throw createError({ statusCode: 400, statusMessage: '파일을 업로드해주세요' })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw createError({ statusCode: 400, statusMessage: 'JPG, PNG, GIF, WEBP 형식만 지원해요' })
  }

  if (file.size > MAX_SIZE) {
    throw createError({ statusCode: 400, statusMessage: '파일 크기는 5MB 이하여야 해요' })
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage
    .from('post-images')
    .upload(filename, buffer, { contentType: file.type })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: '이미지 업로드에 실패했어요' })
  }

  const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(filename)

  return { data: { url: urlData.publicUrl } }
})
