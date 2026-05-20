import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const chatRooms = pgTable(
  'chat_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // initiatorId: 채팅을 먼저 건 사람
    // participantId: 채팅 상대방
    // FK 없음 — 앱 레이어에서 users 조회 (DDD)
    initiatorId: uuid('initiator_id').notNull(),
    participantId: uuid('participant_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    // 두 사람 간 채팅방 중복 방지
    // 앱 레이어에서 항상 작은 UUID → initiatorId 로 정렬 후 생성
    uniqueIndex('chat_rooms_users_unique').on(t.initiatorId, t.participantId),
  ]
)

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  // FK 없음 — 앱 레이어에서 chatRooms / users 조회 (DDD)
  roomId: uuid('room_id').notNull(),
  senderId: uuid('sender_id').notNull(),
  content: text('content').notNull(),
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
