# Production Frontend Requirements

Research date: 5 November 2026.
Purpose: a reusable engineering checklist for a production web frontend, with application-specific notes for ft_transcendence.
Method: synthesis of the primary standards, official framework documentation, and first-party design/testing guidance listed below. This is a requirements guide, not a security audit of your repository.

## How to apply this checklist

- Apply the baseline to every route and user journey. Apply conditional requirements only to features you actually provide.
- P0: address before exposing the affected production functionality; examples include data exposure, broken authorization, unsafe execution, and duplicate financial operations.
- P1: production quality baseline; include accessibility, usable forms, responsive behavior, reliability, and maintainability in normal delivery.
- C: conditional; required when the corresponding feature exists. P0/P1 still indicate its importance.
- FE = browser UI; SRV = trusted Next.js/BFF, API, backend, or infrastructure; BOTH = coordinated responsibility.
- Priorities and example test cases are engineering recommendations for this project. They are not verbatim requirements from every cited standard.
- For each applicable item, record an owner, implementation evidence, a verification result, and any unresolved limitation.

A browser can be modified or bypassed. Client-side checks improve feedback, but trusted servers must independently decide what data and actions are permitted. A Next.js Server Action or Route Handler is a server entry point even when maintained in a frontend repository. Use OWASP ASVS 5.0 for a broader application security review. [S01, S02, S12]

## 1. Input contracts and safe validation — P0, BOTH

- [ ] VAL-01: Define field types, required/optional behavior, lengths, ranges, enum values, array limits, and nested-object rules. [S03]
- [ ] VAL-02: Validate relationships such as start before end, positive quantities, and allowed booking dates. [S03]
- [ ] VAL-03: Revalidate request bodies, URL parameters, query values, and relevant headers at trusted server boundaries. [S03, S12]
- [ ] VAL-04: Preserve legitimate Unicode and punctuation. Do not reject names such as O'Connor or محمد as an injection defense. [S03]
- [ ] VAL-05: Normalize only according to the actual field contract; never silently trim passwords or opaque tokens. Bound expensive parsing and regex work. [S03]
- [ ] VAL-06: Treat input validation, HTML sanitization, output encoding, authorization, and SQL parameterization as separate controls. [S03, S04]
- [ ] VAL-07: TypeScript types do not validate a network response. Check external data at relevant trust boundaries and handle invalid shapes safely. [S02]

Evidence: boundary-value cases, missing/nested fields, long inputs, invalid enum values, supported-language text, and requests sent without using the UI.

## 2. Safe rendering and URLs — P0, FE/SRV

- [ ] XSS-01: Render untrusted text through framework escaping; avoid direct innerHTML and dangerouslySetInnerHTML for ordinary text. [S04]
- [ ] XSS-02: Use a maintained sanitizer for justified rich HTML; verify the final rendering context remains safe. [S04]
- [ ] XSS-03: Avoid eval, new Function, and constructing executable code from data. [S02]
- [ ] XSS-04: Restrict user-controlled links and redirects to intended protocols/destinations; reject executable URL schemes. [S04]
- [ ] XSS-05: Keep server fetch destinations controlled; a BFF must not become an arbitrary URL proxy. [S12]
- [ ] XSS-06: Encode data for the context where it is used. A value safe as text is not automatically safe in a URL or script. [S04]

Evidence: hostile stored/API content remains inert; unsafe redirects are rejected; normal multilingual content still renders.

## 3. Authentication and sessions — P0/C, BOTH

