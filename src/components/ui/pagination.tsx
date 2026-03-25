import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PaginationItem = number | "ellipsis";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  totalItems?: number;
  pageSize?: number;
  itemLabel?: string;
  className?: string;
  summaryClassName?: string;
  controlsClassName?: string;
}

function buildPaginationItems(page: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const items: PaginationItem[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) {
    items.push("ellipsis");
  }

  for (let current = start; current <= end; current += 1) {
    items.push(current);
  }

  if (end < pageCount - 1) {
    items.push("ellipsis");
  }

  items.push(pageCount);

  return items;
}

function PaginationLink({
  href,
  children,
  isActive = false,
  size = "sm",
  disabled = false,
}: {
  href: string;
  children: ReactNode;
  isActive?: boolean;
  size?: "sm" | "icon-sm";
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <Button
        variant={isActive ? "default" : "outline"}
        size={size}
        className="shrink-0"
        disabled
        aria-current={isActive ? "page" : undefined}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      asChild
      variant={isActive ? "default" : "outline"}
      size={size}
      className="shrink-0"
      aria-current={isActive ? "page" : undefined}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
}

export function TablePagination({
  page,
  pageCount,
  hrefForPage,
  totalItems,
  pageSize,
  itemLabel = "items",
  className,
  summaryClassName,
  controlsClassName,
}: TablePaginationProps) {
  const safePageCount = Math.max(0, pageCount);
  const safePage = safePageCount === 0 ? 0 : Math.min(Math.max(1, page), safePageCount);
  const items = safePageCount > 0 ? buildPaginationItems(safePage, safePageCount) : [];
  const hasSummary =
    typeof totalItems === "number" &&
    typeof pageSize === "number" &&
    pageSize > 0;
  const startItem =
    hasSummary && totalItems > 0 && safePage > 0
      ? (safePage - 1) * pageSize + 1
      : 0;
  const endItem =
    hasSummary && totalItems > 0 && safePage > 0
      ? Math.min(totalItems, safePage * pageSize)
      : 0;

  return (
    <div
      data-slot="table-pagination"
      className={cn(
        "flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className={cn("text-sm text-muted-foreground", summaryClassName)}>
        {hasSummary ? (
          totalItems === 0 ? (
            `No ${itemLabel} found`
          ) : (
            <>
              Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
              <span className="font-medium text-foreground">{endItem}</span> of{" "}
              <span className="font-medium text-foreground">{totalItems}</span> {itemLabel}
            </>
          )
        ) : safePageCount > 0 ? (
          <>
            Page <span className="font-medium text-foreground">{safePage}</span> of{" "}
            <span className="font-medium text-foreground">{safePageCount}</span>
          </>
        ) : (
          `No ${itemLabel} found`
        )}
      </div>

      {safePageCount > 0 && (
        <div className={cn("flex items-center gap-1.5", controlsClassName)}>
          <PaginationLink
            href={hrefForPage(Math.max(1, safePage - 1))}
            size="icon-sm"
            disabled={safePage <= 1}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous page</span>
          </PaginationLink>

          {items.map((item, index) =>
            item === "ellipsis" ? (
              <div
                key={`ellipsis-${index}`}
                className="flex size-9 items-center justify-center text-muted-foreground"
                aria-hidden
              >
                <MoreHorizontal className="size-4" />
              </div>
            ) : (
              <PaginationLink
                key={item}
                href={hrefForPage(item)}
                isActive={item === safePage}
                size="sm"
              >
                {item}
              </PaginationLink>
            ),
          )}

          <PaginationLink
            href={hrefForPage(Math.min(safePageCount || 1, safePage + 1))}
            size="icon-sm"
            disabled={safePage >= safePageCount}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next page</span>
          </PaginationLink>
        </div>
      )}
    </div>
  );
}

export { buildPaginationItems };
