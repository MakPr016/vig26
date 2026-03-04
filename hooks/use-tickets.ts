// hooks/use-tickets.ts
"use client";

import { useState, useEffect } from "react";
import { getMyTickets, getMyRegistrations } from "@/actions/registrations";
import type { ITicket, IRegistration } from "@/types";

export function useMyTickets() {
    const [tickets, setTickets] = useState<ITicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchTickets() {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyTickets();
            setTickets(data);
        } catch (err: any) {
            setError(err.message ?? "Failed to load tickets.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTickets();
    }, []);

    return { tickets, loading, error, refetch: fetchTickets };
}

export function useMyRegistrations() {
    const [registrations, setRegistrations] = useState<IRegistration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchRegistrations() {
        setLoading(true);
        setError(null);
        try {
            const data = await getMyRegistrations();
            setRegistrations(data);
        } catch (err: any) {
            setError(err.message ?? "Failed to load registrations.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchRegistrations();
    }, []);

    return { registrations, loading, error, refetch: fetchRegistrations };
}