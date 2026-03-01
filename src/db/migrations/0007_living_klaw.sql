ALTER TYPE "public"."payment_mode" ADD VALUE 'scheduled';--> statement-breakpoint
CREATE TABLE "booking_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"room_type_id" uuid NOT NULL,
	"min_nights" integer,
	"max_nights" integer,
	"allowed_check_in_days" integer[],
	"allowed_check_out_days" integer[],
	"date_start" date,
	"date_end" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_charge_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "stripe_payment_intent_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_setup_intent_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "stripe_payment_method_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "scheduled_charge_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "charge_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "scheduled_charge_threshold_days" integer DEFAULT 7 NOT NULL;--> statement-breakpoint
ALTER TABLE "booking_rules" ADD CONSTRAINT "booking_rules_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_rules" ADD CONSTRAINT "booking_rules_room_type_id_room_types_id_fk" FOREIGN KEY ("room_type_id") REFERENCES "public"."room_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_charge_log" ADD CONSTRAINT "scheduled_charge_log_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_rules_property_id_idx" ON "booking_rules" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "booking_rules_room_type_id_idx" ON "booking_rules" USING btree ("room_type_id");--> statement-breakpoint
CREATE INDEX "scheduled_charge_log_payment_id_idx" ON "scheduled_charge_log" USING btree ("payment_id");