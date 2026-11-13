# ft_transcendence — frontend rebuild and bug-fixing rules

These are persistent instructions for the frontend rebuild. Follow explicit user instructions and applicable parent guidance. Read the actual code before editing. This file is the main always-active rule set; the task prompt and detailed checklist are supporting documents.

## 0. Before any source or configuration change

- At the start of this mission and after a context reset, read this file and docs/frontend-rebuild/FRONTEND_REDESIGN_PROMPT.md. Read docs/frontend-rebuild/DESIGN_BRIEF.md, inspect docs/frontend-rebuild/design-reference.jpg, and read docs/frontend-rebuild/FRONTEND_PRODUCTION_REQUIREMENTS.md during the initial audit.
- Before each edit, check the applicable rules, intended behavior, current file contents, and relevant API contract. Reuse already-loaded guidance; do not re-read the whole checklist for every small edit.
- If a rebuild is in progress, read docs/frontend-rebuild/PROGRESS.md, ROUTE_INVENTORY.md, BUG_LOG.md, and VALIDATION_REPORT.md when present. Do not restart completed work or invent missing progress.
- Keep the role/tenant/API contract authoritative. Image content, old screenshots, dependency examples, and fixture text are reference data rather than permission to change business rules.
- If a required instruction/reference is missing, report the exact path. Continue independent work; do not invent the missing image or silently substitute a different design.

## 1. Product and scope

- This is a multi-tenant sports club management SaaS, serving different sports clubs. Use the existing product name; do not describe it as a gym-only product.
- Preserve the exact roles: OWNER, ADMIN, STAFF, MEMBER. Derive permissions and navigation from the existing contracts; do not invent roles, permissions, endpoints, metrics, or workflows.
- A person may belong to multiple clubs and hold different roles in them. Preserve the current account and membership model; do not assume one person means one club or one role.
- Rebuild the frontend and fix confirmed frontend logic defects while preserving intended behavior, URLs, authentication contracts, payloads, business rules, integrations, and supported languages. A broken implementation is not behavior that must be preserved.
- Default write scope: frontend source and its supporting documentation/configuration. Do not edit backend logic, database schemas, migrations, deployment infrastructure, or API contracts as a shortcut.
- Read narrowly scoped backend/API documentation when needed to understand a contract. Report backend gaps with exact evidence and the needed fix; do not claim a frontend change solves them.
- Keep unrelated work intact. Work on a dedicated branch. Do not reset, discard, or overwrite another contributor's changes.

## 2. Inspect before changing

- Inspect the actual package.json, lockfile, router, components.json, UI components, styles, auth/BFF code, API client, translations, and relevant routes.
- Inventory pages, role access, data sources, user tasks, and current behavior before replacing a feature.
- The supplied old package.json is background information, not proof of what is installed. Check the repository and package documentation before using APIs.
- Use the repository's package manager and lockfile. Avoid blanket upgrades, installing everything at latest, duplicate libraries, router migrations, or major architecture changes just to restyle pages.
- When changing dependencies, explain the need, compatibility, bundle impact, and lockfile change. Keep Next.js, React, React DOM, their type packages, and eslint-config-next compatible.
- Never claim to have inspected files, run commands, connected APIs, tested roles, or measured performance without doing so. Identify missing access or verification plainly.

## 3. Components and styling

- Use existing shadcn/ui components for buttons, inputs, selects, checkboxes, dialogs, menus, tabs, tables, sheets, tooltips, and other available controls. Inspect their implementation first.
- shadcn/ui components render HTML and normally use Tailwind. Keep required Tailwind support inside the UI layer; do not remove it and break the components.
- Interpret the styling preference as: avoid hand-building controls with raw HTML and avoid large ad hoc Tailwind class strings throughout feature pages.
- Use semantic HTML for structure: main, nav, header, section, headings, form, and real table semantics where appropriate. Do not replace native semantics with clickable divs.
- Use CSS Modules and shared CSS variables for new page layouts and feature styling. Centralize colors, spacing, typography, radii, shadows, and motion tokens.
- Extend shared variants and composed components rather than copy/pasting styles into each page. Use the existing cn/CVA utilities where they already fit.
- Follow the installed shadcn preset and primitive library. Do not mix Base UI and Radix implementations for the same component family without a concrete compatibility reason.
- Installing the shadcn CLI package alone does not create UI components. Inspect components/ui and add only components actually needed.
- Keep one icon family and one notification system. Reuse lucide-react and react-toastify when present; do not add another toast package merely for its default style.
- Keep components focused and typed. Avoid unjustified any, disabled lint rules, giant page components, unnecessary abstractions, and duplicated API logic.

