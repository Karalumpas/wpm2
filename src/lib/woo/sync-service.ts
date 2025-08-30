import { db } from '@/db';
import {
  shops,
  products,
  categories,
  productCategories,
  productVariants,
} from '@/db/schema';
import { WooCommerceClient } from './client';
import { decryptFromCompact } from '@/lib/security/crypto';
import { imageSyncService } from '@/lib/image-sync/service';
import { eq, and, sql } from 'drizzle-orm';
import type {
  WooCommerceProduct,
  WooCommerceProductVariation,
  WooCommerceCategoryDetailed,
  SyncResult,
  SyncProgress,
  ProductSyncData,
  CategorySyncData,
  VariationSyncData,
} from './types';

export class WooCommerceProductSyncService {
  private client: WooCommerceClient;
  private shopId: string;
  private userId?: string | null;
  private progressCallback?: (progress: SyncProgress) => void;
  private debugMode: boolean = false; // Set to false to disable debug in production
  private debugLogs: string[] = []; // Separate debug logs from errors

  constructor(
    shopId: string,
    client: WooCommerceClient,
    userId?: string | null
  ) {
    this.shopId = shopId;
    this.client = client;
    this.userId = userId;
  }

  setProgressCallback(callback: (progress: SyncProgress) => void) {
    this.progressCallback = callback;
  }

  private log(message: string) {
    if (this.debugMode) {
      console.log(`[SYNC DEBUG] ${message}`);
      this.debugLogs.push(message);
    }
  }

