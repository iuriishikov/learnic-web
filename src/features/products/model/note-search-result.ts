/**
 * One ranked hit from the note content search
 * (`GET /notes/{id}/search`), read via {@link
 * import('../api/use-note-content-search').useNoteContentSearch}.
 *
 * A result locates either a content block (`blockId` set — the reader
 * opens `lessonId` and scrolls to the block) or a module / lesson
 * **title** hit (`blockId` `null` — open `lessonId` at the top).
 */
export type NoteSearchResult = {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  /** `null` for a module / lesson title match → open the lesson top. */
  blockId: string | null;
  /** Block discriminator (`html`, `katex`, …) for an icon; `null` for titles. */
  blockType: string | null;
  /**
   * Excerpt around the match. Matched terms are wrapped in
   * `<<hl>>…<</hl>>` markers — render by splitting on the markers,
   * never as raw HTML.
   */
  snippet: string;
};
