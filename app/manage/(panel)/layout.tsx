// app/manage/(panel)/layout.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ManageSidebar } from "@/components/manage/sidebar";
import { ManageTopbar } from "@/components/manage/topbar";
import type { UserRole } from "@/types";

const MANAGEMENT_ROLES: UserRole[] = ["coordinator", "dept_admin", "super_admin"];

export default async function ManagePanelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/manage/login");
    }

    const role = session.user.role as UserRole;

    if (!MANAGEMENT_ROLES.includes(role)) {
        redirect("/manage/login?unauthorized=true");
    }

    return (
        <div className="min-h-screen flex bg-zinc-50">
            <ManageSidebar role={role} />
            <div className="flex-1 flex flex-col min-w-0">
                <ManageTopbar user={{ ...session.user, name: session.user.name ?? "", email: session.user.email ?? "", image: session.user.image ?? null }} />
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}