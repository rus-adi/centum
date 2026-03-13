# Centum Stack V2 Changes

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

## Route map
- `/dashboard`
- `/hq`
- `/transformation`
- `/transformation/report`
- `/governance`
- `/governance/documents/[id]`
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

## Demo flow
1. Open `/hq` to show multi-school oversight.
2. Open `/dashboard` to show readiness and ROI.
3. Open `/governance` and ask a question from seeded policy docs.
4. Open `/transformation` to show Copilot recommendations.
5. Open `/transformation/report` for the executive summary.
6. Open `/packs`, `/tools`, `/stacks`, `/training`, `/partners`, and `/growth` to show the extended V2 operating layer.

## Optional env vars
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`

When those values are absent, the governance assistant and copilot still work in fallback mode.
