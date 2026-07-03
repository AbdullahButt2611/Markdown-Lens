import { ACCEPT_ATTR } from './file'

/**
 * Open the native file dialog and hand selected files to `onFiles`.
 * Uses a detached <input> so no element needs to live in the DOM — shared by
 * the DropZone browse button and the sidebar "add files" action.
 */
export function openFileDialog(onFiles: (files: File[]) => void): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = ACCEPT_ATTR
  input.multiple = true
  input.addEventListener('change', () => {
    if (input.files && input.files.length > 0) {
      onFiles(Array.from(input.files))
    }
  })
  input.click()
}
