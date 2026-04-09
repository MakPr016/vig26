// lib/sheets.ts
// Google Sheets helper using OAuth2 with a stored refresh token.
// No service account or GCP billing required — works with any sheet
// the authorizing Google account has editor access to.
//
// Required env vars (all already present or added once):
//   GOOGLE_CLIENT_ID         — from Google Cloud OAuth2 credentials
//   GOOGLE_CLIENT_SECRET     — from Google Cloud OAuth2 credentials
//   GOOGLE_REFRESH_TOKEN     — generated once via OAuth2 Playground

import { google } from "googleapis";
import type { IEvent } from "@/types";

function getAuth(refreshToken?: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const token = refreshToken ?? process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !token) {
        throw new Error(
            "Missing Google OAuth credentials. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN are set in .env.local"
        );
    }

    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    oauth2.setCredentials({ refresh_token: token });
    return oauth2;
}

function buildHeaders(customForm: IEvent["customForm"], maxMembers = 0): string[] {
    const memberCols: string[] = [];
    for (let i = 1; i <= maxMembers; i++) {
        memberCols.push(`Member ${i} Name`, `Member ${i} Email`, `Member ${i} College ID`);
    }
    return [
        "Registration ID",
        "Name",
        "Email",
        "College ID",
        "Type",
        "Team ID",
        "Team Size",
        "Status",
        "Payment Status",
        "Registered At",
        ...customForm.map((f) => f.label),
        ...memberCols,
    ];
}

function buildRow(reg: any, customForm: IEvent["customForm"], maxMembers = 0): string[] {
    const responseMap: Record<string, string> = {};
    for (const r of reg.formResponses ?? []) {
        responseMap[r.fieldId] = String(r.value ?? "");
    }

    const members: any[] = reg.teamMembers ?? [];
    const memberCells: string[] = [];
    for (let i = 0; i < maxMembers; i++) {
        memberCells.push(
            members[i]?.name ?? "",
            members[i]?.email ?? "",
            (members[i] as any)?.userId?.collegeId ?? ""
        );
    }

    return [
        String(reg._id),
        reg.userId?.name ?? "—",
        reg.userId?.email ?? "—",
        reg.userId?.collegeId ?? "—",
        reg.isTeamRegistration ? "Team" : "Individual",
        reg.teamId ?? "—",
        reg.isTeamRegistration ? String(members.length + 1) : "1",
        reg.status,
        reg.paymentStatus,
        new Date(reg.createdAt).toLocaleString("en-IN"),
        ...customForm.map((f) => responseMap[String(f._id)] ?? ""),
        ...memberCells,
    ];
}

/**
 * Creates a new Google Sheet for the event in the authorizing user's Drive,
 * writes the header row, and returns the spreadsheet ID.
 */
export async function createEventSheet(
    eventTitle: string,
    customForm: IEvent["customForm"],
    refreshToken?: string,
    maxMembers = 0
): Promise<string> {
    const auth = getAuth(refreshToken);
    const sheets = google.sheets({ version: "v4", auth });
    const drive = google.drive({ version: "v3", auth });

    const created = await sheets.spreadsheets.create({
        requestBody: {
            properties: { title: `Registrations — ${eventTitle}` },
        },
    });

    const spreadsheetId = created.data.spreadsheetId!;

    // Make the sheet publicly readable (anyone with the link can view)
    await drive.permissions.create({
        fileId: spreadsheetId,
        requestBody: { role: "reader", type: "anyone" },
    });

    // Write header row
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [buildHeaders(customForm, maxMembers)] },
    });

    return spreadsheetId;
}

/**
 * Appends a single registration row to the sheet.
 * Called from the Cashfree webhook after payment confirmation.
 */
export async function appendRegistrationRow(
    sheetId: string,
    event: IEvent,
    reg: any,
    refreshToken?: string
): Promise<void> {
    const auth = getAuth(refreshToken);
    const sheets = google.sheets({ version: "v4", auth });
    const maxMembers = event.isTeamEvent ? (event.teamSize?.max ?? 0) : 0;

    const existing = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: "A1:A1",
    });

    const rows: string[][] = [];
    if ((existing.data.values?.length ?? 0) === 0) {
        rows.push(buildHeaders(event.customForm ?? [], maxMembers));
    }
    rows.push(buildRow(reg, event.customForm ?? [], maxMembers));

    await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: rows },
    });
}

/**
 * Replaces the entire sheet with all current registrations.
 * Called from the manual "Sync Now" button.
 */
export async function syncAllRegistrationsToSheet(
    sheetId: string,
    event: IEvent,
    registrations: any[],
    refreshToken?: string
): Promise<void> {
    const auth = getAuth(refreshToken);
    const sheets = google.sheets({ version: "v4", auth });
    const maxMembers = event.isTeamEvent ? (event.teamSize?.max ?? 0) : 0;

    const rows: string[][] = [
        buildHeaders(event.customForm ?? [], maxMembers),
        ...registrations.map((r) => buildRow(r, event.customForm ?? [], maxMembers)),
    ];

    await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetId,
        range: "A:Z",
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows },
    });
}
