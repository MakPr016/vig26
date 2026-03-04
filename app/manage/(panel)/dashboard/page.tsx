// app/manage/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function ManageDashboardPage() {
    const session = await getServerSession(authOptions);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-zinc-900">
                    Welcome back, {session?.user?.name?.split(" ")[0]}
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                    Here&apos;s what&apos;s happening with Vigyanrang.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Events", value: "—" },
                    { label: "Registrations", value: "—" },
                    { label: "Published", value: "—" },
                    { label: "Revenue", value: "—" },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-zinc-200 p-5"
                    >
                        <p className="text-sm text-zinc-500">{stat.label}</p>
                        <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}