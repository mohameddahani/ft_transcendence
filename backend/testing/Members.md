### Members — Search and Filters

Admin:
```http
GET /api/admins/members?page=1&limit=20&search=amine&accountStatus=ACTIVE&membershipStatus=ACTIVE
```

Staff:
```http
GET /api/staffs/members?page=1&limit=20&search=amine&accountStatus=ACTIVE&membershipStatus=ACTIVE
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
| `search` | No | Case-insensitive search in first name or last name |
| `accountStatus` | No | `ACTIVE`, `PENDING`, or `BANNED` |
| `membershipStatus` | No | `ACTIVE`, `EXPIRED`, or `CANCELLED` |

### Response

Returns an array of members from the authenticated user’s club.

Each member includes the backend-selected member fields and a `memberships` array ordered newest first.

No matching members:
```json
[]
```

The response contains no total-count or pagination metadata.

### Frontend Behavior

- Omit optional parameters when unused.
- For “All,” omit the parameter rather than sending `ALL`.
- Filters combine: members must match every selected filter.
- Reset `page` to `1` when search or filters change.
- Debounce search by approximately 300 ms.

### Membership Filter Behavior

`membershipStatus` matches any membership in the member’s history.

For example, `EXPIRED` can return a member who has both an expired membership and an active membership.

The returned `memberships` array includes all of that member’s memberships, not only those matching the filter.