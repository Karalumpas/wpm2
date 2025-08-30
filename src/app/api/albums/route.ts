import { NextRequest, NextResponse } from 'next/server';
import { photoPrismClient } from '@/lib/storage/photoprism';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    const albums = await photoPrismClient.getAlbums(count, offset);

    return NextResponse.json({
      albums,
      count: albums.length,
      offset,
      hasMore: albums.length === count,
    });
  } catch (error) {
    console.error('Error fetching albums:', error);
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const album = await photoPrismClient.createAlbum(title, description);

    return NextResponse.json({
      success: true,
      album,
    });
  } catch (error) {
    console.error('Error creating album:', error);
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    );
  }
}
