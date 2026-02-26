/**
 * Seed: published reviews for existing checked-out reservations.
 * Run: npm run db:seed-reviews
 *
 * ESM hoisting note: never import from @/db — define own neon + drizzle instances.
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const REVIEWS = [
  {
    rating: 5,
    title: "Absolutely wonderful stay!",
    body: "We had an amazing time at Preelook Apartments. The room was spotless, the views of Rijeka were breathtaking, and the location couldn't be better. The host was incredibly helpful with local tips. We'll definitely be back next summer!",
    propertyResponse:
      "Thank you so much for your kind words! We're thrilled you enjoyed the view and our little city. We look forward to welcoming you back soon!",
  },
  {
    rating: 4,
    title: "Great location, comfortable rooms",
    body: "Really enjoyed our three-night stay. The apartment was clean and well-equipped, and the central location made it easy to explore the city on foot. Check-in was smooth and the host was very responsive. Would recommend!",
    propertyResponse: null,
  },
  {
    rating: 5,
    title: "Perfect city break",
    body: "Preelook Apartments exceeded our expectations in every way. The room was spacious, the bed was extremely comfortable, and we loved having coffee on the balcony each morning. The staff went above and beyond to make us feel welcome. Highly recommended for anyone visiting Rijeka.",
    propertyResponse:
      "We're so happy to hear the balcony mornings were a highlight — that's one of our favourite things too! Thank you for the glowing review.",
  },
];

async function main() {
  console.log("Seeding reviews…");

  // Find the property
  const [property] = await db
    .select()
    .from(schema.properties)
    .limit(1);

  if (!property) {
    console.error("No property found. Run the main seed first.");
    process.exit(1);
  }

  // Find checked-out reservations with a guest
  const checkedOut = await db.query.reservations.findMany({
    where: and(
      eq(schema.reservations.propertyId, property.id),
      eq(schema.reservations.status, "checked_out")
    ),
    with: { guest: true, reservationRooms: true },
    limit: 3,
  });

  if (checkedOut.length === 0) {
    console.log(
      "No checked-out reservations found. Run db:seed-reservations first."
    );
    process.exit(0);
  }

  let created = 0;

  for (let i = 0; i < Math.min(checkedOut.length, REVIEWS.length); i++) {
    const res = checkedOut[i];
    const reviewData = REVIEWS[i];

    if (!res.guest) continue;

    // Check if review already exists for this reservation
    const existing = await db.query.reviews.findFirst({
      where: eq(schema.reviews.reservationId, res.id),
    });
    if (existing) {
      console.log(`  Skipping ${res.confirmationCode} — review already exists`);
      continue;
    }

    // Upsert a review token
    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const usedAt = new Date();

    const [tokenRow] = await db
      .insert(schema.reviewTokens)
      .values({
        reservationId: res.id,
        propertyId: property.id,
        token,
        expiresAt,
        usedAt,
      })
      .returning({ id: schema.reviewTokens.id });

    // Insert the review
    await db.insert(schema.reviews).values({
      propertyId: property.id,
      reservationId: res.id,
      guestId: res.guestId,
      reviewTokenId: tokenRow.id,
      rating: reviewData.rating,
      title: reviewData.title,
      body: reviewData.body,
      stayDateStart: res.checkIn,
      stayDateEnd: res.checkOut,
      status: "published",
      propertyResponse: reviewData.propertyResponse ?? null,
      propertyRespondedAt: reviewData.propertyResponse ? new Date() : null,
    });

    console.log(
      `  ✓ Review created for ${res.confirmationCode} (${res.guest.firstName} ${res.guest.lastName})`
    );
    created++;
  }

  console.log(`Done. Created ${created} review(s).`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
