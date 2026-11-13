# Design brief — extend one reference into the whole frontend

Reference: [design-reference.jpg](design-reference.jpg).
Product: the existing ft_transcendence sports club management SaaS.
This is a visual direction and adaptation guide, not a proposal for new backend features.

## What the reference communicates

The supplied photograph contains one desktop dashboard inside a monitor. Use the UI inside the display as the reference.

| Visual element | Direction for the real application |
| --- | --- |
| Charcoal sidebar | Calm navigation with readable labels, a clear active item, account actions, and actual role-specific links |
| Light gray workspace | A neutral reading surface with clear boundaries and generous spacing |
| White rounded panels | Group related information and actions; use borders/shadows sparingly |
| Strong dark typography | Clear page heading, readable body text, quieter supporting text |
| Pill-shaped filters | Compact state/date filtering with explicit selection, focus, and accessible names |
| Green accents with limited warm color | Controlled emphasis and data/status meaning; pair colors with text |
| Large summary values | Only real metrics supplied by existing contracts, with units/date context |
| Main area plus secondary panel | Use only when secondary information helps the current task |

Keep the actual brand. The reference's employee rankings, company/personal tabs, application logos, sample numbers, and charts do not authorize equivalent features in this product.

Render normal responsive pages, not a picture of a monitor. Do not copy the desk, perspective distortion, device frame, or photographic lighting.

## Starting token proposal

These are design starting points, not colors sampled exactly from the photograph or an approved final specification. Verify contrast in the actual UI.

| Token family | Starting proposal |
| --- | --- |
| Navigation | Charcoal near #1B2024, light foreground, high-contrast selected state |
| Workspace | Neutral near #F3F4F3 |
| Main surfaces | White near #FFFFFF; subtle neutral borders |
| Text | Dark near #182022; readable muted text chosen by contrast testing |
| Accent | Soft green near #A4E879 with dark text; use darker green for text on pale surfaces |
| Error/status | Distinct tested semantic tokens with text/icons; no color-only status |
| Spacing | A coherent 4/8 px-based scale with deliberate compact/comfortable variants |
| Radius | Moderate control radii and larger panel radii; pills only where useful |
| Typography | One compatible existing font family when suitable, strong hierarchy, readable body/field text |
| Motion | Short opacity/transform transitions; reduced-motion alternatives |

Implement these as shared tokens. Avoid independent per-page hex colors and one-off values. Preserve the current supported theme system and derive dark-mode tokens if that feature exists.

## Shared patterns

Build reusable compositions where justified by repeated use: AppShell, Sidebar/MobileNavigation, PageHeader, FilterBar, data list/table patterns, FormSection, field feedback, StatusBadge, EmptyState, ErrorState, Skeleton, and confirmation patterns.

Names are suggestions; keep sensible existing conventions. Do not create a generic component factory for every element. Use actual shadcn components and their installed APIs.

## How to design pages not shown in the image

First identify the real task, data, primary action, and current contract. Then choose an appropriate page family. Preserve the shared palette, type scale, density, controls, navigation, state feedback, and motion.

| Existing page family | Layout and behavior |
| --- | --- |
| OWNER overview | Actual platform/owner responsibilities, useful summaries, and existing management actions; do not clone ADMIN permissions |
| ADMIN overview | Existing club summaries, useful operational actions, and real recent information |
| STAFF portal | Focus on authorized operational tasks and quick access; preserve actual staff permissions |
| MEMBER portal | Focus on the member's own existing information, memberships, visits, payments, or feedback |
| Member/staff lists | Clear heading/action, practical search/filters, readable table/list, pagination, sensible row actions and mobile details |
| Create/edit forms | Grouped fields, visible labels/help, inline validation, clear submit/cancel, preserved safe input on failure |
| Member/staff/details | Identity/status at the top, facts grouped clearly, relevant actions and sections/tabs only where content supports them |
| Attendance/visits | Fast member lookup, readable eligibility/status, obvious check-in result and safe duplicate handling according to the API |
| Plans/durations/payments | Clear units, duration/currency, actual statuses, useful filters, and trustworthy pending/confirmed/failed outcomes |
| Working hours/settings | Readable sections, accessible date/time controls, clear save state, and preserved date/overlap/business constraints |
| Notifications/feedback | Useful list hierarchy, readable timestamps/status, correct read/like/action state, empty/error/pending feedback |
| Auth/onboarding | Focused layout with the same visual identity; retain actual role selection, identifier type, recovery, and verification flows |
| Public pages | Shared brand/type/controls with a public-content layout, truthful copy, useful navigation, and appropriate SEO |
| Error/access states | Consistent shell or focused fallback, clear explanation, safe next step, and no private-data leakage |

This table is conditional on the real route inventory. Do not create missing product features simply because a row exists here.

## Responsiveness

Keep desktop navigation useful while giving mobile an accessible sheet/drawer or established equivalent. Stack/reorganize content according to task importance.

On narrow screens, preserve important list actions using a good detail view or a contained scrollable table. Do not hide payment status, member identity, or required actions just to make the screenshot fit.

Check long translations, RTL where supported, zoom, different content lengths, and intermediate widths. The photograph specifies no mobile layout; design and test one intentionally.

## Quality test for every new page

1. Does the page clearly belong to the same product as the representative dashboard?
2. Does its layout help the real task rather than merely repeat the screenshot?
3. Are all visible controls connected to real behavior and contracts?
4. Are loading, empty, error, pending, and success states appropriate and understandable?
5. Can it be used with keyboard and touch, at narrow widths and with supported translations?
6. Have the logic and relevant shared dependencies been reviewed and verified?
7. Has the agent inspected the rendered output and corrected inconsistencies?

Keep a record of the final shared design decisions in DESIGN_SYSTEM.md so later pages do not drift.
