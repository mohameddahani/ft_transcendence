# Backend rate-limiting audit

Reviewed: 13 November 2026. Scope: backend source, backend package/lock files, and dependency source installed under backend/node_modules. This is a static audit of the current working tree, not a running-service or production-traffic assessment. Recommendations and code below are proposals only.

## 1. Overall findings

### What is actually configured

- Installed and lockfile versions agree: `@nestjs/common` **11.1.19**, `@nestjs/core` **11.1.19**, `@nestjs/platform-express` **11.1.28**, and `@nestjs/throttler` **6.5.0**. The manifest declares compatible ranges (`package.json:25–38`); the exact versions were read from each installed package and `package-lock.json`, not inferred from the range.
- `src/app.module.ts:61–67` configures one unnamed throttler: `limit: 100, ttl: 60_000`. Version 6.5.0 assigns the name **default** when no name is supplied (`node_modules/@nestjs/throttler/dist/throttler.guard.js:34–44`). All 167 active endpoint overrides correctly address `default`. There are no active controller-level throttle overrides, skips, custom throttler guards, custom trackers/key generators, alternate storage bindings, or user-agent/conditional bypasses in application source.
- `src/app.module.ts:99` installs `ThrottlerGuard` through `APP_GUARD`. **All 194 explicit controller endpoints are throttled**, including the 27 without decorators, which inherit 100 / 60,000 ms (1 minute). Authorization is separate: 174 have role-specific JWT guards; 20 have no JWT guard, including token-based confirmation/reset operations. Swagger adapter/static routes are a separate development-only exception, inventoried below.
- **Units are verified from the installed implementation:** `throttler.service.js:48–57` directly uses `ttl` and `blockDuration` as milliseconds in timestamps, and `:25–31` passes TTL into `setTimeout`. Values such as `60_000`, `600_000`, `900_000`, `3_600_000`, and `3600_000` mean 1 minute, 10 minutes, 15 minutes, 1 hour, and 1 hour respectively. Decorator syntax is `@Throttle({ default: { limit, ttl } })`, not the old positional API.
- `ThrottlerGuard` tracks **req.ip** (`throttler.guard.js:142–143`). Its key hashes **controller class + handler name + throttler name + tracker** (`:149–151`). Different endpoints have independent counters even if they call the same service. Every `:id`, page, filter, and query variation of one handler shares its counter. For example, opening 40 different notification IDs consumes 40 hits on that detail handler; a list request does not consume that detail budget. Admin and staff versions of the same operation are separate counters. There is **no aggregate application-wide request budget** today.
- Storage is the built-in process-local `Map`: array-form configuration falls back to `new ThrottlerStorageService()` (`throttler.providers.js:16–23`; `throttler.service.js:11–14`). `src/infrastructure/redis/redis.module.ts:10–38` configures **cache-manager/Keyv**, and `redis.service.ts:16–31` performs a cache diagnostic. Neither supplies throttler storage. Actual caching includes public plan detail (`src/modules/platform/plans/plans.service.ts:308–334`) and selected working/special-hour details (`src/modules/working-hours/working-hours.service.ts:166–198,779–813`); their authorization/database checks still have costs.
- `src/main.ts:16` adds **/api**. All 41 controllers occur in module `controllers` arrays, and their modules are imported by `src/app.module.ts:72–92`. No `RouterModule` prefix, URI versioning, prefix exclusion, or extra application-defined HTTP route was found. Commented-out profile-image GET decorators are not registered endpoints. The checked-in `openapi.json` and compiled `dist` are not the source of truth for this inventory.

### Confirmed weaknesses and likely unnecessary 429s

1. **Shared-IP interference affects every protected endpoint.** The global guard executes before controller/method JWT guards (installed `@nestjs/core/helpers/context-creator.js:6–15`). A simple `req.user?.id ?? req.ip` tracker added to this global guard would usually still use IP, because Passport has not populated `req.user` yet. Never trust a decoded but unverified JWT, a body account ID, an arbitrary forwarding header, or the refresh-token string as identity.
2. **Member refresh is unusually restrictive:** `src/modules/auth/auth.controller.ts:275` allows only 5/minute per IP, versus 60 for the other roles (`:179,211,243`). Six members refreshing together can exceed it. Multiple tabs or a request interceptor retry storm are plausible client behaviors, not verified frontend facts.
3. **Recovery is club-wide at three requests per hour:** `auth.controller.ts:147,373,464`. Three typos or different people can exclude everyone behind that IP; failed requests count too. The fourth request starts an additional default one-hour block. Login is also an IP-only budget of 20/minute (`:64,312,403`); this both collides with group sign-ins and fails to bound a target account attacked from many IPs.
4. **Resource-sensitive operations need more than one-minute IP quotas.** Feedback creation invokes AI before saving (`src/modules/feedbacks/feedbacks.service.ts:31–61`), with a 5-second outbound timeout (`src/infrastructure/external-api/external-api.service.ts:17–34`). The hourly job retries up to 50 unresolved sentiments per instance (`src/jobs/sentiment.cron.ts:12–32`). Member creation sends onboarding email and fires a blockchain reward request (`src/modules/members/members.service.ts:119–239`); renewal through PATCH can also issue a reward (`:366–460`). These blockchain calls are fire-and-forget and have no per-call timeout in their options. Profile-image uploads/deletions invoke Cloudinary (`src/modules/profiles/profiles.service.ts:285–364,653–733,1032–1112`). Upload controllers enforce 1 MiB and check file signatures; request quotas alone do not bound simultaneous uploads.
5. **Existing email suppression is helpful, but is not an atomic abuse budget.** Login can send verification/setup mail (`src/modules/auth/auth.provider.ts:215–268,504–560,1075–1131`). Recovery and administrator resend operations check for an unused, unexpired token before creating/sending another (`auth.provider.ts:789–838,1758–1807,2012–2061`; `members.service.ts:574–612`; `staffs.service.ts:361–399`). Concurrent requests can pass these separate read/create steps. The effective suppression duration comes from configured token lifetimes, not a confirmed 60-second resend cooldown. Profile email-change requests invalidate old tokens and send again (`profiles.service.ts:175–265,527–633,908–1012`).
6. **Recovery responses disclose account existence/state.** Nonexistent accounts throw different errors from successful requests (`auth.provider.ts:794–812,1763–1781,2017–2035`). Uniform outward responses and recipient/account budgets are needed; changing an IP limit cannot resolve this.
7. **Pagination limits do not currently cap request cost.** `src/core/dtos/pagination.dto.ts:4–14` has a maximum of 100, but is not referenced by controllers. List handlers parse standalone `page`/`limit` integers, for example `src/modules/members/admin-members.controller.ts:92–104`, and services pass the supplied limit directly to Prisma (`members.service.ts:675–676`, `platform/plans/plans.service.ts:294–301`). A small number of oversized/deep-page reads can still be expensive. Search uses case-insensitive contains in member/staff services (`members.service.ts:669–670`; `staffs.service.ts:225–226`). Owner user/subscription services accept but currently ignore `_search` (`platform/owners/owners.service.ts:15`; `platform/subscriptions/subscriptions.service.ts:185`), so search UX must not be assumed there.
8. **The installed in-memory storage has lifecycle hazards visible in source.** In `throttler.service.js:34–41`, unblocking one key clears all expiry timers for the same throttler name, including unrelated keys. Their hit counts can then remain inflated until another reset; all routes here use `default`. The map also has no inactive-key deletion path; each counted hit schedules a timer (`:25–32,43–59`). This is a confirmed static-code concern, not a reproduced runtime incident. Evaluate a corrected/compatible shared adapter or upstream fix before relying on long-lived memory behavior. Do not patch node_modules manually as a deployment strategy.
9. **Multi-instance enforcement is not shared.** If deployed with N independent processes, each has its own quotas and restarts erase them; N-way request distribution can approach N times the intended aggregate allowance. The backend Dockerfile starts one Node process per container; nothing inspected establishes actual production replica count or proxy topology. Redis caching does not change this.
10. **Client IP depends on topology.** `src/main.ts:21` trusts one proxy hop and `:92` listens on all interfaces. This is appropriate only when every reachable path has the expected trusted hop and the proxy handles forwarded headers correctly. Direct app access or shorter paths can allow a supplied forwarding address to affect `req.ip`; longer paths may identify a proxy/shared address. No proxy config outside backend was inspected. Verify reachability, forwarding-header overwrite/append behavior, IPv4/IPv6 normalization and rotating IPv6 addresses; do not change trust to `true` as a generic fix.
11. **429s have retry headers, but cross-origin browser code cannot currently read them.** The installed guard sets `Retry-After` on a block and `X-RateLimit-*` on allowed requests (`throttler.guard.js:115–139`). CORS in `src/main.ts:84–90` has no `exposedHeaders`. The existing logger records original URLs, including action-token query strings (`src/core/middlewares/logger.middleware.ts:9–20`; e.g. `auth.controller.ts:140,157`); redact tokens before adding telemetry.

### Recommendation assumptions and rollout

These are starting values, not a universal optimum. No traffic rates, latency percentiles, provider quotas, active-user counts, frontend retries, navigation fan-out, polling cadence, or production deployment details were measured. Illustrative assumptions: one person may use several tabs; staff search and paginate in short bursts; a club may have around 50 concurrent users behind one IP; statistics/notifications may poll every 15–60 seconds. Validate these assumptions against production observations.

**R1 (P1) changes the identity model before protected-route values change:** retain a global pre-authentication IP guard; for all 174 role-protected endpoints make it a **shared cross-route 1,200 / 60,000 ms (1 minute) IP ceiling**, then run the existing JWT guards, role guard, and a second throttler keyed by verified `role:id`. That second layer uses the per-handler values in the inventory. The IP ceiling is an illustrative 20 requests/second averaged over a minute; 50 users at 12 protected requests/minute total 600, leaving headroom. It is not a global backend capacity guarantee. Large clubs/CGNAT may need another ceiling after measurement. Public routes retain separate per-handler IP counters. Section 3 provides complete guard wiring, not just an ineffective global tracker substitution.

**R2 (P1, design review before loosening public auth):** add shared atomic target/failure/email budgets and uniform responses. Only after that should public login/recovery adopt C2/C3. Until R1 is installed, retain all current protected-route decorators rather than applying account-sized quotas to a shared IP. Until R2 is installed, retain current public login/recovery limits. KEEP below means keep the endpoint's numerical values; it does not exclude the common R1 scope/storage recommendations.

**R3 (P1 for multiple instances; also fixes local-storage reliability concerns):** review a shared throttler storage implementation with atomic count/expiry/block behavior, bounded key retention, key namespaces and explicit failure policy. R1 code works with the current v6 storage interface, but a production rollout should address R3 as well. No storage package is currently installed for throttling; no package/version is invented here.

## 2. Complete endpoint inventory

There are **194 explicit controller endpoints: 97 GET and 97 mutation endpoints**, across **41 controllers**. Full paths below include `/api`; source locations identify the HTTP decorator, not a guessed method line.

