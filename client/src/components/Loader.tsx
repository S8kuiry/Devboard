/**
 * Universal loader.
 *
 * One spinner for the whole app — drop it in a button, a kanban column, a table
 * cell, or over the entire page. Colour rides on `currentColor`, so `accent` takes
 * any Tailwind text-* class and the SVG follows.
 *
 *   <Loader />                                   bare spinner, sits inline
 *   <Loader size="xs" accent="text-white" />     inside a button
 *   <Loader label="Loading tasks…" />            centred stack with a caption
 *   <Loader fullScreen label="Signing in…" />    dimmed overlay across the page
 */

export type LoaderSize = 'xs' | 'sm' | 'md' | 'lg'

interface LoaderProps {
  /** Visual scale. Stroke width scales with it so the ring stays even. */
  size?: LoaderSize
  /** Any Tailwind text-* class — drives the ring via currentColor. */
  accent?: string
  /** Optional caption. Its presence switches the layout to a centred stack. */
  label?: string
  /** Dimmed, blurred overlay covering the viewport. */
  fullScreen?: boolean
  /** Extra classes for the outermost element. */
  className?: string
}

const SIZES: Record<LoaderSize, { box: string; stroke: number; text: string; gap: string }> = {
  xs: { box: 'h-3.5 w-3.5', stroke: 3, text: 'text-[10px]', gap: 'gap-1.5' },
  sm: { box: 'h-5 w-5', stroke: 2.75, text: 'text-[11px]', gap: 'gap-2' },
  md: { box: 'h-6 w-6', stroke: 2.5, text: 'text-[11px]', gap: 'gap-2.5' },
  lg: { box: 'h-9 w-9', stroke: 2.25, text: 'text-xs', gap: 'gap-3' },
}

export default function Loader({
  size = 'md',
  accent = 'text-indigo-400',
  label,
  fullScreen = false,
  className = '',
}: LoaderProps) {
  const s = SIZES[size]

  const spinner = (
    <svg
      // motion-reduce slows the spin rather than freezing it — a stopped spinner
      // reads as "hung" instead of "loading".
      className={`${s.box} ${accent} animate-spin motion-reduce:[animation-duration:2.4s]`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      {/* Faint full ring, so the arc has a track to travel along */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={s.stroke} className="opacity-20" />
      {/* Quarter arc — the part the eye actually tracks */}
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth={s.stroke} strokeLinecap="round" />
    </svg>
  )

  // Bare spinner: no caption, no overlay. Stays inline so it can sit next to text.
  if (!label && !fullScreen) {
    return (
      <span role="status" className={`inline-flex ${className}`}>
        {spinner}
        <span className="sr-only">Loading</span>
      </span>
    )
  }

  const stack = (
    <div
      role="status"
      className={`flex flex-col items-center justify-center ${s.gap} ${fullScreen ? '' : className}`}
    >
      {spinner}
      {label && <p className={`${s.text} font-mono text-slate-500`}>{label}</p>}
      <span className="sr-only">{label ?? 'Loading'}</span>
    </div>
  )

  if (fullScreen) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm ${className}`}>
        {stack}
      </div>
    )
  }

  return stack
}
