import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { requireAuth } from '../../utils/auth'
import { db } from '../../db'
import { chatRooms, posts, users } from '../../db/schema'
import { formatCommunityDate, getAuthorInitial, getAvatarUrl } from '../../utils/community'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const rooms = await db
    .select({
      id: chatRooms.id,
      initiatorId: chatRooms.initiatorId,
      participantId: chatRooms.participantId,
      sourcePostId: chatRooms.sourcePostId,
      sourcePostTitle: chatRooms.sourcePostTitle,
    })
    .from(chatRooms)
    .where(or(eq(chatRooms.initiatorId, user.id), eq(chatRooms.participantId, user.id)))

  if (rooms.length === 0) return { data: [] }

  const roomIds = rooms.map((r) => r.id)
  const otherIds = rooms.map((r) => (r.initiatorId === user.id ? r.participantId : r.initiatorId))

  // 상대방 정보 일괄 조회
  const otherUsers = await db
    .select({ id: users.id, nickname: users.nickname, avatarUrl: users.avatarUrl })
    .from(users)
    .where(
      sql`${users.id} = ANY(ARRAY[${sql.join(
        otherIds.map((id) => sql`${id}::uuid`),
        sql`, `
      )}])`
    )

  const otherMap = new Map(otherUsers.map((u) => [u.id, u]))

  // 마지막 메시지 일괄 조회 (DISTINCT ON)
  type LastMsgRow = { room_id: string; content: string; is_deleted: boolean; created_at: Date }
  const lastMsgs = (await db.execute(sql`
    SELECT DISTINCT ON (room_id) room_id, content, is_deleted, created_at
    FROM messages
    WHERE room_id = ANY(ARRAY[${sql.join(
      roomIds.map((id) => sql`${id}::uuid`),
      sql`, `
    )}])
    ORDER BY room_id, created_at DESC
  `)) as LastMsgRow[]

  const lastMsgMap = new Map(lastMsgs.map((m) => [m.room_id, m]))

  // 안 읽은 메시지 수 일괄 조회
  type UnreadRow = { room_id: string; cnt: string }
  const unreadCounts = (await db.execute(sql`
    SELECT room_id, COUNT(*)::int AS cnt
    FROM messages
    WHERE room_id = ANY(ARRAY[${sql.join(
      roomIds.map((id) => sql`${id}::uuid`),
      sql`, `
    )}])
      AND sender_id != ${user.id}
      AND is_read = false
      AND is_deleted = false
    GROUP BY room_id
  `)) as UnreadRow[]

  const unreadMap = new Map(unreadCounts.map((r) => [r.room_id, Number(r.cnt)]))

  // 출처 게시글 삭제 여부 일괄 확인
  const sourcePostIds = rooms.map((r) => r.sourcePostId).filter(Boolean) as string[]
  const activePosts =
    sourcePostIds.length > 0
      ? await db
          .select({ id: posts.id })
          .from(posts)
          .where(
            and(
              sql`${posts.id} = ANY(ARRAY[${sql.join(
                sourcePostIds.map((id) => sql`${id}::uuid`),
                sql`, `
              )}])`,
              isNull(posts.deletedAt)
            )
          )
      : []

  const activePostIds = new Set(activePosts.map((p) => p.id))

  const result = rooms.map((room) => {
    const otherId = room.initiatorId === user.id ? room.participantId : room.initiatorId
    const other = otherMap.get(otherId)
    const lastMsg = lastMsgMap.get(room.id)
    const nickname = other?.nickname ?? '알 수 없음'

    return {
      id: room.id,
      otherId,
      otherNickname: nickname,
      otherInitial: getAuthorInitial(nickname),
      otherAvatarUrl: getAvatarUrl(other?.avatarUrl, nickname),
      lastMessage: lastMsg ? (lastMsg.is_deleted ? '삭제된 메시지예요' : lastMsg.content) : '',
      lastMessageAt: lastMsg ? formatCommunityDate(lastMsg.created_at) : '',
      // 정렬용 raw timestamp (클라이언트 반환 안 함)
      _ts: lastMsg ? lastMsg.created_at.getTime() : 0,
      unreadCount: unreadMap.get(room.id) ?? 0,
      sourcePostId: room.sourcePostId ?? null,
      sourcePostTitle: room.sourcePostTitle ?? null,
      sourcePostDeleted: room.sourcePostId ? !activePostIds.has(room.sourcePostId) : false,
    }
  })

  // 최근 메시지 순 정렬 (raw timestamp 기준)
  result.sort((a, b) => b._ts - a._ts)

  return { data: result.map(({ _ts, ...r }) => r) }
})
