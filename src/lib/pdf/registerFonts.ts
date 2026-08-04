import { Font } from '@react-pdf/renderer'
import merriweatherRegular from '../../assets/fonts/Merriweather-Regular.ttf'
import merriweatherBold from '../../assets/fonts/Merriweather-Bold.ttf'
import merriweatherItalic from '../../assets/fonts/Merriweather-Italic.ttf'
import poppinsRegular from '../../assets/fonts/Poppins-Regular.ttf'
import poppinsMedium from '../../assets/fonts/Poppins-Medium.ttf'
import poppinsSemiBold from '../../assets/fonts/Poppins-SemiBold.ttf'
import jetBrainsMonoRegular from '../../assets/fonts/JetBrainsMono-Regular.ttf'
import jetBrainsMonoBold from '../../assets/fonts/JetBrainsMono-Bold.ttf'

/**
 * Register the SAME fonts the reading view uses so the PDF matches on screen:
 * Merriweather (reading body + headings), Poppins (UI: tables, code header),
 * JetBrains Mono (code). react-pdf needs TTF/OTF (the app's woff2 files can't be
 * used), so static instances are bundled from src/assets/fonts and served as
 * same-origin assets — nothing is fetched from the network at runtime.
 */
let registered = false

export function registerPdfFonts(): void {
  if (registered) return
  registered = true

  Font.register({
    family: 'Merriweather',
    fonts: [
      { src: merriweatherRegular, fontWeight: 400 },
      { src: merriweatherBold, fontWeight: 700 },
      { src: merriweatherItalic, fontWeight: 400, fontStyle: 'italic' },
    ],
  })
  Font.register({
    family: 'Poppins',
    fonts: [
      { src: poppinsRegular, fontWeight: 400 },
      { src: poppinsMedium, fontWeight: 500 },
      { src: poppinsSemiBold, fontWeight: 600 },
    ],
  })
  Font.register({
    family: 'JetBrains Mono',
    fonts: [
      { src: jetBrainsMonoRegular, fontWeight: 400 },
      { src: jetBrainsMonoBold, fontWeight: 700 },
    ],
  })

  // Match the on-screen wrapping: break between words, never hyphenate.
  Font.registerHyphenationCallback((word) => [word])
}
