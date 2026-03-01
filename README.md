# Centum Partner Portal (Prisma + Postgres)

Investor-ready MVP partner portal for schools:
- **Next.js App Router + TypeScript + Tailwind**
- **Prisma + Postgres** (Supabase recommended)
- **NextAuth Credentials** (bcrypt password hashing)
- **Multi-school tenancy** + **SUPER_ADMIN** school switching
- **RBAC** (SUPER_ADMIN / ADMIN / STAFF / IT / COACH / TEACHER)
- **Students CRUD + CSV import with preview**
- **Requests + Support Tickets workflows** (assignment, statuses, comments, timeline)
- **Training progress** (lessons + completion) + **Updates that force retraining**
- **Invites + password reset**
- **Attachments** stored in **Supabase Storage**
- **Audit log + Notifications**

---

## 1) Local setup

```bash
npm install
cp .env.example .env
```

### Configure `.env`
Minimum required:
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Optional (but recommended):
- Supabase Storage: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- Email: `RESEND_API_KEY` + `EMAIL_FROM` (or keep `EMAIL_DEBUG_LINKS=true` for dev)

### Create DB schema + seed demo data
```bash
npm run prisma:push
npm run prisma:seed
```

### Run
```bash
npm run dev
```

Open http://localhost:3000

---

## 2) Demo accounts (seeded)

Password for all demo users: `password`

- `hq@centum.id` (**SUPER_ADMIN**)
- `admin@centum.id` (**ADMIN**)
- `staff@centum.id` (**STAFF**)
- `it@centum.id` (**IT**)

---

## 3) Supabase Storage setup (attachments)

1. In Supabase, create a Storage bucket (default: `attachments`).
2. Set bucket visibility to **private** (recommended).
3. Add env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET`

Attachments are downloaded through an authenticated route (`/api/attachments/[id]`) that generates a **signed URL**.

---

## 4) Deploy on Vercel (Supabase Postgres)

1. Push repo to GitHub
2. Create a Vercel project
3. Add env vars in Vercel:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Vercel domain)
   - (optional) Supabase Storage + Email vars

4. Set Build Command:
   - `npm run vercel-build`

This runs:
- `prisma generate`
- `prisma db push`
- `next build`

> For stricter production workflows, replace `db push` with Prisma migrations.

---

## 5) RBAC summary (MVP defaults)

- **SUPER_ADMIN**: manage all schools, switch active school
- **ADMIN**: manage users, updates, tools, view audit log
- **IT**: manage tool enablement + ticket/request assignment & resolution
- **STAFF/COACH/TEACHER**: create students/requests/tickets and comment; limited destructive actions

You can adjust rules in `src/lib/rbac.ts`.

# centum
