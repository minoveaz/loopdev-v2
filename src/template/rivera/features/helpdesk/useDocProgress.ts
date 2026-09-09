import { useEffect, useState, useCallback } from "react";

const KEY = "rivera.doc-progress.v1";

type ProgressMap = Record<string, number>;

function read(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(map: ProgressMap) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("doc-progress-change"));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export function articleKey(sectionSlug: string, articleSlug: string) {
  return `${sectionSlug}/${articleSlug}`;
}

/** Subscribe to all progress values. Updates on storage events and same-tab writes. */
export function useAllDocProgress(): ProgressMap {
  const [map, setMap] = useState<ProgressMap>(() => (typeof window === "undefined" ? {} : read()));
  useEffect(() => {
    const sync = () => setMap(read());
    window.addEventListener("storage", sync);
    window.addEventListener("doc-progress-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("doc-progress-change", sync);
    };
  }, []);
  return map;
}

/** Returns [progress 0..1, setProgress]. setProgress only writes if it advances by ≥ 1%. */
export function useDocProgress(key: string): [number, (v: number) => void] {
  const [value, setValue] = useState<number>(() => (typeof window === "undefined" ? 0 : read()[key] ?? 0));

  useEffect(() => {
    const sync = () => setValue(read()[key] ?? 0);
    window.addEventListener("storage", sync);
    window.addEventListener("doc-progress-change", sync);
    sync();
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("doc-progress-change", sync);
    };
  }, [key]);

  const set = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      const map = read();
      const prev = map[key] ?? 0;
      // Only persist forward progress, with a small threshold to avoid thrash.
      if (clamped <= prev + 0.005 && clamped < 1) return;
      map[key] = clamped >= 0.98 ? 1 : clamped;
      write(map);
      setValue(map[key]);
    },
    [key],
  );

  return [value, set];
}