### Subscriptions — Search and Filters

Owner:
```http
GET /api/owners/subscriptions?page=1&limit=20&search=sportium&subscriptionStatus=ACTIVE&planId=550e8400-e29b-41d4-a716-446655440000
```

Admin:
```http
GET /api/admins/subscriptions/all?page=1&limit=20&subscriptionStatus=EXPIRED&planId=550e8400-e29b-41d4-a716-446655440000
```

Send the corresponding role’s access token:
```http
Authorization: Bearer <accessToken>
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Owner only: search subscription ID, user’s first name, last name, username, email, or company name |
| `subscriptionStatus` | No | `ACTIVE`, `EXPIRED`, or `CANCELLED` |
| `planId` | No | UUID of the selected platform plan |

Search is case-insensitive and supports partial matches.

### Response

Both endpoints return arrays ordered newest first.

Owner:
- Returns matching subscriptions across the platform.
- Each record includes subscription fields and related `user`, `plan`, and `planDuration` objects.

Admin:
- Returns only the authenticated admin’s subscriptions.
- Each record contains:
  - `plan`
  - `planDuration`
  - `subscriptionStatus`
  - `startedAt`
  - `expiresAt`
  - `amount`

Date fields are ISO timestamp strings.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- Omit optional parameters when unused.
- “All statuses” → omit `subscriptionStatus`.
- “All plans” → omit `planId`.
- Filters combine: each result must match every selected filter.
- Reset `page` to `1` when filters change.
- Debounce Owner search by approximately 300 ms.
- Invalid status or plan UUID values return `400 Bad Request`.

The Admin endpoint remains subject to existing account, subscription, and plan access checks. Selecting an expired or cancelled status does not bypass those checks.