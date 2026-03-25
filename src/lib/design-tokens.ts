/**
 * Design token references for JS contexts (Stripe Elements, chart configs).
 * These reference CSS variables and require a browser environment.
 */
export const tokens = {
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  background: "var(--background)",
  foreground: "var(--foreground)",
  card: "var(--card)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  border: "var(--border)",
  input: "var(--input)",
  ring: "var(--ring)",
  destructive: "var(--destructive)",
  destructiveForeground: "var(--destructive-foreground)",
  success: "var(--success)",
  successForeground: "var(--success-foreground)",
  warning: "var(--warning)",
  warningForeground: "var(--warning-foreground)",
  info: "var(--info)",
  infoForeground: "var(--info-foreground)",
  bookingBackground: "var(--booking-background)",
  bookingAccent: "var(--booking-accent)",
  bookingAccentForeground: "var(--booking-accent-foreground)",
  bookingCta: "var(--booking-cta)",
  bookingCtaForeground: "var(--booking-cta-foreground)",
  bookingCard: "var(--booking-card)",
  bookingMuted: "var(--booking-muted)",
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  ratingStar: "var(--rating-star)",
} as const;

/**
 * Hex constants for email templates and other non-browser contexts (light mode).
 */
export const hexTokens = {
  primary: "#E2BD27",
  primaryForeground: "#11110F",
  background: "#FBFBF9",
  foreground: "#11110F",
  card: "#FFFFFF",
  muted: "#EFEEEC",
  mutedForeground: "#51504D",
  border: "#E5E3DC",
  destructive: "#A12222",
  success: "#1C7C5C",
  warning: "#BD8600",
  info: "#2563A0",
  bookingBackground: "#FBFBF9",
  bookingAccent: "#11110F",
  bookingAccentForeground: "#FFFFFF",
  bookingCta: "#E2BD27",
  bookingCtaForeground: "#11110F",
  bookingCard: "#FFFFFF",
  bookingMuted: "#51504D",
  ratingStar: "#E2BD27",
} as const;

/**
 * Hex constants for dark mode contexts (Stripe Elements, etc.).
 */
export const darkHexTokens = {
  primary: "#E2BD27",
  primaryForeground: "#11110F",
  background: "#0B0B09",
  foreground: "#FBFBF9",
  card: "#1A1A17",
  muted: "#222220",
  mutedForeground: "#83827C",
  border: "#2E2E2B",
  destructive: "#C23030",
  success: "#24A070",
  warning: "#D99900",
  info: "#4A8FD4",
  bookingBackground: "#0B0B09",
  bookingAccent: "#FBFBF9",
  bookingAccentForeground: "#11110F",
  bookingCta: "#E2BD27",
  bookingCtaForeground: "#11110F",
  bookingCard: "#1A1A17",
  bookingMuted: "#83827C",
  ratingStar: "#E2BD27",
} as const;
