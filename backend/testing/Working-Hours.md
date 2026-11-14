### Working Hours — Day and Open/Closed Filters

Admin:
```http
GET /api/admins/working-hours?page=1&limit=7&dayOfWeek=1&isClosed=false
```

Staff:
```http
GET /api/staffs/working-hours?page=1&limit=7&dayOfWeek=1&isClosed=false
```

Member:
```http
GET /api/members/working-hours?page=1&limit=7&dayOfWeek=1&isClosed=false
```

Send the corresponding role’s access token:
```http
Authorization: Bearer <accessToken>
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page; use `7` for a weekly schedule |
| `dayOfWeek` | No | Integer from `1` (Monday) to `7` (Sunday) |
| `isClosed` | No | `true` for closed days; `false` for open days |

Day values:
```text
1 = Monday
2 = Tuesday
3 = Wednesday
4 = Thursday
5 = Friday
6 = Saturday
7 = Sunday
```

### Response

Returns an array of the authenticated user’s club working-hour records, ordered Monday–Sunday.

Example:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "adminId": "550e8400-e29b-41d4-a716-446655440001",
    "dayOfWeek": 1,
    "startTime": "09:00",
    "endTime": "18:00",
    "isClosed": false,
    "createdAt": "2026-11-14T10:00:00.000Z",
    "updatedAt": "2026-11-14T10:00:00.000Z"
  }
]
```

`startTime` and `endTime` are clock-time strings in `HH:mm` format.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- “All days” → omit `dayOfWeek`.
- “All statuses” → omit `isClosed`.
- “Open” → `isClosed=false`.
- “Closed” → `isClosed=true`.
- Filters combine.
- Reset `page` to `1` when filters change.
- When `isClosed=true`, display “Closed” instead of opening hours.
- Invalid day values or `isClosed` values return `400 Bad Request`.