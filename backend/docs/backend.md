# Backend developer guide

This guide describes the NestJS sports club management API implemented in this backend directory. It covers platform administration, club staff and members, memberships, scheduling, attendance, payments, feedback, profiles, and notifications. Technical details are based on the current source and configuration; commands below are instructions, not a record of successful execution.

## Contents

- [Architecture and source map](#architecture-and-source-map)
- [Technology stack](#technology-stack)
- [Database and startup seeding](#database-and-startup-seeding)
- [Package commands](#package-commands)
- [Roles, tenancy, and status](#roles-tenancy-and-status)
- [Authentication and sessions](#authentication-and-sessions)
- [API conventions and workflows](#api-conventions-and-workflows)
- [Validation and errors](#validation-and-errors)
- [Caching and request limits](#caching-and-request-limits)
- [Scheduled jobs and integrations](#scheduled-jobs-and-integrations)
- [Tests and verification](#tests-and-verification)
- [Troubleshooting](#troubleshooting)
- [HTTP route reference](#http-route-reference)

## Architecture and source map

[main.ts](../src/main.ts) bootstraps Nest with Express, listens on `0.0.0.0`, and sets the global route prefix to `/api`. The default port is `3000` when `PORT` is absent. [AppModule](../src/app.module.ts) loads `.env` from the backend working directory, registers feature modules, installs the global throttler guard, enables scheduling, and registers the owner seeder.

Requests pass through HTTP logging, Helmet and cookie parsing, applicable authentication/role guards, validation pipes, controllers, and services. Domain services use Prisma, selected Redis cache entries, and external clients. Business access checks are service calls, not a universal global authorization guard.

```text
backend/
├── docs/backend.md
├── src/
│   ├── main.ts / app.module.ts
│   ├── core/                 Access checks, decorators, guards, selects, utilities, seeder
│   ├── infrastructure/       PostgreSQL/Prisma, Redis, email, Cloudinary, sentiment client
│   ├── jobs/                 Registered scheduled tasks
│   ├── modules/              Feature controllers, services, modules, DTOs
│   └── generated/prisma/     Prisma-generated client; ignored by Git
├── prisma/
│   ├── schema.prisma         Configured application schema
│   ├── migrations/           SQL migration history
│   └── scalable.schema       Alternative design; not the configured application schema
├── prisma.config.ts
├── scripts/entrypoint.sh
├── Dockerfile
├── package.json / package-lock.json
└── .env.example
```

| Source | Responsibility |
| --- | --- |
| [core/access](../src/core/access/access.service.ts) | Resolve a staff/member's administrator and check account/subscription/membership access |
| [core/types](../src/core/types/safe-selects.type.ts) | Reusable public/private identity field selections; private selections still omit passwords |
| [auth](../src/modules/auth/) | Administrator registration, role-specific JWT authentication, recovery and email action tokens |
| [platform](../src/modules/platform/) | Owner management of users, SaaS plans/durations, and administrator subscriptions |
| [staffs](../src/modules/staffs/) / [members](../src/modules/members/) | Club account provisioning, edits, status changes, setup email requests |
| [membership-plans](../src/modules/membership-plans/) / [memberships](../src/modules/memberships/) | Club offerings, durations, weekly quotas, membership reads and statistics |
| [working-hours](../src/modules/working-hours/) | Recurring hours and date-based closures |
| [visits](../src/modules/visits/) / [attendances](../src/modules/attendances/) | Reservations, QR pass issuance, cancellation and check-in |
| [payments](../src/modules/payments/) | Read payment records created during membership onboarding/replacement |
| [feedbacks](../src/modules/feedbacks/) | Reviews, sentiment, community likes, moderation and statistics |
| [profiles](../src/modules/profiles/) | Self-profile, password, email-change requests and avatar management |
| [notifications](../src/modules/notifications/) | Administrator/member notification reads and read-state updates |
| [dashboards](../src/modules/dashboards/) | Administrator/staff club summaries |
| [health](../src/modules/health/health.controller.ts) | HTTP liveness response |

The active application uses `adminId` to identify a club; it does not use the separate `Tenant` design in `scalable.schema`. Helper notes under `helpers/` describe ideas and historical work, not registered routes. No official 42 subject or evaluation checklist was found within this backend directory; this guide does not establish subject compliance, module points, contribution percentages, or behavior of other project directories.

## Technology stack

These are **declared ranges** from [package.json](../package.json) and **resolved versions recorded in package-lock.json**, not a claim about the running installation. The lockfile can resolve related Nest packages to different patch versions.

| Component | Declared | Lockfile resolution |
| --- | --- | --- |
| Nest core/common | `^11.0.1` | Core `11.1.19` |
| Nest Express adapter | `^11.0.1` | `11.1.28` |
| TypeScript | `^5.7.3` | `5.9.3` |
| Prisma client / PostgreSQL adapter | `^7.8.0` | Both `7.8.0` |
| Prisma CLI (development dependency) | `^7.8.0` | `7.9.1` |
| PostgreSQL driver `pg` | `^8.20.0` | `8.20.0` |
| Nest cache manager / Keyv Redis | `^12.0.0` / `^5.1.6` | `12.0.0` / `5.1.6` |
| `cache-manager` | `^7.2.9` | `7.2.9` |
| Nest JWT / Passport / `passport-jwt` | `^11.0.2` / `^0.7.0` / `^4.0.1` | `11.0.2` / `0.7.0` / `4.0.1` |
| `bcryptjs` | `^3.0.3` | `3.0.3` |
| `class-validator` / `class-transformer` | `^0.15.1` / `^0.5.1` | `0.15.1` / `0.5.1` |
| Nest Swagger | `^11.4.2` | `11.4.6` |
| Nest throttler / schedule | `^6.5.0` / `^6.1.3` | `6.5.0` / `6.1.3` |
| Helmet / cookie parser | `^8.1.0` / `^1.4.7` | `8.1.0` / `1.4.7` |
| Cloudinary / `file-type` | `^2.10.0` / `^22.1.1` | `2.10.0` / `22.1.1` |
| Resend / Nodemailer | `^6.12.3` / `^10.3.1` | `6.12.3` / `10.3.1` |
| Axios / `date-fns` | `^1.20.0` / `^4.4.0` | `1.20.0` / `4.4.0` |
| Jest / `ts-jest` / Supertest | `^30.0.0` / `^29.2.5` / `^7.0.0` | `30.4.2` / `29.4.12` / `7.2.2` |

The [Dockerfile](../Dockerfile) uses `node:24-alpine`. The local [Compose file](../docker-compose.dev.yml) declares `postgres:16-alpine`, `redis:latest`, and `dpage/pgadmin4:latest`; Redis is not pinned to version 7. `package.json` has no Node/npm engine declaration. The locked Prisma packages require Node `^20.19 || ^22.12 || >=24.0`, and locked `file-type` requires Node `>=22`; Node 24 matches the checked-in container runtime. Other declared libraries include `password-validator`, `ua-parser-js`, `slugify`, `nanoid`, RxJS, and reflection metadata. The source imports `ms`, which is currently supplied transitively rather than declared directly.

## Database and startup seeding

[prisma.config.ts](../prisma.config.ts) selects [prisma/schema.prisma](../prisma/schema.prisma) and [prisma/migrations](../prisma/migrations/). The schema uses PostgreSQL, generates a CommonJS client into `src/generated/prisma`, and maps most multiword database columns to snake_case while application fields remain camelCase. [PrismaService](../src/infrastructure/database/prisma.service.ts) extends that generated client with `@prisma/adapter-pg`.

The current schema defines 25 UUID-keyed models:

| Domain | Models |
| --- | --- |
| Accounts | `User` (owners/admins), `Staff`, `Member` |
| SaaS | `Plan`, `PlanDuration`, `Subscription` |
| Club memberships | `MembershipPlan`, `MembershipPlanDuration`, `Membership` |
| Scheduling | `WorkingHour`, `SpecialHour`, `Visit`, `Attendance` |
| Finance and reviews | `Payment`, `Feedback`, `FeedbackLike` |
| Notifications | `AdminNotification`, `StaffNotification`, `MemberNotification` |
| Sessions | `UserRefreshToken`, `StaffRefreshToken`, `MemberRefreshToken` |
| Email actions | `UserActionToken`, `StaffActionToken`, `MemberActionToken` |

Important relationships and constraints:

- A staff/member belongs to a `User` administrator through `adminId`. Optional `staffId` fields record staff attribution; they do not make the staff member the tenant owner.
- `User.email`, `User.userName`, and `User.phoneNumber` are globally unique. Staff/member usernames are unique within their respective tables. Staff email and phone uniqueness are scoped to `(adminId, email)` and `(adminId, phoneNumber)`; member email uniqueness is `(adminId, email)`. Member phone duplicates are checked in services but have no corresponding unique database constraint.
- SaaS plans use `planName`, `maxMembers`, `description`, and `isActive`. Club membership plans use `planName`, `weeklyVisitLimit`, `description`, and `isActive`. `MembershipPlanDuration` also requires integer `priceByG`.
- Plan duration uniqueness is `(planId, durationDays, price)`; club duration uniqueness is `(membershipPlanId, durationDays, price)`. Club plan names are unique per administrator.
- `WorkingHour` uniqueness on `(adminId, dayOfWeek)` permits at most one record for a weekday; it does not automatically create all seven days.
- `Attendance.visitId` is unique: a visit has at most one attendance. `FeedbackLike` is unique on `(feedbackId, memberId)` and cascades on feedback/member deletion.
- Prices, subscription amounts, and payment amounts are `Decimal(10,2)`; feedback sentiment scores are `Decimal(3,2)`. `Payment` has required `amount` and `paidAt`; it has no due date or payment-status enum in the current schema.
- Refresh tables store `jti`, `hash`, `expiresAt`, `revokedAt`, `ip`, `userAgent`, and `device`. Email action tables use `tokenHash`, `actionTokenType`, `pendingEmail`, `expiresAt`, and `usedAt`. The staff action foreign key is spelled `StaffId` in Prisma.

### Prisma operations

There are no package scripts for Prisma operations or a configured Prisma seed command. Use the installed CLI explicitly:

```bash
# Generate the client after installing dependencies or changing the schema
npx prisma generate

# Apply checked-in migrations to the configured database
npx prisma migrate deploy

# Create/apply a migration during intentional schema development
npx prisma migrate dev --name describe_change

# Inspect migration state
npx prisma migrate status
```

The checked-in history contains 72 SQL migrations, from `20260701135407_int` through `20261109093950_beta_3_4`. Some migrations drop/recreate tables or columns and add required columns without backfills. In particular, recent migrations switch action-token and sentiment columns by dropping/readding them. This history is not evidence that an existing populated database can be upgraded without data loss. Database migration execution and compatibility were not tested in this review.

### Automatic owner initialization

[OwnerSeederService](../src/core/seeders/owner-seeder.service.ts) runs on every application bootstrap, after module initialization. It reads all eight `OWNER_*` variables before querying for an existing account matching the configured email, phone, **or** username. A match logs the collision and skips creation; it does not update an existing owner or rotate their password.

For a new owner it hashes the password with bcrypt cost 10, sets `role: OWNER`, `isAccountVerified: true`, `termsAccepted: true`, `gender: MALE`, and default owner avatar values. Account status comes from the schema's `ACTIVE` default. It seeds no SaaS plans, subscriptions, working hours, staff, or members. The seeder bypasses HTTP DTO validation; an existing matching account still does not make the `OWNER_*` settings optional at startup.

### Container execution

The [Dockerfile](../Dockerfile) installs all dependencies for generation/build, installs production-only dependencies separately, and runs the final image as `nestjs` (UID 1001). Its command is `node dist/src/main`. [entrypoint.sh](../scripts/entrypoint.sh) first executes `npx prisma migrate deploy`, then executes that command. `.env` files are excluded by [.dockerignore](../.dockerignore), so runtime configuration must be supplied externally.

Two execution details remain unverified: `start:prod` points to a different compiled entrypoint, and Prisma CLI is a development dependency omitted from the final image's production dependency installation. Image building, compiled client output, and migration availability need an isolated container check before relying on this startup path.

## Package commands

These are the exact scripts defined in [package.json](../package.json). Formatting and lint scripts **modify files**.

| Command | Script | Purpose |
| --- | --- | --- |
| `npm run build` | `nest build` | Compile application; Nest configuration deletes the output directory first |
| `npm start` | `nest start` | Start Nest |
| `npm run start:dev` | `nest start --watch` | Development watch mode |
| `npm run start:debug` | `nest start --debug --watch` | Debug with watch mode |
| `npm run start:prod` | `node dist/main` | Declared production command; differs from the Docker command |
| `npm run format` | `prettier --write "src/**/*.ts" "test/**/*.ts"` | Rewrite source/test formatting |
| `npm run lint` | `eslint "{src,apps,libs,test}/**/*.ts" --fix` | Lint and apply fixes |
| `npm test` | `jest` | Unit-test discovery/execution |
| `npm run test:watch` | `jest --watch` | Test watch mode |
| `npm run test:cov` | `jest --coverage` | Run tests and write coverage |
| `npm run test:debug` | `node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand` | Debug tests |
| `npm run test:e2e` | `jest --config ./test/jest-e2e.json` | References an absent e2e configuration in this checkout |

For the layout used by Docker, the explicit build/run sequence is:

```bash
npm run build
NODE_ENV=production node dist/src/main
```

This direct command is not the `start:prod` package script. The build output and production launch were not executed for this documentation change.

## Roles, tenancy, and status

Roles are exact enum values `OWNER`, `ADMIN`, `STAFF`, and `MEMBER`. Protected controllers combine a role-specific access-token guard with `AuthRolesGuard` and `@Roles`. An owner's token does not automatically grant access to administrator routes; each controller requires the named role and its signing secret.

| Role | Implemented responsibilities / boundary |
| --- | --- |
| `OWNER` | Manage SaaS plans and durations, inspect/manage platform users, activate/cancel administrator subscriptions; owner profile |
| `ADMIN` | Own a club's staff, members, membership plans, schedules, visits, payments, feedback and dashboard; own subscriptions and notifications |
| `STAFF` | Resolve club through their own database `adminId`; manage members, read club offerings/history/payments/hours, check in members, moderate feedback, read dashboard |
| `MEMBER` | Resolve club from their own member record; view own membership/payments/attendance/visits, manage own visits, participate in the club feedback feed, manage own profile/notifications |

[AccessesService](../src/core/access/access.service.ts) enforces the common operational gates:

- Administrator/staff operations resolve the administrator, verify the staff account when applicable, and require an administrator subscription with `subscriptionStatus: ACTIVE` and `expiresAt > checkDate`. They also require the administrator account to be active and the SaaS plan's `isActive` flag to be true.
- Member operational routes generally require the administrator gate and a membership belonging to that member and administrator with `membershipStatus: ACTIVE` and `expiresAt > checkDate`, plus an active member account. The helper includes the membership plan but does not itself test its `isActive` flag.
- Most checks use the request time. Visit creation explicitly passes the requested visit timestamp, so the subscription and membership must remain valid at that future time.
- These checks are not applied everywhere. Notification services scope by the authenticated identity without subscription/membership checks. Profile reads, avatar operations, email-change requests, and owner/admin/member profile updates do not uniformly use the operational gates; staff profile update does. JWT signature/expiry and role checks still apply to those protected controllers.

### Independent status fields

| Field | Exact values and behavior |
| --- | --- |
| `accountStatus` | `ACTIVE`, `PENDING`, `BANNED` on `User`, `Staff`, and `Member`; defaults to `ACTIVE` |
| `isAccountVerified` | Separate boolean on `User`; new administrator registration defaults false and email verification changes it to true |
| `subscriptionStatus` | `ACTIVE`, `EXPIRED`, `CANCELLED`; administrator SaaS subscription lifecycle |
| `membershipStatus` | `ACTIVE`, `EXPIRED`, `CANCELLED`; member club membership lifecycle |
| `isActive` | Independent availability flag on SaaS plans and club membership plans |
| `visitStatus` | `READY`, `CHECKED_IN`, `CANCELLED`, `EXPIRED` |
| `feedbackStatus` | `OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED` |

`PENDING` is an account access restriction, not a membership status or a mechanism that extends membership expiry. Expiry jobs update status later; operational checks also compare `expiresAt` directly. Status-only statistics and historical filters may therefore differ from time-based access decisions.

Owner/admin/staff status endpoints activate, set pending, or ban the relevant accounts. Repeating a state change is rejected. Moving a banned account to pending is rejected until it is reactivated. Login and refresh reject inactive accounts, but access-token strategies themselves only verify and return JWT payloads; current account/subscription checks depend on the service used.

## Authentication and sessions

Sources: [auth controller](../src/modules/auth/auth.controller.ts), [AuthProvider](../src/modules/auth/auth.provider.ts), [JWT configuration](../src/modules/auth/jwt/jwt.provider.ts), and [Passport strategies](../src/modules/auth/strategies/).

### Registration and invitations

Public `POST /api/auth/register` creates an administrator `User`. Required fields are `firstName`, `lastName`, `gender`, `birthDate`, `email`, `password`, `phoneNumber`, `companyName`, and `termsAccepted`; `walletAddress` is optional. The service requires age 18 or older, accepted terms, and unused email/phone, generates a username, hashes the password, creates an email action, and sends verification mail. It returns a `message` object.

`POST /api/auth/email-verification?token=...` consumes an unused, unexpired `EMAIL_VERIFICATION` action and sets `isAccountVerified: true`; it does not change account status. A valid-password login by an unverified user either reports an existing live verification request or issues another verification email and rejects login. If mail delivery fails after account creation, the account remains and the newly created action token is deleted.

Staff and members are provisioned through club routes rather than public registration. They initially have nullable passwords. Their setup endpoints accept required `token` query input and `{ "password": ... }` bodies. Login attempts for passwordless staff/members can issue a setup email if there is no live setup action, then reject login until setup completes. Administrator/staff resend endpoints also reject an existing live setup request.

### Login, refresh, and logout

| Principal | Login | Credentials | JSON response |
| --- | --- | --- | --- |
| Owner/admin | `POST /api/auth/login` | `email`, `password` | `{ user, accessToken }` |
| Staff | `POST /api/auth/staffs/login` | `userName`, `password` | `{ staff, accessToken }` |
| Member | `POST /api/auth/members/login` | `userName`, `password` | `{ member, accessToken }`; `member.adminWalletAddress` is included |

Login checks credentials and account status; user login also requires accepted terms and verified email. Staff/member login does not itself require a current club subscription or membership. Successful login issues an access JWT with `id` and `role`, and a refresh JWT adding a UUID `jti` (with normal JWT timing claims added during signing). The response identity excludes its password.

All roles use the same cookie name, `refresh_token`, with `httpOnly: true`, `sameSite: 'strict'`, `path: '/api/auth'`, and `secure: true` only in production. Its `maxAge` follows the configured refresh lifetime. Browser clients need credentials enabled when making the applicable requests. Logins for different roles on the same cookie host/path replace this cookie.

Access JWTs are sent in `Authorization: Bearer ...`. Refresh JWTs are extracted from the cookie, not from a JSON body. The database stores **bcrypt cost-10 hashes** of refresh tokens in the `hash` field, alongside `jti`, expiry, revocation and client metadata. SHA-256 is used for email actions and QR passes, not these refresh hashes.

`POST /api/auth/{admins|owners|staffs|members}/refresh` requires the corresponding refresh-token strategy and role. It verifies the stored session's owner/hash/expiry/revocation and current account status, conditionally revokes the old row and inserts a replacement in a transaction, replaces the cookie, and returns `{ accessToken }`. Each refresh extends the session according to the configured lifetime. There is no session-list or revoke-all HTTP endpoint in the controllers.

`POST /api/auth/{admins|owners|staffs|members}/logout` requires **both** an unexpired role-specific access JWT and a valid refresh cookie. It clears the cookie in the handler and revokes that stored refresh row. Logout does not revoke an already issued access JWT; it remains usable until expiry subject to the service's access checks.

### Password recovery and email changes

- Owner/admin forgot-password takes `email`; staff/member forgot-password takes `userName`. Reset endpoints take required `token` query input and `password` in the body. The implementation returns identity-specific errors for unknown accounts, despite the generic success message for a recovery request.
- Action tokens are 32 random bytes represented as hex. Only their SHA-256 `tokenHash` is stored. Consumption checks the expected `actionTokenType`, expiry and `usedAt`, and rechecks/consumes the action transactionally. Successful setup/reset/verification also consumes sibling unused actions of the same kind.
- Password reset revokes all active refresh sessions for that identity. Self-profile password changes require both `currentPassword` and `password` and also revoke refresh sessions. Previously issued access JWTs are not explicitly revoked.
- Self-profile `POST .../email-change` takes `email` and `currentPassword`, verifies the password and uniqueness, invalidates earlier email-change requests, and sends the new address a verification link. The `EMAIL_CHANGE` action stores `pendingEmail`; the matching `/api/auth/.../email-change?token=...` endpoint applies it. This flow does not revoke refresh sessions.
- Email links put the action in a URL fragment (`#token=...`) at the configured frontend URL. Clients must extract it and send the API's required `token` **query** parameter; fragments are not sent to HTTP servers. User links use `/email-verification` and `/reset-password`; staff/member setup/reset links use `/staffs/...` and `/members/...`. All email-change links use `/email-change`.

## API conventions and workflows

All paths in the [route reference](#http-route-reference) include the `/api` prefix. The reference is derived from the actual controller/method decorators; it includes all 190 declared HTTP handlers in 41 controllers. A role there denotes the required role-specific JWT, not a hierarchy of interchangeable permissions.

### Queries, pagination, and serialization

Every paginated controller takes **required** `page` and `limit` through `ParseIntPipe`, calculates `skip = (page - 1) * limit`, and uses `take = limit`. There are no controller defaults and no applied minimum/maximum checks. [PaginationDto](../src/core/dtos/pagination.dto.ts) defines positive bounds and a maximum limit of 100 but is not used by these controllers. Use positive values; do not infer an enforced limit of 100. Optional `search` and enum filters are identified explicitly in the reference. Unknown query-field rejection is only established where a query DTO is actually used, such as `QueryTokenDto`.

Most lists return a plain JSON array (including an empty array when nothing matches), without `data`, `items`, `total`, or pagination metadata. Statistics have separate routes. Ordering exists only where specified below; other list queries have no explicit `orderBy`, so stable newest-first or ID order is not guaranteed.

Prisma `DateTime` values are serialized as date strings. Prisma decimal values may appear as strings; aggregates sometimes use numeric zero as a fallback. Do not assume monetary fields always arrive as JSON numbers. There is no configured global response wrapper or custom exception filter.

| List / view | Additional behavior |
| --- | --- |
| Owner user directory | Optional trimmed, case-insensitive first/last-name search; excludes `OWNER` and `MEMBER` roles; includes private user fields and `subscription` history with plans |
| Owner subscription list | Optional trimmed, case-insensitive substring search of the **subscription `id`**, not administrator names; includes user, plan and duration |
| Club member directory (admin/staff) | Optional exact `accountStatus`, historical `membershipStatus`, and first/last-name search; private member fields plus `memberships` ordered by `createdAt desc` |
| Club payments (admin/staff) | Optional first/last-name search of the related member; selected payment fields plus public member identity |
| Today's club visits (admin/staff) | Optional first/last-name search of related member; includes all visit statuses today; orders `visitDateAndTime asc` |
| Member upcoming visits | Own `READY` visits with timestamp `>= now`, ordered by visit timestamp ascending |
| Member today's visits | Own `READY` visits today; no explicit list ordering |
| Member attendance list | Own records, with optional exact `attendanceMethod`: `QR_CODE` or `MANUAL` |
| Feedback lists | Club-wide feed ordered by `createdAt desc`; shapes differ by platform, described below |

A member-directory filter such as `membershipStatus=EXPIRED` uses `memberships.some` across **all historical membership rows**. It can match a member who also has an active membership. It does not filter only the latest membership or compare expiry timestamps. `accountStatus` filters the current member row. Search is trimmed, ignored if blank, and combined with other filters and tenant scope using AND; first/last-name matches are OR alternatives.

```bash
# Public list: both pagination parameters are required
curl -i 'http://localhost:3000/api/plans?page=1&limit=10'

# Administrator member search; set ADMIN_ACCESS_TOKEN in your shell
curl --get 'http://localhost:3000/api/admins/members' \
  -H "Authorization: Bearer ${ADMIN_ACCESS_TOKEN}" \
  --data-urlencode 'page=1' \
  --data-urlencode 'limit=10' \
  --data-urlencode 'accountStatus=ACTIVE' \
  --data-urlencode 'membershipStatus=EXPIRED' \
  --data-urlencode 'search=Alex'
```

### SaaS plans and subscriptions

[PlansService](../src/modules/platform/plans/plans.service.ts) lets owners create/edit plans and durations. Public GET routes return plans including their `durations`, and do not filter inactive plans. Plan statistics are public too. Disabling a plan is rejected when a subscription still has `ACTIVE` status.

Owner subscription activation takes `userName`, `planId`, and `planDurationId`. The service requires an active target account, an available plan and a matching duration, and refuses a capacity below the club's current total member count. An existing active subscription with the same plan/duration is rejected. Replacement marks the old subscription `EXPIRED` and creates a new one expiring `durationDays` from now; there is no prorating or automatic extension from the old expiry. Cancellation takes `adminId` and sets the active subscription to `CANCELLED`.

The initial activation branch returns the created subscription; the replacement branch awaits its transaction without returning a body. Administrator `/me`, `/all` and `/stats` subscription routes require a currently valid subscription through the access service, including when reading history. Administrator subscription views select `plan`, `planDuration`, `subscriptionStatus`, `startedAt`, `expiresAt`, and `amount`, and omit the subscription ID.

### Staff, members, and memberships

[StaffsService](../src/modules/staffs/staffs.service.ts) requires a valid administrator subscription for provisioning and management. Adding staff takes `firstName`, `lastName`, `gender`, `birthDate`, `email`, and `phoneNumber`; age must be at least 18. Company name is copied from the administrator and username is generated. Add returns no body after sending the password invitation; edits/status changes return selected identity fields. Staff list/detail adds the public administrator identity.

[MembersService](../src/modules/members/members.service.ts) supports administrator and staff callers scoped to the resolved club. Add requires `firstName`, `lastName`, `gender`, `birthDate`, `email`, `phoneNumber`, `address`, `emergencyContact`, `membershipPlanId`, and `membershipPlanDurationId`; `walletAddress` is optional. Minimum age is 13. It checks club contact duplicates, plan ownership, duration ownership/availability, and subscription `maxMembers` against **all** members, regardless of account status.

Creation puts the member, initial membership, and payment in one interactive transaction. Payment amount comes from the selected duration's `price`, and `paidAt` is the membership start date. The transaction also awaits the blockchain reward request. After commit, an action token and setup email are created. A mail failure leaves the member/membership/payment intact and deletes the new action token; add has no success response body.

Updating a member accepts a partial add DTO. Supply `membershipPlanId` and `membershipPlanDurationId` together to replace a membership; supplying only one is rejected. The service rejects the same active plan/duration, conditionally expires the prior active membership, creates a replacement and payment, and calls the reward endpoint within the transaction. Profile edits and membership replacements return selected member fields, not the created membership/payment. Renewal is performed through member update; there is no separate create-membership HTTP route.

[MembershipPlansService](../src/modules/membership-plans/membership-plans.service.ts) uses `planName`, optional `description`, and integer `weeklyVisitLimit` (1–7). Add duration requires `membershipPlanId`, positive integer `durationDays`, positive numeric `price`, and positive integer `priceByG`. Duration **update still requires `membershipPlanId`**; SaaS duration update similarly requires `planId`. Both update DTOs accept a positive number for `durationDays` rather than enforcing an integer, although the database field is integer. Disabling a club plan is rejected while `ACTIVE` memberships refer to it. Plan reads include `membershipPlanDurations`, including inactive plans.

[MembershipsService](../src/modules/memberships/memberships.service.ts) provides club history and member self-history/current views. The member's `/me` and `/all` views select `membershipPlan`, `membershipPlanDuration`, `membershipStatus`, `startDate`, and `expiresAt`, omitting the membership ID. Even historical self-reads require a currently valid membership and club subscription.

### Hours, reservations, and attendance

[WorkingHoursService](../src/modules/working-hours/working-hours.service.ts) accepts `dayOfWeek` (ISO 1=Monday through 7=Sunday), `startTime`, `endTime` (`HH:mm`), and required `isClosed` on creation. Regular hours must have `startTime < endTime`, including closed-day records; overnight regular opening intervals are not accepted. Missing/opening-hour records can prevent reservations.

Special hours are **closures**, not replacement opening hours. Use date-only `startDate` and `endDate` values in `yyyy-MM-dd` form. Optional `startTime`/`endTime` must be supplied together; omitting both creates a full-day closure across the date range. Updates can use null for both times to clear them through the partial DTO. Services check chronological order, reject a new start date in the past, and reject overlapping closures. DTOs use `IsDateString`, but service parsing expects date-only strings, so use the narrower date-only form.

[VisitsService](../src/modules/visits/visits.service.ts) accepts `{ visitDateAndTime }`, converts it to a date, requires a future instant, and validates the subscription/membership at that instant. It checks matching date closures and regular opening hours. For a timed special closure it compares the visit's clock time against the closure times on each matching date; start/end clock comparisons are inclusive and the wrapped-time branch uses OR. It does not evaluate a single continuous start-to-end interval in that reservation check.

Booking takes a PostgreSQL row lock on the member inside its transaction, rejects another non-cancelled visit on the same day, and separately checks weekly non-cancelled visit count and attendance count. Weeks explicitly start on Monday. A new visit starts `READY`, expires 30 minutes after its scheduled timestamp, stores a QR token hash, and returns **only `{ rawToken }`**. Clients encode that returned value as a QR payload; no QR image is generated by the backend, and normal visit reads do not recover the raw token. Cancellation requires an owned `READY` visit and returns no body.

[AttendancesService](../src/modules/attendances/attendances.service.ts) exposes administrator/staff check-in. Manual input is `{ memberId }` and still requires a visit scheduled today. QR input is **`{ rowToken }`** (the actual DTO spelling), containing the raw value originally returned as `rawToken`. QR lookup verifies that the visit belongs to the caller's club.

Check-in validates current account/membership access, requires a visit today, rejects duplicate attendance today and non-ready visit states, enforces the weekly attendance quota, and accepts arrivals from 10 minutes before the scheduled visit through its 30-minute expiry. It conditionally changes `READY` to `CHECKED_IN` and creates attendance transactionally. Both check-in routes return HTTP 200 with no body. Administrator/staff controllers expose no attendance-list/detail routes; member attendance reads include membership, public administrator/staff, and the related visit.

Calendar operations use server-local `Date`/`date-fns` day/week boundaries and clock formatting. No club timezone or cron `timeZone` is configured. Date-only closure persistence is built from UTC midnight, while later comparisons/formatting include local operations. Explicit-offset timestamps do not establish a club timezone; deployment timezone and date-boundary behavior need agreement and testing.

### Payments, feedback, notifications, and dashboards

Payments are recorded during member onboarding and membership replacement. [PaymentsService](../src/modules/payments/payments.service.ts) exposes reads/statistics only. There is no direct payment-create/settle route, invoice model in the active schema, due-status transition job, or automatic recurring billing flow. Administrator/member payment statistics return `totalAmount` (nullable if there are no rows) and `totalPayments`; staff statistics return **only `totalPayments`**, although staff payment reads still include amounts.

Feedback creation accepts `content` (3–1000 characters) and integer `rating` (1–5), awaits one sentiment attempt, and stores null sentiment fields if the request fails. [FeedbacksService](../src/modules/feedbacks/feedbacks.service.ts) exposes:

- Administrator/staff feed/detail objects with `sentimentType`, `sentimentScore`, moderation fields and `_count.likes`.
- Member feed/detail **per-item wrappers** `{ feedbackData, likeCount, isLiked }`. The feed is an array of these wrappers. `feedbackData` includes public identities, content/rating, status, resolution fields and timestamps, but excludes sentiment fields. Members see the club-wide feed, not just their own feedback; member feedback statistics cover only their own submissions.
- Likes/unlikes using required `{ feedbackId }`; duplicate likes or removing a missing like return conflicts. Members may delete only their own feedback.
- Moderation accepts required `feedbackStatus` and optional `resolutionNote` (3–1000 characters). `RESOLVED` sets `resolvedAt`, `resolvedBy` to the caller ID, and the note (or null). Other statuses clear all three resolution fields. Members can read these moderation fields in the shared feed.

Notifications are in-app database records. Admin/member list endpoints return arrays; detail returns a record with `notificationType`, `title`, `message`, `isRead`, and timestamps/identity fields from the model. `PATCH` on the collection marks all unread records read without a response body; `PATCH /:id` returns the updated notification. Already-read/no-unread actions return 409. A `StaffNotification` schema model exists but has no registered HTTP controller.

[Dashboard statistics](../src/modules/dashboards/dashboards.service.ts) return a wrapper:

```json
{
  "dashboard": {
    "totalMembers": 10,
    "activeMembers": 7,
    "inactiveMembers": 3,
    "expiredMembers": 2,
    "bannedMembers": 1,
    "totalPlans": 3,
    "satisfactionScore": 80,
    "totalReviews": 5
  }
}
```

This example illustrates the response shape only. Active/inactive counts use account status; inactive is total minus active. Expired members have at least one `EXPIRED` membership and no membership with `ACTIVE` status, without an expiry timestamp check. Satisfaction is the rounded percentage of feedback with `rating > 4` (five-star reviews), or zero when there are no reviews; it is not the mean rating or AI sentiment. Owner user statistics include owners even though the owner directory excludes them. Statistics do not inherit list search/filter parameters.

### Profiles and avatars

All four role-specific profile controllers expose `/me`, `/edit-profile`, `/email-change`, and `/profile-image` under `/api/users/<role-plural>`. Owner/admin self-edits accept a partial registration DTO excluding `email`/`termsAccepted`, plus `currentPassword`; member self-edits allow phone/address/emergency contact/wallet/password fields; staff self-edits allow phone/password fields. Email changes use the separate verified flow. Staff `/me` additionally includes the public administrator; member `/me` does not add the `adminWalletAddress` field returned at login.

Avatar upload is multipart form data with field **`image`**, a maximum of `1024 * 1024` bytes, and a required file. Controllers accept declared PNG/JPEG/WebP or `application/octet-stream`, then inspect the buffer with `file-type` and require detected PNG/JPEG/WebP. Uploads stream to Cloudinary; replacing an avatar updates the database and deletes the old nondefault asset. Upload/delete return no body. Default avatar constants are in [default-avatars.constants.ts](../src/core/constants/default-avatars.constants.ts); owner avatar methods currently share the user implementation, whose default-image comparisons/reset use the administrator constants.

## Validation and errors

The global `ValidationPipe` enables `transform`, `whitelist`, and `forbidNonWhitelisted`. Body DTOs reject extra fields and validate their declared properties; this is not a generic sanitizer or a guarantee that every primitive query has equivalent validation. UUID route parameters use `ParseUUIDPipe`. Enum query filters use `ParseEnumPipe` with `optional: true`; use exact uppercase enum values.

DTOs trim many identity strings, lowercase emails, remove whitespace from phone numbers, and uppercase body `gender`/feedback status. `Gender` is `MALE` or `FEMALE`. Names in registration/provisioning require 2–30 ASCII letters/spaces, phone fields use `IsPhoneNumber`, and optional wallet addresses use `IsEthereumAddress`. Password setup/reset/change uses the [password validator](../src/core/utils/password.validator.ts): 8–64 characters, upper/lowercase letters, digits, symbols, and no spaces after DTO transformation. Numeric body fields generally require JSON numbers rather than numeric strings; only fields with explicit transformation are converted.

Partial update DTOs make fields optional; this must not be interpreted as a blanket guarantee that explicit nulls are rejected. Service checks supplement validation with minimum ages, ownership, date ordering and account/business-state checks.

There is no custom global error envelope. Nest HTTP exceptions generally produce `statusCode`, `message` (string or validation-message array), and `error` where supplied by Nest. Relevant statuses include:

| Status | Examples from this implementation |
| --- | --- |
| 400 | Invalid DTO/UUID/enum/query integer, invalid/used/expired action, some invalid state transitions |
| 401 | Invalid credentials/JWT/session; some duplicate recovery/setup-request and duration-ownership failures |
| 403 | Role/access restrictions, inactive club entitlements, invalid visit window, quota restrictions |
| 404 | Missing or inaccessible scoped records |
| 409 | Duplicates, existing active plan/duration, repeated likes/read state, some concurrent transitions |
| 429 | Throttler rejection |
| 500 | Mail/media/reward failures and unhandled database errors |

Status codes are not uniform across business-state errors; consult the service rather than assuming every conflict is 409. Most POST handlers use Nest's default 201. Login/logout/refresh, email verification, user reset, forgot-password, setup-password, and attendance check-in explicitly return 200 where decorated. Staff/member reset and email-change completion retain default POST status 201. Returning `undefined` does not mean HTTP 204: many successful commands have an empty body with their default or explicitly configured status.

## Caching and request limits

[RedisModule](../src/infrastructure/redis/redis.module.ts) installs a global Keyv-backed cache with default TTL **60,000 ms** and Redis error logging. [RedisService](../src/infrastructure/redis/redis.service.ts) writes, reads, verifies, and deletes a UUID diagnostic key during module initialization; a failed value check throws and prevents successful startup.

Only the following detail reads explicitly use cache-aside entries, with **300,000 ms** TTL:

| Key | Reads / invalidation |
| --- | --- |
| `platform:plans:<planId>` | Public plan detail; plan update, duration creation, and duration update invalidate the associated plan's key |
| `admin:<adminId>:working-hours:<workingHourId>` | Detail shared by club/member reads; update/delete invalidate it |
| `admin:<adminId>:special-hours:<specialHourId>` | Detail shared by club/member reads; update/delete invalidate it |

Lists are not cached, and there is no global HTTP cache interceptor. Authorization checks run before cached club hour details are returned. New independent records do not require list-cache invalidation. Plan reads on cache hits return deserialized cached data rather than a live Prisma object.

The global `ThrottlerGuard` is configured for **100 requests per 60,000 ms**. Method decorators replace that named default configuration, with exact rates shown in the route reference. Common overrides include login/refresh/logout at 5/minute, registration at 5/10 minutes, forgot-password at 3/hour, and email verification at 10/hour. Some GET methods use `@SkipThrottle`: self profiles, current/history subscription/membership reads, and notification list/detail reads.

No Redis-backed throttler storage or custom account-based tracker is registered. Throttling uses the framework's default storage/tracking, independent of the Redis application cache; do not assume a shared limit across replicas or a per-account failed-login counter. Express trusts one proxy hop (`trust proxy: 1`).

CORS allows `FRONTEND_URL`, credentials, methods `GET, POST, PUT, PATCH, DELETE, OPTIONS`, and headers `Content-Type`, `Authorization`, `X-CSRF-Token`, with preflight `maxAge: 86400`. Allowing that header is not implementation of a CSRF token validation mechanism. Helmet is installed globally. [LoggerMiddleware](../src/core/middlewares/logger.middleware.ts) records the request method, original URL, IP/user agent and final response status.

## Scheduled jobs and integrations

### Scheduled work

Seven job classes are registered in [AppModule](../src/app.module.ts), all under [src/jobs](../src/jobs/). Cron decorators specify no timezone or distributed scheduling lock. Each application instance registers these jobs; there is no separate worker process in the backend configuration.

| Class | Decorator frequency | Actual operation |
| --- | --- | --- |
| `MembershipCron` | `EVERY_HOUR` | Change `ACTIVE` memberships with `expiresAt <= now` to `EXPIRED` |
| `SubscriptionCron` | `EVERY_HOUR` | Change `ACTIVE` subscriptions with `expiresAt <= now` to `EXPIRED` |
| `MembershipNotificationCron` | `EVERY_HOUR` | Create member `MEMBERSHIP_EXPIRATION` notifications for active memberships expiring in `(now, now + 24h]` |
| `SubscriptionNotificationCron` | `EVERY_HOUR` | Create administrator `SUBSCRIPTION_EXPIRATION` notifications for active subscriptions in the same window |
| `VisitCron` | `EVERY_30_MINUTES` | Change `READY` visits with `visitDateAndTimeExpiresAt <= now` to `EXPIRED` |
| `SentimentCron` | `EVERY_HOUR` | Retry up to 50 oldest feedback rows with null `sentimentType` or `sentimentScore`, sequentially |
| `RemoveInactiveUsers` | `EVERY_DAY_AT_MIDNIGHT` | Attempt to delete unverified `User` records created at least seven days ago |

Reminder jobs conditionally claim an unchanged, unnotified row using `updateMany` within a transaction; only a successful claim creates the notification. `expirationNotifiedAt` tracks that reminder. They create database notifications, not reminder emails. `PAYMENT_REMINDER` remains an enum value but these jobs do not generate payment reminders. There is no registered payment cron.

Cleanup uses `user.deleteMany` without first deleting dependent action/session rows. Required foreign keys may prevent deletion; see troubleshooting. Sentiment retries are bounded to 50 rows but have no retry counter/backoff or claim marker.

### External clients

| Integration | Implemented request / behavior |
| --- | --- |
| [Email](../src/infrastructure/email/email.module.ts) | Exact `NODE_ENV=production` selects Resend; all other values select Nodemailer Gmail transport. Awaited sends cover verification, setup, reset and email change |
| [Cloudinary](../src/infrastructure/cloudinary/cloudinary.service.ts) | Upload streams with `resource_type: image`, unique filenames and role-specific folders; destroy prior assets on replacement/deletion |
| [Sentiment](../src/infrastructure/external-api/external-api.service.ts) | Axios POST to `AI_API_URL` with `{ text: content }`, `X-API-Key: INTERNAL_API_KEY`, timeout 5,000 ms; expects `{ sentiment, score }` where sentiment is `NEGATIVE`, `NEUTRAL`, or `POSITIVE` |
| [Blockchain reward](../src/modules/members/members.service.ts) | Axios POST to `BLOCKCHAIN_REWARD_API_URL` with `{ membershipId, clientWallet }` and `X-Reward-Secret: REWARD_INTERNAL_SECRET` during onboarding/replacement |

Sentiment errors are caught, logged as a warning, and yield null; HTTP success responses are typed but have no runtime response validation. A failed classification does not itself reject feedback submission. Reward calls have no explicit Axios timeout here; a request failure throws `InternalServerErrorException('Block Chain is Down')` and fails the surrounding membership transaction. A remote side effect cannot be rolled back by PostgreSQL. Wallet persistence, reward calls, and token prices do not establish any additional smart-contract behavior; the remote service implementations were not inspected.

## Tests and verification

`package.json` configures Jest with `rootDir: src`, `testRegex: .*\.spec\.ts$`, `ts-jest`, and Node environment. Test scripts are listed above, but this backend checkout contains **no authored unit/e2e test files** and no `test/jest-e2e.json`. The old claim that a starter e2e test exists does not match the current files. No automated coverage or successful manual integration run is claimed.

Read-only HTTP checks for an already-running development server:

```bash
curl -i http://localhost:3000/api/health
curl -i 'http://localhost:3000/api/plans?page=1&limit=10'
```

Health returns `{ "status": "ok" }` with `Cache-Control: no-store`. It is a liveness handler, not a live PostgreSQL/Redis/integration readiness check. It does not bypass global throttling.

When `NODE_ENV=development`, interactive Swagger is registered at **`/api/api-docs`**. Its server URL comes from `FRONTEND_URL`. Controller/DTO decorators are not a complete hand-authored API specification; use the route reference and linked DTOs/services to resolve omissions. Swagger is absent for other environment values.

This documentation review used static inspection of backend source, DTOs, controllers, schema/migrations, package/lock configuration, templates, startup jobs and deployment files. It did not start the server, run tests/builds, install dependencies, generate a client, apply migrations, invoke seeders, or contact integration providers.

## Troubleshooting

| Symptom | Implementation-grounded checks |
| --- | --- |
| Missing configuration at startup | Run from backend directory; check required email branding/provider, Cloudinary, AI, Redis, JWT and owner variables. Both mail providers are constructed |
| Redis diagnostic failure | Verify `REDIS_URL` from the backend process/container and Redis write/read availability; cache error logging alone is not a successful diagnostic |
| PostgreSQL connection or missing-table errors | Check `DATABASE_URL`, generated client, migration state, and which database the process uses |
| Migration failure on existing data | Inspect the specific SQL file and data preconditions; history contains destructive drop/add operations and required-column changes without backfills |
| Owner initialization logs a duplicate | Seeder matches email OR phone OR username across `User`; a collision skips creation and does not update credentials |
| `start:prod` cannot locate main | Script is `node dist/main`; Docker targets `dist/src/main`. Inspect the actual build layout and use the explicit command above when appropriate |
| Container migration command fails | Final dependency installation omits dev dependencies, including declared Prisma CLI; runtime CLI availability/network fetch behavior was not validated |
| Browser refresh/logout returns 401 | Check same-host/path cookie, credentials option, production HTTPS, matching role strategy, and session expiry/revocation. Logout additionally needs a valid access JWT |
| Login succeeds but club operations return 403 | Login is not proof of active SaaS subscription/member membership. Check account, plan availability, status and expiry; booking checks future entitlement |
| Historical member search seems too broad | `membershipStatus` matches any related historical row, not only the current membership. Member `expiredCount` statistics use a different some-expired/none-active predicate |
| List call fails with missing/invalid query | Supply both integer `page` and `limit`; no defaults are applied |
| QR check-in rejects the body | Property is `rowToken`, not `rawToken`; use the value returned at booking. Validate today's visit, club, status, quota, and 10-minute-early/30-minute-late window |
| Visit unavailable despite hours | Check server-local day/time, ISO weekday, missing/closed regular hours, closures, same-day reservation and non-cancelled weekly visit counts |
| Membership create/update returns blockchain error | Reward request is awaited inside its transaction; check reward URL, secret and remote availability |
| Account created but invitation/verification send failed | The account may remain; the new action token is removed on send failure. Login/resend behavior can issue another link when no live action exists |
| Feedback has no sentiment | Failed requests save null values; check configured payload/header contract. Hourly retries handle at most 50 oldest incomplete rows |
| Unverified-user cleanup fails | `deleteMany` does not remove dependent token rows first; required relations use restrictive deletion behavior |
| No tests / e2e config missing | Scripts are declared but test files and the referenced e2e config are absent; they are not verified suites |

## HTTP route reference

The tables below list the controller-declared routes. `:id` is validated as UUID. Body column entries link to DTO definitions. A dash means no body DTO or no query parameter; profile-image POST routes still require the multipart `image` file described above. `?` after a query name means optional; otherwise it is required. Every `page, limit` pair uses the pagination behavior described above. Method-level rates are displayed as requests/window; `100/min` is the global fallback and `Skipped` means `@SkipThrottle()` on that method.

Access labels describe guards: `Public` has no role/token guard; `Action token` means a public completion route requiring its query token; a role alone requires its access JWT; `refresh cookie` requires that role's refresh JWT; `access + refresh` requires both. Service-level account, entitlement and ownership checks still apply as described in the workflows.

### attendances

Sources: [admin-attendances.controller.ts](../src/modules/attendances/admin-attendances.controller.ts), [member-attendances.controller.ts](../src/modules/attendances/member-attendances.controller.ts), [staff-attendances.controller.ts](../src/modules/attendances/staff-attendances.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/admins/attendances/check-in/manual` | ADMIN | [AttendanceManualCheckInDto](../src/modules/attendances/dtos/attendance-manual-check-in.dto.ts) | — | 10/min |
| POST | `/api/admins/attendances/check-in/qr` | ADMIN | [AttendanceQrCheckInDto](../src/modules/attendances/dtos/attendance-qr-check-in.dto.ts) | — | 10/min |
| GET | `/api/members/attendances` | MEMBER | — | `page, limit, attendanceMethod?` | 10/min |
| GET | `/api/members/attendances/stats` | MEMBER | — | — | 100/min |
| GET | `/api/members/attendances/:id` | MEMBER | — | — | 10/min |
| POST | `/api/staffs/attendances/check-in/manual` | STAFF | [AttendanceManualCheckInDto](../src/modules/attendances/dtos/attendance-manual-check-in.dto.ts) | — | 10/min |
| POST | `/api/staffs/attendances/check-in/qr` | STAFF | [AttendanceQrCheckInDto](../src/modules/attendances/dtos/attendance-qr-check-in.dto.ts) | — | 10/min |

### auth

Sources: [auth.controller.ts](../src/modules/auth/auth.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | [RegisterUserDto](../src/modules/auth/dtos/register-user.dto.ts) | — | 5/10 min |
| POST | `/api/auth/login` | Public | [LoginUserDto](../src/modules/auth/dtos/login-user.dto.ts) | — | 5/min |
| POST | `/api/auth/admins/logout` | ADMIN access + refresh | — | — | 5/min |
| POST | `/api/auth/owners/logout` | OWNER access + refresh | — | — | 5/min |
| POST | `/api/auth/email-verification` | Action token | — | `token` | 10/hour |
| POST | `/api/auth/forgot-password` | Public | [ForgotPasswordUserDto](../src/modules/auth/dtos/forgot-password-user.dto.ts) | — | 3/hour |
| POST | `/api/auth/reset-password` | Action token | [ResetPasswordUserDto](../src/modules/auth/dtos/reset-passworf-user.dto.ts) | `token` | 5/hour |
| POST | `/api/auth/email-change` | Action token | — | `token` | 5/hour |
| POST | `/api/auth/admins/refresh` | ADMIN refresh cookie | — | — | 5/min |
| POST | `/api/auth/owners/refresh` | OWNER refresh cookie | — | — | 5/min |
| POST | `/api/auth/staffs/refresh` | STAFF refresh cookie | — | — | 5/min |
| POST | `/api/auth/members/refresh` | MEMBER refresh cookie | — | — | 5/min |
| POST | `/api/auth/staffs/login` | Public | [LoginStaffDto](../src/modules/auth/dtos/login-staff.dto.ts) | — | 5/min |
| POST | `/api/auth/staffs/logout` | STAFF access + refresh | — | — | 5/min |
| POST | `/api/auth/staffs/set-password` | Action token | [SetPasswordStaffDto](../src/modules/auth/dtos/set-password-staff.dto.ts) | `token` | 5/min |
| POST | `/api/auth/staffs/forgot-password` | Public | [ForgotPasswordStaffDto](../src/modules/auth/dtos/forgot-password-staff.dto.ts) | — | 3/hour |
| POST | `/api/auth/staffs/reset-password` | Action token | [ResetPasswordStaffDto](../src/modules/auth/dtos/reset-password-staff.dto.ts) | `token` | 5/hour |
| POST | `/api/auth/staffs/email-change` | Action token | — | `token` | 5/hour |
| POST | `/api/auth/members/login` | Public | [LoginMemberDto](../src/modules/auth/dtos/login-member.dto.ts) | — | 5/min |
| POST | `/api/auth/members/logout` | MEMBER access + refresh | — | — | 5/min |
| POST | `/api/auth/members/set-password` | Action token | [SetPasswordMemberDto](../src/modules/auth/dtos/set-password-member.dto.ts) | `token` | 5/min |
| POST | `/api/auth/members/forgot-password` | Public | [ForgotPasswordMemberDto](../src/modules/auth/dtos/forgot-password-member.dto.ts) | — | 3/hour |
| POST | `/api/auth/members/reset-password` | Action token | [ResetPasswordMemberDto](../src/modules/auth/dtos/reset-password-member.dto.ts) | `token` | 5/hour |
| POST | `/api/auth/members/email-change` | Action token | — | `token` | 5/hour |

### dashboards

Sources: [admin-dashboards.controller.ts](../src/modules/dashboards/admin-dashboards.controller.ts), [staff-dashboards.controller.ts](../src/modules/dashboards/staff-dashboards.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admins/dashboard/stats` | ADMIN | — | — | 100/min |
| GET | `/api/staffs/dashboard/stats` | STAFF | — | — | 100/min |

### feedbacks

Sources: [admin-feedbacks.controller.ts](../src/modules/feedbacks/admin-feedbacks.controller.ts), [member-feedbacks.controller.ts](../src/modules/feedbacks/member-feedbacks.controller.ts), [staff-feedbacks.controller.ts](../src/modules/feedbacks/staff-feedbacks.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admins/feedbacks` | ADMIN | — | `page, limit` | 10/min |
| GET | `/api/admins/feedbacks/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/feedbacks/:id` | ADMIN | — | — | 10/min |
| PATCH | `/api/admins/feedbacks/:id` | ADMIN | [UpdateFeedbackStatusDto](../src/modules/feedbacks/dto/update-feedback-status.dto.ts) | — | 10/min |
| POST | `/api/members/feedbacks/create` | MEMBER | [CreateFeedbackDto](../src/modules/feedbacks/dto/create-feedback.dto.ts) | — | 10/min |
| GET | `/api/members/feedbacks` | MEMBER | — | `page, limit` | 10/min |
| GET | `/api/members/feedbacks/stats` | MEMBER | — | — | 100/min |
| GET | `/api/members/feedbacks/:id` | MEMBER | — | — | 10/min |
| POST | `/api/members/feedbacks/like` | MEMBER | [CreateFeedbackLikeDto](../src/modules/feedbacks/dto/create-feedback-like.dto.ts) | — | 10/min |
| POST | `/api/members/feedbacks/remove-like` | MEMBER | [RemoveFeedbackLikeDto](../src/modules/feedbacks/dto/remove-feedback-like.dto.ts) | — | 10/min |
| DELETE | `/api/members/feedbacks/:id` | MEMBER | — | — | 10/min |
| GET | `/api/staffs/feedbacks` | STAFF | — | `page, limit` | 10/min |
| GET | `/api/staffs/feedbacks/stats` | STAFF | — | — | 100/min |
| GET | `/api/staffs/feedbacks/:id` | STAFF | — | — | 10/min |
| PATCH | `/api/staffs/feedbacks/:id` | STAFF | [UpdateFeedbackStatusDto](../src/modules/feedbacks/dto/update-feedback-status.dto.ts) | — | 10/min |

### health

Sources: [health.controller.ts](../src/modules/health/health.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/health` | Public | — | — | 60/min |

### members

Sources: [admin-members.controller.ts](../src/modules/members/admin-members.controller.ts), [staff-members.controller.ts](../src/modules/members/staff-members.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/admins/members` | ADMIN | [AddMemberDto](../src/modules/members/dtos/add-member.dto.ts) | — | 10/min |
| PATCH | `/api/admins/members/:id` | ADMIN | [UpdateMemberDto](../src/modules/members/dtos/update-member.dto.ts) | — | 20/min |
| PATCH | `/api/admins/members/active/:id` | ADMIN | — | — | 20/min |
| PATCH | `/api/admins/members/pending/:id` | ADMIN | — | — | 20/min |
| PATCH | `/api/admins/members/ban/:id` | ADMIN | — | — | 20/min |
| GET | `/api/admins/members` | ADMIN | — | `page, limit, accountStatus?, membershipStatus?, search?` | 60/min |
| GET | `/api/admins/members/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/members/:id` | ADMIN | — | — | 100/min |
| POST | `/api/admins/members/resend-set-password/:id` | ADMIN | — | — | 10/min |
| POST | `/api/staffs/members` | STAFF | [AddMemberDto](../src/modules/members/dtos/add-member.dto.ts) | — | 10/min |
| PATCH | `/api/staffs/members/:id` | STAFF | [UpdateMemberDto](../src/modules/members/dtos/update-member.dto.ts) | — | 20/min |
| PATCH | `/api/staffs/members/active/:id` | STAFF | — | — | 20/min |
| PATCH | `/api/staffs/members/pending/:id` | STAFF | — | — | 20/min |
| PATCH | `/api/staffs/members/ban/:id` | STAFF | — | — | 20/min |
| GET | `/api/staffs/members` | STAFF | — | `page, limit, accountStatus?, membershipStatus?, search?` | 60/min |
| GET | `/api/staffs/members/stats` | STAFF | — | — | 100/min |
| GET | `/api/staffs/members/:id` | STAFF | — | — | 100/min |
| POST | `/api/staffs/members/resend-set-password/:id` | STAFF | — | — | 10/min |

### membership-plans

Sources: [admin-membership-plans.controller.ts](../src/modules/membership-plans/admin-membership-plans.controller.ts), [member-membership-plans.controller.ts](../src/modules/membership-plans/member-membership-plans.controller.ts), [staff-membership-plans.controller.ts](../src/modules/membership-plans/staff-membership-plans.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/admins/membership-plans` | ADMIN | [AddMembershipPlanDto](../src/modules/membership-plans/dtos/add-membership-plan.dto.ts) | — | 10/10 min |
| POST | `/api/admins/membership-plans/durations` | ADMIN | [AddMembershipPlanDurationDto](../src/modules/membership-plans/dtos/add-membership-plan-duration.dto.ts) | — | 10/10 min |
| PATCH | `/api/admins/membership-plans/:id` | ADMIN | [UpdateMembershipPlanDto](../src/modules/membership-plans/dtos/update-membership-plan.dto.ts) | — | 20/min |
| PATCH | `/api/admins/membership-plans/durations/:id` | ADMIN | [UpdateMembershipPlanDurationDto](../src/modules/membership-plans/dtos/update-membership-plan-duration.dto.ts) | — | 20/min |
| GET | `/api/admins/membership-plans` | ADMIN | — | `page, limit` | 60/min |
| GET | `/api/admins/membership-plans/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/membership-plans/:id` | ADMIN | — | — | 100/min |
| GET | `/api/members/membership-plans` | MEMBER | — | `page, limit` | 60/min |
| GET | `/api/members/membership-plans/:id` | MEMBER | — | — | 100/min |
| GET | `/api/staffs/membership-plans` | STAFF | — | `page, limit` | 60/min |
| GET | `/api/staffs/membership-plans/stats` | STAFF | — | — | 100/min |
| GET | `/api/staffs/membership-plans/:id` | STAFF | — | — | 100/min |

### memberships

Sources: [admin-memberships.controller.ts](../src/modules/memberships/admin-memberships.controller.ts), [member-memberships.controller.ts](../src/modules/memberships/member-memberships.controller.ts), [staff-memberships.controller.ts](../src/modules/memberships/staff-memberships.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admins/memberships` | ADMIN | — | `page, limit` | 60/min |
| GET | `/api/admins/memberships/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/memberships/:id` | ADMIN | — | — | 100/min |
| GET | `/api/members/memberships/me` | MEMBER | — | — | Skipped |
| GET | `/api/members/memberships/all` | MEMBER | — | `page, limit` | Skipped |
| GET | `/api/members/memberships/stats` | MEMBER | — | — | 100/min |
| GET | `/api/staffs/memberships` | STAFF | — | `page, limit` | 60/min |
| GET | `/api/staffs/memberships/stats` | STAFF | — | — | 100/min |
| GET | `/api/staffs/memberships/:id` | STAFF | — | — | 100/min |

### notifications

Sources: [admin-notifications.controller.ts](../src/modules/notifications/admin-notifications.controller.ts), [member-notifications.controller.ts](../src/modules/notifications/member-notifications.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admins/notifications/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/notifications/:id` | ADMIN | — | — | Skipped |
| GET | `/api/admins/notifications` | ADMIN | — | `page, limit` | Skipped |
| PATCH | `/api/admins/notifications` | ADMIN | — | — | 100/min |
| PATCH | `/api/admins/notifications/:id` | ADMIN | — | — | 100/min |
| GET | `/api/members/notifications/stats` | MEMBER | — | — | 100/min |
| GET | `/api/members/notifications/:id` | MEMBER | — | — | Skipped |
| GET | `/api/members/notifications` | MEMBER | — | `page, limit` | Skipped |
| PATCH | `/api/members/notifications` | MEMBER | — | — | 100/min |
| PATCH | `/api/members/notifications/:id` | MEMBER | — | — | 100/min |

### payments

Sources: [admin-payments.controller.ts](../src/modules/payments/admin-payments.controller.ts), [member-payments.controller.ts](../src/modules/payments/member-payments.controller.ts), [staff-payments.controller.ts](../src/modules/payments/staff-payments.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admins/payments` | ADMIN | — | `page, limit, search?` | 60/min |
| GET | `/api/admins/payments/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/payments/:id` | ADMIN | — | — | 100/min |
| GET | `/api/members/payments` | MEMBER | — | `page, limit` | 60/min |
| GET | `/api/members/payments/stats` | MEMBER | — | — | 100/min |
| GET | `/api/members/payments/:id` | MEMBER | — | — | 100/min |
| GET | `/api/staffs/payments` | STAFF | — | `page, limit, search?` | 60/min |
| GET | `/api/staffs/payments/stats` | STAFF | — | — | 100/min |
| GET | `/api/staffs/payments/:id` | STAFF | — | — | 100/min |

### platform/owners

Sources: [owners.controller.ts](../src/modules/platform/owners/owners.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/owners/users` | OWNER | — | `page, limit, search?` | 100/min |
| GET | `/api/owners/users/stats` | OWNER | — | — | 100/min |
| GET | `/api/owners/users/:id` | OWNER | — | — | 100/min |
| PATCH | `/api/owners/users/active/:id` | OWNER | — | — | 100/min |
| PATCH | `/api/owners/users/pending/:id` | OWNER | — | — | 100/min |
| PATCH | `/api/owners/users/ban/:id` | OWNER | — | — | 100/min |

### platform/plans

Sources: [plans.controller.ts](../src/modules/platform/plans/plans.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/plans` | OWNER | [AddPlanDto](../src/modules/platform/plans/dtos/add-plan.dto.ts) | — | 10/10 min |
| POST | `/api/plans/durations` | OWNER | [AddPlanDurationDto](../src/modules/platform/plans/dtos/add-plan-duration.dto.ts) | — | 10/10 min |
| PATCH | `/api/plans/:id` | OWNER | [UpdatePlanDto](../src/modules/platform/plans/dtos/update-plan.dto.ts) | — | 20/min |
| PATCH | `/api/plans/durations/:id` | OWNER | [UpdatePlanDurationDto](../src/modules/platform/plans/dtos/update-plan-duration.dto.ts) | — | 20/min |
| GET | `/api/plans` | Public | — | `page, limit` | 60/min |
| GET | `/api/plans/stats` | Public | — | — | 100/min |
| GET | `/api/plans/:id` | Public | — | — | 100/min |

### platform/subscriptions

Sources: [admin-subscriptions.controller.ts](../src/modules/platform/subscriptions/admin-subscriptions.controller.ts), [owner-subscriptions.controller.ts](../src/modules/platform/subscriptions/owner-subscriptions.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admins/subscriptions/me` | ADMIN | — | — | Skipped |
| GET | `/api/admins/subscriptions/all` | ADMIN | — | `page, limit` | Skipped |
| GET | `/api/admins/subscriptions/stats` | ADMIN | — | — | 100/min |
| POST | `/api/owners/subscriptions` | OWNER | [ActiveSubscriptionDto](../src/modules/platform/subscriptions/dtos/active-subscription.dto.ts) | — | 10/min |
| PATCH | `/api/owners/subscriptions` | OWNER | [CancelSubscriptionDto](../src/modules/platform/subscriptions/dtos/cancel-subscription.dto.ts) | — | 10/min |
| GET | `/api/owners/subscriptions` | OWNER | — | `page, limit, search?` | 60/min |
| GET | `/api/owners/subscriptions/stats` | OWNER | — | — | 100/min |
| GET | `/api/owners/subscriptions/:id` | OWNER | — | — | 100/min |

### profiles

Sources: [admin-profiles.controller.ts](../src/modules/profiles/admin-profiles.controller.ts), [member-profiles.controller.ts](../src/modules/profiles/member-profiles.controller.ts), [owner-profiles.controller.ts](../src/modules/profiles/owner-profiles.controller.ts), [staff-profiles.controller.ts](../src/modules/profiles/staff-profiles.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/users/admins/me` | ADMIN | — | — | Skipped |
| PATCH | `/api/users/admins/edit-profile` | ADMIN | [UpdateProfileUserDto](../src/modules/profiles/dtos/update-profile-user.dto.ts) | — | 20/min |
| POST | `/api/users/admins/email-change` | ADMIN | [RequestEmailChangeUserDto](../src/modules/profiles/dtos/request-email-change-user.dto.ts) | — | 5/min |
| POST | `/api/users/admins/profile-image` | ADMIN | — | — | 10/min |
| DELETE | `/api/users/admins/profile-image` | ADMIN | — | — | 10/min |
| GET | `/api/users/members/me` | MEMBER | — | — | Skipped |
| PATCH | `/api/users/members/edit-profile` | MEMBER | [UpdateProfileMemberDto](../src/modules/profiles/dtos/update-profile-member.dto.ts) | — | 20/min |
| POST | `/api/users/members/email-change` | MEMBER | [RequestEmailChangeMemberDto](../src/modules/profiles/dtos/request-email-change-member.dto.ts) | — | 5/min |
| POST | `/api/users/members/profile-image` | MEMBER | — | — | 10/min |
| DELETE | `/api/users/members/profile-image` | MEMBER | — | — | 10/min |
| GET | `/api/users/owners/me` | OWNER | — | — | Skipped |
| PATCH | `/api/users/owners/edit-profile` | OWNER | [UpdateProfileUserDto](../src/modules/profiles/dtos/update-profile-user.dto.ts) | — | 20/min |
| POST | `/api/users/owners/email-change` | OWNER | [RequestEmailChangeUserDto](../src/modules/profiles/dtos/request-email-change-user.dto.ts) | — | 5/min |
| POST | `/api/users/owners/profile-image` | OWNER | — | — | 10/min |
| DELETE | `/api/users/owners/profile-image` | OWNER | — | — | 10/min |
| GET | `/api/users/staffs/me` | STAFF | — | — | Skipped |
| PATCH | `/api/users/staffs/edit-profile` | STAFF | [UpdateProfileStaffDto](../src/modules/profiles/dtos/update-profile-staff.dto.ts) | — | 20/min |
| POST | `/api/users/staffs/email-change` | STAFF | [RequestEmailChangeStaffDto](../src/modules/profiles/dtos/request-email-change-staff.dto.ts) | — | 5/min |
| POST | `/api/users/staffs/profile-image` | STAFF | — | — | 10/min |
| DELETE | `/api/users/staffs/profile-image` | STAFF | — | — | 10/min |

### staffs

Sources: [staffs.controller.ts](../src/modules/staffs/staffs.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/admins/staffs` | ADMIN | [AddStaffDto](../src/modules/staffs/dtos/add-staff.dto.ts) | — | 10/min |
| PATCH | `/api/admins/staffs/:id` | ADMIN | [UpdateStaffDto](../src/modules/staffs/dtos/update-staff.dto.ts) | — | 20/min |
| GET | `/api/admins/staffs` | ADMIN | — | `page, limit` | 60/min |
| GET | `/api/admins/staffs/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/staffs/:id` | ADMIN | — | — | 100/min |
| PATCH | `/api/admins/staffs/active/:id` | ADMIN | — | — | 100/min |
| PATCH | `/api/admins/staffs/pending/:id` | ADMIN | — | — | 100/min |
| PATCH | `/api/admins/staffs/ban/:id` | ADMIN | — | — | 100/min |
| POST | `/api/admins/staffs/resend-set-password/:id` | ADMIN | — | — | 10/min |

### visits

Sources: [admin-visits.controller.ts](../src/modules/visits/admin-visits.controller.ts), [member-visits.controller.ts](../src/modules/visits/member-visits.controller.ts), [staff-visits.controller.ts](../src/modules/visits/staff-visits.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/admins/visits/today` | ADMIN | — | `page, limit, search?` | 60/min |
| GET | `/api/admins/visits/today/:id` | ADMIN | — | — | 100/min |
| GET | `/api/admins/visits/stats` | ADMIN | — | — | 100/min |
| POST | `/api/members/visits` | MEMBER | [CreateVisitDto](../src/modules/visits/dtos/create-visit.dto.ts) | — | 10/min |
| PATCH | `/api/members/visits/cancel/:id` | MEMBER | — | — | 10/min |
| GET | `/api/members/visits/upcoming` | MEMBER | — | `page, limit` | 60/min |
| GET | `/api/members/visits/today` | MEMBER | — | `page, limit` | 60/min |
| GET | `/api/members/visits/today/:id` | MEMBER | — | — | 100/min |
| GET | `/api/members/visits/stats` | MEMBER | — | — | 100/min |
| GET | `/api/staffs/visits/today` | STAFF | — | `page, limit, search?` | 60/min |
| GET | `/api/staffs/visits/today/:id` | STAFF | — | — | 100/min |
| GET | `/api/staffs/visits/stats` | STAFF | — | — | 100/min |

### working-hours

Sources: [admin-special-hours.controller.ts](../src/modules/working-hours/admin-special-hours.controller.ts), [admin-working-hours.controller.ts](../src/modules/working-hours/admin-working-hours.controller.ts), [member-special-hours.controller.ts](../src/modules/working-hours/member-special-hours.controller.ts), [member-working-hours.controller.ts](../src/modules/working-hours/member-working-hours.controller.ts), [staff-special-hours.controller.ts](../src/modules/working-hours/staff-special-hours.controller.ts), [staff-working-hours.controller.ts](../src/modules/working-hours/staff-working-hours.controller.ts).

| Method | Full path | Access | Body DTO | Query | Rate |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/admins/special-hours` | ADMIN | [AddSpecialHourDto](../src/modules/working-hours/dtos/add-special-hour.dto.ts) | — | 60/min |
| PATCH | `/api/admins/special-hours/:id` | ADMIN | [UpdateSpecialHourDto](../src/modules/working-hours/dtos/update-special-hour.dto.ts) | — | 60/min |
| GET | `/api/admins/special-hours` | ADMIN | — | `page, limit` | 60/min |
| GET | `/api/admins/special-hours/:id` | ADMIN | — | — | 60/min |
| DELETE | `/api/admins/special-hours/:id` | ADMIN | — | — | 60/min |
| POST | `/api/admins/working-hours` | ADMIN | [AddWorkingHourDto](../src/modules/working-hours/dtos/add-working-hour.dto.ts) | — | 60/min |
| PATCH | `/api/admins/working-hours/:id` | ADMIN | [UpdateWorkingHourDto](../src/modules/working-hours/dtos/update-working-hour.dto.ts) | — | 60/min |
| GET | `/api/admins/working-hours` | ADMIN | — | `page, limit` | 60/min |
| GET | `/api/admins/working-hours/stats` | ADMIN | — | — | 100/min |
| GET | `/api/admins/working-hours/:id` | ADMIN | — | — | 60/min |
| DELETE | `/api/admins/working-hours/:id` | ADMIN | — | — | 60/min |
| GET | `/api/members/special-hours` | MEMBER | — | `page, limit` | 60/min |
| GET | `/api/members/special-hours/:id` | MEMBER | — | — | 60/min |
| GET | `/api/members/working-hours` | MEMBER | — | `page, limit` | 60/min |
| GET | `/api/members/working-hours/stats` | MEMBER | — | — | 100/min |
| GET | `/api/members/working-hours/:id` | MEMBER | — | — | 60/min |
| GET | `/api/staffs/special-hours` | STAFF | — | `page, limit` | 60/min |
| GET | `/api/staffs/special-hours/:id` | STAFF | — | — | 60/min |
| GET | `/api/staffs/working-hours` | STAFF | — | `page, limit` | 60/min |
| GET | `/api/staffs/working-hours/stats` | STAFF | — | — | 100/min |
| GET | `/api/staffs/working-hours/:id` | STAFF | — | — | 60/min |


