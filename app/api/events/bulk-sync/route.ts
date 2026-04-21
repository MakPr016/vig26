// app/api/events/bulk-sync/route.ts
// POST — re-syncs all confirmed registrations for every published event that has a sheet linked.

import { connectDB } from "@/lib/db";
import { Category, Event, Registration, User } from "@/models";
import { requireAuth, unauthorizedResponse } from "@/lib/auth-helpers";
import { syncAllRegistrationsToSheet, syncCategoryEventsSheet } from "@/lib/sheets";

export async function POST(_req: Request) {
    try {
        const session = await requireAuth();
        await connectDB();

        // Prefer category sheet owner token; fall back to calling user
        const callingUser = await User.findById(session.user.id).select("+googleSheetsRefreshToken");

        // Find all published events that have a sheet linked
        const events = await Event.find({
            status: "published",
            googleSheetId: { $ne: null },
            sheetTabName: { $ne: null },
        }).lean();

        if (events.length === 0) {
            return Response.json({ success: true, synced: 0, message: "No events with sheets to sync." });
        }

        // Build a cache of refresh tokens per category (use sheetOwner if set)
        const tokenCache: Record<string, string> = {};

        async function getTokenForCategory(categorySlug: string): Promise<string | null> {
            if (tokenCache[categorySlug]) return tokenCache[categorySlug];

            const category = await Category.findOne({ slug: categorySlug });
            const tokenHolder = (category as any)?.sheetOwner ?? session.user.id;
            const tokenUser = await User.findById(tokenHolder).select("+googleSheetsRefreshToken");
            const token: string | undefined = (tokenUser as any)?.googleSheetsRefreshToken
                ?? (callingUser as any)?.googleSheetsRefreshToken;

            if (!token) return null;
            tokenCache[categorySlug] = token;
            return token;
        }

        let synced = 0;
        const errors: string[] = [];
        const processedSlugs = new Set<string>();

        for (const event of events) {
            const categorySlug = (event as any).category as string;
            const refreshToken = await getTokenForCategory(categorySlug);

            if (!refreshToken) {
                errors.push(`${(event as any).title}: no Google Sheets token available`);
                continue;
            }

            try {
                const regs = await Registration.find({
                    eventId: (event as any)._id,
                    paymentStatus: { $in: ["completed", "na"] },
                })
                    .populate("userId", "name email collegeId")
                    .populate("teamMembers.userId", "name email collegeId")
                    .lean();

                await syncAllRegistrationsToSheet(
                    (event as any).googleSheetId,
                    (event as any).sheetTabName,
                    event as any,
                    regs,
                    refreshToken
                );

                processedSlugs.add(categorySlug);
                synced++;

                // Small delay to avoid Google API rate limits (60 writes/min)
                await new Promise((r) => setTimeout(r, 1500));
            } catch (err: any) {
                errors.push(`${(event as any).title}: ${err?.message ?? "unknown error"}`);
            }
        }

        // Sync the Events Overview tab for each processed category
        for (const slug of processedSlugs) {
            try {
                const token = tokenCache[slug];
                const category = await Category.findOne({ slug });
                const spreadsheetId = (category as any)?.googleSheetId;
                if (!spreadsheetId || !token) continue;

                const allCatEvents = await Event.find({ category: slug }).populate("department", "name").lean();
                await syncCategoryEventsSheet(spreadsheetId, allCatEvents, token);
                await new Promise((r) => setTimeout(r, 1000));
            } catch (err: any) {
                errors.push(`Overview sync for "${slug}": ${err?.message ?? "unknown error"}`);
            }
        }

        return Response.json({
            success: true,
            synced,
            total: events.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") return unauthorizedResponse();
        console.error("[bulk-sync POST]", err);
        return Response.json({ error: "Failed to sync sheets." }, { status: 500 });
    }
}
