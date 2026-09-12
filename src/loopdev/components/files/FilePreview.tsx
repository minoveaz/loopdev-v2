import { useEffect, useState } from "react";

export function FilePreview({ file, className = "" }: { file: File | null; className?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  if (!file || !url) return <div className={`rounded border border-dashed p-8 text-center text-sm text-muted-foreground ${className}`}>No preview available</div>;
  if (file.type.startsWith("image/")) return <img src={url} alt={file.name} className={`max-h-[60vh] max-w-full object-contain ${className}`} />;
  if (file.type === "application/pdf") return <iframe title={`Preview of ${file.name}`} src={url} className={`h-[60vh] w-full rounded border ${className}`} />;
  return <div className={`rounded border border-dashed p-8 text-center text-sm text-muted-foreground ${className}`}>Preview is not available for this format.</div>;
}
