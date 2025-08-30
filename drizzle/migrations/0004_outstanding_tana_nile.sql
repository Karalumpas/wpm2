CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"currency" text DEFAULT 'DKK' NOT NULL,
	"currency_symbol" text DEFAULT 'kr' NOT NULL,
	"currency_position" text DEFAULT 'right' NOT NULL,
	"products_per_page" numeric(3, 0) DEFAULT '24' NOT NULL,
	"default_view_mode" text DEFAULT 'grid' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "settings_user_id_idx" ON "settings" USING btree ("user_id");