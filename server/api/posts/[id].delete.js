import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const publicId = getRouterParam(event, 'id')
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '로그인이 필요합니다.',
    })
  }

  if (!publicId) {
    throw createError({
      statusCode: 400,
      message: '게시글 ID가 필요합니다.',
    })
  }

  try {
    // 게시글 존재 및 권한 확인
    const post = await prisma.post.findUnique({
      where: { publicId },
      include: {
        files: true,
      },
    })

    if (!post) {
      throw createError({
        statusCode: 404,
        message: '게시글을 찾을 수 없습니다.',
      })
    }

    if (post.authorId !== user.id) {
      throw createError({
        statusCode: 403,
        message: '게시글을 삭제할 권한이 없습니다.',
      })
    }

    // 파일 삭제 (실제 파일 시스템에서)
    // TODO: 나중에 파일 업로드 구현 시 추가

    // 게시글 삭제 (cascade로 댓글, 파일도 자동 삭제)
    await prisma.post.delete({
      where: { publicId },
    })

    return {
      success: true,
      message: '게시글이 삭제되었습니다.',
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('게시글 삭제 실패:', error)
    throw createError({
      statusCode: 500,
      message: '게시글 삭제에 실패했습니다.',
    })
  }
})
