// app/api/auth/google-sheets/connect/route.ts
// Initiates Google OAuth2 for Sheets/Drive access (management accounts only).
// Redirects the browser to Google's consent screen.

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { requireAuth, unauthorizedResponse } from "@/lib/auth-helpers";

const MANAGEMENT_ROLES = ["coordinator", "dept_admin", "super_admin"];

export async function GET(req: Request) {
    try {
        const session = await requireAuth();

        if (!MANAGEMENT_ROLES.includes(session.user.role)) {
            return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const returnTo = searchParams.get("returnTo") ?? "/manage/events";

        const oauth2 = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-sheets/callback`
        );

        const url = oauth2.generateAuthUrl({
            access_type: "offline",
            prompt: "consent", // force consent every time to ensure we get a refresh_token
            scope: [
                "https://www.googleapis.com/auth/spreadsheets",
                "https://www.googleapis.com/auth/drive.file",
            ],
            state: JSON.stringify({ userId: session.user.id, returnTo }),
        });

        return NextResponse.redirect(url);
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        console.error("[google-sheets/connect]", err);
        return Response.json({ error: "Failed to initiate OAuth" }, { status: 500 });
    }
}
