import { ProductInfoSkeleton } from '@/features/products';
import { DefaultHeaderConfig } from '@/widgets/app-header';
import { PageHeader } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

export default function ProductLandingLoading() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DefaultHeaderConfig />
      <PageHeader />
      <main className="flex-1">
        <ProductInfoSkeleton />
      </main>
      <SiteFooter />
    </div>
  );
}
