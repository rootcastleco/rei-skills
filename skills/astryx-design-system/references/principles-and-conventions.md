# Astryx Design Principles, Naming & StyleX Conventions

Distilled from Meta's [Astryx](https://github.com/meta/astryx) (`packages/cli/assets/docs/principles.doc.mjs`, `AGENTS.md`, and `docs/design/`).

## 1. The 8 Core Rules for On-System Code

1. **Use Astryx components over raw HTML primitives.** Reach for `Stack`, `HStack`, `VStack`, `Grid`, `Card`, `Section`, `Text`, `Heading`, `Button`, `Link`, and form primitives instead of raw `<div>`, `<span>`, `<button>`, or `<input>`.
2. **Frame-first layout.** Establish `AppShell`, `TopNav`/`SideNav`, and `Layout` region budgets before filling page content. Always start new pages from one of the 58 official page templates.
3. **Dense data = rows, not Cards.** Use `Table` or `List`/`Item` rows for dense, scannable data. Reserve `Card` for discrete widgets, KPI tiles, or visual galleries. Group settings controls with `Section`.
4. **StyleX or Tailwind for layout & overrides.** Use the `xstyle` prop (StyleX) or `className` (Tailwind / CSS Modules) — never raw inline `style={{}}` on HTML elements.
5. **Semantic design tokens only.** Always reference `var(--color-*)`, `var(--spacing-*)`, `var(--radius-*)`, `var(--shadow-*)`, and `var(--text-*)`. Never hardcode hex colors or arbitrary pixel spacing.
6. **CSS custom properties drive theming & dark mode.** Color tokens use CSS `light-dark(...)` and theme overrides under `[data-astryx-theme="<name>"]`.
7. **Controlled form inputs.** Every Astryx input takes `value` and `onChange` (and supports `defaultValue` when uncontrolled).
8. **Framework-agnostic links.** Never hardcode `<a href="...">`. Use `<Link>` from `@astryxdesign/core/Link` or `useLinkComponent()` wired to `LinkProvider` (Next.js, React Router, TanStack Router).

## 2. Prop & Naming Conventions (Critical for Agents)

Astryx naming differs intentionally from other React UI libraries — verify via `astryx-ds-server component <Name>` before writing JSX:

| Convention | Astryx Standard | Avoid |
| :--- | :--- | :--- |
| Text content on controls | `label="Save"` on `Button`, `Badge`, `Token`, `Tab`, `IconButton` | `<Button>Save</Button>`, `<Badge>New</Badge>` |
| Prose & typography children | Children on `Text`, `Heading`, `Link`, `Blockquote` | `label` on `Text` / `Heading` |
| Boolean flags | `is*` / `has*` (`isOpen`, `isDisabled`, `isLoading`, `isSelected`, `isRequired`) | `open`, `disabled`, `loading`, `selected` |
| Visibility callback | `onOpenChange` paired with `isOpen` / `defaultIsOpen` | `onClose`, `onToggle` |
| Form inputs | `value` + `onChange` | Mixed uncontrolled callbacks |
| Icon-only buttons | Dedicated `IconButton` from `@astryxdesign/core/IconButton` (or `Button` with `isIconOnly` + `label` + `tooltip`) | Missing accessible `label` |
| Status indicators | `StatusDot` or `Token` | Decorative `Badge` for status |
| Imperative refs | `handleRef` | Legacy `imperativeRef` |
| Polymorphic containers | `as` prop (e.g. `<Stack as="section">`) | Legacy `element` prop |

## 3. StyleX v0.19 Capabilities & Patterns

When authoring StyleX styles alongside Astryx (`@stylexjs/stylex@^0.19.0`):

- **Prefer CSS-native features over JS workarounds:**
  - Dialog / overlay entry animations: `@starting-style` + `transitionBehavior: 'allow-discrete'` (not `useState` + `requestAnimationFrame`).
  - Container queries: `@container` (not `ResizeObserver`).
  - Parent-hover styling: `stylex.when.ancestor(':hover', marker)` with a component-scoped `stylex.defineMarker()` (never CSS `&` nesting, and never `stylex.defaultMarker()` on form controls like `CheckboxInput`, `RadioList`, or `Switch`).
  - Hover guards on touch devices: `@media (hover: hover)`.
  - Zebra striping: `:nth-child(even)` (not `index % 2` JS logic).
  - Anchored layers: CSS anchor positioning + `stylex.positionTry()`.
- **Avoid unsupported StyleX constructs:**
  - Do not use `@layer` or explicit `@property` inside StyleX definitions.
  - Do not use `animation` shorthand — use longhands (`animationName`, `animationDuration`, `animationTimingFunction`).
  - Do not use CSS `&` nesting.

## 4. Anti-Patterns Checklist

Before delivering any Astryx UI, audit every file with `astryx-ds-server doctor <path>`:

- ❌ Raw `<a href="...">` tags
- ❌ Hardcoded `#hex` colors or `rgb(...)` literals
- ❌ Inline `style={{ ... }}` objects on raw elements
- ❌ Custom CSS `@apply` overrides fighting component styles
- ❌ `<Card>` wrapped around every item in a dense `.map()` list
- ❌ `<Button>` or `<Badge>` missing the `label` prop
- ❌ Non-prefixed booleans (`disabled`, `loading`, `open`)
- ❌ More than one `variant="primary"` `Button` in the same view
- ❌ `variant="destructive"` actions without an `AlertDialog` confirmation step
