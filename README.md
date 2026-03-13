# Centum Stack — School 2.0 Platform

Centum Stack is a leadership-first, curriculum-agnostic School 2.0 transition platform for existing schools.

It is not an LMS, not a SIS, and not a curriculum replacement. It is the operating layer for:
- governance and policy retrieval
- staged AI adoption
- transformation readiness and executive reporting
- curated tool adoption
- low-cost recorded training
- pack and bundle rollout
- partner/license coordination
- parent-facing growth assets

## Stack
- Next.js App Router + TypeScript + TailwindCSS
- Prisma + PostgreSQL
- NextAuth credentials auth
- Multi-school tenancy with SUPER_ADMIN school switching

## V2 product areas
- `/dashboard` — Readiness & ROI
- `/hq` — HQ Command Center
- `/transformation` — Transformation Copilot
- `/transformation/report` — Executive Report
- `/governance` — School 2.0 Governance & Support Center
- `/packs` — Transformation Packs
- `/tools` — Tool Recommendations / Catalog 2.0
- `/stacks` — Bundles
- `/training` — Training Hub
- `/partners` — Partner Ops
- `/growth` — Growth Assets

## Local setup
```bash
npm install
cp .env.example .env
```

### Required env vars
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Optional env vars
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_DEBUG_LINKS`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`

## Database + seed
```bash
npm run prisma:push
npm run prisma:seed
```

## Run
```bash
npm run dev
```

Open http://localhost:3000

## Demo accounts
Password for all demo users: `password`

- `hq@centum.id`
- `admin.harapan@centum.id`
- `staff.harapan@centum.id`
- `it.harapan@centum.id`
- `admin.nusantara@centum.id`
- `admin.bandung@centum.id`

## Notes on AI behavior
The Governance & Support Center is retrieval-first.
- It retrieves the school’s own uploaded docs.
- It quotes the source passages.
- It links back to the source version.
- If no live LLM credentials are configured, it falls back to deterministic answer assembly.

## Deployment
The project still supports Prisma + Postgres deployment on platforms such as Vercel or Supabase-backed hosting.

For production:
- run Prisma generate during install/build
- run `prisma db push` or your preferred migration workflow
- seed demo data only in non-production/demo environments

## Documentation
See `docs/V2_CHANGES.md` for the V2 architecture summary and route map.
