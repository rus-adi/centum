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

## V3 investor-demo surfaces
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
- `/guide-builder` — Centum Learning Guide Builder
- `/prompt-maker` — alias route for the Guide Builder
- `/services` — Services & Apps catalog

## New investor-demo polish in this checkpoint
- Role-aware navigation and hidden admin controls for non-admin users
- HQ school drill-down now switches school context correctly
- Governance source previews now open in a more premium page instead of only raw text
- Placeholder offering links are highlighted in yellow so your team can spot and replace them
- Teacher demo account added
- Student experience framed as a separate future portal, with placeholder link and sample student profiles
- Login page now includes quick-fill demo persona cards for HQ, school leader, and teacher walkthroughs
- Root routing is role-aware, so HQ, leadership, IT, and teacher personas land in more relevant places
- Teacher and staff users now get a dedicated Classroom Launchpad on /dashboard
- Growth assets and governance source previews now include one-click copy actions for smoother demos
- Expanded offering set including:
  - Leadership Governance Assistant
  - Office Admin AI (Clawbot-powered)
  - HR Rapid Review Bot
  - Project Finder AI
  - Sentinel Guide Builder
  - Interactive Prompt Walkthrough
  - Resiliency Lesson Plans
  - Resiliency AI for Kids
  - Inquiry Forge
  - Gemini Buddy / Prompt Buddy / Teacher Prompt Companion
  - Google Email & Identity
  - Gemini Access

## Local setup
```bash
npm install
cp .env.example .env
npm run prisma:generate
```

This repo includes a project-level `.npmrc` with `ignore-scripts=true` so installs do not fail in offline or restricted environments while Prisma engine downloads are unavailable. After install, run `npm run prisma:generate` to create the normal Prisma client or the offline fallback client.

## Required env vars
- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

## Optional env vars
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_DEBUG_LINKS`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- all `NEXT_PUBLIC_*` offering URLs from `.env.example`

## Linked offering placeholders
The current checkpoint includes editable placeholder links for lesson plans, curricula, apps, and packaged services.

In the UI, placeholder links are intentionally highlighted in yellow so your team can quickly find and replace them later without changing page structure.

## Database + seed
```bash
npm run prisma:push
npm run prisma:seed
```

The seed includes investor-demo content for:
- onboarding shell for Global Nusantara School
- pilot shell for Empathy School Bali plus teacher test accounts
- onboarding, pilot, and scale schools
- governance documents and query history
- transformation packs and bundle adoption
- packaged services such as Project Finder AI, Sentinel Guide Builder, and Office Admin AI
- training modules for resiliency lesson plans, AI prompt craft, and interactive prompt walkthroughs
- growth assets and partner/license records
- a teacher demo account and sample student profiles

## Verify
```bash
npm run verify:offline
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
- `it.harapan@centum.id`
- `staff.harapan@centum.id`
- `teacher.harapan@centum.id`
- `admin.nusantara@centum.id`
- `admin.bandung@centum.id`
- `admin.globalnusantara.demo@centum.id`
- `it.globalnusantara.demo@centum.id`
- `staff.globalnusantara.demo@centum.id`
- `admin.empathy.demo@centum.id`
- `justin.empathy.demo@centum.id`
- `jesse.empathy.demo@centum.id`
- `lily.empathy.demo@centum.id`

## Demo notes
- The login page now includes quick-fill persona cards for HQ, school leader, and teacher walkthroughs.
- The teacher demo is meant to show the Classroom Launchpad, training, lesson-plan links, prompt tools, and read-only governance retrieval without admin clutter.
- The student-facing experience is intentionally framed as a separate future portal rather than part of the current leadership console.
- Yellow cards indicate placeholder URLs that should be replaced when the final destination or subdomain is ready.

## Notes on AI behavior
The Governance & Support Center is retrieval-first.
- It retrieves the school’s own uploaded docs.
- It quotes the source passages.
- It links back to the source version preview.
- If no live LLM credentials are configured, it falls back to deterministic answer assembly.

## Deployment
The project still supports Prisma + Postgres deployment on platforms such as Vercel or Supabase-backed hosting.

For production:
- run Prisma generate during install/build
- run `prisma db push` or your preferred migration workflow
- seed demo data only in non-production/demo environments

## Documentation
See `docs/V2_CHANGES.md` for the architecture summary and route map.
