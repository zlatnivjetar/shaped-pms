"use client";

import { useState, useTransition } from "react";
import { submitReview } from "./actions";

interface ReviewFormProps {
  token: string;
  propertyName: string;
  guestFirstName: string;
  checkIn: string;
  checkOut: string;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-4xl leading-none transition-colors focus:outline-none"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <span
            className={
              star <= (hovered || value)
                ? "text-rating-star"
                : "text-muted"
            }
          >
            ★
          </span>
        </button>
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      <div className="text-center py-12 space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-semibold text-foreground">
          Thank you, {guestFirstName}!
        </h2>
        <p className="text-muted-foreground">
          Your review has been submitted and will be published shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          Stay: {formatDate(checkIn)} – {formatDate(checkOut)}
        </p>
        <p className="text-muted-foreground">
          Hi {guestFirstName}, how was your stay at {propertyName}?
        </p>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">
          Overall rating <span className="text-destructive">*</span>
        </label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-sm text-muted-foreground">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-foreground"
        >
          Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarise your stay"
          maxLength={120}
          className="w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none"
        />
      </div>

      {/* Body */}
      <div className="space-y-1">
        <label
          htmlFor="review-body"
          className="block text-sm font-medium text-foreground"
        >
          Your review <span className="text-destructive">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell future guests about your experience..."
          rows={5}
          minLength={10}
          required
          className="w-full rounded-md border border-input px-3 py-2 text-sm shadow-sm focus:border-ring focus:outline-none resize-none"
        />
        <p className="text-xs text-muted-foreground">{body.length} / 2000 characters</p>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
