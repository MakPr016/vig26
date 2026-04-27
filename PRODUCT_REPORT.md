# Vigyaanrang 2026 — Complete Product Report

**Platform Type:** Full-stack event registration and management platform for a technical/cultural college festival.
**Technology Stack:** Next.js 14 (App Router) · MongoDB/Mongoose · NextAuth.js · Tailwind CSS v4 · shadcn/ui · React Three Fiber · Resend · Cloudinary · Upstash Redis

---

## 1. Public-Facing Website

| Feature | Description |
|---|---|
| Landing page | 3D rotating cube animation (React Three Fiber), live countdown timer to festival date (April 22, 2026), hero section, about section, categories showcase, schedule timeline, footer |
| Event listing page | Filterable/searchable event grid with pagination (type, category, keyword); 12 items/page |
| Event detail page | Full event info — dates, venue, price, capacity, rules, WhatsApp link, external registration URL, Markdown instructions, related events sidebar |
| Auth — Student sign-up | Email + password registration with onboarding (college ID, department) |
| Auth — Google OAuth | One-click sign-in with Google (students only) |
| Auth — Password reset | Email-based reset with 1-hour expiring token; enforces password strength (8+ chars, uppercase, number) |
| Auth — Account settings | Update name, email, college ID, change password |

---

## 2. Student Registration System

| Feature | Description |
|---|---|
| Multi-step registration wizard | 4 steps: (1) Slot selection → (2) Custom form → (3) Team management → (4) Payment/confirmation |
| Slot selection | Time-slot capacity enforcement with live remaining seats display |
| Custom form fields | Short text, long text, dropdown, checkbox, file upload; required field validation on client and server |
| File uploads in forms | Files stored on Cloudinary CDN |
| Team event support | Min/max team size, invite members by email, per-person pricing option |
| Free event registration | Instant confirmation without payment; immediate Google Sheets sync |
| Paid event registration | Full payment flow via Cashfree (UPI) or HDFC SmartGateway |
| QR code ticket issuance | Unique QR code per team member (per ticket), high error-correction PNG; sent via email |
| Student dashboard | View all registrations, tickets with QR codes, check-in status, team details |
| Team member management | Add/edit/remove team members post-registration; triggers email invitation |

---

## 3. Payment Processing

| Feature | Description |
|---|---|
| Cashfree integration | UPI payments via Cashfree REST API; session-based checkout |
| HDFC SmartGateway (Juspay) | Web payment link generation; status polling and webhook verification |
| Payment verification | Idempotent — order processed exactly once regardless of retries or duplicate callbacks |
| Webhook handling | HMAC-SHA256 signature verification for both Cashfree and HDFC |
| Rate limiting | 20 order-creations / 30 verifications per IP per 10 minutes (via Upstash Redis) |
| Offline/manual payments | Super admin can create registrations with manual payment IDs |
| Add-member payments | Separate payment order flow when adding a team member after initial registration |

---

## 4. Admin Panel (`/manage`)

| Feature | Description |
|---|---|
| Separate admin login | Credentials-only (no Google OAuth); role-gated access |
| Dashboard overview | Stats: total events, registrations, revenue, recent activity; scoped by role |
| Event creation | Full form: title, slug (auto-generated), description, cover image, type, category, department, date/time, venue, capacity, price, team settings, custom form builder, slots, rounds, Markdown instructions, WhatsApp link, external URL, Google Sheets toggle |
| Event editing | Same fields as creation; full edit history shown below form |
| Event audit log | Every create/update/publish/cancel/delete logged with user name, email, action, and change summary |
| Registration management | View/search/filter all registrations; columns: user, event, status, payment status, team info |
| CSV export | Download registrations as CSV (all form responses + team members included) |
| QR code scanner | Camera or manual-entry QR scan; real-time ticket verification; toggle attendance/check-in |
| Category management | Create/edit/delete event categories; Google Sheets status per category (super admin) |
| Department management | Create departments, upload logos (Cloudinary), assign coordinators/dept admins via invite |
| Invite system | Email invites with 72-hour expiring tokens; pending/accepted/cancelled status tracking |
| User management | Search users, view/change roles, assign departments (super admin) |
| Bulk email sender | Send custom HTML emails to filtered recipients (role, department, event) via Resend |
| Analytics dashboard | Total registrations by status, revenue, event-wise breakdown, payment method breakdown; PDF report download (super admin) |
| Schedule view | Calendar view of all events across departments |
| Admin ticket operations | Manually create registrations, cancel tickets, regenerate QR codes, download tickets as PDF |

