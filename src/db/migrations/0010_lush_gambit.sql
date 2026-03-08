ALTER TABLE "properties" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "phone" varchar(32);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "maps_url" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "latitude" real;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "longitude" real;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "check_in_instructions" text;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "website_url" text;