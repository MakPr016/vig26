// app/api/payment/create-order/route.ts
import { connectDB } from "@/lib/db";
import { Event, Registration, User } from "@/models";
import { createCashfreeOrder } from "@/lib/cashfree";
import { createHdfcOrder } from "@/lib/hdfc";
import { requireAuth, unauthorizedResponse } from "@/lib/auth-helpers";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: Request) {
    // 20 order-creation attempts per IP per 10 minutes
    if (!await checkRateLimit(`create-order:${getClientIp(req)}`, 20, 10 * 60 * 1000)) {
        return rateLimitResponse(60);
    }

    try {
        const session = await requireAuth();

        const body = await req.json();
        const { eventId, provider = "cashfree", teamSize } = body;

        if (!eventId || typeof eventId !== "string") {
            return Response.json(
                { success: false, error: "eventId is required." },
                { status: 400 }
            );
        }

        await connectDB();

        // ── Validate event ─────────────────────────────────────────────────────
        const event = await Event.findById(eventId).lean();

        if (!event) {
            return Response.json(
                { success: false, error: "Event not found." },
                { status: 404 }
            );
        }

        if (event.status !== "published") {
            return Response.json(
                { success: false, error: "This event is not open for registration." },
                { status: 400 }
            );
        }

        if (event.registrationsClosed) {
            return Response.json(
                { success: false, error: "Registrations for this event are closed." },
                { status: 400 }
            );
        }

        if (event.price === 0) {
            return Response.json(
                { success: false, error: "This event is free. No payment required." },
                { status: 400 }
            );
        }

        // ── Compute charge amount (per-person pricing for team events) ──────────
        let chargeAmount = event.price;
        if ((event as any).pricePerPerson && event.isTeamEvent && typeof teamSize === "number" && teamSize >= 1) {
            const clampedSize = Math.min(Math.max(teamSize, event.teamSize?.min ?? 1), event.teamSize?.max ?? teamSize);
            chargeAmount = event.price * clampedSize;
        }

        // ── Capacity check ─────────────────────────────────────────────────────
        if (event.capacity > 0 && event.registrationCount >= event.capacity) {
            return Response.json(
                { success: false, error: "This event is fully booked." },
                { status: 400 }
            );
        }

        // ── Duplicate registration check ───────────────────────────────────────
        const existing = await Registration.findOne({
            eventId,
            userId: session.user.id,
        }).lean();

        if (existing) {
            return Response.json(
                { success: false, error: "You are already registered for this event." },
                { status: 400 }
            );
        }

        // ── Fetch user details needed by the payment provider ─────────────────
        const user = await User.findById(session.user.id).select("name email").lean();

        // Order ID: unique per attempt (timestamp suffix handles retries)
        const orderId = `vig_${session.user.id.toString().slice(-10)}_${Date.now().toString(36)}`;

        if (provider === "hdfc") {
            // ── Create HDFC SmartGateway order ─────────────────────────────────
            // Derive origin from the request so the return URL stays on the same
            // domain the user is on (handles vigyaanrang.atria.edu.in vs vercel.app).
            const reqOrigin =
                req.headers.get("origin") ??
                (() => {
                    const h = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
                    const proto = req.headers.get("x-forwarded-proto") ?? "https";
                    return h ? `${proto}://${h}` : (process.env.NEXT_PUBLIC_APP_URL ?? "");
                })();
            const returnUrl = `${reqOrigin}/api/payment/hdfc-return`;
            const order = await createHdfcOrder({
                orderId,
                amount: chargeAmount,
                customerId: session.user.id,
                customerEmail: (user as any)?.email ?? "noreply@vigyanrang.in",
                returnUrl,
                orderNote: event.title,
            });

            return Response.json({
                success: true,
                data: {
                    provider: "hdfc",
                    orderId: order.order_id,
                    paymentLink: order.payment_link,
                    amount: chargeAmount,
                },
            });
        }

        // ── Create Cashfree order (default) ────────────────────────────────────
        const order = await createCashfreeOrder({
            orderId,
            amount: chargeAmount,
            customerId: session.user.id,
            customerName: (user as any)?.name ?? "Customer",
            customerEmail: (user as any)?.email ?? "noreply@vigyanrang.in",
            orderNote: event.title,
        });

        return Response.json({
            success: true,
            data: {
                provider: "cashfree",
                orderId: order.order_id,
                paymentSessionId: order.payment_session_id,
                amount: chargeAmount,
            },
        });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") {
            return unauthorizedResponse();
        }
        console.error("[payment/create-order]", err);
        return Response.json(
            { success: false, error: "Failed to create payment order. Please try again." },
            { status: 500 }
        );
    }
}
