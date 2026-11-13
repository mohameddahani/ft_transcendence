# Route Inventory & Status

| Route | Role Access | Page Family | API Dependencies | Status | Verification |
|---|---|---|---|---|---|
| `/dashboard` | OWNER, ADMIN, STAFF, MEMBER | Dashboard | `/api/members`, `/api/membership-plans`, `/api/feedbacks` | COMPLETED | Verified |
| `/members` | OWNER, ADMIN, STAFF | List / Roster | `/api/members`, `/api/membership-plans` | COMPLETED | Verified |
| `/payments` | OWNER, ADMIN, STAFF | Financial List | `/api/payments` | COMPLETED | Verified |
| `/membership-plans` | OWNER, ADMIN | Plans & Tiers | `/api/membership-plans`, `/api/membership-plans/durations` | COMPLETED | Verified |
| `/subscriptions` | OWNER, ADMIN, STAFF | Roster | `/api/subscriptions` | PENDING | — |
| `/check-in` | OWNER, ADMIN, STAFF | Operations / Attendance | `/api/check-in` | PENDING | — |
| `/operating-hours` | OWNER, ADMIN | Settings / Hours | `/api/operating-hours` | PENDING | — |
| `/feedbacks` | OWNER, ADMIN, STAFF, MEMBER | Feedback / Reviews | `/api/feedbacks` | COMPLETED | Verified |
| `/classes` | OWNER, ADMIN, STAFF | Scheduling | `/api/classes` | PENDING | — |
| `/reports` | OWNER, ADMIN | Analytics | `/api/reports` | PENDING | — |
| `/settings` | OWNER, ADMIN | Configuration | `/api/settings` | PENDING | — |

