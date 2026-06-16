import { PhotoGallery } from '@/shared/ui/photo-gallery';

// TEMP verification page — delete after QA.
const PHOTOS = [
  { src: 'https://picsum.photos/seed/wide1/1600/890', alt: 'landscape 1' },
  { src: 'https://picsum.photos/seed/port1/600/845', alt: 'portrait 1' },
  { src: 'https://picsum.photos/seed/wide2/1500/980', alt: 'landscape 2' },
  { src: 'https://picsum.photos/seed/port2/640/900', alt: 'portrait 2' },
];

export default function PgCheckPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-3xl p-8">
      <PhotoGallery
        photos={PHOTOS}
        sizing="natural"
        unoptimized
        prevLabel="prev"
        nextLabel="next"
        ariaLabel="gallery"
      />
    </div>
  );
}
