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
  durationHours: number;
  cover: DemoCoverGradient;
  folderId: string | null;
};

export type DemoFolder = {
  id: string;
  name: string;
  parentId: string | null;
  emoji?: string;
};

export type DemoState = {
  folders: DemoFolder[];
  products: DemoProduct[];
};