- [ ] AUTH-01: For browser cookie/BFF auth, keep session credentials in appropriately scoped Secure, HttpOnly cookies with a suitable SameSite policy. [S06]
- [ ] AUTH-02: Do not persist session/refresh credentials in localStorage or sessionStorage. HttpOnly limits cookie reading, but does not stop injected code acting as the user. [S06]
- [ ] AUTH-03: Implement expiration, logout, revocation, and renewal on the server; the UI must recover clearly from an expired session. [S06]
- [ ] AUTH-04: Support password managers, paste, accessible show/hide, and long passphrases. Avoid arbitrary password-composition rules and periodic changes without cause. [S11]
- [ ] AUTH-05: Enforce compromised-password checks, login throttling, and recovery protections on the server. Prefer phishing-resistant MFA/passkeys for privileged/high-risk accounts. [S11]
- [ ] AUTH-06: Require appropriate reauthentication for sensitive account changes; avoid account-enumerating recovery responses. [S06, S11]
- [ ] AUTH-07: Coordinate refresh requests and bound retries. Never turn session renewal into an infinite loop or replay an unsafe mutation blindly. [S06, S35]

Evidence: login, recovery, logout, expiry, parallel requests, disabled/revoked sessions, and sensitive account-change flows.

## 4. Authorization and club isolation — P0/C, BOTH

- [ ] TEN-01: Trusted services enforce role, tenant, object ownership, and action permission on every protected operation. [S05]
- [ ] TEN-02: A hidden button, route redirect, UUID, or client-supplied role/club ID is not an access-control boundary. [S05]
- [ ] TEN-03: Scope protected caches by all relevant identity, club, permission, locale, and query dimensions. Authorize before serving cached data. [S09]
- [ ] TEN-04: Clear protected state and cancel stale work on logout or account/club changes. Prevent previous-context data from flashing or overwriting current results. [S09]
- [ ] TEN-05: Keep private HTML, API responses, downloads, and serialized page data out of inappropriate shared caches. [S09, S12]
- [ ] TEN-06: Test both read and write access using other users' objects and other clubs' records; test direct API requests too. [S05, S09]

ft_transcendence application: preserve OWNER, ADMIN, STAFF, MEMBER. A person may have different memberships/roles in different clubs; apply the real backend identity contract rather than inventing a new one.

## 5. Transport and browser protections — P0, SRV/BOTH

| Control | Requirement |
| --- | --- |
| HTTPS | Use valid TLS and avoid mixed active content. |
| HSTS | Enforce HTTPS; use subdomain/preload options only after checking their deployment impact. |
| CSP | Deploy a tested restrictive policy; integrate nonces/hashes with the actual framework when appropriate. |
| frame-ancestors | Limit who may embed authenticated pages; allow only legitimate embedding requirements. |
| nosniff | Send correct Content-Type and X-Content-Type-Options: nosniff. |
| Referrer-Policy | Limit URL leakage to destinations. |
| Permissions-Policy | Restrict supported capabilities such as camera/microphone to what the application needs. |

Sources: [S08, S36]. These are response/deployment controls; a UI component library cannot set them by itself.

- [ ] NET-01: Use the framework's CSRF defenses and an appropriate validated token/origin strategy for cookie-authenticated mutations. SameSite is defense in depth. [S07]
- [ ] NET-02: Keep GET operations free of state changes. Use exact trusted CORS origins when cross-origin credentials are required. CORS does not authorize a caller. [S07, S35]
- [ ] NET-03: Test CSP in report-only mode before enforcement; verify forms, rendering, integrations, and production scripts still function. [S36]
- [ ] NET-04: Do not rely on obsolete X-XSS-Protection settings as the primary XSS control. [S08]

Evidence: inspect actual production response headers and test legitimate and hostile origins.

## 6. Reliable forms — P1, FE/BOTH

- [ ] FORM-01: Use persistent labels, instructions, appropriate input types, autocomplete, and inputmode. [S22]
- [ ] FORM-02: Explain constraints before submission where useful; report validation failures with associated inline messages. [S22]
- [ ] FORM-03: For longer forms, provide an error summary linked to invalid fields and manage focus deliberately. [S24]
- [ ] FORM-04: Preserve safe entered values after failure. Do not make users re-enter unaffected fields. [S24]
- [ ] FORM-05: Show pending and success states; block accidental repeated submissions without hiding useful feedback. [S23]
- [ ] FORM-06: Use server idempotency/uniqueness where duplicate actions matter. A disabled button alone cannot guarantee a single payment or check-in. [S35]
- [ ] FORM-07: Make errors actionable, distinguish network failures from invalid values, and support recovery without a page reload. [S23, S24]

