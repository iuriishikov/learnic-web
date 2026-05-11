# CLAUDE.md

Guidance for Claude when working in this Next.js codebase. Read this before generating code.

## Project Context

<!-- Replace this block with project-specific context: what the app does, who uses it, any domain vocabulary. -->
A Next.js application built with the App Router, TypeScript, and shadcn/ui.
The codebase follows a **strict feature-based architecture** — code is organized by business feature, never by technical type.

## Tech Stack

- **Framework:** Next.js 15+ (App Router, React Server Components)
- **Language:** TypeScript (`strict: true`)
- **Styling:** Tailwind CSS (with the `brand` color token)
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

The example above uses a single `api/actions.ts` and `model/schema.ts`. That's only correct while the feature has **one sub-flow**. As soon as a second sub-flow lands (e.g., `auth` gains `login`, `registration`, `email-verification`, `password-reset`), split per sub-flow — see "File Organization Within Features" below.

---

## File Organization Within Features — Split by Sub-Flow Early

The folder layout (`api/`, `model/`, `components/`) splits a feature by **technical layer**. Within each layer, split further by **sub-flow** as soon as the feature has more than one. **Do not dump everything for a feature into a single `actions.ts` / `schema.ts` and "refactor later"** — split when the second sub-flow appears, not after the fifth.

### Trigger to split

Split a file as soon as **either** is true:

- It would mix two or more unrelated sub-flows (e.g., `loginAction` + `confirmPasswordResetAction` in the same `actions.ts`).
- It would cross ~150 lines from accumulating distinct concerns.

A feature with a single sub-flow keeps a single `actions.ts` / `schema.ts`. **Don't pre-split for one concern** — that creates stub files, not structure. Splitting is triggered by a real second concern, not by anticipation.

### How to split — one sub-flow per file, per layer

Files are named after the sub-flow they implement. All artifacts of a sub-flow live next to each other inside their layer:

```
src/features/auth/
├── api/
│   ├── login.ts                  # loginAction
│   ├── registration.ts           # registerAction
│   ├── email-verification.ts     # verify + wait + hasSession
│   ├── password-reset.ts         # request + confirm
│   └── _shared.ts                # helpers used by ≥2 sub-flows
├── model/
│   ├── login.ts                  # loginSchema, LoginInput
│   ├── registration.ts           # registerSchema, RegisterInput, NAME_MIN
│   ├── email-verification.ts     # verifyEmailSchema, WaitResult
│   ├── password-reset.ts         # forgotPasswordSchema + resetPasswordSchema (one flow)
│   ├── types.ts                  # cross-flow types (AuthError, AuthResult)
│   └── constants.ts              # cross-flow constants (PASSWORD_MIN, …)
├── components/                   # already 1 file per form — same principle
│   ├── login-form.tsx
│   ├── register-form.tsx
│   ├── forgot-password-form.tsx
│   ├── reset-password-form.tsx
│   └── verify-email-client.tsx
└── index.ts                      # the only barrel; re-exports per sub-flow
```

Rules:

- **One sub-flow per file** within a layer. A sub-flow's actions live in `api/<sub-flow>.ts`; its schemas + single-flow types/constants in `model/<sub-flow>.ts`; its components in `components/<sub-flow>-*.tsx`.
- **Two related operations of the same sub-flow stay together.** `forgotPasswordSchema` and `resetPasswordSchema` are both "password-reset" — one file. `verifyEmailAction`, `waitForEmailVerificationAction`, and `hasSignupSessionAction` are all "email-verification" — one file. Don't split a sub-flow further unless it crosses the 150-line trigger on its own.
- **Internal shared helpers** go in `_shared.ts` (underscore = internal, not re-exported from `index.ts`). Use this for things like `parseFieldError` / `safeErrorMessage` that ≥2 sub-flow files reuse. Don't call it `utils.ts` — `utils` is reserved for `shared/lib/utils.ts`.
- **Cross-flow types and constants** live in `model/types.ts` / `model/constants.ts`. Single-flow types/constants stay in that flow's file (`NAME_MIN` lives in `model/registration.ts`, not `constants.ts`).
- **No layer-level `index.ts`** in `api/` or `model/`. The feature root has the only barrel; internal code imports directly from sibling files (`./login`, `./password-reset`).
- **Public API in the root `index.ts`** re-exports per sub-flow, grouped:

  ```ts
  // src/features/auth/index.ts
  export { LoginForm } from './components/login-form';
  export { loginAction } from './api/login';
  export { loginSchema, type LoginInput } from './model/login';

  export { RegisterForm } from './components/register-form';
  export { registerAction } from './api/registration';
  export { registerSchema, type RegisterInput } from './model/registration';

  // …per sub-flow, in the same shape
  ```

### `shared/api/` — one HTTP client for the whole backend

The app talks to **one backend domain**. There is one HTTP wrapper for it, and it lives in `shared/api/`. Features must not create their own:

```
src/shared/api/
├── client.ts        # apiFetch — the only HTTP wrapper for the backend
└── cookies.ts       # cookie forwarding utilities (parseSetCookie, forwardSetCookies)
```

`apiFetch` reads the backend URL from a single env var (`API_URL`), serializes JSON bodies, forwards cookies in both directions, and returns the raw `Response`. It contains zero business logic — every feature calls it directly with the explicit endpoint path.

Forbidden:

- A `client.ts` inside `features/<x>/api/` that re-implements `apiFetch`.
- A per-feature wrapper around `apiFetch` "for convenience" (`userApi.ts`, `productApi.ts` that wrap method/path). Call `apiFetch` directly with the explicit path — the indirection costs more than it saves.
- Multiple env vars for what is one backend (`AUTH_API_URL`, `BILLING_API_URL`, …). One backend → one `API_URL`.

### Backend API contract — `docs/api/openapi.json`

The full OpenAPI spec for the backend lives at `docs/api/openapi.json`. **It is the source of truth** for endpoint paths, request/response payload shapes, status codes, error models, and auth requirements (cookie-based: `accessCookie`, `refreshCookie`, `signupSessionCookie`).

**Read this file before:**

- Implementing a new `apiFetch` call from any feature.
- Extending or changing an existing API call (path, method, body, query params).
- Writing or updating a zod schema that mirrors a backend payload.
- Reasoning about error handling — the spec lists the exact error response models per endpoint (`SimpleErrorResponseModel`, `FieldErrorResponseModel`, `EntityNotFoundResponseModel`, `HTTPValidationError`).

Never guess endpoint paths, payload field names, or status codes from the codebase or memory alone — the spec wins. If the codebase and the spec disagree, the spec is authoritative; surface the discrepancy and confirm with the user before reconciling.

**Keeping it fresh:** when the backend ships changes, replace `docs/api/openapi.json` with the new export. Don't hand-edit it. If a new endpoint isn't yet in the spec, ask the user to regenerate before relying on it.

**Naming convention note:** the spec uses `snake_case` field names (`first_name`, `avatar_url`, `entity_id`, …). The frontend type system uses `camelCase` (e.g., `User.firstName`, `User.avatarUrl`). When wiring a new endpoint, map between the two at the `apiFetch` boundary inside the feature's `api/` layer — never let `snake_case` field names leak into components or zod schemas used by `react-hook-form`.

### Enums and discriminated unions — mirror exhaustively, handle exhaustively, audit exhaustively

Backend status fields, kind discriminators, and event-type enums (e.g. `CollaborationStatus`: `pending_invite | active | declined | revoked`, `ProductEventKind`: `name_changed | … | collaboration_*`) must be treated as **closed sets** end-to-end. Three rules apply, in order — skipping any one of them is how silent UI bugs ship.

**1. Mirror every variant — wire type AND domain type.** When you add or update an enum field in `api/<feature>.ts`, the wire-level union (e.g. `CollaborationSchemaResponse.status`) lists **every** variant from `docs/api/openapi.json`, not the subset that current screens happen to render. The domain type in `model/<feature>.ts` mirrors the same set. Missing variants come back from the API as plain strings, slip past `tsc`, and crash through `default:` branches at runtime. When you change one side, change both in the same diff.

**2. Handle every variant in every consumer — no fall-through ternaries.** Filters, switch-cases, badge maps, status colors, and view-mapping pipelines (anywhere code branches on the enum) must each explicitly cover every variant. Forbidden patterns:

- `status === 'X' ? 'a' : 'b'` on an enum with three or more variants — collapses every non-`X` value into `b`, which is almost never what you want for a closed set.
- `if (x.status === 'X') continue` as the **only** filter, when there are other terminal/edge statuses you also need to skip.
- A `switch` without a `case` for every variant and without a `never`-typed default that fails the build when one is missed.

Use `switch` with one explicit `case` per variant, or a `Record<EnumType, T>` lookup, so TypeScript catches missing variants for you. The `default:` branch is the place you forgot to think about, not a graceful fallback.

**3. Audit every variant when fixing a bug reported against one.** When the user names a single variant in a bug report ("declined shows as Invited", "qa_deleted doesn't refetch"), the gap that produced it almost never affects that variant alone. The same root cause — missing wire variant, fall-through `else`, status collapse, missing `case` — usually breaks every other terminal/edge variant of the same enum the same way. Before declaring the fix done, line up the variants from `openapi.json` and confirm the pipeline does the right thing for **each one**. The user reported one because that's the one they tripped over; the others are latent reports that haven't fired yet.

This applies to backend events received over WS the same way it applies to REST status fields — every `kind` in `ProductEventKind` / `CourseContentEventKind` / etc. must be explicitly handled (or explicitly invalidated in the forward-compat `default:`), and a fix for one `kind` requires verifying the others still route correctly.

### Forbidden

- **Don't pile multiple sub-flows into one `actions.ts` / `schema.ts`** and "split later". Split when the second sub-flow appears.
- **Don't pre-split a single-flow feature** into stub files. Splitting is triggered by a real second concern.
- **Don't create per-feature HTTP clients.** `@/shared/api/client` is the only `apiFetch`.
- **Don't create layer-level barrel files** (`features/<x>/api/index.ts`, `features/<x>/model/index.ts`). Only the feature root has `index.ts`.
- **Don't name the helpers file `utils.ts`.** Use `_shared.ts` inside a feature layer.

---

## UI Components — shadcn/ui Only

**Strict rule:** every component, every layout block, every primitive must be built on top of shadcn/ui. shadcn/ui is the ONLY source of UI primitives in this codebase — there are no exceptions. This applies to both atomic primitives (`Button`, `Input`, `Dialog`, `Select`, `Tooltip`, `Popover`, `Table`, etc.) and to layout/structural markup (cards, sections, sheets, navigation menus, sidebars, etc.). If shadcn/ui ships it, you use it.

If the primitive you need exists in shadcn/ui, install it:

```bash
pnpm dlx shadcn@latest add <component>
```

Check the catalog first: https://ui.shadcn.com/docs/components

Generated files land in `src/shared/ui/`.

### Build custom components on top of shadcn — never from scratch

Feature-level components (`UserAvatar`, `PostCard`, `BillingPlanRow`, etc.) must be **wrappers/compositions over shadcn primitives**, styled with the `brand` color token via Tailwind utilities and `cva`. Never re-implement a button, dialog, dropdown, or input from raw HTML — wrap the shadcn version and add behavior/styling on top.

