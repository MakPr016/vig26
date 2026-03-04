// app/api/auth/invite/accept/route.ts
import { connectDB } from "@/lib/db";
import { User, Invite, Department } from "@/models";
import { hashPassword, isExpired } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password, confirmPassword } = body;

    if (!token) {
      return Response.json(
        { success: false, error: "Token is required." },
        { status: 400 }
      );
    }

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

    // ── Check if user already exists ───────────────────────────────────────
    const existing = await User.findOne({ email: invite.email });
    if (existing) {
      await Invite.findByIdAndUpdate(invite._id, { status: "accepted" });
      await Department.findByIdAndUpdate(invite.departmentId, {
        $addToSet: {
          members: { userId: existing._id, role: invite.role },
        },
      });
      await User.findByIdAndUpdate(existing._id, {
        $addToSet: { departments: invite.departmentId },
        ...(invite.role === "dept_admin" ? { role: "dept_admin" } : {}),
      });

      return Response.json({ success: true, message: "Account linked to department." });
    }

    // ── New user: password is required ────────────────────────────────────
    if (!password) {
      return Response.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return Response.json(
        { success: false, error: "Password must contain at least one uppercase letter." },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(password)) {
      return Response.json(
        { success: false, error: "Password must contain at least one number." },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return Response.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
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

    await Department.findByIdAndUpdate(invite.departmentId, {
      $push: {
        members: { userId: user._id, role: invite.role },
      },
    });

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