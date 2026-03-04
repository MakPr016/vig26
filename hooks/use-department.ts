// hooks/use-department.ts
"use client";

import { useState, useEffect } from "react";
import { getDepartment, getDepartmentMembers, getDepartments } from "@/actions/admin";

export function useDepartments() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchDepartments() {
        setLoading(true);
        setError(null);
        try {
            const data = await getDepartments();
            setDepartments(data as any[]);
        } catch (err: any) {
            setError(err.message ?? "Failed to load departments.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDepartments();
    }, []);

    return { departments, loading, error, refetch: fetchDepartments };
}

export function useDepartment(id: string) {
    const [department, setDepartment] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchDepartment() {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const result = await getDepartment(id);
            if (result.success) setDepartment(result.data);
            else setError(result.error ?? "Failed to load department.");
        } catch (err: any) {
            setError(err.message ?? "Failed to load department.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchDepartment();
    }, [id]);

    return { department, loading, error, refetch: fetchDepartment };
}

export function useDepartmentMembers(departmentId: string) {
    const [members, setMembers] = useState<any[]>([]);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    async function fetchMembers() {
        if (!departmentId) return;
        setLoading(true);
        setError(null);
        try {
            const result = await getDepartmentMembers(departmentId);
            if (result.success && result.data) {
                setMembers(result.data.members as any[]);
                setPendingInvites(result.data.pendingInvites as any[]);
            } else {
                setError(result.error ?? "Failed to load members.");
            }
        } catch (err: any) {
            setError(err.message ?? "Failed to load members.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchMembers();
    }, [departmentId]);

    return { members, pendingInvites, loading, error, refetch: fetchMembers };
}