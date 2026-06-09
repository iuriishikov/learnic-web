'use client';

import { motion, useReducedMotion } from 'motion/react';
import { type DragEvent, type ReactNode, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

export type FileDropZoneProps = {
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Optional id for the hidden file input (associate an external `Label`). */
  inputId?: string;
  /** Lucide icon node for the round chip. */
  icon: ReactNode;
  /** Bold prompt above the secondary lines — already localized. */
  prompt: string;
  /** Optional secondary line between the prompt and the hint. */
  description?: string;
  /** Smaller hint with the format / size constraint. */
  hint?: string;
  onFiles: (files: File[]) => void;
  className?: string;
};

/**
 * Dashed drag-and-drop file target with a native picker fallback. Purely
 * presentational: validation (size, type, count) and upload live with the
 * caller — `onFiles` just hands over whatever was picked or dropped.
 */
export function FileDropZone({
  accept,
  multiple,
  disabled,
  inputId,
  icon,
  prompt,
  description,
  hint,
  onFiles,
  className,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const reduceMotion = useReducedMotion();

  const openPicker = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handlePick = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    if (arr.length === 0) return;
    onFiles(arr);
    // Reset native value so picking the same path again still fires change.
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDragOver = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const onDragLeave = (e: DragEvent<HTMLButtonElement>) => {
    // Ignore enters into children — only flip off when leaving the host.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragOver(false);
  };

  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    handlePick(e.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => handlePick(e.target.files)}
      />
      <motion.button
        type="button"
        onClick={openPicker}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        disabled={disabled}
        whileHover={reduceMotion || disabled ? undefined : { scale: 1.005 }}
        whileTap={reduceMotion || disabled ? undefined : { scale: 0.995 }}
        animate={{ scale: dragOver && !reduceMotion ? 1.01 : 1 }}
        transition={{ duration: 0.15 }}
        aria-label={prompt}
        className={cn(
          'group flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          disabled && 'cursor-not-allowed opacity-60',
          !disabled && dragOver
            ? 'border-brand bg-brand/5'
            : 'border-border bg-muted/10 hover:border-brand/50 hover:bg-muted/20',
          className,
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex size-12 items-center justify-center rounded-full bg-foreground/[0.04] text-foreground/80 ring-1 ring-foreground/10 transition-colors',
            !disabled && dragOver && 'bg-brand/10 text-brand ring-brand/30',
          )}
        >
          {icon}
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground">{prompt}</span>
          {description ? (
            <span className="text-xs text-muted-foreground">{description}</span>
          ) : null}
          {hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : null}
        </div>
      </motion.button>
    </>
  );
}
