// WooCommerce API Response Types
export interface WooCommerceProduct {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  type: 'simple' | 'grouped' | 'external' | 'variable';
  status: 'draft' | 'pending' | 'private' | 'publish';
  featured: boolean;
  catalog_visibility: 'visible' | 'catalog' | 'search' | 'hidden';
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  purchasable: boolean;
  total_sales: number;
  virtual: boolean;
  downloadable: boolean;
  downloads: WooCommerceDownload[];
  download_limit: number;
  download_expiry: number;
  external_url: string;
  button_text: string;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
  low_stock_amount: number | null;
  sold_individually: boolean;
  weight: string;
  dimensions: WooCommerceDimensions;
  shipping_required: boolean;
  shipping_taxable: boolean;
  shipping_class: string;
  shipping_class_id: number;
  reviews_allowed: boolean;
  average_rating: string;
  rating_count: number;
  upsell_ids: number[];
  cross_sell_ids: number[];
  parent_id: number;
  purchase_note: string;
  categories: WooCommerceCategory[];
  tags: WooCommerceTag[];
  images: WooCommerceImage[];
  attributes: WooCommerceAttribute[];
  default_attributes: WooCommerceDefaultAttribute[];
  variations: number[];
  grouped_products: number[];
  menu_order: number;
  price_html: string;
  related_ids: number[];
  meta_data: WooCommerceMetaData[];
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  has_options: boolean;
}

export interface WooCommerceProductVariation {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  description: string;
  permalink: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  date_on_sale_from: string | null;
  date_on_sale_from_gmt: string | null;
  date_on_sale_to: string | null;
  date_on_sale_to_gmt: string | null;
  on_sale: boolean;
  status: 'publish' | 'private';
  purchasable: boolean;
  virtual: boolean;
  downloadable: boolean;
  downloads: WooCommerceDownload[];
  download_limit: number;
  download_expiry: number;
  tax_status: 'taxable' | 'shipping' | 'none';
  tax_class: string;
  manage_stock: boolean;
  stock_quantity: number | null;
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  backorders: 'no' | 'notify' | 'yes';
  backorders_allowed: boolean;
  backordered: boolean;
  low_stock_amount: number | null;
  weight: string;
  dimensions: WooCommerceDimensions;
  shipping_class: string;
  shipping_class_id: number;
  image: WooCommerceImage | null;
  attributes: WooCommerceVariationAttribute[];
  menu_order: number;
  meta_data: WooCommerceMetaData[];
}

export interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceCategoryDetailed {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: 'default' | 'products' | 'subcategories' | 'both';
  image: WooCommerceImage | null;
  menu_order: number;
  count: number;
}

export interface WooCommerceTag {
  id: number;
  name: string;
  slug: string;
}

export interface WooCommerceImage {
  id: number;
  date_created: string;
  date_created_gmt: string;
  date_modified: string;
  date_modified_gmt: string;
  src: string;
  name: string;
  alt: string;
}

export interface WooCommerceDimensions {
  length: string;
  width: string;
  height: string;
}

export interface WooCommerceAttribute {
  id: number;
  name: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface WooCommerceVariationAttribute {
  id: number;
  name: string;
  option: string;
}

export interface WooCommerceDefaultAttribute {
  id: number;
  name: string;
  option: string;
}

export interface WooCommerceDownload {
  id: string;
  name: string;
  file: string;
}

export interface WooCommerceMetaData {
  id: number;
  key: string;
  value: string | number | boolean | object;
}

// Sync Status Types
export interface SyncResult {
  success: boolean;
  message: string;
  details?: {
    productsCreated: number;
    productsUpdated: number;
    categoriesCreated: number;
    categoriesUpdated: number;
    variationsCreated: number;
    variationsUpdated: number;
    errors: string[];
  };
}

export interface SyncProgress {
  stage: 'categories' | 'products' | 'variations' | 'complete';
  current: number;
  total: number;
  message: string;
}

// Database mapping types
export interface ProductSyncData {
  wooCommerceId: string;
  shopId: string;
  sku: string;
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  basePrice?: string;
  regularPrice?: string;
  salePrice?: string;
  status: 'published' | 'draft' | 'private';
  type: 'simple' | 'variable' | 'grouped';
  manageStock: boolean;
  stockQuantity?: string;
  stockStatus: string;
  weight?: string;
  dimensions: Record<string, string>;
  metaTitle?: string;
  metaDescription?: string;
  wooCommerceData: Record<string, unknown>;
  featuredImage?: string;
  galleryImages: string[];
}

export interface CategorySyncData {
  wooCommerceId: string;
  shopId: string;
  name: string;
  slug?: string;
  description?: string;
  parentId?: string;
  image?: string;
  menuOrder: string;
}

export interface VariationSyncData {
  wooCommerceId: string;
  productId: string;
  sku: string;
  attributes: Record<string, unknown>;
  price?: string;
  regularPrice?: string;
  salePrice?: string;
  manageStock: boolean;
  stockQuantity?: string;
  stockStatus: string;
  weight?: string;
  dimensions: Record<string, string>;
  image?: string;
}
