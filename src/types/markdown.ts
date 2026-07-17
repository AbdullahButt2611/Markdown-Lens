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
  /**
   * Resolved local images, keyed by the exact reference used in the markdown
   * (e.g. `./img/chart.png`) mapped to an in-memory blob URL. Present only when
   * the document references local images the user has supplied.
   */
  images?: Record<string, string>
}

/** A local image the document references and the user must supply. */
export interface ImageRef {
  /** The exact path/URL as written in the markdown. */
  url: string
  /** The file name (basename) the user should upload to satisfy it. */
  name: string
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
