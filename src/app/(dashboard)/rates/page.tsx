import Link from "next/link";
import { db } from "@/db";
import {
  properties,
  roomTypes,
  ratePlans,
  type RoomType,
  type RatePlan,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { getCalendarAvailability } from "@/lib/availability";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreateRatePlanDialog,
  EditRatePlanDialog,
  DeleteRatePlanButton,
} from "./rate-plan-dialogs";
import { AvailabilityCalendar } from "./availability-calendar";

type SearchParams = Promise<{ tab?: string; month?: string }>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthBounds(month: string): { startDate: string; endDate: string } {
  const [y, m] = month.split("-").map(Number);
  const end = new Date(y, m, 0); // last day of month
  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return {
    startDate: fmt(y, m, 1),
    endDate: fmt(end.getFullYear(), end.getMonth() + 1, end.getDate()),
  };
}

function tabClass(active: boolean) {
  return active
    ? "border-b-2 border-primary px-4 py-2 text-sm font-medium text-foreground"
    : "border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab = "plans", month = currentMonthStr() } = await searchParams;
  const isPlans = tab !== "availability";

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const allRoomTypes = await db
    .select()
    .from(roomTypes)
    .where(eq(roomTypes.propertyId, property.id))
    .orderBy(asc(roomTypes.sortOrder));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
        <p className="text-muted-foreground">
          Manage seasonal rate plans and view live availability.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-0">
        <Link href="/rates?tab=plans" className={tabClass(isPlans)}>
          Rate Plans
        </Link>
        <Link
          href={`/rates?tab=availability&month=${month}`}
          className={tabClass(!isPlans)}
        >
          Availability Calendar
        </Link>
      </div>

      {isPlans ? (
        <RatePlansTab propertyId={property.id} allRoomTypes={allRoomTypes} />
      ) : (
        <AvailabilityTab
          propertyId={property.id}
          month={month}
          allRoomTypes={allRoomTypes}
        />
      )}
    </div>
  );
}

// ─── Rate Plans Tab ───────────────────────────────────────────────────────────

async function RatePlansTab({
  propertyId,
  allRoomTypes,
}: {
  propertyId: string;
  allRoomTypes: RoomType[];
}) {
  const plans: RatePlan[] = await db
    .select()
    .from(ratePlans)
    .where(eq(ratePlans.propertyId, propertyId))
    .orderBy(asc(ratePlans.roomTypeId), asc(ratePlans.priority));

  // Group plans by room type
  const plansByRoomType = new Map<string, RatePlan[]>();
  for (const plan of plans) {
    const existing = plansByRoomType.get(plan.roomTypeId) ?? [];
    existing.push(plan);
    plansByRoomType.set(plan.roomTypeId, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateRatePlanDialog roomTypes={allRoomTypes} />
      </div>

      {allRoomTypes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No room types found.</p>
      ) : (
        allRoomTypes.map((rt) => {
          const typePlans = plansByRoomType.get(rt.id) ?? [];
          return (
            <div key={rt.id} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h3 className="font-semibold">{rt.name}</h3>
                <span className="text-sm text-muted-foreground">
                  Base rate: €{(rt.baseRateCents / 100).toFixed(0)}/night
                </span>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typePlans.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center text-muted-foreground py-6 text-sm"
                        >
                          No rate plans. Base rate (€
                          {(rt.baseRateCents / 100).toFixed(0)}) applies all
                          year.
                        </TableCell>
                      </TableRow>
                    ) : (
                      typePlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {plan.name}
                          </TableCell>
                          <TableCell className="text-sm tabular-nums">
                            {plan.dateStart} → {plan.dateEnd}
                          </TableCell>
                          <TableCell>
                            €{(plan.rateCents / 100).toFixed(0)}/night
                          </TableCell>
                          <TableCell>{plan.priority}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                plan.status === "active"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {plan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <EditRatePlanDialog
                                ratePlan={plan}
                                roomTypes={allRoomTypes}
                              />
                              <DeleteRatePlanButton ratePlan={plan} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ─── Availability Tab ─────────────────────────────────────────────────────────

async function AvailabilityTab({
  propertyId,
  month,
  allRoomTypes: _allRoomTypes,
}: {
  propertyId: string;
  month: string;
  allRoomTypes: RoomType[];
}) {
  const monthRegex = /^\d{4}-\d{2}$/;
  const safeMonth = monthRegex.test(month) ? month : currentMonthStr();
  const { startDate, endDate } = monthBounds(safeMonth);

  const calendarData = await getCalendarAvailability(
    propertyId,
    startDate,
    endDate
  );

  return (
    <AvailabilityCalendar
      propertyId={propertyId}
      month={safeMonth}
      data={calendarData}
    />
  );
}
