/**
 * Image Synchronization Service
 *
 * Handles downloading images from connected WooCommerce shops to central MinIO storage
 * and distributing them to other shops when products are pushed.
 */

import { v4 as uuidv4 } from 'uuid';
import { minioClient, DEFAULT_BUCKET, getFileUrl } from '@/lib/storage/minio';
import { db } from '@/db';
import { mediaFiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ImageSyncOptions {
  shopId: string;
  shopUrl: string;
  forceRedownload?: boolean;
}

interface SyncedImage {
  originalUrl: string;
  centralUrl: string;
  minioPath: string;
  shopId: string;
  fileName: string;
  syncedAt: Date;
}

export class ImageSyncService {
  private bucketName = DEFAULT_BUCKET;

  /**
   * Initialize MinIO bucket if it doesn't exist
   */
  async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`✅ Created MinIO bucket: ${this.bucketName}`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize MinIO bucket:', error);
      throw error;
    }
  }

  /**
   * Download image from external URL and store in MinIO
   */
  async downloadImageToMinIO(
    imageUrl: string,
    shopId: string
  ): Promise<SyncedImage | null> {
    try {
      // Validate URL
      if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
        console.warn(`⚠️ Invalid image URL: ${imageUrl}`);
        return null;
      }

      // Generate unique filename
      const fileName = this.generateFileName(imageUrl, shopId);
      const minioPath = `shops/${shopId}/${fileName}`;

      // Check if image already exists
      try {
        await minioClient.statObject(this.bucketName, minioPath);
        console.log(`📷 Image already exists in MinIO: ${minioPath}`);

        return {
          originalUrl: imageUrl,
          centralUrl: getFileUrl(minioPath),
          minioPath,
          shopId,
          fileName,
          syncedAt: new Date(),
        };
      } catch {
        // Image doesn't exist, proceed with download
      }

      // Download image from external URL
      console.log(`📥 Downloading image: ${imageUrl}`);
      const response = await fetch(imageUrl);

      if (!response.ok) {
        console.error(`❌ Failed to download image: ${response.statusText}`);
        return null;
      }

      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      // Upload to MinIO
      await minioClient.putObject(this.bucketName, minioPath, buffer);
      console.log(`✅ Uploaded to MinIO: ${minioPath}`);

      const syncedImage: SyncedImage = {
        originalUrl: imageUrl,
        centralUrl: getFileUrl(minioPath),
        minioPath,
        shopId,
        fileName,
        syncedAt: new Date(),
      };

      return syncedImage;
    } catch (error) {
      console.error(`❌ Error downloading image ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Sync all images for a product
   */
  async syncProductImages(
    featuredImage: string | null,
    galleryImages: string[],
    shopId: string
  ): Promise<{ featuredImage: string | null; galleryImages: string[] }> {
    await this.initializeBucket();

    const results = {
      featuredImage: null as string | null,
      galleryImages: [] as string[],
    };

    // Sync featured image
    if (featuredImage) {
      const syncedImage = await this.downloadImageToMinIO(
        featuredImage,
        shopId
      );
      if (syncedImage) {
        results.featuredImage = syncedImage.centralUrl;
      }
    }

    // Sync gallery images
    for (const imageUrl of galleryImages) {
      const syncedImage = await this.downloadImageToMinIO(imageUrl, shopId);
      if (syncedImage) {
        results.galleryImages.push(syncedImage.centralUrl);
      }
    }

    return results;
  }

  /**
   * Get central URL for distributing to other shops
   */
  getCentralImageUrl(minioPath: string): string {
    return getFileUrl(minioPath);
  }

  /**
   * Register central images in media_files table and associate with product/user
   */
  async registerCentralImagesForProduct(
    productId: string,
    userId: string | null | undefined,
    featuredImage?: string,
    galleryImages?: string[]
  ): Promise<void> {
    // Resolve a user id: prefer provided, else pick first user as fallback
    let ownerId = userId || null;
    if (!ownerId) {
      try {
        const anyUser = await db.select({ id: users.id }).from(users).limit(1);
        if (anyUser.length) ownerId = anyUser[0].id;
      } catch {}
    }
    if (!ownerId) return; // Skip if we truly have no users
    const urls: Array<{ url: string; isFeatured: boolean }> = [];
    if (featuredImage) urls.push({ url: featuredImage, isFeatured: true });
    for (const u of galleryImages || [])
      urls.push({ url: u, isFeatured: false });

    for (const { url, isFeatured } of urls) {
      try {
        const { objectName, fileName } = this.parseCentralUrl(url);
        // Get object stat for size and mime
        const stat = await minioClient.statObject(this.bucketName, objectName);
        const size = (stat.size ?? 0).toString();
        const mimeType =
          (stat.metaData && (stat.metaData['content-type'] as string)) ||
          this.guessMimeType(fileName);

        // Upsert by object_name
        const existing = await db
          .select({ id: mediaFiles.id })
          .from(mediaFiles)
          .where(eq(mediaFiles.objectName, objectName))
          .limit(1);

        if (existing.length) {
          await db
            .update(mediaFiles)
            .set({
              fileName,
              originalFileName: fileName,
              fileSize: size,
              mimeType,
              minioUrl: url,
              productId,
              userId: ownerId,
              isFeatured,
              updatedAt: new Date(),
            })
            .where(eq(mediaFiles.id, existing[0].id));
        } else {
          await db.insert(mediaFiles).values({
            fileName,
            originalFileName: fileName,
            objectName,
            fileSize: size,
            mimeType,
            minioUrl: url,
            productId,
            userId: ownerId,
            isIndexed: false,
            isFeatured,
          });
        }
      } catch (err) {
        console.warn('Failed to register media file', url, err);
      }
    }
  }

  private parseCentralUrl(url: string): {
    objectName: string;
    fileName: string;
  } {
    const u = new URL(url);
    // Pathname like /<bucket>/<object>
    const parts = u.pathname.split('/').filter(Boolean);
    // Remove bucket name
    const objectName = parts.slice(1).join('/');
    const fileName = objectName.split('/').pop() || 'image.jpg';
    return { objectName, fileName };
  }

  private guessMimeType(fileName: string): string {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.svg')) return 'image/svg+xml';
    return 'application/octet-stream';
  }

  /**
   * Upload image from central storage to target shop
   */
  async distributeImageToShop(
    centralImagePath: string,
    targetShopConfig: { url: string; apiKey: string; apiSecret: string }
  ): Promise<string | null> {
    try {
      // Get image from MinIO
      const imageStream = await minioClient.getObject(
        this.bucketName,
        centralImagePath
      );
      const chunks: Buffer[] = [];

      for await (const chunk of imageStream) {
        chunks.push(chunk);
      }

      const imageBuffer = Buffer.concat(chunks);

      // Upload to target WooCommerce shop
      // This would use WooCommerce REST API to upload media
      const formData = new FormData();
      formData.append('file', new Blob([imageBuffer]), 'product-image.jpg');

      const uploadResponse = await fetch(
        `${targetShopConfig.url}/wp-json/wc/v3/media`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${targetShopConfig.apiKey}:${targetShopConfig.apiSecret}`).toString('base64')}`,
          },
          body: formData,
        }
      );

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        return uploadResult.source_url;
      }

      return null;
    } catch (error) {
      console.error('❌ Error distributing image to shop:', error);
      return null;
    }
  }

  /**
   * Validate if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const validExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.svg',
      ];
      return validExtensions.some((ext) => pathname.endsWith(ext));
    } catch {
      return false;
    }
  }

  /**
   * Generate unique filename for MinIO storage
   */
  private generateFileName(originalUrl: string, shopId: string): string {
    try {
      const url = new URL(originalUrl);
      const originalName = url.pathname.split('/').pop() || 'image';
      const extension = originalName.includes('.')
        ? originalName.split('.').pop()
        : 'jpg';
      const uniqueId = uuidv4().substring(0, 8);

      return `${shopId}_${uniqueId}_${originalName}`.replace(
        /[^a-zA-Z0-9._-]/g,
        '_'
      );
    } catch {
      return `${shopId}_${uuidv4()}.jpg`;
    }
  }
}

export const imageSyncService = new ImageSyncService();