Evidence: valid/invalid submissions, server field errors, network loss, keyboard submission, repeated clicks, and session expiry mid-form.

## 7. Accessibility — P1, FE

Target WCAG 2.2 AA. This checklist highlights common requirements; full conformance requires checking all applicable success criteria. [S19]

- [ ] A11Y-01: Use semantic landmarks, headings, links, buttons, form controls, and table relationships. [S19]
- [ ] A11Y-02: Make core tasks keyboard-operable with visible, unobscured focus; manage dialog focus and restore it on close. [S19]
- [ ] A11Y-03: Provide names for icon controls, meaningful image alternatives, and accessible status/error announcements. [S19, S22]
- [ ] A11Y-04: Meet applicable contrast requirements: 4.5:1 normal text, 3:1 large text, and adequate non-text control contrast. [S19]
- [ ] A11Y-05: Meet the 24x24 CSS pixel AA target-size criterion or its exceptions; aim for 44x44 for comfortable touch interaction. [S20]
- [ ] A11Y-06: Support 200% text resizing and reflow at 320 CSS pixels, with the standard's exceptions for inherently two-dimensional content. [S19, S21]
- [ ] A11Y-07: Provide alternatives to color-only meaning and dragging-only operations. Respect reduced motion; caption relevant media. [S19]
- [ ] A11Y-08: Combine automated scans with manual keyboard and assistive-technology checks. A clean scan does not prove conformance. [S32]

## 8. Responsive design and localization — P1/C, FE

- [ ] RESP-01: Define supported browsers/devices and test realistic mobile hardware, touch, keyboard, zoom, landscape, and intermediate widths.
- [ ] RESP-02: Keep core actions reachable without hover; adapt navigation, forms, charts, and dialogs to the available space.
- [ ] RESP-03: Use flexible layouts; contain necessary table scrolling instead of causing page-wide horizontal overflow. [S21]
- [ ] RESP-04: Test long names, empty data, large amounts, translated text, and software-keyboard behavior.
- [ ] I18N-01: For supported locales, translate visible text, errors, accessible names, and metadata consistently.
- [ ] I18N-02: Set lang and dir correctly; use logical CSS properties and test mixed-direction names, IDs, amounts, and tables. [S25]
- [ ] I18N-03: Format currency/numbers/dates with locale-aware tools and a documented product timezone; keep display formatting separate from stored data.

Suggested viewport checks: 320, 390, 768, 1024, 1440, 1920 CSS pixels, plus intermediate layouts. These are proposed test cases, not a guarantee of every device.

## 9. Useful, consistent UI/UX — P1, FE/product

- [ ] UX-01: Define the actual task and primary action on each page; organize content by task importance. [S23]
- [ ] UX-02: Use a shared system for type, spacing, color, components, terminology, and navigation. [S23]
- [ ] UX-03: Make status, progress, errors, and consequences understandable without requiring users to remember hidden context. [S23]
- [ ] UX-04: Provide cancel/back and suitable undo or confirmation for consequential actions. [S23]
- [ ] UX-05: Preserve useful search/filter/pagination state and show a clear current location.
- [ ] UX-06: Implement loading, empty, filtered-empty, partial, error, forbidden, disabled, pending, and success states as applicable.
- [ ] UX-07: Ship working controls and truthful data. Charts need meaningful labels, units, dates, and accessible summaries.
- [ ] UX-08: Validate important journeys with representative users; record task completion, errors, and recurring confusion.

These requirements turn "good UX" into observable behavior. Dark mode, gradients, and card layouts are visual choices, not universal requirements.

## 10. Measured performance — P1, FE/SRV

