# Master prompt — rebuild ft_transcendence frontend and fix its logic

Target environment: Google Antigravity.
Requested model: Gemini 3.1 Pro — High, when available in the account.
Paste the task below into the agent, or use the short kickoff message in README.md after these files are installed.

---

Act as a senior frontend engineer, product designer, accessibility specialist, and application-security reviewer working in my existing repository.

Your mission is to rebuild the complete existing frontend of ft_transcendence using the visual language of one reference photograph, improve UI/UX, check the logic behind the pages, and fix confirmed frontend bugs and bad practices you find. Deliver working integrated pages, not a static mockup.

## Read the governing context before editing

1. Read root AGENTS.md and all applicable existing repository instructions.
2. Read docs/frontend-rebuild/DESIGN_BRIEF.md and visually inspect docs/frontend-rebuild/design-reference.jpg.
3. Read docs/frontend-rebuild/FRONTEND_PRODUCTION_REQUIREMENTS.md during the initial audit; use relevant sections as acceptance criteria throughout the mission.
4. If work has started, read docs/frontend-rebuild/PROGRESS.md, ROUTE_INVENTORY.md, BUG_LOG.md, and VALIDATION_REPORT.md before choosing the next task.
5. Inspect the actual current files, package.json, lockfile, router, components.json, UI layer, styles, API client, authentication/BFF, translations, and relevant tests.

Before any source/config edit, confirm the proposed change follows the rules, actual API contract, and intended behavior. After a context reset, reload the core instructions and progress. Do not mechanically re-read every long document before each small edit.

Do not rewrite these governing instructions to make an implementation easier. Document a genuine conflict and ask only for a decision that blocks correct work.

## Product context and scope

This is a multi-tenant sports club management SaaS serving different types of sports clubs. Preserve the actual product identity and the exact roles OWNER, ADMIN, STAFF, MEMBER.

A person may belong to different clubs with different roles. Respect the implemented identity and membership contracts; do not invent a new authentication architecture or a club switcher unsupported by the API.

Find all existing public, auth, onboarding, and role-specific frontend routes. Cover the whole existing frontend, including shared components, hooks, utilities, state management, and frontend-owned Next.js server/BFF/route-handler code.

You may refactor frontend code and fix confirmed in-scope defects. Preserve intended business behavior, route URLs, API contracts, permissions, translations, and integrations. Fixing a broken implementation is part of the task; preserve the business rule rather than the bug.

Read narrowly scoped backend/API code or documentation when necessary to understand a contract. Do not edit NestJS backend logic, database schemas, migrations, API contracts, deployment infrastructure, or unrelated work. If the correct fix requires one of those changes, record the precise backend gap and affected feature, keep other work moving, and request a separate scope decision only when necessary.

Work in the existing project. Inspect git status and use a dedicated branch without losing uncommitted work or switching away from someone else's work. Do not scaffold a replacement application in another folder.

## Turn one reference page into a complete design system

The image shows only one dashboard. Use it to infer a coherent design language for all existing pages.

Extract a restrained palette, typography hierarchy, spacing scale, surface treatments, corner radii, navigation style, active states, filter style, and data visualization language. Write the resulting tokens and shared patterns in docs/frontend-rebuild/DESIGN_SYSTEM.md.

The direction is a charcoal sidebar, light neutral workspace, rounded white surfaces, strong dark typography, generous spacing, pill-like filters, and controlled green accents. Improve faint text and low-contrast details.

Do not reproduce the photo's desk, monitor, perspective, branding, employee rankings, or invented charts. Do not flatten the whole app into identical dashboard cards. Follow the page-family guidance in DESIGN_BRIEF.md:
- Dashboards prioritize real role-specific summaries and actions.
- Lists prioritize search, filters, tables, pagination, and row actions.
- Forms prioritize readable grouping, field feedback, and submission states.
- Detail pages prioritize identity, status, related data, and contextual actions.
- Authentication/onboarding prioritize clarity, trust, and existing account flows.
- Public pages share the brand language with a layout appropriate to public content.

