'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  AnimatePresence,
  animate as motionAnimate,
  motion,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';

import { cn } from '@/shared/lib/utils';
import type { ApiFile } from '@/shared/types/user';
import { UserAvatar } from '@/shared/ui/user-avatar';

export type CollabUser = {
  id: string;
  /** Backend-canonical full name; also surfaced inside `UserAvatar`. */
  name: string;
  /** Accent color for the pointer, label pill, and field highlight. */
  color?: string;
  /** Optional URL to an avatar image. */
  avatarUrl?: string;
  /** Secondary line rendered in the expanded menu (e.g. "Editing"). */
  status?: string;
};

export type CursorAnchor =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'center';

export type CollaborationCursorTarget =
  | React.RefObject<HTMLElement | null>
  | HTMLElement
  | null
  | undefined;

export type CollaborationCursorProps = {
  /**
   * Element the cursor pins itself to. Accepts a ref object or a raw
   * element. Pass `null` / `undefined` to hide the cursor with an exit
   * animation.
   */
  target: CollaborationCursorTarget;
  /**
   * People who currently share this cursor. First user drives the accent
   * color and the label; the rest are stacked as avatars next to it.
   */
  users: CollabUser[];
  /** Corner of the target the pointer tip points at. */
  anchor?: CursorAnchor;
  /** Fine-tune the pointer position relative to the anchor (px). */
  offset?: { x: number; y: number };
  /**
   * Draw a soft rounded outline around the target while the cursor is
   * pinned to it. Mirrors the Datawrapper "active field" indicator.
   */
  showFieldHighlight?: boolean;
  /** Stacking order for the portal layer. */
  zIndex?: number;
  className?: string;
};

const FALLBACK_PALETTE = [
  '#6c5ce7',
  '#0ea5e9',
  '#f97316',
  '#10b981',
  '#ef4444',
  '#ec4899',
  '#a855f7',
  '#14b8a6',
] as const;

function pickPaletteColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}

function userColor(user: CollabUser): string {
  return user.color ?? pickPaletteColor(user.id);
}

// `UserAvatar` expects an `AvatarUser`. We synthesise one — the only field
// it really needs is `fullName` (for initials & alt text) and `avatar` (the
// optional image). The rest of `ApiFile` is metadata the avatar ignores.
function toAvatarUser(user: CollabUser) {
  const avatar: ApiFile | null = user.avatarUrl
    ? {
        oid: user.id,
        contentType: 'image/*',
        sizeBytes: 0,
        url: user.avatarUrl,
      }
    : null;
  return { id: user.id, fullName: user.name, avatar };
}

function resolveElement(
  target: CollaborationCursorTarget,
): HTMLElement | null {
  if (!target) return null;
  if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) {
    return target;
  }
  if (typeof target === 'object' && 'current' in target) {
    return target.current ?? null;
  }
  return null;
}

type Rect = { x: number; y: number; width: number; height: number };

function anchorPoint(rect: Rect, anchor: CursorAnchor): { x: number; y: number } {
  switch (anchor) {
    case 'top-left':
      return { x: rect.x, y: rect.y };
    case 'top-right':
      return { x: rect.x + rect.width, y: rect.y };
    case 'bottom-left':
      return { x: rect.x, y: rect.y + rect.height };
    case 'bottom-right':
      return { x: rect.x + rect.width, y: rect.y + rect.height };
    case 'center':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }
}

const POSITION_SPRING = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
  mass: 0.8,
} as const;

const FAST_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 38,
  mass: 0.6,
} as const;

