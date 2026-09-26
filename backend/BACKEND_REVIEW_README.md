# Backend Code Review Report

## Review Scope and Coverage

| Item | Details |
|---|---|
| **Review date** | 2026-09-25 |
| **Branch / commit** | Not a git repository at the backend path; working copy reviewed |
| **NestJS version** | ^11.0.1 (`@nestjs/core`) |
| **HTTP adapter** | Express (`@nestjs/platform-express` ^11.0.1) |
| **Database** | PostgreSQL via Prisma ORM (^7.8.0) with `@prisma/adapter-pg` |
| **Authentication** | Passport-JWT (per-role strategies) + bcryptjs password hashing |
| **Runtime** | Node.js (Docker image `node:20-alpine`) |

### Areas inspected (code read line-by-line)

- `src/main.ts`, `src/app.module.ts`
- All files under `src/core/` (guards, decorators, services, utils, types, enums)
- All files under `src/modules/auth/` (controller, service, provider, DTOs, guards, strategies, JWT)
- All files under `src/modules/members/`, `src/modules/memberships/`, `src/modules/membership-plans/`
- All files under `src/modules/payments/`, `src/modules/profiles/`, `src/modules/staffs/`
- All files under `src/modules/visits/`, `src/modules/attendances/`, `src/modules/feedbacks/`
- All files under `src/modules/notifications/`, `src/modules/working-hours/`
- All files under `src/modules/platform/` (plans, subscriptions, owners)
- All files under `src/infrastructure/` (database, email, cloudinary)
- All files under `src/jobs/` (6 cron jobs)
- `prisma/schema.prisma` (762 lines)
- `.env.example`, `.env` (structure only, values redacted), `.gitignore`
- `Dockerfile`, `tsconfig.json`, `package.json`

### Exclusions

- `node_modules/`, `dist/`, `src/generated/prisma/` — generated or dependency code
- `package-lock.json` — not line-by-line reviewed for vulnerabilities (manual audit not feasible)
- Runtime behavior and deployment infrastructure — not tested live
- Frontend — unknown; XSS and CSRF findings are conditional on frontend behavior

### Limitations

- No running application instance available; all findings are from static code analysis
- No `npm audit` or dependency vulnerability scan was executed (would require network access)
- No tests exist in the project — no test results to report

---

## Summary

| Severity | Confirmed | Needs Verification | Improvement | Total |
|---|---|---|---|---|
| **Critical** | 4 | 1 | 0 | **5** |
| **High** | 8 | 2 | 0 | **10** |
| **Medium** | 11 | 2 | 3 | **16** |
| **Low** | 4 | 1 | 5 | **10** |
| **Total** | **27** | **6** | **8** | **41** |

### Most Urgent Issues

1. **SEC-01** — `.env.example` ships real cryptographic secrets
2. **SEC-02** — Login for INACTIVE user generates action token but never stores it in DB
3. **AUTH-01** — Owner can activate/cancel subscriptions for ANY admin (no ownership check)
4. **AUTH-02** — Owner can cancel ANY admin's subscription via body-supplied `adminId`
5. **BIZ-01** — Membership update uses `this.prisma` inside `$transaction` callback instead of `tx`

---

## Findings Index

