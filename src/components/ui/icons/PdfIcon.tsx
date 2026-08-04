import type { SVGProps } from 'react'

interface PdfIconProps extends SVGProps<SVGSVGElement> {
  /** Square size in px (matches the lucide-react `size` convention). */
  size?: number
}

/**
 * A "PDF file" glyph — an outlined document with a folded corner and a solid
 * "PDF" label band. lucide-react (the project's only icon set) has no PDF icon,
 * so this is a self-contained inline SVG. It draws with `currentColor`, so it
 * inherits the button's accent color, with white lettering on the band.
 */
export function PdfIcon({ size = 15, ...props }: PdfIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Document body with a folded top-right corner */}
      <path
        d="M6.5 2.75h7L18 7.25V19a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 6 19V4.25A1.5 1.5 0 0 1 7.5 2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M13.25 2.9V6.5A1.25 1.25 0 0 0 14.5 7.75H18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* "PDF" label band */}
      <rect x="5.25" y="12.25" width="13.5" height="6" rx="1.4" fill="currentColor" />
      <text
        x="12"
        y="16.9"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontSize="4.4"
        fontWeight="800"
        letterSpacing="0.2"
        fill="#ffffff"
      >
        PDF
      </text>
    </svg>
  )
}
