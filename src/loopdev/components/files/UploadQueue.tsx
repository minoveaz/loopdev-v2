import type { FilesDropzoneItem } from "./FilesDropzone";
import { UploadItem } from "./UploadItem";

export function UploadQueue({ items, onRemove }: { items: FilesDropzoneItem[]; onRemove?: (file: File) => void }) {
  return <div className="space-y-2" aria-label="Upload queue">{items.map((item) => <UploadItem key={`${item.file.name}-${item.file.lastModified}`} item={item} onRemove={onRemove ? () => onRemove(item.file) : undefined} />)}</div>;
}
