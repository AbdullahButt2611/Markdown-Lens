# Markdown Lens

A privacy-first, in-memory Markdown viewer. Drop in one or more `.md` files and
read them beautifully rendered — with Claude-like fidelity: clean typography, a
clear heading hierarchy, GitHub-Flavored Markdown, LaTeX math, and code blocks
with a language label, syntax highlighting, and a copy button.

## The privacy guarantee

This is the point of the product, and it is architectural rather than a promise:

- **In-memory only.** File contents live in React state for the session and
  nowhere else. Refresh or close the tab and everything is gone by design.
- **No backend, ever.** There is no server, no API route, and no network request
  that carries file content. Your files never leave the browser — so there is
  nothing to save, and nothing to leak.
- **No persistence of content.** No `localStorage`, `sessionStorage`,
  `IndexedDB`, cookies, or service-worker caching of file data. The only value
  the app persists is your light/dark theme preference, which contains zero
  user content.
- **No raw HTML.** Markdown is rendered without raw-HTML support, so document
  content cannot inject markup.

## Tech stack

Vite + React 18 + TypeScript (strict). `react-markdown` with `remark-gfm`,
`remark-math`, `rehype-katex`, and `rehype-highlight`. Tailwind CSS with
`@tailwindcss/typography`. `lucide-react` for icons.

## Run it

```bash
npm install      # install dependencies
npm run dev      # start the local dev server
npm run build    # produce the static production bundle (dist/)
npm run preview  # preview the built static bundle
npm run lint     # lint (must pass clean)
```

The build is a static bundle — deploy `dist/` to Vercel, Netlify, GitHub Pages,
or any static host with zero server cost.

## Accepted files

`.md`, `.markdown`, and `.txt`, up to 5 MB each. Upload multiple files and
switch between them; duplicate names are disambiguated rather than overwritten.

## Fonts

All fonts are self-hosted; nothing phones home to a CDN.

- **Display / headings:** Lastik, self-hosted from `src/assets/fonts/`.
- **Body / UI:** Poppins, bundled via `@fontsource/poppins`.
- **Code:** the system monospace stack (`ui-monospace`, JetBrains Mono, Menlo).

## Future enhancements

Out of scope for v1, but the architecture is ready for them:

- Raw-HTML support — only ever with `rehype-sanitize` in the same change.
- Relative images from the uploaded set.
- Mermaid diagram rendering.
- A YAML frontmatter metadata card.
- A Shiki-based highlighter (the pipeline is swap-ready).
- A table of contents / document outline.