- Current values are **limit / ttl in milliseconds, per handler per IP per process**. “Inherited” means the default 100/60,000, not unprotected.
- Proposed “actor + IP” means that per-handler **verified-account** limit **and** R1's shared protected-route 1,200/minute IP ceiling must both pass. Public rows remain IP-based. An authenticated account's different record IDs share the per-handler budget; different accounts do not share that budget.
- Access: ADMIN/OWNER/STAFF/MEMBER = matching access JWT and role guard. Refresh requires the matching refresh-cookie JWT and role; logout requires both matching access and refresh JWT guards plus role. “Public + action token” has no JWT guard, but the service validates an opaque action token. “Public credentials” validates credentials in the service.
- KEEP retains numeric values. CHANGE replaces an existing override. ADD makes a different inherited budget explicit. REVIEW denotes a conditional adapter/operational route policy. R1 is a common prerequisite even for KEEP actor rows.

### AdminAttendancesController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/admins/attendances/check-in/manual` | ADMIN access JWT + role | `src/modules/attendances/admin-attendances.controller.ts:28` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Reception scan/manual bursts; transactional checks. |
| POST | `/api/admins/attendances/check-in/qr` | ADMIN access JWT + role | `src/modules/attendances/admin-attendances.controller.ts:39` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Reception scan/manual bursts; transactional checks. |

### MemberAttendancesController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/members/attendances` | MEMBER access JWT + role | `src/modules/attendances/member-attendances.controller.ts:29` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/attendances/stats` | MEMBER access JWT + role | `src/modules/attendances/member-attendances.controller.ts:50` | 100 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **CHANGE** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/members/attendances/:id` | MEMBER access JWT + role | `src/modules/attendances/member-attendances.controller.ts:61` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### StaffAttendancesController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/staffs/attendances/check-in/manual` | STAFF access JWT + role | `src/modules/attendances/staff-attendances.controller.ts:28` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Reception scan/manual bursts; transactional checks. |
| POST | `/api/staffs/attendances/check-in/qr` | STAFF access JWT + role | `src/modules/attendances/staff-attendances.controller.ts:39` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Reception scan/manual bursts; transactional checks. |

### AuthController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | Public registration | `src/modules/auth/auth.controller.ts:55` | 5 / `600_000` ms (10 min), IP | 5 / `600_000` ms (10 min), IP | **KEEP** | Hash + creation + verification email; cautious IP cap. |
| POST | `/api/auth/login` | Public credentials | `src/modules/auth/auth.controller.ts:62` | 20 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), IP | **CHANGE** | C3: Group sign-ins; R2 required. |
| POST | `/api/auth/admins/logout` | ADMIN access + refresh + role | `src/modules/auth/auth.controller.ts:87` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Session revocation; allow explicit retries. |
| POST | `/api/auth/owners/logout` | OWNER access + refresh + role | `src/modules/auth/auth.controller.ts:112` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Session revocation; allow explicit retries. |
| POST | `/api/auth/email-verification` | Public + action token | `src/modules/auth/auth.controller.ts:137` | 20 / `900_000` ms (15 min), IP | 20 / `900_000` ms (15 min), IP | **KEEP** | Opaque one-time token; onboarding retries; measure shared IP. |
| POST | `/api/auth/forgot-password` | Public recovery | `src/modules/auth/auth.controller.ts:145` | 3 / `3_600_000` ms (1 hour), IP | 10 / `900_000` ms (15 min), IP | **CHANGE** | C2: Shared-IP recovery; R2 required. |
| POST | `/api/auth/reset-password` | Public + action token | `src/modules/auth/auth.controller.ts:153` | 10 / `900_000` ms (15 min), IP | 10 / `900_000` ms (15 min), IP | **KEEP** | Opaque one-time action token; no email dispatch here. |
| POST | `/api/auth/email-change` | Public + action token | `src/modules/auth/auth.controller.ts:164` | 10 / `900_000` ms (15 min), IP | 10 / `900_000` ms (15 min), IP | **KEEP** | Opaque one-time action token; no email dispatch here. |
| POST | `/api/auth/admins/refresh` | ADMIN refresh cookie + role | `src/modules/auth/auth.controller.ts:177` | 60 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **CHANGE** | C1: Multi-tab recovery; bound rotation work. |
| POST | `/api/auth/owners/refresh` | OWNER refresh cookie + role | `src/modules/auth/auth.controller.ts:209` | 60 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **CHANGE** | C1: Multi-tab recovery; bound rotation work. |
| POST | `/api/auth/staffs/refresh` | STAFF refresh cookie + role | `src/modules/auth/auth.controller.ts:241` | 60 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **CHANGE** | C1: Multi-tab recovery; bound rotation work. |
| POST | `/api/auth/members/refresh` | MEMBER refresh cookie + role | `src/modules/auth/auth.controller.ts:273` | 5 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **CHANGE** | C1: Multi-tab recovery; bound rotation work. |
| POST | `/api/auth/staffs/login` | Public credentials | `src/modules/auth/auth.controller.ts:310` | 20 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), IP | **CHANGE** | C3: Group sign-ins; R2 required. |
| POST | `/api/auth/staffs/logout` | STAFF access + refresh + role | `src/modules/auth/auth.controller.ts:335` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Session revocation; allow explicit retries. |
| POST | `/api/auth/staffs/set-password` | Public + action token | `src/modules/auth/auth.controller.ts:360` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), IP | **KEEP** | Opaque setup token + password hash; onboarding bursts. |
| POST | `/api/auth/staffs/forgot-password` | Public recovery | `src/modules/auth/auth.controller.ts:371` | 3 / `3_600_000` ms (1 hour), IP | 10 / `900_000` ms (15 min), IP | **CHANGE** | C2: Shared-IP recovery; R2 required. |
| POST | `/api/auth/staffs/reset-password` | Public + action token | `src/modules/auth/auth.controller.ts:379` | 10 / `900_000` ms (15 min), IP | 10 / `900_000` ms (15 min), IP | **KEEP** | Opaque one-time action token; no email dispatch here. |
| POST | `/api/auth/staffs/email-change` | Public + action token | `src/modules/auth/auth.controller.ts:389` | 10 / `900_000` ms (15 min), IP | 10 / `900_000` ms (15 min), IP | **KEEP** | Opaque one-time action token; no email dispatch here. |
| POST | `/api/auth/members/login` | Public credentials | `src/modules/auth/auth.controller.ts:401` | 20 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), IP | **CHANGE** | C3: Group sign-ins; R2 required. |
| POST | `/api/auth/members/logout` | MEMBER access + refresh + role | `src/modules/auth/auth.controller.ts:426` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Session revocation; allow explicit retries. |
| POST | `/api/auth/members/set-password` | Public + action token | `src/modules/auth/auth.controller.ts:451` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), IP | **KEEP** | Opaque setup token + password hash; onboarding bursts. |
| POST | `/api/auth/members/forgot-password` | Public recovery | `src/modules/auth/auth.controller.ts:462` | 3 / `3_600_000` ms (1 hour), IP | 10 / `900_000` ms (15 min), IP | **CHANGE** | C2: Shared-IP recovery; R2 required. |
| POST | `/api/auth/members/reset-password` | Public + action token | `src/modules/auth/auth.controller.ts:470` | 10 / `900_000` ms (15 min), IP | 10 / `900_000` ms (15 min), IP | **KEEP** | Opaque one-time action token; no email dispatch here. |
| POST | `/api/auth/members/email-change` | Public + action token | `src/modules/auth/auth.controller.ts:480` | 10 / `900_000` ms (15 min), IP | 10 / `900_000` ms (15 min), IP | **KEEP** | Opaque one-time action token; no email dispatch here. |

### AdminDashboardController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/admins/dashboard/stats` | ADMIN access JWT + role | `src/modules/dashboards/admin-dashboards.controller.ts:19` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |

### StaffDashboardController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/dashboard/stats` | STAFF access JWT + role | `src/modules/dashboards/staff-dashboards.controller.ts:19` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |

### AdminFeedbacksController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/admins/feedbacks` | ADMIN access JWT + role | `src/modules/feedbacks/admin-feedbacks.controller.ts:30` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/feedbacks/stats` | ADMIN access JWT + role | `src/modules/feedbacks/admin-feedbacks.controller.ts:45` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/feedbacks/:id` | ADMIN access JWT + role | `src/modules/feedbacks/admin-feedbacks.controller.ts:53` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| PATCH | `/api/admins/feedbacks/:id` | ADMIN access JWT + role | `src/modules/feedbacks/admin-feedbacks.controller.ts:63` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |

### MemberFeedbacksController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/members/feedbacks/create` | MEMBER access JWT + role | `src/modules/feedbacks/member-feedbacks.controller.ts:33` | 10 / `60_000` ms (1 min), IP | 3 / `600_000` ms (10 min), actor + IP | **CHANGE** | C4: Synchronous AI + retry backlog. |
| GET (+HEAD) | `/api/members/feedbacks` | MEMBER access JWT + role | `src/modules/feedbacks/member-feedbacks.controller.ts:46` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/feedbacks/stats` | MEMBER access JWT + role | `src/modules/feedbacks/member-feedbacks.controller.ts:61` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/members/feedbacks/:id` | MEMBER access JWT + role | `src/modules/feedbacks/member-feedbacks.controller.ts:69` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| POST | `/api/members/feedbacks/like` | MEMBER access JWT + role | `src/modules/feedbacks/member-feedbacks.controller.ts:82` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Like/unlike writes; independent counters. |
| POST | `/api/members/feedbacks/remove-like` | MEMBER access JWT + role | `src/modules/feedbacks/member-feedbacks.controller.ts:95` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Like/unlike writes; independent counters. |
| DELETE | `/api/members/feedbacks/:id` | MEMBER access JWT + role | `src/modules/feedbacks/member-feedbacks.controller.ts:108` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Deliberate destructive action; relational checks. |

### StaffFeedbacksController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/feedbacks` | STAFF access JWT + role | `src/modules/feedbacks/staff-feedbacks.controller.ts:30` | 30 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **CHANGE** | C10: Moderation pagination. |
| GET (+HEAD) | `/api/staffs/feedbacks/stats` | STAFF access JWT + role | `src/modules/feedbacks/staff-feedbacks.controller.ts:45` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/staffs/feedbacks/:id` | STAFF access JWT + role | `src/modules/feedbacks/staff-feedbacks.controller.ts:53` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| PATCH | `/api/staffs/feedbacks/:id` | STAFF access JWT + role | `src/modules/feedbacks/staff-feedbacks.controller.ts:63` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |

### HealthController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/health` | Public | `src/modules/health/health.controller.ts:8` | 60 / `60_000` ms (1 min), IP | 300 / `60_000` ms (1 min), IP | **CHANGE** | C12: Cheap liveness; overlapping probes. |