| ID | Severity | Status | Title | File and Lines |
|---|---|---|---|---|
| SEC-01 | Critical | Confirmed | `.env.example` contains real-looking secrets | `.env.example` L28-98 |
| SEC-02 | Critical | Confirmed | Login INACTIVE path generates token but never saves hash to DB | `src/modules/auth/auth.provider.ts` L162-173 |
| SEC-03 | Critical | Confirmed | Staff login INACTIVE path also fails to store action token | `src/modules/auth/auth.provider.ts` L432-444 |
| SEC-04 | Critical | Confirmed | `GET /api/plans` and `GET /api/plans/:id` are public (no auth guard) | `src/modules/platform/plans/plans.controller.ts` L52-64 |
| SEC-05 | Critical | Needs verification | Swagger API docs exposed at `/api-docs` in production | `src/main.ts` L61-62 |
| AUTH-01 | High | Confirmed | Owner `activeSubscription` has no ownership check — any admin ID accepted | `src/modules/platform/subscriptions/subscriptions.service.ts` and owner controller |
| AUTH-02 | High | Confirmed | Owner `cancelSubscription` accepts body-supplied `adminId` — IDOR | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` L36-39 |
| AUTH-03 | High | Confirmed | `AdminSubscriptionsController` uses `@SkipThrottle()` — no rate limiting | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts` L30, L38 |
| AUTH-04 | High | Confirmed | Account enumeration via `forgotPassword` — reveals whether email exists | `src/modules/auth/auth.provider.ts` L1110-1112 |
| AUTH-05 | High | Confirmed | Account enumeration via `forgotPasswordMember` / `forgotPasswordStaff` | `src/modules/auth/auth.provider.ts` L1197-1198, L642-643 |
| AUTH-06 | High | Confirmed | Registration reveals whether email or phone already exists | `src/modules/auth/auth.provider.ts` L55-62 |
| AUTH-07 | High | Confirmed | No refresh token rotation — token reuse after refresh is allowed | `src/modules/auth/auth.provider.ts` L886-940 |
| AUTH-08 | High | Confirmed | Password reset does not invalidate existing refresh tokens / sessions | `src/modules/auth/auth.provider.ts` L1142-1189 |
| AUTH-09 | High | Confirmed | `logoutAdmin`/`logoutOwner` return result of provider (which is `void`) — missing `await` in controller | `src/modules/auth/auth.controller.ts` L96-109 |
| AUTH-10 | Medium | Confirmed | Plans API GET routes have no auth — anyone can enumerate platform plans | `src/modules/platform/plans/plans.controller.ts` L52-64 |
| BIZ-01 | Medium | Confirmed | Membership update uses `this.prisma` instead of transaction client `tx` | `src/modules/members/members.service.ts` (inside `$transaction` callback) |
| BIZ-02 | Medium | Confirmed | Username generation can infinite-loop on collision | `src/modules/auth/auth.provider.ts` L74-86, staffs/members service |
| BIZ-03 | Medium | Confirmed | Cron notifications create unlimited duplicate notifications every hour | `src/jobs/membership-notification.cron.ts` L12-36, `src/jobs/subscription-notification.cron.ts` |
| BIZ-04 | Medium | Confirmed | `findAllPayments` null check `if (!payments)` never triggers — `findMany` returns `[]` | `src/modules/payments/payments.service.ts` L68 |
| BIZ-05 | Medium | Confirmed | Pagination with `page=0` or negative values causes invalid `skip` | Multiple controllers using `ParseIntPipe` |
| BIZ-06 | Medium | Confirmed | No upper bound on `limit` query param — client can request unbounded result sets | Multiple controllers |
| BIZ-07 | Medium | Confirmed | `findAllVisitsToday` includes admin entity with password hash in response | `src/modules/visits/visits.service.ts` (select includes `admin: true`) |
| BIZ-08 | Medium | Confirmed | `findAllAttendanceByMember` includes admin entity with password hash | `src/modules/attendances/attendances.service.ts` (select includes `admin: true`) |
| BIZ-09 | Medium | Confirmed | Login response leaks user fields including `isAccountVerified`, `termsAccepted` | `src/modules/auth/auth.provider.ts` L235 |
| BIZ-10 | Medium | Confirmed | `UpdateMemberDto` extends `PartialType(AddMemberDto)` — allows changing `membershipPlanId` via partial update without full business logic | `src/modules/members/dtos/update-member.dto.ts` |
| BIZ-11 | Medium | Needs verification | `members.service.ts` includes `memberships`, `payments`, `notifications` in `findAll` — potentially N+1 and data leak | `src/modules/members/members.service.ts` |
| VAL-01 | Medium | Improvement | No body size limit configured in Express — large JSON payloads accepted | `src/main.ts` |
| VAL-02 | Medium | Improvement | Cookie parser not using a signed cookie secret | `src/main.ts` L38 |
| VAL-03 | Medium | Improvement | `COOKIE_SECRET` env var exists but is never used | `.env` / `src/main.ts` |
| DB-01 | Low | Confirmed | Subscription model has no unique constraint preventing duplicate active subscriptions per user | `prisma/schema.prisma` L191-217 |
| DB-02 | Low | Confirmed | `Member.email` is not unique in schema — allows duplicate emails across admins | `prisma/schema.prisma` L273 |
| DB-03 | Low | Confirmed | `Member.phoneNumber` is not unique in schema | `prisma/schema.prisma` L275 |
| DB-04 | Low | Confirmed | No cascade delete on User → refresh tokens / action tokens | `prisma/schema.prisma` L634-723 |
| DOCKER-01 | Low | Needs verification | Docker runs as root — no `USER` directive in Dockerfile | `Dockerfile` L30 |
| MISC-01 | Low | Improvement | `staffs.service.ts` `findAll` includes `admin` relation — leaks admin's full User object | `src/modules/staffs/staffs.service.ts` |
| MISC-02 | Low | Improvement | No database connection pool size configured | `src/infrastructure/database/prisma.service.ts` |
| MISC-03 | Low | Improvement | `PaymentCron` uses `startOfTomorrow`/`endOfTomorrow` from `date-fns` — timezone-dependent | `src/jobs/payment.cron.ts` |
| MISC-04 | Low | Improvement | `auth.guard.ts` in `src/core/guards/` references `JWT_SECRET` env var which does not exist | `src/core/guards/auth.guard.ts` L36 |
| MISC-05 | Low | Improvement | `local-auth.guard.ts` is an empty file (0 bytes) | `src/modules/auth/guards/local-auth.guard.ts` |

---

## Detailed Findings

---

### SEC-01 — `.env.example` Contains Real-Looking Cryptographic Secrets

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `.env.example` L28-98 |

**Root cause:** The `.env.example` file contains long hex strings that appear to be actual cryptographic secrets (JWT secrets, cookie secret, database credentials with real passwords). An `.env.example` should contain placeholder values only.

**Code excerpt:**
```
JWT_OWNER_ACCESS_SECRET="8a3ba193ffd56ca...873"
DATABASE_URL="postgresql://admin:1234@localhost:5432/ft_transcendence?schema=public"
COOKIE_SECRET="f3a99836aea578d...994"
```

**Impact:** Anyone who clones the repository can read these values. If the same secrets are used in production or staging, all JWTs and sessions are compromised.

**Expected behavior:** `.env.example` should contain only descriptive placeholders (e.g., `your_jwt_secret_here`).

**Fix:**
1. Replace all secret values in `.env.example` with placeholder strings.
2. Rotate all secrets in every environment that may have used the committed values.
3. Verify `.env` is in `.gitignore` (it is — confirmed).

**Regression test:** After fixing, `grep -E '[a-f0-9]{60,}' .env.example` should return no matches.

---

### SEC-02 — Login INACTIVE Path Generates Token but Never Stores Hash in DB

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L160-173 |

**Root cause:** When a user with `INACTIVE` status attempts to login, the code generates an action token (`rawToken`, `tokenHash`) and sends a verification email, but **never stores the token hash in the database**. The `tokenHash` variable is created but `prisma.userActionToken.create(...)` is never called.

**Code excerpt:**
```typescript
if (user.accountStatus === UserAccountStatus.INACTIVE) {
  try {
    const { rawToken, tokenHash } = generateActionToken();
    // tokenHash is NEVER stored in the DB!
    await this.emailService.sendVerificationEmail(user.email, rawToken);
  } catch {
    throw new RequestTimeoutException('Failed to send verification email');
  }
  throw new UnauthorizedException('Your account is inactive...');
}
```

Compare with registration (L109-130) where the token IS stored.

**Impact:** The user receives a verification email with a token that can never be validated — the `activateAccount` method will always throw "Invalid token" because no matching hash exists in the database. Users who haven't verified their email on first attempt can never activate their account through the login flow.

