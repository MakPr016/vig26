import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/db";
import { User } from "@/models";
import { verifyPassword } from "@/lib/utils";
import type { UserRole } from "@/types";

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    pages: {
        signIn: "/auth/login",
        error: "/auth/error",
    },

    providers: [
        // ─── Google OAuth (public/student accounts only) ────────────────────────
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
            // Only enabled when credentials are present
            allowDangerousEmailAccountLinking: true,
        }),

        // ─── Credentials (all roles — management uses this exclusively) ─────────
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();

                const user = await User.findOne({
                    email: credentials.email.toLowerCase().trim(),
                }).select("+passwordHash");

                if (!user) {
                    throw new Error("No account found with this email");
                }

                if (!user.passwordHash) {
                    // Account exists but was created via Google OAuth
                    throw new Error("This account uses Google Sign-In. Please continue with Google.");
                }

                const isValid = await verifyPassword(credentials.password, user.passwordHash);
                if (!isValid) {
                    throw new Error("Incorrect password");
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role as UserRole,
                    departments: (user.departments ?? []).map((d: any) => d.toString()),
                    image: null,
                };
            },
        }),
    ],

    callbacks: {
        // ─── signIn: block management roles from using Google OAuth ─────────────
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                await connectDB();

                const existingUser = await User.findOne({ email: user.email });

                if (existingUser) {
                    const managementRoles: UserRole[] = ["coordinator", "dept_admin", "super_admin"];
                    if (managementRoles.includes(existingUser.role)) {
                        // Management accounts cannot use Google OAuth
                        return "/manage/login?error=OAuthNotAllowed";
                    }
                    // Existing student — link googleId if not already set
                    if (!existingUser.googleId) {
                        await User.findByIdAndUpdate(existingUser._id, {
                            googleId: user.id,
                        });
                    }
                } else {
                    // New user via Google — create student account
                    await User.create({
                        name: user.name ?? undefined,
                        email: user.email ?? undefined,
                        googleId: user.id,
                        role: "student",
                        departments: [],
                        registeredEvents: [],
                    });
                }
            }
            return true;
        },

        // ─── JWT: embed custom fields into the token ─────────────────────────────
        async jwt({ token, user, account, trigger, session }) {
            // On first sign-in, `user` is populated
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
                token.departments = (user as any).departments ?? [];
            }

            // For Google sign-ins, fetch role and departments from DB
            if (account?.provider === "google" && token.email) {
                await connectDB();
                const dbUser = await User.findOne({ email: token.email }).lean();
                if (dbUser) {
                    token.id = (dbUser._id as any).toString();
                    token.role = dbUser.role;
                    token.departments = (dbUser.departments ?? []).map((d: any) => d.toString());
                }
            }

            // Handle session update trigger (e.g. after profile edit)
            if (trigger === "update" && session) {
                token.name = session.name ?? token.name;
            }

            return token;
        },

        // ─── Session: expose token fields to the client ──────────────────────────
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as UserRole;
                session.user.departments = (token.departments as string[]) ?? [];
            }
            return session;
        },
    },
};