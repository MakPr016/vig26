// app/auth/invite/[token]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { IconCircleCheck } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AcceptInvitePage() {
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    // Check if the invited email already has an account — if so, skip
    // the password form and just accept the invite directly.
    const [isExistingUser, setIsExistingUser] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!token) return;

        async function checkInvite() {
            try {
                const res = await fetch(`/api/auth/invite/check?token=${token}`);
                const data = await res.json();
                if (data.userExists) {
                    setIsExistingUser(true);
                }
            } catch {
                // If the check fails, fall through to show the password form
            } finally {
                setChecking(false);
            }
        }

        checkInvite();
    }, [token]);

    // For existing users: just hit the accept endpoint without a password,
    // then redirect straight to sign-in.
    useEffect(() => {
        if (!isExistingUser || checking) return;

        async function acceptForExistingUser() {
            setLoading(true);
            const res = await fetch("/api/auth/invite/accept", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
            const data = await res.json();
            setLoading(false);

            if (!data.success) {
                setError(data.error);
                return;
            }

            setDone(true);
            setTimeout(() => router.push("/manage/login"), 2000);
        }

        acceptForExistingUser();
    }, [isExistingUser, checking, token, router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        const res = await fetch("/api/auth/invite/accept", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password, confirmPassword }),
        });

        const data = await res.json();
        setLoading(false);

        if (!data.success) {
            setError(data.error);
            return;
        }

        setDone(true);
        setTimeout(() => router.push("/manage/login"), 2000);
    }

    if (checking || (isExistingUser && !error)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
                <p className="text-sm text-zinc-500">
                    {done ? "Redirecting you to sign in…" : "Verifying invite…"}
                </p>
            </div>
        );
    }

    if (done) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
                <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm text-center">
                    <div className="flex justify-center mb-4">
                        <IconCircleCheck className="h-12 w-12 text-green-500" />
                    </div>
                    <h1 className="text-xl font-bold text-zinc-900 mb-2">You&apos;re all set!</h1>
                    <p className="text-sm text-zinc-500">
                        Your account has been updated. Redirecting you to sign in…
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
                <div className="mb-6">
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-widest mb-2">
                        Vigyanrang
                    </p>
                    <h1 className="text-2xl font-bold text-zinc-900">Accept Invite</h1>
                    <p className="text-sm text-zinc-500 mt-1">
                        Set a password to activate your account.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button
                        type="submit"
                        className="w-full bg-zinc-900 hover:bg-zinc-700 text-white"
                        disabled={loading}
                    >
                        {loading ? "Activating account…" : "Activate account"}
                    </Button>
                </form>

                <p className="text-center text-sm text-zinc-500 mt-6">
                    Already have an account?{" "}
                    <Link href="/manage/login" className="text-orange-600 font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}