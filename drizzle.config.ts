import type { Config } from 'drizzle-kit'

// db:push 는 Session pooler(5432) 사용 — Transaction pooler(6543)는 DDL 미지원
function getMigrationUrl() {
  if (process.env.DIRECT_URL) return process.env.DIRECT_URL
  return (process.env.DATABASE_URL ?? '').replace(':6543/', ':5432/')
}

export default {
  schema: './server/db/schema',
  out: './server/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getMigrationUrl(),
  },
} satisfies Config
