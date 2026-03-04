// app/manage/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@/types";

const MANAGEMENT_ROLES: UserRole[] = ["coordinator", "dept_admin", "super_admin"];

export default async function ManagePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/manage/login");
  }

  const role = session.user.role as UserRole;

  if (!MANAGEMENT_ROLES.includes(role)) {
    redirect("/manage/login?unauthorized=true");
  }

  redirect("/manage/dashboard");
}
