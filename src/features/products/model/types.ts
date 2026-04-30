export type ProductType = 'course' | 'webinar';

export type ProductStatus = 'draft' | 'published' | 'archived';

export type Product = {
  id: string;
  type: ProductType;
  title: string;
  description: string;
  status: ProductStatus;
  studentsCount: number;
  lessonsCount?: number;
  durationMinutes?: number;
  scheduledAt?: string;
  updatedAt: string;
  coverHue: number;
};
