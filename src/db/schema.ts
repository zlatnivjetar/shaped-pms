import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  time,
  date,
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

export const ratePlanTypeEnum = pgEnum("rate_plan_type", [
  "seasonal",
  "length_of_stay",
  "occupancy",
]);

export const ratePlanStatusEnum = pgEnum("rate_plan_status", [
  "active",
  "inactive",
]);

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
]);

export const reservationChannelEnum = pgEnum("reservation_channel", [
  "direct",
  "booking_com",
  "airbnb",
  "expedia",
  "walk_in",
  "phone",
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

// ─── Rate Plans ───────────────────────────────────────────────────────────────

export const ratePlans = pgTable(
  "rate_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: ratePlanTypeEnum("type").notNull().default("seasonal"),
    dateStart: date("date_start"),
    dateEnd: date("date_end"),
    minNights: integer("min_nights"),
    rateCents: integer("rate_cents").notNull(),
    priority: integer("priority").notNull().default(0),
    status: ratePlanStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("rate_plans_property_id_idx").on(t.propertyId),
    index("rate_plans_room_type_id_idx").on(t.roomTypeId),
  ]
);

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    totalUnits: integer("total_units").notNull(),
    bookedUnits: integer("booked_units").notNull().default(0),
    blockedUnits: integer("blocked_units").notNull().default(0),
    rateOverrideCents: integer("rate_override_cents"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("inventory_property_room_type_date_idx").on(
      t.propertyId,
      t.roomTypeId,
      t.date
    ),
    index("inventory_property_id_idx").on(t.propertyId),
    index("inventory_date_idx").on(t.date),
  ]
);

// ─── Guests ───────────────────────────────────────────────────────────────────

export const guests = pgTable(
  "guests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    country: text("country"),
    notes: text("notes"),
    totalStays: integer("total_stays").notNull().default(0),
    totalSpentCents: integer("total_spent_cents").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("guests_property_email_idx").on(t.propertyId, t.email),
    index("guests_property_id_idx").on(t.propertyId),
  ]
);

// ─── Reservations ─────────────────────────────────────────────────────────────

export const reservations = pgTable(
  "reservations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    guestId: uuid("guest_id")
      .notNull()
      .references(() => guests.id),
    confirmationCode: text("confirmation_code").notNull().unique(),
    checkIn: date("check_in").notNull(),
    checkOut: date("check_out").notNull(),
    nights: integer("nights").notNull(),
    adults: integer("adults").notNull().default(1),
    children: integer("children").notNull().default(0),
    status: reservationStatusEnum("status").notNull().default("confirmed"),
    channel: reservationChannelEnum("channel").notNull().default("direct"),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    specialRequests: text("special_requests"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancellationReason: text("cancellation_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reservations_property_id_idx").on(t.propertyId),
    index("reservations_guest_id_idx").on(t.guestId),
    index("reservations_check_in_idx").on(t.checkIn),
    index("reservations_status_idx").on(t.status),
  ]
);

// ─── Reservation Rooms ────────────────────────────────────────────────────────

export const reservationRooms = pgTable(
  "reservation_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reservationId: uuid("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    roomTypeId: uuid("room_type_id")
      .notNull()
      .references(() => roomTypes.id),
    roomId: uuid("room_id").references(() => rooms.id),
    ratePerNightCents: integer("rate_per_night_cents").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("reservation_rooms_reservation_id_idx").on(t.reservationId),
    index("reservation_rooms_room_type_id_idx").on(t.roomTypeId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const propertiesRelations = relations(properties, ({ many }) => ({
  roomTypes: many(roomTypes),
  rooms: many(rooms),
  ratePlans: many(ratePlans),
  inventory: many(inventory),
  guests: many(guests),
  reservations: many(reservations),
}));

export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  property: one(properties, {
    fields: [roomTypes.propertyId],
    references: [properties.id],
  }),
  rooms: many(rooms),
  ratePlans: many(ratePlans),
  inventory: many(inventory),
  reservationRooms: many(reservationRooms),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),
  reservationRooms: many(reservationRooms),
}));

export const ratePlansRelations = relations(ratePlans, ({ one }) => ({
  property: one(properties, {
    fields: [ratePlans.propertyId],
    references: [properties.id],
  }),
  roomType: one(roomTypes, {
    fields: [ratePlans.roomTypeId],
    references: [roomTypes.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  property: one(properties, {
    fields: [inventory.propertyId],
    references: [properties.id],
  }),
  roomType: one(roomTypes, {
    fields: [inventory.roomTypeId],
    references: [roomTypes.id],
  }),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
  property: one(properties, {
    fields: [guests.propertyId],
    references: [properties.id],
  }),
  reservations: many(reservations),
}));

export const reservationsRelations = relations(
  reservations,
  ({ one, many }) => ({
    property: one(properties, {
      fields: [reservations.propertyId],
      references: [properties.id],
    }),
    guest: one(guests, {
      fields: [reservations.guestId],
      references: [guests.id],
    }),
    reservationRooms: many(reservationRooms),
  })
);

export const reservationRoomsRelations = relations(
  reservationRooms,
  ({ one }) => ({
    reservation: one(reservations, {
      fields: [reservationRooms.reservationId],
      references: [reservations.id],
    }),
    roomType: one(roomTypes, {
      fields: [reservationRooms.roomTypeId],
      references: [roomTypes.id],
    }),
    room: one(rooms, {
      fields: [reservationRooms.roomId],
      references: [rooms.id],
    }),
  })
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type Property = typeof properties.$inferSelect;
export type NewProperty = typeof properties.$inferInsert;
export type RoomType = typeof roomTypes.$inferSelect;
export type NewRoomType = typeof roomTypes.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type RatePlan = typeof ratePlans.$inferSelect;
export type NewRatePlan = typeof ratePlans.$inferInsert;
export type Inventory = typeof inventory.$inferSelect;
export type NewInventory = typeof inventory.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type ReservationRoom = typeof reservationRooms.$inferSelect;
export type NewReservationRoom = typeof reservationRooms.$inferInsert;
