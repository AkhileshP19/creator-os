import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QueryErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const QueryErrorState = ({
  title = "Failed to load data",
  message = "Something went wrong while fetching information. Please try again.",
  onRetry,
  className,
}: QueryErrorStateProps) => {
  return (
    <div
      role="alert"
      className={cn(
        "p-6 border border-rose-200 dark:border-rose-900/50 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 text-center flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <div className="flex items-center justify-center size-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
        <AlertCircle className="size-5" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-sm">{message}</p>
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="cursor-pointer gap-1.5 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-900/40 text-xs h-8 px-3 shadow-2xs mt-1"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
};
