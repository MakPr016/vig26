// hooks/use-manage-events.ts
"use client";

import { useState, useEffect } from "react";
import { getManageEvents } from "@/actions/events";
import type { IEvent } from "@/types";

export function useManageEvents(departmentId?: string, status?: string) {
    const [events, setEvents] = useState<IEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchEvents() {
        setLoading(true);
        setError(null);
        try {
            const data = await getManageEvents(departmentId, status);
            setEvents(data);
        } catch (err: any) {
            setError(err.message ?? "Failed to load events.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchEvents();
    }, [departmentId, status]);

    const byStatus = (s: string) => events.filter((e) => e.status === s);

    return {
        events,
        drafts: byStatus("draft"),
        published: byStatus("published"),
        cancelled: byStatus("cancelled"),
        loading,
        error,
        refetch: fetchEvents,
    };
}