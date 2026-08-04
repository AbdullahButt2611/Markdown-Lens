/**
 * Shared constants for the vector PDF export. Colors mirror the app's light
 * design tokens (PDFs print on white paper); font sizes are the exact points
 * requested for the document hierarchy.
 */

export const PDF_COLORS = {
  fg: '#2b2a26',
  muted: '#6b6a63',
  faint: '#93918a',
  accent: '#c15f3c',
  border: '#e7e4da',
  surfaceMuted: '#edeae0',
  markBg: '#fde68a',
  markFg: '#2b2a26',
  // Code block keeps its dark theme, matching the reading view.
  codeBg: '#1c1b19',
  codeHeaderBg: '#161513',
  codeBorder: '#33312c',
  codeLabel: '#8f8c82',
  dotRed: '#e0997a',
  dotAmber: '#d8a657',
  dotGreen: '#9fb07f',
  codeFg: '#e9e6dd',
  codeComment: '#7d7a70',
  codeKeyword: '#e0997a',
  codeString: '#9fb07f',
  codeNumber: '#d8a657',
  codeFunc: '#82b3aa',
  codePunct: '#b6b3a9',
} as const

/** Point sizes for the type scale (as requested). */
export const PDF_SIZES = {
  h1: 14,
  h2: 13,
  h3: 12,
  h4: 11,
  h5: 10,
  h6: 10,
  normal: 10,
  code: 9,
  small: 9,
  footer: 8,
} as const

/** CSS pixels → PDF points (96dpi → 72pt). Used to size embedded images. */
export const PX_TO_PT = 72 / 96
