'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ImageIcon, TypeIcon, VideoIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import {
  EditorAddBlockMenu,
  type EditorAddBlockEntry,
} from '@/shared/ui/editor-add-block-menu';
import { EditorBlockDnd } from '@/shared/ui/editor-block-shell';

import {
  addHtmlBlockAction,
  addImageBlockAction,
  addVideoBlockAction,
  deleteBlockAction,
  reorderBlocksAction,
  updateHtmlBlockAction,
  updateImageBlockAction,
  updateVideoBlockAction,
} from '../api/blocks';
import { publishPostAction, unpublishPostAction } from '../api/lifecycle';
import {
  changeSlugAction,
  deletePostAction,
  renamePostAction,
} from '../api/posts';
import { useBlogErrorToast } from '../lib/use-blog-errors';
import {
  BLOG_IMAGE_BLOCK_MAX_BYTES,
  BLOG_VIDEO_BLOCK_MAX_BYTES,
} from '../model/limits';
import type { BlogBlock, BlogPost } from '../model/types';
import { BlockCard } from './block-card';
import { CoverSetting } from './cover-setting';
import { DeletePostDialog } from './delete-post-dialog';
import { MetaSetting } from './meta-setting';
import { EditorHeader } from './editor-header';
import {
  MediaUploadDialog,
  type MediaKind,
  type MediaSubmit,
} from './media-upload-dialog';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type PostEditorViewProps = {
  initialPost: BlogPost;
};

