"use client";

import { useState, useTransition } from "react";
import { publishReview, hideReview, respondToReview } from "./actions";

interface ReviewActionsProps {
  reviewId: string;
  currentStatus: "pending" | "published" | "hidden";
  existingResponse?: string | null;
}

export default function ReviewActions({
  reviewId,
  currentStatus,
  existingResponse,
}: ReviewActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState(existingResponse ?? "");
  const [saved, setSaved] = useState(false);

  function handlePublish() {
    startTransition(() => publishReview(reviewId));
  }

  function handleHide() {
    startTransition(() => hideReview(reviewId));
  }

  function handleRespondSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;
    startTransition(async () => {
      await respondToReview(reviewId, response);
      setSaved(true);
      setShowResponseForm(false);
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        {currentStatus !== "published" && (
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="text-xs px-2.5 py-1 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
          >
            Publish
          </button>
        )}
        {currentStatus !== "hidden" && (
          <button
            onClick={handleHide}
            disabled={isPending}
            className="text-xs px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 hover:bg-stone-200 disabled:opacity-50 transition-colors"
          >
            Hide
          </button>
        )}
        <button
          onClick={() => {
            setShowResponseForm((v) => !v);
            setSaved(false);
          }}
          className="text-xs px-2.5 py-1 rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
        >
          {existingResponse || saved ? "Edit Response" : "Respond"}
        </button>
      </div>

      {showResponseForm && (
        <form onSubmit={handleRespondSubmit} className="space-y-2 mt-1">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
            placeholder="Write your response to this review…"
            className="w-full text-xs rounded border border-stone-300 px-2 py-1.5 focus:outline-none focus:border-stone-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || !response.trim()}
              className="text-xs px-3 py-1 rounded bg-stone-800 text-white hover:bg-stone-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Saving…" : "Save Response"}
            </button>
            <button
              type="button"
              onClick={() => setShowResponseForm(false)}
              className="text-xs px-3 py-1 rounded bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
