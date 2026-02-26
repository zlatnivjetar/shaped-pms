import { randomBytes } from "crypto";

export function generateReviewToken(): string {
  return randomBytes(24).toString("hex"); // 48-char hex, URL-safe
}

export function getReviewTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}

export function buildReviewUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://shaped-pms.vercel.app";
  return `${base}/review/${token}`;
}
