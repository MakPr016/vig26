import { connectDB } from "@/lib/db";
import { Invite, Department } from "@/models";
import { generateInviteToken, getInviteExpiry } from "@/lib/utils";
import { sendManagementInviteEmail } from "@/lib/email";
import { sendInviteSchema } from "@/lib/validations";
import { requireManagement, isDeptAdmin, forbiddenResponse } from "@/lib/auth-helpers";

export async function POST(req: Request) {
    try {
        const session = await requireManagement();

        const body = await req.json();
        const parsed = sendInviteSchema.safeParse(body);

        if (!parsed.success) {
            return Response.json(
                { success: false, error: parsed.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, role, departmentId } = parsed.data;

        // ── Only dept_admin+ can send invites ──────────────────────────────────
        if (!isDeptAdmin(session.user.role)) {
            return forbiddenResponse();
        }

        // ── Non-super-admin can only invite into their own departments ─────────
        if (
            session.user.role !== "super_admin" &&
            !session.user.departments.includes(departmentId)
        ) {
            return forbiddenResponse();
        }

        await connectDB();

        // ── Verify department exists ───────────────────────────────────────────
        const department = await Department.findById(departmentId);
        if (!department) {
            return Response.json(
                { success: false, error: "Department not found." },
                { status: 404 }
            );
        }

        // ── Cancel any existing pending invite for this email + dept ──────────
        await Invite.findOneAndUpdate(
            { email, departmentId, status: "pending" },
            { status: "cancelled" }
        );

        // ── Create new invite ──────────────────────────────────────────────────
        const token = generateInviteToken();
        const expiresAt = getInviteExpiry();

        await Invite.create({
            email,
            name,
            role,
            departmentId,
            invitedBy: session.user.id,
            token,
            status: "pending",
            expiresAt,
        });

        // ── Send invite email ──────────────────────────────────────────────────
        await sendManagementInviteEmail({
            to: email,
            name,
            departmentName: department.name,
            invitedBy: session.user.name ?? "An admin",
            token,
            role: role === "dept_admin" ? "Admin" : "Coordinator",
        });

        return Response.json(
            { success: true, message: `Invite sent to ${email}.` },
            { status: 201 }
        );
    } catch (err: any) {
        if (err.message === "UNAUTHORIZED") {
            return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        if (err.message === "FORBIDDEN") {
            return forbiddenResponse();
        }
        console.error("[invite/send]", err);
        return Response.json(
            { success: false, error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}