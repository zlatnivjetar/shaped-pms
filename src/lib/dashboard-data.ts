import {
  and,
  count,
  desc,
  eq,
  inArray,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  guests,
  payments,
  reservationRooms,
  reservations,
  reviews,
  roomTypes,
} from "@/db/schema";
import type {
  DashboardCalendarData,
  DashboardGuestsData,
  DashboardGuestsParams,
  DashboardReservationRow,
  DashboardReservationsData,
  DashboardReservationsParams,
  DashboardReviewRow,
  DashboardReviewsData,
  DashboardReviewsParams,
  DashboardSummaryData,
} from "@/lib/dashboard-contracts";
import {
  monthBounds,
  normalizeGuestsParams,
  normalizeMonth,
  normalizeReservationsParams,
  normalizeReviewsParams,
} from "@/lib/dashboard-contracts";
import { getDashboardKPIs, getRevenueMetrics } from "@/lib/dashboard";
import { getCalendarAvailability } from "@/lib/availability";

function buildGuestSearchPredicate(query: string) {
  if (!query) {
    return undefined;
  }

  const pattern = `%${query.toLowerCase()}%`;

  return sql`
    lower(
      concat_ws(
        ' ',
        ${guests.firstName},
        ${guests.lastName},
        ${guests.email},
        coalesce(${guests.phone}, ''),
        coalesce(${guests.country}, '')
      )
    ) like ${pattern}
  `;
}

export async function getDashboardSummaryData(
  propertyId: string,
  currency: string,
): Promise<DashboardSummaryData> {
  const [kpis, revenue, recentActivityRows] = await Promise.all([
    getDashboardKPIs(propertyId),
    getRevenueMetrics(propertyId),
    db
      .select({
        id: reservations.id,
        confirmationCode: reservations.confirmationCode,
        checkIn: reservations.checkIn,
        checkOut: reservations.checkOut,
        status: reservations.status,
        totalCents: reservations.totalCents,
        currency: reservations.currency,
        guestFirstName: guests.firstName,
        guestLastName: guests.lastName,
        guestEmail: guests.email,
      })
      .from(reservations)
      .leftJoin(guests, eq(reservations.guestId, guests.id))
      .where(eq(reservations.propertyId, propertyId))
      .orderBy(desc(reservations.updatedAt))
      .limit(10),
  ]);

  return {
    property: {
      id: propertyId,
      currency,
    },
    kpis,
    revenue,
    recentActivity: recentActivityRows.map((row) => ({
      id: row.id,
      confirmationCode: row.confirmationCode,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      status: row.status,
      totalCents: row.totalCents,
      currency: row.currency,
      guest: {
        firstName: row.guestFirstName,
        lastName: row.guestLastName,
        email: row.guestEmail,
      },
    })),
  };
}

