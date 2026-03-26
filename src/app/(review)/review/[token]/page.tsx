import { CheckCircle2, Clock3 } from "lucide-react";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PublicStateCard } from "@/components/public/public-state-card";
import { db } from "@/db";
import { reviewTokens } from "@/db/schema";
import ReviewForm from "./review-form";
import { bookingCardClassName } from "@/components/booking/styles";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ReviewPage({ params }: Props) {
  const { token } = await params;

  const tokenRow = await db.query.reviewTokens.findFirst({
    where: eq(reviewTokens.token, token),
    with: {
      reservation: {
        with: { guest: true, property: true },
      },
    },
  });

  if (!tokenRow) {
    notFound();
  }

  const reservation = tokenRow.reservation;
  const guest = reservation?.guest;
  const property = reservation?.property;

  if (!reservation || !guest || !property) {
    notFound();
  }

  if (tokenRow.usedAt) {
    return (
      <main className="min-h-screen bg-booking-background px-4 py-12">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <PublicStateCard
            icon={CheckCircle2}
            eyebrow="Guest review"
            title="Already submitted"
            description="You’ve already shared your feedback for this stay. Thank you for taking the time to review it."
            tone="success"
            className="bg-booking-card"
            actionHref="/"
            actionLabel="Go home"
          />
        </div>
      </main>
    );
  }

  if (new Date(tokenRow.expiresAt) < new Date()) {
    return (
      <main className="min-h-screen bg-booking-background px-4 py-12">
        <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
          <PublicStateCard
            icon={Clock3}
            eyebrow="Guest review"
            title="This link has expired"
            description="Review links stay active for 30 days after checkout. We’re sorry you missed the submission window."
            tone="warning"
            className="bg-booking-card"
            actionHref="/"
            actionLabel="Return home"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-booking-background">
      <header className="border-b border-border bg-booking-background">
        <div className="mx-auto max-w-lg px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-booking-accent">
            {property.city}
            {property.country ? `, ${property.country}` : ""}
          </p>
          <h1 className="font-display text-xl font-semibold text-foreground">
            {property.name}
          </h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-10">
        <div className={`${bookingCardClassName} p-8`}>
          <div className="mb-6 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-booking-accent">
              Guest review
            </p>
            <h2 className="text-xl font-semibold text-foreground">Share your experience</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Your feedback helps future guests and helps the property improve each stay.
            </p>
          </div>

          <ReviewForm
            token={token}
            propertyName={property.name}
            guestFirstName={guest.firstName}
            checkIn={reservation.checkIn}
            checkOut={reservation.checkOut}
          />
        </div>
      </div>
    </main>
  );
}
