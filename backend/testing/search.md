###owner:
-


###admin:
-


###staff:
-


### Member

- Attendances → `GET /api/members/attendances?page=1&limit=20&attendanceMethod=QR_CODE&from=2026-11-01T00:00:00.000Z&to=2026-11-14T23:59:59.999Z`

Required: `page`, `limit`.
Optional: `attendanceMethod` (`QR_CODE` or `MANUAL`), `from`, `to`.

Returns an array of the authenticated member’s attendance records, or `[]` when no records match.


