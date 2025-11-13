import NextAuth from "next-auth";
import { cache } from "react";

import { authConfig, ECHO_APP_ID } from "./config";
import { db } from "@/server/db";

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

/**
 * Token response from Echo OAuth token endpoint
 */
interface EchoTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

/**
 * Refresh an expired Echo access token using the refresh token
 */
async function refreshEchoToken(refreshToken: string): Promise<EchoTokenResponse> {
  const response = await fetch("https://echo.merit.systems/api/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: ECHO_APP_ID,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh Echo token: ${response.status} ${error}`);
  }

  return response.json() as Promise<{ access_token: string; expires_in: number }>;
}

/**
 * Get a valid Echo JWT access token for the current user
 * Automatically refreshes the token if it's expired
 *
 * @returns The Echo JWT access token, or null if user is not authenticated
 */
export async function getEchoToken(): Promise<string | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const account = await db.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "echo",
    },
  });

  if (!account?.refresh_token) {
    return null;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  const isExpired = account.expires_at && account.expires_at < now;

  if (isExpired) {
    // Refresh the token
    const tokenData = await refreshEchoToken(account.refresh_token);

    // Update the database with new token and refresh token (if provided)
    const newExpiresAt = Math.floor(Date.now() / 1000) + tokenData.expires_in;

    await db.account.update({
      where: { id: account.id },
      data: {
        access_token: tokenData.access_token,
        expires_at: newExpiresAt,
        // Update refresh token if Echo provides a new one (token rotation)
        ...(tokenData.refresh_token && { refresh_token: tokenData.refresh_token }),
      },
    });

    return tokenData.access_token;
  }

  return account.access_token;
}

export { auth, handlers, signIn, signOut };
