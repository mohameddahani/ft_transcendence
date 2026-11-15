### Users — Search and Filters

Owner:
```http
GET /api/owners/users?page=1&limit=20&search=sportium&accountStatus=ACTIVE&isAccountVerified=true
```

Send the Owner access token:
```http
Authorization: Bearer <ownerAccessToken>
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Search first name, last name, username, email, phone number, or company name |
| `accountStatus` | No | `ACTIVE`, `PENDING`, or `BANNED` |
| `isAccountVerified` | No | `true` for verified accounts; `false` for unverified accounts |

Text search ignores case. Phone search matches the stored phone-number text.

### Response

Returns an array of users, excluding `OWNER` and `MEMBER` roles, ordered newest first.

Each record includes the backend-selected user fields and a `subscription` array. Each subscription includes its related `plan`.

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- Omit optional parameters when unused.
- “All statuses” → omit `accountStatus`.
- “All verification states” → omit `isAccountVerified`.
- “Verified” → `isAccountVerified=true`.
- “Unverified” → `isAccountVerified=false`.
- Filters combine: each result must match every selected filter.
- Reset `page` to `1` when filters change.
- Debounce search by approximately 300 ms.
- Invalid status or verification values return `400 Bad Request`.