import type { Plugin } from 'unified'
import type { Root } from 'mdast'

/**
 * Render `<mark>…</mark>` as a real highlight WITHOUT enabling raw HTML
 * (CLAUDE.md hard rule 4 stays intact).
 *
 * Raw HTML is still not rendered: react-markdown drops arbitrary `html` nodes.
 * This plugin runs at the mdast stage and rewrites only matched `<mark>` /
 * `</mark>` `html` node pairs, wrapping the nodes between them in a node that
 * emits a `<mark>` element (via `data.hName`). The `<mark>` is then styled as a
 * yellow highlight in the reading theme.
 *
 * `<mark>` inside code fences is a `code` node, not an `html` node, so it is
 * left untouched and stays literal.
 */

/** An opening <mark> tag (attributes allowed but ignored). */
const OPEN = /^<mark(?:\s[^>]*)?>$/i
/** A closing </mark> tag. */
const CLOSE = /^<\/mark>$/i

/** Minimal structural node shape — avoids leaning on mdast's precise unions. */
interface MdNode {
  type: string
  value?: string
  children?: MdNode[]
  data?: { hName?: string }
}

function isTag(node: MdNode, re: RegExp): boolean {
  return node.type === 'html' && typeof node.value === 'string' && re.test(node.value)
}

function convert(node: MdNode): void {
  if (!node.children) return

  // Transform descendants first, then pair up marks at this level.
  for (const child of node.children) convert(child)

  const children = node.children
  const next: MdNode[] = []
  let i = 0

  while (i < children.length) {
    const node_i = children[i]
    if (node_i && isTag(node_i, OPEN)) {
      // Find the matching closing tag among the following siblings.
      let j = i + 1
      while (j < children.length) {
        const node_j = children[j]
        if (node_j && isTag(node_j, CLOSE)) break
        j += 1
      }

      if (j < children.length) {
        next.push({
          type: 'mark',
          data: { hName: 'mark' },
          children: children.slice(i + 1, j),
        })
        i = j + 1
        continue
      }
      // No matching close: fall through and leave the node as-is (dropped later).
    }

    if (node_i) next.push(node_i)
    i += 1
  }

  node.children = next
}

export const remarkMark: Plugin<[], Root> = () => {
  return (tree) => {
    convert(tree as unknown as MdNode)
  }
}
