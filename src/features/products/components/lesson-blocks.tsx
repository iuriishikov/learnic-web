'use client';

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  CircleDotIcon,
  CodeIcon,
  FileIcon,
  ImagesIcon,
  ListChecksIcon,
  PlayIcon,
  PlusIcon,
  SigmaIcon,
  TextCursorInputIcon,
  TypeIcon,
  VideoIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  EditorBlockList,
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
  type LessonBlock,
} from '../model/draft';

import {
  MultiChoiceBlockEditor,
  SingleChoiceBlockEditor,
  TextInputBlockEditor,
} from './answer-block-editors';
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

export function LessonBlocks({
  blocks,
  noteId,
  lessonId,
  onUpdateHtml,
  onUpdateKatex,
  onUpdateCode,
  onUpdateSingleChoice,
  onUpdateMultiChoice,
  onUpdateTextInput,
  onAddBlock,
  onRemoveBlock,
  onReorder,
  canEditLessons = true,
  insufficientPermissionsTitle,
}: LessonBlocksProps) {
  // The three file-backed block types open a modal upload dialog rather
  // than resolving inline; keeping the open-dialog state here lets the
  // `AddBlockMenu` stay a thin presentational component.
  const [openDialog, setOpenDialog] = useState<FileBackedKind | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: canEditLessons
        ? { distance: 6 }
        : { distance: 999_999 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;
      const next = arrayMove(blocks, oldIndex, newIndex);
      onReorder(next.map((b) => b.id));
    },
    [blocks, onReorder],
  );

  const itemIds = blocks.map((b) => b.id);

  return (
    <div className="flex flex-col">
      <DndContext
        id="lesson-blocks-dnd"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <EditorBlockList>
            {blocks.map((block, idx) => (
              <SortableBlock
                key={block.id}
                block={block}
                isFirst={idx === 0}
                noteId={noteId}
                onUpdateHtml={(html) => onUpdateHtml(block.id, html)}
                onUpdateKatex={(source) => onUpdateKatex(block.id, source)}
                onUpdateCode={(nextTabs) => onUpdateCode(block.id, nextTabs)}
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
          </EditorBlockList>
        </SortableContext>
      </DndContext>

      <AddBlockMenu
        onSelect={onAddBlock}
        onSelectFileBacked={setOpenDialog}
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
  const flush = useDebouncedFlush(blockId, value, onChange, HTML_DEBOUNCE_MS);
  return (
    <div data-cursor-target={`block.${blockId}.body`}>
      <InlineRichEditor
        key={blockId}
        value={value}
        onChange={flush}
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
  const flush = useDebouncedFlush(blockId, value, onChange, KATEX_DEBOUNCE_MS);
  return (
    <div data-cursor-target={`block.${blockId}.source`}>
      <InlineLatexEditor
        key={blockId}
        value={value}
        onChange={flush}
        emptyText={emptyText}
      />
    </div>
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

function useDebouncedFlush(
  blockId: string,
  serverValue: string,
  onChange: (value: string) => void,
  delayMs: number,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<string | null>(null);
  const onChangeRef = useRef(onChange);
  const serverValueRef = useRef(serverValue);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    serverValueRef.current = serverValue;
  }, [serverValue]);

  // Flush pending writes whenever the active block changes (or on unmount):
  // a debounced edit on the previous block must reach the server before the
  // editor is reused for another id.
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const value = pendingRef.current;
      pendingRef.current = null;
      if (value !== null && value !== serverValueRef.current) {
        onChangeRef.current(value);
      }
    };
  }, [blockId]);

  return useCallback(
    (next: string) => {
      pendingRef.current = next;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const value = pendingRef.current;
        pendingRef.current = null;
        if (value !== null) onChangeRef.current(value);
      }, delayMs);
    },
    [delayMs],
  );
}

/* -------------------------------------------------------------------------- */
/* Rutube block — read-only display (no editor UI yet)                        */
/* -------------------------------------------------------------------------- */

