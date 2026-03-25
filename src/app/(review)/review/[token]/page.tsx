import { db } from "@/db";
import { reviewTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ReviewForm from "./review-form";

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

  if (!tokenRow) notFound();

  const reservation = tokenRow.reservation;
  const guest = reservation?.guest;
  const property = reservation?.property;

  if (!reservation || !guest || !property) notFound();

  // Already used
  if (tokenRow.usedAt) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-border p-8 text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h1 className="text-xl font-semibold text-foreground">
            Already submitted
          </h1>
          <p className="text-muted-foreground">
            You&apos;ve already submitted a review for this stay. Thank you for
            your feedback!
          </p>
        </div>
      </main>
    );
  }

  // Expired
  if (new Date(tokenRow.expiresAt) < new Date()) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-border p-8 text-center space-y-4">
          <div className="text-4xl">⏰</div>
          <h1 className="text-xl font-semibold text-foreground">Link expired</h1>
          <p className="text-muted-foreground">
            This review link expired 30 days after your checkout. We&apos;re
            sorry you missed it!
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {property.city}
            {property.country ? `, ${property.country}` : ""}
          </p>
          <h1 className="text-lg font-semibold text-foreground">
            {property.name}
          </h1>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm border border-border p-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Share Your Experience
          </h2>
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
