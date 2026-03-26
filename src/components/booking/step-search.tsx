"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { InlineError } from "@/components/ui/inline-error";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  bookingCardClassName,
  bookingCtaButtonClassName,
  bookingSecondaryButtonClassName,
} from "./styles";

interface Props {
  checkInTime?: string;
  checkOutTime?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults: number;
  initialChildren: number;
  onWarmSearch: (params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }) => void;
  onSearch: (params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }) => void;
}

const todayStr = new Date().toISOString().slice(0, 10);
const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfterStr = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

function toDate(dateString: string): Date {
  return new Date(`${dateString}T00:00:00`);
}

function toStr(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function formatDisplay(dateString: string): string {
  if (!dateString) {
    return "Select date";
  }

  return toDate(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function StepSearch({
  checkInTime,
  checkOutTime,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
  onWarmSearch,
  onSearch,
}: Props) {
  const [checkIn, setCheckIn] = useState(initialCheckIn ?? tomorrowStr);
  const [checkOut, setCheckOut] = useState(initialCheckOut ?? dayAfterStr);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [error, setError] = useState("");
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);

  const today = toDate(todayStr);
  const minCheckOut = (() => {
    const date = toDate(checkIn);
    date.setDate(date.getDate() + 1);
    return date;
  })();

  useEffect(() => {
    if (!checkIn || !checkOut || checkIn >= checkOut || checkIn < todayStr) {
      return;
    }

    const timeout = window.setTimeout(
      () =>
        onWarmSearch({
          checkIn,
          checkOut,
          adults,
          children,
        }),
      300,
    );

    return () => window.clearTimeout(timeout);
  }, [adults, checkIn, checkOut, children, onWarmSearch]);

  function handleCheckInSelect(date: Date | undefined) {
    if (!date) {
      return;
    }

    const value = toStr(date);
    setCheckIn(value);

    if (value >= checkOut) {
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOut(toStr(nextDay));
    }

    setCheckInOpen(false);
  }

  function handleCheckOutSelect(date: Date | undefined) {
    if (!date) {
      return;
    }

    setCheckOut(toStr(date));
    setCheckOutOpen(false);
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
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

    onSearch({
      checkIn,
      checkOut,
      adults,
      children,
    });
  }

  return (
    <div className={`${bookingCardClassName} p-6`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Find your stay</h2>
        {(checkInTime || checkOutTime) && (
          <p className="mt-1 text-sm text-muted-foreground">
            {checkInTime && `Check-in from ${checkInTime}`}
            {checkInTime && checkOutTime && " · "}
            {checkOutTime && `Check-out by ${checkOutTime}`}
          </p>
        )}
      </div>

      <form onSubmit={handleSearch} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Check-in</Label>
            <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start bg-booking-card text-left font-normal text-foreground hover:bg-muted focus-visible:border-booking-accent focus-visible:ring-booking-accent/25"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-booking-muted" />
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
                  className="w-full justify-start bg-booking-card text-left font-normal text-foreground hover:bg-muted focus-visible:border-booking-accent focus-visible:ring-booking-accent/25"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-booking-muted" />
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Adults</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAdults((count) => Math.max(1, count - 1))}
                disabled={adults <= 1}
                aria-label="Decrease adults"
                className={`min-h-[44px] min-w-[44px] ${bookingSecondaryButtonClassName}`}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center text-sm font-medium text-foreground">
                {adults} {adults === 1 ? "adult" : "adults"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAdults((count) => Math.min(10, count + 1))}
                disabled={adults >= 10}
                aria-label="Increase adults"
                className={`min-h-[44px] min-w-[44px] ${bookingSecondaryButtonClassName}`}
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
                onClick={() => setChildren((count) => Math.max(0, count - 1))}
                disabled={children <= 0}
                aria-label="Decrease children"
                className={`min-h-[44px] min-w-[44px] ${bookingSecondaryButtonClassName}`}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="flex-1 text-center text-sm font-medium text-foreground">
                {children} {children === 1 ? "child" : "children"}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setChildren((count) => Math.min(10, count + 1))}
                disabled={children >= 10}
                aria-label="Increase children"
                className={`min-h-[44px] min-w-[44px] ${bookingSecondaryButtonClassName}`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {error && <InlineError>{error}</InlineError>}

        <Button type="submit" className={`h-10 w-full ${bookingCtaButtonClassName}`}>
          Search available rooms
        </Button>
      </form>
    </div>
  );
}
