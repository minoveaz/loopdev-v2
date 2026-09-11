import { useCallback, useEffect, useRef, useState } from "react";

interface UseFormLifecycleOptions {
  enabled?: boolean;
}

export function useFormLifecycle({ enabled = true }: UseFormLifecycleOptions = {}) {
  const dirtyRef = useRef(false);
  const [dirty, setDirty] = useState(false);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
  }, []);

  const markClean = useCallback(() => {
    dirtyRef.current = false;
    setDirty(false);
  }, []);

  const setDirtyState = useCallback((nextDirty: boolean) => {
    if (nextDirty) markDirty();
    else markClean();
  }, [markClean, markDirty]);

  useEffect(() => {
    if (!enabled) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  return {
    dirty,
    dirtyRef,
    markDirty,
    markClean,
    setDirty: setDirtyState,
  };
}
