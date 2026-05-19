import { MarketplaceSkeleton } from '@/features/products';
import { PageHeader } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

export default function MarketplaceLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeader />
      <main className="flex-1">
        <MarketplaceSkeleton />
      </main>
      <SiteFooter />
    </div>
  );
}
