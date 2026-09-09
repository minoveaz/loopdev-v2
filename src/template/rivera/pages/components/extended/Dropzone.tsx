import { useRef, useState } from "react";
import { Upload, FileIcon, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer, PageHeader } from "@/components/common";
import { Showcase } from "@/template/rivera/features/ui-kit/Showcase";
import { Button } from "@/components/ui/button";

export default function DropzonePage() {
  const ref = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [over, setOver] = useState(false);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
    toast.success(`${next.length} file(s) added (mock)`);
  };

  return (
    <PageContainer width="narrow">
      <PageHeader eyebrow="Components" title="Dropzone" description="Mock file uploader — files stay in browser memory only." />
      <Showcase title="Upload" hint="mock">
        <div
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); onFiles(e.dataTransfer.files); }}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition ${over ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
        >
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm">Drag & drop files here, or</p>
          <Button variant="outline" onClick={() => ref.current?.click()}>Browse files</Button>
          <input ref={ref} type="file" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
        {files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <span className="flex items-center gap-2 truncate"><FileIcon className="h-4 w-4 text-muted-foreground" /> {f.name}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Showcase>
    </PageContainer>
  );
}