The `brand` token is the product's brand color. It is exposed as a Tailwind token (`bg-brand`, `text-brand`, `border-brand`, `ring-brand`, `text-brand-foreground`, etc.), backed by CSS custom properties (`--brand`, `--brand-foreground`) defined in `globals.css` for both `:root` and `.dark`. **All brand-colored UI must use these tokens** — never hardcode the hex value, and never use a generic Tailwind palette color (`bg-blue-500`, `bg-indigo-600`, …) as a stand-in for the brand color.

### Customization rules

**Do not modify generated shadcn/ui files directly.** If you need something different:

- **Styling tweaks:** pass `className`, merge with `cn()`.
- **Behavioral extension:** create a wrapper in `shared/ui/<name>-extended.tsx` or inside the consuming feature.
- **A new variant:** extend with `cva` in a wrapper — do not edit the base component. Brand-accent variants should consume the `brand` token (e.g. `brand: 'bg-brand text-brand-foreground hover:bg-brand/90'`).
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

### Animations must not jitter the page during user interaction

**Animations can be rich, but they must never shake the page out from under the user.** When the user starts a sustained gesture — drag-and-drop, resize, scroll-with-momentum, marquee select, hover-to-reveal nested controls — the surface they're acting on must stay rock-still. Cards may not wobble, neighbors may not slide, breadcrumbs may not pop into existence, lists may not reorder mid-grab. The animation system serves the gesture; it never competes with it.

This is the difference between a tool that feels solid and a tool that feels twitchy. Even objectively beautiful animations become hostile if they fire while the user is mid-action. Pin them down.

**The rules:**

1. **No layout reflow during DnD.** While `dnd-kit` (or any drag interaction) is active, the surrounding grid/list must not animate item positions. Concretely: do **not** put Framer Motion `layout` / `layoutId` / `<AnimatePresence mode="popLayout">` on the items the user can drag, drop on, or pass over. Use plain DOM nodes or unanimated `motion.div`s for grid items. Reserve `layout` for genuinely beneficial cases (e.g. tab indicator under a tab strip) where a single element animates without affecting siblings.

2. **Disable hover/tap micro-animations on every card while DnD is active.** When the cursor sweeps across other cards during a drag, their `whileHover` should not fire — otherwise each card lifts and drops as the cursor passes, producing a wave of motion across the grid. Pass an `isDraggingActive` (or equivalent) prop down from the `DndContext`-owning component and gate `whileHover` / `whileTap` / `whileFocus` on it: `whileHover={isDraggingActive ? undefined : { y: -3 }}`. The same applies to CSS `:hover` effects that translate or scale — gate them on a `data-dnd-active` attribute or pass the boolean through to the className.

3. **Drop targets may pulse, not move.** A folder/section/zone that is currently `isOver` a drag may use `scale`, `ring-color`, `bg-*`, `box-shadow` — anything that does not change its layout box. It must **not** use `y`, `x`, `margin`, `padding`, `width`, `height`, `gap`, or any property that displaces siblings. The drop indicator says "yes, here" without rearranging the room.

4. **Don't pop new chrome into existence on gesture start.** If a breadcrumb, toolbar, helper hint, or instructional banner is hidden in the resting state and visible during drag, the layout below it shifts the moment the gesture begins — the user's pointer aim is broken. Either render that chrome in both states (hide its content with `opacity` only) or use `position: absolute` so it doesn't push the layout. Same rule applies to "drag handle revealed on hover" patterns: reserve the space at rest.

5. **Surfaces that are themselves the gesture target stay still until the gesture ends.** A panel being resized doesn't bounce-spring on every pointer move — it follows the cursor 1:1. A modal being dragged doesn't rotate on grip. Spring-based feedback (settle, bounce, snap) fires on `dragEnd` / `pointerUp`, not during.

6. **Long lists scroll smoothly because items are stable.** Do not animate the entry of every product/post/row when the page mounts. Stagger animations are fine for short lists, but for a 50+ item grid that the user is about to scroll, mounting all 50 with delayed entry creates a sustained shimmer that fights the scroll. Animate only the first paint above the fold; let later items appear without entry animation.

7. **Animate state changes, not gesture moves.** A successful drop produces a rich animation (the grid reorders, the dropped item snaps in, the source list closes its gap). That animation runs *after* `dragEnd`, when the user has committed. During the gesture itself, only the dragged ghost and the drop-target indicator move. Everything else holds.

**Practical wiring (DnD example):**

```tsx
function Library() {
  const [activeDrag, setActiveDrag] = useState<DragKind | null>(null);
  return (
    <DndContext
      onDragStart={(e) => setActiveDrag(toKind(e))}
      onDragEnd={() => setActiveDrag(null)}
      onDragCancel={() => setActiveDrag(null)}
    >
      {/* No `layout`, no `popLayout`. Plain <li>. */}
      <ul className="grid ...">
        {items.map((item) => (
          <li key={item.id}>
            <Card item={item} isDraggingActive={activeDrag !== null} />
          </li>
        ))}
      </ul>
    </DndContext>
  );
}

function Card({ item, isDraggingActive }) {
  const reduceMotion = useReducedMotion();
  const { isOver } = useDroppable({ id: item.id });
  return (
    <motion.div
      // Hover lift OFF while dragging anything in the surface.
      whileHover={
        reduceMotion || isDraggingActive ? undefined : { y: -3 }
      }
      // Drop-target signal: scale + ring. Both are layout-neutral.
      animate={isOver ? { scale: 1.02 } : { scale: 1 }}
      className={cn('rounded-2xl ring-1', isOver && 'ring-2 ring-brand')}
    >
      {/* ... */}
    </motion.div>
  );
}
```

**How to debug a "page is shaking" report:**

1. Open the surface in DevTools and start a drag. With Paint Flashing on (Rendering tab), every animated element flashes — anything that's flashing AND not the dragged ghost is a candidate culprit.
2. Search the affected component tree for `layout`, `layoutId`, `mode="popLayout"`, `whileHover`, `whileTap`, `animate-*` Tailwind utilities, and CSS `transition: all`. For each, ask: does it fire only on commit, or also during the gesture? If the latter, gate it.
3. Check for chrome that conditionally renders on `isDragging` / `active` / `isHover` — replace with always-render + conditional opacity, or absolute positioning.
4. Confirm the dragged ghost is rendered in `<DragOverlay>`, not from the source position with a transform. Source cards should remain in place (semi-transparent is fine).

### Forbidden

