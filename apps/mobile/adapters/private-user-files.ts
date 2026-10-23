import {
  createSupabasePrivateUserFilesAdapter,
  type PrivateUserFilesSupabaseClient,
} from "../../../packages/contracts/src/private-user-files-supabase";
import { mobileSupabaseClient } from "./supabase";

export const mobilePrivateUserFilesAdapter = createSupabasePrivateUserFilesAdapter(
  // Mobile installs a separate Supabase SDK copy; its runtime client shares this adapter's API.
  mobileSupabaseClient as unknown as PrivateUserFilesSupabaseClient,
);
