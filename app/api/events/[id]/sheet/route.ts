// app/api/events/[id]/sheet/route.ts
// POST   — ensures the event's category has a spreadsheet, adds an event tab,
//          backfills existing confirmed registrations, then links both to the DB.
// PATCH  — re-syncs all confirmed registrations and the Events Overview tab.
// DELETE — unlinks the sheet tab from the event (does not delete the spreadsheet).

import { connectDB } from "@/lib/db";
import { Category, Event, Registration, User } from "@/models";
import { requireAuth, unauthorizedResponse } from "@/lib/auth-helpers";
import { createCategorySpreadsheet, createEventTab, syncAllRegistrationsToSheet, syncCategoryEventsSheet } from "@/lib/sheets";

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

        const user = await User.findById(session.user.id).select("+googleSheetsRefreshToken");
        if (!user?.googleSheetsRefreshToken) {
            return Response.json(
                { error: "Google Sheets not connected. Please connect your Google account first." },
                { status: 400 }
            );
        }

        const refreshToken: string = user.googleSheetsRefreshToken;

        // ── Ensure the category has a spreadsheet ─────────────────────────────
        const category = await Category.findOne({ slug: event.category });
        if (!category) {
            return Response.json({ error: "Event category not found" }, { status: 404 });
        }

        let spreadsheetId: string = (category as any).googleSheetId ?? "";

        if (!spreadsheetId) {
            spreadsheetId = await createCategorySpreadsheet(category.name, refreshToken);
            await Category.findByIdAndUpdate(category._id, {
                googleSheetId: spreadsheetId,
                sheetOwner: session.user.id,
            });
        }

        // ── Create a tab for this event ───────────────────────────────────────
        const maxMembers = event.isTeamEvent ? (event.teamSize?.max ?? 0) : 0;
        const type: string = (event as any).type ?? "";
        const tabTitle = type
            ? `${event.title} (${type.charAt(0).toUpperCase() + type.slice(1)})`
            : event.title;
        const sheetTabName = await createEventTab(
            spreadsheetId,
            tabTitle,
            event.customForm,
            refreshToken,
            maxMembers
        );

        // Persist spreadsheetId and tab name on the event
        await Event.findByIdAndUpdate(id, { googleSheetId: spreadsheetId, sheetTabName });

        // ── Backfill existing confirmed registrations ─────────────────────────
        const existingRegs = await Registration.find({
            eventId: id,
            paymentStatus: { $in: ["completed", "na"] },
        })
            .populate("userId", "name email collegeId")
            .populate("teamMembers.userId", "name email collegeId")
            .lean();

        if (existingRegs.length > 0) {
            await syncAllRegistrationsToSheet(
                spreadsheetId,
                sheetTabName,
                event,
                existingRegs,
                refreshToken
            );
        }

        // Update the Events Overview tab for this category
        const allCategoryEvents = await Event.find({ category: event.category })
            .populate("department", "name").lean();
        await syncCategoryEventsSheet(spreadsheetId, allCategoryEvents, refreshToken).catch(() => {});

        return Response.json({
            success: true,
            sheetId: spreadsheetId,
            sheetTabName,
            sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
        });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        console.error("[events/sheet POST]", err);
        return Response.json({ error: "Failed to create sheet. Check that your Google account is still connected." }, { status: 500 });
    }
}

export async function PATCH(
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

        if (!(event as any).googleSheetId || !(event as any).sheetTabName) {
            return Response.json({ error: "No sheet linked to this event." }, { status: 400 });
        }

        // Prefer category sheet owner's token; fall back to the calling user
        const category = await Category.findOne({ slug: event.category });
        const tokenHolder = (category as any)?.sheetOwner ?? session.user.id;
        const tokenUser = await User.findById(tokenHolder).select("+googleSheetsRefreshToken");
        const refreshToken: string | undefined = (tokenUser as any)?.googleSheetsRefreshToken ?? undefined;

        if (!refreshToken) {
            return Response.json(
                { error: "Google Sheets not connected. Please connect your Google account first." },
                { status: 400 }
            );
        }

        const spreadsheetId: string = (event as any).googleSheetId;
        const sheetTabName: string = (event as any).sheetTabName;

        const existingRegs = await Registration.find({
            eventId: id,
            paymentStatus: { $in: ["completed", "na"] },
        })
            .populate("userId", "name email collegeId")
            .populate("teamMembers.userId", "name email collegeId")
            .lean();

        await syncAllRegistrationsToSheet(spreadsheetId, sheetTabName, event, existingRegs, refreshToken);

        const allCategoryEvents = await Event.find({ category: event.category })
            .populate("department", "name").lean();
        await syncCategoryEventsSheet(spreadsheetId, allCategoryEvents, refreshToken).catch(() => {});

        return Response.json({ success: true, synced: existingRegs.length });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        console.error("[events/sheet PATCH]", err);
        return Response.json({ error: "Sync failed. Check that your Google account is still connected." }, { status: 500 });
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
        await Event.findByIdAndUpdate(id, { googleSheetId: null, sheetTabName: null });
        return Response.json({ success: true });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        return Response.json({ error: "Failed" }, { status: 500 });
    }
}
