"use client";

import { useState } from "react";
import { Film, Loader2, Search } from "lucide-react";
import { ApprovalCard } from "@/components/approvals/approval-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationController } from "@/components/ui/custom/pagination-controller";
import { QueryErrorState } from "@/components/ui/custom/query-error-state";
import { usePaginatedData } from "@/hooks/fetch/usePaginatedDataParams";
import { useFetchData } from "@/hooks/fetch/useFetchData";
import useDebounceSearch from "@/hooks/optimization/useDebounceSearch";
import { ApiEndPoint } from "@/types/api/api-types";
import type {
  ApprovalFilters,
  ApprovalListItem,
  ReviewStatusFilter,
} from "@/types/approval-types";
import type { Project } from "@/types/project-types";

const tabs: { value: ReviewStatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];
const dateOptions = [
  { value: "ALL", label: "All dates" },
  { value: "TODAY", label: "Today" },
  { value: "NEXT_7_DAYS", label: "Next 7 days" },
  { value: "UNSCHEDULED", label: "Unscheduled" },
];
const sortOptions = [
  { value: "soonest", label: "Scheduled soonest" },
  { value: "latest", label: "Scheduled latest" },
  { value: "newest", label: "Newest generated" },
];

export default function ApprovalPage() {
  const [pageNo, setPageNo] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search, 350);
  const [status, setStatus] = useState<ReviewStatusFilter>("ALL");
  const [projectId, setProjectId] = useState("");
  const [scheduledDateFilter, setDateFilter] =
    useState<ApprovalFilters["scheduledDateFilter"]>("ALL");
  const [sort, setSort] = useState("soonest");
  const projects = useFetchData<Project[]>(
    ApiEndPoint.GET_ALL_PROJECTS,
    "all-projects",
  );
  const filters: ApprovalFilters = {
    status,
    projectId,
    scheduledDateFilter,
    sortBy: sort === "newest" ? "generatedAt" : "scheduledDate",
    sortOrder: sort === "soonest" ? "ASC" : "DESC",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const approvals = usePaginatedData<ApprovalListItem, ApprovalFilters>({
    apiEndPoint: ApiEndPoint.GET_APPROVALS,
    queryKey: "approvals",
    filters,
    pagination: { pageNo, pageSize },
    search: debouncedSearch,
    refetchInterval: (data) =>
      data?.responseData.some(
        (item) =>
          item.regenerationStatus === "QUEUED" ||
          item.regenerationStatus === "RUNNING",
      )
        ? 3000
        : 15000,
  });
  const filtered =
    !!debouncedSearch || !!projectId || scheduledDateFilter !== "ALL";
  const initialLoading = approvals.isLoading && !approvals.isFetched;
  const projectOptions = [
    { value: "ALL", label: "All Projects" },
    ...(projects.data ?? []).map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review generated videos before they move to publishing.
        </p>
      </header>
      <Tabs
        value={status}
        onValueChange={(value) => {
          if (tabs.some((tab) => tab.value === value)) {
            setStatus(value as ReviewStatusFilter);
            setPageNo(1);
          }
        }}
      >
        <div className="overflow-x-auto pb-1 max-w-full">
          <TabsList aria-label="Approval status" className="bg-muted p-1 rounded-lg inline-flex">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-active:bg-indigo-600 data-active:text-white transition-colors text-xs sm:text-sm px-3 sm:px-4 py-1.5"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="mt-5 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute top-3 left-3 size-4 text-muted-foreground" />
            <Input
              aria-label="Search content title"
              placeholder="Search content title…"
              value={search}
              className="h-10 pl-9 text-xs sm:text-sm"
              onChange={(event) => {
                setSearch(event.target.value);
                setPageNo(1);
              }}
            />
          </div>
          <Select
            items={projectOptions}
            value={projectId || "ALL"}
            disabled={projects.isLoading}
            onValueChange={(value) => {
              setProjectId(value === "ALL" || !value ? "" : value);
              setPageNo(1);
            }}
          >
            <SelectTrigger aria-label="Project" className="h-10 w-full">
              <SelectValue placeholder={projects.isLoading ? "Loading projects..." : "All Projects"} />
            </SelectTrigger>
            <SelectContent>
              {projects.isLoading ? (
                <div className="flex items-center justify-center p-3 text-xs text-muted-foreground gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  Loading projects...
                </div>
              ) : (
                projectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Select
            items={dateOptions}
            value={scheduledDateFilter}
            onValueChange={(value) => {
              if (value) {
                setDateFilter(value as ApprovalFilters["scheduledDateFilter"]);
                setPageNo(1);
              }
            }}
          >
            <SelectTrigger aria-label="Scheduled date" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={sortOptions}
            value={sort}
            onValueChange={(value) => {
              if (value) {
                setSort(value);
                setPageNo(1);
              }
            }}
          >
            <SelectTrigger aria-label="Sort approvals" className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {projects.error && (
          <p className="mt-2 text-sm text-destructive">
            Projects could not be loaded.{" "}
            <Button variant="link" onClick={() => projects.refetch()}>
              Retry
            </Button>
          </p>
        )}
        <TabsContent value={status}>
          {approvals.error ? (
            <QueryErrorState
              title="Failed to load approvals"
              message={approvals.error.message || "Unable to load approvals. Please try again."}
              onRetry={() => approvals.refetch()}
            />
          ) : approvals.isLoading ? (
            <div
              className="grid gap-5 grid-cols-1 xl:grid-cols-2"
              role="status"
              aria-label="Loading approvals"
            >
              {[1, 2, 3, 4].map((item) => (
                <Card key={item} className="flex gap-5 overflow-hidden p-4">
                  <Skeleton className="aspect-[9/16] w-32 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-4 pt-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </div>
                </Card>
              ))}
            </div>
          ) : approvals.data.length === 0 ? (
            <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <Film className="size-10 text-muted-foreground" />
              <h2 className="font-medium">
                {filtered
                  ? "No approvals match your current filters."
                  : status === "PENDING"
                    ? "You're all caught up. No videos are waiting for approval."
                    : status === "ALL"
                      ? "No videos are awaiting review yet."
                      : "No approvals match your current filters."}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filtered
                  ? "Try a different search or filter."
                  : "Completed video generations will appear here for review."}
              </p>
            </Card>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">
                {approvals.totalCount}{" "}
                {approvals.totalCount === 1 ? "review" : "reviews"}
              </p>
              <div className="grid gap-5 grid-cols-1 xl:grid-cols-2">
                {approvals.data.map((item) => (
                  <ApprovalCard key={item.approvalId} approval={item} />
                ))}
              </div>
              <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
                <PaginationController
                  currentPage={approvals.currentPage || pageNo}
                  totalPages={approvals.totalPages}
                  onPageChange={setPageNo}
                  maxVisibleButtons={3}
                  perPage={pageSize}
                  onPerPageChange={(value) => {
                    setPageSize(value);
                    setPageNo(1);
                  }}
                  perPageOptions={[6, 12, 24]}
                  label="Videos per page"
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
