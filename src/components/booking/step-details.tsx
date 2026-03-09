"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

function ConfirmSkeleton() {
  return (
    <div className="space-y-5">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm divide-y divide-stone-100">
        {[5, 3, 2].map((rows, i) => (
          <div key={i} className="p-4 space-y-3">
            <Skeleton className="h-4 w-16" />
            {Array.from({ length: rows }).map((_, j) => (
              <div key={j} className="flex justify-between">
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
import type { RoomType } from "@/db/schema";
import type { GuestDetails } from "./booking-flow";

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

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
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

  // Prefetch confirm step on mount — all URL params are already known as props
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const nights =
    (new Date(checkOut + "T00:00:00Z").getTime() -
      new Date(checkIn + "T00:00:00Z").getTime()) /
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
    const errs: Record<string, string> = {};
    if (!guestDetails.firstName.trim()) errs.firstName = "First name is required";
    if (!guestDetails.lastName.trim()) errs.lastName = "Last name is required";
    if (!guestDetails.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.email))
      errs.email = "Please enter a valid email address";
    return errs;
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

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
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  }

  if (isPending) return <ConfirmSkeleton />;

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="text-sm text-stone-500 hover:text-stone-800 flex items-center gap-1 mb-3"
        >
          ← Back to rooms
        </button>
        <h2 className="text-xl font-semibold text-stone-900">Your details</h2>
      </div>

      {/* Booking summary */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm p-4 mb-6 text-sm">
        <p className="font-medium text-stone-800">{selectedRoomType.name}</p>
        <p className="text-stone-500 mt-0.5">
          {formatDate(checkIn)} → {formatDate(checkOut)} ·{" "}
          {nights} {nights === 1 ? "night" : "nights"}
        </p>
        <p className="text-stone-500">
          {adults} {adults === 1 ? "adult" : "adults"}
          {childCount > 0 ? `, ${childCount} ${childCount === 1 ? "child" : "children"}` : ""}
        </p>
      </div>

      <form onSubmit={handleContinue} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name *</Label>
            <Input
              id="firstName"
              value={guestDetails.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Jane"
              autoComplete="given-name"
              className="bg-white focus-visible:ring-[#1E3A8A]/50"
            />
            {errors.firstName && (
              <p className="text-xs text-red-600">{errors.firstName}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name *</Label>
            <Input
              id="lastName"
              value={guestDetails.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Smith"
              autoComplete="family-name"
              className="bg-white focus-visible:ring-[#1E3A8A]/50"
            />
            {errors.lastName && (
              <p className="text-xs text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address *</Label>
          <Input
            id="email"
            type="email"
            value={guestDetails.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@example.com"
            autoComplete="email"
            className="bg-white focus-visible:ring-[#1E3A8A]/50"
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone number <span className="text-stone-400">(optional)</span></Label>
          <Input
            id="phone"
            type="tel"
            value={guestDetails.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+385 91 234 5678"
            autoComplete="tel"
            className="bg-white focus-visible:ring-[#1E3A8A]/50"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="specialRequests">
            Special requests <span className="text-stone-400">(optional)</span>
          </Label>
          <Textarea
            id="specialRequests"
            value={guestDetails.specialRequests}
            onChange={(e) => update("specialRequests", e.target.value)}
            placeholder="Early check-in, ground floor room, etc."
            rows={3}
            className="bg-white focus-visible:ring-[#1E3A8A]/50"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-10 bg-[#CA8A04] hover:bg-amber-700 text-white mt-2"
        >
          Continue to review
        </Button>
      </form>
    </div>
  );
}
