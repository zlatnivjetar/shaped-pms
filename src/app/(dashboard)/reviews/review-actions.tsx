"use client";

import { useState, useTransition } from "react";

import { hideReview, publishReview, respondToReview } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/components/ui/toast";

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
    startTransition(async () => {
      try {
        await publishReview(reviewId);
        showSuccess("Review published");
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Could not publish review.";
        showError("Publish failed", message);
      }
    });
  }

  function handleHide() {
    startTransition(async () => {
      try {
        await hideReview(reviewId);
        showSuccess("Review hidden");
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Could not hide review.";
        showError("Hide failed", message);
      }
    });
  }

  function handleRespondSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!response.trim()) return;

    startTransition(async () => {
      try {
        await respondToReview(reviewId, response);
        setSaved(true);
        setShowResponseForm(false);
        showSuccess("Response saved");
      } catch (caught) {
        const message =
          caught instanceof Error ? caught.message : "Could not save response.";
        showError("Save failed", message);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {currentStatus !== "published" && (
          <Button onClick={handlePublish} disabled={isPending} size="xs">
            Publish
          </Button>
        )}

        {currentStatus !== "hidden" && (
          <Button
            onClick={handleHide}
            disabled={isPending}
            size="xs"
            variant="secondary"
          >
            Hide
          </Button>
        )}

        <Button
          onClick={() => {
            setShowResponseForm((value) => !value);
            setSaved(false);
          }}
          size="xs"
          variant="outline"
        >
          {existingResponse || saved ? "Edit Response" : "Respond"}
        </Button>
      </div>

      {showResponseForm && (
        <form onSubmit={handleRespondSubmit} className="mt-1 space-y-2">
          <Textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
            placeholder="Write your response to this review..."
            className="min-h-24 resize-none text-sm"
          />
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isPending || !response.trim()}
              size="xs"
            >
              {isPending ? "Saving..." : "Save Response"}
            </Button>
            <Button
              type="button"
              onClick={() => setShowResponseForm(false)}
              size="xs"
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
