"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitReview } from "./actions";
import { PublicStateCard } from "@/components/public/public-state-card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { InlineError } from "@/components/ui/inline-error";
import { StarRating } from "@/components/ui/star-rating";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { bookingInputClassName } from "@/components/booking/styles";

interface ReviewFormProps {
  token: string;
  propertyName: string;
  guestFirstName: string;
  checkIn: string;
  checkOut: string;
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function ReviewForm({
  token,
  propertyName,
  guestFirstName,
  checkIn,
  checkOut,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ratingError =
    error === "Please select a star rating." ? error : null;
  const bodyError =
    error === "Your review must be at least 10 characters." ? error : null;
  const showAlert = Boolean(error && !ratingError && !bodyError);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }

    if (body.trim().length < 10) {
      setError("Your review must be at least 10 characters.");
      return;
    }

    startTransition(async () => {
      const result = await submitReview(token, {
        rating,
        title: title.trim() || undefined,
        body: body.trim(),
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error ?? "Something went wrong. Please try again.");
      }
    });
  }

  if (success) {
    return (
      <PublicStateCard
        icon={CheckCircle2}
        eyebrow="Guest review"
        title={`Thank you, ${guestFirstName}!`}
        description="Your review has been submitted and will be published shortly."
        tone="success"
        className="max-w-none border-none bg-transparent shadow-none"
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="mb-1 text-sm text-muted-foreground">
          Stay: {formatDate(checkIn)} – {formatDate(checkOut)}
        </p>
        <p className="text-muted-foreground">
          Hi {guestFirstName}, how was your stay at {propertyName}?
        </p>
      </div>

      <FormField
        label={
          <>
            Overall rating <span className="text-destructive">*</span>
          </>
        }
        error={ratingError}
        description={
          rating > 0
            ? ["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]
            : "Choose the rating that best reflects your overall stay."
        }
      >
        <StarRating
          value={rating}
          onChange={setRating}
          size="lg"
          aria-label="Overall stay rating"
        />
      </FormField>

      <FormField
        label="Title (optional)"
        htmlFor="review-title"
        description="Keep it short and specific."
      >
        <Input
          id="review-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Summarise your stay"
          maxLength={120}
          className={bookingInputClassName}
        />
      </FormField>

      <FormField
        label={
          <>
            Your review <span className="text-destructive">*</span>
          </>
        }
        htmlFor="review-body"
        error={bodyError}
        description={`${body.length} / 2000 characters`}
      >
        <Textarea
          id="review-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Tell future guests about your experience..."
          rows={6}
          minLength={10}
          required
          className={`${bookingInputClassName} resize-none`}
        />
      </FormField>

      {showAlert && <InlineError>{error}</InlineError>}

      <SubmitButton
        isPending={isPending}
        pendingLabel="Submitting…"
        className="w-full"
      >
        Submit review
      </SubmitButton>
    </form>
  );
}
