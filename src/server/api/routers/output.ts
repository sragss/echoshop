import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const outputRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
          cursor: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const cursor = input?.cursor;

      const items = await ctx.db.output.findMany({
        where: {
          userId: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit + 1, // Take one extra to determine if there are more
        ...(cursor && {
          cursor: {
            id: cursor,
          },
          skip: 1, // Skip the cursor item
        }),
      });

      let nextCursor: string | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop(); // Remove the extra item
        nextCursor = nextItem?.id;
      }

      return {
        items,
        nextCursor,
      };
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
