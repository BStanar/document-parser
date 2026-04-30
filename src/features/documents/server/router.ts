
import { prisma } from '@/lib/db'
import { createTRPCRouter, baseProcedure } from '@/trpc/init'
import { z } from 'zod'

export const documentsRouter = createTRPCRouter({
  getMany: baseProcedure
    .input(z.object({ search: z.string().default('') }))
    .query(async ({ input }) => {
      return prisma.document.findMany({
        where: input.search ? {
          filename: { contains: input.search, mode: 'insensitive' }
        } : undefined,
        include: { lineItems: true, issues: true },
        orderBy: { createdAt: 'desc' },
      })
    }),

  getOne: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return prisma.document.findUniqueOrThrow({
        where: { id: input.id },
        include: { lineItems: true, issues: true },
      })
    }),

  updateStatus: baseProcedure
    .input(z.object({ id: z.string(), status: z.enum(['UPLOADED', 'NEEDS_REVIEW', 'VALIDATED', 'REJECTED']) }))
    .mutation(async ({ input }) => {
      return prisma.document.update({
        where: { id: input.id },
        data: { status: input.status },
      })
    }),

  remove: baseProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return prisma.document.delete({ where: { id: input.id } })
    }),
})