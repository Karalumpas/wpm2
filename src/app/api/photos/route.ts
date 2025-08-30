import { NextRequest, NextResponse } from 'next/server';
import { photoPrismClient } from '@/lib/storage/photoprism';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || undefined;
    const count = parseInt(searchParams.get('count') || '24');
    const offset = parseInt(searchParams.get('offset') || '0');

    const photos = await photoPrismClient.searchPhotos(query, count, offset);

    // Transform photos to include thumbnail URLs
    const photosWithUrls = photos.map(photo => ({
      ...photo,
      thumbnailUrl: photoPrismClient.getPhotoThumbnailUrl(photo.UID, 'tile_224'),
      previewUrl: photoPrismClient.getPhotoThumbnailUrl(photo.UID, 'fit_720'),
      downloadUrl: photoPrismClient.getPhotoDownloadUrl(photo.UID),
    }));

    return NextResponse.json({
      photos: photosWithUrls,
      count: photos.length,
      offset,
      hasMore: photos.length === count,
    });

  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'index':
        await photoPrismClient.startIndexing();
        return NextResponse.json({ message: 'Indexing started' });

      case 'status':
        const status = await photoPrismClient.getIndexingStatus();
        return NextResponse.json(status);

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error handling photo action:', error);
    return NextResponse.json(
      { error: 'Failed to handle action' },
      { status: 500 }
    );
  }
}