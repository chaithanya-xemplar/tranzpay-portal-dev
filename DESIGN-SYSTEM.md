# Tranzap Portal — Design System

> This document describes the planned design system architecture for the Tranzap Portal. It serves as a reference for the client to understand how UI components, styling, and visual consistency will be managed throughout the application.

---

## 1. Approach & Philosophy

The design system is **custom-built** (no off-the-shelf UI kit like Material UI or Ant Design). This gives us full control over the look, feel, and behavior while keeping the bundle size minimal.

| Principle | Description |
|-----------|-------------|
| **Utility-first CSS** | All styling uses Tailwind CSS v4 utility classes directly in JSX. No CSS-in-JS libraries. |
| **Component primitives** | Small, focused components (`Button`, `Input`, `Badge`, etc.) that compose into complex UIs. |
| **TypeScript throughout** | Every component exports typed props interfaces for IDE autocompletion and compile-time safety. |
| **Accessibility** | Components use semantic HTML, `forwardRef` for form controls, focus-visible rings, and ARIA attributes. |
| **Consistency via tokens** | Colors, typography, and spacing are defined once as CSS variables and consumed everywhere. |

---

## 2. Design Tokens

All visual primitives are defined in `src/styles/global.css` using Tailwind's `@theme` directive. These tokens are available as Tailwind utility classes (e.g., `bg-primary`, `text-error`, `border-divider`).

### 2.1 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#2586EE` | Buttons, active states, links, info accents |
| `secondary` | `#0C226E` | Secondary buttons, deep backgrounds |
| `dark-grey` | `#1E2F46` | Headings, bold text |
| `medium-grey` | `#3D4F68` | Body text |
| `light-grey` | `#748296` | Secondary text, placeholders |
| `white` | `#FFFFFF` | Card backgrounds, surface |
| `divider` | `#DFE0E8` | Borders, dividers, table lines |
| `divider2` | `#F5F6FA` | Subtle backgrounds, hover states |
| `primary_light1` | `#B7D7F8` | Outline borders, light primary |
| `primary_light2` | `#F4F9FE` | Table headers, ghost backgrounds |
| `success` | `#34C759` | Success indicators, positive trends |
| `success-bg` | `#EBFAEF` | Success background fills |
| `error` | `#FF574D` | Error text, danger buttons, validation |
| `error-bg` | `#FFECEB` | Error background fills |
| `warning` | `#EDA20A` | Warning indicators, caution states |
| `warning-bg` | `#FAF7DD` | Warning background fills |
| `background` | `#ECEDF0` | Page-level background |
| `hover-background` | `#0B437F` | Button hover darkening |
| `blue` | `#489BCE` | Sidebar link text |
| `neutral-bg` | `#EEEEEE` | Neutral badge backgrounds |

### 2.2 Typography

| Property | Value |
|----------|-------|
| Font family | `Inter` (Google Fonts) |
| Tailwind class | `font-sans` |
| Weights | `normal` (400), `semibold` (600), `bold` (700) |
| Sizes used | 9px, 10px, 11px, `xs` (12px), `sm` (14px), `base` (16px) |

### 2.3 Spacing & Layout

