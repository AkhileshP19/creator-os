// hooks/fetch/usePatchData.ts
import { useMutation } from "@tanstack/react-query";
import { apiHandler, ApiIds, buildUrlWithFilters } from "@/api/api-handler";

/**
 * Generic PATCH hook using TanStack Query.
 *
 * @template TResponse - Response type
 * @template TRequest - Request body type
 * @param apiEndPoint - API endpoint (with optional placeholders)
 * @param ids - Optional dynamic path IDs (used for URL replacement)
 * @param queryParams - Optional query parameters to append to the URL
 */

export const usePatchData = <TResponse, TRequest>(
  apiEndPoint: string,
  ids: ApiIds = [],
  queryParams?: Record<string, unknown>,
) => {
  const url = buildUrlWithFilters(ids, apiEndPoint, queryParams);

  return useMutation({
    mutationFn: async (data: TRequest): Promise<TResponse> => {
      return await apiHandler<TResponse>("PATCH", url, data);
    },
  });
};
