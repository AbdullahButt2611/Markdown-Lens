import { MarkdownRenderer } from './components/markdown/MarkdownRenderer'

/**
 * Phase 1 harness: renders a hardcoded sample to prove the pipeline.
 * Phase 2 replaces this with real in-memory file uploads.
 */
const SAMPLE = `# Markdown Lens

A privacy-first reader for your Markdown. **Bold**, *italic*, ~~strikethrough~~,
and inline \`code\` all render with care.

## Heading hierarchy

### A third-level heading

Body copy sits at a comfortable measure and line height, so long-form technical
writing stays readable. Here is a [link to Anthropic](https://www.anthropic.com).

## Lists

- Unordered item one
- Unordered item two
  - Nested item
  - Another nested item
- Back to top level

1. Ordered first
2. Ordered second
3. Ordered third

- [x] A completed task
- [ ] An open task

## A table

| Feature      | Status | Notes                     |
| ------------ | ------ | ------------------------- |
| GFM tables   | Ready  | Scrolls when it overflows |
| Blockquotes  | Ready  | Left border, muted text   |
| Inline code  | Ready  | Tinted, no highlighting   |

## Blockquote

> The in-memory, no-backend guarantee is the product.
> There is nothing to save, so nothing can leak.

---

That horizontal rule marks the end of the sample.
`

function App() {
  return (
    <main className="min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-fg)]">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <MarkdownRenderer content={SAMPLE} />
      </div>
    </main>
  )
}

export default App
