import { db } from "@/db";
import {
  properties,
  roomTypes,
  ratePlans,
  type RoomType,
  type RatePlan,
} from "@/db/schema";
import { asc, eq } from "drizzle-orm";
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

export default async function RatesPage() {
  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const allRoomTypes = await db
    .select()
    .from(roomTypes)
    .where(eq(roomTypes.propertyId, property.id))
    .orderBy(asc(roomTypes.sortOrder));

  const plans: RatePlan[] = await db
    .select()
    .from(ratePlans)
    .where(eq(ratePlans.propertyId, property.id))
    .orderBy(asc(ratePlans.roomTypeId), asc(ratePlans.priority));

  const plansByRoomType = new Map<string, RatePlan[]>();
  for (const plan of plans) {
    const existing = plansByRoomType.get(plan.roomTypeId) ?? [];
    existing.push(plan);
    plansByRoomType.set(plan.roomTypeId, existing);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rates</h1>
          <p className="text-muted-foreground">Manage seasonal rate plans.</p>
        </div>
        <CreateRatePlanDialog roomTypes={allRoomTypes} />
      </div>

      {allRoomTypes.length === 0 ? (
        <p className="text-muted-foreground text-sm">No room types found.</p>
      ) : (
        allRoomTypes.map((rt: RoomType) => {
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
