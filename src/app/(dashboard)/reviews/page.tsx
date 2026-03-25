import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { Star } from "lucide-react";

import type { ReviewSource } from "@/db/schema";
import ImportReviewsDialog from "./import-reviews-dialog";
import ReviewActions from "./review-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FilterBar,
  FilterBarActions,
  FilterBarField,
  FilterBarResetLink,
} from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { db } from "@/db";
import { properties, reviews } from "@/db/schema";
import { SOURCE_LABELS } from "@/lib/reviews";
import { REVIEW_STATUS_STYLES } from "@/lib/status-styles";

const VALID_STATUSES = ["pending", "published", "hidden"] as const;
type ReviewStatus = (typeof VALID_STATUSES)[number];

const VALID_SOURCES = [
  "direct",
  "booking_com",
  "google",
  "tripadvisor",
  "airbnb",
  "expedia",
] as const;

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="text-rating-star text-sm" aria-label={`${rating} stars`}>
      {"★".repeat(rating)}
      <span className="text-muted">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

interface Props {
  searchParams: Promise<{ status?: string; source?: string }>;
}

function buildUrl(params: { status?: string; source?: string }) {
  const url = new URLSearchParams();
  if (params.status) url.set("status", params.status);
  if (params.source) url.set("source", params.source);
  const query = url.toString();
  return query ? `/reviews?${query}` : "/reviews";
}

export default async function ReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const statusFilter = sp.status as ReviewStatus | undefined;
  const sourceFilter = sp.source as ReviewSource | undefined;
  const isValidStatus =
    statusFilter && VALID_STATUSES.includes(statusFilter as ReviewStatus);
  const isValidSource =
    sourceFilter && VALID_SOURCES.includes(sourceFilter as ReviewSource);

  const allReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.propertyId, property.id),
      isValidStatus ? eq(reviews.status, statusFilter as ReviewStatus) : undefined,
      isValidSource ? eq(reviews.source, sourceFilter as ReviewSource) : undefined,
    ),
    orderBy: [desc(reviews.createdAt)],
    with: {
      guest: true,
    },
  });

  const allReviewsForAverage =
    isValidStatus || isValidSource
      ? await db.query.reviews.findMany({
          where: eq(reviews.propertyId, property.id),
          columns: { rating: true },
        })
      : allReviews;

  const averageRating =
    allReviewsForAverage.length > 0
      ? allReviewsForAverage.reduce((sum, review) => sum + review.rating, 0) /
        allReviewsForAverage.length
      : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews"
        description={
          averageRating !== null
            ? (
              <>
                Average rating{" "}
                <span className="font-semibold text-foreground">
                  {averageRating.toFixed(1)}
                </span>{" "}
                <span className="text-rating-star">★</span> across{" "}
                {allReviewsForAverage.length} review
                {allReviewsForAverage.length === 1 ? "" : "s"}
              </>
            )
            : "No reviews available yet."
        }
        actions={<ImportReviewsDialog />}
      />

      <FilterBar
        title="Filters"
        description="Review status and source can be combined to narrow the feed."
        actions={
          isValidStatus || isValidSource ? (
            <FilterBarResetLink href="/reviews">Clear filters</FilterBarResetLink>
          ) : null
        }
      >
        <FilterBarField label="Status" className="w-full">
          <FilterBarActions>
            <Button
              asChild
              size="sm"
              variant={!isValidStatus ? "default" : "outline"}
            >
              <Link href={buildUrl({ source: sourceFilter })}>All</Link>
            </Button>
            {VALID_STATUSES.map((status) => (
              <Button
                asChild
                key={status}
                size="sm"
                variant={statusFilter === status ? "default" : "outline"}
              >
                <Link href={buildUrl({ status, source: sourceFilter })}>
                  {REVIEW_STATUS_STYLES[status].label}
                </Link>
              </Button>
            ))}
          </FilterBarActions>
        </FilterBarField>

        <FilterBarField label="Source" className="w-full">
          <FilterBarActions>
            <Button
              asChild
              size="sm"
              variant={!isValidSource ? "default" : "outline"}
            >
              <Link href={buildUrl({ status: statusFilter })}>All sources</Link>
            </Button>
            {VALID_SOURCES.map((source) => (
              <Button
                asChild
                key={source}
                size="sm"
                variant={sourceFilter === source ? "default" : "outline"}
              >
                <Link href={buildUrl({ status: statusFilter, source })}>
                  {SOURCE_LABELS[source]}
                </Link>
              </Button>
            ))}
          </FilterBarActions>
        </FilterBarField>
      </FilterBar>

      <section className="space-y-4">
        <SectionHeader
          title="Review Feed"
          description={`${allReviews.length} review${allReviews.length === 1 ? "" : "s"} in the current view.`}
        />

        {allReviews.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={Star}
                size="compact"
                title="No reviews"
                description="No reviews match the current filters yet. Clear the filters or import OTA feedback."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {allReviews.map((review) => {
              const guestName = review.guest
                ? `${review.guest.firstName} ${review.guest.lastName}`
                : review.reviewerName ?? "Unknown Guest";

              return (
                <Card key={review.id}>
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{guestName}</span>
                          <StatusBadge
                            status={review.status}
                            styleMap={REVIEW_STATUS_STYLES}
                            dot
                          />
                          {review.source !== "direct" && (
                            <Badge variant="outline">
                              {SOURCE_LABELS[review.source]}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <StarDisplay rating={review.rating} />
                          {review.sourceRatingRaw !== null &&
                            review.source !== "direct" && (
                              <span>({review.sourceRatingRaw} raw)</span>
                            )}
                          <span>·</span>
                          <span>
                            {formatDate(review.stayDateStart)} - {formatDate(review.stayDateEnd)}
                          </span>
                        </div>
                      </div>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(review.createdAt.toISOString().slice(0, 10))}
                      </span>
                    </div>

                    {review.title && (
                      <p className="text-sm font-semibold">{review.title}</p>
                    )}

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {review.body}
                    </p>

                    {review.propertyResponse && (
                      <div className="rounded-lg border bg-muted px-4 py-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Property response
                        </p>
                        <p className="text-sm text-foreground">
                          {review.propertyResponse}
                        </p>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <ReviewActions
                        reviewId={review.id}
                        currentStatus={review.status}
                        existingResponse={review.propertyResponse}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
