/**
 * Pure pagination math for the PDF export — no DOM, no canvas, so it can be
 * reasoned about (and tested) on its own. Given the total height of the rendered
 * content, the usable height of one page, and the vertical ranges of blocks that
 * must NOT be split (code blocks, tables, diagrams, images), it returns the set
 * of page slices to cut the captured canvas into.
 *
 * All values are in the SAME unit (CSS px of the offscreen render surface). The
 * caller maps px → PDF points once, consistently.
 */

/** A vertical span `[top, bottom)` of a block that must stay on one page. */
export interface Range {
  top: number
  bottom: number
}

/** A single page's vertical slice of the content `[top, bottom)`. */
export interface PageSlice {
  top: number
  bottom: number
}

/**
 * Merge overlapping/touching ranges so at most one can straddle any boundary.
 * Input need not be sorted; output is sorted by `top`.
 */
function normalizeRanges(ranges: Range[]): Range[] {
  const sorted = [...ranges]
    .filter((r) => r.bottom > r.top)
    .sort((a, b) => a.top - b.top)

  const merged: Range[] = []
  for (const r of sorted) {
    const last = merged[merged.length - 1]
    if (last && r.top <= last.bottom) {
      last.bottom = Math.max(last.bottom, r.bottom)
    } else {
      merged.push({ ...r })
    }
  }
  return merged
}

/**
 * Compute page slices for a document of height `totalHeight`, where each page
 * holds at most `pageHeight` of content.
 *
 * When the natural cut point (current + pageHeight) would fall inside an
 * unbreakable block, the whole block is pushed to the next page — the current
 * page simply ends early (a little trailing whitespace) rather than slicing
 * through the block. The one unavoidable exception is a block taller than a full
 * page: it cannot fit anywhere whole, so it is split (starting from its own top).
 */
export function paginate(
  totalHeight: number,
  pageHeight: number,
  avoidRanges: Range[],
): PageSlice[] {
  if (totalHeight <= 0 || pageHeight <= 0) return []

  const ranges = normalizeRanges(avoidRanges)
  const slices: PageSlice[] = []
  let current = 0

  // Guard against pathological inputs producing an unbounded loop.
  const maxPages = Math.ceil(totalHeight / pageHeight) + ranges.length + 2

  while (current < totalHeight - 0.5 && slices.length < maxPages) {
    const ideal = current + pageHeight

    if (ideal >= totalHeight) {
      slices.push({ top: current, bottom: totalHeight })
      break
    }

    // A block straddles the cut if it starts before and ends after `ideal`.
    const straddling = ranges.find((r) => r.top < ideal && r.bottom > ideal)

    let next = ideal
    if (straddling && straddling.top > current) {
      // The block fits on a page of its own — push it down whole.
      next = straddling.top
    }
    // If `straddling.top <= current`, the block is taller than one page and
    // already starts this page: fall through and split it at `ideal`.

    // Never regress or stall.
    if (next <= current) next = ideal

    slices.push({ top: current, bottom: next })
    current = next
  }

  return slices
}
