### Staff — Search and Filters

```http
GET /api/admins/staffs?page=1&limit=20&search=amine&accountStatus=ACTIVE
```

Send the Admin access token:
```http
Authorization: Bearer <accessToken>
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Search first name, last name, username, email, or phone number |
| `accountStatus` | No | `ACTIVE`, `PENDING`, or `BANNED` |

Text search ignores case. Phone search matches the stored phone-number text.

### Response

Returns an array of staff members belonging to the authenticated admin’s club, ordered newest first.

Each record contains the backend-selected staff fields and an `admin` object containing public admin details.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- Omit optional parameters when unused.
- “All statuses” → omit `accountStatus`.
- Search and status filters combine.
- Reset `page` to `1` when filters change.
- Debounce search by approximately 300 ms.
- Invalid account-status values return `400 Bad Request`.