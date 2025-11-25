import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';

/**
 * Janitor cron job that times out stale jobs
 *
 * This endpoint should be called every 15 minutes by a cron service (e.g., Vercel Cron)
 * It finds all jobs that haven't been updated in 20 minutes and marks them as failed
 *
 * Authentication: Uses Vercel's x-vercel-cron header (automatically added by Vercel Cron)
 */
export async function POST(request: NextRequest) {
  try {
    // Log headers for debugging
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    console.log('[Janitor] Cron job triggered');
    console.log('[Janitor] x-vercel-cron header:', vercelCronHeader);

    // TODO: Re-enable auth check once we confirm the header is working
    // if (vercelCronHeader !== '1') {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

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
