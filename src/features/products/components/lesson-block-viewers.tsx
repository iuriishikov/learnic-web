'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { CodeBlock } from '@/shared/ui/code-block';
import { FunctionGraph } from '@/shared/ui/function-graph';
import { MathView } from '@/shared/ui/math-view';
import { PhotoGallery, type PhotoGalleryPhoto } from '@/shared/ui/photo-gallery';

import { PROSE_HTML_CLASS } from '../lib/prose';
import type { FunctionGraphBlock, PhotoCollageBlock } from '../model/draft';
import type { PublicLessonBlock } from '../model/public-content';
import type { SavedBlockAnswer } from '../model/saved-answer';

import { FileBlockView, VideoFileBlockView } from './file-block-dialogs';
import {
  LearnerMultiChoiceBlock,
  LearnerSingleChoiceBlock,
  LearnerTextInputBlock,
} from './learner-answer-blocks';
import { RutubeBlockView } from './lesson-blocks';

export type LessonBlockViewerContext = {
  noteId: string;
  /** Whether the learner may submit / reveal answers (enrolled) or only read. */
  canAnswer: boolean;
  /**
   * The learner's previously-saved answer for this block, if any — used to
   * restore the selection + verdict on mount. `null` for non-interactive
   * blocks, guests, or blocks the learner hasn't answered yet.
   */
  savedAnswer: SavedBlockAnswer | null;
};

/**
 * Read-only renderer for a single public lesson block in the learner reader.
 * Exhaustive over `PublicLessonBlock.type` — the `never`-typed default makes
 * a missing variant a build error rather than a silent blank. Non-interactive
 * blocks reuse the same primitives as the authoring read path; interactive
 * blocks delegate to the learner answer components.
 */
export function LessonBlockViewer({
  block,
  ctx,
}: {
  block: PublicLessonBlock;
  ctx: LessonBlockViewerContext;
}): ReactNode {
  switch (block.type) {
    case 'html':
      return (
        <div
          className={PROSE_HTML_CLASS}
          // Trusted authored HTML, sanitized server-side — same trust model
          // as the product description.
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case 'katex':
      return (
        <div className="flex justify-center overflow-x-auto py-3">
          <MathView tex={block.source} displayMode />
        </div>
      );

    case 'rutube_video':
      return <RutubeBlockView embedUrl={block.embedUrl} title={block.title} />;

    case 'code':
      return (
        <CodeBlock
          tabs={block.tabs.map((tab) => ({
            label: tab.label,
            code: tab.source,
            language: tab.language,
          }))}
        />
      );

    case 'file':
      return <FileBlockView block={block} />;

    case 'video_file':
      return <VideoFileBlockView block={block} />;

    case 'photo_collage':
      return <PhotoCollageView block={block} />;

    case 'function_graph':
      return <FunctionGraphView block={block} />;

    case 'single_choice':
      return (
        <LearnerSingleChoiceBlock
          block={block}
          noteId={ctx.noteId}
          canAnswer={ctx.canAnswer}
          savedAnswer={ctx.savedAnswer}
        />
      );

    case 'multi_choice':
      return (
        <LearnerMultiChoiceBlock
          block={block}
          noteId={ctx.noteId}
          canAnswer={ctx.canAnswer}
          savedAnswer={ctx.savedAnswer}
        />
      );

    case 'text_input':
      return (
        <LearnerTextInputBlock
          block={block}
          noteId={ctx.noteId}
          canAnswer={ctx.canAnswer}
          savedAnswer={ctx.savedAnswer}
        />
      );

    default: {
      const _exhaustive: never = block;
      return _exhaustive;
    }
  }
}

/**
 * Renders a photo-collage block as the shared horizontal `PhotoGallery`
 * strip. Items whose backing file was purged (`file === null`) are dropped;
 * if nothing survives, the block renders nothing. An optional title sits as
 * a small heading above the strip.
 */
/** Read-only function-graph block — renders the shared `FunctionGraph`. */
function FunctionGraphView({ block }: { block: FunctionGraphBlock }) {
  const t = useTranslations('product-reader.functionGraph');
  return (
    <FunctionGraph
      spec={block.config}
      interactive={block.config.interactive}
      labels={{
        invalidExpression: t('invalidExpression'),
        unavailable: t('unavailable'),
        resetView: t('resetView'),
        zoomIn: t('zoomIn'),
        zoomOut: t('zoomOut'),
      }}
    />
  );
}

function PhotoCollageView({ block }: { block: PhotoCollageBlock }) {
  const tGallery = useTranslations('product-reader.gallery');

  const photos: PhotoGalleryPhoto[] = block.items.flatMap((item) =>
    // Drop items whose backing file was purged; `flatMap` + the early
    // return narrows `item.file` to non-null without a `!` assertion.
    item.file === null
      ? []
      : [{ src: item.file.url, alt: item.caption ?? '', caption: item.caption ?? undefined }],
  );

  if (photos.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {block.title ? (
        <p className="text-sm font-medium text-foreground">{block.title}</p>
      ) : null}
      <PhotoGallery
        photos={photos}
        rounded="lg"
        lightbox
        unoptimized
        prevLabel={tGallery('prev')}
        nextLabel={tGallery('next')}
        ariaLabel={block.title ?? tGallery('aria')}
      />
    </div>
  );
}
