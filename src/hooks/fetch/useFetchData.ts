import { apiHandler, ApiIds, buildCacheKey, buildUrlWithFilters } from "@/api/api-handler";
import { ApiResponse } from "@/types/api/api-types";
import { useQuery } from "@tanstack/react-query";

export const useFetchData = <TData>(
    apiEndPoint: string,
    cacheKey: string,
    ids: ApiIds = [],
    queryParams?: Record<string, unknown>,
    enabled: boolean = true,
) => {
    const getData = async (): Promise<ApiResponse<TData>> => {
        const url = buildUrlWithFilters(ids, apiEndPoint, queryParams);
        return await apiHandler<ApiResponse<TData>>("GET", url, undefined, undefined);
    };

    const updatedCacheKey = buildCacheKey(ids, cacheKey);

    const { isLoading, isFetching, data, error, refetch, isFetched } = useQuery<ApiResponse<TData>>({
        queryKey: [updatedCacheKey, ids, queryParams],
        queryFn: getData,
        enabled
    });

    return {
        isLoading: isLoading || isFetching,
        isFetched,
        data: data?.responseData, // Safely accessing `responseData`
        error,
        refetch
    };



}