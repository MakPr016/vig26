// components/manage/topbar.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    IconChevronDown,
    IconLogout,
    IconUser,
    IconBuilding,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { getDepartments } from "@/actions/admin";
import type { UserRole } from "@/types";

interface TopbarUser {
    name: string;
    email: string;
    role: UserRole;
    departments: string[];
    image: string | null;
}

interface ManageTopbarProps {
    user: TopbarUser;
}

export function ManageTopbar({ user }: ManageTopbarProps) {
    const router = useRouter();
    const [deptDropdownOpen, setDeptDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [departments, setDepartments] = useState<{ _id: string; name: string }[]>([]);
    const [activeDept, setActiveDept] = useState<{ _id: string; name: string } | null>(null);

    const deptRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadDepts() {
            try {
                const data = await getDepartments() as any[];
                setDepartments(data);
                if (user.role === "super_admin") {
                    setActiveDept(null);
                } else if (data.length > 0) {
                    setActiveDept(data[0]);
                }
            } catch { }
        }
        loadDepts();
    }, [user.role]);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
                setDeptDropdownOpen(false);
            }
            if (userRef.current && !userRef.current.contains(e.target as Node)) {
                setUserDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const initials = user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    const roleLabel: Record<UserRole, string> = {
        super_admin: "Super Admin",
        dept_admin: "Dept Admin",
        coordinator: "Coordinator",
        student: "Student",
    };

    return (
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center gap-2 pl-8 md:pl-0">
                {departments.length > 0 && (
                    <div className="relative" ref={deptRef}>
                        <button
                            onClick={() => setDeptDropdownOpen((v) => !v)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                            <IconBuilding size={15} className="text-zinc-400" />
                            <span className="max-w-35 truncate">
                                {activeDept?.name ?? "All Departments"}
                            </span>
                            <IconChevronDown size={14} className="text-zinc-400" />
                        </button>

                        {deptDropdownOpen && (
                            <div className="absolute top-full left-0 mt-1.5 w-52 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                                {user.role === "super_admin" && (
                                    <button
                                        onClick={() => {
                                            setActiveDept(null);
                                            setDeptDropdownOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm transition-colors",
                                            activeDept === null
                                                ? "bg-orange-50 text-orange-600 font-medium"
                                                : "text-zinc-700 hover:bg-zinc-50"
                                        )}
                                    >
                                        All Departments
                                    </button>
                                )}
                                {departments.map((dept) => (
                                    <button
                                        key={dept._id}
                                        onClick={() => {
                                            setActiveDept(dept);
                                            setDeptDropdownOpen(false);
                                        }}
                                        className={cn(
                                            "w-full text-left px-3 py-2 text-sm transition-colors",
                                            activeDept?._id === dept._id
                                                ? "bg-orange-50 text-orange-600 font-medium"
                                                : "text-zinc-700 hover:bg-zinc-50"
                                        )}
                                    >
                                        {dept.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3" ref={userRef}>
                <div className="relative">
                    <button
                        onClick={() => setUserDropdownOpen((v) => !v)}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-zinc-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center">
                            {user.image ? (
                                <img src={user.image} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-xs font-semibold text-white">{initials}</span>
                            )}
                        </div>
                        <div className="hidden sm:flex flex-col items-start">
                            <span className="text-sm font-medium text-zinc-900 leading-none">{user.name}</span>
                            <span className="text-xs text-zinc-400 mt-0.5">{roleLabel[user.role]}</span>
                        </div>
                        <IconChevronDown size={14} className="text-zinc-400 hidden sm:block" />
                    </button>

                    {userDropdownOpen && (
                        <div className="absolute top-full right-0 mt-1.5 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                            <div className="px-3 py-2 border-b border-zinc-100">
                                <p className="text-sm font-medium text-zinc-900 truncate">{user.name}</p>
                                <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={() => router.push("/manage/profile")}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                            >
                                <IconUser size={15} className="text-zinc-400" />
                                Profile
                            </button>
                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <IconLogout size={15} />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}