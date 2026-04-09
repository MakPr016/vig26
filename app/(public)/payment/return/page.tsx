// app/(public)/payment/return/page.tsx
// Landing page for HDFC SmartGateway redirect after payment.
// HDFC redirects here with the order_id in query params.
// We read the pending registration context from sessionStorage, call verify, then show result.
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { IconCheck, IconAlertCircle, IconLoader2, IconTicket } from "@tabler/icons-react";

type State = "loading" | "success" | "failed" | "error";

function HdfcReturnInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [state, setState] = useState<State>("loading");
    const [errorMsg, setErrorMsg] = useState("");
    const [ticketCount, setTicketCount] = useState(1);
    const [eventTitle, setEventTitle] = useState("");

    useEffect(() => {
        // Juspay/HDFC may use different param names depending on integration version
        const orderId =
            searchParams.get("order_id") ??
            searchParams.get("orderId") ??
            searchParams.get("merchantOrderId") ??
            searchParams.get("merchant_order_id") ??
            "";

        if (!orderId) {
            setState("error");
            setErrorMsg("No order ID found in the return URL. Please contact support.");
            return;
        }

        // Retrieve registration context saved to sessionStorage before the HDFC redirect
        const raw = sessionStorage.getItem("hdfc_pending");
        if (!raw) {
            setState("error");
            setErrorMsg("Registration context not found. If you completed payment, please check your email or contact support with your order ID: " + orderId);
            return;
        }

        let pending: {
            eventId: string;
            eventTitle: string;
            teamMembers: { name: string; email: string }[];
            formResponses: { fieldId: string; value: string }[];
        };

        try {
            pending = JSON.parse(raw);
        } catch {
            setState("error");
            setErrorMsg("Could not read registration context. Contact support with order ID: " + orderId);
            return;
        }

        setEventTitle(pending.eventTitle ?? "");

        // Call verify API
        fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                orderId,
                provider: "hdfc",
                eventId: pending.eventId,
                teamMembers: pending.teamMembers ?? [],
                formResponses: pending.formResponses ?? [],
            }),
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.success) {
                    sessionStorage.removeItem("hdfc_pending");
                    setTicketCount(json.data?.ticketCount ?? 1);
                    setState("success");
                } else {
                    setState("failed");
                    setErrorMsg(json.error ?? "Payment verification failed. Contact support with order ID: " + orderId);
                }
            })
            .catch(() => {
                setState("error");
                setErrorMsg("Network error while verifying payment. Contact support with order ID: " + orderId);
            });
    }, [searchParams]);

    if (state === "loading") {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <IconLoader2 size={36} className="animate-spin text-primary mx-auto" />
                    <p className="text-zinc-600 font-medium">Confirming your payment…</p>
                    <p className="text-sm text-zinc-400">Please do not close this page.</p>
                </div>
            </div>
        );
    }

    if (state === "success") {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
                <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-md w-full text-center space-y-5">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <IconCheck size={32} className="text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900">You&apos;re registered!</h1>
                        <p className="text-sm text-zinc-500 mt-2">
                            {ticketCount > 1
                                ? `${ticketCount} tickets generated and sent via email.`
                                : "Your ticket has been sent to your email. See you at the event!"}
                        </p>
                    </div>
                    {eventTitle && (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left">
                            <p className="text-sm font-semibold text-zinc-900">{eventTitle}</p>
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground text-sm font-semibold rounded-xl transition-colors">
                            <IconTicket size={15} /> View My Tickets
                        </Link>
                        <Link href="/events" className="px-5 py-2.5 border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors">
                            Browse More
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // failed or error
    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
            <div className="bg-white border border-zinc-200 rounded-2xl p-8 max-w-md w-full text-center space-y-5">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <IconAlertCircle size={32} className="text-red-500" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-zinc-900">
                        {state === "failed" ? "Payment not completed" : "Something went wrong"}
                    </h1>
                    <p className="text-sm text-zinc-500 mt-2">{errorMsg}</p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={() => router.back()}
                        className="px-5 py-2.5 bg-primary hover:bg-primary/80 text-primary-foreground text-sm font-semibold rounded-xl transition-colors"
                    >
                        Try Again
                    </button>
                    <Link href="/events" className="px-5 py-2.5 border border-zinc-200 text-zinc-700 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-colors">
                        Browse Events
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function HdfcReturnPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <IconLoader2 size={36} className="animate-spin text-primary" />
            </div>
        }>
            <HdfcReturnInner />
        </Suspense>
    );
}
