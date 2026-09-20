# Gym SaaS — Product Features & Technical Map

This document outlines the complete feature set and deliverables of the Gym Management SaaS platform, organized across **Backend**, **Frontend**, **AI Microservice**, and **DevOps**.

---

## 1. ⚙️ Backend (NestJS + Prisma + Postgres)

### A. Tenancy, Auth & Permissions
- **Multi-Tenant Hierarchy**: Platform Owner $\rightarrow$ Gym Admin (Gym Owner / Staff) $\rightarrow$ Gym Member.
- **Authentication**:
  - Email and password authentication with salted hashing.
  - JWT Access tokens + Refresh tokens with automatic rotation.
  - Token revocation (logout / blacklist), device and user-agent tracking.
- **Password & Account Workflows**:
  - Forgot password / reset password flows via action tokens.
  - Email verification links.

### B. Gym Management Core
- **Member Management**:
  - Full CRUD operations on gym members (names, phone numbers, emails, emergency contacts, addresses).
  - Profile image uploads via Cloudinary integration.
  - Account status lifecycle: `ACTIVE`, `FROZEN`, `BANNED`.
- **Membership Plans & Durations**:
  - Plan catalogue creation (e.g. *Basic*, *Pro*, *VIP*).
  - Duration packages (e.g. 1 month, 3 months, 6 months, 12 months).
  - Pricing in Moroccan Dirhams (MAD) (`Decimal(10,2)`).
- **Memberships**:
  - Assign plans to members with start and expiry dates (`expiresAt`).
  - History tracking across renewals, lapses, and cancellations.
- **Payments & Billing**:
  - Record cash-at-desk payments.
  - Track payment status: `PAID`, `UNPAID`, `OVERDUE`.
  - Link payments to specific memberships (`membershipId`).

### C. Attendance & Feedback
- **Check-In System (`CheckIn`)**:
  - Record member daily visits (`memberId`, `adminId`, `checkedInAt`).
  - Composite indexes `([adminId, checkedInAt])` and `([memberId, checkedInAt])` for high-speed reporting without sequential scans.
- **Member Feedback (`Feedback`)**:
  - Store member comments, ratings (1–5 stars), and AI sentiment scores (`sentiment`, `sentimentScore`).

### D. API & Integrations
- **Public API**:
  - Secured with API-Key guard and rate limiting (`@nestjs/throttler`).
  - Interactive Swagger API documentation.
- **AI Sentiment Integration**:
  - Trigger HTTP `POST /internal/sentiment` to the AI microservice upon feedback submission and persist the returned sentiment label and confidence score.
- **Notifications**:
  - Automated payment reminders and upcoming membership expiration alerts.

---

## 2. 🖥️ Frontend (Next.js 15 + React 19 + Tailwind CSS)

### A. Public & Marketing Pages
- **Landing Page**: Hero section, value propositions, interactive pricing calculator, member testimonials, FAQ, call-to-action (CTA).
- **Auth Screens**: Sign In, Sign Up, Forgot Password, Reset Password.
- **Mandatory Legal Pages**: Privacy Policy and Terms of Service (accessible in footer).

### B. Gym Admin Portal (Main SaaS Interface)
- **Dashboard & Analytics**:
  - Live KPI summary cards: Active Members, Month-to-Date Revenue, Today's Check-ins, Expiring Soon.
  - Interactive charts: Monthly revenue trends, peak check-in hours, plan distribution.
  - Date-range filtering & export options (CSV / PDF).
- **Front-Desk Check-In Flow**:
  - Rapid member lookup by name or phone.
  - One-click check-in button with immediate visual alerts if a membership is expired or payment is overdue.
- **Members Management**:
  - Filterable directory (Active, Expired, Frozen, Banned).
  - Member profile detail view (membership history, payment log, attendance record).
  - Add / Edit member modal.
- **Plans & Billing Manager**:
  - Plan catalogue and pricing management.
  - Cash payment recording and overdue payment lists.
- **Expiry Worklist**:
  - Actionable list of members expiring in 7 / 30 days for renewal outreach.
- **Feedback & Sentiment Hub**:
  - Feedback feed with sentiment badges (`POSITIVE`, `NEUTRAL`, `NEGATIVE`) and satisfaction trends.
- **Document Manager (for AI RAG)**:
  - Upload gym documents (PDF, TXT, Markdown).
  - Visibility toggling (`Staff Only` vs `Member Visible`).
  - Document listing and deletion.