### AdminMembersController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/admins/members` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:37` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Member creation: transaction, reward request and email. |
| PATCH | `/api/admins/members/:id` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:47` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Member edits/renewals can issue blockchain rewards. |
| PATCH | `/api/admins/members/active/:id` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:58` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/admins/members/pending/:id` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:68` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/admins/members/ban/:id` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:78` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| GET (+HEAD) | `/api/admins/members` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:88` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/members/stats` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:117` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/members/:id` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:123` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| POST | `/api/admins/members/resend-set-password/:id` | ADMIN access JWT + role | `src/modules/members/admin-members.controller.ts:133` | 10 / `60_000` ms (1 min), IP | 5 / `900_000` ms (15 min), actor + IP | **CHANGE** | C7: Onboarding email; target suppression. |

### StaffMembersController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/staffs/members` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:37` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Member creation: transaction, reward request and email. |
| PATCH | `/api/staffs/members/:id` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:47` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Member edits/renewals can issue blockchain rewards. |
| PATCH | `/api/staffs/members/active/:id` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:58` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/staffs/members/pending/:id` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:68` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/staffs/members/ban/:id` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:78` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| GET (+HEAD) | `/api/staffs/members` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:88` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/staffs/members/stats` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:117` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/staffs/members/:id` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:123` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| POST | `/api/staffs/members/resend-set-password/:id` | STAFF access JWT + role | `src/modules/members/staff-members.controller.ts:133` | 10 / `60_000` ms (1 min), IP | 5 / `900_000` ms (15 min), actor + IP | **CHANGE** | C7: Onboarding email; target suppression. |

### AdminMembershipPlansController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/admins/membership-plans` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:37` | 20 / `600_000` ms (10 min), IP | 20 / `60_000` ms (1 min), actor + IP | **CHANGE** | C9: Interactive plan/duration setup. |
| POST | `/api/admins/membership-plans/durations` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:50` | 20 / `600_000` ms (10 min), IP | 20 / `60_000` ms (1 min), actor + IP | **CHANGE** | C9: Interactive plan/duration setup. |
| PATCH | `/api/admins/membership-plans/:id` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:63` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| PATCH | `/api/admins/membership-plans/durations/:id` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:74` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| DELETE | `/api/admins/membership-plans/durations/:id` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:89` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Deliberate destructive action; relational checks. |
| DELETE | `/api/admins/membership-plans/:id` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:102` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Deliberate destructive action; relational checks. |
| GET (+HEAD) | `/api/admins/membership-plans` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:115` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/membership-plans/stats` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:126` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/membership-plans/:id` | ADMIN access JWT + role | `src/modules/membership-plans/admin-membership-plans.controller.ts:134` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### MemberMembershipPlansController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/members/membership-plans` | MEMBER access JWT + role | `src/modules/membership-plans/member-membership-plans.controller.ts:29` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/membership-plans/:id` | MEMBER access JWT + role | `src/modules/membership-plans/member-membership-plans.controller.ts:44` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### StaffMembershipPlansController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/membership-plans` | STAFF access JWT + role | `src/modules/membership-plans/staff-membership-plans.controller.ts:29` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/staffs/membership-plans/stats` | STAFF access JWT + role | `src/modules/membership-plans/staff-membership-plans.controller.ts:40` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/staffs/membership-plans/:id` | STAFF access JWT + role | `src/modules/membership-plans/staff-membership-plans.controller.ts:48` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### AdminMembershipsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/admins/memberships` | ADMIN access JWT + role | `src/modules/memberships/admin-memberships.controller.ts:27` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/memberships/stats` | ADMIN access JWT + role | `src/modules/memberships/admin-memberships.controller.ts:38` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/memberships/:id` | ADMIN access JWT + role | `src/modules/memberships/admin-memberships.controller.ts:46` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### MemberMembershipsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/members/memberships/me` | MEMBER access JWT + role | `src/modules/memberships/member-memberships.controller.ts:25` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/memberships/all` | MEMBER access JWT + role | `src/modules/memberships/member-memberships.controller.ts:34` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/memberships/stats` | MEMBER access JWT + role | `src/modules/memberships/member-memberships.controller.ts:49` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |

### StaffMembershipsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/memberships` | STAFF access JWT + role | `src/modules/memberships/staff-memberships.controller.ts:27` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/staffs/memberships/stats` | STAFF access JWT + role | `src/modules/memberships/staff-memberships.controller.ts:38` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/staffs/memberships/:id` | STAFF access JWT + role | `src/modules/memberships/staff-memberships.controller.ts:46` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### AdminNotificationsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/admins/notifications/stats` | ADMIN access JWT + role | `src/modules/notifications/admin-notifications.controller.ts:28` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/notifications/:id` | ADMIN access JWT + role | `src/modules/notifications/admin-notifications.controller.ts:36` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Inbox paging/detail reads; assumed polling. |
| GET (+HEAD) | `/api/admins/notifications` | ADMIN access JWT + role | `src/modules/notifications/admin-notifications.controller.ts:49` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Inbox paging/detail reads; assumed polling. |
| PATCH | `/api/admins/notifications` | ADMIN access JWT + role | `src/modules/notifications/admin-notifications.controller.ts:64` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Bulk read-mark writes; separate from single marks. |
| PATCH | `/api/admins/notifications/:id` | ADMIN access JWT + role | `src/modules/notifications/admin-notifications.controller.ts:75` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Individual read-mark updates. |

### MemberNotificationsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/members/notifications/stats` | MEMBER access JWT + role | `src/modules/notifications/member-notifications.controller.ts:28` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/members/notifications/:id` | MEMBER access JWT + role | `src/modules/notifications/member-notifications.controller.ts:38` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Inbox paging/detail reads; assumed polling. |
| GET (+HEAD) | `/api/members/notifications` | MEMBER access JWT + role | `src/modules/notifications/member-notifications.controller.ts:51` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Inbox paging/detail reads; assumed polling. |
| PATCH | `/api/members/notifications` | MEMBER access JWT + role | `src/modules/notifications/member-notifications.controller.ts:66` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Bulk read-mark writes; separate from single marks. |
| PATCH | `/api/members/notifications/:id` | MEMBER access JWT + role | `src/modules/notifications/member-notifications.controller.ts:77` | 20 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **CHANGE** | C11: Open a notification backlog. |

### AdminPaymentsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/admins/payments` | ADMIN access JWT + role | `src/modules/payments/admin-payments.controller.ts:27` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/payments/stats` | ADMIN access JWT + role | `src/modules/payments/admin-payments.controller.ts:44` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/payments/:id` | ADMIN access JWT + role | `src/modules/payments/admin-payments.controller.ts:52` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### MemberPaymentsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/members/payments` | MEMBER access JWT + role | `src/modules/payments/member-payments.controller.ts:27` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/payments/stats` | MEMBER access JWT + role | `src/modules/payments/member-payments.controller.ts:42` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/members/payments/:id` | MEMBER access JWT + role | `src/modules/payments/member-payments.controller.ts:50` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### StaffPaymentsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/payments` | STAFF access JWT + role | `src/modules/payments/staff-payments.controller.ts:27` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/staffs/payments/stats` | STAFF access JWT + role | `src/modules/payments/staff-payments.controller.ts:44` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/staffs/payments/:id` | STAFF access JWT + role | `src/modules/payments/staff-payments.controller.ts:52` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### OwnersController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/owners/users` | OWNER access JWT + role | `src/modules/platform/owners/owners.controller.ts:27` | 100 / `60_000` ms (1 min), IP, inherited | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Owner paging; search argument currently ignored. |
| GET (+HEAD) | `/api/owners/users/stats` | OWNER access JWT + role | `src/modules/platform/owners/owners.controller.ts:37` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/owners/users/:id` | OWNER access JWT + role | `src/modules/platform/owners/owners.controller.ts:43` | 100 / `60_000` ms (1 min), IP, inherited | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| PATCH | `/api/owners/users/active/:id` | OWNER access JWT + role | `src/modules/platform/owners/owners.controller.ts:50` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/owners/users/pending/:id` | OWNER access JWT + role | `src/modules/platform/owners/owners.controller.ts:57` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/owners/users/ban/:id` | OWNER access JWT + role | `src/modules/platform/owners/owners.controller.ts:64` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |

### PlansController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/plans` | OWNER access JWT + role | `src/modules/platform/plans/plans.controller.ts:30` | 20 / `600_000` ms (10 min), IP | 20 / `60_000` ms (1 min), actor + IP | **CHANGE** | C9: Interactive plan/duration setup. |
| POST | `/api/plans/durations` | OWNER access JWT + role | `src/modules/platform/plans/plans.controller.ts:39` | 20 / `600_000` ms (10 min), IP | 20 / `60_000` ms (1 min), actor + IP | **CHANGE** | C9: Interactive plan/duration setup. |
| PATCH | `/api/plans/:id` | OWNER access JWT + role | `src/modules/platform/plans/plans.controller.ts:48` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| PATCH | `/api/plans/durations/:id` | OWNER access JWT + role | `src/modules/platform/plans/plans.controller.ts:57` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| DELETE | `/api/plans/durations/:id` | OWNER access JWT + role | `src/modules/platform/plans/plans.controller.ts:69` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Deliberate destructive action; relational checks. |
| DELETE | `/api/plans/:id` | OWNER access JWT + role | `src/modules/platform/plans/plans.controller.ts:78` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Deliberate destructive action; relational checks. |
| GET (+HEAD) | `/api/plans` | Public | `src/modules/platform/plans/plans.controller.ts:87` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), IP | **KEEP** | Public browsing; page-size cap needed. |
| GET (+HEAD) | `/api/plans/stats` | Public | `src/modules/platform/plans/plans.controller.ts:97` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), IP | **KEEP** | Public DB aggregates; keep 30/minute. |
| GET (+HEAD) | `/api/plans/:id` | Public | `src/modules/platform/plans/plans.controller.ts:104` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), IP | **KEEP** | Public cached plan detail; misses query DB. |

### AdminSubscriptionsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/admins/subscriptions/me` | ADMIN access JWT + role | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts:25` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/subscriptions/all` | ADMIN access JWT + role | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts:34` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/subscriptions/stats` | ADMIN access JWT + role | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts:49` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |

### OwnerSubscriptionsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/owners/subscriptions` | OWNER access JWT + role | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts:30` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Owner subscription transaction and member-count checks. |
| PATCH | `/api/owners/subscriptions` | OWNER access JWT + role | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts:37` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Owner subscription transaction and member-count checks. |
| GET (+HEAD) | `/api/owners/subscriptions` | OWNER access JWT + role | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts:44` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Owner paging; search argument currently ignored. |
| GET (+HEAD) | `/api/owners/subscriptions/stats` | OWNER access JWT + role | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts:55` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/owners/subscriptions/:id` | OWNER access JWT + role | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts:61` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### AdminProfilesController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/users/admins/me` | ADMIN access JWT + role | `src/modules/profiles/admin-profiles.controller.ts:41` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile boot reads; several tabs plausible. |
| PATCH | `/api/users/admins/edit-profile` | ADMIN access JWT + role | `src/modules/profiles/admin-profiles.controller.ts:50` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile edits may compare/hash passwords. |
| POST | `/api/users/admins/email-change` | ADMIN access JWT + role | `src/modules/profiles/admin-profiles.controller.ts:60` | 5 / `60_000` ms (1 min), IP | 3 / `900_000` ms (15 min), actor + IP | **CHANGE** | C5: Email delivery + link invalidation. |
| POST | `/api/users/admins/profile-image` | ADMIN access JWT + role | `src/modules/profiles/admin-profiles.controller.ts:70` | 10 / `60_000` ms (1 min), IP | 5 / `600_000` ms (10 min), actor + IP | **CHANGE** | C6: Cloudinary + memory-backed multipart. |
| DELETE | `/api/users/admins/profile-image` | ADMIN access JWT + role | `src/modules/profiles/admin-profiles.controller.ts:161` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Cloudinary deletion; service checks repeated deletion. |

