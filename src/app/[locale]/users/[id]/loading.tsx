import { UserProfileSkeleton } from '@/features/user-profile';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

export default function UserProfileLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <UserProfileSkeleton />
      </main>
      <SiteFooter />
    </div>
  );
}
