// hooks/use-events.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import type { IEvent, EventFilters, PaginatedResponse } from "@/types";

const DEFAULT_RESPONSE: PaginatedResponse<IEvent> = {
    data: [],
    total: 0,
    page: 1,
    limit: 12,
    hasMore: false,
};

export function useEvents(initialFilters: EventFilters = {}) {
    const [filters, setFilters] = useState<EventFilters>(initialFilters);
    const [result, setResult] = useState<PaginatedResponse<IEvent>>(DEFAULT_RESPONSE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async (f: EventFilters) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (f.type) params.set("type", f.type);
            if (f.category) params.set("category", f.category);
            if (f.search) params.set("search", f.search);
            if (f.page) params.set("page", String(f.page));
            if (f.limit) params.set("limit", String(f.limit));

            const res = await fetch(`/api/events?${params.toString()}`);
            const data = await res.json();

            if (!data.success) throw new Error(data.error);
            setResult(data.data);
        } catch (err: any) {
            setError(err.message ?? "Failed to load events.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents(filters);
    }, [filters, fetchEvents]);

    function updateFilters(updates: Partial<EventFilters>) {
        setFilters((prev) => ({ ...prev, ...updates, page: 1 }));
    }

    function resetFilters() {
        setFilters({ page: 1 });
    }

    function nextPage() {
        if (result.hasMore) {
            setFilters((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }));
        }
    }

    return {
        events: result.data,
        total: result.total,
        page: result.page,
        hasMore: result.hasMore,
        loading,
        error,
        filters,
        updateFilters,
        resetFilters,
        nextPage,
        refetch: () => fetchEvents(filters),
    };
}