### MemberProfilesController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/users/members/me` | MEMBER access JWT + role | `src/modules/profiles/member-profiles.controller.ts:39` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile boot reads; several tabs plausible. |
| PATCH | `/api/users/members/edit-profile` | MEMBER access JWT + role | `src/modules/profiles/member-profiles.controller.ts:50` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile edits may compare/hash passwords. |
| POST | `/api/users/members/email-change` | MEMBER access JWT + role | `src/modules/profiles/member-profiles.controller.ts:63` | 5 / `60_000` ms (1 min), IP | 3 / `900_000` ms (15 min), actor + IP | **CHANGE** | C5: Email delivery + link invalidation. |
| POST | `/api/users/members/profile-image` | MEMBER access JWT + role | `src/modules/profiles/member-profiles.controller.ts:76` | 10 / `60_000` ms (1 min), IP | 5 / `600_000` ms (10 min), actor + IP | **CHANGE** | C6: Cloudinary + memory-backed multipart. |
| DELETE | `/api/users/members/profile-image` | MEMBER access JWT + role | `src/modules/profiles/member-profiles.controller.ts:170` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Cloudinary deletion; service checks repeated deletion. |

### OwnerProfilesController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/users/owners/me` | OWNER access JWT + role | `src/modules/profiles/owner-profiles.controller.ts:39` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile boot reads; several tabs plausible. |
| PATCH | `/api/users/owners/edit-profile` | OWNER access JWT + role | `src/modules/profiles/owner-profiles.controller.ts:48` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile edits may compare/hash passwords. |
| POST | `/api/users/owners/email-change` | OWNER access JWT + role | `src/modules/profiles/owner-profiles.controller.ts:58` | 5 / `60_000` ms (1 min), IP | 3 / `900_000` ms (15 min), actor + IP | **CHANGE** | C5: Email delivery + link invalidation. |
| POST | `/api/users/owners/profile-image` | OWNER access JWT + role | `src/modules/profiles/owner-profiles.controller.ts:68` | 10 / `60_000` ms (1 min), IP | 5 / `600_000` ms (10 min), actor + IP | **CHANGE** | C6: Cloudinary + memory-backed multipart. |
| DELETE | `/api/users/owners/profile-image` | OWNER access JWT + role | `src/modules/profiles/owner-profiles.controller.ts:159` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Cloudinary deletion; service checks repeated deletion. |

### StaffProfilesController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/users/staffs/me` | STAFF access JWT + role | `src/modules/profiles/staff-profiles.controller.ts:39` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile boot reads; several tabs plausible. |
| PATCH | `/api/users/staffs/edit-profile` | STAFF access JWT + role | `src/modules/profiles/staff-profiles.controller.ts:48` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Profile edits may compare/hash passwords. |
| POST | `/api/users/staffs/email-change` | STAFF access JWT + role | `src/modules/profiles/staff-profiles.controller.ts:58` | 5 / `60_000` ms (1 min), IP | 3 / `900_000` ms (15 min), actor + IP | **CHANGE** | C5: Email delivery + link invalidation. |
| POST | `/api/users/staffs/profile-image` | STAFF access JWT + role | `src/modules/profiles/staff-profiles.controller.ts:71` | 10 / `60_000` ms (1 min), IP | 5 / `600_000` ms (10 min), actor + IP | **CHANGE** | C6: Cloudinary + memory-backed multipart. |
| DELETE | `/api/users/staffs/profile-image` | STAFF access JWT + role | `src/modules/profiles/staff-profiles.controller.ts:165` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Cloudinary deletion; service checks repeated deletion. |

### StaffsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/admins/staffs` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:32` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Staff creation + setup email. |
| PATCH | `/api/admins/staffs/:id` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:42` | 20 / `60_000` ms (1 min), IP | 20 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| GET (+HEAD) | `/api/admins/staffs` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:53` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/staffs/stats` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:70` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/staffs/:id` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:76` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| PATCH | `/api/admins/staffs/active/:id` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:87` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/admins/staffs/pending/:id` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:97` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| PATCH | `/api/admins/staffs/ban/:id` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:107` | 30 / `60_000` ms (1 min), IP | 30 / `60_000` ms (1 min), actor + IP | **KEEP** | Account-status writes; staff/admin batches. |
| POST | `/api/admins/staffs/resend-set-password/:id` | ADMIN access JWT + role | `src/modules/staffs/staffs.controller.ts:117` | 10 / `60_000` ms (1 min), IP | 5 / `900_000` ms (15 min), actor + IP | **CHANGE** | C7: Onboarding email; target suppression. |

### AdminVisitsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/admins/visits/today` | ADMIN access JWT + role | `src/modules/visits/admin-visits.controller.ts:27` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/visits/today/:id` | ADMIN access JWT + role | `src/modules/visits/admin-visits.controller.ts:44` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| GET (+HEAD) | `/api/admins/visits/stats` | ADMIN access JWT + role | `src/modules/visits/admin-visits.controller.ts:54` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |

### MemberVisitsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/members/visits` | MEMBER access JWT + role | `src/modules/visits/member-visits.controller.ts:31` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| PATCH | `/api/members/visits/cancel/:id` | MEMBER access JWT + role | `src/modules/visits/member-visits.controller.ts:41` | 10 / `60_000` ms (1 min), IP | 10 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| GET (+HEAD) | `/api/members/visits/upcoming` | MEMBER access JWT + role | `src/modules/visits/member-visits.controller.ts:51` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/visits/today` | MEMBER access JWT + role | `src/modules/visits/member-visits.controller.ts:66` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/visits/today/:id` | MEMBER access JWT + role | `src/modules/visits/member-visits.controller.ts:81` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| GET (+HEAD) | `/api/members/visits/stats` | MEMBER access JWT + role | `src/modules/visits/member-visits.controller.ts:94` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |

### StaffVisitsController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/visits/today` | STAFF access JWT + role | `src/modules/visits/staff-visits.controller.ts:27` | 120 / `60_000` ms (1 min), IP | 120 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/staffs/visits/today/:id` | STAFF access JWT + role | `src/modules/visits/staff-visits.controller.ts:44` | 100 / `60_000` ms (1 min), IP | 100 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| GET (+HEAD) | `/api/staffs/visits/stats` | STAFF access JWT + role | `src/modules/visits/staff-visits.controller.ts:54` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |

### AdminSpecialHoursController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/admins/special-hours` | ADMIN access JWT + role | `src/modules/working-hours/admin-special-hours.controller.ts:33` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| PATCH | `/api/admins/special-hours/:id` | ADMIN access JWT + role | `src/modules/working-hours/admin-special-hours.controller.ts:43` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| GET (+HEAD) | `/api/admins/special-hours` | ADMIN access JWT + role | `src/modules/working-hours/admin-special-hours.controller.ts:58` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/special-hours/:id` | ADMIN access JWT + role | `src/modules/working-hours/admin-special-hours.controller.ts:73` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| DELETE | `/api/admins/special-hours/:id` | ADMIN access JWT + role | `src/modules/working-hours/admin-special-hours.controller.ts:83` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Deliberate destructive action; relational checks. |

### AdminWorkingHoursController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| POST | `/api/admins/working-hours` | ADMIN access JWT + role | `src/modules/working-hours/admin-working-hours.controller.ts:33` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| PATCH | `/api/admins/working-hours/:id` | ADMIN access JWT + role | `src/modules/working-hours/admin-working-hours.controller.ts:46` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Authenticated configuration writes; moderate bursts. |
| GET (+HEAD) | `/api/admins/working-hours` | ADMIN access JWT + role | `src/modules/working-hours/admin-working-hours.controller.ts:61` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/admins/working-hours/stats` | ADMIN access JWT + role | `src/modules/working-hours/admin-working-hours.controller.ts:76` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/admins/working-hours/:id` | ADMIN access JWT + role | `src/modules/working-hours/admin-working-hours.controller.ts:84` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |
| DELETE | `/api/admins/working-hours/:id` | ADMIN access JWT + role | `src/modules/working-hours/admin-working-hours.controller.ts:94` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Deliberate destructive action; relational checks. |

### MemberSpecialHoursController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/members/special-hours` | MEMBER access JWT + role | `src/modules/working-hours/member-special-hours.controller.ts:27` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/special-hours/:id` | MEMBER access JWT + role | `src/modules/working-hours/member-special-hours.controller.ts:42` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### MemberWorkingHoursController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/members/working-hours` | MEMBER access JWT + role | `src/modules/working-hours/member-working-hours.controller.ts:28` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/members/working-hours/stats` | MEMBER access JWT + role | `src/modules/working-hours/member-working-hours.controller.ts:43` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/members/working-hours/:id` | MEMBER access JWT + role | `src/modules/working-hours/member-working-hours.controller.ts:53` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### StaffSpecialHoursController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/special-hours` | STAFF access JWT + role | `src/modules/working-hours/staff-special-hours.controller.ts:27` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/staffs/special-hours/:id` | STAFF access JWT + role | `src/modules/working-hours/staff-special-hours.controller.ts:42` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### StaffWorkingHoursController

