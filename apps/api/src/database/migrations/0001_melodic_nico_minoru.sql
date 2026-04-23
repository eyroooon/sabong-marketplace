CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_a_id" uuid NOT NULL,
	"user_b_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "friends_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_a_id_users_id_fk" FOREIGN KEY ("user_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_user_b_id_users_id_fk" FOREIGN KEY ("user_b_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_friendships_unique_pair" ON "friendships" USING btree ("user_a_id","user_b_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_user_a" ON "friendships" USING btree ("user_a_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_user_b" ON "friendships" USING btree ("user_b_id");--> statement-breakpoint
CREATE INDEX "idx_friendships_status" ON "friendships" USING btree ("status");
