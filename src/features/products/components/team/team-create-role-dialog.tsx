'use client';

import {
  CheckIcon,
  Loader2Icon,
  ShieldIcon,
  SparklesIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { type FormEvent, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { TextInput } from '@/shared/ui/input-extended';
import { RequiredMark } from '@/shared/ui/required-mark';

import {
  PERMISSION_GROUPS,
  PERMISSIONS,
  ROLE_PRESETS,
  type Permission,
  type Role,
  type RolePreset,
  presetPermissions,
} from '../../model/team';

import {
  colorForRole,
  roleColorClasses,
} from './team-shared';

export type CreateRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog is in edit mode and pre-populated. */
  editingRole?: Role | null;
  /** Number of members that currently have the editing role (for hint copy). */
  editingMemberCount?: number;
  /** Whether the parent mutation is in flight. */
  pending?: boolean;
  onSubmit: (input: {
    id: string | null;
    name: string;
    permissions: ReadonlyArray<Permission>;
  }) => void;
};

export function CreateRoleDialog({
  open,
  onOpenChange,
  editingRole,
  editingMemberCount = 0,
  pending = false,
  onSubmit,
}: CreateRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] flex-col gap-0 overflow-hidden sm:max-w-2xl">
        {/* Re-mounting on open + role change re-seeds the form's local state
            cleanly without a setState-in-effect anti-pattern. */}
        {open ? (
          <CreateRoleForm
            key={editingRole?.id ?? 'new'}
            editingRole={editingRole}
            editingMemberCount={editingMemberCount}
            pending={pending}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateRoleForm({
  editingRole,
  editingMemberCount,
  pending,
  onSubmit,
  onCancel,
}: {
  editingRole?: Role | null;
  editingMemberCount: number;
  pending: boolean;
  onSubmit: CreateRoleDialogProps['onSubmit'];
  onCancel: () => void;
}) {
  const t = useTranslations('teach-products.editor.team.createRole');
  const tPerm = useTranslations('teach-products.editor.team.permissions');
  const tPreset = useTranslations(
    'teach-products.editor.team.createRole.presets',
  );
  const reduceMotion = useReducedMotion();

  const [name, setName] = useState(editingRole?.name ?? '');
  const [permissions, setPermissions] = useState<Set<Permission>>(
    () => new Set(editingRole?.permissions ?? []),
  );
  const [activePreset, setActivePreset] = useState<RolePreset | null>(null);

  const tone = editingRole
    ? roleColorClasses(colorForRole(editingRole))
    : roleColorClasses('brand');

  const togglePermission = (permission: Permission) => {
    setActivePreset(null);
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  };

  const toggleGroup = (groupId: string, allOn: boolean) => {
    setActivePreset(null);
    const group = PERMISSION_GROUPS.find((g) => g.id === groupId);
    if (!group) return;
    setPermissions((prev) => {
      const next = new Set(prev);
      group.permissions.forEach((p) => {
        if (allOn) next.delete(p);
        else next.add(p);
      });
      return next;
    });
  };

  const applyPreset = (preset: RolePreset) => {
    setActivePreset(preset);
    setPermissions(new Set(presetPermissions(preset)));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    if (permissions.size === 0) return;
    onSubmit({
      id: editingRole?.id ?? null,
      name: trimmed,
      permissions: Array.from(permissions),
    });
  };

  const isEdit = Boolean(editingRole);
  const titleText = isEdit ? t('editTitle') : t('createTitle');
  const descriptionText = isEdit
    ? t('editDescription', { count: editingMemberCount })
    : t('createDescription');

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <DialogHeader className="mb-6">
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg ring-1 ring-foreground/10',
              tone.bgSoft,
            )}
          >
            <ShieldIcon className={cn('size-4', tone.text)} />
          </span>
          <div className="flex flex-col gap-0.5">
            <DialogTitle>{titleText}</DialogTitle>
            <DialogDescription>{descriptionText}</DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="-mx-4 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-4 pb-6">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="role-name"
          className="text-sm font-medium text-foreground"
        >
          {t('nameLabel')}
          <RequiredMark />
        </label>
        <TextInput
          id="role-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('namePlaceholder')}
          autoFocus
          required
          maxLength={100}
          className="h-10 text-sm"
        />
      </div>

      {/* Presets */}
      {!isEdit ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">
            {t('presetLabel')}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_PRESETS.map((preset) => {
              const active = activePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground',
                  )}
                >
                  {active ? <SparklesIcon className="size-3" /> : null}
                  {tPreset(preset)}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Permissions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-foreground">
            {t('permissionsLabel')}
          </span>
          <PermissionsSummary
            selected={permissions.size}
            total={PERMISSIONS.length}
            reduceMotion={!!reduceMotion}
          />
        </div>
        <div className="flex flex-col gap-3">
          {PERMISSION_GROUPS.map((group) => {
            const groupAllChecked = group.permissions.every((p) =>
              permissions.has(p),
            );
            const groupSomeChecked =
              !groupAllChecked &&
              group.permissions.some((p) => permissions.has(p));
            return (
              <fieldset
                key={group.id}
                className="rounded-xl border border-border bg-background p-3"
              >
                <legend className="contents">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id, groupAllChecked)}
                    className="-m-1 mb-1.5 flex w-[calc(100%+0.5rem)] items-center justify-between rounded-md p-1 transition-colors hover:bg-muted/40"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {tPerm(`groups.${group.id}`)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>
                        {group.permissions.filter((p) =>
                          permissions.has(p),
                        ).length}
                        /{group.permissions.length}
                      </span>
                      <Checkbox
                        checked={groupAllChecked}
                        indeterminate={groupSomeChecked}
                        onCheckedChange={() =>
                          toggleGroup(group.id, groupAllChecked)
                        }
                        aria-label={tPerm(`groups.${group.id}`)}
                      />
                    </span>
                  </button>
                </legend>
                <ul className="flex flex-col">
                  {group.permissions.map((permission) => {
                    const checked = permissions.has(permission);
                    return (
                      <li key={permission}>
                        <label
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors',
                            checked
                              ? 'bg-brand/[0.04]'
                              : 'hover:bg-muted/40',
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              togglePermission(permission)
                            }
                            aria-label={tPerm(`items.${permission}.label`)}
                            className="mt-0.5"
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-sm font-medium text-foreground">
                              {tPerm(`items.${permission}.label`)}
                            </span>
                            <span className="text-xs leading-snug text-muted-foreground">
                              {tPerm(`items.${permission}.description`)}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </fieldset>
            );
          })}
        </div>
      </div>

      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={
            pending || name.trim().length === 0 || permissions.size === 0
          }
        >
          {pending ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <CheckIcon className="size-4" />
          )}
          {pending ? t('submitting') : t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PermissionsSummary({
  selected,
  total,
  reduceMotion,
}: {
  selected: number;
  total: number;
  reduceMotion: boolean;
}) {
  const t = useTranslations('teach-products.editor.team.createRole');
  const pct = total === 0 ? 0 : Math.round((selected / total) * 100);
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="hidden sm:inline">{t('summary', { selected, total })}</span>
      <div
        aria-hidden
        className="relative h-1.5 w-20 overflow-hidden rounded-full bg-muted"
      >
        <motion.span
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 240, damping: 28 }
          }
          className="absolute inset-y-0 left-0 rounded-full bg-brand"
        />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-foreground">
        {pct}%
      </span>
    </div>
  );
}
