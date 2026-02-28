import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const REGISTRY = [
  { slug: "sleeps",              icon: "bed",                    name: "Sleeps",              sortOrder: 1  },
  { slug: "swimming-pool",       icon: "swimming-pool",          name: "Swimming Pool",       sortOrder: 2  },
  { slug: "full-kitchen",        icon: "cooking-pot",            name: "Kitchen",             sortOrder: 3  },
  { slug: "sea-view",            icon: "waves",                  name: "Sea View",            sortOrder: 4  },
  { slug: "private-parking",     icon: "letter-circle-p",        name: "Free Parking",        sortOrder: 5  },
  { slug: "smoke-free",          icon: "cigarette-slash",        name: "Smoke Free",          sortOrder: 6  },
  { slug: "pet-friendly",        icon: "paw-print",              name: "Pet Friendly",        sortOrder: 7  },
  { slug: "heating-system",      icon: "thermometer-hot",        name: "Heating",             sortOrder: 8  },
  { slug: "air-conditioning",    icon: "snowflake",              name: "Air Conditioning",    sortOrder: 9  },
  { slug: "wifi",                icon: "wifi-high",              name: "Wi-Fi",               sortOrder: 10 },
  { slug: "room-service",        icon: "bell-simple-ringing",    name: "Room Service",        sortOrder: 11 },
  { slug: "private-bathroom",    icon: "bathtub",                name: "Private Bathroom",    sortOrder: 12 },
  { slug: "bedding",             icon: "feather",                name: "Quality Bedding",     sortOrder: 13 },
  { slug: "in-room-safe",        icon: "vault",                  name: "Mini Safe",           sortOrder: 14 },
  { slug: "beach-access",        icon: "beach-ball",             name: "Beach Access",        sortOrder: 15 },
  { slug: "included-breakfast",  icon: "bread",                  name: "Breakfast Included",  sortOrder: 16 },
  { slug: "mini-fridge",         icon: "fridge",                 name: "Mini Fridge",         sortOrder: 17 },
  { slug: "coffee-maker",        icon: "coffee",                 name: "Coffee Maker",        sortOrder: 18 },
  { slug: "smart-tv",            icon: "television",             name: "Smart TV",            sortOrder: 19 },
  { slug: "blackout-curtains",   icon: "moon-stars",             name: "Blackout Curtains",   sortOrder: 20 },
  { slug: "soundproofing",       icon: "speaker-slash",          name: "Soundproofing",       sortOrder: 21 },
  { slug: "fresh-towels",        icon: "hand-towel",             name: "Fresh Towels",        sortOrder: 22 },
  { slug: "daily-cleaning",      icon: "broom",                  name: "Daily Cleaning",      sortOrder: 23 },
  { slug: "guest-toiletries",    icon: "hand-soap",              name: "Toiletries",          sortOrder: 24 },
  { slug: "private-balcony",     icon: "buildings",              name: "Private Balcony",     sortOrder: 25 },
  { slug: "family-rooms",        icon: "users-three",            name: "Family Rooms",        sortOrder: 26 },
  { slug: "baby-crib",           icon: "baby",                   name: "Baby Crib",           sortOrder: 27 },
  { slug: "high-chair",          icon: "chair",                  name: "High Chair",          sortOrder: 28 },
  { slug: "accessible-rooms",    icon: "wheelchair",             name: "Accessible Rooms",    sortOrder: 29 },
  { slug: "laundry-service",     icon: "washing-machine",        name: "Laundry",             sortOrder: 30 },
  { slug: "fitness-center",      icon: "dumbbell",               name: "Gym",                 sortOrder: 31 },
  { slug: "spa-access",          icon: "spa",                    name: "Spa Access",          sortOrder: 32 },
  { slug: "sauna-room",          icon: "fire",                   name: "Sauna Room",          sortOrder: 33 },
  { slug: "hair-dryer",          icon: "hair-dryer",             name: "Hair Dryer",          sortOrder: 34 },
  { slug: "clothes-storage",     icon: "coat-hanger",            name: "Wardrobe",            sortOrder: 35 },
  { slug: "work-desk",           icon: "desk",                   name: "Work Desk",           sortOrder: 36 },
  { slug: "usb-charging",        icon: "usb",                    name: "USB Charging",        sortOrder: 37 },
  { slug: "luggage-rack",        icon: "suitcase-rolling",       name: "Luggage Rack",        sortOrder: 38 },
  { slug: "iron-steamer",        icon: "t-shirt",                name: "Iron/Steamer",        sortOrder: 39 },
  { slug: "bathrobes",           icon: "coat-hanger",            name: "Bathrobes",           sortOrder: 40 },
  { slug: "slippers",            icon: "footprints",             name: "Slippers",            sortOrder: 41 },
  { slug: "24h-reception",       icon: "phone-call",             name: "24/7 Reception",      sortOrder: 42 },
  { slug: "luggage-storage",     icon: "suitcase",               name: "Luggage Storage",     sortOrder: 43 },
  { slug: "valet-parking",       icon: "car-profile",            name: "Valet Parking",       sortOrder: 44 },
  { slug: "airport-shuttle",     icon: "airplane-takeoff",       name: "Airport Shuttle",     sortOrder: 45 },
  { slug: "hot-tub",             icon: "thermometer",            name: "Hot Tub",             sortOrder: 46 },
  { slug: "sun-terrace",         icon: "sun",                    name: "Sun Terrace",         sortOrder: 47 },
  { slug: "on-site-restaurant",  icon: "fork-knife",             name: "On-site Restaurant",  sortOrder: 48 },
  { slug: "buffet-breakfast",    icon: "restaurant",             name: "Buffet Breakfast",    sortOrder: 49 },
  { slug: "snack-bar",           icon: "cookie",                 name: "Snack Bar",           sortOrder: 50 },
  { slug: "kitchenette",         icon: "fork-knife",             name: "Kitchenette",         sortOrder: 51 },
  { slug: "refrigerator",        icon: "fridge",                 name: "Refrigerator",        sortOrder: 52 },
  { slug: "dishwasher",          icon: "drops",                  name: "Dishwasher",          sortOrder: 53 },
  { slug: "quiet-rooms",         icon: "bell-slash",             name: "Quiet Rooms",         sortOrder: 54 },
  { slug: "safe-deposit",        icon: "lock",                   name: "Safe Deposit",        sortOrder: 55 },
  { slug: "concierge-service",   icon: "identification-badge",   name: "Concierge",           sortOrder: 56 },
  { slug: "porter-service",      icon: "hand-heart",             name: "Porter Service",      sortOrder: 57 },
  { slug: "multilingual-staff",  icon: "translate",              name: "Multilingual Staff",  sortOrder: 58 },
  { slug: "bike-storage",        icon: "bicycle",                name: "Bike Storage",        sortOrder: 59 },
  { slug: "gear-storage",        icon: "archive-box",            name: "Gear Storage",        sortOrder: 60 },
  { slug: "tour-assistance",     icon: "map-trifold",            name: "Tour Assistance",     sortOrder: 61 },
  { slug: "flexible-check-in",   icon: "clock-counter-clockwise",name: "Flexible Check-in",   sortOrder: 62 },
  { slug: "flexible-check-out",  icon: "clock-clockwise",        name: "Flexible Check-out",  sortOrder: 63 },
  { slug: "room-upgrades",       icon: "arrow-fat-lines-up",     name: "Room Upgrades",       sortOrder: 64 },
  { slug: "welcome-gift",        icon: "gift",                   name: "Welcome Gift",        sortOrder: 65 },
  { slug: "eco-products",        icon: "leaf",                   name: "Eco Products",        sortOrder: 66 },
  { slug: "workstation",         icon: "monitor",                name: "Workstation",         sortOrder: 67 },
  { slug: "meeting-room",        icon: "presentation",           name: "Meeting Room",        sortOrder: 68 },
  { slug: "business-center",     icon: "briefcase",              name: "Business Center",     sortOrder: 69 },
  { slug: "covered-parking",     icon: "garage",                 name: "Covered Parking",     sortOrder: 70 },
  { slug: "rooftop-terrace",     icon: "buildings",              name: "Rooftop Terrace",     sortOrder: 71 },
  { slug: "pool-bar",            icon: "cocktail",               name: "Pool Bar",            sortOrder: 72 },
  { slug: "hotel-bar",           icon: "wine",                   name: "Hotel Bar",           sortOrder: 73 },
  { slug: "keyless-entry",       icon: "keyhole",                name: "Keyless Entry",       sortOrder: 74 },
  { slug: "extra-pillows",       icon: "pillows",                name: "Extra Pillows",       sortOrder: 75 },
  { slug: "board-games",         icon: "dice-five",              name: "Board Games",         sortOrder: 76 },
  { slug: "kids-corner",         icon: "puzzle-piece",           name: "Kids Corner",         sortOrder: 77 },
  { slug: "guest-guides",        icon: "compass",                name: "Guest Guides",        sortOrder: 78 },
  { slug: "security-cameras",    icon: "camera",                 name: "Security Cameras",    sortOrder: 79 },
  { slug: "rental-services",     icon: "car-simple",             name: "Rental Services",     sortOrder: 80 },
  { slug: "add-on-packages",     icon: "seal-check",             name: "Add-on Packages",     sortOrder: 81 },
];

async function seedAmenitiesRegistry() {
  console.log("🌱 Seeding amenities registry...");

  const [property] = await db.select().from(schema.properties).limit(1);
  if (!property) {
    console.error("No property found. Run db:seed first.");
    process.exit(1);
  }

  console.log(`  Property: ${property.name}`);

  const values = REGISTRY.map((a) => ({ ...a, propertyId: property.id }));

  // Insert all 81 amenities. On slug conflict (e.g. existing seed data),
  // update the icon and name to the Phosphor-compatible values.
  const result = await db
    .insert(schema.amenities)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.amenities.propertyId, schema.amenities.slug],
      set: {
        name: schema.amenities.name,
        icon: schema.amenities.icon,
        sortOrder: schema.amenities.sortOrder,
        updatedAt: new Date(),
      },
    })
    .returning({ slug: schema.amenities.slug });

  console.log(`  ✓ ${result.length} amenities upserted`);
  console.log("\n✅ Amenity registry seed complete!");
}

seedAmenitiesRegistry().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
