'use client';

import { FlagIcon, MoreHorizontalIcon, ShareIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useNotify } from '@/shared/lib/notify';
import { Button } from '@/shared/ui/button';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuTrigger,
} from '@/shared/ui/menu';

import { ProfileReportDialog } from './profile-report-dialog';

type ProfileOverflowMenuProps = {
  profileName: string;
};

export function ProfileOverflowMenu({ profileName }: ProfileOverflowMenuProps) {
  const t = useTranslations('user-profile.menu');
  const tShare = useTranslations('user-profile.share');
  const notify = useNotify();
  const [reportOpen, setReportOpen] = useState(false);

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      notify.success(tShare('success'));
    } catch {
      notify.error(tShare('errorTitle'), {
        description: tShare('errorDescription'),
      });
    }
  };

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <Button
              size="icon-lg"
              variant="outline"
              aria-label={t('trigger')}
              className="h-10 w-10"
            >
              <MoreHorizontalIcon className="size-4" aria-hidden="true" />
            </Button>
          }
        />
        <MenuContent align="end" sideOffset={8} size="md">
          <MenuGroup>
            <MenuItem leading={<ShareIcon />} onClick={handleShare}>
              {t('share')}
            </MenuItem>
            <MenuItem
              leading={<FlagIcon />}
              variant="destructive"
              onClick={() => setReportOpen(true)}
            >
              {t('report')}
            </MenuItem>
          </MenuGroup>
        </MenuContent>
      </Menu>

      <ProfileReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        profileName={profileName}
      />
    </>
  );
}
