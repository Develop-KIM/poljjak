import { asc, eq } from 'drizzle-orm'
import { getAuthUser } from '../../../utils/auth'
import { db } from '../../../db'
import { comments, users } from '../../../db/schema'
import { formatCommunityDate, getAuthorInitial, getAvatarUrl } from '../../../utils/community'

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
        deletedAt: comments.deletedAt,
        createdAt: comments.createdAt,
        author: users.nickname,
        authorAvatarUrl: users.avatarUrl,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.postId, id))
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
    isDeleted: boolean
    replies: ReplyItem[]
  }

  const topLevel: CommentItem[] = []
  const replyMap = new Map<string, ReplyItem[]>()

  for (const row of rows) {
    // 삭제된 대댓글은 완전히 제외
    if (row.deletedAt && row.parentId) continue

    const isDeleted = !!row.deletedAt
    const author = row.author ?? '알 수 없음'
    const item = {
      id: row.id,
      author: isDeleted ? '알 수 없음' : author,
      authorInitial: isDeleted ? '?' : getAuthorInitial(author),
      authorAvatarUrl: isDeleted ? null : getAvatarUrl(row.authorAvatarUrl, author),
      content: isDeleted ? '' : row.content,
      createdAt: formatCommunityDate(row.createdAt),
      isOwner: false, // 삭제된 댓글은 소유권 표시 안 함
      mentionNickname: isDeleted ? null : row.mentionNickname,
    }

    if (!row.parentId) {
      topLevel.push({
        ...item,
        isOwner: !isDeleted && !!user && row.userId === user.id,
        isDeleted,
        replies: [],
      })
    } else {
      const bucket = replyMap.get(row.parentId) ?? []
      bucket.push({ ...item, isOwner: !!user && row.userId === user.id })
      replyMap.set(row.parentId, bucket)
    }
  }

  for (const comment of topLevel) {
    comment.replies = replyMap.get(comment.id) ?? []
  }

  return { data: topLevel }
})
