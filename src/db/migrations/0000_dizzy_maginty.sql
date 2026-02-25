CREATE TYPE "public"."payment_mode" AS ENUM('full_at_booking', 'deposit_at_booking');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."room_status" AS ENUM('available', 'maintenance', 'out_of_service');--> statement-breakpoint
CREATE TYPE "public"."room_type_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"address" text,
	"city" text,
	"country" text,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"timezone" text DEFAULT 'Europe/Zagreb' NOT NULL,
	"check_in_time" time,
	"check_out_time" time,
	"deposit_percentage" integer DEFAULT 30 NOT NULL,
	"payment_mode" "payment_mode" DEFAULT 'full_at_booking' NOT NULL,
	"status" "property_status" DEFAULT 'active' NOT NULL,
	"stripe_account_id" text,
	"api_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "properties_slug_unique" UNIQUE("slug"),
	CONSTRAINT "properties_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "room_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"base_occupancy" integer DEFAULT 2 NOT NULL,
	"max_occupancy" integer DEFAULT 2 NOT NULL,
	"base_rate_cents" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"status" "room_type_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"room_number" text NOT NULL,
	"floor" text,
	"status" "room_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "room_types_property_id_idx" ON "room_types" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "rooms_property_id_idx" ON "rooms" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "rooms_room_type_id_idx" ON "rooms" USING btree ("room_type_id");