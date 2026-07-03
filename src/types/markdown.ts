/**
 * The single shared domain type for an uploaded Markdown document.
 * Contents live only in memory (React state) for the session — see CLAUDE.md.
 */
export interface MarkdownFile {
  /** Stable unique id (crypto.randomUUID). */
  id: string
  /** Display name, disambiguated if duplicates are uploaded. */
  name: string
  /** Raw markdown source. */
  content: string
}
