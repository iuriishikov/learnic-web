import type { PublicUserProfile } from '../model/types';

import { ProfileAboutText } from './profile-about-text';
import { ProfileInfoRow } from './profile-info-row';
import { ProfileSocialIcons } from './profile-social-icons';

type ProfileAboutSectionProps = {
  profile: PublicUserProfile;
};

export function ProfileAboutSection({ profile }: ProfileAboutSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="min-w-0 flex-1">
          <ProfileAboutText html={profile.descriptionHtml} />
        </div>
        {profile.socials.length > 0 ? (
          <ProfileSocialIcons
            items={profile.socials}
            className="shrink-0 md:pt-1"
          />
        ) : null}
      </div>
      <ProfileInfoRow profile={profile} />
    </div>
  );
}
