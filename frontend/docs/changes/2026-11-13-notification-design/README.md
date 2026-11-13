# Notification UI

| File (relative to frontend/) | Final lines |
| --- | --- |
| `src/components/notifications/NotificationDropdown.tsx` | 167, 173, 197, 200, 268 |
| `src/components/notifications/NotificationDetailModal.tsx` | 151, 161, 191, 208 |
| `docs/changes/2026-11-13-notification-design/README.md` | 1 |

- Solid surfaces, clearer unread styling, responsive sizing, keyboard-accessible items.
- Lint, diff, mocked Admin/Member read/open/close checks, and CSS compilation: passed.
- TypeScript: same four existing `next-themes` / `icon-sm` errors.
- Browser unavailable; visual checks pending. APIs and polling unchanged.
- Verify: light/dark, mobile/desktop, RTL, unread/read items, mark all, detail scrolling.
