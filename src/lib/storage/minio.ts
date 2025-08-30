import * as Minio from 'minio';
import { db } from '@/db';
import { mediaFiles } from '@/db/schema';
import { eq } from 'drizzle-orm';

// MinIO configuration
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = parseInt(process.env.MINIO_PORT || '9000');
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin123';
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';

// Default bucket for product images
export const DEFAULT_BUCKET = 'wpm2-product-images';

// Create MinIO client
export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: MINIO_USE_SSL,
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

// Initialize MinIO buckets
export async function initializeMinIO() {
  try {
    // Check if bucket exists, create if it doesn't
    const bucketExists = await minioClient.bucketExists(DEFAULT_BUCKET);

    if (!bucketExists) {
      await minioClient.makeBucket(DEFAULT_BUCKET, 'us-east-1');
      console.log(`Created bucket: ${DEFAULT_BUCKET}`);

      // Set bucket policy to allow public read access for product images
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${DEFAULT_BUCKET}/*`],
          },
        ],
      };

      await minioClient.setBucketPolicy(DEFAULT_BUCKET, JSON.stringify(policy));
      console.log(`Set public read policy for bucket: ${DEFAULT_BUCKET}`);
    }

    console.log('MinIO initialized successfully');
  } catch (error) {
    console.error('Error initializing MinIO:', error);
    throw error;
  }
}

// Helper function to generate object name
export function generateObjectName(
  fileName: string,
  productId?: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

  if (productId) {
    return `products/${productId}/${timestamp}_${sanitizedFileName}`;
  }

  return `uploads/${timestamp}_${sanitizedFileName}`;
}

// Helper function to get file URL
export function getFileUrl(objectName: string): string {
  return `http://${MINIO_ENDPOINT}:${MINIO_PORT}/${DEFAULT_BUCKET}/${objectName}`;
}

// Upload file to MinIO
export async function uploadFile(
  file: Buffer,
  objectName: string,
  contentType: string
): Promise<string> {
  try {
    await minioClient.putObject(DEFAULT_BUCKET, objectName, file, file.length, {
      'Content-Type': contentType,
    });

    return getFileUrl(objectName);
  } catch (error) {
    console.error('Error uploading file to MinIO:', error);
    throw error;
  }
}

// Delete file from MinIO
export async function deleteFile(objectName: string): Promise<void> {
  try {
    await minioClient.removeObject(DEFAULT_BUCKET, objectName);
  } catch (error) {
    console.error('Error deleting file from MinIO:', error);
    throw error;
  }
}

// List files in bucket
export async function listFiles(prefix?: string): Promise<string[]> {
  try {
    const objectsList: string[] = [];
    const effectivePrefix: string = prefix ?? '';
    const stream = minioClient.listObjects(
      DEFAULT_BUCKET,
      effectivePrefix,
      true
    );

    return new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        if (obj?.name) objectsList.push(obj.name);
      });
      stream.on('error', reject);
      stream.on('end', () => resolve(objectsList));
    });
  } catch (error) {
    console.error('Error listing files from MinIO:', error);
    throw error;
  }
}

// Guess basic image content-type from file extension
function guessMimeType(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

// Get object as Buffer
async function getObjectBuffer(objectName: string): Promise<Buffer> {
  const stream: NodeJS.ReadableStream = await minioClient.getObject(
    DEFAULT_BUCKET,
    objectName
  );
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

// Fix content-type metadata for a single object if missing/invalid.
export async function fixObjectContentType(
  objectName: string
): Promise<{ updated: boolean; contentType?: string }> {
  try {
    const stat = await minioClient.statObject(DEFAULT_BUCKET, objectName);
    const current = (stat.metaData && (stat.metaData['content-type'] as string)) || '';
    const desired = guessMimeType(objectName);

    if (current && current.startsWith('image/')) {
      return { updated: false, contentType: current };
    }

    // Read and re-upload to set metadata
    const buffer = await getObjectBuffer(objectName);
    await minioClient.putObject(
      DEFAULT_BUCKET,
      objectName,
      buffer,
      buffer.length,
      { 'Content-Type': desired }
    );
    return { updated: true, contentType: desired };
  } catch (error) {
    console.error('Error fixing content-type for', objectName, error);
    throw error;
  }
}

// Scan bucket and fix content-type for image objects, optionally under a prefix.
export async function fixMissingContentTypes(prefix?: string): Promise<{
  checked: number;
  updated: number;
  errors: number;
  updatedItems: Array<{ objectName: string; contentType: string }>;
}> {
  const files = await listFiles(prefix);
  let checked = 0;
  let updated = 0;
  let errors = 0;
  const updatedItems: Array<{ objectName: string; contentType: string }> = [];

  for (const objectName of files) {
    // Only consider likely images
    const ct = guessMimeType(objectName);
    if (!ct.startsWith('image/')) continue;
    checked++;
    try {
      const result = await fixObjectContentType(objectName);
      if (result.updated && result.contentType) {
        updated++;
        updatedItems.push({ objectName, contentType: result.contentType });
        // Also update DB mime type if present
        await db
          .update(mediaFiles)
          .set({ mimeType: result.contentType, updatedAt: new Date() })
          .where(eq(mediaFiles.objectName, objectName));
      }
    } catch {
      errors++;
    }
  }

  return { checked, updated, errors, updatedItems };
}
