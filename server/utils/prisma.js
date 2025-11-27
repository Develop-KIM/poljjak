import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

const isDevelopment = process.env.NODE_ENV === 'development'

if (isDevelopment) {
  globalForPrisma.prisma = prisma
}

export default prisma
