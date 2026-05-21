import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'

export const chatRooms = pgTable(
  'chat_rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    initiatorId: uuid('initiator_id').notNull(),
    participantId: uuid('participant_id').notNull(),
    sourcePostId: uuid('source_post_id'),
    sourcePostTitle: text('source_post_title'),
    initiatorLeftAt: timestamp('initiator_left_at'),
    participantLeftAt: timestamp('participant_left_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('chat_rooms_users_unique').on(t.initiatorId, t.participantId),
    index('chat_rooms_initiator_id_idx').on(t.initiatorId),
    index('chat_rooms_participant_id_idx').on(t.participantId),
  ]
)

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id').notNull(),
    senderId: uuid('sender_id').notNull(),
    content: text('content').notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    isRead: boolean('is_read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('messages_room_id_created_at_idx').on(t.roomId, t.createdAt),
    index('messages_sender_id_idx').on(t.senderId),
  ]
)
