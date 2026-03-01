CREATE TYPE "public"."cancellation_policy" AS ENUM('flexible', 'moderate', 'strict');--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "cancellation_policy" "cancellation_policy" DEFAULT 'flexible' NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "cancellation_deadline_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "reservations" ADD COLUMN "manage_token" varchar(64);--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_manage_token_unique" UNIQUE("manage_token");