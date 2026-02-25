CREATE TYPE "public"."rate_plan_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."rate_plan_type" AS ENUM('seasonal', 'length_of_stay', 'occupancy');--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_units" integer NOT NULL,
	"booked_units" integer DEFAULT 0 NOT NULL,
	"blocked_units" integer DEFAULT 0 NOT NULL,
	"rate_override_cents" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "rate_plan_type" DEFAULT 'seasonal' NOT NULL,
	"date_start" date,
	"date_end" date,
	"min_nights" integer,
	"rate_cents" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" "rate_plan_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rate_plans" ADD CONSTRAINT "rate_plans_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_property_room_type_date_idx" ON "inventory" USING btree ("property_id","room_type_id","date");--> statement-breakpoint
CREATE INDEX "inventory_property_id_idx" ON "inventory" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "inventory_date_idx" ON "inventory" USING btree ("date");--> statement-breakpoint
CREATE INDEX "rate_plans_property_id_idx" ON "rate_plans" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "rate_plans_room_type_id_idx" ON "rate_plans" USING btree ("room_type_id");