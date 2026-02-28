import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { eq, and } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

// Old seed-amenities.ts used Lucide icon names with different slugs than the
// registry. These 4 slugs were not in the registry so onConflictDoUpdate didn't
// fix them. Map each slug to the correct Phosphor icon name.
const FIXES = [
  { slug: "kitchen",         icon: "cooking-pot"    },
  { slug: "parking",         icon: "car-simple"     },
  { slug: "balcony",         icon: "buildings"      },
  { slug: "washing-machine", icon: "washing-machine" },
];

async function fixLegacyIcons() {
  console.log("Fixing legacy Lucide icon names in amenities table...");

  const [property] = await db.select().from(schema.properties).limit(1);
  if (!property) {
    console.error("No property found.");
    process.exit(1);
  }

  for (const { slug, icon } of FIXES) {
    const result = await db
      .update(schema.amenities)
      .set({ icon, updatedAt: new Date() })
      .where(
        and(
          eq(schema.amenities.propertyId, property.id),
          eq(schema.amenities.slug, slug)
        )
      )
      .returning({ slug: schema.amenities.slug, icon: schema.amenities.icon });

    if (result.length > 0) {
      console.log(`  ✓ ${slug} → icon: ${icon}`);
    } else {
      console.log(`  – ${slug} not found (already clean or doesn't exist)`);
    }
  }

  console.log("\nDone.");
}

fixLegacyIcons().catch((err) => {
  console.error("Fix failed:", err);
  process.exit(1);
});
