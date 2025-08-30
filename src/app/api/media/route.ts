import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { mediaFiles } from '@/db/schema';
import { auth } from '@/lib/auth-config';
import { eq, and, desc } from 'drizzle-orm';
import { deleteFile } from '@/lib/storage/minio';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '24');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    let conditions = eq(mediaFiles.userId, session.user.id);
    
    if (productId) {
      conditions = and(conditions, eq(mediaFiles.productId, productId));
    }

    // Get media files
    const files = await db
      .select()
      .from(mediaFiles)
      .where(conditions)
      .orderBy(desc(mediaFiles.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      files,
      count: files.length,
      hasMore: files.length === limit,
    });

  } catch (error) {
    console.error('Error fetching media files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media files' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
    }

    // Get the file record
    const [file] = await db
      .select()
      .from(mediaFiles)
      .where(and(
        eq(mediaFiles.id, fileId),
        eq(mediaFiles.userId, session.user.id)
      ))
      .limit(1);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Delete from MinIO
    try {
      await deleteFile(file.objectName);
    } catch (minioError) {
      console.warn('Failed to delete file from MinIO:', minioError);
      // Continue with database deletion even if MinIO deletion fails
    }

    // Delete from database
    await db
      .delete(mediaFiles)
      .where(eq(mediaFiles.id, fileId));

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting media file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}