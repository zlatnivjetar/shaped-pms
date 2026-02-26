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
                ? "text-amber-400"
                : "text-stone-200"
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
        <h2 className="text-2xl font-semibold text-stone-800">
          Thank you, {guestFirstName}!
        </h2>
        <p className="text-stone-500">
          Your review has been submitted and will be published shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-sm text-stone-500 mb-1">
          Stay: {formatDate(checkIn)} – {formatDate(checkOut)}
        </p>
        <p className="text-stone-600">
          Hi {guestFirstName}, how was your stay at {propertyName}?
        </p>
      </div>

      {/* Star rating */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-700">
          Overall rating <span className="text-red-500">*</span>
        </label>
        <StarRating value={rating} onChange={setRating} />
        {rating > 0 && (
          <p className="text-sm text-stone-500">
            {["", "Poor", "Fair", "Good", "Very good", "Excellent"][rating]}
          </p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1">
        <label
          htmlFor="review-title"
          className="block text-sm font-medium text-stone-700"
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
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:outline-none"
        />
      </div>

      {/* Body */}
      <div className="space-y-1">
        <label
          htmlFor="review-body"
          className="block text-sm font-medium text-stone-700"
        >
          Your review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Tell future guests about your experience..."
          rows={5}
          minLength={10}
          required
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm shadow-sm focus:border-stone-500 focus:outline-none resize-none"
        />
        <p className="text-xs text-stone-400">{body.length} / 2000 characters</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-stone-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
