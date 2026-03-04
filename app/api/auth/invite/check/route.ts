// app/api/auth/invite/check/route.ts
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { User, Invite } from "@/models";
import { isExpired } from "@/lib/utils";

export async function GET(req: NextRequest) {
    try {
        const token = req.nextUrl.searchParams.get("token");

        if (!token) {
            return Response.json(
                { success: false, error: "Token is required." },
                { status: 400 }
            );
        }

        await connectDB();

        const invite = await Invite.findOne({ token, status: "pending" });

        if (!invite) {
            return Response.json(
                { success: false, error: "Invalid or already used invite link." },
                { status: 400 }
            );
        }

        if (isExpired(invite.expiresAt)) {
            return Response.json(
                { success: false, error: "This invite link has expired." },
                { status: 400 }
            );
        }

        const existing = await User.findOne({ email: invite.email }).lean();

        return Response.json({ success: true, userExists: !!existing });
    } catch (err) {
        console.error("[invite/check]", err);
        return Response.json(
            { success: false, error: "Something went wrong." },
            { status: 500 }
        );
    }
}