// app/api/upload/route.ts
import { requireManagement } from "@/lib/auth-helpers";
import { uploadFile } from "@/lib/cloudinary";

export async function POST(req: Request) {
    try {
        await requireManagement();

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const folder = (formData.get("folder") as string | null) ?? "event-covers";

        if (!file || file.size === 0) {
            return Response.json({ success: false, error: "No file provided." }, { status: 400 });
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            return Response.json(
                { success: false, error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed." },
                { status: 400 }
            );
        }

        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
            return Response.json(
                { success: false, error: "File too large. Maximum size is 5MB." },
                { status: 400 }
            );
        }

        const validFolders = ["event-covers", "form-uploads", "dept-logos"];
        const uploadFolder = validFolders.includes(folder) ? folder : "event-covers";

        const result = await uploadFile(file, uploadFolder as "event-covers" | "form-uploads" | "dept-logos");

        return Response.json({ success: true, url: result.url, publicId: result.publicId });
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED" || err.message === "FORBIDDEN") {
            return Response.json({ success: false, error: "Unauthorized." }, { status: 401 });
        }
        console.error("[POST /api/upload]", err);
        return Response.json({ success: false, error: "Upload failed. Please try again." }, { status: 500 });
    }
}