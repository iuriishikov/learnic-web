# CLAUDE.md

Guidance for Claude when working in this Next.js codebase. Read this before generating code.

## Project Context

<!-- Replace this block with project-specific context: what the app does, who uses it, any domain vocabulary. -->
A Next.js application built with the App Router, TypeScript, and shadcn/ui.
The codebase follows a **strict feature-based architecture** — code is organized by business feature, never by technical type.

## Tech Stack

- **Framework:** Next.js 15+ (App Router, React Server Components)
- **Language:** TypeScript (`strict: true`)
- **Styling:** Tailwind CSS (with the brand `company` color token)
- **UI components:** shadcn/ui (`base-nova` style on top of `@base-ui/react` + Tailwind) — **mandatory** for both primitives and layout markup. **Do not** install or import Radix (`@radix-ui/*`) packages directly.
- **Animations:** Framer Motion (`motion/react`) — used actively for transitions, micro-interactions, page/route changes, and presence
- **Forms:** `react-hook-form` + `zod`
- **Validation:** `zod` — schemas are shared between client and server
- **i18n:** `next-intl` — locale-prefixed routing (`/en`, `/ru`), ICU MessageFormat, RSC-friendly
- **Client state:** React state/Context for local; Zustand only when genuinely needed
- **Server state (client-side fetching):** TanStack Query — only when Server Components can't cover the case
- **Database / ORM:** <!-- e.g., Drizzle / Prisma -->
- **Auth:** <!-- e.g., Auth.js / Clerk -->
- **Testing:** Vitest + React Testing Library; Playwright for e2e
- **Linting / formatting:** ESLint + Prettier
- **Package manager:** <!-- pnpm / npm / yarn / bun -->

## Commands

```bash
pnpm dev           # start dev server
pnpm build         # production build
pnpm start         # start production server
pnpm lint          # run ESLint
pnpm lint:fix      # auto-fix lint issues
pnpm typecheck     # tsc --noEmit
pnpm test          # unit tests
pnpm test:e2e      # Playwright
pnpm format        # Prettier write
```

**Before finishing any task, run:** `pnpm lint && pnpm typecheck`. If either fails, fix it before declaring done.

---

## Architecture

Strict feature-based architecture with clear layers. Each layer may only import from layers below it.

### Layers (higher → lower)

1. **`app/`** — Next.js routing. Thin. Composes features and widgets into pages.
2. **`widgets/`** *(optional)* — Compound UI blocks that combine multiple features (e.g., `SiteHeader`, `Sidebar`, `DashboardGrid`).
3. **`features/`** — Self-contained business features (`auth`, `posts`, `billing`, …).
4. **`shared/`** — Cross-cutting infrastructure with **no business logic** (UI primitives, utils, API client, config).

### Hard rules — no exceptions

- **Features never import from each other.** If feature A needs something from feature B, one of these is correct:
  - Compose both in a widget or page (lift integration up).
  - Extract the shared concern into `shared/`.
  - Communicate via URL state or a global store slice owned by `shared/`.
- **Features have a public API via `index.ts`.** External code imports only from `@/features/<name>` — never `@/features/<name>/components/SomeInternal`.
- **`shared/` contains zero business logic.** It's generic infrastructure that could be reused in any project.
- **`app/` is for routing only.** Pages should read as a composition — imports from features/widgets, minimal logic.
- **No circular dependencies.** If you hit one, the boundary is wrong.
- **No deep relative imports (`../../..`).** If you need them, you're crossing a boundary — use an alias.

---

## Directory Structure

```
src/
├── app/                          # Routing layer (Next.js App Router)
│   ├── (marketing)/              # Route groups for shared layouts
│   ├── (app)/                    # Auth-gated app routes
│   ├── api/                      # Route handlers (webhooks, third-party only)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx                 # Route-level error boundary
│   ├── not-found.tsx
│   └── loading.tsx               # Streaming fallback
│
├── features/                     # Business features
│   └── <feature-name>/
│       ├── api/                  # Server Actions, DB queries, external API calls
│       │   ├── actions.ts
│       │   └── queries.ts
│       ├── components/           # Feature React components (server + client)
│       ├── hooks/                # Feature-scoped hooks
│       ├── lib/                  # Feature-scoped helpers (pure functions)
│       ├── model/                # Types, zod schemas, state stores
│       │   ├── schema.ts
│       │   └── types.ts
│       └── index.ts              # PUBLIC API — only what's consumed outside
│
├── widgets/                      # (optional) Compound blocks
│   └── <widget-name>/
│       ├── ui/
│       └── index.ts
│
└── shared/                       # Cross-feature infrastructure (no business logic)
    ├── ui/                       # shadcn/ui components + custom primitives
    │   ├── button.tsx            # generated by shadcn/ui
    │   ├── dialog.tsx
    │   └── ...
    ├── lib/
    │   ├── utils.ts              # cn(), formatters, etc.
    │   └── ...
    ├── hooks/                    # Generic hooks (useMediaQuery, useDebounce)
    ├── api/                      # HTTP client, fetch wrappers, query-client setup
    ├── config/                   # env validation, constants, site config
    └── types/                    # Global TS types
```

