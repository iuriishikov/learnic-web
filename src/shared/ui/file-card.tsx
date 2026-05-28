'use client';

import {
  ArchiveIcon,
  DownloadIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  PresentationIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Image } from '@/shared/ui/image';
import { VideoPlayer } from '@/shared/ui/video-player';

/* -------------------------------------------------------------------------- */
/* Type detection                                                             */
/* -------------------------------------------------------------------------- */

export type FileCardCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'code'
  | 'archive'
  | 'doc'
  | 'spreadsheet'
  | 'presentation'
  | 'unknown';

const EXTENSION_TO_CATEGORY: Record<string, FileCardCategory> = {
  // image
  jpg: 'image',
  jpeg: 'image',
  png: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  avif: 'image',
  bmp: 'image',
  // video
  mp4: 'video',
  webm: 'video',
  mov: 'video',
  mkv: 'video',
  m4v: 'video',
  // audio
  mp3: 'audio',
  wav: 'audio',
  ogg: 'audio',
  oga: 'audio',
  m4a: 'audio',
  flac: 'audio',
  // documents
  pdf: 'pdf',
  txt: 'text',
  md: 'text',
  // office docs
  doc: 'doc',
  docx: 'doc',
  rtf: 'doc',
  odt: 'doc',
  xls: 'spreadsheet',
  xlsx: 'spreadsheet',
  csv: 'spreadsheet',
  ods: 'spreadsheet',
  ppt: 'presentation',
  pptx: 'presentation',
  key: 'presentation',
  odp: 'presentation',
  // archive
  zip: 'archive',
  rar: 'archive',
  '7z': 'archive',
  tar: 'archive',
  gz: 'archive',
  bz2: 'archive',
  // code
  js: 'code',
  ts: 'code',
  jsx: 'code',
  tsx: 'code',
  py: 'code',
  rb: 'code',
  go: 'code',
  rs: 'code',
  java: 'code',
  c: 'code',
  cpp: 'code',
  cs: 'code',
  json: 'code',
  yaml: 'code',
  yml: 'code',
  toml: 'code',
  xml: 'code',
  html: 'code',
  css: 'code',
};

