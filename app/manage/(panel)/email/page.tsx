"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { IconMail, IconSend, IconLoader2, IconCircleCheck } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Loaded dynamically to avoid SSR issues with CodeMirror
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export default function SendEmailPage() {
    const { data: session, status } = useSession();

    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    if (status === "loading") return null;
    if (!session || session.user.role !== "super_admin") {
        redirect("/manage/dashboard");
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!body.trim()) { toast.error("Body is required."); return; }
        setSending(true);
        setSent(false);

        try {
            const res = await fetch("/api/admin/send-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to, subject, body }),
            });
            const json = await res.json();
            if (json.success) {
                toast.success("Email sent successfully.");
                setSent(true);
                setTo("");
                setSubject("");
                setBody("");
            } else {
                toast.error(json.error ?? "Failed to send email.");
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-zinc-900">Send Email</h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Compose and send a custom email via Resend.
                </p>
            </div>

            <form onSubmit={handleSend} className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
                <div>
                    <Label htmlFor="to">To</Label>
                    <Input
                        id="to"
                        type="email"
                        placeholder="recipient@example.com"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        required
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                        id="subject"
                        type="text"
                        placeholder="Email subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label>Body</Label>
                    <div className="mt-1" data-color-mode="light">
                        <MDEditor
                            value={body}
                            onChange={(v) => setBody(v ?? "")}
                            height={360}
                            preview="live"
                        />
                    </div>
                    <p className="text-xs text-zinc-400 mt-1.5">
                        Supports Markdown — **bold**, *italic*, # headings, [links](url), ![images](url), lists, etc.
                    </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                    {sent && (
                        <span className="flex items-center gap-1.5 text-sm text-green-600">
                            <IconCircleCheck size={16} /> Sent
                        </span>
                    )}
                    <Button
                        type="submit"
                        disabled={sending}
                        className="ml-auto bg-zinc-900 hover:bg-zinc-700 text-white"
                    >
                        {sending ? (
                            <><IconLoader2 size={15} className="mr-1.5 animate-spin" /> Sending…</>
                        ) : (
                            <><IconSend size={15} className="mr-1.5" /> Send Email</>
                        )}
                    </Button>
                </div>
            </form>

            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                    <IconMail size={16} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div className="text-xs text-zinc-500 space-y-1">
                        <p>Emails are sent from <strong>Vigyaanrang</strong> via Resend using the configured domain.</p>
                        <p>The body is rendered as HTML inside the standard Vigyaanrang email template.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
