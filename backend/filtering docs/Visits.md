### Today’s Visits — Search and Status Filter

Admin:
```http
GET /api/admins/visits/today?page=1&limit=20&search=amine&visitStatus=READY
```

Staff:
```http
GET /api/staffs/visits/today?page=1&limit=20&search=amine&visitStatus=READY
```

Send the corresponding Admin or Staff access token:
```http
Authorization: Bearer <accessToken>
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Case-insensitive search in member’s first name, last name, or username |
| `visitStatus` | No | `READY`, `CHECKED_IN`, `CANCELLED`, or `EXPIRED` |

### Response

Returns an array of the club’s visits scheduled for today, ordered by visit time, earliest first.

Each record contains:
- `id`
- `admin` — public admin details
- `member` — public member details
- `membership`
- `visitDateAndTime`
- `visitStatus`
- `createdAt`

Date fields are ISO timestamp strings.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- Omit `search` when empty.
- “All statuses” → omit `visitStatus`.
- Search and status filters combine.
- Reset `page` to `1` when filters change.
- Debounce search by approximately 300 ms.
- Invalid visit-status values return `400 Bad Request`.

“Today” is calculated using the backend server’s timezone. This endpoint does not accept a custom date range.