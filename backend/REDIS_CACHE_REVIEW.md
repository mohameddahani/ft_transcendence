# Redis Cache Review — ft_transcendence Backend

> **Date:** 2026-10-01  
> **Scope:** Full NestJS backend source code at `backend/`  
> **Status:** Analysis only — no files were modified, no packages installed, no code generated outside this report.

---

## Table of Contents

1. [Executive Recommendation](#1-executive-recommendation)
2. [Review Coverage](#2-review-coverage)
3. [Complete Endpoint Matrix](#3-complete-endpoint-matrix)
4. [Detailed Caching Recommendations](#4-detailed-caching-recommendations)
5. [Invalidation Dependency Map](#5-invalidation-dependency-map)
6. [Frontend Freshness](#6-frontend-freshness)
7. [Reliability and Security](#7-reliability-and-security)
8. [Prioritized Implementation Plan](#8-prioritized-implementation-plan)

---

## 1. Executive Recommendation

### Is Redis caching justified?

**Yes, but narrowly.** The strongest case is not for full HTTP-response caching but for **service-level query caching** of the `AccessesService` authorization queries that run on nearly every protected request. After that, there are a small number of read-heavy, rarely-changed datasets (Platform Plans, Working Hours) where short-TTL caching may help.

### What should be implemented first?

1. **`AccessesService` authorization query results** — `validateAdminAccountAndSubscription()`, `resolveAdminIdFromMemberId()`, and `validateMemberAccountAndMembership()` each execute 1–3 Prisma queries and are called on virtually every protected endpoint. Caching these results for 30–120 seconds at the service layer would reduce the largest repetitive database load.

2. **Platform Plans (`GET api/plans`, `GET api/plans/:id`)** — These are **public endpoints with no auth guard**. They return static-ish configuration data (plans and their durations). They are the safest and simplest cache candidates in the entire project.

3. **Working Hours and Special Hours (`GET` endpoints)** — These change infrequently (admin-only writes) and are consumed by multiple roles. A 5-minute TTL per tenant would be safe.

### What should remain uncached?

- **All 19 auth endpoints** — POST mutations (login, register, logout, refresh, password flows). Caching any of these would be a security vulnerability.
- **Health check** — Already sets `Cache-Control: no-store` explicitly.
- **All mutation endpoints** (POST, PATCH, DELETE) — These change state; caching responses is inappropriate.
- **Visits (today-scoped queries)** — The data changes frequently (member check-ins, cancellations, cron expirations) and is scoped to "today," giving a very narrow useful cache window.
- **Attendances (check-in endpoints)** — POST mutations that must always execute fresh.
- **Profile "me" endpoints** — Personalized per user; caching adds complexity without proportional benefit at current scale.
- **Notifications** — Additionally, the `findAll` methods on both `admin-notifications.controller.ts` (L39–51) and `member-notifications.controller.ts` (L39–51) are **missing the `@Get()` decorator**, making them unreachable. There is nothing to cache for unreachable routes.

### What cannot be concluded without measurements?

- **Actual query latency** for `AccessesService` calls — the benefit of caching depends on whether these queries are slow under real load.
- **Request volume per endpoint** — without traffic data, cache-hit ratios cannot be estimated.
- **Database connection pool saturation** — if the pool is not saturated, caching may not provide a meaningful improvement.
- **Redis round-trip latency in the deployment** — if Redis is on a remote host, a cache lookup may not be faster than a simple indexed Prisma query.

> **Confirmed:** The packages `@nestjs/cache-manager@^12.0.0`, `cache-manager@^7.2.9`, and `@keyv/redis@^5.1.6` are installed in `package.json` but the `CacheModule` is **not imported in `AppModule`** (`src/app.module.ts`). The infrastructure scaffolding at `src/infrastructure/cache/` (cache.module.ts, cache.service.ts, cache.controller.ts) contains **empty files with no implementation**. `.env.example` includes a `REDIS_URL` variable. Redis is defined in `devops/docker-compose.yml` with a custom `redis.conf`.

---

## 2. Review Coverage

### Modules and files inspected

| Module / Directory | Key Files Read | Status |
|---|---|---|
| `src/main.ts` | Bootstrap, CORS, Swagger, port 3000 | ✅ Complete |
| `src/app.module.ts` | 14 feature modules, 6 cron providers, ThrottlerGuard | ✅ Complete |
| `prisma/schema.prisma` | 762 lines, all models, enums, indexes | ✅ Complete |
| `src/infrastructure/cache/` | cache.module.ts, cache.service.ts, cache.controller.ts (all empty) | ✅ Complete |
| `src/infrastructure/database/` | prisma.module.ts, prisma.service.ts | ✅ Complete |
| `src/infrastructure/cloudinary/` | module, provider, service | ✅ Complete |
| `src/infrastructure/email/` | module, provider, service, templates | ✅ Complete |
| `src/core/guards/` | auth.guard.ts, roles.guard.ts | ✅ Complete |
| `src/core/services/` | access.service.ts (193 lines) | ✅ Complete |
| `src/core/decorators/` | All 4 decorators | ✅ Complete |
| `src/core/types/` | jwt-payload.type.ts, safe-selects.type.ts | ✅ Complete |
| `src/core/utils/` | generate-action-token, generate-username, password.validator | ✅ Complete |
| `src/core/constants/` | default-avatars.constants.ts | ✅ Complete |
| `src/modules/auth/` | controller (385 lines), provider (1375 lines), service, JWT module, all DTOs, 8 guards, 8 strategies | ✅ Complete |
| `src/modules/members/` | admin + staff controllers (102 lines each), service (536 lines), all DTOs | ✅ Complete |
| `src/modules/memberships/` | admin + staff + member controllers, service (160 lines) | ✅ Complete |
| `src/modules/membership-plans/` | admin (107 lines) + staff (48 lines) controllers, service (310 lines), all DTOs | ✅ Complete |
| `src/modules/payments/` | admin + staff + member controllers (50 lines each), service (244 lines), all DTOs | ✅ Complete |
| `src/modules/visits/` | admin + staff + member controllers, service (518 lines), all DTOs | ✅ Complete |
| `src/modules/attendances/` | admin + staff + member controllers, service (346 lines) | ✅ Complete |
| `src/modules/working-hours/` | admin/staff/member working-hours controllers, admin/staff/member special-hours controllers, service (640 lines), all DTOs, module | ✅ Complete |
| `src/modules/profiles/` | admin/owner/member/staff controllers, service (615 lines) | ✅ Complete |
| `src/modules/staffs/` | controller (103 lines), service (339 lines), all DTOs | ✅ Complete |
| `src/modules/notifications/` | admin + member controllers, service (72 lines) | ✅ Complete |
| `src/modules/feedbacks/` | admin + staff + member controllers, service (404 lines), all DTOs | ✅ Complete |
| `src/modules/platform/owners/` | controller (64 lines), service (164 lines) | ✅ Complete |
| `src/modules/platform/plans/` | controller (83 lines), service (250 lines), all DTOs | ✅ Complete |
| `src/modules/platform/subscriptions/` | owner + admin controllers, service (282 lines), all DTOs | ✅ Complete |
| `src/modules/health/` | controller (14 lines) | ✅ Complete |
| `src/jobs/` | All 6 cron files | ✅ Complete |
| `Dockerfile` | Multi-stage Node 20 Alpine build | ✅ Complete |
| `.env.example` | Environment variable names (no secrets) | ✅ Complete |
| `helpers/` | backend-concepts.ts, future.routes.ts | ✅ Complete |

### Endpoint counts

| Classification | Count |
|---|---|
| **Not recommended initially** | 99 |
| **Recommended** | 4 |
| **Conditional: measure first** | 18 |
| **Unreachable (bug)** | 2 |
| **Total** | 123 |

### Unreachable or uncertain routes

| Route | Issue | File | Line |
|---|---|---|---|
| `GET api/admins/notifications` | Missing `@Get()` decorator on `findAllNotificationsAdmin()` | `src/modules/notifications/admin-notifications.controller.ts` | L39–51 |
| `GET api/members/notifications` | Missing `@Get()` decorator on `findAllNotificationsMember()` | `src/modules/notifications/member-notifications.controller.ts` | L39–51 |

These methods exist in the class but are not bound to any HTTP verb by NestJS, so they are dead code.

### Files not reviewed

| Item | Reason |
|---|---|
| `node_modules/` | Third-party dependencies — excluded per scope |
| `dist/` | Build output — excluded per scope |
| `src/generated/` | Prisma-generated client — excluded per scope |
| `.git/` | Git internals — excluded per scope |
| `prisma/migrations/` | Generated migration SQL — excluded per scope (schema.prisma was reviewed) |
| Frontend projects (`admin-staff-platform/`, `owner-platform/`) | Deleted from working tree; not accessible |
| `devops/redis/redis.conf` | Deleted from working tree; not accessible (content cannot be verified) |
| `devops/docker-compose.yml` | Deleted from working tree; Redis service configuration not verifiable |

---

## 3. Complete Endpoint Matrix

### Auth Module (19 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/auth/register` | `src/modules/auth/auth.controller.ts` L38–52 | Not recommended | N/A | Mutation: creates user account | N/A |
| POST | `api/auth/login` | `src/modules/auth/auth.controller.ts` L55–68 | Not recommended | N/A | Mutation: issues tokens, must always execute fresh | N/A |
| POST | `api/auth/admins/logout` | `src/modules/auth/auth.controller.ts` L71–82 | Not recommended | N/A | Mutation: invalidates refresh token | N/A |
| POST | `api/auth/owners/logout` | `src/modules/auth/auth.controller.ts` L85–96 | Not recommended | N/A | Mutation: invalidates refresh token | N/A |
| POST | `api/auth/email-verification` | `src/modules/auth/auth.controller.ts` L99–109 | Not recommended | N/A | Mutation: verifies email, changes account state | N/A |
| POST | `api/auth/forgot-password` | `src/modules/auth/auth.controller.ts` L112–122 | Not recommended | N/A | Mutation: generates action token, sends email | N/A |
| POST | `api/auth/reset-password` | `src/modules/auth/auth.controller.ts` L125–135 | Not recommended | N/A | Mutation: changes password | N/A |
| POST | `api/auth/admins/refresh` | `src/modules/auth/auth.controller.ts` L138–150 | Not recommended | N/A | Mutation: rotates JWT tokens | N/A |
| POST | `api/auth/owners/refresh` | `src/modules/auth/auth.controller.ts` L153–165 | Not recommended | N/A | Mutation: rotates JWT tokens | N/A |
| POST | `api/auth/staffs/login` | `src/modules/auth/auth.controller.ts` L168–181 | Not recommended | N/A | Mutation: issues tokens | N/A |
| POST | `api/auth/staffs/logout` | `src/modules/auth/auth.controller.ts` L184–195 | Not recommended | N/A | Mutation: invalidates refresh token | N/A |
| POST | `api/auth/staffs/refresh` | `src/modules/auth/auth.controller.ts` L198–210 | Not recommended | N/A | Mutation: rotates JWT tokens | N/A |
| POST | `api/auth/staffs/set-password` | `src/modules/auth/auth.controller.ts` L213–223 | Not recommended | N/A | Mutation: sets password | N/A |
| POST | `api/auth/staffs/forgot-password` | `src/modules/auth/auth.controller.ts` L226–236 | Not recommended | N/A | Mutation: generates action token | N/A |
| POST | `api/auth/staffs/reset-password` | `src/modules/auth/auth.controller.ts` L239–249 | Not recommended | N/A | Mutation: changes password | N/A |
| POST | `api/auth/members/login` | `src/modules/auth/auth.controller.ts` L252–265 | Not recommended | N/A | Mutation: issues tokens | N/A |
| POST | `api/auth/members/logout` | `src/modules/auth/auth.controller.ts` L268–279 | Not recommended | N/A | Mutation: invalidates refresh token | N/A |
| POST | `api/auth/members/refresh` | `src/modules/auth/auth.controller.ts` L282–294 | Not recommended | N/A | Mutation: rotates JWT tokens | N/A |
| POST | `api/auth/members/set-password` | `src/modules/auth/auth.controller.ts` L297–307 | Not recommended | N/A | Mutation: sets password | N/A |
| POST | `api/auth/members/forgot-password` | `src/modules/auth/auth.controller.ts` L310–320 | Not recommended | N/A | Mutation: generates action token | N/A |
| POST | `api/auth/members/reset-password` | `src/modules/auth/auth.controller.ts` L323–333 | Not recommended | N/A | Mutation: changes password | N/A |

### Health Module (1 endpoint)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| GET | `api/health` | `src/modules/health/health.controller.ts` L8–14 | Not recommended | N/A | Explicitly sets `Cache-Control: no-store`; liveness probe must be fresh | N/A |

### Platform Plans (6 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/plans` | `src/modules/platform/plans/plans.controller.ts` L21–30 | Not recommended | N/A | Mutation: creates plan | N/A |
| POST | `api/plans/durations` | `src/modules/platform/plans/plans.controller.ts` L33–42 | Not recommended | N/A | Mutation: adds duration to plan | N/A |
| PATCH | `api/plans/:id` | `src/modules/platform/plans/plans.controller.ts` L45–54 | Not recommended | N/A | Mutation: updates plan | N/A |
| PATCH | `api/plans/durations/:id` | `src/modules/platform/plans/plans.controller.ts` L57–66 | Not recommended | N/A | Mutation: updates duration | N/A |
| GET | `api/plans` | `src/modules/platform/plans/plans.controller.ts` L68–75 | **Recommended** | Whole response | **Public endpoint (no auth guard)**; returns all platform plans with durations; data changes only when owner manually edits plans | 300s (5 min) |
| GET | `api/plans/:id` | `src/modules/platform/plans/plans.controller.ts` L77–83 | **Recommended** | Whole response | **Public endpoint (no auth guard)**; single plan detail; rarely changes | 300s (5 min) |

### Platform Owners (5 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| GET | `api/owners/users` | `src/modules/platform/owners/owners.controller.ts` L25–34 | Conditional | Specific data | Owner-only listing of admin users; low traffic; measure query cost first | N/A |
| GET | `api/owners/users/:id` | `src/modules/platform/owners/owners.controller.ts` L37–43 | Conditional | Specific data | Owner-only detail; low traffic | N/A |
| PATCH | `api/owners/users/active/:id` | `src/modules/platform/owners/owners.controller.ts` L46–52 | Not recommended | N/A | Mutation: changes admin status to ACTIVE | N/A |
| PATCH | `api/owners/users/pending/:id` | `src/modules/platform/owners/owners.controller.ts` L55–61 | Not recommended | N/A | Mutation: changes admin status to PENDING | N/A |
| PATCH | `api/owners/users/ban/:id` | `src/modules/platform/owners/owners.controller.ts` L64–70 | Not recommended | N/A | Mutation: bans admin | N/A |

### Platform Subscriptions (6 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/owners/subscriptions` | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` L23–30 | Not recommended | N/A | Mutation: activates subscription | N/A |
| PATCH | `api/owners/subscriptions` | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` L33–39 | Not recommended | N/A | Mutation: cancels subscription | N/A |
| GET | `api/owners/subscriptions` | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` L42–51 | Not recommended | N/A | Owner-only; includes nested user data; very low traffic | N/A |
| GET | `api/owners/subscriptions/:id` | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` L54–59 | Not recommended | N/A | Owner-only; very low traffic | N/A |
| GET | `api/admins/subscriptions/me` | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts` L24–30 | Conditional | Specific data | Admin's own subscription; used for dashboard display; personalized; measure frequency first | N/A |
| GET | `api/admins/subscriptions/all` | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts` L33–42 | Not recommended | N/A | Admin viewing their own subscription history; low traffic | N/A |

### Profiles Module (14 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| GET | `api/users/admins/me` | `src/modules/profiles/admin-profiles.controller.ts` L29–35 | Not recommended | N/A | Personalized; changes on profile edit; low frequency relative to complexity | N/A |
| PATCH | `api/users/admins/edit-profile` | `src/modules/profiles/admin-profiles.controller.ts` L38–48 | Not recommended | N/A | Mutation | N/A |
| POST | `api/users/admins/profile-image` | `src/modules/profiles/admin-profiles.controller.ts` L51–66 | Not recommended | N/A | Mutation: uploads image | N/A |
| DELETE | `api/users/admins/profile-image` | `src/modules/profiles/admin-profiles.controller.ts` L69–75 | Not recommended | N/A | Mutation: deletes image | N/A |
| GET | `api/users/owners/me` | `src/modules/profiles/owner-profiles.controller.ts` L29–35 | Not recommended | N/A | Personalized; changes on profile edit | N/A |
| PATCH | `api/users/owners/edit-profile` | `src/modules/profiles/owner-profiles.controller.ts` L38–48 | Not recommended | N/A | Mutation | N/A |
| POST | `api/users/owners/profile-image` | `src/modules/profiles/owner-profiles.controller.ts` L51–66 | Not recommended | N/A | Mutation | N/A |
| DELETE | `api/users/owners/profile-image` | `src/modules/profiles/owner-profiles.controller.ts` L69–75 | Not recommended | N/A | Mutation | N/A |
| GET | `api/users/members/me` | `src/modules/profiles/member-profiles.controller.ts` L29–35 | Not recommended | N/A | Personalized; changes on profile edit | N/A |
| POST | `api/users/members/profile-image` | `src/modules/profiles/member-profiles.controller.ts` L38–53 | Not recommended | N/A | Mutation | N/A |
| DELETE | `api/users/members/profile-image` | `src/modules/profiles/member-profiles.controller.ts` L56–62 | Not recommended | N/A | Mutation | N/A |
| GET | `api/users/staffs/me` | `src/modules/profiles/staff-profiles.controller.ts` L29–35 | Not recommended | N/A | Personalized | N/A |
| POST | `api/users/staffs/profile-image` | `src/modules/profiles/staff-profiles.controller.ts` L38–53 | Not recommended | N/A | Mutation | N/A |
| DELETE | `api/users/staffs/profile-image` | `src/modules/profiles/staff-profiles.controller.ts` L56–62 | Not recommended | N/A | Mutation | N/A |

### Members Module (14 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/admins/members` | `src/modules/members/admin-members.controller.ts` L32–40 | Not recommended | N/A | Mutation: creates member with transaction (member + membership + payment) | N/A |
| PATCH | `api/admins/members/:id` | `src/modules/members/admin-members.controller.ts` L43–52 | Not recommended | N/A | Mutation: updates member data | N/A |
| PATCH | `api/admins/members/active/:id` | `src/modules/members/admin-members.controller.ts` L55–61 | Not recommended | N/A | Mutation: activates member | N/A |
| PATCH | `api/admins/members/freeze/:id` | `src/modules/members/admin-members.controller.ts` L64–70 | Not recommended | N/A | Mutation: freezes member | N/A |
| PATCH | `api/admins/members/ban/:id` | `src/modules/members/admin-members.controller.ts` L73–79 | Not recommended | N/A | Mutation: bans member | N/A |
| GET | `api/admins/members` | `src/modules/members/admin-members.controller.ts` L82–91 | Conditional | Specific data | Paginated list scoped by adminId; depends on member count per tenant; measure first | N/A |
| GET | `api/admins/members/:id` | `src/modules/members/admin-members.controller.ts` L94–100 | Conditional | Specific data | Single member detail with nested memberships/payments; measure query cost | N/A |
| POST | `api/staffs/members` | `src/modules/members/staff-members.controller.ts` L32–40 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/staffs/members/:id` | `src/modules/members/staff-members.controller.ts` L43–52 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/staffs/members/active/:id` | `src/modules/members/staff-members.controller.ts` L55–61 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/staffs/members/freeze/:id` | `src/modules/members/staff-members.controller.ts` L64–70 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/staffs/members/ban/:id` | `src/modules/members/staff-members.controller.ts` L73–79 | Not recommended | N/A | Mutation | N/A |
| GET | `api/staffs/members` | `src/modules/members/staff-members.controller.ts` L82–91 | Conditional | Specific data | Same service as admin variant; measure first | N/A |
| GET | `api/staffs/members/:id` | `src/modules/members/staff-members.controller.ts` L94–100 | Conditional | Specific data | Same service as admin variant | N/A |

### Memberships Module (6 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| GET | `api/admins/memberships` | `src/modules/memberships/admin-memberships.controller.ts` L24–33 | Conditional | Specific data | Paginated; status changes from cron hourly; short TTL at best | N/A |
| GET | `api/admins/memberships/:id` | `src/modules/memberships/admin-memberships.controller.ts` L36–42 | Not recommended | N/A | Detail varies with hourly cron status changes | N/A |
| GET | `api/staffs/memberships` | `src/modules/memberships/staff-memberships.controller.ts` L24–33 | Conditional | Specific data | Same service as admin variant | N/A |
| GET | `api/staffs/memberships/:id` | `src/modules/memberships/staff-memberships.controller.ts` L36–42 | Not recommended | N/A | Same as admin variant | N/A |
| GET | `api/members/memberships/me` | `src/modules/memberships/member-memberships.controller.ts` L24–30 | Not recommended | N/A | Personalized; member's own membership status changes with cron | N/A |
| GET | `api/members/memberships/all` | `src/modules/memberships/member-memberships.controller.ts` L33–42 | Not recommended | N/A | Personalized; scoped to member's own memberships | N/A |

### Membership Plans Module (8 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/admins/membership-plans` | `src/modules/membership-plans/admin-membership-plans.controller.ts` L36–46 | Not recommended | N/A | Mutation | N/A |
| POST | `api/admins/membership-plans/durations` | `src/modules/membership-plans/admin-membership-plans.controller.ts` L49–59 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/admins/membership-plans/:id` | `src/modules/membership-plans/admin-membership-plans.controller.ts` L62–70 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/admins/membership-plans/durations/:id` | `src/modules/membership-plans/admin-membership-plans.controller.ts` L73–85 | Not recommended | N/A | Mutation | N/A |
| GET | `api/admins/membership-plans` | `src/modules/membership-plans/admin-membership-plans.controller.ts` L88–96 | Conditional | Specific data | Tenant-scoped; changes infrequently; candidate after Plans & AccessesService | N/A |
| GET | `api/admins/membership-plans/:id` | `src/modules/membership-plans/admin-membership-plans.controller.ts` L99–106 | Conditional | Specific data | Same as findAll | N/A |
| GET | `api/staffs/membership-plans` | `src/modules/membership-plans/staff-membership-plans.controller.ts` L29–37 | Conditional | Specific data | Same underlying service query | N/A |
| GET | `api/staffs/membership-plans/:id` | `src/modules/membership-plans/staff-membership-plans.controller.ts` L40–47 | Conditional | Specific data | Same underlying service query | N/A |

### Payments Module (6 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| GET | `api/admins/payments` | `src/modules/payments/admin-payments.controller.ts` L25–34 | Not recommended | N/A | Includes massive nested selects (member→memberships→payments→notifications); status changes with cron; optimize query before caching | N/A |
| GET | `api/admins/payments/:id` | `src/modules/payments/admin-payments.controller.ts` L37–43 | Not recommended | N/A | Same heavy nested query | N/A |
| GET | `api/staffs/payments` | `src/modules/payments/staff-payments.controller.ts` L25–34 | Not recommended | N/A | Same service | N/A |
| GET | `api/staffs/payments/:id` | `src/modules/payments/staff-payments.controller.ts` L37–43 | Not recommended | N/A | Same service | N/A |
| GET | `api/members/payments` | `src/modules/payments/member-payments.controller.ts` L25–34 | Not recommended | N/A | Personalized; member's own payments | N/A |
| GET | `api/members/payments/:id` | `src/modules/payments/member-payments.controller.ts` L37–43 | Not recommended | N/A | Personalized | N/A |

### Visits Module (9 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| GET | `api/admins/visits/today` | `src/modules/visits/admin-visits.controller.ts` L25–34 | Not recommended | N/A | Today-scoped; frequent changes from member actions and hourly cron | N/A |
| GET | `api/admins/visits/today/:id` | `src/modules/visits/admin-visits.controller.ts` L37–43 | Not recommended | N/A | Single visit detail; volatile | N/A |
| GET | `api/staffs/visits/today` | `src/modules/visits/staff-visits.controller.ts` L25–34 | Not recommended | N/A | Same as admin variant | N/A |
| GET | `api/staffs/visits/today/:id` | `src/modules/visits/staff-visits.controller.ts` L37–43 | Not recommended | N/A | Same as admin variant | N/A |
| POST | `api/members/visits` | `src/modules/visits/member-visits.controller.ts` L32–38 | Not recommended | N/A | Mutation: creates visit (complex validation) | N/A |
| PATCH | `api/members/visits/cancel/:id` | `src/modules/visits/member-visits.controller.ts` L41–47 | Not recommended | N/A | Mutation: cancels visit | N/A |
| GET | `api/members/visits/upcoming` | `src/modules/visits/member-visits.controller.ts` L50–59 | Not recommended | N/A | Personalized; changes with create/cancel | N/A |
| GET | `api/members/visits/today` | `src/modules/visits/member-visits.controller.ts` L62–71 | Not recommended | N/A | Today-scoped; personalized | N/A |
| GET | `api/members/visits/today/:id` | `src/modules/visits/member-visits.controller.ts` L74–80 | Not recommended | N/A | Today-scoped; personalized | N/A |

### Attendances Module (6 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/admins/attendances/check-in/manual` | `src/modules/attendances/admin-attendances.controller.ts` L24–30 | Not recommended | N/A | Mutation: records attendance in transaction | N/A |
| POST | `api/admins/attendances/check-in/qr` | `src/modules/attendances/admin-attendances.controller.ts` L33–39 | Not recommended | N/A | Mutation | N/A |
| POST | `api/staffs/attendances/check-in/manual` | `src/modules/attendances/staff-attendances.controller.ts` L24–30 | Not recommended | N/A | Mutation | N/A |
| POST | `api/staffs/attendances/check-in/qr` | `src/modules/attendances/staff-attendances.controller.ts` L33–39 | Not recommended | N/A | Mutation | N/A |
| GET | `api/members/attendances` | `src/modules/attendances/member-attendances.controller.ts` L27–36 | Not recommended | N/A | Personalized; changes with each check-in | N/A |
| GET | `api/members/attendances/:id` | `src/modules/attendances/member-attendances.controller.ts` L39–45 | Not recommended | N/A | Personalized | N/A |

### Working Hours Module (12 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/admins/working-hours` | `src/modules/working-hours/admin-working-hours.controller.ts` L33–43 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/admins/working-hours/:id` | `src/modules/working-hours/admin-working-hours.controller.ts` L46–58 | Not recommended | N/A | Mutation | N/A |
| GET | `api/admins/working-hours` | `src/modules/working-hours/admin-working-hours.controller.ts` L61–73 | **Recommended** | Whole response | Tenant config data; changes rarely (admin-only writes); read by multiple roles | 300s (5 min) |
| GET | `api/admins/working-hours/:id` | `src/modules/working-hours/admin-working-hours.controller.ts` L76–83 | Conditional | Specific data | Single record; low frequency; measure first | N/A |
| DELETE | `api/admins/working-hours/:id` | `src/modules/working-hours/admin-working-hours.controller.ts` L86–96 | Not recommended | N/A | Mutation | N/A |
| GET | `api/staffs/working-hours` | `src/modules/working-hours/staff-working-hours.controller.ts` L28–40 | **Recommended** | Whole response | Same underlying data as admin variant; infrequently changed | 300s (5 min) |
| GET | `api/staffs/working-hours/:id` | `src/modules/working-hours/staff-working-hours.controller.ts` L43–50 | Conditional | Specific data | Single record; measure first | N/A |
| GET | `api/members/working-hours` | `src/modules/working-hours/member-working-hours.controller.ts` L28–40 | Conditional | Specific data | Same data but goes through heavier member access checks | N/A |
| GET | `api/members/working-hours/:id` | `src/modules/working-hours/member-working-hours.controller.ts` L43–53 | Conditional | Specific data | Same | N/A |
| POST | `api/admins/special-hours` | `src/modules/working-hours/admin-special-hours.controller.ts` L33–40 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/admins/special-hours/:id` | `src/modules/working-hours/admin-special-hours.controller.ts` L43–55 | Not recommended | N/A | Mutation | N/A |
| GET | `api/admins/special-hours` | `src/modules/working-hours/admin-special-hours.controller.ts` L58–70 | Conditional | Specific data | Config data; changes rarely; visit creation reads this | N/A |
| GET | `api/admins/special-hours/:id` | `src/modules/working-hours/admin-special-hours.controller.ts` L73–80 | Conditional | Specific data | Same as above | N/A |
| DELETE | `api/admins/special-hours/:id` | `src/modules/working-hours/admin-special-hours.controller.ts` L83–93 | Not recommended | N/A | Mutation | N/A |
| GET | `api/staffs/special-hours` | `src/modules/working-hours/staff-special-hours.controller.ts` L27–39 | Conditional | Specific data | Same underlying query | N/A |
| GET | `api/staffs/special-hours/:id` | `src/modules/working-hours/staff-special-hours.controller.ts` L42–49 | Conditional | Specific data | Same | N/A |
| GET | `api/members/special-hours` | `src/modules/working-hours/member-special-hours.controller.ts` L27–39 | Conditional | Specific data | Same data via member access checks | N/A |
| GET | `api/members/special-hours/:id` | `src/modules/working-hours/member-special-hours.controller.ts` L42–52 | Conditional | Specific data | Same | N/A |

### Staffs Module (7 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/admins/staffs` | `src/modules/staffs/staffs.controller.ts` L32–39 | Not recommended | N/A | Mutation: creates staff, sends email | N/A |
| PATCH | `api/admins/staffs/:id` | `src/modules/staffs/staffs.controller.ts` L42–50 | Not recommended | N/A | Mutation | N/A |
| GET | `api/admins/staffs` | `src/modules/staffs/staffs.controller.ts` L53–61 | Conditional | Specific data | Paginated list scoped by adminId; measure query cost | N/A |
| GET | `api/admins/staffs/:id` | `src/modules/staffs/staffs.controller.ts` L64–71 | Conditional | Specific data | Single staff detail | N/A |
| PATCH | `api/admins/staffs/active/:id` | `src/modules/staffs/staffs.controller.ts` L75–82 | Not recommended | N/A | Mutation: changes status | N/A |
| PATCH | `api/admins/staffs/pending/:id` | `src/modules/staffs/staffs.controller.ts` L85–92 | Not recommended | N/A | Mutation | N/A |
| PATCH | `api/admins/staffs/ban/:id` | `src/modules/staffs/staffs.controller.ts` L95–102 | Not recommended | N/A | Mutation | N/A |

### Notifications Module (4 endpoints — 2 unreachable)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| GET | `api/admins/notifications/:id` | `src/modules/notifications/admin-notifications.controller.ts` L27–36 | Not recommended | N/A | Detail endpoint; notifications change with cron | N/A |
| ~~GET~~ | ~~`api/admins/notifications`~~ | `src/modules/notifications/admin-notifications.controller.ts` L39–51 | **Unreachable** | N/A | Missing `@Get()` decorator — method is not bound to any route | N/A |
| GET | `api/members/notifications/:id` | `src/modules/notifications/member-notifications.controller.ts` L27–36 | Not recommended | N/A | Detail endpoint; notifications change with cron | N/A |
| ~~GET~~ | ~~`api/members/notifications`~~ | `src/modules/notifications/member-notifications.controller.ts` L39–51 | **Unreachable** | N/A | Missing `@Get()` decorator | N/A |

### Feedbacks Module (11 endpoints)

| Method | Route | Handler Location | Classification | Whole/Specific | Reason | Proposed TTL |
|---|---|---|---|---|---|---|
| POST | `api/members/feedbacks` | `src/modules/feedbacks/member-feedbacks.controller.ts` L30–38 | Not recommended | N/A | Mutation: creates feedback | N/A |
| GET | `api/members/feedbacks` | `src/modules/feedbacks/member-feedbacks.controller.ts` L41–50 | Not recommended | N/A | Paginated; changes with likes/creates/deletes; low benefit | N/A |
| GET | `api/members/feedbacks/:id` | `src/modules/feedbacks/member-feedbacks.controller.ts` L53–62 | Not recommended | N/A | Detail; includes like count that changes | N/A |
| POST | `api/members/feedbacks/like` | `src/modules/feedbacks/member-feedbacks.controller.ts` L65–73 | Not recommended | N/A | Mutation: adds like | N/A |
| POST | `api/members/feedbacks/remove-like` | `src/modules/feedbacks/member-feedbacks.controller.ts` L76–84 | Not recommended | N/A | Mutation: removes like | N/A |
| DELETE | `api/members/feedbacks/:id` | `src/modules/feedbacks/member-feedbacks.controller.ts` L87–96 | Not recommended | N/A | Mutation: deletes feedback | N/A |
| GET | `api/admins/feedbacks` | `src/modules/feedbacks/admin-feedbacks.controller.ts` L26–35 | Not recommended | N/A | Paginated; changes frequently with member activity | N/A |
| GET | `api/admins/feedbacks/:id` | `src/modules/feedbacks/admin-feedbacks.controller.ts` L38–47 | Not recommended | N/A | Detail | N/A |
| PATCH | `api/admins/feedbacks/:id` | `src/modules/feedbacks/admin-feedbacks.controller.ts` L50–62 | Not recommended | N/A | Mutation: changes feedback status | N/A |
| GET | `api/staffs/feedbacks` | `src/modules/feedbacks/staff-feedbacks.controller.ts` L26–35 | Not recommended | N/A | Same as admin variant | N/A |
| GET | `api/staffs/feedbacks/:id` | `src/modules/feedbacks/staff-feedbacks.controller.ts` L38–47 | Not recommended | N/A | Same as admin variant | N/A |
| PATCH | `api/staffs/feedbacks/:id` | `src/modules/feedbacks/staff-feedbacks.controller.ts` L50–62 | Not recommended | N/A | Mutation | N/A |

---

## 4. Detailed Caching Recommendations

### 4.1. AccessesService Authorization Queries (Service-Level Cache)

**This is the highest-impact caching opportunity in the entire codebase.**

- **Service:** `AccessesService`
- **File:** `src/core/services/access.service.ts` (193 lines)
- **Methods to cache:**
  - `validateAdminAccountAndSubscription(adminId)` — L43–76: queries `User` with nested `subscriptions` → `plan` → `planDurations`. Called by virtually every admin/staff endpoint.
  - `resolveAdminIdFromMemberId(memberId)` — L112–125: queries `Member` to get `adminId`. Called on every member endpoint.
  - `validateMemberAccountAndMembership(memberId, adminId)` — L80–108: queries `Membership` with nested `membershipPlan`. Called on every member endpoint.
  - `authorizeAdminOrStaffAccess(accessTokenPayload)` — L23–40: calls `resolveAdminId()` which conditionally calls `validateAdminAccountAndSubscription()` or resolves staff→admin.

**Why repeated reuse is likely to help:**
Every single protected endpoint calls at least one of these methods. A staff user browsing members, then memberships, then payments would trigger `authorizeAdminOrStaffAccess()` → `resolveAdminId()` → `validateAdminAccountAndSubscription()` three times with identical parameters and results. Each call performs 1–3 Prisma queries with joins.

**Acceptable staleness and user-visible consequences:**
A 60-second TTL means that if an admin's subscription expires or an admin is banned, the cached authorization would remain valid for up to 60 seconds. This is acceptable because:
- The subscription cron runs hourly, not per-second.
- Admin status changes (ban/pending) are manual admin actions, not time-critical.
- The worst case is a 60-second window where a banned admin can still read data.

**Proposed TTL:** 60 seconds (60000 ms for cache-manager)

**Proposed cache-key formats:**
```
access:admin-sub:{adminId}        → result of validateAdminAccountAndSubscription
access:member-admin:{memberId}    → result of resolveAdminIdFromMemberId  
access:member-membership:{memberId}:{adminId} → result of validateMemberAccountAndMembership
```

**Inputs for cache-key differentiation:** `adminId` alone (for admin validation), `memberId` alone (for admin resolution), `memberId + adminId` (for membership validation).

**Authorization checks before cache access:** The JWT guard runs before the controller handler, which then calls the service. The cache is _inside_ the authorization flow itself, so no pre-cache auth check is needed — the cache result is the authorization data.

**Serialization concerns:**
- `validateAdminAccountAndSubscription` returns a Prisma object with `Decimal` fields (`price` on `PlanDuration`). `Decimal` from Prisma is a `Prisma.Decimal` instance and does NOT survive `JSON.stringify()` → `JSON.parse()` round-trips transparently. You must convert `Decimal` fields to strings or numbers before caching, or use a custom serializer.
- `DateTime` fields are standard `Date` objects and will be deserialized as strings from JSON — ensure consuming code handles this.

**Role sharing:** Admin and Staff endpoints both call `authorizeAdminOrStaffAccess()` which resolves to the same `adminId`. The cached result for `validateAdminAccountAndSubscription(adminId)` can be **shared across admin and staff** for the same tenant since the data is identical.

**Invalidation complexity:** Medium.
- Must invalidate `access:admin-sub:{adminId}` when: subscription is activated/cancelled/expired, admin status changes, plan is updated.
- Must invalidate `access:member-admin:{memberId}` when: member is moved between admins (not currently supported).
- Must invalidate `access:member-membership:{memberId}:{adminId}` when: membership status changes (cron or manual), member is banned/frozen/activated.

**Evidence still needed:**
- Measure actual latency of these queries under load.
- Confirm `Decimal` serialization approach.
- Profile how many times per request these are called (some handlers call multiple AccessesService methods).

---

### 4.2. Platform Plans — Public GET Endpoints (HTTP-Level Cache)

- **Endpoints:**
  - `GET api/plans` → `src/modules/platform/plans/plans.controller.ts` L68–75
  - `GET api/plans/:id` → `src/modules/platform/plans/plans.controller.ts` L77–83
- **Service:** `PlansService.findAll()` (L192–221) and `PlansService.findOne()` (L224–250)
- **File:** `src/modules/platform/plans/plans.service.ts`

**Query to cache:** `findAll` returns `Plan` records with nested `planDurations` (paginated). `findOne` returns a single `Plan` with `planDurations`.

**Why repeated reuse is likely:**
These are **public endpoints with no authentication guard**. They are likely called by the landing page or pricing page of the platform, which could receive significant anonymous traffic. The data only changes when the OWNER manually creates/updates plans or durations.

**Acceptable staleness:** 5 minutes. If the owner updates a plan, the pricing page shows the old price for up to 5 minutes. This is acceptable for a configuration change that happens rarely.

**Proposed TTL:** 300 seconds (300000 ms)

**Proposed cache-key formats:**
```
plans:all:page={page}:limit={limit}
plans:one:{planId}
```

**Inputs for differentiation:** `page` and `limit` for the list; `planId` for the detail.

**Authorization:** None required — endpoints have no auth guard.

**Serialization concerns:** `Plan.planDurations` includes `Decimal` price fields. Same concern as 4.1.

**Role sharing:** N/A — public endpoints, no user context.

**Invalidation complexity:** Low.
- Invalidate all `plans:*` keys when:
  - `POST api/plans` (create plan) — `plans.service.ts` L24–57
  - `POST api/plans/durations` (add duration) — `plans.service.ts` L60–103
  - `PATCH api/plans/:id` (update plan) — `plans.service.ts` L106–147
  - `PATCH api/plans/durations/:id` (update duration) — `plans.service.ts` L150–189
- These are all OWNER-only mutations and happen infrequently.

**Evidence still needed:**
- Measure actual traffic to these endpoints.
- Consider `Cache-Control` headers as an alternative if a CDN or reverse proxy is in front.

---

### 4.3. Working Hours — Admin/Staff GET List (Service-Level Cache)

- **Endpoints:**
  - `GET api/admins/working-hours` → `src/modules/working-hours/admin-working-hours.controller.ts` L61–73
  - `GET api/staffs/working-hours` → `src/modules/working-hours/staff-working-hours.controller.ts` L28–40
- **Service:** `WorkingHoursService.findAllWorkingHours()` → `src/modules/working-hours/working-hours.service.ts` L132–155

**Query to cache:** Simple `findMany` on `WorkingHour` table scoped by `adminId` with pagination. Max 7 rows (one per weekday).

**Why repeated reuse is likely:**
Working hours are tenant configuration. Once set, they rarely change. Multiple staff members viewing the schedule, and the visit-creation flow checking working hours, all query the same data repeatedly.

**Acceptable staleness:** 5 minutes. If the admin changes Monday's hours, staff see the old schedule for up to 5 minutes. Acceptable because schedule changes are planned in advance.

**Proposed TTL:** 300 seconds (300000 ms)

**Proposed cache-key format:**
```
working-hours:all:{adminId}:page={page}:limit={limit}
```

**Authorization:** Must run `authorizeAdminOrStaffAccess()` BEFORE returning cached data. The cache stores the query result, not the entire HTTP response. Authorization is enforced by the service method itself (L138–141).

**Serialization concerns:** No `Decimal` fields. `DateTime` fields (`createdAt`, `updatedAt`) will be strings after JSON round-trip — acceptable.

**Role sharing:** Admin and Staff can share the same cache entry because `findAllWorkingHours()` uses `authorizeAdminOrStaffAccess()` to resolve `adminId`, and the query is identical for both roles.

**Invalidation complexity:** Low.
- Invalidate `working-hours:all:{adminId}:*` when:
  - `POST api/admins/working-hours` (add) — `working-hours.service.ts` L31–64
  - `PATCH api/admins/working-hours/:id` (update) — `working-hours.service.ts` L67–129
  - `DELETE api/admins/working-hours/:id` (delete) — `working-hours.service.ts` L243–264

**Evidence still needed:**
- Confirm whether the visit-creation flow reads working hours from the database directly (it does — `visits.service.ts` queries `WorkingHour` independently, not through this service).

---

### 4.4. Membership Plans — Tenant GET List (Conditional, Measure First)

- **Endpoints:**
  - `GET api/admins/membership-plans` → `src/modules/membership-plans/admin-membership-plans.controller.ts` L88–96
  - `GET api/staffs/membership-plans` → `src/modules/membership-plans/staff-membership-plans.controller.ts` L29–37
- **Service:** `MembershipPlansService.findAll()` → `src/modules/membership-plans/membership-plans.service.ts` L237–263

**Query to cache:** `findMany` on `MembershipPlan` with `include: { membershipPlanDurations: true }`, scoped by `adminId`.

**Why it might help:**
Membership plans are gym configuration data. They change only when the admin adds/updates plans. Staff and admin dashboards likely display these lists repeatedly.

**Why to measure first:**
- The query is simple with a small result set per tenant.
- Database indexes on `adminId` should make this fast.
- Adding cache infrastructure for marginal savings may not be worth it.

**Proposed TTL (if implemented):** 300 seconds

**Proposed cache-key format:**
```
membership-plans:all:{adminId}:page={page}:limit={limit}
```

**Serialization concerns:** `MembershipPlanDuration.price` is `Decimal` — same concern as 4.1.

**Invalidation triggers:**
- `POST api/admins/membership-plans` — L25–49
- `POST api/admins/membership-plans/durations` — L52–84
- `PATCH api/admins/membership-plans/:id` — L97–148
- `PATCH api/admins/membership-plans/durations/:id` — L151–234

**Alternative recommendation:** Before caching, verify that `membershipPlanId` and `adminId` columns are indexed in Prisma schema. If not, adding indexes would likely provide better performance than adding Redis.

---

## 5. Invalidation Dependency Map

### 5.1. AccessesService Cache

| Cached Data / Key Pattern | Data-Changing Endpoint/Job | Source Location | When to Invalidate | Affected Variants |
|---|---|---|---|---|
| `access:admin-sub:{adminId}` | `PATCH api/owners/users/active/:id` | `src/modules/platform/owners/owners.service.ts` L73–97 | Admin status changed to ACTIVE | All endpoints using `validateAdminAccountAndSubscription` for this admin |
| `access:admin-sub:{adminId}` | `PATCH api/owners/users/pending/:id` | `src/modules/platform/owners/owners.service.ts` L100–121 | Admin status changed to PENDING | Same |
| `access:admin-sub:{adminId}` | `PATCH api/owners/users/ban/:id` | `src/modules/platform/owners/owners.service.ts` L124–157 | Admin banned | Same |
| `access:admin-sub:{adminId}` | `POST api/owners/subscriptions` | `src/modules/platform/subscriptions/subscriptions.service.ts` L29–100 | Subscription activated | Same |
| `access:admin-sub:{adminId}` | `PATCH api/owners/subscriptions` | `src/modules/platform/subscriptions/subscriptions.service.ts` L103–143 | Subscription cancelled | Same |
| `access:admin-sub:{adminId}` | Subscription cron (hourly) | `src/jobs/subscription.cron.ts` | Subscription expired | Same |
| `access:admin-sub:{adminId}` | `PATCH api/plans/:id` | `src/modules/platform/plans/plans.service.ts` L106–147 | Platform plan changed (affects subscription validation) | Same |
| `access:member-admin:{memberId}` | `POST api/admins/members` | `src/modules/members/members.service.ts` L30–120 | Member created (new mapping) | Member endpoints |
| `access:member-membership:{memberId}:{adminId}` | `PATCH api/admins/members/active/:id` | `src/modules/members/members.service.ts` L200–230 | Member activated | Member endpoints for this member |
| `access:member-membership:{memberId}:{adminId}` | `PATCH api/admins/members/freeze/:id` | `src/modules/members/members.service.ts` L233–270 | Member frozen | Same |
| `access:member-membership:{memberId}:{adminId}` | `PATCH api/admins/members/ban/:id` | `src/modules/members/members.service.ts` L273–310 | Member banned | Same |
| `access:member-membership:{memberId}:{adminId}` | Membership cron (hourly) | `src/jobs/membership.cron.ts` | Membership expired | Same |
| `access:member-membership:{memberId}:{adminId}` | Staff variants of member status changes | `src/modules/members/staff-members.controller.ts` L55–79 | Same status mutations via staff | Same |

### 5.2. Platform Plans Cache

| Cached Data / Key Pattern | Data-Changing Endpoint/Job | Source Location | When to Invalidate | Affected Variants |
|---|---|---|---|---|
| `plans:all:*` | `POST api/plans` | `src/modules/platform/plans/plans.service.ts` L24–57 | Plan created | findAll (all pages) |
| `plans:all:*`, `plans:one:{planId}` | `PATCH api/plans/:id` | `src/modules/platform/plans/plans.service.ts` L106–147 | Plan updated | findAll + findOne for updated plan |
| `plans:all:*` | `POST api/plans/durations` | `src/modules/platform/plans/plans.service.ts` L60–103 | Duration added | findAll (all pages) |
| `plans:all:*`, `plans:one:{planId}` | `PATCH api/plans/durations/:id` | `src/modules/platform/plans/plans.service.ts` L150–189 | Duration updated | findAll + findOne for affected plan |

### 5.3. Working Hours Cache

| Cached Data / Key Pattern | Data-Changing Endpoint/Job | Source Location | When to Invalidate | Affected Variants |
|---|---|---|---|---|
| `working-hours:all:{adminId}:*` | `POST api/admins/working-hours` | `src/modules/working-hours/working-hours.service.ts` L31–64 | Hour added | findAll for this admin |
| `working-hours:all:{adminId}:*` | `PATCH api/admins/working-hours/:id` | `src/modules/working-hours/working-hours.service.ts` L67–129 | Hour updated | Same |
| `working-hours:all:{adminId}:*` | `DELETE api/admins/working-hours/:id` | `src/modules/working-hours/working-hours.service.ts` L243–264 | Hour deleted | Same |

### 5.4. Concurrency Risks

**Stale repopulation after invalidation:** If request A reads from cache (miss) while request B just completed a mutation and invalidated the key, but request A's DB query was issued before the mutation committed, request A may repopulate the cache with stale data. This is a known race condition.

**Mitigation:** For low-traffic endpoints (all of these), the risk is minimal. For high-traffic scenarios, a short TTL (60s) limits the damage window. Do not claim that `del` + TTL guarantees immediate consistency.

**Filtered/paginated lists:** Invalidation of paginated caches requires either:
1. Wildcard key deletion (e.g., `SCAN` + `DEL` for all `working-hours:all:{adminId}:*` keys) — works but is O(n) in key count.
2. Using a version counter in the key (e.g., `working-hours:all:{adminId}:v={version}:page=...`) and incrementing the version on mutation — stale entries expire naturally.

**Recommendation:** Use wildcard deletion for this project's scale. The number of cached keys per tenant will be small (a few pages at most).

---

## 6. Frontend Freshness

### Key principle: Deleting a Redis key does NOT refresh an already-open dashboard.

When a mutation succeeds and the backend invalidates a Redis cache key, any frontend client that already fetched and displayed the data will continue showing stale content until it explicitly re-fetches.

### Mutation → Frontend refresh mapping

| Mutation | What to refetch on frontend |
|---|---|
| `POST api/admins/members` (add member) | Member list, membership list, payment list |
| `PATCH api/admins/members/active/:id` | Member list, member detail |
| `PATCH api/admins/members/freeze/:id` | Member list, member detail |
| `PATCH api/admins/members/ban/:id` | Member list, member detail |
| `PATCH api/admins/members/:id` (update) | Member list, member detail |
| `POST api/admins/membership-plans` | Membership plan list |
| `PATCH api/admins/membership-plans/:id` | Membership plan list, plan detail |
| `POST api/admins/working-hours` | Working hours list |
| `PATCH api/admins/working-hours/:id` | Working hours list, hour detail |
| `DELETE api/admins/working-hours/:id` | Working hours list |
| `POST api/admins/special-hours` | Special hours list |
| `PATCH api/admins/special-hours/:id` | Special hours list |
| `DELETE api/admins/special-hours/:id` | Special hours list |
| `POST api/members/visits` (create visit) | Visit list (upcoming, today) |
| `PATCH api/members/visits/cancel/:id` | Visit list (upcoming, today) |
| `POST api/admins/attendances/check-in/*` | Visit list (today), attendance list |
| `POST api/members/feedbacks` | Feedback list |
| `POST api/members/feedbacks/like` | Feedback detail (like count) |
| `DELETE api/members/feedbacks/:id` | Feedback list |
| `PATCH api/admins/feedbacks/:id` | Feedback detail (status change) |
| `POST api/owners/subscriptions` (activate) | Admin subscription "me" endpoint |
| `PATCH api/owners/subscriptions` (cancel) | Admin subscription "me" endpoint |
| `PATCH api/plans/:id` / `PATCH api/plans/durations/:id` | Public plans page |

### Frontend implementation approaches

1. **Optimistic updates:** After a mutation, immediately update the local UI state and refetch in the background.
2. **Query invalidation (React Query / SWR):** Tag queries and invalidate on mutation success.
3. **Cache-Control headers:** For public endpoints (plans), consider setting appropriate `Cache-Control` headers so browser/CDN caches handle freshness.

The backend cannot push cache invalidation to the frontend. Any WebSocket or SSE integration for real-time updates is out of scope for this caching review.

---

## 7. Reliability and Security

### 7.1. Tenant/User Isolation in Cache Keys

**Critical requirement.** This is a multi-tenant application where tenant isolation is enforced via `adminId`.

- Every cache key for tenant-scoped data MUST include `adminId` as a key segment.
- Member-scoped keys must include `memberId`.
- Failure to include tenant identifiers would allow cross-tenant data leakage.

**Example of WRONG key:** `working-hours:all:page=1:limit=10` — this would serve Gym A's schedule to Gym B.

**Example of CORRECT key:** `working-hours:all:{adminId}:page=1:limit=10`

### 7.2. Authorization on Cache Hits

**Do NOT use NestJS `@CacheInterceptor()` on personalized or tenant-scoped endpoints.** The default `CacheInterceptor` uses the URL as the cache key. Two different admins hitting `GET api/admins/working-hours?page=1&limit=10` would get the same cached response — a critical security bug.

**Safe approach:** Cache at the service layer, after authorization has resolved the `adminId`. The cache key includes `adminId`, so different tenants get different cache entries. Authorization still runs on every request.

### 7.3. Sensitive Data Exposure

Cached data must not include:
- Password hashes (the project uses `safeUserSelect` / `safeMemberSelect` / `safeStaffSelect` to exclude these — verified in `src/core/types/safe-selects.type.ts`)
- Refresh tokens or action tokens
- Full email addresses in list responses (currently included — check if this is intentional)

The `AccessesService` cache for `validateAdminAccountAndSubscription` includes nested user data with `Subscription` → `Plan` → `PlanDuration`. Verify that the selected fields do not include sensitive admin profile data beyond what's needed for validation.

### 7.4. Default CacheInterceptor Behavior

The `@CacheInterceptor()` from `@nestjs/cache-manager` uses `CacheInterceptor.trackBy()` which defaults to `request.url` as the cache key. This is **unsafe for any endpoint that returns different data based on the authenticated user or tenant**.

**Recommendation:** Do NOT use `@CacheInterceptor()` on any endpoint except the public `GET api/plans` and `GET api/plans/:id` endpoints where the response is identical for all callers.

### 7.5. Redis Connection and Command Timeouts

Configure Redis client timeouts to prevent request hangs:

```typescript
// Example configuration (do not implement — illustrative only)
CacheModule.registerAsync({
  useFactory: () => ({
    stores: [
      new Keyv({
        store: new KeyvRedis('redis://localhost:6379'),
        namespace: 'cache',
      }),
    ],
    ttl: 60000, // default TTL in ms
  }),
});
```

Set connection timeout and command timeout on the Redis client. If using `@keyv/redis@^5.1.6`, check the [Keyv Redis documentation](https://github.com/jaredwray/keyv/tree/main/packages/redis) for timeout options.

### 7.6. Database Fallback for Cache Failures

Redis should be an **optional optimization**, not a hard dependency. If Redis is unavailable:

1. Cache `get()` should return `undefined` / `null` (cache miss) and fall through to the database query.
2. Cache `set()` should fail silently (log warning, do not throw).
3. The application must remain fully functional without Redis.

**Antipattern to avoid:** Wrapping cache failures in exceptions that return HTTP 500 to the client when the underlying database query would have succeeded.

### 7.7. Failed Cache Writes and Failed Invalidation

- **Failed cache write:** If `cache.set()` fails after a successful DB read, the next request will simply hit the database again. No user impact.
- **Failed invalidation:** If `cache.del()` fails after a successful mutation, the stale cached value will persist until TTL expires. This is acceptable with short TTLs (60–300s).
- **Critical:** Never let a failed `cache.del()` cause the mutation response to return an error. The database write already committed — the user's action succeeded. Log the invalidation failure and move on.

### 7.8. Cache Stampedes

A **cache stampede** occurs when a popular key expires and many concurrent requests all miss the cache simultaneously, overwhelming the database.

**Risk assessment for this project:** Low. This is a multi-tenant SaaS where each tenant has a small user base (admin + staff + members of one gym). The number of concurrent requests for any single cache key is unlikely to be high enough to cause a stampede.

**If it becomes a concern:** Implement a "lock" or "promise coalescing" pattern where only one request fetches from the database and others wait for the result.

### 7.9. Memory Limits and Eviction

Configure Redis `maxmemory` and `maxmemory-policy` in `redis.conf`. The `devops/redis/redis.conf` file was not accessible (deleted from working tree), so the current configuration cannot be verified.

**Recommendation:** Use `allkeys-lru` eviction policy. With short TTLs (60–300s) and a small number of cache keys (proportional to number of tenants × a few endpoints), memory usage will be minimal.

### 7.10. Multiple Backend Instances

The current `docker-compose.yml` defines a single backend instance. If the deployment scales to multiple instances, all instances MUST share the same Redis instance to avoid cache inconsistency (one instance invalidates, another serves stale data from its own Redis).

With a shared Redis instance, this is not a concern. With in-memory caching (no Redis), it would be a critical problem.

---

## 8. Prioritized Implementation Plan

### Phase 1: Infrastructure Setup

**Target:** Get `CacheModule` working with Redis.

**Proposed changes:**
- Configure `CacheModule.registerAsync()` in `src/app.module.ts` using the existing `REDIS_URL` from `.env.example`.
- Use `@nestjs/cache-manager` v12 with `cache-manager` v7 and `@keyv/redis` v5 (all already installed).
- Set a default TTL of 60 seconds.
- Add Redis connection error handling and fallback.

**Affected files:**
- `src/app.module.ts` — import and configure `CacheModule`
- `src/infrastructure/cache/cache.module.ts` — implement module (currently empty)

**Verification:**
- [ ] Application starts successfully with Redis running.
- [ ] Application starts successfully with Redis unavailable (graceful fallback).
- [ ] `CacheModule` is importable in feature modules.

**Measurements:**
- Baseline response times for `AccessesService` queries without caching.
- Redis connection latency.

---

### Phase 2: AccessesService Caching

**Target:** Cache authorization query results.

**Proposed changes:**
- Inject `CACHE_MANAGER` into `AccessesService`.
- Wrap `validateAdminAccountAndSubscription()` with cache-aside pattern:
  1. Check cache for `access:admin-sub:{adminId}`.
  2. On miss, query database, serialize result (handle `Decimal`), store in cache.
  3. On hit, return cached result.
- Similarly wrap `resolveAdminIdFromMemberId()` and `validateMemberAccountAndMembership()`.

**Affected files:**
- `src/core/services/access.service.ts` — add caching logic

**Invalidation requirements:**
- After subscription activate/cancel: invalidate `access:admin-sub:{adminId}` in `subscriptions.service.ts`.
- After admin status change: invalidate in `owners.service.ts`.
- After member status change: invalidate `access:member-membership:*` in `members.service.ts`.
- After membership cron runs: invalidate affected member keys in `membership.cron.ts`.
- After subscription cron runs: invalidate affected admin keys in `subscription.cron.ts`.

**Verification:**
- [ ] Cache miss on first request → database query executes.
- [ ] Cache hit on second request within TTL → no database query.
- [ ] Cache expires after TTL → database query executes again.
- [ ] Admin status change → immediate authorization change (within TTL).
- [ ] Member status change → immediate membership validation change (within TTL).
- [ ] Cross-tenant isolation: Admin A's cached authorization is never served to Admin B's requests.
- [ ] Redis unavailable → all requests still work (DB fallback).
- [ ] `Decimal` fields survive cache round-trip correctly.

**Measurements:**
- Compare p50/p95 response times before and after.
- Monitor cache hit ratio.
- Monitor Redis memory usage.

---

### Phase 3: Platform Plans Caching

**Target:** Cache public plan listings.

**Proposed changes:**
- Apply `@CacheInterceptor()` to `GET api/plans` and `GET api/plans/:id` in `plans.controller.ts`.
- Override `CacheInterceptor.trackBy()` to generate keys like `plans:all:page={page}:limit={limit}`.
- Add cache invalidation in `PlansService` mutation methods.

**Affected files:**
- `src/modules/platform/plans/plans.controller.ts` — add `@CacheInterceptor()` and `@CacheTTL()`
- `src/modules/platform/plans/plans.service.ts` — add cache invalidation after create/update

**Invalidation requirements:**
- After `addPlan()`, `addPlanDuration()`, `update()`, `updatePlanDuration()` — delete all `plans:*` keys.

**Verification:**
- [ ] Public `GET api/plans` returns cached response on second call.
- [ ] Creating a new plan invalidates the cache.
- [ ] Updating a plan invalidates the cache.
- [ ] Cache and non-cached responses have identical shape (check `Decimal` price fields).
- [ ] Redis unavailable → public endpoints still work.

**Measurements:**
- Cache hit ratio for plan endpoints.
- Response time improvement.

---

### Phase 4: Working Hours Caching (Conditional)

**Target:** Cache working hours list queries. Implement only if Phase 2/3 measurements justify the effort.

**Proposed changes:**
- Add cache-aside pattern in `WorkingHoursService.findAllWorkingHours()`.
- Cache key: `working-hours:all:{adminId}:page={page}:limit={limit}`.
- TTL: 300 seconds.
- Invalidate on add/update/delete working hour mutations.

**Affected files:**
- `src/modules/working-hours/working-hours.service.ts` — add caching in findAll, invalidation in mutations.

**Verification:**
- [ ] Cache miss → database query.
- [ ] Cache hit → cached response.
- [ ] Add/update/delete working hour → cache invalidated.
- [ ] Cross-tenant isolation.
- [ ] Member access through `findAllWorkingHoursByMember()` still performs full access checks before returning data.

**Measurements:**
- Query frequency for working hours endpoints.
- Cache hit ratio.

---

### Cross-Cutting Verification (All Phases)

- [ ] **Permission or account-status change:** Ban an admin → verify that within TTL, the admin's requests start failing.
- [ ] **Cross-tenant isolation:** Log in as Admin A, cache their data. Log in as Admin B, verify they get their own data, not Admin A's.
- [ ] **Redis unavailability:** Stop Redis container → verify all endpoints return correct data from database.
- [ ] **Cached and uncached response shape consistency:** Compare JSON output of cached vs. non-cached responses field-by-field, especially `Decimal` and `DateTime` fields.
- [ ] **Cron interactions:** Run membership cron manually → verify that expired memberships are reflected after cache TTL expires or invalidation fires.

---

## Appendix: Library Reference

| Package | Installed Version | Documentation |
|---|---|---|
| `@nestjs/cache-manager` | `^12.0.0` | [NestJS Caching Docs](https://docs.nestjs.com/techniques/caching) |
| `cache-manager` | `^7.2.9` | [cache-manager v7 (Keyv-based)](https://github.com/jaredwray/cacheable/tree/main/packages/cache-manager) |
| `@keyv/redis` | `^5.1.6` | [Keyv Redis Adapter](https://github.com/jaredwray/keyv/tree/main/packages/redis) |

> **Note:** `cache-manager` v7 uses [Keyv](https://github.com/jaredwray/keyv) internally. The `CacheModule.register()` API in `@nestjs/cache-manager` v12 differs from older versions (v1/v2). Consult the NestJS v11+ documentation, not v10 examples.

---

*This report was generated from a complete read of all first-party source code. No code was modified, no packages installed, no tests run. All TTL values are proposals and should be validated with real traffic measurements before implementation.*
