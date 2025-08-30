import { NextRequest, NextResponse } from 'next/server';
import { photoPrismClient } from '@/lib/storage/photoprism';

interface RouteParams {
  params: Promise<{
    uid: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { uid } = await params;
    
    const photo = await photoPrismClient.getPhoto(uid);

    // Add URLs to the photo object
    const photoWithUrls = {
      ...photo,
      thumbnailUrl: photoPrismClient.getPhotoThumbnailUrl(photo.UID, 'tile_224'),
      previewUrl: photoPrismClient.getPhotoThumbnailUrl(photo.UID, 'fit_720'),
      fullUrl: photoPrismClient.getPhotoThumbnailUrl(photo.UID, 'fit_1920'),
      downloadUrl: photoPrismClient.getPhotoDownloadUrl(photo.UID),
    };

    return NextResponse.json(photoWithUrls);

  } catch (error) {
    console.error(`Error fetching photo ${await params.then(p => p.uid)}:`, error);
    return NextResponse.json(
      { error: 'Photo not found' },
      { status: 404 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { uid } = await params;
    const body = await request.json();
    
    const updatedPhoto = await photoPrismClient.updatePhoto(uid, body);

    // Add URLs to the updated photo object
    const photoWithUrls = {
      ...updatedPhoto,
      thumbnailUrl: photoPrismClient.getPhotoThumbnailUrl(updatedPhoto.UID, 'tile_224'),
      previewUrl: photoPrismClient.getPhotoThumbnailUrl(updatedPhoto.UID, 'fit_720'),
      fullUrl: photoPrismClient.getPhotoThumbnailUrl(updatedPhoto.UID, 'fit_1920'),
      downloadUrl: photoPrismClient.getPhotoDownloadUrl(updatedPhoto.UID),
    };

    return NextResponse.json(photoWithUrls);

  } catch (error) {
    console.error(`Error updating photo ${await params.then(p => p.uid)}:`, error);
    return NextResponse.json(
      { error: 'Failed to update photo' },
      { status: 500 }
    );
  }
}