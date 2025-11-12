import { postRouter } from '@/server/api/routers/post';
import { uploadRouter } from '@/server/api/routers/upload';
import { outputRouter } from '@/server/api/routers/output';
import { imageRouter } from '@/server/api/routers/image';
import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  upload: uploadRouter,
  output: outputRouter,
  image: imageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