export async function getDashboardReservationsData(
  propertyId: string,
  params: DashboardReservationsParams,
): Promise<DashboardReservationsData> {
  const normalized = normalizeReservationsParams(params);
  const offset = (normalized.page - 1) * normalized.pageSize;
  const whereClause = and(
    eq(reservations.propertyId, propertyId),
    normalized.status
      ? eq(reservations.status, normalized.status)
      : undefined,
  );

  const [rows, totalCountResult] = await Promise.all([
    db
      .select({
        id: reservations.id,
        confirmationCode: reservations.confirmationCode,
        checkIn: reservations.checkIn,
        checkOut: reservations.checkOut,
        nights: reservations.nights,
        status: reservations.status,
        channel: reservations.channel,
        totalCents: reservations.totalCents,
        currency: reservations.currency,
        guestFirstName: guests.firstName,
        guestLastName: guests.lastName,
        guestEmail: guests.email,
      })
      .from(reservations)
      .leftJoin(guests, eq(reservations.guestId, guests.id))
      .where(whereClause)
      .orderBy(desc(reservations.createdAt))
      .limit(normalized.pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(reservations)
      .where(whereClause),
  ]);

  const reservationIds = rows.map((row) => row.id);
  const [roomTypeRows, paymentRows] = reservationIds.length
    ? await Promise.all([
        db
          .select({
            reservationId: reservationRooms.reservationId,
            roomTypeName: roomTypes.name,
          })
          .from(reservationRooms)
          .leftJoin(roomTypes, eq(reservationRooms.roomTypeId, roomTypes.id))
          .where(inArray(reservationRooms.reservationId, reservationIds)),
        db
          .select({
            reservationId: payments.reservationId,
            status: payments.status,
          })
          .from(payments)
          .where(inArray(payments.reservationId, reservationIds))
          .orderBy(desc(payments.createdAt)),
      ])
    : [[], []];

  const roomTypeByReservationId = new Map<string, string | null>();
  for (const row of roomTypeRows) {
    if (!roomTypeByReservationId.has(row.reservationId)) {
      roomTypeByReservationId.set(row.reservationId, row.roomTypeName ?? null);
    }
  }

  const paymentStatusByReservationId = new Map<string, string | null>();
  for (const row of paymentRows) {
    if (!paymentStatusByReservationId.has(row.reservationId)) {
      paymentStatusByReservationId.set(row.reservationId, row.status);
    }
  }

  const mappedRows: DashboardReservationRow[] = rows.map((row) => ({
    id: row.id,
    confirmationCode: row.confirmationCode,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    nights: row.nights,
    status: row.status,
    channel: row.channel,
    totalCents: row.totalCents,
    currency: row.currency,
    guest: {
      firstName: row.guestFirstName,
      lastName: row.guestLastName,
      email: row.guestEmail,
    },
    roomTypeName: roomTypeByReservationId.get(row.id) ?? null,
    paymentStatus: paymentStatusByReservationId.get(row.id) ?? null,
  }));

  const totalCount = Number(totalCountResult[0]?.value ?? 0);

  return {
    rows: mappedRows,
    totalCount,
    page: normalized.page,
    pageSize: normalized.pageSize,
    hasNextPage: offset + mappedRows.length < totalCount,
  };
}

export async function getDashboardGuestsData(
  propertyId: string,
  params: DashboardGuestsParams,
): Promise<DashboardGuestsData> {
  const normalized = normalizeGuestsParams(params);
  const offset = (normalized.page - 1) * normalized.pageSize;
  const searchPredicate = buildGuestSearchPredicate(normalized.query);
  const whereClause = and(eq(guests.propertyId, propertyId), searchPredicate);

  const [rows, totalCountResult] = await Promise.all([
    db
      .select({
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
        email: guests.email,
        phone: guests.phone,
        country: guests.country,
        totalStays: guests.totalStays,
        totalSpentCents: guests.totalSpentCents,
      })
      .from(guests)
      .where(whereClause)
      .orderBy(desc(guests.createdAt))
      .limit(normalized.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(guests).where(whereClause),
  ]);

  const totalCount = Number(totalCountResult[0]?.value ?? 0);

  return {
    rows,
    totalCount,
    page: normalized.page,
    pageSize: normalized.pageSize,
    hasNextPage: offset + rows.length < totalCount,
    query: normalized.query,
  };
}

export async function getDashboardReviewsData(
  propertyId: string,
  params: DashboardReviewsParams,
): Promise<DashboardReviewsData> {
  const normalized = normalizeReviewsParams(params);
  const offset = (normalized.page - 1) * normalized.pageSize;
  const filteredWhereClause = and(
    eq(reviews.propertyId, propertyId),
    normalized.status ? eq(reviews.status, normalized.status) : undefined,
    normalized.source ? eq(reviews.source, normalized.source) : undefined,
  );

  const [rows, totalCountResult, overviewResult] = await Promise.all([
    db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        reviewerName: reviews.reviewerName,
        stayDateStart: reviews.stayDateStart,
        stayDateEnd: reviews.stayDateEnd,
        status: reviews.status,
        source: reviews.source,
        sourceRatingRaw: reviews.sourceRatingRaw,
        propertyResponse: reviews.propertyResponse,
        createdAt: reviews.createdAt,
        guestFirstName: guests.firstName,
        guestLastName: guests.lastName,
      })
      .from(reviews)
      .leftJoin(guests, eq(reviews.guestId, guests.id))
      .where(filteredWhereClause)
      .orderBy(desc(reviews.createdAt))
      .limit(normalized.pageSize)
      .offset(offset),
    db.select({ value: count() }).from(reviews).where(filteredWhereClause),
    db
      .select({
        averageRating: sql<string | null>`avg(${reviews.rating})`,
        overallCount: count(),
      })
      .from(reviews)
      .where(eq(reviews.propertyId, propertyId)),
  ]);

  const totalCount = Number(totalCountResult[0]?.value ?? 0);
  const overview = overviewResult[0];

  const mappedRows: DashboardReviewRow[] = rows.map((row) => ({
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    reviewerName: row.reviewerName,
    stayDateStart: row.stayDateStart,
    stayDateEnd: row.stayDateEnd,
    status: row.status,
    source: row.source,
    sourceRatingRaw: row.sourceRatingRaw,
    propertyResponse: row.propertyResponse,
    createdAt: row.createdAt.toISOString(),
    guest:
      row.guestFirstName || row.guestLastName
        ? {
            firstName: row.guestFirstName,
            lastName: row.guestLastName,
          }
        : null,
  }));

  return {
    rows: mappedRows,
    totalCount,
    page: normalized.page,
    pageSize: normalized.pageSize,
    hasNextPage: offset + mappedRows.length < totalCount,
    averageRating: overview?.averageRating
      ? Number(overview.averageRating)
      : null,
    overallCount: Number(overview?.overallCount ?? 0),
  };
}

export async function getDashboardCalendarData(
  propertyId: string,
  month?: string,
): Promise<DashboardCalendarData> {
  const safeMonth = normalizeMonth(month);
  const { startDate, endDate } = monthBounds(safeMonth);
  const roomTypesData = await getCalendarAvailability(propertyId, startDate, endDate);

  return {
    month: safeMonth,
    roomTypes: roomTypesData,
  };
}
