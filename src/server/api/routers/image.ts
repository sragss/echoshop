import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateImageSchema, editImageSchema } from "@/lib/generation-schema";
import { generateImage, editImage } from "@/server/ai/image";

export const imageRouter = createTRPCRouter({
  generate: protectedProcedure
    .input(generateImageSchema)
    .mutation(async ({ ctx, input }) => {
      return generateImage(input, ctx.session.user.id);
    }),

  edit: protectedProcedure
    .input(editImageSchema)
    .mutation(async ({ ctx, input }) => {
      return editImage(input, ctx.session.user.id);
    }),
});
