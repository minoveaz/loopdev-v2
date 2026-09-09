import { useMemo, useRef, useState } from "react";
import {
  Archive, ChevronRight, Code2, FileAudio, FileSpreadsheet, FileText,
  FileVideo, Folder, HardDrive, Image as ImageIcon, MoreHorizontal,
  Pencil, Presentation, Star, Trash2, Upload,
} from "lucide-react";
import { ConfirmDialog, DataCard, EmptyState, FilterDropdown, PageContainer, PageHeader, SearchInput, StatCard } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { filesStore, formatBytes, STORAGE_LIMIT, type FileItem, type FileKind } from "@/template/rivera/data/mockFiles";
import { usersStore } from "@/template/rivera/data";
import { useLocalStore } from "@/lib/localStore";
import { formatRelative, getInitials } from "@/lib/formatters";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const KIND_META: Record<FileKind, { icon: typeof Folder; tone: string; label: string }> = {
  folder:       { icon: Folder,         tone: "bg-info-soft text-info",        label: "Folder" },
  image:        { icon: ImageIcon,      tone: "bg-accent-soft text-accent",    label: "Image" },
  document:     { icon: FileText,       tone: "bg-primary-soft text-primary",  label: "Document" },
  spreadsheet:  { icon: FileSpreadsheet,tone: "bg-success-soft text-success",  label: "Spreadsheet" },
  presentation: { icon: Presentation,   tone: "bg-gold-soft text-gold",        label: "Presentation" },
  video:        { icon: FileVideo,      tone: "bg-destructive-soft text-destructive", label: "Video" },
  audio:        { icon: FileAudio,      tone: "bg-info-soft text-info",        label: "Audio" },
  archive:      { icon: Archive,        tone: "bg-muted text-muted-foreground",label: "Archive" },
  code:         { icon: Code2,          tone: "bg-primary-soft text-primary",  label: "Code" },
  other:        { icon: FileText,       tone: "bg-muted text-muted-foreground",label: "File" },
};

const ALL_KINDS: FileKind[] = ["folder", "image", "document", "spreadsheet", "presentation", "video", "audio", "archive", "code", "other"];
const UPLOADABLE_KINDS: FileKind[] = ALL_KINDS.filter((k) => k !== "folder");

