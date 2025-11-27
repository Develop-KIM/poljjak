import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const publicId = getRouterParam(event, 'id')

  if (!publicId) {
    throw createError({
      statusCode: 400,
      message: '게시글 ID가 필요합니다.',
    })
  }

  try {
    // 조회수 증가
    await prisma.post.update({
      where: { publicId },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    })

    // 게시글 상세 조회
    const post = await prisma.post.findUnique({
      where: { publicId },
      include: {
        author: {
          select: {
            publicId: true,
            name: true,
            nickname: true,
          },
        },
        files: {
          select: {
            id: true,
            originalName: true,
            fileName: true,
            filePath: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
          },
        },
        comments: {
          where: {
            parentId: null, // 최상위 댓글만
          },
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
            replies: {
              orderBy: {
                createdAt: 'asc',
              },
              include: {
                author: {
                  select: {
                    publicId: true,
                    name: true,
                    nickname: true,
                  },
                },
                replies: {
                  orderBy: {
                    createdAt: 'asc',
                  },
                  include: {
                    author: {
                      select: {
                        publicId: true,
                        name: true,
                        nickname: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!post) {
      throw createError({
        statusCode: 404,
        message: '게시글을 찾을 수 없습니다.',
      })
    }

    // 응답 데이터 포맷
    return {
      id: post.publicId,
      title: post.title,
      content: post.content,
      author: {
        id: post.author.publicId,
        name: post.author.nickname || post.author.name,
      },
      viewCount: post.viewCount,
      files: post.files,
      comments: formatComments(post.comments),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('게시글 조회 실패:', error)
    throw createError({
      statusCode: 500,
      message: '게시글을 불러오는데 실패했습니다.',
    })
  }
})

// 댓글 포맷 함수 (depth 포함)
function formatComments(comments) {
  return comments.map((comment) => ({
    id: comment.publicId,
    content: comment.content,
    author: {
      id: comment.author.publicId,
      name: comment.author.nickname || comment.author.name,
    },
    depth: comment.depth,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replies: comment.replies ? formatComments(comment.replies) : [],
  }))
}
