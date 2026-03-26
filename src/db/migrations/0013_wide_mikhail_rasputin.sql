CREATE INDEX "discounts_property_status_room_type_idx" ON "discounts" USING btree ("property_id","status","room_type_id");--> statement-breakpoint
CREATE INDEX "inventory_property_date_idx" ON "inventory" USING btree ("property_id","date");--> statement-breakpoint
CREATE INDEX "rate_plans_property_room_type_status_idx" ON "rate_plans" USING btree ("property_id","room_type_id","status");--> statement-breakpoint
CREATE INDEX "reservations_property_updated_at_idx" ON "reservations" USING btree ("property_id","updated_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reservations_property_status_created_at_idx" ON "reservations" USING btree ("property_id","status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "reviews_property_status_source_created_at_idx" ON "reviews" USING btree ("property_id","status","source","created_at" DESC NULLS LAST);