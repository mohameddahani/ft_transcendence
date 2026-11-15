### Memberships — Search and Filters

Admin:
```http
GET /api/admins/memberships?page=1&limit=20&search=amine&membershipStatus=ACTIVE&membershipPlanId=550e8400-e29b-41d4-a716-446655440000
```

Staff:
```http
GET /api/staff/memberships?page=1&limit=20&search=amine&membershipStatus=ACTIVE&membershipPlanId=550e8400-e29b-41d4-a716-446655440000
```

Member:
```http
GET /api/members/memberships/all?page=1&limit=20&membershipStatus=EXPIRED&membershipPlanId=550e8400-e29b-41d4-a716-446655440000
```

The Member endpoint ends with `/all`, matching `@Get('all')`.

Send the corresponding role’s access token:
```http
Authorization: Bearer <accessToken>
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Admin/Staff only: case-insensitive search in member’s first name, last name, or username |
| `membershipStatus` | No | `ACTIVE`, `EXPIRED`, or `CANCELLED` |
| `membershipPlanId` | No | UUID of the selected membership plan |

### Response

Returns an array of matching memberships, ordered newest first.

Admin/Staff records contain:
- `id`
- `member`
- `membershipPlan`
- `membershipPlanDuration`
- `membershipStatus`
- `startDate`
- `expiresAt`
- `createdAt`
- `updatedAt`

Member records contain:
- `membershipPlan`
- `membershipPlanDuration`
- `membershipStatus`
- `startDate`
- `expiresAt`

Date values are ISO timestamp strings.

Admin/Staff receive memberships within their club. Members receive only their own memberships.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- Omit optional parameters when unused.
- For “All,” omit the parameter rather than sending `ALL`.
- Filters combine: each result must match every selected filter.
- Reset `page` to `1` when filters change.
- Debounce search by approximately 300 ms.
- Invalid status or plan UUID values return `400 Bad Request`.