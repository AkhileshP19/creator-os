import { useMutation } from "@tanstack/react-query";
import { apiHandler, ApiIds, buildUrlWithFilters } from "@/api/api-handler";


export const usePostData = <T, U>(
    url: string,
    ids: ApiIds = [],
    isAIML?: boolean,
    queryParams?: Record<string, unknown> // <-- add query params argument
) => {
    return useMutation({
        mutationFn: async (data: U & { id?: string | number }): Promise<T> => {
            const apiEndPoint = buildUrlWithFilters(ids, url, queryParams);

            return await apiHandler<T>("POST", apiEndPoint, data, undefined);
        }
    });
};
