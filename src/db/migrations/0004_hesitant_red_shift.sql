CREATE TYPE "public"."email_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."email_type" AS ENUM('confirmation', 'pre_arrival', 'post_stay', 'review_request', 'cancellation');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('pending', 'published', 'hidden');--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"type" "email_type" NOT NULL,
	"recipient_email" text NOT NULL,
	"subject" text NOT NULL,
	"status" "email_status" NOT NULL,
	"sent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"reservation_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"review_token_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"body" text NOT NULL,
	"stay_date_start" date NOT NULL,
	"stay_date_end" date NOT NULL,
	"status" "review_status" DEFAULT 'pending' NOT NULL,
	"property_response" text,
	"property_responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_tokens" ADD CONSTRAINT "review_tokens_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_review_token_id_review_tokens_id_fk" FOREIGN KEY ("review_token_id") REFERENCES "public"."review_tokens"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_logs_reservation_id_idx" ON "email_logs" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "email_logs_property_id_idx" ON "email_logs" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "email_logs_type_idx" ON "email_logs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "review_tokens_reservation_id_idx" ON "review_tokens" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "review_tokens_property_id_idx" ON "review_tokens" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "review_tokens_token_idx" ON "review_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "reviews_property_id_idx" ON "reviews" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "reviews_reservation_id_idx" ON "reviews" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "reviews_guest_id_idx" ON "reviews" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "reviews_status_idx" ON "reviews" USING btree ("status");