"use client";

import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { AvailableRoomType } from "@/lib/availability";
import { AmenityChip } from "./amenity-chip";
import {
  bookingCardClassName,
  bookingCtaButtonClassName,
  bookingGhostButtonClassName,
  bookingTextLinkClassName,
} from "./styles";

function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((index) => (
        <div key={index} className={`${bookingCardClassName} p-5`}>
          <div className="mb-4 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-32" />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

type AmenityInfo = { id: string; name: string; icon: string };

interface Props {
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  availableRoomTypes: AvailableRoomType[];
  amenitiesByRoomType: Record<string, AmenityInfo[]>;
  isLoading?: boolean;
  onBack: () => void;
  onSelect: (roomTypeId: string) => void;
}

function formatCurrency(cents: number, currency = "EUR") {
  return new Intl.NumberFormat("en-EU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function StepSelect({
  checkIn,
  checkOut,
  adults,
  childCount,
  availableRoomTypes,
  amenitiesByRoomType,
  isLoading = false,
  onBack,
  onSelect,
}: Props) {
  const nights =
    (new Date(`${checkOut}T00:00:00Z`).getTime() -
      new Date(`${checkIn}T00:00:00Z`).getTime()) /
    86400000;

  if (isLoading) {
    return <DetailsSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className={`mb-3 px-0 ${bookingGhostButtonClassName}`}
        >
          ← Change dates
        </Button>
        <h2 className="text-xl font-semibold text-foreground">Select a room</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(checkIn)} → {formatDate(checkOut)} · {nights}{" "}
          {nights === 1 ? "night" : "nights"} · {adults + childCount}{" "}
          {adults + childCount === 1 ? "guest" : "guests"}
        </p>
      </div>

      {availableRoomTypes.length === 0 ? (
        <div className={bookingCardClassName}>
          <EmptyState
            icon={Search}
            size="compact"
            title="No rooms available"
            description="Try different dates, fewer guests, or a shorter stay."
            action={(
              <button
                type="button"
                onClick={onBack}
                className={bookingTextLinkClassName}
              >
                Change dates
              </button>
            )}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {availableRoomTypes.map((roomType) => {
            const blocked = roomType.ruleViolation !== null;
            const hasDiscount = roomType.discountPercentage > 0;

            return (
              <div
                key={roomType.roomTypeId}
                className={`${bookingCardClassName} p-5 ${blocked ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{roomType.name}</h3>
                      {!blocked && hasDiscount && (
                        <Badge
                          variant="outline"
                          className="border-booking-cta/20 bg-booking-cta/10 text-booking-cta"
                        >
                          {roomType.discountPercentage}% off
                        </Badge>
                      )}
                    </div>

                    {roomType.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {roomType.description}
                      </p>
                    )}

                    {blocked ? (
                      <p className="mt-3 text-sm font-medium text-warning">
                        Not available for this stay: {roomType.ruleViolation}
                      </p>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Up to {roomType.maxOccupancy} guests</span>
                        <span>·</span>
                        <span>
                          {roomType.available} room{roomType.available !== 1 ? "s" : ""} left
                        </span>
                      </div>
                    )}

                    {!blocked && amenitiesByRoomType[roomType.roomTypeId]?.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                        {amenitiesByRoomType[roomType.roomTypeId].map((amenity) => (
                          <AmenityChip
                            key={amenity.id}
                            icon={amenity.icon}
                            name={amenity.name}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(roomType.totalCents)}
                      <span className="ml-1 text-sm font-normal text-muted-foreground">
                        total
                      </span>
                    </p>
                    {hasDiscount && !blocked && (
                      <p className="text-xs text-muted-foreground line-through">
                        {formatCurrency(roomType.originalTotalCents)}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(roomType.ratePerNightCents)} / night
                      {nights > 1 ? ` × ${nights}` : ""}
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => !blocked && onSelect(roomType.roomTypeId)}
                    disabled={blocked}
                    className={`h-10 shrink-0 ${bookingCtaButtonClassName}`}
                  >
                    {blocked ? "Unavailable" : "Select"}
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
