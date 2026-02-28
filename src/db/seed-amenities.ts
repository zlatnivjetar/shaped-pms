import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seedAmenities() {
  console.log("🌱 Seeding amenities...");

  const [property] = await db
    .select()
    .from(schema.properties)
    .limit(1);

  if (!property) {
    console.error("No property found. Run db:seed first.");
    process.exit(1);
  }

  console.log(`  Property: ${property.name}`);

  // Skip if amenities already exist
  const existing = await db
    .select()
    .from(schema.amenities)
    .where(eq(schema.amenities.propertyId, property.id));

  if (existing.length > 0) {
    console.log(`  Amenities already seeded (${existing.length} found), skipping.`);
    return;
  }

  const amenityData = [
    { name: "Free Wi-Fi", slug: "wifi", icon: "wifi", sortOrder: 1 },
    { name: "Air Conditioning", slug: "air-conditioning", icon: "thermometer", sortOrder: 2 },
    { name: "Fully Equipped Kitchen", slug: "kitchen", icon: "utensils", sortOrder: 3 },
    { name: "Free Parking", slug: "parking", icon: "car", sortOrder: 4 },
    { name: "Sea View", slug: "sea-view", icon: "waves", sortOrder: 5 },
    { name: "Balcony / Terrace", slug: "balcony", icon: "home", sortOrder: 6 },
    { name: "Washing Machine", slug: "washing-machine", icon: "wind", sortOrder: 7 },
    { name: "Smart TV", slug: "smart-tv", icon: "tv", sortOrder: 8 },
  ];

  const insertedAmenities = await db
    .insert(schema.amenities)
    .values(amenityData.map((a) => ({ ...a, propertyId: property.id })))
    .returning();

  console.log(`  ✓ Amenities: ${insertedAmenities.length} created`);

  const amenityBySlug = new Map(insertedAmenities.map((a) => [a.slug, a.id]));

  // Fetch room types
  const allRoomTypes = await db
    .select()
    .from(schema.roomTypes)
    .where(eq(schema.roomTypes.propertyId, property.id));

  const bySlug = Object.fromEntries(allRoomTypes.map((rt) => [rt.slug, rt]));

  const amenityAssignments: Array<{ roomTypeId: string; amenityId: string }> = [];

  const assign = (roomTypeSlug: string, amenitySlugs: string[]) => {
    const rt = bySlug[roomTypeSlug];
    if (!rt) return;
    for (const slug of amenitySlugs) {
      const amenityId = amenityBySlug.get(slug);
      if (amenityId) amenityAssignments.push({ roomTypeId: rt.id, amenityId });
    }
  };

  assign("studio", ["wifi", "air-conditioning", "kitchen", "smart-tv"]);
  assign("one-bedroom", ["wifi", "air-conditioning", "kitchen", "balcony", "washing-machine", "smart-tv"]);
  assign("two-bedroom", ["wifi", "air-conditioning", "kitchen", "balcony", "sea-view", "washing-machine", "smart-tv", "parking"]);
  assign("penthouse", ["wifi", "air-conditioning", "kitchen", "balcony", "sea-view", "smart-tv", "parking"]);

  if (amenityAssignments.length > 0) {
    await db.insert(schema.roomTypeAmenities).values(amenityAssignments);
  }

  console.log(`  ✓ Amenity assignments: ${amenityAssignments.length} created`);
  console.log("\n✅ Amenity seed complete!");
}

seedAmenities().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
