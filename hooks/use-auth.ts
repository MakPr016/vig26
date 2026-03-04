// hooks/use-auth.ts
"use client";

import { useSession, signOut } from "next-auth/react";
import type { UserRole } from "@/types";

export function useAuth() {
    const { data: session, status, update } = useSession();

    const user = session?.user;
    const role = user?.role as UserRole | undefined;

    const isAuthenticated = status === "authenticated";
    const isLoading = status === "loading";

    const isStudent = role === "student";
    const isCoordinator = role === "coordinator";
    const isDeptAdmin = role === "dept_admin";
    const isSuperAdmin = role === "super_admin";
    const isManagement = isCoordinator || isDeptAdmin || isSuperAdmin;

    function hasAccessToDepartment(departmentId: string): boolean {
        if (isSuperAdmin) return true;
        return user?.departments?.includes(departmentId) ?? false;
    }

    function logout(callbackUrl = "/") {
        signOut({ callbackUrl });
    }

    return {
        user,
        role,
        status,
        isAuthenticated,
        isLoading,
        isStudent,
        isCoordinator,
        isDeptAdmin,
        isSuperAdmin,
        isManagement,
        hasAccessToDepartment,
        logout,
        update,
    };
}