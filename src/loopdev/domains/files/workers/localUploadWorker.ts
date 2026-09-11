export interface LocalUploadProgress {
  state: "queued" | "uploading" | "processing" | "ready" | "failed" | "cancelled";
  progress: number;
}

export async function processLocalUpload(
  file: File,
  onProgress?: (progress: LocalUploadProgress) => void,
  signal?: AbortSignal,
): Promise<File> {
  onProgress?.({ state: "queued", progress: 0 });
  const buffer = await file.arrayBuffer();
  const chunkSize = Math.max(1, Math.ceil(buffer.byteLength / 8));
  for (let offset = 0; offset < buffer.byteLength; offset += chunkSize) {
    if (signal?.aborted) {
      onProgress?.({ state: "cancelled", progress: Math.round((offset / Math.max(buffer.byteLength, 1)) * 100) });
      throw new DOMException("Upload cancelled.", "AbortError");
    }
    await new Promise((resolve) => setTimeout(resolve, 0));
    onProgress?.({ state: "uploading", progress: Math.min(90, Math.round(((offset + chunkSize) / Math.max(buffer.byteLength, 1)) * 90)) });
  }
  onProgress?.({ state: "processing", progress: 95 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  onProgress?.({ state: "ready", progress: 100 });
  return file;
}
