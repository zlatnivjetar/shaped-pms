"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  propertySlug: string;
  checkInTime?: string;
  checkOutTime?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults: number;
  initialChildren: number;
}

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

export default function StepSearch({
  propertySlug,
  checkInTime,
  checkOutTime,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
}: Props) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? tomorrow);
  const [checkOut, setCheckOut] = useState(
    initialCheckOut ?? new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  );
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [error, setError] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (checkIn >= checkOut) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (checkIn < today) {
      setError("Check-in cannot be in the past.");
      return;
    }

    const params = new URLSearchParams({
      step: "select",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(children),
    });
    router.push(`/${propertySlug}?${params.toString()}`);
  }

  function handleCheckInChange(val: string) {
    setCheckIn(val);
    // Auto-advance checkout if it's not after new check-in
    if (val >= checkOut) {
      const next = new Date(val + "T00:00:00Z");
      next.setUTCDate(next.getUTCDate() + 1);
      setCheckOut(next.toISOString().slice(0, 10));
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-stone-900">Find your stay</h2>
        {(checkInTime || checkOutTime) && (
          <p className="text-sm text-stone-500 mt-1">
            {checkInTime && `Check-in from ${checkInTime}`}
            {checkInTime && checkOutTime && " · "}
            {checkOutTime && `Check-out by ${checkOutTime}`}
          </p>
        )}
      </div>

      <form onSubmit={handleSearch} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="check-in">Check-in</Label>
            <input
              id="check-in"
              type="date"
              value={checkIn}
              min={today}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="check-out">Check-out</Label>
            <input
              id="check-out"
              type="date"
              value={checkOut}
              min={checkIn ? (() => { const d = new Date(checkIn + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })() : tomorrow}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="adults">Adults</Label>
            <select
              id="adults"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "adult" : "adults"}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="children">Children</Label>
            <select
              id="children"
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-400"
            >
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? "child" : "children"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" className="w-full bg-stone-900 hover:bg-stone-700 text-white">
          Search available rooms
        </Button>
      </form>
    </div>
  );
}