Use one shared token/component system across OWNER, ADMIN, STAFF, and MEMBER portals while preserving the actual differences between their workflows.

## Component and dependency policy

Use the installed shadcn/ui components for available controls. Extend shared component variants and compose reusable product patterns. Inspect the existing Base UI/shadcn configuration before adding components.

The styling preference means:
- Use shadcn controls instead of repeatedly hand-building raw controls.
- Use semantic HTML for accessible document structure and real table/form relationships.
- Keep Tailwind support required by shadcn.
- Use CSS Modules and shared CSS variables for new feature/page layouts, avoiding long arbitrary Tailwind strings across every page.

Reuse suitable installed packages: react-hook-form, zod, the resolver, axios, lucide-react, the existing motion package, translation system, notification provider, QR scanner, and wallet integration. Add packages only when an actual requirement justifies the maintenance and bundle cost.

The pasted old package.json is historical context. Do not overwrite the current package.json from chat, install all packages at latest, or assume a package API/version without checking the real lockfile and official documentation. Review the supplied Next.js/eslint-config-next version mismatch against the actual repository. Preserve the existing router unless a separately explained blocker requires a change.

## Work through these phases and continue to completion

### Phase 1 — establish a baseline

- Inventory the routes and shared modules, roles, API dependencies, major user tasks, and current UI/logic problems.
- Run the project's existing checks and start the application when possible. Record pre-existing failures separately from new regressions.
- Inspect representative rendered routes before rebuilding them. If login/backend/browser access is unavailable, state what is blocked and continue code work that can be verified.
- Create the progress documents described below. Write a concise implementation order and begin work; do not finish after producing a plan.

### Phase 2 — build and verify the shared foundation

- Implement tokens, typography, responsive app shells, role-appropriate navigation, headers, field patterns, tables, state components, and focused control variants.
- Build one real dashboard plus one representative list/form workflow using real existing API contracts.
- Review the rendered result on desktop/mobile against the reference; correct visual inconsistencies before propagating components.
- Share a concise checkpoint with screenshots when available. Continue the rollout under the existing authorization unless I explicitly ask you to pause for visual approval.

### Phase 3 — migrate every existing route and fix its behavior

For each route group:
1. Read its current code, shared dependencies, intended behavior, and API contract.
2. Apply the shared visual system using a layout suited to that page family.
3. Inspect the logic and fix confirmed frontend bugs; refactor justified repeated bad patterns.
4. Verify loading, empty, filtered-empty, validation, pending, success, failure, unauthorized, and forbidden states as relevant.
5. Exercise relevant interactions and failure paths, including keyboard, responsive layouts, supported themes/translations, and integrations.
6. Run relevant checks and regression tests; review shared-component changes for effects on other routes.
7. Update route status, bugs, validation evidence, and the next task before moving on.

Cover actual existing public/auth/onboarding and OWNER/ADMIN/STAFF/MEMBER routes. An illustrative order is shared shell, auth, members/plans, attendance, payments, notifications/feedback, working hours/settings, and public pages. Adapt to the real route inventory rather than inventing features.

### Phase 4 — final review and handoff

- Reconcile the route inventory: every route is implemented and appropriately verified, or explicitly blocked with evidence.
- Re-check role/club separation, sessions, critical forms, search/filter/pagination, dates/money, affected QR/wallet paths, and network failures.
- Review accessibility, responsive behavior, public-page SEO, and measured production performance.
- Run the actual lint, type checking, build, and relevant tests. Investigate failures within scope; document external blockers exactly.
- Summarize changes, confirmed fixes, verification results, unresolved issues, and steps needed to reproduce the checks.

## Bug-fixing method

