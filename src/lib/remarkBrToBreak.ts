import type { Plugin } from 'unified'
import type { Root } from 'mdast'

/**
 * Convert literal `<br>` tags in the markdown source into semantic line breaks,
 * WITHOUT enabling raw HTML (CLAUDE.md hard rule 4 stays intact).
 *
 * Raw HTML is still not rendered: react-markdown drops arbitrary `html` nodes.
 * This plugin runs at the mdast stage and rewrites only `html` nodes whose value
 * is nothing but `<br>` variants into that many `break` nodes (mdast `break` →
 * a normal `<br/>` element). So a single `<br>` is one line break and `<br><br>`
 * is two (a blank line) — the count of tags is preserved.
 *
 * `<br>` inside code fences is a `code` node, not an `html` node, so it is left
 * untouched and stays literal.
 */

/** The whole node value is one or more <br> tags (with optional whitespace). */
const BR_ONLY = /^(?:\s*<br\s*\/?>\s*)+$/i
/** Global matcher used to count the tags. */
const BR_TAG = /<br\s*\/?>/gi

/** Minimal structural node shape — avoids leaning on mdast's precise unions. */
interface MdNode {
  type: string
  value?: string
  children?: MdNode[]
}

function convert(node: MdNode): void {
  if (!node.children) return

  const next: MdNode[] = []
  for (const child of node.children) {
    if (
      child.type === 'html' &&
      typeof child.value === 'string' &&
      BR_ONLY.test(child.value)
    ) {
      const count = child.value.match(BR_TAG)?.length ?? 1
      for (let i = 0; i < count; i += 1) {
        next.push({ type: 'break' })
      }
      continue
    }

    convert(child)
    next.push(child)
  }

  node.children = next
}

export const remarkBrToBreak: Plugin<[], Root> = () => {
  return (tree) => {
    convert(tree as unknown as MdNode)
  }
}
