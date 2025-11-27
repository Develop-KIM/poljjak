import prisma from '~/server/utils/prisma'
import { nanoid } from 'nanoid'

export default defineEventHandler(async (event) => {
  const user = event.context.user

  if (!user) {
    throw createError({
      statusCode: 401,
      message: '로그인이 필요합니다.',
    })
  }

  try {
    const { title, content, category, fileIds } = await readBody(event)

    // 유효성 검사
    if (!title || !title.trim()) {
      throw createError({
        statusCode: 400,
        message: '제목을 입력해주세요.',
      })
    }

    if (!content || !content.trim()) {
      throw createError({
        statusCode: 400,
        message: '내용을 입력해주세요.',
      })
    }

    if (!category || category === 'all') {
      throw createError({
        statusCode: 400,
        message: '카테고리를 선택해주세요.',
      })
    }

    if (title.length > 100) {
      throw createError({
        statusCode: 400,
        message: '제목은 100자를 초과할 수 없습니다.',
      })
    }

    // 게시글 생성
    const post = await prisma.post.create({
      data: {
        publicId: nanoid(10),
        title: title.trim(),
        content: content.trim(),
        category,
        authorId: user.id,
        ...(fileIds &&
          fileIds.length > 0 && {
            files: {
              connect: fileIds.map((id) => ({ id })),
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
      id: post.publicId,
      title: post.title,
      content: post.content,
      category: post.category,
      author: {
        id: post.author.publicId,
        name: post.author.nickname || post.author.name,
      },
      files: post.files,
      createdAt: post.createdAt,
    }
  } catch (error) {
    if (error.statusCode) {
      throw error
    }

    console.error('게시글 작성 실패:', error)
    throw createError({
      statusCode: 500,
      message: '게시글 작성에 실패했습니다.',
    })
  }
})
