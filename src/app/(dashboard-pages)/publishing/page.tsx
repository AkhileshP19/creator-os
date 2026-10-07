"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useDashboardSearch } from "@/components/dashboard-search-context";
import useDebounceSearch from "@/hooks/optimization/useDebounceSearch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/ui/custom/query-error-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePublishJobs,
  usePublishingMutation,
  publishingError,
} from "@/hooks/fetch/usePublishing";
import { ApiEndPoint } from "@/types/api/api-types";
import type { PublishJob, PublishStatus } from "@/types/publish-types";
import {
  CalendarDays,
  ExternalLink,
  Film,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";

function getStatusBadge(status: PublishStatus) {
  switch (status) {
    case "PUBLISHED":
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
          Published
        </Badge>
      );
    case "SCHEDULED":
      return (
        <Badge
          variant="outline"
          className="border-indigo-200 bg-indigo-50 text-indigo-700 font-medium"
        >
          Scheduled
        </Badge>
      );
    case "UPLOADING":
      return (
        <Badge
          variant="outline"
          className="border-amber-200 bg-amber-50 text-amber-700 font-medium flex items-center gap-1"
        >
          <Loader2 className="size-3 animate-spin" />
          Uploading
        </Badge>
      );
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          {status}
        </Badge>
      );
  }
}

function JobCard({ job }: { job: PublishJob }) {
  const retry = usePublishingMutation<Record<string, never>>(
    "POST",
    ApiEndPoint.RETRY_PUBLISH_JOB.replace("{id}", encodeURIComponent(job.id)),
  );

  return (
    <Card className="rounded-xl border shadow-xs hover:shadow-sm transition-shadow">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-base text-foreground break-words">
            {job.title}
          </h2>
          <div>{getStatusBadge(job.publishStatus)}</div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Film className="size-3.5 text-indigo-500" />
            YouTube
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            Scheduled {new Date(job.scheduledAt).toLocaleString()}
          </span>
          <span>Attempts: {job.attemptCount}</span>
        </div>
        {job.publishedAt && (
          <p className="text-xs text-emerald-600 font-medium">
            Published on {new Date(job.publishedAt).toLocaleString()}
          </p>
        )}
        {job.externalVideoUrl && (
          <div className="pt-1">
            <a
              href={job.externalVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className:
                  "border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs h-8 px-3 inline-flex items-center gap-1.5",
              })}
            >
              <ExternalLink className="size-3.5" />
              View on YouTube
            </a>
          </div>
        )}
        {job.errorMessage && (
          <p role="status" className="text-xs text-destructive rounded-md bg-destructive/10 p-2.5">
            {job.errorMessage}
          </p>
        )}
        {job.publishStatus === "FAILED" && job.retryAllowed && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs text-xs h-8 px-3"
              disabled={retry.isPending}
              onClick={async () => {
                try {
                  await retry.mutateAsync({});
                  toast.success("Retry queued successfully");
                } catch (error: unknown) {
                  toast.error(publishingError(error));
                }
              }}
            >
              {retry.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  Queuing…
                </>
              ) : (
                <>
                  <RefreshCw className="size-3.5 mr-1.5" />
                  Retry
                </>
              )}
            </Button>
            <Link
              href="/content"
              className="text-xs text-indigo-600 hover:underline font-medium"
            >
              Edit content schedule
            </Link>
            <span className="text-muted-foreground text-xs">·</span>
            <Link
              href="/settings"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              YouTube settings
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PublishingPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PublishStatus | "ALL">("ALL");
  const { search } = useDashboardSearch();
  const debouncedSearch = useDebounceSearch(search, 300);
  const jobs = usePublishJobs(page, status, debouncedSearch);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const statusOptions = [
    { value: "ALL", label: "All statuses" },
    { value: "QUEUED", label: "Queued" },
    { value: "UPLOADING", label: "Uploading" },
    { value: "SCHEDULED", label: "Scheduled" },
    { value: "PUBLISHED", label: "Published" },
    { value: "FAILED", label: "Failed" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Publishing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track approved videos from upload to scheduled publication.
          </p>
        </div>
        <Link
          href="/approvals"
          className={buttonVariants({
            variant: "outline",
            className:
              "border-indigo-200 text-indigo-700 hover:bg-indigo-50 self-start sm:self-auto cursor-pointer inline-flex items-center gap-2",
          })}
        >
          <Send className="size-4 text-indigo-600" />
          Schedule an approved video
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs sm:text-sm font-medium text-muted-foreground">
          Filter by Status:
        </label>
        <Select
          items={statusOptions}
          value={status}
          onValueChange={(value) => {
            if (value) {
              setStatus(value as PublishStatus | "ALL");
              setPage(1);
            }
          }}
        >
          <SelectTrigger className="h-9 w-full sm:w-[180px] text-xs sm:text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {jobs.isPending ? (
        <div className="space-y-4" role="status" aria-label="Loading publishing jobs">
          {[1, 2, 3].map((item) => (
            <Card key={item} className="rounded-xl border shadow-xs p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Skeleton className="h-6 w-48 sm:w-64" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : jobs.isError ? (
        <QueryErrorState
          title="Failed to load publishing jobs"
          message={jobs.error?.message || "Unable to load publishing jobs. Please try again."}
          onRetry={() => jobs.refetch()}
        />
      ) : !jobs.data?.responseData.length ? (
        <Card className="p-12 text-center space-y-2">
          <Film className="size-10 text-muted-foreground mx-auto mb-2" />
          <h2 className="font-semibold text-foreground">No publishing jobs found</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Approve a video in Approvals, set its future schedule in Content,
            and choose Schedule on YouTube to see it here.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.data.responseData.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {jobs.data && jobs.data.totalPages > 1 && (
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={jobs.data.currentPage <= 1}
            onClick={() => setPage((jobs.data?.currentPage ?? 1) - 1)}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <span className="text-xs sm:text-sm text-muted-foreground">
            Page {jobs.data.currentPage} of {jobs.data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={jobs.data.currentPage >= jobs.data.totalPages}
            onClick={() => setPage((jobs.data?.currentPage ?? 1) + 1)}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

