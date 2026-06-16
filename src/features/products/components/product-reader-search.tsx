'use client';

import { ChevronRightIcon, SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Fragment, useRef, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Pagination,
  PaginationNextStep,
  PaginationPrevStep,
} from '@/shared/ui/pagination';
import { Skeleton } from '@/shared/ui/skeleton';

import {
  NOTE_SEARCH_MIN_QUERY_LEN,
  useNoteContentSearch,
} from '../api/use-note-content-search';
import type { NoteSearchResult } from '../model/note-search-result';
import type { PublicSchemeModule } from '../model/public-scheme';

import { ProductReaderNav } from './product-reader-nav';

// Results per page in the (narrow) sidebar list. The backend caps total
// matches at 50, so this paginates that ranked set client-side.
const SEARCH_RESULTS_PAGE_SIZE = 6;

type ProductReaderSearchableNavProps = {
  noteId: string;
  modules: PublicSchemeModule[];
  selectedLessonId: string | null;
  selectedModuleId: string | null;
  /** Navigate to a lesson from the structure tree. */
  onSelectLesson: (lessonId: string) => void;
  /**
   * Open a search hit: jump to `blockId` in `lessonId` (or the lesson
   * top when `blockId` is `null`). `snippet` carries the `<<hl>>` markers
   * so the reader can select just the matched terms within the block.
   */
  onSelectResult: (
    lessonId: string,
    blockId: string | null,
    snippet: string,
  ) => void;
};

/**
 * The reader sidebar's navigation surface. Always shows a search field;
 * once the query reaches {@link NOTE_SEARCH_MIN_QUERY_LEN} characters it
 * swaps the structure tree for a server-driven list of content matches.
 * Rendered identically in the desktop sidebar and the mobile Sheet, so
 * one swap point covers both.
 */
export function ProductReaderSearchableNav({
  noteId,
  modules,
  selectedLessonId,
  selectedModuleId,
  onSelectLesson,
  onSelectResult,
}: ProductReaderSearchableNavProps) {
  const t = useTranslations('product-reader');
  const [query, setQuery] = useState('');
  const showResults = query.trim().length >= NOTE_SEARCH_MIN_QUERY_LEN;

  return (
    <div className="flex flex-col gap-3">
      {/* `type="text"` (not `search`) so no native WebKit clear "✕". */}
      <Input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('nav.searchPlaceholder')}
        aria-label={t('nav.searchPlaceholder')}
        leadingIcon={<SearchIcon className="size-4" aria-hidden />}
        className="h-9 bg-muted/40 shadow-none"
      />
      {showResults ? (
        <NoteSearchResults
          noteId={noteId}
          query={query}
          onSelect={onSelectResult}
        />
      ) : (
        <ProductReaderNav
          modules={modules}
          selectedLessonId={selectedLessonId}
          selectedModuleId={selectedModuleId}
          onSelectLesson={onSelectLesson}
        />
      )}
    </div>
  );
}

function NoteSearchResults({
  noteId,
  query,
  onSelect,
}: {
  noteId: string;
  query: string;
  onSelect: (lessonId: string, blockId: string | null, snippet: string) => void;
}) {
  const t = useTranslations('product-reader');
  const { data, isError, refetch } = useNoteContentSearch(noteId, query);

  const [page, setPage] = useState(0);
  // Reset to the first page whenever the query changes (the React-
  // recommended "adjust state during render" pattern — no effect).
  const [prevQuery, setPrevQuery] = useState(query);
  if (prevQuery !== query) {
    setPrevQuery(query);
    setPage(0);
  }
  const listRef = useRef<HTMLUListElement>(null);

  if (isError) {
    return (
      <div className="px-1 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('nav.searchError')}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void refetch()}
        >
          {t('nav.searchRetry')}
        </Button>
      </div>
    );
  }

  // `undefined` covers both the first fetch and the debounce gap (raw
  // query already long enough, debounced value not yet caught up).
  if (data === undefined) {
    return (
      <div className="flex flex-col gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <p className="px-1 py-6 text-center text-sm text-muted-foreground">
        {t('nav.searchEmpty')}
      </p>
    );
  }

  const pageCount = Math.ceil(data.length / SEARCH_RESULTS_PAGE_SIZE);
  const activePage = Math.min(page, pageCount - 1); // clamp if data shrank
  const pageItems = data.slice(
    activePage * SEARCH_RESULTS_PAGE_SIZE,
    activePage * SEARCH_RESULTS_PAGE_SIZE + SEARCH_RESULTS_PAGE_SIZE,
  );

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 0), pageCount - 1));
    // Bring the list top back into view so the new page reads from #1.
    listRef.current?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <div className="flex flex-col gap-2">
      <ul
        ref={listRef}
        aria-label={t('nav.searchResultsLabel')}
        className="flex flex-col gap-0.5"
      >
        {pageItems.map((result, index) => (
          <li key={`${result.blockId ?? result.lessonId}-${activePage}-${index}`}>
            <SearchResultRow result={result} onSelect={onSelect} />
          </li>
        ))}
      </ul>

      {pageCount > 1 ? (
        <Pagination size="sm" align="between" className="px-1 pt-1">
          <PaginationPrevStep
            disabled={activePage <= 0}
            onClick={() => goToPage(activePage - 1)}
          />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            <span aria-hidden>
              {activePage + 1} / {pageCount}
            </span>
            <span className="sr-only">
              {t('nav.searchPageStatus', {
                current: activePage + 1,
                total: pageCount,
              })}
            </span>
          </span>
          <PaginationNextStep
            disabled={activePage >= pageCount - 1}
            onClick={() => goToPage(activePage + 1)}
          />
        </Pagination>
      ) : null}
    </div>
  );
}

function SearchResultRow({
  result,
  onSelect,
}: {
  result: NoteSearchResult;
  onSelect: (lessonId: string, blockId: string | null, snippet: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(result.lessonId, result.blockId, result.snippet)}
      className="flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none"
    >
      <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <span className="truncate">{result.moduleTitle}</span>
        <ChevronRightIcon className="size-3 shrink-0" aria-hidden />
        <span className="truncate font-medium text-foreground/80">
          {result.lessonTitle}
        </span>
      </span>
      <span className="line-clamp-2 text-sm leading-snug text-muted-foreground">
        <HighlightedSnippet text={result.snippet} />
      </span>
    </button>
  );
}

/**
 * Render a `ts_headline` snippet, wrapping `<<hl>>…<</hl>>` runs in a
 * `<mark>`. Splits on the markers and emits plain text + `<mark>` nodes
 * — never `dangerouslySetInnerHTML`, so any stray markup in the source
 * text shows as literal text instead of executing.
 */
function HighlightedSnippet({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(/<<hl>>([\s\S]*?)<<\/hl>>/g)) {
    const start = match.index;
    if (start > last) {
      nodes.push(<Fragment key={key++}>{text.slice(last, start)}</Fragment>);
    }
    nodes.push(
      <mark key={key++} className="rounded-[3px] bg-brand/15 text-foreground">
        {match[1]}
      </mark>,
    );
    last = start + match[0].length;
  }
  if (last < text.length) {
    nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  }
  return <>{nodes}</>;
}