- **AI Assistant Panel**:
  - Embedded / collapsible streaming chat UI.
  - Live token streaming, tool execution badges, source citation links, and rate-limit countdown.

### C. Member Portal (Mobile-First View)
- **My Membership Screen**: Digital membership card showing plan name, start/end dates, days remaining, and status badge.
- **Payment & Attendance History**: View past payment receipts and visit history.
- **Feedback Submission**: Star rating + comment submission box.
- **Member AI Chat**: Self-service assistant for gym hours, rules, class schedules, and guest policies.

---

## 3. 🤖 AI Microservice (Python + FastAPI + LangGraph + ChromaDB + Gemini)

### A. Admin AI Assistant
- **Structured SQL Tools**:
  - `get_gym_overview`: Instant summary of active members, revenue MTD, and expiring counts.
  - `search_members` & `get_member_detail`: Find members and inspect their full history.
  - `list_inactive_members`: Churn detection (*"Who hasn't checked in for 3 weeks but has a valid plan?"*).
  - `list_expiring_memberships`: Renewal list for upcoming expirations.
  - `get_revenue` & `get_attendance_stats`: Revenue breakdowns (by month/plan) and attendance heatmaps (peak hours/weekdays).
- **LangGraph Agent Loop**:
  - Multi-turn reasoning, tool calling, tool round budget capping, and `finish` fallback node.
- **Streaming & SSE**:
  - Progressive token-by-token response streaming via `POST /ai/chat`.
- **Session Memory**:
  - SQLite transcript storage (`threads`, `thread_messages`), conversation recovery across page reloads, and JWT subject isolation.
- **Multilingual Support**:
  - Automatic detection and reply in English, French, Arabic script, and Moroccan Darija (Latin script).

### B. Knowledge Retrieval (RAG)
- **Tenant-Isolated Gym Documents (Collection A)**: Ingest, chunk, and retrieve per-gym policies, FAQs, schedules, and pricing rules.
- **Gym Business Knowledge (Collection B)**: Advisory knowledge on churn reduction, sales, retention playbooks, and industry benchmarks.
- **Retrieval Quality**:
  - Similarity thresholding (*"not in your documents"* fallback to prevent hallucinations).
  - Multi-turn query rewriting (translates queries to corpus language & resolves pronouns).
  - LLM-based reranking (top-20 $\rightarrow$ top-5).

### C. Member Self-Service AI
- **Restricted Toolset**: Restricted to own membership, own payments, own visits, and member-tagged documents. Complete prevention of cross-tenant or admin data access.

### D. Sentiment Engine
- **Feedback Analyzer (`POST /internal/sentiment`)**: Microservice endpoint that classifies customer feedback text into `positive`, `neutral`, or `negative` with confidence scoring.

---

## 4. 🚢 DevOps & Deployment

- **Single-Command Startup**:
  - Fully wired `docker-compose.yml` to launch Next.js + NestJS + FastAPI + Postgres + SQLite Volume + ChromaDB Volume in one command.
- **Reverse Proxy & HTTPS**:
  - Nginx / Caddy reverse proxy with SSL termination.
  - Routing `/api/*` $\rightarrow$ NestJS backend.
  - Routing `/ai/*` $\rightarrow$ FastAPI AI service.
  - **Crucial Setting**: `proxy_buffering off;` on `/ai/*` so Server-Sent Events (SSE) stream smoothly without buffering.
- **Storage & Volume Management**:
  - Persistent Docker volumes for Postgres data, SQLite AI state, and ChromaDB vector store.
- **Environment Management**:
  - `.env.example` committed for all services, `.env` gitignored.

---

## 5. 📅 Meeting Agenda & Action Items

| Area | Owner | Key Focus for the Sprint |
| :--- | :--- | :--- |
| **Backend** | Dahani | Run Prisma migration for `CheckIn`, `Feedback`, and `Payment` fixes (`SCHEMA_ASK_DAHANI.md`). Connect feedback scoring to `/internal/sentiment`. |
| **Frontend** | Frontend Team | Implement Admin Dashboard KPI cards & charts, Front-Desk Check-In flow, and Member Portal views. |
| **AI** | Oussama | Implement RAG Collection A (document ingestion, chunking, and tenant-scoped retrieval). |
| **DevOps** | DevOps | Set up Docker Compose stack and Nginx reverse proxy with HTTPS and `proxy_buffering off;`. |