| Metric | Good field target | Meaning |
| --- | --- | --- |
| LCP | <= 2.5 seconds | Main content appears promptly |
| INP | <= 200 milliseconds | Interactions receive prompt visual response |
| CLS | <= 0.1 | Unexpected layout movement remains small |

Evaluate at the 75th percentile of real visits, separating mobile and desktop. Lab measurements diagnose issues but do not substitute for field evidence. [S14]

- [ ] PERF-01: Measure representative public and authenticated routes in a production build using realistic data and network/device conditions.
- [ ] PERF-02: Split route code and lazy-load optional charts, scanners, and wallet libraries; do not unnecessarily ship them to every page. [S13]
- [ ] PERF-03: Optimize responsive images and font delivery; make the LCP resource discoverable early and do not lazy-load it. [S15]
- [ ] PERF-04: Reduce long main-thread work, excessive rendering, and oversized DOMs; use workers only when justified. [S16]
- [ ] PERF-05: Reserve image/chart/embed space and avoid unexpected insertion above content. [S17]
- [ ] PERF-06: Avoid request waterfalls; fetch independent data concurrently where appropriate and paginate large datasets. [S13]
- [ ] PERF-07: Cache public/versioned assets appropriately and keep personalized caching scoped and authorized. [S09, S13]
- [ ] PERF-08: Set per-route bundle and task-response budgets from real baselines. Investigate regressions rather than adding memoization everywhere.

A 90+ mobile Lighthouse performance score can be a useful project goal. It is not a universal standard, a security score, or proof of good field INP.

## 11. Purposeful animation — P1/C, FE

- [ ] MOTION-01: Use motion to clarify state or give feedback; avoid delaying input and navigation.
- [ ] MOTION-02: Prefer transform/opacity for simple animation; inspect expensive layout/paint effects. [S18]
- [ ] MOTION-03: Respect reduced-motion preferences and provide pause/stop behavior where required. [S19]
- [ ] MOTION-04: Verify smoothness on low-end supported devices and avoid persistent decorative animation.

For ordinary transitions, 150–250 ms is a reasonable starting design choice, not a compliance requirement.

## 12. Network failures and data correctness — P0/P1, BOTH

- [ ] REL-01: Distinguish loading, slow requests, offline/timeout, invalid data, access denied, rate limited, and server failure.
- [ ] REL-02: Cancel or ignore stale searches and context-bound requests; ensure older responses cannot replace newer results.
- [ ] REL-03: Retry safe operations with bounded backoff where useful; respect Retry-After when applicable. [S35]
- [ ] REL-04: Do not retry non-idempotent writes automatically unless the operation contract makes it safe or proves the original did not apply. [S35]
- [ ] REL-05: If a payment/save result is uncertain, check its status before offering a blind resubmission.
- [ ] REL-06: Reconcile optimistic updates with the authoritative response; handle edit conflicts without silently losing data.
- [ ] REL-07: Provide recoverable route/widget fallbacks and useful 404/error pages. [S13]
- [ ] REL-08: Preserve money precision and product timezone semantics across the API/UI; never change business rules during cosmetic work.

## 13. Privacy and observability — P0/P1, BOTH

- [ ] PRIV-01: Collect and transmit only data needed for the feature; avoid fetching whole private records just to hide fields in the UI. [S26, S12]
- [ ] PRIV-02: Explain requested camera/location/notification access at the point of use and handle denial gracefully. [S26]
- [ ] PRIV-03: Review analytics/replay/error tools, data recipients, retention, and applicable consent requirements; do not track sensitive fields by default. [S26]
- [ ] OBS-01: Exclude credentials, access/reset tokens, and sensitive member/payment details from logs, URLs, breadcrumbs, and telemetry. [S27]
- [ ] OBS-02: Record useful error IDs, affected routes/releases, and performance data with privacy-preserving context. [S27]
- [ ] OBS-03: Monitor errors and important flow failures after release; define an owner and a response process.

Privacy obligations depend on the service and jurisdiction. A generic cookie banner is not a complete privacy program.

