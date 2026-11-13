# Club administrator wording correction

Date: 2026-11-13.

Correct references that call a club administrator “owner,” while preserving the separate SaaS-owner role. Login/registration, recovery examples, the setup illustration, document-management copy, English/French/Arabic values, and clear legacy copy now use admin/administrator. Genuine SaaS-owner references, technical identifiers, API contracts, permissions, and styles remain unchanged.

## Files changed

Paths are relative to `frontend/`; all listed lines are final line numbers. The [audit](../../owner-admin-wording-audit.md) records all 25 previous/replacement phrases, reasons, preserved references, and ambiguities.

| File | Final lines | Change |
| --- | --- | --- |
| `src/components/landing/constants.ts` | 16 | Active landing login label. |
| `src/utils/constants.ts` | 16 | Older landing login label. |
| `src/components/auth/LoginForm.tsx` | 124, 186 | Admin email example and `gymOwner` fallback. |
| `src/components/auth/ForgotPasswordForm.tsx` | 87 | Admin recovery email example. |
| `src/components/auth/RegisterForm.tsx` | 139 | `registerBadge` fallback. |
| `src/components/auth/illustrations.tsx` | 385 | Setup checklist account label. |
| `src/app/register/page.tsx` | 6 | Admin account metadata. |
| `src/app/(portal)/assistant/documents/page.tsx` | 78, 237 | Administrator notice and existing translated `admin` label. |
| `src/lib/i18n.ts` | 19, 801, 837, 922, 1263, 2045, 2081, 2166, 2507, 3289, 3325, 3410 | `registerBadge`, `areYouAdmin`, `gymOwner`, `forbiddenStaffNotice` values in en/fr/ar. |
| `src/app/text.txt` | 158, 187 | Two clear club-management phrases in an unused draft. |
| `docs/token-transfers.md` | 3 | Marketplace guide role label. |
| `docs/owner-admin-wording-audit.md` | 1 | Requested full wording audit, checks, manual steps, and limitations. |
| `docs/changes/2026-11-13-owner-admin-wording/README.md` | 1 | This task record. |

## Validation

Repeated the owner/translated-equivalent search and inspected the diff. Real i18next checks confirmed all changed keys and the reused `admin` key resolve in all three languages without fallback, with all keys and unrelated values preserved. Lint passed with the same four existing warnings. TypeScript retained exactly the same four pre-existing errors involving `next-themes` and carousel `icon-sm` sizes. `git diff --check` passed. No automatic fixes, installs, build, or backend changes.

Browser access was unavailable, so no live visual/interactive checks were performed. Follow the audit's manual steps for landing/login/recovery/registration/document screens, languages/RTL, widths, and themes.

## Limitations

Three testimonial references in the unused `src/app/text.txt` draft remain ambiguous and unchanged. Service-provided text is forwarded unchanged. OWNER representations/statistics helpers remain a separate role-boundary review item; no ADMIN-to-OWNER remapping was found. Existing `package-lock.json` edits were preserved.
