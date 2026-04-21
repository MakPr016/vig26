// app/manage/(panel)/categories/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getCategories, createCategory, deleteCategory, renameCategory, getEventsWithoutSheets } from "@/actions/events";
import { toast } from "sonner";
import { IconPlus, IconTrash, IconTag, IconLock, IconPencil, IconCheck, IconX, IconTableFilled, IconExternalLink, IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ManageCategoriesPage() {
    const { data: session } = useSession();
    const isSuperAdmin = session?.user?.role === "super_admin";

    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [creating, setCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const [sheetsConnected, setSheetsConnected] = useState<boolean | null>(null);
    const [bulkCreating, setBulkCreating] = useState(false);
    const [bulkResult, setBulkResult] = useState<{ created: number; total: number; errors?: string[] } | null>(null);
    const [bulkSyncing, setBulkSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ synced: number; total: number; errors?: string[] } | null>(null);
    const [eventsWithoutSheets, setEventsWithoutSheets] = useState<any[]>([]);

    async function load() {
        setLoading(true);
        const [cats, missing] = await Promise.all([
            getCategories(),
            getEventsWithoutSheets(),
        ]);
        setCategories(cats as any[]);
        setEventsWithoutSheets(missing as any[]);
        setLoading(false);
    }

    useEffect(() => { load(); }, []);

    useEffect(() => {
        fetch("/api/auth/google-sheets/status")
            .then((r) => r.json())
            .then((d) => setSheetsConnected(d.connected ?? false))
            .catch(() => setSheetsConnected(false));
    }, []);

    async function handleBulkCreateSheets() {
        setBulkResult(null);
        setBulkCreating(true);
        try {
            const res = await fetch("/api/events/bulk-sheets", { method: "POST" });
            const json = await res.json();
            if (!res.ok || !json.success) {
                toast.error(json.error ?? "Failed to create sheets.");
            } else {
                setBulkResult({ created: json.created, total: json.total, errors: json.errors });
                if (json.created > 0) {
                    toast.success(`Created sheets for ${json.created} event${json.created !== 1 ? "s" : ""}.`);
                } else {
                    toast.info(json.message ?? "No new sheets to create.");
                }
                load(); // refresh to show updated googleSheetId on categories
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setBulkCreating(false);
        }
    }

    async function handleBulkSyncSheets() {
        setSyncResult(null);
        setBulkSyncing(true);
        try {
            const res = await fetch("/api/events/bulk-sync", { method: "POST" });
            const json = await res.json();
            if (!res.ok || !json.success) {
                toast.error(json.error ?? "Failed to sync sheets.");
            } else {
                setSyncResult({ synced: json.synced, total: json.total, errors: json.errors });
                if (json.synced > 0) {
                    toast.success(`Synced ${json.synced} of ${json.total} event sheets.`);
                } else {
                    toast.info(json.message ?? "No sheets to sync.");
                }
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setBulkSyncing(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        const result = await createCategory(newName.trim());
        setCreating(false);
        if (result.success) {
            toast.success(`Category "${newName.trim()}" created.`);
            setNewName("");
            load();
        } else {
            toast.error(result.error ?? "Failed to create category.");
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Delete category "${name}"? This may affect existing events.`)) return;
        setDeletingId(id);
        const result = await deleteCategory(id);
        setDeletingId(null);
        if (result.success) {
            toast.success(`Category "${name}" deleted.`);
            setCategories((prev) => prev.filter((c) => c._id !== id));
        } else {
            toast.error(result.error ?? "Failed to delete category.");
        }
    }

    function startEdit(cat: any) {
        setEditingId(cat._id);
        setEditName(cat.name);
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName("");
    }

    async function handleRename(id: string) {
        if (!editName.trim()) return;
        setSavingId(id);
        const result = await renameCategory(id, editName.trim());
        setSavingId(null);
        if (result.success) {
            toast.success("Category renamed.");
            setEditingId(null);
            load();
        } else {
            toast.error(result.error ?? "Failed to rename category.");
        }
    }

    const defaults = categories.filter((c) => c.isDefault);
    const custom = categories.filter((c) => !c.isDefault);

    function CategoryRow({ cat }: { cat: any }) {
        const isEditing = editingId === cat._id;
        return (
            <div key={cat._id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-50 transition-colors">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.isDefault ? "bg-zinc-100" : "bg-orange-50"}`}>
                    <IconTag size={14} className={cat.isDefault ? "text-zinc-400" : "text-orange-400"} />
                </div>
                {isEditing ? (
                    <div className="flex-1 flex items-center gap-2">
                        <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleRename(cat._id); if (e.key === "Escape") cancelEdit(); }}
                            autoFocus
                            className="h-8 text-sm"
                        />
                        <button
                            onClick={() => handleRename(cat._id)}
                            disabled={savingId === cat._id || !editName.trim()}
                            className="p-1.5 text-zinc-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <IconCheck size={15} />
                        </button>
                        <button
                            onClick={cancelEdit}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                            <IconX size={15} />
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 capitalize">{cat.name}</p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-zinc-400 font-mono">{cat.slug}</p>
                            {cat.googleSheetId && (
                                <a
                                    href={`https://docs.google.com/spreadsheets/d/${cat.googleSheetId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-green-600 hover:underline flex items-center gap-0.5"
                                >
                                    Sheet <IconExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    </div>
                )}
                {!isEditing && (
                    <div className="flex items-center gap-1">
                        {cat.isDefault && !isSuperAdmin && (
                            <span className="text-xs bg-zinc-100 text-zinc-400 px-2 py-0.5 rounded-full">Default</span>
                        )}
                        {isSuperAdmin && (
                            <>
                                <button
                                    onClick={() => startEdit(cat)}
                                    className="p-1.5 text-zinc-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Rename"
                                >
                                    <IconPencil size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat._id, cat.name)}
                                    disabled={deletingId === cat._id}
                                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                    title="Delete"
                                >
                                    <IconTrash size={15} />
                                </button>
                            </>
                        )}
                        {!isSuperAdmin && !cat.isDefault && (
                            <button
                                onClick={() => handleDelete(cat._id, cat.name)}
                                disabled={deletingId === cat._id}
                                className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <IconTrash size={15} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Categories</h1>
                <p className="text-sm text-zinc-500 mt-0.5">
                    Manage event categories.{!isSuperAdmin && " Default categories cannot be deleted."}
                </p>
            </div>

            {/* Bulk Google Sheets */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
                            <IconTableFilled size={15} className="text-green-600" />
                            Google Sheets
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">
                            Creates one spreadsheet per category with a tab for each published event.
                            Existing sheets are reused — only missing tabs are added.
                        </p>
                        {bulkResult && (
                            <div className="mt-2 text-xs text-zinc-600">
                                {bulkResult.created > 0
                                    ? <span className="text-green-700 font-medium">✓ Created {bulkResult.created} of {bulkResult.total} sheets.</span>
                                    : <span>All published events already have sheets.</span>
                                }
                                {bulkResult.errors && bulkResult.errors.length > 0 && (
                                    <ul className="mt-1 text-red-500 space-y-0.5">
                                        {bulkResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                        {syncResult && (
                            <div className="mt-2 text-xs text-zinc-600">
                                {syncResult.synced > 0
                                    ? <span className="text-blue-700 font-medium">✓ Synced {syncResult.synced} of {syncResult.total} event sheets.</span>
                                    : <span>No event sheets to sync.</span>
                                }
                                {syncResult.errors && syncResult.errors.length > 0 && (
                                    <ul className="mt-1 text-red-500 space-y-0.5">
                                        {syncResult.errors.map((e, i) => <li key={i}>• {e}</li>)}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        {sheetsConnected === false && (
                            <a
                                href="/api/auth/google-sheets/connect"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                                Connect Google <IconExternalLink size={11} />
                            </a>
                        )}
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleBulkCreateSheets}
                                disabled={bulkCreating || bulkSyncing || sheetsConnected === false}
                                className="bg-green-700 hover:bg-green-800 text-white text-xs h-8 px-3"
                                title={sheetsConnected === false ? "Connect your Google account first" : undefined}
                            >
                                <IconTableFilled size={14} className="mr-1.5" />
                                {bulkCreating ? "Creating…" : "Create All Sheets"}
                            </Button>
                            <Button
                                onClick={handleBulkSyncSheets}
                                disabled={bulkSyncing || bulkCreating || sheetsConnected === false}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-3"
                                title={sheetsConnected === false ? "Connect your Google account first" : "Re-sync all registrations to existing sheets"}
                            >
                                <IconRefresh size={14} className={`mr-1.5 ${bulkSyncing ? "animate-spin" : ""}`} />
                                {bulkSyncing ? "Syncing…" : "Sync All Sheets"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Events without sheets */}
            {eventsWithoutSheets.length > 0 && (
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                    <div className="flex items-start gap-3">
                        <IconAlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-semibold text-amber-900">
                                {eventsWithoutSheets.length} published event{eventsWithoutSheets.length !== 1 ? "s" : ""} without a sheet
                            </h2>
                            <p className="text-xs text-amber-700 mt-0.5 mb-3">
                                These events are published but don&apos;t have a Google Sheet tab linked. Use &quot;Create All Sheets&quot; to generate them.
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {eventsWithoutSheets.map((ev) => (
                                    <span
                                        key={ev._id}
                                        className="inline-flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 text-xs px-2 py-1 rounded-lg"
                                    >
                                        <span className="capitalize text-amber-500 font-medium">{ev.category}</span>
                                        <span className="text-amber-300">·</span>
                                        {ev.title}{ev.type ? <span className="text-amber-600 ml-0.5">({ev.type})</span> : null}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Category */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <h2 className="text-sm font-semibold text-zinc-900 mb-3">Add Custom Category</h2>
                <form onSubmit={handleCreate} className="flex gap-3">
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Robotics"
                        className="flex-1"
                    />
                    <Button type="submit" disabled={creating || !newName.trim()} className="bg-zinc-900 hover:bg-zinc-700 text-white shrink-0">
                        <IconPlus size={16} className="mr-1.5" />
                        {creating ? "Adding…" : "Add"}
                    </Button>
                </form>
                <p className="text-xs text-zinc-400 mt-2">
                    The slug will be auto-generated from the name (e.g. &quot;Robotics&quot; → &quot;robotics&quot;).
                </p>
            </div>

            {/* Default categories */}
            <div className="bg-white rounded-xl border border-zinc-200">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
                    <IconLock size={15} className="text-zinc-400" />
                    <h2 className="text-sm font-semibold text-zinc-900">Default Categories</h2>
                    {!isSuperAdmin && <span className="text-xs text-zinc-400 ml-1">Cannot be deleted</span>}
                </div>
                {loading ? (
                    <div className="p-5 space-y-2">
                        {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-zinc-100 rounded-lg animate-pulse" />)}
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {defaults.map((cat) => <CategoryRow key={cat._id} cat={cat} />)}
                    </div>
                )}
            </div>

            {/* Custom categories */}
            {(custom.length > 0 || !loading) && (
                <div className="bg-white rounded-xl border border-zinc-200">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100">
                        <IconTag size={15} className="text-zinc-400" />
                        <h2 className="text-sm font-semibold text-zinc-900">Custom Categories</h2>
                        <span className="text-xs text-zinc-400 ml-1">({custom.length})</span>
                    </div>
                    {custom.length === 0 ? (
                        <div className="px-5 py-8 text-center text-sm text-zinc-400">
                            No custom categories yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {custom.map((cat) => <CategoryRow key={cat._id} cat={cat} />)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
