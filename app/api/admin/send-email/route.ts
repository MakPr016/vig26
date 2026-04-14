// app/api/admin/send-email/route.ts
// Super-admin only: send a custom email via Resend.

import { requireSuperAdmin, unauthorizedResponse } from "@/lib/auth-helpers";
import { Resend } from "resend";
import { marked } from "marked";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = "Vigyaanrang <vigyanrang@orbit.tripodhub.in>";

export async function POST(req: Request) {
    try {
        await requireSuperAdmin();
    } catch {
        return unauthorizedResponse();
    }

    let body: { to?: string; subject?: string; body?: string };
    try {
        body = await req.json();
    } catch {
        return Response.json({ success: false, error: "Invalid JSON." }, { status: 400 });
    }

    const { to, subject, body: emailBody } = body;

    if (!to || typeof to !== "string" || !to.includes("@")) {
        return Response.json({ success: false, error: "A valid recipient email is required." }, { status: 400 });
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
        return Response.json({ success: false, error: "Subject is required." }, { status: 400 });
    }
    if (!emailBody || typeof emailBody !== "string" || !emailBody.trim()) {
        return Response.json({ success: false, error: "Body is required." }, { status: 400 });
    }

    // Convert Markdown to HTML
    const htmlBody = await marked(emailBody, { breaks: true });

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

    const { error } = await resend.emails.send({
        from: FROM,
        to: to.trim(),
        subject: subject.trim(),
        html: `
            <div style="background-color: #f9fafb; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
                    <h2 style="color: #D97706; margin-top: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">Vigyaanrang</h2>
                    <div style="height: 1px; background-color: #f3f4f6; margin: 24px 0;"></div>
                    <div style="font-size: 15px; line-height: 26px; color: #374151;">
                        ${htmlBody}
                    </div>
                </div>
                <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
                    Sent by <a href="${APP_URL}" style="color: #9ca3af; text-decoration: underline;">Vigyaanrang</a>
                </p>
            </div>
        `,
    });

    if (error) {
        console.error("[send-email] Resend error:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
}
