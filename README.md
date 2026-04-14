# Vigyaanrang 2026

Event registration platform for Vigyaanrang — Atria's technical and cultural fest.

Built with Next.js App Router, MongoDB, NextAuth, Cashfree/HDFC payments, Cloudinary, and Resend.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Seeding

```bash
npx ts-node scripts/seed.ts        # Seed events, categories, departments
npx ts-node scripts/seed-admin.ts  # Seed admin user
```

## Environment Variables

Create a `.env.local` file with:

```env
MONGODB_URI=

NEXTAUTH_SECRET=
NEXTAUTH_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RESEND_API_KEY=

NEXT_PUBLIC_APP_URL=

# Cashfree
NEXT_PUBLIC_CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_ENV=sandbox
NEXT_PUBLIC_CASHFREE_ENV=sandbox

# HDFC SmartGateway (Juspay)
HDFC_API_KEY=
HDFC_PAYMENT_PAGE_CLIENT_ID=
HDFC_ENV=sandbox

# Upstash Redis (rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Google Sheets sync (service account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
```

## Project Structure

```text
app/(public)/       Public-facing pages (home, events, auth, dashboard)
app/manage/         Admin panel (coordinator/dept_admin/super_admin only)
app/api/            API route handlers (auth, events, payment, upload)
actions/            Server actions for form submissions and mutations
models/             Mongoose models
lib/                Utilities (db, auth, email, payments, validations)
components/         Shared UI components
```

## Roles

| Role | Access |
| --- | --- |
| `student` | Register for events, view dashboard |
| `coordinator` | Manage assigned events |
| `dept_admin` | Manage department events and coordinators |
| `super_admin` | Full platform access |