### Path aliases (`tsconfig.json`)

```json
{
  "paths": {
    "@/app/*":      ["./src/app/*"],
    "@/features/*": ["./src/features/*"],
    "@/widgets/*":  ["./src/widgets/*"],
    "@/shared/*":   ["./src/shared/*"]
  }
}
```

---

## Adding a New Feature

1. Create `src/features/<feature-name>/`. Only create subfolders you actually need — don't scaffold empty dirs.
2. Define zod schemas in `model/schema.ts`. Reuse them on the client (form validation) and the server (Server Action input validation).
3. Put server-side logic in `api/`. Prefer **Server Actions** (`'use server'`) over route handlers.
4. Co-locate components in `components/`. Keep them Server Components unless client-only APIs are required.
5. Export the feature's public API in `index.ts`:

   ```ts
   // src/features/posts/index.ts
   export { PostList } from './components/post-list';
   export { PostForm } from './components/post-form';
   export { createPost, deletePost } from './api/actions';
   export { getPosts, getPostById } from './api/queries';
   export { createPostSchema, type CreatePostInput } from './model/schema';
   ```

6. Consumers import only from `@/features/posts` — never deeper.

## UI Components — shadcn/ui Only

**Strict rule:** every component, every layout block, every primitive must be built on top of shadcn/ui. shadcn/ui is the ONLY source of UI primitives in this codebase — there are no exceptions. This applies to both atomic primitives (`Button`, `Input`, `Dialog`, `Select`, `Tooltip`, `Popover`, `Table`, etc.) and to layout/structural markup (cards, sections, sheets, navigation menus, sidebars, etc.). If shadcn/ui ships it, you use it.

If the primitive you need exists in shadcn/ui, install it:

```bash
pnpm dlx shadcn@latest add <component>
```

Check the catalog first: https://ui.shadcn.com/docs/components

Generated files land in `src/shared/ui/`.

### Build custom components on top of shadcn — never from scratch

Feature-level components (`UserAvatar`, `PostCard`, `BillingPlanRow`, etc.) must be **wrappers/compositions over shadcn primitives**, styled with the brand `company` color token via Tailwind utilities and `cva`. Never re-implement a button, dialog, dropdown, or input from raw HTML — wrap the shadcn version and add behavior/styling on top.

The `company` color is the brand color of this product. It is exposed as a Tailwind token (`bg-company`, `text-company`, `border-company`, `ring-company`, `text-company-foreground`, etc.), backed by CSS custom properties (`--company`, `--company-foreground`) defined in `globals.css` for both `:root` and `.dark`. **All brand-colored UI must use these tokens** — never hardcode the hex value, and never use a generic Tailwind palette color (`bg-blue-500`, `bg-indigo-600`, …) as a stand-in for the brand color.

### Customization rules

**Do not modify generated shadcn/ui files directly.** If you need something different:

- **Styling tweaks:** pass `className`, merge with `cn()`.
- **Behavioral extension:** create a wrapper in `shared/ui/<name>-extended.tsx` or inside the consuming feature.
- **A new variant:** extend with `cva` in a wrapper — do not edit the base component. Brand-accent variants should consume the `company` token (e.g. `company: 'bg-company text-company-foreground hover:bg-company/90'`).
- **Composition:** build feature-specific compounds (e.g. `UserAvatar`, `PostCard`) inside the feature by composing shadcn primitives.

This keeps generated files clean so future `shadcn@latest add` updates don't fight your custom code.

### When a shadcn/ui component doesn't exist

