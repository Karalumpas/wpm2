import { NextRequest, NextResponse } from 'next/server';
import { createSyncServiceForShop } from '@/lib/woo/sync-service';
import type { SyncProgress } from '@/lib/woo/types';

export async function POST(request: NextRequest) {
  try {
    const { shopId } = await request.json();

    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      );
    }

    // Create sync service
    const syncService = await createSyncServiceForShop(shopId);

    // Track progress
    const progressHistory: SyncProgress[] = [];
    syncService.setProgressCallback((progress) => {
      progressHistory.push(progress);
      console.log(`Sync Progress: ${progress.stage} - ${progress.current}/${progress.total} - ${progress.message}`);
    });

    // Start synchronization
    const result = await syncService.syncAll();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      details: result.details,
      progress: progressHistory,
    });

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { 
        error: 'Synchronization failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
