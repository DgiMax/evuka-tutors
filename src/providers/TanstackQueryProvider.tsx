// src/providers/TanstackQueryProvider.tsx

"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function TanstackQueryProvider({ children }: { children: React.ReactNode }) {
    // Create a new QueryClient instance only once
    const [queryClient] = React.useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Set a high staleTime so SSR data isn't immediately refetched on the client
                staleTime: 5 * 60 * 1000, // 5 minutes
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}