# Sportium sign-in pages

The four sign-in pages in the new Sportium design: `/login` (admin), `/staff/login`, `/member/login` and
`/register`. The pages work the same as before. The fields, validation, API calls, redirects, toasts and links have
not changed. What changes is the look, plus the Sportium name in the browser tab titles.

Made on top of `frontend-ael-jama` at `15fabf5` (9 November). None of the 8 files it replaces has changed on that
branch since. If you edited one of them on your side after that, merge that file by hand instead of copying it.

## Install (3 steps)

1. **Copy the files.** From the folder that holds this README:

   ```bash
   rsync -a frontend/ <path to the repo>/frontend/
   ```

   This adds 8 files and replaces 8. It deletes nothing. No new npm package is needed.

2. **Add the 12 new texts** to `frontend/src/lib/i18n.ts`, from `translations-to-add.md` (one block each for en,
   fr and ar). Without them the pages still work, but French and Arabic show those texts in English.

3. **Check:**

   ```bash
   cd frontend
   npx tsc --noEmit && npm run lint
   npm run dev
   ```

   Then open http://localhost:3001/login, `/staff/login`, `/member/login` and `/register`. Try light/dark and
   en/fr/ar with the buttons at the top right.

## The files

### New (8)

| File | What it has |
|---|---|
| `src/components/auth/AuthShell.tsx` | The frame shared by the four pages. The language and theme buttons sit at the top right. The dark panel on the left (screens 1024 px and wider) holds the logo, the page's drawing and the title, with "Built for every sports club." underlined in lime. The card on the right holds the form, then the links to the other portals ("Not your portal? Sign in to yours") and the copyright. Also exports `PortalBadge`, the small pill with a lime icon above each title. Props: `panelTitle`, `illustration`, `portals`, `wide` (the register card is wider). |
| `src/components/auth/authStyles.ts` | The Tailwind classes the four forms share: label, input, select, the icon inside the field, error text, the show-password eye, the "Forgot password?" link, the submit button with its lime arrow, and the lime underline. Change the look of the inputs here once and all four forms follow. |
| `src/components/auth/illustrations.tsx` | The four drawings for the left panel, made in HTML and Tailwind (no image files, except the member photos). **Admin:** last month's revenue in MAD, the club overview (members, active, today, a week of visits), a check-in, and the renewals this week. **Staff:** the front desk, with today's check-ins, the club open, a QR pass being scanned and the visits at the desk. **Member:** a collage of the 4 photos (strength, boxing, swimming, tennis) with class captions, plus the member pass. **Register:** the club set-up checklist, a new plan, the opening hours and an invited front-desk staff member. They are decoration (`aria-hidden`), with English labels like a screenshot, and always drawn left to right, so Arabic doesn't reorder them. |
| `src/components/brand/SportiumLogo.tsx` | The Sportium logo (the italic ST mark and the name) as an inline SVG component. Its colour follows the text colour (`currentColor`): `className="h-8 text-white"` on dark, `text-[var(--toota-ink)]` on light. |
| `public/auth/member/strength.jpg` | Photo for the member drawing: weightlifting (900×600, 93 KB). |
| `public/auth/member/boxing.jpg` | Photo: boxing bag class (900×528, 101 KB). |
| `public/auth/member/swimming.jpg` | Photo: swimming (900×600, 187 KB). |
| `public/auth/member/tennis.jpg` | Photo: tennis serve (600×900, 167 KB; the page shows the upper body). |

### Replaced (8)

| File | What changed |
|---|---|
| `src/app/login/page.tsx` | Tab title "Admin sign in \| Sportium" and a new description. Nothing else. |
| `src/app/staff/login/page.tsx` | Tab title "Staff sign in \| Sportium" and a new description. |
| `src/app/member/login/page.tsx` | Tab title "Member sign in \| Sportium" and a new description. |
| `src/app/register/page.tsx` | Tab title "Register your club \| Sportium" and a new description. |
| `src/components/auth/LoginForm.tsx` | The admin form inside `AuthShell` with the admin drawing. Same form code as before, everything above `return (` unchanged (email, password, submit, redirect). The links to the member and staff portals moved into the shell's portal buttons. |
| `src/components/auth/StaffLoginForm.tsx` | The same for staff (username, password), with the front-desk drawing and "No account yet? Ask your club's administrator." |
| `src/components/auth/MemberLoginForm.tsx` | The same for members (username, password), with the photo collage and "No account yet? Your club creates it when you join." |
| `src/components/auth/RegisterForm.tsx` | The owner sign-up in the wide card, with the set-up drawing. Same fields, validation, password strength meter and terms checkbox. The only code change is the strength meter's colours: red, amber, green and now lime for a strong password (it was indigo), moved above the component. |

## Images

- The only image files are the **4 member photos** in `public/auth/member/` (548 KB in total). They're used only on
  `/member/login`, through `next/image`. They're free under the Unsplash License; sources are in `CREDITS.md`.
- The **logo** is code (`SportiumLogo.tsx`), not an image file.
- The **admin, staff and register drawings** are code too (`illustrations.tsx`).

## Screenshots

`screenshots/` has each page in light, dark, phone (390 px) and Arabic, taken from your branch with these files
copied in and the translations added.

## Good to know

- On phones and tablets (under 1024 px) only the logo and the card show. The drawing panel is desktop only.
- Checked on your branch with these files: `tsc` 0 errors, `eslint` 0 errors, the 16 screenshots with no sideways
  scroll and no broken image.
- Seen while testing, but not caused by these files: in `npm run dev`, when the saved language isn't English, Next
  shows a hydration warning from `LanguageSwitcher.tsx`. The server renders "en" and the browser renders the saved
  language. It shows up as the red "Issues" bubble in dev mode.
