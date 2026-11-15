### Notifications — Search and Filters

Admin:
```http
GET /api/admins/notifications?page=1&limit=20&search=payment&notificationType=PAYMENT_REMINDER&isRead=false
```

Member:
```http
GET /api/members/notifications?page=1&limit=20&search=payment&notificationType=PAYMENT_REMINDER&isRead=false
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
| `search` | No | Case-insensitive search in title or message |
| `notificationType` | No | `PAYMENT_REMINDER`, `MEMBERSHIP_EXPIRATION`, `SUBSCRIPTION_EXPIRATION`, or `CUSTOM` |
| `isRead` | No | `true` for read notifications; `false` for unread notifications |

### Response

Returns an array of the authenticated user’s notifications, ordered newest first.

Example showing common fields:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "notificationType": "PAYMENT_REMINDER",
    "title": "Payment reminder",
    "message": "Please check your payment details.",
    "isRead": false,
    "createdAt": "2026-11-14T10:00:00.000Z"
  }
]
```

No matches returns `[]`. Responses contain no total-count or pagination metadata.

### Frontend Behavior

- “All notifications” → omit `isRead`.
- “Read” → `isRead=true`.
- “Unread” → `isRead=false`.
- “All types” → omit `notificationType`.
- Omit `search` when empty.
- Filters combine: each result must match every selected filter.
- Reset `page` to `1` when filters change.
- Debounce search by approximately 300 ms.
- Invalid notification types or `isRead` values return `400 Bad Request`.