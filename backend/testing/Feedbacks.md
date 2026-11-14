### Feedback Search and Filters

Use the endpoint matching the logged-in role:

- Admin → `GET /api/admins/feedbacks`
- Staff → `GET /api/staffs/feedbacks`
- Member → `GET /api/members/feedbacks`

Send the corresponding access token:

```http
Authorization: Bearer <accessToken>
```

### Query Parameters

| Parameter | Required | Description |
|---|---|---|
| `page` | Yes | Page number, starting from `1` |
| `limit` | Yes | Records per page |
| `search` | No | Case-insensitive search in feedback content and the author’s first name, last name, or username |
| `feedbackStatus` | No | `OPEN`, `IN_REVIEW`, `RESOLVED`, or `DISMISSED` |
| `sentimentType` | No | `NEGATIVE`, `NEUTRAL`, or `POSITIVE` |
| `rating` | No | Exact integer rating |

### Request Examples

Admin:
```http
GET /api/admins/feedbacks?page=1&limit=20&search=equipment&feedbackStatus=OPEN&sentimentType=NEGATIVE&rating=2
```

Staff:
```http
GET /api/staffs/feedbacks?page=1&limit=20&search=equipment&feedbackStatus=OPEN&sentimentType=NEGATIVE&rating=2
```

Member:
```http
GET /api/members/feedbacks?page=1&limit=20&search=equipment&feedbackStatus=OPEN&sentimentType=NEGATIVE&rating=2
```

### Response

All endpoints return arrays, ordered by creation date, newest first. Examples below show relevant fields only.

Admin and Staff:
```json
[
  {
    "id": "feedback-uuid",
    "content": "The equipment needs repair.",
    "rating": 2,
    "feedbackStatus": "OPEN",
    "sentimentType": "NEGATIVE",
    "_count": {
      "likes": 7
    }
  }
]
```

Read fields using:
```ts
item.content
item.rating
item.feedbackStatus
item.sentimentType
item._count.likes
```

Member:
```json
[
  {
    "feedbackData": {
      "id": "feedback-uuid",
      "content": "The equipment needs repair.",
      "rating": 2,
      "feedbackStatus": "OPEN"
    },
    "likeCount": 7,
    "isLiked": true
  }
]
```

Read fields using:
```ts
item.feedbackData.content
item.feedbackData.rating
item.feedbackData.feedbackStatus
item.likeCount
item.isLiked
```

`isLiked` indicates whether the logged-in member liked that feedback. The member response does not currently include sentiment fields.

### Frontend Behavior

- All roles receive feedback from their own club. Members can see other members’ feedback within that club.
- Omit optional parameters when unused. For “All,” omit the filter rather than sending `ALL`.
- Filters combine: a record must match every selected filter.
- Reset `page` to `1` when search or filters change.
- Debounce search by approximately 300 ms.
- No matching records returns `[]`.
- Responses contain no total-count or pagination metadata.