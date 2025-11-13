import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getEchoToken } from "@/server/auth";
import { EchoClient } from '@merit-systems/echo-typescript-sdk';

/**
 * Get the current Echo balance for the authenticated user
 * TODO: Implement the actual balance fetching logic
 */
async function getEchoBalance(): Promise<number> {
  const token = await getEchoToken();
  if (!token) {
    throw new Error("No Echo token available. User may not be authenticated.");
  }
  const echo = new EchoClient({apiKey: token});

  const balance = await echo.balance.getBalance();
  return balance.balance;
}

export const balanceRouter = createTRPCRouter({
  /**
   * Get the current Echo balance for the authenticated user
   */
  get: protectedProcedure.query(async () => {
    const balance = await getEchoBalance();
    return { balance };
  }),
});
