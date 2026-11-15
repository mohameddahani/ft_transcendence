### Payments — Search and Date Filters

Admin:
```http
GET /api/admins/payments?page=1&limit=20&search=amine&from=2026-11-01T00:00:00.000Z&to=2026-11-14T23:59:59.999Z
```

Staff:
```http
GET /api/staffs/payments?page=1&limit=20&search=amine&from=2026-11-01T00:00:00.000Z&to=2026-11-14T23:59:59.999Z
```

Member:
```http
GET /api/members/payments?page=1&limit=20&from=2026-11-01T00:00:00.000Z&to=2026-11-14T23:59:59.999Z
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
| `search` | No | Admin/Staff only: case-insensitive search in member’s first name, last name, or username |
| `from` | No | Inclusive start timestamp, filtering `paidAt` |
| `to` | No | Inclusive end timestamp, filtering `paidAt` |

### Response

Returns an array of payments, ordered by `paidAt`, newest first.

Each payment contains:
- `id`
- `adminId`
- `member` — public member details
- `amount`
- `paidAt`
- `createdAt`
- `updatedAt`

Date fields are ISO timestamp strings.

Admin/Staff receive payments within their club. Members receive only their own payments.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- Omit optional parameters when unused.
- Reset `page` to `1` when search or dates change.
- Debounce search by approximately 300 ms.
- Ensure `from` is before or equal to `to`.
- Send explicit timestamps. `Z` means UTC.
- A date-only `to`, such as `2026-11-14`, means midnight at the start of that day.
- Invalid date input returns `400 Bad Request`.
- Existing account, subscription, and membership access checks still apply.