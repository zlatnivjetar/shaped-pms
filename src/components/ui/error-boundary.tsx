"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

interface ErrorStateProps {
  title?: ReactNode;
  description?: ReactNode;
  onReset?: () => void;
  resetLabel?: ReactNode;
  size?: "table" | "page" | "compact";
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description = "Try again. If the issue persists, refresh the page or return later.",
  onReset,
  resetLabel = "Try again",
  size = "page",
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={TriangleAlert}
      title={title}
      description={description}
      size={size}
      className={className}
      action={
        onReset ? (
          <Button type="button" variant="outline" onClick={onReset}>
            {resetLabel}
          </Button>
        ) : undefined
      }
    />
  );
}

interface ErrorBoundaryProps extends ErrorStateProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.title}
          description={this.props.description}
          resetLabel={this.props.resetLabel}
          size={this.props.size}
          className={this.props.className}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}
