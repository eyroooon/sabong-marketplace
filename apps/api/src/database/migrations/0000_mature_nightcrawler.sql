CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"phone" varchar(20) NOT NULL,
	"password_hash" varchar(255),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"display_name" varchar(100),
	"avatar_url" varchar(500),
	"role" varchar(20) DEFAULT 'buyer' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"phone_verified" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"region" varchar(100),
	"province" varchar(100),
	"city" varchar(100),
	"barangay" varchar(100),
	"address_line" varchar(255),
	"zip_code" varchar(10),
	"language" varchar(5) DEFAULT 'fil' NOT NULL,
	"notification_prefs" jsonb DEFAULT '{"sms":true,"push":true,"email":false}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "seller_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"farm_name" varchar(200) NOT NULL,
	"business_type" varchar(50),
	"description" text,
	"verification_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"government_id_url" varchar(500),
	"farm_permit_url" varchar(500),
	"verified_at" timestamp with time zone,
	"plan" varchar(20) DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"total_listings" integer DEFAULT 0 NOT NULL,
	"avg_rating" numeric(3, 2) DEFAULT '0.00' NOT NULL,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"response_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"response_time" integer DEFAULT 0 NOT NULL,
	"farm_region" varchar(100),
	"farm_province" varchar(100),
	"farm_city" varchar(100),
	"farm_barangay" varchar(100),
	"facebook_url" varchar(500),
	"youtube_url" varchar(500),
	"tiktok_url" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seller_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"alt_text" varchar(200),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"slug" varchar(250) NOT NULL,
	"category" varchar(50) NOT NULL,
	"breed" varchar(100),
	"bloodline" varchar(200),
	"age_months" integer,
	"weight_kg" numeric(4, 2),
	"color" varchar(50),
	"leg_color" varchar(50),
	"fighting_style" varchar(100),
	"sire_info" varchar(200),
	"dam_info" varchar(200),
	"pedigree_url" varchar(500),
	"vaccination_status" varchar(50),
	"health_cert_url" varchar(500),
	"price" numeric(10, 2) NOT NULL,
	"price_type" varchar(20) DEFAULT 'fixed' NOT NULL,
	"min_bid" numeric(10, 2),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_until" timestamp with time zone,
	"location_province" varchar(100) NOT NULL,
	"location_city" varchar(100) NOT NULL,
	"shipping_available" boolean DEFAULT false NOT NULL,
	"shipping_areas" varchar(50) DEFAULT 'local' NOT NULL,
	"shipping_fee" numeric(8, 2),
	"meetup_available" boolean DEFAULT true NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"inquiry_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"item_price" numeric(10, 2) NOT NULL,
	"shipping_fee" numeric(8, 2) DEFAULT '0' NOT NULL,
	"platform_fee" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"status" varchar(30) DEFAULT 'pending' NOT NULL,
	"delivery_method" varchar(20),
	"delivery_address" text,
	"tracking_number" varchar(100),
	"shipping_provider" varchar(50),
	"paid_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"escrow_status" varchar(20) DEFAULT 'none' NOT NULL,
	"escrow_released_at" timestamp with time zone,
	"buyer_notes" text,
	"seller_notes" text,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'PHP' NOT NULL,
	"method" varchar(30) NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_payment_id" varchar(200),
	"provider_checkout_url" varchar(500),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"provider_response" text,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" varchar(200),
	"comment" text,
	"accuracy_rating" integer,
	"communication_rating" integer,
	"shipping_rating" integer,
	"seller_response" text,
	"seller_responded_at" timestamp with time zone,
	"is_visible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "rating_check" CHECK ("reviews"."rating" >= 1 AND "reviews"."rating" <= 5)
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"last_message_at" timestamp with time zone,
	"last_message_preview" varchar(200),
	"buyer_unread_count" integer DEFAULT 0 NOT NULL,
	"seller_unread_count" integer DEFAULT 0 NOT NULL,
	"is_archived_buyer" boolean DEFAULT false NOT NULL,
	"is_archived_seller" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar(20) DEFAULT 'text' NOT NULL,
	"offer_amount" numeric(10, 2),
	"offer_status" varchar(20),
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bloodlines" (
	"id" serial PRIMARY KEY NOT NULL,
	"breed_id" integer,
	"name" varchar(200) NOT NULL,
	"breeder" varchar(200),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "breeds" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"origin" varchar(100),
	"characteristics" text,
	"image_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "breeds_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"name_fil" varchar(50),
	"slug" varchar(50) NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_name_unique" UNIQUE("name"),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"report_type" varchar(20) NOT NULL,
	"listing_id" uuid,
	"reported_user_id" uuid,
	"review_id" uuid,
	"reason" varchar(50) NOT NULL,
	"description" text,
	"evidence_urls" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"resolved_by" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_images" ADD CONSTRAINT "listing_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_seller_profiles_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_seller_id_seller_profiles_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_seller_profiles_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."seller_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bloodlines" ADD CONSTRAINT "bloodlines_breed_id_breeds_id_fk" FOREIGN KEY ("breed_id") REFERENCES "public"."breeds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_user_id_users_id_fk" FOREIGN KEY ("reported_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_phone" ON "users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_user" ON "seller_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_status" ON "seller_profiles" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "idx_seller_profiles_rating" ON "seller_profiles" USING btree ("avg_rating");--> statement-breakpoint
CREATE INDEX "idx_listing_images_listing" ON "listing_images" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_listings_seller" ON "listings" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_listings_status" ON "listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_listings_category" ON "listings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_listings_breed" ON "listings" USING btree ("breed");--> statement-breakpoint
CREATE INDEX "idx_listings_price" ON "listings" USING btree ("price");--> statement-breakpoint
CREATE INDEX "idx_listings_province" ON "listings" USING btree ("location_province");--> statement-breakpoint
CREATE INDEX "idx_listings_featured" ON "listings" USING btree ("is_featured","featured_until");--> statement-breakpoint
CREATE INDEX "idx_listings_created" ON "listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_buyer" ON "orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_orders_seller" ON "orders" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_orders_status" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_orders_number" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_payments_order" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_payments_status" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payments_provider" ON "payments" USING btree ("provider_payment_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_seller" ON "reviews" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_listing" ON "reviews" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_conversations_unique" ON "conversations" USING btree ("listing_id","buyer_id","seller_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_buyer" ON "conversations" USING btree ("buyer_id");--> statement-breakpoint
CREATE INDEX "idx_conversations_seller" ON "conversations" USING btree ("seller_id");--> statement-breakpoint
CREATE INDEX "idx_messages_conversation" ON "messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_favorites_unique" ON "favorites" USING btree ("user_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_favorites_user" ON "favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_favorites_listing" ON "favorites" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id","is_read","created_at");--> statement-breakpoint
CREATE INDEX "idx_reports_status" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reports_type" ON "reports" USING btree ("report_type");