For every significant finding, distinguish confirmed defects from unverified concerns. Record:
- Stable bug ID, severity/impact, affected route/role, file/location.
- Reproduction or precise code evidence.
- Intended versus actual result and the supporting contract/test/product rule.
- Root cause, minimal correct fix, and relevant shared-code impact.
- Before/after verification and any focused regression test.

Check payload/response mismatches, stale effects/closures, out-of-order requests, state synchronization, filters and pagination, hydration, theme, forms, dates/timezones, money precision, session renewal, permissions, and duplicate mutations. Also fix accessibility and rendering defects encountered during the audit.

Do not "fix" errors by removing features, ignoring failures, weakening validation/authorization, swallowing exceptions, inventing API data, disabling tests/lint, or casting everything to any. Do not silently change uncertain business rules. Ask a focused question if a genuine ambiguity blocks a safe fix, and continue other routes meanwhile.

You are authorized to fix confirmed frontend defects encountered across the mission. Report necessary backend fixes outside scope instead of claiming a client workaround secures the backend.

## Required quality controls

- Browser validation improves feedback; trusted server endpoints still validate and authorize. Preserve HttpOnly sessions and existing refresh contracts, protect against unsafe rendering/redirects, and prevent user/club data crossing caches or client state.
- Preserve legitimate Unicode, password managers, paste, and supported locales. Do not strip punctuation as an injection defense or silently transform passwords/tokens.
- Use backend-supported duplicate protection for payments/check-ins where available; if absent, document the gap. Do not blindly retry non-idempotent writes.
- Aim for WCAG 2.2 AA, keyboard access, visible focus, associated field errors, proper names/contrast, and usable touch targets.
- Check 320, 390, 768, 1024, 1440, 1920 CSS pixel layouts, intermediate widths, long translations, and zoom. Test Arabic/RTL if supported.
- Keep motion brief and purposeful, support reduced motion, and avoid layout shifts or excessive blur.
- Preserve current Next.js server/client boundaries. Limit client JavaScript and lazy-load optional charts, scanners, and wallet code.
- Measure performance honestly in production conditions. Field targets are LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1 at the 75th percentile; lab scores alone do not prove them.
- Apply metadata, canonical URLs, sitemap, and truthful public content to indexable routes. Keep private routes authenticated and appropriately excluded from public discovery.
- Keep secrets and private member/payment data out of source, client bundles, logs, screenshots, and analytics.
- Use test accounts/data. Do not mutate real production records, publish/deploy, push, or merge as part of this task unless separately requested.

## Progress documents you must create and maintain

Use docs/frontend-rebuild/ as the working documentation folder:

| File | Minimum content |
| --- | --- |
| AUDIT.md | Repository facts, baseline checks, observed problems, risk priorities, assumptions and blockers |
| DESIGN_SYSTEM.md | Tokens, typography, layout rules, shared component variants, responsive and state patterns |
| ROUTE_INVENTORY.md | Actual route, role, page family, API dependency, UI status, logic status, integration/test evidence, blocker |
| BUG_LOG.md | Bug ID, evidence, impact/root cause, fix, status, and verification; separate concerns and backend gaps |
| VALIDATION_REPORT.md | Commands, routes, environments, accounts/roles tested, screenshots, results, and unverified coverage |
| PROGRESS.md | Current stage, completed work, remaining route groups, decisions, blockers, exact next action |

Do not put test passwords, tokens, or private records in these files.

## Communication and completion

Use clear English and concise updates. Make routine implementation decisions using the rules and existing contracts. Do not ask for confirmation before every page, style adjustment, or in-scope bug fix.

Do the work, rather than only describing how it could be done. If the mission spans sessions, keep progress recoverable and continue from the next unfinished task. Never claim commands passed, APIs worked, screenshots were inspected, or bugs were fixed without evidence. Report what you could not verify.

Start now: load the governing files, inspect the reference and repository, establish the baseline, then rebuild and verify the complete frontend in coherent slices.

---