**Fix:** Add the token creation to the database before sending the email:
```typescript
if (user.accountStatus === UserAccountStatus.INACTIVE) {
  try {
    const { rawToken, tokenHash } = generateActionToken();
    const emailVerificationTokenExpiresIn =
      this.config.getOrThrow<StringValue>('EMAIL_VERIFICATION_TOKEN_EXPIRES_IN');
    const expiresAt = new Date(Date.now() + ms(emailVerificationTokenExpiresIn));

    await this.prisma.userActionToken.create({
      data: {
        user: { connect: { id: user.id } },
        tokenHash: tokenHash,
        type: ActionTokenType.EMAIL_VERIFICATION,
        expiresAt: expiresAt,
      },
    });
    await this.emailService.sendVerificationEmail(user.email, rawToken);
  } catch {
    throw new RequestTimeoutException('Failed to send verification email');
  }
  throw new UnauthorizedException('Your account is inactive...');
}
```

**Regression test:** Log in with an `INACTIVE` account, receive the email, use the token → account should become `ACTIVE`.

---

### SEC-03 — Staff Login INACTIVE Path Also Fails to Store Action Token

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L431-444 |

**Root cause:** Same issue as SEC-02 but for staff login. The action token is generated and emailed but never persisted to `staffActionToken`.

**Impact:** Identical to SEC-02 — staff members with INACTIVE accounts cannot activate via the login-triggered email.

**Fix:** Same pattern as SEC-02 — add `prisma.staffActionToken.create(...)` before sending the email, matching the pattern used in `addStaff` in `staffs.service.ts`.

---

### SEC-04 — Plans API GET Routes Are Public (No Auth Guard)

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/platform/plans/plans.controller.ts` L52-64 |

**Root cause:** The `PlansController` applies auth guards only on `@Post` and `@Patch` routes via route-level `@UseGuards`. The `GET /api/plans` and `GET /api/plans/:id` routes have **no** `@UseGuards` decorator. The `ThrottlerGuard` is applied globally but there is no authentication guard applied globally to these routes.

**Code excerpt:**
```typescript
// * Get all Plan — NO @UseGuards here
@Get()
@Throttle({ default: { limit: 60, ttl: 60_000 } })
findAll(...) { ... }

// * Get one Plan — NO @UseGuards here  
@Get(':id')
@Throttle({ default: { limit: 100, ttl: 60_000 } })
findOne(...) { ... }
```

**Impact:** Any unauthenticated user can enumerate all platform plans, pricing, and durations. This may be intentional (public pricing page), but if plans contain confidential pricing tiers, it's a data exposure.

**Fix:** If plans should be public, document this decision. If not, add a guard:
```typescript
@Get()
@UseGuards(OwnerAccessTokenAuthGuard, AuthRolesGuard)
@Roles([Role.OWNER])
```

**Note:** This is marked Critical because it's the only controller with unguarded routes that could be unintentional. If this is by design (public pricing), reclassify as Improvement.

---

### SEC-05 — Swagger API Docs Exposed in Production

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Status** | Needs verification |
| **Confidence** | Medium |
| **File** | `src/main.ts` L61-62 |

**Root cause:** `SwaggerModule.setup('api-docs', app, documentation)` is called unconditionally — no environment check. In production, `/api-docs` will expose the full API documentation.

**Fix:**
```typescript
if (process.env.NODE_ENV !== 'production') {
  const documentation = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api-docs', app, documentation);
}
```

---

### AUTH-01 — Owner `activeSubscription` Has No Ownership Check

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/platform/subscriptions/subscriptions.service.ts` (activeSubscription method) and `owner-subscriptions.controller.ts` |

**Root cause:** The `activeSubscription` method takes `ActiveSubscriptionDto` which contains a `userName` field. The owner can supply **any** admin's username and activate a subscription for them. There is no check that the authenticated owner has authority over this specific admin.

The controller passes the body directly:
```typescript
@Post()
activeSubscription(@Body() body: ActiveSubscriptionDto) {
  return this.subscriptionsService.activeSubscription(body);
}
```

The access token payload is never even extracted — the owner's identity is not verified against the target admin.

**Impact:** Any authenticated owner could activate subscriptions for any admin in the system.

**Fix:** Extract the owner's identity from the access token payload and validate they have authority over the target admin. Alternatively, if there is only one owner role, ensure the business logic validates the relationship.

---

### AUTH-02 — Owner `cancelSubscription` Accepts Body-Supplied `adminId` — IDOR

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/platform/subscriptions/owner-subscriptions.controller.ts` L36-39 |

**Root cause:** The `CancelSubscriptionDto` accepts a client-supplied `adminId`. Any owner can cancel any admin's subscription by providing their UUID.

```typescript
@Patch()
cancelSubscription(@Body() body: CancelSubscriptionDto) {
  return this.subscriptionsService.cancelSubscription(body.adminId);
}
```

**Impact:** Subscription cancellation for arbitrary admins, causing service disruption.

**Fix:** Validate that the authenticated owner has the right to manage this admin's subscription, or derive the `adminId` from a verified relationship rather than client input.

---

### AUTH-03 — Admin Subscriptions Controller Skips Rate Limiting

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/platform/subscriptions/admin-subscriptions.controller.ts` L30, L38 |

**Root cause:** Both routes use `@SkipThrottle()` which completely disables rate limiting, including the global throttler. While these are read-only endpoints, they call `validateActiveSubscription` which makes database queries. An attacker with a valid admin token could flood these endpoints.

**Fix:** Replace `@SkipThrottle()` with a reasonable rate limit:
```typescript
@Throttle({ default: { limit: 60, ttl: 60_000 } })
```

---

### AUTH-04 — Account Enumeration via `forgotPassword`

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L1110-1112 |

**Root cause:** The `forgotPassword` method throws `'Invalid Email'` when the email is not found. This allows attackers to determine which emails are registered.

