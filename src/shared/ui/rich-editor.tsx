'use client';

import { Color } from '@tiptap/extension-color';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { BackgroundColor } from '@tiptap/extension-text-style/background-color';
import { FontFamily } from '@tiptap/extension-text-style/font-family';
import { FontSize } from '@tiptap/extension-text-style/font-size';
import {
  EditorContent,
  type Editor,
  useEditor,
  useEditorState,
} from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  CheckIcon,
  CodeIcon,
  HighlighterIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  RedoIcon,
  SparklesIcon,
  StrikethroughIcon,
  TypeIcon,
  UnderlineIcon,
  UndoIcon,
  UnlinkIcon,
  XIcon,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Toggle } from '@/shared/ui/toggle';

export type RichEditorProps = {
  defaultValue?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
  editorClassName?: string;
  autoFocus?: boolean | 'start' | 'end' | 'all' | number;
  onReady?: (editor: Editor) => void;
  /**
   * Render the tiptap editor synchronously on first render. Defaults to false
   * so SSR-rendered consumers don't hit hydration mismatches; pass true from
   * client-only call sites (e.g. inside an interactive popover) to skip the
   * placeholder→editor swap that otherwise causes a visible height jump.
   */
  immediatelyRender?: boolean;
  /**
   * When set, renders a "X characters left" counter below the editor and stops
   * accepting input once the plain-text length reaches the limit.
   */
  maxLength?: number;
  /** When provided, renders an Image button that opens a URL prompt. */
  onImageInsert?: (payload: { src: string; alt?: string }) => void;
  /** When provided, renders a sparkles AI button that fires this callback. */
  onAiAction?: (editor: Editor) => void;
};

type FontOptionId = 'inter' | 'system' | 'serif' | 'mono';

type FontOption = {
  id: FontOptionId;
  /** Value stored in the editor as the inline `font-family`. */
  cssValue: string;
  /** Family used to render the option's preview in the dropdown trigger. */
  previewFamily: string;
};

const FONT_OPTIONS: readonly FontOption[] = [
  {
    id: 'inter',
    cssValue: 'var(--font-inter), Inter, ui-sans-serif, system-ui, sans-serif',
    previewFamily: 'var(--font-inter), Inter, sans-serif',
  },
  {
    id: 'system',
    cssValue:
      'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    previewFamily: 'system-ui, -apple-system, sans-serif',
  },
  {
    id: 'serif',
    cssValue: 'Georgia, "Times New Roman", serif',
    previewFamily: 'Georgia, serif',
  },
  {
    id: 'mono',
    cssValue: 'var(--font-geist-mono), ui-monospace, monospace',
    previewFamily: 'var(--font-geist-mono), monospace',
  },
] as const;

const DEFAULT_FONT_ID: FontOptionId = 'inter';

const FONT_SIZES = [
  '12px',
  '14px',
  '16px',
  '18px',
  '20px',
  '24px',
  '28px',
  '32px',
] as const;
const DEFAULT_FONT_SIZE = '16px';

type ColorSwatch = {
  id: string;
  value: string;
  /** Opaque tile? When false (light/white), we still render a thin ring. */
  needsRing?: boolean;
};

const COLOR_ROW_NEUTRAL: readonly ColorSwatch[] = [
  { id: 'black', value: '#000000' },
  { id: 'charcoal', value: '#2D2D2D' },
  { id: 'darkGray', value: '#515151' },
  { id: 'gray', value: '#6B6B6B' },
  { id: 'midGray', value: '#9A9A9A' },
  { id: 'lightGray', value: '#C9C9C9', needsRing: true },
  { id: 'paleGray', value: '#E5E5E5', needsRing: true },
  { id: 'white', value: '#FFFFFF', needsRing: true },
] as const;

const COLOR_ROW_ACCENT: readonly ColorSwatch[] = [
  { id: 'green', value: '#16A34A' },
  { id: 'blue', value: '#2563EB' },
  { id: 'indigo', value: '#4F46E5' },
  { id: 'purple', value: '#7C3AED' },
  { id: 'magenta', value: '#C026D3' },
  { id: 'pink', value: '#DB2777' },
  { id: 'red', value: '#DC2626' },
  { id: 'orange', value: '#EA580C' },
] as const;

