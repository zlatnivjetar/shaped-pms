import { toast } from "sonner";

const DEFAULT_DURATION = 4000;

export function showSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: DEFAULT_DURATION,
  });
}

export function showError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: DEFAULT_DURATION,
  });
}

export function showInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: DEFAULT_DURATION,
  });
}
