# Rebuild Progress — ft_transcendence

## Completed Milestones

### 1. Shared Foundation & Dashboard
- Rebuilt Dashboard ([`frontend/src/app/(portal)/dashboard/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/dashboard/page.tsx)) using Toota design tokens and bento card structures.
- Implemented responsive navigation sidebar and topbar with language switcher and active roles.

### 2. Members Management
- Rebuilt Members List & Management ([`frontend/src/app/(portal)/members/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/members/page.tsx)).
- Added status filters, search, paginated tables, and action drawers.

### 3. Payments Roster
- Rebuilt Payments Management ([`frontend/src/app/(portal)/payments/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/payments/page.tsx)).
- Integrated Framer Motion animated revenue counter starting from 0 to total collected amount.

### 4. Membership Plans & Tiers (Current Milestone)
- Rebuilt Membership Plans Page ([`frontend/src/app/(portal)/membership-plans/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/membership-plans/page.tsx)):
  - 1:1 visual styling alignment with Dashboard & Members pages (`toota-card border-none`, `toota-pill`, `toota-inner`).
  - Redesigned active/inactive status control into an authentic, human-designed `<Button>` with clean `rounded-lg` styling and semantic status icons (`<Check className="text-toota-green" />` for active, `<X className="text-toota-red" />` for inactive), completely eliminating the generic AI-template look.
  - Inactive Plans KPI Metric Card updated with cohesive red accenting (`text-toota-red` icon container & spinner, `Badge variant="danger"`, and `bg-toota-red` progress bar).
  - Preserved strictly existing components (no extra views or unauthorized controls).
  - Quick visit limit selector in Create & Edit modals features all 7 options (`1 2 3 4 5 6 7`).
- Rebuilt Modal Dialogs with matching `toota-card` and `toota-pill` components:
  - [`CreatePlanModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/membership-plans/CreatePlanModal.tsx)
  - [`EditPlanModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/membership-plans/EditPlanModal.tsx)
  - [`DurationModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/membership-plans/DurationModal.tsx)

### 5. Dashboard & Members Real Data Alignment
- Updated Members Management ([`frontend/src/app/(portal)/members/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/members/page.tsx)):
  - Allowed Cloudinary avatars (`profileImageUrl`) to render properly without being filtered out.
  - Resolved member initials to fall back to `userName` when `firstName`/`lastName` is absent.
  - Replaced strict `memberships[0]` checks with intelligent active membership resolution (`find(m => m.membershipStatus === "ACTIVE") || memberships[0]`), so members with renewal histories display their active tier and dates.
  - Accurate duration display: computes duration in days from `startDate` and `expiresAt` when not provided as a nested relation.
  - Eliminated duplicate initial page network request in `loadData()`.
- Updated Member Details ([`frontend/src/app/(portal)/members/[id]/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/members/[id]/page.tsx)) and Payments ([`frontend/src/app/(portal)/payments/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/payments/page.tsx)) with the same profile photo and duration resolutions.