export function PostEditorView({ initialPost }: PostEditorViewProps) {
  const t = useTranslations('blog-admin');
  const router = useRouter();
  const errorToast = useBlogErrorToast();
  const queryClient = useQueryClient();

  const [post, setPost] = useState<BlogPost>(initialPost);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [busy, setBusy] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [draggingActive, setDraggingActive] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Image/video blocks need their file at creation, so picking a media type
  // in the add-block menu opens the upload dialog first.
  const [addMediaKind, setAddMediaKind] = useState<MediaKind | null>(null);

  // Every successful mutation changes a list-visible field (title, slug,
  // status, or updatedAt), so mark the admin list cache stale. Inactive
  // queries (the list isn't mounted here) are only flagged — the actual
  // refetch fires via refetchOnMount when the user navigates back.
  const invalidateList = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
  }, [queryClient]);

  // Wrap a mutation with the save-state indicator. The optimistic update is
  // applied by the caller before invoking; on failure we re-fetch by toast +
  // rollback closure.
  const withSave = useCallback(
    async (
      run: () => Promise<{ ok: true } | { ok: false; reason: string }>,
      rollback?: () => void,
    ) => {
      setSaveState('saving');
      const result = await run();
      if (result.ok) {
        setSaveState('saved');
        invalidateList();
        window.setTimeout(() => setSaveState('idle'), 1500);
      } else {
        setSaveState('error');
        rollback?.();
        errorToast(result.reason as never);
      }
    },
    [errorToast, invalidateList],
  );

  // --- post identity ---
  const handleTitleCommit = useCallback(
    (title: string) => {
      const prev = post.title;
      setPost((p) => ({ ...p, title }));
      void withSave(
        () => renamePostAction({ id: post.id, title }),
        () => setPost((p) => ({ ...p, title: prev })),
      );
    },
    [post.id, post.title, withSave],
  );

  const handleSlugCommit = useCallback(
    async (slug: string) => {
      const prev = post.slug;
      setSlugError(null);
      setPost((p) => ({ ...p, slug }));
      setSaveState('saving');
      const result = await changeSlugAction({ id: post.id, slug });
      if (result.ok) {
        setSaveState('saved');
        invalidateList();
        window.setTimeout(() => setSaveState('idle'), 1500);
      } else {
        setSaveState('error');
        setPost((p) => ({ ...p, slug: prev }));
        if (result.reason === 'slug-taken') {
          setSlugError(t('errors.slugTaken'));
        } else if (result.reason === 'validation') {
          setSlugError(t('errors.slugFormat'));
        } else {
          errorToast(result.reason);
        }
      }
    },
    [post.id, post.slug, t, errorToast, invalidateList],
  );

  const handlePublishToggle = useCallback(async () => {
    const wasPublished = post.status === 'published';
    setBusy(true);
    const result = wasPublished
      ? await unpublishPostAction(post.id)
      : await publishPostAction(post.id);
    setBusy(false);
    if (!result.ok) {
      errorToast(result.reason);
      return;
    }
    setPost((p) => ({
      ...p,
      status: wasPublished ? 'draft' : 'published',
      publishedAt: wasPublished ? null : (p.publishedAt ?? new Date().toISOString()),
    }));
    invalidateList();
  }, [post.id, post.status, errorToast, invalidateList]);

  const handleDelete = useCallback(async () => {
    setBusy(true);
    const result = await deletePostAction(post.id);
    setBusy(false);
    setDeleteOpen(false);
    if (!result.ok) {
      errorToast(result.reason);
      return;
    }
    invalidateList();
    router.push('/admin/blog');
  }, [post.id, errorToast, router, invalidateList]);

  // --- blocks: helpers to splice server-returned block into state ---
  const upsertBlock = useCallback((block: BlogBlock) => {
    setPost((p) => {
      const exists = p.blocks.some((b) => b.id === block.id);
      const blocks = exists
        ? p.blocks.map((b) => (b.id === block.id ? block : b))
        : [...p.blocks, block];
      return { ...p, blocks };
    });
  }, []);

  const handleAddHtml = useCallback(async () => {
    setBusy(true);
    const result = await addHtmlBlockAction({ postId: post.id, html: '' });
    setBusy(false);
    if (!result.ok) return errorToast(result.reason);
    upsertBlock(result.data);
    invalidateList();
  }, [post.id, errorToast, upsertBlock, invalidateList]);

  const handleAddMedia = useCallback(
    async (kind: 'image' | 'video', data: MediaSubmit) => {
      if (!data.file) return;
      const fd = new FormData();
      fd.append('file', data.file);
      if (data.text) fd.append(kind === 'image' ? 'caption' : 'title', data.text);
      setBusy(true);
      const result =
        kind === 'image'
          ? await addImageBlockAction(post.id, fd)
          : await addVideoBlockAction(post.id, fd);
      setBusy(false);
      if (!result.ok) return errorToast(result.reason);
      upsertBlock(result.data);
      invalidateList();
    },
    [post.id, errorToast, upsertBlock, invalidateList],
  );

  const handleUpdateHtml = useCallback(
    (blockId: string, html: string) => {
      void withSave(async () => {
        const result = await updateHtmlBlockAction({
          postId: post.id,
          blockId,
          html,
        });
        if (result.ok) upsertBlock(result.data);
        return result;
      });
    },
    [post.id, withSave, upsertBlock],
  );

  const handleReplaceMedia = useCallback(
    (block: Extract<BlogBlock, { type: 'image' | 'video' }>, data: MediaSubmit) => {
      const fd = new FormData();
      if (data.file) fd.append('file', data.file);
      // Always send the text field so an emptied caption/title clears it.
      fd.append(block.type === 'image' ? 'caption' : 'title', data.text);
      setBusy(true);
      void (async () => {
        const result =
          block.type === 'image'
            ? await updateImageBlockAction(post.id, block.id, fd)
            : await updateVideoBlockAction(post.id, block.id, fd);
        setBusy(false);
        if (!result.ok) return errorToast(result.reason);
        upsertBlock(result.data);
        invalidateList();
      })();
    },
    [post.id, errorToast, upsertBlock, invalidateList],
  );

  const handleUpdateMediaText = useCallback(
    (block: Extract<BlogBlock, { type: 'image' | 'video' }>, text: string) => {
      const fd = new FormData();
      fd.append(block.type === 'image' ? 'caption' : 'title', text);
      void withSave(async () => {
        const result =
          block.type === 'image'
            ? await updateImageBlockAction(post.id, block.id, fd)
            : await updateVideoBlockAction(post.id, block.id, fd);
        if (result.ok) upsertBlock(result.data);
        return result;
      });
    },
    [post.id, withSave, upsertBlock],
  );

  const handleDeleteBlock = useCallback(
    async (blockId: string) => {
      const prev = post.blocks;
      setPost((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== blockId) }));
      const result = await deleteBlockAction({ postId: post.id, blockId });
      if (!result.ok) {
        setPost((p) => ({ ...p, blocks: prev }));
        errorToast(result.reason);
      } else {
        invalidateList();
      }
    },
    [post.id, post.blocks, errorToast, invalidateList],
  );

  // Receives the reordered id list from `EditorBlockDnd`; the optimistic
  // update, persistence, and rollback stay here with the post state.
  const handleReorder = useCallback(
    (orderedIds: string[]) => {
      const prev = post.blocks;
      const next = orderedIds
        .map((id) => prev.find((b) => b.id === id))
        .filter((b): b is BlogBlock => b !== undefined);
      if (next.length !== prev.length) return;
      setPost((p) => ({ ...p, blocks: next }));
      void (async () => {
        const result = await reorderBlocksAction({
          postId: post.id,
          orderedIds,
        });
        if (!result.ok) {
          setPost((p) => ({ ...p, blocks: prev }));
          errorToast(result.reason);
        } else {
          invalidateList();
        }
      })();
    },
    [post.id, post.blocks, errorToast, invalidateList],
  );

  const itemIds = post.blocks.map((b) => b.id);

  const addBlockEntries: EditorAddBlockEntry[] = [
    {
      key: 'html',
      icon: <TypeIcon />,
      label: t('editor.blockType.html'),
      description: t('editor.addHtmlHint'),
      onSelect: () => void handleAddHtml(),
    },
    {
      key: 'image',
      icon: <ImageIcon />,
      label: t('editor.blockType.image'),
      description: t('editor.addImageHint'),
      onSelect: () => setAddMediaKind('image'),
    },
    {
      key: 'video',
      icon: <VideoIcon />,
      label: t('editor.blockType.video'),
      description: t('editor.addVideoHint'),
      onSelect: () => setAddMediaKind('video'),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6 px-4 pt-6 pb-16 md:px-6 md:pt-8">
      <EditorHeader
        title={post.title}
        slug={post.slug}
        status={post.status}
        saveState={saveState}
        busy={busy}
        slugError={slugError}
        onTitleCommit={handleTitleCommit}
        onSlugCommit={handleSlugCommit}
        onPublishToggle={handlePublishToggle}
        onDelete={() => setDeleteOpen(true)}
        cover={<CoverSetting post={post} onChange={setPost} />}
      />

      <DeletePostDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        postTitle={post.title}
        busy={busy}
        onConfirm={handleDelete}
      />

      <MetaSetting post={post} onChange={setPost} />

      {post.blocks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {t('editor.noBlocks')}
        </p>
      ) : (
        <EditorBlockDnd
          id="blog-blocks-dnd"
          itemIds={itemIds}
          onReorder={handleReorder}
          onDraggingChange={setDraggingActive}
        >
          {post.blocks.map((block, idx) => (
            <BlockCard
              key={block.id}
              block={block}
              isFirst={idx === 0}
              draggingActive={draggingActive}
              onUpdateHtml={(html) => handleUpdateHtml(block.id, html)}
              onReplaceMedia={(data) =>
                block.type !== 'html'
                  ? handleReplaceMedia(block, data)
                  : undefined
              }
              onUpdateText={(text) =>
                block.type !== 'html'
                  ? handleUpdateMediaText(block, text)
                  : undefined
              }
              onDelete={() => handleDeleteBlock(block.id)}
            />
          ))}
        </EditorBlockDnd>
      )}

      <EditorAddBlockMenu
        entries={addBlockEntries}
        triggerLabel={t('editor.addBlock')}
        menuLabel={t('editor.blockMenuLabel')}
        hasBlocks={post.blocks.length > 0}
        disabled={busy}
      />

      <MediaUploadDialog
        kind="image"
        requireFile
        maxBytes={BLOG_IMAGE_BLOCK_MAX_BYTES}
        busy={busy}
        open={addMediaKind === 'image'}
        onOpenChange={(o) => setAddMediaKind(o ? 'image' : null)}
        onSubmit={(data) => handleAddMedia('image', data)}
      />
      <MediaUploadDialog
        kind="video"
        requireFile
        maxBytes={BLOG_VIDEO_BLOCK_MAX_BYTES}
        busy={busy}
        open={addMediaKind === 'video'}
        onOpenChange={(o) => setAddMediaKind(o ? 'video' : null)}
        onSubmit={(data) => handleAddMedia('video', data)}
      />
    </div>
  );
}
