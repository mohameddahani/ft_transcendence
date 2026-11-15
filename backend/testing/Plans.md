### Plans — Search and Active Status Filter

Public endpoint used by the landing page, pricing page, Owner platform, and other plan listings.

No access token is required.

```http
GET /api/plans?page=1&limit=20&search=pro&isActive=true
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Case-insensitive search in plan name or description |
| `isActive` | No | `true` for active plans; `false` for inactive plans |

### Response

Returns an array of plans, ordered newest first.

Each plan contains:
- `id`
- `planName`
- `maxMembers`
- `description` — nullable
- `isActive`
- `durations`
- `createdAt`
- `updatedAt`

Each duration includes its ID, duration days, price, active status, parent plan ID, and timestamps.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Usage

- Landing/pricing pages → request `isActive=true`.
- Owner listing, all plans → omit `isActive`.
- Owner listing, inactive plans → request `isActive=false`.
- Omit `search` when empty.
- Search and status filters combine.
- Reset `page` to `1` when filters change.
- Debounce search by approximately 300 ms.
- Invalid `isActive` values return `400 Bad Request`.

### Duration Status

The `isActive` query filters plans only.

The `durations` array includes both active and inactive durations. When presenting available purchase options, display only durations where `isActive=true`.