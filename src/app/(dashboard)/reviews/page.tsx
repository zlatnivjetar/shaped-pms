import { db } from "@/db";
import { properties, reviews } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import ReviewActions from "./review-actions";

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  published: "default",
  hidden: "secondary",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  published: "Published",
  hidden: "Hidden",
};

const VALID_STATUSES = ["pending", "published", "hidden"] as const;
type ReviewStatus = (typeof VALID_STATUSES)[number];

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
    <span className="text-amber-400 text-sm" aria-label={`${rating} stars`}>
      {"★".repeat(rating)}
      <span className="text-stone-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function ReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const [property] = await db.select().from(properties).limit(1);
  if (!property) {
    return <p className="text-muted-foreground">No property found.</p>;
  }

  const statusFilter = sp.status as ReviewStatus | undefined;
  const isValidStatus =
    statusFilter && VALID_STATUSES.includes(statusFilter as ReviewStatus);

  const allReviews = await db.query.reviews.findMany({
    where: and(
      eq(reviews.propertyId, property.id),
      isValidStatus ? eq(reviews.status, statusFilter as ReviewStatus) : undefined
    ),
    orderBy: [desc(reviews.createdAt)],
    with: {
      guest: true,
      reservation: true,
    },
  });

  // Compute average rating across ALL reviews (not filtered)
  const allReviewsForAvg = isValidStatus
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

  const tabs: { label: string; status?: string }[] = [
    { label: "All" },
    { label: "Pending", status: "pending" },
    { label: "Published", status: "published" },
    { label: "Hidden", status: "hidden" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          {avgRating !== null && (
            <p className="text-muted-foreground text-sm mt-1">
              Average rating:{" "}
              <span className="font-semibold text-stone-800">
                {avgRating.toFixed(1)}
              </span>{" "}
              <span className="text-amber-400">★</span> from{" "}
              {allReviewsForAvg.length} review
              {allReviewsForAvg.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-stone-200">
        {tabs.map((tab) => {
          const isActive =
            tab.status === statusFilter ||
            (!tab.status && !statusFilter);
          return (
            <Link
              key={tab.label}
              href={tab.status ? `/reviews?status=${tab.status}` : "/reviews"}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-stone-800 text-stone-800"
                  : "border-transparent text-muted-foreground hover:text-stone-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
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
              : "Unknown Guest";

            return (
              <div
                key={review.id}
                className="bg-white border border-stone-200 rounded-lg p-5 space-y-3"
              >
                {/* Review header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-stone-800">
                        {guestName}
                      </span>
                      <Badge variant={STATUS_VARIANTS[review.status]}>
                        {STATUS_LABELS[review.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <StarDisplay rating={review.rating} />
                      <span>·</span>
                      <span>
                        {formatDate(review.stayDateStart)} –{" "}
                        {formatDate(review.stayDateEnd)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-stone-400 whitespace-nowrap">
                    {formatDate(
                      review.createdAt.toISOString().slice(0, 10)
                    )}
                  </span>
                </div>

                {/* Review content */}
                {review.title && (
                  <p className="font-semibold text-stone-800 text-sm">
                    {review.title}
                  </p>
                )}
                <p className="text-sm text-stone-600">
                  {review.body.length > 300
                    ? review.body.slice(0, 300) + "…"
                    : review.body}
                </p>

                {/* Property response */}
                {review.propertyResponse && (
                  <div className="bg-stone-50 border border-stone-200 rounded-md px-4 py-3">
                    <p className="text-xs font-medium text-stone-500 mb-1">
                      Property response
                    </p>
                    <p className="text-sm text-stone-700">
                      {review.propertyResponse}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-1 border-t border-stone-100">
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
