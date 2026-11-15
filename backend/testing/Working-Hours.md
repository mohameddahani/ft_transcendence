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


### Special Hours — Date Range Filters

Admin:
```http
GET /api/admins/special-hours?page=1&limit=20&from=2026-12-01&to=2026-12-31
```

Staff:
```http
GET /api/staffs/special-hours?page=1&limit=20&from=2026-12-01&to=2026-12-31
```

Member:
```http
GET /api/members/special-hours?page=1&limit=20&from=2026-12-01&to=2026-12-31
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
| `from` | No | Start of the selected range, in `YYYY-MM-DD` format |
| `to` | No | End of the selected range, in `YYYY-MM-DD` format |

### Filter Behavior

Returns special-hour records that overlap the selected range:

- A record’s `endDate` must be on or after `from`.
- A record’s `startDate` must be on or before `to`.
- Both boundaries are inclusive.
- Omit both dates to apply no date filter.

To find records covering one specific day:
```text
?from=2026-12-25&to=2026-12-25
```

### Response

Returns an array of the authenticated user’s club special-hour records, ordered by `startDate`, earliest first.

Each record contains:
- `id`
- `adminId`
- `startDate`
- `endDate`
- `startTime` — nullable `HH:mm` string
- `endTime` — nullable `HH:mm` string
- `createdAt`
- `updatedAt`

Date fields are serialized as ISO strings. Display `startDate` and `endDate` as calendar dates without shifting their date through timezone conversion.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- Send date-only values using `YYYY-MM-DD`.
- Omit unused date parameters.
- Ensure `from` is before or equal to `to`.
- Reset `page` to `1` when dates change.
- Unparseable dates or a reversed date range return `400 Bad Request`.
- Existing account, subscription, and membership access checks still apply.