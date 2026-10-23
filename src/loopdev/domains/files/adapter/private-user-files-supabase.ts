import { createSupabasePrivateUserFilesAdapter } from "../../../../../packages/contracts/src/private-user-files-supabase";
import { defaultWebAuthAdapter } from "../../platform/adapter/auth-supabase";

export const supabasePrivateUserFilesAdapter = createSupabasePrivateUserFilesAdapter(
  defaultWebAuthAdapter.getClient(),
);