1. First check if you can **compose** existing shadcn primitives to get what you need.
2. If you truly need a new primitive with no shadcn equivalent, build it in `src/shared/ui/` **following shadcn conventions**: `@base-ui/react` under the hood (when applicable), `cva` for variants, `cn()` for class merging, `forwardRef`, accept `className`, use design tokens. Treat it as if you were contributing it back to shadcn/ui.
3. **Never reach for other UI libraries** (MUI, Mantine, Chakra, Ant Design, HeadlessUI, Flowbite, DaisyUI, NextUI, etc.) and **don't pull in Radix (`@radix-ui/*`) directly** — `shadcn/ui` + `@base-ui/react` is the entire primitive layer.

---

## Animations — Framer Motion

**Framer Motion (`motion/react`) is the standard animation library for this codebase and must be used actively.** Static UI is the exception, not the norm — interactive surfaces, route transitions, lists, modals, sheets, dropdowns, and feedback states should feel alive.

### Where to use it (default to motion, not to none)

- **Mount/unmount:** wrap conditional content in `<AnimatePresence>` with `motion.div` (fade, slide, scale).
- **Lists:** stagger children with `staggerChildren` on a parent `motion` container; animate item enter/exit.
- **Hover/tap feedback:** `whileHover`, `whileTap`, `whileFocus` on interactive surfaces (cards, buttons that wrap shadcn `Button`, etc.).
- **Page/route transitions:** animate the route group's layout content on mount.
- **Layout shifts:** use `layout` / `layoutId` for shared-element transitions and reordering.
- **Scroll-driven reveals:** `whileInView` with `viewport={{ once: true }}` for landing/marketing sections.
- **Numeric/value changes:** `animate` + `useMotionValue` / `useSpring` for counters, progress, and meters.

### Conventions

- Import from `motion/react` (the modern entry), not the legacy `framer-motion` default path, unless the installed version requires it.
- Prefer `transition={{ type: 'spring', stiffness: ..., damping: ... }}` for natural feel; reserve `tween` + `ease` for precise UI choreography.
- Keep durations short (120–280ms for micro-interactions, up to ~450ms for larger transitions). No animation should block interaction.
- Respect `prefers-reduced-motion`: use the `useReducedMotion` hook to disable or shorten non-essential motion.
- Co-locate motion components inside the feature that owns the UI. Reusable motion primitives (e.g. `FadeIn`, `StaggerList`, `AnimatedCounter`) live in `src/shared/ui/motion/`.
- Animated wrappers around shadcn primitives are encouraged — wrap, don't rewrite. Example: a `MotionCard` that wraps shadcn `Card` with `whileHover` and entry animation.
- `'use client'` is required wherever Framer Motion is used. Push the client boundary down — keep the parent server-rendered and isolate the motion wrapper as a small client component.

### Forbidden

