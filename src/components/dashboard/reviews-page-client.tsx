"use client";

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import ImportReviewsDialog from "@/app/(dashboard)/reviews/import-reviews-dialog";
import ReviewActions from "@/app/(dashboard)/reviews/review-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar, FilterBarActions, FilterBarField } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { TablePagination } from "@/components/ui/pagination";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { fetchDashboardReviews } from "@/lib/client-fetchers";
import type {
  DashboardReviewsData,
  DashboardReviewsParams,
  NormalizedDashboardReviewsParams,
} from "@/lib/dashboard-contracts";
import {
  normalizeReviewsParams,
  VALID_REVIEW_SOURCES,
  VALID_REVIEW_STATUSES,
} from "@/lib/dashboard-contracts";
import { dashboardQueryKeys } from "@/lib/query-keys";
import { DASHBOARD_QUERY_STALE_TIME } from "@/lib/react-query";
import { SOURCE_LABELS } from "@/lib/reviews";
import { REVIEW_STATUS_STYLES } from "@/lib/status-styles";

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

function parseReviewsParamsFromLocation(): NormalizedDashboardReviewsParams {
  const searchParams = new URLSearchParams(window.location.search);

  return normalizeReviewsParams({
    status: searchParams.get("status") ?? undefined,
    source: searchParams.get("source") ?? undefined,
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
  });
}

function buildReviewsUrl(params: NormalizedDashboardReviewsParams) {
  const searchParams = new URLSearchParams();

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.source) {
    searchParams.set("source", params.source);
  }

  if (params.page > 1) {
    searchParams.set("page", String(params.page));
  }

  const query = searchParams.toString();
  return query ? `/reviews?${query}` : "/reviews";
}

export function ReviewsPageClient({
  initialParams,
  initialData,
}: {
  initialParams: NormalizedDashboardReviewsParams;
  initialData: DashboardReviewsData;
}) {
  const queryClient = useQueryClient();
  const [params, setParams] = useState(initialParams);
  const { data = initialData, isFetching } = useQuery({
    queryKey: dashboardQueryKeys.reviews(params),
    queryFn: ({ signal }) => fetchDashboardReviews(params, signal),
    placeholderData: keepPreviousData,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });

  useEffect(() => {
    const handlePopState = () => setParams(parseReviewsParamsFromLocation());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!data.hasNextPage) {
      return;
    }

    const nextParams = normalizeReviewsParams({
      ...params,
      page: params.page + 1,
    });

    void queryClient.prefetchQuery({
      queryKey: dashboardQueryKeys.reviews(nextParams),
      queryFn: ({ signal }) => fetchDashboardReviews(nextParams, signal),
      staleTime: DASHBOARD_QUERY_STALE_TIME,
    });
  }, [data.hasNextPage, params, queryClient]);

  function updateParams(
    nextParams: DashboardReviewsParams,
    mode: "push" | "replace" = "push",
  ) {
    const normalized = normalizeReviewsParams(nextParams);
    setParams(normalized);
    window.history[mode === "replace" ? "replaceState" : "pushState"](
      {},
      "",
      buildReviewsUrl(normalized),
    );
  }

  const pageCount =
    data.totalCount > 0 ? Math.ceil(data.totalCount / data.pageSize) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reviews"
        description={
          data.averageRating !== null
            ? (
              <>
                Average rating{" "}
                <span className="font-semibold text-foreground">
                  {data.averageRating.toFixed(1)}
                </span>{" "}
                <span className="text-rating-star">★</span> across {data.overallCount} review
                {data.overallCount === 1 ? "" : "s"}
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
          params.status || params.source ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => updateParams({ page: 1 })}>
              Clear filters
            </Button>
          ) : null
        }
      >
        <FilterBarField label="Status" className="w-full">
          <FilterBarActions>
            <Button
              type="button"
              size="sm"
              variant={!params.status ? "default" : "outline"}
              onClick={() => updateParams({ ...params, status: undefined, page: 1 })}
            >
              All
            </Button>
            {VALID_REVIEW_STATUSES.map((status) => (
              <Button
                type="button"
                key={status}
                size="sm"
                variant={params.status === status ? "default" : "outline"}
                onClick={() => updateParams({ ...params, status, page: 1 })}
              >
                {REVIEW_STATUS_STYLES[status].label}
              </Button>
            ))}
          </FilterBarActions>
        </FilterBarField>

        <FilterBarField label="Source" className="w-full">
          <FilterBarActions>
            <Button
              type="button"
              size="sm"
              variant={!params.source ? "default" : "outline"}
              onClick={() => updateParams({ ...params, source: undefined, page: 1 })}
            >
              All sources
            </Button>
            {VALID_REVIEW_SOURCES.map((source) => (
              <Button
                type="button"
                key={source}
                size="sm"
                variant={params.source === source ? "default" : "outline"}
                onClick={() => updateParams({ ...params, source, page: 1 })}
              >
                {SOURCE_LABELS[source]}
              </Button>
            ))}
          </FilterBarActions>
        </FilterBarField>
      </FilterBar>

      <section className="space-y-4">
        <SectionHeader
          title="Review Feed"
          description={`${data.totalCount} review${data.totalCount === 1 ? "" : "s"} in the current view.`}
          action={
            isFetching ? (
              <span className="text-xs text-muted-foreground">Updating…</span>
            ) : null
          }
        />

        {data.rows.length === 0 ? (
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
          <>
            <div className="space-y-4">
              {data.rows.map((review) => {
                const guestName = review.guest
                  ? `${review.guest.firstName ?? ""} ${review.guest.lastName ?? ""}`.trim()
                  : review.reviewerName ?? "Unknown Guest";

                return (
                  <Card key={review.id}>
                    <CardContent className="space-y-4 pt-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{guestName || "Unknown Guest"}</span>
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
                              review.source !== "direct" && <span>({review.sourceRatingRaw} raw)</span>}
                            <span>·</span>
                            <span>
                              {formatDate(review.stayDateStart)} - {formatDate(review.stayDateEnd)}
                            </span>
                          </div>
                        </div>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {review.title && <p className="text-sm font-semibold">{review.title}</p>}

                      <p className="line-clamp-3 text-sm text-muted-foreground">
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
                          existingResponse={review.propertyResponse ?? undefined}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="overflow-hidden">
              <TablePagination
                page={data.page}
                pageCount={pageCount}
                totalItems={data.totalCount}
                pageSize={data.pageSize}
                itemLabel="reviews"
                onPageChange={(page) => updateParams({ ...params, page })}
              />
            </Card>
          </>
        )}
      </section>
    </div>
  );
}
