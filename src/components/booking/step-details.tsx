"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DetailRow } from "@/components/ui/detail-row";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { RoomType } from "@/db/schema";
import type { GuestDetails } from "./booking-flow";
import {
  bookingCardClassName,
  bookingCtaButtonClassName,
  bookingGhostButtonClassName,
  bookingInputClassName,
} from "./styles";

function ConfirmSkeleton() {
  return (
    <div className="space-y-5">
      <div className={`${bookingCardClassName} divide-y divide-border`}>
        {[5, 3, 2].map((rows, index) => (
          <div key={index} className="space-y-3 p-4">
            <Skeleton className="h-4 w-16" />
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
}

interface Props {
  propertySlug: string;
  selectedRoomType: RoomType;
  checkIn: string;
  checkOut: string;
  adults: number;
  childCount: number;
  roomTypeId: string;
  guestDetails: GuestDetails;
  onGuestDetailsChange: (details: GuestDetails) => void;
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function StepDetails({
  propertySlug,
  selectedRoomType,
  checkIn,
  checkOut,
  adults,
  childCount,
  roomTypeId,
  guestDetails,
  onGuestDetailsChange,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const params = new URLSearchParams({
      step: "confirm",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
      room_type_id: roomTypeId,
    });

    router.prefetch(`/${propertySlug}?${params.toString()}`);
  }, [adults, checkIn, checkOut, childCount, propertySlug, roomTypeId, router]);

  const nights =
    (new Date(`${checkOut}T00:00:00Z`).getTime() -
      new Date(`${checkIn}T00:00:00Z`).getTime()) /
    86400000;

  function handleBack() {
    const params = new URLSearchParams({
      step: "select",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
    });

    router.push(`/${propertySlug}?${params.toString()}`);
  }

  function validate() {
    const nextErrors: Record<string, string> = {};

    if (!guestDetails.firstName.trim()) {
      nextErrors.firstName = "First name is required";
    }

    if (!guestDetails.lastName.trim()) {
      nextErrors.lastName = "Last name is required";
    }

    if (!guestDetails.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    return nextErrors;
  }

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const params = new URLSearchParams({
      step: "confirm",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(childCount),
      room_type_id: roomTypeId,
    });

    startTransition(() => router.push(`/${propertySlug}?${params.toString()}`));
  }

  function update(field: keyof GuestDetails, value: string) {
    onGuestDetailsChange({ ...guestDetails, [field]: value });

    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: "" }));
    }
  }

  if (isPending) {
    return <ConfirmSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className={`mb-3 px-0 ${bookingGhostButtonClassName}`}
        >
          ← Back to rooms
        </Button>
        <h2 className="text-xl font-semibold text-foreground">Your details</h2>
      </div>

      <div className={`${bookingCardClassName} mb-6 p-4`}>
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-booking-accent">
          Booking summary
        </p>
        <div className="space-y-0.5">
          <DetailRow label="Room" value={selectedRoomType.name} />
          <DetailRow label="Check-in" value={formatDate(checkIn)} />
          <DetailRow label="Check-out" value={formatDate(checkOut)} />
          <DetailRow
            label="Stay"
            value={`${nights} ${nights === 1 ? "night" : "nights"}`}
          />
          <DetailRow
            label="Guests"
            value={`${adults} ${adults === 1 ? "adult" : "adults"}${childCount > 0 ? `, ${childCount} ${childCount === 1 ? "child" : "children"}` : ""}`}
          />
        </div>
      </div>

      <form onSubmit={handleContinue} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={
              <>
                First name <span className="text-destructive">*</span>
              </>
            }
            htmlFor="firstName"
            error={errors.firstName}
          >
            <Input
              id="firstName"
              value={guestDetails.firstName}
              onChange={(event) => update("firstName", event.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
              className={bookingInputClassName}
            />
          </FormField>

          <FormField
            label={
              <>
                Last name <span className="text-destructive">*</span>
              </>
            }
            htmlFor="lastName"
            error={errors.lastName}
          >
            <Input
              id="lastName"
              value={guestDetails.lastName}
              onChange={(event) => update("lastName", event.target.value)}
              placeholder="Smith"
              autoComplete="family-name"
              className={bookingInputClassName}
            />
          </FormField>
        </div>

        <FormField
          label={
            <>
              Email address <span className="text-destructive">*</span>
            </>
          }
          htmlFor="email"
          error={errors.email}
        >
          <Input
            id="email"
            type="email"
            value={guestDetails.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="jane@example.com"
            autoComplete="email"
            className={bookingInputClassName}
          />
        </FormField>

        <FormField
          label={
            <>
              Phone number <span className="text-muted-foreground">(optional)</span>
            </>
          }
          htmlFor="phone"
        >
          <Input
            id="phone"
            type="tel"
            value={guestDetails.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="+385 91 234 5678"
            autoComplete="tel"
            className={bookingInputClassName}
          />
        </FormField>

        <FormField
          label={
            <>
              Special requests <span className="text-muted-foreground">(optional)</span>
            </>
          }
          htmlFor="specialRequests"
          description="Share arrival notes or accessibility requests. We’ll pass them to the property."
        >
          <Textarea
            id="specialRequests"
            value={guestDetails.specialRequests}
            onChange={(event) => update("specialRequests", event.target.value)}
            placeholder="Early check-in, ground floor room, etc."
            rows={4}
            className={bookingInputClassName}
          />
        </FormField>

        <Button type="submit" className={`mt-2 h-10 w-full ${bookingCtaButtonClassName}`}>
          Continue to review
        </Button>
      </form>
    </div>
  );
}
