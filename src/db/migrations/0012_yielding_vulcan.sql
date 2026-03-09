CREATE TYPE "public"."review_source" AS ENUM('direct', 'booking_com', 'google', 'tripadvisor', 'airbnb', 'expedia');--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "reservation_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "guest_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "review_token_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "reviewer_name" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "source" "review_source" DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "external_id" varchar(255);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "source_rating_raw" real;--> statement-breakpoint
CREATE INDEX "reviews_source_idx" ON "reviews" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_property_external_id_idx" ON "reviews" USING btree ("property_id","external_id");