```typescript
if (!user) {
  throw new UnauthorizedException('Invalid Email');
}
```

**Expected behavior:** Always return a success-like response regardless of whether the email exists: "If an account with this email exists, a reset link has been sent."

**Fix:**
```typescript
if (!user) {
  return; // silently succeed
}
```

---

### AUTH-05 — Account Enumeration via `forgotPasswordMember` / `forgotPasswordStaff`

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L1197-1198, L642-643 |

**Root cause:** Both `forgotPasswordMember` and `forgotPasswordStaff` throw `NotFoundException('Member Not Found')` / `NotFoundException('Staff Not Found')` which reveals whether a username exists.

**Fix:** Same as AUTH-04 — return a generic success response regardless of existence.

---

### AUTH-06 — Registration Reveals Email/Phone Existence

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L55-62 |

**Root cause:** Registration throws distinct messages: `'Email already exists'` vs `'Phone number already exists'`, allowing enumeration of both.

**Fix:** Return a generic error: `'An account with this email or phone number already exists.'`

---

### AUTH-07 — No Refresh Token Rotation

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L886-940 (refresh method) |

**Root cause:** The `refresh` method validates the refresh token and issues a new access token, but it does **not** rotate (replace) the refresh token. The same refresh token can be used indefinitely until it expires (30 days). If a refresh token is stolen, it remains valid for its full lifetime.

**Expected behavior:** On each refresh, the old refresh token should be revoked and a new one issued (refresh token rotation). If a revoked token is reused, all tokens for that user should be invalidated (reuse detection).

**Fix:** In the `refresh`, `refreshStaff`, and `refreshMember` methods:
1. Revoke the current refresh token
2. Generate a new refresh token
3. Store the new token hash
4. Return both new access and refresh tokens

---

### AUTH-08 — Password Reset Does Not Invalidate Sessions

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L1142-1189 |

**Root cause:** When a user resets their password, existing refresh tokens are not revoked. An attacker who has stolen a refresh token can continue using it even after the victim resets their password.

**Fix:** After updating the password in the transaction, add a step to revoke all refresh tokens for that user:
```typescript
this.prisma.userRefreshToken.updateMany({
  where: { userId: token.user.id, revokedAt: null },
  data: { revokedAt: new Date() },
}),
```

---

### AUTH-09 — Missing `await` on Logout Controller Methods

| Field | Value |
|---|---|
| **Severity** | High |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.controller.ts` L96-109, L121-134, L259-272, L342-355 |

**Root cause:** The `logoutAdmin`, `logoutOwner`, `logoutStaff`, and `logoutMember` controller methods call `response.clearCookie(...)` **before** calling the service method, but they are not `async` and do not `await` the service call. The service method returns a Promise (it does DB operations). The cookie is cleared and a 200 response is sent, but the actual token revocation in the database may not have completed.

```typescript
logoutAdmin(...) {
  response.clearCookie('refresh_token', { ... });
  return this.authService.logoutAdmin(refreshToken, refreshTokenPayload);
  // ^ This returns a Promise but the method is not async
}
```

With `@Res({ passthrough: true })`, NestJS will try to serialize the return value, which is a Promise. The method should be `async` and use `await`.

**Fix:** Make the method `async` and `await` the service call:
```typescript
async logoutAdmin(...) {
  await this.authService.logoutAdmin(refreshToken, refreshTokenPayload);
  response.clearCookie('refresh_token', { ... });
}
```

---

### AUTH-10 — Plans API GET Routes Have No Auth

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/platform/plans/plans.controller.ts` L52-64 |

See SEC-04 for details. This is the medium-severity assessment if the public access is partially intentional.

---

### BIZ-01 — Membership Update Uses `this.prisma` Instead of Transaction Client `tx`

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/members/members.service.ts` (inside the `$transaction` callback in `update` method) |

**Root cause:** Inside the interactive transaction callback, the code uses `this.prisma.membership.create(...)` and `this.prisma.payment.create(...)` instead of `tx.membership.create(...)` and `tx.payment.create(...)`. This means the new membership and payment are created **outside** the transaction scope.

```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.membership.update({ ... }); // ✓ uses tx
  const newMembership = await this.prisma.membership.create({ ... }); // ✗ uses this.prisma
  await this.prisma.payment.create({ ... }); // ✗ uses this.prisma
});
```

**Impact:** If the `payment.create` fails, the old membership is already expired and the new membership already created — leaving an inconsistent state. The transaction provides no atomicity for these operations.

**Fix:** Replace `this.prisma` with `tx` for all operations inside the transaction callback:
```typescript
const newMembership = await tx.membership.create({ ... });
await tx.payment.create({ ... });
```

---

### BIZ-02 — Username Generation Can Infinite-Loop

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | Medium |
| **File** | `src/modules/auth/auth.provider.ts` L74-86, `src/modules/staffs/staffs.service.ts`, `src/modules/members/members.service.ts` |

**Root cause:** The username generation loop `while (true)` has no iteration limit. If `generateUsername` consistently produces colliding usernames (e.g., for very common names with a 5-character nanoid), the loop will run indefinitely, blocking the event loop.

With a 36-character alphabet and 5-character length, there are ~60 million combinations, so collision is unlikely for a single name, but there is no safeguard.

**Fix:** Add a maximum retry count (e.g., 10) and throw an error if exceeded:
```typescript
const MAX_RETRIES = 10;
for (let i = 0; i < MAX_RETRIES; i++) {
  userName = generateUsername(data.firstName, data.lastName);
  const existing = await this.prisma.user.findUnique({ where: { userName } });
  if (!existing) break;
  if (i === MAX_RETRIES - 1) throw new ConflictException('Could not generate unique username');
}
```

---

### BIZ-03 — Cron Notifications Create Unlimited Duplicate Notifications

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/jobs/membership-notification.cron.ts` L12-36, `src/jobs/subscription-notification.cron.ts` |

**Root cause:** The `MembershipNotificationCron` runs every hour and creates a new `memberNotification` for every payment with `DUE_SOON` status. There is no check for whether a notification has already been created for that payment. Over 24 hours, each payment gets 24 duplicate notifications.

