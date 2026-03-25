import { db } from "@/db";
import { properties, reviews } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { REVIEW_STATUS_STYLES } from "@/lib/status-styles";
import ReviewActions from "./review-actions";
import ImportReviewsDialog from "./import-reviews-dialog";
import { SOURCE_LABELS } from "@/lib/reviews";
import type { ReviewSource } from "@/db/schema";

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
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-GB", {
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
      isValidSource ? eq(reviews.source, sourceFilter as ReviewSource) : undefined
    ),
    orderBy: [desc(reviews.createdAt)],
    with: {
      guest: true,
    },
  });

  // Compute average rating across ALL reviews (not filtered)
  const allReviewsForAvg =
    isValidStatus || isValidSource
      ? await db.query.reviews.findMany({
          where: eq(reviews.propertyId, property.id),
          columns: { rating: true },
        })
      : allReviews;

  const avgRating =
    allReviewsForAvg.length > 0
      ? allReviewsForAvg.reduce((sum, r) => sum + r.rating, 0) /
        allReviewsForAvg.length
      : null;

  const statusTabs: { label: string; status?: string }[] = [
    { label: "All" },
    { label: "Pending", status: "pending" },
    { label: "Published", status: "published" },
    { label: "Hidden", status: "hidden" },
  ];

  function buildUrl(params: { status?: string; source?: string }) {
    const parts: string[] = [];
    if (params.status) parts.push(`status=${params.status}`);
    if (params.source) parts.push(`source=${params.source}`);
    return parts.length ? `/reviews?${parts.join("&")}` : "/reviews";
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
          {avgRating !== null && (
            <p className="text-muted-foreground text-sm mt-1">
              Average rating:{" "}
              <span className="font-semibold text-foreground">
                {avgRating.toFixed(1)}
              </span>{" "}
              <span className="text-rating-star">★</span> from{" "}
              {allReviewsForAvg.length} review
              {allReviewsForAvg.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <ImportReviewsDialog />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-border">
        {statusTabs.map((tab) => {
          const isActive =
            tab.status === statusFilter ||
            (!tab.status && !statusFilter);
          return (
            <Link
              key={tab.label}
              href={buildUrl({ status: tab.status, source: sourceFilter })}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Source filter */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={buildUrl({ status: statusFilter })}
          className={`text-xs px-3 py-1 rounded-full border transition-colors ${
            !sourceFilter
              ? "bg-foreground text-background border-foreground"
              : "border-border text-muted-foreground hover:border-foreground"
          }`}
        >
          All sources
        </Link>
        {VALID_SOURCES.map((src) => (
          <Link
            key={src}
            href={buildUrl({ status: statusFilter, source: src })}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              sourceFilter === src
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            {SOURCE_LABELS[src]}
          </Link>
        ))}
      </div>

      {/* Reviews list */}
      {allReviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No reviews found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allReviews.map((review) => {
            const guest = review.guest;
            const guestName = guest
              ? `${guest.firstName} ${guest.lastName}`
              : review.reviewerName ?? "Unknown Guest";

            return (
              <div
                key={review.id}
                className="bg-card border border-border rounded-lg p-5 space-y-3"
              >
                {/* Review header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">
                        {guestName}
                      </span>
                      <StatusBadge status={review.status} styleMap={REVIEW_STATUS_STYLES} />
                      {review.source !== "direct" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-info/10 text-info border border-info/20">
                          {SOURCE_LABELS[review.source]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <StarDisplay rating={review.rating} />
                      {review.sourceRatingRaw !== null &&
                        review.source !== "direct" && (
                          <span className="text-xs text-muted-foreground">
                            ({review.sourceRatingRaw} raw)
                          </span>
                        )}
                      <span>·</span>
                      <span>
                        {formatDate(review.stayDateStart)} –{" "}
                        {formatDate(review.stayDateEnd)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(review.createdAt.toISOString().slice(0, 10))}
                  </span>
                </div>

                {/* Review content */}
                {review.title && (
                  <p className="font-semibold text-foreground text-sm">
                    {review.title}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  {review.body.length > 300
                    ? review.body.slice(0, 300) + "…"
                    : review.body}
                </p>

                {/* Property response */}
                {review.propertyResponse && (
                  <div className="bg-muted border border-border rounded-md px-4 py-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Property response
                    </p>
                    <p className="text-sm text-foreground">
                      {review.propertyResponse}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-1 border-t border-border">
                  <ReviewActions
                    reviewId={review.id}
                    currentStatus={review.status}
                    existingResponse={review.propertyResponse}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
