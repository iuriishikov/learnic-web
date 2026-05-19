'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';

import { useNotify } from '@/shared/lib/notify';
import { Button } from '@/shared/ui/button';
import { UserAvatar, type AvatarUser } from '@/shared/ui/user-avatar';

import { deleteAvatarAction, uploadAvatarAction } from '../api/avatar';
import { useAuth } from '@/shared/auth';
import { runUploadWithProgressToast } from './upload-progress';

const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml';
const MAX_BYTES = 8 * 1024 * 1024;

export function AvatarUploader() {
  const t = useTranslations('settings.profile.avatar');
  const tErrors = useTranslations('settings.errors');
  const tProgress = useTranslations('settings.profile.upload');
  const notify = useNotify();
  const { user, refresh } = useAuth();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  if (!user) return null;

  const avatarUser: AvatarUser = {
    id: user.oid,
    fullName: user.fullName,
    avatar: user.avatar,
    isVerified: user.isVerified,
  };

  function handlePick() {
    inputRef.current?.click();
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > MAX_BYTES) {
      notify.error(tErrors('fileTooLarge'));
      return;
    }

    setPreviewFile(file);
    startTransition(async () => {
      const result = await runUploadWithProgressToast({
        notify,
        title: tProgress('avatarUploading'),
        description: file.name,
        successTitle: t('uploaded'),
        errorTitle: tErrors('uploadFailed'),
        run: async () => {
          const formData = new FormData();
          formData.set('file', file);
          return uploadAvatarAction(formData);
        },
      });
      setPreviewFile(null);
      if (result.ok) {
        await refresh();
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteAvatarAction();
      if (result.ok) {
        await refresh();
        notify.success(t('deleted'));
      } else {
        notify.error(tErrors('deleteFailed'));
      }
    });
  }

  const hasAvatar = user.avatar !== null || Boolean(previewFile);

  return (
    <div className="flex items-center gap-4">
      <UserAvatar
        user={avatarUser}
        size="lg"
        shape="circle"
        statusType={null}
        previewFile={previewFile}
        className="size-16"
      />
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex items-center gap-2">
        {hasAvatar ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={pending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {t('delete')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          disabled={pending}
        >
          {hasAvatar ? t('replace') : t('upload')}
        </Button>
      </div>
    </div>
  );
}
