import type { ReviewSource, Reservation, Review } from "@/db/schema";
import type { CalendarRoomTypeData } from "@/lib/availability";

export const DASHBOARD_PAGE_SIZE = 25;

export const VALID_RESERVATION_STATUSES = [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
] as const;

export const VALID_REVIEW_STATUSES = ["pending", "published", "hidden"] as const;

export const VALID_REVIEW_SOURCES = [
  "direct",
  "booking_com",
  "google",
  "tripadvisor",
  "airbnb",
  "expedia",
] as const;

export type DashboardReservationStatus =
  (typeof VALID_RESERVATION_STATUSES)[number];
export type DashboardReviewStatus = (typeof VALID_REVIEW_STATUSES)[number];
export type DashboardReviewSource = (typeof VALID_REVIEW_SOURCES)[number];

export interface DashboardReservationsParams {
  status?: DashboardReservationStatus | string;
  page?: number | string;
  pageSize?: number | string;
}
export interface NormalizedDashboardReservationsParams {
  status?: DashboardReservationStatus;
  page: number;
  pageSize: number;
}

export interface DashboardGuestsParams {
  query?: string;
  page?: number | string;
  pageSize?: number | string;
}
export interface NormalizedDashboardGuestsParams {
  query: string;
  page: number;
  pageSize: number;
}

export interface DashboardReviewsParams {
  status?: DashboardReviewStatus | string;
  source?: DashboardReviewSource | string;
  page?: number | string;
  pageSize?: number | string;
}
export interface NormalizedDashboardReviewsParams {
  status?: DashboardReviewStatus;
  source?: DashboardReviewSource;
  page: number;
  pageSize: number;
}

export interface DashboardCalendarParams {
  month?: string;
}

export interface DashboardRecentActivityRow {
  id: string;
  confirmationCode: string;
  checkIn: string;
  checkOut: string;
  status: Reservation["status"];
  totalCents: number;
  currency: string;
  guest: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
}

export interface DashboardSummaryData {
  property: {
    id: string;
    currency: string;
  };
  kpis: {
    arrivals: number;
    departures: number;
    inHouse: number;
    occupancy7Days: number;
    occupancy30Days: number;
  };
  revenue: {
    thisMonthCents: number;
    lastMonthCents: number;
  };
  recentActivity: DashboardRecentActivityRow[];
}

export interface DashboardReservationRow {
  id: string;
  confirmationCode: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  status: Reservation["status"];
  channel: Reservation["channel"];
  totalCents: number;
  currency: string;
  guest: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  };
  roomTypeName: string | null;
  paymentStatus: string | null;
}

export interface DashboardReservationsData {
  rows: DashboardReservationRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface DashboardGuestRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  country: string | null;
  totalStays: number;
  totalSpentCents: number;
}

export interface DashboardGuestsData {
  rows: DashboardGuestRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  query: string;
}

export interface DashboardReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  reviewerName: string | null;
  stayDateStart: string;
  stayDateEnd: string;
  status: Review["status"];
  source: ReviewSource;
  sourceRatingRaw: number | null;
  propertyResponse: string | null;
  createdAt: string;
  guest: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface DashboardReviewsData {
  rows: DashboardReviewRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  averageRating: number | null;
  overallCount: number;
}

export interface DashboardCalendarData {
  month: string;
  roomTypes: CalendarRoomTypeData[];
}

function normalizePage(value: number | string | undefined): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(value: number | string | undefined): number {
  const parsed =
    typeof value === "number"
      ? value
      : Number.parseInt(value ?? String(DASHBOARD_PAGE_SIZE), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DASHBOARD_PAGE_SIZE;
  }

  return Math.min(parsed, DASHBOARD_PAGE_SIZE);
}

export function normalizeReservationsParams(
  params: DashboardReservationsParams,
): NormalizedDashboardReservationsParams {
  const status = VALID_RESERVATION_STATUSES.includes(
    params.status as DashboardReservationStatus,
  )
    ? (params.status as DashboardReservationStatus)
    : undefined;

  return {
    status,
    page: normalizePage(params.page),
    pageSize: normalizePageSize(params.pageSize),
  };
}

export function normalizeGuestsParams(
  params: DashboardGuestsParams,
): NormalizedDashboardGuestsParams {
  return {
    query: params.query?.trim() ?? "",
    page: normalizePage(params.page),
    pageSize: normalizePageSize(params.pageSize),
  };
}

export function normalizeReviewsParams(
  params: DashboardReviewsParams,
): NormalizedDashboardReviewsParams {
  const status = VALID_REVIEW_STATUSES.includes(
    params.status as DashboardReviewStatus,
  )
    ? (params.status as DashboardReviewStatus)
    : undefined;
  const source = VALID_REVIEW_SOURCES.includes(
    params.source as DashboardReviewSource,
  )
    ? (params.source as DashboardReviewSource)
    : undefined;

  return {
    status,
    source,
    page: normalizePage(params.page),
    pageSize: normalizePageSize(params.pageSize),
  };
}

export function currentMonthStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function normalizeMonth(month?: string): string {
  return /^\d{4}-\d{2}$/.test(month ?? "") ? (month as string) : currentMonthStr();
}

export function monthBounds(month: string): {
  startDate: string;
  endDate: string;
} {
  const [year, monthNumber] = month.split("-").map(Number);
  const end = new Date(year, monthNumber, 0);
  const format = (valueYear: number, valueMonth: number, day: number) =>
    `${valueYear}-${String(valueMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return {
    startDate: format(year, monthNumber, 1),
    endDate: format(end.getFullYear(), end.getMonth() + 1, end.getDate()),
  };
}