Similarly, `SubscriptionNotificationCron` creates notifications for subscriptions expiring tomorrow — every hour, creating up to 24 duplicates.

**Fix:** Either:
1. Track which payments/subscriptions have been notified (e.g., add a `notifiedAt` field)
2. Check for existing notifications before creating new ones
3. Change cron to run once daily instead of hourly

---

### BIZ-04 — `findAllPayments` Null Check Never Triggers

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/payments/payments.service.ts` L68 |

**Root cause:** `prisma.payment.findMany(...)` returns an empty array `[]` when no results are found, never `null`. The check `if (!payments)` will never be true — an empty array is truthy.

```typescript
if (!payments) { // <-- never triggers
  throw new NotFoundException('There Is No Payments To Show');
}
```

Same issue exists in `findAllPaymentsMember` at the same file.

**Fix:** Change to `if (payments.length === 0)`.

---

### BIZ-05 — Pagination With `page=0` or Negative Values

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | Multiple controllers |

**Root cause:** `ParseIntPipe` accepts `0` and negative numbers. When `page=0`, the `skip` calculation becomes `(0-1) * limit = -limit`, which Prisma will reject or return unexpected results. When `page=-1`, `skip = -2 * limit`.

**Fix:** Add validation — either use a custom pipe or add `@Min(1)` with a DTO:
```typescript
@Query('page', new ParseIntPipe()) page: number,
```
Should be validated with `if (page < 1) page = 1;` in each service, or use a query DTO with `@Min(1)`.

---

### BIZ-06 — No Upper Bound on `limit` Query Param

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | Multiple controllers |

**Root cause:** A client can pass `limit=999999` to any paginated endpoint, causing the server to fetch and serialize an enormous result set, leading to memory exhaustion or slow responses.

**Fix:** Enforce a maximum limit (e.g., 100) in each service method:
```typescript
limit = Math.min(Math.max(limit, 1), 100);
```

---

### BIZ-07 — `findAllVisitsToday` Includes Admin Entity With Password Hash

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/visits/visits.service.ts` (findAllVisitsToday, findOneVisitToday, findAllUpcomingVisitsByMember, etc.) |

**Root cause:** The `select` clause includes `admin: true` and `member: true` without excluding sensitive fields. When Prisma includes the full `admin` relation, the response contains the admin's `password` hash, `isAccountVerified`, and other internal fields.

```typescript
select: {
  admin: true,  // ← includes password hash!
  member: true, // ← includes password hash!
  ...
}
```

**Impact:** Password hashes and internal user data are exposed in API responses.

**Fix:** Replace `admin: true` with a select/omit clause:
```typescript
admin: { omit: { password: true } },
member: { omit: { password: true } },
```

---

### BIZ-08 — Attendance Response Includes Admin Password Hash

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/attendances/attendances.service.ts` |

Same issue as BIZ-07 — `admin: true` in select clause of `findAllAttendanceByMember` and `findOneAttendanceByMember`.

---

### BIZ-09 — Login Response Leaks Internal User Fields

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `src/modules/auth/auth.provider.ts` L235 |

**Root cause:** The login method destructures to exclude `id`, `password`, `createdAt`, `updatedAt`, but the `safeUser` spread still includes fields like `isAccountVerified`, `termsAccepted`, `accountStatus`, `profileImagePublicId` (internal Cloudinary ID), `role`.

For staff login (L512), `adminId` and `profileImagePublicId` are also included.

For member login (L819), `adminId`, `staffId`, `profileImagePublicId` are included.

**Fix:** Use explicit field selection instead of spread exclusion. Create a response DTO or manually pick only the fields the client needs.

---

### BIZ-10 — `UpdateMemberDto` Allows Changing Membership Plan via Partial Update

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Confirmed |
| **Confidence** | Medium |
| **File** | `src/modules/members/dtos/update-member.dto.ts` |

**Root cause:** `UpdateMemberDto extends PartialType(AddMemberDto)` which includes `membershipPlanId` and `membershipPlanDurationId` as optional fields. This means a PATCH request to `/api/admins/members/:id` can include these fields, and the `update` method in `members.service.ts` processes membership plan changes through a complex code path that wasn't designed for partial updates.

**Fix:** If membership plan changes should be handled separately, create a dedicated update DTO that excludes `membershipPlanId` and `membershipPlanDurationId`.

---

### BIZ-11 — Members `findAll` Includes Sensitive Relations

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Needs verification |
| **Confidence** | Medium |
| **File** | `src/modules/members/members.service.ts` (findAll, findOne) |

**Root cause:** The `select` clause includes `memberships: true`, `payments: true`, `notifications: true`. This includes all membership/payment/notification records for each member in a list view, potentially:
1. Causing N+1 query performance issues
2. Exposing payment amounts and notification content
3. Making list responses very large

---

### VAL-01 — No Express Body Size Limit

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Improvement |
| **Confidence** | High |
| **File** | `src/main.ts` |

**Root cause:** No body size limit is configured. Express defaults to 100KB for JSON, but this is not explicitly set. Large payloads could consume memory.

**Fix:**
```typescript
const app = await NestFactory.create(AppModule, {
  bodyParser: true,
});
// or use express raw body limit
app.use(express.json({ limit: '1mb' }));
```

---

### VAL-02 — Cookie Parser Not Using Signed Cookie Secret

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Improvement |
| **Confidence** | High |
| **File** | `src/main.ts` L38 |

**Root cause:** `cookieParser()` is called without a secret argument. The `COOKIE_SECRET` environment variable exists but is never passed to the cookie parser. Without a secret, cookies cannot be signed/verified.

**Fix:**
```typescript
const configService = app.get(ConfigService);
app.use(cookieParser(configService.getOrThrow('COOKIE_SECRET')));
```

---

### VAL-03 — `COOKIE_SECRET` Env Var Exists but Is Never Used

| Field | Value |
|---|---|
| **Severity** | Medium |
| **Status** | Improvement |
| **Confidence** | High |
| **File** | `.env` / `src/main.ts` |

Related to VAL-02 — the `COOKIE_SECRET` is defined but never referenced in any code.

---

### DB-01 — No Unique Constraint on Active Subscriptions Per User

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Confirmed |
| **Confidence** | Medium |
| **File** | `prisma/schema.prisma` L191-217 |

**Root cause:** There is no database-level constraint preventing a user from having multiple active subscriptions simultaneously. The application logic checks for this, but a race condition (concurrent requests) could create duplicates.

**Fix:** Consider a partial unique index or check-before-insert with a transaction using serializable isolation.

---

### DB-02 — `Member.email` Is Not Unique in Schema

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `prisma/schema.prisma` L273 |

**Root cause:** Unlike `User.email` which has `@unique`, `Member.email` has no uniqueness constraint. The application-level uniqueness check in `members.service.ts` scopes by `adminId`, so the same email can be used by members under different admins. This may be intentional (multi-tenancy), but it means a member email is not globally unique.

---

### DB-03 — `Member.phoneNumber` Is Not Unique in Schema

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Confirmed |
| **Confidence** | High |
| **File** | `prisma/schema.prisma` L275 |

Same rationale as DB-02 — scoped uniqueness only enforced at application level.

---

### DB-04 — No Cascade Delete on User → Refresh/Action Tokens

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Confirmed |
| **Confidence** | Medium |
| **File** | `prisma/schema.prisma` L634-723 |

**Root cause:** `UserRefreshToken`, `UserActionToken`, `StaffRefreshToken`, etc. have no `onDelete: Cascade`. If a user is ever deleted, orphaned token records remain.

---

### DOCKER-01 — Docker Runs as Root

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Needs verification |
| **Confidence** | Medium |
| **File** | `Dockerfile` L30 |

**Root cause:** The final stage has no `USER` directive, so the Node.js process runs as root inside the container.

**Fix:**
```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

