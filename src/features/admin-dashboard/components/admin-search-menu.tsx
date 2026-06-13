'use client';

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckIcon,
  ChevronRightIcon,
  Loader2Icon,
  SearchIcon,
  SearchXIcon,
  XIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { useNotify } from '@/shared/lib/notify';
import { CommandMenuInput, CommandMenuItem } from '@/shared/ui/command-menu';

import {
  useAdminActionMutation,
  type AdminActionKind,
} from '../api/use-admin-actions';
import { SEARCH_MIN_QUERY_LEN } from '../model/search';

import {
  ActionItem,
  MenuBackHeader,
  SearchLoadingRows,
  SearchMenuShell,
  SearchStateBlock,
} from './search-menu-shell';

/** A confirmation prompt for an irreversible action. */
type ActionConfirm = { title: string; description: string; cta: string };

/**
 * One entry in an entity's action list — either a navigation (`href`) or a
 * backend mutation (`mutation`). Mutations with a `confirm` route through an
 * in-palette confirmation step first.
 */
export type ActionDef = {
  key: string;
  label: string;
  icon: ReactNode;
  tone?: 'default' | 'destructive';
} & (
  | { href: string }
  | { mutation: AdminActionKind; successMsg: string; confirm?: ActionConfirm }
);

type ConfirmableAction = Extract<ActionDef, { mutation: AdminActionKind }> & {
  confirm: ActionConfirm;
};

type View<E> =
  | { step: 'search' }
  | { step: 'actions'; entity: E }
  | { step: 'confirm'; entity: E; action: ConfirmableAction };

export type AdminSearchMenuProps<E extends { id: string }> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  placeholder: string;
  query: string;
  setQuery: (value: string) => void;
  data: E[] | undefined;
  isError: boolean;
  emptyLabel: string;
  loadingShape: 'circle' | 'square';
  getName: (entity: E) => string;
  renderLeading: (entity: E) => ReactNode;
  renderDescription?: (entity: E) => ReactNode;
  buildActions: (entity: E) => ActionDef[];
};

export function AdminSearchMenu<E extends { id: string }>({
  open,
  onOpenChange,
  title,
  placeholder,
  query,
  setQuery,
  data,
  isError,
  emptyLabel,
  loadingShape,
  getName,
  renderLeading,
  renderDescription,
  buildActions,
}: AdminSearchMenuProps<E>) {
  const t = useTranslations('admin-dashboard');
  const router = useRouter();
  const notify = useNotify();
  const mutation = useAdminActionMutation();
  const [view, setView] = useState<View<E>>({ step: 'search' });

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setQuery('');
      setView({ step: 'search' });
    }
    onOpenChange(next);
  };

  const execMutation = (
    entity: E,
    action: Extract<ActionDef, { mutation: AdminActionKind }>,
  ) => {
    mutation.mutate(
      { kind: action.mutation, id: entity.id },
      {
        onSuccess: () => {
          notify.success(action.successMsg);
          handleOpenChange(false);
        },
        onError: () => notify.error(t('actions.error')),
      },
    );
  };

  const runAction = (entity: E, action: ActionDef) => {
    if ('href' in action) {
      router.push(action.href);
      handleOpenChange(false);
      return;
    }
    if (action.confirm) {
      setView({ step: 'confirm', entity, action: { ...action, confirm: action.confirm } });
      return;
    }
    execMutation(entity, action);
  };

  let topbar: ReactNode;
  let body: ReactNode;

  if (view.step === 'search') {
    topbar = (
      <CommandMenuInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
        hint={null}
      />
    );
    const tooShort = query.trim().length < SEARCH_MIN_QUERY_LEN;
    if (tooShort) {
      body = (
        <SearchStateBlock
          icon={<SearchIcon className="size-5" />}
          title={t('search.minChars')}
        />
      );
    } else if (isError) {
      body = (
        <SearchStateBlock
          icon={<AlertCircleIcon className="size-5" />}
          title={t('search.error')}
        />
      );
    } else if (data && data.length > 0) {
      body = data.map((entity) => (
        <CommandMenuItem
          key={entity.id}
          value={`result-${entity.id}`}
          leading={renderLeading(entity)}
          description={renderDescription?.(entity)}
          trailing={
            <ChevronRightIcon className="size-4 text-muted-foreground" />
          }
          onSelect={() => setView({ step: 'actions', entity })}
        >
          {getName(entity)}
        </CommandMenuItem>
      ));
    } else if (data) {
      body = (
        <SearchStateBlock
          icon={<SearchXIcon className="size-5" />}
          title={emptyLabel}
        />
      );
    } else {
      body = <SearchLoadingRows shape={loadingShape} />;
    }
  } else if (view.step === 'actions') {
    const { entity } = view;
    topbar = (
      <MenuBackHeader
        title={getName(entity)}
        backLabel={t('actions.back')}
        onBack={() => setView({ step: 'search' })}
      />
    );
    body = buildActions(entity).map((action) => (
      <ActionItem
        key={action.key}
        value={`action-${action.key}`}
        icon={action.icon}
        label={action.label}
        tone={action.tone}
        onSelect={() => runAction(entity, action)}
      />
    ));
  } else {
    const { entity, action } = view;
    topbar = (
      <MenuBackHeader
        title={getName(entity)}
        backLabel={t('actions.back')}
        onBack={() => setView({ step: 'actions', entity })}
      />
    );
    body = (
      <>
        <SearchStateBlock
          icon={<AlertTriangleIcon className="size-5 text-destructive" />}
          title={action.confirm.title}
          description={action.confirm.description}
        />
        <div className="flex flex-col gap-1 px-1 pb-1">
          <ActionItem
            value="confirm-cancel"
            icon={<XIcon />}
            label={t('actions.cancel')}
            disabled={mutation.isPending}
            onSelect={() => setView({ step: 'actions', entity })}
          />
          <ActionItem
            value="confirm-go"
            tone="destructive"
            disabled={mutation.isPending}
            icon={
              mutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <CheckIcon />
              )
            }
            label={action.confirm.cta}
            onSelect={() => execMutation(entity, action)}
          />
        </div>
      </>
    );
  }

  return (
    <SearchMenuShell
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      topbar={topbar}
    >
      {body}
    </SearchMenuShell>
  );
}
