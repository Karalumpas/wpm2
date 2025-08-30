import { NextRequest, NextResponse } from 'next/server';
import {
  initializeMinIO,
  uploadFile,
  generateObjectName,
} from '@/lib/storage/minio';
import { db } from '@/db';
import { mediaFiles } from '@/db/schema';
import { auth } from '@/lib/auth-config';

// Initialize MinIO on first request
let minioInitialized = false;

async function ensureMinIOInitialized() {
  if (!minioInitialized) {
    await initializeMinIO();
    minioInitialized = true;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication - temporarily disabled for testing
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    const userId = '00000000-0000-0000-0000-000000000000'; // Temporary UUID for testing

    // Ensure MinIO is initialized
    await ensureMinIOInitialized();

    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string | null;
    const isFeatured = formData.get('isFeatured') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate object name
    const objectName = generateObjectName(file.name, productId || undefined);

    // Upload to MinIO
    const fileUrl = await uploadFile(buffer, objectName, file.type);

    // Get image dimensions (for images)
    let width: number | undefined;
    let height: number | undefined;

    // For images, we could parse dimensions, but for now we'll leave them undefined
    // In a production app, you might use a library like 'sharp' to get image dimensions

    // Save file metadata to database
    const [mediaFile] = await db
      .insert(mediaFiles)
      .values({
        fileName: file.name,
        originalFileName: file.name,
        objectName,
        fileSize: file.size.toString(),
        mimeType: file.type,
        width: width?.toString(),
        height: height?.toString(),
        minioUrl: fileUrl,
        productId: productId || null,
        userId: userId,
        isFeatured,
      })
      .returning();

    return NextResponse.json({
      success: true,
      file: {
        id: mediaFile.id,
        url: fileUrl,
        objectName,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        isFeatured,
        productId: productId || null,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File upload endpoint',
    methods: ['POST'],
    maxFileSize: '10MB',
    allowedTypes: ['image/*'],
    requiredFields: ['file'],
    optionalFields: ['productId', 'isFeatured'],
  });
}
