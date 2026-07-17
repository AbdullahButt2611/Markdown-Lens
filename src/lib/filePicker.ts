import { ACCEPT_ATTR } from './file'

/**
 * Open the native file dialog and hand selected files to `onFiles`.
 * Uses a detached <input> so no element needs to live in the DOM — shared by
 * the DropZone browse button, the sidebar "add files" action, and the image
 * upload modal (which passes an image `accept`).
 */
export function openFileDialog(
  onFiles: (files: File[]) => void,
  accept: string = ACCEPT_ATTR,
): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = accept
  input.multiple = true
  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      onFiles(Array.from(input.files))
    }
  })
  input.click()
}
