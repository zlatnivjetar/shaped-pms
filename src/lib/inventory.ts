import { db } from "@/db";
import { rooms, inventory } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";

/**
 * Upserts inventory rows for a rolling 365-day window (today + 364 days)
 * for a given property + room type combination.
 *
 * - On insert: sets total_units to current room count, booked/blocked = 0
 * - On conflict: updates total_units only (never touches booked/blocked)
 *
 * Call this after adding or removing a room of this type.
 */
export async function upsertInventory(
  propertyId: string,
  roomTypeId: string
): Promise<void> {
  const [result] = await db
    .select({ count: count() })
    .from(rooms)
    .where(
      and(eq(rooms.propertyId, propertyId), eq(rooms.roomTypeId, roomTypeId))
    );

  const totalUnits = Number(result?.count ?? 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rows = Array.from({ length: 365 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      propertyId,
      roomTypeId,
      date: d.toISOString().slice(0, 10), // YYYY-MM-DD
      totalUnits,
    };
  });

  // Batch inserts to stay within DB parameter limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db
      .insert(inventory)
      .values(batch)
      .onConflictDoUpdate({
        target: [inventory.propertyId, inventory.roomTypeId, inventory.date],
        set: {
          totalUnits,
          updatedAt: new Date(),
        },
      });
  }
}
