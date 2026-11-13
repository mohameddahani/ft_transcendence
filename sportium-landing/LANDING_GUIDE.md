# Sportium landing page: how to use it

`sportium-landing.patch` is the landing page from `frontend-mdahani` in the Sportium design. It brings the platform's
grey, white and near-black colours, the lime accents (a lime line under links on hover, a thin lime marker under key
words), the new Sportium logo and favicon, and sharp light and dark screenshots of the real platform (admin dashboard,
front desk, AI assistant).

- It was made on `frontend-mdahani` at `0573b54` (4 October), which is still that branch's latest commit. It applies
  cleanly there.
- **It is not pushed anywhere yet.** Only this file has it.
- It changes 23 files: 14 changed, 1 removed (`src/app/favicon.ico`, replaced by `src/app/icon.svg`), and 8 added (the
  logo, `landing/primitives.tsx` and the 6 screenshots in `public/preview/`).

There are two separate jobs. **A** is quick. **B** is the real work.

| Job | What you get | Effort |
|---|---|---|
| **A.** Apply the patch on `frontend-mdahani` | Dahani's landing app shows the Sportium design | 5 minutes |
| **B.** Make it the `/` page of our app (`frontend/` on `frontend-ael-jama`) | The platform's home page becomes this landing | Copy files, fix imports, add some CSS |

The landing is a separate Next app that also lives in a folder named `frontend/`, so the two branches can't simply be
merged. **B** moves only the landing's files into our app.

---

## A. Apply the patch on `frontend-mdahani`

```bash
git fetch origin
git switch frontend-mdahani            # first time: git switch -c frontend-mdahani origin/frontend-mdahani
git apply --check sportium-landing.patch && git apply sportium-landing.patch
cd frontend && npm install && npm run dev
```

