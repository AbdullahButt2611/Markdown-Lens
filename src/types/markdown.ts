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

/** A rejected or failed upload, surfaced inline to the user. */
export interface UploadError {
  /** Stable unique id for list rendering / dismissal. */
  id: string
  /** The offending file's name, so the message can name it. */
  fileName: string
  /** What went wrong and, where useful, how to fix it. */
  message: string
}
