import { db } from "@/db";
import { properties, roomTypes, reservations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getAvailableRoomTypes, checkAvailability } from "@/lib/availability";
import BookingFlow from "@/components/booking/booking-flow";

interface Props {
  params: Promise<{ propertySlug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { propertySlug } = await params;
  const sp = await searchParams;

  const property = await db.query.properties.findFirst({
    where: and(
      eq(properties.slug, propertySlug),
      eq(properties.status, "active")
    ),
  });

  if (!property) notFound();

  const step = sp.step ?? "search";

  // Fetch step-specific data on the server
  let availableRoomTypes = null;
  let selectedRoomType = null;
  let confirmTotal = 0;
  let completedReservation = null;

  if (step === "select" && sp.check_in && sp.check_out) {
    availableRoomTypes = await getAvailableRoomTypes(
      property.id,
      sp.check_in,
      sp.check_out
    );
  }

  if (
    (step === "details" || step === "confirm") &&
    sp.room_type_id
  ) {
    selectedRoomType =
      (await db.query.roomTypes.findFirst({
        where: and(
          eq(roomTypes.id, sp.room_type_id),
          eq(roomTypes.propertyId, property.id)
        ),
      })) ?? null;
  }

  if (step === "confirm" && sp.room_type_id && sp.check_in && sp.check_out) {
    const avail = await checkAvailability(
      property.id,
      sp.room_type_id,
      sp.check_in,
      sp.check_out
    );
    confirmTotal = avail.nightly.reduce((sum, n) => sum + n.rateCents, 0);
  }

  if (step === "complete" && sp.code) {
    completedReservation =
      (await db.query.reservations.findFirst({
        where: and(
          eq(reservations.confirmationCode, sp.code),
          eq(reservations.propertyId, property.id)
        ),
        with: {
          guest: true,
          reservationRooms: {
            with: { roomType: true },
          },
        },
      })) ?? null;
  }

  return (
    <BookingFlow
      property={property}
      step={step}
      checkIn={sp.check_in}
      checkOut={sp.check_out}
      adults={sp.adults ? Number(sp.adults) : 2}
      childCount={sp.children ? Number(sp.children) : 0}
      roomTypeId={sp.room_type_id}
      code={sp.code}
      availableRoomTypes={availableRoomTypes}
      selectedRoomType={selectedRoomType}
      confirmTotal={confirmTotal}
      completedReservation={completedReservation}
    />
  );
}
