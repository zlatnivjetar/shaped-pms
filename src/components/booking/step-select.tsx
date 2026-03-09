"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AmenityChip } from "./amenity-chip";
import type { AvailableRoomType } from "@/lib/availability";

function DetailsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-20 w-full rounded-md" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

type AmenityInfo = { id: string; name: string; icon: string };

interface Props {
  propertySlug: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  availableRoomTypes: AvailableRoomType[];
  amenitiesByRoomType: Record<string, AmenityInfo[]>;
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
  amenitiesByRoomType,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingRoomTypeId, setPendingRoomTypeId] = useState<string | null>(null);

  // Prefetch details step for every available (non-blocked) room type on mount
  useEffect(() => {
    availableRoomTypes
      .filter((rt) => rt.ruleViolation === null)
      .forEach((rt) => {
        const params = new URLSearchParams({
          step: "details",
          check_in: checkIn,
          check_out: checkOut,
          adults: String(adults),
          children: String(childCount),
          room_type_id: rt.roomTypeId,
        });
        router.prefetch(`/${propertySlug}?${params.toString()}`);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSelect(roomTypeId: string) {
    const params = new URLSearchParams({
      step: "details",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
      room_type_id: roomTypeId,
    });
    setPendingRoomTypeId(roomTypeId);
    startTransition(() => router.push(`/${propertySlug}?${params.toString()}`));
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

  if (isPending) return <DetailsSkeleton />;

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
        <div className="text-center py-12 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm">
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
          {availableRoomTypes.map((rt) => {
            const blocked = rt.ruleViolation !== null;
            const hasDiscount = rt.discountPercentage > 0;
            return (
              <div
                key={rt.roomTypeId}
                className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-5 ${blocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-stone-900">{rt.name}</h3>
                      {!blocked && hasDiscount && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          {rt.discountPercentage}% off
                        </span>
                      )}
                    </div>
                    {rt.description && (
                      <p className="text-sm text-stone-500 mt-1 line-clamp-2">
                        {rt.description}
                      </p>
                    )}
                    {blocked ? (
                      <p className="text-sm text-amber-600 mt-2 font-medium">
                        {rt.ruleViolation}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3 mt-3 text-sm text-stone-500">
                        <span>Up to {rt.maxOccupancy} guests</span>
                        <span>·</span>
                        <span>
                          {rt.available} room{rt.available !== 1 ? "s" : ""} left
                        </span>
                      </div>
                    )}
                    {!blocked && amenitiesByRoomType[rt.roomTypeId]?.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                        {amenitiesByRoomType[rt.roomTypeId].map((a) => (
                          <AmenityChip key={a.id} icon={a.icon} name={a.name} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold text-stone-900">
                      {formatCurrency(rt.totalCents)}
                      <span className="text-sm font-normal text-stone-400 ml-1">
                        total
                      </span>
                    </p>
                    {hasDiscount && !blocked && (
                      <p className="text-xs text-stone-400 line-through">
                        {formatCurrency(rt.originalTotalCents)}
                      </p>
                    )}
                    <p className="text-sm text-stone-400">
                      {formatCurrency(rt.ratePerNightCents)} / night
                      {nights > 1 ? ` × ${nights}` : ""}
                    </p>
                  </div>
                  <Button
                    onClick={() => !blocked && handleSelect(rt.roomTypeId)}
                    disabled={blocked || isPending}
                    className="h-10 bg-[#CA8A04] hover:bg-amber-700 text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pendingRoomTypeId === rt.roomTypeId ? "Loading…" : blocked ? "Unavailable" : "Select"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
