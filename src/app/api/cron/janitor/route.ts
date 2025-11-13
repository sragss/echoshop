import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { env } from '@/env';

/**
 * Janitor cron job that times out stale jobs
 *
 * This endpoint should be called every 15 minutes by a cron service (e.g., Vercel Cron)
 * It finds all jobs that haven't been updated in 20 minutes and marks them as failed
 *
 * Authentication: Requires JANITOR_SECRET in Authorization header
 *
 * Example curl:
 * curl -X POST https://your-app.com/api/cron/janitor \
 *   -H "Authorization: Bearer YOUR_JANITOR_SECRET"
 */
export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token || token !== env.JANITOR_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate the cutoff time (20 minutes ago)
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);

    // Find stale jobs (pending or loading, not updated in 20 minutes)
    const staleJobs = await db.job.findMany({
      where: {
        status: {
          in: ['pending', 'loading']
        },
        updatedAt: {
          lt: twentyMinutesAgo
        }
      },
      select: {
        id: true,
        type: true,
        updatedAt: true,
      }
    });

    // Update all stale jobs to failed
    if (staleJobs.length > 0) {
      await db.job.updateMany({
        where: {
          id: {
            in: staleJobs.map(job => job.id)
          }
        },
        data: {
          status: 'failed',
          error: 'Timed out after 20 minutes',
          updatedAt: new Date(),
        }
      });

      console.log(`[Janitor] Timed out ${staleJobs.length} stale jobs:`,
        staleJobs.map(j => `${j.id} (${j.type})`).join(', ')
      );
    }

    return NextResponse.json({
      success: true,
      timedOutCount: staleJobs.length,
      jobs: staleJobs.map(j => ({
        id: j.id,
        type: j.type,
        lastUpdate: j.updatedAt,
      }))
    });

  } catch (error) {
    console.error('[Janitor] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also support GET for easier testing (still requires auth)
export async function GET(request: NextRequest) {
  return POST(request);
}
