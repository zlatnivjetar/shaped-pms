import { z } from "zod";

export const searchParamsSchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
});

export const guestDetailsSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const createReservationSchema = z.object({
  propertyId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  adults: z.coerce.number().int().min(1),
  children: z.coerce.number().int().min(0).default(0),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  specialRequests: z.string().optional(),
});

export const apiReservationSchema = z.object({
  propertySlug: z.string(),
  roomTypeId: z.string().uuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  adults: z.coerce.number().int().min(1).max(10),
  children: z.coerce.number().int().min(0).max(10).default(0),
  channel: z
    .enum(["direct", "booking_com", "airbnb", "expedia", "walk_in", "phone"])
    .default("direct"),
  guest: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  specialRequests: z.string().optional(),
});

export type SearchParams = z.infer<typeof searchParamsSchema>;
export type GuestDetails = z.infer<typeof guestDetailsSchema>;
export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ApiReservationInput = z.infer<typeof apiReservationSchema>;
