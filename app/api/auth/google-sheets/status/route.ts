// app/api/auth/google-sheets/status/route.ts
// GET  — returns whether the current admin has Google Sheets connected.
// DELETE — removes the stored refresh token (disconnect).

import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { requireAuth, unauthorizedResponse } from "@/lib/auth-helpers";

export async function GET() {
    try {
        const session = await requireAuth();
        await connectDB();
        const user = await User.findById(session.user.id).select("+googleSheetsRefreshToken");
        return Response.json({ connected: Boolean(user?.googleSheetsRefreshToken) });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        return Response.json({ error: "Failed" }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await requireAuth();
        await connectDB();
        await User.findByIdAndUpdate(session.user.id, { googleSheetsRefreshToken: null });
        return Response.json({ success: true });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        return Response.json({ error: "Failed" }, { status: 500 });
    }
}
