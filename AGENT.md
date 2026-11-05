# Frontend Redesign & Engineering Guidelines

You are acting as a **Senior Frontend Engineer, UI/UX Designer, and Software Architect**. Your task is to improve and redesign the frontend of my existing application while maintaining its functionality, architecture, and technical consistency.

I want production-quality code, a professional interface, maintainable architecture, and a consistent design system across the entire application.

## 1. First: Inspect the Existing Project

Before making any changes:

- Inspect the entire project structure.
- Read the existing documentation and configuration files.
- Identify the frontend framework, installed dependencies, versions, and current architecture.
- Understand the existing authentication system, user roles, permissions, API integrations, and routing.
- Identify all existing pages, layouts, reusable components, and forms.
- Understand how different clubs or organizations are separated and how their data is accessed.
- Inspect the existing styling conventions and identify inconsistencies.
- Check the package manager and lockfile before installing or updating dependencies.

**Important:**
- Do not blindly replace existing code.
- Do not remove existing functionality just to simplify the implementation.
- Do not introduce unnecessary dependencies.
- Do not modify backend APIs or database structures unless explicitly required.
- Preserve existing API contracts and authentication behavior.
- If something is unclear, investigate the existing implementation before making assumptions.

## 2. Create Persistent Project Rules

Create an `AGENTS.md` file at the repository root.

If an `AGENTS.md` already exists, inspect it and merge these guidelines without deleting useful existing instructions.

The file must contain the following permanent engineering principles:

### Technology and Architecture

- Use the existing framework and architecture.
- Use shadcn/ui for interactive components such as dialogs, dropdowns, selects, buttons, tooltips, and form controls.
- Use semantic HTML for page structure and accessibility.
- Use CSS Modules for new page layouts and custom styling.
- Use shared CSS variables and design tokens for colors, typography, spacing, borders, and shadows.
- Keep Tailwind CSS where required by shadcn/ui and existing project conventions.
- Avoid unnecessary inline styles.
- Avoid duplicated components and styling.
- Build reusable components instead of repeating the same implementation across pages.
- Follow the existing naming conventions and folder structure.

### Code Quality

- Write clean, readable, maintainable, and reusable code.
- Use TypeScript properly.
- Avoid `any` unless absolutely necessary.
- Avoid unnecessary abstractions and overly complicated components.
- Separate business logic from presentation.
- Use appropriate hooks and avoid unnecessary re-renders.
- Keep components focused on a single responsibility.
- Handle errors explicitly.
- Never use mock data as a replacement for existing real API integrations.

### Security

Never assume frontend validation is sufficient for security.

- Validate user inputs in the browser for immediate feedback.
- Use safe rendering practices and avoid unsafe HTML injection.
- Never expose secrets, API keys, or sensitive environment variables in client-side code.
- Never trust user-controlled IDs, roles, permissions, or organization identifiers.
- Ensure the backend independently validates inputs and enforces authentication and authorization.
- Preserve existing authentication and authorization mechanisms.
- Ensure users cannot access another club's data by manipulating requests or identifiers.
- Follow secure API communication practices.
- Do not introduce security vulnerabilities while modifying the frontend.

### Accessibility

- Use semantic HTML.
- Support keyboard navigation.
- Provide accessible labels for inputs.
- Ensure visible focus states.
- Maintain sufficient color contrast.
- Support screen readers.
- Respect reduced-motion preferences.
- Do not communicate important information through color alone.

### Application States

Every page and interactive component must properly handle:

- Loading states.
- Empty states.
- Error states.
- Pending states.
- Success states.
- Disabled states where appropriate.

Do not leave users with blank screens or unexplained failures.

### Consistency

- Maintain a unified design system across all application portals.
- Reuse shared layouts, components, and styling tokens.
- Keep navigation, buttons, forms, tables, filters, dialogs, and notifications visually consistent.
- Do not introduce a different design language on individual pages.
- Respect existing translations and internationalization.
- Support Arabic and RTL layouts wherever the application supports them.

### SEO and Performance

- Optimize public-facing pages for SEO.
- Do not expose private dashboard content to search engines.
- Use appropriate metadata and semantic page structure.
- Optimize images and avoid unnecessary dependencies.
- Avoid unnecessary client-side rendering.
- Monitor performance and avoid preventable layout shifts.

### Testing and Verification

After implementation:

- Run ESLint.
- Run TypeScript checks.
- Run the production build.
- Test the affected pages in the browser.
- Check desktop, tablet, and mobile layouts.
- Verify keyboard navigation and accessibility.
- Check the browser console for errors.
- Verify that existing functionality still works.

