"use client";

import { PendingReviewsData } from "@/types/dashboard-types";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ClipboardCheck } from "lucide-react";
import { buttonVariants } from "../ui/button";
import Link from "next/link";

import { Skeleton } from "../ui/skeleton";
import { QueryErrorState } from "../ui/custom/query-error-state";

interface PendingReviewsProps {
  data?: PendingReviewsData[];
  totalCount?: number;
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
}

export const PendingReviews = ({
  data,
  totalCount,
  isLoading,
  error,
  onRetry,
}: PendingReviewsProps) => {
  const items = data || [];

  return (
    <div className="border rounded-xl p-4 sm:p-5 bg-card shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-4 text-indigo-600" />
          <h2 className="font-semibold text-base text-foreground">
            Pending Reviews
          </h2>
          <Badge
            variant="outline"
            className="border-indigo-200 bg-indigo-50 text-indigo-700 font-medium text-xs ml-1"
          >
            {totalCount ?? items.length}
          </Badge>
        </div>
        <Link
          href="/approvals"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className:
              "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 text-xs sm:text-sm h-8 px-2.5 cursor-pointer",
          })}
        >
          View approvals
        </Link>
      </div>

      {error ? (
        <QueryErrorState
          title="Failed to load pending reviews"
          message="Could not retrieve your pending approvals."
          onRetry={onRetry}
          className="my-2"
        />
      ) : isLoading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 border rounded-lg flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No pending reviews right now.
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <Avatar className="size-9 rounded-lg shrink-0 mt-0.5">
                  <AvatarFallback className="bg-indigo-50 text-indigo-600 font-semibold text-xs rounded-lg">
                    {item?.title ? item.title.slice(0, 2).toUpperCase() : "RV"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="font-medium text-foreground truncate">
                    {item.title}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {item.metadata?.source && (
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground text-[10px] py-0 h-4.5"
                      >
                        {item.metadata.source.replaceAll("_", " ")}
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {item.createdAt
                        ? formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end shrink-0 pl-12 sm:pl-0">
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 font-medium text-xs"
                >
                  {item.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};