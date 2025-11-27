import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const page = parseInt(query.page) || 1
    const limit = parseInt(query.limit) || 20
    const skip = (page - 1) * limit

    const total = await prisma.post.count()

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            publicId: true,
            name: true,
            nickname: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    const formattedPosts = posts.map((post) => ({
      id: post.publicId,
      title: post.title,
      content: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''), // 미리보기
      author: {
        id: post.author.publicId,
        name: post.author.nickname || post.author.name,
      },
      viewCount: post.viewCount,
      commentCount: post._count.comments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }))

    return {
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    console.error('게시글 목록 조회 실패:', error)
    throw createError({
      statusCode: 500,
      message: '게시글 목록을 불러오는데 실패했습니다.',
    })
  }
})
