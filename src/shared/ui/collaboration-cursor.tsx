'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

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
  const [rect, setRect] = React.useState<Rect | null>(null);
  // Scope layoutIds so two cursors with overlapping user ids don't fight
  // for the same FLIP target inside Framer Motion's global layout group.
  const scopeId = React.useId();

  const element = resolveElement(target);

  React.useLayoutEffect(() => {
    if (!element) {
      // Clearing the rect when the target detaches is unavoidable derived-state
      // sync; the lint rule against `setState` in effects doesn't apply.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRect(null);
      return;
    }

    let frame = 0;
    const measure = () => {
      const b = element.getBoundingClientRect();
      setRect({ x: b.left, y: b.top, width: b.width, height: b.height });
    };

    // Defer the initial measurement to the next frame so the setState is not
    // synchronous in the effect body — same shape as the listener path below.
    frame = requestAnimationFrame(measure);

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
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
  }, [element]);

  if (!isClient) return null;

  const primary = users[0];
  const active = Boolean(rect && primary);
  const accent = primary ? userColor(primary) : FALLBACK_PALETTE[0];

  const point = rect ? anchorPoint(rect, anchor) : null;
  const cursorX = (point?.x ?? 0) + offset.x;
  const cursorY = (point?.y ?? 0) + offset.y;

  const positionTransition = reduced ? { duration: 0 } : POSITION_SPRING;

  return createPortal(
    <div
      className={cn(
        'pointer-events-none fixed inset-0 overflow-hidden',
        className,
      )}
      style={{ zIndex }}
      aria-hidden
    >
      <AnimatePresence>
        {active && rect && showFieldHighlight ? (
          <motion.div
            key="cc-highlight"
            className="absolute rounded-md"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              top: rect.y - 3,
              left: rect.x - 3,
              width: rect.width + 6,
              height: rect.height + 6,
            }}
            exit={{ opacity: 0 }}
            transition={positionTransition}
            style={{
              boxShadow: `0 0 0 2px ${accent}, 0 0 0 6px ${accent}22`,
            }}
          />
        ) : null}

        {active ? (
          <motion.div
            key="cc-cursor"
            className="absolute top-0 left-0 origin-top-left"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, x: cursorX, y: cursorY }}
            exit={{ opacity: 0 }}
            transition={{
              ...positionTransition,
              opacity: reduced ? { duration: 0 } : { duration: 0.18 },
            }}
          >
            <CursorPointer color={accent} />
            <CursorLabel
              users={users}
              accent={accent}
              reduced={reduced ?? false}
              scopeId={scopeId}
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
        halo={false}
        statusType={null}
        showLoadErrorIndicator={false}
      />
    </motion.span>
  );
}

function CursorLabel({ users, accent, reduced, scopeId }: CursorLabelProps) {
  const [expanded, setExpanded] = React.useState(false);
  const primary = users[0];
  if (!primary) return null;

  const canExpand = users.length > 1;
  const isExpanded = expanded && canExpand;
  const transition = reduced ? { duration: 0 } : FAST_SPRING;

  const visibleStack = users.slice(0, COLLAPSED_VISIBLE);
  const stackWidth = STACK_OFFSET * Math.max(visibleStack.length - 1, 0) + 24;

  return (
    <motion.div
      layout
      transition={transition}
      onMouseEnter={canExpand ? () => setExpanded(true) : undefined}
      onMouseLeave={() => setExpanded(false)}
      className={cn(
        'pointer-events-auto absolute top-[18px] left-[14px] font-medium text-white',
        'shadow-[0_12px_32px_-8px_rgb(0_0_0/0.35),0_4px_8px_-2px_rgb(0_0_0/0.15)]',
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
