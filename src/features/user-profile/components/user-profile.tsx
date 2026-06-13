import { getTranslations } from 'next-intl/server';

import { Separator } from '@/shared/ui/separator';

import type { PublicUserProfile } from '../model/types';

import { ProfileAboutSection } from './profile-about-section';
import { ProfileExperienceList } from './profile-experience-list';
import { ProfileHeader } from './profile-header';
import { ProfileProductsList } from './profile-products-list';
import { ProfileSection } from './profile-section';

type UserProfileProps = {
  profile: PublicUserProfile;
};

export async function UserProfile({ profile }: UserProfileProps) {
  const t = await getTranslations('user-profile.sections');

  return (
    <article className="flex flex-col bg-background">
      <ProfileHeader profile={profile} />

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-8 pb-16 md:gap-10">
          <Separator className="bg-border/70" />

          <ProfileSection label={t('aboutMe')}>
            <ProfileAboutSection profile={profile} />
          </ProfileSection>

          <Separator className="bg-border/70" />

          <ProfileSection label={t('experience')}>
            <ProfileExperienceList experiences={profile.experiences} />
          </ProfileSection>

          <Separator className="bg-border/70" />

          <ProfileSection
            id="products"
            label={t('products')}
            className="scroll-mt-24"
          >
            <ProfileProductsList
              userId={profile.id}
              initialProducts={profile.products}
            />
          </ProfileSection>
        </div>
      </div>
    </article>
  );
}
