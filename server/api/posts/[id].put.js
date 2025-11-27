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
    const { title, content, fileIds } = await readBody(event)

    // 게시글 존재 및 권한 확인
    const existingPost = await prisma.post.findUnique({
      where: { publicId },
    })

    if (!existingPost) {
      throw createError({
        statusCode: 404,
        message: '게시글을 찾을 수 없습니다.',
      })
    }

    if (existingPost.authorId !== user.id) {
      throw createError({
        statusCode: 403,
        message: '게시글을 수정할 권한이 없습니다.',
      })
    }

    // 유효성 검사
    if (!title || !content) {
      throw createError({
        statusCode: 400,
        message: '제목과 내용은 필수입니다.',
      })
    }

    if (title.length > 100) {
      throw createError({
        statusCode: 400,
        message: '제목은 100자를 초과할 수 없습니다.',
      })
    }

    // 게시글 수정
    const updatedPost = await prisma.post.update({
      where: { publicId },
      data: {
        title,
        content,
        // 파일 업데이트 (기존 파일 연결 해제 후 새로 연결)
        ...(fileIds && {
          files: {
            set: [], // 기존 연결 해제
            connect: fileIds.map((id) => ({ id })), // 새로 연결
          },
        }),
      },
      include: {
        author: {
          select: {
            publicId: true,
            name: true,
            nickname: true,
          },
        },
        files: true,
      },
    })

    return {
      id: updatedPost.publicId,
      title: updatedPost.title,
      content: updatedPost.content,
      author: {
        id: updatedPost.author.publicId,
        name: updatedPost.author.nickname || updatedPost.author.name,
      },
      files: updatedPost.files,
      updatedAt: updatedPost.updatedAt,
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('게시글 수정 실패:', error)
    throw createError({
      statusCode: 500,
      message: '게시글 수정에 실패했습니다.',
    })
  }
})
