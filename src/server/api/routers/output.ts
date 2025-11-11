import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const outputRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.output.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const output = await ctx.db.output.findUnique({
        where: {
          id: input.id,
        },
      });

      // Ensure user owns this output
      if (output?.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return output;
    }),
});
