'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import {
  FileCard,
  type FileCardCategory,
  type FileCardLabels,
} from '@/shared/ui/file-card';

type DemoFile = {
  id: string;
  url: string;
  name: string;
  /** Title to display in the card (falls back to `name` if omitted). */
  title?: string;
  mimeType?: string;
  /** Force a category — handy for "what would unknown look like". */
  forceCategory?: FileCardCategory;
};

/* -------------------------------------------------------------------------- */
/* Demo wrapper                                                               */
/* -------------------------------------------------------------------------- */

function DemoCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-3">{children}</div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

export function FileCardDemoView() {
  const t = useTranslations('file-card-demo');

  const labels: FileCardLabels = React.useMemo(
    () => ({
      previewSubtitle: t('labels.previewSubtitle'),
      downloadSubtitle: t('labels.downloadSubtitle'),
      downloadAction: t('labels.downloadAction'),
      defaultTitle: t('labels.defaultTitle'),
    }),
    [t],
  );

  // Local + reliable public samples. Image is local — guaranteed to render.
  // Video/audio/PDF use small public sample assets so the preview dialog has
  // real media to play; they still demonstrate flow even if a CDN is slow.
  const previewableFiles: DemoFile[] = React.useMemo(
    () => [
      {
        id: 'image',
        url: '/placeholders/01-aurora.svg',
        name: 'aurora-cover.svg',
        title: t('files.image'),
        mimeType: 'image/svg+xml',
      },
      {
        id: 'video',
        url: 'https://download.samplelib.com/mp4/sample-5s.mp4',
        name: 'sample-clip.mp4',
        title: t('files.video'),
        mimeType: 'video/mp4',
      },
      {
        id: 'audio',
        url: 'https://download.samplelib.com/mp3/sample-3s.mp3',
        name: 'sample-tone.mp3',
        title: t('files.audio'),
        mimeType: 'audio/mpeg',
      },
      {
        id: 'pdf',
        url: 'https://www.orimi.com/pdf-test.pdf',
        name: 'pdf-test.pdf',
        title: t('files.pdf'),
        mimeType: 'application/pdf',
      },
    ],
    [t],
  );

  const downloadOnlyFiles: DemoFile[] = React.useMemo(
    () => [
      {
        id: 'zip',
        url: '/file.svg',
        name: 'lesson-bundle.zip',
        title: t('files.archive'),
      },
      {
        id: 'doc',
        url: '/file.svg',
        name: 'syllabus.docx',
        title: t('files.doc'),
      },
      {
        id: 'spreadsheet',
        url: '/file.svg',
        name: 'grades.xlsx',
        title: t('files.spreadsheet'),
      },
      {
        id: 'unknown',
        url: '/file.svg',
        name: 'mystery.bin',
        title: t('files.unknown'),
      },
    ],
    [t],
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-8 md:px-6 md:py-12 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          FileCard · v1
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <DemoCard
        title={t('sections.preview.title')}
        description={t('sections.preview.description')}
      >
        {previewableFiles.map((file) => (
          <FileCard
            key={file.id}
            url={file.url}
            name={file.name}
            title={file.title}
            mimeType={file.mimeType}
            labels={labels}
          />
        ))}
      </DemoCard>

      <DemoCard
        title={t('sections.download.title')}
        description={t('sections.download.description')}
      >
        {downloadOnlyFiles.map((file) => (
          <FileCard
            key={file.id}
            url={file.url}
            name={file.name}
            title={file.title}
            category={file.forceCategory}
            labels={labels}
          />
        ))}
      </DemoCard>

      <DemoCard
        title={t('sections.minimal.title')}
        description={t('sections.minimal.description')}
      >
        <FileCard url="/file.svg" labels={labels} />
      </DemoCard>
    </main>
  );
}