- **No raw CSS keyframe animations** for behavior Framer Motion can express. (Tailwind's built-in `animate-*` utilities for trivial loaders/spinners are fine.)
- **No competing animation libraries** (GSAP, react-spring, auto-animate, anime.js, etc.). Framer Motion is it.
- **No `setTimeout`-based "animations"** — use Framer Motion or CSS transitions.
- **No `layout` / `layoutId` / `mode="popLayout"` on items inside a DnD surface.** They animate sibling positions on every drag-related change and produce the "page is shaking" effect described in "Animations must not jitter the page during user interaction".
- **No `whileHover` / `whileTap` / `whileFocus` that fires while DnD is active.** Gate every card-level micro-animation on `isDraggingActive` (or whatever the local equivalent is); a wave of lifts as the cursor sweeps the grid is a bug.
- **No layout-displacing properties (`y`, `x`, `margin`, `padding`, `width`, `height`, `gap`) on a drop-target's `isOver` state.** Use `scale`, `ring-color`, `box-shadow`, `bg-*` — properties that don't move siblings.
- **No chrome that pops in on gesture start** (breadcrumb, helper banner, hidden toolbar appearing on `isDragging`). Either render it in both states with `opacity` toggling, or position it absolutely so the layout below doesn't shift.
- **No staggered entry animations on long lists the user will scroll.** Animate the first paint above the fold; let later items appear without entry animation.

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
- **No hardcoded hex/rgb colors** in class lists. Use design tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-input`, `ring-ring`, `bg-primary`, `text-primary-foreground`, `bg-brand`, `text-brand`, `text-brand-foreground`, etc. These come from the shadcn/ui theme in `globals.css`. The `brand` token is the only correct way to reference the product's brand color — never substitute a generic palette color (`bg-blue-500`, `bg-indigo-600`, …).
- **No `!important`** in class lists. If you need it, your architecture is wrong — restructure instead.
- **No manual `dark:` variants for colors that are already tokenized.** The token system handles dark mode automatically. Use `dark:` only when a genuinely different utility (not just color) is needed in dark mode.

### Design tokens

Colors, radii, and other theme values live as CSS custom properties in `globals.css` (provided by shadcn/ui init) and are exposed to Tailwind through `tailwind.config`. To add a new token:

1. Add the CSS variable to `:root` and `.dark` in `globals.css`.
2. Add the Tailwind mapping in `tailwind.config`.
3. Use it as a utility: `bg-my-token`.

Never hardcode a one-off color in a component — add a token.

### Pointer cursor on interactive elements

**Every clickable element must show `cursor: pointer` on hover.** Tailwind v4's preflight matches the modern browser default (`cursor: default` on `<button>`), which makes interactive surfaces feel dead. We override this back to v3 behavior with a single base-layer rule in `src/app/globals.css`:

```css
@layer base {
  button:not(:disabled),
  [role="button"]:not(:disabled) {
    cursor: pointer;
  }
}
```

This covers native `<button>` (used by shadcn `Button`, `DropdownMenu` triggers, `SheetTrigger`, etc.) and any element with `role="button"`. Anchor tags (`<a>`) already get `cursor: pointer` from the browser when they have `href`. Disabled buttons keep the default cursor — they already have `pointer-events-none` via shadcn's `disabled:` utilities.

**Don't add `cursor-pointer` utility classes manually** — the global rule already covers every clickable element. If something feels "stuck" with the wrong cursor, the bug is that it isn't a `<button>` / `[role="button"]` / `<a>` — fix the semantics, don't paper over it with a utility.

**Forbidden:**

- **No `cursor-pointer` utility on individual components.** It's redundant with the global rule and creates noise.
- **No fake "buttons" built on `<div>`** without `role="button"` (and `tabIndex={0}` + keyboard handler). Either use a real `<button>` or apply the role properly so the global cursor rule kicks in.

---

## Theming — Light & Dark

**Every UI must support both light and dark themes, built and verified together in the same task.** Dark mode is not a follow-up phase — it ships at the same time as the feature. A component that only looks right in one theme is not done.

### Initial theme = system preference

- First load resolves to the user's OS setting via `prefers-color-scheme`. A visitor on a dark OS sees dark; on light — light. No hardcoded default that overrides the system.
- Once the user picks a theme explicitly via the in-app toggle, persist that choice (handled by `next-themes` default behavior) and respect it on subsequent visits.
- Mechanism: `next-themes` configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`. The `ThemeProvider` wraps the root layout (`app/[locale]/layout.tsx`). Add `suppressHydrationWarning` to the `<html>` element to avoid hydration mismatch on first paint.
- The `.dark` class attaches to `<html>`, which activates the `.dark` block in `globals.css`. That's what makes tokens flip — don't reach for `data-theme` attributes or custom class names.

### How to build for both themes

- **Use design tokens, always.** `bg-background`, `text-foreground`, `text-muted-foreground`, `border-input`, `bg-card`, `bg-primary`, `text-brand`, etc. These are defined for both `:root` and `.dark` in `globals.css` and flip automatically — you get dark mode for free when you follow the existing "Styling" rule.
- **Reach for `dark:` only for non-color differences** or when the token system genuinely can't express what you need. Valid cases:
  - Swapping an image/illustration/logo between themes (`block dark:hidden` / `hidden dark:block`).
  - An SVG with hardcoded `fill`/`stroke` you don't control (prefer `currentColor` first; `dark:` as fallback).
  - Shadows and glows whose intensity/color must differ (`shadow-lg dark:shadow-black/40`).
  - Overlay opacities where the same token reads too strong/weak in the other theme.
- **Do not write `dark:` on something already tokenized.** `bg-white dark:bg-black` is a bug — use `bg-background`. If you're tempted to add `dark:` to a color utility, that's the signal to use (or add) a token instead.

### Adding a new token

When you need a color that doesn't exist, extend the token system — don't inline it:

1. Add the CSS variable to **both** `:root` and `.dark` in `globals.css`, picking values that work in each theme (sufficient contrast, intentional hierarchy).
2. Map it in `tailwind.config`.
3. Use the Tailwind utility (`bg-my-token`). The theme flip is automatic.

### Contrast & readability

- Text on every surface must meet at least WCAG AA (4.5:1 for body, 3:1 for large text) in both themes. If a token pair fails, fix the token, not the component.
- Don't rely on pure black (`#000`) backgrounds in dark mode — use the shadcn dark `--background` token (dark gray). Pure black kills depth and makes shadows invisible.
- Borders and dividers often disappear in one theme and scream in the other. If that happens, you're using the wrong token (use `border-border` / `border-input`, not a hardcoded gray).

### Images, illustrations, screenshots

- Content imagery (photos, user avatars): usually theme-agnostic — no action needed.
- Brand/UI illustrations with embedded backgrounds: provide a light and dark variant and swap via `dark:` visibility utilities, or build them with `currentColor` so they inherit from `text-foreground`.
- Next.js `<Image>`: no special treatment unless the asset itself is theme-specific.

### Toggle UI

- A visible theme toggle (light / dark / system) lives in the app chrome (header, user menu, or settings — depends on the surface). The "system" option must exist — don't force users into a binary choice.
- Built with shadcn primitives (`DropdownMenu` + icon `Button`), with the `brand` token on the active state.

### Verification (reinforces Visual Verification)

Dark mode is **not optional** in the "Before You Say Done" checklist, and every theme check goes through the **Playwright MCP** — same as the responsive sweep. For every UI change:

- Flip to dark via `mcp__playwright__browser_click` on the `ThemeToggle` (or `browser_evaluate` with `document.documentElement.classList.add('dark')`) and walk the same flow again — states, forms, errors, hover/focus, animations.
- Check the three viewports in **both** themes via `browser_resize` + `browser_take_screenshot` (six screenshots minimum per affected route, filename-encoded like `home-375-dark.png`).
- Emulate `prefers-color-scheme: dark` with `browser_evaluate` (`page.emulateMedia` via inline JS) and reload to confirm the system-default path paints correctly on first render with no flash — no `next-themes` initial-flash regression.

### Forbidden

- **No "dark mode later".** Ship both themes together or don't ship the feature.
- **No hardcoded default theme** that ignores the OS on first visit. Initial = system.
- **No `bg-white` / `bg-black` / `text-gray-900` / hex values** as stand-ins for tokens. Every color goes through a token.
- **No `dark:` utilities layered on top of already-tokenized colors.** If you're writing `bg-white dark:bg-black`, use `bg-background`.
- **No alternative theme libraries** (`@theme-ui`, custom context with `data-theme`, cookie-only toggles without `prefers-color-scheme` support). `next-themes` + shadcn tokens is the stack.

---

## Design References — implement them literally

**When the user attaches a design reference (Figma frame, mockup, screenshot, image of another product, link to a live site), it is the spec. Implement it exactly as shown — every element, every piece of copy, every layout decision, every color, every spacing, every state.** A reference is not "inspiration" or "vibes" — it's a binding contract on the visual output.

### The rule

- **Everything visible on the reference must be present in the implementation.** Headings, subtext, icons, badges, helper rows, secondary CTAs, illustrations, dividers, empty-state copy, micro-labels — if it's in the reference, it's in the build. Don't drop elements because they "feel optional" or "could be added later".
- **Match the layout the reference shows.** Order of elements, alignment, grouping, proportions, whitespace, column counts, card sizes, image aspect ratios. Don't reshuffle the composition or substitute a different pattern (e.g. tabs → accordion) just because a shadcn primitive nudges you that way.
- **Match the visual treatment.** Typography hierarchy (size/weight ratios), corner radii, border styles, shadow depth, divider weight, density, padding rhythm. Translate to design tokens (`bg-background`, `text-muted-foreground`, `border-input`, `bg-brand`, etc.) — never hardcode hex — but the tokens you pick must reproduce what's on the reference.
- **Match the copy verbatim** (subject to i18n rules — the key goes to `messages/ru/<namespace>.json` with the reference's exact wording). Don't paraphrase, "improve", shorten, or invent labels the reference doesn't show.
- **Match the states the reference shows.** If the reference includes hover / active / selected / empty / error / loading frames, build each one as drawn. If it only shows a default frame, derive the other states from existing conventions in this codebase — don't invent a new pattern.

### What you may add on top

- **Animations and micro-interactions** consistent with the Framer Motion conventions above (mount/unmount, hover/tap feedback, list staggers, route transitions). The reference is static; motion polish is expected.
- **Responsive adaptation** to the viewports the reference doesn't show (see "When a prompt describes only one viewport" — extract the intent, build a viewport-appropriate equivalent). The desktop reference is desktop truth; mobile is your responsibility to translate, not to skip.
- **Dark theme** built from the same token decisions (see Theming). The reference is the light-theme spec unless the user attached a dark frame too.
- **Accessibility plumbing** the reference can't show — focus rings, `aria-*`, keyboard handlers, reduced-motion fallbacks. These are additions, never substitutions.

### What you may NOT do

- **Don't omit elements** because you think the screen is "too busy", because shadcn doesn't have a primitive for it, because you'd build it differently, or because "the user probably doesn't need that part". If it's drawn, it ships.
- **Don't substitute a different component pattern** (tabs → segmented control, modal → sheet, card grid → list) without asking. The reference is the layout decision.
- **Don't rewrite the copy.** Even if the reference's wording feels long, awkward, or untranslated — ship it as-is and flag the concern separately. Copy edits are a separate task.
- **Don't "simplify" the visual hierarchy.** Three font sizes in the reference means three font sizes in the build, not two.
- **Don't invent elements the reference doesn't show** beyond the allow-list above (motion, responsive translation, dark theme, a11y plumbing). If you think something should be added, ask first.

### When the reference conflicts with this file

Design references override generic visual defaults in this CLAUDE.md (default densities, default spacings, your own taste). They do **not** override hard architectural / technical rules: feature boundaries, the shadcn-only primitive layer, design tokens (use the token that matches the reference color, don't hardcode the hex), i18n (copy still goes through `next-intl`), Framer Motion as the animation library, mobile-first responsive, dark theme parity. If a reference seems to require breaking one of these rules, **ask the user before deviating** — don't silently pick one side.

### When the reference is incomplete or ambiguous

Ask. A missing state, an unclear interaction, an unspecified viewport, a label you can't read — surface the gap explicitly rather than guessing. "The reference shows the default and hover frames but not the error state — should I derive it from existing conventions or do you have a frame for it?" is the right move. Inventing visual decisions to fill gaps in a reference is how implementations drift away from the spec.

---

## Responsive Design — Mobile, Tablet, Desktop

**Every screen must be designed and built for three viewports: mobile, tablet, desktop.** Ship nothing that works only on one. Responsive is not an afterthought — it's part of "done".

### Breakpoints (three-tier model)

Use Tailwind's default tokens, but commit to exactly three tiers:

| Tier        | Width range          | Tailwind prefix | How to write it                  |
| ----------- | -------------------- | --------------- | -------------------------------- |
| **Mobile**  | `< 768px`            | *(no prefix)*   | base utilities — the default    |
| **Tablet**  | `768px – 1023px`     | `md:`           | `md:grid-cols-2`                 |
| **Desktop** | `≥ 1024px`           | `lg:`           | `lg:grid-cols-3`                 |

- `sm:` (640px) is **not** part of the standard ladder — avoid it. Only reach for it as a narrow exception when the mobile layout genuinely needs a mid-mobile tweak (e.g. a large phone in landscape). Don't use it as "small tablet".
- `xl:` / `2xl:` are for wide-screen polish only (e.g. increasing a max-width container, adding an extra column on ultrawide). They are never a required tier — a screen that only works starting at `xl:` is broken.

### Mobile-first is mandatory

- Base classes describe the **mobile** layout. Add `md:` / `lg:` utilities to scale *up*, never down.
- Forbidden pattern: writing a desktop layout first and then undoing it with `max-md:` / negative overrides. Start small, add complexity at wider breakpoints.
- No desktop-only components. If a feature renders on desktop, it has a mobile equivalent (even if it's a simpler stacked version or an alternative control like a sheet instead of a popover).

### When a prompt describes only one viewport

Design briefs and ad-hoc requests almost always describe **one** viewport — usually desktop (that's how Figma mockups are drawn, that's how users dictate specs). When the spec clearly doesn't translate 1:1 to the other viewports, **don't copy-paste the spec across sizes and don't skip mobile.** Extract the intent of the interaction and invent a viewport-appropriate equivalent.

**Worked example.** User says:

> *"I want a 700px menu sliding in from the right."*

- **Desktop / tablet (≥ 768px):** apply as specified — `max-w-[700px]` side panel sliding from the right.
- **Mobile (< 768px):** 700px doesn't fit in a 375px viewport. Substitute the pattern that carries the same intent — "a secondary surface that opens over the primary content and can be dismissed". Default answer: a full-height `Sheet` sliding from the bottom, or a full-screen modal with a close button. Pick based on content weight.

**What "same intent" looks like — translation cheatsheet** (starting point, not exhaustive):

| Desktop pattern                              | Mobile equivalent                                       |
| -------------------------------------------- | ------------------------------------------------------- |
| Side drawer / slide-out panel (fixed width)  | Full-height `Sheet` (bottom or side) or full-screen     |
| Hover preview (`HoverCard`)                  | Tap opens the real target — no peek                     |
| Multi-column layout                          | Single stacked column; tabs if genuinely separate views |
| Right-click context menu                     | Visible kebab (`⋯`) → `Sheet`                           |
| Wide form dialog                             | Full-screen `Sheet` or a dedicated route                |
| Persistent sidebar navigation                | Hamburger / icon trigger → `Sheet`                      |
| Resizable split pane                         | Tabs or stacked sections                                |
| Data table with many columns                 | Card list showing primary 2–3 fields + tap for detail   |
| Drag-to-reorder with grab handle             | Explicit "Reorder" mode + up/down buttons               |
| Toolbar with 8 icons                         | Primary 2–3 icons + overflow `⋯` menu                   |
| Large tooltip                                | Inline help text or a `?` popover triggered by tap      |

**Rules for the translation:**

1. **Always translate, never skip.** If the spec doesn't work on mobile, invent the mobile version. "Responsive" does **not** mean "hide on mobile" unless the user explicitly said so.
2. **Tell the user what you translated — don't adapt silently.** In the handoff, surface it plainly: *"You asked for X. I applied X as-given for desktop and tablet (≥768px). For mobile (<768px) I substituted Y because X doesn't fit in 375px — [one-line reason]. Flag if you want a different pattern."* The user should never discover a mobile substitution by accident.
3. **Decide when obvious, ask when ambiguous.** 700px side panel → bottom sheet on mobile: obvious, just do it and note it. Complex multi-column dashboard with custom drag-resize on mobile: ambiguous — ask what to prioritize (which columns matter most, should it become tabs, etc.) before committing.
4. **Preserve the function, not the form.** The mobile pattern must deliver the same user outcome (see the detail, act on an item, compare two things). The rectangle doesn't have to look like the desktop rectangle.
5. **Tablet usually rides with desktop, not mobile.** At 820px a 700px panel still fits (tightly). Default: apply the desktop pattern from `md:` up, and only escalate to the mobile substitution if even tablet runs out of room.
6. **The substitution is still tokenized and motion-respecting.** A mobile `Sheet` still uses design tokens (`bg-background`, etc.), still animates via Framer Motion / shadcn's built-in transitions, still supports `Esc` / swipe-to-dismiss. Don't cut polish because it's "just the mobile version".

### Layout rules

- **No fixed pixel widths** on layout containers. Use `w-full` with `max-w-*` caps. Fixed widths (`w-[960px]`) are a bug on mobile.
- **Grids & flex**: default to one column / stacked on mobile, grow columns at `md:` and `lg:`. Example: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.
- **Spacing scales with viewport**: tighter on mobile, looser on desktop — `px-4 md:px-6 lg:px-8`, `gap-4 md:gap-6`, `py-8 md:py-12 lg:py-16`.
- **Typography scales**: `text-2xl md:text-3xl lg:text-4xl` for headings. Body copy usually stays constant.
- **Navigation**: mobile = hamburger / sheet (shadcn `Sheet`). Tablet/desktop = inline nav. Don't cram a desktop nav onto mobile.
- **Modals vs sheets**: on mobile prefer `Sheet` (bottom/side) over `Dialog` for anything non-trivial — it respects the viewport. On desktop, `Dialog` is fine.
- **Tables**: tables don't fit on mobile. Either render a card/list view under `md:` and switch to a table at `md:`+, or make the table horizontally scrollable inside a container with `overflow-x-auto`.
- **Images / media**: always `max-w-full h-auto` (or Next.js `<Image>` with `sizes` covering all three tiers). Never rely on intrinsic width.

### Touch & input

- **Tap targets ≥ 44×44 px** on mobile/tablet. shadcn defaults mostly cover this — don't shrink buttons below `h-10` / `h-11` for touch surfaces. Icon-only buttons need visible padding, not just a 16px icon.
- **Hover states are not a replacement for tap behavior.** Anything discoverable on hover must also work via tap on touch devices — use `:focus-visible` and explicit tap affordances.
- **Respect safe areas** on mobile: for fixed bottom bars, use `pb-[env(safe-area-inset-bottom)]` (or the Tailwind arbitrary variant) so iOS home-bar doesn't overlap content.

### Testing — part of "done"

Before marking any UI task complete, verify through the **Playwright MCP** (`mcp__playwright__browser_resize` + `browser_take_screenshot`) at all three widths:

- **Mobile:** 375 × 667
- **Tablet:** 820 × 1180
- **Desktop:** 1440 × 900

For each: call `browser_resize` to the target size, navigate (or re-screenshot), save with a filename that encodes viewport + theme (e.g. `posts-820-light.png`). Check: layout doesn't overflow, nothing gets clipped, tap targets are usable, text doesn't wrap into awkward lines (remember: `/ru` is the layout reference — Cyrillic copy is the test case). If the Playwright MCP is unavailable, say so explicitly per the Honesty gate — don't claim responsive correctness from type-checking, curl, or DOM inspection alone.

### Container queries (optional)

For self-contained components whose layout depends on their *own* width (e.g. a card that sits in a sidebar on desktop but full-width on mobile), use Tailwind's container queries (`@container` / `@md:`) instead of viewport breakpoints. Use sparingly — viewport breakpoints are the default.

### Forbidden

- **No desktop-first CSS.** No `max-md:` / `max-lg:` overrides to "undo" desktop styles for smaller screens. Mobile-first only.
- **No `sm:` as the tablet breakpoint.** Tablet = `md:`.
- **No fixed pixel widths** (`w-[1200px]`) on layout containers. Use `max-w-*`.
- **No desktop-only features** without a mobile equivalent.
- **No hover-only interactions** on elements that must be usable on touch.
- **No horizontal scrolling on the page body** at any breakpoint (inside a scroll container like a table is fine).

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

### Translation scope — RU-only by default

**By default, only write real translations in Russian.** English translations are added **only when the user explicitly asks** (e.g. "переведи на en", "add English copy", "localize to English").

Operationally, for every key you add:

1. Put the real Russian copy in `messages/ru/<namespace>.json`.
2. **Mirror the same Russian value verbatim** into `messages/en/<namespace>.json` under the same key — as a placeholder. The key must exist in both files (otherwise `next-intl` throws at runtime when a user lands on `/en`), but the **value** on the English side is intentionally the Russian placeholder until a translation pass happens.
3. **Do not** machine-translate, invent English copy, or ask an LLM to translate inline. The placeholder stays Russian until the user asks for a proper English pass.

When the user requests English translations, do a proper pass on every `messages/en/` key currently holding a Russian placeholder within the affected scope (feature / namespace / whole app — whatever they specify).

### Adding or changing copy

1. Always add (or update) the key in **both** `messages/ru/<namespace>.json` and `messages/en/<namespace>.json` — the key has to exist in every locale file or `/en` crashes at runtime. The RU file gets the real copy; the EN file gets the same RU value as a placeholder per the "RU-only by default" rule above.
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

## Environment Variables — `.env.dist` is the contract

**Every environment variable read by the app must be listed in `.env.dist` at the repo root.** `.env.dist` is the committed template that documents which variables exist, what they're for, and what a safe default looks like for local development. Real secrets live in `.env.local` (gitignored); `.env.dist` is the public contract.

### Mandatory workflow when adding or changing env vars

Whenever you introduce a new `process.env.X` reference, rename one, change its meaning, or remove it — **update `.env.dist` in the same change**, not later:

1. Add the variable to `.env.dist` with:
   - A short comment line above it explaining what it's for and where it's read (server / client / both).
   - A safe placeholder or local-dev default value (never a real secret, real token, or production URL).
2. If the variable is required at boot, validate it in `src/shared/config` with zod — don't read raw `process.env` from feature code.
3. If the variable is renamed or removed, update `.env.dist` in the same commit so the template never drifts from the code.

`.env.dist` and the set of `process.env.X` reads in the codebase must match exactly — no orphan entries in the template, no undocumented reads in the code. Treat a mismatch the same as a failing typecheck.

### Naming

- `NEXT_PUBLIC_*` — exposed to the browser. Use only for values that are safe to ship in the client bundle (public URLs, public keys). Never put a secret behind a `NEXT_PUBLIC_` prefix.
- Everything else is server-only and must never be referenced from a Client Component.

### Forbidden

- **Don't** add a `process.env.X` read without adding `X` to `.env.dist` in the same change.
- **Don't** put real secrets, production credentials, or live API keys in `.env.dist` — it's committed. Use placeholders or local-dev defaults.
- **Don't** read env vars directly from feature code when the value needs validation — go through `shared/config`.
- **Don't** prefix a server secret with `NEXT_PUBLIC_` to "make it work in the browser". If the browser needs it, it isn't a secret; if it's a secret, the browser cannot have it.

---

## Error Handling

- `error.tsx` and `not-found.tsx` at route boundaries.
- Server Actions return discriminated results — don't throw for expected failures.
- Validate all external input (form submissions, search params, webhook bodies) with zod.
- Don't leak stack traces or internal error messages to the client. Log server-side, return a safe message to the user.

### Page-Level Failures — Redirect to 404 / 500, Don't Fake It

When a page's **primary resource** fails to load — the entity that gives the page its identity (the product on `/products/[id]/editor`, the user on `/profile`, the list on `/products`) — the page is broken. Send the user to a real error screen. Don't render a stub, mock, or "best-effort" version of the page.

The two destinations are the global error pages built on `<ErrorContent>`:

- **Entity not found** (HTTP 404, or a discriminated `{ ok: false, reason: 'not-found' }`): call `notFound()` from `next/navigation`. Renders `app/not-found.tsx`.
- **Network or server error** (HTTP 5xx, timeout, parse failure, `{ ok: false, reason: 'network' | 'unknown' }`): `throw new Error(...)`. The closest `error.tsx` boundary catches it and renders the 500 page (`src/app/[locale]/error.tsx`).

Both pages share the look — they render `<ErrorContent>` from `src/widgets/error-content` with the relevant translation namespace (`not-found`, `error-500`, …). When you need a new error variant, add a namespace JSON and reuse `<ErrorContent>` rather than building a new layout.

**Primary vs. secondary** — the redirect rule applies **only** to the primary fetch:

- **Primary** — the resource the page IS about. Removing it leaves no page. The product on the editor route. The user on the profile route. The list on a list page. Failure → redirect (`notFound()` / `throw`).
- **Secondary** — supporting content: a side widget, an optional list inside a richer page, an inline preview, an avatar lookup, a "related items" rail, a button-triggered action. Failure → handle inline (empty state, retry button, dismissable error). **Don't** kick the user off the page they were on because a side panel went down.

**Don't substitute a mock or stub** when the primary load fails. A page that silently renders a fake product or an empty list on error hides bugs and makes data loss look like normal state. The user must see they hit an error.

**Pattern (Server Components):**

```ts
// src/app/[locale]/(app)/(teach)/products/[id]/editor/page.tsx
import { notFound } from 'next/navigation';

const result = await getProductById(id);
if (!result.ok) {
  if (result.reason === 'not-found') notFound();
  throw new Error(`Failed to load product ${id}: ${result.reason}`);
}
const product = result.product;
```

**Pattern (Client Components / TanStack Query):** when the primary query errors, call `notFound()` from `next/navigation` (it works in Client Components too) for missing entities, or `throw` from inside render to trigger the closest `error.tsx`. Don't render a "best-effort" version of the screen.

Cases that look like primary failures but aren't:

- **Auth gate** (`unauthorized` from a server fetch inside an authenticated route): already handled by the `(app)` layout's redirect to `/login`. Don't double-handle inside the page.
- **Optimistic mutation rollback**: surface inline (toast + revert), not a page redirect.
- **Stale revalidation failure**: keep the previous data, log, surface inline if needed.

### Surfacing Errors — Inline (Alert / FieldError) vs Toast

Once Page-Level Failures are out of the way, the remaining errors need to land where the user actually is. The choice between **inline** (`Alert` / `FieldError`) and **Toast** (`sonner`) is not a styling preference — it follows from whether the error is **persistent state the user must act on** or a **transient event that has already passed**.

**The rule**

- **Inline** — the error reflects the current state of the surface (form, section, action) and the user must do something before moving forward. It does not go away on its own. Lives until the user retries, edits, or otherwise resolves it.
- **Toast** — the error is about a transient event with no surviving inline anchor: a background sync failed, an optimistic mutation rolled back, an action that already navigated away from its trigger. Auto-dismisses; non-blocking.

If the form/section is still on the screen and the error blocks completion → **inline**. If the trigger is gone and there's nothing inline to point to → **toast**. Never both for the same error.

**Decision table**

| Situation | Where | Why |
| --- | --- | --- |
| Field validation (zod, client) | `FieldError` under the input | Tied to a specific field; user must fix it |
| Backend per-field error (`first_name` invalid, returned by 422) | `FieldError` mapped via `form.setError(field, ...)` | Backend pinpointed the field — show it there |
| Backend rejected with no specific field (wrong credentials, account locked, conflict, rate-limited) | Form-level `Alert variant="destructive"` near the submit | Persistent form state; user must change input or wait |
| Network/timeout on a submit while the form is still open | Form-level `Alert` near the submit, button switches to "Retry" | A disappearing toast loses the context; user wants to retry from where they are |
| Permission denied on an action just attempted | Inline near the action / form-level `Alert` | User needs to understand *why* — toast is too thin |
| Secondary widget failed to load | Inline empty/error state inside the widget, with retry | Already covered by Page-Level Failures: secondary failure → handle inline |
| Optimistic mutation rolled back (delete, archive, reorder, like) | Toast + UI revert | The trigger is no longer present; toast announces and the UI reverts |
| Action completed and navigated away (delete from detail → list) | Toast on the destination | No inline anchor remains |
| Background / auto-save / sync failure | Inline status indicator ("Saved 2s ago" / "Save failed — retrying"); escalate to a banner if it persists | Sustained state, not a one-shot event — don't bury it in a toast |
| Cross-cutting transient ("Couldn't refresh activity feed") | Toast | Non-blocking, no action required |
| Cross-cutting persistent ("Connection lost — reconnecting") | Top banner (not a toast) | Sustained state; user needs ongoing visibility |
| Success of a navigated-away action | Toast on the destination | Confirmation, no further action |
| Success while staying on the form | Usually nothing (form state changes — disabled button, redirect, fresh data); toast only if the user has no other signal | Avoid toast spam for outcomes the UI already shows |

**Patterns**

*Auth forms* — inline `Alert` for the form-level error (`invalidCredentials`, `emailNotVerified`, `accountLocked`, `rateLimited`, `network`); `FieldError` for field validation. **Never a toast** for an auth failure — toasts disappear, and auth feedback must persist while the form is open.

*Server Action returning a discriminated result* — see `features/auth/api/login.ts` for the canonical shape. Map per-field errors via `form.setError(field, ...)` (renders in `FieldError`); map form-level reasons (`invalidCredentials`, `network`, `unknown`) to local component state that renders in an `Alert` above/near the submit. Never throw for expected failures (already covered above).

*Mutation that stays on the page with retry* — `Alert` next to the trigger, button label switches to "Retry". Don't toast.

*Mutation that completes and moves on* — toast on the destination (success or failure).

*Optimistic rollback* — toast announcing the rollback ("Couldn't archive post — restored"). The UI has already reverted; the toast explains why. Include an action button when retry makes sense.

**Components in this codebase**

- **`FieldError`** from `@/shared/ui/field` — field-level error, integrated with `react-hook-form` via the shadcn `Field` primitives.
- **`Alert variant="destructive"`** from `@/shared/ui/alert` — form-level / section-level persistent error. Lives **inside** the form/section near the action, not floating.
- **`sonner`** from `@/shared/ui/sonner` — transient toast. Auto-dismisses; supports an action button (use it for retry on rollback).
- All strings (alert title/body, field message, toast text) go through `next-intl` like every other user-facing string.

**Forbidden**

- **Don't** show the same error in both an `Alert` and a Toast. Pick one.
- **Don't** use a Toast for a form/auth error while the form is still open. Inline `Alert` — period.
- **Don't** use a Toast for a network failure on a submit while the form is on screen. Inline `Alert` + Retry.
- **Don't** use an `Alert` for a transient event with no inline anchor (post-navigation rollback, background sync). Toast.
- **Don't** auto-dismiss a form-level `Alert`. It clears when the user changes input or retries — not on a timer.
- **Don't** use a confirm dialog as an error surface for anything an inline `Alert` could carry.
- **Don't** place errors at the top of the page when the trigger is at the bottom. Anchor the error to the action that produced it.
- **Don't** swallow errors silently. If the user might wonder "did that work?" — surface it (inline or toast).
- **Don't** toast every successful save. If the UI already reflects the change (button disabled → enabled, redirect, fresh data), the toast is noise.

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

## Keyboard Shortcuts — Keymaps for Primary Actions

**Primary interactive actions must be bound to keyboard shortcuts, not just to clickable buttons.** This product is built to feel fast and pro — opinionated about keyboard-first flow (Linear / Superhuman / Figma territory). A user who prefers the keyboard should be able to complete core operations without touching the mouse, and a mouse user still sees the binding hinted in the UI.

This is **not** "bind every button". It's "bind the primary action of each surface, consistently."

### What counts as a primary action (bind it)

Any action that is the main CTA of a surface, or performed frequently in the flow. Default mapping — use these exact combinations unless there's a real reason not to:

| Action                                | Keybinding                   | Where                                                   |
| ------------------------------------- | ---------------------------- | ------------------------------------------------------- |
| Submit / Send / Save / primary CTA    | `Cmd/Ctrl + Enter`           | Forms, message composers, modals with a primary action  |
| Explicit save (outside a submit flow) | `Cmd/Ctrl + S`               | Editors, documents, settings pages                      |
| Create new item                       | `Cmd/Ctrl + N`               | List/collection surfaces with a "New …" CTA             |
| Open command palette                  | `Cmd/Ctrl + K`               | Global — entry point to discover all other shortcuts    |
| Search within surface                 | `/`                          | Lists, tables, long pages                               |
| Close / cancel / dismiss              | `Esc`                        | Modals, sheets, popovers, drawers, command palette      |
| Confirm in a dialog                   | `Enter`                      | Confirm dialogs with focus on the confirm button        |
| Delete selected item                  | `Cmd/Ctrl + Backspace`       | Only with a confirm step for destructive actions        |
| Attach / pick file                    | `Cmd/Ctrl + Shift + O`       | Surfaces where file attach is a primary action          |
| List navigation                       | `↑` / `↓` / `j` / `k`        | Lists, tables, command palette                          |
| Open focused row                      | `Enter`                      | Inside a navigable list                                 |
| Show shortcuts overlay                | `?`                          | Global — lists all shortcuts active on the current view |

### What NOT to bind

- Tertiary / rarely-used actions. Noise kills discoverability of the bindings that matter.
- Destructive actions without a confirm step. `Cmd+D` that silently deletes = bug.
- Anything that conflicts with system/browser shortcuts users rely on (`Cmd+R`, `Cmd+T`, `Cmd+W`, `Cmd+L`, `Cmd+F` when it's useful as browser find, etc.).
- Duplicates / aliases across the product for the same action — pick one, stay consistent.

### Cross-platform

- macOS shows `⌘` (the `metaKey`); Windows/Linux show `Ctrl`. Detect the platform once in `shared/lib/platform.ts` and render the correct symbol in tooltips / the shortcuts overlay / the command palette — don't hardcode `Ctrl` on macOS or vice versa.
- On touch devices, hide the shortcut hint entirely — it's noise on mobile. The action itself (button / tap target) stays.

### Implementation

- **Library:** `react-hotkeys-hook` is the standard. Don't mix it with ad-hoc `useEffect(() => window.addEventListener('keydown'))` — pick one system and stay in it.
- **Command palette:** build on shadcn's `Command` primitive (which uses `cmdk`). Every command in the palette displays its shortcut on the right.
- **Scoping:** shortcuts must be scoped to the surface they belong to. A modal's `Esc` fires only while the modal is open; a list's `↑ ↓` fires only while the list is focused/active. Use `useHotkeys` scopes, not global listeners that guard themselves with conditionals.
- **Inputs / textareas:** by default, letter-key shortcuts (`/`, `?`, `j`, `k`) do **not** fire while the user is typing in a field. Modifier combinations (`Cmd/Ctrl + Enter`, `Cmd/Ctrl + S`) **do** fire from inside inputs — that's the whole point. `react-hotkeys-hook` handles this via `enableOnFormTags`; be explicit per-binding.
- **Forms:** `Cmd/Ctrl + Enter` must submit from **any** field in the form, not just from the button. Wire it at the form level, not per-input.

### Discoverability — mandatory, not optional

A shortcut nobody knows about is not a feature. Every primary binding ships with at least two of these three surfaces, preferably all three:

1. **Tooltip on the button** — hovering the primary CTA shows the combination via shadcn `Tooltip` + a small `<Kbd>` element (built in `shared/ui/kbd.tsx` from shadcn primitives). Uses the correct OS modifier symbol.
2. **Command palette entry** (`Cmd/Ctrl + K`) — the primary actions of the current surface appear in the palette with their shortcut displayed on the right.
3. **Shortcuts overlay** (`?`) — a dialog listing all shortcuts active on the current screen, grouped by context (global / surface / list). This is the power-user's reference card.

If you add a new shortcut, you also add it to at least one of (2) or (3). Otherwise it's a ghost binding.

### Accessibility interplay

- Shortcuts **extend**, they don't replace. The clickable `Button` always exists, is `Tab`-reachable, has visible focus, and fires on `Enter`/`Space`. Keyboard-first users get both paths: standard Tab-to-focus and the ergonomic shortcut.
- Don't remove the mouse target "because there's a shortcut". The user chooses the path.
- `aria-keyshortcuts` on the bound element is encouraged for screen-reader announcement of the binding.

### Localization

- Key symbols (`⌘`, `⌃`, `⇧`, `⌥`, `Enter`, `Esc`) are universal — not localized.
- Text around them ("Press to send", "Shortcuts", "New message") goes through `next-intl` like any other copy.

### Forbidden

- **No primary CTA without a keyboard shortcut** on surfaces where primary action is the point (composers, forms, create/edit views, modals with an affirmative action).
- **No ad-hoc `addEventListener('keydown')`** for shortcuts — use `react-hotkeys-hook`.
- **No global listeners** that fire regardless of which surface is active. Scope everything.
- **No hardcoded `Ctrl` on macOS** or `⌘` on Windows in tooltips. Detect the platform.
- **No shortcut that overrides a core browser/OS binding** users depend on.
- **No destructive shortcut without a confirm step.**
- **No invisible shortcuts.** If it isn't in a tooltip, the command palette, or the `?` overlay, it doesn't exist for your users.

---

## Rich Interactions — Context Menus, DnD, Hover, Paste, Undo

**This product is built to feel like a tool, not a form.** Interactions beyond "click button → thing happens" are part of the product's identity, not optional polish. Wherever a surface has enough affordance to support it, reach for the richer interaction — a right-click menu, a drag, a hover preview, a paste-aware field, an undo toast. Keyboard shortcuts + motion + theming are the caraccass; these interactions are what make it feel alive.

This doesn't mean **every** screen needs every pattern. The rule is: **core surfaces get the full language; secondary surfaces keep at least the context menu on obvious entities.**

### The default interaction language

For any list, card, file, message, row, or similar "entity-like" element, ask: which of these apply? Use the ones that do.

| Interaction                    | Primitive / lib                               | Use it for                                                                 |
| ------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------- |
| **Right-click context menu**   | shadcn `ContextMenu`                          | Any entity with ≥ 2 actions — always paired with a visible `⋯` kebab menu |
| **Hover preview**              | shadcn `HoverCard`                            | Internal links / mentions / references — show the target inline           |
| **Drag & drop (reorder)**      | `dnd-kit` (with keyboard sensor)              | Reorderable lists, kanban columns, nested trees                            |
| **Drop to upload**             | `react-dropzone` (or native `drop` events)    | File attach surfaces, import zones                                         |
| **Inline edit**                | Double-click / `Enter`-to-edit on focus       | Titles, names, short fields — in place, not a modal                        |
| **Multi-select**               | `Shift`-click (range) / `Cmd/Ctrl`-click (toggle) | Lists where bulk actions matter — surface a bulk-action bar on selection |
| **Paste-aware input**          | `onPaste` handlers                            | Composers: paste image → upload, paste URL → detect, paste file → attach   |
| **Undo toast (destructive)**   | shadcn `Toast` + action button, ~5s window    | Reversible deletes / archives — default over "Are you sure?" dialogs       |
| **Shared-element transition** | Framer Motion `layoutId`                       | List item → detail view navigation. Card "expands" instead of cutting      |
| **Skeleton loader matching layout** | `Skeleton` from shadcn                     | Every async surface. No generic spinners as page placeholders              |
| **Branded empty state**        | Feature-owned component on top of shadcn      | Lists with zero items — illustration + 1–2 suggested actions, not "No data" |
| **Optimistic update**          | TanStack Query optimistic mutations            | Mutations where the outcome is near-certain — rollback on error            |

### Principles from experience

These are the rules that separate "we added a context menu" from interactions that actually work:

1. **Right-click is an accelerator, never the only path.** Every action reachable via context menu must also be reachable via a visible kebab (`⋯`) button. Keyboard users and mouse users without the habit don't get stranded.
2. **Touch devices don't have right-click.** Don't try to fake a desktop context menu on iOS long-press — it's fragile. Either render a `Sheet` on long-press (when it's genuinely useful) or rely on the visible kebab. Don't fight the platform.
3. **Drag requires affordances.** Grip handle icon, `cursor: grab` / `grabbing`, drop indicator, ghost preview. Without them, "drag" reads as "why is this thing moving."
4. **Keyboard alternative is mandatory for every rich interaction.** `dnd-kit`'s `KeyboardSensor` for drag. `Enter`-on-focus to open the same menu the kebab opens. Inline edit reachable via `Enter`. Multi-select via `Space` with roving focus.
5. **Don't steal the browser's native behavior where users want it.** `ContextMenu` goes on rows / cards / files — **not** on text content, inputs, textareas, or article bodies, where users still expect system copy/paste/spellcheck menus.
6. **Undo beats Confirm for anything reversible.** A 5-second toast with `[Undo]` is a far better UX tax than a modal on every delete. Reserve confirm dialogs for genuinely irreversible / high-stakes operations.
7. **Optimistic updates where the outcome is near-certain.** The UI responds instantly; TanStack Query rolls back on error with a toast. This is most of what makes apps feel fast.
8. **Hover previews only on devices that hover.** Disable `HoverCard` on touch (`@media (hover: hover)` or a `useHasHover` hook). On touch the tap is already the action — don't double-trigger.
9. **Shared-element transitions only for navigations that are conceptually the same element.** List card → its own detail = yes. List card → unrelated screen = no. Misuse looks disorienting.
10. **Skeleton matches the layout.** A page with a sidebar, header, and 3 cards gets a skeleton with sidebar + header + 3 card-shaped blocks. A generic spinning circle is a regression.

### Mobile / touch adaptation

- On touch: `ContextMenu` → either omit (rely on kebab) or a `Sheet` on long-press — don't force desktop context menu semantics.
- `HoverCard` → disabled. Primary tap = open the target fully.
- `dnd-kit` → enable `TouchSensor` with a small activation delay so scrolling doesn't get eaten.
- Multi-select on touch → explicit "Select" entry mode (long-press or a toolbar toggle). No Shift-click pretense.

### Accessibility

- Every rich interaction ships with a keyboard path (already itemized above).
- Context menu trigger element: `aria-haspopup="menu"`, focus moves into the menu on open, `Esc` closes and returns focus.
- Drag: announce pickup / over / drop via `dnd-kit`'s `announcements` API.
- Inline edit: focus moves into the input on activation, `Esc` cancels without save, `Enter` / blur commits.
- Undo toasts: `role="status"` or the equivalent so screen readers announce; the `[Undo]` button is reachable via `Tab`.

### Scope — where to deploy this

- **Core surfaces** (main list, composer, library, any "workspace" screen): full language — context menu, hover preview, DnD where applicable, paste-aware, undo, skeletons, shared-element on navigation.
- **Secondary surfaces** (settings, admin, modal flows): minimum — context menu on entities, proper skeletons, undo for deletes. Skip DnD / hover previews unless there's a specific reason.
- **Forms and single-purpose dialogs**: no context menu, no drag. Keyboard shortcuts + good validation + optimistic-where-safe is enough.

### Forbidden

- **Don't** ship a list or entity grid without a context menu. Right-click on a row must do something useful.
- **Don't** make right-click the **only** way to reach an action. Always pair with a visible kebab.
- **Don't** try to force desktop context menus on touch. Long-press is unreliable on iOS — use `Sheet` or kebab instead.
- **Don't** wire drag without `dnd-kit`'s keyboard sensor, without announcements, or without visual affordances (handle, cursor, drop indicator, ghost).
- **Don't** use a confirmation dialog for a reversible action when a 5-second undo toast would do.
- **Don't** show hover previews on touch devices. Gate with a hover-capability check.
- **Don't** use a generic spinner as a page loader. Skeletons match the layout.
- **Don't** ship "No data." as an empty state. Branded illustration + suggested next action, or nothing.
- **Don't** hijack right-click over text content, inputs, or article bodies. Users need the native menu there.
- **Don't** introduce another DnD library (`react-beautiful-dnd`, `react-dnd`). `dnd-kit` is it.

---

## Loading States — Skeletons Everywhere

**Every element that waits for data and would otherwise render as empty space must show a `Skeleton`. No exceptions.** If a surface depends on anything async — a server fetch, a Server Action result, a lazily-loaded chunk, a deferred subtree, an image download — its placeholder while that work is in flight is a shadcn `Skeleton` shaped like the real content. Blank panels, centered spinners, and "Loading…" text are all bugs.

This is not polish. It is the default for every idle surface.

### Default = strictly shadcn `Skeleton`

**Unless the user explicitly says otherwise, the loading placeholder is always the shadcn `Skeleton` from `src/shared/ui/skeleton.tsx` — nothing else.** Do not invent your own pulsing `<div>`, do not pull a skeleton from another library, do not substitute a spinner / "Loading…" text / blank space "for now". The default is fixed: shadcn `Skeleton`, composed into a shape that matches the real content.

The only way to deviate is an explicit user instruction in the task itself ("use a spinner here", "use this custom shimmer", "no skeleton on this surface"). A general preference, an unrelated past decision, or your own judgement that "a spinner would be cleaner" do **not** override the default. When in doubt — `Skeleton`.

### Where a Skeleton is mandatory

- **Route segments during streaming** — every `loading.tsx` at every route that fetches data. Never a spinner, never "Loading…".
- **Suspense boundaries** — every `<Suspense>` has a `fallback` built from `Skeleton`, shaped to match `children`.
- **Client-side fetches** — any TanStack Query / SWR call renders a skeleton while `isPending` / `isLoading` is true. Never blank, never spinner.
- **Lazy chunks** — `next/dynamic(..., { loading: () => <MatchingSkeleton /> })`. No default blank.
- **Images** — Next.js `<Image>` with `placeholder="blur"` when a blur source exists; otherwise a `Skeleton` in the image's exact dimensions until `onLoadingComplete`. Applies to avatars, thumbnails, media cards.
- **Deferred values / transitions** — any `useDeferredValue` or pending transition that can leave a pane empty.
- **Pagination / infinite scroll** — skeleton rows appended at the bottom while the next page loads. Not a centered spinner under the list.
- **Optimistic failure rollback** — the row that reverts shows a brief skeleton/loading indicator while the rollback resolves, not a flash of stale data.

If you're writing a component whose initial render could be empty because data hasn't arrived, a `Skeleton` variant of it is part of the task — shipped at the same time, not "later".

### Shape rules — the skeleton matches the layout

A skeleton that doesn't match the real content is worse than useless: it causes layout shift when data arrives.

- A page with a sidebar, header, and three cards → skeleton with sidebar + header + three card-shaped blocks, in the same grid, in the same container.
- A card with a title, two body lines, and an avatar → four `Skeleton` blocks sized to each: `h-6 w-48` title, `h-4 w-full` body, `h-4 w-3/4` body, `h-10 w-10 rounded-full` avatar.
- Same paddings, same gaps, same `max-w-*` as the real content. Don't centre a lone skeleton in an empty page.
- All three viewports — skeletons follow the same responsive rules as real content (stack on mobile, grid on `md:` and up).
- Both themes — `Skeleton` consumes tokens. No `bg-gray-*` overrides, no `dark:` color layering.

Use **shadcn `Skeleton`** from `src/shared/ui/skeleton.tsx` — never a hand-rolled pulsing `<div>`. If you need a composite skeleton for a specific feature (e.g., `PostCardSkeleton`), build it **inside the feature** by composing `Skeleton` primitives, export it from the feature's `index.ts`, and render it wherever that feature's content is loading.

### Spinners — the narrow exception

Spinners are acceptable **only** for:

- **Button-internal** loading state during an in-flight action (shadcn `Button` with an inline loader icon + `disabled`).
- **Tiny inline indicators** next to a just-clicked control (a small save/retry dot).
- A **global top-bar progress** for navigation (thin bar, `nprogress`-style).

Anywhere a spinner occupies a page, a card, a panel, a list, a dialog, or any block larger than a button — **it is a bug, and you replace it with a `Skeleton`**.

### Flicker — minimum-visibility guard

Skeletons that flash for 80ms are worse than none. If the data typically resolves in under ~150ms, prefer an optimistic / cached render via `Suspense` with a longer-lived boundary. If a skeleton does render, hold it visible for at least ~200ms (a short show-delay on the request side, or a min-show-time on the skeleton side) so it doesn't flicker on fast networks.

### Verification

Loading states are part of Visual Verification — step 4 of the checklist already requires cycling through `initial / empty / loading / success / error`. For the `loading` check, throttle the network in DevTools ("Slow 3G") and navigate to the surface so the skeleton actually renders long enough to observe. Confirm: (1) skeleton shape matches real content, (2) no layout shift on data arrival, (3) both themes, (4) all three viewports.

### Forbidden

- **No `<Spinner />` / centered spinning circle as a page, panel, list, card, or dialog loader.** Ever.
- **No "Loading…" text placeholder** where a skeleton could render.
- **No blank space** where async content will land.
- **No hand-rolled pulsing `<div>`** — use shadcn `Skeleton`.
- **No skeleton primitive from another library** (`react-loading-skeleton`, MUI `Skeleton`, Chakra `Skeleton`, etc.). The default is **strictly** shadcn `Skeleton` from `src/shared/ui/skeleton.tsx` — only the user can override it explicitly per task.
- **No generic grey rectangle** standing in for structured content. Match the layout.
- **No skeleton-free lazy imports.** Every `next/dynamic` has a `loading` option shaped to the component it replaces.
- **No async-data component shipped without its `Skeleton` variant built in the same task.** The loading state is not a follow-up.

---

## Testing

- Co-locate unit tests: `button.tsx` → `button.test.tsx`.
- Test behavior, not implementation. Prefer RTL queries by role/text over `data-testid`.
- e2e tests in `e2e/` at repo root.
- Write tests for: Server Actions, zod schemas, critical user flows.

---

## Visual Verification — Before You Say "Done"

**Every UI change must be opened in a browser and actually looked at before the task is marked complete.** Not "the code compiles." Not "the diff looks right." Opened. Navigated to. Interacted with. Eyes-on.

`pnpm lint` and `pnpm typecheck` verify code correctness. They do **not** verify that the feature works — they won't catch broken motion, clipped layout on mobile, a missing empty state, a `dark:` variant with unreadable contrast, a form that type-checks but fails to submit, or a regression in a sibling screen that consumed the shared component you just edited. The only way to catch those is to run the app and check with your eyes.

### Tooling — Playwright MCP is the only way

Visual verification runs through the **Playwright MCP server** configured in `.mcp.json` (`mcp__playwright__*` tools). There is no other acceptable path — curl-ing HTML, reading DOM snapshots, or asking the user to screenshot manually does **not** count as verification. Every responsive / theme / state check below must be executed via the MCP's browser, and every screenshot that backs a "done" claim must come from it.

Core tools and when to reach for them:

- `mcp__playwright__browser_navigate` — go to the route under test (always `/ru` first).
- `mcp__playwright__browser_resize` — cycle viewports; call it **before** each screenshot at the target width.
- `mcp__playwright__browser_take_screenshot` — capture the viewport (or `fullPage: true` for long pages). Save with a descriptive `filename` so reviewers can trace which viewport/theme each image belongs to (e.g. `home-375-dark.png`).
- `mcp__playwright__browser_snapshot` — structured accessibility tree; use when you need to *act on* something (click, fill) and need the `ref`.
- `mcp__playwright__browser_click` / `browser_hover` / `browser_type` / `browser_press_key` / `browser_fill_form` — interaction. Use these to walk the golden path, trigger validation errors, open modals, toggle themes.
- `mcp__playwright__browser_evaluate` — run page JS. Primary use: flip the theme without hunting a UI toggle (`document.documentElement.classList.add('dark')` / `.remove('dark')`), scroll sections into view to trigger `whileInView` animations, or emulate `prefers-color-scheme`.
- `mcp__playwright__browser_console_messages` — read console after each state; any unhandled exception / hydration mismatch / React key warning is a failure.
- `mcp__playwright__browser_network_requests` — check for 404s on assets you added.
- `mcp__playwright__browser_wait_for` — wait for content/animation to settle before screenshotting.
- `mcp__playwright__browser_close` — close when finished so the next session starts clean.

**Artifacts are scratch — clean up at the end of the task.** The MCP writes screenshots to the project root (or wherever `filename` points) and dumps page snapshots / console logs into `.playwright-mcp/` in the repo. These are verification scratch, not deliverables. After the "done" moment, delete every `*.png` / `*.jpeg` screenshot you saved for this task **and** `.playwright-mcp/` — leave the working tree clean. `.gitignore` already excludes both patterns as a safety net, but don't lean on it; remove the files yourself. The only exception is if the user explicitly asked you to save a screenshot (e.g. "send me the mobile screenshot") — keep only what was requested, remove the rest.

### The checklist — step by step, in order

After any UI-affecting change, before declaring the task done:

1. **Start the dev server** (`pnpm dev`) if it isn't running, then drive the browser through `mcp__playwright__*` — never skip to static checks.
2. **Navigate to the affected route on `/ru`** via `mcp__playwright__browser_navigate` — that's the design reference. Use `/en` additionally only if you touched copy or layout sensitive to string length.
3. **Walk the golden path end-to-end.** Use `browser_click` / `browser_type` / `browser_fill_form` to actually submit. "The form renders" is not the bar — the submission has to resolve.
4. **Cycle through UI states** visible on the screen, driving the browser to each one:
   - `initial` / `empty` / `loading` / `success` / `error`
   - `hover` (`browser_hover`) / `focus-visible` (`browser_press_key` Tab) / `active` / `disabled`
   - form validation errors (trigger them on purpose via `browser_fill_form` + submit)
   - screenshot each state that isn't trivially covered by an earlier one.
5. **Resize through all three viewports via `mcp__playwright__browser_resize`** — 375 × 667, 820 × 1180, 1440 × 900 — screenshotting the affected route at each. Confirm no overflow, no clipped content, no broken stacking, tap targets still usable. (See the Responsive Design section.)
6. **Watch the animations play.** Framer Motion effects are runtime-only — code review cannot confirm them. `fullPage` screenshots do **not** trigger `whileInView` because the viewport stays at the top — scroll the target into view with `browser_evaluate` (`document.querySelector('...').scrollIntoView()`) and then screenshot, or take regular (viewport) screenshots while scrolling through. For `AnimatePresence`, trigger mount/unmount via `browser_click` and screenshot mid-flight with `browser_wait_for`.
7. **Toggle to dark mode and repeat the full walk.** Not optional — every component consumes theme tokens, so every component must be verified in both themes. Flip via the in-app `ThemeToggle` using `browser_click`, or directly with `browser_evaluate` (`document.documentElement.classList.toggle('dark')`). Screenshot the same viewports + states you did in light. Reload with OS preference set to dark (`browser_evaluate` emulating `prefers-color-scheme`) to confirm the system-default path paints correctly on first render with no flash.
8. **Run the regression sweep.** If you edited `shared/ui/*`, a widget, or any component with multiple callers, navigate each major consumer screen via `browser_navigate` and verify nothing else broke. Shared-component edits have the highest blast radius — don't skip this.
9. **Check the console and network.** Call `mcp__playwright__browser_console_messages` after each state and `browser_network_requests` after asset-touching changes — no unhandled exceptions, no React key warnings, no hydration mismatches, no 404s.
10. **Clean up the verification artifacts.** Before handing back, delete every screenshot you saved for this task (`rm *.png` / `rm *.jpeg` in the project root, or the specific files you named) **and** the `.playwright-mcp/` directory (`rm -rf .playwright-mcp`). Close the browser session with `mcp__playwright__browser_close`. The working tree must be clean of verification scratch — the only UI artifacts that remain are the actual code changes. Keep a screenshot only if the user explicitly asked for it.

### Check as you build, not at the end

Verify each block right after you build it. If you batch all the checking for the end, a regression introduced early will be hard to localize and you'll be tempted to skip steps to finish. Small, frequent eyes-on passes beat one big sweep.

### Honesty gate — what to do when you can't look

If the Playwright MCP is genuinely unavailable (server not connected, `mcp__playwright__*` tools missing, dev server cannot start), **say so explicitly in the handoff**: list what you verified (lint, typecheck, unit tests) and what you did **not** verify (visual, interaction, responsive, motion, regression). Name the specific routes/flows that still need human eyes. Do **not** claim the UI works based on static checks alone, and do **not** substitute curl / DOM string inspection / "I looked at the code" for an actual MCP-driven browser pass. An honest "Playwright MCP unavailable — needs manual verification on /ru/posts at 375/820/1440 in light+dark" is far more useful than a confident "done" that ships a broken screen.

### What counts as "looked at"

- ✅ Drove `mcp__playwright__*` through the route — navigated, walked the flow, resized to 375/820/1440, flipped light/dark, watched animations, read the console and network, saved screenshots for each viewport × theme.
- ❌ "The diff looks right." — not verification.
- ❌ "Type-checks pass." — not verification.
- ❌ "`curl http://localhost:3000/ru` returned 200." — server-up check, not visual verification.
- ❌ "I updated the file the same way as last time." — not verification.
- ❌ "Storybook renders it." — helpful, but not a replacement for the real route in the real app.
- ❌ Asking the user to take screenshots when Playwright MCP is available — use the MCP.

### Forbidden

- **Don't** declare a UI task done without having driven the route through `mcp__playwright__*` in a running browser session.
- **Don't** substitute curl, static DOM inspection, or user-provided screenshots for the Playwright MCP when it's available.
- **Don't** skip the regression sweep after editing shared UI or widgets.
- **Don't** rely solely on type-checking, linting, or unit tests to validate a visual change.
- **Don't** claim "it works" when you haven't actually seen it work through the MCP — say "Playwright MCP unavailable, unverified, needs manual QA" instead.
- **Don't** skip viewports or themes — all three widths × both themes is the minimum, and every one goes through `browser_resize` + a theme flip in Playwright.
- **Don't** leave verification scratch in the working tree. After handing back, the task directory must be clean: delete every screenshot you saved (`*.png` / `*.jpeg` in the project root) and `rm -rf .playwright-mcp`. The `.gitignore` is a safety net, not a substitute for cleanup. Keep a screenshot only if the user explicitly asked for one.

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
- **Don't** pile multiple sub-flows into one `actions.ts` / `schema.ts` and "split later". Split as soon as the second sub-flow lands (or at ~150 lines). See "File Organization Within Features".
- **Don't** pre-split a single-flow feature into stub files. Splitting is triggered by a real second concern, not anticipation.
- **Don't** create per-feature HTTP clients. `@/shared/api/client` is the only `apiFetch`. No `userApi.ts` / `productApi.ts` wrappers.
- **Don't** create layer-level barrels (`features/<x>/api/index.ts`, `features/<x>/model/index.ts`). Only the feature root has `index.ts`.
- **Don't** introduce per-service env vars when there's one backend. One backend → one `API_URL`.
- **Don't** narrow a backend-mirrored enum to the variants you currently render. The wire schema and the domain type both list **every** variant from `openapi.json`. Missing variants come back as runtime strings that bypass `tsc` and break through `default:` branches. See "Enums and discriminated unions — mirror exhaustively".
- **Don't** branch on a multi-variant enum with a ternary or single-case filter (`status === 'X' ? 'a' : 'b'`, `if (status === 'X') skip`). Every variant gets an explicit case — use `switch` with a `never`-typed default, or a `Record<EnumType, T>` map, so TypeScript fails the build when one is missed.
- **Don't** declare a fix done for a bug reported on one enum variant without auditing the rest. The same gap (missing wire variant, fall-through `else`, lumped mapping) usually breaks every other variant the same way — line up the full variant list from `openapi.json` and walk the pipeline for each before handing back.
- **Don't** edit generated shadcn/ui files in `shared/ui/` — wrap them instead.
- **Don't** hand-roll primitives that exist in shadcn/ui (`Button`, `Input`, `Dialog`, `Select`, etc.). Install via `pnpm dlx shadcn@latest add <component>`.
- **Don't** build feature components from raw HTML when shadcn primitives exist — wrap and compose shadcn instead, then style with the `brand` token.
- **Don't** deviate from a design reference the user attached (Figma, mockup, screenshot, link). Implement everything shown — every element, every label, every layout decision, every state — literally. Motion, responsive translation to viewports the reference doesn't show, dark theme, and a11y plumbing are the only things you may add on top. Don't drop elements, don't paraphrase copy, don't swap component patterns (tabs → accordion, modal → sheet), don't "simplify" the hierarchy. If the reference is incomplete or ambiguous, ask — don't guess. See "Design References — implement them literally".
- **Don't** hardcode the brand color or substitute a generic Tailwind palette color for it. Use `bg-brand` / `text-brand-foreground` etc.
- **Don't** install other UI libraries (MUI, Mantine, Chakra, Ant Design, HeadlessUI, Flowbite, DaisyUI, NextUI). shadcn/ui is it.
- **Don't** ship static, motion-less interactive UI. Use Framer Motion (`motion/react`) for transitions, presence, hover/tap feedback, list staggers, and route changes.
- **Don't** install competing animation libraries (GSAP, react-spring, auto-animate, anime.js). Framer Motion is the only animation library.
- **Don't** ship animations that jitter the page during a sustained user gesture (drag-and-drop, resize, marquee select). Animations are rich on commit, **still during the gesture**. Concretely: no `layout` / `popLayout` on DnD-target items, no `whileHover` while DnD is active, drop-target `isOver` uses only layout-neutral properties (`scale`, `ring`, `bg`, `shadow`), no chrome that pops in on `isDragging`. See "Animations must not jitter the page during user interaction".
- **Don't** hardcode user-facing strings. Every label/title/placeholder/alt/aria/toast/zod-message goes through `next-intl`, even when only `/ru` is shipped.
- **Don't** use raw `next/link` or `next/navigation` redirects for in-app routes — use `next-intl`'s `Link` / `useRouter` / `redirect` so the locale prefix stays.
- **Don't** install other i18n libraries (`react-i18next`, `next-i18next`, `lingui`, `paraglide`). `next-intl` is it.
- **Don't** tune layouts to non-`/ru` locales by default. Design target is `/ru` unless explicitly stated otherwise.
- **Don't** write real English translations by default. The default scope is RU-only: real copy goes into `messages/ru/*.json`; `messages/en/*.json` gets the same Russian value verbatim as a placeholder. Only run a proper EN pass when the user explicitly asks.
- **Don't** leave a key missing from one locale file. Even under the RU-only default, the key must exist in **both** `ru/` and `en/` namespace files (with RU as the EN placeholder) — otherwise `/en` crashes at runtime.
- **Don't** machine-translate or LLM-translate inline when adding copy. Placeholder = verbatim Russian; translation is a separate, user-requested pass.
- **Don't** ship a screen that works on only one viewport. Every UI must be built for mobile, tablet, and desktop — verified in the browser at ~375/820/1440px before "done".
- **Don't** apply a single-viewport spec (e.g. "700px side panel") literally across all sizes, and don't silently skip mobile when the spec doesn't fit there. Translate the intent to a viewport-appropriate equivalent (e.g. mobile → full-screen / bottom `Sheet`) **and tell the user what you substituted**. See "When a prompt describes only one viewport".
- **Don't** write desktop-first CSS. Mobile-first only: base classes = mobile, scale up with `md:` / `lg:`. No `max-md:` overrides to undo desktop styles.
- **Don't** use `sm:` as a tablet breakpoint. Tablet = `md:` (≥ 768px), Desktop = `lg:` (≥ 1024px). `sm:` / `xl:` / `2xl:` are narrow exceptions, not tiers.
- **Don't** set fixed pixel widths (`w-[1200px]`) on layout containers. Use `w-full` + `max-w-*`.
- **Don't** declare a UI task done without driving the route through the **Playwright MCP** (`mcp__playwright__*` — `browser_navigate` / `browser_resize` / `browser_take_screenshot` / `browser_click` / `browser_evaluate` / `browser_console_messages`). Lint + typecheck ≠ "it works". See Visual Verification — the MCP-driven checklist is mandatory.
- **Don't** substitute curl, DOM string inspection, "I read the code", or asking the user to screenshot for the Playwright MCP when it's connected. Those do not count as verification.
- **Don't** skip any viewport or theme in the sweep. Three viewports (375 / 820 / 1440) × two themes (light + dark) = six checkpoints minimum, every one through `browser_resize` + a theme flip in the Playwright MCP.
- **Don't** skip the regression sweep when editing `shared/ui/*` or widgets — navigate each major consumer screen via `browser_navigate` and verify nothing else broke.
- **Don't** claim "it works" when you haven't actually seen it run through the MCP. If the Playwright MCP is unavailable, say "Playwright MCP unavailable — unverified, needs manual QA on X" — explicitly name the routes/flows that still need human eyes.
- **Don't** leave verification scratch in the working tree after a UI task. Screenshots (`*.png` / `*.jpeg` at the project root) and `.playwright-mcp/` are scratch — delete them before handing back via `rm` + `rm -rf .playwright-mcp`. The `.gitignore` already excludes them as a safety net, but cleanup is still your responsibility. Keep a screenshot only if the user explicitly asked for one.
- **Don't** ship a feature in one theme only. Light and dark are built and verified together in the same task — dark mode is never "later".
- **Don't** hardcode a default theme that overrides the OS on first visit. Initial theme = system preference (`prefers-color-scheme`) via `next-themes` `defaultTheme="system"` + `enableSystem`.
- **Don't** layer `dark:` on top of already-tokenized colors (`bg-white dark:bg-black` is a bug — use `bg-background`). Reach for `dark:` only for non-color differences (image swaps, shadow intensity, `currentColor` fallbacks).
- **Don't** ship a primary CTA without a keyboard shortcut on surfaces where the primary action is the point (submit, send, save, create, search, close). Not every button — only the core operation of the surface. See Keyboard Shortcuts.
- **Don't** add a shortcut and leave it undocumented. Every binding lives in a tooltip, the command palette (`Cmd/Ctrl + K`), or the `?` overlay — otherwise it's a ghost.
- **Don't** use raw `addEventListener('keydown')` or scattered `useEffect` listeners for shortcuts. `react-hotkeys-hook` is the single system; use its `scopes` for surface-bound bindings.
- **Don't** hardcode `Ctrl` on macOS (or `⌘` on Windows) in shortcut hints. Render the correct modifier per platform.
- **Don't** ship a list / grid / entity view without a right-click context menu on its items. Pair every context menu with a visible kebab (`⋯`) — right-click is the accelerator, never the only path. See Rich Interactions.
- **Don't** force desktop context menus onto touch. Long-press on iOS is unreliable — use a `Sheet` trigger or rely on the kebab. Same for hover previews — gate `HoverCard` behind a hover-capability check.
- **Don't** install another DnD library (`react-beautiful-dnd`, `react-dnd`, `sortablejs`). `dnd-kit` is the single DnD stack — with its `KeyboardSensor` and `announcements` enabled for a11y.
- **Don't** use a confirmation dialog for a reversible operation. Default to an undo toast (~5s window) for deletes/archives; reserve confirm dialogs for genuinely irreversible / high-stakes operations.
- **Don't** ship any async surface without a shadcn `Skeleton` that matches the layout — every fetch, every Suspense boundary, every `next/dynamic`, every image, every list that loads more rows. Spinners are allowed only button-internally / inline; anywhere larger than a button uses `Skeleton`. See Loading States — Skeletons Everywhere.
- **Don't** substitute a different skeleton implementation for the default. The loading placeholder is **strictly** shadcn `Skeleton` from `src/shared/ui/skeleton.tsx` unless the user explicitly says otherwise in the task. No hand-rolled pulsing `<div>`, no third-party skeleton libraries, no spinner-as-skeleton.
- **Don't** ship `"No data."` as an empty state. Branded illustration + 1–2 suggested next actions, or nothing.
- **Don't** hijack right-click over text content, inputs, textareas, or article bodies. The native browser menu belongs there.
- **Don't** write CSS outside Tailwind. No CSS Modules, no CSS-in-JS (styled-components, Emotion, vanilla-extract, etc.), no Sass, no `<style jsx>`, no standalone `.css` files beyond `globals.css`.
- **Don't** hardcode colors (`#fff`, `rgb(...)`, `bg-gray-800`). Use design tokens (`bg-background`, `text-foreground`, etc.).
- **Don't** use `!important` to force styles. Fix the cascade instead.
- **Don't** add `cursor-pointer` utility classes manually to buttons or other clickable elements. The global rule in `globals.css` already gives `cursor: pointer` to every `<button>` and `[role="button"]`. Adding the utility is redundant noise. See "Pointer cursor on interactive elements".
- **Don't** build fake buttons out of `<div>` without `role="button"` (and a keyboard handler + `tabIndex`). Use a real `<button>` so the global cursor rule, focus ring, and Enter/Space activation all work for free.
- **Don't** put business logic in `shared/`. If it's domain-specific, it's a feature.
- **Don't** fetch data in Client Components when a Server Component can do it.
- **Don't** use `any`, `@ts-ignore`, or non-null assertions without a comment.
- **Don't** create barrel files for every folder. Only features expose a public API; internal folders import directly.
- **Don't** use route handlers (`app/api/`) for things Server Actions can do. Reserve them for webhooks and third-party integrations that require a stable URL.
- **Don't** hardcode config. Use `shared/config` and validate env at boot with zod.
- **Don't** add a `process.env.X` read without adding `X` to `.env.dist` in the same change. Every env var the app reads must appear in the committed `.env.dist` template with a comment and a safe local-dev default — no orphans in either direction. See "Environment Variables — `.env.dist` is the contract".
- **Don't** put real secrets in `.env.dist` (it's committed) and don't prefix a server secret with `NEXT_PUBLIC_` to expose it to the browser.
- **Don't** throw from Server Actions for expected failures — return a discriminated result.
- **Don't** render a page with a mock, stub, or empty fallback when its **primary resource** fails to load. Missing entity → `notFound()` (renders `app/not-found.tsx`). Network / server error → `throw new Error(...)` (caught by the closest `error.tsx`, renders `[locale]/error.tsx`). Inline error/empty states are for **secondary** content only — side widgets, optional lists, button actions. See "Page-Level Failures — Redirect to 404 / 500, Don't Fake It".
- **Don't** use a Toast for a form/auth/submit error while the form or action is still on screen. Persistent, actionable errors go inline — `FieldError` for field-level, `Alert variant="destructive"` for form/section-level. Toasts are for transient events with no surviving inline anchor (optimistic rollback, post-navigation outcome, background sync). See "Surfacing Errors — Inline (Alert / FieldError) vs Toast".
- **Don't** show the same error in both an `Alert` and a Toast, and don't auto-dismiss a form-level `Alert` on a timer — it clears when the user changes input or retries.
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