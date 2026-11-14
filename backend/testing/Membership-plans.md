### Membership Plans — Search and Filters

Admin:
```http
GET /api/admins/membership-plans?page=1&limit=20&search=basic&isActive=true
```

Staff:
```http
GET /api/staffs/membership-plans?page=1&limit=20&search=basic&isActive=true
```

Member:
```http
GET /api/members/membership-plans?page=1&limit=20
```

Member support for `search` and `isActive` must be confirmed before using those parameters.

Send the corresponding role’s access token:
```http
Authorization: Bearer <accessToken>
```

### Admin/Staff Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Case-insensitive search in plan name or description |
| `isActive` | No | `true` for active plans; `false` for inactive plans |

Omit `isActive` to return both active and inactive plans. Values other than `true` or `false` return `400 Bad Request`.

### Admin/Staff Response

Returns an array of membership plans belonging to the authenticated user’s club.

Each plan includes:
- `id`
- `adminId`
- `planName`
- `description`
- `weeklyVisitLimit`
- `isActive`
- `membershipPlanDurations`
- `createdAt`
- `updatedAt`

`membershipPlanDurations` includes both active and inactive durations. Filtering a plan’s status does not filter its durations.

No matching plans returns `[]`. There is no total-count or pagination metadata.

### Frontend Behavior

- Reset `page` to `1` when filters change.
- Debounce search by approximately 300 ms.
- “All statuses” → omit `isActive`.
- “Active” → `isActive=true`.
- “Inactive” → `isActive=false`.