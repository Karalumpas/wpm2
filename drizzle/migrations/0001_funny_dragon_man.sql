CREATE TYPE "public"."shop_status" AS ENUM('active', 'inactive', 'error');--> statement-breakpoint
CREATE TABLE "shops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"consumer_key_enc" text NOT NULL,
	"consumer_secret_enc" text NOT NULL,
	"status" "shop_status" DEFAULT 'active' NOT NULL,
	"last_connection_check_at" timestamp,
	"last_connection_ok" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shops_url_unique" UNIQUE("url")
);
--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "shops_updated_at_index" ON "shops" USING btree ("updated_at");