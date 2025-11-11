import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';

export const uploadRouter = createTRPCRouter({
  getUserUploads: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.upload.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }),

  getUploadById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const upload = await ctx.db.upload.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      return upload ?? null;
    }),

  deleteUpload: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.upload.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    }),
});
