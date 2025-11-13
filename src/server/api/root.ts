import { uploadRouter } from '@/server/api/routers/upload';
import { jobRouter } from '@/server/api/routers/job';
import { balanceRouter } from '@/server/api/routers/balance';
import { createCallerFactory, createTRPCRouter } from '@/server/api/trpc';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  upload: uploadRouter,
  job: jobRouter,
  balance: balanceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.video.list();
 */
export const createCaller = createCallerFactory(appRouter);
