ALTER TABLE "product_variants" ADD COLUMN "shop_id" uuid;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_variants_shop_id_idx" ON "product_variants" USING btree ("shop_id");--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_shop_id_woocommerce_id_unique" UNIQUE("shop_id","woocommerce_id");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_woocommerce_id_unique" UNIQUE("shop_id","woocommerce_id");