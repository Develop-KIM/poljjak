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

  const list = rows.map((c) => {
    const author = c.author ?? '알 수 없음'
    return {
      id: c.id,
      author,
      authorInitial: getAuthorInitial(author),
      authorAvatarUrl: c.authorAvatarUrl ?? null,
      content: c.content,
      createdAt: formatCommunityDate(c.createdAt),
      isOwner: !!user && c.userId === user.id,
    }
  })

  return { data: list }
})
