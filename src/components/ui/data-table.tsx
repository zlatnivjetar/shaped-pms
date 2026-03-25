import type {
  HTMLAttributes,
  Key,
  ReactNode,
  TableHTMLAttributes,
} from "react";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type TableAlign = "left" | "center" | "right";

export interface DataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  align?: TableAlign;
  className?: string;
  headerClassName?: string;
}

export interface DataTableEmptyState {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: readonly DataTableColumn<T>[];
  data: readonly T[];
  getRowKey: (row: T, index: number) => Key;
  caption?: ReactNode;
  emptyState?: DataTableEmptyState;
  footer?: ReactNode;
  className?: string;
  tableClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string | undefined);
  rowProps?: (
    row: T,
    index: number,
  ) => HTMLAttributes<HTMLTableRowElement> | undefined;
  tableProps?: TableHTMLAttributes<HTMLTableElement>;
  stickyHeader?: boolean;
}

const ALIGN_CLASSES: Record<TableAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  caption,
  emptyState,
  footer,
  className,
  tableClassName,
  rowClassName,
  rowProps,
  tableProps,
  stickyHeader = false,
}: DataTableProps<T>) {
  const hasRows = data.length > 0;
  const { className: tablePropsClassName, ...restTableProps } = tableProps ?? {};

  return (
    <div
      data-slot="data-table"
      className={cn(
        "overflow-hidden rounded-xl border bg-card shadow-sm",
        className,
      )}
    >
      <Table
        className={cn("min-w-full", tableClassName, tablePropsClassName)}
        {...restTableProps}
      >
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader
          className={cn(
            stickyHeader && "sticky top-0 z-10 bg-card",
          )}
        >
          <TableRow>
            {columns.map((column) => (
              <TableHead
                key={column.id}
                className={cn(
                  "h-11 px-4 text-sm font-medium text-muted-foreground",
                  ALIGN_CLASSES[column.align ?? "left"],
                  column.headerClassName,
                )}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {hasRows ? (
            data.map((row, index) => {
              const extraRowProps = rowProps?.(row, index) ?? {};
              const { className: extraRowClassName, ...restRowProps } = extraRowProps;
              const resolvedRowClassName =
                typeof rowClassName === "function"
                  ? rowClassName(row, index)
                  : rowClassName;

              return (
                <TableRow
                  key={getRowKey(row, index)}
                  {...restRowProps}
                  className={cn(resolvedRowClassName, extraRowClassName)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(
                        "px-4 py-3 align-middle text-sm",
                        ALIGN_CLASSES[column.align ?? "left"],
                        column.className,
                      )}
                    >
                      {column.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : emptyState ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className={cn("px-4 py-12", emptyState.className)}
              >
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-center">
                  <div className="text-sm font-medium">{emptyState.title}</div>
                  {emptyState.description && (
                    <div className="text-sm text-muted-foreground">
                      {emptyState.description}
                    </div>
                  )}
                  {emptyState.action}
                </div>
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      {footer && <div className="border-t px-4 py-3">{footer}</div>}
    </div>
  );
}
