-- Mock trial additions: video_comments, follows, social counters, share count
-- Idempotent — safe to run multiple times.

CREATE TABLE IF NOT EXISTS "video_comments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "video_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "parent_id" uuid,
  "content" text NOT NULL,
  "like_count" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "follows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "follower_id" uuid NOT NULL,
  "following_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "followers_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "following_count" integer DEFAULT 0 NOT NULL;
ALTER TABLE "videos" ADD COLUMN IF NOT EXISTS "share_count" integer DEFAULT 0 NOT NULL;

DO $$ BEGIN
  ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_video_id_videos_id_fk"
    FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "video_comments" ADD CONSTRAINT "video_comments_parent_id_video_comments_id_fk"
    FOREIGN KEY ("parent_id") REFERENCES "public"."video_comments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk"
    FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "follows" ADD CONSTRAINT "follows_following_id_users_id_fk"
    FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS "idx_video_comments_video" ON "video_comments" USING btree ("video_id");
CREATE INDEX IF NOT EXISTS "idx_video_comments_user" ON "video_comments" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "idx_video_comments_parent" ON "video_comments" USING btree ("parent_id");
CREATE INDEX IF NOT EXISTS "idx_video_comments_created" ON "video_comments" USING btree ("created_at");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_follows_unique" ON "follows" USING btree ("follower_id","following_id");
CREATE INDEX IF NOT EXISTS "idx_follows_follower" ON "follows" USING btree ("follower_id");
CREATE INDEX IF NOT EXISTS "idx_follows_following" ON "follows" USING btree ("following_id");