function getExtension(input: string): string | null {
  const path = input.split(/[?#]/, 1)[0] ?? input;
  const dot = path.lastIndexOf('.');
  if (dot < 0 || dot === path.length - 1) return null;
  return path.slice(dot + 1).toLowerCase();
}

function categoryFromMimeType(mime: string): FileCardCategory | null {
  const m = mime.toLowerCase();
  if (m.startsWith('image/')) return 'image';
  if (m.startsWith('video/')) return 'video';
  if (m.startsWith('audio/')) return 'audio';
  if (m === 'application/pdf') return 'pdf';
  if (m.startsWith('text/')) {
    return m === 'text/plain' || m === 'text/markdown' ? 'text' : 'code';
  }
  if (
    m === 'application/zip' ||
    m === 'application/x-rar-compressed' ||
    m === 'application/x-7z-compressed' ||
    m === 'application/x-tar' ||
    m === 'application/gzip'
  )
    return 'archive';
  if (
    m === 'application/msword' ||
    m ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'doc';
  if (
    m === 'application/vnd.ms-excel' ||
    m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return 'spreadsheet';
  if (
    m === 'application/vnd.ms-powerpoint' ||
    m ===
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  )
    return 'presentation';
  if (m === 'application/json' || m === 'application/xml') return 'code';
  return null;
}

export function detectFileCategory(input: {
  name?: string | null;
  url?: string | null;
  mimeType?: string | null;
}): FileCardCategory {
  if (input.mimeType) {
    const fromMime = categoryFromMimeType(input.mimeType);
    if (fromMime) return fromMime;
  }
  const ext =
    (input.name ? getExtension(input.name) : null) ??
    (input.url ? getExtension(input.url) : null);
  if (ext && EXTENSION_TO_CATEGORY[ext]) return EXTENSION_TO_CATEGORY[ext];
  return 'unknown';
}

export function isPreviewableCategory(category: FileCardCategory): boolean {
  return (
    category === 'image' ||
    category === 'video' ||
    category === 'audio' ||
    category === 'pdf'
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

const CATEGORY_TO_ICON: Record<
  FileCardCategory,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
> = {
  image: FileImageIcon,
  video: FileVideoIcon,
  audio: FileAudioIcon,
  pdf: FileTextIcon,
  text: FileTextIcon,
  code: FileCodeIcon,
  archive: ArchiveIcon,
  doc: FileTextIcon,
  spreadsheet: FileSpreadsheetIcon,
  presentation: PresentationIcon,
  unknown: FileIcon,
};

export function FileCategoryIcon({
  category,
  className,
}: {
  category: FileCardCategory;
  className?: string;
}) {
  const Icon = CATEGORY_TO_ICON[category];
  return <Icon className={cn('size-5', className)} aria-hidden />;
}

/* -------------------------------------------------------------------------- */
/* Download helper                                                            */
/* -------------------------------------------------------------------------- */

function triggerDownload(url: string, filename?: string) {
  const a = document.createElement('a');
  a.href = url;
  if (filename) a.download = filename;
  // For cross-origin URLs `download` is ignored; open in a new tab instead.
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* -------------------------------------------------------------------------- */
/* FileCard                                                                   */
/* -------------------------------------------------------------------------- */

export type FileCardLabels = {
  /** Subtitle when the file can be previewed inline. e.g. "Open or download". */
  previewSubtitle: string;
  /** Subtitle when only download is possible. e.g. "Download". */
  downloadSubtitle: string;
  /** Preview dialog "Download" button label. */
  downloadAction: string;
  /** Fallback title when neither `name` nor `title` is provided. */
  defaultTitle: string;
};

export type FileCardProps = {
  /** Direct URL to the file. Used for preview and download. */
  url: string;
  /** Source file name. Used for the download attribute, title fallback, and extension-based type detection. */
  name?: string | null;
  /** Optional title override. When omitted, falls back to `name` and then `labels.defaultTitle`. */
  title?: string | null;
  /** MIME type — preferred over filename when classifying the file. */
  mimeType?: string | null;
  /** Force a specific category. Bypasses extension/MIME detection. */
  category?: FileCardCategory;
  /** Localized labels — all strings are passed in. */
  labels: FileCardLabels;
  className?: string;
};

export function FileCard({
  url,
  name,
  title,
  mimeType,
  category: categoryProp,
  labels,
  className,
}: FileCardProps) {
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);

  const category = React.useMemo(
    () => categoryProp ?? detectFileCategory({ name, url, mimeType }),
    [categoryProp, name, url, mimeType],
  );
  const previewable = isPreviewableCategory(category);
  const resolvedTitle = title ?? name ?? labels.defaultTitle;

  const handleClick = () => {
    if (previewable) {
      setOpen(true);
    } else {
      triggerDownload(url, name ?? undefined);
    }
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={handleClick}
        whileHover={reduceMotion ? undefined : { y: -1 }}
        whileTap={reduceMotion ? undefined : { y: 0 }}
        transition={{ duration: 0.12 }}
        aria-haspopup={previewable ? 'dialog' : undefined}
        className={cn(
          'group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-3 text-left transition-colors',
          'hover:bg-muted/30 hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          className,
        )}
      >
        <span
          aria-hidden
          className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-foreground/80 ring-1 ring-inset ring-border transition-colors group-hover:bg-muted"
        >
          <FileCategoryIcon category={category} className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-base font-semibold leading-tight text-foreground">
            {resolvedTitle}
          </span>
          <span className="truncate text-sm leading-snug text-muted-foreground">
            {previewable ? labels.previewSubtitle : labels.downloadSubtitle}
          </span>
        </span>
      </motion.button>

      {previewable ? (
        <FilePreviewDialog
          open={open}
          onOpenChange={setOpen}
          url={url}
          filename={name ?? undefined}
          title={resolvedTitle}
          category={category}
          downloadActionLabel={labels.downloadAction}
        />
      ) : null}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Preview dialog                                                             */
/* -------------------------------------------------------------------------- */

type FilePreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  filename?: string;
  title: string;
  category: FileCardCategory;
  downloadActionLabel: string;
};

function FilePreviewDialog({
  open,
  onOpenChange,
  url,
  filename,
  title,
  category,
  downloadActionLabel,
}: FilePreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[840px]">
        <DialogHeader className="flex flex-row items-center gap-3 border-b border-border px-6 py-4 pr-12">
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/50 text-foreground/80 ring-1 ring-inset ring-border"
          >
            <FileCategoryIcon category={category} className="size-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle className="truncate text-base font-semibold">
              {title}
            </DialogTitle>
            {filename && filename !== title ? (
              <DialogDescription className="truncate text-xs text-muted-foreground">
                {filename}
              </DialogDescription>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex flex-1 items-center justify-center overflow-hidden bg-muted/10">
          <FilePreviewBody url={url} category={category} title={title} />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/20 px-6 py-3">
          <Button
            onClick={() => triggerDownload(url, filename)}
            className="gap-1.5"
          >
            <DownloadIcon className="size-4" />
            {downloadActionLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilePreviewBody({
  url,
  category,
  title,
}: {
  url: string;
  category: FileCardCategory;
  title: string;
}) {
  if (category === 'image') {
    return (
      <div className="relative flex h-full max-h-[70vh] w-full items-center justify-center">
        <Image
          src={url}
          alt={title}
          fill
          fit="contain"
          // Storage / signed URLs from arbitrary backends — bypass the optimizer.
          unoptimized
          sizes="100vw"
          rounded="lg"
          errorSize="text"
        />
      </div>
    );
  }

  if (category === 'video') {
    return (
      <VideoPlayer
        src={url}
        ariaLabel={title}
        className="aspect-video w-full"
      />
    );
  }

  if (category === 'audio') {
    return (
      <div className="flex w-full items-center justify-center px-6 py-12">
        <audio
          controls
          src={url}
          className="w-full max-w-md"
          aria-label={title}
        />
      </div>
    );
  }

  if (category === 'pdf') {
    return (
      <iframe
        src={url}
        title={title}
        className="h-[70vh] w-full border-0 bg-background"
      />
    );
  }

  return null;
}
