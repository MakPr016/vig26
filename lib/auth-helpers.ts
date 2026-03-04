import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";
import type { UserRole } from "@/types";

// ─── Get session in Server Components / API Routes ────────────────────────────

export async function getSession(): Promise<Session | null> {
    return getServerSession(authOptions);
}

// ─── Get session and throw if unauthenticated ─────────────────────────────────

export async function requireAuth(): Promise<Session> {
    const session = await getSession();
    if (!session?.user) {
        throw new Error("UNAUTHORIZED");
    }
    return session;
}

// ─── Require a specific role (or one of multiple roles) ──────────────────────

export async function requireRole(
    allowed: UserRole | UserRole[]
): Promise<Session> {
    const session = await requireAuth();
    const roles = Array.isArray(allowed) ? allowed : [allowed];

    if (!roles.includes(session.user.role)) {
        throw new Error("FORBIDDEN");
    }

    return session;
}

// ─── Require management role (any of the three) ───────────────────────────────

export async function requireManagement(): Promise<Session> {
    return requireRole(["coordinator", "dept_admin", "super_admin"]);
}

// ─── Require super admin ──────────────────────────────────────────────────────

export async function requireSuperAdmin(): Promise<Session> {
    return requireRole("super_admin");
}

// ─── Check if the current user belongs to a department ───────────────────────

export async function requireDepartmentAccess(departmentId: string): Promise<Session> {
    const session = await requireManagement();

    // Super admin has access to all departments
    if (session.user.role === "super_admin") return session;

    if (!session.user.departments.includes(departmentId)) {
        throw new Error("FORBIDDEN");
    }

    return session;
}

// ─── Role helpers (use in Server Components) ─────────────────────────────────

export function isManagement(role?: UserRole): boolean {
    if (!role) return false;
    return ["coordinator", "dept_admin", "super_admin"].includes(role);
}

export function isSuperAdmin(role?: UserRole): boolean {
    return role === "super_admin";
}

export function isDeptAdmin(role?: UserRole): boolean {
    return role === "dept_admin" || role === "super_admin";
}

// ─── Standard error responses for API routes ─────────────────────────────────

export function unauthorizedResponse() {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export function forbiddenResponse() {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 });
}

/**
 * Wrap an API handler with auth error handling.
 * Usage:
 *   export const POST = withAuthErrors(async (req) => { ... });
 */
export function withAuthErrors(
    handler: (req: Request) => Promise<Response>
) {
    return async (req: Request): Promise<Response> => {
        try {
            return await handler(req);
        } catch (err: any) {
            if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
            if (err.message === "FORBIDDEN") return forbiddenResponse();
            throw err;
        }
    };
}