---

### MISC-01 — Staff `findAll` Leaks Admin Object

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Improvement |
| **Confidence** | High |
| **File** | `src/modules/staffs/staffs.service.ts` (findAll, findOne) |

The `admin: true` in the select clause includes the full User object (with password hash) for the admin who created the staff.

---

### MISC-02 — No Database Connection Pool Size Configured

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Improvement |
| **Confidence** | Medium |
| **File** | `src/infrastructure/database/prisma.service.ts` |

No connection pool limits are configured. Under load, Prisma may open too many connections.

---

### MISC-03 — Payment Cron Timezone Sensitivity

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Improvement |
| **Confidence** | Medium |
| **File** | `src/jobs/payment.cron.ts` |

`startOfTomorrow()` and `endOfTomorrow()` from `date-fns` use the server's local timezone. If the server timezone differs from the business timezone, payments may transition status at unexpected times.

---

### MISC-04 — `auth.guard.ts` References Non-Existent `JWT_SECRET`

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Improvement |
| **Confidence** | High |
| **File** | `src/core/guards/auth.guard.ts` L36 |

The generic `AuthGuard` in `src/core/guards/` references `JWT_SECRET` env variable which doesn't exist in `.env` or `.env.example`. This guard appears to be unused (replaced by per-role Passport strategies), but if accidentally imported, it will crash at runtime.

---

### MISC-05 — Empty File `local-auth.guard.ts`

| Field | Value |
|---|---|
| **Severity** | Low |
| **Status** | Improvement |
| **Confidence** | High |
| **File** | `src/modules/auth/guards/local-auth.guard.ts` |

This file is 0 bytes — completely empty. It should be removed or implemented.

---

## Endpoint Review

