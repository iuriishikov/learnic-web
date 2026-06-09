import { UserProfileSkeleton } from '@/features/user-profile';

export default function UserProfileLoading() {
  return (
    <main className="flex-1">
      <UserProfileSkeleton />
    </main>
  );
}
