// app/api/payment/hdfc-return/route.ts
// HDFC SmartGateway (Juspay) POSTs form data to the return URL after payment.
// This route reads the order_id from the POST body and redirects to the
// client-side return page as a GET request with the order_id as a query param.

import { NextResponse } from "next/server";

/** Extract first clean order_id — handles HDFC appending to an existing param (comma-joined). */
function extractOrderId(raw: string | null): string {
    if (!raw) return "";
    // HDFC may produce "vig_xxx,vig_xxx" if the param already existed — take the first segment.
    return raw.split(",")[0].trim();
}

export async function POST(req: Request) {
    const url = new URL(req.url);

    // HDFC appends order_id as a query param on the return_url even for POST redirects
    let orderId = extractOrderId(
        url.searchParams.get("order_id") ??
        url.searchParams.get("orderId")
    );

    // Fallback: read from form body
    if (!orderId) {
        const contentType = req.headers.get("content-type") ?? "";
        if (contentType.includes("application/x-www-form-urlencoded")) {
            const params = new URLSearchParams(await req.text());
            orderId = extractOrderId(
                params.get("order_id") ??
                params.get("orderId") ??
                params.get("merchantOrderId") ??
                params.get("merchant_order_id")
            );
        } else if (contentType.includes("application/json")) {
            try {
                const json = await req.json();
                orderId = extractOrderId(
                    json.order_id ?? json.orderId ?? json.content?.order?.order_id
                );
            } catch { /* fall through */ }
        }
    }

    // Redirect back on the same domain this request arrived on so the user's
    // session cookie (scoped to that domain) is still valid on /payment/return.
    const base = url.origin || (process.env.NEXT_PUBLIC_APP_URL ?? "");
    const destination = orderId
        ? `${base}/payment/return?order_id=${encodeURIComponent(orderId)}`
        : `${base}/payment/return?error=missing_order_id`;

    return NextResponse.redirect(destination, { status: 303 });
}

// Handle GET redirects too
export async function GET(req: Request) {
    const url = new URL(req.url);
    const orderId = extractOrderId(
        url.searchParams.get("order_id") ??
        url.searchParams.get("orderId")
    );

    const base = url.origin || (process.env.NEXT_PUBLIC_APP_URL ?? "");
    const destination = orderId
        ? `${base}/payment/return?order_id=${encodeURIComponent(orderId)}`
        : `${base}/payment/return?error=missing_order_id`;

    return NextResponse.redirect(destination, { status: 302 });
}