function useIsClient(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function CollaborationCursor({
  target,
  users,
  anchor = 'bottom-right',
  offset = { x: -6, y: -6 },
  showFieldHighlight = true,
  zIndex = 60,
  className,
}: CollaborationCursorProps) {
  const reduced = useReducedMotion();
  const isClient = useIsClient();
  // Scope layoutIds so two cursors with overlapping user ids don't fight
  // for the same FLIP target inside Framer Motion's global layout group.
  const scopeId = React.useId();

  const element = resolveElement(target);
  // `active` flips opacity/AnimatePresence — the only piece that needs to be
  // React state. Position is handled entirely through motion values below.
  const [active, setActive] = React.useState(false);
  // Edge-aware label flipping. When the cursor sits too close to the right
  // edge of the viewport, render the pill to the LEFT of the pointer instead
  // of the default rightward layout — otherwise the pill is clipped by the
  // portal's overflow.
  const [labelOnLeft, setLabelOnLeft] = React.useState(false);
  const [labelOnTop, setLabelOnTop] = React.useState(false);

  // Motion values for the cursor pointer's translate(x, y) and for the
  // field-highlight box. Updates go straight through `.set()` so scroll /
  // resize listeners drive the GPU at 60fps without any React render or
  // spring damping in the middle. The spring is reserved for the deliberate
  // "the user just hopped to a different field" animation, fired imperatively
  // via `animate()` when we detect a target swap.
  const cursorX = useMotionValue(0);
  const cursorY = useMotionValue(0);
  const highlightTop = useMotionValue(0);
  const highlightLeft = useMotionValue(0);
  const highlightWidth = useMotionValue(0);
  const highlightHeight = useMotionValue(0);

  // Tracks the previous target element so we can tell "first measurement
  // after mount" / "scroll update on same target" / "target changed" apart.
  // - First mount: snap (no animation) so the cursor never appears at (0,0).
  // - Same target, scroll/resize: snap (tight 1:1 with the page).
  // - Target changed: spring across the gap (the only place we want easing).
  const previousElementRef = React.useRef<HTMLElement | null>(null);

  // Keep the latest anchor/offset around without re-running the layout
  // effect every time they change. The effect only cares about `element`;
  // everything else is read inside the closure via these refs. The refs
  // get refreshed in a post-render effect so React 19's "no ref writes
  // during render" rule stays happy; the one-frame staleness is invisible
  // (the next scroll / resize tick already sees the fresh value).
  const anchorRef = React.useRef(anchor);
  const offsetRef = React.useRef(offset);
  const reducedRef = React.useRef<boolean>(false);
  React.useEffect(() => {
    anchorRef.current = anchor;
    offsetRef.current = offset;
    reducedRef.current = reduced ?? false;
  });

  React.useLayoutEffect(() => {
    if (!element) {
      previousElementRef.current = null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActive(false);
      return;
    }

    const isTargetSwap =
      previousElementRef.current !== null &&
      previousElementRef.current !== element;
    previousElementRef.current = element;

    let frame = 0;
    let firstMeasureDone = false;

    const measure = (allowAnimate: boolean) => {
      const b = element.getBoundingClientRect();
      const point = anchorPoint(b, anchorRef.current);
      const nextX = point.x + offsetRef.current.x;
      const nextY = point.y + offsetRef.current.y;
      const nextTop = b.top - 3;
      const nextLeft = b.left - 3;
      const nextWidth = b.width + 6;
      const nextHeight = b.height + 6;

      if (allowAnimate && !reducedRef.current) {
        motionAnimate(cursorX, nextX, POSITION_SPRING);
        motionAnimate(cursorY, nextY, POSITION_SPRING);
        motionAnimate(highlightTop, nextTop, POSITION_SPRING);
        motionAnimate(highlightLeft, nextLeft, POSITION_SPRING);
        motionAnimate(highlightWidth, nextWidth, POSITION_SPRING);
        motionAnimate(highlightHeight, nextHeight, POSITION_SPRING);
      } else {
        cursorX.set(nextX);
        cursorY.set(nextY);
        highlightTop.set(nextTop);
        highlightLeft.set(nextLeft);
        highlightWidth.set(nextWidth);
        highlightHeight.set(nextHeight);
      }

      // Edge-aware pill flip. The collapsed pill is capped at 260px and the
      // expanded card is 220px — using the wider value here keeps both modes
      // safely inside the viewport. `setState` is a no-op when the value
      // doesn't change, so the React tree only re-renders on actual flips.
      const vw =
        typeof window !== 'undefined' ? window.innerWidth : Infinity;
      const vh =
        typeof window !== 'undefined' ? window.innerHeight : Infinity;
      const PILL_MAX_W = 260;
      const PILL_MAX_H = 220;
      const PILL_OFFSET_X = 14;
      const PILL_OFFSET_Y = 18;
      const flipX = nextX + PILL_OFFSET_X + PILL_MAX_W > vw - 8;
      const flipY = nextY + PILL_OFFSET_Y + PILL_MAX_H > vh - 8;
      setLabelOnLeft(flipX);
      setLabelOnTop(flipY);
    };

    // Initial measurement: snap on first mount, spring across target swap.
    // The spring path also smooths the gap between fields when the same
    // <CollaborationCursor> instance is reused with a new target prop.
    frame = requestAnimationFrame(() => {
      measure(isTargetSwap);
      firstMeasureDone = true;
      setActive(true);
    });

    // Scroll / resize / target-resize: snap. The spring is reserved for the
    // intentional jump above. Tight 1:1 follow during scroll is the whole
    // reason we're driving motion values instead of `animate={{ x, y }}`.
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!firstMeasureDone) {
          measure(isTargetSwap);
          firstMeasureDone = true;
          setActive(true);
          return;
        }
        measure(false);
      });
    };

    const ro = new ResizeObserver(schedule);
    ro.observe(element);
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [
    element,
    cursorX,
    cursorY,
    highlightTop,
    highlightLeft,
    highlightWidth,
    highlightHeight,
  ]);

  if (!isClient) return null;

  const primary = users[0];
  const visible = active && Boolean(primary);
  const accent = primary ? userColor(primary) : FALLBACK_PALETTE[0];

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-0 overflow-hidden',
        className,
      )}
      style={{ zIndex }}
      aria-hidden
      // Mark the entire portal as keepalive so a click on another
      // user's pill (or anywhere on this layer) doesn't get treated by
      // the cursors-presence provider as "the local user navigated away
      // from their tracked field."
      data-cursor-keepalive="collaboration-cursor.portal"
    >
      <AnimatePresence>
        {visible && showFieldHighlight ? (
          <motion.div
            key="cc-highlight"
            className="absolute rounded-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.18 }
            }
            style={{
              top: highlightTop,
              left: highlightLeft,
              width: highlightWidth,
              height: highlightHeight,
              boxShadow: `0 0 0 2px ${accent}, 0 0 0 6px ${accent}22`,
            }}
          />
        ) : null}

        {visible ? (
          <motion.div
            key="cc-cursor"
            className="absolute top-0 left-0 origin-top-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.18 }
            }
            style={{ x: cursorX, y: cursorY }}
          >
            <CursorPointer color={accent} />
            <CursorLabel
              users={users}
              accent={accent}
              reduced={reduced ?? false}
              scopeId={scopeId}
              flipX={labelOnLeft}
              flipY={labelOnTop}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  );
}

