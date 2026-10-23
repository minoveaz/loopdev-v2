import { describe, expect, it, vi } from "vitest";
import type { AuthResult, PlatformUser } from "../../../../packages/contracts/src/auth-port";
import type { UpdatePlatformProfileInput } from "../../../../packages/contracts/src/account-profile";
import {
  createPlatformAvatarReference,
  PROFILE_AVATAR_MAX_BYTES,
  validateProfileAvatarUpload,
} from "../../../../packages/contracts/src/private-user-files";
import {
  createSupabasePrivateUserFilesAdapter,
  type PrivateUserFilesSupabaseClient,
} from "../../../../packages/contracts/src/private-user-files-supabase";
import { createProfileAvatarAdapter } from "../../../../packages/contracts/src/profile-avatar-adapter";

const USER_ID = "00000000-0000-4000-8000-000000000001";
const FILE_ID = "00000000-0000-4000-8000-000000000002";

function profileUser(avatarUrl: string | null): PlatformUser {
  return {
    id: USER_ID,
    email: "user@example.test",
    fullName: "Ada",
    avatarUrl,
    isSuperAdmin: false,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-11T00:00:00.000Z",
  };
}

interface QueryState {
  table: string;
  action: "insert" | "update" | "delete" | "select";
  payload?: unknown;
  filters: Array<[string, unknown]>;
}

interface MockOptions {
  versionInsertError?: string;
  removeError?: string;
}

function createSupabaseMock(options: MockOptions = {}) {
  const queries: QueryState[] = [];
  const uploadCalls: Array<{ path: string; contentType?: string }> = [];
  const removeCalls: string[][] = [];
  const signCalls: Array<{ path: string; expiresIn: number }> = [];

  const auth = {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: USER_ID } } },
      error: null,
    }),
  };

  const storage = {
    from: vi.fn(() => ({
      upload: vi.fn(async (path: string, _content: Blob, fileOptions: { contentType?: string }) => {
        uploadCalls.push({ path, contentType: fileOptions.contentType });
        return { data: { path }, error: null };
      }),
      remove: vi.fn(async (paths: string[]) => {
        removeCalls.push(paths);
        return { data: [], error: options.removeError ? { message: options.removeError } : null };
      }),
      createSignedUrl: vi.fn(async (path: string, expiresIn: number) => {
        signCalls.push({ path, expiresIn });
        return { data: { signedUrl: "https://private.example.test/signed" }, error: null };
      }),
    })),
  };

  const from = vi.fn((table: string) => {
    const state: QueryState = { table, action: "select", filters: [] };
    queries.push(state);
    const response = () => {
      if (state.table === "platform_file_upload_sessions" && state.action === "insert") {
        return { data: { id: FILE_ID }, error: null };
      }
      if (
        state.table === "platform_file_versions" &&
        state.action === "insert" &&
        options.versionInsertError
      ) {
        return { data: null, error: { message: options.versionInsertError } };
      }
      if (state.table === "platform_file_upload_sessions" && state.action === "update") {
        return { data: { id: FILE_ID }, error: null };
      }
      if (state.table === "platform_files" && state.action === "select") {
        return {
          data: {
            storage_path: `users/${USER_ID}/avatars/${FILE_ID}`,
            media_type: "image/png",
          },
          error: null,
        };
      }
      if (state.table === "platform_files" && state.action === "update") {
        return { data: { id: FILE_ID }, error: null };
      }
      return { data: null, error: null };
    };

    const query: Record<string, (...args: unknown[]) => unknown> = {};
    query.insert = vi.fn((payload: unknown) => {
      state.action = "insert";
      state.payload = payload;
      return query;
    });
    query.update = vi.fn((payload: unknown) => {
      state.action = "update";
      state.payload = payload;
      return query;
    });
    query.delete = vi.fn(() => {
      state.action = "delete";
      return query;
    });
    query.select = vi.fn(() => query);
    query.eq = vi.fn((column: unknown, value: unknown) => {
      state.filters.push([String(column), value]);
      return query;
    });
    query.single = vi.fn(async () => response());
    query.maybeSingle = vi.fn(async () => response());
    query.then = (resolve: (value: ReturnType<typeof response>) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(response()).then(resolve, reject);
    return query;
  });

  const client = { auth, storage, from } as unknown as PrivateUserFilesSupabaseClient;
  return { client, queries, uploadCalls, removeCalls, signCalls };
}

