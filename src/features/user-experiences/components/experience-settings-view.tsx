'use client';

import { BriefcaseIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuth } from '@/shared/auth';
import { useNotify } from '@/shared/lib/notify';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { SettingsSection } from '@/widgets/settings';

import {
  useDeleteExperienceMutation,
  useUserExperiences,
} from '../api/use-experiences';
import type { UserExperience } from '../model/types';

import { ExperienceFormDialog } from './experience-form-dialog';
import { ExperienceRow } from './experience-row';

export function ExperienceSettingsView() {
  const t = useTranslations('settings.experience');
  const tErrors = useTranslations('settings.experience.errors');
  const { user } = useAuth();
  const notify = useNotify();

  const query = useUserExperiences(user?.oid);
  const remove = useDeleteExperienceMutation(user?.oid ?? '');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserExperience | null>(null);
  const [confirmingDelete, setConfirmingDelete] =
    useState<UserExperience | null>(null);

  if (!user) return null;

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(experience: UserExperience) {
    setEditing(experience);
    setDialogOpen(true);
  }
  function handleDelete() {
    if (!confirmingDelete) return;
    remove.mutate(
      { id: confirmingDelete.id },
      {
        onSuccess: () => {
          notify.success(t('deleted'));
          setConfirmingDelete(null);
        },
        onError: () => notify.error(tErrors('deleteFailed')),
      },
    );
  }

  return (
    <>
      <SettingsSection
        title={t('title')}
        description={t('description')}
        headerActions={
          <Button type="button" size="sm" onClick={openAdd} className="gap-1.5">
            <PlusIcon className="size-4" aria-hidden />
            {t('add')}
          </Button>
        }
      >
        <div className="flex flex-col gap-3 py-5">
          {query.isPending ? (
            <ListSkeleton />
          ) : query.isError ? (
            <ListError onRetry={() => query.refetch()} />
          ) : query.data && query.data.length > 0 ? (
            query.data.map((experience) => (
              <ExperienceRow
                key={experience.id}
                experience={experience}
                onEdit={() => openEdit(experience)}
                onDelete={() => setConfirmingDelete(experience)}
              />
            ))
          ) : (
            <EmptyState onAdd={openAdd} />
          )}
        </div>
      </SettingsSection>

      <ExperienceFormDialog
        userId={user.oid}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
      />

      <AlertDialog
        open={confirmingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDelete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDelete.description', {
                title: confirmingDelete?.title ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t('confirmDelete.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={remove.isPending}
              onClick={handleDelete}
            >
              {remove.isPending
                ? t('confirmDelete.deleting')
                : t('confirmDelete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 2 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
        >
          <Skeleton className="size-12 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('settings.experience.errors');
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      <p>{t('loadFailed')}</p>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {t('retry')}
      </Button>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useTranslations('settings.experience.empty');
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BriefcaseIcon className="size-5" aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-foreground">{t('title')}</p>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Button type="button" size="sm" onClick={onAdd} className="gap-1.5">
        <PlusIcon className="size-4" aria-hidden />
        {t('cta')}
      </Button>
    </div>
  );
}