| Method | Full endpoint path | Access requirement | Controller source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/staffs/working-hours` | STAFF access JWT + role | `src/modules/working-hours/staff-working-hours.controller.ts:28` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | List/current-record navigation; bound page size. |
| GET (+HEAD) | `/api/staffs/working-hours/stats` | STAFF access JWT + role | `src/modules/working-hours/staff-working-hours.controller.ts:43` | 100 / `60_000` ms (1 min), IP, inherited | 30 / `60_000` ms (1 min), actor + IP | **ADD** | C8: Aggregation/polling; R1 required. |
| GET (+HEAD) | `/api/staffs/working-hours/:id` | STAFF access JWT + role | `src/modules/working-hours/staff-working-hours.controller.ts:51` | 60 / `60_000` ms (1 min), IP | 60 / `60_000` ms (1 min), actor + IP | **KEEP** | Detail navigation; related records/access checks. |

### Adapter/middleware endpoints and implicit HTTP behavior

Express serves HEAD through the matching GET handler when no explicit HEAD exists. The 97 GET rows above therefore include HEAD aliases, with the **same counter**, access checks and recommended values; they are not an additional 97 independently keyed handlers. Trailing slash/case variants accepted by Express likewise do not create new handler budgets. No explicit HEAD, OPTIONS, wildcard controller, or WebSocket/GraphQL handler was found.

Development-only Swagger registrations come from `src/main.ts:58–74` and installed `node_modules/@nestjs/swagger/dist/swagger-module.js:141–268`. They use direct adapter/static middleware registration and **do not pass through the Nest controller throttler or JWT guards**. No controller exists for them; the table cites their backend setup site. These are absent unless `NODE_ENV === 'development'`; this audit did not read the actual environment.

| Method | Full endpoint path / mounted family | Access | Source:line | Current effective limit / ttl | Proposed limit / ttl | Action | Reason |
|---|---|---|---|---|---|---|---|
| GET (+HEAD) | `/api/api-docs` | Public, development only | `src/main.ts:73` | None | Keep development-only; if remotely exposed, edge 300 / `60_000` ms (1 min), shared docs IP bucket | REVIEW | UI loads several assets; keep internal or protect at proxy. |
| GET (+HEAD) | `/api/api-docs/` | Public, development only | `src/main.ts:73` | None | Same docs policy | REVIEW | Slash alias. |
| GET (+HEAD) | `/api/api-docs/index.html` | Public, development only | `src/main.ts:73` | None | Same docs policy | REVIEW | UI alias. |
| GET (+HEAD) | `/api/api-docs/swagger-ui-init.js` | Public, development only | `src/main.ts:73` | None | Same docs policy | REVIEW | Contains generated API documentation. |
| GET (+HEAD) | `/api/api-docs/api-docs/swagger-ui-init.js` | Public, development only | `src/main.ts:73` | None | Same docs policy | REVIEW | Nested init-script compatibility route. |
| GET (+HEAD) | `/api/api-docs-json` | Public, development only | `src/main.ts:73` | None | Same docs policy | REVIEW | Raw OpenAPI document; path is not prefixed twice. |
| GET (+HEAD) | `/api/api-docs-yaml` | Public, development only | `src/main.ts:73` | None | Same docs policy | REVIEW | Raw YAML document. |
| GET (+HEAD) | `/api/api-docs/LICENSE` | Public, development only | `src/main.ts:73` | None; explicit 404 handler | Same docs policy if exposed | REVIEW | Swagger intentionally registers a rejection route. |
| GET (+HEAD) | Static mounts `/api/api-docs/<asset>` and `/api/api-docs/api-docs/<asset>` | Public, development only | `src/main.ts:73` | None | Same docs policy; cache immutable assets where appropriate | REVIEW | Package CSS, JS, maps, favicons and OAuth redirect files. A file-serving family, not a controller route per filename. |
| OPTIONS | CORS preflight for application paths | Origin/headers/methods per CORS config; no JWT required | `src/main.ts:84–90` | Middleware-generated, outside controller throttler | Preserve `maxAge: 86400` seconds (24 h); use measured edge connection/request ceiling if needed | REVIEW | An origin check is not an abuse quota; no invented Nest OPTIONS decorator. |

Unmatched paths/unsupported methods are framework responses rather than additional registered controller handlers. The Nest throttler is not a transport-wide DoS control for those, documentation middleware, connection counts or body parsing.

## 3. Exact recommended changes

**No changes below have been applied.** Locations refer to the audited tree before implementation. Implement R1's guard classes, global binding and **all 52** local placements together before protected-route C-values. R2/R3 entries are explicit design reviews, not claims that a missing helper/adapter exists.

### R1 — P1: place account throttling after verified authentication

**Affected endpoints:** all 174 role-protected rows, including refresh/logout and the six owner-only plan mutations. All 20 public rows keep IP tracking and their named `default` overrides. The two guards share the storage provider but use different key namespaces.

**New proposed file:** `src/core/guards/rate-limit.guard.ts`; current code/line: absent (new file, start at line 1). These interfaces are exported by installed v6.5.0. Explicit constructors preserve the base guard's injection contract.

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
  ThrottlerRequest,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { createHash } from 'node:crypto';
import { Roles } from '@/core/decorators/user-role.decorator';
import { AccessTokenPayload } from '@/core/types/jwt-payload.type';

@Injectable()
export class CoarseIpThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storage, reflector);
  }

  protected async handleRequest(props: ThrottlerRequest): Promise<boolean> {
    const roles = this.reflector.getAllAndOverride(Roles, [
      props.context.getHandler(),
      props.context.getClass(),
    ]);
    if (!roles?.length) {
      return super.handleRequest(props);
    }
    return super.handleRequest({
      ...props,
      limit: 1_200,
      ttl: 60_000,
      blockDuration: 60_000,
      getTracker: (req) => String(req.ip ?? 'unknown'),
      generateKey: (_context, tracker, name) =>
        createHash('sha256')
          .update(`ip:protected:${name}:${tracker}`)
          .digest('hex'),
    });
  }
}

@Injectable()
export class VerifiedActorThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storage: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storage, reflector);
  }

  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const user = req.user as AccessTokenPayload | undefined;
    if (!user || typeof user.id !== 'string' || !user.id || !user.role) {
      throw new UnauthorizedException();
    }
    return `actor:${user.role}:${user.id}`;
  }
}
```

The default key generator preserves separate actor budgets per class/handler. Do not key refresh by `jti`: rotation changes it. Track stable `role:id`; the refresh guard supplies a verified JWT payload. That guard does not check database revocation, so retain all service token-row, hash, expiry and revocation checks. The actor guard must never be attached to public credential/action-token routes.

**Global provider, `src/app.module.ts:5,99`.** Current:
```ts
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
{ provide: APP_GUARD, useClass: ThrottlerGuard },
```

Suggested:
```ts
import { ThrottlerModule } from '@nestjs/throttler';
import { CoarseIpThrottlerGuard } from './core/guards/rate-limit.guard';
{ provide: APP_GUARD, useClass: CoarseIpThrottlerGuard },
```

Keep `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` at `:61–67` numerically unchanged. It supplies the actual `default` policy; actor endpoints without explicit overrides continue to inherit it until C8 additions. Coarse IP policy overrides role-protected requests inside `handleRequest`; public requests retain their decorators/defaults.

**Local placements:** in every file listed below, add the import:
```ts
import { VerifiedActorThrottlerGuard } from '@/core/guards/rate-limit.guard';
```

At each current `@UseGuards` location, append `VerifiedActorThrottlerGuard` **after AuthRolesGuard**, preserving every existing guard, role, comment and other decorator. Nest discovers guards referenced in `@UseGuards`; the globally exported throttler providers supply their dependencies. Do not bind this actor guard through APP_GUARD.

Grouped literal replacements, followed by the complete file/line application list:

**G1:**

