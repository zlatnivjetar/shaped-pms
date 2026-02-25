import { db } from "@/db";
import { properties } from "@/db/schema";
import { getCalendarAvailability } from "@/lib/availability";
import { AvailabilityCalendar } from "@/app/(dashboard)/rates/availability-calendar";

type SearchParams = Promise<{ month?: string }>;

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(month: string): { startDate: string; endDate: string } {
  const [y, m] = month.split("-").map(Number);
  const end = new Date(y, m, 0);
  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return {
    startDate: fmt(y, m, 1),
    endDate: fmt(end.getFullYear(), end.getMonth() + 1, end.getDate()),
  };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { month = currentMonthStr() } = await searchParams;

  const monthRegex = /^\d{4}-\d{2}$/;
  const safeMonth = monthRegex.test(month) ? month : currentMonthStr();

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const { startDate, endDate } = monthBounds(safeMonth);
  const calendarData = await getCalendarAvailability(
    property.id,
    startDate,
    endDate
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Availability and rates at a glance.
        </p>
      </div>
      <AvailabilityCalendar
        propertyId={property.id}
        month={safeMonth}
        data={calendarData}
      />
    </div>
  );
}
