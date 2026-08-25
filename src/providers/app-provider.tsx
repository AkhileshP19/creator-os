"use client";
// provider.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useMockData } from "@/config";
import React, { useEffect, useState } from "react";
import useConfiguration from "@/hooks/configuration/useConfiguration";
import { makeServer } from "@/mirage";

interface AppProvidersProps {
    children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
    // Fetch configuration for query caching and refetching behavior
    const queryCacheTime = useConfiguration<number>("queryCacheTimeMs");
    const refreshQueriesOnWindowFocus = useConfiguration<boolean>("refreshQueriesOnWindowFocus");

    // Initialize QueryClient
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                refetchOnWindowFocus: refreshQueriesOnWindowFocus,
                staleTime: queryCacheTime
            }
        }
    }));

    // Setup MirageJS server in development
    useEffect(() => {
        let server: any;
        if (useMockData) {
            console.log("Mock data enabled, starting MirageJS server");
            server = makeServer();
        }
        return () => {
            if (server) {
                server.shutdown();
                console.log("MirageJS server shutdown");
            }
        };
    }, []);


    return (
        // <RecoilRoot>
        //   <ThemeProvider>
        //     <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        //     <ThemeCustomizer />
        //   </ThemeProvider>
        //   <Toaster />
        // </RecoilRoot>

        <QueryClientProvider client={queryClient}>{children}
            <Toaster />
        </QueryClientProvider >

    );
};

export default AppProviders;

// How It Works
// Environment Configuration:

// useConfiguration dynamically fetches environment-specific settings based on NEXT_PUBLIC_ENV.
// In development, queries are refetched when the window regains focus, and the cache lasts for 1 minute.
// QueryClient Initialization:

// QueryClient is initialized with refetchOnWindowFocus and cacheTime fetched via useConfiguration.
// MirageJS Mock Server:

// If NEXT_PUBLIC_USE_MOCK_DATA is true, the MirageJS server is set up for local development or testing.
// Server Ready Check:

// Ensures the MirageJS server is ready before rendering the app.
// React Query Integration:

// React Query is used for managing server state efficiently with caching, fetching, and background updates.
