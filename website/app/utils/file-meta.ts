/**
 * The metadata the file-storage demo stores next to a storage id. `useUpload`
 * and `useUploadQueue` both hand back a `Blob`, and only a `File` carries a
 * name — so the two demos read it the same way.
 */
export function fileMeta(file: Blob) {
  const named = file instanceof File ? file : undefined
  return { name: named?.name ?? 'blob', type: file.type, size: file.size }
}