---

## 5. Google Sheets Integration

| Feature | Description |
|---|---|
| Per-category spreadsheets | One Google Sheet created per event category |
| Per-event tabs | Separate tab per event, auto-created when event is published |
| Auto-generated headers | Columns derived from custom form fields + team member slots |
| Real-time sync | Each new registration appended as a row asynchronously (8-second timeout) |
| Category overview tab | Summary statistics updated on registration |
| Rate limit handling | Exponential backoff (15s → 30s → 45s) for Google API 429 errors |
| OAuth token management | Per-user Google OAuth refresh tokens stored securely; category owner's token used for sync |
| Manual sync tools | Admin can trigger bulk re-sync from the tools panel |

---

## 6. Email Notifications (via Resend)

| Email | Trigger |
|---|---|
| Management invite | When coordinator/dept_admin is invited to a department |
| Ticket confirmation | On successful registration (paid or free); includes QR code as CID attachment |
| Team member invite | When a team member is added to an existing registration |
| Password reset | On forgot-password request |
| Bulk admin emails | Sent manually by super admin to filtered recipient list |

All emails are branded HTML templates with Vigyaanrang header, orange accent (#D97706), responsive design, and CTA buttons.

---

## 7. Data Models

| Model | Purpose |
|---|---|
| User | Students and management staff; roles, Google ID, college ID, password hash, reset tokens |
| Event | Full event definition including custom form, slots, rounds, Sheets config, pricing |
| Registration | Per-user event registration with form responses, team members, payment status |
| Ticket | Individual QR-code ticket per team member; attendance tracking |
| Category | Event categories with associated Google Sheet |
| Department | Organisational departments with members and logos |
| Invite | Time-limited management invitations (auto-expire in 72 hours) |
| EventAuditLog | Immutable change history per event |

---

## 8. Security & Infrastructure

| Feature | Description |
|---|---|
| Role-based access control | 4 roles: student, coordinator, dept_admin, super_admin; enforced in middleware and server actions |
| JWT sessions | 30-day NextAuth JWT; fresh user data fetched on every request |
| Password security | bcrypt (12 rounds); SHA-256 hashed reset tokens |
| Rate limiting | Upstash Redis; per-endpoint, per-IP limits |
| Webhook verification | HMAC-SHA256 for both payment gateways |
| ReDoS protection | Regex escaping on all search inputs |
| Idempotent payments | Duplicate webhook/verification safely ignored |
| Input validation | Zod schemas on all mutations (client + server) |

---

## 9. Developer & Operations Tooling

| Script / Tool | Purpose |
|---|---|
| `seed.ts` | Seed default event categories |
| `seed-admin.ts` | Create initial super admin account |
| `backup-db.sh` | MongoDB database backup |
| `reconcile-payments.ts` | Match offline/manual payments to registrations |
| `reconcile-from-csv.ts` | Import and reconcile payments from CSV |
| `download-hdfc-orders.ts` | Fetch and reconcile HDFC orders |
| `merge-user.ts` | Merge duplicate user accounts |
| `recover-tickets.ts` | Regenerate lost QR codes |
| `fix-sheet-owner.ts` | Correct Google Sheet ownership |
| `backfill-*.ts` | Multiple data migration/backfill scripts |

---

## 10. Feature Count Summary

| Area | Count |
|---|---|
| Public pages / routes | 12 |
| Admin panel pages | 14 |
| API endpoints | 28+ |
| Mongoose data models | 8 |
| Email templates | 5 |
| Payment gateways | 2 (Cashfree + HDFC) |
| Third-party integrations | 6 (Google OAuth, Google Sheets, Cloudinary, Resend, Upstash Redis, Razorpay) |
| Operations / maintenance scripts | 12 |
