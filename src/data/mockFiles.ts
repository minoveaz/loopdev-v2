import type { Entity } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export type FileKind = "folder" | "image" | "document" | "spreadsheet" | "presentation" | "video" | "audio" | "archive" | "code" | "other";

export interface FileItem extends Entity {
  name: string;
  kind: FileKind;
  /** Bytes; folders use accumulated child size. */
  size: number;
  /** Optional folder id. `null` = at root. */
  parentId: string | null;
  starred: boolean;
  ownerId: string;
}

const KB = 1024;
const MB = 1024 * KB;

export const mockFiles: FileItem[] = [
  // Root folders
  { id: "f_brand",     name: "Brand assets",          kind: "folder",       size: 1.2 * 1024 * MB, parentId: null,    starred: true,  ownerId: "u_03", createdAt: ago(180), updatedAt: ago(2)   },
  { id: "f_clients",   name: "Clients",               kind: "folder",       size: 4.8 * 1024 * MB, parentId: null,    starred: true,  ownerId: "u_01", createdAt: ago(220), updatedAt: ago(1)   },
  { id: "f_marketing", name: "Marketing",             kind: "folder",       size: 612 * MB,        parentId: null,    starred: false, ownerId: "u_02", createdAt: ago(120), updatedAt: ago(4)   },
  { id: "f_archive",   name: "Archive 2025",          kind: "folder",       size: 2.1 * 1024 * MB, parentId: null,    starred: false, ownerId: "u_01", createdAt: ago(360), updatedAt: ago(40)  },
  { id: "f_finance",   name: "Finance",               kind: "folder",       size: 89 * MB,         parentId: null,    starred: false, ownerId: "u_10", createdAt: ago(140), updatedAt: ago(7)   },

  // Root files
  { id: "fi_01", name: "Q3 roadmap.pdf",              kind: "document",     size: 2.4 * MB,        parentId: null,    starred: true,  ownerId: "u_01", createdAt: ago(8),   updatedAt: ago(1)   },
  { id: "fi_02", name: "Atlas case study.pdf",        kind: "document",     size: 4.1 * MB,        parentId: null,    starred: false, ownerId: "u_02", createdAt: ago(20),  updatedAt: ago(2)   },
  { id: "fi_03", name: "Revenue forecast.xlsx",       kind: "spreadsheet",  size: 612 * KB,        parentId: null,    starred: false, ownerId: "u_05", createdAt: ago(12),  updatedAt: ago(1)   },
  { id: "fi_04", name: "Investor deck.pptx",          kind: "presentation", size: 18.7 * MB,       parentId: null,    starred: true,  ownerId: "u_01", createdAt: ago(30),  updatedAt: ago(3)   },
  { id: "fi_05", name: "Brand demo reel.mp4",         kind: "video",        size: 240 * MB,        parentId: null,    starred: false, ownerId: "u_03", createdAt: ago(45),  updatedAt: ago(10)  },
  { id: "fi_06", name: "Logo lockups.zip",            kind: "archive",      size: 36 * MB,         parentId: "f_brand", starred: false, ownerId: "u_03", createdAt: ago(60), updatedAt: ago(15)  },
  { id: "fi_07", name: "Hero shot.png",               kind: "image",        size: 6.8 * MB,        parentId: null,    starred: false, ownerId: "u_03", createdAt: ago(2),   updatedAt: ago(2)   },
  { id: "fi_08", name: "Onboarding script.md",        kind: "code",         size: 18 * KB,         parentId: null,    starred: false, ownerId: "u_04", createdAt: ago(5),   updatedAt: ago(0,4) },
  { id: "fi_09", name: "Podcast intro.mp3",           kind: "audio",        size: 4.2 * MB,        parentId: "f_marketing", starred: false, ownerId: "u_07", createdAt: ago(40), updatedAt: ago(20) },
  { id: "fi_10", name: "Notes.txt",                   kind: "other",        size: 8 * KB,          parentId: null,    starred: false, ownerId: "u_01", createdAt: ago(1),   updatedAt: ago(0,2) },
];

export const filesStore = createLocalStore<FileItem>({
  key: "data:files",
  seed: mockFiles,
  idPrefix: "fi",
});

/** Total storage limit (in bytes) — used by the Files page. */
export const STORAGE_LIMIT = 50 * 1024 * MB; // 50 GB

/** Format bytes as a human-readable string (e.g. "1.2 MB"). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / KB).toFixed(bytes < 10 * KB ? 1 : 0)} KB`;
  if (bytes < 1024 * MB) return `${(bytes / MB).toFixed(bytes < 10 * MB ? 1 : 0)} MB`;
  return `${(bytes / (1024 * MB)).toFixed(2)} GB`;
}