- **No raw CSS keyframe animations** for behavior Framer Motion can express. (Tailwind's built-in `animate-*` utilities for trivial loaders/spinners are fine.)
- **No competing animation libraries** (GSAP, react-spring, auto-animate, anime.js, etc.). Framer Motion is it.
- **No `setTimeout`-based "animations"** — use Framer Motion or CSS transitions.

---

## Code Style

### General

- TypeScript strict. No `any`. No `// @ts-ignore` / `// @ts-expect-error` without a comment explaining why.
- Prefer **named exports**. Default exports only where Next.js requires them (pages, layouts, `error.tsx`, etc.).
- File names: `kebab-case.ts` / `kebab-case.tsx`.
- Component names: `PascalCase`. Hooks: `useCamelCase`. Constants: `SCREAMING_SNAKE_CASE`.
- Keep files focused. Components > ~150 lines usually want a split.

### Import order (ESLint-enforced)

1. External packages
2. `@/app/*`
3. `@/widgets/*`
4. `@/features/*`
5. `@/shared/*`
6. Relative imports (only within the same feature folder)

---

## Components

### Server Components by default

Every component is a Server Component unless it genuinely needs the client. Add `'use client'` only when the component uses:

- `useState`, `useEffect`, `useRef`, `useReducer`, etc.
- Event handlers (`onClick`, `onChange`, `onSubmit`)
- Browser APIs (`window`, `document`, `localStorage`)
- Client-only libraries

**Push `'use client'` as far down the tree as possible.** Keep parents as Server Components and pass serializable props. Never mark a whole page as `'use client'` just because one button inside it needs state.

### Component shape

```tsx
import { cn } from '@/shared/lib/utils';

type UserCardProps = {
  name: string;
  email: string;
  className?: string;
};

export function UserCard({ name, email, className }: UserCardProps) {
  return (
    <div className={cn('rounded-lg border p-4', className)}>
      <p className="font-semibold">{name}</p>
      <p className="text-muted-foreground text-sm">{email}</p>
    </div>
  );
}
```

- Accept `className` on presentational components; merge with `cn()`.
- Use `type` for props. Reserve `interface` for declaration merging.
- Destructure props in the parameter list.

---

## Data Fetching

### Server-side (default)

Fetch in Server Components with `async/await`. No manual loading states in the component — use `loading.tsx` at the route level for streaming.

```tsx
// src/app/(app)/posts/page.tsx
import { getPosts, PostList } from '@/features/posts';

export default async function PostsPage() {
  const posts = await getPosts();
  return <PostList posts={posts} />;
}
```

### Mutations

Use Server Actions. Co-locate in the feature's `api/actions.ts`.

```ts
// src/features/posts/api/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createPostSchema } from '../model/schema';

export async function createPost(input: unknown) {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten() };
  }

  // ... DB call using parsed.data

  revalidatePath('/posts');
  return { ok: true as const };
}
```

**Server Actions never throw for expected failures.** Return a discriminated `{ ok: true, data }` | `{ ok: false, error }` union. Throw only for genuinely unexpected errors.

### Client-side fetching (when unavoidable)

Use TanStack Query. Configure a single `QueryClient` in `shared/api/query-client.ts`. Use for:

- Polling / real-time updates
- Infinite scroll
- Heavy optimistic UI
- Client-driven flows where an RSC refetch would be too coarse

---

## Forms

`react-hook-form` + `zod` + the shadcn/ui `Form` component. The schema lives in `model/schema.ts` and is used by both the form and the Server Action.

```ts
// src/features/posts/model/schema.ts
import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
```

```tsx
// src/features/posts/components/post-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPostSchema, type CreatePostInput } from '../model/schema';
import { createPost } from '../api/actions';

export function PostForm() {
  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', body: '' },
  });

  async function onSubmit(values: CreatePostInput) {
    const result = await createPost(values);
    if (!result.ok) {
      // map result.error to field errors
    }
  }

  // ... render shadcn/ui <Form> ...
}
```

**Always validate again on the server.** Client validation is UX, not security.

---

## Styling — Tailwind Only

**Tailwind utility classes are the only styling mechanism in this codebase.** No exceptions beyond what's listed below.

### Allowed

- Tailwind utility classes directly in `className`.
- `class-variance-authority` (`cva`) for variants, co-located with the component.
- `cn()` from `@/shared/lib/utils` (clsx + tailwind-merge) for conditional / merged classes.
- A single global stylesheet at `src/app/globals.css` — but only for: Tailwind directives (`@tailwind` / `@import "tailwindcss"`), the shadcn/ui theme layer (CSS custom properties / `:root` / `.dark`), and third-party CSS imports that have no alternative (e.g. `react-day-picker` base styles).
- Inline `style={{ ... }}` **only** for truly dynamic values Tailwind cannot express, like `style={{ width: \`${progress}%\` }}` or a user-picked color.

### Forbidden

- **No CSS Modules** (`*.module.css`).
- **No styled-components, Emotion, vanilla-extract, Stitches, Panda CSS**, or any other CSS-in-JS library.
- **No Sass / Less / PostCSS plugins beyond what Tailwind ships with.** No `*.scss`, no `*.less`.
- **No `<style jsx>`.**
- **No arbitrary CSS files** scattered across features. If you feel you need one, you're reaching for the wrong tool — use Tailwind utilities, a `cva` variant, or a design token instead.
- **No hardcoded hex/rgb colors** in class lists. Use design tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-input`, `ring-ring`, `bg-primary`, `text-primary-foreground`, `bg-company`, `text-company`, `text-company-foreground`, etc. These come from the shadcn/ui theme in `globals.css`. The brand `company` token is the only correct way to reference the product's brand color — never substitute a generic palette color (`bg-blue-500`, `bg-indigo-600`, …).
- **No `!important`** in class lists. If you need it, your architecture is wrong — restructure instead.
- **No manual `dark:` variants for colors that are already tokenized.** The token system handles dark mode automatically. Use `dark:` only when a genuinely different utility (not just color) is needed in dark mode.

### Design tokens

Colors, radii, and other theme values live as CSS custom properties in `globals.css` (provided by shadcn/ui init) and are exposed to Tailwind through `tailwind.config`. To add a new token:

1. Add the CSS variable to `:root` and `.dark` in `globals.css`.
2. Add the Tailwind mapping in `tailwind.config`.
3. Use it as a utility: `bg-my-token`.

Never hardcode a one-off color in a component — add a token.

---

## Localization — next-intl

**`next-intl` is the only i18n library in this codebase.** All user-facing strings — labels, buttons, headings, placeholders, validation messages, toast/alert text, meta titles & descriptions, alt text, aria-labels — must come from `next-intl` message catalogs. **No hardcoded strings in JSX.** This rule holds even when only one locale is shipped: every string is registered in next-intl from day one.

### Routing

- Locale is in the URL path: `/en/...` and `/ru/...`. No cookie-only or header-only locale detection.
- Routing is defined in `src/shared/config/i18n/routing.ts`; middleware lives at `src/middleware.ts`. Default locale: `ru`.
- The Next.js root segment is `app/[locale]/...` — every page/layout sits under this segment.
- Internal links must go through `next-intl`'s `Link` / `useRouter` / `redirect` (re-exported from `@/shared/config/i18n/navigation`) so locale prefixes are preserved. Never use raw `next/link` for app navigation.

### Message catalogs

- Catalogs are **split per namespace, one JSON file per namespace, per locale**:
  ```
  src/shared/config/i18n/messages/
  ├── ru/
  │   ├── home.json
  │   ├── auth.json
  │   └── posts.json
  └── en/
      ├── home.json
      ├── auth.json
      └── posts.json
  ```
- **File name = namespace.** `home.json` → `t = getTranslations('home')`. Never nest the namespace inside the JSON file (no `{ "home": { ... } }`) — the filename already owns it.
- One namespace per feature/page. Don't mix multiple features in one file. `features/posts` → `posts.json`; the home page → `home.json`.
- Files are merged at request time by `src/shared/config/i18n/request.ts` — just drop a new JSON in and it becomes available. No imports or registration step.
- Use ICU MessageFormat for plurals, selects, and rich text. Don't concatenate translated fragments in code.
- Keys are stable identifiers (camelCase, descriptive). Don't use the source string as the key.

### Usage

- **Server Components:** `import { getTranslations } from 'next-intl/server'` → `const t = await getTranslations('posts');`
- **Client Components:** `import { useTranslations } from 'next-intl'` → `const t = useTranslations('posts');`
- **Metadata:** use `getTranslations` inside `generateMetadata` so titles/descriptions are localized.
- **Validation messages:** zod schemas pull strings via `next-intl` (server-side `getTranslations`, client-side `useTranslations`) — no inline English strings in error maps.
- **Formatting:** dates, numbers, currency, and relative time go through `next-intl`'s `useFormatter` / `getFormatter`. No ad-hoc `toLocaleString` calls.

### Adding or changing copy

1. Add the key to the namespace file in **every** locale (`messages/ru/<namespace>.json` AND `messages/en/<namespace>.json`). Missing translations should fail the build / typecheck — never ship a key that exists in one locale only.
2. Reference the key from the component via `t('...')`. If a key is unused, remove it from all locales.
3. New feature or new page → create a new `<namespace>.json` under **each** `messages/<locale>/` directory. No central registry to update — the request handler picks files up automatically.

### Design / styling target

**Unless stated otherwise, design and visual styling are tuned for `/ru`** — Cyrillic typography, Russian-language line lengths, button widths sized for Russian copy, etc. Other locales render through the same components but are not the layout reference. If a screen needs locale-specific visual tweaks (e.g. `/en` text overflow), handle it explicitly with a conditional based on `useLocale()` — don't retro-fit the `/ru` design to fit other locales by default.

### Forbidden

- **No hardcoded user-facing strings** in JSX, alerts, toasts, metadata, or zod error messages — even temporary ones, even in a single-locale build.
- **No raw `next/link`** for in-app navigation; use `next-intl`'s `Link`.
- **No alternative i18n libraries** (`react-i18next`, `next-i18next`, `lingui`, `paraglide`, etc.).
- **No string concatenation** for sentences with variables — use ICU placeholders.

---

## Error Handling

- `error.tsx` and `not-found.tsx` at route boundaries.
- Server Actions return discriminated results — don't throw for expected failures.
- Validate all external input (form submissions, search params, webhook bodies) with zod.
- Don't leak stack traces or internal error messages to the client. Log server-side, return a safe message to the user.

---

## TypeScript

- Prefer `type` over `interface` unless declaration merging is required.
- Use `satisfies` for config objects — keeps types narrow without widening.
- No `enum` — use `as const` objects or string literal unions.
- Use `unknown` for untrusted input; narrow with zod or type guards.
- Avoid non-null assertions (`!`). If you must use one, comment why.

---

## Accessibility

- All interactive elements must be keyboard-operable.
- Images require `alt`; decorative ones use `alt=""`.
- Use semantic HTML (`button`, `nav`, `main`, `header`) — don't default to `div`.
- shadcn/ui is accessible out of the box; don't undo that with styling that hides focus rings or removes ARIA.

---

## Testing

- Co-locate unit tests: `button.tsx` → `button.test.tsx`.
- Test behavior, not implementation. Prefer RTL queries by role/text over `data-testid`.
- e2e tests in `e2e/` at repo root.
- Write tests for: Server Actions, zod schemas, critical user flows.

---

## Git Conventions

- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`, `perf:`.
- One logical change per commit.
- Branches: `feat/<short-description>`, `fix/<short-description>`.

---

## What NOT to Do

- **Don't** put `'use client'` on every file. Default is Server Component.
- **Don't** import across features. `features/posts` must not import from `features/auth`.
- **Don't** deep-import a feature's internals. Always go through the feature's `index.ts`.
- **Don't** edit generated shadcn/ui files in `shared/ui/` — wrap them instead.
- **Don't** hand-roll primitives that exist in shadcn/ui (`Button`, `Input`, `Dialog`, `Select`, etc.). Install via `pnpm dlx shadcn@latest add <component>`.
- **Don't** build feature components from raw HTML when shadcn primitives exist — wrap and compose shadcn instead, then style with the `company` brand token.
- **Don't** hardcode the brand color or substitute a generic Tailwind palette color for it. Use `bg-company` / `text-company-foreground` etc.
- **Don't** install other UI libraries (MUI, Mantine, Chakra, Ant Design, HeadlessUI, Flowbite, DaisyUI, NextUI). shadcn/ui is it.
- **Don't** ship static, motion-less interactive UI. Use Framer Motion (`motion/react`) for transitions, presence, hover/tap feedback, list staggers, and route changes.
- **Don't** install competing animation libraries (GSAP, react-spring, auto-animate, anime.js). Framer Motion is the only animation library.
- **Don't** hardcode user-facing strings. Every label/title/placeholder/alt/aria/toast/zod-message goes through `next-intl`, even when only `/ru` is shipped.
- **Don't** use raw `next/link` or `next/navigation` redirects for in-app routes — use `next-intl`'s `Link` / `useRouter` / `redirect` so the locale prefix stays.
- **Don't** install other i18n libraries (`react-i18next`, `next-i18next`, `lingui`, `paraglide`). `next-intl` is it.
- **Don't** tune layouts to non-`/ru` locales by default. Design target is `/ru` unless explicitly stated otherwise.
- **Don't** write CSS outside Tailwind. No CSS Modules, no CSS-in-JS (styled-components, Emotion, vanilla-extract, etc.), no Sass, no `<style jsx>`, no standalone `.css` files beyond `globals.css`.
- **Don't** hardcode colors (`#fff`, `rgb(...)`, `bg-gray-800`). Use design tokens (`bg-background`, `text-foreground`, etc.).
- **Don't** use `!important` to force styles. Fix the cascade instead.
- **Don't** put business logic in `shared/`. If it's domain-specific, it's a feature.
- **Don't** fetch data in Client Components when a Server Component can do it.
- **Don't** use `any`, `@ts-ignore`, or non-null assertions without a comment.
- **Don't** create barrel files for every folder. Only features expose a public API; internal folders import directly.
- **Don't** use route handlers (`app/api/`) for things Server Actions can do. Reserve them for webhooks and third-party integrations that require a stable URL.
- **Don't** hardcode config. Use `shared/config` and validate env at boot with zod.
- **Don't** throw from Server Actions for expected failures — return a discriminated result.
- **Don't** invent new architectural patterns without updating this file first.

---

## When In Doubt

- If you're unsure whether something belongs in `shared/` or a feature: ask *"could another project use this as-is?"* If yes → `shared/`. If no → feature.
- If two features need to share code: it either belongs in `shared/` (generic) or in a new feature they both depend on (domain-specific), or the integration should happen at the widget/page level.
- If a file is hard to place: the architecture is telling you something. Stop and reconsider the boundary before forcing it.

---

## References

- Next.js App Router: https://nextjs.org/docs/app
- shadcn/ui: https://ui.shadcn.com/docs
- TanStack Query: https://tanstack.com/query/latest
- react-hook-form: https://react-hook-form.com
- zod: https://zod.dev