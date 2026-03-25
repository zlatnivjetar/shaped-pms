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
  chart1: "var(--chart-1)",
  chart2: "var(--chart-2)",
  chart3: "var(--chart-3)",
  chart4: "var(--chart-4)",
  chart5: "var(--chart-5)",
  ratingStar: "var(--rating-star)",
} as const;

/**
 * Hex constants for email templates and other non-browser contexts.
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
  ratingStar: "#E2BD27",
} as const;
