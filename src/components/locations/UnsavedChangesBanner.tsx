"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface UnsavedChangesBannerProps {
  changes: string[];
  onDiscard: () => void;
  submitLabel?: string;
}

export function UnsavedChangesBanner({
  changes,
  onDiscard,
  submitLabel = "Save Changes",
}: UnsavedChangesBannerProps) {
  if (changes.length === 0) return null;

  return (
    <div className="sticky bottom-0 mt-6 bg-warning/10 dark:bg-warning/10 border-t-2 border-warning p-3 sm:p-4 shadow-lg z-10 animate-in slide-in-from-bottom">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-warning dark:text-warning shrink-0" />
            <p className="font-semibold text-sm sm:text-base text-warning dark:text-warning-foreground">
              Unsaved changes
            </p>
          </div>
          <ul className="text-xs sm:text-sm text-warning dark:text-warning space-y-1 ml-6 sm:ml-0">
            {changes.slice(0, 3).map((change, i) => (
              <li key={i} className="truncate">
                • {change}
              </li>
            ))}
            {changes.length > 3 && (
              <li className="text-warning dark:text-warning">
                +{changes.length - 3} more...
              </li>
            )}
          </ul>
        </div>
        <div className="flex gap-2 sm:gap-2 sm:shrink-0">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onDiscard}
            className="flex-1 sm:flex-initial border-warning/30 dark:border-warning text-xs sm:text-sm h-9"
          >
            Discard
          </Button>
          <Button
            size="sm"
            type="submit"
            className="flex-1 sm:flex-initial bg-success hover:bg-success/90 text-white text-xs sm:text-sm h-9"
          >
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
