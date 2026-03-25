type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

interface StatusStyle {
  variant: BadgeVariant;
  label: string;
  dot: string;
}

export const RESERVATION_STATUS_STYLES: Record<string, StatusStyle> = {
  pending:     { variant: "warning",     label: "Pending",      dot: "warning" },
  confirmed:   { variant: "success",     label: "Confirmed",    dot: "success" },
  checked_in:  { variant: "info",        label: "Checked In",   dot: "info" },
  checked_out: { variant: "secondary",   label: "Checked Out",  dot: "muted" },
  cancelled:   { variant: "destructive", label: "Cancelled",    dot: "destructive" },
  no_show:     { variant: "destructive", label: "No Show",      dot: "destructive" },
} as const;

export const PAYMENT_STATUS_STYLES: Record<string, StatusStyle> = {
  pending:          { variant: "warning",     label: "Pending",     dot: "warning" },
  requires_capture: { variant: "info",        label: "Auth held",   dot: "info" },
  captured:         { variant: "success",     label: "Paid",        dot: "success" },
  failed:           { variant: "destructive", label: "Failed",      dot: "destructive" },
  refunded:         { variant: "secondary",   label: "Refunded",    dot: "muted" },
} as const;

export const REVIEW_STATUS_STYLES: Record<string, StatusStyle> = {
  pending:   { variant: "warning",   label: "Pending",   dot: "warning" },
  published: { variant: "success",   label: "Published", dot: "success" },
  hidden:    { variant: "secondary", label: "Hidden",    dot: "muted" },
} as const;

export const RATE_STATUS_STYLES: Record<string, StatusStyle> = {
  active:   { variant: "success",   label: "Active",    dot: "success" },
  inactive: { variant: "secondary", label: "Inactive",  dot: "muted" },
} as const;

export const ROOM_STATUS_STYLES: Record<string, StatusStyle> = {
  available:   { variant: "success",     label: "Available",   dot: "success" },
  occupied:    { variant: "info",        label: "Occupied",    dot: "info" },
  maintenance: { variant: "warning",     label: "Maintenance", dot: "warning" },
  inactive:    { variant: "secondary",   label: "Inactive",    dot: "muted" },
  blocked:     { variant: "destructive", label: "Blocked",     dot: "destructive" },
} as const;

export const CHANNEL_LABELS: Record<string, string> = {
  direct:      "Direct",
  booking_com: "Booking.com",
  airbnb:      "Airbnb",
  expedia:     "Expedia",
  walk_in:     "Walk-in",
  phone:       "Phone",
};
