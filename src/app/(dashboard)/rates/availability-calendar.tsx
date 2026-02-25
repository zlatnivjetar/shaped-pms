"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { CalendarRoomTypeData, CalendarDayData } from "@/lib/availability";
import { setRateOverride } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRate(cents: number): string {
  return `€${(cents / 100).toFixed(0)}`;
}

function getCellColor(available: number, totalUnits: number): string {
  if (totalUnits === 0) return "bg-muted text-muted-foreground";
  if (available === 0) return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
  const pct = available / totalUnits;
  if (pct <= 0.3) return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
  return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300";
}

function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ─── Override Dialog ──────────────────────────────────────────────────────────

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
  const [value, setValue] = useState(
    (cell.currentRateCents / 100).toFixed(2)
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const euros = parseFloat(value);
    if (isNaN(euros) || euros < 0) return;
    const cents = Math.round(euros * 100);
    startTransition(async () => {
      await setRateOverride(
        cell.propertyId,
        cell.roomTypeId,
        cell.date,
        cents
      );
      onClose();
    });
  }

  function handleClear() {
    startTransition(async () => {
      await setRateOverride(cell.propertyId, cell.roomTypeId, cell.date, null);
      onClose();
    });
  }

  const dateLabel = new Date(cell.date + "T00:00:00Z").toLocaleDateString(
    "en-US",
    { weekday: "short", year: "numeric", month: "short", day: "numeric" }
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Set Rate Override</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">{cell.roomTypeName}</p>
            <p className="text-muted-foreground">{dateLabel}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="override-rate">Override Rate (€)</Label>
              <Input
                id="override-rate"
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                This overrides rate plans and base rate for this specific date.
              </p>
            </div>
            <div className="flex gap-2 justify-between">
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

// ─── Main Calendar ────────────────────────────────────────────────────────────

type Props = {
  propertyId: string;
  month: string; // YYYY-MM
  data: CalendarRoomTypeData[];
};

export function AvailabilityCalendar({ propertyId, month, data }: Props) {
  const router = useRouter();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  // Build list of days in this month
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, "0");
    return `${month}-${day}`;
  });

  // Day-of-week labels for header
  const dayLabels = days.map((d) => {
    const date = new Date(d + "T00:00:00Z");
    return {
      date: d,
      day: date.getUTCDate(),
      weekday: date.toLocaleString("en-US", { weekday: "short", timeZone: "UTC" }),
    };
  });

  function goTo(newMonth: string) {
    router.push(`/calendar?month=${newMonth}`);
  }

  // Build lookup: roomTypeId → date → cell data
  const cellMap = new Map(
    data.map((rt) => [
      rt.roomTypeId,
      new Map(rt.dates.map((d) => [d.date, d])),
    ])
  );

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(prevMonth(month))}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {formatMonthLabel(prevMonth(month))}
        </Button>
        <h2 className="text-lg font-semibold">{formatMonthLabel(month)}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(nextMonth(month))}
        >
          {formatMonthLabel(nextMonth(month))}
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-200" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-amber-100 border border-amber-200" />
          Low availability (≤30%)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-200" />
          Full
        </span>
        <span className="ml-auto text-xs">Click any cell to set a rate override.</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium min-w-[150px]">
                Room Type
              </th>
              {dayLabels.map(({ date, day, weekday }) => (
                <th
                  key={date}
                  className="px-1 py-2 text-center font-medium min-w-[56px]"
                >
                  <div className="text-[10px] text-muted-foreground">{weekday}</div>
                  <div>{day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((rt) => (
              <tr key={rt.roomTypeId} className="border-b last:border-0">
                <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium border-r">
                  <div>{rt.roomTypeName}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    Base: €{(rt.baseRateCents / 100).toFixed(0)}/night
                  </div>
                </td>
                {days.map((date) => {
                  const cell = cellMap.get(rt.roomTypeId)?.get(date);
                  const available = cell?.available ?? 0;
                  const totalUnits = cell?.totalUnits ?? 0;
                  const rateCents = cell?.rateCents ?? rt.baseRateCents;
                  const colorClass = getCellColor(available, totalUnits);

                  return (
                    <td key={date} className="p-0.5">
                      <button
                        onClick={() =>
                          setSelectedCell({
                            propertyId,
                            roomTypeId: rt.roomTypeId,
                            roomTypeName: rt.roomTypeName,
                            date,
                            currentRateCents: rateCents,
                          })
                        }
                        className={`w-full rounded px-1 py-1.5 text-center transition-opacity hover:opacity-80 ${colorClass}`}
                        title={`${rt.roomTypeName} — ${date}: ${available} available, ${formatRate(rateCents)}/night`}
                      >
                        {totalUnits === 0 ? (
                          <span className="text-[10px]">—</span>
                        ) : (
                          <>
                            <div className="font-semibold leading-none">
                              {available}
                            </div>
                            <div className="text-[10px] leading-none opacity-80 mt-0.5">
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

      {/* Override dialog */}
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