- **Spacing scale:** Tailwind default (1, 2, 3, 4, 5, 6, 8, 10, 12, 16, etc. — each unit = 0.25rem = 4px)
- **Border radius:** `rounded-md` (6px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-full`
- **Shadows:** `shadow-sm` (cards), `shadow-md` (toasts), `shadow-lg` (dropdowns/modals), `shadow-xl` (drawers)
- **Input heights:** driven by the `--control-h` token (44px) — see §2.4. `h-12` for the auth-page `.input-base` variant.
- **Breakpoints:** `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px (Tailwind defaults)

### 2.4 Form Controls

**Form-control styling has a single source of truth.** The `--control-*` tokens in `src/styles/global.css` define the entire control surface; `src/styles/components/form.css` is the only place that consumes them. To restyle inputs portal-wide — height, padding, fill, focus color, label type — change a token, not a call site.

```css
--control-h: 44px;            --control-fill: var(--color-divider2);
--control-px: 14px;           --control-fill-focus: var(--color-white);
--control-radius: 6px;        --control-border: var(--color-divider);
--control-fs: 14px;           --control-border-focus: var(--color-primary);
--control-text: var(--color-dark-grey);
--control-label-fs: 13px;     --control-label-fw: 500;
--control-placeholder: var(--color-placeholder);   /* #B9C2CE */
--control-placeholder-style: italic;
```

Resting state is a filled control (`divider2`) with a `divider` border; on focus the border turns `primary` and the fill goes white. Error state swaps the border to `error`. Disabled and `readonly` inputs get the muted fill plus `cursor: not-allowed` automatically — **do not** hand-add `bg-gray-100 cursor-not-allowed` at call sites.

**Placeholders are light (`#B9C2CE`) and italic site-wide.** The rule is element-level (`input::placeholder, textarea::placeholder`), so it covers `.input-base-form`, the auth-page `.input-base`, and any bare input alike — no per-field styling needed. A `<select>` sitting on its empty option gets the same treatment via `.select-custom:has(option[value=""]:checked)`.

| Class | Purpose |
|-------|---------|
| `.input-base-form` | **The shared control surface.** Token-driven; used by every input, select, textarea and combobox in the portal. Handles `:focus`, `.error`, `:disabled`, `[readonly]` and `textarea` sizing. |
| `.input-base` | Legacy taller (h-12) variant, **auth pages only** (login / forgot-password / reset-password). Not token-driven by design. |
| `.label-base` | Form label — 13px, weight 500, medium-grey |
| `.error-base` | Error message — 12px, `--color-error`. Rendered by `FieldError` and `Field`. |
| `.helper-base` | Helper text — 12px, light-grey |
| `.select-custom` | Adds the custom dropdown arrow + right padding to a native `<select>` |
| `.select-wrapper` | Positioning context for select adornments |
| `.scrollbar-thin` | Thin scrollbar for overflow containers |

Apply the error state with the `.error` class (e.g. `clsx("input-base-form", error && "error")`) rather than ad-hoc `border-red-500` utilities, so the border and message colors stay on the same token.

---

## 3. Component Library

All primitive UI components live under `src/design-system/` and are exported via a barrel file (`index.ts`). They fall into seven categories:

### 3.1 Inputs & Controls

| Component | Props | Variants |
|-----------|-------|----------|
| **Button** | `variant`, `size`, `loading`, `icon`, `iconPosition` | primary / secondary / outline / ghost / danger; sm / md / lg |
| **Input** | `label`, `error`, `leftIcon`, `rightIcon` | Full-width with optional icons and validation state |
| **TextArea** | `label`, `error`, `rows` | Multi-line text input |
| **Select** | `options`, `placeholder`, `error` | Native select with custom styling |
| **Combobox** | `options`, `onChange`, `placeholder` | Type-ahead with keyboard navigation and filtering |
| **Checkbox** | `indeterminate`, `label` | Standard + indeterminate state |
| **Radio** | `name`, `value`, `label` | Standard radio button |
| **Toggle** / **ToggleRow** | `checked`, `onChange`, `label` | Switch with optional labeled row layout |
| **Field** | `label`, `required`, `error`, `helper` | Form field wrapper (label + asterisk + error + helper text) |
| **FieldError** | `message` | Inline error (renders nothing when message is empty) |

### 3.2 Display & Data

| Component | Props | Variants |
|-----------|-------|----------|
| **Badge** | `variant` | default / success / warning / error / info |
| **Pill** | `variant` | 6 variants (rounded badge) |
| **TrendBadge** | `value`, `direction` | Up/down arrow with colored value |
| **Avatar** | `src`, `name`, `size` | Image, initials, or fallback icon |
| **Skeleton** | `variant` | text / circle / card / table-row |
| **Spinner** | `size` | sm / md / lg |
| **EmptyState** | `icon`, `title`, `description`, `action` | Icon + message + optional CTA button |
| **Breadcrumb** | `items` | Array of label + href with chevron separator |

### 3.3 Feedback

| Component | Props | Variants |
|-----------|-------|----------|
| **Alert** | `variant`, `dismissible` | success / error / warning / info; optional close button |
| **Toast** | via `useToast()` hook | success / error / warning / info; auto-dismiss, top-right stack |
| **Tooltip** | `content`, `position` | top / bottom / left / right; configurable delay |

### 3.4 Layout & Surface

| Component | Props | Variants |
|-----------|-------|----------|
| **Card** | `children`, `className` | White rounded container with shadow |
| **SectionTitle** | `title`, `subtitle`, `action` | Section heading with optional action button |
| **Collapse** | `title`, `defaultOpen` | Accordion expand/collapse |

### 3.5 Overlays

| Component | Props | Variants |
|-----------|-------|----------|
| **Modal** | `open`, `onClose`, `title`, `size` | sm / md / lg / xl / full; focus trap, Escape dismiss |
| **ConfirmDialog** | `open`, `title`, `message`, `confirmLabel`, `variant` | Confirmation with confirm/cancel; danger variant |
| **Drawer** | `open`, `onClose`, `position`, `title` | left / right slide-in panel |

### 3.6 Navigation

| Component | Props | Variants |
|-----------|-------|----------|
| **Dropdown** | `toggle`, `items`, `align` | Menu with clickable items; left/right align |
| **Tabs** | `tabs`, `activeTab`, `onChange` | Horizontal tab bar |
| **Breadcrumb** | `items` | Navigation trail |

### 3.7 Composites (reusable feature-level components)

| Component | Purpose |
|-----------|---------|
| **WizardShell** | Multi-step form wizard with stepper, step status (idle/active/complete/error), auto-save support |
| **AddressBlock** | Reusable address form group (street, city, state, zip) |
| **PersonFields** | Reusable contact name fields |
| **RichText** | Rich text editor (bold, italic, underline, list) |
| **LogoUpload** | Image upload with preview and crop |
| **GatewayTable** | Table with selectable gateway rows |

---

## 4. Icon System

- **44 custom SVG icons** stored as individual files in `src/assets/icons/`
- Loaded via `vite-plugin-svgr` as React components (imported with `?react` suffix)
- Centralized in `src/components/Icon/iconMap.ts` as a lookup map
- Usage: `<Icon name="edit" size={16} />` or `<Icon name="chevron-down" size={20} />`
- Types are auto-derived: `IconName` is a union of all keys

Full icon list: `chevron-down`, `chevron-up`, `chevron-left`, `chevron-right`, `arrow-left`, `x`, `check`, `check-green`, `search`, `plus`, `minus`, `edit`, `trash`, `save`, `upload`, `download`, `alert-circle`, `info`, `warning`, `check-circle`, `eye`, `eye-off`, `lock`, `unlock`, `mail`, `phone`, `map-pin`, `building`, `user`, `users`, `settings`, `refresh`, `filter`, `sort`, `arrow-up`, `arrow-down`, `more-horizontal`, `more-vertical`, `file`, `image`, `bold`, `italic`, `underline`, `list`

---

## 5. Page Layout

The app uses a consistent shell:

```
┌──────────────┬─────────────────────────────────────┐
│              │  Topbar                             │
│   Sidebar    │  (search, notifications, profile)   │
│  (collapsible)├─────────────────────────────────────┤
│              │                                     │
│  Navigation  │  Page Content (via <Outlet />)     │
│  Links       │                                     │
│              │                                     │
│              │                                     │
│              │                                     │
└──────────────┴─────────────────────────────────────┘
```

- **Sidebar:** Collapsible, contains navigation links with active state highlighting
- **Topbar:** Breadcrumb context, search, notification bell, settings, user avatar with dropdown
- **Content:** Renders the active page component via React Router

---

## 6. Styling Conventions

### 6.1 Tailwind-first approach

Components apply all styling through Tailwind utility classes. Example from `Button.tsx`:

```tsx
const variantStyles = {
  primary: "bg-primary text-white border-transparent hover:bg-hover-background",
  outline: "bg-primary_light2 text-primary border border-primary_light1",
  ghost: "bg-transparent text-medium-grey border-transparent hover:bg-divider2",
  danger: "bg-error text-white border-transparent hover:bg-error/90",
};
```

### 6.2 Conditional class merging

All components use `clsx` for clean conditional class composition:

```tsx
className={clsx("inline-flex items-center font-semibold rounded-md",
  variantStyles[variant],
  sizeStyles[size],
  disabled && "opacity-50 pointer-events-none",
  className
)}
```

### 6.3 When custom CSS is used

Custom CSS (in `form.css`) is reserved for:
- Base input styles reused across multiple form components
- Scrollbar customization
- Any pattern too verbose to repeat as utility classes

---

## 7. Component Architecture Patterns

| Pattern | Description |
|---------|-------------|
| **Functional components** | All components are function components (no classes) |
| **forwardRef** | Form controls use `forwardRef` for integration with `react-hook-form` |
| **Controlled by default** | Components accept `value` + `onChange` pattern |
| **No default exports of types** | Types are exported as named exports alongside default component exports |
| **Design system barrel** | `src/design-system/index.ts` re-exports all public components |

---

## 8. Interactive Component Showcase

A live design system showcase page exists at route `/design-system`. It demonstrates all 33+ components with interactive examples, organized into sections:

- **Inputs:** Button, Input, Select, Combobox, Checkbox, Radio, Toggle, ToggleRow, TextArea
- **Selection:** Checkbox, Radio, Toggle, Select, Combobox
- **Display:** Badge, Pill, TrendBadge, Avatar, Skeleton, Spinner, EmptyState, Breadcrumb, Icon
- **Layout:** Card, SectionTitle, Collapse
- **Overlay:** Modal, ConfirmDialog, Drawer, Tooltip, Dropdown
- **Feedback:** Alert, Toast (trigger examples)
- **Composites:** WizardShell, AddressBlock, PersonFields, Field, RichText, LogoUpload

This page serves as the **living documentation** — developers and stakeholders can interact with every component in real time.

---

## 9. Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript 5.8 |
| Bundler | Vite 7 |
| Styling | Tailwind CSS v4 (`@theme` directive) |
| Icons | Custom SVGs via `vite-plugin-svgr` + `lucide-react` |
| Conditional classes | `clsx` |
| Forms | `react-hook-form` + `zod` validation |
| Data fetching | `@tanstack/react-query` |
| Tables | `@tanstack/react-table` |
| Charts | `recharts` |
| Routing | `react-router-dom` v7 |
| Testing | vitest + @testing-library/react |

---

## 10. Future Roadmap

| Item | Status |
|------|--------|
| Core component library (~33 components) | Implemented |
| Interactive showcase page | Implemented |
| Dark mode theme | Planned |
| Storybook integration | Under consideration |
| Figma component library sync | Planned |
| Accessibility audit (WCAG 2.1 AA) | Ongoing |
| Theming API (multi-tenant brand support) | Future |

---

*Last updated: June 2026*
