// components/manage/image-upload.tsx
"use client";

import { useState, useRef } from "react";
import { IconUpload, IconTrash, IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";

interface ImageUploadProps {
    value: string | null;          // current URL (from DB or fresh upload)
    onChange: (url: string | null) => void;
    folder?: "event-covers" | "dept-logos" | "form-uploads";
    label?: string;
    height?: string;
}

export function ImageUpload({
    value,
    onChange,
    folder = "event-covers",
    label = "Click to upload image",
    height = "h-40",
}: ImageUploadProps) {
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            toast.error("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large. Maximum size is 5MB.");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", folder);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!data.success) {
                toast.error(data.error ?? "Upload failed.");
                return;
            }

            onChange(data.url);
        } catch {
            toast.error("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset input so same file can be re-selected
        e.target.value = "";
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
    }

    if (value) {
        return (
            <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-zinc-200`}>
                <img src={value} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                            if (inputRef.current) inputRef.current.value = "";
                        }}
                        className="p-2 bg-white rounded-lg border border-zinc-200 shadow text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <IconTrash size={16} />
                    </button>
                </div>
                {/* Always-visible remove button */}
                <button
                    type="button"
                    onClick={() => {
                        onChange(null);
                        if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-lg border border-zinc-200 text-zinc-500 hover:text-red-500 shadow-sm transition-colors"
                >
                    <IconTrash size={14} />
                </button>
            </div>
        );
    }

    return (
        <label
            className={`flex flex-col items-center justify-center w-full ${height} border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading
                    ? "border-orange-300 bg-orange-50/30"
                    : "border-zinc-200 hover:border-orange-300 hover:bg-orange-50/30"
                }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {uploading ? (
                <>
                    <IconLoader2 size={22} className="text-orange-400 animate-spin mb-2" />
                    <span className="text-sm text-orange-500 font-medium">Uploading…</span>
                </>
            ) : (
                <>
                    <IconUpload size={22} className="text-zinc-300 mb-2" />
                    <span className="text-sm text-zinc-400">{label}</span>
                    <span className="text-xs text-zinc-300 mt-1">JPEG, PNG, WebP or GIF · Max 5MB</span>
                </>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleChange}
                disabled={uploading}
            />
        </label>
    );
}