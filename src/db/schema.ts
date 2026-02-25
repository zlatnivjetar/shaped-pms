import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  time,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const propertyStatusEnum = pgEnum("property_status", [
  "active",
  "inactive",
]);

export const paymentModeEnum = pgEnum("payment_mode", [
  "full_at_booking",
  "deposit_at_booking",
]);

export const roomTypeStatusEnum = pgEnum("room_type_status", [
  "active",
  "inactive",
]);

export const roomStatusEnum = pgEnum("room_status", [
  "available",
  "maintenance",
  "out_of_service",
]);

// ─── Properties ───────────────────────────────────────────────────────────────

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  address: text("address"),
  city: text("city"),
  country: text("country"),
  currency: text("currency").notNull().default("EUR"),
  timezone: text("timezone").notNull().default("Europe/Zagreb"),
  checkInTime: time("check_in_time"),
  checkOutTime: time("check_out_time"),
  depositPercentage: integer("deposit_percentage").notNull().default(30),
  paymentMode: paymentModeEnum("payment_mode")
    .notNull()
    .default("full_at_booking"),
  status: propertyStatusEnum("status").notNull().default("active"),
  stripeAccountId: text("stripe_account_id"),
  apiKey: text("api_key").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─── Room Types ───────────────────────────────────────────────────────────────

export const roomTypes = pgTable(
  "room_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    baseOccupancy: integer("base_occupancy").notNull().default(2),
    maxOccupancy: integer("max_occupancy").notNull().default(2),
    baseRateCents: integer("base_rate_cents").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    status: roomTypeStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("room_types_property_id_idx").on(t.propertyId)]
);

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    roomNumber: text("room_number").notNull(),
    floor: text("floor"),
    status: roomStatusEnum("status").notNull().default("available"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("rooms_property_id_idx").on(t.propertyId),
    index("rooms_room_type_id_idx").on(t.roomTypeId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const propertiesRelations = relations(properties, ({ many }) => ({
  roomTypes: many(roomTypes),
  rooms: many(rooms),
}));

export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  property: one(properties, {
    fields: [roomTypes.propertyId],
    references: [properties.id],
  }),
  rooms: many(rooms),
}));

export const roomsRelations = relations(rooms, ({ one }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),
}));

// ─── Types ────────────────────────────────────────────────────────────────────

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type RoomType = typeof roomTypes.$inferSelect;
export type NewRoomType = typeof roomTypes.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
