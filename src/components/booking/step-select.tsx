"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { AvailableRoomType } from "@/lib/availability";

interface Props {
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  availableRoomTypes: AvailableRoomType[];
}

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function StepSelect({
  propertySlug,
  checkIn,
  checkOut,
  adults,
  childCount,
  availableRoomTypes,
}: Props) {
  const router = useRouter();

  function handleSelect(roomTypeId: string) {
    const params = new URLSearchParams({
      step: "details",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
      room_type_id: roomTypeId,
    });
    router.push(`/${propertySlug}?${params.toString()}`);
  }

  function handleBack() {
    const params = new URLSearchParams({
      step: "search",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
    });
    router.push(`/${propertySlug}?${params.toString()}`);
  }

  const nights =
    (new Date(checkOut + "T00:00:00Z").getTime() -
      new Date(checkIn + "T00:00:00Z").getTime()) /
    86400000;

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1 mb-3"
        >
          ← Change dates
        </button>
        <h2 className="text-xl font-semibold text-stone-900">Select a room</h2>
        <p className="text-sm text-stone-500 mt-1">
          {formatDate(checkIn)} → {formatDate(checkOut)} ·{" "}
          {nights} {nights === 1 ? "night" : "nights"} ·{" "}
          {adults + childCount} {adults + childCount === 1 ? "guest" : "guests"}
        </p>
      </div>

      {availableRoomTypes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-stone-200">
          <p className="text-stone-600 font-medium">No rooms available</p>
          <p className="text-sm text-stone-400 mt-1">
            Try different dates or fewer guests.
          </p>
          <button
            onClick={handleBack}
            className="mt-4 text-sm text-stone-700 underline"
          >
            Change dates
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {availableRoomTypes.map((rt) => (
            <div
              key={rt.roomTypeId}
              className="bg-white rounded-xl border border-stone-200 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-stone-900">{rt.name}</h3>
                  {rt.description && (
                    <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                      {rt.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3 text-sm text-stone-500">
                    <span>Up to {rt.maxOccupancy} guests</span>
                    <span>·</span>
                    <span>
                      {rt.available} room{rt.available !== 1 ? "s" : ""} left
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-stone-900">
                    {formatCurrency(rt.totalCents)}
                    <span className="text-sm font-normal text-stone-500 ml-1">
                      total
                    </span>
                  </p>
                  <p className="text-xs text-stone-400">
                    {formatCurrency(rt.ratePerNightCents)} /{" "}
                    {nights === 1 ? "night" : "night"}
                    {nights > 1 ? ` × ${nights} nights` : ""}
                  </p>
                </div>
                <Button
                  onClick={() => handleSelect(rt.roomTypeId)}
                  className="bg-stone-900 hover:bg-stone-700 text-white shrink-0"
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
