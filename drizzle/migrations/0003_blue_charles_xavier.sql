ALTER TABLE "categories" ADD COLUMN "woocommerce_id" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "shop_id" uuid;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "menu_order" numeric(6, 0) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "woocommerce_id" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "regular_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "sale_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "manage_stock" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "stock_quantity" numeric(10, 0);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "stock_status" text DEFAULT 'instock';--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "weight" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "dimensions" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "product_variants" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "woocommerce_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "shop_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "regular_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sale_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "manage_stock" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_quantity" numeric(10, 0);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock_status" text DEFAULT 'instock';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "dimensions" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "woocommerce_data" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "featured_image" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "gallery_images" jsonb DEFAULT '[]';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "last_synced_at" timestamp;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_woocommerce_id_idx" ON "categories" USING btree ("woocommerce_id");--> statement-breakpoint
CREATE INDEX "categories_shop_id_idx" ON "categories" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_variants_woocommerce_id_idx" ON "product_variants" USING btree ("woocommerce_id");--> statement-breakpoint
CREATE INDEX "product_variants_stock_status_idx" ON "product_variants" USING btree ("stock_status");--> statement-breakpoint
CREATE INDEX "products_woocommerce_id_idx" ON "products" USING btree ("woocommerce_id");--> statement-breakpoint
CREATE INDEX "products_shop_id_idx" ON "products" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "products_stock_status_idx" ON "products" USING btree ("stock_status");--> statement-breakpoint
CREATE INDEX "products_last_synced_idx" ON "products" USING btree ("last_synced_at");