const COLOR_ROW_HIGHLIGHT: readonly ColorSwatch[] = [
  { id: 'highlightYellow', value: '#FEF08A' },
  { id: 'highlightOrange', value: '#FED7AA' },
  { id: 'highlightRed', value: '#FECACA' },
  { id: 'highlightPink', value: '#FBCFE8' },
  { id: 'highlightPurple', value: '#DDD6FE' },
  { id: 'highlightBlue', value: '#BFDBFE' },
  { id: 'highlightGreen', value: '#BBF7D0' },
  { id: 'highlightGray', value: '#E5E7EB', needsRing: true },
] as const;

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return trimmed.startsWith('#')
    ? trimmed.toUpperCase()
    : `#${trimmed.toUpperCase()}`;
}

export function RichEditor({
  defaultValue,
  onChange,
  placeholder,
  editable = true,
  className,
  editorClassName,
  autoFocus = false,
  onReady,
  immediatelyRender = false,
  maxLength,
  onImageInsert,
  onAiAction,
}: RichEditorProps) {
  const t = useTranslations('rich-editor');

  const editor = useEditor({
    immediatelyRender,
    editable,
    autofocus: autoFocus,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
        },
        heading: { levels: [1, 2, 3] },
      }),
      TextStyle,
      Color,
      BackgroundColor,
      FontFamily,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? t('placeholder') }),
    ],
    content: defaultValue ?? '',
    editorProps: {
      attributes: {
        class: cn(
          'rich-editor-content min-h-[180px] w-full px-4 py-4 text-sm leading-relaxed text-foreground focus:outline-none',
          editorClassName,
        ),
      },
      handleKeyDown(view, event) {
        if (
          maxLength === undefined ||
          event.metaKey ||
          event.ctrlKey ||
          event.altKey
        )
          return false;
        const isContentKey =
          event.key.length === 1 || event.key === 'Enter';
        if (!isContentKey) return false;
        const { state } = view;
        const remaining =
          maxLength - state.doc.textContent.length + (state.selection.to - state.selection.from);
        if (remaining > 0) return false;
        event.preventDefault();
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (editor && onReady) onReady(editor);
  }, [editor, onReady]);

  if (!editor) {
    return (
      <div
        className={cn(
          'rounded-xl border border-input bg-background',
          className,
        )}
      >
        <div className="h-12 border-b border-border" />
        <div className="min-h-[180px] px-4 py-4" aria-hidden />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-input bg-background transition-shadow',
          editable &&
            'focus-within:border-ring/60 focus-within:ring-2 focus-within:ring-ring/40',
        )}
      >
        {editable ? (
          <>
            <Toolbar
              editor={editor}
              onImageInsert={onImageInsert}
              onAiAction={onAiAction}
            />
            <div className="border-t border-border" />
          </>
        ) : null}
        <EditorContent editor={editor} />
        {editable ? <FloatingBubbleMenu editor={editor} /> : null}
      </div>
      {maxLength !== undefined ? (
        <CharacterCounter editor={editor} maxLength={maxLength} />
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Top toolbar                                                                */
/* -------------------------------------------------------------------------- */

function Toolbar({
  editor,
  onImageInsert,
  onAiAction,
}: {
  editor: Editor;
  onImageInsert?: RichEditorProps['onImageInsert'];
  onAiAction?: RichEditorProps['onAiAction'];
}) {
  const t = useTranslations('rich-editor');

  return (
    <div className="flex flex-nowrap items-center gap-1 overflow-x-auto px-2 py-2 [&>*]:shrink-0">
      <FontFamilySelect editor={editor} />
      <FontSizeSelect editor={editor} />

      <ToolbarSeparator />

      <ToolbarGroup>
        <FormatToggle
          editor={editor}
          mark="bold"
          ariaLabel={t('actions.bold')}
          icon={<BoldIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="italic"
          ariaLabel={t('actions.italic')}
          icon={<ItalicIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="underline"
          ariaLabel={t('actions.underline')}
          icon={<UnderlineIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="strike"
          ariaLabel={t('actions.strike')}
          icon={<StrikethroughIcon />}
        />
        <FormatToggle
          editor={editor}
          mark="code"
          ariaLabel={t('actions.code')}
          icon={<CodeIcon />}
        />
      </ToolbarGroup>

      <ToolbarGroup>
        <ColorButton editor={editor} />
        <HighlightButton editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <AlignToggle
          editor={editor}
          align="left"
          ariaLabel={t('actions.alignLeft')}
          icon={<AlignLeftIcon />}
        />
        <AlignToggle
          editor={editor}
          align="center"
          ariaLabel={t('actions.alignCenter')}
          icon={<AlignCenterIcon />}
        />
        <AlignToggle
          editor={editor}
          align="right"
          ariaLabel={t('actions.alignRight')}
          icon={<AlignRightIcon />}
        />
        <AlignToggle
          editor={editor}
          align="justify"
          ariaLabel={t('actions.alignJustify')}
          icon={<AlignJustifyIcon />}
        />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <BulletListToggle editor={editor} />
        <OrderedListToggle editor={editor} />
        <BlockquoteToggle editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <LinkButton editor={editor} />
      {onImageInsert ? (
        <ImageButton onImageInsert={onImageInsert} />
      ) : null}

      <ToolbarSeparator />

      <ToolbarGroup>
        <HistoryButton
          editor={editor}
          direction="undo"
          ariaLabel={t('actions.undo')}
          icon={<UndoIcon />}
        />
        <HistoryButton
          editor={editor}
          direction="redo"
          ariaLabel={t('actions.redo')}
          icon={<RedoIcon />}
        />
      </ToolbarGroup>

      {onAiAction ? (
        <>
          <ToolbarSeparator />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.ai')}
            onClick={() => onAiAction(editor)}
          >
            <SparklesIcon />
          </Button>
        </>
      ) : null}
    </div>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarSeparator() {
  return (
    <span aria-hidden className="mx-1 h-5 w-px bg-border" />
  );
}

/* -------------------------------------------------------------------------- */
/* Font family / size selects                                                 */
/* -------------------------------------------------------------------------- */

function FontFamilySelect({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');

  const activeFont = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').fontFamily as string | undefined) ??
      null,
  });

  const activeId: FontOptionId = useMemo(() => {
    if (!activeFont) return DEFAULT_FONT_ID;
    const match = FONT_OPTIONS.find((option) =>
      activeFont.includes(option.cssValue.split(',')[0]?.trim() ?? ''),
    );
    return match?.id ?? DEFAULT_FONT_ID;
  }, [activeFont]);

  const onValueChange = useCallback(
    (id: string | null) => {
      const option = FONT_OPTIONS.find((opt) => opt.id === id);
      if (!option) return;
      editor.chain().focus().setFontFamily(option.cssValue).run();
    },
    [editor],
  );

  const previewFamily =
    FONT_OPTIONS.find((opt) => opt.id === activeId)?.previewFamily ??
    'inherit';

  return (
    <Select value={activeId} onValueChange={onValueChange}>
      <SelectTrigger
        size="default"
        aria-label={t('actions.fontFamily')}
        className="w-[140px] gap-1.5 rounded-lg pl-2.5 pr-2 text-sm data-[size=default]:h-9"
      >
        <TypeIcon className="size-4 text-muted-foreground" />
        <SelectValue className="flex-1">
          <span style={{ fontFamily: previewFamily }}>
            {t(`font.options.${activeId}`)}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="min-w-[180px] p-1"
      >
        {FONT_OPTIONS.map((option) => (
          <SelectItem
            key={option.id}
            value={option.id}
            className="h-9 gap-2 px-2 text-sm"
          >
            <span style={{ fontFamily: option.previewFamily }}>
              {t(`font.options.${option.id}`)}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FontSizeSelect({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');

  const activeSize = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').fontSize as string | undefined) ??
      null,
  });

  const activeValue = activeSize ?? DEFAULT_FONT_SIZE;

  const onValueChange = useCallback(
    (value: string | null) => {
      if (!value) return;
      editor.chain().focus().setFontSize(value).run();
    },
    [editor],
  );

  return (
    <Select value={activeValue} onValueChange={onValueChange}>
      <SelectTrigger
        size="default"
        aria-label={t('actions.fontSize')}
        className="w-[88px] gap-1.5 rounded-lg pl-2.5 pr-2 text-sm data-[size=default]:h-9"
      >
        <SelectValue className="flex-1" />
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="min-w-[110px] p-1"
      >
        {FONT_SIZES.map((size) => (
          <SelectItem key={size} value={size} className="h-9 gap-2 px-2 text-sm">
            {size}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* -------------------------------------------------------------------------- */
/* List & quote toggles                                                       */
/* -------------------------------------------------------------------------- */

function BulletListToggle({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('bulletList'),
  });
  return (
    <Toggle
      size="sm"
      aria-label={t('actions.bulletList')}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
    >
      <ListIcon />
    </Toggle>
  );
}

function OrderedListToggle({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('orderedList'),
  });
  return (
    <Toggle
      size="sm"
      aria-label={t('actions.orderedList')}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
    >
      <ListOrderedIcon />
    </Toggle>
  );
}

function BlockquoteToggle({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('blockquote'),
  });
  return (
    <Toggle
      size="sm"
      aria-label={t('actions.blockquote')}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
    >
      <QuoteIcon />
    </Toggle>
  );
}

/* -------------------------------------------------------------------------- */
/* Undo / Redo                                                                */
/* -------------------------------------------------------------------------- */

function HistoryButton({
  editor,
  direction,
  ariaLabel,
  icon,
}: {
  editor: Editor;
  direction: 'undo' | 'redo';
  ariaLabel: string;
  icon: ReactNode;
}) {
  const canRun = useEditorState({
    editor,
    selector: ({ editor }) =>
      direction === 'undo' ? editor.can().undo() : editor.can().redo(),
  });
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={ariaLabel}
      disabled={!canRun}
      onClick={() => {
        const chain = editor.chain().focus();
        if (direction === 'undo') chain.undo().run();
        else chain.redo().run();
      }}
    >
      {icon}
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/* Format toggles                                                             */
/* -------------------------------------------------------------------------- */

type Mark = 'bold' | 'italic' | 'underline' | 'strike' | 'code';

const INVERSE_TOGGLE_CLASS =
  'text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground data-[state=on]:bg-editor-overlay-foreground/20 data-[state=on]:text-editor-overlay-foreground aria-pressed:bg-editor-overlay-foreground/20 aria-pressed:text-editor-overlay-foreground';

function FormatToggle({
  editor,
  mark,
  ariaLabel,
  icon,
  variant = 'default',
}: {
  editor: Editor;
  mark: Mark;
  ariaLabel: string;
  icon: ReactNode;
  variant?: 'default' | 'inverse';
}) {
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive(mark),
  });

  return (
    <Toggle
      size="sm"
      aria-label={ariaLabel}
      pressed={isActive}
      onPressedChange={() => {
        const chain = editor.chain().focus();
        if (mark === 'bold') chain.toggleBold().run();
        else if (mark === 'italic') chain.toggleItalic().run();
        else if (mark === 'underline') chain.toggleUnderline().run();
        else if (mark === 'strike') chain.toggleStrike().run();
        else chain.toggleCode().run();
      }}
      className={variant === 'inverse' ? INVERSE_TOGGLE_CLASS : undefined}
    >
      {icon}
    </Toggle>
  );
}

function AlignToggle({
  editor,
  align,
  ariaLabel,
  icon,
  variant = 'default',
}: {
  editor: Editor;
  align: 'left' | 'center' | 'right' | 'justify';
  ariaLabel: string;
  icon: ReactNode;
  variant?: 'default' | 'inverse';
}) {
  const isActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive({ textAlign: align }),
  });

  return (
    <Toggle
      size="sm"
      aria-label={ariaLabel}
      pressed={isActive}
      onPressedChange={() => editor.chain().focus().setTextAlign(align).run()}
      className={variant === 'inverse' ? INVERSE_TOGGLE_CLASS : undefined}
    >
      {icon}
    </Toggle>
  );
}

/* -------------------------------------------------------------------------- */
/* Color picker                                                               */
/* -------------------------------------------------------------------------- */

function ColorButton({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const activeColor = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').color as string | undefined) ?? null,
  });
  const swatchColor = activeColor ?? '#111111';

  const apply = useCallback(
    (color: string | null) => {
      const chain = editor.chain().focus();
      if (color === null) {
        chain.unsetColor().run();
      } else {
        chain.setColor(color).run();
      }
    },
    [editor],
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.color')}
          />
        }
      >
        <span
          aria-hidden
          className="block size-4 rounded-full ring-1 ring-foreground/15"
          style={{ backgroundColor: swatchColor }}
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto gap-2 p-3"
        align="start"
        sideOffset={6}
        data-rich-editor-portal=""
      >
        <ColorRow
          colors={COLOR_ROW_NEUTRAL}
          activeColor={activeColor}
          onPick={apply}
        />
        <ColorRow
          colors={COLOR_ROW_ACCENT}
          activeColor={activeColor}
          onPick={apply}
        />
        <CustomColorRow activeColor={activeColor} onPick={apply} />
      </PopoverContent>
    </Popover>
  );
}

function HighlightButton({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const activeColor = useEditorState({
    editor,
    selector: ({ editor }) =>
      (editor.getAttributes('textStyle').backgroundColor as
        | string
        | undefined) ?? null,
  });

  const apply = useCallback(
    (color: string | null) => {
      const chain = editor.chain().focus();
      if (color === null) {
        chain.unsetBackgroundColor().run();
      } else {
        chain.setBackgroundColor(color).run();
      }
    },
    [editor],
  );

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.highlight')}
          />
        }
      >
        <span className="relative inline-flex">
          <HighlighterIcon className="size-4" />
          <span
            aria-hidden
            className="absolute -bottom-0.5 left-1/2 h-1 w-3.5 -translate-x-1/2 rounded-full"
            style={{
              backgroundColor: activeColor ?? 'var(--brand)',
            }}
          />
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto gap-2 p-3"
        align="start"
        sideOffset={6}
        data-rich-editor-portal=""
      >
        <ColorRow
          colors={COLOR_ROW_HIGHLIGHT}
          activeColor={activeColor}
          onPick={apply}
        />
        <button
          type="button"
          onClick={() => apply(null)}
          className="rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
        >
          {t('highlight.clear')}
        </button>
      </PopoverContent>
    </Popover>
  );
}

function ColorRow({
  colors,
  activeColor,
  onPick,
}: {
  colors: readonly ColorSwatch[];
  activeColor: string | null;
  onPick: (value: string | null) => void;
}) {
  const t = useTranslations('rich-editor');
  return (
    <div className="flex items-center gap-1">
      {colors.map((color) => {
        const normalized = color.value.toUpperCase();
        const isActive =
          activeColor !== null && activeColor.toUpperCase() === normalized;
        return (
          <button
            key={color.id}
            type="button"
            aria-label={t(`color.options.${color.id}`)}
            aria-pressed={isActive}
            onClick={() => onPick(color.value)}
            className={cn(
              'group/swatch relative inline-flex size-7 items-center justify-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'block size-5 rounded-full transition-transform',
                color.needsRing && 'ring-1 ring-foreground/15',
                isActive
                  ? 'ring-2 ring-brand'
                  : 'group-hover/swatch:scale-110 group-active/swatch:scale-95',
              )}
              style={{ backgroundColor: color.value }}
            />
          </button>
        );
      })}
    </div>
  );
}

function CustomColorRow({
  activeColor,
  onPick,
}: {
  activeColor: string | null;
  onPick: (value: string | null) => void;
}) {
  const t = useTranslations('rich-editor');
  const [draft, setDraft] = useState<string>(() =>
    activeColor ? activeColor.replace(/^#/, '').toUpperCase() : '7F56D9',
  );

  const previewColor = normalizeHex(draft) ?? activeColor ?? '#7F56D9';

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = normalizeHex(draft);
    if (next) onPick(next);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mt-1 flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/40 px-2 py-1.5"
    >
      <span className="px-1 text-xs font-medium text-muted-foreground">
        {t('color.custom')}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="size-5 rounded-full ring-1 ring-foreground/15"
          style={{ backgroundColor: previewColor }}
        />
        <Input
          type="text"
          value={draft}
          onChange={(event) =>
            setDraft(event.target.value.replace(/^#/, '').slice(0, 6))
          }
          onBlur={() => {
            const next = normalizeHex(draft);
            if (next) onPick(next);
          }}
          aria-label={t('color.customLabel')}
          placeholder={t('color.customPlaceholder')}
          maxLength={7}
          className="h-7 w-[80px] border-transparent bg-background px-2 font-mono text-[11px] uppercase tracking-wider"
        />
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Image button                                                               */
/* -------------------------------------------------------------------------- */

function ImageButton({
  onImageInsert,
}: {
  onImageInsert: NonNullable<RichEditorProps['onImageInsert']>;
}) {
  const t = useTranslations('rich-editor');
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = src.trim();
    if (!trimmed) return;
    onImageInsert({ src: trimmed, alt: alt.trim() || undefined });
    setSrc('');
    setAlt('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('actions.image')}
          />
        }
      >
        <ImageIcon />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t('image.urlLabel')}
          </label>
          <Input
            type="url"
            autoFocus
            value={src}
            onChange={(event) => setSrc(event.target.value)}
            placeholder={t('image.urlPlaceholder')}
            className="h-9 text-sm"
          />
          <label className="text-xs font-medium text-muted-foreground">
            {t('image.altLabel')}
          </label>
          <Input
            type="text"
            value={alt}
            onChange={(event) => setAlt(event.target.value)}
            className="h-9 text-sm"
          />
          <div className="flex items-center justify-end">
            <Button type="submit" size="sm" disabled={!src.trim()}>
              <CheckIcon /> {t('image.apply')}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Link button (toolbar)                                                      */
/* -------------------------------------------------------------------------- */

function LinkButton({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');

  const { isLinkActive, hasSelection } = useEditorState({
    editor,
    selector: ({ editor }) => ({
      isLinkActive: editor.isActive('link'),
      hasSelection:
        !editor.state.selection.empty || editor.isActive('link'),
    }),
  });

  const onOpenChange = (next: boolean) => {
    if (next) {
      const current = (editor.getAttributes('link').href as string) ?? '';
      setDraft(current);
    }
    setOpen(next);
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const href = draft.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    setOpen(false);
  };

  const onRemove = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Toggle
            size="sm"
            aria-label={t('actions.link')}
            pressed={isLinkActive}
            disabled={!hasSelection && !isLinkActive}
            onPressedChange={() => onOpenChange(!open)}
          />
        }
      >
        <LinkIcon />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <form onSubmit={onSubmit} className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            {t('link.urlLabel')}
          </label>
          <Input
            type="url"
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('link.urlPlaceholder')}
            className="h-9 text-sm"
          />
          <div className="flex items-center justify-between gap-2">
            {isLinkActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <UnlinkIcon /> {t('link.remove')}
              </Button>
            ) : (
              <span aria-hidden />
            )}
            <Button type="submit" size="sm">
              <CheckIcon /> {t('link.apply')}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------------------------------------------------------------- */
/* Character counter                                                          */
/* -------------------------------------------------------------------------- */

function CharacterCounter({
  editor,
  maxLength,
}: {
  editor: Editor;
  maxLength: number;
}) {
  const t = useTranslations('rich-editor');
  const length = useEditorState({
    editor,
    selector: ({ editor }) => editor.state.doc.textContent.length,
  });
  const remaining = Math.max(0, maxLength - length);

  return (
    <p
      className={cn(
        'pl-1 text-xs leading-none text-muted-foreground',
        remaining === 0 && 'text-destructive',
      )}
      aria-live="polite"
    >
      {t('characters.left', { count: remaining })}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Bubble menu                                                                */
/* -------------------------------------------------------------------------- */

function FloatingBubbleMenu({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');
  const [linkMode, setLinkMode] = useState(false);
  const [draft, setDraft] = useState('');

  const isLinkActive = useEditorState({
    editor,
    selector: ({ editor }) => editor.isActive('link'),
  });

  const enterLinkMode = useCallback(() => {
    const current = (editor.getAttributes('link').href as string) ?? '';
    setDraft(current);
    setLinkMode(true);
  }, [editor]);

  const exitLinkMode = useCallback(() => {
    setLinkMode(false);
    setDraft('');
  }, []);

  const submitLink = useCallback(() => {
    const href = draft.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    exitLinkMode();
  }, [editor, draft, exitLinkMode]);

  const removeLink = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    exitLinkMode();
  }, [editor, exitLinkMode]);

  const onLinkKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitLink();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      exitLinkMode();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
        offset: 8,
        onHide: () => setLinkMode(false),
      }}
      shouldShow={({ editor: e, state }) => {
        if (!e.isEditable) return false;
        const { selection } = state;
        if (selection.empty) return false;
        if (e.isActive('codeBlock')) return false;
        return true;
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {linkMode ? (
          <motion.div
            key="link"
            data-rich-editor-portal=""
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-1 rounded-lg bg-editor-overlay p-1 text-editor-overlay-foreground shadow-lg ring-1 ring-editor-overlay/30"
          >
            <Input
              type="url"
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onLinkKeyDown}
              placeholder={t('link.urlPlaceholder')}
              aria-label={t('link.urlLabel')}
              className="h-7 w-56 border-transparent bg-editor-overlay-foreground/10 text-xs text-editor-overlay-foreground placeholder:text-editor-overlay-foreground/50 focus-visible:border-editor-overlay-foreground/30 focus-visible:ring-editor-overlay-foreground/20"
            />
            {isLinkActive ? (
              <button
                type="button"
                onClick={removeLink}
                aria-label={t('link.remove')}
                className="inline-flex size-7 items-center justify-center rounded-md text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground"
              >
                <UnlinkIcon className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={submitLink}
              aria-label={t('link.apply')}
              className="inline-flex size-7 items-center justify-center rounded-md text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground"
            >
              <CheckIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={exitLinkMode}
              aria-label={t('link.cancel')}
              className="inline-flex size-7 items-center justify-center rounded-md text-editor-overlay-foreground/85 hover:bg-editor-overlay-foreground/15 hover:text-editor-overlay-foreground"
            >
              <XIcon className="size-3.5" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="format"
            data-rich-editor-portal=""
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-0.5 rounded-lg bg-editor-overlay p-1 text-editor-overlay-foreground shadow-lg ring-1 ring-editor-overlay/30"
          >
            <FormatToggle
              editor={editor}
              mark="bold"
              ariaLabel={t('actions.bold')}
              icon={<BoldIcon />}
              variant="inverse"
            />
            <FormatToggle
              editor={editor}
              mark="italic"
              ariaLabel={t('actions.italic')}
              icon={<ItalicIcon />}
              variant="inverse"
            />
            <FormatToggle
              editor={editor}
              mark="underline"
              ariaLabel={t('actions.underline')}
              icon={<UnderlineIcon />}
              variant="inverse"
            />
            <span
              aria-hidden
              className="mx-0.5 h-4 w-px bg-editor-overlay-foreground/20"
            />
            <AlignToggle
              editor={editor}
              align="left"
              ariaLabel={t('actions.alignLeft')}
              icon={<AlignLeftIcon />}
              variant="inverse"
            />
            <AlignToggle
              editor={editor}
              align="center"
              ariaLabel={t('actions.alignCenter')}
              icon={<AlignCenterIcon />}
              variant="inverse"
            />
            <span
              aria-hidden
              className="mx-0.5 h-4 w-px bg-editor-overlay-foreground/20"
            />
            <Toggle
              size="sm"
              aria-label={t('actions.link')}
              pressed={isLinkActive}
              onPressedChange={enterLinkMode}
              className={INVERSE_TOGGLE_CLASS}
            >
              <LinkIcon />
            </Toggle>
          </motion.div>
        )}
      </AnimatePresence>
    </BubbleMenu>
  );
}