function RutubeBlockView({
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

/* -------------------------------------------------------------------------- */
/* Add-block menu                                                             */
/* -------------------------------------------------------------------------- */

type AddBlockMenuProps = {
  onSelect: (type: CreatableBlockType) => void;
  onSelectFileBacked: (kind: FileBackedKind) => void;
  hasBlocks: boolean;
  disabled?: boolean;
  disabledTitle?: string;
};

function AddBlockMenu({
  onSelect,
  onSelectFileBacked,
  hasBlocks,
  disabled,
  disabledTitle,
}: AddBlockMenuProps) {
  const t = useTranslations('teach-products.editor');
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const items: ReadonlyArray<{
    key: string;
    icon: ReactNode;
    label: string;
    description: string;
    onSelect: () => void;
  }> = [
    {
      key: 'html',
      icon: <TypeIcon />,
      label: t('block.types.html'),
      description: t('block.types.htmlDescription'),
      onSelect: () => onSelect('html'),
    },
    {
      key: 'katex',
      icon: <SigmaIcon />,
      label: t('block.types.katex'),
      description: t('block.types.katexDescription'),
      onSelect: () => onSelect('katex'),
    },
    {
      key: 'code',
      icon: <CodeIcon />,
      label: t('block.types.code'),
      description: t('block.types.codeDescription'),
      onSelect: () => onSelect('code'),
    },
    {
      key: 'single_choice',
      icon: <CircleDotIcon />,
      label: t('block.types.singleChoice'),
      description: t('block.types.singleChoiceDescription'),
      onSelect: () => onSelect('single_choice'),
    },
    {
      key: 'multi_choice',
      icon: <ListChecksIcon />,
      label: t('block.types.multiChoice'),
      description: t('block.types.multiChoiceDescription'),
      onSelect: () => onSelect('multi_choice'),
    },
    {
      key: 'text_input',
      icon: <TextCursorInputIcon />,
      label: t('block.types.textInput'),
      description: t('block.types.textInputDescription'),
      onSelect: () => onSelect('text_input'),
    },
    {
      key: 'file',
      icon: <FileIcon />,
      label: t('block.types.file'),
      description: t('block.types.fileDescription'),
      onSelect: () => onSelectFileBacked('file'),
    },
    {
      key: 'video_file',
      icon: <VideoIcon />,
      label: t('block.types.videoFile'),
      description: t('block.types.videoFileDescription'),
      onSelect: () => onSelectFileBacked('video_file'),
    },
    {
      key: 'photo_collage',
      icon: <ImagesIcon />,
      label: t('block.types.photoCollage'),
      description: t('block.types.photoCollageDescription'),
      onSelect: () => onSelectFileBacked('photo_collage'),
    },
  ];

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        hasBlocks ? 'mt-8' : 'mt-2',
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
      />
      {isMobile ? (
        <BottomSheet open={open} onOpenChange={setOpen}>
          <BottomSheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              title={disabled ? disabledTitle : undefined}
              className="relative gap-1.5 bg-background hover:bg-muted dark:bg-background dark:hover:bg-muted"
            >
              <PlusIcon /> {t('actions.addBlock')}
            </Button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t('block.menuLabel')}
              </BottomSheetTitle>
            </BottomSheetHeader>
            <BottomSheetBody className="py-3">
              <div className="grid h-[420px] grid-cols-2 grid-rows-5 auto-rows-fr gap-2">
                {items.map((item) => (
                  <BlockTypeTileButton
                    key={item.key}
                    icon={item.icon}
                    label={item.label}
                    description={item.description}
                    onSelect={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                  />
                ))}
              </div>
            </BottomSheetBody>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                title={disabled ? disabledTitle : undefined}
                className="relative gap-1.5 bg-background hover:bg-muted dark:bg-background dark:hover:bg-muted"
              />
            }
          >
            <PlusIcon /> {t('actions.addBlock')}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            sideOffset={8}
            className="w-[560px] p-1.5"
          >
            <p className="px-2 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t('block.menuLabel')}
            </p>
            <div className="grid h-[400px] grid-cols-2 grid-rows-5 auto-rows-fr gap-1">
              {items.map((item) => (
                <BlockTypeMenuItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  description={item.description}
                  onSelect={item.onSelect}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

type BlockTypeTileProps = {
  icon: ReactNode;
  label: string;
  description: string;
  onSelect: () => void;
};

function BlockTypeTileInner({
  icon,
  label,
  description,
}: Omit<BlockTypeTileProps, 'onSelect'>) {
  return (
    <>
      <span
        aria-hidden
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04] text-foreground/80 ring-1 ring-foreground/10 transition-colors group-hover/item:bg-foreground/10 group-hover/item:text-foreground group-focus/item:bg-foreground/10 group-focus/item:text-foreground"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <span className="truncate text-sm font-medium leading-tight text-foreground">
          {label}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </>
  );
}

function BlockTypeMenuItem({
  icon,
  label,
  description,
  onSelect,
}: BlockTypeTileProps) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className="group/item flex h-full cursor-pointer items-start gap-3 rounded-md p-2"
    >
      <BlockTypeTileInner
        icon={icon}
        label={label}
        description={description}
      />
    </DropdownMenuItem>
  );
}

function BlockTypeTileButton({
  icon,
  label,
  description,
  onSelect,
}: BlockTypeTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group/item flex h-full w-full items-start gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BlockTypeTileInner
        icon={icon}
        label={label}
        description={description}
      />
    </button>
  );
}
