import { eq } from 'drizzle-orm'
import { db } from '../db'
import { notifications, posts } from '../db/schema'

type NotifType = 'comment' | 'like' | 'dm'

interface CreateNotifOptions {
  userId: string
  actorId: string
  type: NotifType
  referenceId: string
  linkUrl: string
}

export async function createNotification(opts: CreateNotifOptions) {
  // 자기 자신에게는 알림 생성 안 함
  if (opts.userId === opts.actorId) return

  await db.insert(notifications).values({
    userId: opts.userId,
    actorId: opts.actorId,
    type: opts.type,
    referenceId: opts.referenceId,
    linkUrl: opts.linkUrl,
  })
}

export async function createCommentNotification(
  commentId: string,
  postId: string,
  actorId: string
) {
  const [post] = await db
    .select({ userId: posts.userId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)

  if (!post) return

  await createNotification({
    userId: post.userId,
    actorId,
    type: 'comment',
    referenceId: commentId,
    linkUrl: `/community/${postId}`,
  })
}

export async function createLikeNotification(postId: string, actorId: string) {
  const [post] = await db
    .select({ userId: posts.userId, deletedAt: posts.deletedAt })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)

  if (!post || post.deletedAt) return

  await createNotification({
    userId: post.userId,
    actorId,
    type: 'like',
    referenceId: postId,
    linkUrl: `/community/${postId}`,
  })
}
