export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { shops } from '@/db/schema';
import { backgroundSyncQueue } from '@/lib/sync/background';
import { eq } from 'drizzle-orm';

// POST: enqueue background sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const shopId: string | undefined = body?.shopId;

    const jobIds: string[] = [];

    if (shopId) {
      // Validate shop exists
      const exists = await db
        .select({ id: shops.id })
        .from(shops)
        .where(eq(shops.id, shopId))
        .limit(1);
      if (exists.length === 0) {
        return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      }
      const job = backgroundSyncQueue.enqueue(shopId);
      jobIds.push(job.id);
    } else {
      // Enqueue for all shops
      const all = await db.select({ id: shops.id }).from(shops);
      for (const s of all) {
        const job = backgroundSyncQueue.enqueue(s.id);
        jobIds.push(job.id);
      }
    }

    return NextResponse.json({ accepted: true, jobs: jobIds }, { status: 202 });
  } catch (error) {
    console.error('Background sync enqueue error:', error);
    return NextResponse.json(
      { error: 'Failed to enqueue sync' },
      { status: 500 }
    );
  }
}

// GET: query background sync status
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId') || undefined;
  if (jobId) {
    const job = backgroundSyncQueue.get(jobId);
    if (!job)
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    return NextResponse.json(job);
  }
  return NextResponse.json({ jobs: backgroundSyncQueue.list() });
}

// PATCH: control a job (pause/resume/cancel)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const jobId: string | undefined = body?.jobId;
    const action: 'pause' | 'resume' | 'cancel' | undefined = body?.action;
    if (!jobId || !action) {
      return NextResponse.json(
        { error: 'Missing jobId or action' },
        { status: 400 }
      );
    }

    let job;
    if (action === 'pause') job = backgroundSyncQueue.pause(jobId);
    else if (action === 'resume') job = backgroundSyncQueue.resume(jobId);
    else if (action === 'cancel') job = backgroundSyncQueue.cancel(jobId);
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    return NextResponse.json(job);
  } catch (error) {
    console.error('Control job error:', error);
    return NextResponse.json({ error: 'Failed to control job' }, { status: 500 });
  }
}

// DELETE: remove a job from the list
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const jobId: string | undefined = body?.jobId;
    if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    const ok = backgroundSyncQueue.remove(jobId);
    if (!ok) return NextResponse.json({ error: 'Cannot remove (not found or running)' }, { status: 400 });
    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error('Remove job error:', error);
    return NextResponse.json({ error: 'Failed to remove job' }, { status: 500 });
  }
}
