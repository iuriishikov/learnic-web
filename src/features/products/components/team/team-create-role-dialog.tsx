'use client';

import {
  CheckIcon,
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
import { Input } from '@/shared/ui/input';

import {
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_COLORS,
  ROLE_PRESETS,
  type RoleColor,
  type RolePreset,
  type TeamPermission,
  type TeamRole,
  presetPermissions,
  roleColorClasses,
} from './team-mock';

export type CreateRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog is in edit mode and pre-populated. */
  editingRole?: TeamRole | null;
  /** Number of members that currently have the editing role (for hint copy). */
  editingMemberCount?: number;
  onSubmit: (input: {
    id: string | null;
    name: string;
    color: RoleColor;
    permissions: ReadonlyArray<TeamPermission>;
  }) => void;
};

export function CreateRoleDialog({
  open,
  onOpenChange,
  editingRole,
  editingMemberCount = 0,
  onSubmit,
}: CreateRoleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        {/* Re-mounting on open + role change re-seeds the form's local state
            cleanly without a setState-in-effect anti-pattern. */}
        {open ? (
          <CreateRoleForm
            key={editingRole?.id ?? 'new'}
            editingRole={editingRole}
            editingMemberCount={editingMemberCount}
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
  onSubmit,
  onCancel,
}: {
  editingRole?: TeamRole | null;
  editingMemberCount: number;
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
  const [color, setColor] = useState<RoleColor>(editingRole?.color ?? 'brand');
  const [permissions, setPermissions] = useState<Set<TeamPermission>>(
    () => new Set(editingRole?.permissions ?? []),
  );
  const [activePreset, setActivePreset] = useState<RolePreset | null>(null);

  const togglePermission = (permission: TeamPermission) => {
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
    const trimmed = name.trim();
    if (trimmed.length === 0) return;
    onSubmit({
      id: editingRole?.id ?? null,
      name: trimmed,
      color,
      permissions: Array.from(permissions),
    });
  };

  const isEdit = Boolean(editingRole);
  const titleText = isEdit ? t('editTitle') : t('createTitle');
  const descriptionText = isEdit
    ? t('editDescription', { count: editingMemberCount })
    : t('createDescription');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex size-9 items-center justify-center rounded-lg ring-1 ring-foreground/10',
              roleColorClasses(color).bgSoft,
            )}
          >
            <ShieldIcon
              className={cn('size-4', roleColorClasses(color).text)}
            />
          </span>
          <div className="flex flex-col gap-0.5">
            <DialogTitle>{titleText}</DialogTitle>
            <DialogDescription>{descriptionText}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Name + color */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="role-name"
                className="text-sm font-medium text-foreground"
              >
                {t('nameLabel')}
              </label>
              <Input
                id="role-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t('namePlaceholder')}
                autoFocus
                required
                maxLength={60}
                className="h-10 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                {t('colorLabel')}
              </span>
              <div className="flex items-center gap-1.5">
                {ROLE_COLORS.map((c) => {
                  const tone = roleColorClasses(c);
                  const active = c === color;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={c}
                      aria-pressed={active}
                      className={cn(
                        'relative flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110',
                        tone.bg,
                        active && 'ring-2 ring-offset-2 ring-offset-background',
                        active && tone.ring,
                      )}
                    >
                      {active ? (
                        <CheckIcon className="size-4 text-white" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
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
                      {active ? (
                        <SparklesIcon className="size-3" />
                      ) : null}
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
                total={ALL_PERMISSIONS.length}
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
                            // The button above handles toggling; the visual
                            // checkbox stays in sync without listening to
                            // its own change to avoid double-toggling.
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

      <DialogFooter className="sticky bottom-0 z-10 bg-popover">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          {t('cancel')}
        </Button>
        <Button
          type="submit"
          className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90"
          disabled={name.trim().length === 0}
        >
          <CheckIcon className="size-4" />
          {t('submit')}
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