Do not claim something is tested if you have not actually tested it.

## 3. Design Direction

Use the supplied reference image as the primary visual inspiration.

The overall design should follow this direction:

- Charcoal or dark sidebar.
- Light gray main workspace.
- White content surfaces.
- Rounded cards and containers.
- Strong, readable typography.
- Restrained green accent colors.
- Pill-shaped filters and status indicators.
- Clean tables and organized dashboards.
- Consistent spacing and alignment.
- Subtle borders and shadows.
- Professional icons.
- Clear visual hierarchy.

The goal is a modern, premium, professional SaaS dashboard.

However, do not blindly copy the reference image. Adapt the design to the actual functionality and information architecture of the application.

Prioritize readability. Avoid faint text, insufficient contrast, excessive decoration, and unnecessary visual complexity.

## 4. Design System

Before implementing individual pages, establish a shared design system.

Define reusable tokens for:

- Primary and secondary colors.
- Background colors.
- Text colors.
- Borders.
- Shadows.
- Border radius.
- Typography.
- Spacing.
- Responsive breakpoints.
- Status colors.

Create reusable components for common interface elements, including:

- Sidebar.
- Header.
- Navigation items.
- Buttons.
- Cards.
- Tables.
- Search inputs.
- Filters.
- Status badges.
- Dropdowns.
- Dialogs.
- Form fields.
- Pagination.
- Notifications.
- Empty states.
- Loading skeletons.

Ensure that all components follow the same visual language.

## 5. Existing Functionality Must Be Preserved

The redesign must not break existing application functionality.

Pay special attention to:

- Login and authentication.
- Registration.
- Password management.
- User profiles.
- Role-based access.
- Club or organization management.
- Dashboard data.
- API requests.
- Form submissions.
- Navigation.
- Existing business logic.

Do not replace functional API integrations with static examples.

Do not invent endpoints, response structures, or business rules.

If a feature is incomplete, identify it and explain what is missing rather than pretending it works.

## 6. Implementation Strategy

Work incrementally.

### Phase 1: Project Audit

Inspect the project and provide a concise report containing:

- Current architecture.
- Main technologies and versions.
- Existing page structure.
- Current component structure.
- Identified problems.
- Potential compatibility issues.
- Proposed redesign architecture.

Do not start changing dependencies before understanding their compatibility with the existing project.

### Phase 2: Design System

Create the shared design tokens, layouts, and reusable components.

Ensure the new components can be reused across all application portals.

### Phase 3: Initial Implementation

Implement:

1. The shared application layout.
2. The sidebar and header.
3. One real dashboard using existing API data.
4. One representative form with complete validation and application states.

Use these pages to establish the final visual and architectural standards.

### Phase 4: Review

Inspect the implementation in the browser.

Verify:

- Desktop responsiveness.
- Mobile responsiveness.
- Visual consistency.
- Accessibility.
- Loading and error states.
- Existing functionality.
- API integration.
- TypeScript and lint checks.

Fix issues before expanding the redesign.

### Phase 5: Remaining Pages

Once the initial implementation is approved, extend the same design system and component architecture to the remaining pages.

Do not create independent styling systems for different pages.

## 7. Rules for Working With Existing Code

- Understand before modifying.
- Reuse before creating.
- Refactor when necessary, but avoid unrelated refactoring.
- Keep changes focused and organized.
- Do not delete files without understanding their purpose.
- Do not disable ESLint or TypeScript rules to hide problems.
- Do not suppress errors without a valid reason.
- Do not change dependency versions without checking compatibility.
- Do not sacrifice accessibility for visual appearance.
- Do not sacrifice security for convenience.
- Do not sacrifice existing functionality for design.

## 8. Expected Result

I expect:

- A professional and modern SaaS interface.
- A consistent design system across the application.
- Reusable and maintainable components.
- Clean TypeScript implementation.
- Proper responsive behavior.
- Accessible interactions.
- Secure frontend practices.
- Preserved existing business logic and API integrations.
- No unnecessary dependencies.
- No broken existing features.

**Final instruction:**

Think like a senior engineer, not just a UI developer.

Do not rush into implementation. Understand the application first, establish a solid architecture, and then implement the redesign incrementally.

Prioritize correctness, maintainability, accessibility, security, and consistency over speed.

Before finishing, provide a summary of the changes, modified files, completed tests, remaining issues, and any recommendations.