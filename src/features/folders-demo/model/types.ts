export type DemoProductType = 'course' | 'webinar';

export type DemoProductStatus = 'draft' | 'published' | 'archived';

export type DemoCoverGradient = {
  from: string;
  to: string;
  emoji: string;
};

export type DemoProduct = {
  id: string;
  type: DemoProductType;
  status: DemoProductStatus;
  title: string;
  description: string;
  durationHours: number;
  lessons: number | null;
  cover: DemoCoverGradient;
  folderId: string | null;
  updatedAt: string;
};

export type DemoFolder = {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  emoji?: string;
  updatedAt: string;
};

export type DemoState = {
  folders: DemoFolder[];
  products: DemoProduct[];
};
