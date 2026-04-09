// app/api/auth/google-sheets/callback/route.ts
// Handles the Google OAuth2 redirect after the admin grants consent.
// Exchanges the authorization code for tokens and stores the refresh token.

import { NextResponse } from "next/server";
import { google } from "googleapis";
import { connectDB } from "@/lib/db";
import { User } from "@/models";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateRaw = searchParams.get("state") ?? "{}";
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";

    let state: { userId?: string; returnTo?: string };
    try {
        state = JSON.parse(stateRaw);
    } catch {
        state = {};
    }

    const returnTo = state.returnTo ?? "/manage/events";

    if (!code || !state.userId) {
        return NextResponse.redirect(`${base}${returnTo}?sheet_error=oauth_failed`);
    }

    const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${base}/api/auth/google-sheets/callback`
    );

    try {
        const { tokens } = await oauth2.getToken(code);

        if (!tokens.refresh_token) {
            // This happens if the user already granted access before and `prompt=consent`
            // wasn't honoured — shouldn't happen since we force consent, but just in case.
            return NextResponse.redirect(`${base}${returnTo}?sheet_error=no_refresh_token`);
        }

        await connectDB();
        await User.findByIdAndUpdate(state.userId, {
            googleSheetsRefreshToken: tokens.refresh_token,
        });

        return NextResponse.redirect(`${base}${returnTo}?sheet_connected=1`);
    } catch (err) {
        console.error("[google-sheets/callback]", err);
        return NextResponse.redirect(`${base}${returnTo}?sheet_error=token_exchange_failed`);
    }
}