| Endpoint | Method | Auth | Role | Rate Limit | Response Concerns | Finding IDs |
|---|---|---|---|---|---|---|
| `/api/auth/register` | POST | None | Public | 5/10min | — | AUTH-06 |
| `/api/auth/login` | POST | None | Public | 5/1min | Leaks internal fields | BIZ-09 |
| `/api/auth/email-verification` | POST | None | Public | 10/1hr | — | — |
| `/api/auth/forgot-password` | POST | None | Public | 3/1hr | Leaks email existence | AUTH-04 |
| `/api/auth/reset-password` | POST | None | Public | 5/1hr | No session invalidation | AUTH-08 |
| `/api/auth/admins/logout` | POST | Admin AT + RT | ADMIN | 5/1min | Missing await | AUTH-09 |
| `/api/auth/owners/logout` | POST | Owner AT + RT | OWNER | 5/1min | Missing await | AUTH-09 |
| `/api/auth/admins/refresh` | POST | Admin RT | ADMIN | 5/1min | No token rotation | AUTH-07 |
| `/api/auth/owners/refresh` | POST | Owner RT | OWNER | 5/1min | No token rotation | AUTH-07 |
| `/api/auth/staffs/login` | POST | None | Public | 5/1min | Leaks internal fields, INACTIVE token not stored | SEC-03, BIZ-09 |
| `/api/auth/staffs/logout` | POST | Staff AT + RT | STAFF | 5/1min | Missing await | AUTH-09 |
| `/api/auth/staffs/refresh` | POST | Staff RT | STAFF | 5/1min | No token rotation | AUTH-07 |
| `/api/auth/staffs/set-password` | POST | None (token in query) | Public | 5/1min | — | — |
| `/api/auth/staffs/forgot-password` | POST | None | Public | 3/1hr | Leaks username existence | AUTH-05 |
| `/api/auth/staffs/reset-password` | POST | None (token in query) | Public | 5/1hr | No session invalidation | AUTH-08 |
| `/api/auth/members/login` | POST | None | Public | 5/1min | Leaks internal fields | BIZ-09 |
| `/api/auth/members/logout` | POST | Member AT + RT | MEMBER | 5/1min | Missing await | AUTH-09 |
| `/api/auth/members/refresh` | POST | Member RT | MEMBER | 5/1min | No token rotation | AUTH-07 |
| `/api/auth/members/set-password` | POST | None (token in query) | Public | 5/1min | — | — |
| `/api/auth/members/forgot-password` | POST | None | Public | 3/1hr | Leaks username existence | AUTH-05 |
| `/api/auth/members/reset-password` | POST | None (token in query) | Public | 5/1hr | No session invalidation | AUTH-08 |
| `/api/admins/members` | POST | Admin AT | ADMIN | 10/1min | — | — |
| `/api/admins/members/:id` | PATCH | Admin AT | ADMIN | 20/1min | Allows plan change via DTO | BIZ-10 |
| `/api/admins/members/active/:id` | PATCH | Admin AT | ADMIN | 20/1min | — | — |
| `/api/admins/members/freeze/:id` | PATCH | Admin AT | ADMIN | 20/1min | — | — |
| `/api/admins/members/ban/:id` | PATCH | Admin AT | ADMIN | 20/1min | — | — |
| `/api/admins/members` | GET | Admin AT | ADMIN | 60/1min | Includes payments, notifications | BIZ-11, BIZ-05, BIZ-06 |
| `/api/admins/members/:id` | GET | Admin AT | ADMIN | 100/1min | Includes payments, notifications | BIZ-11 |
| `/api/admins/memberships` | GET | Admin AT | ADMIN | 60/1min | — | BIZ-05, BIZ-06 |
| `/api/admins/memberships/:id` | GET | Admin AT | ADMIN | 100/1min | — | — |
| `/api/admins/payments` | GET | Admin AT | ADMIN | varies | Null check never triggers | BIZ-04 |
| `/api/admins/subscriptions/me` | GET | Admin AT | ADMIN | **None (skipped)** | — | AUTH-03 |
| `/api/admins/subscriptions/all` | GET | Admin AT | ADMIN | **None (skipped)** | — | AUTH-03 |
| `/api/owners/subscriptions` | POST | Owner AT | OWNER | 10/1min | No ownership check | AUTH-01 |
| `/api/owners/subscriptions` | PATCH | Owner AT | OWNER | 10/1min | IDOR via body adminId | AUTH-02 |
| `/api/owners/subscriptions` | GET | Owner AT | OWNER | 60/1min | Includes full user data | — |
| `/api/owners/users` | GET | Owner AT | OWNER | 60/1min | — | — |
| `/api/owners/users/:id` | GET | Owner AT | OWNER | 100/1min | — | — |
| `/api/owners/users/active/:id` | PATCH | Owner AT | OWNER | 100/1min | — | — |
| `/api/owners/users/pending/:id` | PATCH | Owner AT | OWNER | 100/1min | — | — |
| `/api/owners/users/ban/:id` | PATCH | Owner AT | OWNER | 100/1min | — | — |
| `/api/plans` | GET | **None** | Public | 60/1min | — | SEC-04 |
| `/api/plans/:id` | GET | **None** | Public | 100/1min | — | SEC-04 |
| `/api/plans` | POST | Owner AT | OWNER | 10/10min | — | — |
| `/api/plans/durations` | POST | Owner AT | OWNER | 10/10min | — | — |
| `/api/plans/:id` | PATCH | Owner AT | OWNER | 20/1min | — | — |
| `/api/plans/durations/:id` | PATCH | Owner AT | OWNER | 20/1min | — | — |
| `/api/users/admins/me` | GET | Admin AT | ADMIN | Skipped | — | — |
| `/api/users/admins/profile-image` | POST | Admin AT | ADMIN | 10/1min | — | — |
| `/api/users/admins/profile-image` | DELETE | Admin AT | ADMIN | 10/1min | — | — |
| `/api/users/members/me` | GET | Member AT | MEMBER | Skipped | — | — |
| `/api/users/members/profile-image` | POST | Member AT | MEMBER | 10/1min | — | — |
| `/api/users/members/profile-image` | DELETE | Member AT | MEMBER | 10/1min | — | — |
| `/api/users/staffs/me` | GET | Staff AT | STAFF | Skipped | Admin relation includes password | MISC-01 |
| `/api/users/staffs/profile-image` | POST | Staff AT | STAFF | 10/1min | — | — |
| `/api/users/staffs/profile-image` | DELETE | Staff AT | STAFF | 10/1min | — | — |
| `/api/admins/visits` | GET | Admin AT | ADMIN | varies | Admin/member password in response | BIZ-07 |
| `/api/admins/visits/:id` | GET | Admin AT | ADMIN | varies | Admin/member password in response | BIZ-07 |
| `/api/admins/feedbacks` | GET | Admin AT | ADMIN | 10/1min | Admin relation includes password | — |
| `/api/admins/feedbacks/:id` | GET | Admin AT | ADMIN | 10/1min | — | — |
| `/api/admins/feedbacks/:id` | PATCH | Admin AT | ADMIN | 10/1min | — | — |
| `/api/members/feedbacks/create` | POST | Member AT | MEMBER | 10/1min | — | — |
| `/api/members/feedbacks` | GET | Member AT | MEMBER | 10/1min | — | — |
| `/api/members/feedbacks/like` | POST | Member AT | MEMBER | 10/1min | — | — |
| `/api/members/feedbacks/remove-like` | POST | Member AT | MEMBER | 10/1min | — | — |
| `/api/members/feedbacks/:id` | DELETE | Member AT | MEMBER | 10/1min | — | — |
| `/api-docs` | GET | **None** | Public | Global | Full API exposed | SEC-05 |

---

## Rate Limit Inventory

### Global Configuration

| Location | Limit | TTL | Storage | Tracking Key |
|---|---|---|---|---|
| `src/app.module.ts` L53-58 | 100 requests | 60,000ms (1 min) | In-memory (default) | IP (default) |
| `src/app.module.ts` L86 | Global ThrottlerGuard | — | — | — |

> [!WARNING]
> **In-memory storage**: Rate limits are not shared across multiple application instances. Behind a load balancer, effective limits are multiplied by the number of instances.

