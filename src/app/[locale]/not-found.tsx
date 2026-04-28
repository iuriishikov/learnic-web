import { NotFoundContent } from '@/widgets/not-found-content';
import { SiteFooter } from '@/widgets/site-footer';
import { SiteHeader } from '@/widgets/site-header';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  );
}
