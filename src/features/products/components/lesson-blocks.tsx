'use client';

import {
  CircleDotIcon,
  CodeIcon,
  FileIcon,
  ImagesIcon,
  LineChartIcon,
  ListChecksIcon,
  PlayIcon,
  SigmaIcon,
  TextCursorInputIcon,
  TypeIcon,
  VideoIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { useDebouncedFlush } from '@/shared/hooks/use-debounced-flush';
import {
  EditorAddBlockMenu,
  type EditorAddBlockEntry,
} from '@/shared/ui/editor-add-block-menu';
import {
  EditorBlockDnd,
  EditorBlockShell,
} from '@/shared/ui/editor-block-shell';
import {
  InlineCodeEditor,
  type InlineCodeTab,
} from '@/shared/ui/inline-code-editor';
import { InlineLatexEditor } from '@/shared/ui/inline-latex-editor';
import { InlineRichEditor } from '@/shared/ui/inline-rich-editor';

import type { ChoiceOptionDraftInput } from '../api/blocks';
import {
  CODE_BLOCK_MAX_TABS,
  type CodeTab,
  type FunctionGraphConfig,
  type LessonBlock,
} from '../model/draft';

import {
  MultiChoiceBlockEditor,
  SingleChoiceBlockEditor,
  TextInputBlockEditor,
} from './answer-block-editors';
import { FunctionGraphBlockEditor } from './function-graph-block-editor';
import {
  AddFileBlockDialog,
  AddPhotoCollageBlockDialog,
  AddVideoFileBlockDialog,
  FileBlockView,
  VideoFileBlockView,
} from './file-block-dialogs';
import { PhotoCollageBlockEditor } from './photo-collage-block-editor';

export type CreatableBlockType =
  | 'html'
  | 'katex'
  | 'code'
  | 'function_graph'
  | 'single_choice'
  | 'multi_choice'
  | 'text_input';

export type TextInputBlockUpdate = {
  acceptedAnswers: string[];
  caseSensitive: boolean;
  trimWhitespace: boolean;
};

export type LessonBlocksProps = {
  blocks: LessonBlock[];
  /** Owning note id — needed by file-backed block dialogs for multipart upload. */
  noteId: string;
  /** Owning lesson id — needed by file-backed block dialogs for multipart upload. */
  lessonId: string;
  onUpdateHtml: (blockId: string, html: string) => void;
  onUpdateKatex: (blockId: string, source: string) => void;
  onUpdateCode: (blockId: string, tabs: CodeTab[]) => void;
  onUpdateFunctionGraph: (
    blockId: string,
    config: FunctionGraphConfig,
  ) => void;
  onUpdateSingleChoice: (
    blockId: string,
    options: ChoiceOptionDraftInput[],
  ) => void;
  onUpdateMultiChoice: (
    blockId: string,
    options: ChoiceOptionDraftInput[],
  ) => void;
  onUpdateTextInput: (blockId: string, args: TextInputBlockUpdate) => void;
  onAddBlock: (type: CreatableBlockType) => void;
  onRemoveBlock: (blockId: string) => void;
  onReorder: (orderedIds: string[]) => void;
  /** When false, all block-level mutations (add/edit/delete/reorder) are disabled. */
  canEditLessons?: boolean;
  /** Tooltip text shown on disabled controls when gated by permission. */
  insufficientPermissionsTitle?: string;
};

// Discriminator for the three file-backed block types, which open a
// dialog instead of resolving inline via `onAddBlock`. Kept separate
// from `CreatableBlockType` so existing consumers (`onAddBlock`) don't
// need to learn about types they can't construct without an upload.
type FileBackedKind = 'file' | 'video_file' | 'photo_collage';

const HTML_DEBOUNCE_MS = 600;
const KATEX_DEBOUNCE_MS = 600;
const FUNCTION_GRAPH_DEBOUNCE_MS = 600;

export function LessonBlocks({
  blocks,
  noteId,
  lessonId,
  onUpdateHtml,
  onUpdateKatex,
  onUpdateCode,
  onUpdateFunctionGraph,
  onUpdateSingleChoice,
  onUpdateMultiChoice,
  onUpdateTextInput,
  onAddBlock,
  onRemoveBlock,
  onReorder,
  canEditLessons = true,
  insufficientPermissionsTitle,
}: LessonBlocksProps) {
  const t = useTranslations('teach-products.editor');
  // The three file-backed block types open a modal upload dialog rather
  // than resolving inline; keeping the open-dialog state here lets the
  // `EditorAddBlockMenu` stay a thin presentational component.
  const [openDialog, setOpenDialog] = useState<FileBackedKind | null>(null);

  const itemIds = blocks.map((b) => b.id);

  const addBlockEntries: EditorAddBlockEntry[] = [
    {
      key: 'html',
      icon: <TypeIcon />,
      label: t('block.types.html'),
      description: t('block.types.htmlDescription'),
      onSelect: () => onAddBlock('html'),
    },
    {
      key: 'katex',
      icon: <SigmaIcon />,
      label: t('block.types.katex'),
      description: t('block.types.katexDescription'),
      onSelect: () => onAddBlock('katex'),
    },
    {
      key: 'code',
      icon: <CodeIcon />,
      label: t('block.types.code'),
      description: t('block.types.codeDescription'),
      onSelect: () => onAddBlock('code'),
    },
    {
      key: 'function_graph',
      icon: <LineChartIcon />,
      label: t('block.types.functionGraph'),
      description: t('block.types.functionGraphDescription'),
      onSelect: () => onAddBlock('function_graph'),
    },
    {
      key: 'single_choice',
      icon: <CircleDotIcon />,
      label: t('block.types.singleChoice'),
      description: t('block.types.singleChoiceDescription'),
      onSelect: () => onAddBlock('single_choice'),
    },
    {
      key: 'multi_choice',
      icon: <ListChecksIcon />,
      label: t('block.types.multiChoice'),
      description: t('block.types.multiChoiceDescription'),
      onSelect: () => onAddBlock('multi_choice'),
    },
    {
      key: 'text_input',
      icon: <TextCursorInputIcon />,
      label: t('block.types.textInput'),
      description: t('block.types.textInputDescription'),
      onSelect: () => onAddBlock('text_input'),
    },
    {
      key: 'file',
      icon: <FileIcon />,
      label: t('block.types.file'),
      description: t('block.types.fileDescription'),
      onSelect: () => setOpenDialog('file'),
    },
    {
      key: 'video_file',
      icon: <VideoIcon />,
      label: t('block.types.videoFile'),
      description: t('block.types.videoFileDescription'),
      onSelect: () => setOpenDialog('video_file'),
    },
    {
      key: 'photo_collage',
      icon: <ImagesIcon />,
      label: t('block.types.photoCollage'),
      description: t('block.types.photoCollageDescription'),
      onSelect: () => setOpenDialog('photo_collage'),
    },
  ];

  return (
    <div className="flex flex-col">
      <EditorBlockDnd
        id="lesson-blocks-dnd"
        itemIds={itemIds}
        onReorder={onReorder}
        canEdit={canEditLessons}
      >
        {blocks.map((block, idx) => (
          <SortableBlock
            key={block.id}
            block={block}
            isFirst={idx === 0}
            noteId={noteId}
            onUpdateHtml={(html) => onUpdateHtml(block.id, html)}
            onUpdateKatex={(source) => onUpdateKatex(block.id, source)}
            onUpdateCode={(nextTabs) => onUpdateCode(block.id, nextTabs)}
            onUpdateFunctionGraph={(config) =>
              onUpdateFunctionGraph(block.id, config)
            }
            onUpdateSingleChoice={(opts) =>
              onUpdateSingleChoice(block.id, opts)
            }
            onUpdateMultiChoice={(opts) =>
              onUpdateMultiChoice(block.id, opts)
            }
            onUpdateTextInput={(args) => onUpdateTextInput(block.id, args)}
            onRemove={() => onRemoveBlock(block.id)}
            canEditLessons={canEditLessons}
            insufficientPermissionsTitle={insufficientPermissionsTitle}
          />
        ))}
      </EditorBlockDnd>

      <EditorAddBlockMenu
        entries={addBlockEntries}
        triggerLabel={t('actions.addBlock')}
        menuLabel={t('block.menuLabel')}
        hasBlocks={blocks.length > 0}
        disabled={!canEditLessons}
        disabledTitle={insufficientPermissionsTitle}
      />

      <AddFileBlockDialog
        open={openDialog === 'file'}
        onOpenChange={(o) => setOpenDialog(o ? 'file' : null)}
        noteId={noteId}
        lessonId={lessonId}
      />
      <AddVideoFileBlockDialog
        open={openDialog === 'video_file'}
        onOpenChange={(o) => setOpenDialog(o ? 'video_file' : null)}
        noteId={noteId}
        lessonId={lessonId}
      />
      <AddPhotoCollageBlockDialog
        open={openDialog === 'photo_collage'}
        onOpenChange={(o) => setOpenDialog(o ? 'photo_collage' : null)}
        noteId={noteId}
        lessonId={lessonId}
      />
    </div>
  );
}

type SortableBlockProps = {
  block: LessonBlock;
  isFirst: boolean;
  noteId: string;
  onUpdateHtml: (html: string) => void;
  onUpdateKatex: (source: string) => void;
  onUpdateCode: (tabs: CodeTab[]) => void;
  onUpdateFunctionGraph: (config: FunctionGraphConfig) => void;
  onUpdateSingleChoice: (options: ChoiceOptionDraftInput[]) => void;
  onUpdateMultiChoice: (options: ChoiceOptionDraftInput[]) => void;
  onUpdateTextInput: (args: TextInputBlockUpdate) => void;
  onRemove: () => void;
  canEditLessons: boolean;
  insufficientPermissionsTitle?: string;
};

function SortableBlock({
  block,
  isFirst,
  noteId,
  onUpdateHtml,
  onUpdateKatex,
  onUpdateCode,
  onUpdateFunctionGraph,
  onUpdateSingleChoice,
  onUpdateMultiChoice,
  onUpdateTextInput,
  onRemove,
  canEditLessons,
  insufficientPermissionsTitle,
}: SortableBlockProps) {
  const t = useTranslations('teach-products.editor');

  return (
    <EditorBlockShell
      id={block.id}
      isFirst={isFirst}
      onRemove={onRemove}
      canEdit={canEditLessons}
      disabledTitle={insufficientPermissionsTitle}
      dragLabel={t('block.drag')}
      deleteLabel={t('block.delete')}
    >
      {block.type === 'html' ? (
        <DebouncedHtmlEditor
          blockId={block.id}
          value={block.html}
          onChange={onUpdateHtml}
          placeholder={t('contentEditor.placeholder')}
          emptyText={t('contentEditor.empty')}
        />
      ) : block.type === 'katex' ? (
        <DebouncedKatexEditor
          blockId={block.id}
          value={block.source}
          onChange={onUpdateKatex}
          emptyText={t('formula.empty')}
        />
      ) : block.type === 'code' ? (
        <CodeBlockEditor
          blockId={block.id}
          tabs={block.tabs}
          onChange={onUpdateCode}
          emptyText={t('code.empty')}
        />
      ) : block.type === 'single_choice' ? (
        <SingleChoiceBlockEditor
          blockId={block.id}
          options={block.options}
          correctOptionId={block.correctOptionId}
          onChange={onUpdateSingleChoice}
        />
      ) : block.type === 'multi_choice' ? (
        <MultiChoiceBlockEditor
          blockId={block.id}
          options={block.options}
          correctOptionIds={block.correctOptionIds}
          onChange={onUpdateMultiChoice}
        />
      ) : block.type === 'text_input' ? (
        <TextInputBlockEditor
          blockId={block.id}
          acceptedAnswers={block.acceptedAnswers}
          caseSensitive={block.caseSensitive}
          trimWhitespace={block.trimWhitespace}
          onChange={onUpdateTextInput}
        />
      ) : block.type === 'file' ? (
        <FileBlockView block={block} />
      ) : block.type === 'video_file' ? (
        <VideoFileBlockView block={block} />
      ) : block.type === 'photo_collage' ? (
        <PhotoCollageBlockEditor
          block={block}
          noteId={noteId}
          canEditLessons={canEditLessons}
          insufficientPermissionsTitle={insufficientPermissionsTitle}
        />
      ) : block.type === 'function_graph' ? (
        <DebouncedFunctionGraphEditor
          blockId={block.id}
          value={block.config}
          onChange={onUpdateFunctionGraph}
          canEdit={canEditLessons}
        />
      ) : (
        <RutubeBlockView
          embedUrl={block.embedUrl}
          title={block.title}
        />
      )}
    </EditorBlockShell>
  );
}

/* -------------------------------------------------------------------------- */
/* Debounced editors                                                          */
/* -------------------------------------------------------------------------- */

type DebouncedEditorProps = {
  blockId: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * Wrap inline editors in a debounce so high-frequency keystrokes don't flood
 * the API. We send the latest value at most every `HTML_DEBOUNCE_MS` ms; on
 * unmount or when the block id changes we flush pending writes.
 */
function DebouncedHtmlEditor({
  blockId,
  value,
  onChange,
  placeholder,
  emptyText,
}: DebouncedEditorProps & { placeholder: string; emptyText: string }) {
  const { schedule } = useDebouncedFlush({
    key: blockId,
    serverValue: value,
    onChange,
    delayMs: HTML_DEBOUNCE_MS,
  });
  return (
    <div data-cursor-target={`block.${blockId}.body`}>
      <InlineRichEditor
        key={blockId}
        value={value}
        onChange={schedule}
        placeholder={placeholder}
        emptyText={emptyText}
      />
    </div>
  );
}

function DebouncedKatexEditor({
  blockId,
  value,
  onChange,
  emptyText,
}: DebouncedEditorProps & { emptyText: string }) {
  const { schedule } = useDebouncedFlush({
    key: blockId,
    serverValue: value,
    onChange,
    delayMs: KATEX_DEBOUNCE_MS,
  });
  return (
    <div data-cursor-target={`block.${blockId}.source`}>
      <InlineLatexEditor
        key={blockId}
        value={value}
        onChange={schedule}
        emptyText={emptyText}
      />
    </div>
  );
}

function DebouncedFunctionGraphEditor({
  blockId,
  value,
  onChange,
  canEdit,
}: {
  blockId: string;
  value: FunctionGraphConfig;
  onChange: (config: FunctionGraphConfig) => void;
  canEdit: boolean;
}) {
  const { schedule } = useDebouncedFlush<FunctionGraphConfig>({
    key: blockId,
    serverValue: value,
    onChange,
    delayMs: FUNCTION_GRAPH_DEBOUNCE_MS,
  });
  return (
    <FunctionGraphBlockEditor
      key={blockId}
      blockId={blockId}
      config={value}
      onChange={schedule}
      canEdit={canEdit}
    />
  );
}

type CodeBlockEditorProps = {
  blockId: string;
  tabs: CodeTab[];
  onChange: (tabs: CodeTab[]) => void;
  emptyText: string;
};

/**
 * Thin wrapper around `InlineCodeEditor`. The editor itself manages its
 * own per-keystroke buffering (see ``CodeEditor.SOURCE_FLUSH_MS``), so
 * here we just forward changes — no extra debounce layer is needed and
 * stacking one would only delay structural commits like language picks.
 */
function CodeBlockEditor({
  blockId,
  tabs,
  onChange,
  emptyText,
}: CodeBlockEditorProps) {
  const handleTabsChange = useCallback(
    (next: InlineCodeTab[]) => onChange(next as CodeTab[]),
    [onChange],
  );
  return (
    <div data-cursor-target={`block.${blockId}.code`}>
      <InlineCodeEditor
        key={blockId}
        tabs={tabs as InlineCodeTab[]}
        maxTabs={CODE_BLOCK_MAX_TABS}
        onTabsChange={handleTabsChange}
        emptyText={emptyText}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Rutube block — read-only display (no editor UI yet)                        */
/* -------------------------------------------------------------------------- */

/**
 * Read-only Rutube embed. Exported so the learner reader's
 * `LessonBlockViewer` can reuse the exact same chrome for `rutube_video`
 * blocks instead of rebuilding the iframe + title bar.
 */
export function RutubeBlockView({
  embedUrl,
  title,
}: {
  embedUrl: string;
  title: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <div className="aspect-video w-full">
        <iframe
          src={embedUrl}
          title={title ?? 'Rutube'}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
      {title ? (
        <div className="flex items-center gap-2 border-t border-border px-3 py-2 text-sm text-foreground">
          <PlayIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{title}</span>
        </div>
      ) : null}
    </div>
  );
}
