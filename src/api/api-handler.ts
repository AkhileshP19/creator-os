import axios, { AxiosRequestConfig } from "axios";

export const ID_PLACEHOLDER = "{id}";

export const buildEndpointUrl = (ids: ApiIds, apiEndPoint: string): string => {
    if (typeof apiEndPoint !== "string") {
        throw new Error("apiEndPoint must be a string");
    }

    const allIds = Array.isArray(ids) ? ids.map((id) => (typeof id === "string" ? id : id.toString())) : [ids];

    return allIds.reduce((accUrl: string, currentId) => {
        const idAsString = typeof currentId === "string" ? currentId : currentId.toString(); // Ensure it's always a string

        return accUrl.replace(ID_PLACEHOLDER, idAsString);
    }, apiEndPoint);
};

export const buildCacheKey = (ids: ApiIds, cacheKeyTemplate: string): string => {
    const allIds = Array.isArray(ids) ? ids : [ids];

    return allIds.reduce((accUrl: string, currentId) => {
        const idAsString = typeof currentId === "number" || !isNaN(Number(currentId)) ? currentId.toString() : String(currentId); // Ensure ID is always a string

        return accUrl.replace(ID_PLACEHOLDER, idAsString);
    }, cacheKeyTemplate);
};

export const buildUrlWithFilters = (ids: ApiIds, apiEndPoint: string, filters?: Record<string, unknown>): string => {
    let url = buildEndpointUrl(ids || [], apiEndPoint);

    if (filters) {
        const queryStringParams: { [key: string]: string } = {};
        Object.keys(filters).forEach((key) => {
            const value = filters[key];
            if (value && value.toString().length > 0) {
                queryStringParams[key] = value.toString();
            }
        });

        const params = new URLSearchParams(queryStringParams);
        if (params.toString().length > 0) {
            url += `?${params.toString()}`;
        }
    }

    return url;
};

const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [key, value] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(value);
        }
    }
    return null;
};

export type ApiIds = number | string | (number | string)[];

const api = axios.create({
    // baseURL: baseJavaURL,
    // withCredentials: true, // ✅ Enables sending cookies with requests
    headers: {
        Accept: "application/json",
        // "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true" // Disable ngrok warning and errors,
    }
});

// ✅ **Attach Authorization Token to Every Request**
api.interceptors.request.use(
    (config) => {
        const token = getCookie("auth_token"); // Retrieve token from cookies
        console.log(token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const apiHandler = async <T>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
    isAIML?: boolean
): Promise<T> => {
    try {
        const baseURL = "http://localhost:8080/"; // Decide backend dynamically
        console.log(baseURL);

        // Detect if we want a blob (Excel download)
        const wantsExcel = config?.headers?.Accept === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        const requestConfig: AxiosRequestConfig = {
            method,
            url: `${baseURL}${url}`,
            data,
            ...config,
            headers: {
                ...config?.headers // Merge existing config headers (handle potential undefined)
            },
            ...(wantsExcel ? { responseType: "blob" } : {}) // Set responseType to blob if we want an Excel file
        };

        // Conditionally remove Content-Type for FormData in POST requests
        if (method === "POST" && data instanceof FormData && requestConfig.headers) {
            delete requestConfig.headers["Content-Type"];
        }

        const response = await api(requestConfig);
        console.log(response.data);

        // If blob, return the blob directly
        if (wantsExcel && response.data instanceof Blob) {
            return response.data as T;
        }

        return response.data.data;
    } catch (error: any) {
        console.error(`API ${method} request to ${url} failed:`, error.response || error);
        throw error.response?.data || error;
    }
};

export default api;