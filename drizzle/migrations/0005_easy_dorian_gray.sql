CREATE TABLE "media_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"original_file_name" text NOT NULL,
	"object_name" text NOT NULL,
	"file_size" numeric(12, 0) NOT NULL,
	"mime_type" text NOT NULL,
	"width" numeric(6, 0),
	"height" numeric(6, 0),
	"minio_url" text NOT NULL,
	"photoprism_uid" text,
	"product_id" uuid,
	"user_id" uuid NOT NULL,
	"is_indexed" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"indexed_at" timestamp,
	CONSTRAINT "media_files_object_name_unique" UNIQUE("object_name")
);
--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_files_object_name_idx" ON "media_files" USING btree ("object_name");--> statement-breakpoint
CREATE INDEX "media_files_product_id_idx" ON "media_files" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "media_files_user_id_idx" ON "media_files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_files_photoprism_uid_idx" ON "media_files" USING btree ("photoprism_uid");--> statement-breakpoint
CREATE INDEX "media_files_mime_type_idx" ON "media_files" USING btree ("mime_type");--> statement-breakpoint
CREATE INDEX "media_files_is_indexed_idx" ON "media_files" USING btree ("is_indexed");--> statement-breakpoint
CREATE INDEX "media_files_is_featured_idx" ON "media_files" USING btree ("is_featured");--> statement-breakpoint
CREATE INDEX "media_files_created_at_idx" ON "media_files" USING btree ("created_at" DESC NULLS LAST);