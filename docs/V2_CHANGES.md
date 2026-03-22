# Centum Stack V2 / V3 Checkpoint Summary

## What was added
- School 2.0 Governance & Support Center with retrieval-first document Q&A
- Transformation Copilot with readiness, maturity, blockers, bundles, packs, and 30/60/90 planning
- Transformation Packs for:
  - AI Enablement
  - Individualized Learning
  - Projects
  - Social-Emotional Learning
- Tool Catalog 2.0 metadata and school-facing curation rules
- Partner Ops for vendors and licenses
- Growth Assets for parent-facing communication support
- Expanded school profile and ROI/readiness scorecard surfaces
- Packaged service and curriculum links for:
  - Resiliency Lesson Plans
  - Interactive Prompt Walkthrough
  - AI Prompt Craft Curriculum
  - Project Finder AI
  - Leadership Governance Assistant
  - Office Admin AI
  - HR Rapid Review Bot
  - Sentinel Guide Builder
  - Gemini Buddy
  - Prompt Buddy
  - Teacher Prompt Companion
  - Resiliency AI for Kids
  - Inquiry Forge
  - Student Experience Preview
  - Google Email & Identity
  - Gemini Access

## Latest pass additions
- Login page quick-fill persona cards for HQ, school leader, and teacher demos
- Role-aware root redirect so each persona lands in a more relevant workflow
- Teacher/staff Classroom Launchpad on `/dashboard`
- Copy buttons on governance source previews and growth assets
- More polished topbar badges for role, stage, and readiness
- Root-level app error page so forbidden-role misclicks look intentional during demos

## V3 investor-demo polish in the latest checkpoint
- Role-aware navigation so teacher/staff demos do not see the full admin console
- Hidden admin controls for non-admin roles on governance, packs, tools, training, partner ops, growth assets, and settings
- HQ school drill-down now switches active school context before opening the destination page
- Placeholder offering links are visibly highlighted in yellow
- Governance source previews now open as styled pages
- Teacher demo account added to seed and README
- Student exploration is framed as a separate future portal, with placeholder link and sample seeded student profiles
- Copilot and executive report now surface recommended bundles, packs, and training more explicitly

## Route map
- `/dashboard`
- `/hq`
- `/transformation`
- `/transformation/report`
- `/governance`
- `/governance/documents/[id]`
- `/governance/source/[versionId]`
- `/packs`
- `/packs/[slug]`
- `/tools`
- `/stacks`
- `/training`
- `/partners`
- `/growth`
- `/growth/[slug]`
- `/settings`

## New schema areas
- `GovernanceDocument`
- `GovernanceDocumentVersion`
- `GovernanceChunk`
- `GovernanceQuery`
- `GovernanceQuerySource`
- `TransformationPack`
- `SchoolPackAdoption`
- `SchoolBundleAdoption`
- `CopilotRun`
- `CopilotRecommendation`
- `Vendor`
- `License`
- `GrowthAsset`
- `ToolRecommendation`

## School 2.0 library layer
- `src/lib/school2/governance.ts`
- `src/lib/school2/copilot.ts`
- `src/lib/school2/metrics.ts`
- `src/lib/school2/catalog.ts`
- `src/lib/school2/llm.ts`
- `src/lib/school2/helpers.ts`
- `src/lib/school2/offerings.ts`

## Investor-demo additions in this checkpoint
- Lesson-plan link cards in Training Hub
- Featured offering cards on Readiness & ROI
- Project Finder AI, Sentinel Guide Builder, Office Admin AI, and other packaged apps surfaced in Tool Recommendations
- Pack detail pages now show pillar-relevant lesson plans, apps, and packaged services
- Additional service packaging in Bundles
- Styled governance source previews for better investor and leadership walkthroughs

## Demo flow
1. Open `/hq` to show multi-school oversight.
2. Open `/dashboard` to show readiness, ROI, featured offerings, and the student-experience preview framing.
3. Open `/governance` and ask a question from seeded policy docs.
4. Open `/transformation` to show Copilot recommendations plus recommended bundles/packs/training.
5. Open `/transformation/report` for the executive summary and 30/60/90 plan.
6. Open `/packs`, `/tools`, `/stacks`, `/training`, `/partners`, and `/growth` to show the extended operating layer.
7. Replace yellow placeholder links in `.env` as final destinations become available.

## Optional env vars
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- all `NEXT_PUBLIC_*` offering URLs from `.env.example`

When those values are absent, the governance assistant and copilot still work in fallback mode, and the packaged offering cards still render with highlighted placeholder destinations.

## Validation
See `docs/VALIDATION_STATUS.md` for the latest verified checks and remaining environment-specific caveats.
