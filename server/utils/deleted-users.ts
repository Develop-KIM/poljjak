import { randomUUID } from 'node:crypto'
import { and, eq, lt, or } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { db } from '../db'
import {
  analyses,
  chatRooms,
  comments,
  likes,
  messages,
  notifications,
  posts,
  reports,
  users,
} from '../db/schema'

const DELETE_GRACE_DAYS = 30
const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public/'

export function getDeletedUserCutoff(now = new Date()) {
  return new Date(now.getTime() - DELETE_GRACE_DAYS * 24 * 60 * 60 * 1000)
}

function createAdminSupabaseClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function extractStoragePath(publicUrl: string | null, bucket: string) {
  if (!publicUrl) return null

  try {
    const url = new URL(publicUrl)
    const marker = `${STORAGE_PUBLIC_PREFIX}${bucket}/`
    const markerIndex = url.pathname.indexOf(marker)
    if (markerIndex < 0) return null

    return decodeURIComponent(url.pathname.slice(markerIndex + marker.length))
  } catch {
    return null
  }
}

async function deleteStorageFiles(userId: string) {
  const supabase = createAdminSupabaseClient()
  const [user] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const avatarPath = extractStoragePath(user?.avatarUrl ?? null, 'avatars')
  if (avatarPath) {
    const { error } = await supabase.storage.from('avatars').remove([avatarPath])
    if (error) throw error
  }
}

async function deleteAuthUser(userId: string) {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw error
}

interface HardDeleteUserOptions {
  deleteAuth?: boolean
}

export async function hardDeleteUser(userId: string, options: HardDeleteUserOptions = {}) {
  const deleteAuth = options.deleteAuth ?? true
  const tombstoneId = randomUUID()

  await deleteStorageFiles(userId)

  await db.transaction(async (tx) => {
    // 재가입 시 기존 활동이 다시 연결되지 않도록 작성자 ID를 익명 ID로 분리한다.
    await tx
      .update(posts)
      .set({ userId: tombstoneId, updatedAt: new Date() })
      .where(eq(posts.userId, userId))
    await tx
      .update(comments)
      .set({ userId: tombstoneId, updatedAt: new Date() })
      .where(eq(comments.userId, userId))
    await tx.update(messages).set({ senderId: tombstoneId }).where(eq(messages.senderId, userId))
    await tx
      .update(chatRooms)
      .set({ initiatorId: tombstoneId })
      .where(eq(chatRooms.initiatorId, userId))
    await tx
      .update(chatRooms)
      .set({ participantId: tombstoneId })
      .where(eq(chatRooms.participantId, userId))

    await tx.delete(analyses).where(eq(analyses.userId, userId))
    await tx.delete(likes).where(eq(likes.userId, userId))
    await tx
      .delete(notifications)
      .where(or(eq(notifications.userId, userId), eq(notifications.actorId, userId)))
    await tx.delete(reports).where(eq(reports.reporterId, userId))
    await tx.delete(users).where(eq(users.id, userId))
  })

  if (deleteAuth) {
    await deleteAuthUser(userId)
  }
}

export async function hardDeleteExpiredUsers(cutoff = getDeletedUserCutoff()) {
  const expiredUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(and(lt(users.deletedAt, cutoff)))

  if (expiredUsers.length === 0) {
    return { deleted: 0, userIds: [] as string[], cutoff }
  }

  const userIds = expiredUsers.map((user) => user.id)

  for (const userId of userIds) {
    await hardDeleteUser(userId)
  }

  return { deleted: userIds.length, userIds, cutoff }
}
