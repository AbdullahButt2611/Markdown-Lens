/** Generate a stable unique id. Browser-native, no dependency. */
export function createId(): string {
  return crypto.randomUUID()
}
