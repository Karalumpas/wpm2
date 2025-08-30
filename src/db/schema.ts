import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  boolean,
  index,
  unique,
  numeric,
  jsonb,
  foreignKey,
} from 'drizzle-orm/pg-core';

export const shopStatusEnum = pgEnum('shop_status', [
  'active',
  'inactive',
  'error',
]);

export const productStatusEnum = pgEnum('product_status', [
  'published',
  'draft', 
  'private',
]);

export const productTypeEnum = pgEnum('product_type', [
  'simple',
  'variable',
  'grouped',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const shops = pgTable(
  'shops',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    name: text('name').notNull(),
    url: text('url').notNull(),
    consumerKeyEnc: text('consumer_key_enc').notNull(),
    consumerSecretEnc: text('consumer_secret_enc').notNull(),
    status: shopStatusEnum('status').default('active').notNull(),
    lastConnectionCheckAt: timestamp('last_connection_check_at'),
    lastConnectionOk: boolean('last_connection_ok'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    urlUniqueIdx: unique().on(table.url),
    updatedAtIdx: index().on(table.updatedAt),
  })
);

// Product master catalog tables
export const products = pgTable(
  'products', 
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // WooCommerce specific fields  
    wooCommerceId: text('woocommerce_id'), // Original WooCommerce product ID
    shopId: uuid('shop_id').references(() => shops.id),
    // Core product fields
    sku: text('sku').notNull().unique(),
    name: text('name').notNull(),
    slug: text('slug'),
    description: text('description'),
    shortDescription: text('short_description'),
    // Pricing
    basePrice: numeric('base_price', { precision: 12, scale: 2 }),
    regularPrice: numeric('regular_price', { precision: 12, scale: 2 }),
    salePrice: numeric('sale_price', { precision: 12, scale: 2 }),
    // Status and type
    status: productStatusEnum('status').default('draft').notNull(),
    type: productTypeEnum('type').default('simple').notNull(),
    // Inventory
    manageStock: boolean('manage_stock').default(false),
    stockQuantity: numeric('stock_quantity', { precision: 10, scale: 0 }),
    stockStatus: text('stock_status').default('instock'), // instock, outofstock, onbackorder
    // Physical properties
    weight: numeric('weight', { precision: 8, scale: 2 }),
    dimensions: jsonb('dimensions').default('{}'), // {length, width, height}
    // SEO
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    // WooCommerce specific metadata
    wooCommerceData: jsonb('woocommerce_data').default('{}'), // Store original WC data
    // Images
    featuredImage: text('featured_image'), // URL to featured image
    galleryImages: jsonb('gallery_images').default('[]'), // Array of image URLs
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastSyncedAt: timestamp('last_synced_at'), // When last synced from WooCommerce
  },
  (table) => ({
    // Keyset pagination index (primary sort)
    updatedAtIdIdx: index('products_updated_at_id_idx').on(table.updatedAt.desc(), table.id.desc()),
    statusIdx: index('products_status_idx').on(table.status),
    typeIdx: index('products_type_idx').on(table.type),
    skuIdx: index('products_sku_idx').on(table.sku),
    nameIdx: index('products_name_idx').on(table.name),
    wooCommerceIdIdx: index('products_woocommerce_id_idx').on(table.wooCommerceId),
    shopIdIdx: index('products_shop_id_idx').on(table.shopId),
    stockStatusIdx: index('products_stock_status_idx').on(table.stockStatus),
    lastSyncedIdx: index('products_last_synced_idx').on(table.lastSyncedAt),
  })
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    // WooCommerce specific
    wooCommerceId: text('woocommerce_id'), // Original WooCommerce variation ID
    // Core variant fields
    sku: text('sku').notNull().unique(),
    attributes: jsonb('attributes').default('{}').notNull(),
    // Pricing
    price: numeric('price', { precision: 12, scale: 2 }),
    regularPrice: numeric('regular_price', { precision: 12, scale: 2 }),
    salePrice: numeric('sale_price', { precision: 12, scale: 2 }),
    // Inventory
    manageStock: boolean('manage_stock').default(false),
    stockQuantity: numeric('stock_quantity', { precision: 10, scale: 0 }),
    stockStatus: text('stock_status').default('instock'),
    // Physical properties
    weight: numeric('weight', { precision: 8, scale: 2 }),
    dimensions: jsonb('dimensions').default('{}'),
    // Image
    image: text('image'), // URL to variant image
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastSyncedAt: timestamp('last_synced_at'),
  },
  (table) => ({
    productIdIdx: index('product_variants_product_id_idx').on(table.productId),
    skuIdx: index('product_variants_sku_idx').on(table.sku),
    attributesIdx: index('product_variants_attributes_idx').using('gin', table.attributes),
    wooCommerceIdIdx: index('product_variants_woocommerce_id_idx').on(table.wooCommerceId),
    stockStatusIdx: index('product_variants_stock_status_idx').on(table.stockStatus),
  })
);