Open http://localhost:3000 and check light and dark (the sun/moon button) and a phone width. Then commit only what the
patch touched (the branch is Dahani's, so push it with his OK):

```bash
git add frontend/src frontend/public
git commit -m "style(landing): Sportium design, logo, lime accents and platform screenshots"
git push origin frontend-mdahani
```

---

## B. Make it the home page of our app

All paths below are from the repo root. `L` is the landing app with the patch applied, and `F` is our app.

### B1. Get the landing files

If job A is done and pushed, use the branch as it is. If not, apply the patch in the extra folder:

```bash
git fetch origin
git worktree add ../landing-src origin/frontend-mdahani
git -C ../landing-src apply "$PWD/sportium-landing.patch"     # skip this line if A was pushed
L=../landing-src/frontend
F=frontend
```

### B2. Install the 5 packages the landing uses

```bash
cd $F && npm install motion@^14.0.0 embla-carousel-react@^8.6.0 embla-carousel-auto-scroll@^8.6.0 clsx@^2.1.1 tailwind-merge@^3.6.0 && cd ..
```

`next-themes` is **not** needed: the landing uses our theme button instead (B4).

### B3. Copy the files

Everything goes under `src/components/landing/`, so nothing clashes with our `components/ui/button.tsx`, `card.tsx`
and the others.

```bash
mkdir -p $F/src/components/landing/ui $F/src/components/landing/motion-primitives $F/src/components/brand $F/public/preview
for d in header hero product-preview carousel features how-it-works pricing faq cta footer; do cp -R $L/src/components/$d $F/src/components/landing/; done
cp $L/src/components/landing/motion.tsx $L/src/components/landing/primitives.tsx $F/src/components/landing/
cp $L/src/components/motion-primitives/progressive-blur.tsx $F/src/components/landing/motion-primitives/
cp $L/src/components/ui/accordion.tsx $F/src/components/landing/ui/
cp $L/src/utils/constants.ts $F/src/components/landing/constants.ts
cp $L/src/lib/utils.ts $F/src/components/landing/cn.ts
cp $L/src/app/page.tsx $F/src/components/landing/Landing.tsx
cp -n $L/src/components/brand/SportiumLogo.tsx $F/src/components/brand/   # same file as in the sign-in pages
cp $L/public/preview/*.png $F/public/preview/
cp $L/public/aquatic.jpg $L/public/crossFit.jpg $L/public/martialArts.jpg $L/public/runClub.jpg $L/public/yogaFlow.jpg $F/public/
```

What each copied file is:

| In our app | What it has |
|---|---|
| `src/components/landing/Landing.tsx` | The page itself: Header, Hero, ProductPreview, Carousel, Features, HowItWorks, Pricing, Faq, Cta, Footer, in that order |
| `src/components/landing/header/` | Top bar: logo, section links with the lime hover line, the "Sign in" menu (admin, staff, member), the theme button, the phone menu |
| `src/components/landing/hero/` | The headline with the lime marker, the two buttons (register, sign in), the short facts |
| `src/components/landing/product-preview/` | The 3 platform screenshots (dashboard, front desk, AI assistant), light or dark following the theme |
| `src/components/landing/carousel/` | The scrolling strip of sports (photos `aquatic`, `crossFit`, `martialArts`, `runClub`, `yogaFlow`) |
| `src/components/landing/features/` | What owners, staff and members get |
| `src/components/landing/how-it-works/` | The steps from register to the first check-in |
| `src/components/landing/pricing/` | The platform plans |
| `src/components/landing/faq/` | Questions and answers (uses `ui/accordion.tsx`) |
| `src/components/landing/cta/`, `footer/` | The last call to register, and the footer |
| `src/components/landing/motion.tsx`, `primitives.tsx` | The scroll animations (switched off for visitors who ask for reduced motion), and the shared `Container`, section title and button styles |
| `src/components/landing/motion-primitives/progressive-blur.tsx` | The faded edges of the carousel |
| `src/components/landing/ui/accordion.tsx` | The FAQ accordion (uses `@base-ui/react`, which we already have) |
| `src/components/landing/constants.ts` | The name, contact email, WhatsApp number, sign-in links (`/login`, `/staff/login`, `/member/login`, `/register`) and the section links |
| `src/components/landing/cn.ts` | `cn()` built from `clsx` + `tailwind-merge`, which the landing relies on (ours comes from the `cn` package) |
| `public/preview/*.png` | 6 screenshots at 2× (2.1 MB in total) |
| `public/*.jpg` | The 5 carousel photos from Dahani's branch (about 2 MB each: compress them before production, e.g. to 1600 px wide) |

### B4. Fix the imports (one command)

```bash
cd $F/src/components/landing
perl -pi -e 's#\@/components/(header|hero|product-preview|carousel|features|how-it-works|pricing|faq|cta|footer)/#\@/components/landing/$1/#g; s#\@/components/ui/accordion#\@/components/landing/ui/accordion#g; s#\@/utils/constants#\@/components/landing/constants#g; s#\@/lib/utils#\@/components/landing/cn#g' $(grep -rl '@/' .)
cd ../../../..
```

Then use our theme button in `src/components/landing/header/Header.tsx`:

1. Delete the line `import { useTheme } from "next-themes";`.
2. In `import { ChevronDown, LogIn, Menu, Moon, Sun, X } from "lucide-react";`, remove `Moon, Sun, `.
3. Delete the whole `function ThemeToggle() { ... }` (about 15 lines, just above `const Header = () => {`).
4. Add `import ThemeToggle from "@/components/ui/ThemeToggle";` with the other imports.

The `<ThemeToggle />` in the header now uses ours, so the landing and the app share the same light/dark choice.

### B5. Replace the home page

In `src/components/landing/Landing.tsx`, add the class `landing` to the outer `div`, so the colours in B6 apply only
inside the landing:

```tsx
<div className="landing min-h-screen flex flex-col bg-background ...
```

Replace all of `src/app/page.tsx` with this (the page sets the tab title, `Landing` is the client part):

```tsx
import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";

export const metadata: Metadata = {
  title: "Sportium | Sports club and gym management platform",
  description:
    "Run your sports club in one place: members, plans, payments, check-ins, staff and an AI assistant.",
};

export default function Home() {
  return <Landing />;
}
```

### B6. Add the landing's colours to `src/app/globals.css`

Our app already uses the same colour names (`bg-primary`, `text-muted-foreground`...), but with other values: our
`--primary` is indigo `#3525cd`, the landing's is near-black `#1b1f23`. So the landing gets its values inside
`.landing` only. Nothing changes on the other pages.

**1.** Inside the existing `@theme inline { ... }` block, add the 9 names the landing uses that we don't have:

```css
  --color-primary-hover: var(--primary-hover);
  --color-selected: var(--selected);
  --color-selected-foreground: var(--selected-foreground);
  --color-success: var(--success);
  --color-success-surface: var(--success-surface);
  --color-warning: var(--warning);
  --color-warning-surface: var(--warning-surface);
  --color-info: var(--info);
  --color-info-surface: var(--info-surface);
```

**2.** At the end of the file, add:

```css
/* the landing page keeps its own colours (the platform's grey, white, near-black and lime) without changing other pages */
.landing {
  --background: #e8e8e8;
  --foreground: #16191c;
  --card: #f6f6f6;
  --card-foreground: #16191c;
  --popover: #ffffff;
  --popover-foreground: #16191c;
  --primary: #1b1f23;
  --primary-hover: #2b3036;
  --primary-foreground: #ffffff;
  --selected: #a3e635;
  --selected-foreground: #1a2e05;
  --secondary: #ffffff;
  --secondary-foreground: #16191c;
  --muted: #ececec;
  --muted-foreground: #565c63;
  --accent: #ececec;
  --accent-foreground: #16191c;
  --destructive: #dc2626;
  --border: rgba(22, 25, 28, 0.09);
  --input: rgba(22, 25, 28, 0.14);
  --ring: #a3e635;
  --success: #166534;
  --success-surface: #dcfce7;
  --warning: #92400e;
  --warning-surface: #fef3c7;
  --info: #075985;
  --info-surface: #e0f2fe;
  --radius: 0.875rem;
}
.dark .landing,
[data-theme="dark"] .landing {
  --background: #15181c;
  --foreground: #f3f4f6;
  --card: #1a1e24;
  --card-foreground: #f3f4f6;
  --popover: #1f232a;
  --popover-foreground: #f3f4f6;
  --primary: #ffffff;
  --primary-hover: #e5e7eb;
  --primary-foreground: #0f1115;
  --secondary: #1f232a;
  --secondary-foreground: #f3f4f6;
  --muted: #1e2229;
  --muted-foreground: #a3a9b1;
  --accent: #262b33;
  --accent-foreground: #f3f4f6;
  --destructive: #f87171;
  --border: rgba(255, 255, 255, 0.08);
  --input: rgba(255, 255, 255, 0.14);
  --success: #86efac;
  --success-surface: #052e16;
  --warning: #fcd34d;
  --warning-surface: #451a03;
  --info: #7dd3fc;
  --info-surface: #082f49;
}
.landing :is(h1, h2, h3) {
  font-family: var(--font-heading);
}
/* the lime highlighter under a word */
.lime-marker {
  background-image: linear-gradient(transparent 80%, var(--selected) 80%, var(--selected) 87%, transparent 87%);
}
/* a lime line that slides in under a link on hover */
.lime-link {
  position: relative;
}
.lime-link::after {
  content: "";
  position: absolute;
  right: 0.875rem;
  bottom: 0.3rem;
  left: 0.875rem;
  height: 2px;
  border-radius: 9999px;
  background: var(--selected);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}
.lime-link:hover::after,
.lime-link:focus-visible::after {
  transform: scaleX(1);
}
@media (prefers-reduced-motion: reduce) {
  .lime-link::after {
    transition: none;
  }
}
/* anchor links (#features, #pricing...) glide only when the visitor allows motion */
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

### B7. Check

```bash
cd frontend
npx tsc --noEmit && npm run lint
npx eslint --fix src/components/landing   # removes 4 harmless warnings (unused eslint-disable lines)
npm run dev
```

Open http://localhost:3001/ and check:

- light and dark, and a phone width (the menu button opens the phone menu);
- the "Sign in" menu goes to `/login`, `/staff/login` and `/member/login`, and the register buttons go to `/register`;
- the section links scroll to Features, How it works, Pricing and FAQ;
- the other pages (`/login`, the dashboard) look exactly as before.

When it works, remove the extra folder: `git worktree remove ../landing-src`.

## Good to know

- **The landing is English only.** Our language button won't translate it until its texts move into `src/lib/i18n.ts`
  (the texts are in each section file and in `constants.ts`).
- **Check `constants.ts` before production.** The contact email and the WhatsApp number (`0606060606`) are placeholders
  from Dahani's branch.
- Our old home page code is simply replaced. Its texts stay in `i18n.ts`, unused.
- **The footer links to `/license`, which our app doesn't have** (`/terms` and `/privacy` exist). Add the page, or point
  the link (in `footer/Footer.tsx`) to `/privacy`.
- In `npm run dev`, a visitor who turned on "reduce motion" gets a hydration warning from `carousel/Carousel.tsx`: the
  server can't know that setting, so it renders the pause button and the browser then removes it. The page still works.
  This is in the original code, and a normal visit gives no warning.
- Tested on `frontend-ael-jama` at `a152837` (10 November) by following this guide: `tsc` 0 errors, lint 0 errors, no
  broken image, no sideways scroll, and the other pages kept their own colours. The screenshots are in `screenshots/`.