  private updateProgress(
    stage: SyncProgress['stage'],
    current: number,
    total: number,
    message: string
  ) {
    if (this.progressCallback) {
      this.progressCallback({ stage, current, total, message });
    }
  }

  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      success: false,
      message: '',
      details: {
        productsCreated: 0,
        productsUpdated: 0,
        categoriesCreated: 0,
        categoriesUpdated: 0,
        variationsCreated: 0,
        variationsUpdated: 0,
        errors: [],
      },
    };

    try {
      // Step 0: Initialize image sync
      this.updateProgress(
        'categories',
        0,
        100,
        'Initializing image sync service...'
      );
      try {
        await imageSyncService.initializeBucket();
        console.log('✅ MinIO bucket initialized for image sync');
      } catch (error) {
        console.warn('⚠️ Failed to initialize MinIO bucket:', error);
        // Don't fail the entire sync if MinIO is not available
      }

      // Step 1: Sync Categories
      this.updateProgress(
        'categories',
        0,
        100,
        'Starting category synchronization...'
      );
      const categoryResult = await this.syncCategories();
      result.details!.categoriesCreated = categoryResult.created;
      result.details!.categoriesUpdated = categoryResult.updated;
      result.details!.errors.push(...categoryResult.errors);

      // Step 2: Sync Products
      this.updateProgress(
        'products',
        0,
        100,
        'Starting product synchronization...'
      );
      const productResult = await this.syncProducts();
      result.details!.productsCreated = productResult.created;
      result.details!.productsUpdated = productResult.updated;
      result.details!.errors.push(...productResult.errors);

      // Step 3: Sync Variations
      this.updateProgress(
        'variations',
        0,
        100,
        'Starting variation synchronization...'
      );
      const variationResult = await this.syncVariations();
      result.details!.variationsCreated = variationResult.created;
      result.details!.variationsUpdated = variationResult.updated;
      result.details!.errors.push(...variationResult.errors);

      // Add debug logs if enabled (but not as errors)
      if (this.debugMode && this.debugLogs.length > 0) {
        console.log('Debug logs:', this.debugLogs);
      }

      this.updateProgress(
        'complete',
        100,
        100,
        'Synchronization completed successfully!'
      );

      result.success = result.details!.errors.length === 0;
      result.message = result.success
        ? `Sync completed successfully: ${result.details!.productsCreated + result.details!.productsUpdated} products, ${result.details!.categoriesCreated + result.details!.categoriesUpdated} categories, ${result.details!.variationsCreated + result.details!.variationsUpdated} variations`
        : `Sync completed with ${result.details!.errors.length} errors`;

      return result;
    } catch (error) {
      result.success = false;
      result.message = `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.details!.errors.push(result.message);
      return result;
    }
  }

  private async syncCategories(): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };

    try {
      // Fetch all categories from WooCommerce
      let page = 1;
      const perPage = 100;
      let hasMore = true;
      const allCategories: WooCommerceCategoryDetailed[] = [];

      while (hasMore) {
        try {
          const response = (await this.client.get(
            `/products/categories?page=${page}&per_page=${perPage}&hide_empty=false`
          )) as WooCommerceCategoryDetailed[];
          allCategories.push(...response);
          hasMore = response.length === perPage;
          page++;

          this.updateProgress(
            'categories',
            allCategories.length,
            allCategories.length + (hasMore ? perPage : 0),
            `Fetched ${allCategories.length} categories from WooCommerce...`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          if (
            errorMessage.includes('cannot list resources') ||
            errorMessage.includes('401')
          ) {
            result.errors.push(
              `Authentication failed - API keys may not have read permissions. Please check WooCommerce REST API settings.`
            );
          } else {
            result.errors.push(
              `Failed to fetch categories page ${page}: ${errorMessage}`
            );
          }
          break;
        }
      }

      // Process categories (root categories first, then children)
      const rootCategories = allCategories.filter((cat) => cat.parent === 0);
      const childCategories = allCategories.filter((cat) => cat.parent !== 0);

      // Sync root categories first
      for (const [index, category] of rootCategories.entries()) {
        this.updateProgress(
          'categories',
          index + 1,
          rootCategories.length + childCategories.length,
          `Processing root category: ${category.name}`
        );

        try {
          const syncData = this.mapCategoryToSyncData(category);
          const existing = await this.findExistingCategory(
            category.id.toString()
          );

          if (existing) {
            await this.updateCategory(existing.id, syncData);
            result.updated++;
          } else {
            await this.createCategory(syncData);
            result.created++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Sync child categories
      for (const [index, category] of childCategories.entries()) {
        this.updateProgress(
          'categories',
          rootCategories.length + index + 1,
          rootCategories.length + childCategories.length,
          `Processing child category: ${category.name}`
        );

        try {
          const syncData = this.mapCategoryToSyncData(category);

          // Find parent category in our database
          if (category.parent > 0) {
            const parentCategory = await this.findExistingCategory(
              category.parent.toString()
            );
            if (parentCategory) {
              syncData.parentId = parentCategory.id;
            }
          }

          const existing = await this.findExistingCategory(
            category.id.toString()
          );

          if (existing) {
            await this.updateCategory(existing.id, syncData);
            result.updated++;
          } else {
            await this.createCategory(syncData);
            result.created++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync category ${category.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Category sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  private async syncProducts(): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };

    try {
      // Fetch all products from WooCommerce
      let page = 1;
      const perPage = 100;
      let hasMore = true;
      const allProducts: WooCommerceProduct[] = [];

      while (hasMore) {
        try {
          const response = (await this.client.get(
            `/products?page=${page}&per_page=${perPage}`
          )) as WooCommerceProduct[];
          allProducts.push(...response);
          hasMore = response.length === perPage;
          page++;

          this.updateProgress(
            'products',
            allProducts.length,
            allProducts.length + (hasMore ? perPage : 0),
            `Fetched ${allProducts.length} products from WooCommerce...`
          );
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          if (
            errorMessage.includes('cannot list resources') ||
            errorMessage.includes('401')
          ) {
            result.errors.push(
              `Authentication failed - API keys may not have read permissions. Please check WooCommerce REST API settings.`
            );
          } else {
            result.errors.push(
              `Failed to fetch products page ${page}: ${errorMessage}`
            );
          }
          break;
        }
      }

      // Process each product
      for (const [index, product] of allProducts.entries()) {
        this.updateProgress(
          'products',
          index + 1,
          allProducts.length,
          `Processing product: ${product.name}`
        );

        try {
          const syncData = await this.mapProductToSyncData(product);
          let existing = await this.findExistingProduct(product.id.toString());
          this.log(
            `After findExistingProduct(${product.id}): ${existing ? JSON.stringify({ id: existing.id, wooCommerceId: existing.wooCommerceId }) : 'null'}`
          );

          // If not found by WooCommerce ID, check by SKU to avoid duplicates
          if (!existing && syncData.sku) {
            existing = await this.findExistingProductBySku(syncData.sku);
            this.log(
              `After findExistingProductBySku(${syncData.sku}): ${existing ? JSON.stringify({ id: existing.id, sku: existing.sku }) : 'null'}`
            );
          }

          let productId: string;
          this.log(
            `Final existing value: ${existing ? JSON.stringify({ id: existing.id }) : 'null'}`
          );
          console.log(`DECISION POINT: existing =`, existing);
          console.log(`existing truthy?`, !!existing);

          if (existing) {
            console.log(
              `Updating existing product: ${existing.id} (WC ID: ${product.id})`
            );
            this.log(
              `Product ${product.name} (WC ID: ${product.id}) found as existing with DB ID: ${existing.id} - UPDATING`
            );
            await this.updateProduct(existing.id, syncData);
            productId = existing.id;
            result.updated++;
          } else {
            console.log(
              `Creating new product: ${product.name} (WC ID: ${product.id})`
            );
            this.log(
              `Product ${product.name} (WC ID: ${product.id}) not found as existing - CREATING`
            );
            productId = await this.createProduct(syncData);
            result.created++;
            console.log(`Created product with database ID: ${productId}`);
          }

          // Register synced images in media library
          try {
            await imageSyncService.registerCentralImagesForProduct(
              productId,
              this.userId,
              syncData.featuredImage,
              syncData.galleryImages
            );
          } catch (e) {
            console.warn('Failed to register product media files', e);
          }

          // Sync product categories
          await this.syncProductCategories(productId, product.categories);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          console.error(`Product sync error for ${product.name}:`, error);
          result.errors.push(
            `Failed to sync product ${product.name}: ${errorMessage}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Product sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  private async syncVariations(): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    const result = { created: 0, updated: 0, errors: [] as string[] };

    try {
      // Get all variable products from our database
      const variableProducts = await db
        .select()
        .from(products)
        .where(
          and(eq(products.shopId, this.shopId), eq(products.type, 'variable'))
        );

      for (const [productIndex, product] of variableProducts.entries()) {
        if (!product.wooCommerceId) continue;

        this.updateProgress(
          'variations',
          productIndex + 1,
          variableProducts.length,
          `Processing variations for: ${product.name}`
        );

        try {
          // Fetch variations for this product
          const variations = (await this.client.get(
            `/products/${product.wooCommerceId}/variations?per_page=100`
          )) as WooCommerceProductVariation[];

          for (const variation of variations) {
            try {
              const syncData = this.mapVariationToSyncData(
                variation,
                product.id
              );
              const existing = await this.findExistingVariation(
                variation.id.toString(),
                product.id,
                syncData.sku
              );

              if (existing) {
                await this.updateVariation(existing.id, syncData);
                result.updated++;
              } else {
                await this.createVariation(syncData);
                result.created++;
              }
            } catch (error) {
              result.errors.push(
                `Failed to sync variation ${variation.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync variations for product ${product.name}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Variation sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return result;
  }

  private mapCategoryToSyncData(
    category: WooCommerceCategoryDetailed
  ): CategorySyncData {
    return {
      wooCommerceId: category.id.toString(),
      shopId: this.shopId,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image?.src,
      menuOrder: category.menu_order.toString(),
    };
  }

  private async mapProductToSyncData(
    product: WooCommerceProduct
  ): Promise<ProductSyncData> {
    // Helper function to convert empty strings to undefined for numeric fields
    const parseNumeric = (
      value: string | number | null | undefined
    ): string | undefined => {
      if (value === '' || value === null || value === undefined)
        return undefined;
      return value.toString();
    };

    // Extract original image URLs
    const originalFeaturedImage = product.images[0]?.src;
    const originalGalleryImages = product.images.slice(1).map((img) => img.src);

    // Sync images to central storage
    let syncedImages = {
      featuredImage: originalFeaturedImage || null,
      galleryImages: originalGalleryImages,
    };

    try {
      console.log(`🖼️ Syncing images for product: ${product.name}`);
      syncedImages = await imageSyncService.syncProductImages(
        originalFeaturedImage || null,
        originalGalleryImages,
        this.shopId
      );
      console.log(
        `✅ Images synced: ${syncedImages.galleryImages.length + (syncedImages.featuredImage ? 1 : 0)} total`
      );
    } catch (error) {
      console.warn(
        `⚠️ Failed to sync images for product ${product.name}:`,
        error
      );
      // Fall back to original URLs if sync fails
    }

    return {
      wooCommerceId: product.id.toString(),
      shopId: this.shopId,
      sku: product.sku || `wc-${product.id}`,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.short_description,
      basePrice: parseNumeric(product.price),
      regularPrice: parseNumeric(product.regular_price),
      salePrice: parseNumeric(product.sale_price),
      status:
        product.status === 'publish'
          ? 'published'
          : (product.status as 'draft' | 'private'),
      type: product.type as 'simple' | 'variable' | 'grouped',
      manageStock: product.manage_stock,
      stockQuantity: product.stock_quantity?.toString(),
      stockStatus: product.stock_status,
      weight: parseNumeric(product.weight),
      dimensions: {
        length: product.dimensions.length || '',
        width: product.dimensions.width || '',
        height: product.dimensions.height || '',
      },
      wooCommerceData: product as unknown as Record<string, unknown>,
      featuredImage: syncedImages.featuredImage || undefined,
      galleryImages: syncedImages.galleryImages,
    };
  }

  private mapVariationToSyncData(
    variation: WooCommerceProductVariation,
    productId: string
  ): VariationSyncData {
    // Helper function to convert empty strings to undefined for numeric fields
    const parseNumeric = (
      value: string | number | null | undefined
    ): string | undefined => {
      if (value === '' || value === null || value === undefined)
        return undefined;
      return value.toString();
    };

    return {
      wooCommerceId: variation.id.toString(),
      productId,
      sku: variation.sku || `var-${variation.id}`,
      attributes: variation.attributes.reduce(
        (acc, attr) => {
          acc[attr.name] = attr.option;
          return acc;
        },
        {} as Record<string, unknown>
      ),
      price: parseNumeric(variation.price),
      regularPrice: parseNumeric(variation.regular_price),
      salePrice: parseNumeric(variation.sale_price),
      manageStock: variation.manage_stock,
      stockQuantity: variation.stock_quantity?.toString(),
      stockStatus: variation.stock_status,
      weight: parseNumeric(variation.weight),
      dimensions: {
        length: variation.dimensions.length || '',
        width: variation.dimensions.width || '',
        height: variation.dimensions.height || '',
      },
      image: variation.image?.src,
    };
  }

  private async findExistingCategory(wooCommerceId: string) {
    const results = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.wooCommerceId, wooCommerceId),
          eq(categories.shopId, this.shopId)
        )
      )
      .limit(1);

    return results[0] || null;
  }

  private async findExistingProduct(wooCommerceId: string) {
    console.log(
      `Looking for existing product with WooCommerce ID: ${wooCommerceId}`
    );
    console.log(`Shop ID: ${this.shopId}`);

    // First check what's actually in the products table
    const allProducts = await db.select().from(products).limit(10);
    console.log(
      `All products in DB (first 10):`,
      allProducts.map((p) => ({
        id: p.id,
        wooCommerceId: p.wooCommerceId,
        name: p.name,
      }))
    );

    // Check what products actually exist in the database
    const allCount = await db.select({ count: sql`count(*)` }).from(products);

    // Store debug info for logging
    if (this.debugMode) {
      this.log(`DB DEBUG - Total products in DB: ${allCount[0]?.count || 0}`);
      this.log(
        `DB DEBUG - Looking for WC ID: ${wooCommerceId}, Shop ID: ${this.shopId}`
      );
      if (allProducts.length > 0) {
        this.log(
          `DB DEBUG - Sample products: ${JSON.stringify(allProducts.slice(0, 3).map((p) => ({ id: p.id, wooCommerceId: p.wooCommerceId, shopId: p.shopId })))}`
        );
      }
    }

    const results = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.wooCommerceId, wooCommerceId),
          eq(products.shopId, this.shopId)
        )
      )
      .limit(1);

    const found = results[0] || null;
    console.log(`Query results for WC ID ${wooCommerceId}:`, results);
    console.log(`Found existing product:`, found ? `ID ${found.id}` : 'None');

    if (this.debugMode) {
      this.log(
        `DB DEBUG - Query result for WC ID ${wooCommerceId}: ${found ? `Found ID ${found.id}` : 'Not found'}`
      );
    }

    return found;
  }

  private async findExistingProductBySku(sku: string) {
    console.log(`Looking for existing product with SKU: ${sku}`);
    const results = await db
      .select()
      .from(products)
      .where(eq(products.sku, sku))
      .limit(1);

    const found = results[0] || null;
    console.log(
      `Found existing product by SKU:`,
      found ? `ID ${found.id}` : 'None'
    );
    return found;
  }

  private async findExistingVariation(
    wooCommerceId: string,
    productId: string,
    sku?: string
  ) {
    try {
      const results = await db
        .select()
        .from(productVariants)
        .where(
          and(
            eq(productVariants.productId, productId),
            eq(productVariants.wooCommerceId, wooCommerceId)
          )
        )
        .limit(1);

      if (results[0]) return results[0];
    } catch (err) {
      console.warn(
        'findExistingVariation by WooCommerce ID failed; falling back to SKU check. Error:',
        err
      );
    }

    if (sku) {
      const bySku = await db
        .select()
        .from(productVariants)
        .where(and(eq(productVariants.productId, productId), eq(productVariants.sku, sku)))
        .limit(1);
      return bySku[0] || null;
    }

    return null;
  }

  private async createCategory(data: CategorySyncData): Promise<string> {
    const result = await db
      .insert(categories)
      .values({
        wooCommerceId: data.wooCommerceId,
        shopId: data.shopId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        image: data.image,
        menuOrder: data.menuOrder,
        lastSyncedAt: new Date(),
      })
      .returning({ id: categories.id });

    return result[0].id;
  }

  private async updateCategory(
    id: string,
    data: CategorySyncData
  ): Promise<void> {
    await db
      .update(categories)
      .set({
        name: data.name,
        slug: data.slug,
        description: data.description,
        parentId: data.parentId,
        image: data.image,
        menuOrder: data.menuOrder,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id));
  }

  private async createProduct(data: ProductSyncData): Promise<string> {
    try {
      console.log('Creating product with data:', {
        name: data.name,
        sku: data.sku,
        shopId: data.shopId,
        wooCommerceId: data.wooCommerceId,
      });

      const productValues = {
        wooCommerceId: data.wooCommerceId,
        shopId: data.shopId,
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDescription: data.shortDescription,
        basePrice: data.basePrice || null,
        regularPrice: data.regularPrice || null,
        salePrice: data.salePrice || null,
        status: data.status,
        type: data.type,
        manageStock: data.manageStock,
        stockQuantity: data.stockQuantity || null,
        stockStatus: data.stockStatus,
        weight: data.weight || null,
        dimensions: data.dimensions,
        wooCommerceData: data.wooCommerceData,
        featuredImage: data.featuredImage,
        galleryImages: data.galleryImages,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('Inserting product data...');
      const result = await db
        .insert(products)
        .values(productValues)
        .returning({ id: products.id });

      if (!result || !result[0] || !result[0].id) {
        throw new Error('Product insertion failed - no ID returned');
      }

      console.log('Product inserted successfully:', result[0].id);
      return result[0].id;
    } catch (error) {
      console.error('Database insert error details:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        productName: data.name,
        sku: data.sku,
      });
      throw new Error(
        `Database insertion failed for product ${data.name} (SKU: ${data.sku}): ${error instanceof Error ? error.message : 'Unknown database error'}`
      );
    }
  }

  private async updateProduct(
    id: string,
    data: ProductSyncData
  ): Promise<void> {
    try {
      // First verify the product exists
      const existingProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (existingProduct.length === 0) {
        throw new Error(
          `Product with ID ${id} not found in database for update`
        );
      }

      // Check for SKU conflicts (only if SKU is changing)
      if (existingProduct[0].sku !== data.sku) {
        const skuConflict = await db
          .select()
          .from(products)
          .where(
            and(eq(products.sku, data.sku), eq(products.shopId, this.shopId))
          )
          .limit(1);

        if (skuConflict.length > 0 && skuConflict[0].id !== id) {
          this.log(
            `SKU CONFLICT: Product ${id} trying to update to SKU "${data.sku}" but it's already used by product ${skuConflict[0].id}`
          );
          throw new Error(
            `SKU "${data.sku}" is already in use by another product`
          );
        }
      }

      this.log(
        `UPDATE DEBUG: About to update product ID ${id}, current SKU: ${existingProduct[0].sku}, new SKU: ${data.sku}`
      );

      const result = await db
        .update(products)
        .set({
          sku: data.sku,
          name: data.name,
          slug: data.slug,
          description: data.description,
          shortDescription: data.shortDescription,
          basePrice: data.basePrice || null,
          regularPrice: data.regularPrice || null,
          salePrice: data.salePrice || null,
          status: data.status,
          type: data.type,
          manageStock: data.manageStock,
          stockQuantity: data.stockQuantity || null,
          stockStatus: data.stockStatus,
          weight: data.weight || null,
          dimensions: data.dimensions,
          wooCommerceData: data.wooCommerceData,
          featuredImage: data.featuredImage,
          galleryImages: data.galleryImages,
          lastSyncedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(products.id, id));

      if (this.debugMode) {
        this.log(`UPDATE DEBUG: Successfully updated product ID ${id}`);
      }
    } catch (error) {
      if (this.debugMode) {
        this.log(
          `UPDATE ERROR for product ID ${id}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      throw error;
    }
  }

  private async createVariation(data: VariationSyncData): Promise<string> {
    try {
      // First verify the parent product exists
      const parentProduct = await db
        .select()
        .from(products)
        .where(eq(products.id, data.productId))
        .limit(1);

      if (parentProduct.length === 0) {
        throw new Error(
          `Parent product with ID ${data.productId} not found for variation ${data.wooCommerceId}`
        );
      }

      if (this.debugMode) {
        this.log(
          `VARIANT CREATE DEBUG: Creating variation ${data.wooCommerceId} for existing product ${data.productId} (SKU: ${parentProduct[0].sku})`
        );
      }

      const result = await db
        .insert(productVariants)
        .values({
          wooCommerceId: data.wooCommerceId,
          productId: data.productId,
          sku: data.sku,
          attributes: data.attributes,
          price: data.price,
          regularPrice: data.regularPrice,
          salePrice: data.salePrice,
          manageStock: data.manageStock,
          stockQuantity: data.stockQuantity,
          stockStatus: data.stockStatus,
          weight: data.weight,
          dimensions: data.dimensions,
          image: data.image,
          lastSyncedAt: new Date(),
        })
        .returning({ id: productVariants.id });

      if (this.debugMode) {
        this.log(
          `VARIANT CREATE DEBUG: Successfully created variation ${data.wooCommerceId} with ID ${result[0].id}`
        );
      }

      return result[0].id;
    } catch (error) {
      if (this.debugMode) {
        this.log(
          `VARIANT CREATE ERROR for WC ID ${data.wooCommerceId}, product ID ${data.productId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      throw error;
    }
  }

  private async updateVariation(
    id: string,
    data: VariationSyncData
  ): Promise<void> {
    await db
      .update(productVariants)
      .set({
        sku: data.sku,
        attributes: data.attributes,
        price: data.price,
        regularPrice: data.regularPrice,
        salePrice: data.salePrice,
        manageStock: data.manageStock,
        stockQuantity: data.stockQuantity,
        stockStatus: data.stockStatus,
        weight: data.weight,
        dimensions: data.dimensions,
        image: data.image,
        lastSyncedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(productVariants.id, id));
  }

  private async syncProductCategories(
    productId: string,
    wooCategories: { id: number; name: string; slug: string }[]
  ): Promise<void> {
    // Remove existing category associations
    await db
      .delete(productCategories)
      .where(eq(productCategories.productId, productId));

    // Add new category associations
    for (const wooCategory of wooCategories) {
      const category = await this.findExistingCategory(
        wooCategory.id.toString()
      );
      if (category) {
        await db
          .insert(productCategories)
          .values({
            productId,
            categoryId: category.id,
          })
          .onConflictDoNothing();
      }
    }
  }
}

// Factory function to create sync service for a shop
export async function createSyncServiceForShop(
  shopId: string
): Promise<WooCommerceProductSyncService> {
  // Get shop details and credentials
  const shop = await db
    .select()
    .from(shops)
    .where(eq(shops.id, shopId))
    .limit(1);

  if (!shop[0]) {
    throw new Error(`Shop not found: ${shopId}`);
  }

  // Decrypt credentials
  const consumerKey = decryptFromCompact(shop[0].consumerKeyEnc);
  const consumerSecret = decryptFromCompact(shop[0].consumerSecretEnc);

  // Create WooCommerce client
  const client = new WooCommerceClient({
    baseUrl: shop[0].url,
    consumerKey,
    consumerSecret,
  });

  return new WooCommerceProductSyncService(shopId, client, shop[0].userId);
}
