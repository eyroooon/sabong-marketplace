CREATE TABLE "video_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"click_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "video_listings" ADD CONSTRAINT "video_listings_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_listings" ADD CONSTRAINT "video_listings_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_video_listings_unique" ON "video_listings" USING btree ("video_id","listing_id");--> statement-breakpoint
CREATE INDEX "idx_video_listings_video" ON "video_listings" USING btree ("video_id");--> statement-breakpoint
CREATE INDEX "idx_video_listings_listing" ON "video_listings" USING btree ("listing_id");