function inferKindFromName(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "heic"].includes(ext)) return "image";
  if (["pdf", "doc", "docx", "txt", "md", "rtf"].includes(ext)) return ext === "md" ? "code" : "document";
  if (["xls", "xlsx", "csv", "numbers"].includes(ext)) return "spreadsheet";
  if (["ppt", "pptx", "key"].includes(ext)) return "presentation";
  if (["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) return "video";
  if (["mp3", "wav", "m4a", "flac", "aac"].includes(ext)) return "audio";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "archive";
  if (["js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "json", "yml", "yaml", "html", "css"].includes(ext)) return "code";
  return "other";
}

export default function FilesPage() {
  const { trail } = useBreadcrumbs();
  const { toast } = useToast();
  const files = useLocalStore(filesStore);
  const users = useLocalStore(usersStore);
  const userMap = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const [parentId, setParentId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<string[]>([]);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [renaming, setRenaming] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState<FileItem | null>(null);

  // Breadcrumb trail of folders.
  const folderTrail = useMemo(() => {
    const list: FileItem[] = [];
    let cur = parentId;
    while (cur) {
      const f = files.find((x) => x.id === cur);
      if (!f) break;
      list.unshift(f);
      cur = f.parentId;
    }
    return list;
  }, [parentId, files]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files
      .filter((f) => f.parentId === parentId)
      .filter((f) => (kindFilter.length ? kindFilter.includes(f.kind) : true))
      .filter((f) => (q ? f.name.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        // Folders first, then by name.
        if (a.kind === "folder" && b.kind !== "folder") return -1;
        if (a.kind !== "folder" && b.kind === "folder") return 1;
        return a.name.localeCompare(b.name);
      });
  }, [files, parentId, search, kindFilter]);

  const totalUsed = useMemo(
    () => files.filter((f) => f.kind !== "folder").reduce((acc, f) => acc + f.size, 0),
    [files],
  );
  const usedPct = Math.min(100, (totalUsed / STORAGE_LIMIT) * 100);

  const stats = useMemo(() => ({
    folders: files.filter((f) => f.kind === "folder").length,
    files: files.filter((f) => f.kind !== "folder").length,
    starred: files.filter((f) => f.starred).length,
  }), [files]);

  const handleSimulatedUpload = (name: string, kind: FileKind, sizeMB: number) => {
    filesStore.create({
      name: name.trim() || "Untitled",
      kind,
      size: Math.max(1, Math.round(sizeMB * 1024 * 1024)),
      parentId,
      starred: false,
      ownerId: "u_01",
    });
    setUploadOpen(false);
    toast({ title: "File uploaded", description: `${name} added to ${folderTrail[folderTrail.length - 1]?.name ?? "Files"}.` });
  };

  const toggleStar = (f: FileItem) => {
    filesStore.update(f.id, { starred: !f.starred });
  };

  const handleRename = (newName: string) => {
    if (!renaming || !newName.trim()) return;
    filesStore.update(renaming.id, { name: newName.trim() });
    toast({ title: "Renamed", description: `${renaming.name} → ${newName.trim()}` });
    setRenaming(null);
  };

  const handleDelete = () => {
    if (!deleting) return;
    // If deleting a folder, also remove its (mock) children recursively.
    const toDelete = new Set<string>([deleting.id]);
    let added = true;
    while (added) {
      added = false;
      for (const f of files) {
        if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          added = true;
        }
      }
    }
    for (const id of toDelete) filesStore.remove(id);
    toast({ title: "Deleted", description: `${deleting.name} removed.` });
    setDeleting(null);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Apps"
        title="File Manager"
        description="Browse mock folders and files. Uploads are simulated locally."
        breadcrumbs={trail.length ? trail : [{ label: "Apps" }, { label: "File Manager" }]}
        actions={
          <Button onClick={() => setUploadOpen(true)} className="gap-1.5">
            <Upload className="h-3.5 w-3.5" /> Upload file
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard label="Folders" value={String(stats.folders)} icon={Folder} accent="info" compact />
          <StatCard label="Files" value={String(stats.files)} icon={FileText} accent="primary" compact />
          <StatCard label="Starred" value={String(stats.starred)} icon={Star} accent="gold" compact />
        </div>

        <DataCard className="lg:row-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Storage usage</p>
              <p className="font-display text-lg font-semibold text-foreground">
                {formatBytes(totalUsed)} <span className="text-sm font-normal text-muted-foreground">/ {formatBytes(STORAGE_LIMIT)}</span>
              </p>
            </div>
          </div>
          <Progress value={usedPct} className="mt-4 h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            {usedPct.toFixed(1)}% used · {formatBytes(STORAGE_LIMIT - totalUsed)} remaining
          </p>

          <ul className="mt-5 space-y-2.5 text-xs">
            {(["document", "image", "video", "presentation", "spreadsheet", "audio", "archive"] as FileKind[]).map((k) => {
              const meta = KIND_META[k];
              const list = files.filter((f) => f.kind === k);
              const sum = list.reduce((acc, f) => acc + f.size, 0);
              const pct = totalUsed > 0 ? (sum / totalUsed) * 100 : 0;
              const Icon = meta.icon;
              return (
                <li key={k}>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-foreground">
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded-md", meta.tone)}>
                        <Icon className="h-3 w-3" />
                      </span>
                      {meta.label}s
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">{formatBytes(sum)}</span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </DataCard>

        <DataCard flush className="lg:col-start-1">
          {/* Toolbar */}
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Breadcrumbs" className="flex items-center gap-1 text-sm">
              <button
                onClick={() => setParentId(null)}
                className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 transition-fast hover:bg-muted",
                  parentId === null ? "font-medium text-foreground" : "text-muted-foreground")}
              >
                <Folder className="h-3.5 w-3.5" /> Files
              </button>
              {folderTrail.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1">
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <button
                    onClick={() => setParentId(f.id)}
                    className={cn("rounded px-1.5 py-0.5 transition-fast hover:bg-muted",
                      f.id === parentId ? "font-medium text-foreground" : "text-muted-foreground")}
                  >
                    {f.name}
                  </button>
                </span>
              ))}
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={search} onValueChange={setSearch} placeholder="Search files…" size="sm" containerClassName="w-56" />
              <FilterDropdown
                label="Type" multiple value={kindFilter} onChange={setKindFilter} size="sm" align="end"
                options={ALL_KINDS.map((k) => ({ label: KIND_META[k].label, value: k }))}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="p-4">
            {visible.length === 0 ? (
              <EmptyState
                icon={Folder}
                title={search || kindFilter.length ? "No matches" : "This folder is empty"}
                description={search || kindFilter.length ? "Try clearing search or filters." : "Upload a file to get started."}
                action={<Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5"><Upload className="h-3.5 w-3.5" /> Upload</Button>}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visible.map((f) => {
                  const meta = KIND_META[f.kind];
                  const Icon = meta.icon;
                  const owner = userMap.get(f.ownerId);
                  const isFolder = f.kind === "folder";
                  return (
                    <div
                      key={f.id}
                      onClick={() => isFolder && setParentId(f.id)}
                      className={cn(
                        "group relative flex flex-col surface-card-compact p-3 shadow-soft transition-smooth hover:-translate-y-0.5 surface-card-hover",
                        isFolder && "cursor-pointer",
                      )}
                    >
                      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-fast group-hover:opacity-100">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); toggleStar(f); }}
                          aria-label={f.starred ? "Unstar" : "Star"}
                        >
                          <Star className={cn("h-3.5 w-3.5", f.starred ? "fill-gold text-gold" : "text-muted-foreground")} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setRenaming(f)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleStar(f)}>
                              <Star className="mr-2 h-3.5 w-3.5" /> {f.starred ? "Unstar" : "Star"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleting(f)} className="text-destructive focus:text-destructive">
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {f.starred && (
                        <Star className="absolute left-2 top-2 h-3 w-3 fill-gold text-gold" />
                      )}

                      <div className={cn("mx-auto flex h-16 w-16 items-center justify-center rounded-xl", meta.tone)}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <p className="mt-3 truncate text-center text-sm font-medium text-foreground" title={f.name}>
                        {f.name}
                      </p>
                      <p className="mt-0.5 text-center text-[11px] text-muted-foreground">
                        {isFolder ? `${files.filter((x) => x.parentId === f.id).length} items` : formatBytes(f.size)}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                        <span className="truncate">{formatRelative(f.updatedAt)}</span>
                        {owner && (
                          <Avatar className="h-5 w-5 border border-border">
                            <AvatarFallback className="bg-primary-soft text-[8px] font-semibold text-primary">
                              {getInitials(owner.name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DataCard>
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={handleSimulatedUpload}
      />
      <RenameDialog
        item={renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        onSubmit={handleRename}
      />
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.name}?` : "Delete?"}
        description={
          deleting?.kind === "folder"
            ? "Deletes the folder and all of its contents in mock storage."
            : "Permanently removes the file from mock storage."
        }
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

/* ---------------- Upload dialog (simulated) ---------------- */

function UploadDialog({
  open, onOpenChange, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (name: string, kind: FileKind, sizeMB: number) => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<FileKind>("document");
  const [sizeMB, setSizeMB] = useState(2);

  const handleFilePick = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setName(file.name);
    setKind(inferKindFromName(file.name));
    setSizeMB(Math.max(0.01, Math.round((file.size / (1024 * 1024)) * 100) / 100));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, kind, sizeMB);
    setName(""); setKind("document"); setSizeMB(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Upload file</DialogTitle>
          <DialogDescription>
            Simulated upload — the file is added to mock storage only. Nothing is sent to a server.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card-muted/40 px-6 py-8 text-center transition-fast hover:border-primary/40 hover:bg-primary-soft/30">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Pick a file to simulate upload</p>
            <p className="text-xs text-muted-foreground">Only the name and size are read — file contents are discarded.</p>
            <input type="file" className="hidden" onChange={(e) => handleFilePick(e.target.files)} />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="up-name">File name</Label>
              <Input id="up-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand guidelines.pdf" />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as FileKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UPLOADABLE_KINDS.map((k) => (
                    <SelectItem key={k} value={k} className="capitalize">{k}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="up-size">Size (MB)</Label>
              <Input id="up-size" type="number" min={0.01} step={0.01} value={sizeMB} onChange={(e) => setSizeMB(Number(e.target.value))} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()} className="gap-1.5">
              <Upload className="h-3.5 w-3.5" /> Add to storage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Rename dialog ---------------- */

function RenameDialog({
  item, onOpenChange, onSubmit,
}: {
  item: FileItem | null;
  onOpenChange: (o: boolean) => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const open = !!item;

  // Sync local state when item changes.
  useMemoSync(item, (i) => setName(i?.name ?? ""));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Rename</DialogTitle>
          <DialogDescription>Update the file or folder name.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(name); }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="rn-name">Name</Label>
            <Input id="rn-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim()}>Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Tiny helper: run an effect when the input identity changes (used for syncing dialog state). */
function useMemoSync<T>(value: T, run: (v: T) => void) {
  const ref = useRef<T>(value);
  if (ref.current !== value) {
    ref.current = value;
    run(value);
  }
}