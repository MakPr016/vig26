// app/api/events/[id]/sheet/route.ts
// POST   — creates a new Google Sheet for this event in the admin's Drive.
// DELETE — unlinks the sheet from the event (does not delete the sheet itself).

import { connectDB } from "@/lib/db";
import { Event, Registration, User } from "@/models";
import { requireAuth, unauthorizedResponse } from "@/lib/auth-helpers";
import { createEventSheet, syncAllRegistrationsToSheet } from "@/lib/sheets";

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await requireAuth();
        await connectDB();

        const event = await Event.findById(id);
        if (!event) {
            return Response.json({ error: "Event not found" }, { status: 404 });
        }

        // Fetch the admin's stored refresh token
        const user = await User.findById(session.user.id).select("+googleSheetsRefreshToken");
        if (!user?.googleSheetsRefreshToken) {
            return Response.json(
                { error: "Google Sheets not connected. Please connect your Google account first." },
                { status: 400 }
            );
        }

        const maxMembers = event.isTeamEvent ? (event.teamSize?.max ?? 0) : 0;
        const sheetId = await createEventSheet(
            event.title,
            event.customForm,
            user.googleSheetsRefreshToken,
            maxMembers
        );

        // Store sheetId on the event so the webhook knows where to append
        await Event.findByIdAndUpdate(id, { googleSheetId: sheetId });

        // Backfill all existing confirmed registrations
        const existingRegs = await Registration.find({
            eventId: id,
            paymentStatus: { $in: ["completed", "na"] },
        })
            .populate("userId", "name email collegeId")
            .populate("teamMembers.userId", "name email collegeId")
            .lean();

        if (existingRegs.length > 0) {
            await syncAllRegistrationsToSheet(
                sheetId,
                event,
                existingRegs,
                user.googleSheetsRefreshToken
            );
        }

        return Response.json({
            success: true,
            sheetId,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
        });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        console.error("[events/sheet POST]", err);
        return Response.json({ error: "Failed to create sheet. Check that your Google account is still connected." }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await requireAuth();
        await connectDB();
        await Event.findByIdAndUpdate(id, { googleSheetId: null });
        return Response.json({ success: true });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        return Response.json({ error: "Failed" }, { status: 500 });
    }
}
