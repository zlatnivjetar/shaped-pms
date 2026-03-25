import { asc, eq } from "drizzle-orm";
import { Percent, TrendingUp } from "lucide-react";

import {
  CreateDiscountDialog,
  DeleteDiscountButton,
  EditDiscountDialog,
} from "./discount-dialogs";
import {
  CreateRatePlanDialog,
  DeleteRatePlanButton,
  EditRatePlanDialog,
} from "./rate-plan-dialogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type DataTableColumn,
  DataTable,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import {
  discounts,
  properties,
  ratePlans,
  roomTypes,
  type Discount,
  type RatePlan,
  type RoomType,
} from "@/db/schema";
import { RATE_STATUS_STYLES } from "@/lib/status-styles";
import { formatCurrency, formatDateRange } from "@/lib/table-formatters";

function formatOptionalDateRange(start?: string | null, end?: string | null) {
  if (start && end) {
    return formatDateRange(start, end);
  }

  if (start) {
    return `From ${start}`;
  }

  if (end) {
    return `Until ${end}`;
  }

  return "Always active";
}

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

  const roomTypeById = new Map(allRoomTypes.map((roomType) => [roomType.id, roomType]));

  const ratePlanColumns: DataTableColumn<RatePlan>[] = [
    {
      id: "name",
      header: "Name",
      className: "font-medium",
      cell: (plan) => plan.name,
    },
    {
      id: "dates",
      header: "Dates",
      className: "tabular-nums whitespace-nowrap",
      cell: (plan) => formatOptionalDateRange(plan.dateStart, plan.dateEnd),
    },
    {
      id: "rate",
      header: "Rate",
      className: "tabular-nums",
      cell: (plan) => `${formatCurrency(plan.rateCents, property.currency)}/night`,
    },
    {
      id: "priority",
      header: "Priority",
      align: "right",
      className: "tabular-nums",
      cell: (plan) => plan.priority,
    },
    {
      id: "status",
      header: "Status",
      cell: (plan) => (
        <StatusBadge status={plan.status} styleMap={RATE_STATUS_STYLES} dot />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      className: "w-[96px]",
      cell: (plan) => (
        <div className="flex justify-end gap-1">
          <EditRatePlanDialog ratePlan={plan} roomTypes={allRoomTypes} />
          <DeleteRatePlanButton ratePlan={plan} />
        </div>
      ),
    },
  ];

  const discountColumns: DataTableColumn<Discount>[] = [
    {
      id: "name",
      header: "Name",
      className: "font-medium",
      cell: (discount) => discount.name,
    },
    {
      id: "room-type",
      header: "Room Type",
      cell: (discount) =>
        discount.roomTypeId
          ? roomTypeById.get(discount.roomTypeId)?.name ?? "Unknown"
          : "All room types",
    },
    {
      id: "discount",
      header: "Discount",
      className: "font-semibold text-success tabular-nums",
      cell: (discount) => `${discount.percentage}% off`,
    },
    {
      id: "dates",
      header: "Dates",
      className: "whitespace-nowrap",
      cell: (discount) =>
        formatOptionalDateRange(discount.dateStart, discount.dateEnd),
    },
    {
      id: "status",
      header: "Status",
      cell: (discount) => (
        <StatusBadge status={discount.status} styleMap={RATE_STATUS_STYLES} dot />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      className: "w-[96px]",
      cell: (discount) => (
        <div className="flex justify-end gap-1">
          <EditDiscountDialog discount={discount} roomTypes={allRoomTypes} />
          <DeleteDiscountButton discount={discount} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Rates"
        description="Manage seasonal pricing, promotional discounts, and priority rules."
      />

      <section className="space-y-4">
        <SectionHeader
          title="Rate Plans"
          description="Seasonal pricing that overrides the room type base rate."
          action={<CreateRatePlanDialog roomTypes={allRoomTypes} />}
        />

        {allRoomTypes.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={TrendingUp}
                size="compact"
                title="No room types found"
                description="Create a room type before adding seasonal overrides or discount rules."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allRoomTypes.map((roomType: RoomType) => {
              const roomTypePlans = plansByRoomType.get(roomType.id) ?? [];

              return (
                <Card key={roomType.id} className="gap-0 overflow-hidden">
                  <CardHeader className="border-b">
                    <div className="space-y-1">
                      <CardTitle>{roomType.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Base rate: {formatCurrency(roomType.baseRateCents, property.currency)}/night
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <DataTable
                      className="rounded-none border-0 shadow-none"
                      columns={ratePlanColumns}
                      data={roomTypePlans}
                      getRowKey={(plan) => plan.id}
                      emptyState={{
                        icon: TrendingUp,
                        title: "No rate plans",
                        description: "The base room rate applies until you add a seasonal override.",
                        action: <CreateRatePlanDialog roomTypes={allRoomTypes} />,
                      }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Discounts"
          description="Percentage discounts stacked on top of the active rate plan."
          action={<CreateDiscountDialog roomTypes={allRoomTypes} />}
        />
        <DataTable
          columns={discountColumns}
          data={allDiscounts}
          getRowKey={(discount) => discount.id}
          emptyState={{
            icon: Percent,
            title: "No discounts configured",
            description: "Create a discount to support promotions, packages, or seasonal offers.",
            action: <CreateDiscountDialog roomTypes={allRoomTypes} />,
          }}
        />
      </section>
    </div>
  );
}
