# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

No test framework is configured.

To seed the database:
```bash
npx ts-node scripts/seed.ts        # Seed events/categories/departments
npx ts-node scripts/seed-admin.ts  # Seed admin user
```

## Architecture

**Vigyanrang 2026** — event registration platform for a technical/cultural festival. Built with Next.js App Router, MongoDB/Mongoose, NextAuth, Razorpay payments, Cloudinary uploads, and Resend emails.

### Route Structure

- `app/(public)/` — public-facing pages (home, events, auth, dashboard, account)
- `app/manage/` — admin panel (protected; requires coordinator/dept_admin/super_admin role)
- `app/api/` — API route handlers (auth, events, payment, upload, users)
- `proxy.ts` — Next.js middleware handling route protection

### Auth & Roles

NextAuth with JWT sessions (30-day max). Providers: Google OAuth + Credentials. Four roles: `super_admin`, `dept_admin`, `coordinator`, `student`. Route protection is enforced in `proxy.ts` — `/manage/*` requires coordinator+ and `/dashboard/*` requires any authenticated user.

### Data Layer

All Mongoose models are in `models/` and re-exported from `models/index.ts`. MongoDB connection is managed in `lib/db.ts` with connection caching. Business logic lives in `actions/` (server actions) and `app/api/` (route handlers). Use server actions for form submissions and mutations; use API routes for webhook endpoints and client-triggered fetches.

### Payments

Razorpay is the primary payment processor (`lib/razorpay.ts`). Cashfree is also wired up (`lib/cashfree.ts`) but secondary. Webhook verification happens in `app/api/payment/`.

### Key Integrations

| Integration | Config |
|-------------|--------|
| Auth | `lib/auth.ts` |
| Database | `lib/db.ts` |
| Email (Resend) | `lib/email.ts` |
| Cloudinary | `lib/cloudinary.ts` |
| QR codes | `lib/qrcode.ts` |
| Zod validations | `lib/validations.ts` |

### Environment Variables

Required in `.env.local`:
```
MONGODB_URI
NEXTAUTH_SECRET, NEXTAUTH_URL
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
RESEND_API_KEY
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

### UI

Tailwind CSS v4 + shadcn/ui (components in `components/ui/`). Path alias `@/*` maps to the repo root. Three.js/GSAP are used for the hero section animations (`components/Hyperspeed.tsx`).
