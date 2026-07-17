import { createContext } from 'react'

/**
 * Maps a markdown image reference (e.g. `./img/chart.png`) to an in-memory blob
 * URL supplied by the user. Provided by MarkdownRenderer, read by MarkdownImage.
 */
export const ImageMapContext = createContext<Record<string, string>>({})
