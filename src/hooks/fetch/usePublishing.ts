import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiHandler } from "@/api/api-handler";
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
    queryKey: ["youtube-connection"],
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
    queryKey: ["publish-jobs", pageNo, status, normalizedSearch ?? ""],
    queryFn: () =>
      apiHandler<PaginatedApiResponse<PublishJob>>(
        "GET",
        `${ApiEndPoint.PUBLISH_JOBS}?pageNo=${pageNo}&pageSize=20&status=${status}${searchParam}`,
      ),
    refetchInterval: 10_000,
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
        cache.invalidateQueries({ queryKey: ["publish-jobs"] }),
        cache.invalidateQueries({ queryKey: ["youtube-connection"] }),
        cache.invalidateQueries({ queryKey: ["approvals"] }),
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
