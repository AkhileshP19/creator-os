import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiHandler } from "@/api/api-handler";
import CacheKeys from "@/types/enums/cache-key-enums";
import {
  ApiEndPoint,
  type ApiResponse,
  type PaginatedApiResponse,
} from "@/types/api/api-types";
import type {
  PublishJob,
  PublishStatus,
  YouTubeConnection,
} from "@/types/publish-types";
export function useYouTubeConnection() {
  return useQuery({
    queryKey: [CacheKeys.YOUTUBE_CONNECTION],
    queryFn: () =>
      apiHandler<ApiResponse<YouTubeConnection>>(
        "GET",
        ApiEndPoint.YOUTUBE_STATUS,
      ),
    staleTime: 0,
  });
}
export function usePublishJobs(
  pageNo: number,
  status: PublishStatus | "ALL",
  search?: string,
) {
  const normalizedSearch = search?.trim();
  const searchParam = normalizedSearch
    ? `&search=${encodeURIComponent(normalizedSearch)}`
    : "";

  return useQuery({
    queryKey: [
      CacheKeys.PUBLISH_JOBS,
      pageNo,
      status,
      normalizedSearch ?? "",
    ],
    queryFn: () =>
      apiHandler<PaginatedApiResponse<PublishJob>>(
        "GET",
        `${ApiEndPoint.PUBLISH_JOBS}?pageNo=${pageNo}&pageSize=20&status=${status}${searchParam}`,
      ),
    refetchInterval: (query) => {
      const jobs = query.state.data?.responseData ?? [];

      const hasActiveJob = jobs.some(
        (job) =>
          job.publishStatus === "QUEUED" ||
          job.publishStatus === "UPLOADING" ||
          job.publishStatus === "SCHEDULED",
      );

      return hasActiveJob ? 10_000 : false;
    },
  });
}
export function usePublishingMutation<T>(
  method: "POST" | "DELETE",
  url: string,
) {
  const cache = useQueryClient();
  return useMutation({
    mutationFn: (input: T) =>
      apiHandler("POST" === method ? "POST" : "DELETE", url, input),
    onSuccess: async () => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: [CacheKeys.PUBLISH_JOBS] }),
        cache.invalidateQueries({ queryKey: [CacheKeys.YOUTUBE_CONNECTION] }),
        cache.invalidateQueries({ queryKey: [CacheKeys.APPROVALS] }),
        cache.invalidateQueries({ queryKey: [CacheKeys.DASHBOARD_OVERVIEW] }),
      ]);
    },
  });
}
export function publishingError(error: unknown) {
  return error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
    ? error.message
    : "Unable to complete this action. Please try again.";
}
