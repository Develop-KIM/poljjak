import { and, asc, eq, isNull } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { comments, users } from '../../../db/schema'
import { formatCommunityDate, getAuthorInitial } from '../../../utils/community'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: '잘못된 요청이에요' })

  const [user, rows] = await Promise.all([
    getAuthUser(event),
    db
      .select({
        id: comments.id,
        userId: comments.userId,
        parentId: comments.parentId,
        mentionNickname: comments.mentionNickname,
        content: comments.content,
        createdAt: comments.createdAt,
        author: users.nickname,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(and(eq(comments.postId, id), isNull(comments.deletedAt)))
      .orderBy(asc(comments.createdAt)),
  ])

  interface ReplyItem {
    id: string
    author: string
    authorInitial: string
    authorAvatarUrl: string | null
    content: string
    createdAt: string
    isOwner: boolean
    mentionNickname: string | null
  }

  interface CommentItem extends ReplyItem {
    replies: ReplyItem[]
  }

  const topLevel: CommentItem[] = []
  const replyMap = new Map<string, ReplyItem[]>()

  for (const row of rows) {
    const author = row.author ?? '알 수 없음'
    const item = {
      id: row.id,
      author,
      authorInitial: getAuthorInitial(author),
      authorAvatarUrl: row.authorAvatarUrl ?? null,
      content: row.content,
      createdAt: formatCommunityDate(row.createdAt),
      isOwner: !!user && row.userId === user.id,
      mentionNickname: row.mentionNickname ?? null,
    }

    if (!row.parentId) {
      topLevel.push({ ...item, replies: [] })
    } else {
      const bucket = replyMap.get(row.parentId) ?? []
      bucket.push(item)
      replyMap.set(row.parentId, bucket)
    }
  }

  for (const comment of topLevel) {
    comment.replies = replyMap.get(comment.id) ?? []
  }

  return { data: topLevel }
})
