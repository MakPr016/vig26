import { connectDB } from "@/lib/db";
import { User, Invite, Department } from "@/models";
import { hashPassword, isExpired } from "@/lib/utils";
import { acceptInviteSchema } from "@/lib/validations";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = acceptInviteSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    await connectDB();

    // ── Validate invite token ──────────────────────────────────────────────
    const invite = await Invite.findOne({ token, status: "pending" });

    if (!invite) {
      return Response.json(
        { success: false, error: "Invalid or already used invite link." },
        { status: 400 }
      );
    }

    if (isExpired(invite.expiresAt)) {
      return Response.json(
        { success: false, error: "This invite link has expired. Ask your admin to resend." },
        { status: 400 }
      );
    }

    // ── Check if user already exists (edge case: same email invited twice) ─
    const existing = await User.findOne({ email: invite.email });
    if (existing) {
      // Just mark invite accepted and add to department if not already in
      await Invite.findByIdAndUpdate(invite._id, { status: "accepted" });
      await Department.findByIdAndUpdate(invite.departmentId, {
        $addToSet: {
          members: { userId: existing._id, role: invite.role },
        },
      });
      await User.findByIdAndUpdate(existing._id, {
        $addToSet: { departments: invite.departmentId },
        // Upgrade role if needed
        ...(invite.role === "dept_admin" ? { role: "dept_admin" } : {}),
      });

      return Response.json({ success: true, message: "Account linked to department." });
    }

    // ── Create new user account ────────────────────────────────────────────
    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: invite.name,
      email: invite.email,
      passwordHash,
      role: invite.role,
      departments: [invite.departmentId],
      registeredEvents: [],
    });

    // ── Add user to department members ─────────────────────────────────────
    await Department.findByIdAndUpdate(invite.departmentId, {
      $push: {
        members: { userId: user._id, role: invite.role },
      },
    });

    // ── Mark invite as accepted ────────────────────────────────────────────
    await Invite.findByIdAndUpdate(invite._id, { status: "accepted" });

    return Response.json(
      { success: true, message: "Account created. You can now sign in." },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[invite/accept]", err);
    return Response.json(
      { success: false, error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}