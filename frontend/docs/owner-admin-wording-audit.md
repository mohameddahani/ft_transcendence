# Owner/admin wording audit

Date: 2026-11-13. Scope: application-owned files inside `frontend/` only; no backend, separate owner platform, dependencies, generated output, or actual environment secrets were inspected. Existing `package-lock.json` edits were preserved.

## Role definitions and result

- **ADMIN:** administrator of a sports club or gym.
- **STAFF:** added by an admin to help manage that club.
- **MEMBER:** added by an admin or staff member to use the member platform.
- **OWNER:** owner of the SaaS, using a separate platform.

Corrected 25 wording occurrences, including four translation values in each of English, French, and Arabic. Reviewed navigation, forms, dialogs, notifications/toasts, accessibility text, metadata, legal/licensing copy, and remaining matches against their frontend workflows. Technical identifiers, roles, permissions, API paths, payloads, storage keys, styling, and RTL behavior were preserved. The existing translation key `gymOwner` is intentionally retained; its displayed values now say administrator.

## Wording changes

Paths are relative to `frontend/`; line numbers refer to the final files. Text columns show the changed phrase, not necessarily the entire source line. Translation rows identify the language and key in the reason.

| File | Final line | Previous text | Replacement text | Reason |
| --- | ---: | --- | --- | --- |
| `src/components/landing/constants.ts` | 16 | Club admin or owner | Club admin | Login option targets `/login`, the club admin portal. |
| `src/utils/constants.ts` | 16 | Club admin or owner | Club admin | Same login option in the older landing component set. |
| `src/components/auth/LoginForm.tsx` | 124 | owner@yourclub.com | admin@yourclub.com | Admin sign-in email example. |
| `src/components/auth/LoginForm.tsx` | 186 | Gym owner? | Gym administrator? | Existing `gymOwner` translation fallback; registration creates an admin account. |
| `src/components/auth/ForgotPasswordForm.tsx` | 87 | owner@yourclub.com | admin@yourclub.com | Email example in the admin recovery branch. |
| `src/components/auth/RegisterForm.tsx` | 139 | For club owners | For club admins | Existing `registerBadge` translation fallback; uses `registerAdmin`. |
| `src/components/auth/illustrations.tsx` | 385 | Create your owner account | Create your admin account | Registration checklist illustration describes club setup. |
| `src/app/register/page.tsx` | 6 | Create your Sportium owner account | Create your Sportium admin account | Registration metadata describes the same admin account. |
| `src/app/(portal)/assistant/documents/page.tsx` | 78 | Only the gym owner can manage documents. | Only the gym administrator can manage documents. | Local forbidden-message fallback; `src/proxy.ts` restricts this route to ADMIN. |
| `src/app/(portal)/assistant/documents/page.tsx` | 237 | / Owner Admin | / Admin, translated through existing `t("admin", "Admin")` | Correct role label with existing English/French/Arabic translations. |
| `src/lib/i18n.ts` | 19 | For club owners | For club admins | English `registerBadge`; club admin registration. |
| `src/lib/i18n.ts` | 801 | Gym Administrator or Owner? | Gym Administrator? | English `areYouAdmin`; removes conflated roles. |
| `src/lib/i18n.ts` | 837 | Gym owner? | Gym administrator? | English `gymOwner`; club admin registration prompt. |
| `src/lib/i18n.ts` | 922 | Only the gym owner can manage documents | Only the gym administrator can manage documents | English `forbiddenStaffNotice`; admin document management. |
| `src/lib/i18n.ts` | 1263 | Pour les propriétaires de clubs | Pour les administrateurs de clubs | French `registerBadge`. |
| `src/lib/i18n.ts` | 2045 | Administrateur ou propriétaire de salle ? | Administrateur de salle ? | French `areYouAdmin`. |
| `src/lib/i18n.ts` | 2081 | Propriétaire de salle ? | Administrateur de salle ? | French `gymOwner`. |
| `src/lib/i18n.ts` | 2166 | Seul le propriétaire de la salle peut gérer les documents | Seul l'administrateur de la salle peut gérer les documents | French `forbiddenStaffNotice`. |
| `src/lib/i18n.ts` | 2507 | لأصحاب الأندية | لمسؤولي الأندية | Arabic `registerBadge`. |
| `src/lib/i18n.ts` | 3289 | مسؤول أو مالك النادي؟ | مسؤول النادي؟ | Arabic `areYouAdmin`. |
| `src/lib/i18n.ts` | 3325 | صاحب نادٍ رياضي؟ | مسؤول نادٍ رياضي؟ | Arabic `gymOwner`. |
| `src/lib/i18n.ts` | 3410 | يمكن لمالك الصالة الرياضية فقط إدارة المستندات | يمكن لمسؤول الصالة الرياضية فقط إدارة المستندات | Arabic `forbiddenStaffNotice`. |
| `src/app/text.txt` | 158 | Predictive analytics and automated insights for owners. | Predictive analytics and automated insights for club admins. | Clear club-management feature copy in an unreferenced landing draft. |
| `src/app/text.txt` | 187 | Loved by sports club owners everywhere | Loved by sports club admins everywhere | Generic audience heading in the same draft; avoids reintroducing role confusion. |
| `docs/token-transfers.md` | 3 | Member and gym-owner marketplace screens | Member and club-admin marketplace screens | Existing user guide describes the admin marketplace. |

