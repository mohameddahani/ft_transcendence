# mdahani — Project Management & Backend Contribution

*This project has been created as part of the 42 curriculum by mdahani, <other verified team logins>.*

> **Notice:** This document constitutes the individual contribution of **mdahani** (Project Manager & Backend Developer) for the `ft_transcendence` project. It documents individual technical responsibilities, architecture, implementation details, and evaluation mapping. It is designed to be reviewed by team members and merged into the final root `README.md`.
> 
> **Preview Note:** All file links and image paths in this document are formatted relative to the **repository root** for direct integration into the final root README. When previewing this Markdown file inside `docs/readme-contributions/`, the schema diagram is in the same directory (`./vibeschema-diagram.svg`). Prefix source directory links with `../../` to navigate to root source directories.

---

## Table of Contents

1. [Project Overview & Domain Description](#1-project-overview--domain-description)
2. [My Team Information](#2-my-team-information)
3. [Project Management](#3-project-management)
4. [Backend Architecture](#4-backend-architecture)
5. [Backend Technical Stack](#5-backend-technical-stack)
6. [Backend Features Implemented](#6-backend-features-implemented)
7. [Database Design and Implementation](#7-database-design-and-implementation)
8. [Authentication and Security](#8-authentication-and-security)
9. [Redis Caching, Performance & Background Jobs](#9-redis-caching-performance--background-jobs)
10. [API Documentation and Testing](#10-api-documentation-and-testing)
11. [Modules — 42 Evaluation](#11-modules--42-evaluation)
12. [Individual Backend Contributions — mdahani](#12-individual-backend-contributions--mdahani)
13. [Engineering Challenges and Solutions](#13-engineering-challenges-and-solutions)
14. [Backend Installation and Execution](#14-backend-installation-and-execution)
15. [Resources and AI Usage](#15-resources-and-ai-usage)
16. [Information to Confirm Before Final Merge](#16-information-to-confirm-before-final-merge)

---

## 1. Project Overview & Domain Description

`ft_transcendence` is an enterprise-grade **Sports Club Management Platform** designed to manage operations across diverse types of sports organizations (such as fitness clubs, martial arts dojos, racquet clubs, swimming centers, and athletic complexes).

The system enforces a strict four-tier role hierarchy that decouples SaaS platform administration from individual club operations:

```
+-----------------------------------------------------------------------------------+
|                                  PLATFORM OWNER                                   |
|   - Manages SaaS subscription tiers (Plan, PlanDuration)                          |
|   - Activates, alters, and monitors Club Administrator accounts & subscriptions   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                CLUB ADMINISTRATOR                                 |
|   - Owns organizational tenant data (Staff, Members, Working Hours, Policies)     |
|   - Configures club membership plans, visit limits, and pricing (fiat & Web3)     |
+-----------------------------------------------------------------------------------+
                     |                                           |
                     v                                           v
+------------------------------------------+   +------------------------------------+
|               CLUB STAFF                 |   |            CLUB MEMBER             |
| - Daily desk operations                  |   | - Self-service portal access       |
| - Member verification & onboarding       |   | - View active membership & status  |
| - Manual and QR code attendance check-in |   | - Schedule future facility visits  |
| - Feedback moderation & resolution notes |   | - Submit feedback & ratings        |
+------------------------------------------+   +------------------------------------+
```

### Domain Architecture Note
While some sample seed files, legacy commit messages, and helper notes occasionally use "gym" terminology colloquially, the database schema and application domain are architected generically around **Users**, **Staff**, **Members**, **Membership Plans**, **Visits**, and **Attendances**. 

Multi-tenancy is structured around the `adminId` attribute: each Club Administrator represents an independent sports organization, and all staff, members, operational hours, visits, and payments are partitioned under their administrative identifier.

---

## 2. My Team Information

| Attribute | Profile Details |
| :--- | :--- |
| **42 Login** | `mdahani` |
| **Assigned Roles** | **Project Manager (PM)** & **Backend Developer** |
| **Git Attribution** | Mohamed Dahani (`mohamed.dahani.dev@gmail.com`) — Author of **342 commits** across the repository (318 commits in `backend/`, representing ~97% of backend implementation). |
| **Primary Responsibilities** | Overall project coordination, meeting facilitation, task allocation, backend architecture design, NestJS API development, Prisma ORM modeling, PostgreSQL database management, multi-role authentication & RBAC, Redis caching, scheduled background jobs, and backend security controls. |

### Separation of Responsibilities

```
+---------------------------------------------------------------------------------------+
|                                    MOHAMED DAHANI                                     |
+-------------------------------------------+-------------------------------------------+
|       PROJECT MANAGEMENT (PM)             |            BACKEND DEVELOPER              |
| - Team organization & bi-weekly meetings  | - NestJS modular application architecture |
| - Blocker identification & technical help | - Prisma schema & PostgreSQL persistence  |
| - Task breakdown & assignment             | - Multi-role JWT auth & session rotation  |
| - GitHub branch & integration management  | - Redis cache-aside implementation        |
| - Communication via Discord & WhatsApp    | - Background jobs (@nestjs/schedule cron) |
| - Cross-stack alignment (Front/AI/DevOps) | - Security hardening, rate limits, Helmet |
+-------------------------------------------+-------------------------------------------+
```

---

## 3. Project Management

As Project Manager, I established and maintained the operational framework that guided our team throughout the development lifecycle of `ft_transcendence`.

### 1. Meeting Cadence & Agenda
- **Schedule:** Mandatory team synchronization meetings held every **Tuesday and Friday**.
- **Meeting Structure:**
  1. *Standup & Progress Review:* Each developer presented completed features and current status against assigned deliverables.
  2. *Blocker Identification:* Investigated technical roadblocks, runtime defects, dependency issues, or architectural friction.
  3. *Task Distribution:* Refined functional specifications into technical tasks and assigned them based on member specializations.
  4. *Prioritization & Milestones:* Re-aligned project velocity to meet 42 evaluation criteria and scheduled deadlines.

### 2. Task Allocation & Workflow
Tasks were partitioned into modular, decoupled units to enable parallel development across subsystems:
- **Backend Core:** Data modeling, authentication providers, domain services, and security middleware.
- **Frontend Applications:** Admin/Staff management portal and Owner platform built on Next.js.
- **AI Microservice:** Python/FastAPI service for sentiment analysis and RAG document assistance.
- **Blockchain Subsystem:** Solidity smart contracts, ERC-20 token handling, and Web3 relayer.
- **DevOps Infrastructure:** Multi-container orchestration, Nginx reverse proxy, SSL termination, and Prometheus/Grafana monitoring.

The development lifecycle followed a disciplined progression:
$$\text{Requirements Formulation} \longrightarrow \text{Branch Implementation} \longrightarrow \text{Cross-Component Review} \longrightarrow \text{Integration Testing}$$

### 3. Project Management Tools & Repositories
- **GitHub Exclusively:** Utilized for repository hosting, feature branching, pull request reviews, and issue tracking.
- **Branching Model:** Isolated component branches (`backend`, `frontend`, `frontend-ael-jama`, `ai-v1`, `ai-work`, `block-chain`, `devops`, `development`, `main`). Feature branches were validated against the shared `development` branch before staging for `main`.

### 4. Communication Channels
- **Discord:** Primary synchronous collaboration platform. Used for bi-weekly voice meetings, screen-sharing debugging sessions, and architecture syncs.
- **WhatsApp:** Asynchronous messaging for urgent operational alerts, availability notices, and meeting reminders.

### 5. Technical Assistance & Blocker Resolution
I provided continuous technical mentorship and hands-on debugging support across all project boundaries:
- **Frontend Integration:** Assisted frontend developers with Axios interceptors, CORS preflight troubleshooting, cookie extraction (`HttpOnly`), and JWT token refresh synchronization.
- **DevOps Alignment:** Coordinated with DevOps to configure healthcheck endpoints (`/api/health`), align environment variables across compose files, configure Docker network DNS aliases (`postgres`, `redis`, `backend`), and ensure entrypoint migration reliability.
- **AI Service Harmonization:** Guided the AI developer regarding PostgreSQL read-only database roles and documented the sentiment analysis contract.

---

## 4. Backend Architecture

The backend is built with the **NestJS** framework (v11) leveraging the Express platform. It adheres to strict modular design principles, encapsulation, and dependency injection.

```
                      +---------------------------------------+
                      |         Incoming HTTP Request         |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |      Helmet & Cookie-Parser           |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Global ThrottlerGuard           |
                      |   (Rate Limiting: 100 req / 60s)      |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |     Passport JWT & Role Guards        |
                      |  (@Roles() & AuthRolesGuard check)    |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |   Global ValidationPipe (DTO check)   |
                      | (whitelist, forbidNonWhitelisted)     |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |          NestJS Controller            |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       AccessesService Check           |
                      | (Account Status, Sub, Membership)     |
                      +---------------------------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |            Domain Service             |
                      +---------------------------------------+
                             /            |            \
                            /             |             \
                           v              v              v
               +---------------+  +---------------+  +-------------------+
               |  Redis Cache  |  | PrismaService |  | External Services |
               | (Keyv Store)  |  | (PostgreSQL)  |  | Cloudinary/Resend |
               +---------------+  +---------------+  +-------------------+
```

### Module Structure

The application source code under `backend/src/` is structured into clearly delineated architectural layers:

```
backend/src/
├── app.module.ts                   # Root application module orchestrating all domain modules
├── main.ts                         # Application bootstrap: pipes, security headers, CORS, Swagger
├── core/                           # Cross-cutting concerns & domain primitives
│   ├── access/                     # AccessesService: unified multi-tenant RBAC validation
│   ├── constants/                  # System constants (avatars, visit expiration windows)
│   ├── decorators/                 # Custom decorators (@Roles, @GetAccessTokenPayload, @GetCookies)
│   ├── dtos/                       # Shared DTOs (PaginationDto)
│   ├── enums/                      # Token types and internal enums
│   ├── guards/                     # AuthRolesGuard (metadata-driven RBAC)
│   ├── types/                      # JWT payloads, safe selection types, custom interfaces
│   └── utils/                      # Username generation, action token crypto, password strength
├── infrastructure/                 # External service & I/O adapters
│   ├── cloudinary/                 # Cloudinary image upload/delete stream wrapper
│   ├── database/                   # PrismaService extending PrismaClient with pg adapter
│   ├── email/                      # Resend transactional email provider & HTML templates
│   ├── external-api/               # Axios HTTP client for sentiment analysis microservice
│   └── redis/                      # Global CacheModule registration with Keyv Redis store
├── jobs/                           # Background schedulers (@nestjs/schedule cron jobs)
│   ├── membership.cron.ts          # Hourly membership expiration
│   ├── membership-notification.cron.ts # Hourly member payment reminder notifications
│   ├── payment.cron.ts             # Noon DUE_SOON updates & Midnight UNPAID updates
│   ├── sentiment.cron.ts           # Midnight retry for missing feedback sentiment
│   ├── subscription.cron.ts        # Hourly platform subscription expiration
│   ├── subscription-notification.cron.ts # Hourly admin subscription expiry alerts
│   └── visit.cron.ts               # Every-30-minute visit expiration
└── modules/                        # Encapsulated feature domains
    ├── attendances/                # Manual and QR code check-in & attendance logs
    ├── auth/                       # Multi-role authentication, refresh rotation, passwords
    ├── feedbacks/                  # Member ratings, feedback feed, likes & sentiment integration
    ├── health/                     # HTTP liveness probe (/api/health)
    ├── members/                    # Member onboarding, account state, directory
    ├── membership-plans/           # Membership plans, durations, weekly visit limits, token pricing
    ├── memberships/                # Membership records & lifecycle management
    ├── notifications/              # In-app notifications for Admins and Members
    ├── payments/                   # Financial payment records & status tracking
    ├── platform/                   # Platform SaaS management (Owners, Plans, Subscriptions)
    ├── profiles/                   # Multi-role profile update & Cloudinary avatar uploads
    ├── staffs/                     # Staff creation, credential invites, directory
    ├── visits/                     # Visit reservation, calendar scheduling, QR pass generation
    └── working-hours/              # Weekly business hours & special closure date ranges
```

### Integration with Subsystems
1. **Next.js Portals (`admin-staff-platform` & `owner-platform`):** Consume REST endpoints using Axios. Authenticate via Bearer tokens in headers and rotated refresh tokens in `HttpOnly` cookies.
2. **AI Microservice (`AI/`):** Python FastAPI service. The backend sends member feedback text for sentiment classification and triggers midnight batch retries. The AI service also accesses PostgreSQL directly using a dedicated read-only role (`ai_readonly`).
3. **Blockchain Subsystem (`block-chain/`):** Smart contracts handle ERC-20 gym tokenomics. The backend stores wallet addresses on User and Member models and records token prices (`priceByG`) on membership durations.
4. **DevOps Stack (`devops/`):** Automated containerization via Docker Compose, routed through an Nginx reverse proxy with SSL termination and monitored via Prometheus, Alertmanager, and Grafana.

---

## 5. Backend Technical Stack

All packages and runtime dependencies have been verified directly from `backend/package.json` and `backend/package-lock.json`:

| Technology | Installed Version | Purpose in Backend | Technical Justification & Tradeoffs |
| :--- | :--- | :--- | :--- |
| **NestJS Core** | `11.1.19` (`^11.0.1`) | Application framework, Dependency Injection, routing | Provides an enterprise architectural standard, modular dependency injection, native TypeScript support, and built-in lifecycle management. |
| **TypeScript** | `5.9.3` (`^5.7.3`) | Primary programming language | Enforces compile-time type safety across DTOs, database models, and service interfaces, significantly reducing runtime reference errors. |
| **Node.js** | `>=20.0.0` (Docker `20-alpine`) | Server execution runtime | High-throughput asynchronous event-driven I/O engine suitable for non-blocking API endpoints and concurrent database operations. |
| **Prisma ORM** | `7.8.0` / CLI `7.9.1` | Database client, schema modeling, migrations | Type-safe query builder with automated migration tracking and generated TypeScript types aligned directly with the database schema. |
| **PostgreSQL** | `16-alpine` (`pg` `8.20.0`) | Primary relational database persistence | ACID-compliant relational database ensuring integrity across multi-table transactions (e.g. member onboarding with membership and payment). |
| **Redis** | `7-alpine` | In-memory cache store | Drastically reduces relational database load for high-frequency reads (SaaS plans, club operating hours) with millisecond latency. |
| **Cache Manager / Keyv** | `@nestjs/cache-manager` `12.0.0`, `@keyv/redis` `5.1.6` | Unified caching interface & Redis store | Decouples application caching logic from Redis client specifics; provides standardized TTL management and async factory registration. |
| **Passport & JWT** | `passport` `0.7.0`, `passport-jwt` `4.0.1`, `@nestjs/jwt` `11.0.2` | Authentication & token verification | Industry-standard authentication middleware. Separates role-specific token extraction from controller business logic. |
| **bcryptjs** | `3.0.3` | One-way cryptographic password hashing | Implements salted bcrypt hashing with cost factor 10, protecting stored passwords and refresh tokens against brute-force attacks. |
| **Node.js Crypto** | Native runtime module | Cryptographic token generation & hashing | Generates 32-byte cryptographically secure random tokens (`randomBytes`) and computes SHA-256 digests for action tokens and QR passes. |
| **Class Validator & Transformer** | `class-validator` `0.15.1`, `class-transformer` `0.5.1` | DTO validation and input transformation | Automatically rejects unauthorized or malformed payload fields before execution reaches controllers via declarative decorators. |
| **Password Validator** | `5.3.0` | Strict password complexity enforcement | Enforces comprehensive password requirements (min 8, max 64, uppercase, lowercase, digits, symbols, no whitespace) via custom constraint. |
| **Helmet** | `8.1.0` | HTTP security response headers | Automatically sets essential defensive HTTP headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.). |
| **NestJS Throttler** | `6.5.0` | Rate limiting & brute-force mitigation | Restricts request frequencies globally (100 req/60s) and applies strict limits to sensitive auth endpoints (login, registration, reset). |
| **Cookie Parser** | `1.4.7` | HTTP cookie extraction middleware | Parses incoming cookie headers, enabling secure handling of `HttpOnly` refresh tokens segregated from browser-accessible storage. |
| **NestJS Schedule** | `6.1.3` | Scheduled background task execution | Native cron job decorator (`@Cron`) enabling automated periodic jobs (status expirations, payment checks, midnight AI retries). |
| **date-fns** | `4.4.0` | Immutable date/time manipulation | Lightweight, modular date utility library used for expiration math, weekday resolution (`getISODay`), and calendar boundary calculations. |
| **NestJS Swagger** | `11.4.6` (`^11.4.2`) | Dynamic OpenAPI / Swagger specification | Auto-generates interactive API documentation and testing UI at `/api-docs` directly from NestJS decorators and DTO schemas. |
| **Cloudinary SDK** | `2.10.0` | Cloud-based media storage & optimization | Offloads avatar file storage and image transformation from the application server, avoiding local filesystem state in container clusters. |
| **file-type** | `22.1.1` | Magic-byte binary file inspection | Inspects the actual binary stream buffer of uploaded files to verify real MIME types, preventing extension spoofing attacks. |
| **Resend** | `6.12.3` | Transactional email delivery service | Cloud email API used to reliably transmit account activation links, password resets, and initial credential setup emails. |
| **Axios** | `1.20.0` | External HTTP client | Facilitates outbound communication with the AI sentiment analysis microservice with configured request timeouts and error handling. |
| **ua-parser-js** | `2.0.10` | Client device & browser telemetry | Parses User-Agent headers during authentication to store device, browser, and OS metadata alongside persistent refresh token records. |
| **Docker & Compose** | Docker Compose v2 | Containerization & orchestration | Standardizes multi-service dependencies (Postgres, Redis, Backend, Frontend, AI, Nginx) into reproducible virtual networks. |
| **Jest & Supertest** | `jest` `30.0.0`, `supertest` `7.0.0` | Test runner & HTTP assertion framework | Standard test harness configured for unit and end-to-end testing suites. |

---

## 6. Backend Features Implemented

The following inventory details all backend features verified in the codebase.

```
+--------------------------------------------------------------------------------------------------+
|                                    VERIFIED BACKEND FEATURES                                     |
+------------------------------------+------------------------------------+------------------------+
| Feature Category                   | Key Functionality                  | Architectural Location |
+------------------------------------+------------------------------------+------------------------+
| 1. Authentication & Session        | 4-Role Login, Token Rotation, DTOs | modules/auth           |
| 2. Multi-Tenant Access Control     | AccessesService, RolesGuard, RBAC  | core/access, guards    |
| 3. Platform SaaS Administration    | SaaS Plans, Durations, Quotas      | modules/platform       |
| 4. Club Operations & Staff         | Staff Provisioning, Status Toggles | modules/staffs         |
| 5. Member Onboarding & Memberships | Interactive Transaction Onboarding | modules/members        |
| 6. Scheduling, Visits & Attendance | QR Window Check-In, Special Hours  | attendances, visits    |
| 7. Finance, Feedback & Media       | Ledger, AI Sentiment, Cloudinary   | payments, feedbacks    |
+------------------------------------+------------------------------------+------------------------+
```

### Feature Implementation Matrix

| # | Feature Name | Functional Description | Implementation Mechanism | Technologies Involved | Source Files & Modules | Contributor & Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Administrator Registration** | Onboards new club administrators with duplicate email/phone checks, terms verification, and unique username generation. | Validates DTO, hashes password via bcrypt, generates unique slug username iteratively, creates `User` in PostgreSQL, issues 32-byte action token, and sends activation email. | NestJS, Prisma, bcryptjs, Resend | `modules/auth/auth.provider.ts`, `modules/auth/auth.controller.ts` | **mdahani** (Verified) |
| **2** | **Multi-Role Authentication** | Provides segregated authentication for 4 distinct roles: Platform Owner, Administrator, Staff, and Member. | Owner/Admin login via email; Staff/Member login via username. Validates status via `assertUserAccountActive`/`assertMemberAccountActive`, signs access & refresh JWTs with role-specific secrets. | NestJS, Passport, JWT, bcryptjs | `modules/auth/auth.provider.ts`, `modules/auth/jwt/` | **mdahani** (Verified) |
| **3** | **Refresh Token Rotation & Revocation** | Issues new token pairs while persisting session state and revoking previously used tokens to prevent replay attacks. | Generates UUID `jti`, hashes token via SHA-256, stores in role-specific refresh table with IP, User-Agent, and device metadata via `ua-parser-js`. Revokes prior token during replacement. | Prisma Transactions, Crypto, ua-parser-js | `modules/auth/auth.provider.ts`, `modules/auth/strategies/` | **mdahani** (Verified) |
| **4** | **Action Tokens & Email Workflows** | Powers email verification, forgotten password recovery, and staff/member initial password configuration. | Generates 32-byte random hex token, stores SHA-256 hash in database with expiration timestamp, dispatches HTML emails via Resend. Consumes token inside atomic transaction. | Node Crypto, Prisma, Resend | `core/utils/generate-action-token.ts`, `infrastructure/email/` | **mdahani** (Verified) |
| **5** | **Multi-Tenant Role Authorization** | Restricts endpoint access using metadata-driven RBAC combined with fine-grained multi-tenant domain checks. | `@Roles()` decorator defines allowed roles; `AuthRolesGuard` verifies token payload. `AccessesService` dynamically resolves `adminId` from staff identity and verifies active subscription. | NestJS Reflector, Guards, Prisma | `core/guards/roles.guard.ts`, `core/access/access.service.ts` | **mdahani** (Verified) |
| **6** | **Platform Owner SaaS Administration** | Enables platform owners to manage commercial SaaS plans and view registered club administrators. | Exposes endpoints to create/update `Plan` records, configure plan durations with pricing, toggle plan availability, and inspect tenant administrator profiles. | NestJS, Prisma, Redis Caching | `modules/platform/owners/`, `modules/platform/plans/` | **mdahani** (Verified) |
| **7** | **Club Subscription Lifecycle** | Manages administrator subscriptions to SaaS plans, enforcing member capacity rules. | Validates admin status, verifies plan active state, prevents plan downgrade if current member count exceeds target plan `maxMembers`, records transaction history. | Prisma Transactions, date-fns | `modules/platform/subscriptions/` | **mdahani** (Verified) |
| **8** | **Staff Administration** | Allows club administrators to provision staff accounts, manage operational statuses, and resend setup links. | Creates `Staff` profile tied to `adminId`, auto-generates unique staff username, issues setup action token, dispatches welcome email, supports status toggling (`ACTIVE`, `PENDING`, `BANNED`). | Prisma, Resend, Class Validator | `modules/staffs/staffs.service.ts`, `modules/staffs/staffs.controller.ts` | **mdahani** (Verified) |
| **9** | **Member Onboarding** | Atomic onboarding of new club members, creating member profile, initial membership, and payment in one step. | Executes Prisma interactive transaction (`$transaction`): creates `Member`, instantiates `Membership` linked to plan/duration, creates initial `PAID` `Payment` record, sends password setup email. | Prisma Interactive Transactions, Resend | `modules/members/members.service.ts`, `modules/members/admin-members.controller.ts` | **mdahani** (Verified) |
| **10** | **Membership Plans & Durations** | Club administrators define custom membership tiers, weekly visit limits, fiat pricing, and Web3 token pricing. | CRUD operations on `MembershipPlan` and `MembershipPlanDuration`. Supports integer `weeklyVisitLimit`, decimal fiat price, and `priceByG` token price. | Prisma, Class Validator | `modules/membership-plans/` | **mdahani** (Verified) |
| **11** | **Membership Tracking & History** | Tracks membership statuses over time with full historical auditability. | Maintains active, expired, and cancelled membership states. Provides admin/staff club-wide views and member self-service views. | Prisma, date-fns | `modules/memberships/memberships.service.ts` | **mdahani** (Verified) |
| **12** | **Payment Ledger Management** | Financial accounting for member dues, subscription payments, and payment statuses. | Records amounts, due dates, paid timestamps, and status (`PAID`, `DUE_SOON`, `UNPAID`). Scheduled cron automatically transitions statuses based on due dates. | Prisma, Nest Schedule | `modules/payments/payments.service.ts`, `jobs/payment.cron.ts` | **mdahani** (Verified) |
| **13** | **Working Hours & Special Closures** | Configures recurring weekly operating hours and special holiday or emergency closure intervals. | Validates ISO weekday (1-7), validates start/end time chronological ordering (`HH:mm`), checks for overlapping special dates, caches reads in Redis. | Prisma, Redis, date-fns | `modules/working-hours/working-hours.service.ts` | **mdahani** (Verified) |
| **14** | **Visit Scheduling & QR Generation** | Members schedule future facility visits; backend generates unique cryptographic QR passes. | Validates future timestamp, checks club operating hours and special closure windows, verifies weekly visit quota, generates 32-byte QR pass hash with 30-minute validity. | Node Crypto, date-fns, Prisma | `modules/visits/visits.service.ts`, `modules/visits/member-visits.controller.ts` | **mdahani** (Verified) |
| **15** | **Attendance Verification (Manual & QR)** | Verifies and checks in member attendance via QR code scan or manual staff desk entry. | Validates membership, verifies single daily check-in, checks weekly visit limits, validates 10-minute early arrival window and expiration boundary, creates attendance record. | Prisma Transactions, SHA-256, date-fns | `modules/attendances/attendances.service.ts` | **mdahani** (Verified) |
| **16** | **In-App Notifications & Reminders** | Dispatches system notifications and automated reminders to administrators and members. | Cron jobs query upcoming payment due dates and subscription expirations; atomicity ensured by setting `expirationNotifiedAt` to prevent duplicate alerts. | Prisma, Nest Schedule | `modules/notifications/`, `jobs/*notification.cron.ts` | **mdahani** (Verified) |
| **17** | **Feedback, Ratings & Community Likes** | Members review club experience with 1-5 star ratings; community members can like/unlike feedback. | Validates rating bounds (1-5), persists feedback, manages `FeedbackLike` join table with unique compound key `(feedbackId, memberId)`, allows staff moderation notes. | Prisma, DTO Validation | `modules/feedbacks/feedbacks.service.ts` | **mdahani** (Verified) |
| **18** | **AI Sentiment Analysis Integration** | Asynchronously analyzes member feedback sentiment (POSITIVE, NEUTRAL, NEGATIVE) with resilient fallback. | Calls external FastAPI sentiment endpoint via Axios with 5-second timeout. If unavailable, stores feedback with null sentiment; midnight cron retries unclassified records. | Axios, Nest Schedule, FastAPI | `infrastructure/external-api/`, `jobs/sentiment.cron.ts` | **mdahani** (Backend client) |
| **19** | **Profile & Avatar Management** | Multi-role self-profile updates with avatar image uploads streamed directly to Cloudinary. | Memory storage Multer uploads buffer directly to Cloudinary upload stream; verifies magic bytes via `file-type`; restores default avatars upon deletion. | Cloudinary SDK, Multer, file-type | `modules/profiles/`, `infrastructure/cloudinary/` | **mdahani** (Verified) |
| **20** | **Blockchain Wallet Integration** | Persists and exposes Ethereum wallet addresses for administrators and members. | Validates Ethereum hex address format, stores `walletAddress` in database, returns admin wallet address during member authentication to support Web3 token payments. | Prisma, Class Validator | `modules/auth/`, `modules/profiles/`, `prisma/schema.prisma` | **mdahani** (Backend fields) |
| **21** | **Redis Cache-Aside & Query Pagination** | High-performance caching for SaaS plans and business hours; standardized offset pagination. | Intercepts reads to check Redis Keyv store (TTL 300s); populates cache on miss; invalidates keys on mutation. List queries enforce `skip`/`take` pagination. | Redis, Keyv, Prisma | `infrastructure/redis/`, `core/dtos/pagination.dto.ts` | **mdahani** (Verified) |
| **22** | **API Documentation & Health Probes** | Interactive Swagger OpenAPI documentation and container liveness probes. | Swagger module compiles OpenAPI spec dynamically at `/api-docs` when `NODE_ENV=development`. Health controller returns `{ status: "ok" }` at `/api/health`. | Nest Swagger, Express | `main.ts`, `modules/health/health.controller.ts` | **mdahani** (Verified) |

---

### Implemented Mechanisms with Unresolved Limitations

Maintaining technical honesty is a cornerstone of professional engineering documentation. Source code inspection reveals several edge-case limitations that evaluators should note:

1. **Account Verification Flag:** In `modules/auth/auth.provider.ts`, `activateAccount()` updates `accountStatus` to `ACTIVE` but omits setting `isAccountVerified: true`. Since `loginUser()` requires `isAccountVerified === true`, fresh registrations require manual database intervention unless the verification flag is explicitly set.
2. **Action Token Type Enforcement:** While action tokens verify the token hash and `usedAt`/`expiresAt` timestamps, consumption methods do not consistently validate that `actionType` matches the specific route (e.g. ensuring an email verification token cannot be consumed at a password reset endpoint).
3. **Mutation Response Payloads:** Read queries use strict `satisfies Prisma.*Select` objects to omit passwords and sensitive hashes. However, several mutation endpoints return raw Prisma update results that may include hashed password fields in the response body.
4. **Cross-Tenant Plan Duration Lookup:** In `membership-plans.service.ts`, `addMembershipPlanDuration()` checks that the caller is an active administrator, but looks up the target plan by ID without verifying `adminId === callerAdminId`.
5. **Interactive Transaction Boundary in Membership Replacement:** In `members.service.ts` (`update()`), an interactive transaction expires the old membership with `tx.membership.update()`, but creates the replacement membership using `this.prisma.membership.create()` on the outer client rather than `tx`.
6. **Attendance Weekly Boundary Check:** In `attendances.service.ts`, check-in counts all visits in the current week (including the visit being checked in) and rejects if `visitCount >= weeklyVisitLimit`. If a member has a limit of 3 and schedules 3 visits, checking in on the 3rd visit encounters `visitCount === 3`, causing a false-positive rejection.
7. **Redis Invalidation Granularity:** Mutation operations delete base cache keys (`platform:plans`, `admin:<id>:working-hours`) but do not flush parameterized pagination keys (`platform:plans:page:1:limit:10`), leaving paginated lists stale until the 5-minute TTL expires. Detail keys also omit the record ID from the cache key string.
8. **AI Service API Contract Divergence:** The backend sentiment client in `external-api.service.ts` sends `{ content }` and expects `{ sentiment, sentimentScore }` without auth headers. The checked-in Python service in `AI/app/main.py` expects `{ text }`, returns `{ sentiment, score }`, and requires an `X-API-Key` header. Fallback and midnight retry logic function as intended, but real-time classification fails until the payload contract is aligned.

---

## 7. Database Design and Implementation

The database persistence layer is implemented with **PostgreSQL 16** managed through **Prisma ORM**.

### Architectural Justification for PostgreSQL
PostgreSQL was chosen for its strict ACID transaction guarantees, robust foreign key relational integrity, support for fixed-precision financial types (`Decimal(10,2)`), and high performance under complex multi-table joins.

### Database Schema Visualization

The schema structure is fully documented in the repository vector diagram:

![Database Schema](./vibeschema-diagram.svg)

> **Merge Note:** In this contribution file, the image link `./vibeschema-diagram.svg` allows the diagram to render directly in your editor and GitHub preview because both files are in the same folder. When merging into the final root `README.md`, update this link to `docs/readme-contributions/vibeschema-diagram.svg`.

```
                                  [ User (Owner / Admin) ]
                                      |              |
                    +-----------------+              +-----------------+
                    | 1:N                            | 1:N             | 1:N
                    v                                v                 v
             [ Subscription ]                 [ Staff ]        [ WorkingHour / SpecialHour ]
                    | 1:1                            | 1:N
                    v                                v
            [ Plan / Duration ]               [ Member ] <====================+
                                                     |                        |
                    +--------------------------------+-----------------+      |
                    | 1:N                            | 1:N             | 1:N  |
                    v                                v                 v      |
             [ Membership ]                     [ Payment ]       [ Feedback ]|
                    | 1:1                                              |      |
                    v                                                  | 1:N  |
       [ MembershipPlan / Duration ]                                   v      |
                    |                                           [ FeedbackLike ]
                    v 1:N
                 [ Visit ]
                    | 1:1
                    v
              [ Attendance ]
```

### Core Database Entities (25 Models)

All 25 models utilize UUID primary keys (`String @id @default(uuid())`) and snake_case column mappings:

| Category | Model Name | Table Name | Key Fields & Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Identities** | `User` | `users` | `id`, `email` (UQ), `userName` (UQ), `phoneNumber` (UQ), `role`, `accountStatus`, `walletAddress` | Platform owners and club administrators. |
| | `Staff` | `staffs` | `id`, `adminId` (FK), `email` (UQ), `userName` (UQ), `phoneNumber` (UQ), `accountStatus` | Staff personnel bound to a specific club administrator. |
| | `Member` | `members` | `id`, `adminId` (FK), `staffId` (FK, nullable), `userName` (UQ), compound UQ `(adminId, email)` | Sports club members under an administrator. |
| **SaaS Platform** | `Plan` | `plans` | `id`, `name` (UQ), `maxMembers`, `isActive` | Commercial SaaS subscription tiers for club owners. |
| | `PlanDuration` | `plan_durations` | `id`, `planId` (FK), `durationDays`, `price` (Decimal 10,2) | Billing durations (e.g. 30 days, 365 days) for SaaS plans. |
| | `Subscription` | `subscriptions` | `id`, `userId` (FK), `planId` (FK), `planDurationId` (FK), `subscriptionStatus`, `expiresAt` | Active and historical SaaS subscriptions of club admins. |
| **Club Offerings** | `MembershipPlan` | `membership_plans` | `id`, `adminId` (FK), `title`, `weeklyVisitLimit`, `isActive` | Club-specific membership offerings created by admins. |
| | `MembershipPlanDuration` | `membership_plan_durations` | `id`, `membershipPlanId` (FK), `durationDays`, `price` (Decimal 10,2), `priceByG` (Int) | Membership durations with fiat price and Web3 token price. |
| | `Membership` | `memberships` | `id`, `adminId` (FK), `memberId` (FK), `membershipPlanId` (FK), `membershipStatus`, `expiresAt` | Member membership instances linking members to plans. |
| **Operations** | `WorkingHour` | `working_hours` | `id`, `adminId` (FK), `dayOfWeek` (1-7), `startTime`, `endTime`, `isClosed`, UQ `(adminId, dayOfWeek)` | Weekly recurring operating schedule per club. |
| | `SpecialHour` | `special_hours` | `id`, `adminId` (FK), `startDate`, `endDate`, `startTime`, `endTime` | Date ranges for holiday or emergency closures. |
| | `Visit` | `visits` | `id`, `adminId` (FK), `memberId` (FK), `membershipId` (FK), `visitDateAndTime`, `qrTokenHash` (UQ), `visitStatus` | Scheduled future visits with cryptographic QR hashes. |
| | `Attendance` | `attendances` | `id`, `visitId` (UQ, FK), `adminId` (FK), `memberId` (FK), `staffId` (FK, nullable), `attendanceMethod`, `checkedInAt` | Verified attendance logs (1-to-1 with Visit). |
| **Finance & Reviews** | `Payment` | `payments` | `id`, `adminId` (FK), `memberId` (FK), `amount` (Decimal 10,2), `paymentStatus`, `dueDate`, `paidAt` | Member payment ledger tracking dues and settlements. |
| | `Feedback` | `feedbacks` | `id`, `adminId` (FK), `memberId` (FK), `content`, `rating` (1-5), `sentiment`, `sentimentScore`, `status` | Member reviews with ratings and AI sentiment results. |
| | `FeedbackLike` | `feedback_likes` | `id`, `feedbackId` (FK), `memberId` (FK), compound UQ `(feedbackId, memberId)` | Join table for member feedback upvotes/likes. |
| **Notifications** | `AdminNotification` | `admin_notifications` | `id`, `userId` (FK), `type`, `title`, `message`, `isRead` | System alerts for club administrators. |
| | `StaffNotification` | `staff_notifications` | `id`, `staffId` (FK), `type`, `title`, `message`, `isRead` | Schema model for staff alerts. |
| | `MemberNotification` | `member_notifications` | `id`, `memberId` (FK), `type`, `title`, `message`, `isRead` | Payment and expiration reminders for club members. |
| **Security Tokens** | `UserRefreshToken` | `user_refresh_tokens` | `id`, `userId` (FK), `tokenHash` (UQ), `jti` (UQ), `revokedAt`, `expiresAt`, `ipAddress`, `userAgent` | Persistent refresh token sessions for Admins/Owners. |
| | `StaffRefreshToken` | `staff_refresh_tokens` | `id`, `staffId` (FK), `tokenHash` (UQ), `jti` (UQ), `revokedAt`, `expiresAt`, `ipAddress`, `userAgent` | Persistent refresh token sessions for Staff. |
| | `MemberRefreshToken` | `member_refresh_tokens` | `id`, `memberId` (FK), `tokenHash` (UQ), `jti` (UQ), `revokedAt`, `expiresAt`, `ipAddress`, `userAgent` | Persistent refresh token sessions for Members. |
| | `UserActionToken` | `user_action_tokens` | `id`, `userId` (FK), `tokenHash` (UQ), `actionType`, `expiresAt`, `usedAt` | Single-use email verification and password reset tokens. |
| | `StaffActionToken` | `staff_action_tokens` | `id`, `staffId` (FK), `tokenHash` (UQ), `actionType`, `expiresAt`, `usedAt` | Single-use credential setup tokens for Staff. |
| | `MemberActionToken` | `member_action_tokens` | `id`, `memberId` (FK), `tokenHash` (UQ), `actionType`, `expiresAt`, `usedAt` | Single-use credential setup tokens for Members. |

### Relational Integrity & Constraints
- **One-to-One:** `Attendance` maintains `@unique` on `visitId`. A scheduled visit produces at most one attendance log.
- **Compound Uniques:**
  - `Member`: `@@unique([adminId, email])` allows a member email to exist across different clubs, but enforces uniqueness within an individual club.
  - `WorkingHour`: `@@unique([adminId, dayOfWeek])` ensures each club has exactly one schedule per weekday.
  - `FeedbackLike`: `@@unique([feedbackId, memberId])` prevents duplicate likes from the same member.
- **Migration History:** Managed via 56 sequential migration scripts located in `backend/prisma/migrations/`, spanning initial schema definition (`20260701135407_int`) through feature updates to beta release (`20261015184235_beta_1_8`).

---

## 8. Authentication and Security

Security is integrated across all levels of the backend stack rather than applied as an afterthought.

```
+---------------------------------------------------------------------------------------+
|                                  SECURITY PIPELINE                                    |
+---------------------------------------------------------------------------------------+
| 1. HTTP Layer       | Helmet headers, CORS origin whitelist, CookieParser            |
| 2. Rate Limiting    | ThrottlerGuard (Global 100/min; Login 5/min; Register 5/10min)  |
| 3. Transport Auth   | HttpOnly Strict Cookies for Refresh, Bearer Header for Access   |
| 4. JWT Verification | 8 Segregated Secrets (Role x Token Type), Passport Strategies    |
| 5. RBAC Gate        | AuthRolesGuard + Reflector metadata matching                    |
| 6. Domain Gate      | AccessesService (Subscription validity, Member freeze checks)   |
| 7. Input Sanitation | ValidationPipe (whitelist: true, forbidNonWhitelisted: true)    |
| 8. Media Guard      | Memory buffer inspection via file-type magic bytes (PNG/JPG/WEBP)|
+---------------------------------------------------------------------------------------+
```

### Threat Mitigation Matrix

| Security Mechanism | Technical Implementation | Threat Mitigated |
| :--- | :--- | :--- |
| **Password Hashing** | Salted bcrypt hashing with cost factor 10 (`bcrypt.hash(password, 10)`). | Prevents exposure of plaintext passwords in the event of database exfiltration. |
| **Password Policy** | Custom constraint validating length (8-64), character sets (uppercase, lowercase, numbers, symbols), and prohibiting whitespace. | Protects against credential stuffing and weak dictionary password attacks. |
| **Segregated JWT Secrets** | 8 distinct environment secrets: `JWT_<ROLE>_ACCESS_SECRET` and `JWT_<ROLE>_REFRESH_SECRET` across `OWNER`, `ADMIN`, `STAFF`, `MEMBER`. | Eliminates role elevation attacks where a token from a lower privilege tier is forged or presented to higher privilege endpoints. |
| **Refresh Token Rotation** | Every refresh request revokes the presented refresh token and issues an atomic replacement pair with fresh UUID `jti`. | Limits window of opportunity for stolen refresh tokens; detects token replay attempts. |
| **Persistent Token Tracking** | SHA-256 hashes of refresh tokens stored in PostgreSQL with IP, User-Agent, and device metadata. | Enables administrative session audits and immediate server-side session revocation. |
| **Cryptographic Action Tokens** | Generated via `crypto.randomBytes(32).toString('hex')`; only the SHA-256 digest is stored in the database. | Prevents timing attacks and ensures database read access cannot compromise unused tokens. |
| **Cookie Hardening** | Refresh cookies set with `HttpOnly: true`, `SameSite: 'strict'`, `Path: '/api/auth'`, and `Secure: true` in production. | Shields refresh tokens from client-side JavaScript access, mitigating Cross-Site Scripting (XSS) token theft. |
| **CORS Policy** | Explicit origin bound to `process.env.FRONTEND_URL`, credentials enabled, strict method and header whitelisting, 24h preflight cache. | Prevents unauthorized cross-origin requests from malicious domains. |
| **HTTP Security Headers** | Helmet middleware configured globally during application bootstrap. | Mitigates MIME-sniffing, clickjacking (`X-Frame-Options`), and forces secure HTTPS transport (`HSTS`). |
| **Global Throttling** | NestJS Throttler applied via `APP_GUARD`: 100 req/60s default; Auth endpoints overridden (Login: 5/min, Register: 5/10min, Forgot: 3/hr). | Mitigates automated denial-of-service (DoS) and brute-force password cracking attempts. |
| **Strict DTO Validation** | Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`. | Defends against mass-assignment vulnerabilities by immediately rejecting unexpected request body parameters. |
| **Magic-Byte Media Validation** | Multer buffers files in memory; `file-type` inspects binary magic bytes before streaming to Cloudinary. Restricts file size to 1 MiB. | Defends against malicious executable upload attacks disguised as images (`image/png`). |

---

## 9. Redis Caching, Performance & Background Jobs

### Redis Cache-Aside Implementation
The backend integrates a global Redis cache provider via `@nestjs/cache-manager` and `@keyv/redis` in [backend/src/infrastructure/redis/redis.module.ts](backend/src/infrastructure/redis/redis.module.ts).

- **Startup Diagnostic Check:** In `RedisService.onModuleInit()`, the system writes a temporary UUID key (`diagnostic:cache:<uuid>`), reads it back, verifies value equality, and deletes the key. If Redis is unreachable or misconfigured, application startup fails fast with a descriptive error.
- **Cache-Aside Pattern:** High-frequency, low-mutability domain queries check Redis first. On cache miss, they execute the Prisma query and store the result with a TTL of 300,000 ms (5 minutes).

```
[ Incoming Read Request ]
          |
          v
[ Check Redis Key ] ------------( Cache Hit )------------> [ Return Cached JSON ]
          |
     ( Cache Miss )
          |
          v
[ Execute Prisma Query ]
          |
          v
[ Store in Redis (TTL: 300s) ]
          |
          v
[ Return Database Result ]
```

### Cache Key Design

| Domain Entity | Cache Key Pattern | TTL | Invalidation Trigger |
| :--- | :--- | :--- | :--- |
| **SaaS Plans List** | `platform:plans:page:<page>:limit:<limit>` | 300s | Invalidated on plan creation or update. |
| **SaaS Plan Detail** | `platform:plans` | 300s | Invalidated on plan update. |
| **Working Hours List** | `admin:<adminId>:working-hours:page:<page>:limit:<limit>` | 300s | Invalidated on working hour creation/update. |
| **Working Hour Detail** | `admin:<adminId>:working-hours` | 300s | Invalidated on working hour modification. |
| **Special Hours List** | `admin:<adminId>:special-hours:page:<page>:limit:<limit>` | 300s | Invalidated on special hour creation/update. |
| **Special Hour Detail** | `admin:<adminId>:special-hours` | 300s | Invalidated on special hour deletion. |

---

### Scheduled Background Tasks (Cron Jobs)

Seven automated schedulers run under `@nestjs/schedule` in `backend/src/jobs/`:

| Cron Job Class | Frequency / Expression | Operation Executed | Anti-Duplication Safeguards |
| :--- | :--- | :--- | :--- |
| **`MembershipCron`** | `EVERY_HOUR` (`0 * * * *`) | Queries active memberships where `expiresAt <= now()` and sets status to `EXPIRED`. | Direct status transition (`ACTIVE` -> `EXPIRED`). |
| **`SubscriptionCron`** | `EVERY_HOUR` (`0 * * * *`) | Queries active SaaS subscriptions where `expiresAt <= now()` and sets status to `EXPIRED`. | Direct status transition (`ACTIVE` -> `EXPIRED`). |
| **`PaymentCron` (Noon)** | `EVERY_DAY_AT_NOON` (`0 12 * * *`) | Identifies `PAID` payments whose `dueDate` falls within the next 24 hours and updates status to `DUE_SOON`. | Date range window (`now()` to `now() + 24h`). |
| **`PaymentCron` (Midnight)** | `EVERY_DAY_AT_MIDNIGHT` (`0 0 * * *`) | Identifies overdue payments in `DUE_SOON` status past `dueDate` and transitions status to `UNPAID`. | Filter on `dueDate < now()`. |
| **`VisitCron`** | `EVERY_30_MINUTES` (`*/30 * * * *`) | Updates `READY` visits whose `visitDateAndTimeExpiresAt <= now()` to `EXPIRED`. | Filter on `visitStatus: READY`. |
| **`MembershipNotificationCron`** | `EVERY_HOUR` (`0 * * * *`) | Dispatches member notifications for `DUE_SOON` payments where `expirationNotifiedAt` is null. | Sets `expirationNotifiedAt = now()` inside an atomic transaction to guarantee single delivery. |
| **`SubscriptionNotificationCron`** | `EVERY_HOUR` (`0 * * * *`) | Dispatches administrator notifications for subscriptions expiring within 24 hours where `expirationNotifiedAt` is null. | Sets `expirationNotifiedAt = now()` inside an atomic transaction. |
| **`SentimentCron`** | `EVERY_DAY_AT_MIDNIGHT` (`0 0 * * *`) | Retries AI sentiment classification for feedback records where `sentiment` or `sentimentScore` is null. | Filters on `OR: [{ sentiment: null }, { sentimentScore: null }]`. |

---

## 10. API Documentation and Testing

### REST API Route Organization

All routes are explicitly registered in domain controllers under standardized prefixes:

- `/api/auth`: Registration, multi-role authentication, refresh token rotation, logout, password recovery.
- `/api/users/owners`, `/api/users/admins`, `/api/users/staffs`, `/api/users/members`: Self-profile management and avatar uploads.
- `/api/owners`: SaaS plan creation, administrator account management, global subscription operations.
- `/api/plans`: Public SaaS plan listings and owner modifications.
- `/api/admins/...`: Club administrative operations (staff provisioning, member onboarding, memberships, hours).
- `/api/staffs/...`: Front-desk operational endpoints (member verification, attendance check-in, feedback).
- `/api/members/...`: Member self-service endpoints (visit scheduling, QR code pass, feedback, history).
- `/api/health`: Lightweight HTTP liveness healthcheck returning `{ "status": "ok" }`.

### Swagger / OpenAPI Configuration
When running with `NODE_ENV=development`, NestJS compiles an interactive OpenAPI specification exposed at:
$$\text{http://localhost:3000/api-docs}$$

Features configured:
- Bearer authentication scheme configured for interactive testing.
- DTO schema reflection with field requirement indicators and validation rules.
- Operational metadata reflecting route parameters and response types.

### API Testing Verification Commands

```bash
# 1. Verify Application Health Probe
curl -i http://localhost:3000/api/health
# Expected Output: HTTP/1.1 200 OK -> {"status":"ok"}

# 2. Query Public SaaS Plans (Cached via Redis)
curl -i 'http://localhost:3000/api/plans?page=1&limit=10'

# 3. Test Rate Limiting on Authentication Endpoint
for i in {1..7}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/auth/login-user \
    -H "Content-Type: application/json" \
    -d '{"email":"invalid@test.com","password":"WrongPassword123!"}'
done
# Expected Output: Five 401 Unauthorized responses followed by 429 Too Many Requests
```

### Automated Testing Status
- **Test Scripts Configured:** `npm test`, `npm run test:watch`, `npm run test:cov`, `npm run test:e2e`.
- **E2E Starter Test:** `backend/test/app.e2e-spec.ts` exists as a default NestJS CLI starter test.
- **Unit Test Coverage Notice:** No individual `*.spec.ts` unit tests were written for domain services in `backend/src/`. API correctness was verified through manual integration testing, Swagger UI execution, and end-to-end frontend client interactions.

---

## 11. Modules — 42 Evaluation

The 42 School `ft_transcendence` evaluation requires projects to be composed of **Major Modules (2 points each)** and **Minor Modules (1 point each)** chosen from the official subject specifications or approved as Custom Modules of Choice.

### Module Mapping & Point Attribution

| Module Name | Category | Module Type | Points | Implementation Description | Primary Contributor & Evidence |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Backend Framework** | Web | **Major** | **2** | Full-scale modular REST API built with NestJS, TypeScript, Express, and Dependency Injection. | **mdahani** (318 backend commits) |
| **Database Integration** | Web | **Minor** | **1** | Relational persistence with PostgreSQL 16 and Prisma ORM; 25 models, 56 migrations. | **mdahani** (Schema & queries) |
| **Standard User Management & Auth** | User Management | **Major** | **2** | 4-tier role management, JWT access/refresh rotation, persistent sessions, Cloudinary avatars. | **mdahani** (Full auth subsystem) |
| **Frontend Framework** | Web | **Major** | **2** | Dual web applications (Admin/Staff Portal & Owner Portal) built on Next.js 15 and React 19. | **ael-jama** (`admin-staff-platform`, `owner-platform`) |
| **AI Integration & Microservice** | AI / Data | **Major** | **2** | FastAPI Python microservice with Google Gemini RAG assistant and feedback sentiment analysis. | **Oussama Bousselham** (`AI/` service); client by **mdahani** |
| **Blockchain / Web3 Integration** | Web3 | **Major** | **2** | Solidity ERC-20 smart contracts (`GymToken`, `GymForwarder`), marketplace, Web3 API relayer. | **OB4413** (`block-chain/`); metadata by **mdahani** |
| **DevOps & Monitoring Stack** | Infrastructure | **Major** | **2** | Multi-container Docker Compose, Nginx reverse proxy, SSL certs, Prometheus, Alertmanager, Grafana. | **Mohamed-Ait-Alla** (`devops/` stack) |
| **Custom Module of Choice: Sports Club Operational Suite** | Extended Platform | **Major** | **2** | Complete multi-tenant operational suite: memberships, visit scheduling, QR check-in, attendance logs, working hours. | **mdahani** (Architecture & implementation) |

### Points Summary

$$\text{Total Project Scope} = 7 \text{ Major Modules} \times 2\text{ pts} + 1 \text{ Minor Module} \times 1\text{ pt} = \mathbf{15\text{ Points}}$$

$$\text{Backend Core Modules Implemented by mdahani} = 3 \text{ Major} + 1 \text{ Minor} = \mathbf{7\text{ Points}}$$

> **Notice for Evaluators:** The official 42 evaluation subject checklist must be referenced during defense to reconcile these technical implementations against the team's formal module declarations.

---

## 12. Individual Backend Contributions — mdahani

The entire backend codebase was architected, written, and maintained by **Mohamed Dahani (`mdahani`)**, as confirmed by Git commit logs and repository blame.

```
Total Repository Commits: 342
Backend Subsystem Commits: 318 (~97% of backend code)
Authored Lines: Over 12,000 lines of production TypeScript and Prisma configuration
```

### Verified Implementation Breakdown

#### 1. Core Architecture & Bootstrap
- Configured NestJS application bootstrap with Express adapter, trust proxy configuration, and global pipes.
- Implemented global `ValidationPipe` with payload whitelisting and non-whitelisted property rejection.
- Configured Helmet HTTP security headers and cookie parsing middleware.
- Configured dynamic Swagger documentation generation for development environments.
- *Commit Evidence:* `49e9b3f`, `4e48542`, `a6c8b70`.

#### 2. Multi-Role Authentication Subsystem
- Designed and coded `modules/auth/auth.provider.ts` (1,704 lines of comprehensive authentication logic).
- Implemented email-based login for Owners/Admins and username-based login for Staff/Members.
- Implemented cryptographically secure refresh token rotation with SHA-256 hashing, UUID `jti`, and user-agent device tracking.
- Developed role-specific Passport strategies (`owner-access-token`, `admin-access-token`, `staff-access-token`, `member-access-token`).
- *Commit Evidence:* `6950459`, `bb9c048`, `496a80c`, `11fd928`.

#### 3. Action Tokens & Email Workflows
- Built cryptographic single-use action token utility generating 32-byte secure random tokens.
- Integrated Resend transactional email API with custom HTML templates for account activation, password resets, and initial credential setup.
- Implemented password validation enforcing uppercase, lowercase, numeric, symbol, and length constraints.
- *Commit Evidence:* `6e86bb6`, `9eadd15`, `b71c5f5`.

#### 4. Unified Access Control & RBAC
- Implemented `@Roles()` metadata decorator and `AuthRolesGuard` utilizing NestJS `Reflector`.
- Engineered `AccessesService` to centralize multi-tenant authorization, resolving staff identities to administrators and asserting account, subscription, and membership active states.
- Implemented strict TypeScript selection masks (`safeUserSelect`, `safeStaffSelect`, `safeMemberSelect`) using `satisfies Prisma.*Select` to prevent password leakage.
- *Commit Evidence:* `ad704b7`, `a1bf384`, `cca9f25`, `0c20128`.

#### 5. Member Onboarding & Membership Workflows
- Built member onboarding workflow executing an atomic Prisma interactive transaction across member creation, membership assignment, and payment recording.
- Implemented membership plan management supporting customizable weekly visit quotas, durations, and pricing.
- Engineered membership replacement logic with conflict checks.
- *Commit Evidence:* `00e7d0b`, `cd65ae5`, `362efd1`.

#### 6. Visit Scheduling & Attendance Check-In
- Implemented calendar visit scheduling validating future timestamps, operating hours, and weekly membership limits.
- Built QR pass generator issuing unique SHA-256 hashed visit tokens with 30-minute expiration windows.
- Engineered attendance check-in engine supporting manual desk entry and QR code verification.
- Implemented strict check-in time window validation (10 minutes before visit up to expiration time).
- *Commit Evidence:* `a41f61d`, `2a71f2a`, `0189c95`, `e0b36c2`.

#### 7. Business Hours & Holiday Closures
- Built recurring weekly business hours management with ISO day-of-week validation and time ordering checks.
- Engineered special closure interval logic correctly handling daytime closure windows and overnight intervals.
- *Commit Evidence:* `75fcfbd`, `7b1947a`, `0be6192`.

#### 8. Redis Caching & Query Optimization
- Configured Redis module with Keyv store and startup self-test diagnostic.
- Implemented cache-aside pattern for SaaS plans and business hours with 5-minute TTL.
- Added offset pagination logic (`skip`/`take`) across all list endpoints.
- *Commit Evidence:* `12c1aee`, `196d0b0`, `aaf4b15`, `c527a01`, `2751acf`.

#### 9. Scheduled Background Jobs & Reminders
- Built 7 cron jobs managing automated state transitions for memberships, subscriptions, payments, and visits.
- Implemented idempotent reminder notifications with database markers (`expirationNotifiedAt`) to eliminate duplicate alerts.
- *Commit Evidence:* `67eb1d5`, `2e146f3`, `ec2e448`, `2e3aac1`.

#### 10. Reviews & AI Sentiment Integration
- Developed member feedback and rating endpoints with community like toggling via join table.
- Integrated external AI sentiment analysis client with timeout handling and midnight batch retry cron.
- *Commit Evidence:* `c37ae1f`, `c5978e1`, `c5171ea`, `d9175c9`.

#### 11. Media Management & Blockchain Fields
- Integrated Cloudinary stream upload for avatars and implemented magic-byte inspection via `file-type`.
- Added Ethereum wallet address persistence to User and Member schemas to facilitate Web3 token transactions.
- *Commit Evidence:* `0fbb196`, `ea6dbaf`, `039442b`, `4c668aa`, `a55d311`, `85184ba`.

---

## 13. Engineering Challenges and Solutions

### 1. Polymorphic Multi-Role Access Control on Shared Data
- **Problem:** Four distinct user roles (`OWNER`, `ADMIN`, `STAFF`, `MEMBER`) interact with overlapping data entities. Staff members do not own club records; their permissions derive from their employing administrator.
- **Why It Was Difficult:** NestJS route guards execute before route handlers and only inspect token payloads. A staff token contains a staff ID, but database queries require the parent `adminId`. Redundant database lookups in every controller violated DRY principles and introduced security inconsistencies.
- **Implemented Solution:** Created a centralized `AccessesService` injected across all domain services. It inspects the JWT payload: if the caller is an `ADMIN`, it returns their ID; if the caller is `STAFF`, it queries the staff profile, asserts their account is `ACTIVE`, and resolves the parent `adminId`. It then verifies that the administrator's SaaS subscription is active and unexpired.
- **Outcome:** Clean, unified multi-tenant isolation where staff desk operations are securely scoped to their club administrator without duplicating access logic across controllers.

### 2. Stateless JWT Refresh Rotation with Anti-Replay Security
- **Problem:** Providing seamless long-lived user sessions without storing raw JWTs on the server or exposing users to token theft and replay attacks.
- **Why It Was Difficult:** Standard JWTs are stateless and cannot be revoked prior to expiration. If a refresh token is compromised, an attacker could maintain unauthorized access indefinitely unless tokens are actively tracked.
- **Implemented Solution:** Engineered a persistent refresh session architecture. When a refresh token is issued, a unique `jti` (UUID) is generated, the token string is hashed using SHA-256, and the hash is stored in PostgreSQL alongside IP address and device metadata. During rotation, an atomic Prisma transaction verifies that the token exists, is unexpired, and has not been revoked (`revokedAt: null`), immediately revokes the old token, and issues a new pair.
- **Outcome:** Full session revocability and detection of stolen token reuse while maintaining standard JWT authorization speeds.

### 3. Idempotent Scheduled Reminders Without Distributed Locks
- **Problem:** Hourly background cron jobs query subscriptions and payments expiring in 24 hours. Without tracking execution state, the hourly job would send duplicate reminder emails/notifications every hour until the record expired.
- **Why It Was Difficult:** The project environment lacks a distributed Redis lock manager (like Redlock) or heavy queue infrastructure (like BullMQ).
- **Implemented Solution:** Added an `expirationNotifiedAt` timestamp column to `Subscription` and `Payment` models. The cron job queries records where `expiresAt <= now + 24h AND expirationNotifiedAt IS NULL`. Within an atomic transaction, the job marks `expirationNotifiedAt = now()` and inserts the notification record.
- **Outcome:** Fully idempotent reminder delivery; notifications are dispatched exactly once per expiration cycle without requiring external queue infrastructure.

### 4. Check-In Time Window & Boundary Enforcement
- **Problem:** Members booking scheduled visits must not be allowed to check in hours before their scheduled time or after their booking has expired.
- **Why It Was Difficult:** A scheduled visit contains a date and start time (`visitDateAndTime`). Check-in operations happen in real-time. Handling early arrivals (grace period) versus expired passes required synchronized calculations between visit expiration constants and attendance timestamps.
- **Implemented Solution:** Introduced `EARLIEST_VISIT_CHECK_IN_MINUTES = 10` and `VISIT_EXPIRATION_MINUTES = 30`. In `attendances.service.ts` (commit `e0b36c2`), the check-in logic computes `earliestCheckIn = subMinutes(visit.visitDateAndTime, 10)` and `latestCheckIn = visit.visitDateAndTimeExpiresAt`. Check-in is rejected if `now < earliestCheckIn` (too early) or `now > latestCheckIn` (expired).
- **Outcome:** Facility access is strictly bound to valid booking windows, preventing premature entry and unauthorized use of expired passes.

### 5. Resilient AI Sentiment Analysis Integration
- **Problem:** Member feedback submissions must not fail or hang if the external Python AI sentiment microservice is slow, unreachable, or crashing.
- **Why It Was Difficult:** Real-time sentiment classification requires an external network HTTP call. Making feedback persistence synchronously dependent on an external service creates a single point of failure.
- **Implemented Solution:** Wrapped the outbound Axios call in `ExternalApiService` with a strict 5,000 ms timeout and a comprehensive try/catch block. If the AI service fails or times out, the feedback is successfully saved with `sentiment: null`. A scheduled cron job (`SentimentCron`) runs daily at midnight, querying unclassified feedback and retrying the AI service.
- **Outcome:** Zero downtime or submission loss for member reviews due to external microservice unavailability.

---

## 14. Backend Installation and Execution

### Prerequisites

- **Node.js:** Version `22.12.0+` within Node 22, or Node `24+` (required by locked `file-type@22.1.1` dependency).
- **Package Manager:** `npm` v10+ (utilizing committed `package-lock.json`).
- **PostgreSQL:** Version 16.x.
- **Redis:** Version 7.x.
- **Docker & Docker Compose:** For containerized workflows.

---

### Backend-Only Local Setup (Without Containers)

#### 1. Navigate to Backend Directory
```bash
cd backend
```

#### 2. Configure Environment Variables
Create `.env` by copying the example template:
```bash
test -f .env || cp .env.example .env
```

Edit `backend/.env` with safe development credentials:

```dotenv
# Application Environment
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Database & Cache Persistence
DATABASE_URL=postgresql://postgres:postgres_password@localhost:5432/club_db?schema=public
REDIS_URL=redis://localhost:6379

# External Microservice
AI_API_URL=http://localhost:8000/internal/sentiment

# Action Token Lifespans
EMAIL_VERIFICATION_TOKEN_EXPIRES_IN=1h
RESET_PASSWORD_TOKEN_EXPIRES_IN=30m
SET_PASSWORD_TOKEN_EXPIRES_IN=24h

# Third-Party Cloud Providers
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RESEND_API_KEY=re_your_resend_api_key

# JWT Role Configuration (Use: openssl rand -hex 32)
JWT_OWNER_ACCESS_SECRET=c6f491c1072ec22cfbe6e8db02b7754f923b7b204683057e93766eb9015c9d12
JWT_OWNER_ACCESS_EXPIRES_IN=15m
JWT_OWNER_REFRESH_SECRET=7f51d03ef46571556a31bf699df85efc272a514d334335c0c97801be9df03348
JWT_OWNER_REFRESH_EXPIRES_IN=7d

JWT_ADMIN_ACCESS_SECRET=21b4a0ef39f972b9a7beae5da8b3ce3c850259e879051ea00109ae9b433e5c94
JWT_ADMIN_ACCESS_EXPIRES_IN=15m
JWT_ADMIN_REFRESH_SECRET=f3aa29d8e57849c305cb75f7df432b4b458ae5a6f059cb2aa227eb0155a0b7ef
JWT_ADMIN_REFRESH_EXPIRES_IN=7d

JWT_STAFF_ACCESS_SECRET=c8e762cba1b9d0337f776eb80a42ea2d6fcf777e4cfd1e39b72044810e7b99c8
JWT_STAFF_ACCESS_EXPIRES_IN=15m
JWT_STAFF_REFRESH_SECRET=85885c3e031eb5c556b158097b83d1cfa9e394019ecfa389a9f2425039bebfd9
JWT_STAFF_REFRESH_EXPIRES_IN=7d

JWT_MEMBER_ACCESS_SECRET=3a388bdfb1ccf77e6fbe532da8ba2233c8742b6040854293f0bbf3537c35be88
JWT_MEMBER_ACCESS_EXPIRES_IN=15m
JWT_MEMBER_REFRESH_SECRET=180bf8571112d8a9e7019f3900994bf5f2b87f3caef512ec1641f9801b7a2bb4
JWT_MEMBER_REFRESH_EXPIRES_IN=7d
```

> **Security Warning:** The hex keys above are illustrative examples for local development. Never commit production secrets to Git.

#### 3. Install Dependencies
```bash
npm ci
```

#### 4. Generate Prisma Client & Run Migrations
```bash
npx prisma generate
npx prisma migrate deploy
```

#### 5. Start Development Server
```bash
npm run start:dev
```
The server will boot and display:
```
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [RedisService] Redis cache read/write check passed
[Nest] LOG [NestApplication] Nest application successfully started
```

---

### Production Build & Execution

Compile TypeScript to JavaScript:
```bash
npm run build
```

Run production build:
```bash
# Direct node execution using compiled entrypoint:
NODE_ENV=production node dist/src/main.js
```

---

### Full-Project Startup via Docker Compose

To run the complete system stack (Postgres, Redis, Backend, Frontend, Owner Platform, AI, and Nginx reverse proxy):

From the repository root:
```bash
# 1. Build and start all services in detached mode
make up

# Alternatively, via direct docker compose command:
docker compose -f devops/docker-compose.yml up -d --build

# 2. Inspect container status
make ps

# 3. Follow backend logs
docker compose -f devops/docker-compose.yml logs -f backend
```

---

## 15. Resources and AI Usage

### Technical References & Official Documentation

- [NestJS Official Documentation](https://docs.nestjs.com/) — Modules, dependency injection, lifecycle events, guards, execution context, and OpenAPI integration.
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) — Type inference, generics, mapped types, and the `satisfies` operator.
- [Prisma ORM Documentation](https://www.prisma.io/docs) — Relational modeling, Prisma Client API, interactive transactions, and migration deployment.
- [PostgreSQL 16 Manual](https://www.postgresql.org/docs/16/index.html) — Foreign key constraints, compound indexes, ACID transactions, and date/time functions.
- [Redis Documentation](https://redis.io/docs/latest/) — Cache eviction policies, Keyv store mechanisms, and in-memory key-value data structures.
- [Passport.js Documentation](https://www.passportjs.org/docs/) — Strategy patterns and JWT bearer token extraction.
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration) — Memory buffer streaming uploads and asset deletion API.
- [Resend Email API](https://resend.com/docs) — Transactional email transmission and REST API integration.
- [Docker Documentation](https://docs.docker.com/) — Multi-stage builds, non-root container security, and Docker Compose networking.

---

### AI Usage Statement

In accordance with 42 School evaluation guidelines, AI tool usage throughout this project is transparently documented:

1. **AI Usage During Backend Development:**
   - AI tools (including GitHub Copilot and Claude) were utilized as technical accelerators for:
     - Researching NestJS v11 syntax updates and `@keyv/redis` integration patterns.
     - Reviewing regular expression patterns for input validation.
     - Brainstorming edge-case boundary conditions (e.g. overnight closure interval logic).
     - Designing responsive HTML templates for transactional emails.
   - All architecture decisions, domain schemas, business logic, security guards, and database transactions were manually coded, reviewed, tested, and debugged by **Mohamed Dahani**.

2. **AI Usage in Documentation Preparation:**
   - An advanced AI assistant was utilized to thoroughly inspect the entire repository, perform git blame and commit history analysis, trace database relationships, verify package versions, identify technical limitations, and generate this structured Markdown contribution document.

---

### AI Usage Details Requiring Team Confirmation

Prior to publishing the final consolidated team README, team members must confirm:
- Specific AI tools used during the development of their respective subsystems (`AI/`, `block-chain/`, `admin-staff-platform/`, `owner-platform/`, `devops/`).
- Specific files or algorithms generated or assisted by AI within those directories.
- Verification that all AI-generated code was manually audited and tested by the team.

---

## 16. Information to Confirm Before Final Merge

The following items must be reviewed and confirmed by team members before creating the final root `README.md`:

1. **Team Logins & Roster:** Replace the curriculum notice placeholder (`*This project has been created as part of the 42 curriculum by mdahani, <other verified team logins>.*`) with the verified 42 intranet logins of all team members.
2. **Official 42 Module Declarations:** Cross-reference the module table in Section 11 against the official 42 School evaluation sheet selected by the team to confirm official module titles, point allocations (Major vs Minor), and custom module approval.
3. **Database Schema Diagram Commit:** Confirm that `docs/readme-contributions/vibeschema-diagram.svg` is tracked and committed in Git so it renders reliably from the repository root.
4. **Resolution of Verified Code Defects:**
   - Determine whether `isAccountVerified` should be set to `true` inside `activateAccount()` or handled via a migration fix before evaluation.
   - Align the AI sentiment endpoint payload contract between `ExternalApiService` (`{ content }`) and `AI/app/main.py` (`{ text }` with `X-API-Key`).
   - Fix the attendance weekly count boundary condition in `attendances.service.ts` line 295.
5. **Production Dockerfile Alignment:** Ensure the `package.json` `"start:prod"` script (`node dist/main`) matches the Dockerfile output path (`node dist/src/main`), and verify Prisma CLI availability in the production container stage.
6. **Integration of Teammate Contributions:** Merge this backend document with the individual contribution documents from:
   - Frontend Developer (`admin-staff-platform` & `owner-platform`).
   - AI Subsystem Developer (`AI/`).
   - Blockchain Subsystem Developer (`block-chain/`).
   - DevOps / Infrastructure Specialist (`devops/`).

