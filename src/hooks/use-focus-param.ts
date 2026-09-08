import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Reads the `?focus=<id>` query parameter and invokes `onFocus` once with the
 * resolved entity. Useful for deep-linking from notifications, activity feeds,
 * or external surfaces directly into a row's drawer/dialog.
 *
 * After the callback runs, the `focus` param is removed from the URL so a
 * refresh doesn't re-trigger the action.
 */
export function useFocusParam<T extends { id: string }>(
  items: readonly T[],
  onFocus: (item: T) => void,
  options?: { paramName?: string; scrollToId?: (id: string) => string | undefined },
) {
  const location = useLocation();
  const navigate = useNavigate();
  const paramName = options?.paramName ?? "focus";

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get(paramName);
    if (!id || items.length === 0) return;
    const match = items.find((it) => it.id === id);
    if (!match) return;

    onFocus(match);

    // Highlight + scroll to the row, if a scroll id resolver was provided.
    const scrollId = options?.scrollToId?.(id);
    if (scrollId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("ring-2", "ring-primary/60", "transition-all");
          setTimeout(() => el.classList.remove("ring-2", "ring-primary/60"), 1800);
        }
      });
    }

    // Remove the focus param so the action is not re-fired on re-render.
    params.delete(paramName);
    const next = params.toString();
    navigate(
      { pathname: location.pathname, search: next ? `?${next}` : "", hash: location.hash },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, location.search]);
}