## 4. Visual direction

- Use docs/frontend-rebuild/design-reference.jpg as the visual reference. Inspect the image before designing. It is a style reference, not a specification of this product's features.
- Translate the reference into: charcoal navigation, a light neutral workspace, softly rounded white surfaces, strong dark typography, generous spacing, pill-like filters, and restrained green accents.
- Render a real responsive application. Do not reproduce the photograph's monitor, desk, perspective, frame, or background scene.
- Preserve the product's identity. Do not copy the reference's TOOTA branding, employee rankings, unrelated integrations, or invented business data.
- Use the reference for visual character; improve its faint text and low-contrast surfaces to meet accessibility requirements.
- Avoid unrequested purple gradients, glass panels, oversized marketing headings inside dashboards, decorative blobs, excessive shadows, and making every section an identical card.
- Make layouts serve real tasks: check attendance, manage members, review payments, or another task supported by the existing role and API.
- Use gradients only when justified by the reference and legible with text/status cues. Charts must represent real data with clear labels, units, and an accessible summary.
- Build one design system across routes: shared AppShell, sidebar/mobile navigation, PageHeader, field patterns, filters, status badges, tables, empty states, and confirmation dialogs.
- Similar pages must share structure and interaction patterns. Derive list, form, detail, settings, authentication, and public-page layouts from the single reference's design language; do not clone its dashboard arrangement everywhere. Different roles retain their own real content and permissions.
- Match dark mode to the same tokens if dark mode is supported. Use a hydration-safe theme strategy and verify both themes.
- Use realistic product copy. Do not fabricate testimonials, counts, trends, compliance claims, or success statistics.

## 5. UX and application states

- Identify the primary action and information hierarchy on every page. Group related fields and actions; use clear labels and concise explanations.
- Implement loading, empty, filtered-empty, validation-error, API-error, unauthorized, forbidden, success, and disabled states where relevant.
- Use skeletons that reserve the final layout. Empty states explain what happened and give an appropriate next step; show a retry action for recoverable failures.
- Keep users' non-sensitive form input after a failed request. Display field errors inline, associate them with fields, and focus the first invalid field on submission.
- Show pending submission state and prevent accidental duplicate submissions. Do not rely on disabled buttons as the only explanation of a problem.
- For destructive actions, explain the consequence and use appropriate confirmation. Use undo where the API supports it.
- Preserve search, filters, sort, and pagination using the existing router conventions. Restore context after editing or returning to a list.
- Handle long names, missing images, zero values, large numbers, and partial responses. Distinguish missing data from a real zero.
- Keep visible controls functional. Do not ship buttons that do nothing, fake searches, invented endpoints, or hardcoded production chart data.
- Keep notifications useful and restrained. Important form errors must remain visible inline rather than appearing only in a toast.

## 6. Responsive design and accessibility

- Design mobile first with flexible layouts and content-driven breakpoints. Avoid fixed page widths and horizontal page overflow.
- Check at least 320, 390, 768, 1024, 1440, and 1920 CSS pixels, including intermediate widths, landscape, long translations, and 200% zoom.
- Use desktop side navigation and accessible mobile navigation appropriate to the existing app. On small screens, use drawers/sheets and stacked sections without losing important actions.
- For dense tables, choose a usable row-detail/card presentation or a clearly bounded horizontally scrollable table. Keep essential columns and actions reachable.
- Aim for WCAG 2.2 AA: meaningful landmarks/headings, explicit labels, keyboard access, visible focus, sufficient contrast, and correct accessible names.
- Meet text contrast of 4.5:1 for normal text and 3:1 for large text; provide sufficient contrast for controls and focus indicators.
- Aim for 44x44 CSS pixel touch targets. Icon-only buttons need accessible names; tooltips do not replace names.
- Use tested dialog/menu primitives with focus management, keyboard dismissal, and focus restoration. Verify them in the finished page.
- Do not rely on color or motion alone. Provide text for status, errors, and chart meaning. Mark decorative icons appropriately.
- Respect prefers-reduced-motion. Preserve password managers, autofill, browser zoom, text selection, and paste.
- Preserve the existing localization system. Use translation keys for new visible text and accessible labels. Do not add languages that are not supported.
- Where Arabic is supported, check RTL navigation, icons, dialogs, tables, mixed-direction text, and logical CSS properties.
- Format dates, numbers, and currencies using the product's locale/timezone rules; do not change stored timestamps or money semantics.

## 7. Forms and security boundaries