export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const productBrands = pgTable(
  'product_brands',
  {
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'cascade' }).notNull(),
  },
  (table) => ({
    pk: unique('product_brands_pk').on(table.productId, table.brandId),
    brandIdIdx: index('product_brands_brand_id_idx').on(table.brandId),
  })
);

export const categories = pgTable(
  'categories', 
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // WooCommerce specific
    wooCommerceId: text('woocommerce_id'), // Original WooCommerce category ID
    shopId: uuid('shop_id').references(() => shops.id),
    // Core category fields
    name: text('name').notNull(),
    slug: text('slug'),
    description: text('description'),
    parentId: uuid('parent_id'),
    // Display
    image: text('image'), // URL to category image
    menuOrder: numeric('menu_order', { precision: 6, scale: 0 }).default('0'),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastSyncedAt: timestamp('last_synced_at'),
  },
  (table) => ({
    parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
    nameParentUniqueIdx: unique('categories_name_parent_unique').on(table.name, table.parentId),
    wooCommerceIdIdx: index('categories_woocommerce_id_idx').on(table.wooCommerceId),
    shopIdIdx: index('categories_shop_id_idx').on(table.shopId),
    slugIdx: index('categories_slug_idx').on(table.slug),
  })
);

export const productCategories = pgTable(
  'product_categories',
  {
    productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  },
  (table) => ({
    pk: unique('product_categories_pk').on(table.productId, table.categoryId),
    categoryIdIdx: index('product_categories_category_id_idx').on(table.categoryId),
  })
);

// Add foreign key relation for categories self-reference (must be after table definition)
export const categoriesRelations = foreignKey({
  columns: [categories.parentId],
  foreignColumns: [categories.id],
  name: 'categories_parent_id_fkey'
});

// App Settings table
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  // Currency settings
  currency: text('currency').default('DKK').notNull(),
  currencySymbol: text('currency_symbol').default('kr').notNull(),
  currencyPosition: text('currency_position').default('right').notNull(), // 'left', 'right', 'left_space', 'right_space'
  // Display settings
  productsPerPage: numeric('products_per_page', { precision: 3, scale: 0 }).default('24').notNull(),
  defaultViewMode: text('default_view_mode').default('grid').notNull(), // 'grid', 'list'
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('settings_user_id_idx').on(table.userId),
  userUniqueIdx: unique('settings_user_unique').on(table.userId), // One setting per user
}));

// Media files table for MinIO and PhotoPrism integration
export const mediaFiles = pgTable(
  'media_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // File identification
    fileName: text('file_name').notNull(),
    originalFileName: text('original_file_name').notNull(),
    objectName: text('object_name').notNull().unique(), // MinIO object path
    // File metadata
    fileSize: numeric('file_size', { precision: 12, scale: 0 }).notNull(),
    mimeType: text('mime_type').notNull(),
    width: numeric('width', { precision: 6, scale: 0 }),
    height: numeric('height', { precision: 6, scale: 0 }),
    // Storage locations
    minioUrl: text('minio_url').notNull(), // URL from MinIO
    photoPrismUID: text('photoprism_uid'), // PhotoPrism photo UID if indexed
    // Relationships
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    userId: uuid('user_id').references(() => users.id).notNull(),
    // Flags
    isIndexed: boolean('is_indexed').default(false).notNull(), // Whether indexed in PhotoPrism
    isFeatured: boolean('is_featured').default(false).notNull(), // Featured image for product
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    indexedAt: timestamp('indexed_at'), // When indexed in PhotoPrism
  },
  (table) => ({
    objectNameIdx: index('media_files_object_name_idx').on(table.objectName),
    productIdIdx: index('media_files_product_id_idx').on(table.productId),
    userIdIdx: index('media_files_user_id_idx').on(table.userId),
    photoPrismUIDIdx: index('media_files_photoprism_uid_idx').on(table.photoPrismUID),
    mimeTypeIdx: index('media_files_mime_type_idx').on(table.mimeType),
    isIndexedIdx: index('media_files_is_indexed_idx').on(table.isIndexed),
    isFeaturedIdx: index('media_files_is_featured_idx').on(table.isFeatured),
    createdAtIdx: index('media_files_created_at_idx').on(table.createdAt.desc()),
  })
);
