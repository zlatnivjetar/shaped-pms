import { CalendarDays } from "lucide-react";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { getCalendarAvailability } from "@/lib/availability";
import { AvailabilityCalendar } from "@/app/(dashboard)/rates/availability-calendar";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";

type SearchParams = Promise<{ month?: string }>;

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(month: string): { startDate: string; endDate: string } {
  const [year, monthNumber] = month.split("-").map(Number);
  const end = new Date(year, monthNumber, 0);
  const format = (valueYear: number, valueMonth: number, day: number) =>
    `${valueYear}-${String(valueMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    startDate: format(year, monthNumber, 1),
    endDate: format(end.getFullYear(), end.getMonth() + 1, end.getDate()),
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { month = currentMonthStr() } = await searchParams;

  const safeMonth = /^\d{4}-\d{2}$/.test(month) ? month : currentMonthStr();

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const { startDate, endDate } = monthBounds(safeMonth);
  const calendarData = await getCalendarAvailability(
    property.id,
    startDate,
    endDate,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Calendar"
        description="Availability and rate overrides for the selected month."
      />

      <section className="space-y-4">
        <SectionHeader
          title="Availability Grid"
          description="Use the monthly matrix to spot sell-out dates and override rates."
        />
        <ErrorBoundary
          size="compact"
          title="Calendar unavailable"
          description="The availability grid could not be rendered. Try again."
        >
          {calendarData.length === 0 ? (
            <div className="rounded-xl border bg-card shadow-sm">
              <EmptyState
                icon={CalendarDays}
                size="compact"
                title="No calendar data yet"
                description="Add room types and rooms first, then availability will populate automatically."
              />
            </div>
          ) : (
            <AvailabilityCalendar
              propertyId={property.id}
              month={safeMonth}
              data={calendarData}
            />
          )}
        </ErrorBoundary>
      </section>
    </div>
  );
}