## 14. Public-page SEO — P1/C, FE/SRV/content

- [ ] SEO-01: Provide useful indexable public content with descriptive titles, headings, links, and page descriptions. [S33]
- [ ] SEO-02: Use canonical URLs, correct status codes/redirects, appropriate social previews, and accurate language alternatives. [S33]
- [ ] SEO-03: Keep the sitemap to canonical public URLs; structured data must match real visible facts. [S33]
- [ ] SEO-04: Authenticate private pages and use noindex where appropriate. robots.txt disallow does not reliably prevent indexing or protect data. [S34]
- [ ] SEO-05: If relying on a noindex tag, allow crawling so the crawler can read it. Do not expose private data to make a crawler see the tag. [S34]

SEO applies differently to public marketing pages and private member/admin portals; ranking is not guaranteed.

## 15. Dependencies, code quality, and deployment — P0/P1, BOTH

- [ ] CODE-01: Keep supported framework/runtime versions and promptly assess security advisories affecting the deployed application.
- [ ] CODE-02: Use the actual package manager/lockfile and reproducible CI installs; npm-ci is the npm example. [S29]
- [ ] CODE-03: Review dependency updates and vulnerability reports; avoid force-fixing or ignoring every finding. [S30]
- [ ] CODE-04: Minimize third-party scripts; inventory access and owners, restrict them, and use SRI for suitable immutable external assets. [S28]
- [ ] CODE-05: Enforce types/lint rules, clear API boundaries, focused components, and shared design tokens.
- [ ] CODE-06: Keep privileged modules/credentials server-only and pass only necessary client props/data. [S12]
- [ ] CODE-07: Build and test a production artifact; protect preview environments and keep test data separate.
- [ ] CODE-08: Keep recoverable deployment history, rollback instructions, and a monitored release process.

TypeScript, shadcn, Zod, Tailwind, and a particular state manager are implementation choices. Semantic HTML is essential infrastructure, and library selection does not itself establish security or accessibility.

## 16. Verification before and after release — P0/P1, BOTH

- [ ] TEST-01: Run meaningful unit/integration checks for changed behavior and browser tests for critical user journeys. [S31]
- [ ] TEST-02: Cover the real login/session flow, permission denials, different clubs/users, pagination, failed forms, and affected integrations.
- [ ] TEST-03: Use isolated test accounts and data; mocked API tests demonstrate UI behavior, not backend authorization.
- [ ] TEST-04: Test user-visible behavior with robust accessible locators and reproducible environments. [S31]
- [ ] TEST-05: Check keyboard, screen readers, contrast, reflow, reduced motion, and supported languages manually as well as automatically. [S32]
- [ ] TEST-06: Review the built UI at mobile/desktop sizes and inspect console, network, cache, and hydration behavior.
- [ ] TEST-07: Gate releases on relevant lint/type/build/tests and unresolved exploitable security issues; record accepted limitations.
- [ ] TEST-08: Collect production field performance/error evidence, and verify the release after deployment.

## Conditional features

| Feature | Additional requirements |
| --- | --- |
| Uploads | Server validates content, size, allowed formats, safe filenames/storage, and access. Browser accept/MIME checks are feedback only. [S10] |
| Payments | Server calculates/verifies amounts and ownership; use safe idempotency and truthful pending/confirmed/failed states. Never infer payment completion from a redirect alone. |
| QR scanners | Parse and validate payloads; do not automatically execute arbitrary links; request camera only when needed and release it afterward. |
| Wallets | Never request private keys/seed phrases. Show the actual network, action, recipient, and amount; handle rejection and pending confirmation. |
| Rich HTML | Use reviewed sanitization and safe output contexts; ordinary input validation is insufficient. [S04] |
| Offline/PWA | Define permitted cached data and expiry; avoid retaining protected records across logout/accounts; resolve queued-write conflicts explicitly. |
| Real-time channels | Enforce channel/message authorization and origin/session handling; bound message sizes and handle reconnection safely. |
| Embedded third-party tools | Limit what their scripts/frames can access and avoid exposing unnecessary member data. [S28] |