function pngBlob(size = 8): Blob {
  const header = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return new Blob([header, new Uint8Array(Math.max(0, size - header.length))], { type: "image/png" });
}

describe("user-owned profile avatar Files adapter", () => {
  it("validates the file name, size, declared media type and image signature", async () => {
    expect(await validateProfileAvatarUpload({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: pngBlob(),
    })).toBeNull();
    expect(await validateProfileAvatarUpload({
      fileName: "../avatar.png",
      mediaType: "image/png",
      content: pngBlob(),
    })).toContain("valid file name");
    expect(await validateProfileAvatarUpload({
      fileName: "avatar\u0000.png",
      mediaType: "image/png",
      content: pngBlob(),
    })).toContain("valid file name");
    expect(await validateProfileAvatarUpload({
      fileName: "avatar.svg",
      mediaType: "image/svg+xml",
      content: new Blob(["<svg/>"], { type: "image/svg+xml" }),
    })).toContain("JPEG, PNG, or WebP");
    expect(await validateProfileAvatarUpload({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: new Blob([new Uint8Array(PROFILE_AVATAR_MAX_BYTES + 1)], { type: "image/png" }),
    })).toContain("5 MB");
    expect(await validateProfileAvatarUpload({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: new Blob(["not a png"], { type: "image/png" }),
    })).toContain("does not match");
  });

  it("uploads under the authenticated user and stores only the opaque avatar reference", async () => {
    const mock = createSupabaseMock();
    const adapter = createSupabasePrivateUserFilesAdapter(mock.client);
    const result = await adapter.uploadProfileAvatar({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: pngBlob(),
    });

    expect(result).toMatchObject({
      success: true,
      data: {
        id: FILE_ID,
        reference: createPlatformAvatarReference(FILE_ID),
        fileName: "avatar.png",
        mediaType: "image/png",
      },
    });
    expect(mock.queries.find((query) => query.table === "platform_file_upload_sessions" && query.action === "insert")?.payload)
      .toMatchObject({ owner_user_id: USER_ID, created_by: USER_ID, status: "pending" });
    expect(mock.queries.find((query) => query.table === "platform_files" && query.action === "insert")?.payload)
      .toMatchObject({
        id: FILE_ID,
        organization_id: null,
        owner_user_id: USER_ID,
        relation_type: "profile_avatar",
        relation_id: USER_ID,
      });
    expect(mock.uploadCalls[0]?.path).toBe(`users/${USER_ID}/avatars/${FILE_ID}`);
  });

  it("cleans up uploaded metadata and object when version persistence fails", async () => {
    const mock = createSupabaseMock({ versionInsertError: "version write failed" });
    const adapter = createSupabasePrivateUserFilesAdapter(mock.client);

    const result = await adapter.uploadProfileAvatar({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: pngBlob(),
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: "FILE_UPLOAD_FAILED", message: "version write failed" },
    });
    expect(mock.queries.some((query) => query.table === "platform_files" && query.action === "delete")).toBe(true);
    expect(mock.removeCalls).toEqual([[`users/${USER_ID}/avatars/${FILE_ID}`]]);
    expect(mock.queries.find((query) =>
      query.table === "platform_file_upload_sessions" &&
      query.action === "update" &&
      typeof query.payload === "object" &&
      query.payload !== null &&
      "status" in query.payload,
    )?.payload).toMatchObject({ status: "failed" });
  });

  it("issues short-lived signed previews scoped to the current owner", async () => {
    const mock = createSupabaseMock();
    const adapter = createSupabasePrivateUserFilesAdapter(mock.client);
    const result = await adapter.getProfileAvatarPreview(createPlatformAvatarReference(FILE_ID));

    expect(result).toMatchObject({ success: true, data: { url: "https://private.example.test/signed" } });
    expect(mock.queries.find((query) => query.table === "platform_files" && query.action === "select")?.filters)
      .toEqual(expect.arrayContaining([
        ["id", FILE_ID],
        ["owner_user_id", USER_ID],
        ["relation_type", "profile_avatar"],
        ["relation_id", USER_ID],
        ["status", "active"],
      ]));
    expect(mock.signCalls).toEqual([{
      path: `users/${USER_ID}/avatars/${FILE_ID}`,
      expiresIn: 300,
    }]);
  });

  it("deletes by soft-marking only the owner's avatar metadata", async () => {
    const mock = createSupabaseMock();
    const adapter = createSupabasePrivateUserFilesAdapter(mock.client);
    const result = await adapter.deleteProfileAvatar(createPlatformAvatarReference(FILE_ID));
    const deletion = mock.queries.find((query) => query.table === "platform_files" && query.action === "update");

    expect(result).toEqual({ success: true, data: undefined });
    expect(deletion?.payload).toMatchObject({ status: "deleted" });
    expect(deletion?.filters).toEqual(expect.arrayContaining([
      ["id", FILE_ID],
      ["owner_user_id", USER_ID],
      ["relation_type", "profile_avatar"],
      ["relation_id", USER_ID],
      ["status", "active"],
    ]));
    expect(mock.removeCalls).toHaveLength(0);
  });

  it("physically removes an orphaned object before marking its metadata deleted", async () => {
    const mock = createSupabaseMock();
    const adapter = createSupabasePrivateUserFilesAdapter(mock.client);
    const result = await adapter.discardProfileAvatar(createPlatformAvatarReference(FILE_ID));

    expect(result).toEqual({ success: true, data: undefined });
    expect(mock.removeCalls).toEqual([[`users/${USER_ID}/avatars/${FILE_ID}`]]);
    expect(mock.queries.find((query) =>
      query.table === "platform_files" &&
      query.action === "update" &&
      typeof query.payload === "object" &&
      query.payload !== null &&
      "status" in query.payload,
    )?.payload).toMatchObject({ status: "deleted" });
  });

  it("keeps cleanup errors visible when storage removal fails", async () => {
    const mock = createSupabaseMock({ removeError: "storage delete failed" });
    const adapter = createSupabasePrivateUserFilesAdapter(mock.client);

    expect(await adapter.discardProfileAvatar(createPlatformAvatarReference(FILE_ID))).toMatchObject({
      success: false,
      error: { code: "FILE_CLEANUP_FAILED", message: "storage delete failed" },
    });
    expect(mock.queries.some((query) =>
      query.table === "platform_files" &&
      query.action === "update" &&
      typeof query.payload === "object" &&
      query.payload !== null &&
      "status" in query.payload,
    )).toBe(false);
  });

  it("updates the canonical profile after upload, then removes the previous avatar", async () => {
    const previousReference = createPlatformAvatarReference("00000000-0000-4000-8000-000000000008");
    const updateProfile = vi.fn(async (input: UpdatePlatformProfileInput): Promise<AuthResult<PlatformUser>> => ({
      success: true,
      data: profileUser(input.avatarUrl ?? null),
    }));
    const files = {
      uploadProfileAvatar: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: FILE_ID,
          reference: createPlatformAvatarReference(FILE_ID),
          fileName: "avatar.png",
          mediaType: "image/png",
          byteSize: 8,
        },
      }),
      getProfileAvatarPreview: vi.fn().mockResolvedValue({ success: true, data: { url: "signed", expiresAt: "2026-10-11T00:05:00.000Z" } }),
      deleteProfileAvatar: vi.fn().mockResolvedValue({ success: true, data: undefined }),
      discardProfileAvatar: vi.fn().mockResolvedValue({ success: true, data: undefined }),
    };
    const adapter = createProfileAvatarAdapter({ updateProfile }, files);

    const result = await adapter.updateAvatar({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: pngBlob(),
      mutationId: "avatar-mutation-1",
      previousAvatarReference: previousReference,
    });

    expect(updateProfile).toHaveBeenCalledWith({
      avatarUrl: createPlatformAvatarReference(FILE_ID),
      mutationId: "avatar-mutation-1",
    });
    expect(files.deleteProfileAvatar).toHaveBeenCalledWith(previousReference);
    expect(result).toMatchObject({ success: true, data: { cleanup: { previousAvatar: { success: true } } } });
  });

  it("compensates a new upload when the canonical profile update fails", async () => {
    const updateProfile = vi.fn(async (): Promise<AuthResult<PlatformUser>> => ({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "profile update unavailable" },
    }));
    const files = {
      uploadProfileAvatar: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: FILE_ID,
          reference: createPlatformAvatarReference(FILE_ID),
          fileName: "avatar.png",
          mediaType: "image/png",
          byteSize: 8,
        },
      }),
      getProfileAvatarPreview: vi.fn().mockResolvedValue({ success: true, data: { url: "signed", expiresAt: "2026-10-11T00:05:00.000Z" } }),
      deleteProfileAvatar: vi.fn().mockResolvedValue({ success: true, data: undefined }),
      discardProfileAvatar: vi.fn().mockResolvedValue({ success: true, data: undefined }),
    };
    const adapter = createProfileAvatarAdapter({ updateProfile }, files);

    const result = await adapter.updateAvatar({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: pngBlob(),
      mutationId: "avatar-mutation-2",
    });

    expect(result).toMatchObject({
      success: false,
      error: { code: "AUTH_UPDATE_FAILED", authErrorCode: "AUTH_NETWORK_ERROR" },
    });
    expect(files.discardProfileAvatar).toHaveBeenCalledWith(createPlatformAvatarReference(FILE_ID));
  });

  it("reports old-avatar cleanup failure after clearing the canonical reference", async () => {
    const previousReference = createPlatformAvatarReference("00000000-0000-4000-8000-000000000008");
    const updateProfile = vi.fn(async (): Promise<AuthResult<PlatformUser>> => ({
      success: true,
      data: profileUser(null),
    }));
    const files = {
      uploadProfileAvatar: vi.fn(),
      getProfileAvatarPreview: vi.fn(),
      deleteProfileAvatar: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "FILE_DELETE_FAILED", message: "metadata update failed" },
      }),
      discardProfileAvatar: vi.fn(),
    };
    const adapter = createProfileAvatarAdapter({ updateProfile }, files);

    const result = await adapter.removeAvatar({
      mutationId: "avatar-mutation-3",
      previousAvatarReference: previousReference,
    });

    expect(updateProfile).toHaveBeenCalledWith({ avatarUrl: null, mutationId: "avatar-mutation-3" });
    expect(result).toMatchObject({
      success: true,
      data: {
        cleanup: {
          previousAvatar: {
            success: false,
            error: { code: "FILE_DELETE_FAILED", message: "metadata update failed" },
          },
        },
      },
    });
  });

  it("surfaces failed compensation when profile persistence fails", async () => {
    const updateProfile = vi.fn(async (): Promise<AuthResult<PlatformUser>> => ({
      success: false,
      error: { code: "AUTH_NETWORK_ERROR", message: "profile update unavailable" },
    }));
    const files = {
      uploadProfileAvatar: vi.fn().mockResolvedValue({
        success: true,
        data: {
          id: FILE_ID,
          reference: createPlatformAvatarReference(FILE_ID),
          fileName: "avatar.png",
          mediaType: "image/png",
          byteSize: 8,
        },
      }),
      getProfileAvatarPreview: vi.fn(),
      deleteProfileAvatar: vi.fn(),
      discardProfileAvatar: vi.fn().mockResolvedValue({
        success: false,
        error: { code: "FILE_CLEANUP_FAILED", message: "storage delete failed" },
      }),
    };
    const adapter = createProfileAvatarAdapter({ updateProfile }, files);

    expect(await adapter.updateAvatar({
      fileName: "avatar.png",
      mediaType: "image/png",
      content: pngBlob(),
      mutationId: "avatar-mutation-4",
    })).toMatchObject({
      success: false,
      error: {
        code: "AUTH_UPDATE_FAILED",
        authErrorCode: "AUTH_NETWORK_ERROR",
        cleanupError: { code: "FILE_CLEANUP_FAILED", message: "storage delete failed" },
      },
    });
  });
});