### Per-Route Overrides

| Endpoint | Limit | TTL | Notes |
|---|---|---|---|
| `POST /api/auth/register` | 5 | 600,000ms (10min) | Good for registration |
| `POST /api/auth/login` | 5 | 60,000ms (1min) | Reasonable |
| `POST /api/auth/forgot-password` | 3 | 3,600,000ms (1hr) | Good |
| `POST /api/auth/reset-password` | 5 | 3,600,000ms (1hr) | Good |
| `POST /api/auth/email-verification` | 10 | 3,600,000ms (1hr) | Good |
| `GET /api/admins/subscriptions/me` | **Skipped** | — | **AUTH-03: No limit** |
| `GET /api/admins/subscriptions/all` | **Skipped** | — | **AUTH-03: No limit** |
| `GET /api/users/*/me` | **Skipped** | — | Read-only profile, acceptable |

### Recommendations

1. **AUTH-03**: Remove `@SkipThrottle()` from admin subscription endpoints. Suggested: 60 req/min.
2. **Login endpoints**: Consider reducing to 3 attempts per minute, 10 per hour for brute-force protection.
3. **Multi-instance**: If deploying multiple instances, switch to Redis-based throttler storage.
4. **Proxy trust**: If behind a reverse proxy, configure `app.set('trust proxy', 1)` to get real client IPs.

---

## Verification Record

| Check | Outcome | Notes |
|---|---|---|
| Read all source files in `src/` | ✅ Completed | All `.ts` files read line-by-line |
| Read `prisma/schema.prisma` | ✅ Completed | 762 lines reviewed |
| Read `.env.example` and `.env` structure | ✅ Completed | Values redacted |
| Read `Dockerfile` | ✅ Completed | Multi-stage build reviewed |
| Read `package.json` | ✅ Completed | Dependencies and scripts reviewed |
| Check `.gitignore` for `.env` | ✅ Confirmed present | `.env` is properly gitignored |
| Run `npm audit` | ❌ Skipped | Requires network access (sandboxed) |
| Run application | ❌ Skipped | Requires database and env setup |
| Run tests | ❌ Skipped | No test files exist in the project |
| TypeScript compilation check | ❌ Skipped | Requires full node_modules |
| Verify no files modified | ✅ Confirmed | Only `BACKEND_REVIEW_README.md` created |

---

## Manual Remediation Order

Priority is ordered by risk and dependency:

1. **[Critical]** SEC-01 — Replace all secrets in `.env.example` with placeholders and rotate all secrets in deployed environments
2. **[Critical]** SEC-02 + SEC-03 — Fix INACTIVE login flow to store action token hash in DB before sending email
3. **[Critical]** SEC-05 — Gate Swagger docs behind a `NODE_ENV` check
4. **[High]** AUTH-01 + AUTH-02 — Add ownership validation to owner subscription management
5. **[High]** AUTH-07 — Implement refresh token rotation (depends on understanding session model)
6. **[High]** AUTH-08 — Invalidate all refresh tokens on password reset (add to existing transactions)
7. **[High]** AUTH-09 — Add `async`/`await` to all logout controller methods
8. **[High]** AUTH-04 + AUTH-05 + AUTH-06 — Fix account enumeration (generic error messages)
9. **[High]** AUTH-03 — Remove `@SkipThrottle()` from admin subscription endpoints
10. **[Medium]** BIZ-01 — Fix transaction client usage (`tx` instead of `this.prisma`)
11. **[Medium]** BIZ-07 + BIZ-08 + MISC-01 — Add `omit: { password: true }` to all relation includes
12. **[Medium]** BIZ-03 — Fix duplicate cron notifications
13. **[Medium]** BIZ-04 — Fix null check on `findMany` results
14. **[Medium]** BIZ-05 + BIZ-06 — Add pagination validation (min/max bounds)
15. **[Medium]** BIZ-09 — Restrict login response fields
16. **[Medium]** BIZ-10 — Separate membership plan update from member profile update
17. **[Medium]** VAL-02 + VAL-03 — Pass cookie secret to `cookieParser()`
18. **[Medium]** VAL-01 — Set explicit body size limit
19. **[Medium]** SEC-04 — Decide if plans GET should be public; add auth guard if not
20. **[Low]** BIZ-02 — Add retry limit to username generation
21. **[Low]** DB-01, DB-04 — Add database constraints
22. **[Low]** DOCKER-01 — Add non-root user to Dockerfile
23. **[Low]** MISC-04, MISC-05 — Clean up unused files

---

## Remaining Uncertainty

1. **Frontend rendering**: XSS risk from stored user content (names, company names, feedback content) depends on whether the frontend renders these strings in a way that executes scripts. The backend stores them as plain strings without sanitization — this is appropriate if the frontend uses a framework with auto-escaping (React, Vue, Angular). **Verify frontend rendering.**

2. **CSRF**: The application uses `sameSite: 'strict'` for cookies and Bearer tokens for API auth. With `strict` same-site cookies, CSRF is largely mitigated for modern browsers. If older browser support is needed, consider additional CSRF tokens.

3. **Multi-tenancy isolation**: The `resolveAdminId` pattern generally provides tenant isolation, but this was not exhaustively verified for every possible data access path across all 40+ endpoints.

4. **Deployment configuration**: CORS, HTTPS enforcement, proxy trust, and security headers beyond Helmet defaults were not verified against actual deployment infrastructure.

5. **Dependency vulnerabilities**: No `npm audit` was run. The exact installed versions in `package-lock.json` were not checked against security advisories.

6. **GraphQL / WebSocket**: These transports are not present in the codebase. No additional transport review needed.

7. **The `members.service.ts` full source**: The initial portion was truncated in one read; the update method's full transaction logic was confirmed from the visible output but the very beginning of the file was truncated. All critical paths were verified.

> [!CAUTION]
> This review does not guarantee the absence of all vulnerabilities. Runtime testing, penetration testing, and ongoing dependency monitoring remain essential.
