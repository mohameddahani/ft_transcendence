# Design System — Toota Multi-Tenant SaaS Tokens

Derived from `docs/frontend-rebuild/design-reference.jpg` and `DESIGN_BRIEF.md`.

## 1. Palette & Surface Tokens

| Token Family | CSS Variable | Light Mode | Dark Mode | Usage |
|---|---|---|---|---|
| Sidebar Navigation | `--toota-side` | `#1B1F23` (Charcoal) | `#1B1F23` (Charcoal) | Persistent navigation, high-contrast dark shell |
| Main Workspace | `--toota-main` | `#E8E8E8` / `#F3F4F3` | `#2A2F34` / `#12161A` | Neutral canvas providing calm contrast |
| Cards / Panels | `--toota-card` | `rgba(255, 255, 255, 0.62)` / `#FFFFFF` | `rgba(255, 255, 255, 0.07)` / `#1E2328` | Softly rounded white surfaces, subtle borders |
| Inner Card Panels | `--toota-inner` | `rgba(255, 255, 255, 0.72)` / `#F9FAFA` | `rgba(255, 255, 255, 0.08)` / `#252B31` | Nested sections (e.g. pricing tiers container) |
| Primary Ink (Text) | `--toota-ink` | `#16191C` (Dark Charcoal) | `#F1F3F4` (Clean White) | Strong typography for headings and values |
| Muted Ink (Subtext)| `--toota-muted` / `sub` | `#7A8087` | `#9AA1A8` | Supporting metadata, field hints, units |
| Accent Green | `--toota-green` / `lime` | `#22C55E` / `#A3E635` / `#A4E879` | `#22C55E` / `#A3E635` | Controlled status indicators, active states, metrics |
| Status Red | `--toota-red` | `#EF4444` | `#EF4444` | Inactive status, overdue indicators, destructive acts |

## 2. Typography

- **Headlines & Display**: `Sora` (`var(--font-sora)`), bold weights (`font-bold`, `font-black`), tracking-tight.
- **Body & Controls**: `Plus Jakarta Sans` (`var(--font-plus-jakarta)`), font sizes 12px (`text-xs`), 14px (`text-sm`), 16px (`text-base`).
- **Numbers / Metrics**: Tabular numbers for price amounts and counters (`$49.99`, `7x / wk`).

## 3. Shapes & Radii

- **Panel Radii**: `rounded-3xl` (24px) for bento cards, overview containers, and modals.
- **Control Radii**: `rounded-xl` / `rounded-2xl` for inputs, tier cards, and secondary actions.
- **Pills**: `rounded-full` for status indicators, view toggles, and filter chips.

## 4. UI Components Policy

- Use `shadcn/ui` primitives: `Card`, `Badge`, `Button`, `Table`, `Input`.
- Keep accessible states: Loading skeletons, empty states, inline error feedback, and disabled submission states with spinners.

