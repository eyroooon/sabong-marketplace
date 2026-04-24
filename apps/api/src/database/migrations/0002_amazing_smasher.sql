CREATE TABLE "chat_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) DEFAULT 'member' NOT NULL,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"is_muted" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"last_read_at" timestamp with time zone,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" varchar(8) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_conversations_unique";--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "buyer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "seller_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "type" varchar(20) DEFAULT 'listing' NOT NULL;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "title" varchar(100);--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "created_by_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_duration_ms" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_width" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_height" integer;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reply_to_message_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attached_listing_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "attached_video_id" uuid;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_chat_participants_unique" ON "chat_participants" USING btree ("conversation_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_participants_user" ON "chat_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chat_participants_conversation" ON "chat_participants" USING btree ("conversation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_message_reactions_unique" ON "message_reactions" USING btree ("message_id","user_id","emoji");--> statement-breakpoint
CREATE INDEX "idx_message_reactions_message" ON "message_reactions" USING btree ("message_id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_attached_listing_id_listings_id_fk" FOREIGN KEY ("attached_listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_conversations_type" ON "conversations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_conversations_last_message" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "idx_messages_reply_to" ON "messages" USING btree ("reply_to_message_id");--> statement-breakpoint
-- Backfill chat_participants from existing listing conversations
INSERT INTO "chat_participants" ("conversation_id", "user_id", "role", "unread_count")
SELECT "id", "buyer_id", 'member', "buyer_unread_count"
FROM "conversations"
WHERE "buyer_id" IS NOT NULL
ON CONFLICT DO NOTHING;--> statement-breakpoint
INSERT INTO "chat_participants" ("conversation_id", "user_id", "role", "unread_count")
SELECT "id", "seller_id", 'member', "seller_unread_count"
FROM "conversations"
WHERE "seller_id" IS NOT NULL
ON CONFLICT DO NOTHING;