import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserRole } from "@/types";

const MANAGEMENT_ROLES: UserRole[] = ["coordinator", "dept_admin", "super_admin"];

export default withAuth(
    function middleware(req) {
        const { pathname } = req.nextUrl;
        const token = req.nextauth.token;
        const role = token?.role as UserRole | undefined;

        // ── /manage/* — requires management role ──────────────────────────────
        if (pathname.startsWith("/manage")) {
            // Skip the login page itself
            if (pathname === "/manage/login") return NextResponse.next();

            if (!token) {
                const loginUrl = new URL("/manage/login", req.url);
                loginUrl.searchParams.set("callbackUrl", pathname);
                return NextResponse.redirect(loginUrl);
            }

            if (!role || !MANAGEMENT_ROLES.includes(role)) {
                // Authenticated but wrong role (e.g. student hitting /manage)
                return NextResponse.redirect(new URL("/auth/login?error=Unauthorized", req.url));
            }
        }

        // ── /dashboard, /checkout — requires any authenticated user ───────────
        if (pathname.startsWith("/dashboard") || pathname.startsWith("/checkout")) {
            if (!token) {
                const loginUrl = new URL("/auth/login", req.url);
                loginUrl.searchParams.set("callbackUrl", pathname);
                return NextResponse.redirect(loginUrl);
            }
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            // Let the middleware function above handle all logic
            // Return true to run the middleware, false to skip it
            authorized: () => true,
        },
    }
);

export const config = {
    matcher: [
        "/manage/:path*",
        "/dashboard/:path*",
        "/checkout/:path*",
    ],
};