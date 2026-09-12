import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCrmContacts } from "@/loopdev/domains/crm/hooks/use-crm";

describe("useCrmContacts", () => {
  it("exposes cursor metadata and query results", async () => {
    const { result } = renderHook(() => useCrmContacts({ limit: 1 }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.contacts).toHaveLength(1);
    expect(result.current.nextCursor).toBe("1");
    expect(result.current.hasMore).toBe(true);
    expect(result.current.forbidden).toBe(false);
  });
});
