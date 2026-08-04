import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, WheelEvent } from 'react'
import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'
import { createId } from '../../lib/ids'
import { IconButton } from '../ui/IconButton'

interface MermaidDiagramProps {
  /** The raw mermaid source from the ```mermaid fence. */
  code: string
}

const MIN_SCALE = 0.5
const MAX_SCALE = 4
const STEP = 0.25

function clamp(value: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value))
}

/**
 * Mermaid mutates global config on `initialize` and keeps shared internal state,
 * so concurrent renders race and can blank out diagrams. Serialize every render
 * through this chain so only one runs at a time.
 */
let renderChain: Promise<unknown> = Promise.resolve()
function queueRender<T>(task: () => Promise<T>): Promise<T> {
  const result = renderChain.then(task, task)
  // Keep the chain alive even if a task rejects.
  renderChain = result.then(
    () => undefined,
    () => undefined,
  )
  return result
}

/** Read a design token's concrete value for the current theme. */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Track the `.dark` class on <html> so diagrams re-render on theme change. */
function useIsDark(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )
  useEffect(() => {
    const el = document.documentElement
    const observer = new MutationObserver(() =>
      setIsDark(el.classList.contains('dark')),
    )
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

/**
 * Renders a ```mermaid code fence as a diagram. Mermaid is loaded lazily (only
 * when a diagram is present) and runs entirely in the browser, so the no-backend
 * guarantee holds. `securityLevel: 'strict'` sanitizes the generated SVG, and
 * theme variables are pulled from the design tokens so it matches both themes.
 * The rendered diagram can be zoomed (buttons or Ctrl/Cmd + wheel) and panned by
 * dragging, so small diagrams can be read closely. On any error it falls back
 * to showing the raw source.
 */
export function MermaidDiagram({ code }: MermaidDiagramProps) {
  const isDark = useIsDark()
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  // Zoom + pan state.
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ px: 0, py: 0, x: 0, y: 0 })

  useEffect(() => {
    let cancelled = false

    // Renders are serialized (see queueRender) and use a fresh unique id each
    // time, so concurrent diagrams and re-renders never collide.
    void queueRender(async () => {
      const mermaid = (await import('mermaid')).default
      if (cancelled) return
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        fontFamily: 'Poppins, ui-sans-serif, system-ui, sans-serif',
        themeVariables: {
          background: cssVar('--color-surface'),
          primaryColor: cssVar('--color-surface-muted'),
          primaryBorderColor: cssVar('--color-accent'),
          primaryTextColor: cssVar('--color-fg'),
          secondaryColor: cssVar('--color-bg'),
          tertiaryColor: cssVar('--color-bg'),
          lineColor: cssVar('--color-fg-muted'),
          textColor: cssVar('--color-fg'),
          fontSize: '14px',
        },
      })
      const { svg: rendered } = await mermaid.render(
        `mermaid-${createId()}`,
        code,
      )
      if (!cancelled) {
        setSvg(rendered)
        setFailed(false)
      }
    }).catch(() => {
      if (!cancelled) setFailed(true)
    })

    return () => {
      cancelled = true
    }
  }, [code, isDark])

  const zoomIn = useCallback(() => setScale((s) => clamp(s + STEP)), [])
  const zoomOut = useCallback(() => setScale((s) => clamp(s - STEP)), [])
  const reset = useCallback(() => {
    setScale(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const onWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    setScale((s) => clamp(s + (e.deltaY < 0 ? STEP : -STEP)))
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      setIsDragging(true)
      dragStart.current = { px: e.clientX, py: e.clientY, x: pan.x, y: pan.y }
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [pan],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!isDragging) return
      setPan({
        x: dragStart.current.x + (e.clientX - dragStart.current.px),
        y: dragStart.current.y + (e.clientY - dragStart.current.py),
      })
    },
    [isDragging],
  )

  const endDrag = useCallback(() => setIsDragging(false), [])

  if (failed) {
    return (
      <div
        data-mermaid-state="failed"
        className="pdf-atomic not-prose my-6 overflow-hidden rounded-xl border border-[color:var(--color-border)]"
      >
        <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] px-4 py-2 text-xs font-medium text-[color:var(--color-fg-muted)]">
          Diagram Could Not Be Rendered
        </div>
        <pre className="overflow-x-auto px-4 py-3 font-mono text-[13px] text-[color:var(--color-fg-muted)]">
          {code}
        </pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div
        data-mermaid-state="rendering"
        className="pdf-atomic not-prose my-6 grid min-h-[120px] place-items-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-sm text-[color:var(--color-fg-faint)]"
      >
        Rendering Diagram
      </div>
    )
  }

  return (
    <div
      data-mermaid-state="done"
      className="pdf-atomic not-prose group relative my-6 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
    >
      {/* Zoom toolbar */}
      <div className="pdf-hide absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-0.5 shadow-sm">
        <IconButton
          aria-label="Zoom out"
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
        >
          <ZoomOut size={16} aria-hidden="true" />
        </IconButton>
        <span className="w-10 text-center font-mono text-xs tabular-nums text-[color:var(--color-fg-muted)]">
          {Math.round(scale * 100)}%
        </span>
        <IconButton
          aria-label="Zoom in"
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
        >
          <ZoomIn size={16} aria-hidden="true" />
        </IconButton>
        <IconButton aria-label="Reset zoom" onClick={reset}>
          <Maximize size={16} aria-hidden="true" />
        </IconButton>
      </div>

      {/* Viewport */}
      <div
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className={`flex touch-none justify-center overflow-hidden p-5 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
          }}
          className="[&_svg]:h-auto [&_svg]:max-w-full"
          // Mermaid output is sanitized (securityLevel: 'strict'); this is a
          // library-generated SVG, not raw user HTML.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  )
}