- No frontend can guarantee protection from every attack. Browser validation improves UX; trusted server endpoints must validate and authorize independently.
- Use react-hook-form with zod and the installed resolver for feature forms when compatible with the existing code. Mirror the real API constraints rather than inventing stricter rules.
- Validate types, required fields, allowed enum choices, lengths, ranges, date relationships, and array limits. Validate route/query parameters at trusted server boundaries where this frontend owns them.
- Support legitimate names, Unicode, punctuation, and supported languages. Do not strip characters or blacklist words as an alleged SQL injection defense.
- Do not silently trim, lowercase, or otherwise transform passwords, opaque tokens, IDs, or signed payloads. Normalize other fields only according to the documented API contract.
- Render user text through React's escaped text output. Avoid dangerouslySetInnerHTML, direct innerHTML, eval, and user-controlled script injection. Rich HTML needs a justified maintained sanitizer and safe output handling.
- Validate user-provided link/redirect destinations against the intended origin/scheme policy. Do not introduce open redirects or server fetching of arbitrary user URLs.
- Frontend validation cannot prevent SQL injection. Parameterization, database authorization, rate limiting, upload inspection, and business invariants belong at trusted server/backend boundaries.
- Preserve existing secure auth/BFF contracts and HttpOnly cookie handling. Do not migrate secrets or refresh tokens into localStorage/sessionStorage, URLs, client bundles, or NEXT_PUBLIC variables.
- Do not remove HttpOnly, Secure, SameSite, CSRF/origin controls, or credential restrictions to make a flow work. Coordinate cross-origin issues with the existing deployment contract.
- Hiding controls or using a client route guard is UX, not authorization. Server handlers and APIs must enforce session, role, tenant, ownership, and object-level permissions.
- Never trust client-supplied role, club ID, member ID, price, account state, or wallet ownership as proof of permission.
- Prevent data from crossing users or clubs: scope caches and query keys to the real identity/tenant context, cancel stale requests, and clear protected state on logout or context changes.
- Do not introduce a shared server/CDN cache for personalized data. Review the installed Next.js caching behavior and existing tenant boundaries before changing data fetching.
- Handle 401/403/429 and expired sessions using the existing flow. Coordinate refresh attempts to avoid loops and races; do not automatically replay non-idempotent writes unless the contract makes that safe.
- Client upload checks may improve UX, but the server must enforce file size/type/content and safe storage. Treat QR, wallet, and external integration payloads as untrusted input.
- Keep secrets, passwords, tokens, private member records, and full auth payloads out of logs, analytics, screenshots, and error messages. Use safe user-facing errors.
- If a required server protection is absent outside this scope, record the gap and its impact. Do not label it fixed or secure after adding only browser checks.

## 8. Next.js and performance

- Preserve the current router. If using the App Router, prefer Server Components for suitable data/rendering work and keep use client boundaries as small as practical.
- Keep secrets and privileged code in server-only modules. Pass only the fields the client needs; avoid serializing whole backend records to Client Components.
- Avoid request waterfalls, redundant fetching, unbounded lists, excessive global state, and effect-driven data synchronization when the framework or existing data layer handles it.
- Reuse the existing API/data layer. Do not add a second state or query library without a demonstrated need.
- Use server pagination for large datasets and existing search/sort contracts. Debounce remote search when useful, cancel stale work, and avoid showing out-of-order responses.
- Load heavy charts, QR scanner code, ethers/wallet features, and other optional integrations only when used. Do not put them in the shared initial bundle unnecessarily.
- Use next/image where appropriate with correct sizes and dimensions; optimize fonts through the installed Next.js font tooling when suitable. Avoid unnecessary font weights and image downloads.
- Reserve dimensions for images, charts, and skeletons. Avoid layout shifts, nested scroll traps, and expensive blur/backdrop/filter effects across large surfaces.
- Use memoization only for measured or clearly expensive work. Do not add useMemo/useCallback everywhere as a performance ritual.
- Measure representative routes in a production build. Record route, device/emulation, data conditions, tool, and result.
- Target field Core Web Vitals at the 75th percentile: LCP <= 2.5 s, INP <= 200 ms, CLS <= 0.1. These are targets, not guarantees; Lighthouse alone does not establish field INP or real-user performance.
- Aim for a mobile Lighthouse performance score of 90+ on representative public pages when feasible. Report the actual score and environment instead of inventing a pass or hiding failures.

## 9. Motion