Current:
```ts
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(AdminAccessTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G2:**

Current:
```ts
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(MemberAccessTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G3:**

Current:
```ts
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(StaffAccessTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G4:**

Current:
```ts
@UseGuards(
    AdminAccessTokenAuthGuard,
    AdminRefreshTokenAuthGuard,
    AuthRolesGuard,
  )
```

Suggested replacement:
```ts
@UseGuards(AdminAccessTokenAuthGuard, AdminRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G5:**

Current:
```ts
@UseGuards(
    OwnerAccessTokenAuthGuard,
    OwnerRefreshTokenAuthGuard,
    AuthRolesGuard,
  )
```

Suggested replacement:
```ts
@UseGuards(OwnerAccessTokenAuthGuard, OwnerRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G6:**

Current:
```ts
@UseGuards(AdminRefreshTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(AdminRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G7:**

Current:
```ts
@UseGuards(OwnerRefreshTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(OwnerRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G8:**

Current:
```ts
@UseGuards(StaffRefreshTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(StaffRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G9:**

Current:
```ts
@UseGuards(MemberRefreshTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(MemberRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G10:**

Current:
```ts
@UseGuards(
    StaffAccessTokenAuthGuard,
    StaffRefreshTokenAuthGuard,
    AuthRolesGuard,
  )
```

Suggested replacement:
```ts
@UseGuards(StaffAccessTokenAuthGuard, StaffRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G11:**

Current:
```ts
@UseGuards(
    MemberAccessTokenAuthGuard,
    MemberRefreshTokenAuthGuard,
    AuthRolesGuard,
  )
```

Suggested replacement:
```ts
@UseGuards(MemberAccessTokenAuthGuard, MemberRefreshTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

**G12:**

Current:
```ts
@UseGuards(OwnerAccessTokenAuthGuard, AuthRolesGuard)
```

Suggested replacement:
```ts
@UseGuards(OwnerAccessTokenAuthGuard, AuthRolesGuard, VerifiedActorThrottlerGuard)
```

| File relative to backend | Exact current line | Class / method | Replacement |
|---|---|---|---|
| `src/modules/attendances/admin-attendances.controller.ts` | 22 | `AdminAttendancesController` | G1 |
| `src/modules/attendances/member-attendances.controller.ts` | 23 | `MemberAttendancesController` | G2 |
| `src/modules/attendances/staff-attendances.controller.ts` | 22 | `StaffAttendancesController` | G3 |
| `src/modules/auth/auth.controller.ts` | 90 | `logoutAdmin` | G4 |
| `src/modules/auth/auth.controller.ts` | 115 | `logoutOwner` | G5 |
| `src/modules/auth/auth.controller.ts` | 180 | `refreshAdmin` | G6 |
| `src/modules/auth/auth.controller.ts` | 212 | `refreshOwner` | G7 |
| `src/modules/auth/auth.controller.ts` | 244 | `refreshStaff` | G8 |
| `src/modules/auth/auth.controller.ts` | 276 | `refreshMember` | G9 |
| `src/modules/auth/auth.controller.ts` | 338 | `logoutStaff` | G10 |
| `src/modules/auth/auth.controller.ts` | 429 | `logoutMember` | G11 |
| `src/modules/dashboards/admin-dashboards.controller.ts` | 13 | `AdminDashboardController` | G1 |
| `src/modules/dashboards/staff-dashboards.controller.ts` | 13 | `StaffDashboardController` | G3 |
| `src/modules/feedbacks/admin-feedbacks.controller.ts` | 24 | `AdminFeedbacksController` | G1 |
| `src/modules/feedbacks/member-feedbacks.controller.ts` | 27 | `MemberFeedbacksController` | G2 |
| `src/modules/feedbacks/staff-feedbacks.controller.ts` | 24 | `StaffFeedbacksController` | G3 |
| `src/modules/members/admin-members.controller.ts` | 31 | `AdminMembersController` | G1 |
| `src/modules/members/staff-members.controller.ts` | 31 | `StaffMembersController` | G3 |
| `src/modules/membership-plans/admin-membership-plans.controller.ts` | 29 | `AdminMembershipPlansController` | G1 |
| `src/modules/membership-plans/member-membership-plans.controller.ts` | 21 | `MemberMembershipPlansController` | G2 |
| `src/modules/membership-plans/staff-membership-plans.controller.ts` | 21 | `StaffMembershipPlansController` | G3 |
| `src/modules/memberships/admin-memberships.controller.ts` | 21 | `AdminMembershipsController` | G1 |
| `src/modules/memberships/member-memberships.controller.ts` | 19 | `MemberMembershipsController` | G2 |
| `src/modules/memberships/staff-memberships.controller.ts` | 21 | `StaffMembershipsController` | G3 |
| `src/modules/notifications/admin-notifications.controller.ts` | 22 | `AdminNotificationsController` | G1 |
| `src/modules/notifications/member-notifications.controller.ts` | 22 | `MemberNotificationsController` | G2 |
| `src/modules/payments/admin-payments.controller.ts` | 21 | `AdminPaymentsController` | G1 |
| `src/modules/payments/member-payments.controller.ts` | 21 | `MemberPaymentsController` | G2 |
| `src/modules/payments/staff-payments.controller.ts` | 21 | `StaffPaymentsController` | G3 |
| `src/modules/platform/owners/owners.controller.ts` | 20 | `OwnersController` | G12 |
| `src/modules/platform/plans/plans.controller.ts` | 32 | `addPlan` | G12 |
| `src/modules/platform/plans/plans.controller.ts` | 41 | `addPlanDuration` | G12 |
| `src/modules/platform/plans/plans.controller.ts` | 50 | `update` | G12 |
| `src/modules/platform/plans/plans.controller.ts` | 59 | `updatePlanDuration` | G12 |
| `src/modules/platform/plans/plans.controller.ts` | 71 | `removePlanDuration` | G12 |
| `src/modules/platform/plans/plans.controller.ts` | 80 | `removePlan` | G12 |
| `src/modules/platform/subscriptions/admin-subscriptions.controller.ts` | 19 | `AdminSubscriptionsController` | G1 |
| `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` | 24 | `OwnerSubscriptionsController` | G12 |
| `src/modules/profiles/admin-profiles.controller.ts` | 29 | `AdminProfilesController` | G1 |
| `src/modules/profiles/member-profiles.controller.ts` | 27 | `MemberProfilesController` | G2 |
| `src/modules/profiles/owner-profiles.controller.ts` | 27 | `OwnerProfilesController` | G12 |
| `src/modules/profiles/staff-profiles.controller.ts` | 27 | `StaffProfilesController` | G3 |
| `src/modules/staffs/staffs.controller.ts` | 26 | `StaffsController` | G1 |
| `src/modules/visits/admin-visits.controller.ts` | 21 | `AdminVisitsController` | G1 |
| `src/modules/visits/member-visits.controller.ts` | 25 | `MemberVisitsController` | G2 |
| `src/modules/visits/staff-visits.controller.ts` | 21 | `StaffVisitsController` | G3 |
| `src/modules/working-hours/admin-special-hours.controller.ts` | 27 | `AdminSpecialHoursController` | G1 |
| `src/modules/working-hours/admin-working-hours.controller.ts` | 27 | `AdminWorkingHoursController` | G1 |
| `src/modules/working-hours/member-special-hours.controller.ts` | 21 | `MemberSpecialHoursController` | G2 |
| `src/modules/working-hours/member-working-hours.controller.ts` | 22 | `MemberWorkingHoursController` | G2 |
| `src/modules/working-hours/staff-special-hours.controller.ts` | 21 | `StaffSpecialHoursController` | G3 |
| `src/modules/working-hours/staff-working-hours.controller.ts` | 22 | `StaffWorkingHoursController` | G3 |

**Why / legitimate example:** fifty members can each load a profile and membership record without sharing a 60/120-hit account budget. A single account looping through 100 different IDs still shares that handler's account counter. A cross-route 1,200/minute IP ceiling limits pre-auth floods and total bursts from one network; it deliberately counts failed authorization and actor-limit rejects too. This is stricter across routes than today's independent IP buckets. Measure NAT traffic before choosing a different ceiling.

**Remaining concerns:** a single actor can still consume multiple independent endpoint budgets; add measured actor/tenant aggregate quotas for expensive workflows if needed. New protected routes must have both role metadata and the actor guard; audit that invariant during implementation. The sample relies on the current absence of skips/custom per-route trackers. Headers can be overwritten by the later actor guard: success headers describe the final actor policy, whereas a coarse-IP rejection returns its own Retry-After. If clients need both, namespace the coarse-layer headers as a follow-up, preserving a standard Retry-After on rejection. R3 must provide cross-process storage for both layers.

### R2 — P1 REVIEW: target and delivery budgets before C2/C3

The following are **additional controls**, not substitutes for the IP guard. Their implementation requires an atomic shared primitive; no such application service exists, so no fictitious import or drop-in decorator is supplied. Placement is after request validation/canonicalization and before costly password comparison, token creation or outbound delivery as appropriate. Existing guards run before pipes, so a raw guard body must not be assumed to have DTO normalization.

| Control and starting values | Existing source/line to review | Key / behavior / effect |
|---|---|---|
| Login target failures: 10 failures / `900_000` ms (15 min); pair budget 5 failures / `60_000` ms (1 min) | `src/modules/auth/auth.provider.ts:176,490,1054` | Shared canonical account identifier plus role namespace, and identifier+trusted IP. Reserve/check atomically before bcrypt, settle only credential failures, bound parallel attempts, expire abandoned reservations. Apply to nonexistent identifiers too. Use progressive friction/delay and a recovery path to avoid an attacker imposing a permanent account lockout. C3's 60/minute IP limit is gated on this control. |
| Password recovery / verification / setup mail: 1 delivery / `60_000` ms (1 min) AND 3 deliveries / `3_600_000` ms (1 hour) per recipient+purpose | `auth.provider.ts:215,504,1075,789,1758,2012`; `src/modules/members/members.service.ts:574`; `src/modules/staffs/staffs.service.ts:361` | Enforce across login-triggered mail, direct recovery and admin/staff resend paths; do not create a new independent bucket for every route. Preserve valid-token suppression until product requirements change. Use a common suppression/claim for concurrent sends to the same target+purpose. |
| Email-change delivery: 1 / `60_000` ms AND 3 / `3_600_000` ms per destination+purpose, plus C5's actor limit | `src/modules/profiles/profiles.service.ts:175,527,908` | One actor cannot contact unlimited new addresses, and many accounts cannot harass one destination. Count delivered/attempted sends conservatively; do not release reservations blindly on an ambiguous provider timeout. |
| Signup: retain IP 5 / `600_000` ms (10 min), add recipient delivery policy and measured provider-wide quota | `src/modules/auth/auth.provider.ts:54,147,158` | Stop source-IP rotation bypassing all email/cost budgets. Registration/account creation needs its own daily/provider allowance derived from real capacity; no invented universal daily count. |
| Uniform recovery responses | `auth.provider.ts:794–812,1763–1781,2017–2035` | Same outward status/body for unknown, already-requested and successful targets; keep a real IP-overload 429 generic. Avoid leaking which target quota was exhausted. |

For budget keys, email normalization must match each DTO/database comparison (user login lowercases/trims at `src/modules/auth/dtos/login-user.dto.ts:7–13`; member/staff usernames are trimmed, not necessarily lowercased). Do not lowercase a case-sensitive username arbitrarily. Use an HMAC of canonical identifiers for operational keys/logs rather than storing raw email, credentials, tokens or wallet addresses. Independently stored action-token hashes already use SHA-256 of 32 random bytes (`src/core/utils/generate-action-token.ts:4–7`); keep expiry and atomic single-use checks.

**Legitimate example:** six users on one club IP can request recovery while one recipient's repeated requests are suppressed across all routes and IPs. **Abuse addressed:** distributed guessing, email harassment and read/create races that an IP-only decorator cannot stop. Choose pending/outbox or atomic reservation semantics so a failed send does not suppress a user indefinitely. These are design recommendations; no new schema, service or test was created.

### R3 — P1 REVIEW: shared storage, topology and resource capacity

- Current wiring is `src/app.module.ts:61–67`, shown above; no storage object is supplied. A future adapter must implement v6.5.0's `ThrottlerStorage.increment(key, ttl, limit, blockDuration, throttlerName)` and return `totalHits, timeToExpire, isBlocked, timeToBlockExpire`. TTL/block inputs are milliseconds; the returned time fields used by HTTP headers are seconds. Use object-form module options with `throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }]` and a `storage` instance, normally through `forRootAsync`. Keep the name default, otherwise every existing default decorator must be migrated. No installed throttler-Redis adapter was found; choose/implement and review one, rather than assuming Keyv is the adapter.
- Atomic increment plus expiry/block must work across instances. A cache get-then-set is unsafe. Use bounded key expiration, stable app/environment namespaces, separate coarse-IP/actor/recipient keys, bounded operation timeouts and connection reuse. Confirm the selected algorithm and headers rather than assuming the built-in timer algorithm is a textbook fixed or sliding window.
- Decide storage outage policy explicitly: for login/recovery/email/AI, prefer bounded fail-closed or a tightly limited local fallback with an availability response; for ordinary reads a bounded local fallback may be acceptable. Never silently treat a storage failure as unlimited traffic. A storage outage is not automatically a quota 429. No such outage policy is implemented today.
- Verify one-hop trust and prohibit direct public access to the application port before treating req.ip as trustworthy (`src/main.ts:21,92`). If topology varies, replace numeric trust with an explicitly configured trusted-proxy function/address policy after that review. No proxy address can be inferred from this backend. Normalize equivalent IP representations and assess IPv6 prefix aggregation against legitimate shared networks.
- Apply bounded page size and page/search validation to every list route, not just throttling. Existing `PaginationDto` can be wired into controllers in a separate code change. Add explicit timeouts, bounded concurrency and durable retry/idempotency/outbox handling for blockchain reward requests (`src/modules/members/members.service.ts:194,444`); cap provider-wide AI concurrency and retry-job work (`src/infrastructure/external-api/external-api.service.ts:19`; `src/jobs/sentiment.cron.ts:12`). On replicas, the hourly job has no distributed claim in the inspected code. Account-sized limits do not cap total provider demand across accounts.
- Do not “fix” the in-memory timer issue by lowering blockDuration in isolation. This storage resets a blocked key's hits when its block expires (`throttler.service.js:38–46,75–78`); a one-minute block on a 15-minute policy can effectively allow a fresh quota every minute after blocking. Choose expiry/block semantics as one policy and validate the adapter.

### C1–C12 — endpoint decorator changes

Each group gives all affected paths and **exact current decorator/insertion lines**. Code snippets replace only the decorator shown; unrelated decorators remain in place. For ADD, the current code is the HTTP decorator (no current throttle decorator); replace it with itself followed by the proposed throttle. All controllers in these groups already import `Throttle`, so no missing import is assumed. Apply the group's prerequisites first. The guard changes in R1 are required for the proposed actor values to work as described.

#### C1 — P1: refresh rotation

**Target:** 30 / `60_000` ms (1 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1 (all guard placements).

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/auth/admins/refresh` | `src/modules/auth/auth.controller.ts` | 179 | CHANGE |
| POST `/api/auth/owners/refresh` | `src/modules/auth/auth.controller.ts` | 211 | CHANGE |
| POST `/api/auth/staffs/refresh` | `src/modules/auth/auth.controller.ts` | 243 | CHANGE |
| POST `/api/auth/members/refresh` | `src/modules/auth/auth.controller.ts` | 275 | CHANGE |

Current code (variant 1):
```ts
@Throttle({ default: { limit: 60, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 30, ttl: 60_000 } })
```

Current code (variant 2):
```ts
@Throttle({ default: { limit: 5, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 30, ttl: 60_000 } })
```

**Why:** Bound bcrypt and token rotation per verified account while allowing multiple tabs/devices.

**Legitimate use:** Ten tabs can share one refresh and a few later refreshes; 30 requests/minute allows recovery bursts.

**Still addresses:** Refresh loops and repeated bcrypt/DB work; coordinate clients because rotated refresh tokens are single-use.

#### C2 — P1: password recovery

**Target:** 10 / `900_000` ms (15 min), per IP. **Prerequisite:** R2 atomic recipient budgets and uniform responses; retain existing values until then.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/auth/forgot-password` | `src/modules/auth/auth.controller.ts` | 147 | CHANGE |
| POST `/api/auth/staffs/forgot-password` | `src/modules/auth/auth.controller.ts` | 373 | CHANGE |
| POST `/api/auth/members/forgot-password` | `src/modules/auth/auth.controller.ts` | 464 | CHANGE |

Current code (variant 1):
```ts
@Throttle({ default: { limit: 3, ttl: 3_600_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 10, ttl: 900_000 } })
```

Current code (variant 2):
```ts
@Throttle({ default: { limit: 3, ttl: 3600_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 10, ttl: 900_000 } })
```

**Why:** Replace the club-wide three-per-hour recovery bottleneck with a moderate IP allowance.

**Legitimate use:** Six different members behind one club IP can request recovery within 15 minutes.

**Still addresses:** Email flooding and account discovery remain possible across IPs.

This proposal is deliberately gated. A decorator alone cannot supply R2's target/delivery protection. Keep the current value until those controls are deployed; the existing valid-token checks remain in place afterwards.

#### C3 — P1: public login

**Target:** 60 / `60_000` ms (1 min), per IP. **Prerequisite:** R2 failed-login and email budgets first; retain 20/minute until then.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/auth/login` | `src/modules/auth/auth.controller.ts` | 64 | CHANGE |
| POST `/api/auth/staffs/login` | `src/modules/auth/auth.controller.ts` | 312 | CHANGE |
| POST `/api/auth/members/login` | `src/modules/auth/auth.controller.ts` | 403 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 20, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 60, ttl: 60_000 } })
```

**Why:** Allow shared-IP sign-in bursts while separating target-account failures from the network budget.

**Legitimate use:** Thirty members can sign in during one minute on club Wi-Fi, with room for corrections.

**Still addresses:** Password guessing, password spraying, bcrypt work, and login-triggered setup/verification email.

This proposal is deliberately gated. A decorator alone cannot supply R2's target/delivery protection. Keep the current value until those controls are deployed; the existing valid-token checks remain in place afterwards.

#### C4 — P1: AI-backed feedback

**Target:** 3 / `600_000` ms (10 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1; this limit must be per verified member.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/members/feedbacks/create` | `src/modules/feedbacks/member-feedbacks.controller.ts` | 34 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 10, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 3, ttl: 600_000 } })
```

**Why:** Feedback creation invokes AI synchronously; a member rarely needs ten submissions per minute.

**Legitimate use:** A member can submit a review, correct a mistake, and submit a separate issue in ten minutes.

**Still addresses:** AI latency/cost, spam, and the hourly retry backlog; add a separate provider-wide concurrency budget.

#### C5 — P1: email-change requests

**Target:** 3 / `900_000` ms (15 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1; R2 recipient-wide delivery budget.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/users/admins/email-change` | `src/modules/profiles/admin-profiles.controller.ts` | 61 | CHANGE |
| POST `/api/users/members/email-change` | `src/modules/profiles/member-profiles.controller.ts` | 64 | CHANGE |
| POST `/api/users/owners/email-change` | `src/modules/profiles/owner-profiles.controller.ts` | 59 | CHANGE |
| POST `/api/users/staffs/email-change` | `src/modules/profiles/staff-profiles.controller.ts` | 59 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 5, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 3, ttl: 900_000 } })
```

**Why:** A password-confirmed email-change request sends email and invalidates previous links.

**Legitimate use:** An account holder can correct two mistyped new addresses within 15 minutes.

**Still addresses:** Mail cost, recipient harassment, repeated bcrypt work, and invalidation churn.

#### C6 — P1: profile uploads

**Target:** 5 / `600_000` ms (10 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1; do not apply this narrow quota to an entire club IP.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/users/admins/profile-image` | `src/modules/profiles/admin-profiles.controller.ts` | 134 | CHANGE |
| POST `/api/users/members/profile-image` | `src/modules/profiles/member-profiles.controller.ts` | 140 | CHANGE |
| POST `/api/users/owners/profile-image` | `src/modules/profiles/owner-profiles.controller.ts` | 132 | CHANGE |
| POST `/api/users/staffs/profile-image` | `src/modules/profiles/staff-profiles.controller.ts` | 135 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 10, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 5, ttl: 600_000 } })
```

**Why:** Cloudinary upload plus deletion is costlier than a normal profile read.

**Legitimate use:** A user can try five profile photos in ten minutes.

**Still addresses:** External upload/delete cost and memory pressure from concurrent 1 MiB multipart bodies.

Keep existing 1 MiB limits and binary PNG/JPEG/WebP validation. Keep DELETE profile-image at 10/minute per actor: deletion is a separate action and service checks prevent unlimited successful deletes of the same image. Per-account upload limits still need a global/tenant concurrency cap.

#### C7 — P1: setup-email resend

**Target:** 5 / `900_000` ms (15 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1; R2 recipient-wide delivery budget.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/admins/members/resend-set-password/:id` | `src/modules/members/admin-members.controller.ts` | 134 | CHANGE |
| POST `/api/staffs/members/resend-set-password/:id` | `src/modules/members/staff-members.controller.ts` | 134 | CHANGE |
| POST `/api/admins/staffs/resend-set-password/:id` | `src/modules/staffs/staffs.controller.ts` | 118 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 10, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 5, ttl: 900_000 } })
```

**Why:** Resending onboarding messages is infrequent and has a real email side effect.

**Legitimate use:** An administrator can help five different recipients recover setup messages in 15 minutes.

**Still addresses:** A compromised staff account contacting many recipients; recipient-specific suppression still needed.

#### C8 — P2: statistics aggregation budgets

**Target:** 30 / `60_000` ms (1 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1; keep current IP values until actor isolation is in place.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| GET `/api/members/attendances/stats` | `src/modules/attendances/member-attendances.controller.ts` | 51 | CHANGE |
| GET `/api/admins/feedbacks/stats` | `src/modules/feedbacks/admin-feedbacks.controller.ts` | 45 (insert after this HTTP decorator) | ADD |
| GET `/api/members/feedbacks/stats` | `src/modules/feedbacks/member-feedbacks.controller.ts` | 61 (insert after this HTTP decorator) | ADD |
| GET `/api/staffs/feedbacks/stats` | `src/modules/feedbacks/staff-feedbacks.controller.ts` | 45 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/members/stats` | `src/modules/members/admin-members.controller.ts` | 117 (insert after this HTTP decorator) | ADD |
| GET `/api/staffs/members/stats` | `src/modules/members/staff-members.controller.ts` | 117 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/membership-plans/stats` | `src/modules/membership-plans/admin-membership-plans.controller.ts` | 126 (insert after this HTTP decorator) | ADD |
| GET `/api/staffs/membership-plans/stats` | `src/modules/membership-plans/staff-membership-plans.controller.ts` | 40 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/memberships/stats` | `src/modules/memberships/admin-memberships.controller.ts` | 38 (insert after this HTTP decorator) | ADD |
| GET `/api/members/memberships/stats` | `src/modules/memberships/member-memberships.controller.ts` | 49 (insert after this HTTP decorator) | ADD |
| GET `/api/staffs/memberships/stats` | `src/modules/memberships/staff-memberships.controller.ts` | 38 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/notifications/stats` | `src/modules/notifications/admin-notifications.controller.ts` | 28 (insert after this HTTP decorator) | ADD |
| GET `/api/members/notifications/stats` | `src/modules/notifications/member-notifications.controller.ts` | 28 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/payments/stats` | `src/modules/payments/admin-payments.controller.ts` | 44 (insert after this HTTP decorator) | ADD |
| GET `/api/members/payments/stats` | `src/modules/payments/member-payments.controller.ts` | 42 (insert after this HTTP decorator) | ADD |
| GET `/api/staffs/payments/stats` | `src/modules/payments/staff-payments.controller.ts` | 44 (insert after this HTTP decorator) | ADD |
| GET `/api/owners/users/stats` | `src/modules/platform/owners/owners.controller.ts` | 37 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/subscriptions/stats` | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts` | 49 (insert after this HTTP decorator) | ADD |
| GET `/api/owners/subscriptions/stats` | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` | 55 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/staffs/stats` | `src/modules/staffs/staffs.controller.ts` | 70 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/visits/stats` | `src/modules/visits/admin-visits.controller.ts` | 54 (insert after this HTTP decorator) | ADD |
| GET `/api/members/visits/stats` | `src/modules/visits/member-visits.controller.ts` | 94 (insert after this HTTP decorator) | ADD |
| GET `/api/staffs/visits/stats` | `src/modules/visits/staff-visits.controller.ts` | 54 (insert after this HTTP decorator) | ADD |
| GET `/api/admins/working-hours/stats` | `src/modules/working-hours/admin-working-hours.controller.ts` | 76 (insert after this HTTP decorator) | ADD |
| GET `/api/members/working-hours/stats` | `src/modules/working-hours/member-working-hours.controller.ts` | 43 (insert after this HTTP decorator) | ADD |
| GET `/api/staffs/working-hours/stats` | `src/modules/working-hours/staff-working-hours.controller.ts` | 43 (insert after this HTTP decorator) | ADD |

Current code (variant 1):
```ts
@Throttle({ default: { limit: 100, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 30, ttl: 60_000 } })
```

Current code (variant 2):
```ts
@Get('stats')
```

Suggested replacement:
```ts
@Get('stats')
@Throttle({ default: { limit: 30, ttl: 60_000 } })
```

**Why:** Statistics run groupBy/count/aggregate queries and do not need detail-view polling rates.

**Legitimate use:** A statistics view can poll every 15 seconds and still allow 26 extra refreshes per minute.

**Still addresses:** Repeated aggregation load; a dashboard can fan out into several statistics requests.

The two dashboard endpoints already have 30/minute, so their numeric values are KEEP. Their five concurrent aggregation queries plus access checks (`src/modules/dashboards/dashboards.service.ts:15–79`) make 15–60 second polling a reasonable assumption to validate. Other stats use groupBy/aggregate/count work; none is a free cached scalar merely because its URL ends in stats. ADD does not mean it was previously unprotected.

#### C9 — P2: plan setup

**Target:** 20 / `60_000` ms (1 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| POST `/api/admins/membership-plans` | `src/modules/membership-plans/admin-membership-plans.controller.ts` | 38 | CHANGE |
| POST `/api/admins/membership-plans/durations` | `src/modules/membership-plans/admin-membership-plans.controller.ts` | 51 | CHANGE |
| POST `/api/plans` | `src/modules/platform/plans/plans.controller.ts` | 31 | CHANGE |
| POST `/api/plans/durations` | `src/modules/platform/plans/plans.controller.ts` | 40 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 20, ttl: 600_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 20, ttl: 60_000 } })
```

