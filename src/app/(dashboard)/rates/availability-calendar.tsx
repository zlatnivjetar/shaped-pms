"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import type { CalendarRoomTypeData } from "@/lib/availability";
import { setRateOverride } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

function formatRate(cents: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getCellColor(available: number, totalUnits: number): string {
  if (totalUnits === 0) {
    return "bg-muted text-muted-foreground";
  }

  if (available === 0) {
    return "bg-destructive/10 text-destructive";
  }

  const pct = available / totalUnits;
  if (pct <= 0.3) {
    return "bg-warning/10 text-warning";
  }

  return "bg-success/10 text-success";
}

function prevMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const previous = new Date(year, monthNumber - 2, 1);
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const following = new Date(year, monthNumber, 1);
  return `${following.getFullYear()}-${String(following.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(year, monthNumber - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

type SelectedCell = {
  propertyId: string;
  roomTypeId: string;
  roomTypeName: string;
  date: string;
  currentRateCents: number;
};

function RateOverrideDialog({
  cell,
  onClose,
}: {
  cell: SelectedCell;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState((cell.currentRateCents / 100).toFixed(2));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const euros = Number.parseFloat(value);
    if (Number.isNaN(euros) || euros < 0) {
      return;
    }

    const cents = Math.round(euros * 100);
    startTransition(async () => {
      await setRateOverride(cell.propertyId, cell.roomTypeId, cell.date, cents);
      onClose();
    });
  }

  function handleClear() {
    startTransition(async () => {
      await setRateOverride(cell.propertyId, cell.roomTypeId, cell.date, null);
      onClose();
    });
  }

  const dateLabel = new Date(`${cell.date}T00:00:00Z`).toLocaleDateString(
    "en-US",
    { weekday: "short", year: "numeric", month: "short", day: "numeric" },
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Rate Override</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 px-4 py-3 text-sm">
            <p className="font-medium">{cell.roomTypeName}</p>
            <p className="text-muted-foreground">{dateLabel}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Override Rate (EUR)"
              htmlFor="override-rate"
              description="This overrides rate plans and the base rate for this specific date."
            >
              <Input
                id="override-rate"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoFocus
              />
            </FormField>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={isPending}
              >
                <X className="mr-1 h-3 w-3" />
                Clear Override
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending ? "Saving..." : "Set Rate"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type Props = {
  propertyId: string;
  month: string;
  data: CalendarRoomTypeData[];
};

export function AvailabilityCalendar({ propertyId, month, data }: Props) {
  const router = useRouter();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${month}-${day}`;
  });

  const dayLabels = days.map((dateValue) => {
    const date = new Date(`${dateValue}T00:00:00Z`);
    return {
      date: dateValue,
      day: date.getUTCDate(),
      weekday: date.toLocaleString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),
    };
  });

  function goTo(newMonth: string) {
    router.push(`/calendar?month=${newMonth}`);
  }

  const cellMap = new Map(
    data.map((roomType) => [
      roomType.roomTypeId,
      new Map(roomType.dates.map((entry) => [entry.date, entry])),
    ]),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => goTo(prevMonth(month))}
          className="justify-start sm:w-auto"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          {formatMonthLabel(prevMonth(month))}
        </Button>
        <h2 className="text-lg font-semibold">{formatMonthLabel(month)}</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => goTo(nextMonth(month))}
          className="justify-end sm:w-auto"
        >
          {formatMonthLabel(nextMonth(month))}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-success/20 bg-success/10" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-warning/20 bg-warning/10" />
          Low availability ({"<="}30%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded border border-destructive/20 bg-destructive/10" />
          Full
        </span>
        <span className="text-xs sm:ml-auto">
          Click any cell to set a rate override.
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 min-w-[150px] bg-muted/50 px-3 py-2 text-left font-medium">
                Room Type
              </th>
              {dayLabels.map(({ date, day, weekday }) => (
                <th
                  key={date}
                  className="min-w-[56px] px-1 py-2 text-center font-medium"
                >
                  <div className="text-[10px] text-muted-foreground">
                    {weekday}
                  </div>
                  <div>{day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((roomType) => (
              <tr key={roomType.roomTypeId} className="border-b last:border-0">
                <td className="sticky left-0 z-10 border-r bg-background px-3 py-2 font-medium">
                  <div>{roomType.roomTypeName}</div>
                  <div className="text-[10px] font-normal text-muted-foreground">
                    Base: {formatRate(roomType.baseRateCents)}/night
                  </div>
                </td>
                {days.map((date) => {
                  const cell = cellMap.get(roomType.roomTypeId)?.get(date);
                  const available = cell?.available ?? 0;
                  const totalUnits = cell?.totalUnits ?? 0;
                  const rateCents = cell?.rateCents ?? roomType.baseRateCents;
                  const colorClass = getCellColor(available, totalUnits);

                  return (
                    <td key={date} className="p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCell({
                            propertyId,
                            roomTypeId: roomType.roomTypeId,
                            roomTypeName: roomType.roomTypeName,
                            date,
                            currentRateCents: rateCents,
                          })
                        }
                        aria-label={`${roomType.roomTypeName}, ${date}: ${available} of ${totalUnits} available, ${formatRate(rateCents)} per night`}
                        className={`w-full rounded px-1 py-1.5 text-center transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-default)] motion-reduce:transition-none hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${colorClass}`}
                      >
                        {totalUnits === 0 ? (
                          <span className="text-[10px]">-</span>
                        ) : (
                          <>
                            <div className="font-semibold leading-none">
                              {available}
                            </div>
                            <div className="mt-0.5 text-[10px] leading-none opacity-80">
                              {formatRate(rateCents)}
                            </div>
                          </>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCell && (
        <RateOverrideDialog
          cell={selectedCell}
          onClose={() => {
            setSelectedCell(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