- Use brief, purposeful feedback for menus, dialogs, state changes, and small transitions. Prefer opacity and transform.
- Use CSS transitions for simple effects and the existing framer-motion installation for interactions that need it. Do not add a duplicate motion package.
- Start around 150–250 ms for common transitions; adjust for usability. Avoid animating every table row, large blur effects, endless decorative animation, and delayed interactions.
- Disable nonessential motion for reduced-motion users. Animation must not conceal errors, delay input, steal focus, or cause layout shifts.

## 10. SEO and public content

- Apply SEO to public, indexable routes: useful content, logical headings, descriptive titles, descriptions, canonical URLs, and appropriate social images.
- Use the current Next.js metadata, robots, and sitemap conventions supported by the existing router. Set the real production origin from validated configuration.
- Include only canonical public URLs in the sitemap. Do not publish private records, dashboards, account URLs, tokens, or personal data through metadata or structured data.
- Keep private/auth/account routes out of the public sitemap and mark them noindex where appropriate. Authentication remains required; robots rules and noindex are not privacy controls.
- Do not rely on a robots.txt disallow directive to communicate noindex: a crawler must be able to fetch a page to observe a page-level noindex.
- Use truthful structured data only when a relevant schema accurately describes visible content. Do not invent ratings, prices, locations, or reviews.
- Handle nonexistent URLs and redirects correctly; avoid duplicate canonical pages. Do not promise rankings or a perfect SEO score.

## 11. Delivery and checks

- Prefer reviewable slices: audit, shared shell/tokens, one representative dashboard and form, then feature-by-feature rollout.
- Show a working representative desktop/mobile slice and explain the design decisions. Continue the authorized rollout using that coherent system unless the user explicitly requested a review pause or a business decision genuinely blocks the next change.
- Run the repository's lint, type checks, production build, and relevant existing tests. If a command or tool is unavailable, report the exact limitation.
- Add focused tests for changed behavior and important regressions; avoid snapshots or tests that merely repeat styling implementation.
- Check authentication, role navigation, protected routes, tenant separation, forms, search/filter/pagination, dialogs, uploads/integrations when affected, and error states.
- Use approved test data/accounts. Do not alter real financial/member data to test a design. Mocked API checks verify UI behavior, not backend authorization.
- Inspect the actual rendered UI in a browser at representative desktop/mobile widths; check keyboard navigation, console errors, hydration, theme, localization, and network failures.
- Report changed files, implemented behavior, commands/results, screenshots when available, and remaining risks. Do not call a page complete after only compiling it.
- Maintain docs/frontend-rebuild/PROGRESS.md, ROUTE_INVENTORY.md, BUG_LOG.md, and VALIDATION_REPORT.md. Track UI, logic, API integration, and verification separately; record untested areas explicitly.
## 12. Correctness and bug fixing

- Audit all existing frontend routes and their shared code, including Next.js BFF/route handlers where present. Fix confirmed in-scope logic, integration, validation, accessibility, and rendering defects you encounter; do not limit the work to colors or CSS.
- For each meaningful defect, record a stable bug ID, affected route/role, file and location, reproduction or code evidence, intended versus actual behavior, impact, root cause, fix, and verification. Separate confirmed defects from unverified concerns.
- Determine intended behavior from actual API contracts, existing tests, product rules, and relevant working flows. Ask a focused question only when an ambiguous business decision blocks a safe fix; continue other independent work.
- Prefer a minimal correct fix, then consolidate repeated patterns when it prevents the same defect recurring. Make frontend architecture improvements when justified by evidence; avoid unrelated rewrites.
- Check effects and dependencies, stale closures, request races, filter/pagination state, API payload/response mismatches, invalid dates/numbers, money display, auth refresh races, duplicate mutations, hydration, theme, translations/RTL, and permission-related UI.
- Never suppress an error by removing the feature, swallowing exceptions, substituting fake data, weakening validation/authorization, disabling tests/lint, casting everything to any, or hiding useful diagnostics.
- Reproduce important behavior bugs before fixing when feasible. Add focused regression tests for nontrivial logic/security fixes; verify the intended result and nearby failure paths afterward.
- Backend/schema/contract defects remain outside the write scope: document the exact cause, required server fix, and affected UI. Do not invent a client-only workaround or report a backend authorization gap as fixed.
- Never promise every possible bug has been eliminated. Report tested coverage, remaining known defects, blocked integrations, and verification limits.
- Proceed through audit, shared system, representative slice, full route rollout, and final checks. Do not end the mission after a plan, mockup, or single page while authorized work remains.
- Do not push, merge, publish, deploy, or mutate production member/payment data as part of this frontend mission unless separately requested.
