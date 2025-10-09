import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface FullPageSpinnerProps {
  /** Optional message displayed under the spinner */
  message?: ReactNode;
  /** Optional custom classes for the wrapper */
  className?: string;
}

export function FullPageSpinner({ message, className }: FullPageSpinnerProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground",
        className
      )}
    >
      <Loader2 aria-hidden className="h-8 w-8 animate-spin text-muted-foreground" />
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <span className="sr-only" role="status" aria-live="polite">
        Cargando contenido
      </span>
    </div>
  );
}

export default FullPageSpinner;