function CursorPointer({ color }: { color: string }) {
  return (
    <svg
      width="22"
      height="26"
      viewBox="0 0 22 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_6px_16px_rgb(0_0_0/0.22)]"
    >
      <path
        d="M3.4 2.1c-.65-.3-1.4.27-1.27.98l3.55 17.86c.15.78 1.16.96 1.57.28l3.46-5.65 6.43-1.42c.78-.17.94-1.2.25-1.6L3.4 2.1Z"
        fill={color}
        stroke="white"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

type CursorLabelProps = {
  users: CollabUser[];
  accent: string;
  reduced: boolean;
  /** Unique scope so layoutIds don't collide across multiple cursors on a page. */
  scopeId: string;
  /** Render the pill to the LEFT of the cursor pointer (near viewport right edge). */
  flipX?: boolean;
  /** Render the pill ABOVE the cursor pointer (near viewport bottom edge). */
  flipY?: boolean;
};

const STACK_OFFSET = 18;
const COLLAPSED_VISIBLE = 4;

function CursorAvatar({
  user,
  ringColor,
  reduced,
}: {
  user: CollabUser;
  ringColor: string;
  reduced: boolean;
}) {
  return (
    <motion.span
      className="inline-flex"
      initial={false}
      animate={{ boxShadow: `0 0 0 2px ${ringColor}` }}
      transition={reduced ? { duration: 0 } : { duration: 0.22 }}
      style={{ borderRadius: '9999px' }}
    >
      <UserAvatar
        user={toAvatarUser(user)}
        size="sm"
        shape="circle"
        showStatus={false}
        showLoadErrorIndicator={false}
      />
    </motion.span>
  );
}

function useIsCoarsePointer(): boolean {
  return React.useSyncExternalStore(
    (notify) => {
      if (typeof window === 'undefined' || !window.matchMedia) {
        return () => {};
      }
      const mql = window.matchMedia('(pointer: coarse)');
      mql.addEventListener('change', notify);
      return () => mql.removeEventListener('change', notify);
    },
    () => {
      if (typeof window === 'undefined' || !window.matchMedia) return false;
      return window.matchMedia('(pointer: coarse)').matches;
    },
    () => false,
  );
}

function CursorLabel({
  users,
  accent,
  reduced,
  scopeId,
  flipX = false,
  flipY = false,
}: CursorLabelProps) {
  const [expanded, setExpanded] = React.useState(false);
  const isCoarse = useIsCoarsePointer();
  const primary = users[0];
  if (!primary) return null;

  const canExpand = users.length > 1;
  const isExpanded = expanded && canExpand;
  const transition = reduced ? { duration: 0 } : FAST_SPRING;

  const visibleStack = users.slice(0, COLLAPSED_VISIBLE);
  const stackWidth = STACK_OFFSET * Math.max(visibleStack.length - 1, 0) + 24;

  // Hover devices: open on `mouseenter`, close on `mouseleave`.
  // Touch devices have no hover, so use a tap toggle instead —
  // `click` fires on tap. Both can coexist if the device reports
  // both (e.g. Surface), but the menu-state machine is the same:
  // a single boolean toggled by whichever event lands first.
  const hoverHandlers = canExpand && !isCoarse
    ? {
        onMouseEnter: () => setExpanded(true),
        onMouseLeave: () => setExpanded(false),
      }
    : undefined;
  const tapHandler = canExpand && isCoarse
    ? {
        onClick: () => setExpanded((cur) => !cur),
      }
    : undefined;

  return (
    <motion.div
      layout
      transition={transition}
      {...hoverHandlers}
      {...tapHandler}
      className={cn(
        'pointer-events-auto absolute font-medium text-white',
        'shadow-[0_12px_32px_-8px_rgb(0_0_0/0.35),0_4px_8px_-2px_rgb(0_0_0/0.15)]',
        canExpand && 'cursor-pointer select-none',
        // Horizontal anchor — flip when the cursor sits too close to
        // the right edge so the pill extends inward instead of off-screen.
        flipX ? 'right-[8px]' : 'left-[14px]',
        // Vertical anchor — flip when the cursor sits too close to the
        // bottom edge so the pill rises above the pointer.
        flipY ? 'bottom-[8px]' : 'top-[18px]',
        isExpanded
          ? 'flex w-[220px] flex-col gap-0.5 rounded-[18px] p-1.5'
          : 'flex max-w-[260px] items-center gap-2.5 rounded-full py-1 pr-3.5 pl-1',
      )}
      style={{
        backgroundColor: accent,
        // Inner stroke gives the pill a subtle glassy edge against busy backdrops.
        backgroundImage:
          'linear-gradient(180deg, rgb(255 255 255 / 0.08), rgb(0 0 0 / 0.05))',
      }}
    >
      {isExpanded
        ? users.map((user, idx) => {
            const isPrimary = idx === 0;
            return (
              <motion.div
                key={user.id}
                layout="position"
                transition={transition}
                whileHover={
                  reduced ? undefined : { backgroundColor: 'rgb(255 255 255 / 0.12)' }
                }
                className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5"
              >
                <motion.span
                  layoutId={`${scopeId}:av:${user.id}`}
                  transition={transition}
                  className="inline-flex shrink-0"
                >
                  <CursorAvatar
                    user={user}
                    ringColor={userColor(user)}
                    reduced={reduced}
                  />
                </motion.span>
                <motion.div
                  initial={reduced ? { opacity: 1 } : { opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : {
                          opacity: { duration: 0.18, delay: 0.08 + idx * 0.02 },
                          x: { duration: 0.22, delay: 0.08 + idx * 0.02 },
                        }
                  }
                  className="flex min-w-0 flex-1 flex-col gap-px leading-tight"
                >
                  <span className="truncate text-[13px] font-semibold tracking-[-0.005em]">
                    {user.name}
                  </span>
                  <span className="truncate text-[11px] font-medium text-white/70">
                    {user.status ?? (isPrimary ? 'Редактирует' : 'Смотрит')}
                  </span>
                </motion.div>
                {isPrimary ? (
                  <motion.span
                    aria-hidden
                    initial={reduced ? { opacity: 1 } : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { duration: 0.18, delay: 0.16 }
                    }
                    className="mr-1 inline-flex size-2 shrink-0 rounded-full bg-white shadow-[0_0_8px_rgb(255_255_255_/_0.6)]"
                  />
                ) : null}
              </motion.div>
            );
          })
        : [
            <motion.div
              key="stack"
              layout="position"
              transition={transition}
              className="relative h-6 shrink-0"
              style={{ width: stackWidth }}
            >
              {visibleStack.map((user, idx) => (
                <motion.span
                  key={user.id}
                  layoutId={`${scopeId}:av:${user.id}`}
                  transition={transition}
                  className="absolute inline-flex"
                  style={{
                    left: idx * STACK_OFFSET,
                    zIndex: visibleStack.length - idx,
                  }}
                >
                  <CursorAvatar user={user} ringColor={accent} reduced={reduced} />
                </motion.span>
              ))}
            </motion.div>,
            <motion.span
              key="primary-name"
              layout="position"
              transition={transition}
              className="inline-flex min-w-0 items-baseline gap-1.5 text-[13px] leading-none whitespace-nowrap"
            >
              <span className="truncate font-semibold tracking-[-0.005em]">
                {primary.name}
              </span>
              {users.length > 1 ? (
                <span className="shrink-0 rounded-full bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
                  +{users.length - 1}
                </span>
              ) : null}
            </motion.span>,
          ]}
    </motion.div>
  );
}