## Legitimate SaaS-owner references preserved

- `src/lib/i18n.ts:1243`, `:2487`, `:3731` and `src/app/(portal)/gymflow-subscription/page.tsx:764`: `howLicensingWorksDesc` describes SaaS licensing provisioned by the Sportium owner/platform operator, not club administration.
- `src/components/legal/PrivacyPolicyView.tsx:143`, `:363`, `:400`: platform ownership, platform-level information, and access, distinguished from club admins.
- `src/components/legal/TermsOfServiceView.tsx:183`, `:230`, `:272`, `:459`: SaaS-owner authentication, platform plans, administrator subscriptions, and administrator account status.
- `src/app/api/auth/admins/refresh/route.ts:37`: “Owner accounts are not permitted on this platform.” The surrounding branch explicitly rejects `OWNER`; this is a legitimate SaaS-owner message.
- `README.md` references to the separate owner application, its subscriptions/search/profile, and platform-owner role were preserved. Its links were not followed outside `frontend/`.

Technical matches were also preserved: `Owner` role types, `/api/owners/...` helpers/proxies and cache keys, blockchain ownership methods/events, `gymOwner` contract fields, merchant wallet variables, and comments. These are not displayed club-role labels. For example, `PurchasesTab.tsx:72` displays the `gymOwner` address under the already-correct “Merchant Wallet” heading.

## Ambiguities left unchanged

`src/app/text.txt` contains an unreferenced landing draft. Its testimonial references may describe real business ownership rather than an application role; no frontend contract establishes that the speakers are admins:

| Location | Preserved text | Reason |
| --- | --- | --- |
| `src/app/text.txt:193` | Gym Owner testimonial | Ambiguous testimonial identity/occupation. |
| `src/app/text.txt:206` | Owner, Iron Peak Fitness | Attributed business title; changing it would assert an unverified role. |
| `src/app/text.txt:212` | Studio Owner testimonial | Ambiguous testimonial identity/occupation. |

No unresolved locally authored owner/admin wording was found in the active UI. Backend-provided messages, including the document API's preferred `err.detail`, are still displayed unchanged; their wording could not be established without inspecting or calling the out-of-scope services.

## Role logic requiring separate review

No inspected frontend logic maps ADMIN to OWNER. `UserContext.tsx:158` and `useCurrentUser.ts:70` still represent OWNER as a separate role, whereas `src/proxy.ts:92` accepts ADMIN/STAFF/MEMBER. Owner statistics helpers/proxies also remain inside this frontend. This is a boundary-consistency review item, not a confirmed authorization defect; no role handling was changed. Auth/profile helper comments mentioning “Admin / Owner” are technical documentation and do not establish shared authorization.

## Validation and limitations

- Repeated case-insensitive searches across application-owned frontend text, including `owner`, French `propriétaire`, and Arabic `مالك`, `صاحب`, and `أصحاب` variants. Remaining matches were classified above; no blind replacement was used.
- Executed an in-memory TypeScript resource extraction and real i18next resolution check. All 1,135 keys per language are retained; exactly the four intended values changed in each language. Those four keys plus existing `admin` resolve in English, French, and Arabic without fallback or exposed keys. All unrelated values, including SaaS licensing text, match the pre-edit source.
- `npm run lint`: exit 0 before and after; identical four existing unused-disable warnings in `components/carousel/Carousel.tsx:448`, `components/features/Features.tsx:246`, `components/product-preview/ProductPreview.tsx:201`, and `components/ui/carousel.tsx:98` (all under `src/`). No automatic fixes.
- `./node_modules/.bin/tsc --noEmit --incremental false`: exit 2 before and after with the same four pre-existing errors: missing `next-themes` in `src/components/header/Header.tsx:5` and `src/components/theme/theme-provider.tsx:6`; unsupported `icon-sm` in `src/components/ui/carousel.tsx:179` and `:209`. No new diagnostics.
- `git diff --check`: passed. Diff inspection confirmed focused text changes and reuse of the existing admin translation; authentication, API contracts, and styles were not edited.
- Browser discovery reported “The browser access host is unavailable”; affected screens were not exercised. Bundled assistant/front-desk screenshots were inspected only as static references, not as evidence of the changed UI. No build, dependency installation, wallet operation, or backend request was run.

## Manual verification

1. At `/`, check the admin login option in the header/footer. At `/login` and `/admin/login`, check the admin email example and registration prompt; at `/forgot-password` and `/admin/forgot-password`, check the admin email example.
2. At `/register`, check the admin badge, desktop setup illustration, and metadata description. The illustration keeps the existing decorative English text convention.
3. Repeat translated prompts/badges in English, French, and Arabic. At `/assistant/documents`, sign in as an admin and verify the translated admin label; a forbidden response without a service detail should use the corrected administrator notice.
4. Check desktop/mobile widths and both themes, Arabic RTL, and the unchanged SaaS-owner wording in licensing help and legal pages. Reconcile the three draft testimonial identities before reusing that draft.

Task record: [2026-11-13 owner/admin wording](changes/2026-11-13-owner-admin-wording/README.md).