### 6. GymFlow Subscription Page Real Data & Toota Tokens
- Rebuilt GymFlow Subscription ([`frontend/src/app/(portal)/gymflow-subscription/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/gymflow-subscription/page.tsx)):
  - Fixed registered member count: replaced `fetchMembers(1, 1)` with full count calculation (`fetchMembers(1, 1000)`), correctly computing real gym capacity usage and remaining slots.
  - Active subscription resolution: robustly resolves the active subscription from `fetchMySubscription` with fallback to active records in `fetchAllSubscriptions`.
  - Dynamic status pills: renders real badge variants (`success` with green pulse for active, `warning` with amber pulse for expiring soon, `danger` for expired) instead of hardcoded green badges.
  - Dynamic plan title and capacity: displays real tier names (e.g. `PRO Tier`, `BASIC Tier`) rather than hardcoded `"Enterprise Core"`.
  - Accurate cycle calculations: computes duration in days from `startedAt` and `expiresAt` if `planDuration.durationDays` is missing, providing real daily rates and billing window dates.
  - Full Toota design token alignment: `toota-card border-none`, `toota-pill`, `toota-inner`, `toota-ink`, `toota-green`, and `toota-red`.

### 7. Members, Dashboard, Payments, Plans, GymFlow & Assistant Crisp Micro-Badges & Baseline Metrics
- Refactored Members, Dashboard, Payments, Membership Plans, GymFlow Subscription, and Assistant pages:
  - Converted status pills to crisp outlined micro-badges (`rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800`).
  - Active / Paid / Admitted: `bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs` with `bg-emerald-500` dot.
  - Pending / Awaiting: `bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs` with `bg-amber-500` dot.
  - Expired / Overdue / Failed / Banned: `bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400` with `bg-rose-500` dot.
  - Formatted status text in natural Sentence case without wide letter-spacing.
  - Converted section headers to "Baseline Metric" typography (`flex items-baseline gap-2`) with title (`text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100`) and counter (`font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums / <count> total`), eliminating outer pill borders and badge containers.

### 8. Front Desk Check-in Rebuild (`frontend/src/app/(portal)/check-in/page.tsx`)
- Completely migrated from legacy ad hoc styles to the unified Toota Design System:
  - Replaced legacy `primary-gradient` and raw unstyled elements with `toota-card border-none`, `toota-pill`, `toota-inner`, `toota-ink`, and `toota-muted`.
  - Top header card uses single typographic baseline metric: `Front Desk & Check-in / <companyName> / <allVisits.length> total`.
  - Live Operational Metrics converted to 3 Toota Bento cards (Total Expected Today, Awaiting Verification, Completed Check-ins) with real-time percentage indicators and micro-badges.
  - Quick filter tabs (All Visits, Awaiting Verification, Admitted) styled with active pill states and count chips matching Members & Payments.
  - Table rebuilt using standard shadcn UI components (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`).
  - Member identity renders shadcn `Avatar` with Cloudinary profile photos and smart initials fallback.
  - Visit status rendered as Crisp Outlined Micro-Badge (`Checked In` with emerald dot, `Awaiting Verification` with amber dot, `Cancelled` with rose dot).
  - Preserved full interactive workflows: 1-Click manual check-in, QR Scanner modal (`QrScannerModal`), Visit details dossier modal (`VisitDetailsModal`), and instant celebration modal (`SuccessCelebrationModal`).

### 9. Staff Management & Staff Detail Rebuild (`frontend/src/app/(portal)/staffs/page.tsx` & `[id]/page.tsx`)
- Completely migrated Staff Management and Staff Profile Details to the unified Toota Design System:
  - Header cards use single typographic baseline metrics: `Staff Management / <companyName> / <totalCount> total` and profile `Staff Name / <role> / ID: <id>`.
  - Live Operational Metrics converted to 4 Toota Bento cards (Total Staff, Active Staff, Pending Approval, Banned Staff) with real-time percentage indicators and micro-badges.
  - Quick filter status tabs (All Staff, Active, Pending, Banned) with active pill styling and count chips matching Members & Payments.
  - Staff table rebuilt using standard shadcn UI components (`Table`, `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`).
  - Staff profile renders shadcn `Avatar` with Cloudinary profile photos and smart initials fallback.
  - Status rendered as Crisp Outlined Micro-Badge (`Active` with emerald dot, `Pending` with amber dot, `Banned` with rose dot) and Role micro-badges (`Staff` / `Admin`).
  - Retained fixed high-z-index portal action menu for quick staff actions (View Profile, Edit Details, Activate, Set to Pending, Ban) without table overflow clipping.
  - Preserved full modal workflows: `AddStaffModal` and `EditStaffModal`.
  - Aligned staff backend data contract & avatar image rendering with real API payloads:
    - Fixed avatar resolution bug that inadvertently filtered out Cloudinary default URLs containing `default-` (such as `avatars-default-staff.png` and `avatars-default-admin.png`).
    - Supported `userName` on `BackendStaffAdmin` and supervising admin card avatar display with fallback.
    - Added company facility name fallbacks across staff and supervisor profile headers (`staff.companyName || staff.admin?.companyName`).
    - Enhanced `getInitials` to support username fallback when names are missing.

### 10. Member Feedback & Reviews Rebuild (`frontend/src/app/(portal)/feedbacks/page.tsx`)
- Completely migrated Feedback Management to the unified Toota Design System with server-side pagination:
  - Header card uses single typographic baseline metric: `Member Feedback & Reviews / <companyName> / <totalCount> total`.
  - Operational KPIs converted to 4 Toota Bento cards (Average Satisfaction, Awaiting Resolution, Resolved Inquiries, Positive Sentiment) with real-time percentage indicators and micro-badges.
  - Rebuilt filter toolbar with Toota tokens supporting keyword search, status dropdown, rating filter, and AI sentiment filter.
  - Feedback feed rendered as crisp Toota cards with shadcn `Avatar` (Cloudinary profile photo resolution and smart initials fallback), star ratings, mismatch warnings, and immutable review quotes.
  - Implemented Crisp Outlined Micro-Badges for Status (`Resolved`, `In Review`, `Open`, `Dismissed`) and AI Sentiment (`Positive`, `Neutral`, `Negative`, `Not Analyzed`) in natural Sentence case.
  - Integrated server-side pagination: fetches 10 feedbacks per page (`pageSize = 10`) matching the members page pattern (`fetchAllFeedbacks(newPage, pageSize)`), seamlessly switching to client-filtered slices when search or filters are active.
  - Preserved `ResolveFeedbackModal` workflow and `MemberFeedbackView` role gate for gym members.

### 11. Profile & Account Settings Rebuild (`frontend/src/app/(portal)/profile/page.tsx`, `MemberProfileView.tsx`, & `EmailChangeSection.tsx`)
- Completely migrated Profile Management and Account Settings to the unified Toota Design System across all roles (Admin, Staff, and Member):
  - Header cards use single typographic baseline metrics: `Account & Facility Settings / <companyName> / <role>` for Admin, `Staff Profile & Credentials / <companyName> / @<username>` for Staff, and `Member Profile & Membership / <companyName> / @<username>` for Member.
  - Avatar cards rebuilt using shadcn `Avatar`, `AvatarImage`, and `AvatarFallback`, resolving Cloudinary profile images accurately without blocking valid filenames containing `default-`.
  - Implemented Crisp Outlined Micro-Badges for roles (`Admin`, `Staff`, `Gym Member`), verification status (`Verified`), and account state (`Active Staff`, `Active`).
  - Rebuilt Member Profile view with Toota cards, Bento highlights grid (Weekly Visits, Duration, Days Left in emerald), active tier spotlight, and all memberships history tab.
  - Rebuilt personal information and facility organization sections into modular Toota cards (`toota-card border-none`) with clean inputs and action buttons (`toota-pill`).
  - Preserved all data contracts, photo upload/removal, Zod schema validation, local storage syncing, and role routing.
  - Rebuilt `EmailChangeSection.tsx` with Toota Design System tokens, clean inputs, and micro-badges.

### 12. Operating Hours & Facility Schedule Rebuild (`frontend/src/app/(portal)/operating-hours/page.tsx`, `AdminStaffOperatingHoursView.tsx`, & `MemberOperatingHoursView.tsx`)
- Fixed Role Gating and UI Flashing:
  - Gated root route component behind `isLoading` spinner from `useCurrentUser()`.
  - Separated into two distinct, dedicated components: [`MemberOperatingHoursView.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/operating-hours/MemberOperatingHoursView.tsx) and [`AdminStaffOperatingHoursView.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/operating-hours/AdminStaffOperatingHoursView.tsx), completely preventing admin controls from flashing or mounting for members.
- Member Security and Experience:
  - Read-only interface fetching strictly via `fetchMemberWorkingHours` and `fetchMemberSpecialHours`.
  - Completely eliminated administrative action buttons ("Add Special Closure", "Add Working Hour", "Configure Day", edit, and delete actions).
  - In empty special closures state, displays friendly "Standard Schedule in Effect" advisory with zero add buttons.
  - Added check-in advisory banner informing members of the 30-minute last-entry policy.
- Unified Toota Design System Alignment:
  - Header cards utilize single typographic baseline metrics: `Operating Hours & Schedule / <companyName> / <configuredDays> Days Configured` (and `/ Member Schedule`).
  - Live Operational KPIs converted to 4 Toota Bento cards (Facility Live Status, Active Open Days, Total Weekly Operating Hours, and Special Closures Scheduled) with real-time percentage indicators and progress bars.
  - Converted status pills to Crisp Outlined Micro-Badges (`Open Now` with emerald pulse, `Closed` with rose dot, `Unset` with zinc dot, `All-Day Closure`, `Partial Closure`, `Active Today`, `Upcoming`, `Past`).
  - Highlights the current day of the week with an active badge ("Today") and emerald ring in both admin and member 7-day grids.
  - Enhanced `WorkingHourModal` with `defaultDay` prop to pre-select the targeted day when an administrator clicks "Configure Day".
  - Preserved all CRUD operations, modals (`WorkingHourModal`, `SpecialHourModal`, `DeleteConfirmModal`), and backend endpoints.
- Clean Day Cards & Multi-Language Translations:
  - Preserved the 4 live metric command-center cards (Facility Live Status, Active Open Days, Total Weekly Operating Hours, and Special Closures Scheduled).
  - Cleaned up weekly schedule day cards to the authentic, elegant layout with subtle border lines on each day card (`border border-border/80` with emerald hover on open days, `border border-border/60` on closed days, and dashed border on unset days).
  - Added full multi-language translations across English, French, and Arabic in `frontend/src/lib/i18n.ts` for all operating hours keys (e.g. `facilityRest`, `facilityOpenActive`, `memberCheckinAdvisoryTitle`, etc.), eliminating raw untranslated key fallbacks.
### 13. Member Dashboard Rebuild (`frontend/src/components/dashboard/MemberDashboardView.tsx`)
- Completely rebuilt the Member Dashboard matching the Toota Design System and architecture guidelines:
  - **Member Hero Bento Card**:
    - Single typographic baseline header: `Welcome back, <Name> / <companyName> / Member Portal` (`<div className="flex items-baseline gap-2">` with `text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100` and `font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums`).
    - shadcn `Avatar` with Cloudinary profile photo resolution and smart uppercase initials fallback.
    - Interactive controls: Refresh button with animated spinner and primary "Book Visit" button (`toota-pill`) that opens `BookVisitModal`.
  - **Live Operational KPI Bento Grid (4 Cards)**:
    1. Active Membership: Displays plan name, Crisp Outlined Micro-Badge (`Active`, `Pending`, or `Expired`), weekly visit allowance, formatted duration, and progress bar showing remaining validity.
    2. Next Workout: Displays next scheduled workout time in monospace, friendly date badge (`Today`, `Tomorrow`, or weekday), and progress bar indicator.
    3. Today's Gym Hours: Displays real-time opening hours for today (`06:00 – 22:00` with emerald dot, `Closed` with rose dot, or `Standard Hours` with zinc dot), and 30-minute last-entry advisory.
    4. Completed Workouts: Displays total number of sessions completed, latest check-in method (`QR Check-in` / `Front Desk`), and streak bar.
  - **Middle Split Bento Grid (Membership Dossier & Upcoming Bookings)**:
    - Left (2 cols): Active Membership dossier with plan description, 3 metric wells (Weekly Allowance, Plan Duration, Valid Until), countdown badge (`X days remaining`), and today's workout alert banner with entry instructions.
    - Right (1 col): Upcoming booked sessions roster with time, friendly date, `Scheduled` micro-badge, and 1-click visit cancellation button with loading state. Graceful empty state with "Schedule Visit" CTA.
  - **Quick Action Hub (4 Bento Cards)**:
    - 4 shortcuts (`/visits`, `/operating-hours`, `/profile`, `/feedbacks`) styled with `toota-card border-none hover:bg-toota-inner/50`, iconography, descriptions, and directional arrows.
  - **Recent Check-in Activity & Attendance Log**:
    - Baseline metric header: `Recent Check-in Activity / <attendances.length> total`.
    - Real attendance cards with weekday, date, monospace time, and Crisp Outlined Micro-Badges (`QR Check-in` or `Front Desk Check-in`).
  - **Integrated Booking & Cancellation Workflows**:
    - Directly embeds `BookVisitModal` for booking workout visits without leaving the dashboard.
    - Supports immediate visit cancellation via `cancelMemberVisit` with toast feedback and immediate refresh.
  - **Refined Toota & shadcn Design Alignment**:
    - Completely eliminated artificial AI-template artifacts (removed all decorative `blur-3xl` background blobs, rainbow tinted wells, and multi-colored progress bar gradients).
    - Structured all sections with official shadcn components (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`, `Button`, `Avatar`).
    - Standardized on the authentic Toota design palette: white cards (`toota-card border-none`), neutral inner wells (`bg-toota-inner border border-border/40`), high-contrast ink typography (`text-toota-ink`), and disciplined, restrained green accents (`toota-green`, `bg-toota-green`).
    - Retained Crisp Outlined Micro-Badges and Baseline Metric typography across all modules.
  - **Multi-Language Support**:
    - Added all corresponding translation keys in `frontend/src/lib/i18n.ts` for English, French, and Arabic.

### 14. Feedbacks Page Rebuild with Server-Side Pagination
- Completely rebuilt the Feedbacks page across both Member and Staff/Admin roles ([`frontend/src/app/(portal)/feedbacks/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/feedbacks/page.tsx) and [`frontend/src/components/feedbacks/MemberFeedbackView.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/feedbacks/MemberFeedbackView.tsx)):
  - **Server-Side Pagination (10 items per page)**:
    - Strictly limits rendered cards to 10 items per page (`pageSize = 10`), eliminating unbounded DOM dumping.
    - Added reactive pagination handler `handlePageChange(newPage)` that explicitly invokes the server endpoint (`fetchMemberFeedbacks(newPage, 10)` or `fetchAllFeedbacks(newPage, 10)`) when page changes.
    - Slices client-side search/filter results to strictly 10 items per page when filtering.
    - Integrated standard [`Pagination`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/ui/Pagination.tsx) component.
  - **Toota Design System & shadcn/ui Alignment**:
    - Built with official shadcn components: `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Button`, `Input`, `Avatar`, `AvatarImage`, `AvatarFallback`.
    - Applied Toota tokens: `toota-card border-none`, `toota-inner`, `toota-pill`, `toota-ink`, `toota-muted`, and restrained green accents (`toota-green`).
    - 4 Bento Operational Metric cards: Facility Satisfaction, Total Reviews, My Submissions, and Athlete Satisfaction Ratio.
    - Header with Baseline Metric typography: `<div className="flex items-baseline gap-2">` with title, gym facility name, and `/ {stats.total} total`.
    - Crisp Outlined Micro-Badges for review status (`Resolved` with emerald dot, `Under Review` / `Open` with amber dot) and sentiment.
  - **Refactored Feedback Modals**:
    - Completely refactored [`CreateFeedbackModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/feedbacks/CreateFeedbackModal.tsx), [`DeleteFeedbackModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/feedbacks/DeleteFeedbackModal.tsx), [`MemberFeedbackDetailModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/feedbacks/MemberFeedbackDetailModal.tsx), and [`ResolveFeedbackModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/feedbacks/ResolveFeedbackModal.tsx).
    - Replaced all legacy classes (`bg-surface-container-lowest`, `border-outline-variant`, `primary-gradient`, `text-on-surface`) with modern Toota tokens and shadcn buttons and inputs.
  - **Multi-Language Support**:
    - Added all feedback keys in `frontend/src/lib/i18n.ts` for EN, FR, and AR.
  - **Verification**:
    - TypeScript (`tsc --noEmit`): 0 errors.
    - ESLint: 0 errors, 0 warnings.

### 15. Operational AI Assistant & Knowledge Documents Rebuild
- Completely rebuilt the AI Assistant Workstation and Knowledge Documents portal ([`frontend/src/app/(portal)/assistant/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/assistant/page.tsx) and [`frontend/src/app/(portal)/assistant/documents/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/assistant/documents/page.tsx)):
  - **401 Redirect Loop Bug Resolved**:
    - Removed blind `toLogin()` redirects on AI microservice 401s that triggered middleware bounces back to `/dashboard`.
    - Integrated in-situ reconnection fallback state so users stay on the page and can re-sync without session disruption.
  - **Toota Design System & shadcn/ui Alignment**:
    - Replaced all legacy classes (`bg-surface-container-lowest`, `border-outline-variant`, `text-on-surface`, `font-headline`, `shadow-2xs`) with authentic Toota tokens (`toota-card border-none`, `toota-inner`, `toota-pill`, `toota-ink`, `toota-muted`, `toota-green`).
    - Standardized on official shadcn components: `Card`, `CardHeader`, `CardContent`, `Button`, `Input`, `Avatar`, `AvatarFallback`.
    - Single Typographic Baseline Metric header: `<div className="flex items-baseline gap-2 flex-wrap">` with title, gym name, role context, and Crisp Outlined Micro-Badge (`Connected` with emerald dot, `Offline` with amber dot).
    - Removed redundant top metric cards per user request; expanded dual-pane workstation to full viewport height (`h-[calc(100vh-12.5rem)] min-h-[620px]`).
  - **Hydration Mismatch Permanently Resolved**:
    - Eliminated Next.js 16 / Turbopack SSR text mismatch between server fallback and client i18n bundle (`aiOffline` vs `Offline`).
    - Added `suppressHydrationWarning` on translatable status badges, titles, and headers.
    - Synchronized `messages` key across EN, FR, and AR dictionaries in `frontend/src/lib/i18n.ts`.
    - Integrated hot-reload resource bundling into `i18n.ts` so live server instances immediately ingest updated keys.
  - **Enhanced Chat Workstation & Document Library**:
    - Collapsible thread history sidebar with grouped periods (`Today`, `Yesterday`, `Previous 7 Days`, `Older`) and search filter.
    - Categorized operational launchpad suggestions when starting new conversations.
    - XSS-safe plain text message rendering with streaming token feedback and copy controls.
    - Grounded bottom input dock with character counter and keyboard shortcut guides.
    - Full Knowledge Documents management for Admin: drag-and-drop upload zone, visibility selector (Members & Staff vs. Staff Only), and confirmation dialogs.
  - **Multi-Language Support**:
    - Added all corresponding translation keys in `frontend/src/lib/i18n.ts` for English, French, and Arabic.
  - **Verification**:
    - TypeScript (`tsc --noEmit`): 0 errors.
    - ESLint: 0 errors, 0 warnings.

### 16. Blockchain Marketplace Member Plans BFF Integration
- Resolved cross-origin authentication failure when fetching membership plans and updating wallet addresses:
  - **BFF Route Handlers Created**:
    - Created [`frontend/src/app/api/members/membership-plans/route.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/api/members/membership-plans/route.ts) and [`frontend/src/app/api/members/membership-plans/[id]/route.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/api/members/membership-plans/[id]/route.ts) to bridge `auth_token` cookies into `Authorization: Bearer <token>` for NestJS `@Controller('members/membership-plans')`.
    - Updated unified [`frontend/src/app/api/membership-plans/route.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/api/membership-plans/route.ts) to dynamically route `isMember` sessions to `/api/members/membership-plans`.
  - **Clean Client Refactoring**:
    - Refactored [`frontend/src/components/marketplace/hooks/useMemberMarketplace.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/marketplace/hooks/useMemberMarketplace.ts) to call `/api/members/membership-plans` via preconfigured `@/lib/axios` (`withCredentials: true`), eradicating the hardcoded, static Bearer token and direct port-3000 cross-origin calls.
    - Updated [`frontend/src/lib/blockchain/api/marketplace.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/lib/blockchain/api/marketplace.ts) to use `@/lib/axios` for `update_walletAddress_member` and `update_addressAdmin_forMember`, removing another hardcoded token and connecting to existing BFF profile routes.
  - **Verification**:
    - TypeScript (`tsc --noEmit`): 0 errors.
    - ESLint: 0 errors, 0 warnings.

### 17. Member Visits & Attendances Rebuild
- Rebuilt Member Workout Visits & Attendance History ([`frontend/src/app/(portal)/visits/page.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/(portal)/visits/page.tsx) and [`frontend/src/components/visits/BookVisitModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/visits/BookVisitModal.tsx)):
  - **Single Typographic Baseline Metric Header**:
    - Replaced the large banner with a clean `toota-card border-none` header.
    - Title on a single baseline with Portal and session counter metrics: `<div className="flex items-baseline gap-2 flex-wrap">`.
    - Added Toota-styled Refresh and Schedule Visit buttons.
  - **3 Bento KPI Summary Cards**:
    - Metric 1: Upcoming Visits with amber dot micro-badge and progress bar.
    - Metric 2: Today's Schedule with emerald active indicator or none state.
    - Metric 3: Completed Check-ins with emerald session counter.
  - **Segmented Navigation Tabs & Lists**:
    - Replaced raw buttons with segmented Toota pill tabs: `Upcoming Visits`, `Today's Schedule`, and `Attendance History`.
    - Upcoming & Today's visits rendered in clean `toota-card border-none` cards with friendly date/time, plan tag, and Details/Cancel actions.
    - Attendance history rendered in a structured card with baseline metric header and divided check-in logs (QR Code vs. Front Desk).
  - **Modal Dialogs Refactored**:
    - Rebuilt Inspection dialogs (Single Visit & Single Attendance) and `BookVisitModal.tsx` with `toota-card border-none shadow-2xl`, `toota-inner`, `toota-pill`, and clean datetime input.
    - Preserved all existing logic, handlers (`cancelMemberVisit`, `loadData`, `handleInspectVisit`, `handleInspectAttendance`), and Zod validation.
  - **Multi-Language Support**:
    - Added all missing visit keys in `frontend/src/lib/i18n.ts` for English, French, and Arabic with `suppressHydrationWarning`.
  - **Verification**:
    - TypeScript (`tsc --noEmit`): 0 errors.
    - ESLint: 0 errors, 0 warnings.

### 18. TopBar Search Removal, Notifications Mark As Read & Detail Modal Redesign
- **TopBar Search Input Removal**:
  - Cleaned up [`frontend/src/components/layout/TopBar.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/layout/TopBar.tsx) by removing the non-functional search input and unused icon imports.
- **Backend Notifications "Mark As Read" BFF Integration**:
  - Implemented `PATCH` handlers across all Next.js BFF routes:
    - Admin: [`frontend/src/app/api/admins/notifications/route.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/api/admins/notifications/route.ts) (`makeAllNotificationsReadAdmin`) and [`frontend/src/app/api/admins/notifications/[id]/route.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/api/admins/notifications/[id]/route.ts) (`makeNotificationReadAdmin`).
    - Member: [`frontend/src/app/api/members/notifications/route.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/api/members/notifications/route.ts) (`makeAllNotificationsReadMember`) and [`frontend/src/app/api/members/notifications/[id]/route.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/app/api/members/notifications/[id]/route.ts) (`makeNotificationReadMember`).
  - Gracefully intercepts backend 409 Conflict (`Already Mark As Read`) and returns 200 OK to prevent client-side uncaught exceptions.
  - Added client API functions:
    - [`frontend/src/lib/api/notifications.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/lib/api/notifications.ts): `markAllAdminNotificationsRead`, `markAdminNotificationRead`.
    - [`frontend/src/lib/api/member-portal.ts`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/lib/api/member-portal.ts): `markAllMemberNotificationsRead`, `markMemberNotificationRead`.
- **Notification Dropdown Redesign & Optimistic Updates**:
  - Rebuilt [`frontend/src/components/notifications/NotificationDropdown.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/notifications/NotificationDropdown.tsx) using Toota tokens (`toota-card border border-border/40 shadow-2xl`, `toota-inner`, `toota-ink`, `toota-muted`).
  - Accurate unread badge count derived directly from backend `isRead` status.
  - Clicking a single notification immediately triggers the corresponding `mark...NotificationRead(id)` endpoint and marks it read in local state.
  - "Mark all as read" button invokes `markAll...NotificationsRead()` and clears unread badges.
- **Single Notification Modal Redesign**:
  - Redesigned [`frontend/src/components/notifications/NotificationDetailModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/frontend/src/components/notifications/NotificationDetailModal.tsx) using Toota Design System tokens:
    - `Card className="toota-card border-none shadow-2xl relative w-full max-w-lg p-6 sm:p-7 overflow-hidden space-y-6"`
    - Baseline header with notification ID and Crisp Outlined Micro-Badge (Payment, Membership, Subscription, Alert).
    - Inner message container (`toota-inner border border-border/40 rounded-2xl p-5`).
    - Clean metadata bar with formatted timestamp and `Read` checkmark badge.
    - Full-width `toota-pill` close button with hover feedback.
- **Verification**:
  - TypeScript (`tsc --noEmit`): 0 errors.
  - ESLint: 0 errors, 0 warnings.

### 19. Super Admin Platform UI Modernization (Micro-Badges & Baseline Metrics)
- **Status Indicators -> Crisp Outlined Micro-Badges**:
  - Replaced legacy `rounded-full` pastel pill badges across [`AdminsTable.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/owner-platform/src/components/admins/AdminsTable.tsx), [`AdminDetailView.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/owner-platform/src/components/admins/AdminDetailView.tsx), and [`SubscriptionsTable.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/owner-platform/src/components/subscriptions/SubscriptionsTable.tsx):
    - Container: `inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-zinc-200 dark:ring-zinc-800`.
    - Labels: Sentence case (`Active`, `Pending`, `Inactive`, `Banned`, `Expired`, `Cancelled`, `Verified`, `Unverified`) with letter-spacing resets.
    - Active & Verified: `bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs` with a green indicator dot (`bg-emerald-500`).
    - Pending & Unverified: `bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-2xs` with an amber indicator dot (`bg-amber-500`).
    - Expired, Inactive & Banned: `bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400` with muted indicator dots (`bg-rose-500` / `bg-zinc-400`).
- **Section Headers & Total Counters -> Baseline Metrics**:
  - Refactored section headers in Gym Owners and Platform Subscriptions to single typographic baselines:
    - `<div className="flex items-baseline gap-2">`
    - Title: `text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100`
    - Inline counter: `font-mono text-xs text-zinc-400 dark:text-zinc-500 tabular-nums` (e.g., `/ <total> total`).
- **Plan Modals Form Alignment**:
  - Added dedicated uppercase `MAX MEMBERS` label next to `PLAN IDENTITY` in [`AddPlanModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/owner-platform/src/components/plans/AddPlanModal.tsx) and [`EditPlanModal.tsx`](file:///Users/eljamaaouyayman/Desktop/projects/frontend-ael-jama/owner-platform/src/components/plans/EditPlanModal.tsx).
- **Verification**:
  - TypeScript: 0 errors across `owner-platform` and `frontend`.
  - ESLint: 0 errors, 0 warnings.

## Verification
- TypeScript (`tsc --noEmit`): 0 errors.
- ESLint (`eslint`): 0 errors, 0 warnings across all rebuilt pages.