Feature rows without a source marker are application-specific engineering recommendations, not claims of formal standard compliance.

## ft_transcendence: first checks I would prioritize

1. A MEMBER cannot invoke STAFF/ADMIN/OWNER operations through direct requests.
2. Changing a club/member identifier cannot expose or modify another club's data.
3. Cached data, SSR payloads, downloads, and previous-tab state preserve identity/club boundaries.
4. Repeated clicks, refresh retries, or uncertain network outcomes cannot duplicate payments or attendance.
5. QR and wallet flows validate payloads and make pending/failed outcomes clear.
6. Login, member search, attendance, and payments work on a real phone and with a keyboard.
7. One shared design system covers existing roles while retaining their actual workflows.
8. Public pages receive SEO work; private portals receive access-control and usability work.

These are proposed review priorities based on your product description, not findings about your current code.

## Acceptance record

For each applicable requirement, use:

| ID | Owner | Evidence | Result | Remaining issue |
| --- | --- | --- | --- | --- |
| TEN-01 | API/BFF owner | Direct cross-role request tests | Pass / Fail / Not verified | Exact gap |
| FORM-03 | Frontend owner | Keyboard and form-error test | Pass / Fail / Not verified | Exact gap |
| PERF-01 | Frontend/platform owner | Route, release, device, data, lab/field measurements | Pass / Fail / Not verified | Exact gap |

A feature is reviewable when the implemented behavior and evidence are concrete. A successful build, automated scan, or AI assertion alone does not verify the whole requirement.

## Primary sources

Accessed 5 November 2026. Recommendations above combine these sources with explicit engineering judgment; this document does not claim to reproduce every requirement in any standard.

- S01 — [OWASP ASVS 5.0](https://asvs.owasp.org/)
- S02 — [OWASP Web Frontend Security](https://cheatsheetseries.owasp.org/cheatsheets/Web_Frontend_Security_Cheat_Sheet.html)
- S03 — [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- S04 — [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- S05 — [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- S06 — [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- S07 — [OWASP CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- S08 — [OWASP HTTP Headers](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
- S09 — [OWASP Multi-Tenant Security](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- S10 — [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- S11 — [NIST SP 800-63B-4 Authentication](https://pages.nist.gov/800-63-4/sp800-63b.html)
- S12 — [Next.js Data Security](https://nextjs.org/docs/app/guides/data-security)
- S13 — [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist)
- S14 — [Google Web Vitals](https://web.dev/articles/vitals)
- S15 — [Optimize LCP](https://web.dev/articles/optimize-lcp)
- S16 — [Optimize INP](https://web.dev/articles/optimize-inp)
- S17 — [Optimize CLS](https://web.dev/articles/optimize-cls)
- S18 — [High-Performance CSS Animation](https://web.dev/articles/animations-guide)
- S19 — [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- S20 — [WCAG Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- S21 — [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)
- S22 — [WAI Form Validation](https://www.w3.org/WAI/tutorials/forms/validation/)
- S23 — [Nielsen Norman Group Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/)
- S24 — [GOV.UK Error Summary](https://design-system.service.gov.uk/components/error-summary/)
- S25 — [W3C Structural Markup and RTL](https://www.w3.org/International/questions/qa-html-dir)
- S26 — [W3C Privacy Principles](https://www.w3.org/TR/privacy-principles/)
- S27 — [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- S28 — [OWASP Third-Party JavaScript Management](https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html)
- S29 — [npm-ci](https://docs.npmjs.com/cli/v11/commands/npm-ci/)
- S30 — [npm-audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/)
- S31 — [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- S32 — [Playwright Accessibility Testing](https://playwright.dev/docs/accessibility-testing)
- S33 — [Google SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- S34 — [Google noindex Guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- S35 — [RFC 9110 HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)
- S36 — [MDN CSP Implementation](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/CSP)
