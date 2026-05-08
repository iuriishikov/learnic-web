export type LessonBlockType = 'html' | 'katex' | 'rutube_video';

export type HtmlBlock = {
  type: 'html';
  id: string;
  position: number;
  html: string;
};

export type KatexBlock = {
  type: 'katex';
  id: string;
  position: number;
  source: string;
};

export type RutubeVideoBlock = {
  type: 'rutube_video';
  id: string;
  position: number;
  externalId: string;
  embedUrl: string;
  title: string | null;
};

export type LessonBlock = HtmlBlock | KatexBlock | RutubeVideoBlock;

export type DraftLesson = {
  id: string;
  title: string;
  position: number;
  blocks: LessonBlock[];
};

export type DraftModule = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  lessons: DraftLesson[];
};

export type CourseDraft = {
  courseId: string;
  fetchedAt: string;
  modules: DraftModule[];
};