**Why:** Plan/duration creation is authenticated database work; a ten-minute setup lockout is unnecessarily long.

**Legitimate use:** An owner/admin can enter 12 duration variants, then start the next batch after a minute.

**Still addresses:** Accidental bulk writes and duplicate submissions remain bounded per actor.

#### C10 — P2: staff feedback list

**Target:** 60 / `60_000` ms (1 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| GET `/api/staffs/feedbacks` | `src/modules/feedbacks/staff-feedbacks.controller.ts` | 31 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 30, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 60, ttl: 60_000 } })
```

**Why:** Give staff the same list-navigation budget as administrators for the shared feedback service.

**Legitimate use:** A moderator can move through 30 pages and repeat a few page loads in a minute.

**Still addresses:** Database reads with related records; cap page size separately.

#### C11 — P2: member notification read marks

**Target:** 60 / `60_000` ms (1 min), per verified actor plus R1 IP ceiling. **Prerequisite:** R1.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| PATCH `/api/members/notifications/:id` | `src/modules/notifications/member-notifications.controller.ts` | 78 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 20, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 60, ttl: 60_000 } })
```

**Why:** Individual read marks should support reading a backlog and match the admin allowance.

**Legitimate use:** A member can open 40 unread notifications in a minute; mark-all remains a separate 20/minute action.

