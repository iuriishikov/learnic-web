'use client';

import {
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from 'motion/react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { UserAvatar } from '@/shared/ui/user-avatar';

import type { PublicUserProfile } from '../model/types';

import { ProfileMessageButton } from './profile-message-button';
import { ProfileOverflowMenu } from './profile-overflow-menu';
import { UserCover } from './user-cover';

type ProfileHeaderProps = {
  profile: PublicUserProfile;
};

const COVER_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 80,
  damping: 22,
  mass: 0.9,
};

const AVATAR_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 220,
  damping: 24,
  delay: 0.1,
};

const TEXT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 + i * 0.05, duration: 0.32, ease: 'easeOut' },
  }),
};

const ACTIONS_TRANSITION: Transition = {
  duration: 0.32,
  ease: 'easeOut',
  delay: 0.25,
};

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const t = useTranslations('user-profile.actions');
  const reduceMotion = useReducedMotion();

  return (
    <header className="relative">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={COVER_TRANSITION}
        className="relative h-32 w-full sm:h-40 md:h-48 lg:h-56"
      >
        <UserCover
          userId={profile.id}
          initialProfile={profile}
          className="h-full"
        />
      </motion.div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-6 md:flex-row md:items-end md:gap-6 md:pb-8">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={AVATAR_TRANSITION}
            className="-mt-12 shrink-0 sm:-mt-14 md:-mt-16"
          >
            <UserAvatar
              shape="circle"
              statusType={profile.isVerified ? 'verified' : null}
              user={{
                id: profile.id,
                fullName: profile.fullName,
                avatar: profile.avatar,
                isVerified: profile.isVerified,
              }}
              className={cn(
                'size-24 rounded-full ring-4 ring-background sm:size-28 md:size-32',
                '[&_[data-slot=avatar-fallback]]:text-2xl sm:[&_[data-slot=avatar-fallback]]:text-3xl md:[&_[data-slot=avatar-fallback]]:text-4xl',
                '[&_[data-slot=avatar-verified-badge]]:size-6 [&_[data-slot=avatar-verified-badge]]:-right-1 [&_[data-slot=avatar-verified-badge]]:-bottom-1',
              )}
            />
          </motion.div>

          <div className="flex min-w-0 flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="min-w-0">
              <motion.h1
                custom={0}
                initial={reduceMotion ? false : 'hidden'}
                animate="visible"
                variants={TEXT_VARIANTS}
                className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
              >
                {profile.fullName}
              </motion.h1>
              <motion.p
                custom={1}
                initial={reduceMotion ? false : 'hidden'}
                animate="visible"
                variants={TEXT_VARIANTS}
                className="mt-1 truncate text-sm text-muted-foreground"
              >
                {profile.email}
              </motion.p>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={ACTIONS_TRANSITION}
              className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
            >
              <ProfileOverflowMenu profileName={profile.fullName} />
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<a href="#products" />}
                className="h-10 px-4 text-sm font-semibold"
              >
                {t('viewPortfolio')}
              </Button>
              <ProfileMessageButton userId={profile.id} />
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
