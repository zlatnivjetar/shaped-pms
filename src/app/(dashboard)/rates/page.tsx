import { db } from "@/db";
import {
  properties,
  roomTypes,
  ratePlans,
  discounts,
  type RoomType,
  type RatePlan,
  type Discount,
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
import {
  CreateDiscountDialog,
  EditDiscountDialog,
  DeleteDiscountButton,
} from "./discount-dialogs";

export default async function RatesPage() {
  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const [allRoomTypes, plans, allDiscounts] = await Promise.all([
    db
      .select()
      .from(roomTypes)
      .where(eq(roomTypes.propertyId, property.id))
      .orderBy(asc(roomTypes.sortOrder)),
    db
      .select()
      .from(ratePlans)
      .where(eq(ratePlans.propertyId, property.id))
      .orderBy(asc(ratePlans.roomTypeId), asc(ratePlans.priority)),
    db
      .select()
      .from(discounts)
      .where(eq(discounts.propertyId, property.id))
      .orderBy(asc(discounts.status), asc(discounts.name)),
  ]);

  const plansByRoomType = new Map<string, RatePlan[]>();
  for (const plan of plans) {
    const existing = plansByRoomType.get(plan.roomTypeId) ?? [];
    existing.push(plan);
    plansByRoomType.set(plan.roomTypeId, existing);
  }

  const roomTypeById = new Map(allRoomTypes.map((rt) => [rt.id, rt]));

  return (
    <div className="space-y-8">
      {/* ─── Rate Plans ─── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rates</h1>
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

      {/* ─── Discounts ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Discounts</h2>
            <p className="text-muted-foreground text-sm">
              Percentage discounts applied on top of rate plans.
            </p>
          </div>
          <CreateDiscountDialog roomTypes={allRoomTypes} />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allDiscounts.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-6 text-sm"
                  >
                    No discounts configured.
                  </TableCell>
                </TableRow>
              ) : (
                allDiscounts.map((discount: Discount) => {
                  const rt = discount.roomTypeId
                    ? roomTypeById.get(discount.roomTypeId)
                    : null;
                  return (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">
                        {discount.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rt ? rt.name : "All room types"}
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        {discount.percentage}% off
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {discount.dateStart && discount.dateEnd
                          ? `${discount.dateStart} → ${discount.dateEnd}`
                          : discount.dateStart
                            ? `From ${discount.dateStart}`
                            : discount.dateEnd
                              ? `Until ${discount.dateEnd}`
                              : "Always active"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            discount.status === "active" ? "default" : "secondary"
                          }
                        >
                          {discount.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <EditDiscountDialog
                            discount={discount}
                            roomTypes={allRoomTypes}
                          />
                          <DeleteDiscountButton discount={discount} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
