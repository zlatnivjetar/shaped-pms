"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

function SelectSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1].map((i) => (
        <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-5">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2 mt-3">
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

interface Props {
  propertySlug: string;
  checkInTime?: string;
  checkOutTime?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults: number;
  initialChildren: number;
}

const todayStr = new Date().toISOString().slice(0, 10);
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfterStr = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

function toDate(str: string): Date {
  return new Date(str + "T00:00:00");
}

function toStr(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

function formatDisplay(str: string): string {
  if (!str) return "Select date";
  return toDate(str).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

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
  const [isPending, startTransition] = useTransition();
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? tomorrowStr);
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? dayAfterStr);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [error, setError] = useState("");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const today = toDate(todayStr);
  const minCheckOut = (() => {
    const d = toDate(checkIn);
    d.setDate(d.getDate() + 1);
    return d;
  })();

  // Debounced prefetch of select step whenever dates/guests form a valid combination
  useEffect(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut || checkIn < todayStr) return;
    const params = new URLSearchParams({
      step: "select",
      check_in: checkIn,
      check_out: checkOut,
      adults: String(adults),
      children: String(children),
    });
    const t = setTimeout(() => router.prefetch(`/${propertySlug}?${params.toString()}`), 300);
    return () => clearTimeout(t);
  }, [checkIn, checkOut, adults, children, propertySlug, router]);

  function handleCheckInSelect(date: Date | undefined) {
    if (!date) return;
    const val = toStr(date);
    setCheckIn(val);
    if (val >= checkOut) {
      const next = new Date(date);
      next.setDate(next.getDate() + 1);
      setCheckOut(toStr(next));
    }
    setCheckInOpen(false);
  }

  function handleCheckOutSelect(date: Date | undefined) {
    if (!date) return;
    setCheckOut(toStr(date));
    setCheckOutOpen(false);
  }

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
    if (checkIn < todayStr) {
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
    startTransition(() => router.push(`/${propertySlug}?${params.toString()}`));
  }

  if (isPending) return <SelectSkeleton />;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm p-6">
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
        {/* Date pickers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Check-in</Label>
            <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-stone-400" />
                  {formatDisplay(checkIn)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkIn ? toDate(checkIn) : undefined}
                  onSelect={handleCheckInSelect}
                  disabled={(date) => date < today}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label>Check-out</Label>
            <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-stone-400" />
                  {formatDisplay(checkOut)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOut ? toDate(checkOut) : undefined}
                  onSelect={handleCheckOutSelect}
                  disabled={(date) => date < minCheckOut}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Guest steppers */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Adults</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAdults((n) => Math.max(1, n - 1))}
                disabled={adults <= 1}
                aria-label="Decrease adults"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center text-sm font-medium text-stone-900">
                {adults} {adults === 1 ? "adult" : "adults"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAdults((n) => Math.min(10, n + 1))}
                disabled={adults >= 10}
                aria-label="Increase adults"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Children</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setChildren((n) => Math.max(0, n - 1))}
                disabled={children <= 0}
                aria-label="Decrease children"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center text-sm font-medium text-stone-900">
                {children} {children === 1 ? "child" : "children"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setChildren((n) => Math.min(10, n + 1))}
                disabled={children >= 10}
                aria-label="Increase children"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          className="w-full h-10 bg-[#CA8A04] hover:bg-amber-700 text-white"
        >
          Search available rooms
        </Button>
      </form>
    </div>
  );
}