**Still addresses:** Rapid update loops remain limited; marking different IDs shares this handler counter.

#### C12 — P2: liveness probes

**Target:** 300 / `60_000` ms (1 min), per IP. **Prerequisite:** None for the decorator; verify actual probe rate and trusted source address.

| Method / full endpoint path | File relative to backend | Exact current line | Action |
|---|---|---|---|
| GET `/api/health` | `src/modules/health/health.controller.ts` | 9 | CHANGE |

Current code:
```ts
@Throttle({ default: { limit: 60, ttl: 60_000 } })
```

Suggested replacement:
```ts
@Throttle({ default: { limit: 300, ttl: 60_000 } })
```

**Why:** The health handler returns a constant object; 60/minute can reject overlapping probes.

**Legitimate use:** Three monitors polling every second make 180 requests/minute from one observed IP.

**Still addresses:** Public request floods still need an edge ceiling; this endpoint is liveness, not dependency readiness.

### R4 — P2: expose retry headers to browser clients

**File/line:** `src/main.ts:89`, inside the existing CORS configuration. **Current code:**
```ts
maxAge: 86400, // * How long the browser caches the CORS preflight (OPTIONS) response. / 86400 = 24 hours.
```

**Suggested replacement:**
```ts
maxAge: 86400, // * How long the browser caches the CORS preflight (OPTIONS) response. / 86400 = 24 hours.
exposedHeaders: [
  'Retry-After',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
],
```

**Affected endpoints:** all controller responses consumed cross-origin by the allowed frontend origin. **Why:** `allowedHeaders` controls request headers and does not expose response headers. **Legitimate example:** a browser can read a 60-second Retry-After and disable the submit control with a countdown. **Abuse/resource concern:** prevents a browser client from accidentally amplifying 429s with blind retries. This does not grant additional origins or bypass any quota. If additional throttler names or header namespaces are introduced, expose their actual headers too.

## 4. User experience and validation

### Current behavior at the limit

For a bucket with limit L, the first L guard-admitted requests proceed to authentication/validation/handler execution; the next hit is blocked. All attempts count at this stage, including downstream 400/401/403/404/409/500 outcomes. Guard rejection happens before interceptors, multipart processing and handler work; transport/body parsing can already have occurred. An actor guard under R1 runs after authentication/role verification but still before pipes/interceptors.

The installed exception returns **HTTP 429** with message `ThrottlerException: Too Many Requests` (`node_modules/@nestjs/throttler/dist/throttler.exception.js:5–8`), through Nest's default error handling; no custom application exception filter was found. Expect the default error JSON to contain `statusCode: 429` and the message; clients should branch on status, not a brittle message string.

With current options, blockDuration defaults to the effective TTL (`throttler.guard.js:82–84`), starting when the key crosses the limit. A 3/hour recovery key can therefore block for **another hour from the fourth request**, not merely until the first request's hour ends. Rejected requests during an existing block do not extend its block timestamp in this storage. Keep in mind the timer-lifecycle issue noted in section 1.

The default policy emits an unsuffixed `Retry-After` **in seconds** on 429. Successful/admitted responses receive `X-RateLimit-Limit`, `X-RateLimit-Remaining` and `X-RateLimit-Reset`, with Reset a relative number of seconds, **not an epoch timestamp**. A freshly blocked response need not include the other three headers, because the guard throws before setting them. Remaining zero means the next immediate request may be rejected. Treat Reset as guidance from the adapter; the built-in count/timer behavior is not a guarantee that an entire quota returns at that moment. Retry-After is the relevant instruction after a block.

### Recommended client behavior (frontend assumptions, not inspected)

- On 429, honor Retry-After; if it is inaccessible/missing/invalid, use a bounded exponential backoff with jitter and a visible “try again” time. Never spin or immediately retry all failed requests. Handle integer seconds and HTTP-date form for interoperability, though this backend currently sends seconds.
- Keep already loaded data visible. Debounce searches (for example 300–500 ms as a starting UX setting), cancel obsolete requests, cache/deduplicate repeated reads, and avoid a response-triggered polling loop. Poll statistics around every 15–60 seconds only if the feature needs it; pause on hidden tabs/backoff and avoid synchronized bursts.
- One screen may request profile, membership, notification counts and multiple stats; that fan-out is an **assumption**. Today these use independent handler buckets; R1's coarse IP bucket sums them. Requests for successive search terms or pages on the same handler always share a bucket.
- Use a single refresh in flight per browser session, queue waiting requests, and retry a protected operation at most once after a successful refresh. Coordinate tabs where appropriate. Do not refresh in response to a 429. Token rotation is single-use: concurrent refreshes can yield 401 even under the limit (`src/modules/auth/auth.provider.ts:1398–1412` and corresponding staff/member paths).
- For login/recovery/upload/subscription/member-creation/AI mutations, retain form state and let the user retry deliberately. Do not automatically replay a mutation after a network timeout: the operation may already have created records, sent mail, rotated a token or triggered a reward. Rate limiting does not provide idempotency.
- Distinguish a token already requested (currently often 401), a business conflict (409), an expired/invalid token, provider failure and an actual 429. Improve generic recovery responses through R2 without falsely attributing all errors to throttling. Per-target silent email suppression should not reveal account existence.

### Measurements to collect before tuning further

Collect per route template and policy, not raw `:id` URLs: admitted/rejected counts, 429 fraction by coarse-IP versus actor/recipient policy, requests per 1/10/15-minute window at p50/p95/p99, concurrent requests, NAT fan-out, users/tabs per account, retry amplification and rejection duration. Record privacy-preserving identifiers; redact tokens/query strings and never log passwords, authorization/cookie values or raw recipient identifiers.

Correlate those with CPU/event-loop lag (bcrypt), DB query duration/rows/connection wait/aggregation plans, page sizes and search latency, Redis operation latency/failures/key count/memory, provider email volume/delivery failures, AI latency/5-second timeouts/retry backlog, Cloudinary upload bytes/concurrency/errors and blockchain backlog/timeout/duplicate rewards. Separate human navigation from health probes and automation. Measure cold-cache misses as well as cache hits.

Tune each family independently: increase browsing budgets only if legitimate p99 bursts need room and DB capacity permits; tighten/queue high-cost workloads when provider concurrency rises; use actor/tenant/provider budgets for aggregate protection. A low 429 rate alone does not prove effective abuse prevention. Compare login failures per target across IPs and recovery delivery counts, not just successes. No traffic measurements are asserted in this report.

### Short manual validation plan — proposed, not executed

Use an isolated non-production environment with controlled mail/AI/Cloudinary/blockchain doubles, a known proxy configuration and disposable accounts. None of these scenarios was run during this audit.

1. **Policy boundaries and headers:** choose a cheap endpoint; make L allowed requests and an L+1 request with one identity. Verify 429, seconds-based Retry-After, recovery after the documented block, CORS exposure from an allowed browser origin, and that rejected requests do not reach service work. Check a downstream validation failure also consumes the right counter. Check GET and HEAD share the same bucket.
2. **Shared IP:** place 10–50 different members/staff behind one trusted forwarded IP. Exercise the same endpoint across accounts, then deliberately exceed one actor's quota. With R1, only that actor's handler budget should block unless the **combined protected-route** IP ceiling is exhausted. Spread requests across different endpoints to verify the coarse counter really is shared. Move one verified actor between IPs and confirm its actor quota persists.
3. **Authentication:** test valid/invalid/nonexistent login identifiers, distributed failures against one target, recovery for six different users on one IP, repeated setup/verification/resend requests, mixed login-plus-resend paths and concurrent duplicate sends. Confirm generic outward responses and atomic recipient reservations. Never rely on real victims or real outbound delivery for these checks.
4. **Refresh:** multiple tabs issue simultaneous expired-access requests. Confirm single-flight behavior, correct refresh-cookie role, stable actor identity across jti rotation, no refresh on 429, and no infinite retry after a rotation conflict/401. Validate logout still runs its original access+refresh+role guards.
5. **Rapid searches and pagination:** type/backspace quickly, switch filters and pages, and open details. Confirm shared handler accounting, cancellation/debounce, and that stats/detail requests have their own actor buckets. Separately verify page-size/deep-page limits once implemented; owner search is currently ignored in the services cited above.
6. **Dashboard/notification bursts:** load several screens/tabs, poll stats at the intended cadence, open 40 notifications, mark all as read, and scan check-ins in a reception burst. Verify that no low-cost allowed behavior produces a retry cascade. Include shared-IP combined load, not just a single account.
7. **Resource costs:** submit up to three feedbacks in ten minutes, five profile-photo attempts in ten minutes, create/renew members and perform plan setup batches. Confirm the intended actor limits, 1 MiB file cap, bounded provider concurrency and idempotency behavior. The per-handler decorator cannot itself verify provider-wide budgets.
8. **Multiple instances / outages / storage lifecycle:** distribute one identity across two app processes, restart one, interrupt shared storage, and confirm the chosen policy. For the currently installed memory implementation, inspect a sequence where key A unblocks while unrelated key B still has pending expirations; validate the timer interference concern before/after replacing storage. Verify inactive-key reclamation. Check that cron retries are claimed once if multiple replicas run them.
9. **Proxy addressing:** compare direct access, trusted one-hop forwarding, extra/shorter paths and spoofed forwarding input only in the isolated environment. Confirm that external users cannot pick arbitrary tracker IPs. Check equivalent IPv4/mapped-IPv6 representations and legitimate shared IPv6 traffic before applying prefix grouping.

### Audit integrity and verification

The endpoint table was derived from TypeScript syntax trees of the actual controllers, excluding comments, then checked against module registrations and bootstrap routing. It contains all 194 explicit controller endpoints (167 overrides, 27 inherited defaults), plus documented implicit HEAD and development/middleware routes. Each of the 55 endpoint ADD/CHANGE entries has a corresponding C1–C12 source location and current/replacement snippet; R1 lists all 52 authentication guard placements.

Verification for this deliverable is static: endpoint/source-line consistency, recommendation coverage, and a before/after content-hash comparison of backend project files, including dist and the lockfile, excluding this report, node_modules, virtual metadata directories and actual environment/credential files. All 194 inventory source lines match active HTTP decorators; the proposed guard code passes a TypeScript syntax parse, without compilation or execution. No packages were installed; no services, application bootstrap, HTTP calls, formatting, linting, tests, database changes, commits or pushes were performed. Only `backend/docs/rate-limiting-audit.md` is written by this audit. During the audit, unrelated external edits changed recovery error messages in `src/modules/auth/auth.provider.ts`; they were preserved, and report references were refreshed to that current tree. The initial project digest changed while the audit was running, and Git reports this concurrent application-file edit. A fresh snapshot immediately before saving and a comparison after saving exclude that concurrently edited file and this report: all 977 remaining project files have an identical aggregate content hash. Final scoped Git status shows the new report and the unrelated auth.provider.ts modification. The revised recovery messages still use exception statuses for nonexistent accounts, so uniform status/body behavior remains a recommendation.

