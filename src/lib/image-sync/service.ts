/**
 * Image Synchronization Service
 *
 * Handles downloading images from connected WooCommerce shops to central MinIO storage
 * and distributing them to other shops when products are pushed.
 */

import { Client } from 'minio';
import { v4 as uuidv4 } from 'uuid';

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
  private minioClient: Client;
  private bucketName = 'product-images';

  constructor() {
    this.minioClient = new Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }

  /**
   * Initialize MinIO bucket if it doesn't exist
   */
  async initializeBucket(): Promise<void> {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName);
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
        await this.minioClient.statObject(this.bucketName, minioPath);
        console.log(`📷 Image already exists in MinIO: ${minioPath}`);

        return {
          originalUrl: imageUrl,
          centralUrl: `http://localhost:9000/${this.bucketName}/${minioPath}`,
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
      await this.minioClient.putObject(this.bucketName, minioPath, buffer);
      console.log(`✅ Uploaded to MinIO: ${minioPath}`);

      const syncedImage: SyncedImage = {
        originalUrl: imageUrl,
        centralUrl: `http://localhost:9000/${this.bucketName}/${minioPath}`,
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
    return `http://localhost:9000/${this.bucketName}/${minioPath}`;
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
      const imageStream = await this.minioClient.getObject(
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
