'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVerticalIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { useNotify } from '@/shared/lib/notify';
import { Button } from '@/shared/ui/button';
import { HttpsUrlInput } from '@/shared/ui/https-url-input';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  AutosaveIndicator,
  SettingsSection,
} from '@/widgets/settings';

import {
  useSetSocialLinksMutation,
  useSocialLinks,
} from '../api/use-social-links';
import {
  SOCIAL_LINK_URL_MAX,
  SOCIAL_LINKS_MAX,
  socialLinkSchema,
} from '../model/form';
import {
  detectSocialKind,
  type SocialLinkDraft,
} from '../model/types';

const AUTOSAVE_DEBOUNCE_MS = 900;
const SAVED_TTL_MS = 1500;

type SocialLinksEditorProps = {
  userId: string;
};

/**
 * Local-only stable row key. Rows are identified by client-side keys
 * so React reuses the right DOM after add / remove / reorder — `key={index}`
 * confuses controlled inputs (a deleted row's content visually persists
 * on the next row that takes its slot).
 */
type Row = {
  clientKey: string;
  url: string;
};

function fingerprintDraft(rows: SocialLinkDraft[]): string {
  return JSON.stringify(rows);
}

/**
 * Stable per-row identifier for React's reconciler. The list itself is a
 * controlled set we PUT atomically, so the backend never sees these
 * client-only ids — they're only there to keep the right ``<input>``
 * focused / scrolled when the user removes a row mid-set.
 */
function makeClientKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without WebCrypto (older test runners).
  return `row-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export function SocialLinksEditor({ userId }: SocialLinksEditorProps) {
  const t = useTranslations('settings.contacts.social');
  const tAutosave = useTranslations('settings.autosave');
  const tErrors = useTranslations('settings.contacts.errors');
  const notify = useNotify();

  const query = useSocialLinks(userId);
  const mutation = useSetSocialLinksMutation(userId);
  const { mutate } = mutation;

  // `serverSnapshot` is the fingerprint of the items the server currently
  // holds (or that we last successfully PUT). Drift between draft and
  // snapshot is what triggers autosave; on a refetch that returns matching
  // content, we don't re-seed the draft (which would clobber in-progress
  // edits).
  const [draft, setDraft] = useState<Row[]>([]);
  const [serverSnapshot, setServerSnapshot] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Server → draft sync runs during render, NOT in an effect — avoids the
  // cascading-render / setState-in-effect anti-pattern. Mirrors the same
  // pattern `notifications-view` uses for autosave reconciliation.
  if (query.data) {
    const serverFingerprint = fingerprintDraft(
      query.data.map(({ kind, url }) => ({ kind, url })),
    );
    if (serverFingerprint !== serverSnapshot) {
      setServerSnapshot(serverFingerprint);
      setDraft(
        query.data.map(({ url }) => ({
          clientKey: makeClientKey(),
          url,
        })),
      );
    }
  }

  // Errors are a pure derivation of draft + schema — re-compute on every
  // render instead of mirroring into state. Keys are clientKey (stable
  // across edits) so the right error attaches to the right row even when
  // rows get added/removed mid-typing. The kind is derived from the URL
  // host so the schema sees the same shape that will hit the wire.
  const errors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const row of draft) {
      if (!row.url) continue;
      const parsed = socialLinkSchema.safeParse({
        kind: detectSocialKind(row.url),
        url: row.url,
      });
      if (!parsed.success) {
        out[row.clientKey] =
          parsed.error.issues[0]?.message ?? 'socialUrlScheme';
      }
    }
    return out;
  }, [draft]);

  // Debounced autosave. `notify` is `useMemo`-wrapped and `tErrors` is
  // memoised by `useTranslations`, so their identity is stable across
  // renders that don't change anything else — the timer only resets
  // when ``draft`` or its derived ``errors`` actually change.
  useEffect(() => {
    if (serverSnapshot === null) return;
    // Skip while any row is invalid — the user will see the inline error
    // and we don't want to drop partial / malformed input on the wire.
    if (Object.keys(errors).length > 0) return;

    const validated: SocialLinkDraft[] = draft
      .filter((row) => row.url.length > 0)
      .map(({ url }) => ({ kind: detectSocialKind(url), url }));
    const fingerprint = fingerprintDraft(validated);
    if (fingerprint === serverSnapshot) return;

    const timer = setTimeout(() => {
      mutate(
        { items: validated },
        {
          onSuccess: () => {
            setServerSnapshot(fingerprint);
            setSavedAt(Date.now());
          },
          onError: () => notify.error(tErrors('saveFailed')),
        },
      );
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, errors, serverSnapshot, mutate, notify, tErrors]);

  // Drop the "Saved" pill after the TTL.
  useEffect(() => {
    if (savedAt === null) return;
    const timer = setTimeout(() => setSavedAt(null), SAVED_TTL_MS);
    return () => clearTimeout(timer);
  }, [savedAt]);

  function addRow() {
    if (draft.length >= SOCIAL_LINKS_MAX) return;
    setDraft((prev) => [
      ...prev,
      { clientKey: makeClientKey(), url: '' },
    ]);
  }
  function removeRow(clientKey: string) {
    setDraft((prev) => prev.filter((row) => row.clientKey !== clientKey));
  }
  function updateRow(clientKey: string, url: string) {
    setDraft((prev) =>
      prev.map((row) =>
        row.clientKey === clientKey ? { ...row, url } : row,
      ),
    );
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((prev) => {
      const fromIdx = prev.findIndex((row) => row.clientKey === active.id);
      const toIdx = prev.findIndex((row) => row.clientKey === over.id);
      if (fromIdx < 0 || toIdx < 0) return prev;
      return arrayMove(prev, fromIdx, toIdx);
    });
  }

  const loading = query.isPending;

  return (
    <SettingsSection
      title={t('title')}
      description={t('description')}
      headerActions={
        <AutosaveIndicator
          saving={mutation.isPending}
          justSaved={savedAt !== null}
          savingLabel={tAutosave('saving')}
          savedLabel={tAutosave('saved')}
        />
      }
    >
      <div className="flex flex-col gap-3 py-5">
        {loading ? (
          <RowsSkeleton />
        ) : draft.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        ) : (
          <DndContext
            id="social-links-dnd"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={draft.map((row) => row.clientKey)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-3">
                {draft.map((row) => (
                  <SortableSocialLinkRow
                    key={row.clientKey}
                    row={row}
                    error={errors[row.clientKey]}
                    onUpdate={(next) => updateRow(row.clientKey, next)}
                    onRemove={() => removeRow(row.clientKey)}
                    placeholder={t('fields.url.placeholder')}
                    urlLabel={t('fields.url.label')}
                    removeLabel={t('actions.remove')}
                    dragLabel={t('actions.reorder')}
                    errorMessage={
                      errors[row.clientKey]
                        ? tErrors(errors[row.clientKey])
                        : undefined
                    }
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {!loading ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit gap-1.5"
            onClick={addRow}
            disabled={draft.length >= SOCIAL_LINKS_MAX}
          >
            <PlusIcon className="size-4" aria-hidden />
            {t('actions.add')}
          </Button>
        ) : null}
      </div>
    </SettingsSection>
  );
}

type SortableSocialLinkRowProps = {
  row: Row;
  error: string | undefined;
  onUpdate: (next: string) => void;
  onRemove: () => void;
  placeholder: string;
  urlLabel: string;
  removeLabel: string;
  dragLabel: string;
  errorMessage: string | undefined;
};

function SortableSocialLinkRow({
  row,
  error,
  onUpdate,
  onRemove,
  placeholder,
  urlLabel,
  removeLabel,
  dragLabel,
  errorMessage,
}: SortableSocialLinkRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.clientKey });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex flex-col gap-2 rounded-md border border-border bg-card p-3 transition-shadow sm:flex-row sm:items-start',
        isDragging && 'opacity-80 shadow-md ring-1 ring-brand/40',
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={dragLabel}
        className={cn(
          'hidden size-7 shrink-0 cursor-grab touch-none items-center justify-center self-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing sm:inline-flex',
          isDragging && 'cursor-grabbing',
        )}
      >
        <GripVerticalIcon className="size-4" aria-hidden />
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <HttpsUrlInput
          placeholder={placeholder}
          maxLength={SOCIAL_LINK_URL_MAX}
          aria-invalid={Boolean(error)}
          aria-label={urlLabel}
          groupClassName="h-11 rounded-md"
          className="text-[15px]"
          value={row.url}
          onValueChange={onUpdate}
        />
        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="self-end text-destructive hover:bg-destructive/10 hover:text-destructive sm:mt-1.5 sm:self-start"
        onClick={onRemove}
        aria-label={removeLabel}
      >
        <Trash2Icon />
      </Button>
    </li>
  );
}

function RowsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-md border border-border bg-card p-3"
        >
          <Skeleton className="h-11 flex-1 rounded-md" />
          <Skeleton className="size-7 rounded-sm" />
        </div>
      ))}
    </div>
  );
}
