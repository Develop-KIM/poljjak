import { createClient } from '@supabase/supabase-js'

// 서버 시작 시 필요한 Storage 버킷을 자동 생성
export default defineNitroPlugin(async () => {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return

  const supabase = createClient(url, key)

  const { error } = await supabase.storage.createBucket('portfolios', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['application/pdf'],
  })

  if (error && !error.message.includes('already exists')) {
    console.error('[Storage] portfolios 버킷 생성 실패:', error.message)
  }
})
