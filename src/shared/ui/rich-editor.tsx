'use client';

import { Color } from '@tiptap/extension-color';
import { Placeholder } from '@tiptap/extension-placeholder';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
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
  AlignLeftIcon,
  BoldIcon,
  CheckIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  PaletteIcon,
  UnderlineIcon,
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
import { Separator } from '@/shared/ui/separator';
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
};

const TEXT_COLORS = [
  { id: 'default', value: null },
  { id: 'muted', value: 'var(--muted-foreground)' },
  { id: 'brand', value: 'var(--brand)' },
  { id: 'red', value: 'oklch(0.62 0.22 25)' },
  { id: 'orange', value: 'oklch(0.74 0.18 60)' },
  { id: 'green', value: 'oklch(0.66 0.18 145)' },
  { id: 'blue', value: 'oklch(0.62 0.18 245)' },
  { id: 'purple', value: 'oklch(0.6 0.2 300)' },
] as const;

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
        <div className="h-11 border-b border-border" />
        <div className="min-h-[180px] px-4 py-4" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring/40 focus-within:border-ring/60 transition-shadow',
        className,
      )}
    >
      <Toolbar editor={editor} />
      <Separator />
      <EditorContent editor={editor} />
      <FloatingBubbleMenu editor={editor} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Top toolbar                                                                */
/* -------------------------------------------------------------------------- */

function Toolbar({ editor }: { editor: Editor }) {
  const t = useTranslations('rich-editor');

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
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
      </ToolbarGroup>

      <ToolbarSeparator />

      <ColorButton editor={editor} />

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
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <BulletListToggle editor={editor} />
        <OrderedListToggle editor={editor} />
      </ToolbarGroup>

      <ToolbarSeparator />

      <LinkButton editor={editor} />
    </div>
  );
}

function ToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function ToolbarSeparator() {
  return (
    <Separator orientation="vertical" className="mx-1 !h-5 !w-px" />
  );
}

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

/* -------------------------------------------------------------------------- */
/* Format toggles                                                             */
/* -------------------------------------------------------------------------- */

type Mark = 'bold' | 'italic' | 'underline';

const INVERSE_TOGGLE_CLASS =
  'text-background/85 hover:bg-background/15 hover:text-background data-[state=on]:bg-background/20 data-[state=on]:text-background aria-pressed:bg-background/20 aria-pressed:text-background';

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
        else chain.toggleUnderline().run();
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
  align: 'left' | 'center';
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
  const swatch = activeColor ?? 'var(--foreground)';

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
            className="relative"
          />
        }
      >
        <PaletteIcon />
        <span
          aria-hidden
          className="absolute bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full"
          style={{ backgroundColor: swatch }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="start">
        <p className="px-1 text-xs font-medium text-muted-foreground">
          {t('color.label')}
        </p>
        <div className="grid grid-cols-8 gap-1">
          {TEXT_COLORS.map((color) => {
            const isActive =
              (color.value === null && !activeColor) ||
              color.value === activeColor;
            return (
              <button
                key={color.id}
                type="button"
                aria-label={t(`color.options.${color.id}`)}
                aria-pressed={isActive}
                onClick={() => apply(color.value)}
                className={cn(
                  'flex size-7 items-center justify-center rounded-md border border-border/60 transition-all',
                  'hover:border-foreground/40 active:scale-95',
                  'focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/40',
                  isActive &&
                    'border-brand ring-2 ring-brand/40 hover:border-brand',
                )}
                style={{
                  backgroundColor: color.value ?? 'var(--background)',
                }}
              >
                {color.value === null ? (
                  <span className="text-[10px] font-semibold text-foreground">
                    A
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
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
            className="flex items-center gap-1 rounded-lg bg-foreground p-1 text-background shadow-lg ring-1 ring-foreground/30"
          >
            <Input
              type="url"
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onLinkKeyDown}
              placeholder={t('link.urlPlaceholder')}
              aria-label={t('link.urlLabel')}
              className="h-7 w-56 border-transparent bg-background/10 text-xs text-background placeholder:text-background/50 focus-visible:border-background/30 focus-visible:ring-background/20"
            />
            {isLinkActive ? (
              <button
                type="button"
                onClick={removeLink}
                aria-label={t('link.remove')}
                className="inline-flex size-7 items-center justify-center rounded-md text-background/85 hover:bg-background/15 hover:text-background"
              >
                <UnlinkIcon className="size-3.5" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={submitLink}
              aria-label={t('link.apply')}
              className="inline-flex size-7 items-center justify-center rounded-md text-background/85 hover:bg-background/15 hover:text-background"
            >
              <CheckIcon className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={exitLinkMode}
              aria-label={t('link.cancel')}
              className="inline-flex size-7 items-center justify-center rounded-md text-background/85 hover:bg-background/15 hover:text-background"
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
            className="flex items-center gap-0.5 rounded-lg bg-foreground p-1 text-background shadow-lg ring-1 ring-foreground/30"
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
              className="mx-0.5 h-4 w-px bg-background/20"
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
              className="mx-0.5 h-4 w-px bg-background/20"
            />
            <Toggle
              size="sm"
              aria-label={t('actions.link')}
              pressed={isLinkActive}
              onPressedChange={enterLinkMode}
              className="text-background/85 hover:bg-background/15 hover:text-background data-[state=on]:bg-background/20 data-[state=on]:text-background aria-pressed:bg-background/20 aria-pressed:text-background"
            >
              <LinkIcon />
            </Toggle>
          </motion.div>
        )}
      </AnimatePresence>
    </BubbleMenu>
  );
}
